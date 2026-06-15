#!/usr/bin/env python3
"""
07_inventory.py — Gercek veri envanteri.
NCBI GEO (E-utilities) + EBI BioStudies/ArrayExpress uzerinde
insan + DNA metilasyon + madde kullanimi veri setlerini tarar.
Gercek accession + gercek ornek sayisi (n_samples) toplar. Hicbir sayi uydurulmaz.
Cikti: out/inventory_geo.csv, out/inventory_arrayexpress.csv, out/inventory_summary.json
"""
import json, time, sys, csv, os
import urllib.parse
import urllib.request

OUT = os.path.join(os.path.dirname(__file__), "..", "out")
os.makedirs(OUT, exist_ok=True)

SUBSTANCE_TERMS = {
    "smoking_tobacco": ['smoking', 'tobacco', 'cigarette', 'nicotine'],
    "alcohol": ['alcohol', 'alcoholism', 'alcohol use disorder', 'ethanol'],
    "cocaine": ['cocaine'],
    "opioid": ['opioid', 'heroin', 'morphine', 'methadone', 'oxycodone', 'fentanyl'],
    "methamphetamine": ['methamphetamine', 'amphetamine'],
    "cannabis": ['cannabis', 'marijuana', 'marihuana', 'tetrahydrocannabinol'],
    "general_substance": ['substance use disorder', 'drug addiction', 'drug abuse',
                          'injection drug', 'polysubstance', 'substance abuse'],
}

def http_get(url, tries=4):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'epiclock-inventory/1.0'})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read().decode('utf-8', 'replace')
        except Exception as e:
            last = e
            time.sleep(1.5 * (i + 1))
    print(f"  ! GET failed: {url[:90]} -> {last}", file=sys.stderr)
    return None

# ---------------- NCBI GEO (db=gds) ----------------
EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

def geo_search(term, retmax=300):
    q = f'({term}) AND methylation[All Fields] AND "Homo sapiens"[Organism] AND gse[Entry Type]'
    url = f"{EUTILS}/esearch.fcgi?db=gds&retmax={retmax}&retmode=json&term=" + urllib.parse.quote(q)
    txt = http_get(url)
    if not txt:
        return []
    try:
        return json.loads(txt)["esearchresult"].get("idlist", [])
    except Exception:
        return []

def geo_summary(uids):
    out = {}
    for i in range(0, len(uids), 200):
        chunk = uids[i:i+200]
        url = f"{EUTILS}/esummary.fcgi?db=gds&retmode=json&id=" + ",".join(chunk)
        txt = http_get(url)
        if not txt:
            continue
        try:
            res = json.loads(txt)["result"]
        except Exception:
            continue
        for uid in res.get("uids", []):
            d = res[uid]
            out[uid] = {
                "accession": d.get("accession", ""),
                "title": (d.get("title", "") or "").replace("\n", " ").strip(),
                "taxon": d.get("taxon", ""),
                "n_samples": int(d.get("n_samples", 0) or 0),
                "gdsType": d.get("gdsType", ""),
                "gpl": d.get("gpl", ""),
                "summary": (d.get("summary", "") or "").replace("\n", " ").strip()[:300],
            }
        time.sleep(0.4)
    return out

def run_geo():
    print("=== NCBI GEO taramasi ===")
    records = {}  # accession -> record (+matched substances)
    for label, terms in SUBSTANCE_TERMS.items():
        uids = []
        for t in terms:
            ids = geo_search(t)
            uids.extend(ids)
            time.sleep(0.4)
        uids = list(dict.fromkeys(uids))
        print(f"  {label}: {len(uids)} aday seri")
        summ = geo_summary(uids)
        for uid, d in summ.items():
            # NCBI esummary artik gdsType dondurmuyor; esearch zaten methylation[All Fields]
            # ile filtreledi. Sadece insan + gecerli accession + ornek sayisi olanlari tut.
            if "homo sapiens" not in d["taxon"].lower():
                continue
            if not d["accession"].startswith("GSE"):
                continue
            acc = d["accession"]
            if acc not in records:
                records[acc] = dict(d, substances=set())
            records[acc]["substances"].add(label)
    for r in records.values():
        r["substances"] = ",".join(sorted(r["substances"]))
    return records

# ---------------- EBI BioStudies / ArrayExpress ----------------
def run_arrayexpress():
    print("=== EBI ArrayExpress taramasi ===")
    records = {}
    base = "https://www.ebi.ac.uk/biostudies/api/v1/search"
    for label, terms in SUBSTANCE_TERMS.items():
        hits = 0
        for t in terms:
            q = f"{t} methylation"
            url = f"{base}?query=" + urllib.parse.quote(q) + "&collection=arrayexpress&pageSize=100"
            txt = http_get(url)
            if not txt:
                continue
            try:
                js = json.loads(txt)
            except Exception:
                continue
            for h in js.get("hits", []):
                acc = h.get("accession", "")
                title = (h.get("title", "") or "").replace("\n", " ").strip()
                if not acc:
                    continue
                if acc not in records:
                    records[acc] = {"accession": acc, "title": title,
                                    "n_samples": 0, "substances": set()}
                records[acc]["substances"].add(label)
                hits += 1
            time.sleep(0.4)
        print(f"  {label}: kumulatif {len(records)} kayit")
    for r in records.values():
        r["substances"] = ",".join(sorted(r["substances"]))
    return records

def main():
    geo = run_geo()
    with open(os.path.join(OUT, "inventory_geo.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["accession", "n_samples", "substances", "gpl", "gdsType", "title"])
        for r in sorted(geo.values(), key=lambda x: -x["n_samples"]):
            w.writerow([r["accession"], r["n_samples"], r["substances"],
                        r["gpl"], r["gdsType"], r["title"]])

    try:
        ae = run_arrayexpress()
    except Exception as e:
        print("ArrayExpress hata:", e, file=sys.stderr)
        ae = {}
    with open(os.path.join(OUT, "inventory_arrayexpress.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["accession", "n_samples", "substances", "title"])
        for r in sorted(ae.values(), key=lambda x: x["accession"]):
            w.writerow([r["accession"], r["n_samples"], r["substances"], r["title"]])

    # Per-substance gercek toplamlar (GEO, n_samples bilinen)
    by_sub = {}
    for r in geo.values():
        for s in r["substances"].split(","):
            by_sub.setdefault(s, {"datasets": 0, "samples": 0})
            by_sub[s]["datasets"] += 1
            by_sub[s]["samples"] += r["n_samples"]
    summary = {
        "geo_datasets": len(geo),
        "geo_total_samples": sum(r["n_samples"] for r in geo.values()),
        "geo_by_substance": by_sub,
        "arrayexpress_datasets": len(ae),
        "top20_geo": [
            {"accession": r["accession"], "n": r["n_samples"],
             "sub": r["substances"], "title": r["title"][:80]}
            for r in sorted(geo.values(), key=lambda x: -x["n_samples"])[:20]
        ],
    }
    with open(os.path.join(OUT, "inventory_summary.json"), "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("\n=== OZET ===")
    print(f"GEO benzersiz metilasyon seti: {summary['geo_datasets']}")
    print(f"GEO toplam ornek (n_samples): {summary['geo_total_samples']}")
    print("Madde bazinda (GEO):")
    for s, v in sorted(by_sub.items(), key=lambda x: -x[1]['samples']):
        print(f"  {s:20s} {v['datasets']:3d} set  {v['samples']:6d} ornek")
    print(f"ArrayExpress kayit: {summary['arrayexpress_datasets']}")

if __name__ == "__main__":
    main()
