#!/usr/bin/env python3
"""
P2 - download the tractable substance series-matrix datasets selected by the PRISMA
inventory, record SHA-256 + byte size in data/manifest.json (reproducibility), then
peek the methamphetamine set's sample metadata to confirm group labels exist.

Only datasets whose single series_matrix.txt.gz is small enough for this environment's
decompress/memory wall are downloaded here. Large ones (e.g. GSE147040 1.5GB) are
declared as environment-blocked in REPORT.md, not silently dropped.
"""
import urllib.request, hashlib, json, os, gzip, io

DATA = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA, exist_ok=True)
MAN = os.path.join(DATA, "manifest.json")

TARGETS = {
    # gse : (substance, organism, note)
    "GSE154971": ("methamphetamine", "human", "450K, meth abusers vs control"),
    "GSE49393":  ("alcohol",         "human", "450K, prefrontal cortex (BA9/BA10) alcoholic vs control"),
    "GSE66348":  ("cocaine",         "rat",   "rat nucleus accumbens, cocaine craving (EWAS only)"),
}


def gse_matrix_url(g):
    pre = g[:len(g) - 3] + "nnn"
    return f"https://ftp.ncbi.nlm.nih.gov/geo/series/{pre}/{g}/matrix/{g}_series_matrix.txt.gz"


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for blk in iter(lambda: f.read(1 << 20), b""):
            h.update(blk)
    return h.hexdigest()


def load_manifest():
    if os.path.exists(MAN):
        try:
            return json.load(open(MAN))
        except Exception:
            return {}
    return {}


def main():
    man = load_manifest()
    for g, (sub, org, note) in TARGETS.items():
        out = os.path.join(DATA, f"{g}_series_matrix.txt.gz")
        if os.path.exists(out):
            print(f"  exists  {g}  ({os.path.getsize(out)/1e6:.1f} MB)")
        else:
            url = gse_matrix_url(g)
            print(f"  GET     {g}  {url}")
            urllib.request.urlretrieve(url, out)
            print(f"          downloaded {os.path.getsize(out)/1e6:.1f} MB")
        man[g] = {"file": f"{g}_series_matrix.txt.gz",
                  "bytes": os.path.getsize(out),
                  "sha256": sha256(out),
                  "substance": sub, "organism": org, "note": note,
                  "source": gse_matrix_url(g)}
    json.dump(man, open(MAN, "w"), indent=2)
    print("\nmanifest updated:", MAN)
    for g in TARGETS:
        print(f"  {g} sha256={man[g]['sha256'][:16]}...  {man[g]['bytes']/1e6:.1f}MB")

    # ---- peek methamphetamine sample metadata (cheap: header lines only) ----
    print("\n=== GSE154971 sample metadata peek (group labels) ===")
    p = os.path.join(DATA, "GSE154971_series_matrix.txt.gz")
    chars = []
    with gzip.open(p, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!series_matrix_table_begin"):
                break
            if line.startswith("!Sample_characteristics_ch1") or \
               line.startswith("!Sample_title") or \
               line.startswith("!Sample_source_name_ch1"):
                chars.append(line.rstrip("\n"))
    for c in chars[:12]:
        # show first ~6 fields only
        parts = c.split("\t")
        print("  " + parts[0] + " => " + " | ".join(p.strip('"') for p in parts[1:7]) + " ...")


if __name__ == "__main__":
    main()
