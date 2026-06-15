#!/usr/bin/env python3
"""
Bölgeye-özgülük taramasi: ALKOL (AUD) beyin DMP'leri gercek mi, tek-bolge artefakti mi?
(opioid_window_artifact_scan.py'nin POZITIF-BULGU AYNASI.)

Arka plan / neden bu betik var:
  Opioid tarafinda (Task #11/§2.5d) sorun, REPLIKE OLMAYAN bir kesif lokusunun ±2 kb
  penceresinin kenarinda YALNIZCA tek bir BULK-doku kohortunda yanan sahte bir prob idi
  (cg20100151 -> COHORT_SPECIFIC_dlPFC_BULK_ONLY). Orada karsilastirma BULK vs SORTED-noron.

  Alkol kohortu GSE252501 tamamlayici, simetrik bir firsat sunar: AYNI kisiler IKI beyin
  bolgesinde olculmustur — Nucleus accumbens (NAc) ve dorsolateral prefrontal korteks (DLPFC).
  Rapor §2.1 / Tablo 1B: NAc'ta 1.107 DMP (FDR<0,05), DLPFC'de 0 DMP. Bu betik, opioid
  taramasinin per-lokus ±2 kb pencere mantigini AYNI-DENEK DLPFC verisine uygular: her bir
  ust NAc DMP'sinin ±2 kb penceresi DLPFC'de test edilir ve her kesif DMP'si
    - REGION_SPECIFIC_NAc_ONLY  (NAc'ta anlamli, DLPFC'de degil)  veya
    - REPLICATES_BOTH_REGIONS   (NAc'ta VE DLPFC'de ayni yonde anlamli)
  olarak isaretlenir. Boylece "gercek" alkol bulgularinin hangileri GERCEKTEN bolgeye-ozgu
  odul-devresi (NAc) sinyali, hangileri iki bolgede de tutan saglam sinyal oldugu sistematik
  olarak teyit edilir — opioid bulk-yalniz kontrolunun pozitif-bulgu aynasi.

Veri kaynaklari (hepsi YERELDE, kendi gercek hesabimizdan):
  - out/GSE252501_NAc_dmp.csv    : NAc per-prob EWAS (beta ~ AUD + age(z) + sex + smoker), BH-FDR.
  - out/GSE252501_DLPFC_dmp.csv  : AYNI denekler, DLPFC, AYNI model.
  (Ikisi de scripts/40_dmp_alcohol_brain_gse252501.py tarafindan committed matrislerden uretilir.)
  - data/EPIC.hg38.manifest.tsv.gz : Zhou-lab (sesame) EPIC hg38 prob koordinatlari
    (SHA-256 SOURCES.txt'te dogrulanir; pencere komsularini bulmak icin).

Per-DMP yargi (opioid classify() ile birebir tutarli yapida):
  - NAc'ta anlamli (genom-capi FDR<0,05; KESIF olcutu) VE ayni prob DLPFC'de
    pencere-ici BH-FDR<0,05 + AYNI yon  -> REPLICATES_BOTH_REGIONS
  - NAc'ta anlamli VE DLPFC'de degil                                  -> REGION_SPECIFIC_NAc_ONLY
  - DLPFC'de prob olculmemis (matriste yok)                           -> DLPFC_NOT_MEASURED
Pencere ek bilgisi: her DMP'nin ±2 kb komsu proplari da DLPFC'de test edilir; pencerede
  DLPFC region-FDR<0,05 gecen HERHANGI bir komsu varsa "window_replication_in_DLPFC" not edilir
  (yine de kesif probun kendi yargisi yukaridaki per-prob kurala dayanir).

Zero-hallucination: tum sayilar burada gercek veriden hesaplanir; girdi SHA-256'lari kaydedilir.
Cikti: human/alcohol/out/alcohol_region_artifact_scan.json
"""
import os, json, gzip, hashlib
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
RD = os.path.dirname(os.path.dirname(HERE))  # scripts/revize/realdata
NAC_CSV = os.path.join(RD, "out", "GSE252501_NAc_dmp.csv")
DLPFC_CSV = os.path.join(RD, "out", "GSE252501_DLPFC_dmp.csv")
EPIC_MANIFEST = os.path.join(RD, "data", "EPIC.hg38.manifest.tsv.gz")
OUTDIR = os.path.join(HERE, "out"); os.makedirs(OUTDIR, exist_ok=True)
OUT = os.path.join(OUTDIR, "alcohol_region_artifact_scan.json")

WINDOW_BP = 2000          # ±2 kb (opioid taramasiyla ayni)
TOP_N = None              # taranan ust NAc DMP sayisi; None -> TUM FDR<0,05 NAc DMP'leri
FDR_THR = 0.05


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(buf), b""):
            h.update(c)
    return h.hexdigest()


def bh_fdr(pvals):
    """Benjamini-Hochberg FDR (pencere-ici)."""
    p = np.asarray(pvals, dtype=float)
    n = len(p)
    if n == 0:
        return np.array([])
    order = np.argsort(p)
    ranked = p[order] * n / (np.arange(n) + 1)
    ranked = np.minimum.accumulate(ranked[::-1])[::-1]
    out = np.empty(n)
    out[order] = np.clip(ranked, 0, 1)
    return out


def load_epic_coords(needed_probes):
    """EPIC hg38 manifestinden YALNIZCA gereken proplarin koordinatlarini tek gecisle oku."""
    need = set(needed_probes)
    coords = {}
    with gzip.open(EPIC_MANIFEST, "rt") as f:
        header = f.readline().rstrip("\n").split("\t")
        idx = {c: i for i, c in enumerate(header)}
        ic, ib, ie, ip = idx["CpG_chrm"], idx["CpG_beg"], idx["CpG_end"], idx["Probe_ID"]
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) <= ip:
                continue
            pid = parts[ip]
            if pid not in need:
                continue
            chrm = parts[ic]
            beg = parts[ib]
            if chrm in ("", "NA") or beg in ("", "NA"):
                coords[pid] = {"chrom": None, "beg": None}
            else:
                coords[pid] = {"chrom": chrm, "beg": int(beg)}
            need.discard(pid)
            if not need:
                break
    return coords


def main():
    nac = pd.read_csv(NAC_CSV)
    dlpfc = pd.read_csv(DLPFC_CSV).set_index("cg")
    nac_by_cg = nac.set_index("cg")

    # NAc DMP'leri (genom-capi FDR<0,05, p'ye gore sirali); TOP_N None ise TUM kohort taranir
    nac_sig = nac[nac["fdr"] < FDR_THR].sort_values("p").reset_index(drop=True)
    n_total_sig = int(len(nac_sig))
    top = (nac_sig if TOP_N is None else nac_sig.head(TOP_N)).copy()

    # koordinatlar icin gereken proplar: ust DMP'ler + ±2 kb komsu adaylari icin
    # TUM NAc proplarinin koordinati gerekir (komsulari kromozom/pozisyondan bulacagiz).
    all_probes = pd.unique(pd.concat([nac["cg"], pd.Series(dlpfc.index)]))
    coords = load_epic_coords(all_probes)

    # koordinati olan NAc proplarini kromozoma gore indeksle (komsu aramasi icin)
    by_chrom = {}
    for cg in nac["cg"]:
        c = coords.get(cg)
        if c and c["chrom"] is not None:
            by_chrom.setdefault(c["chrom"], []).append((c["beg"], cg))
    for ch in by_chrom:
        by_chrom[ch].sort()
    chrom_pos = {ch: np.array([p for p, _ in arr]) for ch, arr in by_chrom.items()}
    chrom_cg = {ch: [cg for _, cg in arr] for ch, arr in by_chrom.items()}

    def nac_stat(cg):
        if cg not in nac_by_cg.index:
            return None
        r = nac_by_cg.loc[cg]
        return {"delta_beta": float(r["delta_beta_case_minus_control"]),
                "t": float(r["t"]), "p": float(r["p"]),
                "fdr_genomewide": float(r["fdr"]),
                "sig_genomewide": bool(r["fdr"] < FDR_THR)}

    def dlpfc_stat(cg):
        if cg not in dlpfc.index:
            return None
        r = dlpfc.loc[cg]
        return {"delta_beta": float(r["delta_beta_case_minus_control"]),
                "t": float(r["t"]), "p": float(r["p"]),
                "fdr_genomewide": float(r["fdr"])}

    results = []
    n_region_specific = 0
    n_replicates = 0
    n_dlpfc_not_measured = 0

    for _, row in top.iterrows():
        cg = row["cg"]
        c = coords.get(cg, {"chrom": None, "beg": None})
        chrom, pos = c["chrom"], c["beg"]

        # ±2 kb pencere proplari (NAc evreninden, koordinata gore)
        window_probes = []
        if chrom is not None and chrom in chrom_pos:
            arr = chrom_pos[chrom]
            lo = np.searchsorted(arr, pos - WINDOW_BP, "left")
            hi = np.searchsorted(arr, pos + WINDOW_BP, "right")
            for j in range(lo, hi):
                wcg = chrom_cg[chrom][j]
                window_probes.append((wcg, int(arr[j])))

        # pencere proplarini DLPFC'de test et (pencere-ici BH-FDR)
        win_dlpfc_p = []
        win_rows = []
        for wcg, wpos in window_probes:
            ds = dlpfc_stat(wcg)
            ns = nac_stat(wcg)
            win_rows.append({
                "probe": wcg, "hg38": f"{chrom}:{wpos}",
                "dist_to_dmp_bp": int(abs(wpos - pos)),
                "is_discovery_dmp": bool(wcg == cg),
                "NAc": ns, "DLPFC": ds,
            })
            if ds is not None and np.isfinite(ds["p"]):
                win_dlpfc_p.append((wcg, ds["p"]))
        # pencere-ici BH-FDR (DLPFC)
        win_fdr = {}
        if win_dlpfc_p:
            qs = bh_fdr([p for _, p in win_dlpfc_p])
            win_fdr = {w: float(q) for (w, _), q in zip(win_dlpfc_p, qs)}
        for wr in win_rows:
            if wr["DLPFC"] is not None and wr["probe"] in win_fdr:
                wr["DLPFC"]["fdr_window"] = win_fdr[wr["probe"]]
                wr["DLPFC"]["sig_window_fdr05"] = bool(win_fdr[wr["probe"]] < FDR_THR)

        # kesif probun kendi DLPFC sonucu + yargi
        nac_disc = nac_stat(cg)
        dl_disc = dlpfc_stat(cg)
        dl_disc_fdr_window = win_fdr.get(cg)
        same_direction = (dl_disc is not None and nac_disc is not None
                          and np.sign(dl_disc["delta_beta"]) == np.sign(nac_disc["delta_beta"]))
        dl_disc_sig = (dl_disc is not None and dl_disc_fdr_window is not None
                       and dl_disc_fdr_window < FDR_THR)

        if dl_disc is None:
            verdict = "DLPFC_NOT_MEASURED"
            n_dlpfc_not_measured += 1
        elif dl_disc_sig and same_direction:
            verdict = "REPLICATES_BOTH_REGIONS"
            n_replicates += 1
        else:
            verdict = "REGION_SPECIFIC_NAc_ONLY"
            n_region_specific += 1

        # pencere komsu replikasyonu (kesif disindaki herhangi bir komsu DLPFC'de anlamli mi)
        window_repl_neighbors = [
            wr["probe"] for wr in win_rows
            if (not wr["is_discovery_dmp"]) and wr["DLPFC"] is not None
            and wr["DLPFC"].get("sig_window_fdr05")
        ]

        results.append({
            "discovery_probe": cg,
            "hg38": f"{chrom}:{pos}" if chrom else "UNMAPPED",
            "NAc": nac_disc,
            "DLPFC_same_probe": (None if dl_disc is None else {
                **dl_disc,
                "fdr_window": dl_disc_fdr_window,
                "sig_window_fdr05": bool(dl_disc_sig),
                "same_direction_as_NAc": bool(same_direction),
            }),
            "n_probes_in_window": len(win_rows),
            "window_replication_in_DLPFC": bool(len(window_repl_neighbors) > 0),
            "window_replicating_neighbors": window_repl_neighbors,
            "window_probes": sorted(win_rows, key=lambda r: r["dist_to_dmp_bp"]),
            "verdict": verdict,
        })

    out = {
        "analysis": "Region-specificity scan for ALCOHOL (AUD) brain DMPs: are the confirmed "
                    "NAc positives genuinely region-specific reward-circuit signals, or do they "
                    "replicate in the same subjects' DLPFC? (Positive-finding mirror of the opioid "
                    "bulk-only window artifact scan.)",
        "method": ("Her ust NAc DMP'sinin ±2 kb penceresi AYNI-DENEK DLPFC verisinde test edilir; "
                   "kesif prob NAc'ta genom-capi FDR<0,05 (kesif olcutu) iken DLPFC'de pencere-ici "
                   "BH-FDR<0,05 + ayni yon ise REPLICATES_BOTH_REGIONS, degilse "
                   "REGION_SPECIFIC_NAc_ONLY (opioid classify() ile birebir yapida)."),
        "dataset": "GSE252501 — postmortem brain, EPIC; SAME subjects measured in NAc + DLPFC.",
        "window_bp": WINDOW_BP,
        "top_n_scanned": int(len(top)),
        "n_NAc_DMP_total_fdr05": n_total_sig,
        "verdict_counts": {
            "REGION_SPECIFIC_NAc_ONLY": n_region_specific,
            "REPLICATES_BOTH_REGIONS": n_replicates,
            "DLPFC_NOT_MEASURED": n_dlpfc_not_measured,
        },
        "results": results,
        "input_files_sha256": {
            "GSE252501_NAc_dmp.csv": sha256(NAC_CSV),
            "GSE252501_DLPFC_dmp.csv": sha256(DLPFC_CSV),
            "EPIC.hg38.manifest.tsv.gz": sha256(EPIC_MANIFEST),
        },
    }
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f"Top {len(top)} NAc DMP'si tarandi (toplam {n_total_sig} FDR<0,05).")
    print(f"  REGION_SPECIFIC_NAc_ONLY : {n_region_specific}")
    print(f"  REPLICATES_BOTH_REGIONS  : {n_replicates}")
    print(f"  DLPFC_NOT_MEASURED       : {n_dlpfc_not_measured}")
    print("\nilk 15 kesif DMP'si:")
    for r in results[:15]:
        d = r["DLPFC_same_probe"]
        dl = "NA" if d is None else f"FDRw={d['fdr_window']}"
        print(f"  {r['discovery_probe']:<12} {r['hg38']:<18} "
              f"NAc_FDR={r['NAc']['fdr_genomewide']:.4g}  DLPFC_{dl}  "
              f"win={r['n_probes_in_window']}  -> {r['verdict']}")
    print("\nYazildi:", OUT)


if __name__ == "__main__":
    main()
