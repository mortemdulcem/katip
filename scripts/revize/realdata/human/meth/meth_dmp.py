#!/usr/bin/env python3
"""
GSE293262 — Genome-wide DNA Methylation Profiling in Methamphetamine Addiction.
Gercek (real) diferansiyel metilasyon analizi. Zero-hallucination: sonuc oldugu
gibi raporlanir; n=8 oldugu icin guc cok dusuk, null/exploratory beklenir.

Tasarim: 4 metamfetamin-bagimli (DSM-5) vs 4 saglikli kontrol, periferik kan
lokosit, hepsi ERKEK, Illumina EPIC (GPL21145) AVG_Beta.

Grup eslemesi series_matrix'ten programlı kurulur (hardcode yok):
  GSM -> sentrix (Sample_supplementary_file), GSM -> treatment (characteristics).

Yontem: detection p>0.01 -> NA maskeleme, herhangi bir NA olan prob atilir,
Welch t-test (meth vs kontrol) prob basina + BH-FDR. Effect = mean delta-beta.

Cikti: out/GSE293262_meth_dmp.json (+ girdi dosyalarinin SHA-256 manifesti).
"""
import gzip, json, re, hashlib, os, sys
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
PROC = os.path.join(HERE, "GSE293262_processed_data_Meth.csv.gz")
SMAT = os.path.join(HERE, "GSE293262_series_matrix.txt.gz")
OUTDIR = os.path.join(HERE, "out"); os.makedirs(OUTDIR, exist_ok=True)
OUT = os.path.join(OUTDIR, "GSE293262_meth_dmp.json")
DET_PVAL_MAX = 0.01

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def parse_series_matrix(path):
    """sentrix -> group ('meth'|'control') series_matrix'ten."""
    geo, treat, sup = [], [], []
    with gzip.open(path, "rt", errors="replace") as f:
        for line in f:
            if not line.startswith("!Sample_"):
                continue
            parts = [p for p in line.rstrip("\n").split('"') if p not in ("", "\t")]
            if not parts:
                continue
            key = parts[0].strip()
            vals = [p for p in parts[1:] if p.strip()]
            if key == "!Sample_geo_accession":
                geo = vals
            elif key == "!Sample_characteristics_ch1" and any("treatment:" in v for v in vals):
                treat = [v.split("treatment:")[1].strip() for v in vals]
            elif key == "!Sample_supplementary_file" and not sup:
                for v in vals:
                    m = re.search(r"(\d{9,}_R\d{2}C\d{2})", v)
                    sup.append(m.group(1) if m else None)
    if not (len(geo) == len(treat) == len(sup)) or not geo:
        raise SystemExit(f"series_matrix parse hatasi: geo={len(geo)} treat={len(treat)} sup={len(sup)}")
    mapping = {}
    for g, t, s in zip(geo, treat, sup):
        if s is None:
            raise SystemExit(f"{g}: sentrix cikarilamadi")
        grp = "meth" if t.lower().startswith("meth") else "control"
        mapping[s] = grp
    return mapping

def main():
    sentrix_group = parse_series_matrix(SMAT)
    nmeth = sum(v == "meth" for v in sentrix_group.values())
    nctrl = sum(v == "control" for v in sentrix_group.values())
    print(f"series_matrix eslemesi: meth={nmeth} kontrol={nctrl}")

    with gzip.open(PROC, "rt", errors="replace") as f:
        header = f.readline().rstrip("\n").split(",")
    # AVG_Beta sutunlari + eslesen detection sutunu (hemen sonraki)
    beta_idx, det_idx, grp = [], [], []
    for i, c in enumerate(header):
        if c.endswith(".AVG_Beta"):
            sx = c[:-len(".AVG_Beta")]
            if sx not in sentrix_group:
                raise SystemExit(f"prob sutunu {sx} series_matrix'te yok")
            beta_idx.append(i)
            det_idx.append(i + 1 if i + 1 < len(header) else None)
            grp.append(sentrix_group[sx])
    grp = np.array(grp)
    meth_mask = grp == "meth"; ctrl_mask = grp == "control"
    if meth_mask.sum() != nmeth or ctrl_mask.sum() != nctrl:
        raise SystemExit("sutun-grup sayilari series_matrix ile uyusmuyor")
    print(f"islenen sutunlar: meth={meth_mask.sum()} kontrol={ctrl_mask.sum()}, okunuyor...")

    det_nonnull = [j for j in det_idx if j is not None]
    usecols_sorted = sorted(set([0] + beta_idx + det_nonnull))
    # header=None + pozisyonel etiketleme: tekrarlı Detection.Pval isimleri sorun olmaz
    df = pd.read_csv(PROC, header=None, skiprows=1, usecols=usecols_sorted, low_memory=False)
    df.columns = usecols_sorted  # orijinal sutun indeksleriyle etiketle
    n_total = len(df)
    probes_all = df[0].astype(str).to_numpy()
    B = df[beta_idx].apply(pd.to_numeric, errors="coerce").to_numpy(dtype=np.float64)
    D = df[det_nonnull].apply(pd.to_numeric, errors="coerce").to_numpy(dtype=np.float64)
    # detection p>esik VEYA non-finite (basarisiz olcum) -> NA maskele
    B = np.where((~np.isfinite(D)) | (D > DET_PVAL_MAX), np.nan, B)
    keep = ~np.isnan(B).any(axis=1)
    n_na = int((~keep).sum())
    B = B[keep]; probes_all = probes_all[keep]
    A = B[:, meth_mask]; C = B[:, ctrl_mask]
    # sabit-degerli (her iki grupta ve esit) satirlari ele
    var_ok = ~((A.std(axis=1) == 0) & (C.std(axis=1) == 0) & (A[:, 0] == C[:, 0]))
    A = A[var_ok]; C = C[var_ok]; probes_all = probes_all[var_ok]
    t_arr, p_arr = stats.ttest_ind(A, C, axis=1, equal_var=False)
    good = ~np.isnan(p_arr)
    pvals = p_arr[good]; deltas = (A.mean(axis=1) - C.mean(axis=1))[good]; probes = list(probes_all[good])
    n_test = len(pvals)
    if n_test == 0:
        raise SystemExit("test edilebilen prob yok")
    order = np.argsort(pvals)
    ranked = np.empty(n_test); ranked[order] = np.arange(1, n_test + 1)
    q = pvals * n_test / ranked
    qs = q[order]
    for k in range(n_test - 2, -1, -1):
        qs[k] = min(qs[k], qs[k + 1])
    qvals = np.empty(n_test); qvals[order] = np.clip(qs, 0, 1)

    sig05 = int((qvals < 0.05).sum()); sig10 = int((qvals < 0.10).sum())
    top = []
    for k in order[:20]:
        top.append({"probe": probes[k], "delta_beta_meth_minus_ctrl": round(float(deltas[k]), 5),
                    "p": float(pvals[k]), "q_BH": round(float(qvals[k]), 5)})
    print(f"test prob={n_test}, atlanan(NA/parse)={n_na}, FDR<0.05={sig05}, FDR<0.10={sig10}, min_q={qvals.min():.5f}")

    result = {
        "dataset": "GSE293262",
        "title": "Genome-wide DNA Methylation Profiling in Methamphetamine Addiction",
        "substance": "methamphetamine",
        "tissue": "peripheral blood leukocyte", "sex": "all male",
        "platform": "Illumina MethylationEPIC (GPL21145), AVG_Beta",
        "design": {"meth_dependent_DSM5": int(meth_mask.sum()), "healthy_control": int(ctrl_mask.sum())},
        "method": f"per-probe Welch t-test meth vs control; detection p>{DET_PVAL_MAX} masked to NA; probes with any NA dropped; BH-FDR",
        "n_probes_in_file": n_total, "n_probes_tested": n_test, "n_probes_skipped_na_or_invariant": n_na,
        "n_FDR_lt_0.05": sig05, "n_FDR_lt_0.10": sig10, "min_q_BH": round(float(qvals.min()), 5),
        "top20_by_p": top,
        "conclusion_honest": ("NO probe survives FDR<0.05" if sig05 == 0 else f"{sig05} probes FDR<0.05"),
        "limitations": ("VERY SMALL n=8 (4 vs 4) -> severely underpowered; any single-probe FDR survivor "
                        "would still be fragile; blood (not brain), all-male, no cell-type/age adjustment; "
                        "AVG_Beta as provided by authors (no IDAT re-normalization); results reported as-is"),
        "input_files_sha256": {os.path.basename(PROC): sha256(PROC), os.path.basename(SMAT): sha256(SMAT)},
    }
    with open(OUT, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print("Yazildi:", OUT)

if __name__ == "__main__":
    main()
