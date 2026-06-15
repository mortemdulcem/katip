import zipfile, shutil, re, sys, os

# Sütuna sığması gereken (dar) figürleri sütun genişliğine (7.8cm) indirir.
# Genişliği (7.8cm, 10cm] aralığındaki figürler 7.8cm'e ölçeklenir; <=7.8 korunur;
# >10cm figürler (iki sütunu kaplayacak geniş diyagramlar) dokunulmadan bırakılır.
SRC, DST = sys.argv[1], sys.argv[2]
LO = int(round(7.8 * 360000))    # 2808000 EMU
HI = int(round(10.0 * 360000))   # 3600000 EMU

shutil.copy(SRC, DST + ".tmp")
with zipfile.ZipFile(DST + ".tmp", "r") as z:
    names = z.namelist()
    data = {n: z.read(n) for n in names}
doc = data["word/document.xml"].decode("utf-8")

count = [0]
def scale_drawing(block):
    m = re.search(r'<wp:extent\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"', block)
    if not m:
        return block
    cx = int(m.group(1))
    if not (LO < cx <= HI):
        return block
    f = LO / cx
    count[0] += 1
    block = re.sub(r'cx="(\d+)"', lambda mm: 'cx="%d"' % max(1, round(int(mm.group(1)) * f)), block)
    block = re.sub(r'cy="(\d+)"', lambda mm: 'cy="%d"' % max(1, round(int(mm.group(1)) * f)), block)
    return block

doc = re.sub(r'<w:drawing\b.*?</w:drawing>', lambda m: scale_drawing(m.group(0)), doc, flags=re.S)
data["word/document.xml"] = doc.encode("utf-8")

with zipfile.ZipFile(DST, "w", zipfile.ZIP_DEFLATED) as o:
    for n in names:
        o.writestr(n, data[n])
os.remove(DST + ".tmp")
print(f"sütuna indirilen (dar) figür: {count[0]} -> {DST}")
