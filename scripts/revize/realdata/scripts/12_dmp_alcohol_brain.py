#!/usr/bin/env python3
"""
Real EWAS for ALCOHOL (Alcohol Use Disorder) — GSE49393.
Tissue: postmortem prefrontal cortex (BRAIN, not blood). Platform: Illumina 450K (GPL13534).
Betas are embedded in the GEO series matrix (data/GSE49393_series_matrix.txt.gz).
Design: beta ~ AUD + age + sex   (AUD case vs Control), BH-FDR.

This dataset was cited in the fabricated article as "GSE49393 Alkol n=24" — the REAL series
has n=48 (verified live via NCBI). Here we compute the genuine EWAS ourselves.
Zero-hallucination: every number computed here; data SHA-256 recorded.
"""
import os, json, gzip, hashlib
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERIES = os.path.join(HERE, "data", "GSE49393_series_matrix.txt.gz")
OUT_CSV = os.path.join(HERE, "out", "GSE49393_dmp.csv")
OUT_JSON = os.path.join(HERE, "out", "GSE49393_validation.json")
OUT_PHENO = os.path.join(HERE, "out", "GSE49393_pheno.csv")

SMOKING_CPGS = {
    "cg05575921": "AHRR", "cg03636183": "F2RL3", "cg21566642": "2q37.1/ALPPL2",
    "cg05951221": "2q37.1", "cg19859270": "GPR15", "cg09935388": "GFI1",
    "cg06126421": "6p21.33", "cg25648203": "AHRR",
}
# canonical alcohol EWAS CpGs (Liu 2018 Mol Psychiatry, etc.) for a literature sanity check
ALCOHOL_CPGS = {"cg06690548": "SLC7A11", "cg04999691": "ENOX1",
                "cg09001149": "TRA2B", "cg02583484": "HNRNPA1"}


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(buf), b""):
            h.update(c)
    return h.hexdigest()


def parse_series(path):
    # 1) stream only the metadata header (fast) for GSMs + characteristics + table column order
    gsms, chars, samples = None, [], None
    with gzip.open(path, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_geo_accession"):
                gsms = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1"):
                chars.append([x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]])
            elif line.startswith('"ID_REF"') or line.startswith("ID_REF"):
                samples = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
                break
    # 2) parse the beta table with the fast C parser; comment='!' skips all metadata + the
    #    trailing !series_matrix_table_end footer line.
    tab = pd.read_csv(path, sep="\t", comment="!", quotechar='"', index_col=0,
                      na_values=["", "null", "NA"], low_memory=False)
    tab = tab[~tab.index.isna()]
    tab = tab[tab.index.astype(str).str.startswith("cg")]
    tab.columns = [str(c).strip().strip('"') for c in tab.columns]
    tab = tab[samples]  # enforce sample/column order == header order
    probes = tab.index.astype(str).to_numpy()
    M = tab.to_numpy(dtype=float)  # probes x samples
    # build pheno frame keyed by characteristic name
    ph = pd.DataFrame(index=gsms)
    for vals in chars:
        key, parsed = None, []
        for v in vals:
            if ":" in v:
                k, val = v.split(":", 1); key = k.strip().lower(); parsed.append(val.strip())
            else:
                parsed.append(v.strip())
        if key is None:
            continue
        col, base = key, key
        while col in ph.columns:
            col = base + "_x"; base = col
        ph[col] = parsed
    assert samples == gsms, "table column order != sample order"
    return gsms, ph, probes, M


def main():
    print("series sha256:", sha256(SERIES))
    gsms, ph, probes, M = parse_series(SERIES)
    print("samples:", len(gsms), "| probes:", len(probes), "| beta range:",
          np.nanmin(M), "-", np.nanmax(M))
    print("pheno columns:", list(ph.columns))

    aud_col = next((c for c in ph.columns if "aud" in c or "status" in c or "diagnosis" in c), None)
    sex_col = next((c for c in ph.columns if c.startswith("sex") or "gender" in c), None)
    age_col = next((c for c in ph.columns if c.startswith("age")), None)
    print(f"using columns -> group:{aud_col} sex:{sex_col} age:{age_col}")
    print("aud status unique:", ph[aud_col].value_counts().to_dict())

    grp = ph[aud_col].astype(str).str.lower()
    group = np.where(grp.str.contains("control"), 0.0,
                     np.where(grp.str.contains("alcohol|aud|dependen|case|disorder|abuse"), 1.0, np.nan))
    sex = ph[sex_col].astype(str).str.lower().str[0].map({"m": 1.0, "f": 0.0}).values
    age = pd.to_numeric(ph[age_col].astype(str).str.extract(r"(\d+\.?\d*)")[0], errors="coerce").values

    pheno = pd.DataFrame({"sample": gsms, "aud_status": ph[aud_col].values,
                          "group": group, "sex": sex, "age": age})
    pheno.to_csv(OUT_PHENO, index=False)

    keep = np.isfinite(group) & np.isfinite(sex) & np.isfinite(age)
    print("usable samples:", int(keep.sum()),
          "| AUD:", int(np.nansum(group[keep] == 1)), "Control:", int(np.nansum(group[keep] == 0)))

    Y = M[:, keep].T  # samples x probes
    g = group[keep]; a = age[keep]; s = sex[keep]
    # drop probes with any NaN in this subset
    good_probe = ~np.isnan(Y).any(axis=0)
    Y = Y[:, good_probe]; probes_use = probes[good_probe]
    print("complete probes (no NaN):", len(probes_use))
    series_sha = hashlib.sha256(np.ascontiguousarray(Y).tobytes()).hexdigest()

    az = (a - a.mean()) / a.std()
    X = np.column_stack([np.ones(len(g)), g, az, s])
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
    fin = np.isfinite(p) & np.isfinite(coef)
    probes_use, coef, t, p = probes_use[fin], coef[fin], t[fin], p[fin]

    order = np.argsort(p); m = len(p)
    q = p[order] * m / np.arange(1, m + 1)
    q = np.minimum.accumulate(q[::-1])[::-1]
    fdr = np.empty(m); fdr[order] = np.clip(q, 0, 1)

    res = pd.DataFrame({"cg": probes_use, "delta_beta_aud_minus_control": coef,
                        "t": t, "p": p, "fdr": fdr}).sort_values("p").reset_index(drop=True)
    res["rank"] = np.arange(1, len(res) + 1)
    res.to_csv(OUT_CSV, index=False)

    n_sig = int((res["fdr"] < 0.05).sum())
    print(f"\nsignificant CpGs (FDR<0.05): {n_sig:,} / {len(res):,}")
    print("TOP 10:\n", res.head(10).to_string(index=False))

    rankmap = {cg: (i + 1, float(res.loc[i, "p"])) for i, cg in enumerate(res["cg"])}
    smoke = {cg: {"gene": gn, "rank": rankmap[cg][0], "p": rankmap[cg][1]}
             for cg, gn in SMOKING_CPGS.items() if cg in rankmap}
    alc = {cg: {"gene": gn, "rank": rankmap[cg][0], "p": rankmap[cg][1]}
           for cg, gn in ALCOHOL_CPGS.items() if cg in rankmap}
    print("\nsmoking-confound CpGs:", json.dumps(smoke, indent=2))
    print("alcohol-literature CpGs:", json.dumps(alc, indent=2))

    val = {
        "accession": "GSE49393", "substance": "alcohol (AUD)",
        "tissue": "brain (prefrontal cortex, postmortem)", "platform": "450K (GPL13534)",
        "data_sha256": sha256(SERIES), "beta_matrix_sha256": series_sha,
        "n_total_aligned": int(n), "n_aud": int(np.nansum(g == 1)), "n_control": int(np.nansum(g == 0)),
        "model": "beta ~ AUD + age(z) + sex", "n_probes_tested": int(len(res)),
        "n_sig_fdr05": n_sig, "top10": res.head(10).to_dict("records"),
        "smoking_confound": smoke, "alcohol_literature_cpgs": alc,
        "article_claimed_n": 24, "real_n_geo": 48,
        "note": "BRAIN postmortem; cannot be merged with blood cohorts. Article mislabeled n.",
    }
    with open(OUT_JSON, "w") as f:
        json.dump(val, f, indent=2)
    print(f"\ndone -> {OUT_CSV}, {OUT_JSON}, {OUT_PHENO}")


if __name__ == "__main__":
    main()
