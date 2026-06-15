#!/usr/bin/env python3
"""
34_schizophrenia_model.py - REAL schizophrenia/psychosis classifier (methylation -> case vs control).

Source = GSE152026 (EU-GEI): "Blood DNA methylation profiles from first episode psychosis
patients and controls", whole blood, Illumina EPIC (GPL21145), n=934
  (413 cases / 521 controls). The series matrix is a 22 KB metadata-only STUB; the actual
betas live in the 8 GB supplementary GSE152026_EUGEI_processed_signals.csv.gz (per sample:
a beta column + a Detection_Pval column). The per-sample label "phenotype: Case/Control"
and the sentrix-id<->phenotype mapping come from the stub series matrix.

ENVIRONMENT CONSTRAINT (see memory geo-large-matrix-env-limits.md):
  The 8 GB signals gz cannot be fully downloaded/decompressed within this env's ~120s/call
  wall, so the candidate probe pool is the FIRST ~40,000 probe rows (array order), streamed
  with `head` and with the Detection_Pval columns dropped. This is a position-based subset
  INDEPENDENT of case/control labels -> still leakage-free. Declared honestly as partial-genome.

Rigour (identical Zero-Hallucination protocol to 31/32/33):
  * Per-probe NaN imputed with that probe's mean (label-blind).
  * StratifiedKFold(5, seed 42); per fold top-K t-test on TRAIN only -> XGBoost
    (scale_pos_weight for imbalance). Report OOF AUC + balanced-acc + sens + spec.
  * Final model refit on full data for inference. Data SHA-256 recorded.

Inputs : data/GSE152026_betas_slice.csv  (cg + 934 beta cols, first ~40k probes; sentrix headers)
         data/GSE152026_series_matrix.txt.gz  (stub, for sentrix-id -> Case/Control labels)
Output : out/dl/condition_schizophrenia.json + out/dl/models/condition_schizophrenia.joblib
Run    : python3 scripts/34_schizophrenia_model.py
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
GZ = os.path.join(HERE, "data", "GSE152026_series_matrix.txt.gz")
BETAS = os.path.join(HERE, "data", "GSE152026_betas_slice.csv")
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
    """Map sentrix id (first token of !Sample_title) -> 1 Case / 0 Control."""
    title = pheno = None
    with gzip.open(gz, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_title"):
                title = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1") and "phenotype" in line:
                pheno = [x.strip().strip('"').replace("phenotype: ", "")
                         for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!series_matrix_table_begin"):
                break
    out = {}
    for t, p in zip(title, pheno):
        sentrix = t.split()[0]
        v = p.strip().lower()
        out[sentrix] = 1 if v == "case" else (0 if v == "control" else None)
    return {k: v for k, v in out.items() if v is not None}


def main():
    t0 = time.time()
    data_sha = sha256(BETAS)
    print("betas sha256:", data_sha, flush=True)

    y_map = parse_labels(GZ)
    print(f"labels: case={sum(y_map.values())} control={sum(v == 0 for v in y_map.values())} "
          f"({time.time()-t0:.0f}s)", flush=True)

    beta = pd.read_csv(BETAS, sep=",", index_col=0)
    beta.columns = [c.strip() for c in beta.columns]
    assert not any("Detection_Pval" in c for c in beta.columns), \
        "Detection_Pval columns leaked into beta slice (cut field-list wrong?)"
    print(f"loaded betas {beta.shape} ({time.time()-t0:.0f}s)", flush=True)

    samples = [c for c in beta.columns if c in y_map]
    probes_all = beta.index.to_numpy()
    A = beta[samples].to_numpy(dtype=float)  # probes x samples (NaNs preserved)
    del beta
    gmean = np.nanmean(A, axis=1)            # global per-probe mean (final refit / inference)
    keep = np.isfinite(gmean)                # drop all-NaN probes
    A, probes, gmean = A[keep], probes_all[keep], gmean[keep]
    M = A.T  # samples x probes, NaNs PRESERVED (imputed per-fold to avoid leakage)
    del A
    y = np.array([y_map[s] for s in samples], dtype=int)
    n_case, n_ctrl = int(y.sum()), int((y == 0).sum())

    # --- hard assertions: fail loudly on GEO format / label drift ---
    assert len(samples) == M.shape[0] == len(y), "sample/label count mismatch"
    assert len(set(samples)) == len(samples), "duplicate sentrix IDs in beta matrix"
    assert (n_case, n_ctrl) == (413, 521), f"schizophrenia label drift: case={n_case} control={n_ctrl}"
    print(f"[GSE152026/schizophrenia] X={M.shape} case={n_case} control={n_ctrl} "
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
        "dataset": "GSE152026", "condition": "schizophrenia_psychosis", "tissue": "blood",
        "platform": "Illumina EPIC (GPL21145)",
        "n": int(len(y)), "n_case": n_case, "n_control": n_ctrl,
        "candidate_probes": int(M.shape[1]), "candidate_pool": "first ~40k array-order probes "
        "(env-constrained, label-blind subset of the EPIC array)", "topk": TOPK,
        "roc_auc": round(float(roc_auc_score(y, oof)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y, pred)), 4),
        "sensitivity": round(float(tp / (tp + fn)) if (tp + fn) else float("nan"), 4),
        "specificity": round(float(tn / (tn + fp)) if (tn + fp) else float("nan"), 4),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "protocol": "leakage-free StratifiedKFold(5,seed42); per-fold TRAIN-only mean-impute, "
                    "top-K t-test and scale_pos_weight; XGBoost; partial-genome (first ~40k "
                    "array-order) label-blind candidate pool",
        "data_sha256": data_sha, "seed": SEED,
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "caveat": "First-episode psychosis cohort (EU-GEI). Within-cohort validated; blood "
                  "methylation in psychosis is confounded by antipsychotic medication, smoking "
                  "and blood-cell composition. Cross-cohort application is indicative only, "
                  "NOT diagnostic.",
    }
    print(f"  OOF AUC={metrics['roc_auc']} bacc={metrics['balanced_accuracy']} "
          f"sens={metrics['sensitivity']} spec={metrics['specificity']} ({time.time()-t0:.0f}s)",
          flush=True)

    Xfull = np.where(np.isnan(M), np.where(np.isfinite(gmean), gmean, 0.0), M)
    idx = topk_ttest(Xfull, y, TOPK)
    final = clf(n_ctrl / max(n_case, 1)).fit(Xfull[:, idx], y)
    joblib.dump({"model": final, "scaler": None, "cpgs": probes[idx].tolist(),
                 "train_means": Xfull[:, idx].mean(0),
                 "task": "schizophrenia_case_vs_control", "tissue": "blood",
                 "oof_metrics": metrics},
                os.path.join(MODELS, "condition_schizophrenia.joblib"))
    json.dump(metrics, open(os.path.join(OUT, "condition_schizophrenia.json"), "w"), indent=2)
    print("DONE:", json.dumps({k: metrics[k] for k in ("condition", "tissue", "n", "roc_auc",
                                                       "balanced_accuracy")}))


if __name__ == "__main__":
    main()
