#!/usr/bin/env python3
"""Run GSE252501 alcohol EWAS for a SINGLE region (NAc or DLPFC) and write its DMP CSV
+ a per-region JSON fragment. Splitting by region keeps each run under Replit's 120s wall.
Reuses parse_pheno() + run_region() from 40_dmp_alcohol_brain_gse252501.py (no logic fork).
Usage: python 40b_run_one_region.py NAc|DLPFC
"""
import os, sys, json, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
RD = os.path.dirname(HERE)
DATA = os.path.join(RD, "data"); OUT = os.path.join(RD, "out")

spec = importlib.util.spec_from_file_location(
    "dmp_alcohol", os.path.join(HERE, "40_dmp_alcohol_brain_gse252501.py"))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)

region = sys.argv[1]
matname = {"NAc": "GSE252501_proccessed_matrix_NAc.txt.gz",
           "DLPFC": "GSE252501_proccessed_matrix_DLPFC.txt.gz"}[region]
matpath = os.path.join(DATA, matname)
series = os.path.join(DATA, "GSE252501_series_matrix.txt.gz")

ph = mod.parse_pheno(series)
res = mod.run_region(region, ph, matpath)
res["matrix_sha256"] = mod.sha256(matpath)
res["series_sha256"] = mod.sha256(series)
with open(os.path.join(OUT, f"GSE252501_{region}_fragment.json"), "w") as f:
    json.dump(res, f, indent=2)
print(f"\nwrote out/GSE252501_{region}_dmp.csv + fragment.json")
