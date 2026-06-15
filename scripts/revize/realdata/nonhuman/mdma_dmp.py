#!/usr/bin/env python3
"""
Gercek diferansiyel promotor-metilasyon analizi — MDMA (ecstasy), fare, kalp dokusu.
Veri: GEO GSE68199 (Mus musculus), NimbleGen MM9 promotor MeDIP tiling array.
Her ornek icin islenmis peak dosyasi: *_ratio_peak_pvalues_mapToFeatures.txt.gz
(2 GB RAW.tar indirilmeden, GSM seviyesinden tek tek cekildi.)

Yontem:
- Promotor peak'leri: FEATURE_TRACK == transcription_start_site VE |FEATURE_TO_PEAK_DISTANCE| <= 2000 bp.
- Her ornekte her gen icin promotor bolgesindeki MAX PEAK_SCORE (NimbleGen -log10 peak skoru).
- Genlerin birlesimi; bir ornekte peak yoksa skor = 0 (promotorde metilasyon peak'i saptanmadi).
- Kontrastlar: MDMA-10D vs Saline-10D (birincil), MDMA-35D vs Saline-35D, tum MDMA-maruz vs tum Saline.
- Welch t-testi + Benjamini-Hochberg FDR.
SINIRLILIK (acikca): peak-tabanli (surekli probe matris degil), n kucuk (3-4/grup), kalp dokusu
(beyin/kan degil). Sonuc oldugu gibi raporlanir; anlamli cikmazsa zorlanmaz (confirmation bias yasak).
Tekrar uretilebilirlik: her dosyanin SHA-256'si manifest olarak yazilir.
Cikti: out/GSE68199_mdma_mouse_dmp.json
"""
import gzip, hashlib, json, os, glob
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
MDIR = os.path.join(HERE, "mdma")
OUTDIR = os.path.join(HERE, "out")
os.makedirs(OUTDIR, exist_ok=True)

GROUPS = {
    "Saline10D": ["GSM1665569", "GSM1665570", "GSM1665571", "GSM1665572"],
    "MDMA10D":   ["GSM1665573", "GSM1665574", "GSM1665575", "GSM1665576"],
    "Saline35D": ["GSM1665577", "GSM1665578", "GSM1665579", "GSM1665580"],
    "MDMA35D":   ["GSM1665581", "GSM1665582", "GSM1665583"],
    "MDMA10_25D":["GSM1665584", "GSM1665585", "GSM1665586", "GSM1665587"],
}
PROMOTER_WINDOW = 2000

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(1 << 20), b""):
            h.update(c)
    return h.hexdigest()

def gsm_file(gsm):
    hits = glob.glob(os.path.join(MDIR, f"{gsm}_*ratio_peak_pvalues_mapToFeatures.txt.gz"))
    return hits[0] if hits else None

def parse_sample(path):
    """gene_symbol -> max promoter peak score (float)."""
    gene_max = {}
    with gzip.open(path, "rt", errors="replace") as f:
        header = f.readline().rstrip("\n").split("\t")
        idx = {name: i for i, name in enumerate(header)}
        c_score = idx.get("PEAK_SCORE", 4)
        c_track = idx.get("FEATURE_TRACK", 5)
        c_dist  = idx.get("FEATURE_TO_PEAK_DISTANCE", 9)
        c_name  = idx.get("Name", 10)
        for line in f:
            if "transcription_start_site" not in line:
                continue
            p = line.rstrip("\n").split("\t")
            if len(p) <= c_name:
                continue
            if p[c_track] != "transcription_start_site":
                continue
            try:
                if abs(int(p[c_dist])) > PROMOTER_WINDOW:
                    continue
                score = float(p[c_score])
            except (ValueError, IndexError):
                continue
            g = p[c_name].strip()
            if not g:
                continue
            if score > gene_max.get(g, -1.0):
                gene_max[g] = score
    return gene_max

def bh_fdr(p):
    p = np.asarray(p, float); n = p.size
    order = np.argsort(p)
    ranked = p[order] * n / (np.arange(n) + 1)
    ranked = np.minimum.accumulate(ranked[::-1])[::-1]
    q = np.empty(n); q[order] = np.clip(ranked, 0, 1)
    return q

def welch(a, b):
    ma, mb = a.mean(1), b.mean(1)
    va, vb = a.var(1, ddof=1), b.var(1, ddof=1)
    na, nb = a.shape[1], b.shape[1]
    se2 = va/na + vb/nb
    se2 = np.where(se2 <= 0, np.nan, se2)
    t = (ma - mb) / np.sqrt(se2)
    df = (se2**2) / ((va/na)**2/(na-1) + (vb/nb)**2/(nb-1))
    return t, df, (ma - mb)

def pvals(t, df):
    try:
        from scipy import stats
        return 2.0 * stats.t.sf(np.abs(t), df), "scipy.stats.t (exact)"
    except Exception:
        from math import erfc, sqrt
        return np.array([erfc(abs(x)/sqrt(2)) for x in np.nan_to_num(t)]), "normal-approx (scipy yok)"

def main():
    # load all samples
    all_gsm = [g for v in GROUPS.values() for g in v]
    manifest, sample_scores = {}, {}
    for gsm in all_gsm:
        path = gsm_file(gsm)
        if not path:
            raise FileNotFoundError(f"Beklenen ornek dosyasi yok: {gsm} (tekrar uretilebilirlik icin tum 19 dosya zorunlu)")
        manifest[gsm] = {"file": os.path.basename(path), "sha256": sha256(path)}
        sample_scores[gsm] = parse_sample(path)
        print(f"{gsm}: {len(sample_scores[gsm])} promotor-gen peak")

    # union of genes
    genes = sorted(set().union(*[set(d) for d in sample_scores.values()]))
    gidx = {g: i for i, g in enumerate(genes)}
    samples = list(sample_scores.keys())
    M = np.zeros((len(genes), len(samples)), float)
    for j, gsm in enumerate(samples):
        for g, s in sample_scores[gsm].items():
            M[gidx[g], j] = s
    print(f"toplam gen (birlesim): {len(genes)}, ornek: {len(samples)}")

    col = {gsm: j for j, gsm in enumerate(samples)}
    def cols(group): return [col[g] for g in GROUPS[group] if g in col]

    results = {
        "dataset": "GSE68199",
        "organism": "Mus musculus",
        "tissue": "heart (left ventricle)",
        "exposure": "MDMA (ecstasy) vs saline, 10/35 days",
        "platform": "NimbleGen MM9 Deluxe Promoter Methylation (MeDIP), peak-level",
        "method": "promoter TSS +/-2kb max PEAK_SCORE per gene; Welch t-test + BH-FDR; absent peak = 0",
        "promoter_window_bp": PROMOTER_WINDOW,
        "n_genes": len(genes),
        "group_n": {k: len(cols(k)) for k in GROUPS},
        "numpy_version": np.__version__,
        "data_manifest_sha256": manifest,
        "limitations": "peak-based (not continuous betas); 0 = no peak DETECTED near TSS (censored evidence, NOT measured zero methylation intensity) -> may exaggerate presence/absence; small n; cardiac tissue; results reported as-is",
        "contrasts": {},
    }

    def contrast(name, ga, gb):
        ca, cb = cols(ga), cols(gb)
        a, b = M[:, ca], M[:, cb]
        # keep genes with a peak in at least 2 samples total (drop all-near-zero noise)
        keep = ((a > 0).sum(1) + (b > 0).sum(1)) >= 2
        gk = [genes[i] for i in np.where(keep)[0]]
        ak, bk = a[keep], b[keep]
        t, df, eff = welch(ak, bk)
        p, pm = pvals(t, df)
        good = ~np.isnan(p) & ~np.isnan(t)
        q = np.full_like(p, np.nan); q[good] = bh_fdr(p[good])
        results["p_method"] = pm
        n05 = int(np.nansum(q < 0.05)); n10 = int(np.nansum(q < 0.10))
        ordr = np.lexsort((-np.abs(eff), np.nan_to_num(q, nan=1.0)))[:25]
        top = [{"gene": gk[i], "delta_peakscore": round(float(eff[i]), 3),
                "p": float(f"{p[i]:.3e}") if good[i] else None,
                "q_fdr": float(f"{q[i]:.3e}") if good[i] else None} for i in ordr]
        results["contrasts"][name] = {
            "label": f"{ga} (n={len(ca)}) vs {gb} (n={len(cb)})",
            "n_genes_tested": int(keep.sum()),
            "n_sig_fdr05": n05, "n_sig_fdr10": n10,
            "min_q": float(np.nanmin(q)) if good.any() else None, "top25": top,
        }
        print(f"[{name}] {ga} vs {gb}: test gen={int(keep.sum())}, FDR<0.05={n05}, FDR<0.10={n10}, min_q={results['contrasts'][name]['min_q']}")

    contrast("MDMA10D_vs_Saline10D", "MDMA10D", "Saline10D")
    contrast("MDMA35D_vs_Saline35D", "MDMA35D", "Saline35D")
    # all MDMA-exposed vs all saline (NOT: zaman noktalari karisir -> confounded, sadece kesif)
    GROUPS["AllMDMA"] = GROUPS["MDMA10D"] + GROUPS["MDMA35D"] + GROUPS["MDMA10_25D"]
    GROUPS["AllSaline"] = GROUPS["Saline10D"] + GROUPS["Saline35D"]
    contrast("AllMDMA_vs_AllSaline", "AllMDMA", "AllSaline")

    out = os.path.join(OUTDIR, "GSE68199_mdma_mouse_dmp.json")
    with open(out, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("Yazildi:", out)

if __name__ == "__main__":
    main()
