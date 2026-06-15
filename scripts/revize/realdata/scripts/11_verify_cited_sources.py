#!/usr/bin/env python3
"""
11_verify_cited_sources.py — EXHAUSTIVELY verify every data source the fabricated article cites.

The article (Tablo 1) claims 15 datasets / 10,542 samples. This script hits the LIVE source
databases (NCBI GEO via E-utilities, EBI BioStudies/ArrayExpress, NCBI PMC) for every cited
accession and reports the REAL title / organism / platform / sample count / data availability,
side by side with what the article claimed. Nothing is invented; every field comes from the live
API response (raw responses cached in out/cited_raw/).

Output: out/cited_sources_verification.json  (+ printed comparison table)
"""
import json, os, time, urllib.request, urllib.parse, ssl

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "out"))
RAW = os.path.join(OUT, "cited_raw")
os.makedirs(RAW, exist_ok=True)
CTX = ssl.create_default_context()
UA = {"User-Agent": "Mozilla/5.0 (research verification; contact: researcher)"}

# What the article's Tablo 1 claims (substance, platform, N, tissue)
CITED = [
    ("GSE110043", "geo", "Alkol", "EPIC", 732, "Kan"),
    ("GSE181817", "geo", "Kokain", "450K+EPIC", 1030, "Kan"),
    ("GSE149229", "geo", "Metamfetamin", "450K", 48, "Kan"),
    ("GSE112987", "geo", "Alkol (FASD)", "450K", 96, "Kan"),
    ("GSE105018", "geo", "Çoklu Madde", "450K", 394, "Kan"),
    ("GSE49393", "geo", "Alkol", "450K", 24, "Beyin PFC"),
    ("GSE80261", "geo", "Alkol", "450K", 48, "Beyin BA9"),
    ("GSE125105", "geo", "Opioid", "450K", 36, "Beyin"),
    ("GSE87571", "geo", "(referans?)", "?", None, "Kan"),
    ("GSE154566", "geo", "(referans?)", "?", None, "Kan"),
    ("E-MTAB-5738", "ae", "Kontrol", "EPIC", 2687, "Kan"),
    ("E-MTAB-7309", "ae", "Alkol+Sigara", "450K", 456, "Kan"),
    ("E-MTAB-10888", "ae", "Karışık", "EPIC", 234, "Kan"),
    ("PMC9979153", "pmc", "Opioid", "EPIC", 1240, "Kan"),
]


def get(url, tries=4):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=40, context=CTX) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:
            last = e
            time.sleep(1.5 * (i + 1))
    return f"__ERROR__ {last}"


def verify_geo(acc):
    # esearch -> UID, then esummary (json) in db=gds
    es = get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gds&term="
             + urllib.parse.quote(f"{acc}[ACCN] AND gse[ETYP]") + "&retmode=json")
    open(os.path.join(RAW, f"{acc}_esearch.json"), "w").write(es)
    try:
        ids = json.loads(es)["esearchresult"]["idlist"]
    except Exception:
        ids = []
    if not ids:
        return {"found": False, "note": "GEO esearch returned no UID"}
    time.sleep(0.4)
    su = get(f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gds&id={ids[0]}&retmode=json")
    open(os.path.join(RAW, f"{acc}_esummary.json"), "w").write(su)
    d = json.loads(su)["result"][ids[0]]
    return {
        "found": True, "real_title": d.get("title"),
        "organism": d.get("taxon"), "real_n_samples": d.get("n_samples"),
        "platform": d.get("gpl"), "gdstype": d.get("gdstype"),
        "summary": (d.get("summary") or "")[:400],
    }


def verify_ae(acc):
    # EBI BioStudies API (ArrayExpress migrated here)
    txt = get(f"https://www.ebi.ac.uk/biostudies/api/v1/studies/{acc}")
    open(os.path.join(RAW, f"{acc}_biostudies.json"), "w").write(txt)
    if txt.startswith("__ERROR__"):
        return {"found": False, "note": txt[:200]}
    try:
        d = json.loads(txt)
    except Exception:
        return {"found": False, "note": "non-JSON / not found in BioStudies"}
    attrs = {}
    sec = d.get("section", {})
    for a in sec.get("attributes", []):
        attrs[a.get("name", "")] = a.get("value", "")
    title = attrs.get("Title") or d.get("title") or attrs.get("Study Title")
    org = attrs.get("Organism")
    return {"found": True, "real_title": title, "organism": org,
            "attrs_keys": list(attrs.keys())[:20],
            "desc": (attrs.get("Description", "") or "")[:400]}


def verify_pmc(acc):
    uid = acc.replace("PMC", "")
    su = get(f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id={uid}&retmode=json")
    open(os.path.join(RAW, f"{acc}_esummary.json"), "w").write(su)
    try:
        d = json.loads(su)["result"][uid]
        return {"found": True, "real_title": d.get("title"),
                "source": d.get("source"), "pubdate": d.get("pubdate"),
                "authors": [a.get("name") for a in d.get("authors", [])][:3]}
    except Exception:
        return {"found": False, "note": su[:200]}


def main():
    results = []
    for acc, kind, sub, plat, n, tissue in CITED:
        print(f"\n### {acc}  (makale: {sub}, {plat}, n={n}, {tissue})")
        if kind == "geo":
            r = verify_geo(acc)
        elif kind == "ae":
            r = verify_ae(acc)
        else:
            r = verify_pmc(acc)
        r["accession"] = acc
        r["article_claim"] = {"substance": sub, "platform": plat, "n": n, "tissue": tissue}
        results.append(r)
        if r.get("found"):
            print("  REAL title :", r.get("real_title"))
            if "organism" in r: print("  organism   :", r.get("organism"))
            if "real_n_samples" in r: print("  REAL n     :", r.get("real_n_samples"), "(makale iddiasi:", n, ")")
            if "platform" in r: print("  platform   :", r.get("platform"))
            if r.get("summary"): print("  summary    :", r["summary"][:200])
            if r.get("desc"): print("  desc       :", r["desc"][:200])
        else:
            print("  NOT FOUND / err:", r.get("note"))
        time.sleep(0.5)
    with open(os.path.join(OUT, "cited_sources_verification.json"), "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\n\n=== saved out/cited_sources_verification.json ({len(results)} sources) ===")


if __name__ == "__main__":
    main()
