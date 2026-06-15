#!/usr/bin/env python3
"""
23_chronology.py - MODULE #1 "Epigenetik Kronoloji Rekonstrüksiyonu" (REAL, reproducible).

The article's fabricated EPICLOCK v4.0 claimed it could reconstruct the *chronology* of an
exposure (active vs past vs never) from a single methylation profile. That capability is
genuinely buildable for the ONE public substance axis that carries recency labels: tobacco.
GSE50660 (Illumina 450K, whole blood) annotates every subject as

    never (0, n=179) | former (1, n=263) | current (2, n=22)

i.e. a real temporal axis never -> former -> current. We train a leakage-free 3-class
"exposure-recency" reader and report:
  * 3-class balanced accuracy + macro one-vs-rest AUC + confusion matrix
  * the three clinically meaningful contrasts derived from the SAME out-of-fold probabilities:
      current vs never  (is exposure detectable at all)
      former  vs never  (do PAST-exposure marks PERSIST after quitting  <- the chronology core)
      current vs former (is the exposure ACTIVE or historical  <- recency)
  * epigenetic age-acceleration per recency group (continuous biological-time axis,
    from out/gse50660_clock_per_sample.csv).

Zero-Hallucination / rigour:
  * Candidate probe pool = deterministic CRC32-hashed ~11% subset, chosen WITHOUT labels
    (leakage-free, identical scheme to 21_substance_models.py).
  * StratifiedKFold(5, seed 42); per fold: ANOVA F-test top-K selection on TRAIN only,
    class-balanced sample weights on TRAIN only, XGBoost multi:softprob.
  * Final model refit on full data for inference; the UNBIASED numbers are the OOF ones.

Generalisation honesty: only tobacco has never/former/current public labels, so the
reconstruction is demonstrated for the tobacco axis; other substances need comparable
recency-labelled cohorts (declared, not faked).

Inputs : data/GSE50660_series_matrix.txt.gz, out/gse50660_clock_per_sample.csv
Outputs: out/dl/chronology.json, out/dl/models/chronology_smoking.joblib
Run    : python3 scripts/23_chronology.py
"""
import gzip
import json
import os
import re
import time
import zlib

os.environ.setdefault("OMP_NUM_THREADS", "2")
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold
from sklearn.feature_selection import f_classif
from sklearn.metrics import (balanced_accuracy_score, roc_auc_score,
                             confusion_matrix)
from sklearn.utils.class_weight import compute_sample_weight
import xgboost as xgb
import joblib

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
OUT = os.path.abspath(os.path.join(HERE, "..", "out", "dl"))
MODELS = os.path.join(OUT, "models")
SERIES = os.path.join(DATA, "GSE50660_series_matrix.txt.gz")
CHRONO_CACHE = os.path.join(DATA, "gse50660_chrono_cache.npz")
CLOCK = os.path.abspath(os.path.join(HERE, "..", "out", "gse50660_clock_per_sample.csv"))
os.makedirs(MODELS, exist_ok=True)
SEED = 42
KEEP_PCT = 110          # CRC32 %1000 < 110 -> ~11% label-blind candidate probes
TOPK = 400
CLASSES = {0: "never", 1: "former", 2: "current"}
np.random.seed(SEED)


def keep_probe(p):
    return (zlib.crc32(p.encode()) % 1000) < KEEP_PCT


def _f(x):
    try:
        return float(x)
    except ValueError:
        return np.nan


def parse():
    """Stream GSE50660; return betas (samples x probes), 3-class smoking y, probes."""
    gsms, chars = None, []
    probes, rows, thdr = [], [], None
    in_tbl = False
    with gzip.open(SERIES, "rt", errors="replace") as f:
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
            probes.append(probe)
            rows.append(np.array([_f(x) for x in parts[1:]], dtype=np.float32))
    M = np.array(rows, dtype=np.float32).T          # table-column order
    col_gsms = thdr[1:]
    # smoking value per GSM (the characteristic line containing "smoking")
    smk = {}
    if gsms:
        for ch in chars:
            if any("smok" in v.lower() for v in ch):
                for g, v in zip(gsms, ch):
                    m = re.search(r":\s*([0-2])\s*$", v)
                    if m:
                        smk[g] = int(m.group(1))
                break
    y = np.array([smk.get(g, -1) for g in col_gsms])
    keep = y >= 0
    return M[keep], y[keep], np.array(probes), np.array(col_gsms)[keep]


def impute(M):
    col_mean = np.nanmean(M, axis=0)
    col_mean = np.where(np.isfinite(col_mean), col_mean, 0.5)
    idx = np.where(~np.isfinite(M))
    M[idx] = np.take(col_mean, idx[1])
    return M


def topk_f(Xtr, ytr, k):
    F, _ = f_classif(Xtr, ytr)
    return np.argsort(-np.nan_to_num(F, nan=-1.0))[:k]


def model():
    return xgb.XGBClassifier(objective="multi:softprob", num_class=3, n_estimators=150,
                             max_depth=3, learning_rate=0.1, subsample=0.8,
                             colsample_bytree=0.8, tree_method="hist", eval_metric="mlogloss",
                             n_jobs=2, random_state=SEED, verbosity=0)


def pair_auc(y, proba, a, b):
    """OOF AUC for class b vs class a using P(b)/(P(a)+P(b)) on those two classes only."""
    m = np.isin(y, [a, b])
    yb = (y[m] == b).astype(int)
    denom = proba[m][:, a] + proba[m][:, b]
    score = np.divide(proba[m][:, b], denom, out=np.full(m.sum(), 0.5), where=denom > 0)
    if yb.sum() == 0 or yb.sum() == len(yb):
        return None
    return round(float(roc_auc_score(yb, score)), 4)


def age_accel_by_group():
    if not os.path.exists(CLOCK):
        return None
    df = pd.read_csv(CLOCK)
    if "smoking" not in df.columns or "age_accel" not in df.columns:
        return None
    out = {}
    for k, name in CLASSES.items():
        g = df[df["smoking"] == k]["age_accel"].dropna()
        if len(g):
            out[name] = {"n": int(len(g)), "mean_age_accel_years": round(float(g.mean()), 3),
                         "sd": round(float(g.std(ddof=1)), 3) if len(g) > 1 else None}
    return out


def load_or_parse():
    if os.path.exists(CHRONO_CACHE):
        z = np.load(CHRONO_CACHE, allow_pickle=True)
        print(f"cache hit {CHRONO_CACHE}", flush=True)
        return (z["M"].astype(np.float32), z["y"].astype(int),
                np.array([str(p) for p in z["probes"]]),
                np.array([str(g) for g in z["gsms"]]))
    M, y, probes, gsms = parse()
    np.savez_compressed(CHRONO_CACHE, M=M, y=y, probes=probes, gsms=gsms)
    print(f"cache saved {CHRONO_CACHE}", flush=True)
    return M, y, probes, gsms


def main():
    t0 = time.time()
    M, y, probes, gsms = load_or_parse()
    M = impute(M)
    counts = {CLASSES[k]: int((y == k).sum()) for k in CLASSES}
    print(f"loaded X={M.shape} classes={counts} ({time.time()-t0:.0f}s)", flush=True)

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    oof = np.zeros((len(y), 3))
    for fi, (tr, te) in enumerate(skf.split(M, y), 1):
        idx = topk_f(M[tr], y[tr], TOPK)
        sw = compute_sample_weight("balanced", y[tr])
        m = model().fit(M[tr][:, idx], y[tr], sample_weight=sw)
        oof[te] = m.predict_proba(M[te][:, idx])
        print(f"    fold {fi}/5 done ({time.time()-t0:.0f}s)", flush=True)
    pred = oof.argmax(1)
    cm = confusion_matrix(y, pred, labels=[0, 1, 2])
    macro_auc = round(float(roc_auc_score(y, oof, multi_class="ovr",
                                          average="macro", labels=[0, 1, 2])), 4)
    metrics = {
        "module": "Epigenetik Kronoloji Rekonstruksiyonu (#1)",
        "axis": "tobacco exposure recency (never/former/current)",
        "dataset": "GSE50660 (Illumina 450K, whole blood)",
        "n": int(len(y)), "class_counts": counts,
        "candidate_probes": int(M.shape[1]), "topk": TOPK,
        "balanced_accuracy_3class": round(float(balanced_accuracy_score(y, pred)), 4),
        "macro_auc_ovr": macro_auc,
        "contrasts_oof_auc": {
            "current_vs_never": pair_auc(y, oof, 0, 2),
            "former_vs_never": pair_auc(y, oof, 0, 1),
            "current_vs_former": pair_auc(y, oof, 1, 2),
        },
        "confusion_rows_true_never_former_current": cm.tolist(),
        "age_acceleration_by_group": age_accel_by_group(),
        "protocol": "leakage-free StratifiedKFold(5,seed42); per-fold ANOVA-F top-K on TRAIN; "
                    "class-balanced sample weights; XGBoost multi:softprob; CRC32 label-blind pool",
        "seed": SEED,
        "interpretation": {
            "former_vs_never": "AUC>0.5 means PAST tobacco exposure leaves persisting methylation "
                               "marks detectable after quitting (chronology/history reconstruction).",
            "current_vs_former": "AUC>0.5 means active vs historical exposure is separable (recency).",
        },
        "limitation": "Only tobacco has public never/former/current labels; reconstruction is "
                      "demonstrated for the tobacco axis. Other substances need comparable "
                      "recency-labelled cohorts (declared, not faked).",
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    print(f"  3-class bacc={metrics['balanced_accuracy_3class']} macroAUC={macro_auc} "
          f"contrasts={metrics['contrasts_oof_auc']} ({time.time()-t0:.0f}s)", flush=True)

    # final model on full data for inference
    idx = topk_f(M, y, TOPK)
    sw = compute_sample_weight("balanced", y)
    final = model().fit(M[:, idx], y, sample_weight=sw)
    joblib.dump({"model": final, "scaler": None, "cpgs": probes[idx].tolist(),
                 "train_means": M[:, idx].mean(0), "classes": CLASSES,
                 "task": "tobacco_recency_never_former_current", "oof_metrics": metrics},
                os.path.join(MODELS, "chronology_smoking.joblib"))
    json.dump(metrics, open(os.path.join(OUT, "chronology.json"), "w"), indent=2)
    print("saved out/dl/chronology.json + models/chronology_smoking.joblib", flush=True)


if __name__ == "__main__":
    main()
