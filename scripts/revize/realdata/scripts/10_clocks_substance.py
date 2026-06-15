#!/usr/bin/env python3
"""
10_clocks_substance.py — REAL Horvath 2013 epigenetic clock for substance cohorts.

Generic version of 05_clocks.py. Computes DNAmAge (Horvath 2013 pan-tissue, 353 CpG,
published coefficients), validates it against chronological age (Pearson r + MAE), and
compares age acceleration (residual of DNAmAge ~ chronological age) between case and control
(Welch t + Mann-Whitney). Pan-tissue clock is valid for blood AND brain.

Two input modes:
  series    -> reads betas + age + group from a GEO series_matrix (GSE77056, GSE154971)
  betatable -> reads betas from data/{ACC}_beta.txt.gz, pheno from out/{ACC}_pheno.csv (GSE98203)

If chronological age is absent in GEO, the clock CANNOT be validated -> reported honestly,
no age-acceleration claim is made.

Usage:  python 10_clocks_substance.py GSE77056
Outputs: out/{ACC}_clock_per_sample.csv, out/{ACC}_clock_summary.json
"""
import csv, gzip, json, os, hashlib, time, sys
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
OUT = os.path.abspath(os.path.join(HERE, "..", "out"))
COEF = os.path.join(DATA, "horvath2013_coef.csv")
ADULT = 20.0

CONFIG = {
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
    "GSE49393": {"mode": "series", "tissue": "brain (prefrontal cortex, postmortem)",
                 "group_key": "aud status",
                 "case_kw": ["alcohol", "abuse", "dependen", "aud"],
                 "substance": "alcohol (AUD)"},
}


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(buf), b""):
            h.update(c)
    return h.hexdigest()


def anti_trafo(x, adult=ADULT):
    return np.where(x < 0, (1 + adult) * np.exp(x) - 1, (1 + adult) * x + adult)


def load_coef(path):
    intercept, coef, median = None, {}, {}
    with open(path, newline="") as f:
        rdr = csv.reader(f)
        header = None
        for row in rdr:
            if row and row[0] == "CpGmarker":
                header = row
                ic = header.index("CoefficientTraining")
                im = header.index("medianByCpG")
                continue
            if header is None or not row:
                continue
            name = row[0]
            if name == "(Intercept)":
                intercept = float(row[ic]); continue
            if name.startswith("cg"):
                try:
                    coef[name] = float(row[ic]); median[name] = float(row[im])
                except ValueError:
                    pass
    return intercept, coef, median


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


def main():
    acc = sys.argv[1]
    cfg = CONFIG[acc]
    intercept, coef, median = load_coef(COEF)
    cpgs = list(coef.keys())
    print(f"{acc} | Horvath CpGs: {len(cpgs)} intercept={intercept} | tissue={cfg['tissue']}")

    if cfg["mode"] == "series":
        series = os.path.join(DATA, f"{acc}_series_matrix.txt.gz")
        src_sha = sha256(series)
        gsms, ph = series_pheno(series)
        samples, betas = scan_series_betas(series, set(cpgs))
        assert samples == gsms, "sample order mismatch"
        age_col = next((c for c in ph.columns if c.startswith("age")), None)
        age = pd.to_numeric(ph[age_col], errors="coerce").values if age_col else np.full(len(gsms), np.nan)
        gkey = next((c for c in ph.columns if cfg["group_key"] in c), None)

        def lab(v):
            vl = str(v).lower()
            if "control" in vl:
                return 0.0
            if any(k in vl for k in cfg["case_kw"]):
                return 1.0
            return np.nan
        group = ph[gkey].map(lab).values
        sample_ids = samples
    else:  # betatable
        src = os.path.join(DATA, f"{acc}_beta.txt.gz")
        src_sha = sha256(src)
        names, betas = scan_betatable(src, set(cpgs))
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

    n = len(sample_ids)
    print(f"CpGs found on array: {len(betas)}/{len(cpgs)} (missing imputed w/ medianByCpG) | n={n}")

    score = np.full(n, intercept, dtype=float)
    used = 0
    for cg in cpgs:
        c = coef[cg]
        if cg in betas:
            b = betas[cg].astype(float).copy()
            m = np.isnan(b)
            if m.any():
                b[m] = median[cg]
            used += 1
        else:
            b = np.full(n, median[cg])
        score += c * b
    dnam = anti_trafo(score)

    df = pd.DataFrame({"sample": sample_ids, "chrono_age": age, "group": group, "dnam_age": dnam})
    has_age = np.isfinite(df["chrono_age"]).sum() >= 5 and df["chrono_age"].nunique() > 1

    summary = {
        "dataset": acc, "substance": cfg["substance"], "tissue": cfg["tissue"],
        "clock": "Horvath2013 (353 CpG pan-tissue)",
        "coef_source": "Horvath 2013 Genome Biology, Additional file 3",
        "coef_sha256": sha256(COEF), "source_sha256": src_sha,
        "n_horvath_cpgs": len(cpgs), "n_cpgs_on_array": used, "n_samples": int(n),
        "n_case": int(np.nansum(group == 1)), "n_control": int(np.nansum(group == 0)),
        "has_chronological_age": bool(has_age),
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    if has_age:
        d = df.dropna(subset=["chrono_age"]).reset_index(drop=True)
        r = stats.pearsonr(d["chrono_age"], d["dnam_age"])
        mae = float(np.mean(np.abs(d["dnam_age"] - d["chrono_age"])))
        A = np.column_stack([np.ones(len(d)), d["chrono_age"].values])
        blm, *_ = np.linalg.lstsq(A, d["dnam_age"].values, rcond=None)
        d["age_accel"] = d["dnam_age"].values - A @ blm
        df = d
        cur = d.loc[d["group"] == 1, "age_accel"].values
        nev = d.loc[d["group"] == 0, "age_accel"].values
        summary.update({
            "pearson_r_dnam_vs_chrono": round(float(r[0]), 4), "pearson_p": float(r[1]),
            "MAE_years": round(mae, 3),
            "age_accel_case_mean": round(float(cur.mean()), 3) if len(cur) else None,
            "age_accel_control_mean": round(float(nev.mean()), 3) if len(nev) else None,
        })
        if len(cur) >= 2 and len(nev) >= 2:
            welch = stats.ttest_ind(cur, nev, equal_var=False)
            mwu = stats.mannwhitneyu(cur, nev, alternative="two-sided")
            summary.update({"welch_t": round(float(welch.statistic), 3),
                            "welch_p": round(float(welch.pvalue), 4),
                            "mannwhitney_U": float(mwu.statistic),
                            "mannwhitney_p": round(float(mwu.pvalue), 4)})
        print(f"DNAmAge vs chrono: r={r[0]:.3f} p={r[1]:.2e} MAE={mae:.2f}y")
        if "welch_p" in summary:
            print(f"age-accel case vs control: Welch p={summary['welch_p']} | MWU p={summary['mannwhitney_p']}")
    else:
        summary["note"] = ("No chronological age in GEO deposit -> Horvath clock cannot be "
                           "validated and age-acceleration is NOT interpretable; DNAmAge listed "
                           "per sample for transparency only.")
        print("NO chronological age -> clock not validated (reported honestly)")

    df.to_csv(os.path.join(OUT, f"{acc}_clock_per_sample.csv"), index=False)
    with open(os.path.join(OUT, f"{acc}_clock_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
