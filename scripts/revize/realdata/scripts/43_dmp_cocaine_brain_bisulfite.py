#!/usr/bin/env python3
"""Real DMP for COCAINE — POSTMORTEM HUMAN BRAIN, bisulfite sequencing (5x coverage).
Two companion datasets (same donors, different region):
  ACCESSION=GSE182585  -> striatum   (group: Control/Case)
  ACCESSION=GSE137364  -> caudate    (subject status: Control/Case)

Data: <ACC>_5xCoverage_Methylation.hg19.tsv.gz  with columns
      chr, pos, cov_<id>, meth_<id>, ...   (per-sample coverage + methylated-read counts)
methylation proportion = meth/cov. Sample <id> is the integer in cov_<id>/meth_<id>
and equals the series-matrix !Sample_title (a global donor id), so we map id->phenotype
by integer match (fail-closed: every matrix id must resolve to exactly one donor).

Design: complete-case (CpG covered in ALL retained donors) OLS
        proportion ~ cocaine(case=1) + age(z) + smoker, BH-FDR.
All donors male -> no sex term. smoker = "smoker status" (Smoker/Non-smoker).

Zero-hallucination: every number computed here; data SHA-256 recorded; no imputation.
"""
import os, re, sys, json, gzip, hashlib, urllib.request
import numpy as np
import pandas as pd
from scipy import stats

ACC = os.environ.get("ACCESSION", "GSE182585").strip()
CFG = {
    "GSE182585": {"region": "striatum", "group_key": "group",
                  "header_file": "GSE182585_columnheader_5xCoverage_Methylation.tsv.gz",
                  "tsv": "GSE182585_5xCoverage_Methylation.hg19.tsv.gz", "tsv_has_header": False},
    "GSE137364": {"region": "caudate", "group_key": "subject status",
                  "header_file": None,
                  "tsv": "GSE137364_5xCoverage_Methylation.hg19.tsv.gz", "tsv_has_header": True},
}[ACC]

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data"); OUT = os.path.join(HERE, "out")
os.makedirs(DATA, exist_ok=True); os.makedirs(OUT, exist_ok=True)
PRE = re.sub(r"\d{3}$", "nnn", ACC)
BASE = f"https://ftp.ncbi.nlm.nih.gov/geo/series/{PRE}/{ACC}/suppl/"
SERIES_URL = f"https://ftp.ncbi.nlm.nih.gov/geo/series/{PRE}/{ACC}/matrix/{ACC}_series_matrix.txt.gz"
CHUNK = 200_000


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


def parse_pheno(series_path, group_key):
    title = None; chars = []
    with gzip.open(series_path, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_title"):
                title = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1"):
                chars.append([x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]])
            elif line.startswith('"ID_REF') or "!series_matrix_table_begin" in line:
                break
    n = len(title)

    def getchar(key):
        for vals in chars:
            kk = None; out = []
            for v in vals:
                if ":" in v:
                    k, val = v.split(":", 1); kk = k.strip().lower(); out.append(val.strip())
                else:
                    out.append(v.strip())
            if kk == key.lower():
                return out
        return [None] * n

    grp = getchar(group_key); age = getchar("age"); smk = getchar("smoker status")
    ph = {}
    for i in range(n):
        try:
            sid = int(str(title[i]).strip())
        except ValueError:
            continue
        a = age[i]
        ph[sid] = {
            "cocaine": 1.0 if (grp[i] and grp[i].lower() == "case")
                       else (0.0 if (grp[i] and grp[i].lower() == "control") else np.nan),
            "age": float(a) if (a and str(a).replace(".", "", 1).isdigit()) else np.nan,
            "smoker": 1.0 if (smk[i] and smk[i].lower() == "smoker")
                      else (0.0 if (smk[i] and "non" in str(smk[i]).lower()) else np.nan),
        }
    return ph


def get_colnames():
    if CFG["header_file"]:
        hp = dl(BASE + CFG["header_file"], os.path.join(DATA, CFG["header_file"]))
        names = gzip.open(hp, "rt").read().strip().split("\t")
        return names
    return None  # header is the first row of the tsv itself


def main():
    sp = dl(SERIES_URL, os.path.join(DATA, f"{ACC}_series_matrix.txt.gz"))
    ph = parse_pheno(sp, CFG["group_key"])
    print(f"{ACC} donors with pheno: {len(ph)}", flush=True)

    tsv = dl(BASE + CFG["tsv"], os.path.join(DATA, CFG["tsv"]))
    names = get_colnames()
    # peek first row to learn column layout
    reader_kw = dict(sep="\t", na_values=["NA", "na", ""], chunksize=CHUNK, low_memory=False)
    if names is not None:
        reader_kw["names"] = names; reader_kw["header"] = None
    else:
        reader_kw["header"] = 0

    # discover sample ids from a tiny first read
    head = next(pd.read_csv(tsv, **{**reader_kw, "chunksize": 5}))
    cols = list(head.columns)
    chr_col, pos_col = cols[0], cols[1]
    cov_ids = {int(m.group(1)): c for c in cols if (m := re.match(r"cov_(\d+)$", str(c)))}
    meth_ids = {int(m.group(1)): c for c in cols if (m := re.match(r"meth_(\d+)$", str(c)))}
    ids = sorted(set(cov_ids) & set(meth_ids))
    print(f"matrix sample ids: {len(ids)} | first/last: {ids[:3]}..{ids[-3:]}", flush=True)

    # map matrix ids -> phenotype (fail-closed)
    unmapped = [i for i in ids if i not in ph]
    if unmapped:
        raise SystemExit(f"{len(unmapped)} matrix ids have no donor pheno (e.g. {unmapped[:5]})")
    coc = np.array([ph[i]["cocaine"] for i in ids])
    age = np.array([ph[i]["age"] for i in ids])
    smk = np.array([ph[i]["smoker"] for i in ids])
    keep = np.isfinite(coc) & np.isfinite(age) & np.isfinite(smk)
    ids_use = [i for i, k in zip(ids, keep) if k]
    coc, age, smk = coc[keep], age[keep], smk[keep]
    print(f"usable donors: {len(ids_use)} (Case {int((coc==1).sum())} / Control {int((coc==0).sum())})",
          flush=True)
    cov_use = [cov_ids[i] for i in ids_use]
    meth_use = [meth_ids[i] for i in ids_use]

    az = (age - age.mean()) / age.std()
    # Full-rank design: always keep intercept + cocaine; drop constant/collinear covariates.
    candidates = [("intercept", np.ones(len(coc))), ("cocaine", coc),
                  ("agez", az), ("smoker", smk)]
    Xcols = []; names_x = []; dropped = []
    for nm, v in candidates:
        trial = np.column_stack(Xcols + [v]) if Xcols else v.reshape(-1, 1)
        if np.linalg.matrix_rank(trial) == trial.shape[1]:
            Xcols.append(v); names_x.append(nm)
        else:
            dropped.append(nm)
    if dropped:
        print("dropped (constant/collinear):", dropped, flush=True)
    X = np.column_stack(Xcols); n, k = X.shape; dof = n - k
    gidx = names_x.index("cocaine")
    XtXi = np.linalg.inv(X.T @ X)

    all_id, all_coef, all_t, all_p = [], [], [], []
    n_rows = n_complete = 0
    for chunk in pd.read_csv(tsv, **reader_kw):
        n_rows += len(chunk)
        cov = chunk[cov_use].to_numpy(dtype=float)
        meth = chunk[meth_use].to_numpy(dtype=float)
        with np.errstate(divide="ignore", invalid="ignore"):
            prop = np.where(cov > 0, meth / cov, np.nan)
        complete = ~np.isnan(prop).any(axis=1)
        if not complete.any():
            continue
        Y = prop[complete]              # probes x samples
        cids = (chunk[chr_col].astype(str).to_numpy()[complete] + ":" +
                chunk[pos_col].astype(str).to_numpy()[complete])
        Yt = Y.T                        # samples x probes
        B = XtXi @ X.T @ Yt
        resid = Yt - X @ B
        sig2 = (resid ** 2).sum(axis=0) / dof
        se = np.sqrt(sig2 * XtXi[gidx, gidx])
        coef = B[gidx]
        with np.errstate(divide="ignore", invalid="ignore"):
            t = coef / se
            p = 2 * stats.t.sf(np.abs(t), dof)
        fin = np.isfinite(p) & np.isfinite(coef)
        all_id.append(cids[fin]); all_coef.append(coef[fin]); all_t.append(t[fin]); all_p.append(p[fin])
        n_complete += int(fin.sum())
    print(f"scanned CpG rows: {n_rows:,} | complete-case tested: {n_complete:,}", flush=True)
    if n_complete == 0:
        raise SystemExit("no complete-case CpGs — coverage too sparse for adjusted DMP")

    cg = np.concatenate(all_id); coef = np.concatenate(all_coef)
    t = np.concatenate(all_t); p = np.concatenate(all_p)
    fdr = bh(p)
    res = pd.DataFrame({"cpg_hg19": cg, "delta_prop_case_minus_control": coef,
                        "t": t, "p": p, "fdr": fdr}).sort_values("p").reset_index(drop=True)
    res["rank"] = np.arange(1, len(res) + 1)
    res.to_csv(os.path.join(OUT, f"{ACC}_dmp.csv"), index=False)
    nsig = int((res["fdr"] < 0.05).sum())
    print(f"\n{ACC} significant CpGs (FDR<0.05): {nsig:,} / {len(res):,}", flush=True)
    print(res.head(10).to_string(index=False), flush=True)

    out = {
        "accession": ACC, "substance": "cocaine",
        "tissue": f"postmortem human brain ({CFG['region']})",
        "platform": "bisulfite sequencing (5x coverage, hg19)",
        "series_sha256": sha256(sp), "tsv_sha256": sha256(tsv),
        "model": "proportion ~ cocaine(case) + age(z) + smoker", "model_terms": names_x,
        "dropped_terms": dropped,
        "n_total": int(n), "n_case": int((coc == 1).sum()), "n_control": int((coc == 0).sum()),
        "n_cpg_scanned": int(n_rows), "n_cpg_tested_complete_case": int(len(res)),
        "n_sig_fdr05": nsig, "top10": res.head(10).to_dict("records"),
        "note": "Complete-case across all retained donors (no imputation). All donors male. "
                "Smoking modeled. delta = case-control methylation proportion.",
    }
    with open(os.path.join(OUT, f"{ACC}_validation.json"), "w") as f:
        json.dump(out, f, indent=2)
    print(f"\ndone -> out/{ACC}_validation.json", flush=True)


if __name__ == "__main__":
    main()
