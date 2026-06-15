import subprocess, re, json, os

F = "attached_assets/gdrive/caus2.pdf"
os.makedirs("scripts/caus2_src", exist_ok=True)

H1 = "Road Traffic Fatalities"
H2 = "Investigation of Road Traffic Fatalities: An Atlas"

def page_text(p):
    return subprocess.run(["pdftotext", "-f", str(p), "-l", str(p), F, "-"],
                          capture_output=True, text=True).stdout

def clean(t):
    # normalize OCR header variant
    t = t.replace("A n Atlas", "An Atlas")
    # remove running headers possibly wrapped with a page number
    t = re.sub(r'^\s*\d*\s*' + re.escape(H2) + r'\s*\d*', ' ', t)
    t = re.sub(r'^\s*\d*\s*' + re.escape(H1) + r'\s*\d*', ' ', t)
    t = t.replace(H2, " ").replace(H1, " ")
    # join, drop standalone page numbers and bullet artifacts
    lines = []
    for ln in t.split("\n"):
        s = ln.strip()
        if not s:
            continue
        if re.fullmatch(r'[ivxlcdm]+', s, re.I):  # roman numerals (page nos)
            continue
        if re.fullmatch(r'\d{1,3}', s):           # arabic page numbers
            continue
        if re.fullmatch(r'[\*\s]+', s):           # "* * * *" artifacts
            continue
        lines.append(s)
    out = "\n".join(lines)
    out = re.sub(r'[ \t]+', ' ', out)
    return out.strip()

# ---- prose segments ----
def grab(pages):
    return clean("\n".join(page_text(p) for p in pages))

segments = []
preface = clean(page_text(6))
authors = clean(page_text(8))
main = grab(range(12, 35))   # 12..34 main text chapter

segments.append({"idx": 0, "title": "Önsöz (Preface)", "enrich": False, "text": preface})
segments.append({"idx": 1, "title": "Yazarlar Hakkında (The Authors)", "enrich": False, "text": authors})
segments.append({"idx": 2, "title": "Karayolu Trafik Ölümleri — İnceleme (Road Traffic Fatalities)", "enrich": True, "text": main})

for s in segments:
    open(f"scripts/caus2_src/seg{s['idx']:02d}.txt", "w", encoding="utf-8").write(s["text"])
    s["chars"] = len(s["text"])

meta = [{k: v for k, v in s.items() if k != "text"} for s in segments]
json.dump(meta, open("scripts/caus2_chapters.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

# ---- figure pages (35..122): parse captions ----
FIGRE = re.compile(r'(?:Figure|igure|Fzgure|Flgure)\s*[A-Z]?(\d+)\b', re.I)
figures = []
for p in range(35, 123):
    raw = clean(page_text(p))
    # split into caption blocks at each Figure marker
    caps = []
    matches = list(FIGRE.finditer(raw))
    for i, m in enumerate(matches):
        num = int(m.group(1))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
        txt = raw[start:end].strip(" .:-")
        caps.append({"num": num, "en": txt})
    figures.append({"page": p, "img": f"p{p:03d}.jpg", "caps": caps})

json.dump(figures, open("scripts/caus2_figures.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

total_caps = sum(len(f["caps"]) for f in figures)
print(f"prose seg: {len(segments)} (chars: {[s['chars'] for s in segments]})")
print(f"figure pages: {len(figures)}, toplam caption: {total_caps}")
nums = sorted(c["num"] for f in figures for c in f["caps"])
print(f"figure num aralığı: {nums[0]}..{nums[-1]}, benzersiz: {len(set(nums))}")
miss = [n for n in range(nums[0], nums[-1] + 1) if n not in set(nums)]
print(f"eksik figure no: {miss}")
