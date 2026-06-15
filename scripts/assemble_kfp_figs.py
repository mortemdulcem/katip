import os, re, json

FIGDIR = os.path.abspath("scripts/kfp_figs")
man = json.load(open(os.path.join("scripts/kfp_figs/_manifest.json"), encoding="utf-8"))
figures = {k: v for k, v in man["figures"].items() if "file" in v}

text = open("scripts/kfp_full.md", encoding="utf-8").read()
lines = text.split("\n")

PT2CM = 2.54 / 72.0
COL_CAP = 7.8      # tek sütuna sığacak şekiller için maks genişlik
SPAN_MIN = 10.0    # doğal genişliği bundan büyük şekiller iki sütunu kaplar
SPAN_CAP, MAXH = 16.5, 22.0

def img_md(num, info):
    w_cm = info["w"] * PT2CM
    h_cm = info["h"] * PT2CM
    if w_cm and h_cm and w_cm > SPAN_MIN:
        scale = min(SPAN_CAP / w_cm, MAXH / h_cm, 1.0)   # iki sütunu kaplar
    elif w_cm and h_cm:
        scale = min(COL_CAP / w_cm, MAXH / h_cm, 1.0)    # sütun içine sığar
    else:
        scale = 1.0
    width = round(w_cm * scale, 2)
    p = os.path.join(FIGDIR, info["file"])
    return f'![Şekil {num}]({p}){{width={width}cm}}'

def key(n):
    a, b = n.split(".")
    return (int(a), int(b))

inserted = set()
placements = {}
fig_line = {}
for num in sorted(figures, key=key):
    pat = re.compile(r'Şekil\s+' + re.escape(num) + r'(?!\d)')
    for i, ln in enumerate(lines):
        if pat.search(ln):
            placements.setdefault(i, []).append(num)
            inserted.add(num)
            fig_line[num] = i
            break

# chapter heading line map (e.g. "# Bölüm 4:")
heading_line = {}
for i, ln in enumerate(lines):
    m = re.match(r'#\s+Bölüm\s+(\d+)\s*:', ln)
    if m:
        heading_line.setdefault(int(m.group(1)), i)

# fallback: figures without an inline reference (comma-lists/ranges) -> chain after
# the nearest already-placed lower-numbered figure in the same chapter
for num in sorted(figures, key=key):
    if num in inserted:
        continue
    ch, sec = key(num)
    anchor = None
    for low_sec in range(sec - 1, 0, -1):
        cand = f"{ch}.{low_sec}"
        if cand in fig_line:
            anchor = fig_line[cand]
            break
    if anchor is None:
        anchor = heading_line.get(ch)
    if anchor is None:
        continue
    placements.setdefault(anchor, []).append(num)
    inserted.add(num)
    fig_line[num] = anchor

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
open("scripts/kfp_final.md", "w", encoding="utf-8").write(result)
print(f"birleştirilen satır: {len(out)}, gömülen şekil: {len(inserted)}/{len(figures)}")
print("metinde atıf bulunamayan şekiller:", len(missing), missing[:30])
