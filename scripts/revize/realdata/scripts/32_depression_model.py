#!/usr/bin/env python3
"""
32_depression_model.py - REAL depression (MDD) classifier (methylation -> depressed vs control).

Source = GSE125105: "Epigenome analysis of depressed and control subjects", whole blood,
Illumina 450K, n=699 (489 major-depressive-disorder cases / 210 controls). This is the
SAME cohort 14_depression.py used for epigenetic-age-acceleration (where depressed subjects
showed significantly higher PhenoAge acceleration, Welch p=0.0015). Here we add a direct
case/control classifier so predict.py can surface a depression dimension.

ENVIRONMENT CONSTRAINT (see memory geo-large-matrix-env-limits.md):
  The full normalized matrix is 3.3 GB gz and does NOT fully decompress within this env's
  ~120s/call wall, and background jobs die across call boundaries. So the candidate probe
  pool here is the FIRST 80,000 probe rows of the matrix (array order) -- a position-based
  subset that is INDEPENDENT of depression labels, hence still leakage-free for this task.
  This is declared honestly; it is a partial-genome pool, not the whole array.

Rigour (identical Zero-Hallucination protocol to 21/31 substance scripts):
  * Per-probe NaN imputed with that probe's mean (label-blind).
  * StratifiedKFold(5, seed 42); per fold top-K t-test on TRAIN only -> XGBoost
    (scale_pos_weight for imbalance). Report OOF AUC + balanced-acc + sens + spec.
  * Final model refit on full data for inference. Data SHA-256 recorded.

Inputs : data/GSE125105_betas_slice.tsv  (cg + 699 beta cols, sliced from the prefix pool)
         out/GSE125105_clock_per_sample.csv  (sample -> group_depressed label, real)
Output : out/dl/condition_depression.json + out/dl/models/condition_depression.joblib
Run    : python3 scripts/32_depression_model.py
"""
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
BETAS = os.path.join(HERE, "data", "GSE125105_betas_slice.tsv")
LABELS = os.path.join(HERE, "out", "GSE125105_clock_per_sample.csv")
OUT = os.path.join(HERE, "out", "dl")
MODELS = os.path.join(OUT, "models")
os.makedirs(MODELS, exist_ok=True)
SEED = 42
TOPK = 300
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


def main():
    t0 = time.time()
    data_sha = sha256(BETAS)
    print("betas-slice sha256:", data_sha, flush=True)

    lab = pd.read_csv(LABELS)[["sample", "group_depressed"]].dropna()
    lab["sample"] = lab["sample"].astype(str)
    y_map = dict(zip(lab["sample"], lab["group_depressed"].astype(int)))

    beta = pd.read_csv(BETAS, sep="\t", index_col=0)
    beta.columns = [c.strip() for c in beta.columns]
    print(f"loaded betas {beta.shape} ({time.time()-t0:.0f}s)", flush=True)

    samples = [c for c in beta.columns if c in y_map]
    probes_all = beta.index.to_numpy()
    A = beta[samples].to_numpy(dtype=float)  # probes x samples (numpy, fast)
    del beta
    # label-blind per-probe mean imputation; drop probes that are entirely NaN
    rowmean = np.nanmean(A, axis=1)
    keep = np.isfinite(rowmean)
    A, probes, rowmean = A[keep], probes_all[keep], rowmean[keep]
    nan_r, nan_c = np.where(np.isnan(A))
    A[nan_r, nan_c] = rowmean[nan_r]
    M = A.T  # samples x probes
    y = np.array([y_map[s] for s in samples], dtype=int)
    print(f"imputed + assembled M={M.shape} ({time.time()-t0:.0f}s)", flush=True)
    n_case, n_ctrl = int(y.sum()), int((y == 0).sum())
    print(f"[GSE125105/depression] X={M.shape} case(MDD)={n_case} control={n_ctrl} "
          f"({time.time()-t0:.0f}s)", flush=True)

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    pw = n_ctrl / max(n_case, 1)
    oof = np.zeros(len(y))
    for tr, te in skf.split(M, y):
        idx = topk_ttest(M[tr], y[tr], TOPK)
        m = clf(pw).fit(M[tr][:, idx], y[tr])
        oof[te] = m.predict_proba(M[te][:, idx])[:, 1]
    pred = (oof >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred).ravel()
    metrics = {
        "dataset": "GSE125105", "condition": "depression_MDD", "tissue": "blood",
        "n": int(len(y)), "n_case": n_case, "n_control": n_ctrl,
        "candidate_probes": int(M.shape[1]), "candidate_pool": "first 80k array-order probes "
        "(env-constrained, label-blind subset of the 450K array)", "topk": TOPK,
        "roc_auc": round(float(roc_auc_score(y, oof)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y, pred)), 4),
        "sensitivity": round(float(tp / (tp + fn)) if (tp + fn) else float("nan"), 4),
        "specificity": round(float(tn / (tn + fp)) if (tn + fp) else float("nan"), 4),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "protocol": "leakage-free StratifiedKFold(5,seed42); per-fold top-K t-test on TRAIN; "
                    "XGBoost; partial-genome (first-80k) label-blind candidate pool",
        "data_sha256": data_sha, "seed": SEED,
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "caveat": "MDD blood methylation signal is weak and confounded by blood cell composition; "
                  "candidate pool is partial-genome due to env limits. Cross-cohort application is "
                  "indicative only, NOT diagnostic. Companion age-acceleration result in 14_depression.py.",
    }
    print(f"  OOF AUC={metrics['roc_auc']} bacc={metrics['balanced_accuracy']} "
          f"sens={metrics['sensitivity']} spec={metrics['specificity']} ({time.time()-t0:.0f}s)",
          flush=True)

    idx = topk_ttest(M, y, TOPK)
    final = clf(pw).fit(M[:, idx], y)
    joblib.dump({"model": final, "scaler": None, "cpgs": probes[idx].tolist(),
                 "train_means": M[:, idx].mean(0),
                 "task": "depression_MDD_case_vs_control", "tissue": "blood",
                 "oof_metrics": metrics},
                os.path.join(MODELS, "condition_depression.joblib"))
    json.dump(metrics, open(os.path.join(OUT, "condition_depression.json"), "w"), indent=2)
    print("DONE:", json.dumps({k: metrics[k] for k in ("condition", "tissue", "n", "roc_auc",
                                                        "balanced_accuracy")}))


if __name__ == "__main__":
    main()
