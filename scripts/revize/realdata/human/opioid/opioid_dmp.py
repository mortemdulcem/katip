#!/usr/bin/env python3
"""
GSE235818 — Profiling Neuronal Methylome of Opioid Use Disorder in the Human
Orbitofrontal Cortex (OFC). Gercek (real) diferansiyel metilasyon (5mC) analizi.

Tasarim: noronal (NeuN+) cekirdeklerde bisulfit-dizileme, pozisyon basina
metilasyon yuzdesi (0-100). Grup sutun isminde kodlu: OUD+ = vaka (opioid use
disorder), OUD- = kontrol. 12 OUD+ vs 26 OUD-.

Veri gercegi (durustluk icin acik): saglanan matris yalnizca % metilasyon icerir,
PER-SITE OKUMA DERINLIGI (coverage) YOK. Bu yuzden beta-binomial / coverage-agirlikli
model (methylKit/DSS) kurulamaz; % uzerinde Welch t-test bir YAKLASIMDIR. Matris
yogun (NA yok) ve %69 hucre tam 0 (seyrek metilasyon). 0 = "0% metilasyon" olarak
alinir (coverage bilinmedigi icin 'olculmedi' ile ayirt edilemez -> sinirlilik).

Grup-KOR saptanabilirlik filtresi (etiket kullanmaz -> kontrast lehine secilim yok):
  pozisyon >= MIN_NONZERO ornekte (38 icinden) sifirdan farkli VE std>0.
Sonra pozisyon basina Welch t-test (OUD+ vs OUD-) + BH-FDR. Effect = delta mean %.

Cikti: out/GSE235818_opioid_dmp.json (+ girdi SHA-256 manifesti).
"""
import gzip, json, hashlib, os
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
PROC = os.path.join(HERE, "GSE235818_Meth.csv.gz")
OUTDIR = os.path.join(HERE, "out"); os.makedirs(OUTDIR, exist_ok=True)
OUT = os.path.join(OUTDIR, "GSE235818_opioid_dmp.json")
MIN_NONZERO = 19  # 38 ornegin en az yarisi sifirdan farkli (grup-kor)

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def main():
    with gzip.open(PROC, "rt") as f:
        header = f.readline().rstrip("\n").replace('"', "").split(",")
    samples = header[4:]
    grp = np.array(["case" if s.startswith("OUD+") else "control" if s.startswith("OUD-") else "UNKNOWN" for s in samples])
    n_unknown = int((grp == "UNKNOWN").sum())
    if n_unknown:
        raise SystemExit(f"{n_unknown} ornek OUD+/OUD- disinda etiket (format drift) -> sessiz yanlis-atama onlendi")
    case_mask = grp == "case"; ctrl_mask = grp == "control"
    print(f"ornek: OUD+ (vaka)={case_mask.sum()} | OUD- (kontrol)={ctrl_mask.sum()}")

    dtype = {c: np.float32 for c in samples}
    dtype["chr"] = "category"; dtype["start"] = np.int64
    usecols = ["chr", "start"] + samples
    df = pd.read_csv(PROC, usecols=usecols, dtype=dtype, low_memory=False)
    n_total = len(df)
    pos = (df["chr"].astype(str) + ":" + df["start"].astype(str)).to_numpy()
    B = df[samples].to_numpy(dtype=np.float64)
    del df

    nz = (B > 0).sum(axis=1)
    sd = B.std(axis=1)
    keep = (nz >= MIN_NONZERO) & (sd > 0)
    n_keep = int(keep.sum())
    B = B[keep]; pos = pos[keep]
    print(f"toplam pozisyon={n_total}, filtre sonrasi (>= {MIN_NONZERO} nonzero & std>0)={n_keep}")

    A = B[:, case_mask]; C = B[:, ctrl_mask]
    t_arr, p_arr = stats.ttest_ind(A, C, axis=1, equal_var=False)
    deltas = A.mean(axis=1) - C.mean(axis=1)
    good = ~np.isnan(p_arr)
    pvals = p_arr[good]; deltas = deltas[good]; pos = pos[good]
    n_test = len(pvals)
    if n_test == 0:
        raise SystemExit("test edilebilen pozisyon yok")

    order = np.argsort(pvals)
    ranked = np.empty(n_test); ranked[order] = np.arange(1, n_test + 1)
    q = pvals * n_test / ranked
    qs = q[order]
    for k in range(n_test - 2, -1, -1):
        qs[k] = min(qs[k], qs[k + 1])
    qvals = np.empty(n_test); qvals[order] = np.clip(qs, 0, 1)

    sig05 = int((qvals < 0.05).sum()); sig10 = int((qvals < 0.10).sum())
    top = []
    for k in order[:25]:
        top.append({"position": pos[k], "delta_pct_case_minus_ctrl": round(float(deltas[k]), 3),
                    "p": float(pvals[k]), "q_BH": round(float(qvals[k]), 5)})
    print(f"test pozisyon={n_test}, FDR<0.05={sig05}, FDR<0.10={sig10}, min_q={qvals.min():.6f}")

    result = {
        "dataset": "GSE235818",
        "title": "Profiling Neuronal Methylome of Opioid Use Disorder in the Human Orbitofrontal Cortex",
        "substance": "opioid (opioid use disorder)",
        "tissue": "neuronal (NeuN+) nuclei, orbitofrontal cortex",
        "assay": "bisulfite sequencing, per-position % methylation (5mC)",
        "design": {"OUD_case": int(case_mask.sum()), "control": int(ctrl_mask.sum())},
        "method": (f"group-blind detectability filter (nonzero in >= {MIN_NONZERO}/38 samples & std>0), "
                   "then per-position Welch t-test OUD+ vs OUD- + BH-FDR"),
        "n_positions_total": n_total, "n_positions_tested": n_test,
        "n_FDR_lt_0.05": sig05, "n_FDR_lt_0.10": sig10, "min_q_BH": round(float(qvals.min()), 6),
        "top25_by_p": top,
        "conclusion_honest": ("NO position survives FDR<0.05" if sig05 == 0 else f"{sig05} positions FDR<0.05"),
        "limitations": ("matrix provides ONLY % methylation, NO per-site read coverage -> cannot use "
                        "beta-binomial/coverage-weighted models (methylKit/DSS); Welch t on percentages is "
                        "an APPROXIMATION; dense matrix, 0 treated as 0% methylation (cannot be distinguished "
                        "from 'not covered'); imbalanced groups (12 vs 26); no cell-composition/age/PMI covariate "
                        "adjustment; OFC neuronal tissue only; results reported as-is (exploratory, not diagnostic)"),
        "input_files_sha256": {os.path.basename(PROC): sha256(PROC)},
    }
    with open(OUT, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print("Yazildi:", OUT)

if __name__ == "__main__":
    main()
