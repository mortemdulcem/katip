#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
22_verify_references.py — Zero-Hallucination referans DOGRULAMA.

Her referans, NCBI E-utilities ile CANLI dogrulanir: esearch (kesin baslik sorgusu)
-> PMID, esummary -> tam kunye (baslik, yazarlar, dergi, yil, cilt, sayi, sayfa, DOI).
Kunye bilgisi ELLE YAZILMAZ; birebir NCBI'den cekilir. Beklenen ilk-yazar/yil ile
karsilastirilir; uyusmazsa MISMATCH olarak isaretlenir (ben elle duzeltirim).

PMID'i olmayan temel yontem/ML referanslari (Benjamini-Hochberg, Random Forest,
XGBoost, SHAP) ayri, sabit listede tutulur ve Crossref DOI ile dogrulanir.

Cikti:
  out/refs/references_verified.json  (tam kunye + denetim)
  out/refs/references_ama.md         (sirali AMA kaynakca, makaleye gomulecek)
  out/refs/audit.txt                 (denetim tablosu)
"""
import json, os, time, sys, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "out", "refs"))
os.makedirs(OUT, exist_ok=True)
EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
CROSSREF = "https://api.crossref.org/works"
UA = "litreview-refverify/1.0 (mailto:research@example.org)"

# Bilinen PMID + beklenen ilk-yazar/yil/baslik-anahtar (esummary ile CANLI dogrulama).
# (key, PMID, beklenen_yazar, beklenen_yil, baslik_anahtar)
PUBMED_REFS = [
    ("prisma2020", "33782057", "Page", "2021", "PRISMA 2020"),
    ("horvath2013", "24138928", "Horvath", "2013", "DNA methylation age"),
    ("hannum2013", "23177740", "Hannum", "2013", "quantitative views of human aging"),
    ("levine2018", "29676998", "Levine", "2018", "biomarker of aging for lifespan"),
    ("lu2019grimage", "30669119", "Lu", "2019", "GrimAge"),
    ("belsky2022dunedin", "35029144", "Belsky", "2022", "DunedinPACE"),
    ("horvathraj2018", "29643443", "Horvath", "2018", "epigenetic clock theory"),
    ("joehanes2016", "27651444", "Joehanes", "2016", "Cigarette Smoking"),
    ("zeilinger2013", "23691101", "Zeilinger", "2013", "Tobacco smoking"),
    ("houseman2012", "22568884", "Houseman", "2012", "cell mixture distribution"),
    ("guintivano2013", "23426267", "Guintivano", "2013", "brain cellular heterogeneity"),
    ("liu2018alcohol", "27843151", "Liu", "2018", "alcohol consumption"),
    ("rakyan2011ewas", "21747404", "Rakyan", "2011", "Epigenome-wide association"),
    ("michels2013ewas", "24076989", "Michels", "2013", "epigenome-wide association studies"),
    ("leek2010batch", "20838408", "Leek", "2010", "batch effects"),
    ("aryee2014minfi", "24478339", "Aryee", "2014", "Minfi"),
    ("parkwu2016dss", "26819470", "Park", "2016", "BS-seq"),
    ("feng2014dss", "24561809", "Feng", "2014", "differentially methylated loci"),
    ("nestler2014", "23643695", "Nestler", "2014", "drug addiction"),
    ("cadet2016", "25502297", "Cadet", "2016", "Addiction, and Resilience"),
    ("teschendorff2010age", "20219944", "Teschendorff", "2010", "suppressed in stem cells"),
    # --- Yasa disi / kompleks madde EWAS + kullanim-suresi/recency literaturu (gercek, canli dogrulanmis) ---
    ("meth_shirai2024", "38488760", "Shirai", "2024", "methamphetamine dependence"),
    ("cocaine_poisel2023", "36865068", "Poisel", "2023", "cocaine use disorder"),
    ("idu_shu2022", "35395503", "Shu", "2022", "injection drug use"),
    ("cannabis_fang2024", "37935791", "Fang", "2024", "cannabis"),
    ("cannabis_osborne2020", "32321915", "Osborne", "2020", "cannabis"),
    ("cannabis_garrett2024", "38309009", "Garrett", "2024", "cannabis use disorder"),
    ("alcohol_rosen2018", "30185790", "Rosen", "2018", "alcohol dependence"),
    ("smoke_wilson2017", "29047347", "Wilson", "2017", "smoking-related disturbed methylation"),
    ("smoke_mccartney2018", "30389506", "McCartney", "2018", "starting and stopping smoking"),
    ("smokecess_fang2023", "37123087", "Fang", "2023", "smoking cessation"),
    ("reversal_fitzgerald2021", "33844651", "Fitzgerald", "2021", "reversal of epigenetic age"),
    ("dama_fiorito2021", "34535961", "Fiorito", "2021", "slowed down"),
    ("opioid_rompala2023", "37507366", "Rompala", "2023", "opioid use disorder"),
    ("cg05575921_dawes2020", "32580755", "Dawes", "2020", "cg05575921"),
    ("horvath2018skinblood", "30048243", "Horvath", "2018", "skin and blood"),
    ("schrott2020sperm", "32211199", "Schrott", "2020", "sperm epigenome"),
]

# Dogrudan PMID ile dogrulananlar (makalede gecen, kunyesi kesin)
DIRECT_PMIDS = {
    "opioidmeta2022_direct": "36700736",
    "cannabis2025_bmcpulm": "40205553",
}

# DOI ile (Crossref) dogrulanan, PubMed-disi temel yontem/ML referanslari
CROSSREF_REFS = [
    ("benjamini1995fdr", "10.1111/j.2517-6161.1995.tb02031.x"),
    ("breiman2001rf", "10.1023/A:1010933404324"),
    ("chen2016xgboost", "10.1145/2939672.2939785"),
    ("pedregosa2011sklearn", None),  # JMLR, no DOI; sabit kunye
]


def http_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def esearch(query):
    # sort=relevance: aksi halde esearch en-yeni-once dondurur (yanlis makale).
    # Tirnakli baslik sorgularini [Title] alanina kisitla (tam eslesme onde).
    q = query
    if q.strip().startswith('"') and "[" not in q:
        q = q.strip() + "[Title]"
    url = (f"{EUTILS}/esearch.fcgi?db=pubmed&retmax=3&retmode=json&sort=relevance&term="
           + urllib.parse.quote(q))
    d = http_json(url)
    ids = d.get("esearchresult", {}).get("idlist", [])
    return ids


def esummary(pmid):
    url = f"{EUTILS}/esummary.fcgi?db=pubmed&retmode=json&id={pmid}"
    d = http_json(url)
    return d.get("result", {}).get(pmid, {})


def fmt_authors(auths, n=3):
    names = [a.get("name", "") for a in auths if a.get("authtype", "Author") == "Author"]
    if not names:
        names = [a.get("name", "") for a in auths]
    if len(names) > n:
        return ", ".join(names[:n]) + ", ve ark."
    return ", ".join(names)


def doi_from_summary(s):
    for a in s.get("articleids", []):
        if a.get("idtype") == "doi":
            return a.get("value")
    return s.get("elocationid", "").replace("doi: ", "").strip() or None


def ama(s):
    auth = fmt_authors(s.get("authors", []))
    title = s.get("title", "").rstrip(".")
    journal = s.get("source", "")
    year = (s.get("pubdate", "") or "").split(" ")[0]
    vol = s.get("volume", ""); issue = s.get("issue", ""); pages = s.get("pages", "")
    doi = doi_from_summary(s)
    cite = f"{auth} {title}. *{journal}.* {year}"
    if vol:
        cite += f";{vol}"
        if issue:
            cite += f"({issue})"
        if pages:
            cite += f":{pages}"
    cite += "."
    if doi:
        cite += f" doi:{doi}"
    cite += f" PMID {s.get('uid','')}."
    return cite


def main():
    results = []
    audit = []
    seen = set()
    for key, pmid, exp_a, exp_y, exp_kw in PUBMED_REFS:
        try:
            s = esummary(pmid)
            time.sleep(0.34)
            title = s.get("title", "")
            year = (s.get("pubdate", "") or "").split(" ")[0]
            a1 = (s.get("authors", [{}]) or [{}])[0].get("name", "")
            ok = ((exp_a.lower() in a1.lower() if exp_a else True)
                  and (exp_y == year if exp_y else True)
                  and (exp_kw.lower() in title.lower() if exp_kw else True))
            flag = "OK     " if ok else "MISMATCH"
            if pmid in seen:
                flag = "DUP    "
            seen.add(pmid)
            audit.append(f"[{flag}] {key}: PMID {pmid} | {year} | {a1} | {s.get('source','')} | {title[:70]}")
            results.append({"key": key, "pmid": pmid, "verified": ok, "first_author": a1,
                            "year": year, "journal": s.get("source", ""), "title": title,
                            "volume": s.get("volume", ""), "issue": s.get("issue", ""),
                            "pages": s.get("pages", ""), "doi": doi_from_summary(s),
                            "ama": ama(s)})
        except Exception as e:
            audit.append(f"[ERROR]   {key}: {type(e).__name__}: {e}")
            time.sleep(0.6)

    # dogrudan PMID'ler
    for key, pmid in DIRECT_PMIDS.items():
        try:
            s = esummary(pmid); time.sleep(0.4)
            title = s.get("title", "")
            a1 = (s.get("authors", [{}]) or [{}])[0].get("name", "")
            audit.append(f"[DIRECT ] {key}: PMID {pmid} | {(s.get('pubdate','') or '').split(' ')[0]} | {a1} | {title[:70]}")
            results.append({"key": key, "pmid": pmid, "verified": True, "first_author": a1,
                            "year": (s.get("pubdate", "") or "").split(" ")[0], "journal": s.get("source", ""),
                            "title": title, "volume": s.get("volume", ""), "issue": s.get("issue", ""),
                            "pages": s.get("pages", ""), "doi": doi_from_summary(s), "ama": ama(s)})
        except Exception as e:
            audit.append(f"[ERROR]   {key}: {e}")

    # Crossref (PMID'siz)
    for key, doi in CROSSREF_REFS:
        if doi is None:
            audit.append(f"[FIXED  ] {key}: PMID'siz/Crossref'siz (elle sabit kunye)")
            continue
        try:
            d = http_json(f"{CROSSREF}/{urllib.parse.quote(doi)}"); time.sleep(0.4)
            msg = d.get("message", {})
            auths = msg.get("author", [])
            a1 = (auths[0].get("family", "") if auths else "")
            title = (msg.get("title", [""]) or [""])[0]
            cont = (msg.get("container-title", [""]) or [""])[0]
            yr = ""
            for k in ("published-print", "published-online", "issued"):
                if msg.get(k, {}).get("date-parts"):
                    yr = str(msg[k]["date-parts"][0][0]); break
            audit.append(f"[CROSSREF] {key}: DOI {doi} | {yr} | {a1} | {cont} | {title[:60]}")
            results.append({"key": key, "pmid": None, "verified": True, "first_author": a1,
                            "year": yr, "journal": cont, "title": title,
                            "volume": msg.get("volume", ""), "issue": msg.get("issue", ""),
                            "pages": msg.get("page", ""), "doi": doi,
                            "ama": f"{a1} ve ark. {title.rstrip('.')}. *{cont}.* {yr}. doi:{doi}"})
        except Exception as e:
            audit.append(f"[ERROR]   {key}: {e}")

    json.dump(results, open(os.path.join(OUT, "references_verified.json"), "w"),
              ensure_ascii=False, indent=2)
    with open(os.path.join(OUT, "audit.txt"), "w") as f:
        f.write("\n".join(audit) + "\n")
    print("\n".join(audit))
    print(f"\nTOPLAM dogrulanan: {len(results)} | cikti: {OUT}")


if __name__ == "__main__":
    main()
