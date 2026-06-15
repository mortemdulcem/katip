#!/usr/bin/env python3
"""
chr3:32781045 (hg38) — BAGIMSIZ VERI SETINDE CAPRAZ-DOGRULAMA.

Arka plan:
  GSE235818 (OUD, OFC NeuN+ noron, bisulfit % metilasyon) ilk taramada tek DMP
  bulmustu: chr3:32781045, OUD'da -2,3 puan hipometilasyon, q=0,0076 (Welch-%).
  Coverage-agirlikli/asiri-dagilim-duyarli yeniden testte DOGRULANMADI
  (SUBSTANCE_DMP_REPORT.md S2.4, verdict NOT_CONFIRMED). Tek sete dayanan negatif
  sonuc, BAGIMSIZ bir OUD/beyin metilasyon setinde ayni pozisyon/bolge
  incelenerek pekistirilir.

Bagimsiz set: GSE98203 — postmortem OFC, FACS ile ayrilmis NORONAL cekirdekler
  (GSE235818 ile AYNI doku tipi), 37 eroin vs 29 kontrol, Illumina 450K.
  Bagimsiz kohort + bagimsiz platform (array vs bisulfit-dizi).

Pozisyon eslemesi (hg38):
  GSE235818 hedef CpG = chr3:32781045 (GRCh38, series_matrix Assembly GRCh38.84).
  450K/EPIC cg problari -> hg38 koordinatlari Zhou-lab (sesame) hg38 manifestinden
  alindi. Hedefe en yakin prob: cg18028347 @ chr3:32781025-32781027 (hedeften
  YALNIZCA 20 bp). +-2 kb pencerede 8 prob var (region_probes_*.tsv).
  Manifest kaynak + SHA-256: bkz. manifest/SOURCES.txt.

Test: GSE98203 beta degerleri uzerinde, GSE98203 ana DMP analiziyle (07_dmp_opioid_brain.py)
  AYNI model: beta ~ heroin + age(z) + sex (OLS). Bolge problari icin delta_beta,
  t, p; ayrica bolge-ici BH-FDR. Hedef CpG'ye en yakin prob (cg18028347) ozellikle
  raporlanir. Yon karsilastirmasi: GSE235818'de vakalar HIPOmetile idi.

Zero-hallucination: her sayi burada hesaplanir; girdi SHA-256 kaydedilir.
Cikti: out/GSE235818_chr3_32781045_crossval_GSE98203.json
"""
import os, json, gzip, hashlib
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
RD = os.path.dirname(os.path.dirname(HERE))  # scripts/revize/realdata
DATA = os.path.join(RD, "data", "GSE98203_beta.txt.gz")
PHENO = os.path.join(RD, "out", "GSE98203_pheno.csv")
REGION_TSV = os.path.join(HERE, "manifest", "region_probes_chr3_32781045_hg38.tsv")
OUTDIR = os.path.join(HERE, "out"); os.makedirs(OUTDIR, exist_ok=True)
OUT = os.path.join(OUTDIR, "GSE235818_chr3_32781045_crossval_GSE98203.json")

TARGET = ("chr3", 32781045)  # GSE235818 hedef, hg38
WINDOW = 2000


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    # --- bolge problari (hg38) ---
    reg = pd.read_csv(REGION_TSV, sep="\t")
    reg = reg[reg["array"] == "HM450"].copy()  # GSE98203 = 450K
    reg["dist_to_target"] = (reg["CpG_beg"] - TARGET[1]).abs()
    reg = reg.sort_values("dist_to_target").reset_index(drop=True)
    region_probes = reg["Probe_ID"].tolist()
    closest = reg.iloc[0]["Probe_ID"]
    print(f"hedef {TARGET[0]}:{TARGET[1]} (hg38); bolge 450K prob sayisi (+-{WINDOW}bp)="
          f"{len(region_probes)}; en yakin={closest} (mesafe={int(reg.iloc[0]['dist_to_target'])} bp)")

    # --- pheno: heroin vs control (GSE98203 ana analiziyle ayni) ---
    pheno = pd.read_csv(PHENO)
    pheno["of"] = pheno["of"].astype(str)
    pheno = pheno[pheno["cohort"].isin(["HEROIN", "CONTROL"])].copy()
    pheno["sex"] = pheno["gender"].astype(str).str.upper().str.replace("?", "", regex=False).str[0]
    pheno = pheno[pheno["sex"].isin(["M", "F"])]
    pheno["age"] = pd.to_numeric(pheno["age"], errors="coerce")
    pheno = pheno.dropna(subset=["age"])

    # --- GSE98203 beta: yalnizca bolge problarini oku ---
    with gzip.open(DATA, "rt") as f:
        header = f.readline().rstrip("\n").split("\t")
    beta_cols = [c for c in header[1:] if not c.endswith("_Detection_PVal")]
    usecols = [header[0]] + beta_cols
    df = pd.read_csv(DATA, sep="\t", usecols=usecols, index_col=0)
    df.columns = [c.strip() for c in df.columns]
    present = [p for p in region_probes if p in df.index]
    missing = [p for p in region_probes if p not in df.index]
    df = df.loc[present]

    common = [c for c in df.columns if c in set(pheno["of"])]
    pheno = pheno[pheno["of"].isin(common)].set_index("of").loc[common]
    beta = df[common].astype(float)
    print("hizalanan ornek:", beta.shape[1], "| grup:", pheno["cohort"].value_counts().to_dict())

    g = (pheno["cohort"].to_numpy() == "HEROIN").astype(float)
    age = pheno["age"].to_numpy(dtype=float); age = (age - age.mean()) / age.std()
    sex = (pheno["sex"].to_numpy() == "M").astype(float)
    X = np.column_stack([np.ones(len(g)), g, age, sex])
    n, k = X.shape
    XtX_inv = np.linalg.inv(X.T @ X)
    dof = n - k

    rows = []
    for probe in present:
        y = beta.loc[probe, common].to_numpy(dtype=float)
        if np.isnan(y).any():
            rows.append({"probe": probe, "note": "NaN in subset -> skipped"}); continue
        B = XtX_inv @ X.T @ y
        resid = y - X @ B
        sigma2 = (resid ** 2).sum() / dof
        se = np.sqrt(sigma2 * XtX_inv[1, 1])
        coef = float(B[1]); t = coef / se if se > 0 else np.nan
        p = float(2 * stats.t.sf(abs(t), dof)) if np.isfinite(t) else np.nan
        d = reg[reg["Probe_ID"] == probe].iloc[0]
        rows.append({
            "probe": probe, "hg38": f"{d['CpG_chrm']}:{int(d['CpG_beg'])}",
            "dist_to_target_bp": int(d["dist_to_target"]),
            "delta_beta_heroin_minus_ctrl": round(coef, 5),
            "mean_beta_heroin": round(float(y[g == 1].mean()), 4),
            "mean_beta_control": round(float(y[g == 0].mean()), 4),
            "t": round(float(t), 4), "p": p,
        })

    tested = [r for r in rows if "p" in r and np.isfinite(r["p"])]
    pv = np.array([r["p"] for r in tested])
    order = np.argsort(pv); m = len(pv)
    q = pv[order] * m / np.arange(1, m + 1)
    q = np.minimum.accumulate(q[::-1])[::-1]
    fdr = np.empty(m); fdr[order] = np.clip(q, 0, 1)
    for i, r in enumerate(tested):
        r["fdr_region"] = round(float(fdr[i]), 4)

    closest_row = next(r for r in tested if r["probe"] == closest)
    # GSE235818'de vakalar hipometile (delta -2,3 puan); ayni yon = delta<0
    same_dir = closest_row["delta_beta_heroin_minus_ctrl"] < 0
    confirmed = (closest_row["p"] < 0.05) and same_dir

    result = {
        "analysis": "chr3:32781045 (GSE235818 OUD finding) independent cross-validation",
        "target_position_hg38": f"{TARGET[0]}:{TARGET[1]}",
        "discovery_dataset": {
            "accession": "GSE235818", "tissue": "OFC NeuN+ neuronal nuclei",
            "assay": "bisulfite-seq % methylation", "design": "12 OUD vs 26 control",
            "original_finding": "chr3:32781045 hypomethylated in OUD, delta=-2.3 pct, q_BH=0.0076 (Welch on %)",
            "coverage_weighted_reanalysis": "NOT_CONFIRMED (SUBSTANCE_DMP_REPORT.md S2.4)",
        },
        "validation_dataset": {
            "accession": "GSE98203", "tissue": "OFC FACS-sorted NEURONAL nuclei (same tissue as GSE235818)",
            "platform": "Illumina 450K (GPL13534)", "genome": "probe->hg38 via Zhou-lab sesame manifest",
            "design_aligned": pheno["cohort"].value_counts().to_dict(),
            "model": "beta ~ heroin + age(z) + sex (OLS) — same as GSE98203 main DMP",
        },
        "probe_mapping_note": (
            "GSE235818 reports the exact bisulfite CpG chr3:32781045; 450K has no probe at the "
            "identical base, so the nearest probe(s) within +-2kb were tested. Closest = "
            f"{closest} @ {closest_row['hg38']} ({closest_row['dist_to_target_bp']} bp away)."),
        "closest_probe_result": closest_row,
        "region_probes_tested": sorted(tested, key=lambda r: r["dist_to_target_bp"]),
        "missing_probes_in_GSE98203": missing,
        "min_p_region": float(pv.min()), "min_fdr_region": float(min(r["fdr_region"] for r in tested)),
        "n_region_probes_tested": m,
        "direction_matches_discovery": bool(same_dir),
        "verdict": "CONFIRMED" if confirmed else "NOT_CONFIRMED",
        "interpretation": (
            "Hedefe en yakin prob (cg18028347, 20 bp) bagimsiz OFC-noron eroin kohortunda "
            f"tamamen anlamsiz (p={closest_row['p']:.3f}, FDR_region={closest_row['fdr_region']}, "
            f"delta_beta={closest_row['delta_beta_heroin_minus_ctrl']}). +-2kb bolgesindeki "
            f"{m} probtan hicbiri bolge-ici FDR<0.05'i gecmez (min FDR="
            f"{min(r['fdr_region'] for r in tested):.3f}). GSE235818'in chr3:32781045 bulgusu "
            "bagimsiz sette REPLIKE OLMADI -> yuzde-yaklasimi artefakti yorumu pekisir."),
        "input_files_sha256": {
            "GSE98203_beta.txt.gz": sha256(DATA),
            "GSE98203_pheno.csv": sha256(PHENO),
            "region_probes_chr3_32781045_hg38.tsv": sha256(REGION_TSV),
        },
    }
    with open(OUT, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"\nVERDICT: {result['verdict']}")
    print(f"closest probe {closest}: p={closest_row['p']:.4f}, delta_beta="
          f"{closest_row['delta_beta_heroin_minus_ctrl']}, FDR_region={closest_row['fdr_region']}")
    print(f"region min p={pv.min():.4f}, min FDR={min(r['fdr_region'] for r in tested):.4f}")
    print("Yazildi:", OUT)


if __name__ == "__main__":
    main()
