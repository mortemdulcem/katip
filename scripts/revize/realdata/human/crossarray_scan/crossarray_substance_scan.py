#!/usr/bin/env python3
"""
DIZILER-ARASI (EPIC <-> 450K) YAKIN-PROB VEKILI — DAHA FAZLA MADDE icin TARAYICI.

Amac (Task #27):
  Alkol (cg03301622, §2.1a) ve opioid (cg11308114, §2.5e) icin yazilan
  diziler-arasi koordinat-tabanli yakin-prob vekili (paylasilan modul:
  scripts/revize/realdata/crossarray_proxy.py) DIGER maddelere uygulanir.
  Olcut: bir aday marker EPIC'e OZGU (450K manifestinde AYNI-PROB olarak YOK)
  iken, ayni maddenin tek bagimsiz dogrulama kohortu eski 450K dizisindeyse,
  vekil calistirilir.

  Her madde icin iki on-kosul GERCEK veriyle otomatik dogrulanir:
    (a) EPIC'e ozgu aday marker var mi?  -> aday prob setinin GPL13534 450K
        manifestiyle kesisimi otomatik hesaplanir (uydurma yok).
    (b) Bagimsiz, AYNI-MADDE 450K kohort DMP tablosu var mi?

  Sonuc, her madde icin DURUST bir yargidir:
    * Hem (a) hem (b) saglaniyorsa -> crossarray_proxy ile vekil calistirilir
      (REPLICATES_VIA_PROXY / DOES_NOT_REPLICATE_VIA_PROXY /
      NOT_MEASURABLE_ON_INDEPENDENT_COHORT).
    * Aday EPIC'e ozgu DEGIL ama 450K kohortta AYNI-PROB mevcutsa -> ayni-prob
      replikasyon testi yapilir (REPLICATES / DOES_NOT_REPLICATE). Bu durumda
      EPIC'e-ozgu kor-nokta zaten YOKtur (NO_EPIC_ONLY_CANDIDATE).
    * Bagimsiz 450K kohort yoksa -> NO_INDEPENDENT_450K_COHORT (vekil
      uygulanamaz; en yakin gercek kohort durumu raporlanir).

Zero-hallucination: her sayi gercek dosyalardan/hesaptan; girdi SHA-256'lari
  kaydedilir; EPIC'e-ozgu durumu GPL13534 manifestine karsi OTOMATIK dogrulanir.
  Cikti: human/crossarray_scan/out/<madde>_crossarray_scan.json + birlesik ozet.
"""
import os
import sys
import csv
import gzip
import json

import numpy as np
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))     # .../human/crossarray_scan
RD = os.path.dirname(os.path.dirname(HERE))           # .../scripts/revize/realdata
sys.path.insert(0, RD)
from crossarray_proxy import sha256, load_450k_chr_pos  # noqa: E402

MANIFEST_450K = os.path.join(RD, "data", "GPL13534_manifest.csv.gz")
CHAIN_HG38_TO_HG19 = os.path.join(RD, "data", "hg38ToHg19.over.chain.gz")
OUTDIR = os.path.join(HERE, "out")
os.makedirs(OUTDIR, exist_ok=True)

WINDOW_BP = 2000
FDR_THR = 0.05


# ----------------------------------------------------------------------------
# Yardimcilar
# ----------------------------------------------------------------------------
def base_cg(probe):
    """Illumina serit/prob ekini (orn. cg07818869_BC11, ..._TC21) cikarip CIPLAK
    IlmnID'ye (cgXXXXXXXX) indirger — 450K (GPL13534) manifestinin kullandigi
    bicim. TUM diziler-arasi uyelik ve AYNI-PROB replikasyon testleri bu BAZ
    kimlik uzerinden yapilmali; aksi halde ekli her EPIC probu 450K'da YOK gibi
    gorunur (ketamin'de duzeltilen hatanin ta kendisi). Ciplak kimlik icin
    idempotenttir (ek yoksa hicbir sey degismez)."""
    return probe.split("_", 1)[0]


def load_450k_cgset(manifest_path):
    """GPL13534 450K manifestindeki TUM prob (IlmnID) kimliklerinin kumesi.
    EPIC'e-ozgu kontrolu icin AYNI-PROB uyeligini test eder. Kimlikler BAZ
    forma (base_cg) indirilir; manifest zaten ciplak oldugundan idempotenttir."""
    cgset = set()
    with gzip.open(manifest_path, "rt") as f:
        for line in f:
            if line.startswith("IlmnID,"):
                break
        for line in f:
            cg = line.split(",", 1)[0]
            if cg.startswith("cg"):
                cgset.add(base_cg(cg))
    return cgset


def load_dmp_csv(path, delta_field):
    """cg-anahtarli DMP CSV'sini {cg: {delta_field, t, p, fdr}} olarak oku.
    Anahtarlar BAZ kimlige (base_cg) indirilir ki AYNI-PROB araması ekli
    EPIC kimlikleriyle de tutarli calissin (ciplak kimlik icin idempotent)."""
    d = {}
    with open(path, newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            d[base_cg(row["cg"])] = {
                delta_field: float(row[delta_field]),
                "t": float(row["t"]),
                "p": float(row["p"]),
                "fdr": float(row.get("fdr", "nan") or "nan"),
            }
    return d


def gz_cgset(path, idcol_is_first=True):
    """gz CSV'nin ilk sutunundaki cg kimliklerinin kumesi (baslik atlanir).
    Kimlikler BAZ forma (base_cg) indirilir ki 450K uyelik karsilastirmasi ekli
    EPIC kimlikleriyle de dogru calissin (ciplak kimlik icin idempotent)."""
    s = set()
    with gzip.open(path, "rt", errors="replace") as f:
        next(f)
        for line in f:
            cg = line.split(",", 1)[0]
            if cg.startswith("cg"):
                s.add(base_cg(cg))
    return s


# ----------------------------------------------------------------------------
# MADDE KAYIT DEFTERI (registry) — her giris GERCEK dosyalara isaret eder
# ----------------------------------------------------------------------------
# discovery_candidates: (cg, discovery_delta) listesi — kesif yonu isareti delta'dan.
# cohort_dmp / cohort_delta_field: bagimsiz 450K kohort DMP (yoksa None).
def meth_entry():
    j = json.load(open(os.path.join(RD, "human", "meth", "out",
                                    "GSE293262_meth_dmp.json")))
    cands = [(r["probe"], r["delta_beta_meth_minus_ctrl"]) for r in j["top20_by_p"]]
    return {
        "substance": "methamphetamine",
        "discovery": {
            "accession": "GSE293262", "platform": "EPIC (GPL21145), AVG_Beta",
            "tissue": "peripheral blood leukocyte", "design": "4 meth vs 4 control",
            "note": "genome-wide NULL (min q_BH=0.16336); lead probe is the best "
                    "available candidate marker, not an FDR-significant hit.",
            "processed_file": os.path.join(RD, "human", "meth",
                                           "GSE293262_processed_data_Meth.csv.gz"),
        },
        "discovery_candidates": cands,
        "lead_candidate": cands[0][0],
        "cohort_dmp": os.path.join(RD, "out", "GSE154971_dmp.csv"),
        "cohort_meta": {"accession": "GSE154971", "platform": "450K (GPL13534)",
                        "tissue": "peripheral blood lymphocytes",
                        "design": "16 meth case vs 8 control"},
        "cohort_delta_field": "delta_beta_case_minus_control",
        "extra_sha": {
            "GSE293262_meth_dmp.json": os.path.join(RD, "human", "meth", "out",
                                                    "GSE293262_meth_dmp.json"),
            "GSE154971_dmp.csv": os.path.join(RD, "out", "GSE154971_dmp.csv"),
        },
    }


def ketamine_entry():
    dmp = os.path.join(RD, "out", "GSE287261_dmp.csv")
    return {
        "substance": "ketamine",
        "discovery": {
            "accession": "GSE287261", "platform": "EPIC (full ~865k coverage)",
            "tissue": "PBMC", "design": "within-subject paired (baseline vs post), "
            "16 DMPs at FDR<0.05",
            "note": "FULL EPIC coverage -> may contain EPIC-only DMP candidates "
                    "(satisfies criterion (a) in principle).",
            "dmp_file": dmp if os.path.exists(dmp) else None,
        },
        "discovery_candidates": None,   # full-EPIC DMPs (enumerated if dmp exists)
        "cohort_dmp": None,             # criterion (b) FAILS
        "cohort_meta": None,
        "cohort_delta_field": None,
        "no_cohort_reason": "No independent same-substance (ketamine) 450K cohort "
            "exists on GEO/ArrayExpress. The only public ketamine methylation array "
            "deposit is GSE287261 itself (EPIC). With no 450K ketamine cohort there is "
            "no older-array table to run the cross-array proxy against.",
        "extra_sha": {},
    }


def cannabis_entry():
    return {
        "substance": "cannabis",
        "discovery": {
            "accession": "GSE255929", "platform": "EPIC/850K (GPL21145)",
            "tissue": "peripheral blood", "design": "n=93 (CanCOLD)",
            "note": "Own EWAS DISCARDED: cannabis status labels not deposited; the only "
                    "grouping (S1/S2) is a confounded age/sex sub-cohort split "
                    "(renamed *_CONFOUNDED.csv). No usable own-analysis candidate marker.",
        },
        "discovery_candidates": None,   # no credible own candidate (confounded)
        "cohort_dmp": None,             # criterion (b) FAILS
        "cohort_meta": None,
        "cohort_delta_field": None,
        "no_cohort_reason": "No independent same-substance (cannabis) 450K cohort exists "
            "on GEO/ArrayExpress, AND the own GSE255929 EWAS is confounded/discarded, so "
            "there is neither a credible EPIC-only candidate marker nor a 450K table to "
            "validate against. Published results (PMID 40205553) are used instead "
            "(see human/.../CANNABIS_NOTE.md).",
        "extra_sha": {},
    }


REGISTRY = [meth_entry, ketamine_entry, cannabis_entry]


# ----------------------------------------------------------------------------
# Madde basina degerlendirme
# ----------------------------------------------------------------------------
def same_probe_test(cohort, cg, disc_delta, delta_field):
    """Aday prob 450K kohortta AYNI-PROB olarak varsa: yon + nominal p replikasyonu.
    Arama BAZ kimlik (base_cg) uzerinden yapilir; kohort dict'i de base_cg ile
    anahtarlandigi icin ekli EPIC kimlikleri de dogru eslesir."""
    s = cohort.get(base_cg(cg))
    if s is None:
        return None
    disc_sign = float(np.sign(disc_delta))
    coh_sign = float(np.sign(s[delta_field]))
    same_dir = bool(coh_sign == disc_sign and disc_sign != 0)
    sig = bool(s["p"] < 0.05)
    verdict = "REPLICATES" if (same_dir and sig) else "DOES_NOT_REPLICATE"
    return {
        "probe": cg,
        "discovery_delta": disc_delta,
        "discovery_sign": disc_sign,
        "cohort_" + delta_field: s[delta_field],
        "cohort_sign": coh_sign,
        "cohort_t": s["t"], "cohort_p": s["p"], "cohort_fdr": s["fdr"],
        "same_direction_as_discovery": same_dir,
        "cohort_nominal_p_lt_0.05": sig,
        "verdict": verdict,
    }


def evaluate(entry, cg450):
    out = {
        "substance": entry["substance"],
        "discovery": {k: v for k, v in entry["discovery"].items()
                      if k not in ("processed_file", "dmp_file")},
        "cohort": entry.get("cohort_meta"),
        "window_bp": WINDOW_BP, "fdr_threshold": FDR_THR,
    }
    sha = {}

    # --- (a) EPIC'e ozgu aday var mi? -------------------------------------
    epic_only_check = {"method": "candidate cg absent from GPL13534 450K manifest "
                       "(same-probe) == EPIC-only"}
    epic_only_candidates = []
    if entry["substance"] == "methamphetamine":
        # TUM kesif prob setini manifestle karsilastir -> kesin EPIC-only sayisi
        gset = gz_cgset(entry["discovery"]["processed_file"])
        n_epic_only_full = len(gset - cg450)
        epic_only_check.update({
            "discovery_n_probes_in_file": len(gset),
            "n_epic_only_in_whole_discovery_file": n_epic_only_full,
            "interpretation": ("GSE293262 processed deposit is a 450K-equivalent probe "
                               "subset: ALL probes are on the 450K manifest -> there is "
                               "NO EPIC-only methamphetamine candidate at all."),
        })
        sha[os.path.basename(entry["discovery"]["processed_file"])] = \
            sha256(entry["discovery"]["processed_file"])
        for cg, _ in entry["discovery_candidates"]:
            if base_cg(cg) not in cg450:
                epic_only_candidates.append(cg)
    elif entry["discovery_candidates"]:
        for cg, _ in entry["discovery_candidates"]:
            if base_cg(cg) not in cg450:
                epic_only_candidates.append(cg)
        epic_only_check["n_epic_only_candidates"] = len(epic_only_candidates)
    else:
        epic_only_check["note"] = "candidate markers not enumerated (see verdict reason)"

    epic_only_check["epic_only_candidates"] = epic_only_candidates
    out["epic_only_check"] = epic_only_check

    # --- (b) bagimsiz 450K kohort var mi? ---------------------------------
    if not entry.get("cohort_dmp"):
        out["verdict"] = "NO_INDEPENDENT_450K_COHORT"
        out["verdict_reason"] = entry["no_cohort_reason"]
        # Ketamin: kesif full-EPIC oldugu icin (a) ilkesel olarak saglanabilir;
        # ama (b) saglanmadigi icin vekil UYGULANAMAZ -> durust olarak NOT_MEASURABLE.
        if entry["substance"] == "ketamine":
            dmp = entry["discovery"].get("dmp_file")
            if dmp and os.path.exists(dmp):
                # GSE287261 probe ids carry an Illumina strand/probe suffix
                # (e.g. cg07818869_BC11, ..._TC21). The 450K (GPL13534) manifest
                # uses the BARE IlmnID (cgXXXXXXXX). EPIC-only membership must be
                # tested on the BASE CpG (module-level base_cg helper, shared by
                # every membership/replication comparison in this scanner),
                # otherwise every suffixed probe falsely looks absent from 450K.
                sig = []  # raw probe ids of FDR<0.05 DMPs
                with open(dmp, newline="") as f:
                    r = csv.DictReader(f)
                    for row in r:
                        if float(row.get("fdr", "1")) < 0.05:
                            sig.append(row["cg"])
                sig = sorted(set(sig))
                eo = sorted(p for p in sig if base_cg(p) not in cg450)
                on450 = sorted(p for p in sig if base_cg(p) in cg450)
                out["epic_only_check"]["method"] = (
                    "FDR<0.05 DMP whose BASE CpG (id before first '_'; the EPIC "
                    "strand suffix is stripped) is absent from the GPL13534 450K "
                    "manifest == EPIC-only")
                out["epic_only_check"]["note"] = (
                    "GSE287261 per-probe DMP table generated; EPIC-only status of "
                    "each significant DMP auto-checked against the 450K manifest. "
                    "Criterion (b) still fails (no independent 450K ketamine "
                    "cohort), so the verdict is unchanged; this concrete list would "
                    "be the markers a future 450K ketamine cohort could NOT validate.")
                out["epic_only_check"]["n_sig_dmps"] = len(sig)
                out["epic_only_check"]["n_epic_only_among_sig_dmps"] = len(eo)
                out["epic_only_check"]["epic_only_candidates"] = eo
                out["epic_only_check"]["n_sig_dmps_also_on_450k"] = len(on450)
                out["epic_only_check"]["sig_dmps_also_on_450k"] = on450
                sha[os.path.basename(dmp)] = sha256(dmp)
                sha[os.path.basename(MANIFEST_450K)] = sha256(MANIFEST_450K)
            else:
                out["epic_only_check"]["note"] = (
                    "GSE287261 per-probe DMP table not generated in this environment "
                    "(requires the large supplementary CSV). Criterion (b) already "
                    "fails, so enumerating EPIC-only candidates would not change the "
                    "verdict; reported honestly rather than fabricated.")
        out["input_files_sha256"] = sha
        return out

    # --- Hem (a) hem (b): kohort yuklu; aday EPIC'e ozgu mu? --------------
    delta_field = entry["cohort_delta_field"]
    cohort = load_dmp_csv(entry["cohort_dmp"], delta_field)
    for k, p in entry.get("extra_sha", {}).items():
        sha[k] = sha256(p)
    sha[os.path.basename(MANIFEST_450K)] = sha256(MANIFEST_450K)

    lead = entry["lead_candidate"]
    lead_delta = dict(entry["discovery_candidates"])[lead]

    if not epic_only_candidates:
        # EPIC'e-ozgu kor-nokta YOK -> ayni-prob replikasyon testi (gercek yargi)
        spt = same_probe_test(cohort, lead, lead_delta, delta_field)
        out["verdict"] = "NO_EPIC_ONLY_CANDIDATE"
        out["verdict_reason"] = (
            "Every discovery candidate (and indeed the entire discovery deposit) is "
            "present on the 450K array, so the EPIC-only blind spot does not exist for "
            "this substance and the coordinate proxy is unnecessary. The lead candidate "
            "is therefore tested SAME-PROBE in the independent 450K cohort.")
        out["same_probe_test"] = spt
    else:
        # EPIC'e-ozgu aday + 450K kohort -> VEKIL (liftover) calistir.
        out["verdict"] = "PROXY_REQUIRED"
        out["verdict_reason"] = ("EPIC-only candidate(s) present with an independent 450K "
                                 "cohort; run coordinate proxy.")
        out["epic_only_candidates_for_proxy"] = epic_only_candidates
        # NOT: bu dal su an kayittaki maddeler icin tetiklenmiyor; tetiklenirse
        # crossarray_proxy.lift_hg38_to_hg19 + build_window kullanilir (pyliftover
        # ve EPIC.hg38 manifest gerekir). Tasarim geriye-donuk uyumlu birakildi.

    out["input_files_sha256"] = sha
    return out


def _base_cg(x):
    """EPIC strand/probe suffix'ini (ilk '_' sonrasi) atip BASE CpG kimligini dondur."""
    return x.split("_", 1)[0]


def run_ketamine_selfcheck():
    """Strand-suffix esleme muhafizi (Task #30).

    GSE287261 prob kimlikleri Illumina sarmal son-eki tasir (cgXXXX_BC11, _TC21);
    450K (GPL13534) manifesti CIPLAK IlmnID kullanir. EPIC'e-ozgu uyelik BASE CpG
    uzerinden test edilmezse 16 anlamli DMP'nin TAMAMI yanlislikla "yeni-diziye-ozgu"
    diye isaretlenir (gercek sayi 9). Bu muhafiz, ketamin taramasinin dogru sayilari
    (16 / 9 / 7) uretmeye devam ettigini ve bu sayilari URETEN seyin base-CpG (son-ek
    soyulmus) esleme oldugunu otomatik dogrular.

    Gercek girdiler yoksa SADECE atlanir (exit 0). Herhangi bir sayi/uyelik drifti
    veya base-CpG eslemesinin kaldirilmasi durumunda GURULTULU basarisiz olur (exit 1).
    """
    if not os.path.exists(MANIFEST_450K):
        print(f"SKIP: 450K manifest yok ({MANIFEST_450K}); muhafiz atlandi "
              "(drift yok demek degil).", flush=True)
        return 0
    entry = ketamine_entry()
    dmp = entry["discovery"].get("dmp_file")
    if not dmp or not os.path.exists(dmp):
        print("SKIP: GSE287261 DMP tablosu yok (buyuk ek dosya gerekli); muhafiz "
              "atlandi (drift yok demek degil).", flush=True)
        return 0

    print("loading GPL13534 450K manifest cg-set ...", flush=True)
    cg450 = load_450k_cgset(MANIFEST_450K)
    print(f"  450K manifest probes: {len(cg450):,}", flush=True)

    res = evaluate(entry, cg450)
    eoc = res["epic_only_check"]
    errors = []

    expected_counts = {
        "n_sig_dmps": 16,
        "n_epic_only_among_sig_dmps": 9,
        "n_sig_dmps_also_on_450k": 7,
    }
    for key, want in expected_counts.items():
        got = eoc.get(key)
        if got != want:
            errors.append(f"{key}: beklenen {want}, gelen {got}")

    # 7 "also on 450K" BASE CpG manifestte VAR olmali; 9 EPIC-only BASE CpG YOK olmali.
    for p in eoc.get("sig_dmps_also_on_450k", []):
        if _base_cg(p) not in cg450:
            errors.append(f"'also-on-450k' prob {p} base CpG {_base_cg(p)} manifestte YOK")
    for p in eoc.get("epic_only_candidates", []):
        if _base_cg(p) in cg450:
            errors.append(f"'EPIC-only' prob {p} base CpG {_base_cg(p)} manifestte VAR")

    # Karsi-test: son-ek soyulmadan (HAM kimlikle) eslersek 16'nin TAMAMI yanlislikla
    # EPIC-only gorunur. Bu, dogru 9/7 ayriminin base-CpG eslemesinden geldigini kanitlar.
    sig = sorted(set(eoc.get("sig_dmps_also_on_450k", []) +
                     eoc.get("epic_only_candidates", [])))
    if not any("_" in p for p in sig):
        errors.append("anlamli DMP'lerde strand son-eki yok; muhafiz konu disi "
                      "(GSE287261 kimlik formati degismis olabilir)")
    naive_epic_only = [p for p in sig if p not in cg450]   # HAM kimlik, soyma YOK
    if len(naive_epic_only) != len(sig):
        errors.append(f"karsi-test bozuldu: HAM-kimlik eslemesi artik tum {len(sig)} "
                      f"probu EPIC-only isaretlemiyor ({len(naive_epic_only)}); "
                      "son-ek muhafizi gereksizlesmis olabilir")

    if errors:
        print("KETAMINE STRAND-SUFFIX MUHAFIZI BASARISIZ:", flush=True)
        for e in errors:
            print("  - " + e, flush=True)
        return 1

    print("KETAMINE STRAND-SUFFIX MUHAFIZI GECTI:", flush=True)
    print(f"  n_sig_dmps={eoc['n_sig_dmps']}, "
          f"n_epic_only_among_sig_dmps={eoc['n_epic_only_among_sig_dmps']}, "
          f"n_sig_dmps_also_on_450k={eoc['n_sig_dmps_also_on_450k']}", flush=True)
    print(f"  base-CpG (son-ek soyulmus) esleme dogru 9/7 ayrimini uretiyor; "
          f"HAM-kimlik eslemesi tum {len(sig)} probu yanlislikla EPIC-only sayardi.",
          flush=True)
    return 0


def main():
    print("loading GPL13534 450K manifest cg-set ...", flush=True)
    cg450 = load_450k_cgset(MANIFEST_450K)
    print(f"  450K manifest probes: {len(cg450):,}", flush=True)

    summary = []
    for fn in REGISTRY:
        entry = fn()
        res = evaluate(entry, cg450)
        path = os.path.join(OUTDIR, f"{entry['substance']}_crossarray_scan.json")
        with open(path, "w") as f:
            json.dump(res, f, indent=2)
        print(f"\n=== {entry['substance']} -> {res['verdict']} ===", flush=True)
        print(f"  {res.get('verdict_reason', '')[:140]}", flush=True)
        if "same_probe_test" in res:
            spt = res["same_probe_test"]
            print(f"  same-probe {spt['probe']}: cohort p={spt['cohort_p']:.4g}, "
                  f"same_dir={spt['same_direction_as_discovery']} -> {spt['verdict']}",
                  flush=True)
        summary.append({"substance": entry["substance"], "verdict": res["verdict"],
                        "json": os.path.relpath(path, RD)})
        print(f"  written: {os.path.relpath(path, RD)}", flush=True)

    with open(os.path.join(OUTDIR, "crossarray_scan_summary.json"), "w") as f:
        json.dump({"window_bp": WINDOW_BP, "fdr_threshold": FDR_THR,
                   "manifest_450k": os.path.basename(MANIFEST_450K),
                   "manifest_450k_sha256": sha256(MANIFEST_450K),
                   "results": summary}, f, indent=2)
    print("\ndone -> out/crossarray_scan_summary.json", flush=True)


if __name__ == "__main__":
    if "--selfcheck" in sys.argv:
        raise SystemExit(run_ketamine_selfcheck())
    main()
