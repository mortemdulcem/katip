import glob, os, re, json

CACHE = "scripts/dsa_cache"
FIGDIR = os.path.abspath("scripts/dsa_figs")
man = json.load(open(os.path.join("scripts/dsa_figs/_manifest.json"), encoding="utf-8"))
figures = man["figures"]

chunks = sorted(f for f in glob.glob(os.path.join(CACHE, "chunk_*.md")))
text = "\n\n".join(open(f, encoding="utf-8").read().strip() for f in chunks)
lines = text.split("\n")

PT2CM = 2.54 / 72.0
MAXW, MAXH = 15.0, 20.0

def img_md(num, info):
    w_cm = info["w"] * PT2CM
    h_cm = info["h"] * PT2CM
    scale = min(MAXW / w_cm, MAXH / h_cm, 1.0) if w_cm and h_cm else 1.0
    width = round(w_cm * scale, 2)
    p = os.path.join(FIGDIR, info["file"])
    return f'![Şekil {num}]({p}){{width={width}cm}}'

# sort figures by chapter.section numeric
def key(n):
    a, b = n.split(".")
    return (int(a), int(b))

inserted = set()
# build a list of (line_index, num) for first reference of each figure
placements = {}
for num in sorted(figures, key=key):
    pat = re.compile(r'Şekil\s+' + re.escape(num) + r'(?!\d)')
    for i, ln in enumerate(lines):
        if pat.search(ln):
            placements.setdefault(i, []).append(num)
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
print("yerleştirilemeyen şekiller (metinde atıf yok):", missing)
