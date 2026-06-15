import glob, os, re, json

CACHE = "scripts/causation_cache"
segments = json.load(open("scripts/causation_chapters.json", encoding="utf-8"))

TITLE = (
    "# Hukukta ve Tıpta Nedensellik\n\n"
    "## Causation in Law and Medicine\n\n"
    "*Editörler: Ian Freckelton & Danuta Mendelson — Routledge (Ashgate) 2002/2016*\n\n"
    "*İleri akademik (master düzeyi) hukuk çevirisi — mediko-legal nedensellik. "
    "Çevirmen notları ve her bölüm için karşılaştırmalı Türk hukuku ekleriyle.*\n\n"
    "---\n"
)

parts = [TITLE]
for seg in segments:
    si = seg["idx"]
    pad = f"{si:02d}"
    chunks = sorted(glob.glob(os.path.join(CACHE, f"seg{pad}_chunk*.md")))
    if not chunks:
        continue
    for f in chunks:
        parts.append(open(f, encoding="utf-8").read().strip())
    enrich = os.path.join(CACHE, f"seg{pad}_enrich.md")
    if os.path.exists(enrich):
        parts.append(open(enrich, encoding="utf-8").read().strip())

text = "\n\n".join(parts)
out = os.path.join(CACHE, "_assembled.md")
open(out, "w", encoding="utf-8").write(text)
print(f"birleştirildi: {len(parts)-1} parça, {len(text)} karakter -> {out}")
