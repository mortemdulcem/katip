import zipfile, re, json, html, io
from xml.sax.saxutils import escape

SRC = 'attached_assets/Clean.Architecture.2017.9_translated_1780067905461.docx'
OUT = 'client/public/Clean_Architecture_TR_Duzeltilmis.docx'

with open('scripts/clean_stage1.json', encoding='utf-8') as f:
    stage1 = json.load(f)            # [{i, t(det-cleaned)}]
with open('scripts/clean_stage2.json', encoding='utf-8') as f:
    cleaned = {int(k): v for k, v in json.load(f).items()}  # i -> llm cleaned

# Final cleaned text per original paragraph index (only nonempty ones present)
final = {}
order = []
for o in stage1:
    i = o['i']
    if not o['t'].strip():
        continue
    final[i] = cleaned.get(i, o['t']).strip()
    order.append(i)

# Cross-paragraph line-wrap hyphenation merge
TRAIL = re.compile(r'[A-Za-zÇÖÜĞŞİçöüğşı]-$')
emptied = set()
pos = 0
while pos < len(order):
    i = order[pos]
    if i in emptied:
        pos += 1; continue
    cur = final[i]
    j = pos
    while TRAIL.search(cur) and j + 1 < len(order):
        ni = order[j + 1]
        cont = final[ni]
        if cont and cont[0].isupper():
            cont = cont[0].lower() + cont[1:]
        cur = cur[:-1] + cont
        emptied.add(ni)
        j += 1
    final[i] = cur
    pos = j + 1

z = zipfile.ZipFile(SRC)
xml = z.read('word/document.xml').decode('utf-8', errors='ignore')

# iterate paragraphs in order, replacing text in place
para_re = re.compile(r'<w:p\b[^>]*>.*?</w:p>', re.DOTALL)
wt_re = re.compile(r'(<w:t\b[^>]*>)(.*?)(</w:t>)', re.DOTALL)

# counter that walks paragraphs; assign indices by appearance order (== stage1 order)
idx_counter = {'n': -1}

def repl_para(m):
    idx_counter['n'] += 1
    i = idx_counter['n']
    block = m.group(0)
    if i not in final:           # paragraph had no/empty text -> leave untouched (images etc.)
        return block
    new_text = '' if i in emptied else final[i]
    wts = list(wt_re.finditer(block))
    if not wts:
        return block
    # build replacement: first w:t gets full text (space-preserving), rest emptied
    out = []
    last = 0
    for k, wm in enumerate(wts):
        out.append(block[last:wm.start()])
        open_tag = wm.group(1)
        # ensure xml:space preserve on the run that carries text
        if k == 0:
            if 'xml:space' not in open_tag:
                open_tag = open_tag[:-1] + ' xml:space="preserve">'
            out.append(open_tag + escape(new_text) + wm.group(3))
        else:
            out.append(wm.group(1) + '' + wm.group(3))
        last = wm.end()
    out.append(block[last:])
    return ''.join(out)

new_xml = para_re.sub(repl_para, xml)
print("paragraphs walked:", idx_counter['n'] + 1, "expected:", len(stage1))

# ---- COMPACTION: continuous flow, no blank pages, fully-filled pages ----

# 1) Remove intermediate SECTION BREAKS (sectPr inside a paragraph's pPr).
#    Keep only the final body-level sectPr (it is followed by </w:body>, not </w:pPr>).
before_sect = len(re.findall(r'<w:sectPr', new_xml))
new_xml = re.sub(r'<w:sectPr\b[^>]*>.*?</w:sectPr>(?=\s*</w:pPr>)', '', new_xml, flags=re.DOTALL)
new_xml = re.sub(r'<w:sectPr\b[^>]*/>(?=\s*</w:pPr>)', '', new_xml)
after_sect = len(re.findall(r'<w:sectPr', new_xml))
print("section breaks removed:", before_sect - after_sect, "remaining sectPr:", after_sect)

# 2) Remove any hard page breaks
new_xml = re.sub(r'<w:br\b[^>]*w:type="page"[^>]*/>', '', new_xml)
new_xml = re.sub(r'<w:lastRenderedPageBreak\s*/>', '', new_xml)
# remove page-break-before paragraph property
new_xml = re.sub(r'<w:pageBreakBefore\b[^>]*/>', '', new_xml)

# 2b) Fix TEXT/IMAGE OVERLAP: convert floating (anchored) images to inline images
def anchor_to_inline(m):
    blk = m.group(0)
    blk = re.sub(r'<wp:simplePos\b[^>]*/>', '', blk)
    blk = re.sub(r'<wp:positionH\b.*?</wp:positionH>', '', blk, flags=re.DOTALL)
    blk = re.sub(r'<wp:positionV\b.*?</wp:positionV>', '', blk, flags=re.DOTALL)
    blk = re.sub(r'<wp:wrap\w+\b[^>]*/>', '', blk)
    blk = re.sub(r'<wp:wrap\w+\b.*?</wp:wrap\w+>', '', blk, flags=re.DOTALL)
    blk = re.sub(r'<wp:anchor\b[^>]*>', '<wp:inline distT="0" distB="0" distL="0" distR="0">', blk)
    blk = blk.replace('</wp:anchor>', '</wp:inline>')
    return blk
n_anchor = len(re.findall(r'<wp:anchor\b', new_xml))
new_xml = re.sub(r'<wp:anchor\b.*?</wp:anchor>', anchor_to_inline, new_xml, flags=re.DOTALL)
print("floating images -> inline (overlap fix):", n_anchor)

# 2c) Uniform LETTER SPACING: remove per-run character spacing (w:spacing w:val=...)
n_cs = len(re.findall(r'<w:spacing\b[^>]*\bw:val="-?\d+"[^>]*/>', new_xml))
new_xml = re.sub(r'<w:spacing\b[^>]*\bw:val="-?\d+"[^>]*/>', '', new_xml)
# also drop manual kerning
new_xml = re.sub(r'<w:kern\b[^>]*/>', '', new_xml)
print("char-spacing elements removed:", n_cs)

# 2d) FONTS: everything Times New Roman (code overridden to Consolas later); body 11pt->10pt
new_xml = re.sub(r'w:ascii="[^"]*"', 'w:ascii="Times New Roman"', new_xml)
new_xml = re.sub(r'w:hAnsi="[^"]*"', 'w:hAnsi="Times New Roman"', new_xml)
new_xml = re.sub(r'w:cs="[^"]*"', 'w:cs="Times New Roman"', new_xml)
# body text 11pt (sz=22) -> 10pt (sz=20); leave heading sizes (>=24) untouched
new_xml = re.sub(r'<w:sz w:val="22"/>', '<w:sz w:val="20"/>', new_xml)
new_xml = re.sub(r'<w:szCs w:val="22"/>', '<w:szCs w:val="20"/>', new_xml)

# ---- helpers for code detection & giant garbled chapter-headers ----
_strong = re.compile(r'(#include|#define|#ifndef|#endif|::|->|\{|\}|\)\s*;|\)\s*\{)')
_startkw = re.compile(r'^\s*(public|private|protected|class|struct|interface|enum|namespace|'
                      r'void|return|import|package|def |function|const |static |final |'
                      r'int |long |double |float |char\b|bool|boolean|String|var |val )', re.I)
def ptext(block):
    return html.unescape(''.join(re.findall(r'<w:t\b[^>]*>(.*?)</w:t>', block, re.DOTALL)))
def is_code(block):
    t = ptext(block).strip()
    if not t:
        return False
    sig = bool(_strong.search(t)) or bool(_startkw.match(t))
    if not sig:
        return False
    if len(t.split()) > 12 and not re.search(r'[{}]|#include|::|->', t):
        return False
    return True
def max_sz(block):
    sz = [int(x) for x in re.findall(r'<w:sz w:val="(\d+)"', block)]
    return max(sz) if sz else 0

# 3) Process paragraphs (outside tables): drop empty + giant garbled headers; code->Consolas
def is_empty_para(block):
    if '<w:drawing' in block or '<w:pict' in block or '<w:object' in block:
        return False
    txt = ''.join(re.findall(r'<w:t\b[^>]*>(.*?)</w:t>', block, re.DOTALL))
    return txt.strip() == ''

# match self-closing <w:p/> OR full <w:p ...>...</w:p> (self-closing tried first)
empty_p_re = re.compile(r'<w:p\b[^>]*?/>|<w:p\b[^>]*?>.*?</w:p>', re.DOTALL)
stats = {'empty': 0, 'giant': 0, 'code': 0}
def to_consolas(block):
    return re.sub(r'w:ascii="Times New Roman" w:hAnsi="Times New Roman"',
                  'w:ascii="Consolas" w:hAnsi="Consolas"',
                  block.replace('w:ascii="Times New Roman"', 'w:ascii="Consolas"')
                       .replace('w:hAnsi="Times New Roman"', 'w:hAnsi="Consolas"')
                       .replace('w:cs="Times New Roman"', 'w:cs="Consolas"'))
def process_seg(segment):
    def f(m):
        blk = m.group(0)
        if is_empty_para(blk):
            stats['empty'] += 1
            return ''
        # giant garbled decorative chapter-number headers (>=60pt)
        if max_sz(blk) >= 120:
            stats['giant'] += 1
            if '<w:drawing' in blk or '<w:pict' in blk:
                # keep the image, strip only the garbled giant text
                return re.sub(r'(<w:t\b[^>]*>).*?(</w:t>)', r'\1\2', blk, flags=re.DOTALL)
            return ''
        if is_code(blk):
            stats['code'] += 1
            return to_consolas(blk)
        return blk
    return empty_p_re.sub(f, segment)

# split out tables (kept verbatim) and process the rest
parts = re.split(r'(<w:tbl>.*?</w:tbl>)', new_xml, flags=re.DOTALL)
new_xml = ''.join(p if p.startswith('<w:tbl>') else process_seg(p) for p in parts)
print("empty removed:", stats['empty'], "| giant garbled removed:", stats['giant'],
      "| code->Consolas:", stats['code'])

# 3c) Strip giant garbled text from any run >=60pt anywhere (incl. tables), keep structure
def strip_giant_run(m):
    r = m.group(0)
    sz = [int(x) for x in re.findall(r'<w:sz w:val="(\d+)"', r)]
    if sz and max(sz) >= 120:
        return re.sub(r'(<w:t\b[^>]*>).*?(</w:t>)', r'\1\2', r, flags=re.DOTALL)
    return r
n_giant_run = [0]
def _count(m):
    out = strip_giant_run(m)
    if out != m.group(0):
        n_giant_run[0] += 1
    return out
new_xml = re.sub(r'<w:r\b[^>]*>.*?</w:r>', _count, new_xml, flags=re.DOTALL)
print("giant garbled runs stripped (incl. tables):", n_giant_run[0])

# 3b) Remove ALL gray text/paragraph shading (D9D9D9 PDF artifact) across whole doc
before_shd = len(re.findall(r'<w:shd\b', new_xml))
new_xml = re.sub(r'<w:shd\b[^>]*/>', '', new_xml)
new_xml = re.sub(r'<w:shd\b[^>]*>.*?</w:shd>', '', new_xml, flags=re.DOTALL)
print("shading removed:", before_shd - len(re.findall(r'<w:shd\b', new_xml)))

# 4) Minimize inter-paragraph spacing: before=0, after=0 everywhere
new_xml = re.sub(r'w:before="\d+"', 'w:before="0"', new_xml)
new_xml = re.sub(r'w:after="\d+"', 'w:after="0"', new_xml)
new_xml = re.sub(r'w:beforeAutospacing="\d+"', 'w:beforeAutospacing="0"', new_xml)
new_xml = re.sub(r'w:afterAutospacing="\d+"', 'w:afterAutospacing="0"', new_xml)

# A4 + narrow margins on remaining section(s)
new_xml = re.sub(r'<w:pgSz\b[^>]*/>',
                 '<w:pgSz w:w="11906" w:h="16838"/>', new_xml)
new_xml = re.sub(r'<w:pgMar\b[^>]*/>',
                 '<w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" '
                 'w:header="360" w:footer="360" w:gutter="0"/>', new_xml)

# write new docx: copy every part, replace only document.xml
buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zo:
    for item in z.infolist():
        data = z.read(item.filename)
        if item.filename == 'word/document.xml':
            data = new_xml.encode('utf-8')
        zo.writestr(item, data)
with open(OUT, 'wb') as f:
    f.write(buf.getvalue())

import os
print("WROTE", OUT, "size KB:", os.path.getsize(OUT)//1024)
# validate xml
import xml.dom.minidom as M
M.parseString(new_xml)
print("document.xml valid OK")
print("merged-away paragraphs:", len(emptied))
