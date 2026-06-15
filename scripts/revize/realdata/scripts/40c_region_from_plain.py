#!/usr/bin/env python3
"""Compute GSE252501 alcohol EWAS for ONE region from a PRE-DECOMPRESSED plain-text matrix
(/tmp/<region>.txt). Identical model to run_region() in 40_dmp_alcohol_brain_gse252501.py
  beta ~ AUD(case) + agedeath(z) + sex + smoker(current smoker at death), full-rank, BH-FDR.
Reading the plain file (vs streaming the 780 MB gz with a usecols lambda) keeps it under
Replit's 120 s wall. parse_pheno()/bh()/sha256() are reused from the original module (no fork).
Usage: python 40c_region_from_plain.py NAc|DLPFC /tmp/NAc.txt
Writes out/GSE252501_<region>_dmp.csv + out/GSE252501_<region>_fragment.json
"""
import os, sys, json, importlib.util, time
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
RD = os.path.dirname(HERE)
DATA = os.path.join(RD, "data"); OUT = os.path.join(RD, "out")

spec = importlib.util.spec_from_file_location(
    "dmp_alcohol", os.path.join(HERE, "40_dmp_alcohol_brain_gse252501.py"))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)

region = sys.argv[1]
plain = sys.argv[2]
series = os.path.join(DATA, "GSE252501_series_matrix.txt.gz")
matname = {"NAc": "GSE252501_proccessed_matrix_NAc.txt.gz",
           "DLPFC": "GSE252501_proccessed_matrix_DLPFC.txt.gz"}[region]
matpath = os.path.join(DATA, matname)

ph = mod.parse_pheno(series)

t0 = time.time()
with open(plain) as f:
    hdr = f.readline().rstrip("\n").split("\t")
beta_idx = [i for i, c in enumerate(hdr) if i > 0 and not c.endswith(".Detection.PVal")]
use = [0] + beta_idx
df = pd.read_csv(plain, sep="\t", usecols=use, index_col=0, low_memory=False)
df = df[df.index.astype(str).str.startswith("cg")]
df.columns = [str(c).strip().strip('"') for c in df.columns]
print(f"read {df.shape} in {time.time()-t0:.1f}s", flush=True)

cols = [c for c in df.columns if c in ph and ph[c]["region"] == region]
print(f"matrix beta cols: {df.shape[1]} | mapped to {region}: {len(cols)}", flush=True)
assert len(cols) >= 10, f"too few mapped samples for {region}: {len(cols)}"
sub = df[cols]
aud = np.array([ph[c]["aud"] for c in cols]); sex = np.array([ph[c]["sex"] for c in cols])
age = np.array([ph[c]["age"] for c in cols]); smk = np.array([ph[c]["smoker"] for c in cols])
keep = np.isfinite(aud) & np.isfinite(sex) & np.isfinite(age) & np.isfinite(smk)
sub = sub.loc[:, keep]; aud, sex, age, smk = aud[keep], sex[keep], age[keep], smk[keep]
Y = sub.to_numpy(dtype=float).T  # samples x probes
probes = sub.index.astype(str).to_numpy()
good = ~np.isnan(Y).any(axis=0)
Y = Y[:, good]; probes = probes[good]
print(f"usable samples: {len(aud)} (AUD {int((aud==1).sum())} / Ctrl {int((aud==0).sum())}); "
      f"complete probes: {len(probes)}", flush=True)

az = (age - age.mean()) / age.std()
candidates = [("intercept", np.ones(len(aud))), ("aud", aud),
              ("agez", az), ("sex", sex), ("smoker", smk)]
Xcols = []; names = []; dropped = []
for nm, v in candidates:
    trial = np.column_stack(Xcols + [v]) if Xcols else v.reshape(-1, 1)
    if np.linalg.matrix_rank(trial) == trial.shape[1]:
        Xcols.append(v); names.append(nm)
    else:
        dropped.append(nm)
if dropped:
    print("dropped (constant/collinear):", dropped, flush=True)
X = np.column_stack(Xcols); n, k = X.shape
gi = names.index("aud")
XtXi = np.linalg.inv(X.T @ X)
B = XtXi @ X.T @ Y
resid = Y - X @ B
dof = n - k
sig2 = (resid ** 2).sum(axis=0) / dof
se = np.sqrt(sig2 * XtXi[gi, gi])
coef = B[gi]
with np.errstate(divide="ignore", invalid="ignore"):
    tval = coef / se
    p = 2 * stats.t.sf(np.abs(tval), dof)
fin = np.isfinite(p) & np.isfinite(coef)
probes, coef, tval, p = probes[fin], coef[fin], tval[fin], p[fin]
fdr = mod.bh(p)
res = pd.DataFrame({"cg": probes, "delta_beta_case_minus_control": coef,
                    "t": tval, "p": p, "fdr": fdr}).sort_values("p").reset_index(drop=True)
res["rank"] = np.arange(1, len(res) + 1)
res.to_csv(os.path.join(OUT, f"GSE252501_{region}_dmp.csv"), index=False)
nsig = int((res["fdr"] < 0.05).sum())
print(f"{region}: significant CpGs (FDR<0.05): {nsig:,} / {len(res):,}", flush=True)
print(res.head(10).to_string(index=False), flush=True)

rankmap = {cg: (i + 1, float(res.loc[i, "p"])) for i, cg in enumerate(res["cg"])}
smoke = {cg: {"gene": gn, "rank": rankmap[cg][0], "p": rankmap[cg][1]}
         for cg, gn in mod.SMOKING_CPGS.items() if cg in rankmap}
frag = {
    "region": region, "tissue": f"postmortem {region}",
    "model_terms": names, "dropped_terms": dropped,
    "n_total": int(n), "n_case": int((aud == 1).sum()), "n_control": int((aud == 0).sum()),
    "n_probes_tested": int(len(res)), "n_sig_fdr05": nsig,
    "top10": res.head(10).to_dict("records"), "smoking_confound": smoke,
    "matrix_sha256": mod.sha256(matpath), "series_sha256": mod.sha256(series),
}
with open(os.path.join(OUT, f"GSE252501_{region}_fragment.json"), "w") as f:
    json.dump(frag, f, indent=2)
print(f"\nwrote out/GSE252501_{region}_dmp.csv + fragment.json  (total {time.time()-t0:.1f}s)", flush=True)
