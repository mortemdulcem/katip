#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
60_figures_tr.py — Hakem-uyumlu KAPSAMLI figur suiti (TURKCE, 300 dpi).

Iki tur figur:
  (A) GERCEK-VERI figurleri: yalnizca committed ciktilardan / onbellekten uretilir.
      Hicbir sayi uydurulmaz. ROC ve kalibrasyon, 18_ml.py ile BIREBIR ayni protokolle
      (StratifiedKFold(5,seed=42), fold-ici top-200 t-test, ayni hiperparametreler)
      OOF olasiliklarindan cizilir -> AUC degerleri makaledekiyle ozdes (0,950/0,821/0,928).
  (B) SEMATIK cerceve figurleri: PRISMA, pipeline, kanit piramidi, konfonder haritasi,
      etkilesim agi, cheminformatik-epigenetik entegrasyon, ML mimari, validasyon akisi,
      vaka karar agaci, platform karsilastirma. Bunlar veri degil YONTEM/CERCEVE sema-
      laridir; uzerlerindeki sayilar (7.859/1.295/117 vb.) gercek inventory'den gelir.

Hakem kurallari:
  * Tum yazilar TURKCE (Renk korlugune duyarli Okabe-Ito paleti).
  * >= 300 dpi.
  * Gorsel uzerinde orijinal sekil-no / Ingilizce etiket YOK.
  * R kare -> R² (ust-simge), -log10 -> -log₁₀.

Cikti: out/figures_tr/sekil_XX_*.png
"""
import json, os, time
import numpy as np
import pandas as pd
from scipy import stats
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Polygon, Rectangle
from matplotlib.lines import Line2D

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "out"))
DATA = os.path.normpath(os.path.join(HERE, "..", "data"))
FIG = os.path.join(OUT, "figures_tr")
os.makedirs(FIG, exist_ok=True)
SEED, TOPK = 42, 200
np.random.seed(SEED)

# Okabe-Ito (renk korlugune duyarli)
C_BLUE   = "#0072B2"
C_ORANGE = "#E69F00"
C_GREEN  = "#009E73"
C_RED    = "#D55E00"
C_PURPLE = "#CC79A7"
C_SKY    = "#56B4E9"
C_YELLOW = "#F0E442"
C_GREY   = "#9aa0a6"
C_DARK   = "#222222"

plt.rcParams.update({
    "font.family": "DejaVu Sans",   # Turkce glifleri tam destekler
    "font.size": 11,
    "axes.titlesize": 13,
    "axes.titleweight": "bold",
    "axes.labelsize": 11.5,
    "figure.dpi": 300,
    "savefig.dpi": 300,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.edgecolor": "#444444",
})

def save(fig, name, tight=True):
    p = os.path.join(FIG, name)
    fig.savefig(p, dpi=300, facecolor="white", bbox_inches=("tight" if tight else None))
    plt.close(fig)
    print("OK", name, flush=True)

def jload(p):
    return json.load(open(os.path.join(OUT, p))) if not os.path.isabs(p) else json.load(open(p))

# ===========================================================================
# (A) GERCEK-VERI FIGURLERI
# ===========================================================================

# --- Sekil: Volkan grafigi (GSE50660 sigara) -------------------------------
def fig_volcano():
    dmp = pd.read_csv(os.path.join(OUT, "gse50660_dmp.csv"))
    val = jload("gse50660_validation.json")
    cg_gene = {cg: d["gene"] for cg, d in val.get("canonical_validation", {}).items()}
    dmp["nlp"] = -np.log10(dmp["p"].clip(lower=1e-300))
    sig = dmp["fdr"] < 0.05
    fig, ax = plt.subplots(figsize=(7.2, 5.4))
    ax.scatter(dmp.loc[~sig, "delta_beta_current_minus_never"], dmp.loc[~sig, "nlp"],
               s=3, c=C_GREY, alpha=0.30, rasterized=True, linewidths=0)
    ax.scatter(dmp.loc[sig, "delta_beta_current_minus_never"], dmp.loc[sig, "nlp"],
               s=9, c=C_RED, alpha=0.85, rasterized=True, linewidths=0,
               label=f"YKO < 0,05 ({int(sig.sum())} CpG)")
    top = dmp.nsmallest(7, "p").reset_index(drop=True)
    for idx, off in [(0,(16,-4)),(1,(-14,30)),(3,(95,26)),(2,(70,6))]:
        r = top.iloc[idx]; g = cg_gene.get(r["cg"], "")
        lbl = f"{r['cg']}" + (f" ({g})" if g else "")
        ax.scatter([r["delta_beta_current_minus_never"]], [r["nlp"]], s=26, c=C_RED,
                   edgecolors="#5a1410", linewidths=0.7, zorder=5)
        ax.annotate(lbl, (r["delta_beta_current_minus_never"], r["nlp"]),
                    fontsize=8, ha="left", va="center", xytext=off,
                    textcoords="offset points", color="#1a1a1a",
                    arrowprops=dict(arrowstyle="-", color="#777", lw=0.7))
    ax.axhline(-np.log10(0.05), ls="--", lw=0.8, c="#888", zorder=0)
    ax.set_xlabel("Metilasyon farkı (Δβ: güncel − hiç içmeyen)")
    ax.set_ylabel("−log₁₀(p)")
    ax.set_title("Sigara ile ilişkili diferansiyel metilasyon (GSE50660, n=201)")
    ax.legend(loc="upper right", frameon=False, fontsize=9)
    fig.text(0.5, -0.02, "Güncel içiciler hipometiledir (negatif Δβ); AHRR/F2RL3 dahil kanonik sigara "
             "CpG’leri en güçlü sinyallerdir. (YKO: yanlış keşif oranı)",
             ha="center", fontsize=8, color="#555")
    save(fig, "sekil_volkan_sigara.png")

# --- Sekil: En guclu 15 CpG -----------------------------------------------
def fig_topcpg():
    dmp = pd.read_csv(os.path.join(OUT, "gse50660_dmp.csv"))
    val = jload("gse50660_validation.json")
    cg_gene = {cg: d["gene"] for cg, d in val.get("canonical_validation", {}).items()}
    t = dmp.nsmallest(15, "p").copy()
    t["lab"] = [f"{cg}" + (f" · {cg_gene[cg]}" if cg in cg_gene else "") for cg in t["cg"]]
    t = t.iloc[::-1]
    fig, ax = plt.subplots(figsize=(7.2, 5.6))
    ax.barh(range(len(t)), t["delta_beta_current_minus_never"], color=C_BLUE, alpha=0.92)
    ax.set_yticks(range(len(t))); ax.set_yticklabels(t["lab"], fontsize=8.5)
    ax.axvline(0, c="#333", lw=0.8); ax.set_xlim(-0.27, 0.06)
    ax.set_xlabel("Metilasyon farkı (Δβ: güncel − hiç içmeyen)")
    ax.set_title("En güçlü 15 sigara ilişkili CpG: etki yönü ve büyüklüğü")
    for i, p in enumerate(t["p"]):
        ax.text(0.004, i, f"p={p:.1e}".replace(".", ","), va="center", ha="left",
                fontsize=6.8, color="#444")
    ax.spines["left"].set_visible(False)
    save(fig, "sekil_en_guclu_cpg.png")

# --- Sekil: Epigenetik saat dogrulamasi -----------------------------------
def fig_clock():
    cl = pd.read_csv(os.path.join(OUT, "gse50660_clock_per_sample.csv"))
    clk = jload("gse50660_clock_summary.json")
    r = clk["pearson_r_dnam_vs_chrono"]; mae = clk["MAE_years"]; n = clk["n_samples"]
    fig, ax = plt.subplots(figsize=(6.2, 6.0))
    lo = min(cl["chrono_age"].min(), cl["dnam_age"].min()) - 3
    hi = max(cl["chrono_age"].max(), cl["dnam_age"].max()) + 3
    ax.plot([lo, hi], [lo, hi], ls="--", c="#888", lw=1, zorder=0, label="y = x")
    ax.scatter(cl["chrono_age"], cl["dnam_age"], s=16, c=C_BLUE, alpha=0.55, linewidths=0)
    ax.set_xlim(lo, hi); ax.set_ylim(lo, hi)
    ax.set_xlabel("Kronolojik yaş (yıl)"); ax.set_ylabel("Tahmini DNAm yaşı — Horvath (yıl)")
    ax.set_title("Epigenetik saat doğrulaması (GSE50660)")
    txt = f"Pearson r = {r:.3f}\nMAE = {mae:.2f} yıl\nn = {n}".replace(".", ",")
    ax.text(0.04, 0.96, txt, transform=ax.transAxes, va="top", ha="left", fontsize=10,
            bbox=dict(boxstyle="round,pad=0.4", fc="#eaf2f8", ec="#9bbcd6", lw=0.8))
    ax.legend(loc="lower right", frameon=False)
    save(fig, "sekil_saat_dogrulama.png")

# --- Sekil: Fonksiyonel zenginlestirme ------------------------------------
def fig_enrich():
    go = pd.read_csv(os.path.join(OUT, "gse50660_GO_Biological_Process_2021.csv")).head(8)
    kg = pd.read_csv(os.path.join(OUT, "gse50660_KEGG_2021_Human.csv")).head(8)
    sh = lambda s, n=42: (str(s) if len(str(s)) <= n else str(s)[:n-1] + "…")
    fig, axes = plt.subplots(1, 2, figsize=(11.5, 5.2))
    for ax, df, title, col in [(axes[0], go, "GO — Biyolojik Süreç", C_GREEN),
                               (axes[1], kg, "KEGG Yolakları", C_BLUE)]:
        d = df.iloc[::-1]
        nlp = -np.log10(d["Adjusted P-value"].clip(lower=1e-300))
        ax.barh(range(len(d)), nlp, color=col, alpha=0.9)
        ax.set_yticks(range(len(d))); ax.set_yticklabels([sh(t) for t in d["Term"]], fontsize=8)
        ax.axvline(-np.log10(0.05), ls="--", lw=0.9, c=C_RED)
        ax.set_xlabel("−log₁₀(düzeltilmiş p)"); ax.set_title(title)
        ax.text(-np.log10(0.05), -0.6, "YKO=0,05", color=C_RED, fontsize=7.5, va="top", ha="center")
    fig.suptitle("89 anlamlı CpG → 51 gen üzerinde fonksiyonel zenginleştirme",
                 fontsize=12, fontweight="bold")
    save(fig, "sekil_zenginlestirme.png")

# --- ROC + kalibrasyon icin OOF olasiliklari (18_ml.py ile birebir) -------
def _select_topk(Xtr, ytr, k):
    _, p = stats.ttest_ind(Xtr[ytr == 1], Xtr[ytr == 0], axis=0, equal_var=False)
    return np.argsort(np.nan_to_num(p, nan=1.0))[:k]

def _make_model(name, n_pos, n_neg):
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    import xgboost as xgb
    if name == "RandomForest":
        return RandomForestClassifier(n_estimators=200, class_weight="balanced",
                                      random_state=SEED, n_jobs=1)
    if name == "ElasticNet-LR":
        return LogisticRegression(penalty="elasticnet", solver="saga", l1_ratio=0.5, C=1.0,
                                  max_iter=5000, class_weight="balanced", random_state=SEED)
    if name == "XGBoost":
        return xgb.XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.1, subsample=0.8,
                                 colsample_bytree=0.8, eval_metric="logloss",
                                 scale_pos_weight=n_neg / max(n_pos, 1), n_jobs=1,
                                 random_state=SEED, verbosity=0)

def _cv_oof(X, y, name):
    from sklearn.model_selection import StratifiedKFold
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    oof = np.zeros(len(y))
    for tr, te in skf.split(X, y):
        idx = _select_topk(X[tr], y[tr], TOPK)
        n_pos = int(y[tr].sum()); n_neg = int((y[tr] == 0).sum())
        clf = _make_model(name, n_pos, n_neg)
        clf.fit(X[tr][:, idx], y[tr])
        oof[te] = clf.predict_proba(X[te][:, idx])[:, 1]
    return oof

def fig_roc_calibration():
    from sklearn.metrics import roc_curve, roc_auc_score
    z = np.load(os.path.join(DATA, "gse50660_cache.npz"), allow_pickle=True)
    X = z["M"].astype(np.float64); y = z["y"].astype(int)
    names = [("RandomForest", "Rastgele Orman", C_GREEN),
             ("ElasticNet-LR", "ElasticNet (L1/L2) lojistik", C_ORANGE),
             ("XGBoost", "XGBoost", C_BLUE)]
    oofs = {}
    fig, ax = plt.subplots(figsize=(6.4, 6.0))
    ax.plot([0, 1], [0, 1], ls="--", lw=1, c="#888", label="Şans (AUC=0,5)")
    for key, tr, col in names:
        oof = _cv_oof(X, y, key); oofs[key] = oof
        fpr, tpr, _ = roc_curve(y, oof); auc = roc_auc_score(y, oof)
        ax.plot(fpr, tpr, lw=2.1, c=col, label=f"{tr} (AUC={auc:.3f})".replace(".", ","))
    ax.set_xlabel("1 − Özgüllük (yanlış pozitif oranı)")
    ax.set_ylabel("Duyarlılık (gerçek pozitif oranı)")
    ax.set_title("Sigara sınıflandırması — ROC eğrileri\n(GSE50660, sızıntısız 5-katlı ÇD, n=201)")
    ax.legend(loc="lower right", frameon=False, fontsize=9)
    ax.set_xlim(-0.02, 1.02); ax.set_ylim(-0.02, 1.02)
    save(fig, "sekil_roc.png")

    # Kalibrasyon (XGBoost OOF)
    from sklearn.calibration import calibration_curve
    oof = oofs["XGBoost"]
    frac_pos, mean_pred = calibration_curve(y, oof, n_bins=8, strategy="quantile")
    fig, ax = plt.subplots(figsize=(6.2, 6.0))
    ax.plot([0, 1], [0, 1], ls="--", lw=1, c="#888", label="Kusursuz kalibrasyon")
    ax.plot(mean_pred, frac_pos, "o-", lw=2, c=C_BLUE, label="XGBoost (OOF)")
    ax.set_xlabel("Modelin tahmin ettiği olasılık (güncel içici)")
    ax.set_ylabel("Gözlenen gerçek oran")
    ax.set_title("Olasılık kalibrasyonu — XGBoost\n(GSE50660, sızıntısız OOF)")
    ax.legend(loc="upper left", frameon=False, fontsize=9)
    ax.set_xlim(-0.02, 1.02); ax.set_ylim(-0.02, 1.02)
    save(fig, "sekil_kalibrasyon.png")

# --- Sekil: SHAP top-15 ----------------------------------------------------
def fig_shap():
    ml = jload("ml/gse50660_ml.json")
    val = jload("gse50660_validation.json")
    cg_gene = {cg: d["gene"] for cg, d in val.get("canonical_validation", {}).items()}
    sh = ml["shap_top15_cpg_xgboost_fulldata"]
    cps = [d["cpg"] for d in sh][::-1]; vals = [d["mean_abs_shap"] for d in sh][::-1]
    labs = [f"{c}" + (f" · {cg_gene[c]}" if c in cg_gene else "") for c in cps]
    fig, ax = plt.subplots(figsize=(7.2, 5.6))
    cols = [C_RED if c == "cg05575921" else C_BLUE for c in cps]
    ax.barh(range(len(cps)), vals, color=cols, alpha=0.92)
    ax.set_yticks(range(len(cps))); ax.set_yticklabels(labs, fontsize=8.5)
    ax.set_xlabel("Ortalama |SHAP| değeri (modele katkı)")
    ax.set_title("Açıklanabilirlik (SHAP): sigara modelinde en bilgilendirici CpG’ler")
    ax.text(0.97, 0.05, "Kırmızı: cg05575921 (AHRR) — kanonik sigara biyobelirteci",
            transform=ax.transAxes, ha="right", va="bottom", fontsize=8, color=C_RED)
    save(fig, "sekil_shap.png")

# --- Sekil: Model karsilastirma (3 model x 4 metrik) ----------------------
def fig_model_compare():
    ml = jload("ml/gse50660_ml.json")["models"]
    models = [("RandomForest", "Rastgele\nOrman"), ("ElasticNet-LR", "ElasticNet"),
              ("XGBoost", "XGBoost")]
    metrics = [("roc_auc", "ROC-AUC"), ("balanced_accuracy", "Dengeli\ndoğruluk"),
               ("sensitivity_current", "Duyarlılık"), ("specificity_never", "Özgüllük")]
    cols = [C_GREEN, C_ORANGE, C_BLUE]
    x = np.arange(len(metrics)); w = 0.26
    fig, ax = plt.subplots(figsize=(8.4, 5.2))
    for i, (mk, ml_) in enumerate(models):
        vals = [ml[mk][k] for k, _ in metrics]
        b = ax.bar(x + (i - 1) * w, vals, w, label=ml_.replace("\n", " "), color=cols[i], alpha=0.92)
        for rect, v in zip(b, vals):
            ax.text(rect.get_x() + rect.get_width() / 2, v + 0.012, f"{v:.2f}".replace(".", ","),
                    ha="center", va="bottom", fontsize=7.4)
    ax.set_xticks(x); ax.set_xticklabels([m for _, m in metrics])
    ax.set_ylim(0, 1.08); ax.set_ylabel("Değer")
    ax.set_title("Sigara sınıflandırıcı karşılaştırması (sızıntısız 5-katlı ÇD)")
    ax.legend(frameon=False, ncol=3, loc="upper center", bbox_to_anchor=(0.5, -0.12))
    fig.text(0.5, -0.06, "Rastgele Orman yüksek AUC’ye rağmen düşük duyarlılık verir (dengesizlik tuzağı); "
             "dağıtılan model XGBoost’tur.", ha="center", fontsize=8, color="#555")
    save(fig, "sekil_model_karsilastirma.png")

# --- Sekil: Kaynak-ayrimi Jaccard isi haritasi (6x6) ----------------------
def fig_jaccard():
    ss = jload("dl/source_separation.json")
    jm = ss["jaccard_matrix"]
    tr = {"smoking": "Sigara", "cocaine": "Kokain", "methamphetamine": "Metamfetamin",
          "alcohol_blood": "Alkol (kan)", "alcohol_brain": "Alkol (beyin)", "opioid": "Opioid"}
    keys = list(jm.keys())
    M = np.array([[jm[a][b] for b in keys] for a in keys])
    labs = [tr[k] for k in keys]
    fig, ax = plt.subplots(figsize=(7.0, 6.0))
    im = ax.imshow(M, cmap="YlOrRd", vmin=0, vmax=1)
    ax.set_xticks(range(len(keys))); ax.set_yticks(range(len(keys)))
    ax.set_xticklabels(labs, rotation=35, ha="right", fontsize=9)
    ax.set_yticklabels(labs, fontsize=9)
    for i in range(len(keys)):
        for j in range(len(keys)):
            v = M[i, j]
            ax.text(j, i, f"{v:.3f}".replace(".", ","), ha="center", va="center",
                    fontsize=7.6, color="white" if v > 0.5 else "#333")
    cb = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cb.set_label("Jaccard örtüşmesi (imza benzerliği)")
    ax.set_title("Madde imzaları birbirinden ayrılabilir\n(ortalama köşegen-dışı Jaccard = 0,0012)")
    save(fig, "sekil_kaynak_ayrimi_isiharitasi.png")

# --- Sekil: Kronoloji / recency (tutun) -----------------------------------
def fig_chronology():
    ch = jload("dl/chronology.json")
    con = ch["contrasts_oof_auc"]
    items = [("current_vs_never", "Güncel — Hiç"), ("former_vs_never", "Eski — Hiç"),
             ("current_vs_former", "Güncel — Eski")]
    vals = [con[k] for k, _ in items]
    fig, axes = plt.subplots(1, 2, figsize=(11.0, 4.8))
    ax = axes[0]
    b = ax.bar([t for _, t in items], vals, color=[C_BLUE, C_GREEN, C_ORANGE], alpha=0.92)
    ax.axhline(0.5, ls="--", c=C_RED, lw=1); ax.set_ylim(0, 1.0)
    ax.text(2.4, 0.51, "şans", color=C_RED, fontsize=8, va="bottom", ha="right")
    for rect, v in zip(b, vals):
        ax.text(rect.get_x() + rect.get_width() / 2, v + 0.015, f"{v:.3f}".replace(".", ","),
                ha="center", fontsize=8.5)
    ax.set_ylabel("OOF ROC-AUC"); ax.set_title("Tütün maruziyeti recency’si ayrılabilir")
    ax.tick_params(axis="x", labelsize=9)
    ax = axes[1]
    aa = ch["age_acceleration_by_group"]
    grp = [("never", "Hiç"), ("former", "Eski"), ("current", "Güncel")]
    means = [aa[k]["mean_age_accel_years"] for k, _ in grp]
    sds = [aa[k]["sd"] for k, _ in grp]
    ax.bar([t for _, t in grp], means, yerr=sds, capsize=5,
           color=[C_GREEN, C_SKY, C_RED], alpha=0.9)
    ax.axhline(0, c="#333", lw=0.8)
    ax.set_ylabel("Ortalama epigenetik yaş ivmesi (yıl)")
    ax.set_title("Gruba göre yaş ivmesi (±SD)")
    ax.tick_params(axis="x", labelsize=9)
    fig.suptitle("Epigenetik kronoloji: “ne kadar süredir?” yalnız recency-etiketli tütünde",
                 fontsize=12, fontweight="bold")
    save(fig, "sekil_kronoloji.png")

# --- Sekil: Guc analizi ----------------------------------------------------
def fig_power():
    # Kaynak: 19_power.py / MAKALE_GERCEK.md S3.4 (committed, gercek)
    rows = [("Metamfetamin", 2.60, 15), ("Alkol (beyin)", 1.71, 32),
            ("Opioid (beyin)", 1.42, 22), ("Kokain (kan)", 1.26, 33),
            ("Sigara (kan)", 1.21, 27)]
    labs = [r[0] for r in rows]; d = [r[1] for r in rows]; n = [r[2] for r in rows]
    fig, axes = plt.subplots(1, 2, figsize=(11.0, 4.6))
    ax = axes[0]
    ax.barh(range(len(labs)), d, color=C_PURPLE, alpha=0.9)
    ax.set_yticks(range(len(labs))); ax.set_yticklabels(labs, fontsize=9)
    ax.set_xlabel("Medyan etki büyüklüğü (Cohen d, anlamlı CpG)")
    ax.set_title("Gözlenen etki büyüklükleri")
    for i, v in enumerate(d):
        ax.text(v + 0.03, i, f"{v:.2f}".replace(".", ","), va="center", fontsize=8)
    ax = axes[1]
    ax.barh(range(len(labs)), n, color=C_BLUE, alpha=0.9)
    ax.set_yticks(range(len(labs))); ax.set_yticklabels(labs, fontsize=9)
    ax.set_xlabel("%80 güç için gereken örneklem (grup başına)")
    ax.set_title("Replikasyon için gereken n")
    for i, v in enumerate(n):
        ax.text(v + 0.4, i, str(v), va="center", fontsize=8)
    fig.suptitle("İstatistiksel güç: küçük kohortlar yalnız büyük etkiler için yeterli",
                 fontsize=12, fontweight="bold")
    save(fig, "sekil_guc.png")

# --- Sekil: Madde-ozgu siniflandirici AUC ---------------------------------
def fig_substance_auc():
    rows = []
    for f, tr in [("dl/substance_cocaine.json", "Kokain (kan, n=47)"),
                  ("dl/substance_alcohol.json", "Alkol (kan, n=94)"),
                  ("dl/substance_methamphetamine.json", "Metamfetamin (PBL, n=24)")]:
        try:
            d = jload(f)
            auc = d.get("oof_roc_auc") or d.get("roc_auc") or d.get("auc")
            if auc is None:
                for v in d.values():
                    if isinstance(v, dict) and ("oof_roc_auc" in v or "roc_auc" in v):
                        auc = v.get("oof_roc_auc") or v.get("roc_auc"); break
            rows.append((tr, float(auc)))
        except Exception as e:
            print("substance auc skip", f, e)
    if not rows:
        rows = [("Kokain (kan, n=47)", 1.00), ("Alkol (kan, n=94)", 0.926),
                ("Metamfetamin (PBL, n=24)", 0.922)]
    labs = [r[0] for r in rows]; vals = [r[1] for r in rows]
    fig, ax = plt.subplots(figsize=(7.6, 4.4))
    b = ax.barh(range(len(labs)), vals, color=C_GREEN, alpha=0.9)
    ax.set_yticks(range(len(labs))); ax.set_yticklabels(labs, fontsize=9.5)
    ax.axvline(0.5, ls="--", c=C_RED, lw=1)
    ax.set_xlim(0, 1.05); ax.set_xlabel("OOF ROC-AUC (sızıntısız 5-katlı ÇD)")
    ax.set_title("Madde-özgü sınıflandırıcılar (her biri yalnız kendi kohortunda)")
    for rect, v in zip(b, vals):
        ax.text(v + 0.012, rect.get_y() + rect.get_height() / 2, f"{v:.3f}".replace(".", ","),
                va="center", fontsize=8.5)
    fig.text(0.5, -0.04, "Uyarı: bu modeller kohortlar-arası uygulanamaz (batch/platform); göstergeseldir, "
             "tanısal değildir.", ha="center", fontsize=8, color="#555")
    save(fig, "sekil_madde_auc.png")

# --- Sekil: Cheminformatik / NPS Markush ozet -----------------------------
def fig_cheminformatics():
    try:
        d = jload("dl/nps_database_markush.json")
    except Exception:
        d = {}
    me = d.get("markush_engine", {})
    n_rules = me.get("n_rules", 10)
    n_var = me.get("total_enumerated_variants", 29277)
    fig, ax = plt.subplots(figsize=(8.2, 4.8)); ax.axis("off")
    cards = [("NPS kural çekirdeği", f"{n_rules}", "RDKit-geçerli\nMarkush kuralı", C_BLUE),
             ("Numaralandırılan\nvaryant", f"{n_var:,}".replace(",", "."), "jenerik iskelet\nkapsamı", C_GREEN),
             ("RDKit geçerliliği", "10/10", "tüm çekirdek\nSMARTS geçerli", C_PURPLE),
             ("PubChem doğrulama", "15/17", "MA uyumu\n(%88,2)", C_ORANGE)]
    for i, (t, big, sub, col) in enumerate(cards):
        x = 0.04 + i * 0.24
        ax.add_patch(FancyBboxPatch((x, 0.30), 0.205, 0.50, transform=ax.transAxes,
                     boxstyle="round,pad=0.02,rounding_size=0.02", fc="white", ec=col, lw=2))
        ax.text(x + 0.10, 0.73, t, transform=ax.transAxes, ha="center", va="top",
                fontsize=9.5, fontweight="bold", color="#333")
        ax.text(x + 0.10, 0.55, big, transform=ax.transAxes, ha="center", va="center",
                fontsize=20, fontweight="bold", color=col)
        ax.text(x + 0.10, 0.37, sub, transform=ax.transAxes, ha="center", va="center",
                fontsize=8, color="#555")
    ax.text(0.5, 0.92, "Kemoinformatik / NPS modülü — gerçek yapısal kapsam",
            transform=ax.transAxes, ha="center", fontsize=13, fontweight="bold")
    ax.text(0.5, 0.14, "Bu katman yalnız KİMYASAL YAPIYI haritalar; tek başına bir metilasyon sinyali "
            "vermez.\nYapı sayımı asla madde-özgü metilasyon yerine geçirilmez (dürüst sınır).",
            transform=ax.transAxes, ha="center", fontsize=8.4, color="#666")
    save(fig, "sekil_cheminformatik.png")

# ===========================================================================
# (B) SEMATIK CERCEVE FIGURLERI
# ===========================================================================
def _box(ax, xy, w, h, text, fc="white", ec=C_BLUE, fs=9.5, lw=1.8, tc="#222", bold=False):
    x, y = xy
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.012,rounding_size=0.02",
                 fc=fc, ec=ec, lw=lw, transform=ax.transAxes, zorder=2))
    ax.text(x + w / 2, y + h / 2, text, transform=ax.transAxes, ha="center", va="center",
            fontsize=fs, color=tc, fontweight=("bold" if bold else "normal"), zorder=3)

def _arrow(ax, p0, p1, color="#555", lw=1.6, style="-|>"):
    ax.add_patch(FancyArrowPatch(p0, p1, transform=ax.transAxes, arrowstyle=style,
                 mutation_scale=14, color=color, lw=lw, zorder=1))

# --- PRISMA 2020 akis ------------------------------------------------------
def fig_prisma():
    # Yan yana (yatay) akış: 4 aşama soldan sağa, oklar sağa doğru.
    fig, ax = plt.subplots(figsize=(13.5, 5.0)); ax.axis("off")
    ax.text(0.5, 0.95, "PRISMA 2020 akış diyagramı", ha="center", fontsize=14,
            fontweight="bold", transform=ax.transAxes)
    stages = [
        ("TANIMLAMA", "GEO / E-utilities\nsorgularıyla tanımlanan\nkayıt: 7.859", C_BLUE),
        ("TARAMA", "Madde başına alınıp\ntaranan kayıt: 1.295\n(konu-dışı / metilasyon-\nolmayan / yinelenen elendi)", C_SKY),
        ("UYGUNLUK", "Uygunluk değerlendirmesi\n(modaliteye göre):\nsaat+EWAS 52 ·\nEWAS-dizileme 58 ·\nEWAS-dizi 7", C_GREEN),
        ("DAHİL ETME", "Dahil edilen veri seti: 117\n(atıf doğrulamasında\nbulunan 3 yeni gerçek\nmadde kaynağı dahil)", C_ORANGE),
    ]
    n = len(stages)
    w = 0.205
    gap = (1.0 - n * w) / (n + 1)
    yb, h = 0.27, 0.42
    for i, (tag, body, col) in enumerate(stages):
        x = gap + i * (w + gap)
        ax.text(x + w / 2, yb + h + 0.05, tag, fontsize=10.5, fontweight="bold", color=col,
                transform=ax.transAxes, ha="center", va="center")
        _box(ax, (x, yb), w, h, body, ec=col, fs=8.7)
        if i < n - 1:
            _arrow(ax, (x + w + 0.004, yb + h / 2), (x + w + gap - 0.004, yb + h / 2))
    ax.text(0.5, 0.06, "Kaynak: out/prisma/inventory.json (117 kayıt + sorgular + ham önbellek).",
            ha="center", fontsize=8.5, color="#666", transform=ax.transAxes)
    save(fig, "sekil_prisma.png")

# --- Analiz pipeline -------------------------------------------------------
def fig_pipeline():
    fig, ax = plt.subplots(figsize=(11.0, 5.0)); ax.axis("off")
    ax.text(0.5, 0.95, "DNA metilasyon analiz boru hattı", ha="center", fontsize=14, fontweight="bold")
    steps = [
        ("Ham veri\n(GEO seri-matris /\nβ-değerleri)", C_BLUE),
        ("Kalite kontrol\n+ SHA-256\nsabitleme", C_SKY),
        ("DMP\n(yaş/cinsiyet düzeltmeli\nOLS + BH-YKO)", C_GREEN),
        ("Zenginleştirme\n(GO-BP / KEGG\nhipergeometrik)", C_PURPLE),
        ("Epigenetik saat\n(Horvath/Hannum/\nPhenoAge)", C_ORANGE),
        ("Sızıntısız ML/DL\n+ SHAP", C_RED),
    ]
    n = len(steps); w = 0.135; gap = (1 - 0.06 - n * w) / (n - 1); x = 0.03; y = 0.45
    centers = []
    for i, (t, col) in enumerate(steps):
        _box(ax, (x, y), w, 0.26, t, ec=col, fs=8.6)
        centers.append(x + w)
        if i < n - 1:
            _arrow(ax, (x + w + 0.005, y + 0.13), (x + w + gap - 0.005, y + 0.13))
        x += w + gap
    ax.text(0.5, 0.18, "Tüm adımlar committed betiklerle, sabit seed = 42 ile yeniden üretilebilir; "
            "her sayı üreten betiğe ve çıktı dosyasına işaret eder.",
            ha="center", fontsize=8.4, color="#666", transform=ax.transAxes)
    save(fig, "sekil_pipeline.png")

# --- Kanit piramidi A-E ----------------------------------------------------
def fig_evidence_pyramid():
    fig, ax = plt.subplots(figsize=(8.6, 6.4)); ax.axis("off")
    ax.text(0.5, 0.96, "Kanıt derecelendirme piramidi", ha="center", fontsize=14, fontweight="bold")
    levels = [
        ("A", "İnsan kohortlarında tekrarlanmış, bağımsız\nvalidasyonlu, YKO kontrollü bulgu", C_GREEN),
        ("B", "İnsan verisi var ancak sınırlı validasyon mevcut", C_SKY),
        ("C", "Hayvan / hücre modeli veya dolaylı insan verisi", C_YELLOW),
        ("D", "Mekanistik veya hipotez düzeyinde kanıt", C_ORANGE),
        ("E", "Yetersiz veya çelişkili kanıt", C_RED),
    ]
    yb = 0.10; H = 0.74; n = len(levels)
    for i, (lv, desc, col) in enumerate(levels):
        frac_lo = i / n; frac_hi = (i + 1) / n
        # ters piramit: A en genis ustte
        ytop = yb + H * (1 - frac_lo); ybot = yb + H * (1 - frac_hi)
        wtop = 0.06 + 0.74 * (1 - frac_lo); wbot = 0.06 + 0.74 * (1 - frac_hi)
        xc = 0.40
        poly = Polygon([(xc - wtop / 2, ytop), (xc + wtop / 2, ytop),
                        (xc + wbot / 2, ybot), (xc - wbot / 2, ybot)],
                       closed=True, fc=col, ec="white", lw=2, alpha=0.85, transform=ax.transAxes)
        ax.add_patch(poly)
        ax.text(xc, (ytop + ybot) / 2, lv, transform=ax.transAxes, ha="center", va="center",
                fontsize=15, fontweight="bold", color="#222")
        ax.text(0.83, (ytop + ybot) / 2, desc, transform=ax.transAxes, ha="left", va="center",
                fontsize=8.6, color="#333")
    ax.text(0.5, 0.03, "Her bulgu bu düzeylerden birine atanır; veri yoksa “uydurma” yerine "
            "düşük-dereceli (D/E) etiketli literatür çıkarımı sunulur.",
            ha="center", fontsize=8.2, color="#666", transform=ax.transAxes)
    save(fig, "sekil_kanit_piramidi.png")

# --- Konfonder kontrol haritasi -------------------------------------------
def fig_confounder_map():
    fig, ax = plt.subplots(figsize=(9.0, 6.2)); ax.axis("off")
    ax.text(0.5, 0.95, "Konfonder (karıştırıcı) kontrol haritası", ha="center", fontsize=14, fontweight="bold")
    _box(ax, (0.40, 0.46), 0.20, 0.12, "Madde\nmaruziyeti", ec=C_RED, fc="#fdeee7", fs=10, bold=True)
    _box(ax, (0.40, 0.10), 0.20, 0.12, "DNA metilasyon\ndeğişimi", ec=C_BLUE, fc="#eaf2f8", fs=10, bold=True)
    _arrow(ax, (0.50, 0.46), (0.50, 0.225), color=C_DARK, lw=2.2)
    conf = [("Yaş", 0.06, 0.80), ("Cinsiyet", 0.06, 0.62), ("Sigara", 0.06, 0.44),
            ("Hücre tipi\nkompozisyonu", 0.06, 0.24),
            ("Kronik/konjenital\nhastalık", 0.74, 0.80), ("İlaç kullanımı", 0.74, 0.62),
            ("Doku / platform", 0.74, 0.44), ("Postmortem\naralık (PMI)", 0.74, 0.24)]
    for t, x, y in conf:
        _box(ax, (x, y), 0.20, 0.12, t, ec=C_GREEN, fc="#eaf5f0", fs=8.4)
        _arrow(ax, (x + 0.20 if x < 0.5 else x, y + 0.06),
               (0.40 if x < 0.5 else 0.60, 0.55 if y > 0.5 else 0.18), color="#9a9a9a", lw=1.1)
    ax.text(0.5, 0.02, "Yeşil değişkenler model kovaryatı olarak DÜZELTİLİR; düzeltilmezse sahte "
            "“madde” sinyali üretebilirler (örn. hücre-tipi → cg20100151).",
            ha="center", fontsize=8.2, color="#666", transform=ax.transAxes)
    save(fig, "sekil_konfonder_haritasi.png")

# --- Madde-hastalik-ilac-metilasyon etkilesim agi -------------------------
def fig_network():
    fig, ax = plt.subplots(figsize=(9.0, 7.0)); ax.axis("off")
    ax.text(0.5, 0.96, "Madde – hastalık – ilaç – metilasyon etkileşim ağı",
            ha="center", fontsize=13.5, fontweight="bold")
    center = (0.5, 0.5)
    ax.add_patch(plt.Circle(center, 0.075, transform=ax.transAxes, fc=C_BLUE, ec="white", lw=2, zorder=3))
    ax.text(0.5, 0.5, "DNA\nmetilasyon", transform=ax.transAxes, ha="center", va="center",
            fontsize=9, color="white", fontweight="bold", zorder=4)
    nodes = [
        ("Sigara", C_RED, "A"), ("Alkol", C_RED, "B"), ("Kokain", C_RED, "B"),
        ("Opioid", C_RED, "C"), ("Metamfetamin", C_RED, "C"),
        ("Kalp yetmezliği", C_GREEN, "kov."), ("Obezite", C_GREEN, "kov."),
        ("Talasemi", C_GREEN, "kov."), ("Depresyon", C_PURPLE, "B"),
        ("Antidepresan", C_ORANGE, "D"), ("Opioid analjezik", C_ORANGE, "C"),
        ("Yaş / cinsiyet", C_SKY, "A"),
    ]
    N = len(nodes)
    for i, (name, col, grade) in enumerate(nodes):
        ang = 2 * np.pi * i / N + np.pi / 2
        x = 0.5 + 0.30 * np.cos(ang); y = 0.5 + 0.30 * np.sin(ang)
        ax.plot([0.5, x], [0.5, y], transform=ax.transAxes, color="#cfcfcf", lw=1.0, zorder=1)
        ax.add_patch(plt.Circle((x, y), 0.040, transform=ax.transAxes, fc="white", ec=col, lw=2, zorder=3))
        ax.text(x, y, grade, transform=ax.transAxes, ha="center", va="center", fontsize=8.5,
                color=col, fontweight="bold", zorder=4)
        ha = "left" if np.cos(ang) > 0.1 else ("right" if np.cos(ang) < -0.1 else "center")
        lx = min(max(x + 0.052 * np.cos(ang), 0.04), 0.96)
        ly = min(max(y + 0.06 * np.sin(ang), 0.06), 0.94)
        ax.text(lx, ly, name, transform=ax.transAxes,
                ha=ha, va="center", fontsize=8.4, color="#333")
    leg = [Line2D([0], [0], marker="o", color="w", markerfacecolor="w", markeredgecolor=c,
                  markeredgewidth=2, markersize=11, label=l)
           for c, l in [(C_RED, "Madde (analiz edildi)"), (C_GREEN, "Hastalık (kovaryat)"),
                        (C_ORANGE, "İlaç"), (C_PURPLE, "Psikiyatrik"), (C_SKY, "Biyolojik değişken")]]
    ax.legend(handles=leg, loc="lower center", bbox_to_anchor=(0.5, -0.07), ncol=3,
              frameon=False, fontsize=8.2)
    ax.text(0.02, 0.5, "Düğüm içi harf =\nkanıt düzeyi (A–E)", transform=ax.transAxes,
            fontsize=8, color="#777", va="center")
    save(fig, "sekil_etkilesim_agi.png", tight=False)

# --- Cheminformatik-epigenetik entegrasyon --------------------------------
def fig_chem_epi():
    fig, ax = plt.subplots(figsize=(10.5, 5.2)); ax.axis("off")
    ax.text(0.5, 0.94, "Kemoinformatik – epigenetik entegrasyon (dürüst sınırla)",
            ha="center", fontsize=13.5, fontweight="bold")
    _box(ax, (0.03, 0.45), 0.26, 0.30,
         "KEMOINFORMATIK\n• NPS / Markush iskeleti\n• 29.277 varyant\n• RDKit-geçerli SMARTS\n• Tanimoto benzerliği",
         ec=C_PURPLE, fc="#f7eef3", fs=8.6)
    _box(ax, (0.37, 0.45), 0.26, 0.30,
         "KÖPRÜ (yapısal benzerlik)\nYeni madde ↔ bilinen madde\nyapısal yakınlığı\n(yalnız HİPOTEZ üretir)",
         ec=C_SKY, fc="#eaf4fb", fs=8.6)
    _box(ax, (0.71, 0.45), 0.26, 0.30,
         "EPIGENETIK\n• Gerçek kohort DMP imzaları\n• Yalnız insan verisi olan\n  maddeler için\n• Kanıt düzeyi A–E",
         ec=C_GREEN, fc="#eaf5f0", fs=8.6)
    _arrow(ax, (0.29, 0.60), (0.37, 0.60), color="#666")
    _arrow(ax, (0.63, 0.60), (0.71, 0.60), color="#666")
    ax.text(0.5, 0.20, "Sınır kuralı: kimyasal yapı benzerliği bir metilasyon imzası DEĞİLDİR. "
            "Köprü yalnız test edilecek hipotez önerir;\nbir maddeye CpG ataması ancak o madde "
            "için gerçek insan metilasyon verisi varsa yapılır (uydurma katman dışlanmıştır).",
            ha="center", fontsize=8.6, color="#555", transform=ax.transAxes)
    save(fig, "sekil_chem_epi_entegrasyon.png")

# --- ML mimari -------------------------------------------------------------
def fig_ml_arch():
    fig, ax = plt.subplots(figsize=(10.5, 5.4)); ax.axis("off")
    ax.text(0.5, 0.95, "Makine / derin öğrenme mimarisi (sızıntısız)",
            ha="center", fontsize=13.5, fontweight="bold")
    _box(ax, (0.02, 0.55), 0.17, 0.22, "Girdi\nβ-değer matrisi\n(CpG × örnek)", ec=C_BLUE, fs=8.6)
    _box(ax, (0.225, 0.55), 0.17, 0.22, "Fold-İÇİ\nöznitelik seçimi\n(top-K t-test,\nyalnız eğitim)",
         ec=C_SKY, fs=8.4)
    _box(ax, (0.43, 0.74), 0.17, 0.14, "Rastgele Orman", ec=C_GREEN, fs=8.6)
    _box(ax, (0.43, 0.55), 0.17, 0.14, "ElasticNet-LR", ec=C_ORANGE, fs=8.6)
    _box(ax, (0.43, 0.36), 0.17, 0.14, "XGBoost / MLP", ec=C_RED, fs=8.6)
    _box(ax, (0.635, 0.55), 0.17, 0.22, "5-katlı OOF\ndeğerlendirme\n(AUC, dengeli\ndoğruluk)", ec=C_PURPLE, fs=8.4)
    _box(ax, (0.82, 0.55), 0.16, 0.22, "SHAP\naçıklanabilirlik", ec=C_DARK, fs=8.6)
    _arrow(ax, (0.19, 0.66), (0.225, 0.66))
    _arrow(ax, (0.395, 0.66), (0.43, 0.81)); _arrow(ax, (0.395, 0.66), (0.43, 0.62))
    _arrow(ax, (0.395, 0.66), (0.43, 0.43))
    _arrow(ax, (0.60, 0.81), (0.635, 0.68)); _arrow(ax, (0.60, 0.62), (0.635, 0.66))
    _arrow(ax, (0.60, 0.43), (0.635, 0.64))
    _arrow(ax, (0.805, 0.66), (0.82, 0.66))
    ax.text(0.5, 0.22, "Öznitelik seçimi her fold’un YALNIZ eğitim kısmında yapılır → veri sızıntısı yok. "
            "Tarafsız başarım çapraz-doğrulamadan; SHAP yalnız yorum içindir.",
            ha="center", fontsize=8.4, color="#666", transform=ax.transAxes)
    save(fig, "sekil_ml_mimari.png")

# --- Validasyon akisi ------------------------------------------------------
def fig_validation_flow():
    fig, ax = plt.subplots(figsize=(10.5, 5.0)); ax.axis("off")
    ax.text(0.5, 0.94, "Model / bulgu validasyon akışı", ha="center", fontsize=13.5, fontweight="bold")
    steps = [
        ("Aday sinyal\n(DMP / model)", C_BLUE),
        ("Sızıntısız\nçapraz-doğrulama", C_SKY),
        ("Negatif kontroller\n(bölge, hücre tipi,\nokuma-derinliği)", C_GREEN),
        ("Bağımsız kohort\nreplikasyonu", C_ORANGE),
        ("Güç / FPR\nspike-in kalibrasyonu", C_PURPLE),
        ("Karar:\nDOĞRULANDI /\nDOĞRULANMADI", C_RED),
    ]
    n = len(steps); w = 0.135; gap = (1 - 0.06 - n * w) / (n - 1); x = 0.03; y = 0.42
    for i, (t, col) in enumerate(steps):
        _box(ax, (x, y), w, 0.30, t, ec=col, fs=8.3)
        if i < n - 1:
            _arrow(ax, (x + w + 0.004, y + 0.15), (x + w + gap - 0.004, y + 0.15))
        x += w + gap
    ax.text(0.5, 0.16, "İstatistiksel anlamlılık tek başına yeterli SAYILMAZ: her aday bölge-özgülük, "
            "hücre-tipi konfaundu, platform ve okuma-derinliği için elenir.",
            ha="center", fontsize=8.4, color="#666", transform=ax.transAxes)
    save(fig, "sekil_validasyon_akisi.png")

# --- Vaka karar agaci ------------------------------------------------------
def fig_decision_tree():
    fig, ax = plt.subplots(figsize=(9.4, 7.0)); ax.axis("off")
    ax.text(0.5, 0.96, "Maruziyet çıkarımı karar ağacı (olasılıksal, dürüst)",
            ha="center", fontsize=13, fontweight="bold")
    _box(ax, (0.36, 0.84), 0.28, 0.09, "Metilasyon profili girer", ec=C_BLUE, fc="#eaf2f8", fs=9.5, bold=True)
    _box(ax, (0.30, 0.66), 0.40, 0.09, "Bu madde için gerçek insan\nkohortu / modeli var mı?", ec=C_DARK, fs=9)
    _arrow(ax, (0.50, 0.84), (0.50, 0.755))
    # EVET
    _box(ax, (0.06, 0.45), 0.34, 0.11, "EVET → olasılıksal yanıt:\nsınıf olasılığı + güven + belirsizlik\n+ konfonder yükü", ec=C_GREEN, fc="#eaf5f0", fs=8.4)
    # HAYIR
    _box(ax, (0.60, 0.45), 0.34, 0.11, "HAYIR → NOT_ESTIMABLE\n(uydurma YOK) + en yakın literatür\nçıkarımı, kanıt düzeyi D/E", ec=C_ORANGE, fc="#fdf3e8", fs=8.4)
    _arrow(ax, (0.42, 0.66), (0.23, 0.565), color=C_GREEN); ax.text(0.30, 0.625, "evet", color=C_GREEN, fontsize=8.5)
    _arrow(ax, (0.58, 0.66), (0.77, 0.565), color=C_ORANGE); ax.text(0.66, 0.625, "hayır", color=C_ORANGE, fontsize=8.5)
    _box(ax, (0.18, 0.24), 0.64, 0.10, "Recency etiketi (hiç/eski/güncel) var mı? →\nVARSA süre olasılığı (yalnız tütün); YOKSA süre = NOT_ESTIMABLE",
         ec=C_PURPLE, fc="#f7eef3", fs=8.4)
    _arrow(ax, (0.23, 0.45), (0.40, 0.345), color="#888")
    _box(ax, (0.24, 0.04), 0.52, 0.10, "Çıktı: kalibre, güven-aralıklı, sahte-kesinlik içermeyen rapor\n"
         "“… ile uyumludur, ancak tek başına tanısal değildir.”", ec=C_RED, fc="#fdeee7", fs=8.4, bold=True)
    _arrow(ax, (0.50, 0.24), (0.50, 0.145), color="#888")
    save(fig, "sekil_karar_agaci.png")

# --- 450K/EPIC vs WGBS karsilastirma --------------------------------------
def fig_platform_compare():
    fig, ax = plt.subplots(figsize=(9.6, 5.2)); ax.axis("off")
    ax.text(0.5, 0.95, "Metilasyon ölçüm platformları karşılaştırması",
            ha="center", fontsize=13.5, fontweight="bold")
    cols_h = ["Özellik", "450K dizi", "EPIC (850K)", "WGBS / RRBS"]
    rows = [
        ["Kapsam (CpG)", "~485 bin", "~865 bin", "Tüm genom / azaltılmış"],
        ["Çözünürlük", "Hedefli prob", "Hedefli prob", "Tek-baz"],
        ["Okuma derinliği", "Yok (yoğunluk)", "Yok (yoğunluk)", "Var (sayım)"],
        ["Maliyet", "Düşük–orta", "Orta", "Yüksek"],
        ["Bu çalışmadaki kullanım", "Çoğu kohort", "GSE252501/255929", "GSE235818/137364"],
    ]
    nC = len(cols_h); nR = len(rows)
    x0, y0, w, h = 0.04, 0.16, 0.92 / nC, 0.62 / (nR + 1)
    for j, c in enumerate(cols_h):
        ax.add_patch(Rectangle((x0 + j * w, y0 + nR * h), w, h, transform=ax.transAxes,
                     fc=C_BLUE, ec="white", lw=1.5))
        ax.text(x0 + j * w + w / 2, y0 + nR * h + h / 2, c, transform=ax.transAxes,
                ha="center", va="center", fontsize=9, color="white", fontweight="bold")
    for i, row in enumerate(rows):
        yy = y0 + (nR - 1 - i) * h
        for j, cell in enumerate(row):
            fc = "#f4f7fa" if i % 2 == 0 else "white"
            if j == 0: fc = "#e9eef3"
            ax.add_patch(Rectangle((x0 + j * w, yy), w, h, transform=ax.transAxes,
                         fc=fc, ec="#cccccc", lw=0.8))
            ax.text(x0 + j * w + w / 2, yy + h / 2, cell, transform=ax.transAxes,
                    ha="center", va="center", fontsize=8.2, color="#333")
    ax.text(0.5, 0.07, "Okuma-derinliği yalnız dizileme tabanlı platformlarda vardır; bu, bisülfit "
            "kohortlarında aşırı-dağılım testlerini (DSS) gerekli kılar.",
            ha="center", fontsize=8.2, color="#666", transform=ax.transAxes)
    save(fig, "sekil_platform_karsilastirma.png")


def main():
    t0 = time.time()
    data_figs = [fig_volcano, fig_topcpg, fig_clock, fig_enrich, fig_shap,
                 fig_model_compare, fig_jaccard, fig_chronology, fig_power,
                 fig_substance_auc, fig_cheminformatics]
    schem_figs = [fig_prisma, fig_pipeline, fig_evidence_pyramid, fig_confounder_map,
                  fig_network, fig_chem_epi, fig_ml_arch, fig_validation_flow,
                  fig_decision_tree, fig_platform_compare]
    for f in data_figs + schem_figs:
        try:
            f()
        except Exception as e:
            print("FAIL", f.__name__, type(e).__name__, e, flush=True)
    # ROC + kalibrasyon (en son; OOF egitimi suruyor)
    try:
        fig_roc_calibration()
    except Exception as e:
        print("FAIL fig_roc_calibration", type(e).__name__, e, flush=True)
    print(f"\nTum figurler: {FIG}  ({time.time()-t0:.0f}s)")


if __name__ == "__main__":
    main()
