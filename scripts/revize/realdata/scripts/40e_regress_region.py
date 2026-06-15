#!/usr/bin/env python3
"""Stage 2: load /tmp/<region>_parsed.npz and run the GSE252501 alcohol EWAS regression
(identical model to run_region in 40_dmp_alcohol_brain_gse252501.py):
  beta ~ AUD(case) + agedeath(z) + sex + smoker, full-rank, BH-FDR.
Writes out/GSE252501_<region>_dmp.csv + out/GSE252501_<region>_fragment.json
Usage: python 40e_regress_region.py NAc|DLPFC
"""
import os, sys, json, importlib.util, time
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
RD = os.path.dirname(HERE)
DATA = os.path.join(RD, "data"); OUT = os.path.join(RD, "out")
region = sys.argv[1]
spec = importlib.util.spec_from_file_location(
    "dmp_alcohol", os.path.join(HERE, "40_dmp_alcohol_brain_gse252501.py"))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
series = os.path.join(DATA, "GSE252501_series_matrix.txt.gz")
matname = {"NAc": "GSE252501_proccessed_matrix_NAc.txt.gz",
           "DLPFC": "GSE252501_proccessed_matrix_DLPFC.txt.gz"}[region]
matpath = os.path.join(DATA, matname)

t0 = time.time()
d = np.load(f"/tmp/{region}_parsed.npz", allow_pickle=True)
Y = d["Y"].astype(np.float64); probes = d["probes"]
aud = d["aud"]; sex = d["sex"]; age = d["age"]; smk = d["smk"]
print(f"loaded Y {Y.shape} in {time.time()-t0:.1f}s", flush=True)

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
print(f"\nwrote out/GSE252501_{region}_dmp.csv + fragment.json (total {time.time()-t0:.1f}s)", flush=True)
