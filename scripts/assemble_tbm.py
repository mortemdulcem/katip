import glob, os, re, json

CACHE = "scripts/tbm_cache"
FIGDIR = os.path.abspath("scripts/tbm_figs")
man = json.load(open(os.path.join(FIGDIR, "_manifest.json"), encoding="utf-8"))
figures = man["figures"]

segments = json.load(open("scripts/tbm_chapters.json", encoding="utf-8"))

TITLE = "# Travma Biyomekaniği\n\n## Trafik ve Sporda Kazaya Bağlı Yaralanmalar (2. Baskı)\n\n*Kai-Uwe Schmitt · Peter F. Niederer · Markus H. Muser · Felix Walz — Springer*\n\n*Türkçe akademik çeviri (çevirmen notları ve bölüm ekleriyle)*\n\n---\n"

# Her segmentin chunk + enrich dosyalarını sırayla birleştir.
parts = [TITLE]
for seg in segments:
    n = seg["num"]
    chunks = sorted(glob.glob(os.path.join(CACHE, f"ch{n:02d}_chunk*.md")))
    if not chunks:
        continue
    for f in chunks:
        parts.append(open(f, encoding="utf-8").read().strip())
    enrich = os.path.join(CACHE, f"ch{n:02d}_enrich.md")
    if os.path.exists(enrich):
        parts.append(open(enrich, encoding="utf-8").read().strip())

text = "\n\n".join(parts)
lines = text.split("\n")

PT2CM = 2.54 / 72.0
MAXW, MAXH = 14.0, 19.0

def img_md(num, info):
    w_cm = info["w"] * PT2CM
    h_cm = info["h"] * PT2CM
    scale = min(MAXW / w_cm, MAXH / h_cm, 1.0) if w_cm and h_cm else 1.0
    width = round(w_cm * scale, 2)
    p = os.path.join(FIGDIR, info["file"])
    return f'![Şekil {num}]({p}){{width={width}cm}}'

def key(n):
    a, b = n.split(".")
    return (int(a), int(b))

inserted = set()
placements = {}
for num in sorted(figures, key=key):
    pat = re.compile(r'Şekil\s+' + re.escape(num) + r'(?!\d)')
    for i, ln in enumerate(lines):
        if pat.search(ln):
            placements.setdefault(i, []).append(num)
            inserted.add(num)
            break

# atıfsız şekiller: aynı bölümün son yerleştirilen şeklinin satırına zincirle (fallback)
for num in sorted(figures, key=key):
    if num in inserted:
        continue
    ch = num.split(".")[0]
    prev = [m for m in inserted if m.split(".")[0] == ch]
    if prev:
        anchor_num = max(prev, key=key)
        for i, nums in placements.items():
            if anchor_num in nums:
                placements[i].append(num)
                inserted.add(num)
                break

out = []
for i, ln in enumerate(lines):
    out.append(ln)
    if i in placements:
        for num in sorted(placements[i], key=key):
            out.append("")
            out.append(img_md(num, figures[num]))
            out.append("")

missing = [n for n in figures if n not in inserted]
result = "\n".join(out)
open(os.path.join(CACHE, "_assembled.md"), "w", encoding="utf-8").write(result)
print(f"birleştirilen satır: {len(out)}, gömülen şekil: {len(inserted)}/{len(figures)}")
print("yerleştirilemeyen şekiller:", missing)
