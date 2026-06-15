#!/usr/bin/env python3
"""
21_substance_models.py - REAL per-substance classifiers (methylation -> substance-use status).

Extends the age+smoking deep-NN system (20_dlsystem.py) to the "drug" dimension the article
claimed. For each tractable public cohort we train a leakage-free binary classifier
(case vs control) and save it for the inference CLI (predict.py substance_panel):

  GSE77056   cocaine/crack dependence   (whole blood, 450K)   - 11,987 DMPs (strong signal)
  GSE154971  methamphetamine dependence (PBL, 450K)           -    398 DMPs
  GSE110043  alcohol (drinkers)         (whole blood, 450K)   -  4,387 DMPs

Deliberately NOT modelled (declared, not faked):
  GSE98203   opioid/heroin  - only 12 DMPs at FDR<0.05 and tiny n -> no reliable classifier.
  GSE49393   alcohol/AUD    - postmortem BRAIN, only 8 DMPs, cannot merge with blood -> skipped.

Rigour (Zero-Hallucination):
  * Candidate probe pool = a deterministic CRC32-hashed ~11% subset of array probes, chosen
    WITHOUT looking at labels (no all-data DMP pre-filtering) -> strictly leakage-free.
  * StratifiedKFold(5, seed 42); per fold: top-K t-test selection on TRAIN only, then XGBoost
    (scale_pos_weight for imbalance). Report OOF AUC + balanced-acc + sens + spec.
  * Final model refit on full data (fixed top-K on full data) for inference; performance = OOF.

Outputs: out/dl/substance_<name>.json + out/dl/models/substance_<name>.joblib
Run    : python3 scripts/21_substance_models.py            # all tractable datasets
         python3 scripts/21_substance_models.py GSE77056   # one dataset
"""
import json
import os
import sys
import time
import zlib

import numpy as np
from scipy import stats
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score, balanced_accuracy_score, confusion_matrix
import xgboost as xgb
import joblib

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
OUT = os.path.abspath(os.path.join(HERE, "..", "out", "dl"))
MODELS = os.path.join(OUT, "models")
os.makedirs(MODELS, exist_ok=True)
SEED = 42
KEEP_PCT = 110          # CRC32 %1000 < KEEP_PCT  -> ~11% of probes kept as candidate pool
TOPK = 300
np.random.seed(SEED)

CFG = {
    "GSE77056": {"name": "cocaine", "file": "GSE77056_series_matrix.txt.gz",
                 "control_kw": ["control", "healthy"],
                 "case_kw": ["drug user", "dependent", "cocaine", "crack", "user"]},
    "GSE154971": {"name": "methamphetamine", "file": "GSE154971_series_matrix.txt.gz",
                  "control_kw": ["control", "healthy"],
                  "case_kw": ["methamphetamine", "abuser", "dependence", "dependent", "ma "]},
    "GSE110043": {"name": "alcohol", "file": "GSE110043_series_matrix.txt.gz",
                  "control_kw": ["non-drinker", "non drinker", "nondrinker", "control"],
                  "case_kw": ["drinker", "case", "alcohol"]},
}


def keep_probe(p):
    return (zlib.crc32(p.encode()) % 1000) < KEEP_PCT


def parse(gse, cfg):
    import gzip
    path = os.path.join(DATA, cfg["file"])
    gsms, chars = None, []
    with gzip.open(path, "rt", errors="replace") as f:
        in_tbl = False
        thdr = None
        probes, rows = [], []
        for line in f:
            if not in_tbl:
                if line.startswith("!Sample_geo_accession"):
                    gsms = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
                elif line.startswith("!Sample_characteristics_ch1"):
                    chars.append([x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]])
                elif line.startswith("!series_matrix_table_begin"):
                    in_tbl = True
                continue
            if line.startswith("!series_matrix_table_end"):
                break
            parts = line.rstrip("\n").split("\t")
            if thdr is None:
                thdr = [p.strip().strip('"') for p in parts]
                continue
            probe = parts[0].strip().strip('"')
            if not probe.startswith("cg") or not keep_probe(probe):
                continue
            vals = np.array([_f(x) for x in parts[1:]], dtype=float)
            probes.append(probe); rows.append(vals)
    M = np.array(rows, dtype=float).T            # samples x probes (table-column order)
    col_gsms = thdr[1:]
    # labels per table column
    concat = {g: "" for g in col_gsms}
    if gsms:
        for ch in chars:
            for g, v in zip(gsms, ch):
                if g in concat:
                    concat[g] += " " + v.lower()
    y = np.array([_label(concat[g], cfg) for g in col_gsms], dtype=float)
    return M, y, np.array(probes), np.array(col_gsms)


def _f(x):
    try:
        return float(x)
    except ValueError:
        return np.nan


def _label(s, cfg):
    for k in cfg["control_kw"]:
        if k in s:
            return 0.0
    for k in cfg["case_kw"]:
        if k in s:
            return 1.0
    return np.nan


def impute(M):
    col_mean = np.nanmean(M, axis=0)
    col_mean = np.where(np.isfinite(col_mean), col_mean, 0.5)
    idx = np.where(~np.isfinite(M))
    M[idx] = np.take(col_mean, idx[1])
    return M


def topk_ttest(Xtr, ytr, k):
    _, p = stats.ttest_ind(Xtr[ytr == 1], Xtr[ytr == 0], axis=0, equal_var=False)
    return np.argsort(np.nan_to_num(p, nan=1.0))[:k]


def clf(pos_weight):
    return xgb.XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.1, subsample=0.8,
                             colsample_bytree=0.8, eval_metric="logloss", n_jobs=1,
                             scale_pos_weight=pos_weight, random_state=SEED, verbosity=0)


def run(gse):
    cfg = CFG[gse]
    t0 = time.time()
    M, y, probes, gsms = parse(gse, cfg)
    keep = np.isfinite(y)
    M, y = impute(M[keep]), y[keep].astype(int)
    n_case, n_ctrl = int(y.sum()), int((y == 0).sum())
    print(f"[{gse}/{cfg['name']}] X={M.shape} case={n_case} control={n_ctrl} "
          f"({time.time()-t0:.0f}s)", flush=True)
    if n_case < 8 or n_ctrl < 8:
        print(f"  SKIP: too few per class for reliable CV (case={n_case},ctrl={n_ctrl})")
        return None

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
        "dataset": gse, "substance": cfg["name"], "n": int(len(y)),
        "n_case": n_case, "n_control": n_ctrl,
        "candidate_probes": int(M.shape[1]), "topk": TOPK,
        "roc_auc": round(float(roc_auc_score(y, oof)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y, pred)), 4),
        "sensitivity": round(float(tp / (tp + fn)) if (tp + fn) else float("nan"), 4),
        "specificity": round(float(tn / (tn + fp)) if (tn + fp) else float("nan"), 4),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "protocol": "leakage-free StratifiedKFold(5,seed42); per-fold top-K t-test on TRAIN; "
                    "XGBoost; CRC32-hashed label-blind candidate pool", "seed": SEED,
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    print(f"  OOF AUC={metrics['roc_auc']} bacc={metrics['balanced_accuracy']} "
          f"sens={metrics['sensitivity']} spec={metrics['specificity']} ({time.time()-t0:.0f}s)",
          flush=True)

    # final model for inference
    idx = topk_ttest(M, y, TOPK)
    final = clf(pw).fit(M[:, idx], y)
    joblib.dump({"model": final, "scaler": None, "cpgs": probes[idx].tolist(),
                 "train_means": M[:, idx].mean(0),
                 "task": f"{cfg['name']}_case_vs_control", "oof_metrics": metrics},
                os.path.join(MODELS, f"substance_{cfg['name']}.joblib"))
    json.dump(metrics, open(os.path.join(OUT, f"substance_{cfg['name']}.json"), "w"), indent=2)
    return metrics


def main():
    targets = [a for a in sys.argv[1:] if a in CFG] or list(CFG)
    summary = {}
    for g in targets:
        r = run(g)
        if r:
            summary[g] = {k: r[k] for k in ("substance", "n", "roc_auc", "balanced_accuracy")}
    print("DONE:", json.dumps(summary))


if __name__ == "__main__":
    main()
