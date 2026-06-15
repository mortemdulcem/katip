#!/usr/bin/env python3
"""
31_opioid_model.py - REAL opioid/heroin classifier (methylation -> heroin-use status).

Adds the opioid dimension the per-substance panel was missing. Source = GSE98203:
postmortem orbitofrontal-cortex NEURONAL nuclei (BRAIN, not blood), Illumina 450K,
37 heroin vs 29 control (SUICIDE cohort excluded), processed betas data/GSE98203_beta.txt.gz.

Why a SEPARATE script (not CFG in 21_substance_models.py):
  * GSE98203 ships its own beta matrix + pheno file (not a GEO series_matrix), and the
    tissue is BRAIN. It MUST stay a standalone, clearly-labelled engine; it cannot be
    merged with the blood substance models. predict.py applies it with a tissue flag and
    a hard "brain->blood is cross-tissue, indicative only" declaration.

Rigour (identical Zero-Hallucination protocol to 21_substance_models.py):
  * Candidate probe pool = deterministic CRC32-hashed ~11% subset chosen WITHOUT labels.
  * StratifiedKFold(5, seed 42); per fold top-K t-test on TRAIN only -> XGBoost
    (scale_pos_weight for imbalance). Report OOF AUC + balanced-acc + sens + spec.
  * Final model refit on full data for inference. Data SHA-256 recorded.

Output: out/dl/substance_opioid.json + out/dl/models/substance_opioid.joblib
Run   : python3 scripts/31_opioid_model.py
"""
import gzip
import hashlib
import json
import os
import time
import zlib

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score, balanced_accuracy_score, confusion_matrix
import xgboost as xgb
import joblib

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data", "GSE98203_beta.txt.gz")
PHENO = os.path.join(HERE, "out", "GSE98203_pheno.csv")
OUT = os.path.join(HERE, "out", "dl")
MODELS = os.path.join(OUT, "models")
os.makedirs(MODELS, exist_ok=True)
SEED = 42
KEEP_PCT = 110          # CRC32 %1000 < KEEP_PCT -> ~11% label-blind candidate pool
TOPK = 300
np.random.seed(SEED)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def keep_probe(p):
    return (zlib.crc32(p.encode()) % 1000) < KEEP_PCT


def clf(pos_weight):
    return xgb.XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.1, subsample=0.8,
                             colsample_bytree=0.8, eval_metric="logloss", n_jobs=1,
                             scale_pos_weight=pos_weight, random_state=SEED, verbosity=0)


def topk_ttest(Xtr, ytr, k):
    _, p = stats.ttest_ind(Xtr[ytr == 1], Xtr[ytr == 0], axis=0, equal_var=False)
    return np.argsort(np.nan_to_num(p, nan=1.0))[:k]


def main():
    t0 = time.time()
    data_sha = sha256(DATA)
    print("data sha256:", data_sha, flush=True)

    pheno = pd.read_csv(PHENO)
    pheno["of"] = pheno["of"].astype(str)
    pheno = pheno[pheno["cohort"].isin(["HEROIN", "CONTROL"])].copy()

    # read only beta columns (drop *_Detection_PVal); keep only CRC32 candidate-pool probes
    with gzip.open(DATA, "rt") as f:
        header = f.readline().rstrip("\n").split("\t")
    beta_cols = [c for c in header[1:] if not c.endswith("_Detection_PVal")]
    usecols = [header[0]] + beta_cols
    df = pd.read_csv(DATA, sep="\t", usecols=usecols, index_col=0)
    df.columns = [c.strip() for c in df.columns]
    df = df[[keep_probe(str(i)) for i in df.index]]          # label-blind probe pool
    print(f"candidate probes after CRC32 pool: {df.shape[0]} "
          f"({time.time()-t0:.0f}s)", flush=True)

    common = [c for c in df.columns if c in set(pheno["of"])]
    pheno = pheno[pheno["of"].isin(common)].set_index("of").loc[common]
    beta = df[common].astype(float).dropna(axis=0, how="any")
    probes = beta.index.to_numpy()
    M = beta.to_numpy().T                                     # samples x probes
    y = (pheno["cohort"].to_numpy() == "HEROIN").astype(int)
    n_case, n_ctrl = int(y.sum()), int((y == 0).sum())
    print(f"[GSE98203/opioid] X={M.shape} case(heroin)={n_case} control={n_ctrl} "
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
        "dataset": "GSE98203", "substance": "opioid", "tissue": "brain",
        "n": int(len(y)), "n_case": n_case, "n_control": n_ctrl,
        "candidate_probes": int(M.shape[1]), "topk": TOPK,
        "roc_auc": round(float(roc_auc_score(y, oof)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y, pred)), 4),
        "sensitivity": round(float(tp / (tp + fn)) if (tp + fn) else float("nan"), 4),
        "specificity": round(float(tn / (tn + fp)) if (tn + fp) else float("nan"), 4),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "protocol": "leakage-free StratifiedKFold(5,seed42); per-fold top-K t-test on TRAIN; "
                    "XGBoost; CRC32-hashed label-blind candidate pool",
        "data_sha256": data_sha, "seed": SEED,
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "caveat": "BRAIN postmortem prefrontal cortex; cannot be merged with blood cohorts. "
                  "Applying to a blood sample is cross-tissue -> indicative only, NOT diagnostic. "
                  "Small n -> exploratory.",
    }
    print(f"  OOF AUC={metrics['roc_auc']} bacc={metrics['balanced_accuracy']} "
          f"sens={metrics['sensitivity']} spec={metrics['specificity']} ({time.time()-t0:.0f}s)",
          flush=True)

    idx = topk_ttest(M, y, TOPK)
    final = clf(pw).fit(M[:, idx], y)
    joblib.dump({"model": final, "scaler": None, "cpgs": probes[idx].tolist(),
                 "train_means": M[:, idx].mean(0),
                 "task": "opioid_heroin_BRAIN_case_vs_control", "tissue": "brain",
                 "oof_metrics": metrics},
                os.path.join(MODELS, "substance_opioid.joblib"))
    json.dump(metrics, open(os.path.join(OUT, "substance_opioid.json"), "w"), indent=2)
    print("DONE:", json.dumps({k: metrics[k] for k in ("substance", "tissue", "n", "roc_auc",
                                                        "balanced_accuracy")}))


if __name__ == "__main__":
    main()
