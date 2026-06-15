import zipfile, shutil, re, sys, os

SRC = sys.argv[1]
DST = sys.argv[2]
SPAN_EMU = 3200000   # ~8.9cm; üstü iki sütunu kaplar (geniş şekil)

A4 = '<w:pgSz w:w="11906" w:h="16838"/>'
MARG = '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/>'
TWO = '<w:cols w:num="2" w:space="425" w:equalWidth="1"/>'
ONE = '<w:cols w:space="708"/>'

def sect(cols, cont=True):
    t = '<w:type w:val="continuous"/>' if cont else ''
    return '<w:sectPr>' + t + A4 + MARG + cols + '</w:sectPr>'

def break_para(cols):
    return '<w:p><w:pPr>' + sect(cols) + '</w:pPr></w:p>'

shutil.copy(SRC, DST + ".tmp")
with zipfile.ZipFile(DST + ".tmp", "r") as z:
    names = z.namelist()
    data = {n: z.read(n) for n in names}

doc = data["word/document.xml"].decode("utf-8")

mb = re.search(r'(<w:body>)(.*)(</w:body>)', doc, re.S)
head, body, tail = doc[:mb.start(1)] + mb.group(1), mb.group(2), mb.group(3) + doc[mb.end(3):]

# son (gövde düzeyi) sectPr'ı ayır
msect = re.search(r'<w:sectPr\b(?:(?!</w:sectPr>).)*</w:sectPr>\s*$', body, re.S)
final_sect_orig = msect.group(0) if msect else ''
body_inner = body[:msect.start()] if msect else body

# --- gövdeyi üst düzey token'lara böl (paragraf / tablo) ---
# NOT: "<w:tbl" kaba aranırsa <w:tblPr>/<w:tblGrid>... ile eşleşir; bu yüzden
# tag adını kesin sınırla: <w:p ardından >,/, boşluk; <w:tbl ardından >, boşluk.
ELEM = re.compile(r'<w:tbl[ >]|<w:p[ />]')
TBL_OPEN = re.compile(r'<w:tbl[ >]')
TBL_CLOSE = "</w:tbl>"
tokens = []   # (kind, text)  kind: 'gap','p','tbl'
i, n = 0, len(body_inner)
while i < n:
    m = ELEM.search(body_inner, i)
    if not m:
        tokens.append(("gap", body_inner[i:])); break
    j = m.start()
    if j > i:
        tokens.append(("gap", body_inner[i:j]))
    if m.group().startswith("<w:tbl"):
        # eşleşen </w:tbl> (iç içe tabloya karşı derinlik say)
        depth, k = 0, j
        while k < n:
            mo = TBL_OPEN.search(body_inner, k)
            c = body_inner.find(TBL_CLOSE, k)
            if c == -1:
                k = n; break
            if mo and mo.start() < c:
                depth += 1; k = mo.end()
            else:
                depth -= 1; k = c + len(TBL_CLOSE)
                if depth == 0:
                    break
        tokens.append(("tbl", body_inner[j:k])); i = k
    else:
        # paragraf (iç içe geçmez). Açılış tagının sonuna bak: '/>' ise self-closing.
        # NOT: <w:p/>, <w:p />, <w:p attr/>, <w:p attr /> hepsi self-closing'dir;
        # bunları </w:p> aramaya bırakmak sonraki paragrafa kadar (tablo dahil) yutar.
        nb = body_inner.find(">", j)
        if nb != -1 and body_inner[nb-1] == "/":
            tokens.append(("p", body_inner[j:nb+1])); i = nb + 1
        else:
            c = body_inner.find("</w:p>", j)
            tokens.append(("p", body_inner[j:c+6])); i = c + 6

# --- her token'ı sınıflandır: span (tam genişlik) mı flow (2 sütun) mı ---
def classify(kind, txt, prev_mode):
    if kind == "gap":
        return None
    if kind == "tbl":
        return "span"
    is_fig = ('w:val="CaptionedFigure"' in txt) or ("<w:drawing" in txt and 'w:val="ImageCaption"' not in txt)
    if is_fig:
        m = re.search(r'<wp:extent\b[^>]*\bcx="(\d+)"', txt)
        cx = int(m.group(1)) if m else 0
        return "span" if cx > SPAN_EMU else "flow"
    if 'w:val="ImageCaption"' in txt:
        return prev_mode if prev_mode in ("span", "flow") else "flow"
    return "flow"

modes = []
prev = "flow"
for kind, txt in tokens:
    m = classify(kind, txt, prev)
    modes.append(m)
    if m is not None:
        prev = m

# --- token'ları yeniden yaz, mod geçişlerinde kesme paragrafı ekle ---
out = []
cur = "flow"          # başlangıç bölümü 2 sütun
last_content_mode = "flow"
for (kind, txt), m in zip(tokens, modes):
    if m is None:
        out.append(txt); continue
    if m != cur:
        # ayrılan moda göre kesme (bırakılan bölümün sütun sayısı)
        out.append(break_para(TWO if cur == "flow" else ONE))
        cur = m
    out.append(txt)
    last_content_mode = m

final_cols = TWO if cur == "flow" else ONE
final_sect = sect(final_cols, cont=False)

new_body = "".join(out) + final_sect
doc = head + new_body + tail
data["word/document.xml"] = doc.encode("utf-8")

with zipfile.ZipFile(DST, "w", zipfile.ZIP_DEFLATED) as z:
    for nm in names:
        z.writestr(nm, data[nm])
os.remove(DST + ".tmp")

nspan = sum(1 for m in modes if m == "span")
nbreaks = sum(1 for t in out if isinstance(t, str) and t.startswith("<w:p><w:pPr><w:sectPr>"))
print(f"2 sütun uygulandı. span(tam genişlik) token: {nspan}, eklenen kesme: {nbreaks} -> {DST}")
