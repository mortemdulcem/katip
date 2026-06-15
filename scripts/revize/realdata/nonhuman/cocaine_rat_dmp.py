#!/usr/bin/env python3
"""
Gercek diferansiyel metilasyon analizi — KOKAIN (sican, Nucleus Accumbens)
Veri: GEO GSE66348 (Rattus norvegicus), normalize log2-ratio metilasyon matrisi.
Calisma: kokain self-administration + cekilme (incubation of craving).
Gruplar (kolon onekleri): CNTRL, D1CUE, D1NOCUE, D30CUE, D30NOCUE.

Birincil kontrast: D30CUE (30 gun cekilme + cue, "kraving inkubasyonu") vs CNTRL.
Ikincil kontrast: tum kokain ornekleri vs CNTRL.

Yontem: probe-bazli Welch t-testi (esit-varyans yok) + Benjamini-Hochberg FDR.
Sahte-otorite yok: kucuk n acikca raporlanir; anlamli sonuc cikmazsa oldugu gibi yazilir.
Tekrar uretilebilirlik: veri SHA-256 + paket surumleri JSON'a yazilir.
Cikti: out/GSE66348_cocaine_rat_dmp.json
"""
import gzip, hashlib, json, sys, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
GZ = os.path.join(HERE, "GSE66348_norm.txt.gz")
OUTDIR = os.path.join(HERE, "out")
os.makedirs(OUTDIR, exist_ok=True)

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def bh_fdr(pvals):
    p = np.asarray(pvals, dtype=float)
    n = p.size
    order = np.argsort(p)
    ranked = p[order] * n / (np.arange(n) + 1)
    # enforce monotonicity
    ranked = np.minimum.accumulate(ranked[::-1])[::-1]
    q = np.empty(n)
    q[order] = np.clip(ranked, 0, 1)
    return q

def welch_t(a, b):
    # a, b: (n_probes, n_samples) arrays
    ma, mb = a.mean(1), b.mean(1)
    va, vb = a.var(1, ddof=1), b.var(1, ddof=1)
    na, nb = a.shape[1], b.shape[1]
    se2 = va / na + vb / nb
    se2 = np.where(se2 <= 0, np.nan, se2)
    t = (ma - mb) / np.sqrt(se2)
    # Welch-Satterthwaite df
    df = (se2 ** 2) / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1))
    return t, df, (ma - mb)

def t_sf_p(t, df):
    # two-sided p from t using scipy if available, else normal approx
    try:
        from scipy import stats
        return 2.0 * stats.t.sf(np.abs(t), df)
    except Exception:
        from math import erfc, sqrt
        # normal approximation (df large); honest fallback, flagged in output
        return np.array([erfc(abs(x) / sqrt(2)) for x in np.nan_to_num(t)])

def main():
    if not os.path.exists(GZ):
        print("HATA: veri dosyasi yok:", GZ); sys.exit(1)
    datasha = sha256(GZ)

    # --- load ---
    with gzip.open(GZ, "rt") as f:
        header = f.readline().rstrip("\n").split("\t")
    # header: ID_REF, Feature Numbers, <samples...>
    sample_cols = header[2:]
    # read numeric block
    ids = []
    rows = []
    with gzip.open(GZ, "rt") as f:
        f.readline()
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < len(header):
                continue
            ids.append(parts[0])
            rows.append(parts[2:])
    ids = np.array(ids, dtype=object)
    X = np.array(rows, dtype=float)  # (n_probes, n_samples)
    print(f"Yuklenen ham probe: {X.shape[0]}, ornek: {X.shape[1]}")

    # --- drop array control probes (Corner / spike-in / control) ---
    sid = np.array([str(s) for s in ids])
    ctrl_mask = np.array([
        ("corner" in s.lower()) or s.startswith("(") or s.startswith("3xSLv")
        or ("control" in s.lower()) or s.lower().startswith("nc_")
        for s in sid
    ])
    keep = ~ctrl_mask
    # also drop probes with any NaN
    keep &= ~np.isnan(X).any(1)
    ids, X = ids[keep], X[keep]
    print(f"Kontrol/NaN ayiklandiktan sonra probe: {X.shape[0]} ({int(ctrl_mask.sum())} kontrol probu atildi)")

    # --- group columns ---
    def cols_with(prefix):
        return [i for i, c in enumerate(sample_cols) if c.upper().startswith(prefix)]
    groups = {
        "CNTRL": cols_with("CNTRL"),
        "D1CUE": cols_with("D1CUE"),
        "D1NOCUE": cols_with("D1NOCUE"),
        "D30CUE": cols_with("D30CUE"),
        "D30NOCUE": cols_with("D30NOCUE"),
    }
    print("Grup n:", {k: len(v) for k, v in groups.items()})

    results = {
        "dataset": "GSE66348",
        "organism": "Rattus norvegicus",
        "tissue": "Nucleus Accumbens",
        "exposure": "cocaine self-administration + withdrawal (incubation of craving)",
        "platform_note": "methylation array, normalize log2-ratio (suppl: Normalized_data_with_probename)",
        "data_sha256": datasha,
        "n_probes_analyzed": int(X.shape[0]),
        "group_n": {k: len(v) for k, v in groups.items()},
        "method": "per-probe Welch t-test + Benjamini-Hochberg FDR",
        "numpy_version": np.__version__,
        "contrasts": {},
    }
    try:
        import scipy
        results["scipy_version"] = scipy.__version__
        results["p_method"] = "scipy.stats.t (exact)"
    except Exception:
        results["scipy_version"] = None
        results["p_method"] = "normal-approx fallback (scipy yok) — sonuc temkinli yorumlanmali"

    def run_contrast(name, idx_a, idx_b, label_a, label_b):
        a, b = X[:, idx_a], X[:, idx_b]
        t, df, eff = welch_t(a, b)
        p = t_sf_p(t, df)
        good = ~np.isnan(p)
        q = np.full_like(p, np.nan)
        q[good] = bh_fdr(p[good])
        n_sig = int(np.nansum(q < 0.05))
        n_sig01 = int(np.nansum(q < 0.10))
        # top by smallest q then |effect|
        ord_idx = np.lexsort((-np.abs(eff), np.nan_to_num(q, nan=1.0)))[:20]
        top = [{
            "probe": str(ids[i]),
            "delta_log2ratio": round(float(eff[i]), 4),
            "p": float(f"{p[i]:.3e}") if good[i] else None,
            "q_fdr": float(f"{q[i]:.3e}") if good[i] else None,
        } for i in ord_idx]
        results["contrasts"][name] = {
            "label": f"{label_a} (n={len(idx_a)}) vs {label_b} (n={len(idx_b)})",
            "n_sig_fdr05": n_sig,
            "n_sig_fdr10": n_sig01,
            "min_q": float(np.nanmin(q)) if good.any() else None,
            "top20": top,
        }
        print(f"[{name}] {label_a} vs {label_b}: FDR<0.05 = {n_sig}, FDR<0.10 = {n_sig01}, min_q = {results['contrasts'][name]['min_q']}")

    # primary: D30CUE vs CNTRL
    if groups["D30CUE"] and groups["CNTRL"]:
        run_contrast("D30CUE_vs_CNTRL", groups["D30CUE"], groups["CNTRL"], "D30CUE", "CNTRL")
    # secondary: all cocaine vs CNTRL
    coc = groups["D1CUE"] + groups["D1NOCUE"] + groups["D30CUE"] + groups["D30NOCUE"]
    if coc and groups["CNTRL"]:
        run_contrast("AllCocaine_vs_CNTRL", coc, groups["CNTRL"], "TumKokain", "CNTRL")

    outpath = os.path.join(OUTDIR, "GSE66348_cocaine_rat_dmp.json")
    with open(outpath, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("Yazildi:", outpath)

if __name__ == "__main__":
    main()
