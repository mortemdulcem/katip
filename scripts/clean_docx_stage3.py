import json, re, zipfile, html
from xml.sax.saxutils import escape

with open('scripts/clean_stage1.json', encoding='utf-8') as f:
    stage1 = json.load(f)
with open('scripts/clean_stage2.json', encoding='utf-8') as f:
    cleaned = {int(k): v for k, v in json.load(f).items()}

# Build final ordered paragraph list
raw_paras = []
for o in stage1:
    i, t = o['i'], o['t']
    if not t.strip():
        continue  # drop empty paragraphs (collapse blank runs)
    raw_paras.append(cleaned.get(i, t).strip())

# Merge cross-paragraph line-wrap hyphenation: para ending "letter-" joins next
TRAIL = re.compile(r'[A-Za-zÇÖÜĞŞİçöüğşı]-$')
paras = []
k = 0
while k < len(raw_paras):
    cur = raw_paras[k]
    while TRAIL.search(cur) and k + 1 < len(raw_paras):
        nxt = raw_paras[k + 1]
        cont = nxt
        # lowercase first letter of continuation (mid-word join)
        if cont and cont[0].isupper():
            cont = cont[0].lower() + cont[1:]
        cur = cur[:-1] + cont
        k += 1
    paras.append(cur)
    k += 1

# remove consecutive exact duplicates that are pure page numbers artifacts? keep as-is.

# Heading detection
def is_heading(t):
    if len(t) > 90:
        return False
    if re.match(r'^(Bölüm|Kısım|BÖLÜM|KISIM)\b', t):
        return True
    if re.match(r'^\d+\.?\s*(Bölüm|Kısım)\b', t):
        return True
    return False

FONT = "Times New Roman"

def run(text, bold=False):
    rpr = '<w:rPr><w:rFonts w:ascii="%s" w:hAnsi="%s" w:cs="%s"/>%s<w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>' % (
        FONT, FONT, FONT, '<w:b/>' if bold else '')
    return '<w:r>%s<w:t xml:space="preserve">%s</w:t></w:r>' % (rpr, escape(text))

def para_xml(text):
    heading = is_heading(text)
    if heading:
        ppr = ('<w:pPr><w:spacing w:before="160" w:after="80" w:line="276" w:lineRule="auto"/>'
               '<w:jc w:val="left"/></w:pPr>')
        return '<w:p>%s%s</w:p>' % (ppr, run(text, bold=True))
    else:
        ppr = ('<w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/>'
               '<w:jc w:val="both"/></w:pPr>')
        return '<w:p>%s%s</w:p>' % (ppr, run(text))

body = ''.join(para_xml(t) for t in paras)

# A4 = 11906 x 16838 twips; narrow margins ~720 twips (0.5 inch)
sectpr = ('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
          '<w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" '
          'w:header="360" w:footer="360" w:gutter="0"/>'
          '<w:cols w:space="708"/></w:sectPr>')

document = (
'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
'<w:body>' + body + sectpr + '</w:body></w:document>'
)

content_types = (
'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
'<Default Extension="xml" ContentType="application/xml"/>'
'<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
'<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
'</Types>'
)

rels = (
'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
'</Relationships>'
)

doc_rels = (
'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
'</Relationships>'
)

styles = (
'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
'<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
'<w:docDefaults><w:rPrDefault><w:rPr>'
'<w:rFonts w:ascii="%s" w:hAnsi="%s" w:cs="%s"/><w:sz w:val="22"/><w:szCs w:val="22"/>'
'<w:lang w:val="tr-TR"/></w:rPr></w:rPrDefault>'
'<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>'
'</w:docDefaults>'
'<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/>'
'<w:rPr><w:rFonts w:ascii="%s" w:hAnsi="%s" w:cs="%s"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>'
'</w:style></w:styles>' % (FONT, FONT, FONT, FONT, FONT, FONT)
)

OUT = 'client/public/Clean_Architecture_TR_Duzeltilmis.docx'
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/_rels/document.xml.rels', doc_rels)
    z.writestr('word/document.xml', document)
    z.writestr('word/styles.xml', styles)

print("WROTE", OUT)
print("paragraphs:", len(paras))
import os
print("size KB:", os.path.getsize(OUT)//1024)
