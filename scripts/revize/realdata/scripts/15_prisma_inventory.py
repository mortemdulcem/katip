#!/usr/bin/env python3
"""
P1 - PRISMA 2020 dataset identification + screening + eligibility for the
genuine substance-use DNA-methylation study.

Zero-Hallucination: counts come straight from live NCBI GEO (db=gds) esearch/esummary.
Raw responses cached under out/prisma/raw/ so every number is reproducible.

PRISMA stages implemented here:
  IDENTIFICATION : esearch total hit count per substance search string.
  SCREENING      : keep records that are (a) GSE series, (b) a Methylation gdstype,
                   (c) on-topic = substance keyword appears in title or summary.
  ELIGIBILITY    : classify by organism + platform:
                     clock-eligible  = Homo sapiens AND 450K/EPIC array (Horvath-family clocks valid)
                     ewas-array      = methylation array, any organism (DMP/EWAS valid)
                     ewas-seq        = bisulfite-seq (WGBS/RRBS) -> EWAS only, no array clocks
  INCLUDED       : de-duplicated union, tagged with intended use.
"""
import urllib.request, urllib.parse, json, time, os, re, sys

OUT = os.path.join(os.path.dirname(__file__), "..", "out", "prisma")
RAW = os.path.join(OUT, "raw")
os.makedirs(RAW, exist_ok=True)
BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"

# Documented PRISMA search strategy (substance -> boolean string, all on db=gds)
SEARCHES = {
    "alcohol":        "(alcohol OR ethanol OR alcoholism OR alcohol use disorder) AND methylation",
    "cocaine":        "cocaine AND methylation",
    "opioid":         "(opioid OR morphine OR heroin OR oxycodone OR methadone OR fentanyl) AND methylation",
    "methamphetamine":"(methamphetamine OR amphetamine) AND methylation",
    "cannabis":       "(cannabis OR marijuana OR tetrahydrocannabinol) AND methylation",
    "smoking_ref":    "(smoking OR nicotine OR tobacco OR cigarette) AND methylation",
}
# substance keyword sets for the on-topic relevance screen
KW = {
    "alcohol": ["alcohol","ethanol","alcoholism","aud","drinking"],
    "cocaine": ["cocaine"],
    "opioid": ["opioid","morphine","heroin","oxycodone","methadone","fentanyl","oud"],
    "methamphetamine": ["methamphetamine","amphetamine","meth "],
    "cannabis": ["cannabis","marijuana","thc","tetrahydrocannabinol"],
    "smoking_ref": ["smok","nicotine","tobacco","cigarette"],
}
ARR_450K = {"GPL13534"}          # Illumina 450K
ARR_EPIC = {"GPL21145","GPL23976","GPL34394"}  # EPIC / EPIC v2 family
ARR_27K  = {"GPL8490"}

# Curated known-relevant accessions (found + verified earlier via targeted GEO search).
# Force-included so a relevance-ranking miss can't silently drop a real substance dataset.
SEEDS = {
    "alcohol": ["GSE110043", "GSE49393"],
    "cocaine": ["GSE77056", "GSE66348", "GSE66350", "GSE72401", "GSE200254", "GSE200255"],
    "opioid": ["GSE235818", "GSE164822", "GSE151485", "GSE292082"],
    "methamphetamine": ["GSE293262", "GSE154971", "GSE64158", "GSE64159", "GSE140072"],
    "smoking_ref": ["GSE50660", "GSE87571", "GSE147040"],
}


def fetch(url, cache):
    p = os.path.join(RAW, cache)
    if os.path.exists(p):
        return json.load(open(p))
    for _ in range(4):
        try:
            with urllib.request.urlopen(url, timeout=50) as r:
                d = json.load(r)
            json.dump(d, open(p, "w"))
            time.sleep(0.4)
            return d
        except Exception:
            time.sleep(1.5)
    return {}


def organism_tag(taxon):
    t = taxon.lower()
    if "sapiens" in t: return "human"
    if "mus musculus" in t: return "mouse"
    if "rattus" in t: return "rat"
    return t or "other"


def platform_tag(gpl):
    g = ("GPL"+gpl) if gpl and not gpl.startswith("GPL") else (gpl or "")
    if g in ARR_450K: return "450K"
    if g in ARR_EPIC: return "EPIC"
    if g in ARR_27K:  return "27K"
    return g or "?"


def main():
    prisma = {"identification": {}, "screening": {}, "records": {}}
    seen = {}  # gse -> record
    for sub, term in SEARCHES.items():
        es = fetch(BASE + "esearch.fcgi?db=gds&retmax=250&retmode=json&term=" +
                   urllib.parse.quote(term), f"esearch2_{sub}.json")
        idlist = es.get("esearchresult", {}).get("idlist", [])
        total = int(es.get("esearchresult", {}).get("count", 0))
        prisma["identification"][sub] = {"query": term, "total_hits": total,
                                          "retrieved": len(idlist)}
        if not idlist:
            continue
        # esummary in chunks of 60 — accumulate uids in order (do NOT clobber "uids")
        recs = {}
        order = []
        for i in range(0, len(idlist), 60):
            chunk = idlist[i:i+60]
            su = fetch(BASE + "esummary.fcgi?db=gds&retmode=json&id=" + ",".join(chunk),
                       f"esummary2_{sub}_{i}.json")
            res = su.get("result", {})
            for uid in res.get("uids", []):
                if uid in res:
                    recs[uid] = res[uid]
                    order.append(uid)
        kept = []
        for uid in order:
            r = recs[uid]
            if r.get("entrytype") != "GSE":
                continue
            gdstype = r.get("gdstype", "")
            if "ethylation" not in gdstype:
                continue
            title = r.get("title", "")
            summary = r.get("summary", "")
            blob = (title + " " + summary).lower()
            if not any(k in blob for k in KW[sub]):
                continue  # off-topic keyword collision -> screened out
            gse = "GSE" + r.get("gse", "")
            org = organism_tag(r.get("taxon", ""))
            plat = platform_tag(r.get("gpl", ""))
            seqlike = ("seq" in gdstype.lower()) or plat.startswith("GPL")
            if org == "human" and plat in ("450K", "EPIC"):
                elig = "clock+ewas"
            elif not seqlike:
                elig = "ewas-array"
            else:
                elig = "ewas-seq"
            rec = {"gse": gse, "substance": sub, "organism": org, "platform": plat,
                   "n_samples": len(r.get("samples", [])), "gdstype": gdstype,
                   "eligibility": elig, "title": title[:120], "source": "screen"}
            kept.append(rec)
            # union de-dup; merge substance tags
            if gse in seen:
                if sub not in seen[gse]["substance"].split("|"):
                    seen[gse]["substance"] += "|" + sub
            else:
                seen[gse] = rec
        prisma["screening"][sub] = {"on_topic_methylation_GSE": len(kept)}

    # ---- curated seed accessions: force-include with verified GEO metadata ----
    acc2sub = {a: sub for sub, lst in SEEDS.items() for a in lst}
    all_acc = sorted(acc2sub)
    se = fetch(BASE + "esearch.fcgi?db=gds&retmax=200&retmode=json&term=" +
               urllib.parse.quote(" OR ".join(a + "[ACCN]" for a in all_acc)),
               "esearch_seeds.json")
    seed_uids = se.get("esearchresult", {}).get("idlist", [])
    seed_added = []
    for i in range(0, len(seed_uids), 60):
        su = fetch(BASE + "esummary.fcgi?db=gds&retmode=json&id=" + ",".join(seed_uids[i:i+60]),
                   f"esummary_seeds_{i}.json")
        res = su.get("result", {})
        for uid in res.get("uids", []):
            r = res.get(uid)
            if not isinstance(r, dict) or r.get("entrytype") != "GSE":
                continue
            gse = "GSE" + r.get("gse", "")
            if gse not in acc2sub:
                continue
            sub = acc2sub[gse]
            org = organism_tag(r.get("taxon", ""))
            plat = platform_tag(r.get("gpl", ""))
            gdstype = r.get("gdstype", "")
            seqlike = ("seq" in gdstype.lower()) or plat.startswith("GPL")
            if org == "human" and plat in ("450K", "EPIC"):
                elig = "clock+ewas"
            elif not seqlike:
                elig = "ewas-array"
            else:
                elig = "ewas-seq"
            if gse in seen:
                seen[gse]["source"] = seen[gse].get("source", "screen") + "+seed"
                if sub not in seen[gse]["substance"].split("|"):
                    seen[gse]["substance"] += "|" + sub
            else:
                seen[gse] = {"gse": gse, "substance": sub, "organism": org,
                             "platform": plat, "n_samples": len(r.get("samples", [])),
                             "gdstype": gdstype, "eligibility": elig,
                             "title": r.get("title", "")[:120], "source": "seed"}
                seed_added.append(gse)
    prisma["seeds_added_new"] = seed_added

    prisma["records"] = list(seen.values())
    # eligibility tallies
    tally = {}
    for r in seen.values():
        tally[r["eligibility"]] = tally.get(r["eligibility"], 0) + 1
    prisma["eligibility_tally"] = tally
    prisma["included_total"] = len(seen)

    json.dump(prisma, open(os.path.join(OUT, "inventory.json"), "w"), indent=2)

    # ---- print compact PRISMA summary ----
    print("=" * 78)
    print("PRISMA 2020 — IDENTIFICATION (live NCBI GEO db=gds counts)")
    print("=" * 78)
    tot_id = 0
    for sub, d in prisma["identification"].items():
        tot_id += d["total_hits"]
        print(f"  {sub:16s} hits={d['total_hits']:5d}  retrieved={d['retrieved']:4d}  | {d['query']}")
    print(f"  TOTAL identified (with overlap): {tot_id}")
    print("\nSCREENING — on-topic methylation GSE per substance:")
    for sub, d in prisma["screening"].items():
        print(f"  {sub:16s} {d['on_topic_methylation_GSE']}")
    print(f"\nINCLUDED (de-duplicated union): {prisma['included_total']}")
    print("ELIGIBILITY tally:", tally)
    print("\nINCLUDED records (sorted: human-array first, then by n):")
    rows = sorted(seen.values(),
                  key=lambda x: (0 if x["eligibility"] == "clock+ewas" else
                                 1 if x["eligibility"] == "ewas-array" else 2,
                                 -x["n_samples"]))
    for r in rows:
        print(f"  [{r['eligibility']:11s}] {r['gse']:11s} {r['substance']:24s} "
              f"{r['organism']:6s} {r['platform']:6s} n={r['n_samples']:<4d} {r['title'][:60]}")


if __name__ == "__main__":
    main()
