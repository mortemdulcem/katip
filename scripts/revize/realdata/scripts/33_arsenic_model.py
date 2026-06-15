#!/usr/bin/env python3
"""
33_arsenic_model.py - REAL arsenic-exposure classifier (methylation -> exposed vs unexposed).

Source = GSE109914: "Genome wide DNA methylation analysis of arsenic exposure and
non-exposure population", whole-blood buffy coat, Illumina 450K (GPL13534), n=119.
Per-sample label is the GEO characteristic "arsenic exposure: Yes/No":
  * exposed (Yes) = 84  (66 exposed-normal-skin + 18 exposed-with-skin-lesions)
  * unexposed (No) = 35
The 18 skin-lesion subjects ARE arsenic-exposed, so they belong in the exposed class; the
target is EXPOSURE status, not skin disease (declared in the caveat).

ENVIRONMENT CONSTRAINT (see memory geo-large-matrix-env-limits.md):
  The 395 MB gz does NOT fully decompress within this env's ~120s/call wall, so the candidate
  probe pool here is the FIRST ~120,000 probe rows of the matrix (array order) -- a position-
  based subset that is INDEPENDENT of arsenic labels, hence still leakage-free. Declared
  honestly; it is a partial-genome pool, not the whole array.

Rigour (identical Zero-Hallucination protocol to 31/32):
  * Candidate pool = first ~120k array-order probes (label-blind subset of the 450K array).
  * Per-probe NaN imputed with that probe's mean (label-blind).
  * StratifiedKFold(5, seed 42); per fold top-K t-test on TRAIN only -> XGBoost
    (scale_pos_weight for imbalance). Report OOF AUC + balanced-acc + sens + spec.
  * Final model refit on full data for inference. Data SHA-256 recorded.

Inputs : data/GSE109914_betas_slice.tsv  (cg + 119 beta cols, first ~120k probes of the matrix)
         data/GSE109914_series_matrix.txt.gz  (for the per-sample exposure labels)
Output : out/dl/exposure_arsenic.json + out/dl/models/exposure_arsenic.joblib
Run    : python3 scripts/33_arsenic_model.py
"""
import gzip
import hashlib
import json
import os
import time

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score, balanced_accuracy_score, confusion_matrix
import xgboost as xgb
import joblib

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GZ = os.path.join(HERE, "data", "GSE109914_series_matrix.txt.gz")
BETAS = os.path.join(HERE, "data", "GSE109914_betas_slice.tsv")
OUT = os.path.join(HERE, "out", "dl")
MODELS = os.path.join(OUT, "models")
os.makedirs(MODELS, exist_ok=True)
SEED = 42
TOPK = 400
np.random.seed(SEED)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def clf(pos_weight):
    return xgb.XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.1, subsample=0.8,
                             colsample_bytree=0.8, eval_metric="logloss", n_jobs=1,
                             scale_pos_weight=pos_weight, random_state=SEED, verbosity=0)


def topk_ttest(Xtr, ytr, k):
    _, p = stats.ttest_ind(Xtr[ytr == 1], Xtr[ytr == 0], axis=0, equal_var=False)
    return np.argsort(np.nan_to_num(p, nan=1.0))[:k]


def parse_labels(gz):
    geo = expo = None
    with gzip.open(gz, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_geo_accession"):
                geo = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1") and "arsenic exposure" in line:
                expo = [x.strip().strip('"').replace("arsenic exposure: ", "")
                        for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!series_matrix_table_begin"):
                break
    out = {}
    for g, e in zip(geo, expo):
        v = e.strip().lower()
        out[g] = 1 if v == "yes" else (0 if v == "no" else None)
    return {k: v for k, v in out.items() if v is not None}


def main():
    t0 = time.time()
    data_sha = sha256(BETAS)
    print("betas sha256:", data_sha, flush=True)

    y_map = parse_labels(GZ)
    print(f"labels: exposed={sum(y_map.values())} unexposed={sum(v == 0 for v in y_map.values())} "
          f"({time.time()-t0:.0f}s)", flush=True)

    beta = pd.read_csv(BETAS, sep="\t", index_col=0)
    beta.columns = [c.strip() for c in beta.columns]
    print(f"loaded betas {beta.shape} ({time.time()-t0:.0f}s)", flush=True)

    samples = [c for c in beta.columns if c in y_map]
    probes_all = beta.index.to_numpy()
    A = beta[samples].to_numpy(dtype=float)  # probes x samples
    del beta
    gmean = np.nanmean(A, axis=1)              # global per-probe mean (final refit / inference)
    keep = np.isfinite(gmean)                  # drop all-NaN probes
    A, probes, gmean = A[keep], probes_all[keep], gmean[keep]
    M = A.T  # samples x probes, NaNs PRESERVED (imputed per-fold to avoid leakage)
    del A
    y = np.array([y_map[s] for s in samples], dtype=int)
    n_case, n_ctrl = int(y.sum()), int((y == 0).sum())

    # --- hard assertions: fail loudly on GEO format / label drift ---
    assert len(samples) == M.shape[0] == len(y), "sample/label count mismatch"
    assert len(set(samples)) == len(samples), "duplicate sample IDs in beta matrix"
    assert (n_case, n_ctrl) == (84, 35), f"arsenic label drift: exposed={n_case} unexposed={n_ctrl}"
    print(f"[GSE109914/arsenic] X={M.shape} exposed={n_case} unexposed={n_ctrl} "
          f"({time.time()-t0:.0f}s)", flush=True)

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    oof = np.zeros(len(y))
    for tr, te in skf.split(M, y):
        Xtr = M[tr]                                           # fancy-index copy (safe to fill)
        mu = np.nanmean(Xtr, axis=0)                          # TRAIN-only per-probe mean
        mu = np.where(np.isfinite(mu), mu, 0.0)
        b = np.isnan(Xtr); Xtr[b] = mu[np.where(b)[1]]        # in-place impute (low memory)
        Xte = M[te]
        b = np.isnan(Xte); Xte[b] = mu[np.where(b)[1]]        # test imputed with TRAIN mean
        idx = topk_ttest(Xtr, y[tr], TOPK)                   # feature select on TRAIN only
        pw = (y[tr] == 0).sum() / max((y[tr] == 1).sum(), 1)  # TRAIN-only class ratio
        m = clf(pw).fit(Xtr[:, idx], y[tr])
        oof[te] = m.predict_proba(Xte[:, idx])[:, 1]
        del Xtr, Xte, b
    pred = (oof >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred).ravel()
    metrics = {
        "dataset": "GSE109914", "exposure": "arsenic", "tissue": "blood",
        "platform": "Illumina 450K (GPL13534)",
        "n": int(len(y)), "n_exposed": n_case, "n_unexposed": n_ctrl,
        "candidate_probes": int(M.shape[1]), "candidate_pool": "first ~120k array-order probes "
        "(env-constrained, label-blind subset of the 450K array)", "topk": TOPK,
        "roc_auc": round(float(roc_auc_score(y, oof)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y, pred)), 4),
        "sensitivity": round(float(tp / (tp + fn)) if (tp + fn) else float("nan"), 4),
        "specificity": round(float(tn / (tn + fp)) if (tn + fp) else float("nan"), 4),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "protocol": "leakage-free StratifiedKFold(5,seed42); per-fold TRAIN-only mean-impute, "
                    "top-K t-test and scale_pos_weight; XGBoost; partial-genome (first ~120k "
                    "array-order) label-blind candidate pool",
        "data_sha256": data_sha, "seed": SEED,
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "caveat": "Target is arsenic EXPOSURE status (the 18 skin-lesion subjects are exposed). "
                  "Within-cohort validated; cross-cohort/population application is confounded by "
                  "batch, ancestry and blood-cell composition -> indicative only, NOT diagnostic.",
    }
    print(f"  OOF AUC={metrics['roc_auc']} bacc={metrics['balanced_accuracy']} "
          f"sens={metrics['sensitivity']} spec={metrics['specificity']} ({time.time()-t0:.0f}s)",
          flush=True)

    Xfull = np.where(np.isnan(M), np.where(np.isfinite(gmean), gmean, 0.0), M)
    idx = topk_ttest(Xfull, y, TOPK)
    final = clf(n_ctrl / max(n_case, 1)).fit(Xfull[:, idx], y)
    joblib.dump({"model": final, "scaler": None, "cpgs": probes[idx].tolist(),
                 "train_means": Xfull[:, idx].mean(0),
                 "task": "arsenic_exposed_vs_unexposed", "tissue": "blood",
                 "oof_metrics": metrics},
                os.path.join(MODELS, "exposure_arsenic.joblib"))
    json.dump(metrics, open(os.path.join(OUT, "exposure_arsenic.json"), "w"), indent=2)
    print("DONE:", json.dumps({k: metrics[k] for k in ("exposure", "tissue", "n", "roc_auc",
                                                       "balanced_accuracy")}))


if __name__ == "__main__":
    main()
