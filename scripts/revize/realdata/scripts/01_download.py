#!/usr/bin/env python3
"""
01_download.py — Reproducible GEO download for the REAL (non-fabricated) re-analysis.

Downloads a GEO Series matrix, records its SHA-256 + byte size into data/manifest.json,
and caches the file under data/. Idempotent: skips download if the SHA already matches.

Usage:
    python3 01_download.py GSE50660 [GSE100264 ...]

Honesty note: this replaces the fabricated dataset table of the article. Every accession
here is a real, publicly accessible human DNA-methylation series; sample counts and topics
are taken from the live GEO record, NOT invented.
"""
import sys, os, json, hashlib, urllib.request, time

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
os.makedirs(DATA, exist_ok=True)
MANIFEST = os.path.join(DATA, "manifest.json")


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(buf), b""):
            h.update(chunk)
    return h.hexdigest()


def series_matrix_url(acc):
    # GEO ftp layout: .../series/GSE50nnn/GSE50660/matrix/GSE50660_series_matrix.txt.gz
    pre = acc[:-3] + "nnn" if len(acc) > 6 else acc[:3] + "nnn"
    base = f"https://ftp.ncbi.nlm.nih.gov/geo/series/{pre}/{acc}/matrix/"
    return base


def list_matrix_files(base):
    with urllib.request.urlopen(base, timeout=60) as r:
        html = r.read().decode("utf-8", "replace")
    import re
    return sorted(set(re.findall(r'([A-Za-z0-9_.\-]+_series_matrix\.txt\.gz)', html)))


def load_manifest():
    if os.path.exists(MANIFEST):
        with open(MANIFEST) as f:
            return json.load(f)
    return {}


def save_manifest(m):
    with open(MANIFEST, "w") as f:
        json.dump(m, f, indent=2, sort_keys=True)


def download(url, dest):
    tmp = dest + ".part"
    req = urllib.request.Request(url, headers={"User-Agent": "litreview-realdata/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r, open(tmp, "wb") as out:
        total = int(r.headers.get("Content-Length", 0))
        got = 0
        t0 = time.time()
        while True:
            chunk = r.read(1 << 20)
            if not chunk:
                break
            out.write(chunk)
            got += len(chunk)
            if total and got % (50 << 20) < (1 << 20):
                print(f"    {got/1e6:.0f}/{total/1e6:.0f} MB ({got/total*100:.0f}%)", flush=True)
    os.replace(tmp, dest)
    print(f"    done {got/1e6:.0f} MB in {time.time()-t0:.0f}s", flush=True)


def main(accs):
    man = load_manifest()
    for acc in accs:
        print(f"[{acc}]")
        base = series_matrix_url(acc)
        files = list_matrix_files(base)
        print("  matrix files:", files)
        man.setdefault(acc, {})["files"] = {}
        for fn in files:
            dest = os.path.join(DATA, fn)
            url = base + fn
            if os.path.exists(dest):
                print(f"  cached {fn}")
            else:
                print(f"  downloading {fn}")
                download(url, dest)
            digest = sha256(dest)
            man[acc]["files"][fn] = {
                "url": url,
                "bytes": os.path.getsize(dest),
                "sha256": digest,
            }
            print(f"  sha256 {fn} = {digest}")
        man[acc]["downloaded_utc"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        save_manifest(man)
    print("manifest ->", MANIFEST)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1:])
