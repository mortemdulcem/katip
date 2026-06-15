#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
orbital_stats.py
====================================================================
Orbital morfometriden cinsiyet tayini istatistik boru hattı.
Girdi : scripts/data/orbital_dataset.csv  (orbital_export.cjs üretir)
Çıktı : scripts/output/orbital_stats.json + konsol raporu

Zero-hallucination / reproducibility (replit.md):
  * Tüm sayılar gerçek veriden hesaplanır; uydurma YOK.
  * Sabit seed = 42 (numpy + tüm modeller + CV bölücüler).
  * CSV'nin SHA-256 özeti rapora yazılır.
  * Veri yetersizse ilgili test "yetersiz veri" diye AÇIKÇA atlanır.

Yöntemler:
  - Betimsel istatistik (cinsiyete göre n, ortalama, SS)
  - Tek değişkenli: normallik (Shapiro) -> Welch t veya Mann-Whitney U,
    kesin p, etki büyüklüğü (Cohen d / rank-biserial), BH-FDR düzeltmesi
  - Asimetri: sağ-sol Wilcoxon signed-rank + cinsiyete göre |asimetri|
  - Çok değişkenli: LDA ve Random Forest, stratified k-fold CV
    (n küçükse LOOCV), accuracy/sensitivity/specificity
  - ROC-AUC + DeLong %95 GA (çapraz-doğrulanmış olasılıklardan)
  - ICC: yalnızca tekrarlı ölçüm dosyası varsa; yoksa açıkça atlanır

Çalıştırma:  python scripts/orbital_stats.py
"""
import json
import hashlib
import os
import sys
from datetime import datetime, timezone

import numpy as np

SEED = 42
np.random.seed(SEED)

HERE = os.path.dirname(os.path.abspath(__file__))
# Yollar ortam değişkeniyle override edilebilir (route per-request izole eder).
CSV = os.environ.get("ORBITAL_CSV", os.path.join(HERE, "data", "orbital_dataset.csv"))
OUT = os.environ.get("ORBITAL_OUT", os.path.join(HERE, "output", "orbital_stats.json"))
OUT_DIR = os.path.dirname(OUT)
RELIABILITY_CSV = os.environ.get(
    "ORBITAL_RELIABILITY_CSV", os.path.join(HERE, "data", "orbital_reliability.csv"))


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def jround(x, n=4):
    if x is None:
        return None
    try:
        if isinstance(x, (np.floating, np.integer)):
            x = float(x)
        if isinstance(x, float) and (np.isnan(x) or np.isinf(x)):
            return None
        return round(float(x), n)
    except (TypeError, ValueError):
        return x


# ---- DeLong %95 GA (Sun & Xu hızlı algoritması) ----------------------------
def _compute_midrank(x):
    J = np.argsort(x)
    Z = x[J]
    N = len(x)
    T = np.zeros(N, dtype=float)
    i = 0
    while i < N:
        j = i
        while j < N and Z[j] == Z[i]:
            j += 1
        T[i:j] = 0.5 * (i + j - 1) + 1
        i = j
    T2 = np.empty(N, dtype=float)
    T2[J] = T
    return T2


def _fast_delong(preds_sorted, m):
    # preds_sorted: ilk m pozitif, sonra negatif
    n = preds_sorted.shape[1] - m
    pos = preds_sorted[:, :m]
    neg = preds_sorted[:, m:]
    k = preds_sorted.shape[0]
    tx = np.empty((k, m), dtype=float)
    ty = np.empty((k, n), dtype=float)
    tz = np.empty((k, m + n), dtype=float)
    for r in range(k):
        tx[r, :] = _compute_midrank(pos[r, :])
        ty[r, :] = _compute_midrank(neg[r, :])
        tz[r, :] = _compute_midrank(preds_sorted[r, :])
    aucs = tz[:, :m].sum(axis=1) / m / n - (m + 1.0) / 2.0 / n
    v01 = (tz[:, :m] - tx[:, :]) / n
    v10 = 1.0 - (tz[:, m:] - ty[:, :]) / m
    sx = np.cov(v01)
    sy = np.cov(v10)
    delongcov = sx / m + sy / n
    return aucs, delongcov


def delong_auc_ci(y_true, y_score, alpha=0.05):
    """y_true: 0/1, y_score: pozitif sınıf olasılığı. (auc, lo, hi, se) döner."""
    from scipy import stats as _st
    y_true = np.asarray(y_true)
    y_score = np.asarray(y_score, dtype=float)
    order = (-y_true).argsort(kind="mergesort")
    label_1_count = int(y_true.sum())
    if label_1_count == 0 or label_1_count == len(y_true):
        return None, None, None, None
    preds_sorted = y_score[order].reshape(1, -1)
    aucs, cov = _fast_delong(preds_sorted, label_1_count)
    auc = float(aucs[0])
    se = float(np.sqrt(cov)) if np.ndim(cov) == 0 else float(np.sqrt(cov[0, 0]))
    if se == 0 or np.isnan(se):
        return jround(auc), jround(auc), jround(auc), 0.0
    z = _st.norm.ppf(1 - alpha / 2)
    lo, hi = auc - z * se, auc + z * se
    return jround(auc), jround(max(0.0, lo)), jround(min(1.0, hi)), jround(se)


def main():
    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "seed": SEED,
        "input": os.path.relpath(CSV, os.getcwd()),
    }

    if not os.path.exists(CSV):
        print("HATA: veri dosyası yok. Önce: node scripts/orbital_export.cjs")
        report["error"] = "dataset_missing"
        _write(report)
        return

    import pandas as pd
    report["datasetSha256"] = sha256_file(CSV)
    df = pd.read_csv(CSV)
    report["nTotal"] = int(len(df))

    # Cinsiyet etiketi: K=0 (kadın), E=1 (erkek). Diğerleri elenir.
    df = df[df["sex"].isin(["K", "E"])].copy()
    df["y"] = (df["sex"] == "E").astype(int)
    n_f = int((df["y"] == 0).sum())
    n_m = int((df["y"] == 1).sum())
    report["nFemale"] = n_f
    report["nMale"] = n_m

    feat_cols = [c for c in df.columns
                 if c not in ("code", "sex", "age", "coordinateSystem", "y")]
    report["features"] = feat_cols

    # Eksiklik raporu (dürüstlük): her özellik için dolu oran.
    miss = {c: jround(float(df[c].isna().mean()), 3) for c in feat_cols}
    report["missingFraction"] = miss

    if len(df) == 0:
        print("UYARI: K/E cinsiyetli olgu yok — analiz yapılamadı.")
        report["warning"] = "no_sexed_cases"
        _write(report)
        return

    # ---- Betimsel istatistik ----
    desc = {}
    for c in feat_cols:
        g0 = df.loc[df.y == 0, c].dropna()
        g1 = df.loc[df.y == 1, c].dropna()
        desc[c] = {
            "female": {"n": int(g0.size), "mean": jround(g0.mean()), "sd": jround(g0.std(ddof=1))},
            "male": {"n": int(g1.size), "mean": jround(g1.mean()), "sd": jround(g1.std(ddof=1))},
        }
    report["descriptive"] = desc

    # ---- Tek değişkenli karşılaştırma ----
    from scipy import stats
    univ = {}
    pvals, pkeys = [], []
    for c in feat_cols:
        g0 = df.loc[df.y == 0, c].dropna().values
        g1 = df.loc[df.y == 1, c].dropna().values
        if g0.size < 3 or g1.size < 3:
            univ[c] = {"test": None, "reason": "yetersiz n (her grup >=3 gerekir)",
                       "nFemale": int(g0.size), "nMale": int(g1.size)}
            continue
        # Normallik
        try:
            normal = (stats.shapiro(g0).pvalue > 0.05 and stats.shapiro(g1).pvalue > 0.05)
        except Exception:
            normal = False
        if normal:
            t, p = stats.ttest_ind(g0, g1, equal_var=False)  # Welch
            sp = np.sqrt(((g0.size - 1) * g0.var(ddof=1) + (g1.size - 1) * g1.var(ddof=1))
                         / (g0.size + g1.size - 2))
            d = (g1.mean() - g0.mean()) / sp if sp > 0 else None
            univ[c] = {"test": "Welch t", "statistic": jround(t), "p": jround(p, 6),
                       "cohenD": jround(d), "nFemale": int(g0.size), "nMale": int(g1.size)}
        else:
            u, p = stats.mannwhitneyu(g0, g1, alternative="two-sided")
            rbc = 1 - (2 * u) / (g0.size * g1.size)  # rank-biserial
            univ[c] = {"test": "Mann-Whitney U", "statistic": jround(u), "p": jround(p, 6),
                       "rankBiserial": jround(rbc), "nFemale": int(g0.size), "nMale": int(g1.size)}
        pvals.append(p)
        pkeys.append(c)

    # BH-FDR düzeltmesi
    if pvals:
        from statsmodels.stats.multitest import multipletests
        rej, padj, _, _ = multipletests(pvals, alpha=0.05, method="fdr_bh")
        for k, pa, rj in zip(pkeys, padj, rej):
            univ[k]["pAdjBH"] = jround(float(pa), 6)
            univ[k]["sigBH"] = bool(rj)
    report["univariate"] = univ

    # ---- Asimetri (sağ-sol) ----
    asym = {}
    base = sorted({c[:-2] for c in feat_cols if c.endswith("_R")
                   and (c[:-2] + "_L") in feat_cols})
    for b in base:
        R = df[b + "_R"].values.astype(float)
        L = df[b + "_L"].values.astype(float)
        mask = ~(np.isnan(R) | np.isnan(L))
        R, L, yy = R[mask], L[mask], df["y"].values[mask]
        entry = {"nPairs": int(mask.sum())}
        if mask.sum() >= 5:
            try:
                w, pw = stats.wilcoxon(R, L)
                entry["wilcoxon"] = {"statistic": jround(w), "p": jround(pw, 6),
                                     "meanSignedDiff": jround(np.mean(R - L))}
            except ValueError as e:
                entry["wilcoxon"] = {"error": str(e)}
            ad = np.abs(R - L)
            a0, a1 = ad[yy == 0], ad[yy == 1]
            if a0.size >= 3 and a1.size >= 3:
                u, pu = stats.mannwhitneyu(a0, a1, alternative="two-sided")
                entry["absAsymBySex"] = {"test": "Mann-Whitney U", "p": jround(pu, 6),
                                         "femaleMedian": jround(np.median(a0)),
                                         "maleMedian": jround(np.median(a1))}
        else:
            entry["note"] = "yetersiz çift (>=5 gerekir)"
        asym[b] = entry
    report["asymmetry"] = asym

    # ---- Çok değişkenli modeller ----
    report["models"] = run_models(df, feat_cols)

    # ---- ICC (yalnızca tekrarlı ölçüm varsa) ----
    report["icc"] = run_icc()

    _write(report)
    _print_summary(report)


def run_models(df, feat_cols):
    out = {}
    n_f = int((df.y == 0).sum())
    n_m = int((df.y == 1).sum())
    min_class = min(n_f, n_m)
    if min_class < 3 or len(df) < 10:
        out["status"] = "skipped"
        out["reason"] = (f"yetersiz veri (kadın={n_f}, erkek={n_m}); model için "
                         f"her sınıfta >=3 ve toplam >=10 gerekir")
        return out

    from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.impute import SimpleImputer
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import Pipeline
    from sklearn.model_selection import StratifiedKFold, LeaveOneOut, cross_val_predict
    from sklearn.metrics import confusion_matrix, accuracy_score

    X = df[feat_cols].values.astype(float)
    y = df["y"].values.astype(int)

    # Küçük n'de (her sınıf 3-4) LOOCV; yeterli n'de stratified k-fold.
    if min_class >= 5:
        n_splits = min(5, min_class)
        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=SEED)
        cv_name = f"StratifiedKFold(k={n_splits})"
    else:
        cv = LeaveOneOut()
        cv_name = "LeaveOneOut"
    out["cv"] = cv_name
    out["nFeatures"] = len(feat_cols)

    defs = {
        "LDA": Pipeline([
            ("imp", SimpleImputer(strategy="median")),
            ("sc", StandardScaler()),
            ("clf", LinearDiscriminantAnalysis()),
        ]),
        "RandomForest": Pipeline([
            ("imp", SimpleImputer(strategy="median")),
            ("clf", RandomForestClassifier(n_estimators=500, random_state=SEED, n_jobs=1)),
        ]),
    }
    results = {}
    for name, pipe in defs.items():
        try:
            proba = cross_val_predict(pipe, X, y, cv=cv, method="predict_proba")[:, 1]
            pred = (proba >= 0.5).astype(int)
            tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
            sens = tp / (tp + fn) if (tp + fn) else None  # erkek doğru
            spec = tn / (tn + fp) if (tn + fp) else None  # kadın doğru
            auc, lo, hi, se = delong_auc_ci(y, proba)
            res = {
                "accuracy": jround(accuracy_score(y, pred)),
                "sensitivityMale": jround(sens),
                "specificityFemale": jround(spec),
                "rocAuc": auc,
                "rocAuc95CI": [lo, hi],
                "rocAucSE": se,
                "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
            }
            if name == "RandomForest":
                pipe.fit(X, y)
                imp = pipe.named_steps["clf"].feature_importances_
                order = np.argsort(imp)[::-1]
                res["featureImportance"] = [
                    {"feature": feat_cols[i], "importance": jround(float(imp[i]))}
                    for i in order
                ]
            results[name] = res
        except Exception as e:
            results[name] = {"error": str(e)}
    out["status"] = "ok"
    out["results"] = results
    return out


def run_icc():
    if not os.path.exists(RELIABILITY_CSV):
        return {"status": "skipped",
                "reason": ("tekrarlı ölçüm verisi yok (scripts/data/orbital_reliability.csv). "
                           "Gözlemci-içi/arası güvenilirlik için aynı olguların 2. ölçümü gerekir.")}
    import pandas as pd
    import pingouin as pg
    df = pd.read_csv(RELIABILITY_CSV)
    # Beklenen uzun format: targets(olgu), raters(ölçüm), ratings(değer)
    needed = {"targets", "raters", "ratings"}
    if not needed.issubset(df.columns):
        return {"status": "error",
                "reason": f"orbital_reliability.csv sütunları {needed} olmalı"}
    icc = pg.intraclass_corr(data=df, targets="targets", raters="raters", ratings="ratings")
    rows = []
    for _, r in icc.iterrows():
        rows.append({"type": r["Type"], "ICC": jround(r["ICC"]),
                     "CI95": [jround(r["CI95%"][0]), jround(r["CI95%"][1])],
                     "p": jround(r["pval"], 6)})
    return {"status": "ok", "results": rows}


def _write(report):
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\nJSON yazıldı: {os.path.relpath(OUT, os.getcwd())}")


def _print_summary(r):
    print("=" * 60)
    print("ORBİTAL MORFOMETRİ — CİNSİYET TAYİNİ İSTATİSTİK ÖZETİ")
    print("=" * 60)
    print(f"Olgu: {r.get('nTotal', 0)} (kadın={r.get('nFemale')}, erkek={r.get('nMale')})")
    print(f"Veri SHA-256: {r.get('datasetSha256', '-')[:16]}...  | seed={r['seed']}")
    m = r.get("models", {})
    if m.get("status") == "ok":
        print(f"\nÇapraz doğrulama: {m['cv']} | {m['nFeatures']} özellik")
        for name, res in m["results"].items():
            if "error" in res:
                print(f"  {name}: HATA {res['error']}")
                continue
            ci = res["rocAuc95CI"]
            print(f"  {name}: doğruluk={res['accuracy']} | "
                  f"AUC={res['rocAuc']} (95%GA {ci[0]}-{ci[1]}) | "
                  f"duyarlılık(E)={res['sensitivityMale']} özgüllük(K)={res['specificityFemale']}")
    else:
        print(f"\nModeller atlandı: {m.get('reason', '-')}")
    icc = r.get("icc", {})
    if icc.get("status") != "ok":
        print(f"ICC: {icc.get('reason', 'atlandı')}")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
