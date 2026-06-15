#!/usr/bin/env python3
"""
predict.py - REAL inference CLI: DNA methylation in -> epigenetic age + smoking status out.

This is the deployable front-end of the genuine system. Given a DNA-methylation beta table
(one CpG per row: "cpg_id,beta"), it runs every applicable validated/trained engine and
prints what it can read from the molecular data, with honest CpG-coverage for each engine:

  * Epigenetic age (years)
      - Horvath 2013 clock  : 353-CpG pan-tissue clock, published coefficients (PRIMARY,
        validated on this cohort: r=0.77, MAE=3.5y). Missing CpGs imputed with Horvath's
        published medianByCpG (gold-standard practice).
      - Deep-net (MLP)      : a from-scratch multilayer perceptron trained on GSE50660
        (out/dl, OOF MAE=5.4y) - reported as a deep-learning benchmark.
  * Age acceleration (predicted - chronological) when --age is given.
  * Smoking status (current vs never)
      - XGBoost  : validated gradient-boosting engine (PRIMARY, OOF AUC=0.95).
      - Deep-net : MLP (OOF AUC=0.72) - deep-learning benchmark.

Substance/disease panel: per-substance binary models (cocaine, opioid, methamphetamine,
alcohol) are trained separately by 21_substance_models.py; this CLI loads and applies
whichever of them exist and whose CpGs the input supports. A single cross-substance
multi-disease classifier is intentionally NOT offered because the public substance cohorts
use different platforms/tissues/tiny n (declared, not faked).

Condition models (depression GSE125105, schizophrenia GSE152026) and exposure models
(arsenic GSE109914) are trained by 32/34/33_*.py and auto-loaded the same way from
condition_*.joblib / exposure_*.joblib; each carries its own honest caveat.

Usage:
  python3 predict.py --input sample_betas.csv [--age 54]
  python3 predict.py --build-demo            # extract 2 real GSE50660 samples -> out/dl/demo/
  python3 predict.py --input out/dl/demo/GSM1225377.csv --age 50
"""
import argparse
import csv
import glob
import gzip
import json
import os

import numpy as np
import joblib

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
OUT = os.path.join(HERE, "out")
MODELS = os.path.join(OUT, "dl", "models")
COEF = os.path.join(DATA, "horvath2013_coef.csv")
SERIES = os.path.join(DATA, "GSE50660_series_matrix.txt.gz")
DEMO_DIR = os.path.join(OUT, "dl", "demo")
ADULT = 20.0


def anti_trafo(x, adult=ADULT):
    return float((1 + adult) * np.exp(x) - 1) if x < 0 else float((1 + adult) * x + adult)


def load_horvath_coef(path):
    intercept, coef, median = None, {}, {}
    with open(path, newline="") as f:
        header = None
        for row in csv.reader(f):
            if row and row[0] == "CpGmarker":
                header = row
                ic, im = header.index("CoefficientTraining"), header.index("medianByCpG")
                continue
            if header is None or not row:
                continue
            if row[0] == "(Intercept)":
                intercept = float(row[ic])
            elif row[0].startswith("cg"):
                try:
                    coef[row[0]] = float(row[ic]); median[row[0]] = float(row[im])
                except ValueError:
                    pass
    return intercept, coef, median


def read_betas(path):
    """Read a 2-column (cpg_id, beta) CSV/TSV; tolerate a header row."""
    betas = {}
    with open(path) as f:
        sample = f.read(2048); f.seek(0)
        delim = "\t" if sample.count("\t") > sample.count(",") else ","
        for i, row in enumerate(csv.reader(f, delimiter=delim)):
            if len(row) < 2:
                continue
            cpg = row[0].strip().strip('"')
            try:
                betas[cpg] = float(row[1])
            except ValueError:
                if i == 0:
                    continue  # header
    return betas


def horvath_age(betas, intercept, coef, median):
    s = intercept
    found = 0
    for cpg, c in coef.items():
        if cpg in betas:
            s += c * betas[cpg]; found += 1
        else:
            s += c * median[cpg]
    return anti_trafo(s), found, len(coef)


def apply_saved(model_path, betas):
    """Align input betas to a saved model's CpG list, impute missing with train means,
    optionally scale, return (prob_or_value, coverage_fraction)."""
    m = joblib.load(model_path)
    cpgs, means = m["cpgs"], np.asarray(m["train_means"], dtype=float)
    x = np.array([betas.get(c, means[i]) for i, c in enumerate(cpgs)], dtype=float)
    cover = float(np.mean([c in betas for c in cpgs]))
    X = x.reshape(1, -1)
    if m.get("scaler") is not None:
        X = m["scaler"].transform(X)
    mdl = m["model"]
    if hasattr(mdl, "predict_proba"):
        return float(mdl.predict_proba(X)[0, 1]), cover, m
    return float(mdl.predict(X)[0]), cover, m


def build_demo(gsms=("GSM1225377", "GSM1225378")):
    """Extract real per-sample betas from the GSE50660 series matrix for the union of CpGs
    every engine needs (Horvath 353 + age-MLP + smoking models), so the demo exercises all
    engines on genuine data with high coverage."""
    os.makedirs(DEMO_DIR, exist_ok=True)
    _, coef, _ = load_horvath_coef(COEF)
    needed = set(coef)
    for mp in glob.glob(os.path.join(MODELS, "*.joblib")):
        needed.update(joblib.load(mp)["cpgs"])
    print(f"need {len(needed)} CpGs for {gsms}", flush=True)
    cols, out = None, {g: {} for g in gsms}
    with gzip.open(SERIES, "rt", errors="replace") as f:
        in_tbl = False
        for line in f:
            if line.startswith("!series_matrix_table_begin"):
                in_tbl = True; continue
            if line.startswith("!series_matrix_table_end"):
                break
            if in_tbl:
                parts = line.rstrip("\n").split("\t")
                if cols is None:
                    hdr = [p.strip().strip('"') for p in parts]
                    cols = {g: hdr.index(g) for g in gsms if g in hdr}
                    if not cols:
                        raise SystemExit(f"GSMs not found in series header: {gsms}")
                    continue
                probe = parts[0].strip().strip('"')
                if probe in needed:
                    for g, ci in cols.items():
                        try:
                            out[g][probe] = float(parts[ci])
                        except (ValueError, IndexError):
                            pass
    for g, d in out.items():
        p = os.path.join(DEMO_DIR, f"{g}.csv")
        with open(p, "w", newline="") as fo:
            w = csv.writer(fo); w.writerow(["cpg_id", "beta"])
            for cpg, b in d.items():
                w.writerow([cpg, b])
        print(f"  wrote {p} ({len(d)} CpGs)", flush=True)


def predict(input_path, chrono_age=None):
    betas = read_betas(input_path)
    intercept, coef, median = load_horvath_coef(COEF)
    hv_age, hv_found, hv_tot = horvath_age(betas, intercept, coef, median)

    report = {
        "input": os.path.basename(input_path),
        "n_cpgs_in_input": len(betas),
        "epigenetic_age_years": {
            "horvath2013_primary": round(hv_age, 2),
            "horvath_cpg_coverage": f"{hv_found}/{hv_tot} ({hv_found/hv_tot:.0%})",
        },
        "smoking_status": {},
        "substance_panel": {},
        "condition_panel": {},
        "exposure_panel": {},
        "declarations": [],
    }

    age_mlp_path = os.path.join(MODELS, "age_mlp.joblib")
    if os.path.exists(age_mlp_path):
        val, cover, _ = apply_saved(age_mlp_path, betas)
        report["epigenetic_age_years"]["deepnet_mlp_benchmark"] = round(val, 2)
        report["epigenetic_age_years"]["deepnet_cpg_coverage"] = f"{cover:.0%}"

    if chrono_age is not None:
        aa = report["epigenetic_age_years"]
        report["age_acceleration_years"] = {
            "horvath": round(aa["horvath2013_primary"] - chrono_age, 2),
            "deepnet_mlp": round(aa.get("deepnet_mlp_benchmark", float("nan")) - chrono_age, 2),
            "chronological_age": chrono_age,
        }

    for tag, fname in [("xgboost_primary", "smoking_xgb.joblib"),
                       ("deepnet_mlp_benchmark", "smoking_mlp.joblib")]:
        p = os.path.join(MODELS, fname)
        if os.path.exists(p):
            prob, cover, _ = apply_saved(p, betas)
            report["smoking_status"][tag] = {
                "prob_current_smoker": round(prob, 3),
                "call": "current" if prob >= 0.5 else "never",
                "cpg_coverage": f"{cover:.0%}",
            }

    sub = sorted(glob.glob(os.path.join(MODELS, "substance_*.joblib")))
    if sub:
        any_brain = False
        for p in sub:
            prob, cover, m = apply_saved(p, betas)
            entry = {
                "prob_case": round(prob, 3), "cpg_coverage": f"{cover:.0%}",
                "auc_oof": m.get("oof_metrics", {}).get("roc_auc"),
                "train_tissue": m.get("tissue", "blood")}
            if m.get("tissue") == "brain":
                any_brain = True
            report["substance_panel"][m["task"]] = entry
        report["declarations"].append(
            "Substance models are WITHIN-cohort validated (OOF AUC shown). Applying them across "
            "cohorts (e.g. to this GSE50660 blood smoking sample) is confounded by batch/platform/"
            "population effects, so cross-cohort scores are indicative only, NOT diagnostic.")
        if any_brain:
            report["declarations"].append(
                "The opioid/heroin model was trained on BRAIN (postmortem cortex) tissue; applying it "
                "to a BLOOD sample is cross-TISSUE on top of cross-cohort -> the least reliable score "
                "in the panel, exploratory only.")
    else:
        report["substance_panel"]["status"] = ("no substance models trained yet "
            "(run 21_substance_models.py); cross-substance multi-class intentionally omitted")

    cond = sorted(glob.glob(os.path.join(MODELS, "condition_*.joblib")))
    if cond:
        for p in cond:
            prob, cover, m = apply_saved(p, betas)
            report["condition_panel"][m["task"]] = {
                "prob_case": round(prob, 3), "cpg_coverage": f"{cover:.0%}",
                "auc_oof": m.get("oof_metrics", {}).get("roc_auc"),
                "train_tissue": m.get("tissue", "blood"),
                "caveat": m.get("oof_metrics", {}).get("caveat")}
        report["declarations"].append(
            "Condition models (e.g. depression, schizophrenia) are within-cohort validated; blood "
            "methylation signals for psychiatric conditions are weak and confounded by medication, "
            "smoking and blood-cell composition, and candidate pools are partial-genome (env limit). "
            "Treat as exploratory, NOT diagnostic.")

    exp = sorted(glob.glob(os.path.join(MODELS, "exposure_*.joblib")))
    if exp:
        for p in exp:
            prob, cover, m = apply_saved(p, betas)
            report["exposure_panel"][m["task"]] = {
                "prob_exposed": round(prob, 3), "cpg_coverage": f"{cover:.0%}",
                "auc_oof": m.get("oof_metrics", {}).get("roc_auc"),
                "train_tissue": m.get("tissue", "blood"),
                "caveat": m.get("oof_metrics", {}).get("caveat")}
        report["declarations"].append(
            "Exposure models (e.g. arsenic) are within-cohort validated; cross-cohort/population "
            "application is confounded by ancestry, batch and blood-cell composition -> indicative "
            "only, NOT diagnostic.")

    if hv_found / hv_tot < 0.8:
        report["declarations"].append(
            f"Horvath coverage low ({hv_found}/{hv_tot}); missing CpGs imputed with published "
            "medians, so this age is approximate. Supply a full 450K/EPIC beta file for best result.")
    report["declarations"].append(
        "Deep-net (MLP) numbers are a deep-learning benchmark; on this small cohort the validated "
        "Horvath clock (age) and XGBoost (smoking) are the primary engines (see out/dl/gse50660_dl.json).")
    return report


def main():
    ap = argparse.ArgumentParser(description="Methylation -> epigenetic age + smoking inference")
    ap.add_argument("--input", help="2-column (cpg_id,beta) CSV/TSV of one sample")
    ap.add_argument("--age", type=float, default=None, help="chronological age for acceleration")
    ap.add_argument("--build-demo", action="store_true", help="extract 2 real samples to out/dl/demo/")
    args = ap.parse_args()

    if args.build_demo:
        build_demo()
        return
    if not args.input:
        ap.error("provide --input FILE (or --build-demo first)")
    rep = predict(args.input, args.age)
    print(json.dumps(rep, indent=2))


if __name__ == "__main__":
    main()
