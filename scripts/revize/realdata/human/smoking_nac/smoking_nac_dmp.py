#!/usr/bin/env python3
"""
GSE147040 — Cigarette smoking, nucleus accumbens (NAc), postmortem human brain,
Illumina EPIC, raw intensities. KOVARYAT-AYARLI diferansiyel metilasyon analizi.

Matris sutunlari ornek basina 3'lu: "<sentrix> Unmethylated Signal",
"<sentrix> Methylated Signal", "<sentrix> Detection Pval".
beta = M / (M + U + 100); detection p > DET_MAX olan hucre NaN (maskelenir).

Grup, series_matrix !Sample_title alaninda: "<sentrix>_<Smoker|Nonsmoker>".
Smoker n=53, Nonsmoker n=168. Kontrast: Smoker vs Nonsmoker.

YONTEM (bu surum): prob basina KOVARYAT-AYARLI lineer model (OLS) + BH-FDR.
Model: beta ~ grup + yas + cinsiyet + ancestry. Grup katsayisinin t-testi.
Bellek-guvenli chunk akisi. Effect (delta) = ayarlanmis grup katsayisi (beta birimi).
Yalniz tam-verili problar (hicbir ornekte detection-maskesi yok) test edilir;
NaN iceren problar dusurulur ve raporlanir.

Kovaryatlar series_matrix'ten: age at death, sex (M/F), ancestry (CAUC/AA). PMI yok.

HUCRE-KOMPOZISYONU: Referansli beyin-hucre dekonvolusyonu (Houseman/EpiDISH) saf
numpy/scipy hattinda paketlenmedigi icin hucre-orani AYRI olarak tahmin edilemedi.
Referanssiz vekil (SVA) denendi ancak null-kalibrasyonda anti-konservatif oldugu
icin cikarimdan dislandi — bkz. _stream_dmp.py docstring.

ORTAM DEGISKENLERI: MATRIX_PATH, META_PATH, OUT_PATH (varsayilan out/...).

DURUSTLUK/Sinirliliklar: postmortem beyin; cok dengesiz gruplar (53 vs 168); tek
doku (NAc); hucre-kompozisyonu ayarlanmadi; eski-icici (ex-smoker) durumu modellenmedi.
"""
import os, re, json
import numpy as np
import pandas as pd
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _stream_dmp import read_meta_fields, run_parallel_adjusted, top_hits, sha256, bh_fdr  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
MATRIX = os.environ.get("MATRIX_PATH")
META = os.environ.get("META_PATH")
OUT = os.environ.get("OUT_PATH", os.path.join(HERE, "out", "GSE147040_smoking_nac_dmp.json"))
DET_MAX = 0.01
# Tek-is-parcacigi gz cozme ebeveynde calisir; 8 isci onu CPU'da ac birakir. Bir
# cekirdegi ebeveyne ayirmak icin yerelde NPROC=7 (Actions'ta varsayilan 8).
NPROC = int(os.environ.get("NPROC", "8"))
TITLE_RE = re.compile(r"^(?P<sx>[0-9]+_R[0-9]{2}C[0-9]{2})_(?P<grp>.+)$")


def _zscore(x):
    x = np.asarray(x, dtype=np.float64)
    s = x.std()
    return (x - x.mean()) / s if s > 0 else x - x.mean()


def main():
    if not MATRIX or not META:
        raise SystemExit("MATRIX_PATH ve META_PATH ortam degiskenleri zorunlu")
    titles, chars = read_meta_fields(META)
    char_map = {label: vals for label, vals in chars}
    # alan adlari uzun parantezli: anahtar kelimeyle eslestir
    def find(key):
        for label in char_map:
            if key in label.lower():
                return char_map[label]
        raise SystemExit(f"meta'da '{key}' karakteristigi yok: {list(char_map)}")
    grp_vals = find("smoking status")
    age_vals = find("age at death")
    sex_vals = find("sex")
    anc_vals = find("ancestry")

    sx2cov = {}
    for i, t in enumerate(titles):
        m = TITLE_RE.match(t.strip())
        if not m:
            continue
        sx = m.group("sx")
        sx2cov[sx] = {
            "group": grp_vals[i].strip(),
            "age": age_vals[i].strip(),
            "sex": sex_vals[i].strip(),
            "anc": anc_vals[i].strip(),
        }
    if not sx2cov:
        raise SystemExit("title'dan sentrix->kovaryat cikarilamadi")

    comp = "gzip" if MATRIX.endswith(".gz") else "infer"
    hdr = pd.read_csv(MATRIX, sep="\t", index_col=0, nrows=0, compression=comp)
    cols = list(hdr.columns)
    if len(cols) % 3 != 0:
        raise SystemExit(f"sutun sayisi 3'un kati degil: {len(cols)}")
    n_samp = len(cols) // 3
    sentrix_order = []
    for k in range(n_samp):
        sentrix_order.append(cols[3 * k].split(" ")[0])
        assert "Unmethylated" in cols[3 * k], cols[3 * k]
        assert "Methylated" in cols[3 * k + 1], cols[3 * k + 1]
        assert "Detection" in cols[3 * k + 2], cols[3 * k + 2]

    n_unknown = sum(1 for sx in sentrix_order if sx not in sx2cov)
    if n_unknown:
        raise SystemExit(f"{n_unknown} ornek title ile eslesmedi (format drift) -> durduruldu")

    sel = [(j, sx) for j, sx in enumerate(sentrix_order)
           if sx2cov[sx]["group"] in ("Smoker", "Nonsmoker")]
    sample_idx = np.array([j for j, _ in sel])
    sel_cov = [sx2cov[sx] for _, sx in sel]
    n_other = n_samp - len(sel)
    if n_other:
        raise SystemExit(f"{n_other} ornek Smoker/Nonsmoker disinda -> durduruldu")

    group = np.array([1.0 if cv["group"] == "Smoker" else 0.0 for cv in sel_cov])
    age = np.array([float(cv["age"]) for cv in sel_cov])
    sex_m = np.array([1.0 if cv["sex"].upper().startswith("M") else 0.0 for cv in sel_cov])
    anc_cauc = np.array([1.0 if cv["anc"].upper().startswith("CAUC") else 0.0 for cv in sel_cov])

    from collections import Counter
    print("kontrast grup dagilimi:", dict(Counter(cv["group"] for cv in sel_cov)))
    print(f"Smoker={int(group.sum())}, Nonsmoker={int((group==0).sum())}, "
          f"yas {age.min():.1f}-{age.max():.1f}, erkek={int(sex_m.sum())}, CAUC={int(anc_cauc.sum())}")

    cov_terms = ["intercept", "group(Smoker)", "age_z", "sex(M=1)", "ancestry(CAUC=1)"]
    Xcols = [np.ones(len(sel_cov)), group, _zscore(age)]
    if sex_m.std() > 0:
        Xcols.append(sex_m)
    else:
        cov_terms.remove("sex(M=1)")
    if anc_cauc.std() > 0:
        Xcols.append(anc_cauc)
    else:
        cov_terms.remove("ancestry(CAUC=1)")
    X0 = np.column_stack(Xcols)
    group_col = 1

    def transform(vals):
        U = vals[:, 0::3]; M = vals[:, 1::3]; P = vals[:, 2::3]
        beta = M / (M + U + 100.0)
        beta = np.where((~np.isfinite(P)) | (P > DET_MAX), np.nan, beta)
        return beta

    # 1 GB gz'nin TEK-IS-PARCACIGI cozme tabani ~74 s; tek tool-cagri (120 s) duvarini
    # tam calisma asar. Calisma blok-araligi parcalarina bolunur (gz seek edilemez, bu
    # yuzden gec parcalar tam cozme oder; bu nedenle son parca AZ blok isler):
    #   PHASE=compute START_BLOCK=.. END_BLOCK=.. PART_PATH=..  -> ham parca npz yazar
    #   PHASE=final  PARTS=p1,p2,..                              -> birlestir+BH-FDR+JSON
    #   PHASE bos                                                -> tek seferde tam (Actions)
    # Deterministik: ayni block_bytes (varsayilan 32MB) tum cagrilarda; araliklar
    # ayrik ve tum bloklari kapsar -> birlesim = tam matris, dup yok.
    PHASE = os.environ.get("PHASE", "").strip()

    if PHASE == "compute":
        sb = int(os.environ.get("START_BLOCK", "0"))
        eb = os.environ.get("END_BLOCK", "").strip()
        eb = int(eb) if eb else None
        part = os.environ["PART_PATH"]
        r = run_parallel_adjusted(MATRIX, X0, group_col, sample_idx=sample_idx,
                                  transform=transform, nproc=NPROC, start_block=sb, end_block=eb, raw=True)
        np.savez(part, probe=r["probe"], p=r["p"], delta=r["delta"],
                 n_total=r["n_total"], n_dropped_nan=r["n_dropped_nan"],
                 df=r["df"], n_params=r["n_params"])
        print(f"PART yazildi: {part} bloklar[{sb},{eb}) probe={len(r['probe'])} "
              f"n_total={r['n_total']} n_drop={r['n_dropped_nan']}")
        return

    if PHASE == "final":
        parts = [p for p in os.environ["PARTS"].split(",") if p]
        pr_l = []; p_l = []; d_l = []; n_total = 0; n_drop = 0; dfv = None; npar = None
        for pp in parts:
            ck = np.load(pp, allow_pickle=True)
            pr_l.append(ck["probe"]); p_l.append(ck["p"]); d_l.append(ck["delta"])
            n_total += int(ck["n_total"]); n_drop += int(ck["n_dropped_nan"])
            dfv = int(ck["df"]); npar = int(ck["n_params"])
        probe = np.concatenate(pr_l); p_all = np.concatenate(p_l); d_all = np.concatenate(d_l)
        if len(np.unique(probe)) != len(probe):
            raise SystemExit("parca araliklari cakisiyor (dup probe) -> araliklari kontrol et")
        good = np.isfinite(p_all)
        p_g = p_all[good]; d_g = d_all[good]; id_g = probe[good]
        q_g = bh_fdr(p_g) if len(p_g) else np.array([])
        res = {"n_total": n_total, "n_tested": int(good.sum()), "n_dropped_nan": n_drop,
               "probe": id_g, "p": p_g, "delta": d_g, "q": q_g,
               "df": dfv, "n_params": npar}
    else:
        res = run_parallel_adjusted(MATRIX, X0, group_col, sample_idx=sample_idx,
                                    transform=transform, nproc=NPROC)

    sig05 = int((res["q"] < 0.05).sum()); sig10 = int((res["q"] < 0.10).sum())
    minq = float(res["q"].min()) if res["n_tested"] else float("nan")
    print(f"test prob={res['n_tested']}/{res['n_total']} (NaN-dusurulen={res['n_dropped_nan']}), "
          f"df={res['df']}, FDR<0.05={sig05}, FDR<0.10={sig10}, min_q={minq:.6f}")

    out = {
        "dataset": "GSE147040",
        "title": "Cigarette smoking, nucleus accumbens (NAc), postmortem human brain",
        "substance": "nicotine / cigarette smoking",
        "tissue": "nucleus accumbens (NAc), postmortem",
        "assay": "Illumina EPIC, raw intensities -> beta = M/(M+U+100), detection p<=%.2g" % DET_MAX,
        "contrast": "Smoker vs Nonsmoker",
        "design": {"Smoker": int(group.sum()), "Nonsmoker": int((group == 0).sum())},
        "method": ("per-probe COVARIATE-ADJUSTED linear model (OLS, NaN-aware via complete-probe) "
                   "+ BH-FDR, memory-safe chunked streaming"),
        "model": "beta ~ " + " + ".join(t for t in cov_terms if t != "intercept"),
        "covariates_adjusted": [t for t in cov_terms if t != "intercept"],
        "df_residual": res["df"], "n_model_params": res["n_params"],
        "n_probes_total": res["n_total"], "n_probes_tested": res["n_tested"],
        "n_probes_dropped_nan": res["n_dropped_nan"],
        "n_FDR_lt_0.05": sig05, "n_FDR_lt_0.10": sig10, "min_q_BH": round(minq, 6),
        "top25_by_p": top_hits(res, 25),
        "conclusion_honest": ("NO probe survives FDR<0.05" if sig05 == 0 else f"{sig05} probes FDR<0.05"),
        "limitations": ("postmortem brain; highly imbalanced groups (53 vs 168); single tissue (NAc); "
                        "cell-type composition NOT adjusted (reference-based deconvolution unavailable; "
                        "reference-free surrogate variables tested but rejected as anti-conservative); "
                        "ex-smoker status not modeled; PMI not provided in series_matrix"),
        "input_files_sha256": {os.path.basename(MATRIX): os.environ.get("MATRIX_SHA256") or sha256(MATRIX),
                               os.path.basename(META): sha256(META)},
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print("Yazildi:", OUT)


if __name__ == "__main__":
    main()
