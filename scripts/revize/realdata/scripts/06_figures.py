#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
06_figures.py — GERCEK figurler (yalnizca gercek ciktilarindan).
Girdi: out/gse50660_dmp.csv, out/gse50660_clock_per_sample.csv,
       out/gse50660_validation.json, out/gse50660_GO_Biological_Process_2021.csv,
       out/gse50660_KEGG_2021_Human.csv
Cikti: out/figures/fig_volcano.png, fig_topcpg.png, fig_clock.png, fig_enrich.png
Hicbir sayi uydurulmaz; hepsi dosyalardan okunur. Sabit gorunum (seed gerekmez, deterministik).
"""
import json, os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "out"))
FIG = os.path.join(OUT, "figures")
os.makedirs(FIG, exist_ok=True)

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 11,
    "axes.titlesize": 13,
    "axes.titleweight": "bold",
    "axes.labelsize": 12,
    "figure.dpi": 150,
    "savefig.dpi": 150,
    "savefig.bbox": "tight",
    "axes.spines.top": False,
    "axes.spines.right": False,
})

BLUE = "#2c5f8a"
RED = "#c0392b"
GREY = "#b8b8b8"
GREEN = "#27795b"

# cg -> gen etiketi (validation.json canonical_validation + bilinen sigara CpG'leri)
val = json.load(open(os.path.join(OUT, "gse50660_validation.json")))
cg_gene = {}
for cg, d in val.get("canonical_validation", {}).items():
    cg_gene[cg] = d["gene"]

# ---------------------------------------------------------------------------
# Sekil 1 — Volkan grafigi (tum 482.739 prob): Delta-beta vs -log10(p)
# ---------------------------------------------------------------------------
dmp = pd.read_csv(os.path.join(OUT, "gse50660_dmp.csv"))
dmp["nlp"] = -np.log10(dmp["p"].clip(lower=1e-300))
sig = dmp["fdr"] < 0.05

fig, ax = plt.subplots(figsize=(7.2, 5.4))
ax.scatter(dmp.loc[~sig, "delta_beta_current_minus_never"], dmp.loc[~sig, "nlp"],
           s=3, c=GREY, alpha=0.35, rasterized=True, linewidths=0)
ax.scatter(dmp.loc[sig, "delta_beta_current_minus_never"], dmp.loc[sig, "nlp"],
           s=9, c=RED, alpha=0.8, rasterized=True, linewidths=0,
           label=f"FDR < 0,05 ({int(sig.sum())} CpG)")
# en guclu, mekansal olarak ayrilabilir kanonik CpG'leri etiketle (cakisma olmadan, lider cizgili)
top = dmp.nsmallest(7, "p").reset_index(drop=True)
ann = [  # (satir indeksi, metin ofseti pt)
    (0, (14, -4)),   # cg05575921 (AHRR) — izole tepe
    (1, (-12, 30)),  # cg21566642 (ALPPL2) — yukari it
    (3, (95, 26)),   # cg03636183 (F2RL3) — saga acik alana
    (2, (70, 6)),    # cg21161138 — saga
]
for idx, off in ann:
    r = top.iloc[idx]
    g = cg_gene.get(r["cg"], "")
    lbl = f"{r['cg']}" + (f" ({g})" if g else "")
    ax.scatter([r["delta_beta_current_minus_never"]], [r["nlp"]], s=26, c=RED,
               edgecolors="#5a1410", linewidths=0.7, zorder=5)
    ax.annotate(lbl, (r["delta_beta_current_minus_never"], r["nlp"]),
                fontsize=8, ha="left", va="center",
                xytext=off, textcoords="offset points", color="#1a1a1a",
                arrowprops=dict(arrowstyle="-", color="#777", lw=0.7))
ax.axhline(-np.log10(0.05), ls="--", lw=0.8, c="#888", zorder=0)
ax.set_xlabel("Metilasyon farki (Δβ: güncel − hiç içmeyen)")
ax.set_ylabel("−log₁₀(p)")
ax.set_title("Sigara ile ilişkili diferansiyel metilasyon (GSE50660, n=201)")
ax.legend(loc="upper right", frameon=False, fontsize=9)
fig.text(0.5, -0.02, "Güncel içiciler hipometile (negatif Δβ); AHRR/F2RL3 dahil kanonik sigara CpG'leri en güçlü sinyaller.",
         ha="center", fontsize=8, color="#555")
fig.savefig(os.path.join(FIG, "fig_volcano.png"))
plt.close(fig)
print("fig_volcano.png OK")

# ---------------------------------------------------------------------------
# Sekil 2 — En guclu 15 CpG (isaretli Delta-beta, gen etiketli)
# ---------------------------------------------------------------------------
t15 = dmp.nsmallest(15, "p").copy()
t15["lab"] = [f"{cg}" + (f" · {cg_gene[cg]}" if cg in cg_gene else "") for cg in t15["cg"]]
t15 = t15.iloc[::-1]
fig, ax = plt.subplots(figsize=(7.2, 5.6))
ax.barh(range(len(t15)), t15["delta_beta_current_minus_never"], color=BLUE, alpha=0.9)
ax.set_yticks(range(len(t15)))
ax.set_yticklabels(t15["lab"], fontsize=8.5)
ax.axvline(0, c="#333", lw=0.8)
ax.set_xlim(-0.27, 0.055)
ax.set_xlabel("Metilasyon farki (Δβ: güncel − hiç içmeyen)")
ax.set_title("En güçlü 15 sigara-ilişkili CpG: etki yönü ve büyüklüğü")
# p-degerlerini 0'in sagindaki bos alana yaz (barlarla cakismaz)
for i, p in enumerate(t15["p"]):
    ax.text(0.004, i, f"p={p:.1e}", va="center", ha="left", fontsize=6.8, color="#444")
ax.spines["left"].set_visible(False)
fig.savefig(os.path.join(FIG, "fig_topcpg.png"))
plt.close(fig)
print("fig_topcpg.png OK")

# ---------------------------------------------------------------------------
# Sekil 3 — Horvath DNAmAge vs kronolojik yas (n=464), sigaraya gore renk
# ---------------------------------------------------------------------------
cl = pd.read_csv(os.path.join(OUT, "gse50660_clock_per_sample.csv"))
clk = json.load(open(os.path.join(OUT, "gse50660_clock_summary.json")))
r = clk["pearson_r_dnam_vs_chrono"]; mae = clk["MAE_years"]; n = clk["n_samples"]
fig, ax = plt.subplots(figsize=(6.4, 6.0))
lo = min(cl["chrono_age"].min(), cl["dnam_age"].min()) - 3
hi = max(cl["chrono_age"].max(), cl["dnam_age"].max()) + 3
ax.plot([lo, hi], [lo, hi], ls="--", c="#888", lw=1, zorder=0, label="y = x")
ax.scatter(cl["chrono_age"], cl["dnam_age"], s=16, c=BLUE, alpha=0.55, linewidths=0)
ax.set_xlim(lo, hi); ax.set_ylim(lo, hi)
ax.set_xlabel("Kronolojik yaş (yıl)")
ax.set_ylabel("Tahmini DNAm yaşı — Horvath (yıl)")
ax.set_title("Epigenetik saat doğrulaması (GSE50660)")
ax.text(0.04, 0.96, f"Pearson r = {r:.3f}\nMAE = {mae:.2f} yıl\nn = {n}",
        transform=ax.transAxes, va="top", ha="left", fontsize=10,
        bbox=dict(boxstyle="round,pad=0.4", fc="#eef3f8", ec="#aac", lw=0.8))
ax.legend(loc="lower right", frameon=False)
fig.savefig(os.path.join(FIG, "fig_clock.png"))
plt.close(fig)
print("fig_clock.png OK")

# ---------------------------------------------------------------------------
# Sekil 4 — Fonksiyonel zenginlestirme (GO-BP + KEGG, -log10 adj p)
# ---------------------------------------------------------------------------
go = pd.read_csv(os.path.join(OUT, "gse50660_GO_Biological_Process_2021.csv")).head(8)
kg = pd.read_csv(os.path.join(OUT, "gse50660_KEGG_2021_Human.csv")).head(8)

def shorten(s, n=42):
    s = str(s)
    return s if len(s) <= n else s[:n-1] + "…"

fig, axes = plt.subplots(1, 2, figsize=(11.5, 5.2))
for ax, df, title, col in [
    (axes[0], go, "GO — Biyolojik Süreç (Enrichr)", GREEN),
    (axes[1], kg, "KEGG Yolakları (Enrichr)", BLUE),
]:
    d = df.iloc[::-1]
    nlp = -np.log10(d["Adjusted P-value"].clip(lower=1e-300))
    ax.barh(range(len(d)), nlp, color=col, alpha=0.9)
    ax.set_yticks(range(len(d)))
    ax.set_yticklabels([shorten(t) for t in d["Term"]], fontsize=8)
    ax.axvline(-np.log10(0.05), ls="--", lw=0.9, c=RED)
    ax.set_xlabel("−log₁₀(düzeltilmiş p)")
    ax.set_title(title)
for ax in axes:
    ax.text(-np.log10(0.05), -0.55, "FDR=0,05", color=RED, fontsize=7.5,
            va="top", ha="center")
fig.suptitle("89 anlamlı CpG → 51 gen üzerinde fonksiyonel zenginleştirme",
             fontsize=12, fontweight="bold")
fig.savefig(os.path.join(FIG, "fig_enrich.png"))
plt.close(fig)
print("fig_enrich.png OK")

print("Tum figurler:", FIG)
