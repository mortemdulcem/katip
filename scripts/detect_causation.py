import fitz, re, json
PDF="attached_assets/causation-in-law-and-medicine-1nbsped-9781351953030-9780754622_1771577621715.pdf"
d=fitz.open(PDF)

def page_headlines(p):
    out=[]
    for b in d[p].get_text("dict")["blocks"]:
        if b.get("type",0)!=0: continue
        for l in b["lines"]:
            txt="".join(s["text"] for s in l["spans"]).strip()
            if not txt: continue
            sz=max((s["size"] for s in l["spans"]), default=0)
            out.append((round(sz,1),txt))
    return out

# Bölüm/kısım başlangıç sayfaları: max font >= 26 olan ve başlık paterni
heads=[]
for p in range(len(d)):
    hl=page_headlines(p)
    if not hl: continue
    big=[t for sz,t in hl if sz>=25.5]
    if not big: continue
    first=big[0]
    heads.append((p, first, big[:3]))

print("=== font>=25.5 başlık sayfaları ===")
for p,first,bs in heads:
    print(f"s{p+1}: {first!r}")
