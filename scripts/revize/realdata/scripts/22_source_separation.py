#!/usr/bin/env python3
"""
22_source_separation.py - MODULE #2 "Moleküler Kaynak Ayrımı" (REAL, reproducible).

The fabricated EPICLOCK v4.0 claimed it could take one methylation profile and separate /
attribute the molecular SOURCE (which substance). A clean single-sample source separation
needs same-platform, multi-substance samples that DO NOT exist publicly. What can be done
rigorously with the real per-cohort DMPs we computed is to quantify how DISTINGUISHABLE the
six substance signatures actually are - i.e. whether the molecular sources are separable.

For each substance we load its real differential-methylation result (out/<gse>_dmp.csv,
column delta_beta_*_minus_*) and build:
  (A) Specificity (Jaccard) matrix of the FDR<0.05 significant-CpG sets.
  (B) Concordance matrix = Pearson r of delta-beta on the shared top-signature CpGs.
  (C) per-substance specificity index = 1 - max off-diagonal Jaccard (1.0 = fully distinct
      molecular source; ->0 = overlaps another substance's signature).

Substances (real cohorts):
  smoking (GSE50660 blood) | cocaine (GSE77056 blood) | methamphetamine (GSE154971 PBL)
  alcohol_blood (GSE110043 blood) | alcohol_brain (GSE49393 brain) | opioid (GSE98203 brain)

Zero-Hallucination: uses ONLY the committed real DMP tables; no cross-cohort classifier is
reported as diagnostic. Tissue (blood vs brain) + array-platform differences are confounders
of any cross-signature comparison and are declared, not hidden.

Outputs: out/dl/source_separation.json, out/dl/source_separation_matrix.csv
Run    : python3 scripts/22_source_separation.py
"""
import json
import os
import time

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_ROOT = os.path.abspath(os.path.join(HERE, "..", "out"))
OUT = os.path.join(OUT_ROOT, "dl")
os.makedirs(OUT, exist_ok=True)
FDR = 0.05
TOPN = 2000          # signature = top-N significant CpGs by |t|
MIN_SHARED = 20      # min shared CpGs to report a correlation

SUBS = {
    "smoking": "gse50660_dmp.csv",
    "cocaine": "GSE77056_dmp.csv",
    "methamphetamine": "GSE154971_dmp.csv",
    "alcohol_blood": "gse110043_dmp.csv",
    "alcohol_brain": "GSE49393_dmp.csv",
    "opioid": "GSE98203_dmp.csv",
}
TISSUE = {"smoking": "blood", "cocaine": "blood", "methamphetamine": "blood",
          "alcohol_blood": "blood", "alcohol_brain": "brain", "opioid": "brain"}


def load(fn):
    df = pd.read_csv(os.path.join(OUT_ROOT, fn))
    delta_col = df.columns[1]                       # delta_beta_*_minus_*
    df = df.rename(columns={delta_col: "delta"})
    df = df[["cg", "delta", "t", "fdr"]].dropna(subset=["cg"])
    sig = df[df["fdr"] < FDR].copy()
    sig["abst"] = sig["t"].abs()
    top = sig.sort_values("abst", ascending=False).head(TOPN)
    return {
        "n_sig": int(len(sig)),
        "sig_set": set(sig["cg"]),
        "sig_delta": dict(zip(sig["cg"], sig["delta"])),
        "top_set": set(top["cg"]),
        "top_delta": dict(zip(top["cg"], top["delta"])),
    }


def jaccard(a, b):
    u = len(a | b)
    return (len(a & b) / u) if u else 0.0


def main():
    t0 = time.time()
    names = list(SUBS)
    data = {}
    for n in names:
        data[n] = load(SUBS[n])
        print(f"  {n:16s} sig(FDR<{FDR})={data[n]['n_sig']:>7d}  "
              f"tissue={TISSUE[n]} ({time.time()-t0:.0f}s)", flush=True)

    jac = pd.DataFrame(index=names, columns=names, dtype=float)
    con = pd.DataFrame(index=names, columns=names, dtype=float)
    shared = pd.DataFrame(index=names, columns=names, dtype=int)
    for a in names:
        for b in names:
            jac.loc[a, b] = round(jaccard(data[a]["sig_set"], data[b]["sig_set"]), 4)
            sh = data[a]["top_set"] & data[b]["top_set"]
            shared.loc[a, b] = len(sh)
            if a == b:
                con.loc[a, b] = 1.0
            elif len(sh) >= MIN_SHARED:
                xa = np.array([data[a]["top_delta"][c] for c in sh])
                xb = np.array([data[b]["top_delta"][c] for c in sh])
                con.loc[a, b] = round(float(np.corrcoef(xa, xb)[0, 1]), 4)
            else:
                con.loc[a, b] = np.nan

    spec_index = {}
    for a in names:
        off = [jac.loc[a, b] for b in names if b != a]
        spec_index[a] = {"specificity_index": round(1.0 - max(off), 4),
                         "max_overlap_with": names[int(np.argmax(off))] if off else None,
                         "max_jaccard": round(max(off), 4) if off else None}

    # tidy long-format matrix CSV
    rows = []
    for a in names:
        for b in names:
            rows.append({"source_a": a, "source_b": b,
                         "jaccard_sig": jac.loc[a, b], "concordance_r": con.loc[a, b],
                         "shared_top_cpgs": int(shared.loc[a, b]),
                         "tissue_a": TISSUE[a], "tissue_b": TISSUE[b]})
    pd.DataFrame(rows).to_csv(os.path.join(OUT, "source_separation_matrix.csv"), index=False)

    off_jac = [jac.loc[a, b] for a in names for b in names if a != b]
    summary = {
        "module": "Molekuler Kaynak Ayrimi (#2)",
        "design": "signature distinguishability of 6 real per-cohort DMP sets",
        "substances": {n: {"tissue": TISSUE[n], "n_sig_fdr05": data[n]["n_sig"]} for n in names},
        "fdr_threshold": FDR, "signature_topN_by_abs_t": TOPN,
        "specificity_index_per_substance": spec_index,
        "mean_offdiagonal_jaccard": round(float(np.mean(off_jac)), 5),
        "max_offdiagonal_jaccard": round(float(np.max(off_jac)), 5),
        "jaccard_matrix": json.loads(jac.to_json(orient="index")),
        "concordance_r_matrix": json.loads(con.to_json(orient="index")),
        "interpretation": "High specificity_index (low off-diagonal Jaccard) means each substance's "
                          "methylation signature is largely distinct -> molecular sources ARE "
                          "separable at the signature level.",
        "limitation": "Single-sample molecular source attribution requires same-platform, "
                      "multi-substance samples (not public). This quantifies signature "
                      "distinguishability from real DMPs; blood-vs-brain tissue and array-platform "
                      "differences are confounders of cross-substance comparison (declared).",
        "outputs": ["out/dl/source_separation.json", "out/dl/source_separation_matrix.csv"],
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    json.dump(summary, open(os.path.join(OUT, "source_separation.json"), "w"), indent=2)
    print(f"  mean off-diagonal Jaccard={summary['mean_offdiagonal_jaccard']} "
          f"max={summary['max_offdiagonal_jaccard']} ({time.time()-t0:.0f}s)", flush=True)
    print("saved out/dl/source_separation.json + source_separation_matrix.csv", flush=True)


if __name__ == "__main__":
    main()
