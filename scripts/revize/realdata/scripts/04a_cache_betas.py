#!/usr/bin/env python3
"""
04a_cache_betas.py — one-time compact cache for the classifier/clock steps.

Parses GSE50660 once, keeps current(2)/never(0) smoker samples, then applies an
UNSUPERVISED variance filter (uses NO labels -> leakage-free) to the top-N most
variable CpGs, and saves a small npz. This lets 04_classifier.py run CV +
permutation test within a single time-boxed call.

Output: data/gse50660_cache.npz  (M [samples x probes] float32, y, samples, probes)
"""
import gzip, os, time
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
SERIES = os.path.join(DATA, "GSE50660_series_matrix.txt.gz")
CACHE = os.path.join(DATA, "gse50660_cache.npz")
TOPVAR = 30000


def parse_series(path):
    gsms = None
    chars = []
    with gzip.open(path, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_geo_accession"):
                gsms = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1"):
                chars.append([x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]])
            elif line.startswith("!series_matrix_table_begin"):
                break
    pheno = pd.DataFrame(index=gsms)
    for vals in chars:
        key = None; parsed = []
        for v in vals:
            if ":" in v:
                k, val = v.split(":", 1); key = k.strip(); parsed.append(val.strip())
            else:
                parsed.append(v.strip())
        if key is None:
            continue
        col = key.lower().split("(")[0].strip()
        base, i = col, 1
        while col in pheno.columns:
            i += 1; col = f"{base}_{i}"
        pheno[col] = parsed
    betas = pd.read_csv(path, sep="\t", comment="!", index_col=0, na_values=["", "null", "NA"],
                        engine="c", compression="gzip")
    betas = betas[~betas.index.astype(str).str.startswith("!")]
    betas = betas.apply(pd.to_numeric, errors="coerce").astype(np.float32)
    return pheno, betas


def main():
    t0 = time.time()
    pheno, betas = parse_series(SERIES)
    smoke_col = next(c for c in pheno.columns if c.startswith("smoking"))
    smoke = pd.to_numeric(pheno[smoke_col], errors="coerce")
    keep = smoke.isin([0, 2])
    samples = list(pheno.index[keep])
    y = (smoke.loc[samples] == 2).astype(int).values
    sub = betas[samples]
    ok = ~sub.isna().any(axis=1)
    sub = sub[ok]
    var = sub.var(axis=1)
    top = var.sort_values(ascending=False).head(TOPVAR).index
    M = sub.loc[top].values.T.astype(np.float32)   # samples x probes
    probes = np.array(top, dtype=object)
    np.savez_compressed(CACHE, M=M, y=y.astype(np.int8),
                        samples=np.array(samples, dtype=object), probes=probes)
    print(f"cache -> {CACHE}  M={M.shape} current={int(y.sum())} never={int((y==0).sum())} "
          f"({time.time()-t0:.0f}s)")


if __name__ == "__main__":
    main()
