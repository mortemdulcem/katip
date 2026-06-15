#!/usr/bin/env python3
"""
P7 - genuine statistical power analysis for the substance EWAS cohorts.

Uses ONLY values we already computed: per-CpG t-statistics from each cohort's committed
DMP table. Cohen's d is recovered exactly from the two-sample t via d = t * sqrt(1/n1 + 1/n2)
(no invented effect sizes). Then statsmodels TTestIndPower gives:
  - achieved power at the genome-wide Bonferroni alpha (0.05 / n_tests) for the FDR<0.05 CpGs,
  - the minimum balanced N/group needed for 80% power at that alpha for the median real effect.

Seed-free (deterministic). Output: out/power/power_summary.json + printed table.
"""
import json, os, glob
import numpy as np
import pandas as pd
from statsmodels.stats.power import TTestIndPower

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "..", "out")
PWR = os.path.join(OUT, "power")
os.makedirs(PWR, exist_ok=True)

# cohort : (case_n, control_n, dmp_csv, label)
COHORTS = {
    "GSE50660":  (22, 179, "gse50660_dmp.csv",  "smoking, blood (ref)"),
    "GSE77056":  (23, 24,  "GSE77056_dmp.csv",  "cocaine, blood"),
    "GSE49393":  (23, 25,  "GSE49393_dmp.csv",  "alcohol, brain PFC"),
    "GSE98203":  (37, 28,  "GSE98203_dmp.csv",  "opioid, brain"),
    "GSE154971": (16, 8,   "GSE154971_dmp.csv", "methamphetamine, blood"),
}


def find_col(df, *cands):
    for c in cands:
        if c in df.columns:
            return c
    for c in df.columns:
        for k in cands:
            if c.lower().startswith(k):
                return c
    return None


def main():
    analyzer = TTestIndPower()
    summary = {}
    rows = []
    for acc, (n1, n2, fn, label) in COHORTS.items():
        path = os.path.join(OUT, fn)
        if not os.path.exists(path):
            print(f"skip {acc}: {fn} missing"); continue
        df = pd.read_csv(path)
        tcol = find_col(df, "t", "t_stat")
        fcol = find_col(df, "fdr", "fdr_bh", "qval")
        if tcol is None or fcol is None:
            print(f"skip {acc}: cannot find t/fdr cols in {list(df.columns)}"); continue
        n_tests = len(df)
        alpha_gw = 0.05 / n_tests                      # genome-wide Bonferroni
        # recover Cohen's d exactly from the two-sample t
        d = df[tcol].astype(float).abs() * np.sqrt(1.0 / n1 + 1.0 / n2)
        sig = df[fcol].astype(float) < 0.05
        n_sig = int(sig.sum())
        d_sig = d[sig].replace([np.inf, -np.inf], np.nan).dropna()
        med_d = float(np.median(d_sig)) if len(d_sig) else float("nan")
        # achieved power at observed N for the median significant effect, genome-wide alpha
        nobs1 = n1
        ratio = n2 / n1
        try:
            achieved = float(analyzer.power(effect_size=med_d, nobs1=nobs1,
                                            alpha=alpha_gw, ratio=ratio,
                                            alternative="two-sided"))
        except Exception:
            achieved = float("nan")
        # min balanced N/group for 80% power at genome-wide alpha for median effect
        try:
            min_n = float(analyzer.solve_power(effect_size=med_d, alpha=alpha_gw,
                                               power=0.80, ratio=1.0,
                                               alternative="two-sided"))
        except Exception:
            min_n = float("nan")
        summary[acc] = {"label": label, "n_case": n1, "n_control": n2,
                        "n_tests": n_tests, "alpha_genomewide": alpha_gw,
                        "n_sig_fdr05": n_sig, "median_cohens_d_sig": med_d,
                        "achieved_power_at_observed_N": achieved,
                        "min_N_per_group_power80": (None if np.isnan(min_n) else int(np.ceil(min_n)))}
        rows.append((acc, label, f"{n1}/{n2}", n_sig, f"{med_d:.2f}",
                     f"{achieved:.2f}", "-" if np.isnan(min_n) else str(int(np.ceil(min_n)))))

    out = os.path.join(PWR, "power_summary.json")
    json.dump(summary, open(out, "w"), indent=2)

    print(f"\n{'cohort':10s} {'substance/tissue':24s} {'n(c/ctrl)':10s} {'sig':>5s} "
          f"{'medD':>5s} {'pwr@N':>6s} {'minN/grp80':>10s}")
    print("-" * 80)
    for r in rows:
        print(f"{r[0]:10s} {r[1]:24s} {r[2]:10s} {r[3]:5d} {r[4]:>5s} {r[5]:>6s} {r[6]:>10s}")
    print("\nNote: alpha = genome-wide Bonferroni 0.05/n_tests (~1e-7). 'medD' = median Cohen's d")
    print("of the FDR<0.05 CpGs, recovered exactly from t. 'minN/grp80' = balanced N/group for 80% power.")
    print("saved:", out)


if __name__ == "__main__":
    main()
