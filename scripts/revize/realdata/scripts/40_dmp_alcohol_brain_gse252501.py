#!/usr/bin/env python3
"""Real EWAS for ALCOHOL (Alcohol Use Disorder) — GSE252501.
Tissue: POSTMORTEM BRAIN, two regions: Nucleus Accumbens (NAc) + dorsolateral
prefrontal cortex (DLPFC). Platform: Illumina EPIC. Betas are in GEO supplementary
processed matrices (one per region). Matrix columns are lab IDs (e.g. D12590) which
equal the series-matrix !Sample_description; we map them to phenotype via the series.

Design (per region): beta ~ AUD(case=1) + agedeath(z) + sex + smoker, BH-FDR.
Covariate 'smoker' = "current smoker at death" (Case/Control) -> real smoking adjustment.
Smoking-confound sanity check on canonical CpGs (AHRR/F2RL3...).

Zero-hallucination: every number computed here; data SHA-256 recorded.
"""
import os, json, gzip, hashlib, urllib.request
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data"); OUT = os.path.join(HERE, "out")
os.makedirs(DATA, exist_ok=True); os.makedirs(OUT, exist_ok=True)

SERIES_URL = "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE252nnn/GSE252501/matrix/GSE252501_series_matrix.txt.gz"
MAT = {
    "NAc":   "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE252nnn/GSE252501/suppl/GSE252501_proccessed_matrix_NAc.txt.gz",
    "DLPFC": "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE252nnn/GSE252501/suppl/GSE252501_proccessed_matrix_DLPFC.txt.gz",
}
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
    """Return dict: lab_id (D#####) -> {gsm, region, aud, sex, age, smoker}."""
    geo = title = desc = None
    chars = []
    with gzip.open(series_path, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_geo_accession"):
                geo = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_title"):
                title = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_description"):
                d = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
                if desc is None:
                    desc = d  # first description line carries the D##### lab id
            elif line.startswith("!Sample_characteristics_ch1"):
                chars.append([x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]])
            elif line.startswith('"ID_REF') or "!series_matrix_table_begin" in line:
                break
    n = len(geo)
    assert desc is not None and len(desc) == n, "Sample_description (D-ids) missing/misaligned"

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

    aud = getchar("dsm-5 aud status"); sex = getchar("sex"); age = getchar("agedeath")
    smk = getchar("current smoker at death")
    ph = {}
    for i in range(n):
        did = desc[i]
        reg = "NAc" if (title and "accumbens" in title[i].lower()) else "DLPFC"
        a = age[i]
        ph[did] = {
            "gsm": geo[i], "region": reg,
            "aud": 1.0 if (aud[i] and aud[i].lower() == "case")
                   else (0.0 if (aud[i] and aud[i].lower() == "control") else np.nan),
            "sex": 1.0 if (sex[i] and sex[i].lower().startswith("m"))
                   else (0.0 if sex[i] else np.nan),
            "age": float(a) if (a and a.replace(".", "", 1).isdigit()) else np.nan,
            "smoker": 1.0 if (smk[i] and smk[i].lower() == "case")
                      else (0.0 if (smk[i] and smk[i].lower() == "control") else np.nan),
        }
    return ph


def run_region(region, ph, matpath):
    print(f"\n### region {region}: parsing {os.path.basename(matpath)}", flush=True)
    df = pd.read_csv(matpath, sep="\t", index_col=0, low_memory=False,
                     usecols=lambda c: (c == "ID_REF") or (not str(c).endswith(".Detection.PVal")))
    df = df[df.index.astype(str).str.startswith("cg")]
    df.columns = [str(c).strip().strip('"') for c in df.columns]
    cols = [c for c in df.columns if c in ph and ph[c]["region"] == region]
    print(f"matrix beta cols: {df.shape[1]} | mapped to {region}: {len(cols)}", flush=True)
    if len(cols) < 10:
        raise SystemExit(f"too few mapped samples for {region}: {len(cols)}")
    sub = df[cols]
    aud = np.array([ph[c]["aud"] for c in cols]); sex = np.array([ph[c]["sex"] for c in cols])
    age = np.array([ph[c]["age"] for c in cols]); smk = np.array([ph[c]["smoker"] for c in cols])
    keep = np.isfinite(aud) & np.isfinite(sex) & np.isfinite(age) & np.isfinite(smk)
    sub = sub.loc[:, keep]; aud, sex, age, smk = aud[keep], sex[keep], age[keep], smk[keep]
    Y = sub.to_numpy(dtype=float).T  # samples x probes
    probes = sub.index.astype(str).to_numpy()
    good = ~np.isnan(Y).any(axis=0)
    Y = Y[:, good]; probes = probes[good]
    print(f"usable samples: {len(aud)} (AUD {int((aud==1).sum())} / Ctrl {int((aud==0).sum())}); "
          f"complete probes: {len(probes)}", flush=True)
    az = (age - age.mean()) / age.std()
    # Full-rank design: always keep intercept + aud; drop constant/collinear covariates.
    candidates = [("intercept", np.ones(len(aud))), ("aud", aud),
                  ("agez", az), ("sex", sex), ("smoker", smk)]
    Xcols = []; names = []; dropped = []
    for nm, v in candidates:
        trial = np.column_stack(Xcols + [v]) if Xcols else v.reshape(-1, 1)
        if np.linalg.matrix_rank(trial) == trial.shape[1]:
            Xcols.append(v); names.append(nm)
        else:
            dropped.append(nm)
    if dropped:
        print("dropped (constant/collinear):", dropped, flush=True)
    X = np.column_stack(Xcols); n, k = X.shape
    gi = names.index("aud")
    XtXi = np.linalg.inv(X.T @ X)
    B = XtXi @ X.T @ Y
    resid = Y - X @ B
    dof = n - k
    sig2 = (resid ** 2).sum(axis=0) / dof
    se = np.sqrt(sig2 * XtXi[gi, gi])
    coef = B[gi]
    with np.errstate(divide="ignore", invalid="ignore"):
        t = coef / se
        p = 2 * stats.t.sf(np.abs(t), dof)
    fin = np.isfinite(p) & np.isfinite(coef)
    probes, coef, t, p = probes[fin], coef[fin], t[fin], p[fin]
    fdr = bh(p)
    res = pd.DataFrame({"cg": probes, "delta_beta_case_minus_control": coef,
                        "t": t, "p": p, "fdr": fdr}).sort_values("p").reset_index(drop=True)
    res["rank"] = np.arange(1, len(res) + 1)
    res.to_csv(os.path.join(OUT, f"GSE252501_{region}_dmp.csv"), index=False)
    nsig = int((res["fdr"] < 0.05).sum())
    print(f"{region}: significant CpGs (FDR<0.05): {nsig:,} / {len(res):,}", flush=True)
    print(res.head(10).to_string(index=False), flush=True)
    rankmap = {cg: (i + 1, float(res.loc[i, "p"])) for i, cg in enumerate(res["cg"])}
    smoke = {cg: {"gene": gn, "rank": rankmap[cg][0], "p": rankmap[cg][1]}
             for cg, gn in SMOKING_CPGS.items() if cg in rankmap}
    return {
        "region": region, "tissue": f"postmortem {region}",
        "model_terms": names, "dropped_terms": dropped,
        "n_total": int(n), "n_case": int((aud == 1).sum()), "n_control": int((aud == 0).sum()),
        "n_probes_tested": int(len(res)), "n_sig_fdr05": nsig,
        "top10": res.head(10).to_dict("records"), "smoking_confound": smoke,
    }


def main():
    sp = dl(SERIES_URL, os.path.join(DATA, "GSE252501_series_matrix.txt.gz"))
    print("series sha256:", sha256(sp))
    ph = parse_pheno(sp)
    out = {
        "accession": "GSE252501", "substance": "alcohol (AUD)",
        "tissue": "postmortem brain (Nucleus Accumbens + DLPFC)", "platform": "EPIC",
        "series_sha256": sha256(sp),
        "model": "beta ~ AUD(case) + agedeath(z) + sex + smoker(current smoker at death)",
        "regions": {},
    }
    for region, url in MAT.items():
        mp = dl(url, os.path.join(DATA, os.path.basename(url)))
        out["matrix_sha256_" + region] = sha256(mp)
        out["regions"][region] = run_region(region, ph, mp)
    with open(os.path.join(OUT, "GSE252501_validation.json"), "w") as f:
        json.dump(out, f, indent=2)
    print("\ndone -> out/GSE252501_validation.json", flush=True)


if __name__ == "__main__":
    main()
