#!/usr/bin/env python3
"""
04_classifier.py — REAL methylation classifier (replaces the article's fabricated 87.3%).

Task: predict current vs never smoker from 450K betas (GSE50660, whole blood).
Reads data/gse50660_cache.npz (04a_cache_betas.py: current/never samples, unsupervised
variance pre-filter to 30k CpGs -> leakage-free).

Rigour (avoids the leakage that inflates fake accuracies):
  * StratifiedKFold CV (k=5, seed 42); feature selection (top-K t-test) INSIDE fold only.
  * RandomForest class_weight="balanced" (imbalanced ~22 vs ~179); n_jobs=1 (sandbox-safe).
  * Out-of-fold ROC-AUC / balanced-acc / sensitivity / specificity.
  * Permutation test of the AUC (label shuffling) -> beats chance.

Resumable: real metrics recomputed each run; permutation AUCs appended in chunks to
data/gse50660_perm.npy so the work fits in time-boxed calls. Finalizes the p-value once
PERM_TARGET shuffles are collected.

Usage: python3 04_classifier.py [chunk=20]
Output: out/gse50660_classifier.json
"""
import json, os, sys, time
import numpy as np
from scipy import stats
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score, balanced_accuracy_score, confusion_matrix

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
OUT = os.path.abspath(os.path.join(HERE, "..", "out"))
CACHE = os.path.join(DATA, "gse50660_cache.npz")
PERMF = os.path.join(DATA, "gse50660_perm.npy")
SEED, TOPK, NTREE, PERM_TARGET = 42, 200, 200, 60
np.random.seed(SEED)


def select_topk(Xtr, ytr, k):
    _, p = stats.ttest_ind(Xtr[ytr == 1], Xtr[ytr == 0], axis=0, equal_var=False)
    return np.argsort(np.nan_to_num(p, nan=1.0))[:k]


def cv_oof(X, y, seed):
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
    oof = np.zeros(len(y))
    for tr, te in skf.split(X, y):
        idx = select_topk(X[tr], y[tr], TOPK)
        clf = RandomForestClassifier(n_estimators=NTREE, class_weight="balanced",
                                     random_state=seed, n_jobs=1)
        clf.fit(X[tr][:, idx], y[tr])
        oof[te] = clf.predict_proba(X[te][:, idx])[:, 1]
    return oof


def main():
    chunk = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    t0 = time.time()
    z = np.load(CACHE, allow_pickle=True)
    X = z["M"].astype(np.float64); y = z["y"].astype(int)

    oof = cv_oof(X, y, SEED)
    auc = roc_auc_score(y, oof)
    pred = (oof >= 0.5).astype(int)
    bacc = balanced_accuracy_score(y, pred)
    tn, fp, fn, tp = confusion_matrix(y, pred).ravel()
    sens = tp / (tp + fn) if (tp + fn) else float("nan")
    spec = tn / (tn + fp) if (tn + fp) else float("nan")
    print(f"real AUC={auc:.3f} bacc={bacc:.3f} ({time.time()-t0:.0f}s)", flush=True)

    perm = list(np.load(PERMF)) if os.path.exists(PERMF) else []
    rng = np.random.default_rng(SEED + len(perm))
    done = len(perm)
    for i in range(chunk):
        if done >= PERM_TARGET:
            break
        yp = rng.permutation(y)
        perm.append(roc_auc_score(yp, cv_oof(X, yp, SEED + 1000 + done)))
        done += 1
        if done % 5 == 0:
            np.save(PERMF, np.array(perm)); print(f"  perms={done}/{PERM_TARGET} ({time.time()-t0:.0f}s)", flush=True)
    np.save(PERMF, np.array(perm))
    perm = np.array(perm)

    complete = len(perm) >= PERM_TARGET
    p_perm = (1 + int(np.sum(perm >= auc))) / (len(perm) + 1) if len(perm) else None
    res = {
        "dataset": "GSE50660", "task": "current vs never smoker",
        "n_samples": int(X.shape[0]), "n_current": int(y.sum()), "n_never": int((y == 0).sum()),
        "features_pool": int(X.shape[1]),
        "model": f"RandomForest({NTREE}, class_weight=balanced, n_jobs=1)",
        "cv": "StratifiedKFold(5, seed=42); top-200 t-test selection INSIDE fold (leakage-free)",
        "roc_auc": round(float(auc), 4),
        "balanced_accuracy": round(float(bacc), 4),
        "sensitivity_current": round(float(sens), 4),
        "specificity_never": round(float(spec), 4),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "permutations_done": int(len(perm)), "permutation_target": PERM_TARGET,
        "permutation_complete": complete,
        "permutation_null_auc_mean": round(float(perm.mean()), 4) if len(perm) else None,
        "permutation_p_value": round(float(p_perm), 5) if p_perm is not None else None,
        "seed": SEED,
        "note": "Imbalanced classes; AUC + balanced accuracy + permutation p reported instead of raw accuracy. REAL counterpart to the article's fabricated 87.3%.",
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with open(os.path.join(OUT, "gse50660_classifier.json"), "w") as f:
        json.dump(res, f, indent=2)
    print(f"perms {len(perm)}/{PERM_TARGET} complete={complete} p={res['permutation_p_value']}", flush=True)


if __name__ == "__main__":
    main()
