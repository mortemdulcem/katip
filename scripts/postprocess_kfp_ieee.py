import zipfile, shutil, re, sys

SRC = sys.argv[1]
DST = sys.argv[2]
shutil.copy(SRC, DST + ".tmp")

with zipfile.ZipFile(DST + ".tmp", "r") as z:
    names = z.namelist()
    data = {n: z.read(n) for n in names}

# ---------- 1. styles.xml: 10pt Times New Roman + justified body + tight spacing ----------
st = data["word/styles.xml"].decode("utf-8")

# docDefaults: explicit Times New Roman, 10pt (sz=20)
st = st.replace(
    '<w:rFonts w:asciiTheme="minorHAnsi" w:cstheme="minorBidi" w:eastAsiaTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" />',
    '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" />'
)
# size 24->20 and spacing after 200->0 inside docDefaults only
m = re.search(r'<w:docDefaults>.*?</w:docDefaults>', st, re.S)
dd = m.group(0)
dd2 = dd.replace('<w:sz w:val="24" />', '<w:sz w:val="20" />')
dd2 = dd2.replace('<w:szCs w:val="24" />', '<w:szCs w:val="20" />')
dd2 = dd2.replace('<w:spacing w:after="200" />', '<w:spacing w:after="0" w:line="240" w:lineRule="auto" />')
st = st.replace(dd, dd2)

# body text style: justified + reduced spacing (Compact/FirstParagraph/BlockText inherit)
st = st.replace(
    '<w:link w:val="BodyTextChar" />\n    <w:qFormat />\n    <w:pPr>\n      <w:spacing w:after="180" w:before="180" />\n    </w:pPr>',
    '<w:link w:val="BodyTextChar" />\n    <w:qFormat />\n    <w:pPr>\n      <w:spacing w:after="80" w:before="0" w:line="240" w:lineRule="auto" />\n      <w:jc w:val="both" />\n    </w:pPr>'
)
# Compact + BlockText spacing tighten
st = st.replace('<w:spacing w:after="36" w:before="36" />', '<w:spacing w:after="40" w:before="0" />')
st = st.replace('<w:spacing w:after="100" w:before="100" />', '<w:spacing w:after="80" w:before="0" />')
data["word/styles.xml"] = st.encode("utf-8")

# ---------- 2. theme1.xml: make major+minor Latin font Times New Roman (headings serif too) ----------
if "word/theme/theme1.xml" in data:
    th = data["word/theme/theme1.xml"].decode("utf-8")
    th = re.sub(r'(<a:(?:major|minor)Font>\s*<a:latin typeface=")[^"]*"',
                r'\1Times New Roman"', th)
    data["word/theme/theme1.xml"] = th.encode("utf-8")

# ---------- 3. document.xml: drop empty paragraphs (no run / drawing / sectPr) ----------
doc = data["word/document.xml"].decode("utf-8")
removed = 0
# 3a. Self-closing boş paragraflar (<w:p/>) içeriksizdir -> doğrudan sil.
#     NOT: bunları eşli regex'e bırakmak FELAKET; <w:p/> açılış sanılıp bir sonraki
#     </w:p>'ye kadar (iç içe tablo dahil) her şey yutulur ve tablo bozulur.
self_closed = re.findall(r'<w:p\b[^>]*?/>', doc)
removed += len(self_closed)
doc = re.sub(r'<w:p\b[^>]*?/>', '', doc)
# 3b. Eşli boş paragraflar (<w:p ...></w:p> içinde run/drawing/sectPr yok).
def drop_empty(m):
    global removed
    p = m.group(0)
    if ("<w:r>" in p or "<w:r " in p or "<w:drawing" in p
            or "<w:sectPr" in p or "<w:hyperlink" in p):
        return p
    removed += 1
    return ""
doc = re.sub(r'<w:p\b[^>]*>.*?</w:p>', drop_empty, doc, flags=re.S)
data["word/document.xml"] = doc.encode("utf-8")

with zipfile.ZipFile(DST, "w", zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.writestr(n, data[n])
import os
os.remove(DST + ".tmp")
print(f"IEEE biçim uygulandı: 10pt TNR, iki-yana-yaslı, boşluk azaltıldı, {removed} boş paragraf silindi -> {DST}")
