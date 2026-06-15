#!/usr/bin/env python3
"""Real EWAS for INJECTION DRUG USE (IDU) — GSE100264.
Tissue: whole blood. Cohort context: HIV+ women (WIHS); HCV and smoking common ->
these are real, strong confounders and are modeled explicitly and flagged.

Betas live in the GEO supplementary processed matrix (GSE100264_MatrixProcessed.txt.gz),
whose columns are 'Sample 1'..'Sample N' in the SAME order as the series-matrix GSMs.
We map column position -> GSM -> phenotype.

Design: beta ~ idu + age(z) + sex + smoking + hiv + hcv_dx, BH-FDR.
Smoking-confound sanity check on canonical CpGs (AHRR/F2RL3...).

Zero-hallucination: every number computed here; data SHA-256 recorded; confounds reported.
"""
import os, re, json, gzip, hashlib, urllib.request
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data"); OUT = os.path.join(HERE, "out")
os.makedirs(DATA, exist_ok=True); os.makedirs(OUT, exist_ok=True)

SERIES_URL = "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE100nnn/GSE100264/matrix/GSE100264_series_matrix.txt.gz"
MAT_URL = "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE100nnn/GSE100264/suppl/GSE100264_MatrixProcessed.txt.gz"
SMOKING_CPGS = {
    "cg05575921": "AHRR", "cg03636183": "F2RL3", "cg21566642": "2q37.1/ALPPL2",
    "cg05951221": "2q37.1", "cg19859270": "GPR15", "cg09935388": "GFI1",
    "cg06126421": "6p21.33", "cg25648203": "AHRR",
}


def dl(url, path):
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        print("downloading", url, flush=True)
        urllib.request.urlretrieve(url, path)
    return path


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(buf), b""):
            h.update(c)
    return h.hexdigest()


def bh(p):
    order = np.argsort(p); m = len(p)
    q = p[order] * m / np.arange(1, m + 1)
    q = np.minimum.accumulate(q[::-1])[::-1]
    fdr = np.empty(m); fdr[order] = np.clip(q, 0, 1)
    return fdr


def parse_pheno(series_path):
    geo = None; chars = []
    with gzip.open(series_path, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_geo_accession"):
                geo = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1"):
                chars.append([x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]])
            elif line.startswith('"ID_REF') or "!series_matrix_table_begin" in line:
                break
    n = len(geo)

    def getchar(key):
        for vals in chars:
            kk = None; out = []
            for v in vals:
                if ":" in v:
                    k, val = v.split(":", 1); kk = k.strip().lower(); out.append(val.strip())
                else:
                    out.append(v.strip())
            if kk == key:
                return out
        return [None] * n

    def num01(lst):
        return np.array([1.0 if (x is not None and str(x).strip() in ("1", "1.0", "yes", "Yes"))
                         else (0.0 if (x is not None and str(x).strip() in ("0", "0.0", "no", "No")) else np.nan)
                         for x in lst])

    age = pd.to_numeric(pd.Series(getchar("age")), errors="coerce").to_numpy(dtype=float)
    sexraw = getchar("sex")
    sex = np.array([1.0 if (s and s.lower().startswith("m")) else (0.0 if s else np.nan) for s in sexraw])
    idu = num01(getchar("idu")); smk = num01(getchar("smoking"))
    hiv = num01(getchar("hiv")); hcv = num01(getchar("hcv_dx"))
    return geo, {"age": age, "sex": sex, "idu": idu, "smoking": smk, "hiv": hiv, "hcv": hcv}


def main():
    sp = dl(SERIES_URL, os.path.join(DATA, "GSE100264_series_matrix.txt.gz"))
    mp = dl(MAT_URL, os.path.join(DATA, "GSE100264_MatrixProcessed.txt.gz"))
    print("series sha256:", sha256(sp))
    geo, ph = parse_pheno(sp)
    n_samples = len(geo)
    print("series GSMs:", n_samples, "| IDU+:", int(np.nansum(ph["idu"] == 1)),
          "IDU-:", int(np.nansum(ph["idu"] == 0)))

    # processed matrix: line 1 is a comment ('#Quantile normalized Average Beta'),
    # line 2 is the header 'ID_REF\tSample 1\tDetection Pval\tSample 2\t...'.
    df = pd.read_csv(mp, sep="\t", skiprows=1, index_col=0, low_memory=False,
                     usecols=lambda c: (str(c).strip() == "ID_REF")
                                       or bool(re.match(r"^Sample\s+\d+$", str(c).strip())))
    df.columns = [str(c).strip() for c in df.columns]
    df = df[df.index.astype(str).str.startswith("cg")]
    # order columns by their integer index so position i == GSM i
    scols = sorted([c for c in df.columns if re.match(r"^Sample\s+\d+$", c)],
                   key=lambda c: int(c.split()[1]))
    print("matrix sample cols:", len(scols), "(expected", n_samples, ")")
    if len(scols) != n_samples:
        raise SystemExit(f"sample count mismatch matrix={len(scols)} series={n_samples}")
    df = df[scols]

    idu, age, sex = ph["idu"], ph["age"], ph["sex"]
    smk, hiv, hcv = ph["smoking"], ph["hiv"], ph["hcv"]
    keep = (np.isfinite(idu) & np.isfinite(age) & np.isfinite(sex)
            & np.isfinite(smk) & np.isfinite(hiv) & np.isfinite(hcv))
    df = df.loc[:, keep]
    idu, age, sex, smk, hiv, hcv = idu[keep], age[keep], sex[keep], smk[keep], hiv[keep], hcv[keep]
    Y = df.to_numpy(dtype=float).T  # samples x probes
    probes = df.index.astype(str).to_numpy()
    good = ~np.isnan(Y).any(axis=0)
    Y = Y[:, good]; probes = probes[good]
    print(f"usable samples: {len(idu)} (IDU+ {int((idu==1).sum())} / IDU- {int((idu==0).sum())}); "
          f"complete probes: {len(probes)}", flush=True)

    az = (age - age.mean()) / age.std()
    # Build a FULL-RANK design, always keeping intercept + idu (predictor of interest).
    # Any covariate that is constant OR collinear with already-included terms is dropped.
    # In this cohort: sex & hiv are constant (all female / all HIV+), and hcv_dx is
    # PERFECTLY collinear with idu (every IDU+ is HCV+, every IDU- is HCV-) -> dropped.
    candidates = [("intercept", np.ones(len(idu))), ("idu", idu),
                  ("agez", az), ("sex", sex), ("smoking", smk), ("hiv", hiv), ("hcv", hcv)]
    Xcols = []; names = []; dropped = []
    for nm, v in candidates:
        trial = np.column_stack(Xcols + [v]) if Xcols else v.reshape(-1, 1)
        if np.linalg.matrix_rank(trial) == trial.shape[1]:
            Xcols.append(v); names.append(nm)
        else:
            dropped.append(nm)
    X = np.column_stack(Xcols)
    idx_idu = names.index("idu")
    print("design terms:", names, "| dropped (constant/collinear):", dropped)
    n, k = X.shape
    XtXi = np.linalg.inv(X.T @ X)
    B = XtXi @ X.T @ Y
    resid = Y - X @ B
    dof = n - k
    sig2 = (resid ** 2).sum(axis=0) / dof
    se = np.sqrt(sig2 * XtXi[idx_idu, idx_idu])
    coef = B[idx_idu]
    with np.errstate(divide="ignore", invalid="ignore"):
        t = coef / se
        p = 2 * stats.t.sf(np.abs(t), dof)
    fin = np.isfinite(p) & np.isfinite(coef)
    probes, coef, t, p = probes[fin], coef[fin], t[fin], p[fin]
    fdr = bh(p)
    res = pd.DataFrame({"cg": probes, "delta_beta_idu_minus_non": coef,
                        "t": t, "p": p, "fdr": fdr}).sort_values("p").reset_index(drop=True)
    res["rank"] = np.arange(1, len(res) + 1)
    res.to_csv(os.path.join(OUT, "GSE100264_dmp.csv"), index=False)
    nsig = int((res["fdr"] < 0.05).sum())
    print(f"\nsignificant CpGs (FDR<0.05): {nsig:,} / {len(res):,}", flush=True)
    print(res.head(10).to_string(index=False), flush=True)
    rankmap = {cg: (i + 1, float(res.loc[i, "p"])) for i, cg in enumerate(res["cg"])}
    smoke = {cg: {"gene": gn, "rank": rankmap[cg][0], "p": rankmap[cg][1]}
             for cg, gn in SMOKING_CPGS.items() if cg in rankmap}
    out = {
        "accession": "GSE100264", "substance": "injection drug use (IDU)",
        "tissue": "whole blood", "cohort": "HIV+ women (WIHS); HCV+smoking common confounders",
        "platform": "450K", "series_sha256": sha256(sp), "matrix_sha256": sha256(mp),
        "model": "beta ~ idu + age(z) + smoking (+ constant/collinear covars auto-dropped)",
        "model_terms": names, "dropped_terms": dropped,
        "n_total": int(n), "n_idu": int((idu == 1).sum()), "n_non_idu": int((idu == 0).sum()),
        "n_probes_tested": int(len(res)), "n_sig_fdr05": nsig,
        "top10": res.head(10).to_dict("records"), "smoking_confound": smoke,
        "note": "HIV+ all-female cohort (sex & hiv constant -> dropped). CRITICAL CONFOUND: "
                "hcv_dx is PERFECTLY collinear with idu in this cohort (every IDU+ is HCV+, "
                "every IDU- is HCV-), so the IDU signal CANNOT be separated from HCV infection; "
                "smoking is modeled. Interpret as an IDU/HCV-combined association, not causation.",
    }
    with open(os.path.join(OUT, "GSE100264_validation.json"), "w") as f:
        json.dump(out, f, indent=2)
    print("\ndone -> out/GSE100264_validation.json", flush=True)


if __name__ == "__main__":
    main()
