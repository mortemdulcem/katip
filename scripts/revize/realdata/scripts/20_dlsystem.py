#!/usr/bin/env python3
"""
P-DL - REAL deep-neural-network system: DNA methylation in -> epigenetic age + smoking status out.

This is the genuine, reproducible counterpart to the article's fabricated "ensemble ML
MAE=2.1y R2=0.96 / 7-class 87.3% accuracy". Two feed-forward deep neural networks
(multilayer perceptrons, Adam back-prop) are trained on the anchor cohort GSE50660
(450K blood, n=201, with chronological age + smoking status):

  A) MLP epigenetic-age regressor  : betas -> chronological age (a data-driven deep clock)
  B) MLP smoking classifier        : betas -> current vs never smoker

Rigour (Zero-Hallucination):
  * Leakage-free CV: feature selection (top-K) is done INSIDE each training fold only;
    the held-out fold never participates in selection or scaling.
  * Regressor: KFold(5, seed 42), top-K CpG by |Pearson r| with age on TRAIN only,
    StandardScaler fit on TRAIN, MLPRegressor(256,64). Report OOF MAE / RMSE / R2 / r.
  * Classifier: StratifiedKFold(5, seed 42), top-K by t-test on TRAIN only, scaler on TRAIN,
    MLPClassifier(256,64). Imbalance (22 vs 179) -> report AUC + balanced-acc + sens + spec.
  * Final models are refit on ALL data (with a fixed top-K selected on full data) and saved
    for inference; the UNBIASED performance numbers are the OOF/CV ones above (declared).

Inputs : data/gse50660_cache.npz (M,y,samples,probes) + out/gse50660_clock_per_sample.csv (age)
Outputs: out/dl/gse50660_dl.json           (metrics, reproducible)
         out/dl/models/age_mlp.joblib       (regressor + scaler + cpg list + train means)
         out/dl/models/smoking_mlp.joblib    (classifier + scaler + cpg list + train means)
Run    : python3 scripts/20_dlsystem.py
"""
import json
import os
import time

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.model_selection import KFold, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPRegressor, MLPClassifier
from sklearn.metrics import (mean_absolute_error, mean_squared_error, r2_score,
                             roc_auc_score, balanced_accuracy_score, confusion_matrix)
import xgboost as xgb
import joblib

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
OUT = os.path.abspath(os.path.join(HERE, "..", "out", "dl"))
MODELS = os.path.join(OUT, "models")
os.makedirs(MODELS, exist_ok=True)
CACHE = os.path.join(DATA, "gse50660_cache.npz")
AGECSV = os.path.abspath(os.path.join(HERE, "..", "out", "gse50660_clock_per_sample.csv"))
SEED = 42
TOPK_AGE = 1000
TOPK_SMK = 200
np.random.seed(SEED)


def oversample(Xtr, ytr, rng):
    """Balance classes by random oversampling of the minority TRAIN set (leakage-free:
    only training folds are oversampled). MLPClassifier supports neither class_weight nor
    sample_weight, so without this the 22-vs-179 imbalance collapses it to the majority class."""
    pos = np.where(ytr == 1)[0]
    neg = np.where(ytr == 0)[0]
    if len(pos) == 0 or len(neg) == 0:
        return Xtr, ytr
    n = max(len(pos), len(neg))
    idx = np.concatenate([rng.choice(pos, n, replace=True), rng.choice(neg, n, replace=True)])
    rng.shuffle(idx)
    return Xtr[idx], ytr[idx]


def load():
    z = np.load(CACHE, allow_pickle=True)
    X = z["M"].astype(np.float64)
    y = z["y"].astype(int)
    samples = np.array([str(s) for s in z["samples"]])
    probes = np.array([str(p) for p in z["probes"]])
    age_df = pd.read_csv(AGECSV).set_index("gsm")
    age = np.array([age_df.loc[s, "chrono_age"] if s in age_df.index else np.nan
                    for s in samples], dtype=float)
    keep = ~np.isnan(age)
    return X[keep], y[keep], age[keep], samples[keep], probes


def topk_corr(Xtr, atr, k):
    """Indices of k CpGs most correlated (|Pearson r|) with age, computed on TRAIN only."""
    Xc = Xtr - Xtr.mean(0)
    ac = atr - atr.mean()
    denom = (np.sqrt((Xc ** 2).sum(0)) * np.sqrt((ac ** 2).sum()))
    r = np.divide((Xc * ac[:, None]).sum(0), denom, out=np.zeros(Xtr.shape[1]), where=denom > 0)
    return np.argsort(-np.abs(r))[:k]


def topk_ttest(Xtr, ytr, k):
    _, p = stats.ttest_ind(Xtr[ytr == 1], Xtr[ytr == 0], axis=0, equal_var=False)
    return np.argsort(np.nan_to_num(p, nan=1.0))[:k]


def age_regressor():
    return MLPRegressor(hidden_layer_sizes=(256, 64), activation="relu", solver="adam",
                        alpha=1e-3, batch_size=32, learning_rate_init=1e-3, max_iter=500,
                        early_stopping=True, n_iter_no_change=20, random_state=SEED)


def smoking_classifier():
    return MLPClassifier(hidden_layer_sizes=(128, 32), activation="relu", solver="adam",
                         alpha=1e-2, batch_size=16, learning_rate_init=1e-3, max_iter=800,
                         early_stopping=True, n_iter_no_change=30, random_state=SEED)


def cv_age(X, age):
    kf = KFold(n_splits=5, shuffle=True, random_state=SEED)
    oof = np.full(len(age), np.nan)
    for tr, te in kf.split(X):
        idx = topk_corr(X[tr], age[tr], TOPK_AGE)
        sc = StandardScaler().fit(X[tr][:, idx])
        m = age_regressor().fit(sc.transform(X[tr][:, idx]), age[tr])
        oof[te] = m.predict(sc.transform(X[te][:, idx]))
    return oof


def cv_smoking(X, y):
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    rng = np.random.RandomState(SEED)
    oof = np.zeros(len(y))
    for tr, te in skf.split(X, y):
        idx = topk_ttest(X[tr], y[tr], TOPK_SMK)
        sc = StandardScaler().fit(X[tr][:, idx])
        Xtr_s, ytr_s = oversample(sc.transform(X[tr][:, idx]), y[tr], rng)
        m = smoking_classifier().fit(Xtr_s, ytr_s)
        oof[te] = m.predict_proba(sc.transform(X[te][:, idx]))[:, 1]
    return oof


def smoking_xgb_clf(y_tr):
    return xgb.XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.1, subsample=0.8,
                             colsample_bytree=0.8, eval_metric="logloss", n_jobs=1,
                             scale_pos_weight=int((y_tr == 0).sum()) / max(int(y_tr.sum()), 1),
                             random_state=SEED, verbosity=0)


def cv_smoking_xgb(X, y):
    """Real leakage-free OOF for the DEPLOYED smoking XGBoost (top-K t-test in-fold,
    no scaler/oversample; imbalance via per-fold scale_pos_weight)."""
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    oof = np.zeros(len(y))
    for tr, te in skf.split(X, y):
        idx = topk_ttest(X[tr], y[tr], TOPK_SMK)
        m = smoking_xgb_clf(y[tr]).fit(X[tr][:, idx], y[tr])
        oof[te] = m.predict_proba(X[te][:, idx])[:, 1]
    return oof


def main():
    t0 = time.time()
    X, y, age, samples, probes = load()
    print(f"loaded X={X.shape} age=[{age.min():.0f},{age.max():.0f}] "
          f"current={int(y.sum())} never={int((y==0).sum())}", flush=True)

    # ---- A) age regressor (OOF) ----
    oof_age = cv_age(X, age)
    age_metrics = {
        "n": int(len(age)),
        "mae_years": round(float(mean_absolute_error(age, oof_age)), 3),
        "rmse_years": round(float(np.sqrt(mean_squared_error(age, oof_age))), 3),
        "r2": round(float(r2_score(age, oof_age)), 4),
        "pearson_r": round(float(np.corrcoef(age, oof_age)[0, 1]), 4),
        "topk_cpg": TOPK_AGE,
    }
    print(f"  AGE-MLP  OOF MAE={age_metrics['mae_years']}y r={age_metrics['pearson_r']} "
          f"R2={age_metrics['r2']} ({time.time()-t0:.0f}s)", flush=True)

    # ---- B) smoking classifier (OOF) ----
    oof_smk = cv_smoking(X, y)
    pred = (oof_smk >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred).ravel()
    smk_metrics = {
        "n": int(len(y)), "n_current": int(y.sum()), "n_never": int((y == 0).sum()),
        "roc_auc": round(float(roc_auc_score(y, oof_smk)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y, pred)), 4),
        "sensitivity_current": round(float(tp / (tp + fn)) if (tp + fn) else float("nan"), 4),
        "specificity_never": round(float(tn / (tn + fp)) if (tn + fp) else float("nan"), 4),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "topk_cpg": TOPK_SMK,
    }
    print(f"  SMOKE-MLP OOF AUC={smk_metrics['roc_auc']} "
          f"bacc={smk_metrics['balanced_accuracy']} ({time.time()-t0:.0f}s)", flush=True)

    # ---- final models refit on ALL data (fixed top-K on full data) -> for inference ----
    idx_age = topk_corr(X, age, TOPK_AGE)
    sc_age = StandardScaler().fit(X[:, idx_age])
    final_age = age_regressor().fit(sc_age.transform(X[:, idx_age]), age)
    joblib.dump({"model": final_age, "scaler": sc_age, "cpgs": probes[idx_age].tolist(),
                 "train_means": X[:, idx_age].mean(0), "task": "epigenetic_age_years",
                 "oof_metrics": age_metrics}, os.path.join(MODELS, "age_mlp.joblib"))

    idx_smk = topk_ttest(X, y, TOPK_SMK)
    sc_smk = StandardScaler().fit(X[:, idx_smk])
    Xfull_s, yfull_s = oversample(sc_smk.transform(X[:, idx_smk]), y, np.random.RandomState(SEED))
    final_smk = smoking_classifier().fit(Xfull_s, yfull_s)
    joblib.dump({"model": final_smk, "scaler": sc_smk, "cpgs": probes[idx_smk].tolist(),
                 "train_means": X[:, idx_smk].mean(0), "task": "smoking_current_vs_never",
                 "oof_metrics": smk_metrics}, os.path.join(MODELS, "smoking_mlp.joblib"))

    # strong validated smoking engine for inference (XGBoost) — REAL leakage-free OOF for THIS config
    oof_xgb = cv_smoking_xgb(X, y)
    pred_xgb = (oof_xgb >= 0.5).astype(int)
    tnx, fpx, fnx, tpx = confusion_matrix(y, pred_xgb).ravel()
    xgb_metrics = {
        "roc_auc": round(float(roc_auc_score(y, oof_xgb)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y, pred_xgb)), 4),
        "sensitivity_current": round(float(tpx / (tpx + fnx)) if (tpx + fnx) else float("nan"), 4),
        "specificity_never": round(float(tnx / (tnx + fpx)) if (tnx + fpx) else float("nan"), 4),
        "confusion": {"tn": int(tnx), "fp": int(fpx), "fn": int(fnx), "tp": int(tpx)},
        "topk_cpg": TOPK_SMK,
        "source": "leakage-free StratifiedKFold-5 OOF on GSE50660, this deployed XGBoost config",
    }
    print(f"  SMOKE-XGB OOF AUC={xgb_metrics['roc_auc']} "
          f"bacc={xgb_metrics['balanced_accuracy']} ({time.time()-t0:.0f}s)", flush=True)
    xgb_clf = smoking_xgb_clf(y)
    xgb_clf.fit(X[:, idx_smk], y)
    joblib.dump({"model": xgb_clf, "scaler": None, "cpgs": probes[idx_smk].tolist(),
                 "train_means": X[:, idx_smk].mean(0), "task": "smoking_current_vs_never_xgboost",
                 "oof_metrics": xgb_metrics},
                os.path.join(MODELS, "smoking_xgb.joblib"))

    out = {
        "system": "Deep-NN methylation reader (epigenetic age + smoking status)",
        "anchor_cohort": "GSE50660 (Illumina 450K, blood, n=201)",
        "architecture": "MLP (multilayer perceptron) hidden=(256,64) ReLU, Adam, early-stopping",
        "protocol": "Leakage-free CV: per-fold top-K selection + StandardScaler on TRAIN only; "
                    "seed=42. Final models refit on full data for inference (declared).",
        "age_regressor": age_metrics,
        "smoking_classifier": smk_metrics,
        "smoking_xgboost_deployed": xgb_metrics,
        "note": "Genuine replacement for the article's fabricated ensemble (MAE 2.1y/R2 0.96) and "
                "7-class 87.3%. A single cross-substance multi-disease model is NOT built because "
                "the substance cohorts use different platforms/tissues/tiny n (declared, not faked). "
                "Per-substance binary models are added separately (21_substance_models.py) and the "
                "inference CLI (predict.py) applies whichever models the input probes support.",
        "seed": SEED,
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    json.dump(out, open(os.path.join(OUT, "gse50660_dl.json"), "w"), indent=2)
    print("saved:", os.path.join(OUT, "gse50660_dl.json"),
          "+ models/age_mlp.joblib + models/smoking_mlp.joblib", f"({time.time()-t0:.0f}s)",
          flush=True)


if __name__ == "__main__":
    main()
