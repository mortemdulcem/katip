#!/usr/bin/env python3
"""
Bagimsiz kohort dogrulamasi: GSE252501'de IKI beyin bolgesinde (NAc + DLPFC) AYNI yonde
anlamli cikan iki alkol (AUD) markerinin BAGIMSIZ bir alkol-beyin EWAS kohortunda tutup
tutmadigi.

Arka plan / neden bu betik var:
  Bolgeye-ozgulluk taramasi (alcohol_region_artifact_scan.py) GSE252501'in ust 50 NAc
  DMP'sinden 2'sini "REPLICATES_BOTH_REGIONS" olarak isaretledi — yani NAc'a (odul devresi)
  ozgu olmaktan cok, AYNI deneklerin hem NAc hem DLPFC'sinde AYNI yonde (hiper) anlamli:
    - cg03301622  hg38 chr14:75188791  (NAc Dbeta=+0.0190, DLPFC Dbeta=+0.0096; ikisi de hiper)
    - cg01861657  hg38 chr8:57204565   (NAc Dbeta=+0.0170, DLPFC Dbeta=+0.0120; ikisi de hiper)
  Bunlar tek-bolge artefakti DEGIL, en genellenebilir aday sinyaller. Tek bir kohorta
  (GSE252501) bagli kalmamak icin BAGIMSIZ bir alkol-beyin kohortunda test edilmeleri gerek.

Bagimsiz dogrulama kohortu:
  GSE49393 — yetiskin alkol-kullanim-bozuklugu postmortem PREFRONTAL KORTEKS, Illumina 450K,
  n=48 (23 AUD vs 25 kontrol). GSE252501'den TAMAMEN AYRI denekler, AYRI platform, AYRI laboratuvar.
  Tam-array EWAS'i zaten yerelde hesaplandi: out/GSE49393_dmp.csv (beta ~ AUD + age(z) + sex,
  430.407 prob, Welch-tabanli OLS t + BH-FDR). Bu betik o EWAS'tan iki hedef probu (ve ±2 kb
  450K komsularini) cikarip kesif yonune (hiper) gore tutarliligi degerlendirir.

Platform sinirlamasi + KOORDINAT-TABANLI VEKIL COZUMU (durust beyan, sifir-halusinasyon):
  cg03301622 EPIC'e OZGU bir probtur; 450K dizisinde (GSE49393'un platformu) AYNI-PROB olarak YOKTUR.
  Eskiden bu marker "anchor yok" gerekcesiyle hic test edilemiyordu. Artik dizi-surumleri arasi
  koordinat-tabanli "yakin-prob" vekili calistiriliyor: markerin hg38 konumu yerel UCSC chain
  dosyasiyla (pyliftover) hg19'a cevriliyor ve bu hg19 anchor'inin ±2 kb'i icindeki 450K proplari
  GSE49393'te test ediliyor. Boylece sonuc "olculemez" yerine GERCEK (vekil-duzeyi) bir
  replike-eder / replike-etmez yanitina donusuyor. Eger liftover sonrasi ±2 kb pencerede HIC 450K
  prob yoksa (450K kapsam bosulugu), bu da olculen gercek bir sonuctur (en yakin prob mesafesi
  raporlanir) -> NOT_MEASURABLE_ON_INDEPENDENT_COHORT (uydurma yok). cg01861657 450K'da MEVCUTTUR
  -> dogrudan AYNI-PROB test edilir + kendi 450K hg19 koordinatindan ±2 kb pencere-vekili de test edilir.

Dogrulama olcutu (hedefe-yonelik 2-prob testi):
  - Ayni yon (kesif=hiper, yani GSE49393 Dbeta > 0) VE nominal p<0.05  -> REPLICATES (yonsel)
    (Bonferroni 2-test esigi p<0.025 + array-capi BH-FDR<0.05 de ayrica raporlanir).
  - Aksi halde DOES_NOT_REPLICATE.

Zero-hallucination: tum sayilar gercek veriden hesaplanir; girdi SHA-256'lari kaydedilir.
Cikti: human/alcohol/out/alcohol_crossregion_independent_validation.json
"""
import os, csv, sys, json
import numpy as np
from pyliftover import LiftOver

HERE = os.path.dirname(os.path.abspath(__file__))
RD = os.path.dirname(os.path.dirname(HERE))  # scripts/revize/realdata
sys.path.insert(0, RD)
# Diziler-arasi yakin-prob vekili — paylasilan modul (scripts/revize/realdata/crossarray_proxy.py).
from crossarray_proxy import (  # noqa: E402
    sha256, load_450k_chr_pos, lift_hg38_to_hg19, nearest_probe, build_window,
)
GSE49393_DMP = os.path.join(RD, "out", "GSE49393_dmp.csv")
GSE49393_VAL = os.path.join(RD, "out", "GSE49393_validation.json")
NAC_CSV = os.path.join(RD, "out", "GSE252501_NAc_dmp.csv")
DLPFC_CSV = os.path.join(RD, "out", "GSE252501_DLPFC_dmp.csv")
SCAN_JSON = os.path.join(HERE, "out", "alcohol_region_artifact_scan.json")
MANIFEST_450K = os.path.join(RD, "data", "GPL13534_manifest.csv.gz")
# UCSC hg38->hg19 zincir (chain) dosyasi — yerel, cevrimdisi, SHA-256 ile sabitlenir.
# Indirme: hgdownload.soe.ucsc.edu/goldenPath/hg38/liftOver/hg38ToHg19.over.chain.gz
CHAIN_HG38_TO_HG19 = os.path.join(RD, "data", "hg38ToHg19.over.chain.gz")
OUTDIR = os.path.join(HERE, "out"); os.makedirs(OUTDIR, exist_ok=True)
OUT = os.path.join(OUTDIR, "alcohol_crossregion_independent_validation.json")

WINDOW_BP = 2000
FDR_THR = 0.05

# Kesif (GSE252501) tarafinda iki bolgede de hiper cikan iki hedef. hg38 koordinatlari
# alcohol_region_artifact_scan.json'dan; yon (hiper=+) discovery NAc+DLPFC Dbeta'sindan.
TARGETS = [
    {"probe": "cg03301622", "hg38": "chr14:75188791"},
    {"probe": "cg01861657", "hg38": "chr8:57204565"},
]

# --- Koordinat-cevrimi DRIFT MUHAFIZI (sessiz off-by-one / chain-swap onleyici) ---
# Tum vekil-verdict'ler hg38->hg19 liftover'inin DOGRU olmasina bagli. pyliftover 0-tabanli;
# biz 1-tabanli icin pos-1 girer, +1 ile cikariz. Gelecekte bir dizi-surumu/chain degisikligi
# ya da bu off-by-one mantiginin bozulmasi her sonucu SESSIZCE 1 bp kaydirir. Asagidaki
# sabitler bilinen-iyi bir referansla bunu LOUD olarak yakalar:
#   cg01861657 hem 450K (GPL13534) hg19 manifestinde MEVCUT (chr8:58117125) hem de hg38
#   konumu biliniyor (chr8:57204565). SHA-pinli UCSC chain + dogru off-by-one DETERMINISTIK
#   olarak chr8:58117124 verir. Bu TAM deger, asimetrik off-by-one regresyonlarini yakalar
#   (yalniz pos-1 ya da yalniz +1 dusurulurse sonuc 58117123 / 58117125'e kayar); ayrica
#   gercek 450K manifest konumuna (58117125) <=1 bp icinde oturur -> "~1 bp" kriteri.
LIFTOVER_SELFCHECK_PROBE = "cg01861657"
LIFTOVER_SELFCHECK_HG38 = "chr8:57204565"
LIFTOVER_SELFCHECK_EXPECTED_HG19 = ("chr8", 58117124)   # SHA-pinli chain + dogru off-by-one
LIFTOVER_SELFCHECK_MANIFEST_TOL_BP = 1                   # lifted vs gercek 450K manifest konumu
# Beklenen UCSC hg38->hg19 chain SHA-256 — swap edilmis/bozuk chain'i yakalar.
# Kaynak: hgdownload.soe.ucsc.edu/goldenPath/hg38/liftOver/hg38ToHg19.over.chain.gz
CHAIN_SHA256_EXPECTED = "14a712e8e147d9fc8e9d87d51977b46f6f8ddb93efbe5d0843d86b6205f587b1"


class CoordinateDriftError(RuntimeError):
    """hg38->hg19 koordinat cevriminin bilinen-iyi degerden saptigini bildirir (LOUD)."""


def load_gse49393_dmp():
    """out/GSE49393_dmp.csv -> {cg: {delta_beta, t, p, fdr, rank}}; toplam test sayisi."""
    d = {}
    with open(GSE49393_DMP, newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            d[row["cg"]] = {
                "delta_beta_aud_minus_control": float(row["delta_beta_aud_minus_control"]),
                "t": float(row["t"]),
                "p": float(row["p"]),
                "fdr": float(row["fdr"]),
                "rank": int(row["rank"]),
            }
    return d


def load_discovery(csv_path):
    d = {}
    with open(csv_path, newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            d[row["cg"]] = {
                "delta_beta_case_minus_control": float(row["delta_beta_case_minus_control"]),
                "t": float(row["t"]),
                "p": float(row["p"]),
                "fdr": float(row["fdr"]),
            }
    return d


def selfcheck_liftover(lo, coords450):
    """Koordinat-cevrimi DRIFT MUHAFIZI. Drift varsa CoordinateDriftError (LOUD) firlatir.
    1) Chain dosyasi SHA-256 sabit beklenen degerle dogrulanir (swap/bozulma yakalanir).
    2) Bilinen prob cg01861657 hg38->hg19 cevrilir; SHA-pinli chain ile sonuc TAM
       chr8:58117124 olmalidir (asimetrik off-by-one regresyonunu yakalar).
    3) Lifted anchor, gercek 450K manifest hg19 konumuyla <=1 bp icinde ortusmelidir.
    Dondurur: cikti JSON'una eklenecek dogrulama kaydi (dict)."""
    got_sha = sha256(CHAIN_HG38_TO_HG19)
    if got_sha != CHAIN_SHA256_EXPECTED:
        raise CoordinateDriftError(
            "CHAIN SHA-256 UYUSMUYOR: hg38ToHg19.over.chain.gz degismis/swap edilmis. "
            f"beklenen={CHAIN_SHA256_EXPECTED} bulunan={got_sha}. Koordinat cevrimi "
            "guvenilmez; liftover dogrulanana kadar DURDURULDU."
        )
    got = lift_hg38_to_hg19(lo, LIFTOVER_SELFCHECK_HG38)
    if got is None:
        raise CoordinateDriftError(
            f"SELF-CHECK liftover BASARISIZ: {LIFTOVER_SELFCHECK_PROBE} "
            f"{LIFTOVER_SELFCHECK_HG38} hg19'a cevrilemedi (chain/arac sorunu)."
        )
    exp_chr, exp_pos = LIFTOVER_SELFCHECK_EXPECTED_HG19
    if got[0] != exp_chr or got[1] != exp_pos:
        raise CoordinateDriftError(
            f"KOORDINAT-CEVRIMI DRIFT: {LIFTOVER_SELFCHECK_PROBE} {LIFTOVER_SELFCHECK_HG38} "
            f"-> beklenen TAM {exp_chr}:{exp_pos}, bulunan {got[0]}:{got[1]}. "
            "0/1-tabanli off-by-one (pos-1 girdi / +1 cikti) ya da chain/dizi-surumu kaymasi. "
            "Her vekil-verdict sessizce yanlis olurdu; DURDURULDU."
        )
    manifest_anchor = coords450.get(LIFTOVER_SELFCHECK_PROBE)
    if manifest_anchor is None:
        raise CoordinateDriftError(
            f"SELF-CHECK: {LIFTOVER_SELFCHECK_PROBE} 450K manifestinde bulunamadi "
            "(GPL13534_manifest.csv.gz eksik/bozuk?); manifest capraz-kontrolu yapilamadi."
        )
    man_chr, man_pos = manifest_anchor
    man_diff = abs(man_pos - got[1])
    if man_chr != exp_chr or man_diff > LIFTOVER_SELFCHECK_MANIFEST_TOL_BP:
        raise CoordinateDriftError(
            f"LIFTED-MANIFEST UYUSMAZLIGI: {LIFTOVER_SELFCHECK_PROBE} lifted {got[0]}:{got[1]} "
            f"vs 450K manifest {man_chr}:{man_pos} ({man_diff} bp > "
            f"{LIFTOVER_SELFCHECK_MANIFEST_TOL_BP} bp tolerans). Manifest/chain surumu uyumsuz."
        )
    return {
        "probe": LIFTOVER_SELFCHECK_PROBE,
        "hg38": LIFTOVER_SELFCHECK_HG38,
        "lifted_hg19": f"{got[0]}:{got[1]}",
        "expected_hg19": f"{exp_chr}:{exp_pos}",
        "manifest_hg19": f"{man_chr}:{man_pos}",
        "lifted_vs_manifest_bp": int(man_diff),
        "manifest_tolerance_bp": LIFTOVER_SELFCHECK_MANIFEST_TOL_BP,
        "chain_sha256": got_sha,
        "chain_sha256_ok": True,
        "passed": True,
    }


def main():
    g49 = load_gse49393_dmp()
    n_tested = len(g49)
    nac = load_discovery(NAC_CSV)
    dlpfc = load_discovery(DLPFC_CSV)

    # 450K koordinatlari: yalniz hedef kromozomlari (pencere-vekili ayni-kromozom ±2 kb)
    target_chroms = {t["hg38"].split(":")[0] for t in TARGETS}
    coords450 = load_450k_chr_pos(MANIFEST_450K, chroms=target_chroms)

    # hg38->hg19 liftover (EPIC'e ozgu proplar icin koordinat-tabanli vekil) — yerel chain.
    lo = LiftOver(CHAIN_HG38_TO_HG19)

    # KOORDINAT-CEVRIMI DRIFT MUHAFIZI: vekil-verdict'ler hesaplanmadan ONCE, bilinen-iyi
    # bir referansla liftover'in dogrulugu + chain SHA-256 dogrulanir. Drift varsa burada
    # LOUD basarisiz olur (CoordinateDriftError); sessiz yanlis sonuc uretilmez.
    selfcheck = selfcheck_liftover(lo, coords450)

    results = []
    n_replicates = 0
    n_not_replicate = 0
    n_not_measurable = 0

    for tgt in TARGETS:
        cg = tgt["probe"]
        disc_nac = nac.get(cg)
        disc_dlpfc = dlpfc.get(cg)
        disc_dir = "hyper" if (disc_nac and disc_nac["delta_beta_case_minus_control"] > 0) else "hypo"
        disc_sign = np.sign(disc_nac["delta_beta_case_minus_control"]) if disc_nac else 0.0

        rec = {
            "probe": cg,
            "hg38": tgt["hg38"],
            "discovery_GSE252501": {
                "NAc": disc_nac,
                "DLPFC": disc_dlpfc,
                "direction": disc_dir,
            },
        }

        same = g49.get(cg)
        if same is None:
            # 450K'da AYNI-PROB yok -> EPIC'e ozgu. Koordinat-tabanli vekil: hg38->hg19
            # liftover ile anchor bulunur, ±2 kb 450K komsulari GSE49393'te test edilir.
            rec["independent_GSE49393_same_probe"] = None
            anchor19 = lift_hg38_to_hg19(lo, tgt["hg38"])
            if anchor19 is None:
                rec["window_proxy_GSE49393"] = {
                    "applied": False,
                    "reason": f"hg38->hg19 liftover basarisiz ({tgt['hg38']} hedef derlemede eslesmedi).",
                }
                rec["verdict"] = "NOT_MEASURABLE_ON_INDEPENDENT_COHORT"
                rec["verdict_reason"] = (
                    f"{cg} EPIC'e ozgu (450K'da yok); hg38 konumu hg19'a liftover edilemedi -> "
                    "vekil-prob testi uygulanamadi. Sifir-halusinasyon: uydurma yapilmadi."
                )
                n_not_measurable += 1
                results.append(rec)
                continue

            window = build_window(anchor19, coords450, g49, disc_sign,
                                  "delta_beta_aud_minus_control", target_cg=None,
                                  window_bp=WINDOW_BP, fdr_thr=FDR_THR)
            window["liftover"] = {
                "from_hg38": tgt["hg38"],
                "to_hg19": f"{anchor19[0]}:{anchor19[1]}",
                "chain_file": "hg38ToHg19.over.chain.gz",
                "tool": "pyliftover",
            }
            rec["window_proxy_GSE49393"] = window

            if window["n_probes_in_window"] == 0:
                # liftover oldu ama ±2 kb'de hic 450K prob yok -> 450K kapsam bosulugu (gercek sonuc).
                nb = nearest_probe(anchor19, coords450)
                nb_tested = bool(nb and nb[0] in g49)
                window["nearest_450k_probe"] = (
                    None if nb is None else {
                        "probe": nb[0], "hg19": f"{anchor19[0]}:{nb[1]}",
                        "dist_to_anchor_bp": int(nb[2]), "tested_in_GSE49393": nb_tested,
                    }
                )
                rec["verdict"] = "NOT_MEASURABLE_ON_INDEPENDENT_COHORT"
                nb_txt = (f"en yakin 450K prob {nb[0]} {int(nb[2])} bp uzakta"
                          if nb else "kromozomda 450K prob bulunamadi")
                rec["verdict_reason"] = (
                    f"{cg} EPIC'e ozgu; hg38 {tgt['hg38']} -> hg19 {anchor19[0]}:{anchor19[1]} "
                    f"liftover edildi, ancak ±{WINDOW_BP} bp pencerede GSE49393'te test edilmis HIC "
                    f"450K prob yok ({nb_txt}). Bu, 450K dizisinin bu bolgedeki kapsam bosulugunu "
                    "gosteren GERCEK bir olcumdur (uydurma yok); vekil-duzeyinde dahi replike "
                    "edilemiyor cunku olculecek komsu prob yok."
                )
                n_not_measurable += 1
                results.append(rec)
                continue

            # ±2 kb pencerede en az 1 vekil prob var -> en yakin komsuyu vekil olarak degerlendir.
            nearest = window["window_probes"][0]
            proxy_same_dir = bool(nearest["same_direction_as_discovery"])
            proxy_nominal = bool(nearest["p"] < 0.05)
            proxy_replicates = bool(proxy_same_dir and proxy_nominal)
            window["proxy_verdict_probe"] = nearest["probe"]
            rec["verdict"] = "REPLICATES_VIA_PROXY" if proxy_replicates else "DOES_NOT_REPLICATE_VIA_PROXY"
            rec["verdict_reason"] = (
                f"{cg} EPIC'e ozgu; hg38 {tgt['hg38']} -> hg19 {anchor19[0]}:{anchor19[1]} liftover. "
                f"En yakin 450K vekil-prob {nearest['probe']} ({nearest['dist_to_anchor_bp']} bp): "
                f"Dbeta={nearest['delta_beta_aud_minus_control']:+.4f} (ayni_yon={proxy_same_dir}), "
                f"p={nearest['p']:.4g}, pencere-FDR={nearest['fdr_window']:.4g}. "
                + ("Ayni yon + nominal p<0.05 -> vekil-duzeyinde replike." if proxy_replicates
                   else "Ayni yon+nominal anlamlilik vekilde saglanmadi -> vekil-duzeyinde replike etmiyor.")
            )
            if proxy_replicates:
                n_replicates += 1
            else:
                n_not_replicate += 1
            results.append(rec)
            continue

        # ayni-prob bagimsiz test
        rep_sign = np.sign(same["delta_beta_aud_minus_control"])
        same_direction = bool(rep_sign == disc_sign and disc_sign != 0)
        nominal_sig = bool(same["p"] < 0.05)
        bonf_sig = bool(same["p"] < 0.025)  # 2-prob hedefe-yonelik Bonferroni
        fdr_sig = bool(same["fdr"] < FDR_THR)
        replicates = bool(same_direction and nominal_sig)

        rec["independent_GSE49393_same_probe"] = {
            **same,
            "same_direction_as_discovery": same_direction,
            "nominal_p_lt_0p05": nominal_sig,
            "bonferroni2_p_lt_0p025": bonf_sig,
            "arraywide_fdr_lt_0p05": fdr_sig,
        }

        # ±2 kb pencere-vekili (probun kendi 450K hg19 koordinatindan)
        anchor = coords450.get(cg)
        if anchor:
            rec["window_proxy_GSE49393"] = build_window(
                anchor, coords450, g49, disc_sign, "delta_beta_aud_minus_control",
                target_cg=cg, window_bp=WINDOW_BP, fdr_thr=FDR_THR)
        else:
            rec["window_proxy_GSE49393"] = {"applied": False, "reason": "no 450K anchor"}

        rec["verdict"] = "REPLICATES" if replicates else "DOES_NOT_REPLICATE"
        rec["verdict_reason"] = (
            f"GSE49393 ayni-prob: Dbeta={same['delta_beta_aud_minus_control']:+.4f} "
            f"(kesif yonu={disc_dir}, ayni_yon={same_direction}), p={same['p']:.4g}, "
            f"BH-FDR={same['fdr']:.4g}. "
            + ("Ayni yon + nominal p<0.05 -> dogrulandi." if replicates
               else "Ayni yon+nominal anlamlilik kosulu saglanmadi -> dogrulanmadi.")
        )
        if replicates:
            n_replicates += 1
        else:
            n_not_replicate += 1
        results.append(rec)

    out = {
        "analysis": "Independent-cohort validation of the two cross-region (NAc+DLPFC) replicating "
                    "alcohol (AUD) brain markers from GSE252501.",
        "discovery_cohort": "GSE252501 (EPIC; SAME subjects NAc + DLPFC; both probes hyper in both regions).",
        "independent_validation_cohort": "GSE49393 (450K; adult AUD postmortem prefrontal cortex; "
                                         "23 AUD vs 25 control; fully independent subjects/platform/lab).",
        "validation_criterion": "Targeted 2-probe test. Same-probe (450K): same direction as discovery "
                                "(hyper) AND nominal p<0.05 -> REPLICATES; Bonferroni(2) p<0.025 and "
                                "array-wide BH-FDR<0.05 also reported. EPIC-only probe (absent on 450K): "
                                "hg38->hg19 liftover anchor, then nearest 450K probe within +/-2 kb is "
                                "the proxy -> same direction AND nominal p<0.05 -> REPLICATES_VIA_PROXY, "
                                "else DOES_NOT_REPLICATE_VIA_PROXY; if no 450K probe within +/-2 kb of "
                                "the lifted anchor -> NOT_MEASURABLE_ON_INDEPENDENT_COHORT (real 450K "
                                "coverage gap, nearest-probe distance reported).",
        "liftover": {
            "chain_file": "hg38ToHg19.over.chain.gz",
            "source": "UCSC goldenPath/hg38/liftOver",
            "tool": "pyliftover",
            "note": "1-based input/output; pyliftover is 0-based so pos-1 in, +1 out.",
        },
        "liftover_selfcheck": selfcheck,
        "window_bp": WINDOW_BP,
        "n_probes_tested_GSE49393": n_tested,
        "verdict_counts": {
            v: sum(1 for r in results if r["verdict"] == v)
            for v in ["REPLICATES", "DOES_NOT_REPLICATE", "REPLICATES_VIA_PROXY",
                      "DOES_NOT_REPLICATE_VIA_PROXY", "NOT_MEASURABLE_ON_INDEPENDENT_COHORT"]
        },
        "results": results,
        "input_files_sha256": {
            "GSE49393_dmp.csv": sha256(GSE49393_DMP),
            "GSE49393_validation.json": sha256(GSE49393_VAL),
            "GSE252501_NAc_dmp.csv": sha256(NAC_CSV),
            "GSE252501_DLPFC_dmp.csv": sha256(DLPFC_CSV),
            "alcohol_region_artifact_scan.json": sha256(SCAN_JSON),
            "GPL13534_manifest.csv.gz": sha256(MANIFEST_450K),
            "hg38ToHg19.over.chain.gz": sha256(CHAIN_HG38_TO_HG19),
        },
    }
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f"Liftover drift-muhafizi GECTI: {selfcheck['probe']} {selfcheck['hg38']} -> "
          f"{selfcheck['lifted_hg19']} (manifest {selfcheck['manifest_hg19']}, "
          f"{selfcheck['lifted_vs_manifest_bp']} bp); chain SHA-256 OK.")
    print(f"GSE49393'te test edilen prob: {n_tested}")
    for k, v in out["verdict_counts"].items():
        print(f"  {k:<38}: {v}")
    for r in results:
        s = r["independent_GSE49393_same_probe"]
        if s is None:
            print(f"  {r['probe']:<12} {r['hg38']:<18} -> {r['verdict']}")
        else:
            print(f"  {r['probe']:<12} {r['hg38']:<18} "
                  f"Dbeta={s['delta_beta_aud_minus_control']:+.4f} p={s['p']:.4g} "
                  f"FDR={s['fdr']:.4g} -> {r['verdict']}")
    print("\nYazildi:", OUT)


def _run_selfcheck_cli():
    """Bagimsiz koordinat-cevrimi drift-muhafizi (validation komutu olarak calistirilir).
    Chain dosyasi yoksa (gitignore'lu, yeniden-uretilebilir artefakt) ATLAR (exit 0).
    Chain MEVCUT ama SHA/cevrim driftli ise LOUD basarisiz olur (exit 1)."""
    if not os.path.exists(CHAIN_HG38_TO_HG19):
        print(f"SKIP: chain dosyasi yok ({CHAIN_HG38_TO_HG19}); yeniden-uretilebilir "
              "artefakt mevcut degil, koordinat drift kontrolu atlandi (drift yok demek degil).")
        return 0
    if not os.path.exists(MANIFEST_450K):
        print(f"SKIP: 450K manifest yok ({MANIFEST_450K}); manifest capraz-kontrolu yapilamadi.")
        return 0
    lo = LiftOver(CHAIN_HG38_TO_HG19)
    coords450 = load_450k_chr_pos(MANIFEST_450K, chroms={LIFTOVER_SELFCHECK_EXPECTED_HG19[0]})
    try:
        res = selfcheck_liftover(lo, coords450)
    except CoordinateDriftError as e:
        print("LIFTOVER DRIFT-CHECK BASARISIZ:\n  " + str(e))
        return 1
    print("LIFTOVER DRIFT-CHECK GECTI:")
    print(f"  {res['probe']} {res['hg38']} -> lifted {res['lifted_hg19']} "
          f"(beklenen {res['expected_hg19']}); 450K manifest {res['manifest_hg19']} "
          f"({res['lifted_vs_manifest_bp']} bp <= {res['manifest_tolerance_bp']} bp); "
          "chain SHA-256 OK.")
    return 0


if __name__ == "__main__":
    import sys
    if "--selfcheck" in sys.argv:
        raise SystemExit(_run_selfcheck_cli())
    main()
