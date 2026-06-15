#!/usr/bin/env python3
"""
13_multiclock.py — REAL extra epigenetic clocks (Hannum 2013, PhenoAge/Levine 2018) for the
substance cohorts, in addition to Horvath 2013 (script 10).

WHY: the fabricated article CLAIMED multiple clocks (Horvath/Hannum/PhenoAge/GrimAge/
DunedinPACE) but never computed any. We already did Horvath (10). This adds two MORE clocks
whose coefficients are PUBLICLY published and redistributed by the biolearn package
(github.com/bio-learn/biolearn, data/Hannum.csv & data/PhenoAge.csv). Both are simple LINEAR
predictors of chronological age (no Horvath-style transform):
    Hannum:    DNAmAge = SUM(coef_i * beta_i)                 (no intercept row -> 0)
    PhenoAge:  DNAmPhenoAge = 60.664 + SUM(coef_i * beta_i)   (intercept row in CSV)

For each clock we: validate DNAmAge vs chronological age (Pearson r + MAE), then compare
age-acceleration (residual of DNAmAge ~ chronological age) case vs control (Welch + MWU).
Offsets do NOT affect r or age-acceleration (residual-based), so an unmodeled Hannum constant
only shifts MAE -> reported honestly.

NOTE on what is NOT done here: DunedinPACE needs gold-standard quantile normalization and
GrimAge needs trained protein sub-models + age/sex; faithful reproduction requires the full
biolearn engine. They are declared, not fabricated.

Usage:  python 13_multiclock.py GSE49393
Outputs: out/{ACC}_multiclock_per_sample.csv, out/{ACC}_multiclock_summary.json
"""
import csv, gzip, json, os, hashlib, time, sys
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
OUT = os.path.abspath(os.path.join(HERE, "..", "out"))
CLOCKS = {
    "Hannum2013": {"file": os.path.join(DATA, "clocks", "Hannum.csv"),
                   "source": "Hannum 2013 Mol Cell (71 CpG), via biolearn data/Hannum.csv"},
    "PhenoAge_Levine2018": {"file": os.path.join(DATA, "clocks", "PhenoAge.csv"),
                            "source": "Levine 2018 Aging PhenoAge (513 CpG), via biolearn data/PhenoAge.csv"},
}

# Per-cohort group definition. Reuses the same series/betatable loaders as 10_clocks_substance.
CONFIG = {
    "GSE50660": {"mode": "series", "tissue": "peripheral blood (smoking REFERENCE)",
                 "group_key": "smoking", "group_codes": {"0": 0.0, "2": 1.0, "1": np.nan},
                 "substance": "smoking (current vs never)"},
    "GSE49393": {"mode": "series", "tissue": "brain (prefrontal cortex, postmortem)",
                 "group_key": "aud status",
                 "case_kw": ["alcohol", "abuse", "dependen", "aud"], "substance": "alcohol (AUD)"},
    "GSE77056": {"mode": "series", "tissue": "whole blood",
                 "group_key": "sample group",
                 "case_kw": ["drug user", "dependent", "user", "cocaine", "crack"],
                 "substance": "cocaine/crack"},
    "GSE154971": {"mode": "series", "tissue": "peripheral blood lymphocytes",
                  "group_key": "disease state",
                  "case_kw": ["methamphetamine", "abuser", "dependence", "dependent", "ma "],
                  "substance": "methamphetamine"},
    "GSE98203": {"mode": "betatable", "tissue": "brain (orbitofrontal cortex neurons)",
                 "pheno": "GSE98203_pheno.csv", "substance": "opioid/heroin"},
}


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(buf), b""):
            h.update(c)
    return h.hexdigest()


def load_biolearn_coef(path):
    """biolearn format: CpGmarker,CoefficientTraining ; optional row name 'intercept'."""
    intercept, coef = 0.0, {}
    df = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]
    name_c, coef_c = df.columns[0], df.columns[1]
    for _, row in df.iterrows():
        name = str(row[name_c]).strip()
        try:
            val = float(row[coef_c])
        except (ValueError, TypeError):
            continue
        if name.lower() == "intercept":
            intercept = val
        elif name.startswith("cg"):
            coef[name] = val
    return intercept, coef


def series_pheno(path):
    gsms, chars = None, []
    with gzip.open(path, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_geo_accession"):
                gsms = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1"):
                chars.append([x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]])
            elif line.startswith("!series_matrix_table_begin"):
                break
    ph = pd.DataFrame(index=gsms)
    for vals in chars:
        key, parsed = None, []
        for v in vals:
            if ":" in v:
                k, val = v.split(":", 1); key = k.strip(); parsed.append(val.strip())
            else:
                parsed.append(v.strip())
        if key is None:
            continue
        col, base = key.lower(), key.lower()
        while col in ph.columns:
            col = base + "_x"; base = col
        ph[col] = parsed
    return gsms, ph


def scan_series_betas(path, want):
    out, samples, in_table = {}, None, False
    with gzip.open(path, "rt", errors="replace") as f:
        for line in f:
            if not in_table:
                if line.startswith('"ID_REF"') or line.startswith("ID_REF"):
                    samples = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
                    in_table = True
                continue
            if line.startswith("!series_matrix_table_end"):
                break
            i = line.find("\t")
            if i < 0:
                continue
            cg = line[:i].strip().strip('"')
            if cg in want:
                vals = line.rstrip("\n").split("\t")[1:]
                out[cg] = np.array([np.nan if v in ("", "null", "NA") else float(v) for v in vals])
    return samples, out


def scan_betatable(path, want):
    with gzip.open(path, "rt", errors="replace") as f:
        header = f.readline().rstrip("\n").split("\t")
    beta_idx = [i for i, c in enumerate(header) if i > 0 and not c.endswith("_Detection_PVal")]
    beta_names = [header[i].strip() for i in beta_idx]
    out = {}
    with gzip.open(path, "rt", errors="replace") as f:
        next(f)
        for line in f:
            i = line.find("\t")
            if i < 0:
                continue
            cg = line[:i].strip().strip('"')
            if cg in want:
                parts = line.rstrip("\n").split("\t")
                out[cg] = np.array([np.nan if parts[j] in ("", "null", "NA") else float(parts[j])
                                    for j in beta_idx])
    return beta_names, out


def load_cohort(acc, cfg, want):
    if cfg["mode"] == "series":
        series = os.path.join(DATA, f"{acc}_series_matrix.txt.gz")
        src_sha = sha256(series)
        gsms, ph = series_pheno(series)
        samples, betas = scan_series_betas(series, want)
        assert samples == gsms, "sample order mismatch"
        age_col = next((c for c in ph.columns if c.startswith("age")), None)
        age = pd.to_numeric(ph[age_col], errors="coerce").values if age_col else np.full(len(gsms), np.nan)
        gkey = next((c for c in ph.columns if cfg["group_key"] in c), None)
        if "group_codes" in cfg:
            codes = cfg["group_codes"]
            group = ph[gkey].map(lambda v: codes.get(str(v).strip(), np.nan)).values
        else:
            def lab(v):
                vl = str(v).lower()
                if "control" in vl:
                    return 0.0
                if any(k in vl for k in cfg["case_kw"]):
                    return 1.0
                return np.nan
            group = ph[gkey].map(lab).values
        return list(samples), betas, age, group, src_sha
    else:  # betatable
        src = os.path.join(DATA, f"{acc}_beta.txt.gz")
        src_sha = sha256(src)
        names, betas = scan_betatable(src, want)
        pheno = pd.read_csv(os.path.join(OUT, cfg["pheno"]))
        pheno["of"] = pheno["of"].astype(str)
        pheno = pheno[pheno["cohort"].isin(["HEROIN", "CONTROL"])].copy()
        pheno["age_n"] = pd.to_numeric(pheno["age"], errors="coerce")
        pmap_age = dict(zip(pheno["of"], pheno["age_n"]))
        pmap_grp = {o: (1.0 if c == "HEROIN" else 0.0) for o, c in zip(pheno["of"], pheno["cohort"])}
        sample_ids = [n for n in names if n in pmap_grp]
        idx = [names.index(s) for s in sample_ids]
        betas = {cg: arr[idx] for cg, arr in betas.items()}
        age = np.array([pmap_age[s] for s in sample_ids])
        group = np.array([pmap_grp[s] for s in sample_ids])
        return sample_ids, betas, age, group, src_sha


def compute_clock(intercept, coef, betas, n):
    """Linear clock with per-CpG mean imputation. Returns (dnam, n_found, n_total)."""
    score = np.full(n, float(intercept))
    found = 0
    for cg, c in coef.items():
        if cg in betas:
            b = betas[cg].astype(float).copy()
            m = np.isnan(b)
            if m.any():
                fill = np.nanmean(b) if np.isfinite(np.nanmean(b)) else 0.5
                b[m] = fill
            found += 1
        else:
            b = np.full(n, 0.5)  # CpG absent from matrix -> neutral 0.5, counted as missing
        score += c * b
    return score, found, len(coef)


def evaluate(df):
    out = {}
    has_age = np.isfinite(df["chrono_age"]).sum() >= 5 and df["chrono_age"].nunique() > 1
    out["has_chronological_age"] = bool(has_age)
    if not has_age:
        out["note"] = ("No chronological age -> clock not validated; age-acceleration not "
                       "interpretable (per-sample values listed for transparency only).")
        return out, df
    d = df.dropna(subset=["chrono_age"]).reset_index(drop=True)
    r = stats.pearsonr(d["chrono_age"], d["dnam_age"])
    mae = float(np.mean(np.abs(d["dnam_age"] - d["chrono_age"])))
    A = np.column_stack([np.ones(len(d)), d["chrono_age"].values])
    blm, *_ = np.linalg.lstsq(A, d["dnam_age"].values, rcond=None)
    d["age_accel"] = d["dnam_age"].values - A @ blm
    cur = d.loc[d["group"] == 1, "age_accel"].values
    nev = d.loc[d["group"] == 0, "age_accel"].values
    out.update({"pearson_r_dnam_vs_chrono": round(float(r[0]), 4), "pearson_p": float(r[1]),
                "MAE_years": round(mae, 3),
                "age_accel_case_mean": round(float(cur.mean()), 3) if len(cur) else None,
                "age_accel_control_mean": round(float(nev.mean()), 3) if len(nev) else None})
    if len(cur) >= 2 and len(nev) >= 2:
        welch = stats.ttest_ind(cur, nev, equal_var=False)
        mwu = stats.mannwhitneyu(cur, nev, alternative="two-sided")
        out.update({"welch_t": round(float(welch.statistic), 3),
                    "welch_p": round(float(welch.pvalue), 4),
                    "mannwhitney_U": float(mwu.statistic),
                    "mannwhitney_p": round(float(mwu.pvalue), 4)})
    return out, d


def main():
    acc = sys.argv[1]
    cfg = CONFIG[acc]
    coefs = {name: load_biolearn_coef(c["file"]) for name, c in CLOCKS.items()}
    want = set()
    for _, coef in coefs.values():
        want |= set(coef.keys())
    print(f"{acc} | clocks: {list(CLOCKS)} | union CpGs needed: {len(want)} | tissue={cfg['tissue']}")

    sample_ids, betas, age, group, src_sha = load_cohort(acc, cfg, want)
    n = len(sample_ids)
    print(f"loaded n={n} | CpGs present in matrix: {len(betas)}/{len(want)} | "
          f"case={int(np.nansum(group == 1))} control={int(np.nansum(group == 0))}")

    per_sample = pd.DataFrame({"sample": sample_ids, "chrono_age": age, "group": group})
    summary = {
        "dataset": acc, "substance": cfg["substance"], "tissue": cfg["tissue"],
        "source_sha256": src_sha, "n_samples": int(n),
        "n_case": int(np.nansum(group == 1)), "n_control": int(np.nansum(group == 0)),
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "clocks": {},
    }
    for name, (intercept, coef) in coefs.items():
        dnam, found, total = compute_clock(intercept, coef, betas, n)
        df = pd.DataFrame({"sample": sample_ids, "chrono_age": age, "group": group, "dnam_age": dnam})
        res, d = evaluate(df)
        per_sample[f"dnam_{name}"] = dnam
        if "age_accel" in d.columns:
            aa = pd.Series(d["age_accel"].values, index=d["sample"]).to_dict()
            per_sample[f"accel_{name}"] = per_sample["sample"].map(aa)
        res.update({"intercept": intercept, "n_clock_cpgs": total,
                    "n_cpgs_found_on_array": found,
                    "coef_source": CLOCKS[name]["source"],
                    "coef_sha256": sha256(CLOCKS[name]["file"])})
        summary["clocks"][name] = res
        rline = (f"r={res['pearson_r_dnam_vs_chrono']} p={res['pearson_p']:.2e} "
                 f"MAE={res['MAE_years']}y") if res.get("has_chronological_age") else "no chrono age"
        accel = (f" | age-accel Welch p={res['welch_p']}" if "welch_p" in res else "")
        print(f"  {name}: found {found}/{total} CpG | {rline}{accel}")

    per_sample.to_csv(os.path.join(OUT, f"{acc}_multiclock_per_sample.csv"), index=False)
    with open(os.path.join(OUT, f"{acc}_multiclock_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
