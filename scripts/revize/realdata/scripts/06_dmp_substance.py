#!/usr/bin/env python3
"""
06_dmp_substance.py — REAL differential-methylation analysis for small substance cohorts.

Generic case/control EWAS on Illumina 450K (GPL13534) series matrices that ship beta values:
  GSE77056   cocaine & crack dependents vs healthy controls  (whole blood)
  GSE154971  methamphetamine abusers/dependents vs controls  (peripheral blood lymphocytes)

Design: per-CpG linear model  beta ~ group + (age) + (sex), covariates included only when
they actually vary in the cohort. Vectorised OLS across all probes, two-sided t-test on the
group coefficient, Benjamini-Hochberg FDR. Same machinery as 02_dmp_smoking.py.

Honesty check (Zero-Hallucination): we ALSO report where the canonical SMOKING CpGs
(cg05575921/AHRR, cg03636183/F2RL3, ...) rank, because drug users tend to smoke — if those
dominate, the signal is smoking-confounded and we say so instead of claiming a clean
substance-specific effect.

Usage:  python 06_dmp_substance.py GSE77056
Outputs: out/{acc}_dmp.csv , out/{acc}_validation.json
"""
import gzip, json, os, hashlib, time, sys
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
OUT = os.path.abspath(os.path.join(HERE, "..", "out"))
os.makedirs(OUT, exist_ok=True)
SEED = 42
np.random.seed(SEED)

CONFIG = {
    "GSE77056": {
        "substance": "cocaine/crack dependence",
        "tissue": "whole blood",
        "group_key": "sample group",
        "case_kw": ["drug user", "dependent", "user", "cocaine", "crack"],
    },
    "GSE154971": {
        "substance": "methamphetamine dependence/abuse",
        "tissue": "peripheral blood lymphocytes",
        "group_key": "disease state",
        "case_kw": ["methamphetamine", "abuser", "dependence", "dependent", "ma "],
    },
}

# canonical smoking CpGs — used here purely as a confound probe
SMOKING = {
    "cg05575921": "AHRR", "cg03636183": "F2RL3", "cg21566642": "2q37.1/ALPPL2",
    "cg05951221": "2q37.1", "cg19859270": "GPR15", "cg09935388": "GFI1",
    "cg06126421": "6p21.33", "cg25648203": "AHRR",
}


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(buf), b""):
            h.update(c)
    return h.hexdigest()


def parse_series(path):
    gsms = None
    chars = []
    with gzip.open(path, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_geo_accession"):
                gsms = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1"):
                vals = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
                chars.append(vals)
            elif line.startswith("!series_matrix_table_begin"):
                break
    pheno = pd.DataFrame(index=gsms)
    for vals in chars:
        key = None
        parsed = []
        for v in vals:
            if ":" in v:
                k, val = v.split(":", 1)
                key = k.strip()
                parsed.append(val.strip())
            else:
                parsed.append(v.strip())
        if key is None:
            continue
        col = key.lower()
        base = col
        while col in pheno.columns:
            col = base + "_x"
            base = col
        pheno[col] = parsed
    betas = pd.read_csv(path, sep="\t", comment="!", index_col=0,
                        na_values=["", "null", "NA"], engine="c", compression="gzip")
    betas.index.name = "cg"
    betas = betas[~betas.index.astype(str).str.startswith("!")]
    betas = betas.apply(pd.to_numeric, errors="coerce").astype(np.float32)
    return pheno, betas


def main():
    acc = sys.argv[1]
    cfg = CONFIG[acc]
    series = os.path.join(DATA, f"{acc}_series_matrix.txt.gz")
    t0 = time.time()
    shp = sha256(series)
    print(f"{acc} series sha256:", shp)
    pheno, betas = parse_series(series)
    print("pheno cols:", list(pheno.columns))
    print("beta shape:", betas.shape)

    gkey = next((c for c in pheno.columns if cfg["group_key"] in c), None)
    assert gkey, f"group key '{cfg['group_key']}' not found in {list(pheno.columns)}"

    def label(v):
        vl = str(v).lower()
        if "control" in vl:
            return 0.0
        if any(k in vl for k in cfg["case_kw"]):
            return 1.0
        return np.nan

    grp = pheno[gkey].map(label)

    # optional covariates
    age_col = next((c for c in pheno.columns if c.startswith("age")), None)
    sex_col = next((c for c in pheno.columns if c.startswith("gender") or c.startswith("sex")), None)
    age = pd.to_numeric(pheno[age_col], errors="coerce") if age_col else None
    sex = (pheno[sex_col].str.lower().map(
        lambda s: 1.0 if ("male" in str(s) and "female" not in str(s)) else (0.0 if "female" in str(s) else np.nan))
        if sex_col else None)

    keep = grp.notna()
    if age is not None:
        keep &= age.notna()
    if sex is not None:
        keep &= sex.notna()
    samples = [g for g in pheno.index[keep]]
    g_v = grp.loc[samples].values.astype(float)

    cols = [np.ones(len(samples)), g_v]
    names = ["intercept", "group"]
    if age is not None and age.loc[samples].nunique() > 1:
        cols.append(age.loc[samples].values.astype(float)); names.append("age")
    if sex is not None and sex.loc[samples].nunique() > 1:
        cols.append(sex.loc[samples].values.astype(float)); names.append("sex")
    X = np.column_stack(cols)
    print(f"samples={len(samples)} case={int(g_v.sum())} control={int((g_v==0).sum())} covars={names[2:]}")

    Y = betas[samples].values
    ok = ~np.isnan(Y).any(axis=1)
    probes = betas.index[ok].to_numpy()
    Y = Y[ok].astype(np.float64)
    print("probes analysed (complete):", Y.shape[0])

    n, k = X.shape
    XtX_inv = np.linalg.inv(X.T @ X)
    B = XtX_inv @ (X.T @ Y.T)
    resid = Y.T - X @ B
    dof = n - k
    sigma2 = (resid ** 2).sum(axis=0) / dof
    se = np.sqrt(sigma2 * XtX_inv[1, 1])
    coef = B[1]
    with np.errstate(divide="ignore", invalid="ignore"):
        t = coef / se
        p = 2 * stats.t.sf(np.abs(t), dof)

    # drop constant probes (se=0 -> NaN) so they don't poison BH-FDR
    good = np.isfinite(p) & np.isfinite(coef)
    probes = probes[good]; coef = coef[good]; t = t[good]; p = p[good]
    print(f"probes with finite stats: {len(p)} (dropped {int((~good).sum())} constant/NaN)")

    order = np.argsort(p)
    m = len(p)
    q = p[order] * m / np.arange(1, m + 1)
    q = np.minimum.accumulate(q[::-1])[::-1]
    fdr = np.empty(m); fdr[order] = np.clip(q, 0, 1)

    res = pd.DataFrame({"cg": probes, "delta_beta_case_minus_control": coef,
                        "t": t, "p": p, "fdr": fdr}).sort_values("p").reset_index(drop=True)
    res["rank"] = np.arange(1, len(res) + 1)
    res.to_csv(os.path.join(OUT, f"{acc}_dmp.csv"), index=False)

    rankmap = dict(zip(res["cg"], res["rank"]))
    pmap = dict(zip(res["cg"], res["p"]))
    smoke_conf = {cg: {"gene": g, "rank": int(rankmap[cg]) if cg in rankmap else None,
                       "p": float(pmap[cg]) if cg in pmap else None}
                  for cg, g in SMOKING.items()}

    sig = int((res["fdr"] < 0.05).sum())
    meta = {
        "dataset": acc, "substance": cfg["substance"], "tissue": cfg["tissue"],
        "platform": "GPL13534 (Illumina HumanMethylation450)",
        "design": f"case vs control; covariates {names[2:]}; vectorised OLS; BH-FDR",
        "n_samples": n, "n_case": int(g_v.sum()), "n_control": int((g_v == 0).sum()),
        "n_probes_tested": int(Y.shape[0]), "n_sig_fdr05": sig, "seed": SEED,
        "series_sha256": shp,
        "top15": res.head(15)[["cg", "delta_beta_case_minus_control", "p", "fdr"]].to_dict("records"),
        "smoking_confound_check": smoke_conf,
        "runtime_sec": round(time.time() - t0, 1),
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with open(os.path.join(OUT, f"{acc}_validation.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\nsignificant CpGs (FDR<0.05): {sig:,} / {Y.shape[0]:,}")
    print("TOP 10:")
    print(res.head(10).to_string(index=False))
    print("\nSMOKING-CONFOUND CHECK (ranks of canonical smoking CpGs):")
    for cg, v in smoke_conf.items():
        print(f"  {cg} ({v['gene']}): rank={v['rank']} p={v['p']}")
    print(f"\ndone in {time.time()-t0:.0f}s -> out/{acc}_dmp.csv, out/{acc}_validation.json")


if __name__ == "__main__":
    main()
