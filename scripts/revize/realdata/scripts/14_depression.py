#!/usr/bin/env python3
"""
14_depression.py — REAL epigenetic-clock analysis for the DEPRESSION (mood) cohort GSE125105.

WHY: the fabricated article (makale.txt, Tablo 1, line 236) listed GSE125105 as
"Opioid | 450K | n=36 | Brain". The LIVE GEO record (our out/cited_raw/GSE125105_esummary.json)
shows the truth: "Epigenome analysis of depressed and control subjects" — major depressive
disorder (case n=489) vs control (n=210), whole blood, Illumina 450K, total n=699. So this is a
real, large MOOD/psychiatric cohort that the article mislabeled. We bring it in genuinely.

The supplementary beta matrix GSE125105_matrix_normalized.txt.gz has an R-style layout:
  header : ID_REF  sample1  sample1_DetectionPval  sample10  sample10_DetectionPval ...
  data   : <rowidx>  cg.....  <beta s1>  <detpval s1>  <beta s10>  <detpval s10> ...
i.e. data rows carry an extra leading row-index column, so header[i] aligns with data[i+1].
Beta sample names = header[1::2]; per data row cg = field[1], betas = field[2::2].
Sample IDs "sampleN" map to phenotype via the series-matrix !Sample_title ("genomic DNA from
sampleN") aligned with !Sample_characteristics_ch1 (diagnosis, age, Sex, blood cell fractions).

Clocks: Horvath2013 (353 CpG, anti-log transform, medianByCpG imputation) + Hannum2013 (71 CpG,
linear) + PhenoAge/Levine2018 (513 CpG, linear, intercept 60.664). Same engines as scripts 10
and 13. For each clock we validate DNAmAge vs chronological age (Pearson r + MAE), then test
epigenetic age-acceleration (residual of DNAmAge ~ chrono age) depressed vs control, BOTH raw
(Welch t + Mann-Whitney) AND adjusted for sex + blood cell composition (OLS group coefficient).
Cell adjustment matters because MDD blood EWAS is confounded by cell-type shifts.

Zero-Hallucination: every number from the downloaded matrix (SHA recorded) + published clock
coefficients (SHA recorded) + our seeded computation. Nothing invented.

Outputs: out/GSE125105_clock_per_sample.csv, out/GSE125105_clock_summary.json
"""
import re, csv, gzip, json, os, hashlib, time, subprocess
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
OUT = os.path.abspath(os.path.join(HERE, "..", "out"))
MATRIX = os.path.join(DATA, "GSE125105_matrix_normalized.txt.gz")
SERIES = os.path.join(DATA, "GSE125105_series_matrix.txt.gz")
HORVATH = os.path.join(DATA, "horvath2013_coef.csv")
HANNUM = os.path.join(DATA, "clocks", "Hannum.csv")
PHENOAGE = os.path.join(DATA, "clocks", "PhenoAge.csv")
CLOCKROWS = os.path.join(DATA, "GSE125105_clockrows.tsv")
WANTFILE = os.path.join(DATA, "GSE125105_clock_want.txt")
ADULT = 20.0
NA = ("", "null", "NA", "NaN", "nan")


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(buf), b""):
            h.update(c)
    return h.hexdigest()


def anti_trafo(x, adult=ADULT):
    return np.where(x < 0, (1 + adult) * np.exp(x) - 1, (1 + adult) * x + adult)


def load_horvath(path):
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


def load_biolearn(path):
    intercept, coef = 0.0, {}
    df = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]
    nc, cc = df.columns[0], df.columns[1]
    for _, row in df.iterrows():
        name = str(row[nc]).strip()
        try:
            val = float(row[cc])
        except (ValueError, TypeError):
            continue
        if name.lower() == "intercept":
            intercept = val
        elif name.startswith("cg"):
            coef[name] = val
    return intercept, coef


def parse_meta(path):
    geo = titles = None
    chars = []
    with gzip.open(path, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_geo_accession"):
                geo = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_title"):
                titles = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1"):
                chars.append([x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]])
            elif line.startswith("!series_matrix_table_begin"):
                break
    sn = []
    for t in titles:
        m = re.search(r"(sample\d+)", t)
        sn.append(m.group(1) if m else t)
    ph = pd.DataFrame(index=sn)
    ph["gsm"] = geo
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
    return ph


def extract_clockrows(want):
    if os.path.exists(CLOCKROWS) and os.path.getsize(CLOCKROWS) > 0:
        print(f"reuse existing {CLOCKROWS}")
        return
    with open(WANTFILE, "w") as f:
        f.write("\n".join(sorted(want)) + "\n")
    cmd = (f"zcat '{MATRIX}' | awk -F'\\t' -v wf='{WANTFILE}' "
           "'BEGIN{while((getline l < wf)>0) w[l]=1} FNR==1{print;next} ($2 in w){print}' > '"
           + CLOCKROWS + "'")
    t = time.time()
    subprocess.run(cmd, shell=True, check=True, executable="/bin/bash")
    print(f"awk extraction done in {time.time()-t:.0f}s -> {CLOCKROWS}")


def load_clock_betas():
    with open(CLOCKROWS) as f:
        header = f.readline().rstrip("\n").split("\t")
        beta_names = header[1::2]
        betas = {}
        for line in f:
            parts = line.rstrip("\n").split("\t")
            cg = parts[1]
            vals = parts[2::2]
            betas[cg] = np.array([np.nan if v in NA else float(v) for v in vals])
    return beta_names, betas


def horvath_score(intercept, coef, median, betas, n):
    score = np.full(n, float(intercept))
    found = 0
    for cg, c in coef.items():
        if cg in betas:
            b = betas[cg].astype(float).copy()
            m = np.isnan(b)
            if m.any():
                b[m] = median[cg]
            found += 1
        else:
            b = np.full(n, median[cg])
        score += c * b
    return anti_trafo(score), found, len(coef)


def linear_score(intercept, coef, betas, n):
    score = np.full(n, float(intercept))
    found = 0
    for cg, c in coef.items():
        if cg in betas:
            b = betas[cg].astype(float).copy()
            m = np.isnan(b)
            if m.any():
                fill = np.nanmean(b)
                b[m] = fill if np.isfinite(fill) else 0.5
            found += 1
        else:
            b = np.full(n, 0.5)
        score += c * b
    return score, found, len(coef)


def evaluate(age, group, sex, cells, dnam):
    out = {}
    ok = np.isfinite(age) & np.isfinite(dnam)
    if ok.sum() < 5 or len(np.unique(age[ok])) < 2:
        out["has_chronological_age"] = False
        return out, None
    out["has_chronological_age"] = True
    a, d = age[ok], dnam[ok]
    r = stats.pearsonr(a, d)
    mae = float(np.mean(np.abs(d - a)))
    A = np.column_stack([np.ones(len(a)), a])
    blm, *_ = np.linalg.lstsq(A, d, rcond=None)
    accel_ok = d - A @ blm
    accel = np.full(len(age), np.nan)
    accel[ok] = accel_ok
    g = group[ok]
    cur, ctl = accel_ok[g == 1], accel_ok[g == 0]
    out.update({
        "pearson_r_dnam_vs_chrono": round(float(r[0]), 4), "pearson_p": float(r[1]),
        "MAE_years": round(mae, 3),
        "age_accel_depressed_mean": round(float(cur.mean()), 3) if len(cur) else None,
        "age_accel_control_mean": round(float(ctl.mean()), 3) if len(ctl) else None,
    })
    if len(cur) >= 2 and len(ctl) >= 2:
        welch = stats.ttest_ind(cur, ctl, equal_var=False)
        mwu = stats.mannwhitneyu(cur, ctl, alternative="two-sided")
        out.update({"raw_welch_t": round(float(welch.statistic), 3),
                    "raw_welch_p": round(float(welch.pvalue), 5),
                    "raw_mannwhitney_p": round(float(mwu.pvalue), 5)})
    # adjusted model: accel ~ group + sex + cell fractions
    cols = [np.ones(len(age)), group, sex]
    names = ["intercept", "group(depressed)", "sex(M)"]
    for j in range(cells.shape[1]):
        cols.append(cells[:, j]); names.append(f"cell{j+1}")
    X = np.column_stack(cols)
    good = ok & np.isfinite(X).all(axis=1)
    if good.sum() > X.shape[1] + 5:
        Xg, yg = X[good], accel[good]
        XtX_inv = np.linalg.inv(Xg.T @ Xg)
        B = XtX_inv @ (Xg.T @ yg)
        resid = yg - Xg @ B
        dof = len(yg) - Xg.shape[1]
        sigma2 = (resid ** 2).sum() / dof
        se = np.sqrt(sigma2 * np.diag(XtX_inv))
        tval = B / se
        pval = 2 * stats.t.sf(np.abs(tval), dof)
        out.update({
            "adjusted_for": "sex + 6 blood cell fractions",
            "adjusted_n": int(good.sum()),
            "adjusted_group_beta_years": round(float(B[1]), 4),
            "adjusted_group_t": round(float(tval[1]), 3),
            "adjusted_group_p": round(float(pval[1]), 5),
        })
    return out, accel


PATTERNS = os.path.join(DATA, "GSE125105_clock_patterns.txt")


def write_patterns():
    h_int, h_coef, h_med = load_horvath(HORVATH)
    han_int, han_coef = load_biolearn(HANNUM)
    phe_int, phe_coef = load_biolearn(PHENOAGE)
    want = set(h_coef) | set(han_coef) | set(phe_coef)
    with open(PATTERNS, "w") as f:
        for cg in sorted(want):
            f.write("\t" + cg + "\t\n")
    print(f"wrote {len(want)} tab-anchored patterns -> {PATTERNS}")


def main():
    t0 = time.time()
    h_int, h_coef, h_med = load_horvath(HORVATH)
    han_int, han_coef = load_biolearn(HANNUM)
    phe_int, phe_coef = load_biolearn(PHENOAGE)
    want = set(h_coef) | set(han_coef) | set(phe_coef)
    print(f"clock CpGs needed (union): {len(want)} "
          f"(Horvath {len(h_coef)}, Hannum {len(han_coef)}, PhenoAge {len(phe_coef)})")

    extract_clockrows(want)
    beta_names, betas = load_clock_betas()
    n = len(beta_names)
    print(f"matrix beta samples: {n} | clock CpG rows found: {len(betas)}/{len(want)}")

    ph = parse_meta(SERIES)
    print("pheno cols:", list(ph.columns))
    missing = [s for s in beta_names if s not in ph.index]
    assert not missing, f"{len(missing)} matrix samples not in metadata, e.g. {missing[:5]}"
    P = ph.loc[beta_names]
    group = P["diagnosis"].str.lower().map({"case": 1.0, "control": 0.0}).values
    age = pd.to_numeric(P["age"], errors="coerce").values
    sex = P["sex"].astype(str).str.upper().map(
        lambda s: 1.0 if s.startswith("M") else (0.0 if s.startswith("F") else np.nan)).values
    cellcols = [c for c in P.columns if c.startswith("cellcount")]
    cells = P[cellcols].apply(pd.to_numeric, errors="coerce").values
    print(f"n={n} depressed={int(np.nansum(group==1))} control={int(np.nansum(group==0))} "
          f"| cell-fraction cols: {cellcols}")

    src_sha = sha256(MATRIX)
    per = pd.DataFrame({"sample": beta_names, "gsm": P["gsm"].values,
                        "chrono_age": age, "group_depressed": group, "sex_M": sex})
    summary = {
        "dataset": "GSE125105",
        "true_identity": "Epigenome analysis of depressed and control subjects (major depressive disorder)",
        "article_mislabel": "Tablo 1 line 236 listed it as Opioid/Brain/n=36 — WRONG (truth: MDD/whole blood/n=699)",
        "tissue": "whole blood", "platform": "GPL13534 (Illumina HumanMethylation450)",
        "n_samples": int(n), "n_depressed": int(np.nansum(group == 1)),
        "n_control": int(np.nansum(group == 0)),
        "matrix_sha256": src_sha,
        "horvath_coef_sha256": sha256(HORVATH),
        "hannum_coef_sha256": sha256(HANNUM),
        "phenoage_coef_sha256": sha256(PHENOAGE),
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "clocks": {},
    }

    specs = [("Horvath2013", lambda: horvath_score(h_int, h_coef, h_med, betas, n),
              "Horvath 2013 Genome Biology Additional file 3 (353 CpG pan-tissue)"),
             ("Hannum2013", lambda: linear_score(han_int, han_coef, betas, n),
              "Hannum 2013 Mol Cell (71 CpG), via biolearn"),
             ("PhenoAge_Levine2018", lambda: linear_score(phe_int, phe_coef, betas, n),
              "Levine 2018 Aging PhenoAge (513 CpG), via biolearn")]
    for name, fn, source in specs:
        dnam, found, total = fn()
        per[f"dnam_{name}"] = dnam
        res, accel = evaluate(age, group, sex, cells, dnam)
        if accel is not None:
            per[f"accel_{name}"] = accel
        res.update({"n_clock_cpgs": total, "n_cpgs_found_on_array": found, "coef_source": source})
        summary["clocks"][name] = res
        line = (f"r={res.get('pearson_r_dnam_vs_chrono')} MAE={res.get('MAE_years')}y "
                f"| raw p={res.get('raw_welch_p')} | adj p={res.get('adjusted_group_p')} "
                f"(beta={res.get('adjusted_group_beta_years')}y)")
        print(f"  {name}: found {found}/{total} CpG | {line}")

    per.to_csv(os.path.join(OUT, "GSE125105_clock_per_sample.csv"), index=False)
    with open(os.path.join(OUT, "GSE125105_clock_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\ndone in {time.time()-t0:.0f}s -> out/GSE125105_clock_summary.json")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "patterns":
        write_patterns()
    else:
        main()
