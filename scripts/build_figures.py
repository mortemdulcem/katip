"""TOMEC — Yeni kreasyon şekiller.
NEJM / Lancet / BMJ dergi standardı.
Minimal çizgi, maksimum beyaz alan, tek vurgu rengi.
Deterministic matplotlib çıktıları — AI üretimi değil."""
import os, textwrap
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Polygon
from matplotlib.lines import Line2D

FIG = "client/public/figures"
os.makedirs(FIG, exist_ok=True)

# ─── Minimal palet ───
K      = "#1B1B1B"      # siyah mürekkep
K2     = "#4A4A4A"      # ikincil gri
K3     = "#8A8A8A"      # tersiyer gri
K4     = "#B5B5B5"      # çok açık gri
BG     = "#FAFAF5"      # sıcak beyaz zemin
WARM   = "#F0EDE5"      # krem alt-zemin
ACC    = "#8B2500"      # koyu tuğla-bordo (TEK vurgu)
ACC2   = "#B85C3A"      # açık vurgu

plt.rcParams.update({
    "font.family": "DejaVu Serif",
    "font.size": 9,
    "axes.titlesize": 11,
    "axes.titleweight": "bold",
    "axes.labelsize": 9,
    "axes.edgecolor": K3,
    "axes.linewidth": 0.4,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "xtick.color": K2,
    "ytick.color": K2,
    "xtick.major.width": 0.4,
    "ytick.major.width": 0.4,
    "lines.linewidth": 0.8,
    "patch.linewidth": 0.6,
    "figure.dpi": 250,
    "savefig.dpi": 250,
    "savefig.bbox": "tight",
    "savefig.pad_inches": 0.35,
    "savefig.facecolor": BG,
    "figure.facecolor": BG,
    "axes.facecolor": BG,
})

def _rbox(ax, x, y, w, h, fc=BG, ec=K3, lw=0.6, r=0.06):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle=f"round,pad=0.03,rounding_size={r}", fc=fc, ec=ec, lw=lw))

def _arr(ax, x1, y1, x2, y2, c=K4, lw=0.7):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2),
        arrowstyle="-|>", mutation_scale=9, lw=lw, color=c))

def _fig_label(ax, x, y, num, title, fs=11):
    from matplotlib.offsetbox import AnchoredText
    txt = ax.text(x, y, f"Şekil {num}.  {title}", fontsize=fs, color=K, ha="left", va="baseline")


# ════════════════════════════════════════════════════════════
# 1 — PRISMA akış şeması
# ════════════════════════════════════════════════════════════
def fig1_prisma():
    fig, ax = plt.subplots(figsize=(15, 6.5))
    ax.set_xlim(0, 15); ax.set_ylim(0, 6.5); ax.axis("off")

    _fig_label(ax, 0.3, 6.2, 1, "Sistematik İçtihat Tarama Akışı (PRISMA-uyarlanmış)")
    ax.text(0.3, 5.85, "Sinerji Mevzuat veritabanı  ·  4 dalga  ·  11.05.2026",
            fontsize=8, color=K3, style="italic")

    # ── Sol: 4 dalga ──
    waves = [
        (5.05, '1  "gebe + travma"',      '871 md · 783 tm'),
        (4.45, '2  "gebe + illiyet"',     '1.652 md · 1.468 tm'),
        (3.85, '3  "hamile + düşük"',     '1.839 md · 1.194 yeni tm'),
        (3.25, '4  "cenin + ölüm"',       '129 md · 76 yeni tm'),
    ]
    for y, label, counts in waves:
        _rbox(ax, 0.3, y, 4.0, 0.5, fc="white", ec=K3)
        ax.text(0.45, y + 0.27, label, fontsize=8.5, fontweight="bold", color=K, va="center")
        ax.text(4.18, y + 0.27, counts, fontsize=7, color=K2, ha="right", va="center")

    # ── Birleşik Korpus ──
    _rbox(ax, 4.5, 3.55, 3.6, 1.65, fc=K, ec=K)
    ax.text(6.3, 4.85, "BİRLEŞİK KORPUS", ha="center", fontsize=10, fontweight="bold", color=BG)
    ax.text(6.3, 4.5, "3.501 benzersiz karar", ha="center", fontsize=9, color="#D0D0D0")
    ax.text(6.3, 4.15, "dedup: tip | daire | esas | karar | tarih", ha="center", fontsize=7.5, color=K3, style="italic")
    ax.text(6.3, 3.82, "( 4.491 metin → −990 dup )", ha="center", fontsize=7, color=K3)
    for y, _, _ in waves:
        _arr(ax, 4.35, y + 0.25, 4.45, 4.4, c=K4)

    # ── 2-eksen filtre ──
    _rbox(ax, 8.5, 4.45, 3.0, 0.85, fc="white", ec=K3)
    ax.text(10.0, 5.05, "2-eksen filtre", ha="center", fontsize=8.5, fontweight="bold", color=K)
    ax.text(10.0, 4.78, "gebelik ∩ travma", ha="center", fontsize=7.5, color=K2)
    ax.text(10.0, 4.55, "→  2.284  (%65,2)", ha="center", fontsize=8, color=K)
    _arr(ax, 8.15, 4.55, 8.45, 4.85)

    # ── Spesifik filtre ──
    _rbox(ax, 8.5, 3.45, 3.0, 0.85, fc="white", ec=K3)
    ax.text(10.0, 4.05, "Spesifik filtre", ha="center", fontsize=8.5, fontweight="bold", color=K)
    ax.text(10.0, 3.78, "düşük · abort · dekolman · preterm", ha="center", fontsize=6.8, color=K2)
    ax.text(10.0, 3.55, "→  571 olgu", ha="center", fontsize=8.5, fontweight="bold", color=ACC)
    _arr(ax, 10.0, 4.42, 10.0, 4.32)

    # ── Tematik (sağ) ──
    _rbox(ax, 12.0, 3.35, 2.8, 2.0, fc=WARM, ec=ACC, lw=0.8, r=0.06)
    ax.text(13.4, 5.1, "TEMATİK DAĞILIM", ha="center", fontsize=8.5, fontweight="bold", color=ACC)
    ax.text(13.4, 4.88, "(örtüşmeli)", ha="center", fontsize=7, color=ACC, style="italic")
    items = [("TCK m.87/88", "n=95"), ("Aile içi şiddet", "n=17"), ("Trafik kazası", "n=22"),
             ("İş kazası", "n=9"), ("Malpraktis", "n=17"), ("Künt batın", "n=110")]
    for i, (lbl, val) in enumerate(items):
        yy = 4.55 - i * 0.2
        ax.text(12.15, yy, lbl, fontsize=7.2, color=K, va="center")
        ax.text(14.65, yy, val, fontsize=7.2, color=K2, ha="right", va="center")
    _arr(ax, 11.55, 3.85, 11.95, 3.85, c=K3)

    # ── Dışlananlar ──
    ax.text(0.3, 2.55, "DIŞLANAN", fontsize=7.5, color=K3, fontweight="bold")
    excl = [(2.15, "67 erişim engelli"),
            (1.85, "1.217 (2-eksen altı)"),
            (1.55, "1.713 (spesifik dışı)")]
    for y, t in excl:
        ax.plot([0.3, 0.5], [y + 0.08, y + 0.08], color=K4, lw=0.5)
        ax.text(0.6, y + 0.08, t, fontsize=7.5, color=K3, va="center")

    # ── Mahkeme dağılımı (alt) ──
    _rbox(ax, 4.5, 0.4, 10.3, 1.85, fc=K, ec=K)
    ax.text(9.65, 1.95, "571 olgunun mahkeme dağılımı", ha="center", fontsize=9.5, fontweight="bold", color=BG)
    courts = [("Yargıtay", 392, 68.7), ("Danıştay", 76, 13.3), ("AYM", 60, 10.5),
              ("AİHM", 33, 5.8), ("Diğer", 10, 1.7)]
    step = 10.3 / 5
    for i, (name, n, pct) in enumerate(courts):
        x = 4.5 + step * (i + 0.5)
        ax.text(x, 1.35, name, fontsize=8.5, color="#D0D0D0", ha="center")
        ax.text(x, 0.85, f"{n}  (%{pct})", fontsize=9, fontweight="bold", color=BG, ha="center")
    _arr(ax, 10.0, 3.4, 9.65, 2.32, c=K4)

    plt.savefig(f"{FIG}/sekil1_prisma.png"); plt.close()


def fig2_tomec_donut():
    fig, ax = plt.subplots(figsize=(10, 5.5))
    ax.set_xlim(0, 10); ax.set_ylim(-0.5, 6); ax.axis("off")

    _fig_label(ax, 0.3, 5.7, 2, "TOMEC Skorunun Beş Alanı ve Göreli Ağırlıkları")

    domains = [
        ("T", "Travma Niteliği / Şiddeti",          25, ACC),
        ("O", "Obstetrik Durum / Gestasyonel Dönem", 20, K),
        ("M", "Maternal Komorbid / Fizyolojik",      15, K2),
        ("E", "Eylem Özellikleri / Enerji-Mekanizma", 20, K),
        ("C", "Kronolojik / Temporal İlişki",        20, K2),
    ]
    bar_x0 = 4.6
    bar_max = 4.5
    for i, (code, name, pct, col) in enumerate(domains):
        y = 4.5 - i * 0.95
        bw = pct / 25 * bar_max
        ax.add_patch(Rectangle((bar_x0, y), bw, 0.5, fc=col, ec=BG, lw=1.5))
        ax.text(0.3, y + 0.25, f"{code}", fontsize=14, fontweight="bold", color=ACC if col == ACC else K, va="center")
        ax.text(0.75, y + 0.25, name, fontsize=8.5, color=K2, va="center")
        ax.text(bar_x0 + bw + 0.18, y + 0.25, f"%{pct}", fontsize=10, fontweight="bold",
                color=ACC if col == ACC else K, va="center")

    # Alt formül
    ax.add_patch(FancyBboxPatch((0.3, -0.3), 9.4, 0.5, boxstyle="round,pad=0.03,rounding_size=0.06",
                                 fc=WARM, ec=K4, lw=0.5))
    ax.text(5.0, -0.05, "TOMEC  =  Σ ( düzey / 4  ×  ağırlık  ×  100 )     →     [0, 100]",
            ha="center", va="center", fontsize=10, fontweight="bold", color=K)

    plt.savefig(f"{FIG}/sekil2_tomec_donut.png"); plt.close()


# ════════════════════════════════════════════════════════════
# 3 — Eşik skalası (gradient termometre)
# ════════════════════════════════════════════════════════════
def fig3_esik():
    fig, ax = plt.subplots(figsize=(12, 3))
    ax.set_xlim(-1, 103); ax.set_ylim(-1.2, 2.2); ax.axis("off")

    _fig_label(ax, -0.5, 1.95, 3, "TOMEC Skor Eşikleri ve Nedensellik Kategorileri")

    bands = [
        ( 0,  9, "Yok", "#E8E4DC", K),
        (10, 24, "Uzak",             "#D4CCBC", K),
        (25, 39, "Düşük",            "#B5A48A", K),
        (40, 54, "Mümkün",           "#8C7A62", "white"),
        (55, 69, "Muhtemel",         "#6B5B46", "white"),
        (70, 84, "Yüksek\nOlasılıklı", "#3D2E1E", "white"),
        (85, 100,"Kesin",            ACC,        "white"),
    ]
    for lo, hi, lbl, bg, tc in bands:
        w = hi - lo + 1
        ax.add_patch(Rectangle((lo, 0), w, 1.15, fc=bg, ec=BG, lw=2))
        ax.text(lo + w/2, 0.70, lbl, ha="center", va="center", fontsize=9.5,
                fontweight="bold", color=tc, linespacing=1.1)
        ax.text(lo + w/2, 0.22, f"{lo}–{hi}", ha="center", va="center", fontsize=8.5, color=tc)

    # Alt ölçek çizgileri
    for x in [0, 10, 25, 40, 55, 70, 85, 100]:
        ax.plot([x, x], [-0.1, -0.25], color=K, lw=0.6)
        ax.text(x, -0.55, str(x), ha="center", fontsize=8, color=K2)

    # Alt ok
    ax.annotate("", xy=(101, -0.85), xytext=(0, -0.85),
                arrowprops=dict(arrowstyle="->", lw=0.6, color=K3))
    ax.text(50, -0.85, "Nedensellik şiddeti →", ha="center", va="bottom", fontsize=8, color=K3, style="italic")

    plt.savefig(f"{FIG}/sekil3_esik.png"); plt.close()


# ════════════════════════════════════════════════════════════
# 4 — Dağılım (lollipop chart — daha modern)
# ════════════════════════════════════════════════════════════
def fig4_dagilim():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))
    for ax in (ax1, ax2):
        ax.set_facecolor(BG)
        ax.spines["left"].set_visible(False)
        ax.spines["bottom"].set_color(K4); ax.spines["bottom"].set_linewidth(0.4)
        ax.tick_params(left=False, colors=K2, labelsize=9)
        ax.grid(axis="x", color="#E8E4DC", lw=0.4, zorder=0)
        ax.set_axisbelow(True)

    # (a) Mahkeme
    mk = [("Yargıtay", 392), ("Danıştay", 76), ("AYM", 60), ("AİHM", 33),
          ("A.Y.İ.M.", 2), ("Sayıştay", 3), ("Askeri Yarg.", 3), ("Uyuşmazlık", 2)]
    names = [m[0] for m in mk]; vals = [m[1] for m in mk]
    y_pos = np.arange(len(names))
    for i, (n, v) in enumerate(zip(names, vals)):
        col = ACC if i == 0 else K2
        ax1.plot([0, v], [i, i], color=col, lw=1.5, zorder=2)
        ax1.scatter([v], [i], color=col, s=40, zorder=3)
        ax1.text(v + 8, i, f"{v}  ({v/571*100:.1f}%)", va="center", fontsize=8.5, color=K)
    ax1.set_yticks(y_pos); ax1.set_yticklabels(names)
    ax1.set_xlim(0, 480); ax1.invert_yaxis()
    ax1.set_xlabel("Karar sayısı  (n=571)", fontsize=9, color=K2)
    ax1.set_title("(a)  Mahkeme Türüne Göre", fontsize=10, color=K, pad=10)

    # (b) Tematik
    th = [("Künt batın / fiziksel", 110), ("TCK m.87/88 (sıkı)", 95),
          ("Danıştay — idari sorum.", 76), ("AYM — yaşam hakkı", 60),
          ("AİHM — m.2/3/8", 33), ("Trafik kazası", 22),
          ("Malpraktis", 17), ("Aile içi şiddet", 17), ("İş kazası", 9)]
    tn = [t[0] for t in th]; tv = [t[1] for t in th]
    for i, (n, v) in enumerate(zip(tn, tv)):
        col = ACC if i == 0 else K2
        ax2.plot([0, v], [i, i], color=col, lw=1.5, zorder=2)
        ax2.scatter([v], [i], color=col, s=40, zorder=3)
        ax2.text(v + 2, i, str(v), va="center", fontsize=8.5, color=K)
    ax2.set_yticks(np.arange(len(tn))); ax2.set_yticklabels(tn)
    ax2.set_xlim(0, 135); ax2.invert_yaxis()
    ax2.set_xlabel("Karar sayısı  (örtüşmeli)", fontsize=9, color=K2)
    ax2.set_title("(b)  Tematik Alt-Grup", fontsize=10, color=K, pad=10)

    fig.suptitle("Şekil 4.  571 Erken Doğum / Düşük Olgusunun Yargısal ve Tematik Dağılımı",
                 fontsize=11, fontweight="bold", color=K, y=1.01)
    plt.tight_layout()
    plt.savefig(f"{FIG}/sekil4_dagilim.png"); plt.close()


# ════════════════════════════════════════════════════════════
# 5 — Patofizyolojik zincir (3 sütunlu akış, temiz oklar)
# ════════════════════════════════════════════════════════════
def fig5_zincir():
    fig, ax = plt.subplots(figsize=(13, 8.5))
    ax.set_xlim(0, 13); ax.set_ylim(0, 9); ax.axis("off")

    _fig_label(ax, 0.3, 8.7, 5, "Gebelikte Mekanik Travma Sonrası Patofizyolojik Zincir")

    # Sütun başlıkları
    cols = [(1.8, "MEKANİZMA"), (6.5, "PATOFİZYOLOJİ"), (10.8, "HEDEF YAPI")]
    for x, label in cols:
        ax.text(x, 8.2, label, ha="center", fontsize=8, fontweight="bold", color=ACC)
        ax.plot([x - 1.5, x + 1.5], [8.07, 8.07], color=ACC, lw=0.6)

    # Sol: mekanizmalar
    mechs = [
        (7.2, "Künt karın travması", "yumruk · tekme · kemer · direksiyon"),
        (6.0, "Yüksek-enerji kaza",  "MVA · iş kazası · yüksekten düşme"),
        (4.8, "Penetran travma",      "ateşli silah · delici alet"),
    ]
    for y, h, s in mechs:
        _rbox(ax, 0.1, y - 0.35, 3.4, 0.7, fc="white", ec=K3)
        ax.text(1.8, y + 0.1, h, ha="center", fontsize=9.5, fontweight="bold", color=K)
        ax.text(1.8, y - 0.15, s, ha="center", fontsize=8, color=K3, style="italic")

    # Orta: mediyatör
    _rbox(ax, 4.7, 5.3, 3.6, 2.4, fc=WARM, ec=ACC, lw=0.8)
    ax.text(6.5, 7.35, "Mediyatör", ha="center", fontsize=10, fontweight="bold", color=ACC)
    for i, line in enumerate(["direkt uterin etki", "ani basınç değişimi",
                               "akselerasyon–deselerasyon", "shear stres"]):
        ax.text(6.5, 6.85 - i * 0.35, line, ha="center", fontsize=9, color=K2)

    for y, _, _ in mechs:
        _arr(ax, 3.55, y, 4.65, 6.5, c=K4)

    # Sağ: hedefler (kompakt, alt kısımda toplama hattı için yer bırak)
    tgts = [(7.5, "Plasenta dekolmanı"), (6.85, "Fetomaternal hemoraji"),
            (6.20, "Uterin rüptür"), (5.55, "Direkt fetal yaralanma"),
            (4.90, "Erken membran rüptürü (EMR/PROM)")]
    for y, t in tgts:
        _rbox(ax, 9.0, y - 0.24, 3.7, 0.48, fc="white", ec=K3)
        ax.text(10.85, y, t, ha="center", va="center", fontsize=9, color=K)
        _arr(ax, 8.35, 6.5, 8.95, y, c=K4)

    # Toplama hattı: tüm hedef kutuları sağ kenarından dikey ana hatta birleştir
    bus_x = 12.85
    bus_y_top, bus_y_bot = 4.66, 7.5
    ax.plot([bus_x, bus_x], [bus_y_top, bus_y_bot], color=K3, lw=0.7)
    for y, _ in tgts:
        ax.plot([12.7, bus_x], [y, y], color=K3, lw=0.5)

    # Hattın alt ucundan inip 3 sonuca yelpazelenir — tek temiz kavşak
    junction_y = 4.0
    ax.plot([bus_x, bus_x], [bus_y_top, junction_y], color=K3, lw=0.7)
    ax.plot([2.2, bus_x], [junction_y, junction_y], color=K3, lw=0.5)

    # Alt: sonuçlar
    ax.text(6.5, 3.55, "KLİNİK SONUÇ", ha="center", fontsize=8, fontweight="bold", color=ACC)
    ax.plot([2.0, 11.0], [3.42, 3.42], color=ACC, lw=0.6)
    outcomes = [(2.2, "Spontan / missed abort", "< 22 hf"),
                (6.5, "Preterm doğum", "22–36⁺⁶ hf"),
                (10.8, "İntrauterin fetal ölüm", "IUMF / ölü doğum")]
    for x, h, s in outcomes:
        _rbox(ax, x - 1.8, 2.3, 3.6, 0.85, fc=K, ec=K)
        ax.text(x, 2.95, h, ha="center", fontsize=9.5, fontweight="bold", color=BG)
        ax.text(x, 2.6, s, ha="center", fontsize=8, color="#C0C0C0", style="italic")
        # Toplama hattından her sonuca temiz dikey ok
        _arr(ax, x, junction_y, x, 3.18, c=K3, lw=0.7)

    # Alt açıklama
    ax.text(6.5, 1.65, "Temporal pencere:   dakikalar (rüptür)  →  saatler (dekolman)  →  günler–haftalar (EMR / preterm)",
            ha="center", fontsize=8.5, color=K3, style="italic")
    ax.text(6.5, 1.25, "Kaynak:  Queensland Clinical Guideline MN19.31-V2-R24 (2019);  ATK İhtisas Kurulu raporları",
            ha="center", fontsize=8, color=K4)

    plt.savefig(f"{FIG}/sekil5_zincir.png"); plt.close()


# ════════════════════════════════════════════════════════════
# 6 — Karar ağacı (dikey akış)
# ════════════════════════════════════════════════════════════
def fig6_karar_agaci():
    fig, ax = plt.subplots(figsize=(13, 9.5))
    ax.set_xlim(0, 13); ax.set_ylim(0, 10); ax.axis("off")

    _fig_label(ax, 0.3, 9.7, 6, "TOMEC Skorunun Adli Karar Mekanizmasındaki Yeri")

    # Üst akış adımları
    steps = [
        (8.8, "Vaka:   Gebe kadın  +  travma iddiası  +  obstetrik sonuç", True),
        (7.8, "1.  ATK \u0130htisas Kurulu  (1. veya 6.)  \u00f6n de\u011ferlendirmesi", False),
        (6.8, "2.  TOMEC alanlar\u0131n\u0131n doldurulmas\u0131   T \u00b7 O \u00b7 M \u00b7 E \u00b7 C", False),
        (5.8, "3.  Toplam skor  [0\u2013100]  hesaplanmas\u0131", False),
    ]
    for y, t, emph in steps:
        fc = K if emph else "white"
        tc = BG if emph else K
        ec = K if emph else K3
        _rbox(ax, 1.5, y - 0.32, 10.0, 0.64, fc=fc, ec=ec, lw=0.7 if emph else 0.5)
        ax.text(6.5, y, t, ha="center", va="center", fontsize=10,
                fontweight="bold" if emph else "normal", color=tc)
    for y1, y2 in [(8.45, 8.15), (7.45, 7.15), (6.45, 6.15)]:
        _arr(ax, 6.5, y1, 6.5, y2)

    # Karar baklavası
    _arr(ax, 6.5, 5.45, 6.5, 5.2)
    ax.add_patch(Polygon([(6.5, 5.1), (10, 4.2), (6.5, 3.3), (3, 4.2)],
                          fc=WARM, ec=ACC, lw=1.0, zorder=2))
    ax.text(6.5, 4.2, "Skor hangi eşikte?", ha="center", va="center",
            fontsize=10.5, fontweight="bold", color=ACC)

    # Üç kol
    branches = [
        (2.0, "≥ 70", "Yüksek olasılıklı\nKesin", "Kuvvetli"),
        (6.5, "40–69", "Mümkün\nMuhtemel", "Orta"),
        (11.0, "< 40", "Düşük / Uzak\nYok", "Zayıf"),
    ]
    for x, score, sub, strength in branches:
        _arr(ax, 6.5 + (x - 6.5)*0.3, 3.55, x, 2.95, c=K3)
        ax.text((6.5 + x)/2, 3.15, strength, fontsize=8, color=ACC,
                fontweight="bold", style="italic", ha="center")
        _rbox(ax, x - 1.8, 2.1, 3.6, 0.8, fc=K, ec=K)
        ax.text(x, 2.7, f"Skor {score}", ha="center", fontsize=10, fontweight="bold", color=BG)
        ax.text(x, 2.35, sub, ha="center", fontsize=8.5, color="#C0C0C0", linespacing=1.2)

    # Yargısal sonuçlar
    judg = [
        (2.0,  "Doğrudan illiyet",     "TCK m.87/88 ağırlaştırıcı\nTam tazminat"),
        (6.5,  "Bilirkişi tartışması", "Kısmi sorumluluk\nKusur oranlandırması"),
        (11.0, "İlliyet kurulamadı",   "Beraat / red\nÖnlenemez komplikasyon"),
    ]
    for x, head, detail in judg:
        _arr(ax, x, 2.05, x, 1.7)
        _rbox(ax, x - 1.8, 0.3, 3.6, 1.3, fc="white", ec=K3)
        ax.text(x, 1.35, head, ha="center", fontsize=9.5, fontweight="bold", color=K)
        ax.text(x, 0.85, detail, ha="center", fontsize=8.5, color=K2, linespacing=1.2)

    plt.savefig(f"{FIG}/sekil6_karar_agaci.png"); plt.close()


# ════════════════════════════════════════════════════════════
# 7 — Temporal pencere (Gantt tarzı, temiz)
# ════════════════════════════════════════════════════════════
def fig7_temporal():
    fig, ax = plt.subplots(figsize=(13, 6))
    ax.set_xlim(-0.5, 14.5); ax.set_ylim(-1.5, 7); ax.axis("off")

    _fig_label(ax, 0, 6.7, 7, "Travma–Obstetrik Sonuç Temporal Penceresi  (TOMEC C-alanı)")

    # Zaman ekseni
    ax.plot([0, 14], [0.5, 0.5], color=K, lw=0.8, zorder=3)
    ax.plot([14, 13.7], [0.55, 0.5], color=K, lw=0.8, zorder=3)
    ax.plot([14, 13.7], [0.45, 0.5], color=K, lw=0.8, zorder=3)
    ticks = [(0, "0\ntravma"), (1, "1 sa"), (2, "6 sa"), (4, "24 sa"),
             (6, "3 gün"), (8, "1 hf"), (10, "2 hf"), (12, "≥ 4 hf")]
    for x, l in ticks:
        ax.plot([x, x], [0.35, 0.65], color=K, lw=0.7)
        ax.text(x, 0.05, l, ha="center", va="top", fontsize=8.5, color=K2)

    # Bantlar (en kısa üstte, en uzun altta — ters piramit)
    rows = [
        (0.0,  0.7,  "Direkt rüptür  (uterus / dalak)",               ACC),
        (0.4,  1.5,  "Plasenta dekolmanı",                              "#3D2E1E"),
        (1.0,  5.0,  "Fetomaternal hemoraji / fetal sıkıntı",          "#6B5B46"),
        (2.0,  7.0,  "EMR / PROM",                                      K),
        (4.0, 12.0,  "Preterm eylem",                                   "#8C7A62"),
        (6.0, 14.0,  "Geç IUMF / spontan abort",                       "#B5A48A"),
    ]
    h = 0.55
    gap = 0.1
    for i, (x0, x1, lbl, col) in enumerate(rows):
        y = 0.5 + (i + 1) * (h + gap)
        ax.add_patch(Rectangle((x0, y), x1 - x0, h, fc=col, ec=BG, lw=2, zorder=2))
        is_wide = (x1 - x0) >= 3.5
        if is_wide:
            tc = BG if col in (ACC, "#3D2E1E", K, "#6B5B46") else K
            ax.text((x0 + x1)/2, y + h/2, lbl, ha="center", va="center",
                    fontsize=8.5, color=tc, fontweight="bold", zorder=3)
        else:
            ax.text(x1 + 0.15, y + h/2, lbl, ha="left", va="center",
                    fontsize=8.5, color=K, fontweight="bold")

    ax.text(7, -0.7, "TOMEC-C:  sonuç olağan tabloya uyuyorsa yüksek puan;  uzun aralıklarda alternatif sebepler dışlanmalıdır.",
            ha="center", fontsize=8.5, color=K3, style="italic")

    plt.savefig(f"{FIG}/sekil7_temporal.png"); plt.close()


# ════════════════════════════════════════════════════════════
# 8 — Puanlama matrisi (temiz tablo)
# ════════════════════════════════════════════════════════════
def fig8_matris():
    fig, ax = plt.subplots(figsize=(13, 6.5))
    ax.axis("off")

    _fig_label(ax, 0.05, 5.95, 8, "TOMEC Alan-Bazlı Puanlama Matrisi")

    cats = ["T  Travma", "O  Obstetrik", "M  Maternal", "E  Eylem-Mek.", "C  Temporal"]
    levels = ["Düzey 0", "Düzey 1", "Düzey 2", "Düzey 3", "Düzey 4"]
    descr = [
        ["Yok", "Hafif yumruk\nitme", "Tekrarlayan darp\norta künt", "Yüksek-enerji\n(MVA, düşme)", "Penetran / multipl\nağır"],
        ["Gebelik yok", "≤ 12 hf", "13–22 hf", "23–27 hf", "≥ 28 hf"],
        ["Sağlıklı", "Hafif komorbid", "Preeklampsi\nHT / DM", "HELLP\nkoagülopati", "Önceki dekolman\nplasenta previa"],
        ["İlgisiz", "Dolaylı\n(uzak bölge)", "Direkt karın\n(yumruk / tekme)", "Yüksek-hız\n(araç / düşme)", "Penetran karın\nkemerli MVA"],
        ["İlgisiz", "> 4 hafta\n(alt. dışlanmalı)", "1–4 hafta", "24 sa – 7 gün", "< 24 saat\n(klasik dekolman)"],
    ]
    weights = [0.25, 0.20, 0.15, 0.20, 0.20]
    shades = ["#F5F2ED", "#E8E1D4", "#D4C9B5", "#A89A84", "#6B5B46"]

    cw, ch = 1.85, 1.0
    x0, y0 = 2.1, 4.65
    lw = 2.0

    for j, lvl in enumerate(levels):
        ax.add_patch(Rectangle((x0 + j*cw, y0), cw, 0.55, fc=K, ec=BG, lw=2))
        ax.text(x0 + j*cw + cw/2, y0 + 0.275, lvl, ha="center", va="center",
                color=BG, fontweight="bold", fontsize=9.5)

    for i, (cat, row) in enumerate(zip(cats, descr)):
        y = y0 - (i+1)*ch
        ax.add_patch(Rectangle((x0 - lw, y), lw, ch, fc=K, ec=BG, lw=2))
        ax.text(x0 - lw/2, y + ch/2, cat, ha="center", va="center",
                color=BG, fontweight="bold", fontsize=9)
        for j, txt in enumerate(row):
            ax.add_patch(Rectangle((x0 + j*cw, y), cw, ch, fc=shades[j], ec=BG, lw=2))
            tc = BG if j >= 3 else K
            ax.text(x0 + j*cw + cw/2, y + ch/2, txt,
                    ha="center", va="center", fontsize=8, color=tc, linespacing=1.15)
        ax.text(x0 + 5*cw + 0.2, y + ch/2, f"× {weights[i]:.2f}",
                ha="left", va="center", fontsize=10.5, color=ACC, fontweight="bold")

    y_f = y0 - 5*ch - 0.55
    ax.add_patch(FancyBboxPatch((x0 - lw, y_f), lw + 5*cw + 0.8, 0.5,
                                 boxstyle="round,pad=0.03,rounding_size=0.06",
                                 fc=WARM, ec=K3, lw=0.6))
    ax.text(x0 - lw + (lw + 5*cw + 0.8)/2, y_f + 0.25,
            "Toplam  =  Σ ( düzey / 4  ×  ağırlık  ×  100 )           [0,  100]",
            ha="center", va="center", fontsize=10.5, fontweight="bold", color=K)

    ax.set_xlim(-0.5, 13); ax.set_ylim(-1.2, 6.2)
    plt.savefig(f"{FIG}/sekil8_matris.png"); plt.close()


# ════════════════════════════════════════════════════════════
# 9 — Çalışma kâğıdı (A4 yatay form)
# ════════════════════════════════════════════════════════════
def fig9_calisma_kagidi():
    fig, ax = plt.subplots(figsize=(15, 9.5))
    ax.set_xlim(0, 15); ax.set_ylim(0, 9.5); ax.axis("off")

    # Başlık
    ax.add_patch(Rectangle((0, 8.8), 15, 0.7, fc=K, ec="none"))
    ax.text(7.5, 9.22, "TOMEC ÇALIŞMA KÂĞIDI", ha="center", fontsize=14, fontweight="bold", color=BG)
    ax.text(7.5, 8.95, "Travma · Obstetrik · Mediko-legal Causality   —   Standardize Değerlendirme Formu",
            ha="center", fontsize=9, color="#C0C0C0", style="italic")

    # Kimlik
    _rbox(ax, 0.3, 7.7, 14.4, 0.95, fc="white", ec=K3, lw=0.6)
    fields = [("Olgu No:", 0.5), ("Tarih:", 4.2), ("Hekim:", 8.0), ("Kurum:", 12.0)]
    for lab, x in fields:
        ax.text(x, 8.35, lab, fontsize=9, color=K, fontweight="bold")
        ax.plot([x + 1.0, x + 3.5], [8.28, 8.28], color=K3, lw=0.5)
    subs = [("Gebelik Haftası:", 0.5, 2.3, 4.2), ("Travma Tipi:", 4.7, 6.0, 9.5),
            ("Sonuç:", 10.0, 10.8, 14.5)]
    for lab, lx, l1, l2 in subs:
        ax.text(lx, 7.92, lab, fontsize=9, color=K, fontweight="bold")
        ax.plot([l1, l2], [7.85, 7.85], color=K3, lw=0.5)

    # Matris başlığı
    ax.text(7.5, 7.4, "5 Alanlı Puanlama Matrisi", ha="center", fontsize=10.5, fontweight="bold", color=K)
    ax.text(7.5, 7.15, "her alandan yalnız bir düzey işaretleyin", ha="center", fontsize=8.5, color=K3, style="italic")

    cats = [
        ("T — Travma Niteliği / Şiddeti", 0.25,
         ["Yok / belirsiz", "Hafif künt", "Orta enerji", "Yüksek enerji /\npenetran", "Yaşamı tehdit\neden"]),
        ("O — Obstetrik Durum / Gestasyon", 0.20,
         ["≤ 6 hf veya\n> 37 hf", "7–12 hf", "13–23 hf", "24–32 hf\n(kritik)", "33–37 hf"]),
        ("M — Maternal Komorbid", 0.15,
         ["Yok", "Düşük risk\n(DM, hafif HT)", "Orta\n(preeklampsi)", "Yüksek\n(plasenta previa)", "Çok yüksek\n(multipl)"]),
        ("E — Eylem / Enerji-Mekanizma", 0.20,
         ["Belirsiz", "Düşük enerji\ndüşme", "Direkt batın\ndarbe", "Trafik kazası", "Penetran /\nyüksek enerji"]),
        ("C — Kronolojik / Temporal", 0.20,
         ["> 4 hafta\ngecikme", "1–4 hafta", "3–7 gün", "24–72 saat", "0–24 saat"]),
    ]

    x0 = 0.3; LW = 3.6; cw = 2.0; ch = 0.88; y0 = 6.9
    shades = ["#F5F2ED", "#E8E1D4", "#D4C9B5", "#A89A84", "#6B5B46"]
    for i, (cat, w, lvls) in enumerate(cats):
        y = y0 - (i+1)*ch
        ax.add_patch(Rectangle((x0, y), LW, ch, fc=K, ec=BG, lw=2))
        ax.text(x0 + LW/2, y + ch/2, cat, ha="center", va="center",
                color=BG, fontweight="bold", fontsize=9)
        for j, lev in enumerate(lvls):
            xc = x0 + LW + j*cw
            ax.add_patch(Rectangle((xc, y), cw, ch, fc=shades[j], ec=BG, lw=2))
            # D rozeti
            ax.text(xc + 0.12, y + ch - 0.15, f"D{j}", fontsize=7, color=K if j < 3 else BG, fontweight="bold")
            # Onay kutusu
            ax.add_patch(Rectangle((xc + cw - 0.30, y + ch - 0.25), 0.18, 0.18,
                                   fc="white", ec=K3, lw=0.5))
            tc = BG if j >= 3 else K
            ax.text(xc + cw/2, y + 0.28, lev, ha="center", va="center",
                    fontsize=7.8, color=tc, linespacing=1.1)
        ax.text(x0 + LW + 5*cw + 0.15, y + ch/2, f"× {w:.2f}",
                ha="left", va="center", fontsize=10.5, color=ACC, fontweight="bold")

    # Formül
    y_f = y0 - 5*ch - 0.45
    _rbox(ax, 0.3, y_f - 0.05, 14.4, 0.5, fc=WARM, ec=K3, lw=0.5)
    ax.text(7.5, y_f + 0.20,
            "TOPLAM TOMEC  =  Σ ( düzey / 4  ×  ağırlık  ×  100 )           Toplam Skor:  ______ / 100",
            ha="center", va="center", fontsize=10.5, fontweight="bold", color=K)

    # Eşik bandı
    yb = y_f - 0.9
    band_specs = [("Yok", 0, 9, "#E8E4DC", K), ("Uzak", 10, 24, "#D4CCBC", K),
                  ("Düşük", 25, 39, "#B5A48A", K), ("Mümkün", 40, 54, "#8C7A62", "white"),
                  ("Muhtemel", 55, 69, "#6B5B46", "white"), ("Yüksek O.", 70, 84, "#3D2E1E", "white"),
                  ("Kesin", 85, 100, ACC, "white")]
    bx = 0.3; bw = 14.4/100
    for lbl, lo, hi, col, tc in band_specs:
        w = (hi - lo + 1) * bw
        ax.add_patch(Rectangle((bx + lo*bw, yb), w, 0.55, fc=col, ec=BG, lw=1))
        ax.text(bx + lo*bw + w/2, yb + 0.36, lbl, ha="center", va="center",
                fontsize=8, color=tc, fontweight="bold")
        ax.text(bx + lo*bw + w/2, yb + 0.15, f"{lo}–{hi}", ha="center", va="center",
                fontsize=7, color=tc)

    # İmza
    ys = yb - 0.65
    ax.text(0.3, ys + 0.12, "Sonuç Kategorisi:", fontsize=9, color=K, fontweight="bold")
    _rbox(ax, 2.5, ys - 0.08, 4.8, 0.38, fc="white", ec=K3, lw=0.5)
    ax.text(8.0, ys + 0.12, "Hekim İmzası:", fontsize=9, color=K, fontweight="bold")
    ax.plot([9.8, 12.2], [ys + 0.02, ys + 0.02], color=K3, lw=0.5)
    ax.text(12.6, ys + 0.12, "Tarih:", fontsize=9, color=K, fontweight="bold")
    ax.plot([13.2, 14.6], [ys + 0.02, ys + 0.02], color=K3, lw=0.5)

    ax.text(7.5, 0.2,
            "Şekil 9. TOMEC Çalışma Kâğıdı — A4 yatay basılabilir form. Her değerlendirmede doldurulur, ATK raporu ekine eklenir.",
            ha="center", fontsize=8, color=K3, style="italic")

    plt.savefig(f"{FIG}/sekil9_calisma_kagidi.png"); plt.close()


# === Çalıştır ===
for fn in [fig1_prisma, fig2_tomec_donut, fig3_esik, fig4_dagilim,
           fig5_zincir, fig6_karar_agaci, fig7_temporal, fig8_matris, fig9_calisma_kagidi]:
    print("Building", fn.__name__)
    fn()
print("DONE — all 9 figures in", FIG)
