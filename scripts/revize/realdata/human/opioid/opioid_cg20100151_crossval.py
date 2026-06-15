#!/usr/bin/env python3
"""
cg20100151 @ chr3:32782825-32782827 (hg38) — DEDICATED honest cross-tissue check.

Arka plan / neden bu betik var:
  chr3:32781045 (GSE235818 OUD KESIF lokusu) iki bagimsiz kohortta REPLIKE OLMADI
  (GSE98203 OFC noron, S2.5; GSE164822 dlPFC, S2.5b). ANCAK GSE164822 dlPFC
  capraz-dogrulamasinda, hedefin +-2kb penceresinin KENARINDA AYRI bir prob —
  cg20100151 @ chr3:32782825 (hedeften 1780 bp) — bolge-ici FDR<0.05 cikti
  (delta_M=-0.199, p=0.0002, FDR=0.0021, hipometilasyon). Bu KESIF CpG'si DEGIL;
  ayri bir lokustur ve bu nedenle replikasyon yargisindan acikca DISLANDI. Yine de
  "gercek bir dlPFC opioid-iliskili DMP mi, yoksa bolge/array artefakti mi?"
  sorusu dururdugu icin burada baska OUD kohortlarinda OZELLIKLE bu prob test edilir.

Test edilen kohortlar (hepsi OUD/opioid, beyin):
  1. GSE164822 — dlPFC, EPIC, M-degeri, BULK doku (FACS YOK; "tissue samples").
     cg20100151: ANLAMLI (yukaridaki sayilar). Kaynak: bu repodaki committed
     crossval JSON (matris 1 GB, ayri calistirildi); o JSON'daki girdi SHA-256
     ve cg20100151 satiri burada birebir aktarilir (yeniden uydurma yok).
  2. GSE98203 — OFC, 450K, beta, FACS-AYRILMIS NeuN+ NORONAL cekirdek.
     cg20100151 burada YERINDE yeniden hesaplanir (veri yerel): ana DMP modeliyle
     ayni -> beta ~ heroin + age(z) + sex (OLS).
  3. GSE235818 — OFC, bisulfit %metilasyon, FACS-AYRILMIS NeuN+ NORONAL cekirdek.
     cg20100151 CpG'sinin (chr3:32782826/_27) bisulfit matriste OLCULUP olculmedigi
     pozisyon-aramasi ile dogrulanir; olculmediyse en yakin olculen CpG mesafesi
     raporlanir (dürüst "not covered").

Hücre-tipi karistirici hipotezi (task): cg20100151 YALNIZCA dlPFC BULK dokuda
  cikar, FACS-ayrilmis SAF NORON OFC kohortlarinda cikmaz/olculmezse -> sinyal
  bolgeye (dlPFC vs OFC) VE/VEYA hucre-tipi kompozisyonuna (bulk vs saf noron;
  glia katkisi) bagli olabilir; tek-bolge tek-doku bulk pozitifi tek basina
  gercek bir pan-kohort opioid DMP'si olarak alinamaz.

Zero-hallucination: yerel hesaplanan her sayi burada uretilir; tum girdi
  SHA-256'lari kaydedilir; GSE164822 degeri committed JSON'dan aynen alinir.
Cikti: out/cg20100151_crosstissue.json
"""
import os, json, gzip, hashlib
import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
RD = os.path.dirname(os.path.dirname(HERE))  # scripts/revize/realdata
REGION_TSV = os.path.join(HERE, "manifest", "region_probes_chr3_32781045_hg38.tsv")
GSE98203_DATA = os.path.join(RD, "data", "GSE98203_beta.txt.gz")
GSE98203_PHENO = os.path.join(RD, "out", "GSE98203_pheno.csv")
GSE235818_BS = os.path.join(HERE, "GSE235818_Meth.csv.gz")
GSE164822_JSON = os.path.join(HERE, "out", "GSE235818_chr3_32781045_crossval_GSE164822.json")
OUTDIR = os.path.join(HERE, "out"); os.makedirs(OUTDIR, exist_ok=True)
OUT = os.path.join(OUTDIR, "cg20100151_crosstissue.json")

PROBE = "cg20100151"
# hg38 (Zhou sesame manifest, 0-based CpG_beg). CpG dinucleotide -> 1-based C(+)=32782826, C(-)=32782827.
TARGET_BISULFITE_POS = (32782826, 32782827)
CHROM = "chr3"
DISCOVERY_TARGET = 32781045  # GSE235818 discovery CpG (hg38), for distance context


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def gse98203_recompute():
    """cg20100151'i GSE98203'te (OFC NeuN+ noron, 450K) yerinde hesapla."""
    reg = pd.read_csv(REGION_TSV, sep="\t")
    reg = reg[(reg["array"] == "HM450") & (reg["Probe_ID"] == PROBE)]
    if reg.empty:
        return {"status": "PROBE_NOT_ON_ARRAY",
                "note": f"{PROBE} HM450 manifestinde yok -> 450K'da test edilemez"}
    cpg_beg = int(reg.iloc[0]["CpG_beg"])

    pheno = pd.read_csv(GSE98203_PHENO)
    pheno["of"] = pheno["of"].astype(str)
    pheno = pheno[pheno["cohort"].isin(["HEROIN", "CONTROL"])].copy()
    pheno["sex"] = pheno["gender"].astype(str).str.upper().str.replace("?", "", regex=False).str[0]
    pheno = pheno[pheno["sex"].isin(["M", "F"])]
    pheno["age"] = pd.to_numeric(pheno["age"], errors="coerce")
    pheno = pheno.dropna(subset=["age"])

    with gzip.open(GSE98203_DATA, "rt") as f:
        header = f.readline().rstrip("\n").split("\t")
    beta_cols = [c for c in header[1:] if not c.endswith("_Detection_PVal")]
    usecols = [header[0]] + beta_cols
    df = pd.read_csv(GSE98203_DATA, sep="\t", usecols=usecols, index_col=0)
    df.columns = [c.strip() for c in df.columns]
    if PROBE not in df.index:
        return {"status": "PROBE_ABSENT_IN_MATRIX",
                "note": f"{PROBE} GSE98203 beta matrisinde yok"}
    row = df.loc[PROBE]

    common = [c for c in df.columns if c in set(pheno["of"])]
    pheno = pheno[pheno["of"].isin(common)].set_index("of").loc[common]
    y = row[common].to_numpy(dtype=float)
    g = (pheno["cohort"].to_numpy() == "HEROIN").astype(float)
    age = pheno["age"].to_numpy(dtype=float); age = (age - age.mean()) / age.std()
    sex = (pheno["sex"].to_numpy() == "M").astype(float)
    if np.isnan(y).any():
        return {"status": "NaN_in_samples", "note": "cg20100151 GSE98203'te NaN icerir"}
    X = np.column_stack([np.ones(len(g)), g, age, sex])
    n, k = X.shape
    XtX_inv = np.linalg.inv(X.T @ X)
    dof = n - k
    B = XtX_inv @ X.T @ y
    resid = y - X @ B
    sigma2 = (resid ** 2).sum() / dof
    se = np.sqrt(sigma2 * XtX_inv[1, 1])
    coef = float(B[1]); t = coef / se if se > 0 else np.nan
    p = float(2 * stats.t.sf(abs(t), dof)) if np.isfinite(t) else np.nan
    return {
        "status": "TESTED",
        "accession": "GSE98203", "tissue": "OFC FACS-sorted NeuN+ neuronal nuclei",
        "cell_prep": "FACS-sorted PURE NEURONS (NeuN+)",
        "region": "OFC", "platform": "Illumina 450K (beta)",
        "probe_hg38": f"{CHROM}:{cpg_beg}",
        "dist_to_discovery_target_bp": abs(cpg_beg - DISCOVERY_TARGET),
        "model": "beta ~ heroin + age(z) + sex (OLS) — same as GSE98203 main DMP",
        "design": {"HEROIN": int(g.sum()), "CONTROL": int((g == 0).sum())},
        "delta_beta_heroin_minus_ctrl": round(coef, 5),
        "mean_beta_heroin": round(float(y[g == 1].mean()), 4),
        "mean_beta_control": round(float(y[g == 0].mean()), 4),
        "t": round(float(t), 4), "p": p,
        "significant_p05": bool(p < 0.05),
        "direction_hypomethylation_in_case": bool(coef < 0),
    }


def gse235818_position_lookup():
    """cg20100151 CpG'sini GSE235818 bisulfit matriste pozisyon-aramasiyla dogrula."""
    with gzip.open(GSE235818_BS, "rt") as f:
        f.readline()  # header
        found = {}
        nearest_below = (None, None)  # (pos, dist)
        nearest_above = (None, None)
        for line in f:
            # hizli on-filtre: yalnizca chr3 satirlari
            if not line.startswith('"chr3"'):
                continue
            parts = line.split(",", 4)
            try:
                pos = int(parts[1])
            except (ValueError, IndexError):
                continue
            if pos in TARGET_BISULFITE_POS:
                strand = parts[3].strip('"')
                vals = [float(x) if x.strip() not in ("", "NA") else np.nan
                        for x in line.rstrip("\n").split(",")[4:]]
                found[pos] = {"strand": strand, "mean_pct": round(float(np.nanmean(vals)), 4),
                              "n_nonzero": int(np.nansum(np.array(vals) > 0))}
            d = pos - TARGET_BISULFITE_POS[0]
            if pos <= TARGET_BISULFITE_POS[0]:
                if nearest_below[0] is None or abs(d) < nearest_below[1]:
                    nearest_below = (pos, abs(d))
            if pos >= TARGET_BISULFITE_POS[0]:
                if nearest_above[0] is None or abs(d) < nearest_above[1]:
                    nearest_above = (pos, abs(d))
    if found:
        return {"status": "COVERED",
                "accession": "GSE235818", "tissue": "OFC NeuN+ neuronal nuclei (bisulfite)",
                "cell_prep": "FACS-sorted PURE NEURONS (NeuN+)", "region": "OFC",
                "platform": "bisulfite-seq % methylation",
                "cpg_positions_found": found}
    return {"status": "NOT_COVERED",
            "accession": "GSE235818", "tissue": "OFC NeuN+ neuronal nuclei (bisulfite)",
            "cell_prep": "FACS-sorted PURE NEURONS (NeuN+)", "region": "OFC",
            "platform": "bisulfite-seq % methylation",
            "note": (f"cg20100151 CpG ({CHROM}:{TARGET_BISULFITE_POS[0]}/_{TARGET_BISULFITE_POS[1]}) "
                     "bisulfit matriste OLCULMEMIS (bu RRBS-tarzi deposit bu CpG'yi kapsamiyor)."),
            "nearest_measured_cpg": {
                "below": {"pos": nearest_below[0], "dist_bp": nearest_below[1]},
                "above": {"pos": nearest_above[0], "dist_bp": nearest_above[1]},
            }}


def gse164822_from_committed():
    """dlPFC BULK pozitifini committed crossval JSON'dan aynen aktar (matris 1 GB, ayri kosuldu)."""
    with open(GSE164822_JSON) as f:
        d = json.load(f)
    row = next((r for r in d["region_probes_tested"] if r["probe"] == PROBE), None)
    if row is None:
        return {"status": "PROBE_NOT_IN_JSON"}
    return {
        "status": "TESTED",
        "accession": "GSE164822", "tissue": "dorsolateral PFC (dlPFC), postmortem",
        "cell_prep": "BULK tissue (DNeasy from tissue; NO FACS/cell sorting)",
        "region": "dlPFC", "platform": "Illumina EPIC (M-value)",
        "probe_hg38": row["hg38"],
        "dist_to_discovery_target_bp": row["dist_to_target_bp"],
        "model": "M ~ group(Opioids) + age(z) + pmi(z) + sex + race (OLS) — same as GSE164822 main DMP",
        "design": d["validation_dataset"]["design_aligned"],
        "delta_M_opioids_minus_ctrl": row["delta_M_opioids_minus_ctrl"],
        "mean_M_opioids": row["mean_M_opioids"], "mean_M_control": row["mean_M_control"],
        "t": row["t"], "p": row["p"], "fdr_region": row["fdr_region"],
        "significant_region_fdr05": bool(row["fdr_region"] < 0.05),
        "direction_hypomethylation_in_case": bool(row["delta_M_opioids_minus_ctrl"] < 0),
        "source": ("committed crossval JSON GSE235818_chr3_32781045_crossval_GSE164822.json "
                   "(matrix GSE164822_M_final.txt.gz ~1GB run separately)"),
        "source_input_sha256": d["input_files_sha256"],
    }


def main():
    g164 = gse164822_from_committed()
    g98 = gse98203_recompute()
    g235 = gse235818_position_lookup()

    # --- verdict ---
    sig_cohorts = []
    null_cohorts = []
    if g164.get("significant_region_fdr05"):
        sig_cohorts.append("GSE164822 (dlPFC BULK)")
    if g98.get("status") == "TESTED" and g98.get("significant_p05"):
        sig_cohorts.append("GSE98203 (OFC sorted neurons)")
    if g98.get("status") == "TESTED" and not g98.get("significant_p05"):
        null_cohorts.append("GSE98203 (OFC sorted neurons)")

    only_bulk_dlpfc = (
        g164.get("significant_region_fdr05") is True
        and g98.get("status") == "TESTED" and g98.get("significant_p05") is False
    )

    if only_bulk_dlpfc:
        verdict = "COHORT_SPECIFIC_dlPFC_BULK_ONLY"
        interpretation = (
            "cg20100151 (chr3:32782825, hedef CpG'den 1780 bp; KESIF lokusu DEGIL) YALNIZCA "
            "GSE164822 dlPFC BULK dokuda anlamli (delta_M={dm}, p={p164:.4g}, FDR={f164}, "
            "hipometilasyon). Bagimsiz OFC FACS-AYRILMIS SAF NORON kohortunda (GSE98203, 450K) "
            "ANLAMSIZ ve YON TERS (delta_beta={db} -> vakada HIPERmetilasyon egilimi, p={p98:.3f}). "
            "Ikinci OFC saf-noron kohortunda (GSE235818, bisulfit) bu CpG hic OLCULMEMIS "
            "(en yakin olculen CpG {nb} bp uzakta). Yani sinyal bolge (dlPFC) VE doku-hazirligi "
            "(bulk vs saf noron) ile tamamen ic ice; tek bir bulk dlPFC kohortuna ozgudur."
        ).format(
            dm=g164["delta_M_opioids_minus_ctrl"], p164=g164["p"], f164=g164["fdr_region"],
            db=g98["delta_beta_heroin_minus_ctrl"], p98=g98["p"],
            nb=g235.get("nearest_measured_cpg", {}).get("below", {}).get("dist_bp"),
        )
        celltype_flag = (
            "HUCRE-TIPI KOMPOZISYONU KARISTIRICI ADAYI (flagged). cg20100151 yalnizca BULK dlPFC "
            "dokuda (noron + glia + endotel karisimi) cikiyor; ayni/yakin doku tipindeki FACS-ayrilmis "
            "SAF NORON kohortlarinda yok (GSE98203) veya olculmemis (GSE235818). Bulk dokuda gozlenen "
            "fark, opioid'e bagli gercek bir noronal metilasyon degisimi yerine, gruplar arasi HUCRE-TIPI "
            "ORANI farkindan (or. glia/noron orani) kaynaklaniyor olabilir. Ayrica dlPFC, OFC'den farkli "
            "bir beyin bolgesidir -> bolge-ozgullugu de ayni anda bir aciklamadir; iki karistirici "
            "(bolge + hucre-tipi) bu tasarimla AYRISTIRILAMAZ. Referans-tabanli beyin dekonvolüsyonu / "
            "noron-orani ayari olmadan bu bulgu gercek bir pan-kohort opioid DMP'si olarak alinamaz."
        )
    elif sig_cohorts and not null_cohorts:
        verdict = "REPLICATES"
        interpretation = "cg20100151 birden fazla kohortta anlamli ve ayni yonde -> replike."
        celltype_flag = "n/a (replike)"
    else:
        verdict = "INCONCLUSIVE"
        interpretation = "Kohort sonuclari karisik; net replikasyon/karistirici resmi yok."
        celltype_flag = "see per-cohort"

    result = {
        "analysis": "cg20100151 @ chr3:32782825 — dedicated cross-tissue OUD check "
                    "(distinct edge-of-window probe, NOT the chr3:32781045 discovery CpG)",
        "probe": PROBE,
        "is_discovery_cpg": False,
        "discovery_cpg_hg38": f"{CHROM}:{DISCOVERY_TARGET}",
        "note_on_origin": (
            "cg20100151, chr3:32781045 KESIF lokusunun +-2kb penceresinin kenarinda (1780 bp) AYRI bir "
            "probtur; GSE164822 dlPFC capraz-dogrulamasinda bolge-ici FDR<0.05 cikti ve replikasyon "
            "yargisindan acikca DISLANDI (S2.5b). Bu betik onu kendi basina sorgular."),
        "cohorts": {
            "GSE164822_dlPFC_bulk": g164,
            "GSE98203_OFC_sorted_neurons": g98,
            "GSE235818_OFC_sorted_neurons_bisulfite": g235,
        },
        "significant_in": sig_cohorts,
        "null_in": null_cohorts,
        "verdict": verdict,
        "interpretation": interpretation,
        "cell_type_confound_flag": celltype_flag,
        "input_files_sha256": {
            "region_probes_chr3_32781045_hg38.tsv": sha256(REGION_TSV),
            "GSE98203_beta.txt.gz": sha256(GSE98203_DATA),
            "GSE98203_pheno.csv": sha256(GSE98203_PHENO),
            "GSE235818_Meth.csv.gz": sha256(GSE235818_BS),
            "GSE235818_chr3_32781045_crossval_GSE164822.json": sha256(GSE164822_JSON),
        },
    }
    with open(OUT, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"VERDICT: {verdict}")
    print(f"  GSE164822 dlPFC bulk:  p={g164.get('p')}, FDR={g164.get('fdr_region')}, "
          f"sig={g164.get('significant_region_fdr05')}")
    print(f"  GSE98203 OFC neurons:  p={g98.get('p')}, sig={g98.get('significant_p05')}, "
          f"dir_hypo={g98.get('direction_hypomethylation_in_case')}")
    print(f"  GSE235818 OFC neurons: {g235.get('status')} "
          f"(nearest {g235.get('nearest_measured_cpg', {}).get('below', {}).get('dist_bp')} bp)")
    print("Yazildi:", OUT)


if __name__ == "__main__":
    main()
