#!/usr/bin/env python3
"""Real within-person EWAS for SHORT-TERM PRESCRIPTION OPIOID exposure — GSE151485.

DESIGN (reported, not hidden):
  * Longitudinal cohort: opioid-naive patients prescribed a short course of an
    opioid (Hydrocodone/Oxycodone...) after a procedure, sampled at multiple
    visits. There is NO separate untreated control arm, so the only honest
    contrast is the WITHIN-PERSON longitudinal change:
        baseline (earliest visit) -> latest visit (max visit number).
    delta = beta_latest - beta_baseline.
  * Whole-blood EPIC betas. Person-level constants (age, sex, self-reported
    race, genetic background AND smoking status — smoking is NOT recorded here
    but is a stable trait over this short window) are removed BY the within-person
    pairing: each person is their own control. This is the strength of the design.
  * The AHRR cg05575921 (canonical smoking CpG) within-person delta is reported as
    a sanity check: it should be near-null because smoking status does not change
    within the short opioid window.

DATA: processed betas live INSIDE the series matrix
  (GSE151485_series_matrix.txt.gz) as a 736,432-probe x 100-sample table
  (probe id = clean cg..., no address suffix). We do NOT reprocess IDATs with
  methylprep (that is ~85 min on a runner and gets preempted) — we read the
  already-processed beta table directly.

Pairing is FAIL-CLOSED: a person is used only if >=2 visits parse to integers;
visit numbers come verbatim from '!Sample_characteristics_ch1: sample collection
(visit)'. Persons with a single visit are excluded (no guessing).

Test: paired one-sample t-test of delta across persons per CpG, BH-FDR.
Zero-hallucination: every number computed here; data SHA-256 recorded.
"""
import os, json, gzip, hashlib, urllib.request
from collections import defaultdict
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data"); OUT = os.path.join(HERE, "out")
os.makedirs(DATA, exist_ok=True); os.makedirs(OUT, exist_ok=True)

SERIES_URL = ("https://ftp.ncbi.nlm.nih.gov/geo/series/GSE151nnn/GSE151485/"
              "matrix/GSE151485_series_matrix.txt.gz")
SMOKING_CPGS = {
    "cg05575921": "AHRR", "cg03636183": "F2RL3", "cg21566642": "2q37.1/ALPPL2",
    "cg05951221": "2q37.1", "cg19859270": "GPR15", "cg09935388": "GFI1",
    "cg06126421": "6p21.33", "cg25648203": "AHRR",
}


def dl(url, path):
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        print("downloading", url, flush=True)
        urllib.request.urlretrieve(url, path)
    print(f"  {path}: {os.path.getsize(path):,} bytes", flush=True)
    return path


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(buf), b""):
            h.update(c)
    return h.hexdigest()


def bh(p):
    order = np.argsort(p); m = len(p)
    q = p[order] * m / np.arange(1, m + 1)
    q = np.minimum.accumulate(q[::-1])[::-1]
    fdr = np.empty(m); fdr[order] = np.clip(q, 0, 1)
    return fdr


def last_after_colon(s):
    s = (s or "").strip().strip('"')
    if not s:
        return ""
    # values arrive double-prefixed, e.g. 'person id: person id: 101' -> '101'
    return s.split(":")[-1].strip()


def parse_pheno(series_path):
    """Return (gsms, {key: [vals]}, skiprows_to_header)."""
    gsms = None; rows = {}; skip = 0
    with gzip.open(series_path, "rt", errors="replace") as f:
        for i, line in enumerate(f, 1):
            if line.startswith("!series_matrix_table_begin"):
                skip = i  # skip lines 1..table_begin; header is the next line
                break
            if line.startswith("!Sample_geo_accession"):
                gsms = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1"):
                vals = [x for x in line.rstrip("\n").split("\t")[1:]]
                first = vals[0].strip().strip('"')
                key = first.split(":")[0].strip()
                rows[key] = [last_after_colon(v) for v in vals]
    if gsms is None or "person id" not in rows or "sample collection (visit)" not in rows:
        raise SystemExit("series matrix missing required pheno fields (person id / visit)")
    return gsms, rows, skip


def main():
    sp = dl(SERIES_URL, os.path.join(DATA, "GSE151485_series_matrix.txt.gz"))
    sh = sha256(sp)
    print("series sha256:", sh, flush=True)

    gsms, rows, skip = parse_pheno(sp)
    n = len(gsms)
    pid = rows["person id"]; vis = rows["sample collection (visit)"]
    age = rows.get("age", [""] * n); sex = rows.get("self reported sex", [""] * n)

    # person -> {visit_int: gsm}  (fail-closed: visit must parse to int)
    g = defaultdict(dict)
    for i, gsm in enumerate(gsms):
        p = pid[i]
        try:
            v = int(vis[i])
        except (ValueError, TypeError):
            continue
        if not p:
            continue
        if v in g[p] and g[p][v] != gsm:
            raise SystemExit(f"person {p} visit {v} maps to >1 GSM -> ambiguous, fail-closed")
        g[p][v] = gsm

    pairs = []  # (person, vmin, gsm_baseline, vmax, gsm_latest)
    singletons = 0
    for p, vd in g.items():
        if len(vd) >= 2:
            vmn, vmx = min(vd), max(vd)
            pairs.append((p, vmn, vd[vmn], vmx, vd[vmx]))
        else:
            singletons += 1
    pairs.sort()
    print(f"persons total: {len(g)} | paired (>=2 visits): {len(pairs)} | "
          f"singletons excluded: {singletons}", flush=True)
    if len(pairs) < 5:
        raise SystemExit(f"too few pairs: {len(pairs)}")

    need = sorted(set([b for _, _, b, _, _ in pairs] + [l for _, _, _, _, l in pairs]))
    print(f"unique GSMs needed: {len(need)}", flush=True)
    needset = set(need) | {"ID_REF"}
    print(f"reading beta table (skiprows={skip}, {len(need)} sample cols)...", flush=True)
    df = pd.read_csv(sp, sep="\t", skiprows=skip, quotechar='"', index_col=0,
                     usecols=lambda c: c in needset, low_memory=False)
    df.index = df.index.astype(str)
    df = df[df.index.str.startswith("cg")]
    df = df.apply(pd.to_numeric, errors="coerce")
    print(f"probes: {df.shape[0]:,} | sample cols: {df.shape[1]}", flush=True)
    if df.shape[1] != len(need):
        raise SystemExit(f"expected {len(need)} sample cols, got {df.shape[1]}")

    # delta matrix: persons x probes  (latest - baseline)
    deltas = []
    for p, vmn, gb, vmx, gl in pairs:
        deltas.append(df[gl].to_numpy(dtype=float) - df[gb].to_numpy(dtype=float))
    D = np.vstack(deltas)
    probes = df.index.to_numpy()
    good = ~np.isnan(D).any(axis=0)
    D = D[:, good]; probes = probes[good]
    nper = D.shape[0]
    print(f"complete-case probes: {len(probes):,} across {nper} persons", flush=True)

    mean_d = D.mean(axis=0)
    sd_d = D.std(axis=0, ddof=1)
    with np.errstate(divide="ignore", invalid="ignore"):
        t = mean_d / (sd_d / np.sqrt(nper))
        p = 2 * stats.t.sf(np.abs(t), nper - 1)
    fin = np.isfinite(p) & np.isfinite(mean_d)
    probes, mean_d, t, p = probes[fin], mean_d[fin], t[fin], p[fin]
    fdr = bh(p)
    res = pd.DataFrame({"cg": probes, "mean_delta_latest_minus_baseline": mean_d,
                        "t": t, "p": p, "fdr": fdr}).sort_values("p").reset_index(drop=True)
    res["rank"] = np.arange(1, len(res) + 1)
    res.to_csv(os.path.join(OUT, "GSE151485_dmp.csv"), index=False)
    nsig = int((res["fdr"] < 0.05).sum())
    print(f"\nsignificant CpGs (FDR<0.05): {nsig:,} / {len(res):,}", flush=True)
    print(res.head(10).to_string(index=False), flush=True)

    rankmap = {cg: (i + 1, float(res.loc[i, "p"]),
                    float(res.loc[i, "mean_delta_latest_minus_baseline"]))
               for i, cg in enumerate(res["cg"])}
    smoke = {cg: {"gene": gn, "rank": rankmap[cg][0], "p": rankmap[cg][1],
                  "mean_delta": rankmap[cg][2]}
             for cg, gn in SMOKING_CPGS.items() if cg in rankmap}

    out = {
        "accession": "GSE151485",
        "substance": "short-term prescription opioid (Hydrocodone/Oxycodone, post-procedure)",
        "tissue": "whole blood", "platform": "EPIC", "series_sha256": sh,
        "design": "WITHIN-PERSON paired: baseline (earliest visit) vs latest visit "
                  "(max visit number) per person; delta=latest-baseline; paired "
                  "one-sample t-test across persons, BH-FDR. Each person is own control "
                  "-> age/sex/race/genotype/smoking (person-level constants) removed by design.",
        "n_persons_total": int(len(g)), "n_pairs": int(nper),
        "n_singletons_excluded": int(singletons),
        "n_probes_tested": int(len(res)), "n_sig_fdr05": nsig,
        "pairs": [{"person": p, "baseline_visit": vmn, "latest_visit": vmx}
                  for p, vmn, _, vmx, _ in pairs],
        "top10": res.head(10).to_dict("records"),
        "smoking_confound_sanity": smoke,
        "caveats": [
            "NO untreated control arm: every person received a prescription opioid -> "
            "only a within-person pre/post change is estimable, not user-vs-nonuser.",
            "Therapeutic short-term prescription opioid (post-procedure analgesia), NOT "
            "chronic opioid-use-disorder/heroin abuse -> limited external validity to "
            "forensic OUD cases.",
            "Smoking status is NOT recorded in this series; it is controlled BY the "
            "within-person design (stable trait over the short window). The AHRR "
            "cg05575921 delta is reported as a near-null sanity check.",
            "n_pairs is modest -> near-null results must be read as 'underpowered', "
            "not 'no effect'.",
        ],
    }
    with open(os.path.join(OUT, "GSE151485_validation.json"), "w") as f:
        json.dump(out, f, indent=2)
    print("\ndone -> out/GSE151485_validation.json", flush=True)


if __name__ == "__main__":
    main()
