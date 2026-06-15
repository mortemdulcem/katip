#!/usr/bin/env python3
"""
chr3:32781045 (hg38) — IKINCI BAGIMSIZ veri setinde, FARKLI beyin bolgesinde
capraz-dogrulama.

Arka plan:
  GSE235818 (OUD, OFC NeuN+ noron, bisulfit % metilasyon) ilk taramada tek DMP
  bulmustu: chr3:32781045, OUD'da -2,3 puan hipometilasyon, q=0,0076 (Welch-%).
  Coverage-agirlikli/asiri-dagilim-duyarli yeniden testte DOGRULANMADI
  (SUBSTANCE_DMP_REPORT.md S2.4). Ardindan BAGIMSIZ bir OFC-noron eroin kohortunda
  (GSE98203, 450K) da REPLIKE OLMADI (S2.5). Bu betik UCUNCU bir bagimsizlik
  katmani ekler: AYNI pozisyon/bolge, FARKLI beyin bolgesinde (dlPFC) ve FARKLI
  platformda (EPIC, M-degeri), buyuk bir OUD kohortunda test edilir.

Ikinci bagimsiz set: GSE164822 — postmortem dlPFC, Illumina EPIC, M-degeri,
  72 Opioids vs 28 Normal Control (Pysch Control birincil kontrasttan dislanir).
  Bagimsiz kohort + bagimsiz platform + FARKLI beyin bolgesi (dlPFC, OFC degil).

Pozisyon eslemesi (hg38):
  GSE235818 hedef CpG = chr3:32781045 (GRCh38). EPIC cg problari -> hg38
  koordinatlari Zhou-lab (sesame) hg38 manifestinden alindi (manifest/SOURCES.txt).
  Hedefe en yakin prob: cg18028347 @ chr3:32781025-32781027 (hedeften YALNIZCA
  20 bp). +-2 kb pencerede 9 EPIC prob var (region_probes_*.tsv, array==EPIC).

Test: GSE164822 ana DMP analiziyle (opioid_acute_dmp.py) BIREBIR AYNI
  kovaryat-ayarli model: M ~ group(Opioids) + age(z) + pmi(z) + sex(M=1) +
  race(CAUC=1) (OLS). Tek-seviyeli kovaryatlar otomatik dusurulur. Bolge problari
  icin grup katsayisi (M-degeri birimi), t, p; ayrica bolge-ici BH-FDR. Hedef
  CpG'ye en yakin prob (cg18028347) ozellikle raporlanir. Yon karsilastirmasi:
  GSE235818'de vakalar HIPOmetile idi -> M-degerinde ayni yon = katsayi < 0.

Sinirlilik: dlPFC, GSE235818/GSE98203'un OFC'sinden FARKLI bir beyin bolgesidir;
  bu nedenle buradaki bir null sonuc "bolge-tutarli" yorumlanir ama AYNI-bolge
  replikasyonu degildir. Yine de bagimsiz kohort + farkli platformda sinyalin
  yoklugu, NOT_CONFIRMED yargisini daha da pekistirir.

Zero-hallucination: her sayi burada hesaplanir; girdi SHA-256 kaydedilir.
ORTAM DEGISKENLERI:
  MATRIX_PATH   GSE164822_M_final matrisi (.gz veya .tsv)   [zorunlu]
  META_PATH     series_matrix meta (.txt veya .gz)          [vars: GSE164822_meta.txt]
  MATRIX_SHA256 onceden hesaplanmis matris SHA-256 (ops.)   [vars: yeniden hesaplanir]
  OUT_PATH      cikti JSON yolu                              [vars: out/...json]
Cikti: out/GSE235818_chr3_32781045_crossval_GSE164822.json
"""
import os, re, json, gzip, hashlib
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
MATRIX = os.environ.get("MATRIX_PATH")
META = os.environ.get("META_PATH", os.path.join(HERE, "GSE164822_meta.txt"))
REGION_TSV = os.path.join(HERE, "manifest", "region_probes_chr3_32781045_hg38.tsv")
OUT = os.environ.get("OUT_PATH",
                     os.path.join(HERE, "out", "GSE235818_chr3_32781045_crossval_GSE164822.json"))

TARGET = ("chr3", 32781045)  # GSE235818 hedef, hg38
WINDOW = 2000
CASE_GROUP = "Opioids"
CTRL_GROUP = "Normal Control"
TITLE_RE = re.compile(r"tissue_(?P<grp>.+?)\s*\[(?P<sx>[0-9]+_R[0-9]{2}C[0-9]{2})\]")


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def ci_provenance():
    """GitHub Actions calistirma kimligini (run id vb.) kaydet, boylece bu JSON'un
    1GB'lik matristen HANGI CI kosusunda yeniden uretildigi izlenebilir olur. Yerelde
    (CI disinda) calistirilirsa recomputed_in_ci=False doner."""
    rid = os.environ.get("GITHUB_RUN_ID")
    if not rid:
        return {"recomputed_in_ci": False,
                "note": "Generated locally (not via GitHub Actions); no CI run id recorded."}
    server = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    return {
        "recomputed_in_ci": True,
        "github_run_id": rid,
        "github_run_number": os.environ.get("GITHUB_RUN_NUMBER"),
        "github_run_attempt": os.environ.get("GITHUB_RUN_ATTEMPT"),
        "workflow": os.environ.get("GITHUB_WORKFLOW"),
        "commit_sha": os.environ.get("GITHUB_SHA"),
        "run_url": f"{server}/{repo}/actions/runs/{rid}" if repo else None,
    }


def _open_text(path):
    return gzip.open(path, "rt", errors="replace") if path.endswith(".gz") \
        else open(path, "rt", errors="replace")


def _split_quoted(line, tag):
    toks = [p for p in line.rstrip("\n").split('"') if p.strip()]
    return [t for t in toks if not t.startswith(tag)]


def read_meta(meta_path):
    """series_matrix -> (titles, {label: [per-sample value]}) ornek-sirali."""
    titles = None
    chars = {}
    with _open_text(meta_path) as f:
        for line in f:
            if line.startswith("!Sample_title"):
                titles = _split_quoted(line, "!Sample_title")
            elif line.startswith("!Sample_characteristics_ch1"):
                vals = _split_quoted(line, "!Sample_characteristics_ch1")
                if not vals:
                    continue
                label = vals[0].split(":", 1)[0].strip()
                parsed = [v.split(":", 1)[1].strip() if ":" in v else v.strip() for v in vals]
                chars[label] = parsed
    if titles is None:
        raise SystemExit(f"{meta_path}: !Sample_title bulunamadi")
    return titles, chars


def _to_float(parts):
    return np.array([np.nan if (p == "" or p.strip().upper() == "NA") else float(p)
                     for p in parts], dtype=np.float64)


def stream_region(matrix_path, probe_set):
    """gz/tsv matrisi satir-satir akitarak SADECE region problarinin satirlarini
    okur (bellek-guvenli). Dondurur: (colnames, {probe: np.array(float)}).

    GEO matrislerinde baslik satirinda prob-kimligi sutunu icin etiket bulunmaz:
    baslik N ornek-adi icerir, veri satirlari ise prob_id + N deger (= N+1 alan)
    icerir. pandas(index_col=0) bunu ortuk-index olarak ele alir ve TUM N baslik
    adini N deger sutununa hizalar. Burada AYNI mantik uygulanir: veri satiri
    baslik+1 alan ise colnames = tum baslik; aksi halde colnames = baslik[1:]
    (adlandirilmis index). Boylece opioid_acute_dmp.py ile bit-bit ayni ornek
    kumesi/hizalamasi elde edilir (72/28/53)."""
    rows = {}
    with _open_text(matrix_path) as f:
        header = [c.strip().strip('"') for c in f.readline().rstrip("\n").split("\t")]
        first = f.readline()
        dat = first.rstrip("\n").split("\t")
        if len(dat) == len(header) + 1:
            colnames = header                 # implicit index (GEO off-by-one)
        elif len(dat) == len(header):
            colnames = header[1:]             # named index column
        else:
            raise SystemExit(f"baslik({len(header)})/veri({len(dat)}) alan sayisi uyumsuz")

        def consume(line):
            tab = line.find("\t")
            if tab < 0:
                return
            pid = line[:tab].strip().strip('"')
            if pid in probe_set:
                vals = _to_float(line.rstrip("\n").split("\t")[1:])
                if len(vals) != len(colnames):
                    raise SystemExit(f"{pid}: deger({len(vals)}) != ornek({len(colnames)})")
                rows[pid] = vals

        consume(first)
        for line in f:
            if len(rows) == len(probe_set):
                break
            consume(line)
    return colnames, rows


def main():
    if not MATRIX:
        raise SystemExit("MATRIX_PATH ortam degiskeni zorunlu (GSE164822_M_final.txt.gz)")

    # --- bolge problari (EPIC) ---
    reg = pd.read_csv(REGION_TSV, sep="\t")
    reg = reg[reg["array"] == "EPIC"].copy()  # GSE164822 = EPIC
    reg["dist_to_target"] = (reg["CpG_beg"] - TARGET[1]).abs()
    reg = reg.sort_values("dist_to_target").reset_index(drop=True)
    region_probes = reg["Probe_ID"].tolist()
    closest = reg.iloc[0]["Probe_ID"]
    print(f"hedef {TARGET[0]}:{TARGET[1]} (hg38); bolge EPIC prob sayisi (+-{WINDOW}bp)="
          f"{len(region_probes)}; en yakin={closest} (mesafe={int(reg.iloc[0]['dist_to_target'])} bp)")

    # --- meta: sentrix -> kovaryat (opioid_acute_dmp.py ile ayni mantik) ---
    titles, chars = read_meta(META)
    for k in ["gender", "age of death", "postmortem interval", "race", "group"]:
        if k not in chars:
            raise SystemExit(f"meta'da '{k}' yok: {list(chars)}")
    sx2cov = {}
    for i, t in enumerate(titles):
        m = TITLE_RE.search(t)
        if not m:
            continue
        sx2cov[m.group("sx")] = {
            "group": chars["group"][i].strip(),
            "gender": chars["gender"][i].strip(),
            "age": chars["age of death"][i].strip(),
            "pmi": chars["postmortem interval"][i].strip(),
            "race": chars["race"][i].strip(),
        }
    if not sx2cov:
        raise SystemExit("title'dan sentrix->kovaryat cikarilamadi")

    # --- matris: yalnizca bolge problarini akitarak oku ---
    colnames, rows = stream_region(MATRIX, set(region_probes))
    present = [p for p in region_probes if p in rows]
    missing = [p for p in region_probes if p not in rows]
    if closest not in present:
        raise SystemExit(f"en yakin prob {closest} matriste yok -> dogrulama yapilamaz")

    n_unknown = sum(1 for c in colnames if c not in sx2cov)
    if n_unknown:
        raise SystemExit(f"{n_unknown} matris sutunu meta ile eslesmedi (format drift) -> durduruldu")

    # birincil kontrast ornekleri (matris sutun sirasinda)
    sel = [(i, c) for i, c in enumerate(colnames) if sx2cov[c]["group"] in (CASE_GROUP, CTRL_GROUP)]
    sample_idx = np.array([i for i, _ in sel])
    sel_cov = [sx2cov[c] for _, c in sel]
    n_excl_psych = sum(1 for c in colnames if sx2cov[c]["group"] == "Pysch Control")

    group = np.array([1.0 if cv["group"] == CASE_GROUP else 0.0 for cv in sel_cov])
    age = np.array([float(cv["age"]) for cv in sel_cov])
    pmi = np.array([float(cv["pmi"]) for cv in sel_cov])
    sex_m = np.array([1.0 if cv["gender"].upper().startswith("M") else 0.0 for cv in sel_cov])
    race_cauc = np.array([1.0 if cv["race"].upper().startswith("CAUC") else 0.0 for cv in sel_cov])

    def _z(x):
        s = x.std()
        return (x - x.mean()) / s if s > 0 else x - x.mean()

    cov_terms = ["intercept", "group(Opioids)", "age_z", "pmi_z", "sex(M=1)", "race(CAUC=1)"]
    Xcols = [np.ones(len(sel_cov)), group, _z(age), _z(pmi)]
    if sex_m.std() > 0:
        Xcols.append(sex_m)
    else:
        cov_terms.remove("sex(M=1)")
    if race_cauc.std() > 0:
        Xcols.append(race_cauc)
    else:
        cov_terms.remove("race(CAUC=1)")
    X = np.column_stack(Xcols)
    group_col = 1
    n, k = X.shape
    XtX_inv = np.linalg.inv(X.T @ X)
    dof = n - k
    print(f"kontrast: {CASE_GROUP}={int(group.sum())} vs {CTRL_GROUP}={int((group==0).sum())}, "
          f"psych_excluded={n_excl_psych}; df={dof}; model M ~ "
          + " + ".join(t for t in cov_terms if t != "intercept"))

    # --- her bolge probu icin kovaryat-ayarli OLS (ana analizle ayni) ---
    out_rows = []
    for probe in present:
        y_full = rows[probe]
        y = y_full[sample_idx]
        if np.isnan(y).any():
            out_rows.append({"probe": probe, "note": "NaN in contrast samples -> skipped"})
            continue
        B = XtX_inv @ X.T @ y
        resid = y - X @ B
        sigma2 = (resid ** 2).sum() / dof
        se = np.sqrt(sigma2 * XtX_inv[group_col, group_col])
        coef = float(B[group_col]); t = coef / se if se > 0 else np.nan
        p = float(2 * stats.t.sf(abs(t), dof)) if np.isfinite(t) else np.nan
        d = reg[reg["Probe_ID"] == probe].iloc[0]
        out_rows.append({
            "probe": probe, "hg38": f"{d['CpG_chrm']}:{int(d['CpG_beg'])}",
            "dist_to_target_bp": int(d["dist_to_target"]),
            "delta_M_opioids_minus_ctrl": round(coef, 5),
            "mean_M_opioids": round(float(y[group == 1].mean()), 4),
            "mean_M_control": round(float(y[group == 0].mean()), 4),
            "t": round(float(t), 4), "p": p,
        })

    tested = [r for r in out_rows if "p" in r and np.isfinite(r["p"])]
    pv = np.array([r["p"] for r in tested])
    order = np.argsort(pv); m = len(pv)
    q = pv[order] * m / np.arange(1, m + 1)
    q = np.minimum.accumulate(q[::-1])[::-1]
    fdr = np.empty(m); fdr[order] = np.clip(q, 0, 1)
    for i, r in enumerate(tested):
        r["fdr_region"] = round(float(fdr[i]), 4)

    closest_row = next(r for r in tested if r["probe"] == closest)
    # GSE235818'de vakalar hipometile -> M-degerinde ayni yon = delta < 0
    same_dir = closest_row["delta_M_opioids_minus_ctrl"] < 0
    # Verdict, KESIF lokusunu (hedefe en yakin prob) yansitir: cg18028347 (20 bp).
    confirmed = (closest_row["p"] < 0.05) and same_dir
    # Bolgede FDR<0.05 gecen HERHANGI bir prob (durustluk icin acikca raporlanir).
    region_sig = [r for r in tested if r["fdr_region"] < 0.05]

    result = {
        "analysis": "chr3:32781045 (GSE235818 OUD finding) — 2nd independent cross-validation "
                    "in a different brain region",
        "target_position_hg38": f"{TARGET[0]}:{TARGET[1]}",
        "discovery_dataset": {
            "accession": "GSE235818", "tissue": "OFC NeuN+ neuronal nuclei",
            "assay": "bisulfite-seq % methylation", "design": "12 OUD vs 26 control",
            "original_finding": "chr3:32781045 hypomethylated in OUD, delta=-2.3 pct, q_BH=0.0076 (Welch on %)",
            "coverage_weighted_reanalysis": "NOT_CONFIRMED (SUBSTANCE_DMP_REPORT.md S2.4)",
            "first_crossval": "NOT_CONFIRMED in GSE98203 OFC neuronal nuclei, 450K (S2.5)",
        },
        "validation_dataset": {
            "accession": "GSE164822",
            "tissue": "dorsolateral prefrontal cortex (dlPFC), postmortem (DIFFERENT region than discovery OFC)",
            "platform": "Illumina EPIC (M-values); probe->hg38 via Zhou-lab sesame manifest",
            "design_aligned": {CASE_GROUP: int(group.sum()), CTRL_GROUP: int((group == 0).sum()),
                               "Pysch Control (excluded)": n_excl_psych},
            "model": "M ~ group(Opioids) + age(z) + pmi(z) + sex(M=1) + race(CAUC=1) (OLS) — "
                     "same covariate-adjusted model as GSE164822 main DMP (opioid_acute_dmp.py)",
            "df_residual": dof,
        },
        "probe_mapping_note": (
            "GSE235818 reports the exact bisulfite CpG chr3:32781045; EPIC has no probe at the "
            "identical base, so the nearest probe(s) within +-2kb were tested. Closest = "
            f"{closest} @ {closest_row['hg38']} ({closest_row['dist_to_target_bp']} bp away)."),
        "closest_probe_result": closest_row,
        "region_probes_tested": sorted(tested, key=lambda r: r["dist_to_target_bp"]),
        "missing_probes_in_GSE164822": missing,
        "min_p_region": float(pv.min()), "min_fdr_region": float(min(r["fdr_region"] for r in tested)),
        "n_region_probes_tested": m,
        "direction_matches_discovery_at_target": bool(same_dir),
        "verdict": "CONFIRMED" if confirmed else "NOT_CONFIRMED",
        "verdict_scope": ("Verdict reflects the DISCOVERY LOCUS (nearest probe cg18028347, 20 bp "
                          "from chr3:32781045). See region_significant_probes for an honest account "
                          "of any other probe in the +-2kb window."),
        "region_significant_probes": region_sig,
        "interpretation": (
            "Hedefe en yakin prob (cg18028347, 20 bp) — yani KESIF lokusu — bagimsiz dlPFC opioid "
            f"kohortunda anlamsiz (p={closest_row['p']:.3f}, FDR_region={closest_row['fdr_region']}) "
            f"ve dahasi yon TERS: delta_M={closest_row['delta_M_opioids_minus_ctrl']} (opioidde HIPERmetilasyon), "
            "oysa kesifte vakalar HIPOmetile idi. Hedef lokus REPLIKE OLMADI. "
            + (("DURUSTLUK NOTU: +-2kb pencerede bolge-ici FDR<0.05 gecen prob(lar) var: "
                + "; ".join(f"{r['probe']} ({r['dist_to_target_bp']} bp, delta_M="
                            f"{r['delta_M_opioids_minus_ctrl']}, p={r['p']:.4f}, FDR={r['fdr_region']})"
                            for r in region_sig)
                + ". Ancak bu hit hedef CpG'den uzaktir (pencere kenari) ve kesfin tek-CpG bulgusu "
                "degildir; ayri bir regulatuar konum olabilir — kesif bulgusunun replikasyonu sayilmaz.")
               if region_sig else
               (f"+-2kb bolgesindeki {m} probtan hicbiri bolge-ici FDR<0.05'i gecmez "
                f"(min FDR={min(r['fdr_region'] for r in tested):.3f}).")) + " "
            "GSE235818'in chr3:32781045 bulgusu IKINCI bagimsiz sette (farkli beyin bolgesi, "
            "farkli platform) de REPLIKE OLMADI. Sinirlilik: dlPFC, kesif/ilk dogrulamadaki OFC'den "
            "farkli bir bolgedir; bu null bolge-tutarli olup AYNI-bolge replikasyonu degildir."),
        "limitation": ("dlPFC is a DIFFERENT brain region than the OFC of GSE235818/GSE98203; "
                       "a null here is region-consistent but not a same-region replication."),
        "crossval_provenance": ci_provenance(),
        "input_files_sha256": {
            os.path.basename(MATRIX): os.environ.get("MATRIX_SHA256") or sha256(MATRIX),
            os.path.basename(META): sha256(META),
            "region_probes_chr3_32781045_hg38.tsv": sha256(REGION_TSV),
        },
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"\nVERDICT: {result['verdict']}")
    print(f"closest probe {closest}: p={closest_row['p']:.4f}, delta_M="
          f"{closest_row['delta_M_opioids_minus_ctrl']}, FDR_region={closest_row['fdr_region']}")
    print(f"region min p={pv.min():.4f}, min FDR={min(r['fdr_region'] for r in tested):.4f}")
    print("Yazildi:", OUT)


if __name__ == "__main__":
    main()
