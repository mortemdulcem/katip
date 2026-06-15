#!/usr/bin/env python3
"""
GSE164822 — Opioid use disorder, dorsolateral prefrontal cortex (dlPFC),
postmortem human brain, Illumina EPIC, M-values. KOVARYAT-AYARLI diferansiyel
metilasyon analizi (5mC).

Grup, series_matrix !Sample_title alaninda: "dlPFC tissue_<GROUP> [<sentrix>]".
Gruplar: Opioids (n=72), Normal Control (n=28), Pysch Control (n=53).
Birincil kontrast: Opioids vs Normal Control. Doku tek (dlPFC).

YONTEM (bu surum): prob basina KOVARYAT-AYARLI lineer model (OLS) + BH-FDR.
Model: M ~ grup + yas + cinsiyet + PMI + irk. Grup katsayisinin t-testi.
Bellek-guvenli chunk akisi (_stream_dmp.run_chunked_adjusted). Effect (delta) =
ayarlanmis grup katsayisi (M-degeri birimi).

Onceki surum basit Welch t idi (kovaryat ayarsiz). Kovaryatlar series_matrix'ten
cekilir: gender (M/F), age of death, postmortem interval (PMI), race (CAUC/AA).

HUCRE-KOMPOZISYONU: Referansli beyin-hucre dekonvolusyonu (Houseman/EpiDISH) saf
numpy/scipy hattinda paketlenmedigi icin hucre-orani AYRI olarak tahmin edilemedi.
Referanssiz vekil-degisken (SVA) denendi ancak null-kalibrasyonda anti-konservatif
oldugu icin (sahte anlamlilik) cikarimdan dislandi — bkz. _stream_dmp.py docstring.

ORTAM DEGISKENLERI:
  MATRIX_PATH  M_final matrisi (.gz veya .tsv)  [zorunlu]
  META_PATH    series_matrix (.gz veya .txt)    [zorunlu]
  OUT_PATH     cikti JSON yolu                  [varsayilan: out/GSE164822_opioid_acute_dmp.json]

DURUSTLUK/Sinirliliklar: postmortem beyin; tek doku (dlPFC); hucre-kompozisyonu
ayarlanmadi (yukari bkz). M-degeri = log2(M/U).
"""
import os, re, json
import numpy as np
import pandas as pd
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _stream_dmp import read_meta_fields, run_chunked_adjusted, top_hits, sha256  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
MATRIX = os.environ.get("MATRIX_PATH")
META = os.environ.get("META_PATH")
OUT = os.environ.get("OUT_PATH", os.path.join(HERE, "out", "GSE164822_opioid_acute_dmp.json"))
CASE_GROUP = "Opioids"
CTRL_GROUP = "Normal Control"
TITLE_RE = re.compile(r"tissue_(?P<grp>.+?)\s*\[(?P<sx>[0-9]+_R[0-9]{2}C[0-9]{2})\]")


def _zscore(x):
    x = np.asarray(x, dtype=np.float64)
    s = x.std()
    return (x - x.mean()) / s if s > 0 else x - x.mean()


def main():
    if not MATRIX or not META:
        raise SystemExit("MATRIX_PATH ve META_PATH ortam degiskenleri zorunlu")
    titles, chars = read_meta_fields(META)
    char_map = {label: vals for label, vals in chars}
    needed = ["gender", "age of death", "postmortem interval", "race", "group"]
    for k in needed:
        if k not in char_map:
            raise SystemExit(f"meta'da '{k}' karakteristigi yok: {list(char_map)}")

    # title -> sentrix; index i (titles) -> kovaryat degerleri ayni sirada
    sx2cov = {}
    for i, t in enumerate(titles):
        m = TITLE_RE.search(t)
        if not m:
            continue
        sx = m.group("sx")
        sx2cov[sx] = {
            "group": char_map["group"][i].strip(),
            "gender": char_map["gender"][i].strip(),
            "age": char_map["age of death"][i].strip(),
            "pmi": char_map["postmortem interval"][i].strip(),
            "race": char_map["race"][i].strip(),
        }
    if not sx2cov:
        raise SystemExit("title'dan sentrix->kovaryat cikarilamadi")

    comp = "gzip" if MATRIX.endswith(".gz") else "infer"
    hdr = pd.read_csv(MATRIX, sep="\t", index_col=0, nrows=0, compression=comp)
    cols = list(hdr.columns)
    n_unknown = sum(1 for c in cols if c not in sx2cov)
    if n_unknown:
        raise SystemExit(f"{n_unknown} matris sutunu meta ile eslesmedi (format drift) -> durduruldu")

    # birincil kontrast ornekleri (matris sutun sirasinda)
    sel = [(i, c) for i, c in enumerate(cols) if sx2cov[c]["group"] in (CASE_GROUP, CTRL_GROUP)]
    sample_idx = [i for i, _ in sel]
    sel_cov = [sx2cov[c] for _, c in sel]
    n_excl_psych = sum(1 for c in cols if sx2cov[c]["group"] == "Pysch Control")

    group = np.array([1.0 if cv["group"] == CASE_GROUP else 0.0 for cv in sel_cov])
    age = np.array([float(cv["age"]) for cv in sel_cov])
    pmi = np.array([float(cv["pmi"]) for cv in sel_cov])
    sex_m = np.array([1.0 if cv["gender"].upper().startswith("M") else 0.0 for cv in sel_cov])
    race_cauc = np.array([1.0 if cv["race"].upper().startswith("CAUC") else 0.0 for cv in sel_cov])

    from collections import Counter
    print("kontrast grup dagilimi:", dict(Counter(cv["group"] for cv in sel_cov)))
    print(f"n_case({CASE_GROUP})={int(group.sum())}, n_ctrl({CTRL_GROUP})={int((group==0).sum())}, "
          f"psych_excluded={n_excl_psych}")
    print(f"yas {age.min():.1f}-{age.max():.1f}, PMI {pmi.min():.1f}-{pmi.max():.1f}, "
          f"erkek={int(sex_m.sum())}, CAUC={int(race_cauc.sum())}")

    # X0: intercept | group | age_z | pmi_z | sex(M=1) | race(CAUC=1)
    cov_terms = ["intercept", "group(Opioids)", "age_z", "pmi_z", "sex(M=1)", "race(CAUC=1)"]
    Xcols = [np.ones(len(sel_cov)), group, _zscore(age), _zscore(pmi)]
    # sabit (tek-seviyeli) kovaryatlari dusur (sayisal kararlilik)
    if sex_m.std() > 0:
        Xcols.append(sex_m)
    else:
        cov_terms.remove("sex(M=1)")
    if race_cauc.std() > 0:
        Xcols.append(race_cauc)
    else:
        cov_terms.remove("race(CAUC=1)")
    X0 = np.column_stack(Xcols)
    group_col = 1

    res = run_chunked_adjusted(MATRIX, X0, group_col, sample_idx=np.array(sample_idx),
                               transform=None, n_sv=0)
    sig05 = int((res["q"] < 0.05).sum()); sig10 = int((res["q"] < 0.10).sum())
    minq = float(res["q"].min()) if res["n_tested"] else float("nan")
    print(f"test prob={res['n_tested']}/{res['n_total']} (NaN-dusurulen={res['n_dropped_nan']}), "
          f"df={res['df']}, FDR<0.05={sig05}, FDR<0.10={sig10}, min_q={minq:.6f}")

    out = {
        "dataset": "GSE164822",
        "title": "Opioid use disorder, dorsolateral prefrontal cortex (dlPFC), postmortem human brain",
        "substance": "opioid (opioid use disorder)",
        "tissue": "dorsolateral prefrontal cortex (dlPFC), postmortem",
        "assay": "Illumina EPIC, M-values",
        "contrast": f"{CASE_GROUP} vs {CTRL_GROUP}",
        "design": {CASE_GROUP: int(group.sum()), CTRL_GROUP: int((group == 0).sum()),
                   "Pysch Control (excluded from primary)": n_excl_psych},
        "method": ("per-probe COVARIATE-ADJUSTED linear model (OLS) + BH-FDR, "
                   "memory-safe chunked streaming"),
        "model": "M ~ " + " + ".join(t for t in cov_terms if t != "intercept"),
        "covariates_adjusted": [t for t in cov_terms if t != "intercept"],
        "df_residual": res["df"], "n_model_params": res["n_params"],
        "n_probes_total": res["n_total"], "n_probes_tested": res["n_tested"],
        "n_probes_dropped_nan": res["n_dropped_nan"],
        "n_FDR_lt_0.05": sig05, "n_FDR_lt_0.10": sig10, "min_q_BH": round(minq, 6),
        "top25_by_p": top_hits(res, 25),
        "conclusion_honest": ("NO probe survives FDR<0.05" if sig05 == 0 else f"{sig05} probes FDR<0.05"),
        "limitations": ("postmortem brain; single tissue (dlPFC); cell-type composition NOT adjusted "
                        "(reference-based brain deconvolution not available in numpy/scipy pipeline; "
                        "reference-free surrogate variables tested but rejected as anti-conservative); "
                        "M-value = log2(M/U)"),
        "input_files_sha256": {os.path.basename(MATRIX): os.environ.get("MATRIX_SHA256") or sha256(MATRIX),
                               os.path.basename(META): sha256(META)},
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print("Yazildi:", OUT)


if __name__ == "__main__":
    main()
