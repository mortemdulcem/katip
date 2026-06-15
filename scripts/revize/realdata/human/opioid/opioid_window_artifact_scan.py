#!/usr/bin/env python3
"""
Sistematik PENCERE-KENARI yakin-prob artefakt taramasi (genellestirme).

Arka plan / neden bu betik var:
  Task #11 (opioid_cg20100151_crossval.py) tek bir near-miss probu (cg20100151)
  elle yakaladi: KESIF lokusu (chr3:32781045) replike OLMAZKEN, +-2kb penceresinin
  KENARINDA AYRI bir prob tek bir BULK-doku kohortunda (GSE164822 dlPFC) bolge-ici
  FDR<0.05 cikti — gercek bir opioid DMP'si degil, olasi hucre-tipi/bolge artefakti.
  Bu betik o per-prob mantigini RAPORDAKI HER non-replike KESIF lokusunun TUM +-2kb
  penceresine SISTEMATIK olarak uygular: pencere icindeki HER prob, baglanmis (wired-up)
  kohortlar arasinda test edilir ve YALNIZCA BULK dokuda anlamli cikan problar
  (sorted-noron / capraz-bolge kohortlarinda degil) cg20100151 ile AYNI yargi mantigiyla
  (COHORT_SPECIFIC_*_BULK_ONLY) isaretlenir.

Baglanmis kohortlar (hepsi OUD/opioid, postmortem beyin) — bulk vs sorted ayrimi:
  - GSE164822 — dlPFC, EPIC, M-degeri, BULK doku (FACS YOK).  -> "bulk"
  - GSE98203  — OFC, 450K, beta, FACS-AYRILMIS SAF NORON (NeuN+).  -> "sorted neuron"
  - GSE235818 — OFC, bisulfit %metilasyon, FACS-AYRILMIS SAF NORON (NeuN+, KESIF kohortu).
                 array proplari genelde olculmemis -> coverage durusttce raporlanir.

Non-replike KESIF lokuslari (rapordan; genisletilebilir liste):
  - chr3:32781045 (GSE235818 OUD Welch-% q=0.0076) — coverage-agirlikli yeniden testte
    (S2.4) ve IKI bagimsiz kohortta (GSE98203 S2.5; GSE164822 S2.5b) REPLIKE OLMADI.
  (Raporda baska bir adlandirilmis non-replike beyin KESIF lokusu yok; baska madde
   kohortlari ya NULL/min-q yuksek ya da kan dokusu olup bulk-vs-sorted ayrimi tasimaz.
   Yeni bir non-replike beyin lokusu eklenirse DISCOVERY_LOCI'ya tek satirla eklenir.)

Veri kaynaklari:
  - GSE164822 (bulk): crossval JSON'un region_probes_tested bloku. Bu JSON, ~1GB'lik
    GSE164822_M_final.txt.gz matrisinden GitHub Actions'ta (.github/workflows/crossval_gse164822.yml)
    opioid_chr3_crossval_gse164822.py ile YENIDEN URETILIR ve repoya commit edilir; per-prob
    delta_M/p/fdr_region oradan AYNEN alinir, yeniden uydurma yok. Hangi CI kosusunda uretildigi
    JSON'daki crossval_provenance (run id/url) ile izlenir ve bu betigin ciktisina tasinir.
  - GSE98203 (sorted neuron): yerel beta matrisinden pencere proplari YERINDE yeniden
    hesaplanir (beta ~ heroin + age(z) + sex, OLS; ana DMP modeliyle ayni); pencere-ici BH-FDR.
  - GSE235818 (sorted neuron, KESIF): bisulfit matriste pozisyon-aramasiyla coverage.

Per-prob yargi (cg20100151 ile birebir tutarli):
  - bulk region-FDR<0.05 VE sorted-noron(GSE98203) tested & p>=0.05
       -> COHORT_SPECIFIC_dlPFC_BULK_ONLY  (hucre-tipi/bolge karistirici adayi, FLAGGED)
  - bulk region-FDR<0.05 VE sorted-noron p<0.05 (ayni yon)  -> REPLICATES_BULK_AND_NEURON
  - sorted-noron region-FDR<0.05 VE bulk degil  -> NEURON_ONLY
  - bulk sig VE sorted-noron olculmemis/array'de yok  -> BULK_SIG_NEURON_NOT_COVERED
  - hicbiri anlamli degil  -> NULL_REGION

Zero-hallucination: GSE98203/GSE235818 yerelde uretilir; GSE164822 committed JSON'dan
  aynen alinir; tum girdi SHA-256'lari kaydedilir.
Cikti: out/window_artifact_scan.json
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
OUT = os.path.join(OUTDIR, "window_artifact_scan.json")

WINDOW_BP = 2000

# Rapordaki non-replike KESIF lokuslari. Genisletilebilir: yeni bir non-replike beyin
# lokusu eklenirse buraya tek bir kayit eklenir (kohort baglantisi otomatik calisir).
DISCOVERY_LOCI = [
    {
        "name": "chr3:32781045",
        "chrom": "chr3",
        "pos_hg38": 32781045,
        "substance": "opioid (OUD)",
        "discovery_cohort": "GSE235818 (OFC NeuN+ neuron, bisulfite)",
        "discovery_finding": "OUD'da -2.3 puan hipometilasyon, Welch-% q_BH=0.0076; coverage-agirlikli "
                             "yeniden testte (S2.4) ve GSE98203 (S2.5) + GSE164822 (S2.5b) capraz-dogrulamasinda "
                             "REPLIKE OLMADI.",
    },
]


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def bh_fdr(pvals):
    """Benjamini-Hochberg FDR (pencere-ici)."""
    p = np.asarray(pvals, dtype=float)
    n = len(p)
    order = np.argsort(p)
    ranked = p[order] * n / (np.arange(n) + 1)
    # monoton (asagidan yukari minimum)
    ranked = np.minimum.accumulate(ranked[::-1])[::-1]
    out = np.empty(n)
    out[order] = np.clip(ranked, 0, 1)
    return out


def load_region_probes(locus):
    """Manifest TSV'den lokusun +-WINDOW_BP penceresindeki proplari (her iki array) yukle."""
    reg = pd.read_csv(REGION_TSV, sep="\t")
    reg = reg[reg["CpG_chrm"] == locus["chrom"]].copy()
    reg["dist"] = (reg["CpG_beg"] - locus["pos_hg38"]).abs()
    reg = reg[reg["dist"] <= WINDOW_BP]
    return reg


def gse164822_bulk(probes_epic):
    """dlPFC BULK per-prob sonuclarini committed crossval JSON'dan aynen aktar."""
    with open(GSE164822_JSON) as f:
        d = json.load(f)
    by_probe = {r["probe"]: r for r in d["region_probes_tested"]}
    res = {}
    for p in probes_epic:
        r = by_probe.get(p)
        if r is None:
            res[p] = {"status": "NOT_IN_JSON"}
            continue
        res[p] = {
            "status": "TESTED",
            "delta_M_opioids_minus_ctrl": r["delta_M_opioids_minus_ctrl"],
            "t": r["t"], "p": r["p"], "fdr_region": r["fdr_region"],
            "significant_region_fdr05": bool(r["fdr_region"] < 0.05),
            "direction_hypo_in_case": bool(r["delta_M_opioids_minus_ctrl"] < 0),
        }
    return (res, d.get("input_files_sha256", {}),
            d["validation_dataset"].get("design_aligned", {}),
            d.get("crossval_provenance", {"recomputed_in_ci": False,
                                          "note": "no crossval_provenance in JSON"}))


def gse98203_sorted_neuron(probes_hm450):
    """GSE98203 (OFC sorted neuron, 450K) pencere proplarini YERINDE yeniden hesapla."""
    probeset = set(probes_hm450)
    # fenotip
    pheno = pd.read_csv(GSE98203_PHENO)
    pheno["of"] = pheno["of"].astype(str)
    pheno = pheno[pheno["cohort"].isin(["HEROIN", "CONTROL"])].copy()
    pheno["sex"] = pheno["gender"].astype(str).str.upper().str.replace("?", "", regex=False).str[0]
    pheno = pheno[pheno["sex"].isin(["M", "F"])]
    pheno["age"] = pd.to_numeric(pheno["age"], errors="coerce")
    pheno = pheno.dropna(subset=["age"])

    # yalnizca gerekli prop satirlarini streaming oku (matris ~340MB)
    with gzip.open(GSE98203_DATA, "rt") as f:
        header = f.readline().rstrip("\n").split("\t")
        beta_idx = [(i, c) for i, c in enumerate(header[1:], start=1)
                    if not c.endswith("_Detection_PVal")]
        sample_cols = [c.strip() for _, c in beta_idx]
        rows = {}
        need = set(probeset)
        for line in f:
            tab = line.find("\t")
            if tab < 0:
                continue
            pid = line[:tab]
            if pid not in need:
                continue
            parts = line.rstrip("\n").split("\t")
            vals = []
            for i, _ in beta_idx:
                v = parts[i] if i < len(parts) else ""
                vals.append(float(v) if v not in ("", "NA") else np.nan)
            rows[pid] = vals
            need.discard(pid)
            if not need:
                break

    df = pd.DataFrame.from_dict(rows, orient="index", columns=sample_cols)
    common = [c for c in sample_cols if c in set(pheno["of"])]
    ph = pheno[pheno["of"].isin(common)].set_index("of").loc[common]
    g = (ph["cohort"].to_numpy() == "HEROIN").astype(float)
    age = ph["age"].to_numpy(dtype=float); age = (age - age.mean()) / age.std()
    sex = (ph["sex"].to_numpy() == "M").astype(float)

    res = {}
    pvals = []
    tested_probes = []
    for p in probes_hm450:
        if p not in df.index:
            res[p] = {"status": "ABSENT_IN_MATRIX"}
            continue
        y = df.loc[p, common].to_numpy(dtype=float)
        if np.isnan(y).any():
            res[p] = {"status": "NaN_IN_SAMPLES"}
            continue
        X = np.column_stack([np.ones(len(g)), g, age, sex])
        n, k = X.shape
        XtX_inv = np.linalg.inv(X.T @ X)
        dof = n - k
        B = XtX_inv @ X.T @ y
        resid = y - X @ B
        sigma2 = (resid ** 2).sum() / dof
        se = np.sqrt(sigma2 * XtX_inv[1, 1])
        coef = float(B[1]); t = coef / se if se > 0 else np.nan
        pv = float(2 * stats.t.sf(abs(t), dof)) if np.isfinite(t) else np.nan
        res[p] = {
            "status": "TESTED",
            "delta_beta_heroin_minus_ctrl": round(coef, 5),
            "mean_beta_heroin": round(float(y[g == 1].mean()), 4),
            "mean_beta_control": round(float(y[g == 0].mean()), 4),
            "t": round(float(t), 4), "p": pv,
            "significant_p05": bool(pv < 0.05),
            "direction_hypo_in_case": bool(coef < 0),
        }
        pvals.append(pv); tested_probes.append(p)
    # pencere-ici BH-FDR
    if pvals:
        fdr = bh_fdr(pvals)
        for p, q in zip(tested_probes, fdr):
            res[p]["fdr_region"] = round(float(q), 4)
            res[p]["significant_region_fdr05"] = bool(q < 0.05)
    design = {"HEROIN": int(g.sum()), "CONTROL": int((g == 0).sum())}
    return res, design


def gse235818_coverage(reg_probes):
    """Pencere proplarinin CpG'lerini GSE235818 bisulfit matriste TEK gecisle ara."""
    # her array probu icin bisulfit C pozisyonlari = CpG_beg+1, CpG_beg+2
    targets = {}  # pos -> set(probe)
    probe_targets = {}  # probe -> (p1,p2)
    for _, r in reg_probes.iterrows():
        p1, p2 = int(r["CpG_beg"]) + 1, int(r["CpG_beg"]) + 2
        probe_targets.setdefault(r["Probe_ID"], (p1, p2))
        targets.setdefault(p1, set()).add(r["Probe_ID"])
        targets.setdefault(p2, set()).add(r["Probe_ID"])

    found = {}  # pos -> info
    measured_positions = []
    with gzip.open(GSE235818_BS, "rt") as f:
        f.readline()  # header
        for line in f:
            if not line.startswith('"chr3"'):
                continue
            parts = line.split(",", 4)
            try:
                pos = int(parts[1])
            except (ValueError, IndexError):
                continue
            measured_positions.append(pos)
            if pos in targets:
                strand = parts[3].strip('"')
                vals = [float(x) if x.strip() not in ("", "NA") else np.nan
                        for x in line.rstrip("\n").split(",")[4:]]
                found[pos] = {"strand": strand, "mean_pct": round(float(np.nanmean(vals)), 4)}
    measured_arr = np.array(sorted(set(measured_positions))) if measured_positions else np.array([])

    res = {}
    for probe, (p1, p2) in probe_targets.items():
        hit = found.get(p1) or found.get(p2)
        if hit:
            res[probe] = {"status": "COVERED", "cpg_info": hit}
        else:
            if measured_arr.size:
                idx = int(np.argmin(np.abs(measured_arr - p1)))
                nearest = int(measured_arr[idx]); dist = abs(nearest - p1)
            else:
                nearest, dist = None, None
            res[probe] = {"status": "NOT_COVERED",
                          "nearest_measured_cpg_pos": nearest,
                          "nearest_measured_cpg_dist_bp": dist}
    return res


def classify(bulk, neuron, neuron_cov):
    """cg20100151 ile birebir yargi mantigi (per-prob)."""
    bulk_tested = bulk.get("status") == "TESTED"
    bulk_sig = bool(bulk_tested and bulk.get("significant_region_fdr05"))
    neuron_tested = neuron.get("status") == "TESTED"
    neuron_sig_p = bool(neuron_tested and neuron.get("significant_p05"))
    neuron_sig_fdr = bool(neuron_tested and neuron.get("significant_region_fdr05"))
    neuron_covered_bs = neuron_cov.get("status") == "COVERED"

    if bulk_sig and neuron_tested and not neuron_sig_p:
        return "COHORT_SPECIFIC_dlPFC_BULK_ONLY", True
    if bulk_sig and neuron_sig_p:
        return "REPLICATES_BULK_AND_NEURON", False
    if (not bulk_sig) and neuron_sig_fdr:
        return "NEURON_ONLY", False
    if bulk_sig and (not neuron_tested) and (not neuron_covered_bs):
        return "BULK_SIG_NEURON_NOT_COVERED", True
    if bulk_sig and (not neuron_tested) and neuron_covered_bs:
        # array'de yok ama bisulfitte olculmus; sorted-noron array sonucu yok -> belirsiz bulk-only
        return "BULK_SIG_NEURON_NOT_ON_ARRAY", True
    return "NULL_REGION", False


def scan_locus(locus):
    reg = load_region_probes(locus)
    probes_hm450 = reg[reg["array"] == "HM450"]["Probe_ID"].tolist()
    probes_epic = reg[reg["array"] == "EPIC"]["Probe_ID"].tolist()
    all_probes = sorted(set(probes_hm450) | set(probes_epic))

    # prob -> hg38 CpG_beg ve hedefe uzaklik
    coords = {}
    for _, r in reg.iterrows():
        coords[r["Probe_ID"]] = {"cpg_beg": int(r["CpG_beg"]),
                                 "dist_to_target_bp": int(abs(r["CpG_beg"] - locus["pos_hg38"]))}

    bulk_res, bulk_sha, bulk_design, bulk_prov = gse164822_bulk(probes_epic)
    neuron_res, neuron_design = gse98203_sorted_neuron(probes_hm450)
    cov_res = gse235818_coverage(reg.drop_duplicates(subset=["Probe_ID"]))

    probe_rows = []
    flagged = []
    for p in all_probes:
        bulk = bulk_res.get(p, {"status": "NOT_ON_EPIC"})
        neuron = neuron_res.get(p, {"status": "NOT_ON_HM450"})
        cov = cov_res.get(p, {"status": "UNKNOWN"})
        verdict, is_flag = classify(bulk, neuron, cov)
        row = {
            "probe": p,
            "hg38": f"{locus['chrom']}:{coords[p]['cpg_beg']}",
            "dist_to_target_bp": coords[p]["dist_to_target_bp"],
            "is_discovery_cpg": False,  # pencere proplari KESIF CpG'si degildir
            "GSE164822_dlPFC_BULK": bulk,
            "GSE98203_OFC_sorted_neuron": neuron,
            "GSE235818_OFC_sorted_neuron_bisulfite_coverage": cov,
            "verdict": verdict,
            "bulk_only_artifact_flag": is_flag,
        }
        probe_rows.append(row)
        if is_flag:
            flagged.append({"probe": p, "hg38": row["hg38"],
                            "dist_to_target_bp": row["dist_to_target_bp"],
                            "verdict": verdict,
                            "bulk_delta_M": bulk.get("delta_M_opioids_minus_ctrl"),
                            "bulk_p": bulk.get("p"), "bulk_fdr_region": bulk.get("fdr_region"),
                            "neuron_status": neuron.get("status"),
                            "neuron_p": neuron.get("p"),
                            "neuron_delta_beta": neuron.get("delta_beta_heroin_minus_ctrl")})

    probe_rows.sort(key=lambda r: r["dist_to_target_bp"])
    return {
        "locus": locus,
        "window_bp": WINDOW_BP,
        "n_probes_in_window": len(all_probes),
        "cohort_designs": {
            "GSE164822_dlPFC_BULK": bulk_design,
            "GSE98203_OFC_sorted_neuron": neuron_design,
        },
        "probes": probe_rows,
        "bulk_only_artifacts_flagged": flagged,
        "n_bulk_only_artifacts": len(flagged),
        "bulk_crossval_provenance": bulk_prov,
        "_bulk_sha": bulk_sha,
    }


def main():
    results = [scan_locus(locus) for locus in DISCOVERY_LOCI]

    # tum committed-bulk SHA'lari birlestir
    bulk_sha = {}
    for r in results:
        bulk_sha.update(r.pop("_bulk_sha"))

    total_flagged = sum(r["n_bulk_only_artifacts"] for r in results)
    # BULK kohortunun (GSE164822) per-prob sayilari hangi CI kosusunda 1GB matristen
    # yeniden uretildi? Her lokusun crossval_provenance'i ayni JSON'dan gelir; ilkini ozetle.
    bulk_prov = results[0].get("bulk_crossval_provenance") if results else None
    out = {
        "analysis": "Systematic edge-of-window nearby-probe scan for bulk-tissue-only false "
                    "signals near non-replicating discovery loci (generalizes the cg20100151 case).",
        "method": ("Her non-replike KESIF lokusunun +-2kb penceresindeki TUM proplar baglanmis OUD "
                   "beyin kohortlarinda test edilir; YALNIZCA BULK dokuda (GSE164822 dlPFC) anlamli "
                   "olup sorted-noron kohortunda (GSE98203) anlamsiz olan proplar cg20100151 ile ayni "
                   "yargi mantigiyla COHORT_SPECIFIC_dlPFC_BULK_ONLY olarak isaretlenir."),
        "wired_up_cohorts": {
            "GSE164822": "dlPFC, EPIC, M-value, BULK tissue (no FACS)",
            "GSE98203": "OFC, 450K, beta, FACS-sorted PURE NEURONS (NeuN+)",
            "GSE235818": "OFC, bisulfite %meth, FACS-sorted PURE NEURONS (NeuN+, discovery cohort)",
        },
        "n_discovery_loci_scanned": len(DISCOVERY_LOCI),
        "total_bulk_only_artifacts_flagged": total_flagged,
        "bulk_crossval_provenance": bulk_prov,
        "results": results,
        "input_files_sha256": {
            "region_probes_chr3_32781045_hg38.tsv": sha256(REGION_TSV),
            "GSE98203_beta.txt.gz": sha256(GSE98203_DATA),
            "GSE98203_pheno.csv": sha256(GSE98203_PHENO),
            "GSE235818_Meth.csv.gz": sha256(GSE235818_BS),
            "GSE235818_chr3_32781045_crossval_GSE164822.json": sha256(GSE164822_JSON),
            **{f"GSE164822_committed::{k}": v for k, v in bulk_sha.items()},
        },
    }
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f"Scanned {len(DISCOVERY_LOCI)} non-replicating discovery loci.")
    for r in results:
        loc = r["locus"]["name"]
        print(f"\n=== {loc} (window +-{WINDOW_BP} bp, {r['n_probes_in_window']} probes) ===")
        for row in r["probes"]:
            b = row["GSE164822_dlPFC_BULK"]; nrn = row["GSE98203_OFC_sorted_neuron"]
            print(f"  {row['probe']:<12} {row['hg38']:<18} d={row['dist_to_target_bp']:>4}bp  "
                  f"bulk_FDR={b.get('fdr_region')}  neuron_p={nrn.get('p')}  -> {row['verdict']}")
        print(f"  FLAGGED bulk-only artifacts: {r['n_bulk_only_artifacts']}")
        for fl in r["bulk_only_artifacts_flagged"]:
            print(f"    * {fl['probe']} @ {fl['hg38']} ({fl['dist_to_target_bp']} bp): {fl['verdict']}")
    print(f"\nTOTAL bulk-only artifacts across all loci: {total_flagged}")
    if bulk_prov and bulk_prov.get("recomputed_in_ci"):
        print(f"BULK (GSE164822) crossval recomputed in CI run "
              f"{bulk_prov.get('github_run_id')} ({bulk_prov.get('run_url')})")
    else:
        print("BULK (GSE164822) crossval provenance: NOT recomputed in CI "
              "(committed JSON; run .github/workflows/crossval_gse164822.yml to refresh)")
    print("Yazildi:", OUT)


if __name__ == "__main__":
    main()
