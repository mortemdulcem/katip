#!/usr/bin/env python3
"""
Real EWAS for CANNABIS — GSE255929 (PMID 40205553, BMC Pulm Med 2025; CanCOLD cohort).
Tissue: peripheral blood buffy coat. Platform: Illumina EPIC/850K (GPL21145).
Betas live INSIDE the series matrix (quoted "cg..."), 93 samples.
Deposited 2-group variable is mislabeled under "age" as S1 (n=59) vs S2 (n=34).
Per the linked paper the contrast is cannabis smokers vs non-smokers; polarity (which
code is cannabis) is verified separately and recorded in the validation JSON.
Design: beta ~ group(S2_vs_S1) + age + sex. Zero-hallucination: all numbers computed here.
"""
import os, gzip, json, hashlib
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data", "GSE255929_series_matrix.txt.gz")
OUT_CSV = os.path.join(HERE, "out", "GSE255929_dmp.csv")
OUT_JSON = os.path.join(HERE, "out", "GSE255929_validation.json")

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
    gsm = titles = sex = ages = group = None
    char_lines = []
    table_start = None
    with gzip.open(DATA, "rt") as f:
        for i, line in enumerate(f):
            if line.startswith("!series_matrix_table_begin"):
                table_start = i
                break
            parts = [p.strip().strip('"') for p in line.rstrip("\n").split("\t")]
            key, vals = parts[0], parts[1:]
            if key == "!Sample_geo_accession":
                gsm = vals
            elif key == "!Sample_title":
                titles = vals
            elif key == "!Sample_characteristics_ch1":
                char_lines.append(vals)

    for vals in char_lines:
        cleaned = [v.split(":", 1)[-1].strip() for v in vals]
        head = vals[0].lower()
        up = {c.upper() for c in cleaned}
        if head.startswith("sex"):
            sex = cleaned
        elif up <= {"S1", "S2"}:
            group = cleaned
        elif head.startswith("age"):
            ages = cleaned

    pheno = pd.DataFrame({"gsm": gsm, "title": titles, "sex": sex,
                          "age": ages, "group": group})
    pheno["age"] = pd.to_numeric(pheno["age"], errors="coerce")
    print("group sizes:", pheno["group"].value_counts().to_dict())
    print("sex:", pheno["sex"].value_counts().to_dict(),
          "| age range:", (pheno["age"].min(), pheno["age"].max()))

    df = pd.read_csv(DATA, sep="\t", skiprows=table_start + 1,
                     quotechar='"', index_col=0, low_memory=False)
    df = df[~df.index.astype(str).str.startswith("!")]
    df.index.name = "cg"
    # align columns to pheno gsm
    common = [g for g in pheno["gsm"] if g in df.columns]
    pheno = pheno[pheno["gsm"].isin(common)].set_index("gsm").loc[common]
    beta = df[common].apply(pd.to_numeric, errors="coerce")
    print("beta matrix (probes x samples):", beta.shape)

    beta = beta.dropna(axis=0, how="any")
    probes = beta.index.to_numpy()
    Y = beta.to_numpy().T  # samples x probes
    print("complete probes:", len(probes), "| samples:", Y.shape[0])

    g = (pheno["group"].to_numpy() == "S2").astype(float)   # S2 vs S1
    age = pheno["age"].to_numpy(dtype=float)
    sex = (pheno["sex"].astype(str).str.upper().str[0].to_numpy() == "M").astype(float)
    age = (age - np.nanmean(age)) / np.nanstd(age)
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

    res = pd.DataFrame({"cg": probes, "delta_beta_S2_minus_S1": coef,
                        "t": t, "p": p, "fdr": fdr}).sort_values("p").reset_index(drop=True)
    res["rank"] = np.arange(1, len(res) + 1)
    res.to_csv(OUT_CSV, index=False)

    n_sig = int((res["fdr"] < 0.05).sum())
    print(f"\nsignificant CpGs (FDR<0.05): {n_sig:,} / {len(res):,}")
    print("TOP 10:")
    print(res.head(10).to_string(index=False))

    print("\nSMOKING-CONFOUND CHECK (cannabis vs tobacco overlap):")
    rankmap = {cg: (i + 1, float(res.loc[i, "p"])) for i, cg in enumerate(res["cg"])}
    smoke = {}
    for cg, gene in SMOKING_CPGS.items():
        if cg in rankmap:
            r, pv = rankmap[cg]
            smoke[cg] = {"gene": gene, "rank": r, "p": pv}
            print(f"  {cg} ({gene}): rank={r} p={pv}")

    val = {
        "accession": "GSE255929", "substance": "cannabis",
        "pubmed_id": "40205553",
        "tissue": "peripheral blood buffy coat", "platform": "EPIC/850K (GPL21145)",
        "data_sha256": sha256(DATA),
        "n_samples": int(Y.shape[0]),
        "group_sizes": pheno["group"].value_counts().to_dict(),
        "model": "beta ~ group(S2_vs_S1) + age(z) + sex",
        "polarity_note": "S1/S2 are the deposited 2-level variable (mislabeled under 'age'); "
                         "which code = cannabis is verified against PMID 40205553.",
        "n_probes_tested": int(len(res)),
        "n_sig_fdr05": n_sig,
        "top10": res.head(10).to_dict("records"),
        "smoking_confound": smoke,
    }
    with open(OUT_JSON, "w") as f:
        json.dump(val, f, indent=2)
    print(f"\ndone -> {OUT_CSV}, {OUT_JSON}")


if __name__ == "__main__":
    main()
