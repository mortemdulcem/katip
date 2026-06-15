import glob, os, json

CACHE = "scripts/caus2_cache"
FIGDIR = os.path.abspath("scripts/caus2_figs")
segments = json.load(open("scripts/caus2_chapters.json", encoding="utf-8"))
figpages = json.load(open("scripts/caus2_figures.json", encoding="utf-8"))

TITLE = (
    "# Karayolu Trafik Ölümlerinin İncelenmesi: Bir Atlas\n\n"
    "## Investigation of Road Traffic Fatalities: An Atlas\n\n"
    "*Jay Dix, Michael Graham, Randy Hanzlick — CRC Press / Taylor & Francis, 2000*\n\n"
    "*İleri akademik adli patoloji çevirisi — karayolu trafik ölümleri, otopsi ve "
    "yaralanma mekanizmaları. Çevirmen notları ve karşılaştırmalı Türk adli tıp/hukuk "
    "ekleriyle (2918 sayılı KTK, TCK m.85/89, CMK m.86-89, Adli Tıp Kurumu).*\n\n"
    "> **Not (kaynak ve sadakat):** Şekiller, orijinal atlasın taranmış tam sayfa "
    "görüntüleri olarak korunmuştur (İngilizce özgün altyazılar görüntü içinde aynen "
    "yer alır); her şeklin Türkçe çevirisi görüntünün altında verilmiştir. Hiçbir "
    "görsel/bulgu değiştirilmemiştir.\n\n"
    "---\n"
)

parts = [TITLE]

# --- prose segments ---
for seg in segments:
    pad = f"{seg['idx']:02d}"
    for f in sorted(glob.glob(os.path.join(CACHE, f"seg{pad}_chunk*.md"))):
        parts.append(open(f, encoding="utf-8").read().strip())
    enrich = os.path.join(CACHE, f"seg{pad}_enrich.md")
    if os.path.exists(enrich):
        parts.append(open(enrich, encoding="utf-8").read().strip())

# --- figures (atlas) ---
parts.append("# Şekiller — Atlas")
nimg = 0
for fp in figpages:
    img = os.path.join(FIGDIR, fp["img"])
    if not os.path.exists(img):
        raise SystemExit(f"EKSİK GÖRSEL: {img}")
    nums = ", ".join(str(c["num"]) for c in fp["caps"])
    parts.append(f"![Şekil {nums}]({img}){{width=13cm}}")
    cap = os.path.join(CACHE, f"fig_p{fp['page']:03d}.md")
    lines = [l.strip() for l in open(cap, encoding="utf-8").read().splitlines() if l.strip()]
    parts.append("\n\n".join(f"**{l}**" if l.lower().startswith("şekil") else l for l in lines))
    nimg += 1

text = "\n\n".join(parts)
out = os.path.join(CACHE, "_assembled.md")
open(out, "w", encoding="utf-8").write(text)
print(f"birleştirildi: prose seg={len(segments)}, figür sayfa görsel={nimg}, "
      f"{len(text)} karakter -> {out}")
