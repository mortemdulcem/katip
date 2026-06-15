#!/usr/bin/env python3
"""
OPIOID — EPIC'e ozgu aday markerin (cg11308114) 450K bagimsiz kohortta diziler-arasi
KOORDINAT-TABANLI YAKIN-PROB VEKILI ile dogrulanmasi.

Sorun (alkol cg03301622 ile birebir ayni kor-nokta):
  GSE235818 (OUD kesfi, bisülfit, OFC NeuN+ neuron) chr3:32781045'te hipometilasyon
  buldu. Bu kesif penceresinde (chr3:32779045-32783045) yer alan **cg11308114** probu
  EPIC dizisine OZGUdur — 450K (GPL13534) manifestinde ve dolayisiyla 450K bagimsiz
  kohort GSE98203'un DMP tablosunda AYNI-PROB olarak YOKtur. Eskiden bu prob 450K
  kohortta "anchor yok" diye hic test edilemiyordu.

Cozum (paylasilan crossarray_proxy modulu):
  cg11308114'un hg38 konumu (chr3:32780437; Zhou-lab sesame EPIC.hg38 manifesti,
  region_probes TSV'sinden) yerel UCSC chain ile hg19'a liftover edilir; bu hg19
  anchor'inin ±2 kb'sindeki, GSE98203'te (450K) test edilmis 450K proplari vekil olarak
  degerlendirilir. En yakin vekil-prob kesif yonu (hipo, isaret=-1) ile ayni yonde VE
  nominal p<0.05 ise REPLICATES_VIA_PROXY; degilse DOES_NOT_REPLICATE_VIA_PROXY; pencerede
  test edilmis hic 450K prob yoksa NOT_MEASURABLE_ON_INDEPENDENT_COHORT (gercek 450K
  kapsam bosulugu; en yakin prob mesafesi raporlanir).

Bagimsiz kohort GSE98203: OFC FACS ile ayristirilmis NORONAL cekirdekler (GSE235818 ile
  ayni doku ailesi), Illumina 450K, heroin vs kontrol; cg-anahtarli out/GSE98203_dmp.csv.

Zero-hallucination: tum sayilar gercek hesaptan; girdi SHA-256'lari kaydedilir; uydurma
  metodoloji/veri/referans yoktur. Cikti: human/opioid/out/opioid_crossarray_proxy_validation.json
"""
import os, csv, sys, json
import numpy as np
from pyliftover import LiftOver

HERE = os.path.dirname(os.path.abspath(__file__))
RD = os.path.dirname(os.path.dirname(HERE))  # scripts/revize/realdata
sys.path.insert(0, RD)
# Diziler-arasi yakin-prob vekili — paylasilan modul (alkol betiginden cikarildi).
from crossarray_proxy import (  # noqa: E402
    sha256, load_450k_chr_pos, lift_hg38_to_hg19, nearest_probe, build_window,
)

GSE98203_DMP = os.path.join(RD, "out", "GSE98203_dmp.csv")
REGION_TSV = os.path.join(HERE, "manifest", "region_probes_chr3_32781045_hg38.tsv")
MANIFEST_450K = os.path.join(RD, "data", "GPL13534_manifest.csv.gz")
CHAIN_HG38_TO_HG19 = os.path.join(RD, "data", "hg38ToHg19.over.chain.gz")
OUTDIR = os.path.join(HERE, "out"); os.makedirs(OUTDIR, exist_ok=True)
OUT = os.path.join(OUTDIR, "opioid_crossarray_proxy_validation.json")

WINDOW_BP = 2000
FDR_THR = 0.05
DELTA_FIELD = "delta_beta_heroin_minus_control"

# Hedef: EPIC'e ozgu prob (450K'da yok), GSE235818 OUD kesif penceresinde.
# hg38 konumu region_probes TSV'sinden (CpG_beg) — alkol betigiyle ayni konvansiyon.
TARGET_PROBE = "cg11308114"

# Kesif yonu: GSE235818 chr3:32781045 OUD'de HIPOmetile (delta=-2.3 pct) -> isaret -1.
DISCOVERY = {
    "accession": "GSE235818",
    "tissue": "OFC NeuN+ neuronal nuclei",
    "assay": "bisulfite-seq % methylation",
    "design": "12 OUD vs 26 control",
    "locus_hg38": "chr3:32781045",
    "finding": "chr3:32781045 hypomethylated in OUD, delta=-2.3 pct, q_BH=0.0076 (Welch on %)",
    "coverage_weighted_reanalysis": "NOT_CONFIRMED (SUBSTANCE_DMP_REPORT.md S2.4); "
                                    "the EPIC-only cg11308114 in this window had never been "
                                    "testable on any 450K cohort -> cross-array proxy added here.",
    "direction": "hypo",
}
DISC_SIGN = -1.0


def load_gse98203_dmp():
    """out/GSE98203_dmp.csv -> {cg: {delta_field, t, p, fdr, rank}}; toplam test sayisi."""
    d = {}
    with open(GSE98203_DMP, newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            d[row["cg"]] = {
                DELTA_FIELD: float(row[DELTA_FIELD]),
                "t": float(row["t"]),
                "p": float(row["p"]),
                "fdr": float(row["fdr"]),
                "rank": int(row["rank"]),
            }
    return d


def load_target_hg38(tsv_path, probe):
    """region_probes TSV'sinden hedef probun EPIC hg38 konumunu (CpG_beg) oku.
    Probun EPIC'te VAR, HM450'de YOK oldugunu da dogrula (EPIC'e ozgu kaniti)."""
    on_epic = False
    on_450k = False
    hg38 = None
    with open(tsv_path, newline="") as f:
        r = csv.DictReader(f, delimiter="\t")
        for row in r:
            if row["Probe_ID"] != probe:
                continue
            if row["array"] == "EPIC":
                on_epic = True
                hg38 = f"{row['CpG_chrm']}:{int(row['CpG_beg'])}"
            elif row["array"] == "HM450":
                on_450k = True
    return hg38, on_epic, on_450k


def main():
    g98 = load_gse98203_dmp()
    n_tested = len(g98)

    target_hg38, on_epic, on_450k = load_target_hg38(REGION_TSV, TARGET_PROBE)
    if target_hg38 is None or not on_epic:
        raise SystemExit(f"{TARGET_PROBE} EPIC hg38 konumu region TSV'de bulunamadi.")

    # EPIC'e ozgu olma kaniti: GSE98203 (450K) DMP'sinde AYNI-PROB olarak da yok.
    same_probe_in_450k_cohort = TARGET_PROBE in g98

    chrom = target_hg38.split(":")[0]
    coords450 = load_450k_chr_pos(MANIFEST_450K, chroms={chrom})

    # GPL13534 (450K) manifestinde AYNI-PROB var mi? (EPIC'e ozgu olmasi -> olmamali)
    on_450k_manifest_gpl = TARGET_PROBE in coords450

    lo = LiftOver(CHAIN_HG38_TO_HG19)

    rec = {
        "probe": TARGET_PROBE,
        "hg38": target_hg38,
        "epic_only_evidence": {
            "on_EPIC_manifest": bool(on_epic),
            "on_HM450_region_tsv": bool(on_450k),
            "in_GPL13534_450k_manifest": bool(on_450k_manifest_gpl),
            "in_GSE98203_450k_cohort_dmp": bool(same_probe_in_450k_cohort),
            "conclusion": "EPIC-only" if (on_epic and not on_450k_manifest_gpl
                                          and not same_probe_in_450k_cohort) else "NOT_EPIC_only",
        },
        "discovery_GSE235818": DISCOVERY,
        "independent_GSE98203_same_probe": (g98.get(TARGET_PROBE)
                                            if same_probe_in_450k_cohort else None),
    }

    if same_probe_in_450k_cohort:
        # Beklenmedik: prob 450K kohortta varsa proxy gerekmez; ayni-prob testi yap.
        same = g98[TARGET_PROBE]
        rep_sign = np.sign(same[DELTA_FIELD])
        same_direction = bool(rep_sign == DISC_SIGN and DISC_SIGN != 0)
        nominal_sig = bool(same["p"] < 0.05)
        rec["verdict"] = "REPLICATES" if (same_direction and nominal_sig) else "DOES_NOT_REPLICATE"
        rec["verdict_reason"] = (
            f"{TARGET_PROBE} GSE98203'te AYNI-PROB olarak mevcut: "
            f"Dbeta={same[DELTA_FIELD]:+.4f} (ayni_yon={same_direction}), p={same['p']:.4g}, "
            f"BH-FDR={same['fdr']:.4g}."
        )
    else:
        # EPIC'e ozgu -> koordinat-tabanli vekil.
        anchor19 = lift_hg38_to_hg19(lo, target_hg38)
        if anchor19 is None:
            rec["window_proxy_GSE98203"] = {
                "applied": False,
                "reason": f"hg38->hg19 liftover basarisiz ({target_hg38} hedef derlemede eslesmedi).",
            }
            rec["verdict"] = "NOT_MEASURABLE_ON_INDEPENDENT_COHORT"
            rec["verdict_reason"] = (
                f"{TARGET_PROBE} EPIC'e ozgu (450K'da yok); hg38 konumu hg19'a liftover "
                "edilemedi -> vekil-prob testi uygulanamadi. Sifir-halusinasyon: uydurma yok."
            )
        else:
            window = build_window(anchor19, coords450, g98, DISC_SIGN, DELTA_FIELD,
                                  target_cg=None, window_bp=WINDOW_BP, fdr_thr=FDR_THR)
            window["liftover"] = {
                "from_hg38": target_hg38,
                "to_hg19": f"{anchor19[0]}:{anchor19[1]}",
                "chain_file": "hg38ToHg19.over.chain.gz",
                "tool": "pyliftover",
            }
            rec["window_proxy_GSE98203"] = window

            if window["n_probes_in_window"] == 0:
                nb = nearest_probe(anchor19, coords450)
                nb_tested = bool(nb and nb[0] in g98)
                window["nearest_450k_probe"] = (
                    None if nb is None else {
                        "probe": nb[0], "hg19": f"{anchor19[0]}:{nb[1]}",
                        "dist_to_anchor_bp": int(nb[2]), "tested_in_GSE98203": nb_tested,
                    }
                )
                rec["verdict"] = "NOT_MEASURABLE_ON_INDEPENDENT_COHORT"
                nb_txt = (f"en yakin 450K prob {nb[0]} {int(nb[2])} bp uzakta"
                          if nb else "kromozomda 450K prob bulunamadi")
                rec["verdict_reason"] = (
                    f"{TARGET_PROBE} EPIC'e ozgu; hg38 {target_hg38} -> hg19 "
                    f"{anchor19[0]}:{anchor19[1]} liftover edildi, ancak ±{WINDOW_BP} bp pencerede "
                    f"GSE98203'te test edilmis HIC 450K prob yok ({nb_txt}). Bu, 450K dizisinin bu "
                    "bolgedeki kapsam bosulugunu gosteren GERCEK bir olcumdur (uydurma yok)."
                )
            else:
                nearest = window["window_probes"][0]
                proxy_same_dir = bool(nearest["same_direction_as_discovery"])
                proxy_nominal = bool(nearest["p"] < 0.05)
                proxy_replicates = bool(proxy_same_dir and proxy_nominal)
                window["proxy_verdict_probe"] = nearest["probe"]
                rec["verdict"] = ("REPLICATES_VIA_PROXY" if proxy_replicates
                                  else "DOES_NOT_REPLICATE_VIA_PROXY")
                rec["verdict_reason"] = (
                    f"{TARGET_PROBE} EPIC'e ozgu; hg38 {target_hg38} -> hg19 "
                    f"{anchor19[0]}:{anchor19[1]} liftover. En yakin 450K vekil-prob "
                    f"{nearest['probe']} ({nearest['dist_to_anchor_bp']} bp): "
                    f"Dbeta={nearest[DELTA_FIELD]:+.4f} (ayni_yon={proxy_same_dir}), "
                    f"p={nearest['p']:.4g}, pencere-FDR={nearest['fdr_window']:.4g}. "
                    + ("Ayni yon + nominal p<0.05 -> vekil-duzeyinde replike." if proxy_replicates
                       else "Ayni yon+nominal anlamlilik vekilde saglanmadi -> vekil-duzeyinde "
                            "replike etmiyor.")
                )

    out = {
        "analysis": "Cross-array (EPIC->450K) coordinate-based nearest-probe proxy validation of "
                    "the EPIC-only opioid candidate cg11308114 (in the GSE235818 chr3:32781045 OUD "
                    "discovery window) against an independent 450K cohort.",
        "discovery_cohort": "GSE235818 (bisulfite; OFC NeuN+ neuronal nuclei; 12 OUD vs 26 control; "
                            "chr3:32781045 hypomethylated in OUD).",
        "independent_validation_cohort": "GSE98203 (450K; OFC FACS-sorted NEURONAL nuclei; heroin vs "
                                         "control; independent subjects/platform/lab).",
        "validation_criterion": "EPIC-only probe (absent on 450K array AND absent from the GSE98203 "
                                "450K DMP): hg38->hg19 liftover anchor, then the nearest 450K probe "
                                "within +/-2 kb tested in GSE98203 is the proxy -> same direction as "
                                "discovery (hypo) AND nominal p<0.05 -> REPLICATES_VIA_PROXY, else "
                                "DOES_NOT_REPLICATE_VIA_PROXY; if no 450K probe within +/-2 kb of the "
                                "lifted anchor -> NOT_MEASURABLE_ON_INDEPENDENT_COHORT (real 450K "
                                "coverage gap, nearest-probe distance reported).",
        "shared_module": "scripts/revize/realdata/crossarray_proxy.py (same code path as the alcohol "
                         "cross-region validation; alcohol output is byte-identical after refactor).",
        "liftover": {
            "chain_file": "hg38ToHg19.over.chain.gz",
            "source": "UCSC goldenPath/hg38/liftOver",
            "tool": "pyliftover",
            "note": "1-based input/output; pyliftover is 0-based so pos-1 in, +1 out.",
        },
        "window_bp": WINDOW_BP,
        "n_probes_tested_GSE98203": n_tested,
        "verdict": rec["verdict"],
        "result": rec,
        "input_files_sha256": {
            "GSE98203_dmp.csv": sha256(GSE98203_DMP),
            "region_probes_chr3_32781045_hg38.tsv": sha256(REGION_TSV),
            "GPL13534_manifest.csv.gz": sha256(MANIFEST_450K),
            "hg38ToHg19.over.chain.gz": sha256(CHAIN_HG38_TO_HG19),
        },
    }
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f"GSE98203'te test edilen prob: {n_tested}")
    print(f"Hedef (EPIC'e ozgu): {TARGET_PROBE} @ {target_hg38}")
    print(f"  EPIC-only kaniti: {rec['epic_only_evidence']['conclusion']}")
    wp = rec.get("window_proxy_GSE98203", {})
    if wp.get("applied"):
        print(f"  liftover -> {wp['liftover']['to_hg19']}; pencerede prob: {wp['n_probes_in_window']}")
        if wp.get("proxy_verdict_probe"):
            print(f"  vekil-prob: {wp['proxy_verdict_probe']}")
    print(f"  VERDICT: {rec['verdict']}")
    print(f"  {rec['verdict_reason']}")
    print("\nYazildi:", OUT)


if __name__ == "__main__":
    main()
