import zipfile, shutil, re, sys, os

SRC = sys.argv[1]   # pandoc output
DST = sys.argv[2]   # final

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
shutil.copy(SRC, DST + ".tmp")

with zipfile.ZipFile(DST + ".tmp", "r") as z:
    names = z.namelist()
    data = {n: z.read(n) for n in names}

doc = data["word/document.xml"].decode("utf-8")

# --- 1. Full grid borders + 100% width + autofit on every table ---
borders = (
    '<w:tblBorders>'
    '<w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
    '<w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
    '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
    '<w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
    '<w:insideH w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
    '<w:insideV w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
    '</w:tblBorders>'
    '<w:tblW w:w="5000" w:type="pct"/>'
    '<w:tblLayout w:type="autofit"/>'
)

def fix_tblpr(m):
    inner = m.group(1)
    # strip any existing borders/width/layout we are replacing
    inner = re.sub(r'<w:tblBorders>.*?</w:tblBorders>', '', inner, flags=re.S)
    inner = re.sub(r'<w:tblW\b[^/]*/>', '', inner)
    inner = re.sub(r'<w:tblLayout\b[^/]*/>', '', inner)
    # tblStyle (if any) must stay first; append our borders after it
    mstyle = re.match(r'(<w:tblStyle\b[^/]*/>)?(.*)', inner, flags=re.S)
    style = mstyle.group(1) or ''
    rest = mstyle.group(2) or ''
    return '<w:tblPr>' + style + borders + rest + '</w:tblPr>'

ntab = len(re.findall(r'<w:tblPr>', doc))
doc = re.sub(r'<w:tblPr>(.*?)</w:tblPr>', fix_tblpr, doc, flags=re.S)

# tables without explicit tblPr -> add one right after <w:tbl>
def add_tblpr(m):
    if '<w:tblPr>' in m.group(0)[:60]:
        return m.group(0)
    return '<w:tbl><w:tblPr>' + borders + '</w:tblPr>'
doc = re.sub(r'<w:tbl>(?!\s*<w:tblPr>)', '<w:tbl><w:tblPr>' + borders + '</w:tblPr>', doc)

# --- 2. A4 page size + moderate margins on sectPr ---
A4 = '<w:pgSz w:w="11906" w:h="16838"/>'
MARG = '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/>'
PAGE = A4 + MARG
if re.search(r'<w:pgSz\b', doc):
    doc = re.sub(r'<w:pgSz\b[^/]*/>', A4, doc)
    doc = re.sub(r'<w:pgMar\b[^/]*/>', MARG, doc) if re.search(r'<w:pgMar\b', doc) else doc.replace(A4, A4 + MARG, 1)
else:
    # empty/self-closing sectPr -> expand with page setup
    doc = re.sub(r'<w:sectPr\s*/>', '<w:sectPr>' + PAGE + '</w:sectPr>', doc)

data["word/document.xml"] = doc.encode("utf-8")

with zipfile.ZipFile(DST, "w", zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.writestr(n, data[n])
os.remove(DST + ".tmp")
print(f"tablo sayısı (tblPr): {ntab}, A4+kenarlık uygulandı -> {DST}")
