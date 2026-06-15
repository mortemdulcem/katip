import fitz, re, os, json

PDF = "attached_assets/gdrive/Trauma_Biomechanics_Schmitt_2nd_Springer.pdf"
OUT = "scripts/tbm_figs"
os.makedirs(OUT, exist_ok=True)
doc = fitz.open(PDF)

# Taranmış kitap: altyazılar "Fig. X.Y" / "Figure X.Y" / "Table X.Y".
# OCR çoğu kez noktayı düşürür ("Fig. 23" = 2.3, "Table 35" = 3.5) -> iki aşamalı tespit.
cap_std = re.compile(r'^\s*(Fig\.?|Figure|Table)\s+(\d{1,2})[\.\s](\d{1,2})\b', re.I)
cap_nodot = re.compile(r'^\s*(Fig\.?|Figure|Table)\s+([1-9])(\d)(?=\s|$|[A-Za-z])', re.I)

def parse_cap(txt):
    m = cap_std.match(txt)
    if m:
        return m.group(1).lower(), f"{int(m.group(2))}.{int(m.group(3))}"
    m = cap_nodot.match(txt)
    if m:
        return m.group(1).lower(), f"{int(m.group(2))}.{int(m.group(3))}"
    return None

figs = {}    # "X.Y" -> info
tables = {}  # "X.Y" -> info

for pno in range(len(doc)):
    page = doc[pno]
    d = page.get_text("dict")
    blocks = [b for b in d["blocks"] if b.get("type", 0) == 0]
    btxts = []
    for b in blocks:
        txt = "".join(s["text"] for l in b["lines"] for s in l["spans"]).strip()
        if txt:
            btxts.append((fitz.Rect(b["bbox"]), txt))
    gfx = []
    for im in page.get_image_info():
        gfx.append(fitz.Rect(im["bbox"]))
    for dr in page.get_drawings():
        gfx.append(fitz.Rect(dr["rect"]))
    for rect, txt in btxts:
        pc = parse_cap(txt)
        if not pc:
            continue
        kind, num = pc
        store = figs if kind.startswith("fig") else tables
        if num in store:
            continue  # ilk geçiş = gerçek altyazı
        store[num] = {"page": pno, "caption_rect": list(rect), "caption": txt[:120],
                      "gfx": [list(g) for g in gfx], "blocks": [(list(r), t) for r, t in btxts]}

print("figure caption:", len(figs), "table caption:", len(tables))

def figure_region(info):
    cap = fitz.Rect(info["caption_rect"])
    page_rect = doc[info["page"]].rect
    # Önce gerçek grafik bbox'ları altyazının ÜSTünde (vektör/resim) ara.
    cand = [fitz.Rect(g) for g in info["gfx"]
            if fitz.Rect(g).y1 <= cap.y0 + 2 and (cap.y0 - fitz.Rect(g).y1) < 360
            and fitz.Rect(g).width > 25 and fitz.Rect(g).height > 12
            and fitz.Rect(g).width < page_rect.width * 0.98]
    if cand:
        region = cand[0]
        for c in cand[1:]:
            region |= c
        region = region & page_rect
        region.x0 = max(page_rect.x0, region.x0 - 6)
        region.x1 = min(page_rect.x1, region.x1 + 6)
        region.y0 = max(page_rect.y0, region.y0 - 6)
        region.y1 = min(cap.y0 - 1, region.y1 + 6)
        return region
    # Taranmış sayfa fallback: önceki metin bloğunun altı ile altyazı üstü arası (kolon genişliği).
    blocks = [(fitz.Rect(r), t) for r, t in info["blocks"]]
    above = [r for r, t in blocks if r.y1 <= cap.y0 - 2]
    prev_bottom = max((r.y1 for r in above), default=page_rect.y0 + 36)
    if cap.y0 - prev_bottom < 30:   # hemen üstte metin var -> sayfa üstünden başlat
        prev_bottom = page_rect.y0 + 36
    reg = fitz.Rect(page_rect.x0 + 24, prev_bottom + 2, page_rect.x1 - 24, cap.y0 - 2)
    if reg.width > 40 and reg.height > 30:
        return reg
    return None

manifest = {}
miss = []
for num, info in figs.items():
    reg = figure_region(info)
    if reg is None or reg.width < 30 or reg.height < 25:
        miss.append(num)
        continue
    pix = doc[info["page"]].get_pixmap(matrix=fitz.Matrix(2.2, 2.2), clip=reg)
    fn = f"sekil_{num.replace('.', '_')}.png"
    pix.save(os.path.join(OUT, fn))
    manifest[num] = {"file": fn, "page": info["page"] + 1, "w": round(reg.width), "h": round(reg.height)}

json.dump({"figures": manifest, "tables_pages": {k: v["page"] + 1 for k, v in tables.items()}},
          open(os.path.join(OUT, "_manifest.json"), "w"), ensure_ascii=False, indent=1)
print("çıkarılan şekil:", len(manifest), "atlanan:", miss)
print("tablo caption sayısı:", len(tables))
