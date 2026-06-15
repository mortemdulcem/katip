#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
61_figure_brain_tr.py — Beyin-bolgesi figuru (TURKCE, 300 dpi).

Profesyonel anatomi atlasi gorseli (assets/brain_atlas.png, sagital kesit)
zemin olarak kullanilir; calismada yeniden analiz edilen postmortem beyin
kohortlarinin bolgeleri (prefrontal/DLPFK, orbitofrontal korteks, nukleus
akkumbens, kaudat cekirdek, hipokampus) atlas uzerinde isaretlenip madde +
GSE kohortu ile etiketlenir.

Hakem kurallari: tum yazilar TURKCE; >= 300 dpi; gorsel uzerinde sekil-no /
Ingilizce etiket YOK; renk korlugune duyarli Okabe-Ito paleti.
"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.image as mpimg

HERE = os.path.dirname(os.path.abspath(__file__))
FIG = os.path.normpath(os.path.join(HERE, "..", "out", "figures_tr"))
ATLAS = os.path.normpath(os.path.join(HERE, "..", "assets", "brain_atlas.png"))
os.makedirs(FIG, exist_ok=True)

C_BLUE   = "#0072B2"   # alkol
C_ORANGE = "#E69F00"   # opioid
C_RED    = "#D55E00"   # kokain
C_GREY   = "#7f868c"   # baglam
C_DARK   = "#1b1b1b"

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 10.5,
    "figure.dpi": 300,
    "savefig.dpi": 300,
})


def main():
    img = mpimg.imread(ATLAS)
    H, W = img.shape[0], img.shape[1]

    fig, ax = plt.subplots(figsize=(10.2, 7.4))
    # Atlasi yerlestir; cevreye Turkce kutular icin beyaz pay birak
    ax.imshow(img, extent=[0, W, H, 0], zorder=1)
    ax.set_xlim(-0.52 * W, 1.50 * W)
    ax.set_ylim(1.30 * H, -0.22 * H)   # imshow icin y ters
    ax.axis("off")

    # Bolgeler: (etiket, madde+kohort, (fx,fy) atlas-uzeri, renk,
    #            (fxt,fyt) kutu, hizalama)
    # fx: soldan, fy: usten (0-1). Sagital kesit: yuz SOLDA, arka SAGDA.
    regions = [
        ("Prefrontal korteks (PFK / DLPFK)",
         "Alkol · GSE252501, GSE49393\nOpioid · GSE164822",
         (0.27, 0.20), C_BLUE, (-0.50, -0.05), "left"),
        ("Orbitofrontal korteks (OFK)",
         "Opioid kullanım bozukluğu\nGSE98203 · GSE235818 (saf nöron)",
         (0.20, 0.46), C_ORANGE, (-0.50, 0.52), "left"),
        ("Nükleus akkumbens (NAk)",
         "Alkol · GSE252501\n(NAk-özgü değişimler %97,2)",
         (0.32, 0.50), C_BLUE, (0.10, 1.18), "left"),
        ("Kaudat çekirdek",
         "Kokain · GSE137364\n(anlamlı fark yok)",
         (0.42, 0.40), C_RED, (1.16, 0.18), "left"),
        ("Hipokampus",
         "Limbik bellek/ödül (bağlamsal)",
         (0.51, 0.585), C_GREY, (1.16, 0.66), "left"),
    ]

    for label, sub, (fx, fy), col, (fxt, fyt), ha in regions:
        mx, my = fx * W, fy * H
        tx, ty = fxt * W, fyt * H
        ax.scatter([mx], [my], s=240, c=col, edgecolors="white",
                   linewidths=2.0, zorder=6)
        box = dict(boxstyle="round,pad=0.5", fc="white", ec=col, lw=1.8,
                   alpha=0.97)
        ax.annotate(f"{label}\n{sub}", xy=(mx, my), xytext=(tx, ty),
                    ha=ha, va="center", fontsize=10.2, zorder=7, bbox=box,
                    arrowprops=dict(arrowstyle="-|>", color=col, lw=2.0,
                                    shrinkA=4, shrinkB=8,
                                    connectionstyle="arc3,rad=0.18"))

    ax.text(0.49 * W, -0.18 * H, "Yeniden analiz edilen beyin bölgeleri",
            fontsize=15, fontweight="bold", ha="center", color=C_DARK,
            zorder=8)
    # Yon etiketleri (sagital): on = sol, arka = sag
    ax.text(0.02 * W, 0.96 * H, "ön", fontsize=11, style="italic",
            color=C_DARK, ha="center", zorder=8)
    ax.text(0.97 * W, 0.96 * H, "arka", fontsize=11, style="italic",
            color=C_DARK, ha="center", zorder=8)

    handles = [
        plt.Line2D([0], [0], marker="o", color="w", markerfacecolor=C_BLUE,
                   markersize=12, label="Alkol kohortları"),
        plt.Line2D([0], [0], marker="o", color="w", markerfacecolor=C_ORANGE,
                   markersize=12, label="Opioid kohortları"),
        plt.Line2D([0], [0], marker="o", color="w", markerfacecolor=C_RED,
                   markersize=12, label="Kokain kohortu"),
        plt.Line2D([0], [0], marker="o", color="w", markerfacecolor=C_GREY,
                   markersize=12, label="Bağlamsal bölge"),
    ]
    ax.legend(handles=handles, loc="lower center", ncol=4, frameon=False,
              fontsize=10, bbox_to_anchor=(0.42, -0.02), handletextpad=0.3,
              columnspacing=1.3)

    out = os.path.join(FIG, "sekil_beyin_bolgeleri.png")
    fig.savefig(out, dpi=300, facecolor="white", bbox_inches="tight")
    plt.close(fig)
    print("OK", out, flush=True)


if __name__ == "__main__":
    main()
