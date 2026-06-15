#!/usr/bin/env python3
"""
P6 - expanded, leakage-free ML on the smoking reference cohort (GSE50660, 450K blood),
the only cohort large enough for honest cross-validated learning (current vs never smoker).

Replaces the article's fabricated "7-class 87.3% accuracy". Three model families compared
under the SAME rigorous protocol; SHAP for interpretability.

Rigour:
  * StratifiedKFold(5, seed 42); top-K t-test feature selection done INSIDE each fold
    (selection never sees the held-out fold -> no leakage). Same K for all models.
  * Class imbalance (~22 current vs ~179 never): RF/ElasticNet class_weight="balanced",
    XGBoost scale_pos_weight = n_neg/n_pos.
  * Out-of-fold ROC-AUC + balanced accuracy + sensitivity + specificity (raw accuracy is
    misleading under imbalance and is NOT reported as the headline).
  * SHAP: TreeExplainer on an XGBoost fit to the full data with a fixed top-K (interpretation
    only; the UNBIASED performance numbers come from the leakage-free CV above). Declared as such.

Reads data/gse50660_cache.npz (04a_cache_betas.py). Output: out/ml/gse50660_ml.json
"""
import json, os, time
import numpy as np
from scipy import stats
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score, balanced_accuracy_score, confusion_matrix
import xgboost as xgb

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
OUT = os.path.abspath(os.path.join(HERE, "..", "out", "ml"))
os.makedirs(OUT, exist_ok=True)
CACHE = os.path.join(DATA, "gse50660_cache.npz")
SEED, TOPK = 42, 200
np.random.seed(SEED)


def select_topk(Xtr, ytr, k):
    _, p = stats.ttest_ind(Xtr[ytr == 1], Xtr[ytr == 0], axis=0, equal_var=False)
    return np.argsort(np.nan_to_num(p, nan=1.0))[:k]


def make_model(name, n_pos, n_neg):
    if name == "RandomForest":
        return RandomForestClassifier(n_estimators=200, class_weight="balanced",
                                      random_state=SEED, n_jobs=1)
    if name == "ElasticNet-LR":
        return LogisticRegression(penalty="elasticnet", solver="saga", l1_ratio=0.5,
                                  C=1.0, max_iter=5000, class_weight="balanced",
                                  random_state=SEED)
    if name == "XGBoost":
        return xgb.XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.1,
                                 subsample=0.8, colsample_bytree=0.8, eval_metric="logloss",
                                 scale_pos_weight=n_neg / max(n_pos, 1), n_jobs=1,
                                 random_state=SEED, verbosity=0)
    raise ValueError(name)


def cv_oof(X, y, name):
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    oof = np.zeros(len(y))
    for tr, te in skf.split(X, y):
        idx = select_topk(X[tr], y[tr], TOPK)
        n_pos = int(y[tr].sum()); n_neg = int((y[tr] == 0).sum())
        clf = make_model(name, n_pos, n_neg)
        clf.fit(X[tr][:, idx], y[tr])
        oof[te] = clf.predict_proba(X[te][:, idx])[:, 1]
    return oof


def metrics(y, oof):
    auc = roc_auc_score(y, oof)
    pred = (oof >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred).ravel()
    return {"roc_auc": round(float(auc), 4),
            "balanced_accuracy": round(float(balanced_accuracy_score(y, pred)), 4),
            "sensitivity_current": round(float(tp / (tp + fn)) if (tp + fn) else float("nan"), 4),
            "specificity_never": round(float(tn / (tn + fp)) if (tn + fp) else float("nan"), 4),
            "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}}


def main():
    t0 = time.time()
    z = np.load(CACHE, allow_pickle=True)
    X = z["M"].astype(np.float64); y = z["y"].astype(int); probes = z["probes"]
    n_pos, n_neg = int(y.sum()), int((y == 0).sum())
    print(f"loaded {X.shape}  current={n_pos} never={n_neg}", flush=True)

    results = {}
    for name in ["RandomForest", "ElasticNet-LR", "XGBoost"]:
        oof = cv_oof(X, y, name)
        results[name] = metrics(y, oof)
        print(f"  {name:14s} AUC={results[name]['roc_auc']} "
              f"bacc={results[name]['balanced_accuracy']} ({time.time()-t0:.0f}s)", flush=True)

    # ---- SHAP on full-data XGBoost (interpretation only; fixed top-K) ----
    shap_top = None
    try:
        import shap
        idx = select_topk(X, y, TOPK)
        clf = make_model("XGBoost", n_pos, n_neg)
        clf.fit(X[:, idx], y)
        expl = shap.TreeExplainer(clf)
        sv = expl.shap_values(X[:, idx])
        mean_abs = np.abs(sv).mean(axis=0)
        order = np.argsort(mean_abs)[::-1][:15]
        shap_top = [{"cpg": str(probes[idx][i]), "mean_abs_shap": round(float(mean_abs[i]), 5)}
                    for i in order]
        print("  SHAP top CpG:", shap_top[0], flush=True)
    except Exception as e:
        shap_top = {"error": f"{type(e).__name__}: {e}"}
        print("  SHAP failed:", e, flush=True)

    out = {
        "dataset": "GSE50660", "task": "current vs never smoker (binary)",
        "n_samples": int(X.shape[0]), "n_current": n_pos, "n_never": n_neg,
        "feature_pool": int(X.shape[1]),
        "protocol": "StratifiedKFold(5, seed=42); top-200 t-test selection INSIDE fold (leakage-free); "
                    "imbalance handled (class_weight / scale_pos_weight)",
        "models": results,
        "shap_top15_cpg_xgboost_fulldata": shap_top,
        "shap_note": "SHAP computed on an XGBoost fit to the FULL data with a fixed top-200 set, "
                     "for feature interpretation only. Unbiased performance = the leakage-free CV above.",
        "seed": SEED,
        "note": "Honest replacement for the article's fabricated 7-class 87.3% accuracy. "
                "Multi-substance 7-class is impossible (different platforms/tissues/tiny n).",
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    json.dump(out, open(os.path.join(OUT, "gse50660_ml.json"), "w"), indent=2)
    print("saved:", os.path.join(OUT, "gse50660_ml.json"), f"({time.time()-t0:.0f}s)", flush=True)


if __name__ == "__main__":
    main()
