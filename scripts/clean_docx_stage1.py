import zipfile, re, json, html, sys

SRC = 'attached_assets/Clean.Architecture.2017.9_translated_1780067905461.docx'

z = zipfile.ZipFile(SRC)
xml = z.read('word/document.xml').decode('utf-8', errors='ignore')

# split into paragraphs preserving order
para_blocks = re.findall(r'<w:p\b[^>]*>.*?</w:p>', xml, re.DOTALL)

def para_text(p):
    # join all <w:t> runs; treat <w:tab/> and <w:br/> as space
    p2 = re.sub(r'<w:tab\b[^>]*/>', ' ', p)
    p2 = re.sub(r'<w:br\b[^>]*/>', ' ', p2)
    runs = re.findall(r'<w:t\b[^>]*>(.*?)</w:t>', p2, re.DOTALL)
    txt = ''.join(runs)
    return html.unescape(txt)

raw = [para_text(p) for p in para_blocks]

# Deterministic cleaning
LETTER = "A-Za-zÀ-ÿİıĞğŞşÇçÖöÜü"
LOWER = "a-zà-ÿığşçöü"

def det_clean(t):
    if not t:
        return t
    # collapse whitespace
    t = t.replace('\u00a0', ' ')
    t = re.sub(r'[\t\r\n]+', ' ', t)
    t = re.sub(r' {2,}', ' ', t)
    t = t.strip()
    # line-wrap hyphenation: "word- word" or "word -word" where parts are letters
    t = re.sub(r'(['+LETTER+r'])-\s+(['+LOWER+r'])', r'\1\2', t)
    t = re.sub(r'(['+LETTER+r'])\s+-(['+LOWER+r'])', r'\1\2', t)
    return t

cleaned = [det_clean(t) for t in raw]

# Keep paragraph list; mark empties
out = []
for i, t in enumerate(cleaned):
    out.append({"i": i, "t": t})

with open('scripts/clean_stage1.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False)

total_chars = sum(len(o["t"]) for o in out)
nonempty = sum(1 for o in out if o["t"].strip())
print("paragraphs:", len(out), "nonempty:", nonempty, "chars after det clean:", total_chars)
# show a few samples
for idx in [5,6,7,10,200,300]:
    if idx < len(out):
        print(f"\n[{idx}] {out[idx]['t'][:200]!r}")
