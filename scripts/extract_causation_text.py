import fitz, re, json, os
PDF="attached_assets/causation-in-law-and-medicine-1nbsped-9781351953030-9780754622_1771577621715.pdf"
d=fitz.open(PDF)
OUT="scripts/causation_src"; os.makedirs(OUT, exist_ok=True)

# (title, num, start_page_1idx, enrich, part)
SEGS=[
 ("Önsöz (Preface)", 0, 7, False, None),
 ("Katkıda Bulunanlar (Notes on Contributors)", 0, 9, False, None),
 ("Teşekkür (Acknowledgments)", 0, 20, False, None),
 ("Giriş (Introduction)", 0, 22, False, None),
 ("Principles and Values Underlying the Concept of Causation in Law", 1, 34, True, "Part A: The Concept of Causation in Law, Medicine and Science"),
 ("Scientific and Legal Approaches to Causation", 2, 47, True, None),
 ("The Cause of Disease and Illness: Medical Views and Uncertainties", 3, 74, True, None),
 ("Aspects of Causation in Hippocratic Medicine and Roman Law of Delict", 4, 97, True, None),
 ("Rebels Without a Cause?: Judges, Medical and Scientific Evidence and the Uses of Causation", 5, 127, True, None),
 ("Legal Rules Governing the Requirement of Causation in Tort Law", 6, 170, True, "Part B: The Concept of Justice and Causal Responsibility in Tort Law"),
 ("Fault, Causation and Responsibility: Is Tort Law Just an Instrument of Corrective Justice?", 7, 185, True, None),
 ("Loss of Chance", 8, 200, True, None),
 ("Causality and Spinal Pain: The Problem of Back Pain", 9, 254, True, None),
 ("Principles of Causation in Criminal Law", 10, 267, True, "Part C: Issues of Causal Responsibility, Agency and Harm in Criminal Law and Medicine"),
 ("Death Causation in Palliative Medicine", 11, 289, True, None),
 ("Euthanasia and the Criminal Law: What Will Sever a Causal Chain?", 12, 314, True, None),
 ("Issues of Medical and Legal Causation Relating to Alzheimer's Disease", 13, 335, True, None),
 ("Cause in Forensic Pathology: The Cause and Manner of Death", 14, 354, True, "Part D: Causation in Forensic Medicine and Coronial Law"),
 ("Forensic Medicine: Issues in Causation", 15, 377, True, None),
 ("Causation in Coronial Law", 16, 401, True, None),
 ("Causation in Law and Psychiatry", 17, 428, True, "Part E: Causation, Evidence and Proof in Law and Medicine"),
 ("Causation in the Context of Medical Practitioners' Liability for Negligent Advice", 18, 454, True, None),
 ("Statistical Proof of Causation", 19, 476, True, None),
 ("Epilogue: Dilemmas in Proof of Causation", 20, 509, True, None),
]
BODY_END=567

def clean_page_text(p):
    pr=d[p].rect
    lines=[]
    for b in d[p].get_text("dict")["blocks"]:
        if b.get("type",0)!=0: continue
        for l in b["lines"]:
            txt="".join(s["text"] for s in l["spans"]).strip()
            if not txt: continue
            lines.append((l["bbox"][1], txt))
    lines.sort()
    res=[]
    for i,(y,txt) in enumerate(lines):
        topmar = y < pr.height*0.07
        botmar = y > pr.height*0.93
        if re.fullmatch(r'[\divxlcm]+', txt, re.I): continue   # salt sayfa no / roma
        if (topmar or botmar) and 'Causation in Law and Medicine' in txt: continue
        # üst/alt kenarda kısa, salt-koşu-başlık benzeri tek satır (bölüm adı tekrarı)
        if (topmar or botmar) and len(txt)<55 and i in (0,1,len(lines)-1,len(lines)-2) and txt.isupper()==False and len(txt.split())<=9 and not txt.endswith('.'):
            # şüpheli ama içerik kaybı riskli; yalnız çok-kısa ve büyük-harf-başlık değilse atla -> KORU
            res.append(txt); continue
        res.append(txt)
    return "\n".join(res)

segs_out=[]
for i,(title,num,start,enrich,part) in enumerate(SEGS):
    end = SEGS[i+1][2] if i+1<len(SEGS) else BODY_END
    txt="\n".join(clean_page_text(p) for p in range(start-1, end-1))
    fn=os.path.join(OUT, f"seg{i:02d}.txt")
    open(fn,"w").write(txt)
    segs_out.append({"idx":i,"num":num,"title":title,"part":part,"start":start,"end":end,
                     "enrich":enrich,"chars":len(txt),"file":fn})
    print(f"[{i:02d}] num={num:>2} s{start}-{end-1} chars={len(txt):>7} {'[P]' if part else '   '} {title[:52]}")
json.dump(segs_out, open("scripts/causation_chapters.json","w"), ensure_ascii=False, indent=1)
print("toplam segment:", len(segs_out), "toplam char:", sum(s['chars'] for s in segs_out))
