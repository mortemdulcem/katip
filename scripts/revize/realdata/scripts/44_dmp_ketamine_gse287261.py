#!/usr/bin/env python3
"""Real within-subject EWAS for KETAMINE exposure — GSE287261.

IMPORTANT DESIGN CAVEATS (reported, not hidden):
  * EVERY subject received ketamine (sub-anaesthetic ORAL ketamine as a PTSD
    treatment). There is NO untreated control group, so this is NOT a
    user-vs-nonuser case-control. The only honest contrast is the WITHIN-SUBJECT
    longitudinal change: Baseline -> post-treatment.
  * This is pharmacological/therapeutic ketamine in PTSD patients, NOT
    recreational ketamine abuse; external validity to forensic ketamine abuse is
    therefore limited.
  * Cell type is MIXED (PBMC=60, Whole Blood=15, pellet=2) -> a major methylation
    confound. We restrict the paired test to PBMC only (the homogeneous majority).

Data: processed betas in GEO supplementary CSV (GSE287261_MethylationProfiles.csv.gz).
  Column naming (verified against the series matrix, 1:1):
    plain  '{subj}-{TP}'      -> PBMC
    suffix '{subj}-{TP}-WB'   -> Whole Blood
    suffix '{subj}-{TP}-P'    -> pellet
  TP in {BAS, FUP1 (1wk), FUP2 (4wk)}. Probe id = TargetID (cg...).

Design (PBMC only): per subject pair Baseline with the LATEST available post
timepoint (FUP2 preferred, else FUP1). delta = beta_post - beta_baseline.
Paired one-sample t-test of delta across subjects per CpG, BH-FDR. Age/sex are
subject-level constants and are removed by the within-subject pairing.

Smoking-confound sanity check on canonical CpGs (AHRR/F2RL3...).
Zero-hallucination: every number computed here; data SHA-256 recorded.
"""
import os, re, json, gzip, hashlib, urllib.request
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data"); OUT = os.path.join(HERE, "out")
os.makedirs(DATA, exist_ok=True); os.makedirs(OUT, exist_ok=True)

SERIES_URL = "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE287nnn/GSE287261/matrix/GSE287261_series_matrix.txt.gz"
CSV_URL = "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE287nnn/GSE287261/suppl/GSE287261_MethylationProfiles.csv.gz"
SMOKING_CPGS = {
    "cg05575921": "AHRR", "cg03636183": "F2RL3", "cg21566642": "2q37.1/ALPPL2",
    "cg05951221": "2q37.1", "cg19859270": "GPR15", "cg09935388": "GFI1",
    "cg06126421": "6p21.33", "cg25648203": "AHRR",
}


def dl(url, path):
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        print("downloading", url, flush=True)
        urllib.request.urlretrieve(url, path)
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


def tp_norm(s):
    s = (s or "").strip().lower()
    if "baseline" in s or s == "bas" or s.startswith("bas"):
        return "BAS"
    if "fup1" in s or "1 week" in s or s == "fu1":
        return "FUP1"
    if "fup2" in s or "4 week" in s or s == "fu2":
        return "FUP2"
    return s.upper()[:6]


def cell_norm(s):
    s = (s or "").lower()
    if "whole" in s:
        return "WB"
    if "pbmc" in s or "mononuclear" in s:
        return "PBMC"
    if "pellet" in s:
        return "pellet"
    return (s or "")[:6]


def parse_pheno(series_path):
    """Return per-GSM dicts keyed by (subj, tp, cell)."""
    geo = title = None; chars = []
    with gzip.open(series_path, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_geo_accession"):
                geo = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_title"):
                title = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1"):
                chars.append([x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]])
            elif "!series_matrix_table_begin" in line:
                break
    n = len(geo)

    def getchar(key):
        for vals in chars:
            kk = None; out = []
            for v in vals:
                if ":" in v:
                    k, val = v.split(":", 1); kk = k.strip().lower(); out.append(val.strip())
                else:
                    out.append(v.strip())
            if kk == key:
                return out
        return [None] * n

    cell = getchar("cell type"); tp = getchar("timepoint")
    age = getchar("age"); sex = getchar("sex"); resp = getchar("response")
    pmap = {}
    for i in range(n):
        m = re.match(r"P?(\d+)-", title[i])
        subj = m.group(1)
        key = (subj, tp_norm(tp[i]), cell_norm(cell[i]))
        a = age[i]
        pmap[key] = {
            "gsm": geo[i], "subj": subj, "tp": tp_norm(tp[i]), "cell": cell_norm(cell[i]),
            "age": float(a) if (a and a.replace(".", "", 1).isdigit()) else np.nan,
            "sex": sex[i], "response": resp[i],
        }
    assert len(pmap) == n, f"non-unique (subj,tp,cell) keys: {len(pmap)} vs {n}"
    return pmap


def csv_key_to_pheno_key(k):
    """'13-BAS'->('13','BAS','PBMC'); '11-BAS-WB'->('11','BAS','WB'); '30-FUP2-P'->('30','FUP2','pellet')."""
    if k.endswith("-WB"):
        cell = "WB"; base = k[:-3]
    elif k.endswith("-P"):
        cell = "pellet"; base = k[:-2]
    else:
        cell = "PBMC"; base = k
    subj, tp = base.split("-", 1)
    return (subj, tp_norm(tp), cell)


def main():
    sp = dl(SERIES_URL, os.path.join(DATA, "GSE287261_series_matrix.txt.gz"))
    cp = dl(CSV_URL, os.path.join(DATA, "GSE287261_MethylationProfiles.csv.gz"))
    print("series sha256:", sha256(sp), flush=True)
    pmap = parse_pheno(sp)

    # The canonical source is the .gz (its SHA-256 is the one recorded below).
    # In-process gzip decompression of this ~840 MB file is slow; if a
    # decompressed plain-CSV cache (bit-identical content) exists next to the
    # .gz, read that instead for speed. Produce it once with: zcat <file>.gz.
    plain = cp[:-3] if cp.endswith(".gz") else None
    read_path = (plain if plain and os.path.exists(plain) and os.path.getsize(plain) > 0
                 else cp)
    print(f"reading betas from: {os.path.basename(read_path)}", flush=True)

    def open_text(path):
        return (open(path, "rt", errors="replace") if not path.endswith(".gz")
                else gzip.open(path, "rt", errors="replace"))

    # Read CSV header to enumerate AVG_Beta columns -> deterministic GSM mapping.
    with open_text(read_path) as f:
        header = f.readline().rstrip("\n").split(",")
    beta_cols = [c for c in header if c.endswith(".AVG_Beta")]
    # Map each beta column (by its BASE key, e.g. '13-BAS') to exactly one GSM.
    # Fail-closed: never guess. col_to_gsm keys are BASE names (no .AVG_Beta suffix).
    col_to_gsm = {}
    for c in beta_cols:
        base = c[:-len(".AVG_Beta")]
        pk = csv_key_to_pheno_key(base)
        if pk not in pmap:
            raise SystemExit(f"CSV column {c} -> key {pk} NOT found in series pheno")
        col_to_gsm[base] = pmap[pk]
    if len(set(v["gsm"] for v in col_to_gsm.values())) != len(beta_cols):
        raise SystemExit("CSV columns do not map 1:1 to GSMs")
    print(f"CSV AVG_Beta cols: {len(beta_cols)} -> mapped 1:1 to {len(beta_cols)} GSMs", flush=True)

    # PBMC-only pairing: subject -> {tp: base_key}
    pbmc = {}
    for base, ph in col_to_gsm.items():
        if ph["cell"] == "PBMC":
            pbmc.setdefault(ph["subj"], {})[ph["tp"]] = base
    pairs = []  # (subj, baseline_base, post_base, post_tp)
    for subj, d in pbmc.items():
        if "BAS" not in d:
            continue
        post_tp = "FUP2" if "FUP2" in d else ("FUP1" if "FUP1" in d else None)
        if post_tp is None:
            continue
        pairs.append((subj, d["BAS"], d[post_tp], post_tp))
    pairs.sort()
    print(f"PBMC paired subjects (BAS + latest post): {len(pairs)}", flush=True)
    for subj, b, p, ptp in pairs:
        print(f"  P{subj}: BAS vs {ptp}", flush=True)
    if len(pairs) < 5:
        raise SystemExit(f"too few PBMC pairs: {len(pairs)}")

    need_cols = sorted(set([b for _, b, _, _ in pairs] + [p for _, _, p, _ in pairs]))
    usecols = ["TargetID"] + [c + ".AVG_Beta" for c in need_cols]
    print(f"reading CSV ({len(usecols)} cols)...", flush=True)
    df = pd.read_csv(read_path, usecols=lambda c: (c == "TargetID") or (c in set(usecols)),
                     index_col="TargetID", low_memory=False)
    df = df[df.index.astype(str).str.startswith("cg")]
    df.columns = [c[:-len(".AVG_Beta")] for c in df.columns]
    # Some beta cells are blank/' ' -> coerce to NaN (dropped later by complete-case).
    df = df.apply(pd.to_numeric, errors="coerce")
    print(f"probes: {df.shape[0]:,} | beta cols: {df.shape[1]}", flush=True)

    # delta matrix: subjects x probes
    deltas = []
    for subj, b, p, ptp in pairs:
        deltas.append(df[p].to_numpy(dtype=float) - df[b].to_numpy(dtype=float))
    D = np.vstack(deltas)  # subjects x probes
    probes = df.index.astype(str).to_numpy()
    good = ~np.isnan(D).any(axis=0)
    D = D[:, good]; probes = probes[good]
    nsub = D.shape[0]
    print(f"complete-case probes: {len(probes):,} across {nsub} pairs", flush=True)

    mean_d = D.mean(axis=0)
    sd_d = D.std(axis=0, ddof=1)
    with np.errstate(divide="ignore", invalid="ignore"):
        t = mean_d / (sd_d / np.sqrt(nsub))
        p = 2 * stats.t.sf(np.abs(t), nsub - 1)
    fin = np.isfinite(p) & np.isfinite(mean_d)
    probes, mean_d, t, p = probes[fin], mean_d[fin], t[fin], p[fin]
    fdr = bh(p)
    res = pd.DataFrame({"cg": probes, "mean_delta_post_minus_baseline": mean_d,
                        "t": t, "p": p, "fdr": fdr}).sort_values("p").reset_index(drop=True)
    res["rank"] = np.arange(1, len(res) + 1)
    res.to_csv(os.path.join(OUT, "GSE287261_dmp.csv"), index=False)
    nsig = int((res["fdr"] < 0.05).sum())
    print(f"\nsignificant CpGs (FDR<0.05): {nsig:,} / {len(res):,}", flush=True)
    print(res.head(10).to_string(index=False), flush=True)
    rankmap = {cg: (i + 1, float(res.loc[i, "p"])) for i, cg in enumerate(res["cg"])}
    smoke = {cg: {"gene": gn, "rank": rankmap[cg][0], "p": rankmap[cg][1]}
             for cg, gn in SMOKING_CPGS.items() if cg in rankmap}

    out = {
        "accession": "GSE287261", "substance": "ketamine (sub-anaesthetic ORAL, PTSD treatment)",
        "tissue": "PBMC (peripheral blood mononuclear cells)", "platform": "EPIC",
        "series_sha256": sha256(sp), "csv_sha256": sha256(cp),
        "design": "WITHIN-SUBJECT paired: PBMC Baseline vs latest post-treatment "
                  "(FUP2 preferred, else FUP1); paired one-sample t-test of delta, BH-FDR",
        "n_pairs": int(nsub), "n_probes_tested": int(len(res)), "n_sig_fdr05": nsig,
        "pairs": [{"subject": s, "post_timepoint": ptp} for s, _, _, ptp in pairs],
        "top10": res.head(10).to_dict("records"), "smoking_confound": smoke,
        "caveats": [
            "NO untreated control group: every subject received ketamine -> only a "
            "within-subject pre/post (longitudinal) change can be estimated, not a "
            "user-vs-nonuser case-control difference.",
            "Therapeutic sub-anaesthetic ORAL ketamine in PTSD patients, NOT recreational "
            "ketamine abuse -> limited external validity to forensic ketamine cases.",
            "Cell type was mixed (PBMC/WB/pellet); analysis restricted to PBMC to remove "
            "the cell-composition confound.",
            "n_pairs is small -> limited statistical power; null/near-null results must be "
            "read as 'underpowered', not 'no effect'.",
        ],
    }
    with open(os.path.join(OUT, "GSE287261_validation.json"), "w") as f:
        json.dump(out, f, indent=2)
    print("\ndone -> out/GSE287261_validation.json", flush=True)


if __name__ == "__main__":
    main()
