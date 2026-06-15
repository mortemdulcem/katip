import fitz, re, os, json

PDF = "attached_assets/Designing_Software_Architectures.pdf"
OUT = "scripts/dsa_figs"
os.makedirs(OUT, exist_ok=True)
doc = fitz.open(PDF)

cap_re = re.compile(r'^(Figure|Table)\s+(\d+\.\d+)\b', re.I)
figs = {}   # "X.Y" -> info
tables = {} # "X.Y" -> info

for pno in range(len(doc)):
    page = doc[pno]
    d = page.get_text("dict")
    blocks = [b for b in d["blocks"] if b.get("type", 0) == 0]
    # build list of (rect, text)
    btxts = []
    for b in blocks:
        txt = "".join(s["text"] for l in b["lines"] for s in l["spans"]).strip()
        btxts.append((fitz.Rect(b["bbox"]), txt))
    # image + drawing bboxes
    gfx = []
    for im in page.get_image_info():
        gfx.append(fitz.Rect(im["bbox"]))
    for dr in page.get_drawings():
        gfx.append(fitz.Rect(dr["rect"]))
    for rect, txt in btxts:
        m = cap_re.match(txt)
        if not m:
            continue
        kind, num = m.group(1).lower(), m.group(2)
        store = figs if kind == "figure" else tables
        if num in store:
            continue  # first occurrence = real caption
        store[num] = {"page": pno, "caption_rect": list(rect), "caption": txt[:120],
                      "gfx": [list(g) for g in gfx], "blocks": [(list(r), t) for r, t in btxts]}

print("figure caption:", len(figs), "table caption:", len(tables))

def figure_region(info):
    cap = fitz.Rect(info["caption_rect"])
    page_rect = doc[info["page"]].rect
    # graphics above caption, within 380pt
    cand = [fitz.Rect(g) for g in info["gfx"]
            if fitz.Rect(g).y1 <= cap.y0 + 2 and (cap.y0 - fitz.Rect(g).y1) < 380
            and fitz.Rect(g).width > 25 and fitz.Rect(g).height > 12]
    if cand:
        region = cand[0]
        for c in cand[1:]:
            region |= c
        # clamp to page, pad
        region = region & page_rect
        region.x0 = max(page_rect.x0, region.x0 - 6)
        region.x1 = min(page_rect.x1, region.x1 + 6)
        region.y0 = max(page_rect.y0, region.y0 - 6)
        region.y1 = min(cap.y0 - 1, region.y1 + 6)
        return region
    # fallback: region between previous text block bottom and caption top, column width
    blocks = [(fitz.Rect(r), t) for r, t in info["blocks"]]
    above = [r for r, t in blocks if r.y1 <= cap.y0 - 2]
    prev_bottom = max((r.y1 for r in above), default=page_rect.y0 + 40)
    if cap.y0 - prev_bottom < 25:
        prev_bottom = page_rect.y0 + 40
    reg = fitz.Rect(page_rect.x0 + 30, prev_bottom + 2, page_rect.x1 - 30, cap.y0 - 2)
    if reg.width > 40 and reg.height > 25:
        return reg
    return None

manifest = {}
miss = []
for num, info in figs.items():
    reg = figure_region(info)
    if reg is None or reg.width < 30 or reg.height < 20:
        miss.append(num)
        continue
    pix = doc[info["page"]].get_pixmap(matrix=fitz.Matrix(3, 3), clip=reg)
    fn = f"sekil_{num.replace('.', '_')}.png"
    pix.save(os.path.join(OUT, fn))
    manifest[num] = {"file": fn, "page": info["page"] + 1, "w": round(reg.width), "h": round(reg.height)}

json.dump({"figures": manifest, "tables_pages": {k: v["page"] + 1 for k, v in tables.items()}},
          open("scripts/dsa_figs/_manifest.json", "w"), ensure_ascii=False, indent=1)
print("çıkarılan şekil:", len(manifest), "atlanan:", miss)
print("tablo caption sayısı:", len(tables))
