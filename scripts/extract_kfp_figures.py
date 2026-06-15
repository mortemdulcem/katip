import fitz, re, os, json

PDF = "attached_assets/Knight’s_Forensic_Pathology-CRC_Press_(2015)_Pekka_Saukko,_Ber_1771794765936.pdf"
OUT = "scripts/kfp_figs"
os.makedirs(OUT, exist_ok=True)
doc = fitz.open(PDF)

cap_re = re.compile(r'^(Figure|Table)\s+(\d+\.\d+)\b')
ZOOM = 2.3
MAXGAP = 430

def hoverlap(a, b):
    return max(0, min(a.x1, b.x1) - max(a.x0, b.x0))

figs = {}
tables = {}
miss = []

for pno in range(len(doc)):
    page = doc[pno]
    d = page.get_text("dict")
    blocks = []
    for b in d["blocks"]:
        if b.get("type", 0) != 0:
            continue
        txt = "".join(s["text"] for l in b["lines"] for s in l["spans"]).strip()
        blocks.append((fitz.Rect(b["bbox"]), txt))
    gfx = [fitz.Rect(im["bbox"]) for im in page.get_image_info()]
    for dr in page.get_drawings():
        r = fitz.Rect(dr["rect"])
        if r.width > 20 and r.height > 20:
            gfx.append(r)
    pr = page.rect
    for rect, txt in blocks:
        m = cap_re.match(txt)
        if not m:
            continue
        kind, num = m.group(1), m.group(2)
        store = figs if kind == "Figure" else tables
        if num in store:
            continue
        cap = rect
        if kind == "Table":
            store[num] = {"page": pno + 1}
            continue
        mid = pr.width / 2
        # candidate graphics ABOVE caption (horizontal overlap with caption's column)
        cand = [g for g in gfx
                if g.y1 <= cap.y0 + 3 and (cap.y0 - g.y1) < MAXGAP
                and g.width > 30 and g.height > 25
                and hoverlap(g, cap) > 8]
        if not cand:
            miss.append((num, pno + 1))
            continue
        reg = cand[0]
        for c in cand[1:]:
            reg |= c
        # column band derived from the ACTUAL graphic extent (handles full-width figures)
        if reg.x0 < mid - 18 and reg.x1 > mid + 18:
            cl, cr = pr.x0 + 2, pr.x1 - 2
        elif (reg.x0 + reg.x1) / 2 < mid:
            cl, cr = pr.x0 + 2, mid - 1
        else:
            cl, cr = mid + 1, pr.x1 - 2
        # include short figure-label text blocks (callouts, (a)/(b), sub-labels)
        # that sit within the column, above the caption, near the graphic
        for r2, t2 in blocks:
            if r2 == cap:
                continue
            if r2.y1 > cap.y0 - 1 or r2.y0 < reg.y0 - 55:
                continue
            cx = (r2.x0 + r2.x1) / 2
            if not (cl - 2 <= cx <= cr + 2):
                continue
            if len(t2.split()) <= 8 and r2.y0 <= cap.y0 and r2.y1 >= reg.y0 - 55:
                reg |= r2
        reg = reg & pr
        reg.x0 = max(cl, reg.x0 - 4)
        reg.x1 = min(cr, reg.x1 + 4)
        reg.y0 = max(pr.y0, reg.y0 - 4)
        reg.y1 = min(cap.y0 - 1, reg.y1 + 4)
        if reg.width < 35 or reg.height < 25:
            miss.append((num, pno + 1))
            continue
        pix = page.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM), clip=reg)
        fn = f"sekil_{num.replace('.', '_')}.jpg"
        with open(os.path.join(OUT, fn), "wb") as fh:
            fh.write(pix.tobytes("jpeg", jpg_quality=80))
        store[num] = {"file": fn, "page": pno + 1, "w": round(reg.width), "h": round(reg.height)}

json.dump({"figures": figs, "tables": tables}, open(os.path.join(OUT, "_manifest.json"), "w"),
          ensure_ascii=False, indent=1)
print("çıkarılan şekil:", len([f for f in figs.values() if "file" in f]))
print("table caption:", len(tables))
print("caption bulunup grafiği çıkmayan (miss):", len(miss), miss[:25])
