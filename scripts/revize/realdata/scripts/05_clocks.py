#!/usr/bin/env python3
"""
05_clocks.py — REAL epigenetic clock (Horvath 2013) on GSE50660.

Coefficients: original Horvath 2013 Genome Biology supplement
  data/horvath2013_coef.csv  (CpGmarker, CoefficientTraining, ..., medianByCpG)
Missing CpGs imputed with the published medianByCpG (gold-standard Horvath practice).
DNAmAge = anti.trafo(intercept + sum_i coef_i * beta_i), adult.age = 20.

Validation: predicted DNAmAge must track chronological age (correlation + MAE).
Then age acceleration (residual of DNAmAge ~ chronological age) is compared between
current and never smokers (Welch t + Mann-Whitney). Every number computed here.

Outputs:
  out/gse50660_clock_per_sample.csv
  out/gse50660_clock_summary.json
"""
import csv, gzip, json, os, hashlib, time
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
OUT = os.path.abspath(os.path.join(HERE, "..", "out"))
SERIES = os.path.join(DATA, "GSE50660_series_matrix.txt.gz")
COEF = os.path.join(DATA, "horvath2013_coef.csv")
ADULT = 20.0


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(buf), b""):
            h.update(c)
    return h.hexdigest()


def anti_trafo(x, adult=ADULT):
    return np.where(x < 0, (1 + adult) * np.exp(x) - 1, (1 + adult) * x + adult)


def load_coef(path):
    intercept = None
    coef = {}
    median = {}
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
                intercept = float(row[ic])
                continue
            if name.startswith("cg"):
                try:
                    coef[name] = float(row[ic])
                    median[name] = float(row[im])
                except ValueError:
                    pass
    return intercept, coef, median


def parse_header(path):
    gsms = age = smoke = None
    with gzip.open(path, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_geo_accession"):
                gsms = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1"):
                vals = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
                key = next((v.split(":", 1)[0].strip().lower() for v in vals if ":" in v), "")
                parsed = [v.split(":", 1)[1].strip() if ":" in v else v for v in vals]
                if key.startswith("age"):
                    age = pd.to_numeric(pd.Series(parsed), errors="coerce").values
                elif key.startswith("smoking"):
                    smoke = pd.to_numeric(pd.Series(parsed), errors="coerce").values
            elif line.startswith("!series_matrix_table_begin"):
                break
    return gsms, age, smoke


def scan_betas(path, want):
    """Return dict cg -> np.array(beta over samples) for cg in want, plus sample order."""
    out = {}
    samples = None
    in_table = False
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
                arr = np.array([np.nan if v in ("", "null", "NA") else float(v) for v in vals])
                out[cg] = arr
    return samples, out


def main():
    t0 = time.time()
    intercept, coef, median = load_coef(COEF)
    cpgs = list(coef.keys())
    print(f"Horvath CpGs: {len(cpgs)}  intercept={intercept}")

    gsms, age, smoke = parse_header(SERIES)
    samples, betas = scan_betas(SERIES, set(cpgs))
    assert samples == gsms, "sample order mismatch header vs table"
    print(f"CpGs found on array: {len(betas)}/{len(cpgs)}  (missing imputed with medianByCpG)")

    n = len(samples)
    score = np.full(n, intercept, dtype=float)
    used = 0
    for cg in cpgs:
        c = coef[cg]
        if cg in betas:
            b = betas[cg].copy()
            nanmask = np.isnan(b)
            if nanmask.any():
                b[nanmask] = median[cg]
            used += 1
        else:
            b = np.full(n, median[cg])
        score += c * b
    dnam = anti_trafo(score)

    df = pd.DataFrame({"gsm": samples, "chrono_age": age, "smoking": smoke, "dnam_age": dnam})
    df = df.dropna(subset=["chrono_age"]).reset_index(drop=True)
    r = stats.pearsonr(df["chrono_age"], df["dnam_age"])
    mae = float(np.mean(np.abs(df["dnam_age"] - df["chrono_age"])))
    med_err = float(np.median(df["dnam_age"] - df["chrono_age"]))

    # age acceleration = residual of dnam ~ chrono
    A = np.column_stack([np.ones(len(df)), df["chrono_age"].values])
    beta_lm, *_ = np.linalg.lstsq(A, df["dnam_age"].values, rcond=None)
    df["age_accel"] = df["dnam_age"].values - A @ beta_lm
    df.to_csv(os.path.join(OUT, "gse50660_clock_per_sample.csv"), index=False)

    cur = df.loc[df["smoking"] == 2, "age_accel"].values
    nev = df.loc[df["smoking"] == 0, "age_accel"].values
    welch = stats.ttest_ind(cur, nev, equal_var=False)
    mwu = stats.mannwhitneyu(cur, nev, alternative="two-sided")

    summary = {
        "clock": "Horvath2013 (353 CpG pan-tissue)",
        "coef_source": "Horvath 2013 Genome Biology, Additional file 3",
        "coef_sha256": sha256(COEF),
        "series_sha256": sha256(SERIES),
        "n_horvath_cpgs": len(cpgs),
        "n_cpgs_on_array": used,
        "n_samples": int(len(df)),
        "pearson_r_dnam_vs_chrono": round(float(r[0]), 4),
        "pearson_p": float(r[1]),
        "MAE_years": round(mae, 3),
        "median_error_years": round(med_err, 3),
        "age_accel_current_mean": round(float(cur.mean()), 3) if len(cur) else None,
        "age_accel_never_mean": round(float(nev.mean()), 3) if len(nev) else None,
        "n_current": int(len(cur)), "n_never": int(len(nev)),
        "welch_t": round(float(welch.statistic), 3), "welch_p": round(float(welch.pvalue), 4),
        "mannwhitney_U": float(mwu.statistic), "mannwhitney_p": round(float(mwu.pvalue), 4),
        "runtime_sec": round(time.time() - t0, 1),
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with open(os.path.join(OUT, "gse50660_clock_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
