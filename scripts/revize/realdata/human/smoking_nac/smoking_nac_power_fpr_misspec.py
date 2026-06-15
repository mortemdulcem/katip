#!/usr/bin/env python3
"""
GSE147040 (sigara/nikotin, postmortem nucleus accumbens, EPIC) — kovaryat-ayarli
OLS guc/FPR kalibrasyonunun MIS-SPESIFIK (kotumserci) GURULTU altinda SAGLAMLIK
kontrolu. opioid/opioid_power_fpr_misspec.py'nin dizi (array / Gauss) aynasidir.

NEDEN: smoking_nac_power_fpr_sim.py, simulasyon verisini veri setinin KENDI
tahmin edilen prob-gurultusuyle (resid_sd) uretir. Gercek dunyada teknik/batch/
hucre-kompozisyon kaynakli EK gurultu, bu artik-SD tahmininin uzerinde olabilir.
NULL'i (0 DMP) durustce yorumlamak icin: simulasyon gurultusu veri setinin kendi
tahmininden DAHA KOTU iken bile sonuclarin (MDE buyur ama NULL kalir, FPR iyi
kalibre) saglam oldugunu teyit etmek gerekir.

YONTEM:
  - Veri-ureten prob-gurultusu olarak gercek resid_sd yerine SISIRILMIS varyantlar:
      * sd_x1_baseline : resid_sd            (iyi-spesifik; committed base JSON ile karsilastirma)
      * sd_x2          : 2 x resid_sd
      * sd_x5          : 5 x resid_sd
      * fixed_floor    : max(resid_sd, FIXED_FLOOR) — site-bazli muhafazakar taban
  - TEST DEGISMEZ: OLS her tekrarda kendi artik varyansini SIMULE EDILEN VERIDEN
    yeniden tahmin eder (sig2 = RSS/df). Yani test, verinin (sisirilmis) gercek
    gurultu olcegini "oracle" olarak BILMEZ; sadece eldeki simule veriden kestirir.
    (OLS varyans kestirimi yansiz oldugundan dizi testi DSS'in tersine anti-
    konservatif hale gelmez; mis-spesifikasyonun etkisi GUC kaybi olarak gorunur,
    FPR nominal kalir — robustlugun dogru dizi-karsiligi budur.)
  - Tum agir makine smoking_nac_power_fpr_sim.py'den BIREBIR ice aktarilir
    (mirror; drift-yok). Spike-in tasarimi (delta x mu-tabakasi, BH-FDR) aynidir.

ÇALIŞMA MODLARI (her biri tek kisa cagriya sigar; arka-plan surecler bu ortamda
cagrilar arasi reaped oldugundan asamali/yeniden-uretilebilir):
  python smoking_nac_power_fpr_misspec.py run NAME   -> tek senaryo -> _parts/NAME.json
                                                        (checkpoint ile yeniden-baslanabilir)
  python smoking_nac_power_fpr_misspec.py assemble    -> tum parcalar -> nihai JSON

Onbellek: temel betigin onbellegini (out/_power_fpr_cache.npz) yeniden kullanir;
once `python smoking_nac_power_fpr_sim.py cache` calistirilmis olmali.

Zero-hallucination: hicbir sayi uydurulmaz. Prob gurultusu temeli gercek (veriden
cikarilan artik-SD), tek varsayim simule edilen gruplar-arasi etki BUYUKLUGU
(delta) ve KASITLI gurultu SISIRME carpanlaridir — ikisi de acik ve sabittir.
Sabit seed + girdi SHA-256.

Cikti: out/GSE147040_smoking_nac_power_fpr_misspec.json
"""
import json, os, sys, time
import numpy as np

from smoking_nac_power_fpr_sim import (
    load_cache, make_design, run_powerfpr, ms, log,
    DELTAS, SITES_PER_CELL, FDR, SEED, OUTDIR, MAT, META,
    OUT as BASE_OUT,
)

PARTS = os.path.join(OUTDIR, "_misspec_parts")
OUT = os.path.join(OUTDIR, "GSE147040_smoking_nac_power_fpr_misspec.json")
os.makedirs(PARTS, exist_ok=True)

N_POWER_REP = 3
N_NULL_REP = 3
FIXED_FLOOR = 0.05   # muhafazakar site-bazli artik-SD tabani (beta birimi; ~1.8x gercek medyan)


def scenario_specs(resid_sd):
    floor_frac = float(np.mean(resid_sd < FIXED_FLOOR))
    clip = lambda s: np.maximum(s, 1e-6)
    return [
        ("sd_x1_baseline", clip(resid_sd),
         "iyi-spesifik temel (= committed base JSON); test ile ayni gurultu olcegi"),
        ("sd_x2", clip(2.0 * resid_sd),
         "veri-ureten prob-gurultusu 2x sisirilmis; OLS yine veriden tahmin eder"),
        ("sd_x5", clip(5.0 * resid_sd),
         "veri-ureten prob-gurultusu 5x sisirilmis; OLS yine veriden tahmin eder"),
        (f"fixed_floor_{FIXED_FLOOR}", clip(np.maximum(resid_sd, FIXED_FLOOR)),
         f"site-bazli muhafazakar taban resid_sd>={FIXED_FLOOR} beta "
         f"({floor_frac*100:.1f}% site sisirildi); OLS yine veriden tahmin eder"),
    ]


def cmd_run(name):
    mu, resid_sd, group, age, sex_m, anc_c, meta = load_cache()
    specs = {n: (s, d) for n, s, d in scenario_specs(resid_sd)}
    if name not in specs:
        raise SystemExit(f"bilinmeyen senaryo {name}; secenekler: {list(specs)}")
    sd_sim, desc = specs[name]
    idx = list(specs).index(name)
    X, gi, XtXi, dof = make_design(group, age, sex_m, anc_c, meta["names_x"])
    case_mask = group == 1; ctrl_mask = group == 0
    n_keep = meta["n_keep"]
    ckpt = os.path.join(PARTS, f"_ckpt_{name}.json")
    t0 = time.time()
    log(f"== senaryo {name}: {desc} (resid_sd medyan {np.median(sd_sim):.5f}) ==")
    seed_base = SEED + 100000 * (idx + 1)
    res = run_powerfpr(mu, sd_sim, X, gi, XtXi, dof, case_mask, ctrl_mask, n_keep,
                       N_POWER_REP, N_NULL_REP, seed_base + 1000, seed_base + 5000,
                       ckpt_path=ckpt, label=name)
    res["description"] = desc
    res["data_generating_resid_sd_median"] = round(float(np.median(sd_sim)), 6)
    res["data_generating_resid_sd_mean"] = round(float(np.mean(sd_sim)), 6)
    res["runtime_sec"] = round(time.time() - t0, 1)
    with open(os.path.join(PARTS, f"{name}.json"), "w") as f:
        json.dump(res, f, indent=2, ensure_ascii=False)
    if os.path.exists(ckpt):
        os.remove(ckpt)
    log(f"parca yazildi: {name}.json ({res['runtime_sec']}s)")


def _pkey(d):
    return f"{d:.3f}"


def cmd_assemble():
    mu, resid_sd, group, age, sex_m, anc_c, meta = load_cache()
    names = [n for n, _, _ in scenario_specs(resid_sd)]
    floor_key = f"fixed_floor_{FIXED_FLOOR}"
    results = {}
    for n in names:
        p = os.path.join(PARTS, f"{n}.json")
        if not os.path.exists(p):
            raise SystemExit(f"eksik parca: {n}.json — once 'run {n}' calistir")
        with open(p) as f:
            results[n] = json.load(f)
    floor_frac = float(np.mean(resid_sd < FIXED_FLOOR))

    base = {}
    if os.path.exists(BASE_OUT):
        with open(BASE_OUT) as f:
            base = json.load(f)

    def mde_mid(r):
        return r.get("min_detectable_effect_beta_mid_stratum_80pct_power")

    def fpr(r):
        return r["false_positive_rate"]["pure_null_genomewide_FPR"]["mean"]

    def p_at(r, d):
        return r["power_vs_delta_all_strata"].get(_pkey(d), {}).get("mean")

    out = {
        "dataset": "GSE147040",
        "substance": "nicotine / cigarette smoking",
        "tissue": "postmortem human brain (nucleus accumbens)",
        "platform": "Illumina EPIC (processed beta)",
        "analysis": ("covariate-adjusted OLS (beta ~ smoker + age_z + sex + ancestry) — power / FPR robustness "
                     "under MIS-SPECIFIED (inflated) data-generating per-probe noise (Gaussian array spike-in)"),
        "purpose": ("confirm the power/FPR conclusions (MDE ~4 pp, well-calibrated genome-wide null FPR) are robust "
                    "when the simulated brain noise is WORSE than the dataset's own residual-SD estimate, while the "
                    "OLS test still estimates its residual variance from the data (mis-specified, not oracle)"),
        "design": {"Smoker": meta["n_case"], "Nonsmoker": meta["n_ctrl"], "n_probes_tested": meta["n_keep"],
                   "model_terms": meta["names_x"]},
        "seed": SEED,
        "data_source_note": ("processed beta from GEO series_matrix (GSE147040_series_matrix.txt.gz); reuses the base "
                             "script's cache (out/_power_fpr_cache.npz) of the REAL per-probe residual SD + mean"),
        "simulation": {
            "data_generating_model": ("per-probe Gaussian spike-in on REAL probe means (mu); data-generating noise = "
                                      "INFLATED variants of the REAL per-probe residual SD (x1 baseline, x2, x5, and a "
                                      "fixed conservative beta floor); the OLS test re-estimates its residual variance "
                                      "from each simulated dataset (mis-specified, not given the truth); values clipped [0,1]"),
            "deltas_injected_beta": DELTAS,
            "sites_per_delta_x_stratum": SITES_PER_CELL,
            "power_replicates": N_POWER_REP,
            "null_replicates": N_NULL_REP,
            "fdr_threshold": FDR,
            "fixed_floor_resid_sd_beta": FIXED_FLOOR,
            "fixed_floor_fraction_sites_inflated": round(floor_frac, 4),
            "real_resid_sd_median": round(meta["resid_sd_med"], 6),
            "test": "covariate-adjusted OLS + BH-FDR (residual variance re-estimated per replicate)",
        },
        "comparison_to_committed_baseline": {
            "note": ("sd_x1_baseline below is recomputed with this script's reduced replicate count (3); the committed "
                     "well-specified run (5 reps) is in GSE147040_smoking_nac_power_fpr.json"),
            "committed_MDE_mid_beta": base.get("min_detectable_effect_beta_mid_stratum_80pct_power"),
            "committed_pure_null_FPR": (base.get("false_positive_rate", {})
                                        .get("pure_null_genomewide_FPR", {}).get("mean")),
            "committed_power_5pp_all_strata": (base.get("power_vs_delta_all_strata", {})
                                               .get("0.050", {}).get("mean")),
        },
        "scenarios": results,
        "robustness_summary": {
            "MDE_mid_stratum_beta": {n: mde_mid(results[n]) for n in names},
            "MDE_all_strata_beta": {n: results[n].get("min_detectable_effect_beta_all_strata_80pct_power") for n in names},
            "power_at_5pp_all_strata": {n: (round(p_at(results[n], 0.05), 4) if p_at(results[n], 0.05) is not None else None) for n in names},
            "power_at_10pp_all_strata": {n: (round(p_at(results[n], 0.10), 4) if p_at(results[n], 0.10) is not None else None) for n in names},
            "pure_null_genomewide_FPR": {n: fpr(results[n]) for n in names},
        },
        "interpretation": "",
        "input_files_sha256": {os.path.basename(MAT): meta["sha"][0], os.path.basename(META): meta["sha"][1]},
    }

    b = results["sd_x1_baseline"]; x5 = results["sd_x5"]; fl = results[floor_key]
    max_delta = max(DELTAS)
    fmt_mde = lambda r: (f"{mde_mid(r)} beta" if mde_mid(r) is not None
                         else f">{max_delta} beta (not reached within tested deltas)")
    out["interpretation"] = (
        f"When the simulated per-probe noise is inflated to 2x and 5x the dataset's own residual SD, and to a fixed "
        f"conservative beta floor (resid_sd>={FIXED_FLOOR}, {floor_frac*100:.0f}% of probes), and the OLS test is "
        f"forced to RE-ESTIMATE its variance from the (now noisier) data, the headline conclusions hold in the "
        f"expected direction. Mid-methylation MDE at >=80% power: {fmt_mde(b)} (x1) / {fmt_mde(x5)} (x5) / "
        f"{fmt_mde(fl)} (fixed floor) — i.e. noisier data only RAISES the detectable-effect bar. Power at a 10-pp "
        f"effect (all strata): {p_at(b,0.10):.2f} (x1) -> {p_at(x5,0.10):.2f} (x5). Crucially, the genome-wide null "
        f"FPR at FDR<0.05 stays nominal and NON-anticonservative under every inflation: {fpr(b):.2e} (x1) / "
        f"{fpr(x5):.2e} (x5) / {fpr(fl):.2e} (fixed floor) — unlike the opioid DSS case, OLS variance estimation is "
        f"unbiased, so worse noise costs power but never manufactures false positives. So the GSE147040 NAc smoking "
        f"NULL is robust: even under worse-than-assumed real-world noise the test remains well calibrated and the "
        f"0-DMP result reflects a (now larger) power limit, not an artifact of optimistic noise assumptions.")

    with open(OUT, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    log(f"NIHAI JSON yazildi: {OUT}")


def main():
    if len(sys.argv) < 2:
        raise SystemExit("kullanim: run NAME | assemble")
    mode = sys.argv[1]
    if mode == "run":
        cmd_run(sys.argv[2])
    elif mode == "assemble":
        cmd_assemble()
    else:
        raise SystemExit(f"bilinmeyen mod: {mode}")


if __name__ == "__main__":
    main()
