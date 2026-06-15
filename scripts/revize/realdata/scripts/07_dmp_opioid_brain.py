#!/usr/bin/env python3
"""
Real EWAS for OPIOID (heroin) — GSE98203.
Tissue: postmortem orbitofrontal cortex, FACS-sorted NEURONAL nuclei (BRAIN, not blood).
Platform: Illumina 450K (GPL13534). Processed betas: data/GSE98203_beta.txt.gz.
Design: beta ~ heroin + age + sex   (HEROIN=37 vs CONTROL=29; SUICIDE cohort excluded).
Zero-hallucination: every number is computed here; data SHA-256 recorded.
"""
import os, sys, json, gzip, hashlib
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data", "GSE98203_beta.txt.gz")
PHENO = os.path.join(HERE, "out", "GSE98203_pheno.csv")
OUT_CSV = os.path.join(HERE, "out", "GSE98203_dmp.csv")
OUT_JSON = os.path.join(HERE, "out", "GSE98203_validation.json")

SMOKING_CPGS = {
    "cg05575921": "AHRR", "cg03636183": "F2RL3", "cg21566642": "2q37.1/ALPPL2",
    "cg05951221": "2q37.1", "cg19859270": "GPR15", "cg09935388": "GFI1",
    "cg06126421": "6p21.33", "cg25648203": "AHRR",
}


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    print("data sha256:", sha256(DATA))
    pheno = pd.read_csv(PHENO)
    pheno["of"] = pheno["of"].astype(str)
    pheno = pheno[pheno["cohort"].isin(["HEROIN", "CONTROL"])].copy()
    # clean sex / age
    pheno["sex"] = pheno["gender"].astype(str).str.upper().str.replace("?", "", regex=False).str[0]
    pheno = pheno[pheno["sex"].isin(["M", "F"])]
    pheno["age"] = pd.to_numeric(pheno["age"], errors="coerce")
    pheno = pheno.dropna(subset=["age"])
    print("pheno after clean:", pheno["cohort"].value_counts().to_dict(),
          "| n=", len(pheno))

    # read only beta columns (drop *_Detection_PVal)
    with gzip.open(DATA, "rt") as f:
        header = f.readline().rstrip("\n").split("\t")
    beta_cols = [c for c in header[1:] if not c.endswith("_Detection_PVal")]
    usecols = [header[0]] + beta_cols
    print("beta sample columns in file:", len(beta_cols))

    df = pd.read_csv(DATA, sep="\t", usecols=usecols, index_col=0)
    df.columns = [c.strip() for c in df.columns]

    # align: pheno 'of' must match beta columns (OF##)
    common = [c for c in df.columns if c in set(pheno["of"])]
    pheno = pheno[pheno["of"].isin(common)].set_index("of").loc[common]
    beta = df[common].astype(float)
    print("aligned samples:", beta.shape[1],
          "| groups:", pheno["cohort"].value_counts().to_dict())

    # drop probes with any NaN in this subset
    beta = beta.dropna(axis=0, how="any")
    probes = beta.index.to_numpy()
    Y = beta.to_numpy().T  # samples x probes
    series_sha = hashlib.sha256(np.ascontiguousarray(Y).tobytes()).hexdigest()
    print("beta matrix (samples x probes):", Y.shape, "| complete probes:", len(probes))

    g = (pheno["cohort"].to_numpy() == "HEROIN").astype(float)
    age = pheno["age"].to_numpy(dtype=float)
    sex = (pheno["sex"].to_numpy() == "M").astype(float)
    age = (age - age.mean()) / age.std()
    X = np.column_stack([np.ones(len(g)), g, age, sex])
    n, k = X.shape
    XtX_inv = np.linalg.inv(X.T @ X)
    B = XtX_inv @ X.T @ Y
    resid = Y - X @ B
    dof = n - k
    sigma2 = (resid ** 2).sum(axis=0) / dof
    se = np.sqrt(sigma2 * XtX_inv[1, 1])
    coef = B[1]
    with np.errstate(divide="ignore", invalid="ignore"):
        t = coef / se
        p = 2 * stats.t.sf(np.abs(t), dof)

    good = np.isfinite(p) & np.isfinite(coef)
    probes, coef, t, p = probes[good], coef[good], t[good], p[good]
    print(f"probes with finite stats: {len(p)} (dropped {int((~good).sum())})")

    order = np.argsort(p)
    m = len(p)
    q = p[order] * m / np.arange(1, m + 1)
    q = np.minimum.accumulate(q[::-1])[::-1]
    fdr = np.empty(m)
    fdr[order] = np.clip(q, 0, 1)

    res = pd.DataFrame({
        "cg": probes,
        "delta_beta_heroin_minus_control": coef,
        "t": t, "p": p, "fdr": fdr,
    }).sort_values("p").reset_index(drop=True)
    res["rank"] = np.arange(1, len(res) + 1)
    res.to_csv(OUT_CSV, index=False)

    n_sig = int((res["fdr"] < 0.05).sum())
    print(f"\nsignificant CpGs (FDR<0.05): {n_sig:,} / {len(res):,}")
    print("TOP 10:")
    print(res.head(10).to_string(index=False))

    print("\nSMOKING-CONFOUND CHECK (canonical smoking CpGs):")
    rankmap = {cg: (i + 1, float(res.loc[i, "p"])) for i, cg in enumerate(res["cg"])}
    smoke = {}
    for cg, gene in SMOKING_CPGS.items():
        if cg in rankmap:
            r, pv = rankmap[cg]
            smoke[cg] = {"gene": gene, "rank": r, "p": pv}
            print(f"  {cg} ({gene}): rank={r} p={pv}")

    val = {
        "accession": "GSE98203", "substance": "opioid/heroin",
        "tissue": "brain (orbitofrontal cortex neuronal nuclei, postmortem)",
        "platform": "450K (GPL13534)", "data_sha256": sha256(DATA),
        "beta_matrix_sha256": series_sha,
        "n_total_aligned": int(Y.shape[0]),
        "groups": pheno["cohort"].value_counts().to_dict(),
        "model": "beta ~ heroin + age(z) + sex",
        "n_probes_tested": int(len(res)),
        "n_sig_fdr05": n_sig,
        "top10": res.head(10).to_dict("records"),
        "smoking_confound": smoke,
        "note": "BRAIN tissue, postmortem; cannot be merged with blood cohorts.",
    }
    with open(OUT_JSON, "w") as f:
        json.dump(val, f, indent=2)
    print(f"\ndone -> {OUT_CSV}, {OUT_JSON}")


if __name__ == "__main__":
    main()
