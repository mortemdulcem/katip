#!/usr/bin/env python3
"""Stage 1: parse a pre-decompressed GSE252501 region matrix (/tmp/<region>.txt) and save the
region-mapped, complete-case beta matrix + design vectors to /tmp/<region>_parsed.npz.
Split from the regression stage to fit Replit's 120 s wall. Progress -> /tmp/<region>_prog.log
Usage: python 40d_parse_region.py NAc|DLPFC /tmp/NAc.txt
"""
import os, sys, importlib.util, time
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
RD = os.path.dirname(HERE)
DATA = os.path.join(RD, "data")
region = sys.argv[1]; plain = sys.argv[2]
LOG = f"/tmp/{region}_prog.log"
def log(m):
    with open(LOG, "a") as f:
        f.write(f"[{time.strftime('%H:%M:%S')}] {m}\n")

open(LOG, "w").close()
spec = importlib.util.spec_from_file_location(
    "dmp_alcohol", os.path.join(HERE, "40_dmp_alcohol_brain_gse252501.py"))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
series = os.path.join(DATA, "GSE252501_series_matrix.txt.gz")
ph = mod.parse_pheno(series); log("pheno parsed")

t0 = time.time()
with open(plain) as f:
    hdr = f.readline().rstrip("\n").split("\t")
beta_idx = [i for i, c in enumerate(hdr) if i > 0 and not c.endswith(".Detection.PVal")]
use = [0] + beta_idx
df = pd.read_csv(plain, sep="\t", usecols=use, index_col=0, low_memory=False)
log(f"read {df.shape} in {time.time()-t0:.1f}s")
df = df[df.index.astype(str).str.startswith("cg")]
df.columns = [str(c).strip().strip('"') for c in df.columns]
cols = [c for c in df.columns if c in ph and ph[c]["region"] == region]
log(f"mapped {region} cols: {len(cols)}")
sub = df[cols]
aud = np.array([ph[c]["aud"] for c in cols]); sex = np.array([ph[c]["sex"] for c in cols])
age = np.array([ph[c]["age"] for c in cols]); smk = np.array([ph[c]["smoker"] for c in cols])
keep = np.isfinite(aud) & np.isfinite(sex) & np.isfinite(age) & np.isfinite(smk)
sub = sub.loc[:, keep]; aud, sex, age, smk = aud[keep], sex[keep], age[keep], smk[keep]
Y = sub.to_numpy(dtype=np.float32).T
probes = sub.index.astype(str).to_numpy()
good = ~np.isnan(Y).any(axis=0)
Y = Y[:, good]; probes = probes[good]
log(f"Y {Y.shape} usable samples {len(aud)} AUD {int((aud==1).sum())} Ctrl {int((aud==0).sum())}")
np.savez(f"/tmp/{region}_parsed.npz", Y=Y, probes=probes, aud=aud, sex=sex, age=age, smk=smk)
log(f"saved npz total {time.time()-t0:.1f}s")
print("done", region)
