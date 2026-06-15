"""TOMEC — English figure regeneration for JFLM submission.
Same layout as scripts/build_figures.py; all Turkish labels translated to English.
Deterministic matplotlib output."""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Polygon

FIG = "client/public/figures"
os.makedirs(FIG, exist_ok=True)

NAVY, WINE, SAND, SAGE, GREY = "#0D2545", "#7A2231", "#C9A06A", "#5A8F7B", "#9AA5B1"
K, K2, K3, K4 = NAVY, "#3A4A60", GREY, "#C8D0DA"
BG, WARM, ACC, ACC2 = "#FFFFFF", "#F2F5F8", WINE, SAND

plt.rcParams.update({
    "font.family": "DejaVu Serif", "font.size": 9,
    "axes.titlesize": 11, "axes.titleweight": "bold", "axes.labelsize": 9,
    "axes.edgecolor": K3, "axes.linewidth": 0.4,
    "axes.spines.top": False, "axes.spines.right": False,
    "xtick.color": K2, "ytick.color": K2,
    "xtick.major.width": 0.4, "ytick.major.width": 0.4,
    "lines.linewidth": 0.8, "patch.linewidth": 0.6,
    "figure.dpi": 250, "savefig.dpi": 250,
    "savefig.bbox": "tight", "savefig.pad_inches": 0.35,
    "savefig.facecolor": BG, "figure.facecolor": BG, "axes.facecolor": BG,
})

def _rbox(ax, x, y, w, h, fc=BG, ec=K3, lw=0.6, r=0.06):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle=f"round,pad=0.03,rounding_size={r}", fc=fc, ec=ec, lw=lw))

def _arr(ax, x1, y1, x2, y2, c=K4, lw=0.7):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2),
        arrowstyle="-|>", mutation_scale=9, lw=lw, color=c))

def _fig_label(ax, x, y, num, title, fs=11):
    ax.text(x, y, f"Figure {num}.  {title}", fontsize=fs, color=K, ha="left", va="baseline", fontweight="bold")


# 1 — PRISMA
def fig1_prisma():
    fig, ax = plt.subplots(figsize=(15, 6.5))
    ax.set_xlim(0, 15); ax.set_ylim(0, 6.5); ax.axis("off")
    _fig_label(ax, 0.3, 6.2, 1, "Systematic Case-Law Search Flow (PRISMA-adapted)")
    ax.text(0.3, 5.85, "Sinerji Mevzuat database  ·  4 search waves  ·  11 May 2026",
            fontsize=8, color=K3, style="italic")
    waves = [
        (5.05, '1  "pregnant + trauma"',         '871 docs · 783 unique'),
        (4.45, '2  "pregnant + causation"',      '1,652 docs · 1,468 unique'),
        (3.85, '3  "pregnancy + miscarriage"',   '1,839 docs · 1,194 new unique'),
        (3.25, '4  "fetus + death"',             '129 docs · 76 new unique'),
    ]
    for y, label, counts in waves:
        _rbox(ax, 0.3, y, 4.0, 0.5, fc="white", ec=K3)
        ax.text(0.45, y + 0.27, label, fontsize=8.5, fontweight="bold", color=K, va="center")
        ax.text(4.18, y + 0.27, counts, fontsize=7, color=K2, ha="right", va="center")
    _rbox(ax, 4.5, 3.55, 3.6, 1.65, fc=K, ec=K)
    ax.text(6.3, 4.85, "MERGED CORPUS", ha="center", fontsize=10, fontweight="bold", color=BG)
    ax.text(6.3, 4.5, "3,501 unique decisions", ha="center", fontsize=9, color="#D0D0D0")
    ax.text(6.3, 4.15, "dedup keys: type | chamber | docket | decision | date", ha="center", fontsize=7.5, color=K3, style="italic")
    ax.text(6.3, 3.82, "( 4,491 records → −990 duplicates )", ha="center", fontsize=7, color=K3)
    for y, _, _ in waves:
        _arr(ax, 4.35, y + 0.25, 4.45, 4.4, c=K4)
    _rbox(ax, 8.5, 4.45, 3.0, 0.85, fc="white", ec=K3)
    ax.text(10.0, 5.05, "Two-axis filter", ha="center", fontsize=8.5, fontweight="bold", color=K)
    ax.text(10.0, 4.78, "pregnancy ∩ trauma", ha="center", fontsize=7.5, color=K2)
    ax.text(10.0, 4.55, "→  2,284  (65.2%)", ha="center", fontsize=8, color=K)
    _arr(ax, 8.15, 4.55, 8.45, 4.85)
    _rbox(ax, 8.5, 3.45, 3.0, 0.85, fc="white", ec=K3)
    ax.text(10.0, 4.05, "Specific filter", ha="center", fontsize=8.5, fontweight="bold", color=K)
    ax.text(10.0, 3.78, "miscarriage · abortion · abruption · preterm", ha="center", fontsize=6.8, color=K2)
    ax.text(10.0, 3.55, "→  571 cases", ha="center", fontsize=8.5, fontweight="bold", color=ACC)
    _arr(ax, 10.0, 4.42, 10.0, 4.32)
    _rbox(ax, 12.0, 3.35, 2.8, 2.0, fc=WARM, ec=ACC, lw=0.8, r=0.06)
    ax.text(13.4, 5.1, "THEMATIC DISTRIBUTION", ha="center", fontsize=8.5, fontweight="bold", color=ACC)
    ax.text(13.4, 4.88, "(overlapping)", ha="center", fontsize=7, color=ACC, style="italic")
    items = [("TPC art. 87/88", "n=95"), ("Domestic violence", "n=17"), ("Traffic accident", "n=22"),
             ("Workplace accident", "n=9"), ("Malpractice", "n=17"), ("Blunt abdominal", "n=110")]
    for i, (lbl, val) in enumerate(items):
        yy = 4.55 - i * 0.2
        ax.text(12.15, yy, lbl, fontsize=7.2, color=K, va="center")
        ax.text(14.65, yy, val, fontsize=7.2, color=K2, ha="right", va="center")
    _arr(ax, 11.55, 3.85, 11.95, 3.85, c=K3)
    ax.text(0.3, 2.55, "EXCLUDED", fontsize=7.5, color=K3, fontweight="bold")
    excl = [(2.15, "67 access-restricted"),
            (1.85, "1,217 (failed two-axis filter)"),
            (1.55, "1,713 (non-specific)")]
    for y, t in excl:
        ax.plot([0.3, 0.5], [y + 0.08, y + 0.08], color=K4, lw=0.5)
        ax.text(0.6, y + 0.08, t, fontsize=7.5, color=K3, va="center")
    _rbox(ax, 4.5, 0.4, 10.3, 1.85, fc=K, ec=K)
    ax.text(9.65, 1.95, "Court distribution of the 571 cases", ha="center", fontsize=9.5, fontweight="bold", color=BG)
    courts = [("Court of Cassation", 392, 68.7), ("Council of State", 76, 13.3),
              ("Constitutional Court", 60, 10.5), ("ECtHR", 33, 5.8), ("Other", 10, 1.7)]
    step = 10.3 / 5
    for i, (name, n, pct) in enumerate(courts):
        x = 4.5 + step * (i + 0.5)
        ax.text(x, 1.35, name, fontsize=8.5, color="#D0D0D0", ha="center")
        ax.text(x, 0.85, f"{n}  ({pct}%)", fontsize=9, fontweight="bold", color=BG, ha="center")
    _arr(ax, 10.0, 3.4, 9.65, 2.32, c=K4)
    plt.savefig(f"{FIG}/sekil1_prisma.png"); plt.close()


# 2 — TOMEC five domains
def fig2_tomec_donut():
    fig, ax = plt.subplots(figsize=(10, 5.5))
    ax.set_xlim(0, 10); ax.set_ylim(-0.5, 6); ax.axis("off")
    _fig_label(ax, 0.3, 5.7, 2, "The Five Domains of the TOMEC Score and Their Relative Weights")
    domains = [
        ("T", "Trauma Severity / Mechanism Energy",      25, ACC),
        ("O", "Obstetric Status / Gestational Age",      20, K),
        ("M", "Maternal Comorbidity / Physiology",       15, K2),
        ("E", "Act Characteristics / Energy-Mechanism",  20, K),
        ("C", "Chronological / Temporal Relationship",   20, K2),
    ]
    bar_x0, bar_max = 4.6, 4.5
    for i, (code, name, pct, col) in enumerate(domains):
        y = 4.5 - i * 0.95
        bw = pct / 25 * bar_max
        ax.add_patch(Rectangle((bar_x0, y), bw, 0.5, fc=col, ec=BG, lw=1.5))
        ax.text(0.3, y + 0.25, f"{code}", fontsize=14, fontweight="bold", color=ACC if col == ACC else K, va="center")
        ax.text(0.75, y + 0.25, name, fontsize=8.5, color=K2, va="center")
        ax.text(bar_x0 + bw + 0.18, y + 0.25, f"{pct}%", fontsize=10, fontweight="bold",
                color=ACC if col == ACC else K, va="center")
    ax.add_patch(FancyBboxPatch((0.3, -0.3), 9.4, 0.5, boxstyle="round,pad=0.03,rounding_size=0.06",
                                 fc=WARM, ec=K4, lw=0.5))
    ax.text(5.0, -0.05, "TOMEC  =  Σ ( level / 4  ×  weight  ×  100 )     →     [0, 100]",
            ha="center", va="center", fontsize=10, fontweight="bold", color=K)
    plt.savefig(f"{FIG}/sekil2_tomec_donut.png"); plt.close()


# 3 — Threshold scale
def fig3_esik():
    fig, ax = plt.subplots(figsize=(12, 3))
    ax.set_xlim(-1, 103); ax.set_ylim(-1.2, 2.2); ax.axis("off")
    _fig_label(ax, -0.5, 1.95, 3, "TOMEC Score Thresholds and Causality Categories")
    bands = [
        ( 0,  9, "None",     "#EEF1F4", K),
        (10, 24, "Remote",   "#D4DBE3", K),
        (25, 39, "Low",      "#C9A06A", K),
        (40, 54, "Possible", "#A78250", "white"),
        (55, 69, "Probable", "#5A8F7B", "white"),
        (70, 84, "Highly\nProbable", "#0D2545", "white"),
        (85, 100,"Definite", ACC,      "white"),
    ]
    for lo, hi, lbl, bg, tc in bands:
        w = hi - lo + 1
        ax.add_patch(Rectangle((lo, 0), w, 1.15, fc=bg, ec=BG, lw=2))
        ax.text(lo + w/2, 0.70, lbl, ha="center", va="center", fontsize=9.5,
                fontweight="bold", color=tc, linespacing=1.1)
        ax.text(lo + w/2, 0.22, f"{lo}–{hi}", ha="center", va="center", fontsize=8.5, color=tc)
    for x in [0, 10, 25, 40, 55, 70, 85, 100]:
        ax.plot([x, x], [-0.1, -0.25], color=K, lw=0.6)
        ax.text(x, -0.55, str(x), ha="center", fontsize=8, color=K2)
    ax.annotate("", xy=(101, -0.85), xytext=(0, -0.85),
                arrowprops=dict(arrowstyle="->", lw=0.6, color=K3))
    ax.text(50, -0.85, "Causality strength →", ha="center", va="bottom", fontsize=8, color=K3, style="italic")
    plt.savefig(f"{FIG}/sekil3_esik.png"); plt.close()


# 4 — Distribution lollipop
def fig4_dagilim():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))
    for ax in (ax1, ax2):
        ax.set_facecolor(BG)
        ax.spines["left"].set_visible(False)
        ax.spines["bottom"].set_color(K4); ax.spines["bottom"].set_linewidth(0.4)
        ax.tick_params(left=False, colors=K2, labelsize=9)
        ax.grid(axis="x", color="#EEF1F4", lw=0.4, zorder=0)
        ax.set_axisbelow(True)
    mk = [("Court of Cassation", 392), ("Council of State", 76), ("Constitutional Court", 60),
          ("ECtHR", 33), ("AYIM (Mil.Adm.)", 2), ("Court of Accounts", 3),
          ("Military High Court", 3), ("Court of Disputes", 2)]
    names = [m[0] for m in mk]; vals = [m[1] for m in mk]
    y_pos = np.arange(len(names))
    for i, (n, v) in enumerate(zip(names, vals)):
        col = ACC if i == 0 else K2
        ax1.plot([0, v], [i, i], color=col, lw=1.5, zorder=2)
        ax1.scatter([v], [i], color=col, s=40, zorder=3)
        ax1.text(v + 8, i, f"{v}  ({v/571*100:.1f}%)", va="center", fontsize=8.5, color=K)
    ax1.set_yticks(y_pos); ax1.set_yticklabels(names)
    ax1.set_xlim(0, 480); ax1.invert_yaxis()
    ax1.set_xlabel("Number of decisions  (n=571)", fontsize=9, color=K2)
    ax1.set_title("(a)  By Court Type", fontsize=10, color=K, pad=10)
    th = [("Blunt abdominal / physical", 110), ("TPC art. 87/88 (strict)", 95),
          ("Council of State — admin. liab.", 76), ("Const. Court — right to life", 60),
          ("ECtHR — arts. 2/3/8", 33), ("Traffic accident", 22),
          ("Malpractice", 17), ("Domestic violence", 17), ("Workplace accident", 9)]
    tn = [t[0] for t in th]; tv = [t[1] for t in th]
    for i, (n, v) in enumerate(zip(tn, tv)):
        col = ACC if i == 0 else K2
        ax2.plot([0, v], [i, i], color=col, lw=1.5, zorder=2)
        ax2.scatter([v], [i], color=col, s=40, zorder=3)
        ax2.text(v + 2, i, str(v), va="center", fontsize=8.5, color=K)
    ax2.set_yticks(np.arange(len(tn))); ax2.set_yticklabels(tn)
    ax2.set_xlim(0, 135); ax2.invert_yaxis()
    ax2.set_xlabel("Number of decisions  (overlapping)", fontsize=9, color=K2)
    ax2.set_title("(b)  By Thematic Sub-group", fontsize=10, color=K, pad=10)
    fig.suptitle("Figure 4.  Judicial and Thematic Distribution of 571 Preterm-Birth / Miscarriage Cases",
                 fontsize=11, fontweight="bold", color=K, y=1.01)
    plt.tight_layout()
    plt.savefig(f"{FIG}/sekil4_dagilim.png"); plt.close()


# 5 — Pathophysiological chain
def fig5_zincir():
    fig, ax = plt.subplots(figsize=(13, 8.5))
    ax.set_xlim(0, 13); ax.set_ylim(0, 9); ax.axis("off")
    _fig_label(ax, 0.3, 8.7, 5, "Pathophysiological Chain Following Mechanical Trauma in Pregnancy")
    cols = [(1.8, "MECHANISM"), (6.5, "PATHOPHYSIOLOGY"), (10.8, "TARGET STRUCTURE")]
    for x, label in cols:
        ax.text(x, 8.2, label, ha="center", fontsize=8, fontweight="bold", color=ACC)
        ax.plot([x - 1.5, x + 1.5], [8.07, 8.07], color=ACC, lw=0.6)
    mechs = [
        (7.2, "Blunt abdominal trauma", "punch · kick · seat-belt · steering wheel"),
        (6.0, "High-energy collision",  "MVA · workplace · fall from height"),
        (4.8, "Penetrating trauma",     "firearm · sharp object"),
    ]
    for y, h, s in mechs:
        _rbox(ax, 0.1, y - 0.35, 3.4, 0.7, fc="white", ec=K3)
        ax.text(1.8, y + 0.1, h, ha="center", fontsize=9.5, fontweight="bold", color=K)
        ax.text(1.8, y - 0.15, s, ha="center", fontsize=8, color=K3, style="italic")
    _rbox(ax, 4.7, 5.3, 3.6, 2.4, fc=WARM, ec=ACC, lw=0.8)
    ax.text(6.5, 7.35, "Mediator", ha="center", fontsize=10, fontweight="bold", color=ACC)
    for i, line in enumerate(["direct uterine impact", "abrupt pressure change",
                               "acceleration–deceleration", "shear stress"]):
        ax.text(6.5, 6.85 - i * 0.35, line, ha="center", fontsize=9, color=K2)
    for y, _, _ in mechs:
        _arr(ax, 3.55, y, 4.65, 6.5, c=K4)
    tgts = [(7.5, "Placental abruption"), (6.85, "Fetomaternal hemorrhage"),
            (6.20, "Uterine rupture"), (5.55, "Direct fetal injury"),
            (4.90, "Premature membrane rupture (PROM)")]
    for y, t in tgts:
        _rbox(ax, 9.0, y - 0.24, 3.7, 0.48, fc="white", ec=K3)
        ax.text(10.85, y, t, ha="center", va="center", fontsize=9, color=K)
        _arr(ax, 8.35, 6.5, 8.95, y, c=K4)
    bus_x = 12.85
    bus_y_top, bus_y_bot = 4.66, 7.5
    ax.plot([bus_x, bus_x], [bus_y_top, bus_y_bot], color=K3, lw=0.7)
    for y, _ in tgts:
        ax.plot([12.7, bus_x], [y, y], color=K3, lw=0.5)
    junction_y = 4.0
    ax.plot([bus_x, bus_x], [bus_y_top, junction_y], color=K3, lw=0.7)
    ax.plot([2.2, bus_x], [junction_y, junction_y], color=K3, lw=0.5)
    ax.text(6.5, 3.55, "CLINICAL OUTCOME", ha="center", fontsize=8, fontweight="bold", color=ACC)
    ax.plot([2.0, 11.0], [3.42, 3.42], color=ACC, lw=0.6)
    outcomes = [(2.2, "Spontaneous / missed abortion", "< 22 wk"),
                (6.5, "Preterm birth", "22–36⁺⁶ wk"),
                (10.8, "Intrauterine fetal death", "IUFD / stillbirth")]
    for x, h, s in outcomes:
        _rbox(ax, x - 1.8, 2.3, 3.6, 0.85, fc=K, ec=K)
        ax.text(x, 2.95, h, ha="center", fontsize=9.5, fontweight="bold", color=BG)
        ax.text(x, 2.6, s, ha="center", fontsize=8, color="#C0C0C0", style="italic")
        _arr(ax, x, junction_y, x, 3.18, c=K3, lw=0.7)
    ax.text(6.5, 1.65, "Temporal window:   minutes (rupture)  →  hours (abruption)  →  days–weeks (PROM / preterm)",
            ha="center", fontsize=8.5, color=K3, style="italic")
    ax.text(6.5, 1.25, "Source:  Queensland Clinical Guideline MN19.31-V2-R24 (2019);  Council of Forensic Medicine board reports",
            ha="center", fontsize=8, color=K4)
    plt.savefig(f"{FIG}/sekil5_zincir.png"); plt.close()


# 6 — Decision tree
def fig6_karar_agaci():
    fig, ax = plt.subplots(figsize=(13, 9.5))
    ax.set_xlim(0, 13); ax.set_ylim(0, 10); ax.axis("off")
    _fig_label(ax, 0.3, 9.7, 6, "The Position of TOMEC within the Forensic Decision Process")
    steps = [
        (8.8, "Case:   pregnant woman  +  alleged trauma  +  obstetric outcome", True),
        (7.8, "1.  Council of Forensic Medicine, Specialty Board (1st or 6th)  preliminary review", False),
        (6.8, "2.  Completion of TOMEC domains:   T · O · M · E · C", False),
        (5.8, "3.  Computation of total score  [0–100]", False),
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
    _arr(ax, 6.5, 5.45, 6.5, 5.2)
    ax.add_patch(Polygon([(6.5, 5.1), (10, 4.2), (6.5, 3.3), (3, 4.2)],
                          fc=WARM, ec=ACC, lw=1.0, zorder=2))
    ax.text(6.5, 4.2, "Which threshold band?", ha="center", va="center",
            fontsize=10.5, fontweight="bold", color=ACC)
    branches = [
        (2.0,  "≥ 70",  "Highly Probable\nDefinite", "Strong"),
        (6.5,  "40–69", "Possible\nProbable",        "Moderate"),
        (11.0, "< 40",  "Low / Remote\nNone",         "Weak"),
    ]
    for x, score, sub, strength in branches:
        _arr(ax, 6.5 + (x - 6.5)*0.3, 3.55, x, 2.95, c=K3)
        ax.text((6.5 + x)/2, 3.15, strength, fontsize=8, color=ACC,
                fontweight="bold", style="italic", ha="center")
        _rbox(ax, x - 1.8, 2.1, 3.6, 0.8, fc=K, ec=K)
        ax.text(x, 2.7, f"Score {score}", ha="center", fontsize=10, fontweight="bold", color=BG)
        ax.text(x, 2.35, sub, ha="center", fontsize=8.5, color="#C0C0C0", linespacing=1.2)
    judg = [
        (2.0,  "Direct causation",         "TPC art. 87/88 aggravation\nFull compensation"),
        (6.5,  "Contested by experts",     "Partial liability\nFault apportionment"),
        (11.0, "Causation not established","Acquittal / dismissal\nUnpreventable complication"),
    ]
    for x, head, detail in judg:
        _arr(ax, x, 2.05, x, 1.7)
        _rbox(ax, x - 1.8, 0.3, 3.6, 1.3, fc="white", ec=K3)
        ax.text(x, 1.35, head, ha="center", fontsize=9.5, fontweight="bold", color=K)
        ax.text(x, 0.85, detail, ha="center", fontsize=8.5, color=K2, linespacing=1.2)
    plt.savefig(f"{FIG}/sekil6_karar_agaci.png"); plt.close()


# 7 — Temporal window
def fig7_temporal():
    fig, ax = plt.subplots(figsize=(13, 6))
    ax.set_xlim(-0.5, 14.5); ax.set_ylim(-1.5, 7); ax.axis("off")
    _fig_label(ax, 0, 6.7, 7, "Trauma–Obstetric Outcome Temporal Window  (TOMEC C-domain)")
    ax.plot([0, 14], [0.5, 0.5], color=K, lw=0.8, zorder=3)
    ax.plot([14, 13.7], [0.55, 0.5], color=K, lw=0.8, zorder=3)
    ax.plot([14, 13.7], [0.45, 0.5], color=K, lw=0.8, zorder=3)
    ticks = [(0, "0\ntrauma"), (1, "1 h"), (2, "6 h"), (4, "24 h"),
             (6, "3 d"), (8, "1 wk"), (10, "2 wk"), (12, "≥ 4 wk")]
    for x, l in ticks:
        ax.plot([x, x], [0.35, 0.65], color=K, lw=0.7)
        ax.text(x, 0.05, l, ha="center", va="top", fontsize=8.5, color=K2)
    rows = [
        (0.0,  0.7,  "Direct rupture  (uterus / spleen)",          ACC),
        (0.4,  1.5,  "Placental abruption",                          "#0D2545"),
        (1.0,  5.0,  "Fetomaternal hemorrhage / fetal distress",    "#5A8F7B"),
        (2.0,  7.0,  "PROM",                                          K),
        (4.0, 12.0,  "Preterm labor",                                "#A78250"),
        (6.0, 14.0,  "Late IUFD / spontaneous abortion",            "#C9A06A"),
    ]
    h, gap = 0.55, 0.1
    for i, (x0, x1, lbl, col) in enumerate(rows):
        y = 0.5 + (i + 1) * (h + gap)
        ax.add_patch(Rectangle((x0, y), x1 - x0, h, fc=col, ec=BG, lw=2, zorder=2))
        is_wide = (x1 - x0) >= 3.5
        if is_wide:
            tc = BG if col in (ACC, "#0D2545", K, "#5A8F7B") else K
            ax.text((x0 + x1)/2, y + h/2, lbl, ha="center", va="center",
                    fontsize=8.5, color=tc, fontweight="bold", zorder=3)
        else:
            ax.text(x1 + 0.15, y + h/2, lbl, ha="left", va="center",
                    fontsize=8.5, color=K, fontweight="bold")
    ax.text(7, -0.7, "TOMEC-C:  high score when the outcome fits the typical window;  for long intervals alternative causes must be ruled out.",
            ha="center", fontsize=8.5, color=K3, style="italic")
    plt.savefig(f"{FIG}/sekil7_temporal.png"); plt.close()


# 8 — Scoring matrix
def fig8_matris():
    fig, ax = plt.subplots(figsize=(13, 6.5))
    ax.axis("off")
    _fig_label(ax, 0.05, 5.95, 8, "TOMEC Domain-Based Scoring Matrix")
    cats = ["T  Trauma", "O  Obstetric", "M  Maternal", "E  Act-Mech.", "C  Temporal"]
    levels = ["Level 0", "Level 1", "Level 2", "Level 3", "Level 4"]
    descr = [
        ["None", "Mild punch /\npush", "Repeated assault\nmoderate blunt", "High-energy\n(MVA, fall)", "Penetrating /\nmultiple severe"],
        ["Not pregnant", "≤ 12 wk", "13–22 wk", "23–27 wk", "≥ 28 wk"],
        ["Healthy", "Mild comorbidity", "Preeclampsia\nHTN / DM", "HELLP\ncoagulopathy", "Prior abruption\nplacenta previa"],
        ["Unrelated", "Indirect\n(distant site)", "Direct abdominal\n(punch / kick)", "High-velocity\n(vehicle / fall)", "Penetrating abd. /\nbelted MVA"],
        ["Unrelated", "> 4 weeks\n(rule out alt.)", "1–4 weeks", "24 h – 7 d", "< 24 h\n(classic abruption)"],
    ]
    weights = [0.25, 0.20, 0.15, 0.20, 0.20]
    shades = ["#F2F5F8", "#DCE3EB", "#A8B5C5", "#5A6E84", "#5A8F7B"]
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
            "Total  =  Σ ( level / 4  ×  weight  ×  100 )           [0,  100]",
            ha="center", va="center", fontsize=10.5, fontweight="bold", color=K)
    ax.set_xlim(-0.5, 13); ax.set_ylim(-1.2, 6.2)
    plt.savefig(f"{FIG}/sekil8_matris.png"); plt.close()


# 9 — Working sheet (A4 landscape)
def fig9_calisma_kagidi():
    fig, ax = plt.subplots(figsize=(15, 9.5))
    ax.set_xlim(0, 15); ax.set_ylim(0, 9.5); ax.axis("off")
    ax.add_patch(Rectangle((0, 8.8), 15, 0.7, fc=K, ec="none"))
    ax.text(7.5, 9.22, "TOMEC WORKING SHEET", ha="center", fontsize=14, fontweight="bold", color=BG)
    ax.text(7.5, 8.95, "Trauma · Obstetric · Medico-legal Causality   —   Standardised Assessment Form",
            ha="center", fontsize=9, color="#C0C0C0", style="italic")
    _rbox(ax, 0.3, 7.7, 14.4, 0.95, fc="white", ec=K3, lw=0.6)
    fields = [("Case No:", 0.5), ("Date:", 4.2), ("Examiner:", 8.0), ("Institution:", 12.0)]
    for lab, x in fields:
        ax.text(x, 8.35, lab, fontsize=9, color=K, fontweight="bold")
        ax.plot([x + 1.0, x + 3.5], [8.28, 8.28], color=K3, lw=0.5)
    subs = [("Gestational Week:", 0.5, 2.3, 4.2), ("Trauma Type:", 4.7, 6.0, 9.5),
            ("Outcome:", 10.0, 10.8, 14.5)]
    for lab, lx, l1, l2 in subs:
        ax.text(lx, 7.92, lab, fontsize=9, color=K, fontweight="bold")
        ax.plot([l1, l2], [7.85, 7.85], color=K3, lw=0.5)
    ax.text(7.5, 7.4, "Five-Domain Scoring Matrix", ha="center", fontsize=10.5, fontweight="bold", color=K)
    ax.text(7.5, 7.15, "tick exactly one level per domain", ha="center", fontsize=8.5, color=K3, style="italic")
    cats = [
        ("T — Trauma Severity / Mechanism", 0.25,
         ["None / unclear", "Mild blunt", "Moderate energy", "High energy /\npenetrating", "Life-threatening"]),
        ("O — Obstetric Status / Gestation", 0.20,
         ["≤ 6 wk or\n> 37 wk", "7–12 wk", "13–23 wk", "24–32 wk\n(critical)", "33–37 wk"]),
        ("M — Maternal Comorbidity", 0.15,
         ["None", "Low risk\n(DM, mild HTN)", "Moderate\n(preeclampsia)", "High\n(placenta previa)", "Very high\n(multiple)"]),
        ("E — Act / Energy-Mechanism", 0.20,
         ["Unclear", "Low-energy\nfall", "Direct abdominal\nblow", "Traffic accident", "Penetrating /\nhigh energy"]),
        ("C — Chronological / Temporal", 0.20,
         ["> 4 weeks\ndelay", "1–4 weeks", "3–7 days", "24–72 h", "0–24 h"]),
    ]
    x0 = 0.3; LW = 3.6; cw = 2.0; ch = 0.88; y0 = 6.9
    shades = ["#F2F5F8", "#DCE3EB", "#A8B5C5", "#5A6E84", "#5A8F7B"]
    for i, (cat, w, lvls) in enumerate(cats):
        y = y0 - (i+1)*ch
        ax.add_patch(Rectangle((x0, y), LW, ch, fc=K, ec=BG, lw=2))
        ax.text(x0 + LW/2, y + ch/2, cat, ha="center", va="center",
                color=BG, fontweight="bold", fontsize=9)
        for j, lev in enumerate(lvls):
            xc = x0 + LW + j*cw
            ax.add_patch(Rectangle((xc, y), cw, ch, fc=shades[j], ec=BG, lw=2))
            ax.text(xc + 0.12, y + ch - 0.15, f"L{j}", fontsize=7, color=K if j < 3 else BG, fontweight="bold")
            ax.add_patch(Rectangle((xc + cw - 0.30, y + ch - 0.25), 0.18, 0.18,
                                   fc="white", ec=K3, lw=0.5))
            tc = BG if j >= 3 else K
            ax.text(xc + cw/2, y + 0.28, lev, ha="center", va="center",
                    fontsize=7.8, color=tc, linespacing=1.1)
        ax.text(x0 + LW + 5*cw + 0.15, y + ch/2, f"× {w:.2f}",
                ha="left", va="center", fontsize=10.5, color=ACC, fontweight="bold")
    y_f = y0 - 5*ch - 0.45
    _rbox(ax, 0.3, y_f - 0.05, 14.4, 0.5, fc=WARM, ec=K3, lw=0.5)
    ax.text(7.5, y_f + 0.20,
            "TOTAL TOMEC  =  Σ ( level / 4  ×  weight  ×  100 )           Total Score:  ______ / 100",
            ha="center", va="center", fontsize=10.5, fontweight="bold", color=K)
    yb = y_f - 0.9
    band_specs = [("None", 0, 9, "#EEF1F4", K), ("Remote", 10, 24, "#D4DBE3", K),
                  ("Low", 25, 39, "#C9A06A", K), ("Possible", 40, 54, "#A78250", "white"),
                  ("Probable", 55, 69, "#5A8F7B", "white"), ("Highly P.", 70, 84, "#0D2545", "white"),
                  ("Definite", 85, 100, ACC, "white")]
    bx = 0.3; bw = 14.4/100
    for lbl, lo, hi, col, tc in band_specs:
        w = (hi - lo + 1) * bw
        ax.add_patch(Rectangle((bx + lo*bw, yb), w, 0.55, fc=col, ec=BG, lw=1))
        ax.text(bx + lo*bw + w/2, yb + 0.36, lbl, ha="center", va="center",
                fontsize=8, color=tc, fontweight="bold")
        ax.text(bx + lo*bw + w/2, yb + 0.15, f"{lo}–{hi}", ha="center", va="center",
                fontsize=7, color=tc)
    ys = yb - 0.65
    ax.text(0.3, ys + 0.12, "Causality Category:", fontsize=9, color=K, fontweight="bold")
    _rbox(ax, 2.5, ys - 0.08, 4.8, 0.38, fc="white", ec=K3, lw=0.5)
    ax.text(8.0, ys + 0.12, "Examiner Signature:", fontsize=9, color=K, fontweight="bold")
    ax.plot([9.8, 12.2], [ys + 0.02, ys + 0.02], color=K3, lw=0.5)
    ax.text(12.6, ys + 0.12, "Date:", fontsize=9, color=K, fontweight="bold")
    ax.plot([13.2, 14.6], [ys + 0.02, ys + 0.02], color=K3, lw=0.5)
    ax.text(7.5, 0.2,
            "Figure 9. TOMEC Working Sheet — A4-landscape printable form. Completed at each assessment and appended to the Council of Forensic Medicine report.",
            ha="center", fontsize=8, color=K3, style="italic")
    plt.savefig(f"{FIG}/sekil9_calisma_kagidi.png"); plt.close()


for fn in [fig1_prisma, fig2_tomec_donut, fig3_esik, fig4_dagilim,
           fig5_zincir, fig6_karar_agaci, fig7_temporal, fig8_matris, fig9_calisma_kagidi]:
    print("Building", fn.__name__)
    fn()
print("DONE — all 9 EN figures in", FIG)
