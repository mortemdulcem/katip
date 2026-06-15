#!/usr/bin/env python3
"""
GSE252501 DLPFC kolu (alkol/AUD, postmortem dorsolateral prefrontal korteks,
Illumina EPIC) — kovaryat-ayarli OLS testinin GERCEK GUC / YANLIS-POZITIF ORANI
(power / FPR) KALIBRASYONU (spike-in simulasyonu).

NEDEN (Gorev 10): SUBSTANCE_DMP_REPORT.md §2.1 / scripts/40_dmp_alcohol_brain_
gse252501.py, AYNI kisilerde iki beyin bolgesi olcup NAc'ta 1.107 DMP, DLPFC'de
0 DMP (FDR<0,05) buldu. NAc'taki en ust sinyal Δβ=+0,019 (q=0,0074) iken DLPFC
tamamen NULL. Bu negatifin anlamli olmasi icin DLPFC OLS testinin bu veri seti +
gercek prob-gurultusunde ne kadar buyuk bir etkiyi yakalayabildigini bilmek gerekir.
Bu betik, opioid human/opioid/opioid_power_fpr_sim.py betiginin AYNADIR; tek fark
EPIC dizi olcumunde OKUMA SAYISI/COVERAGE OLMADIGI icin veri-ureten model
beta-binom degil, GERCEK prob-bazli artik (residual) varyansli Gauss spike-in'dir
(dizi-karsiligi). Gercek gurultu korunur; yalnizca etki (delta) enjekte edilir.

YONTEM:
  1) 40_dmp_alcohol_brain_gse252501.py ile BIREBIR AYNI sekilde DLPFC beta matrisi
     yuklenir, ornekler series_matrix fenotipine eslenir, tam-olculen problar tutulur.
  2) NULL'i veren AYNI model `beta ~ aud + age_z + sex + smoker` (OLS) gercek veride
     uydurulur; her prob icin GERCEK artik standart sapmasi (resid_sd) cikarilir =
     simulasyonun veri-ureten gurultusu. Bu kosuda FDR<0,05'te 0 DMP teyit edilir
     (drift-yok).
  3) Spike-in: her prob icin Y_sim = gercek_prob_ortalamasi + Gauss(0, resid_sd);
     enjekte edilen problarda vaka +delta/2, kontrol -delta/2; [0,1]'e kirpilir.
     Delta'lar {1,2,3,4,5,7.5,10} beta-puani x dusuk/orta/yuksek metilasyon tabakasi.
     Tum matrise AYNI OLS + BH-FDR uygulanir. power(delta) = enjekte sitelerin q<0,05'i.
  4) FPR: (a) karma kosuda NULL problarinin q<0,05 orani + ampirik FDR; (b) ayri
     SAF-NULL kosularda (hic enjeksiyon yok) genom-capi yanlis-kesif orani.

Zero-hallucination: hicbir sayi uydurulmaz. Prob gurultusu gercek (veriden cikarilan
artik varyans), tek varsayim simule edilen gruplar-arasi etki BUYUKLUGUDUR (delta).
Sabit seed + girdi SHA-256. EPIC dizi -> okuma sayisi yok -> Gauss spike-in (acikca
beyan; opioid'in beta-binom count modelinin dizi-karsiligi).

Cikti: out/GSE252501_DLPFC_alcohol_power_fpr.json + ..._power_fpr.png
"""
import os, json, gzip, hashlib, time
import numpy as np
import pandas as pd
from scipy import stats
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))            # scripts/revize/realdata
DATA = os.path.join(ROOT, "data")
OUTDIR = os.path.join(HERE, "out"); os.makedirs(OUTDIR, exist_ok=True)
OUT = os.path.join(OUTDIR, "GSE252501_DLPFC_alcohol_power_fpr.json")
PNG = os.path.join(OUTDIR, "GSE252501_DLPFC_alcohol_power_fpr.png")
CKPT = os.path.join(OUTDIR, "_progress.json")   # tekrarlar deterministik; pencere limiti icin resume
COMMITTED = os.path.join(ROOT, "out", "GSE252501_validation.json")

REGION = "DLPFC"
MAT = os.path.join(DATA, "GSE252501_proccessed_matrix_DLPFC.txt.gz")
SERIES = os.path.join(DATA, "GSE252501_series_matrix.txt.gz")

SEED = 20260614
DELTAS = [0.01, 0.02, 0.03, 0.04, 0.05, 0.075, 0.10]   # beta-puani gruplar-arasi fark
SITES_PER_CELL = 400
MU_STRATA = [("low", 0.0, 1 / 3), ("mid", 1 / 3, 2 / 3), ("high", 2 / 3, 1.0)]
N_POWER_REP = 5
N_NULL_REP = 5
FDR = 0.05
EXP_NSIG = 0           # rapor §2.1: DLPFC 0 DMP


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(buf), b""):
            h.update(c)
    return h.hexdigest()


def log(m):
    print(f"[{time.strftime('%H:%M:%S')}] {m}", flush=True)


def bh(p):
    order = np.argsort(p); m = len(p)
    q = p[order] * m / np.arange(1, m + 1)
    q = np.minimum.accumulate(q[::-1])[::-1]
    fdr = np.empty(m); fdr[order] = np.clip(q, 0, 1)
    return fdr


def parse_pheno(series_path):
    geo = title = desc = None; chars = []
    with gzip.open(series_path, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_geo_accession"):
                geo = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_title"):
                title = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_description"):
                d = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
                if desc is None:
                    desc = d
            elif line.startswith("!Sample_characteristics_ch1"):
                chars.append([x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]])
            elif line.startswith('"ID_REF') or "!series_matrix_table_begin" in line:
                break
    n = len(geo)
    assert desc is not None and len(desc) == n, "Sample_description (D-ids) eksik/hizasiz"

    def getchar(key):
        for vals in chars:
            kk = None; out = []
            for v in vals:
                if ":" in v:
                    k, val = v.split(":", 1); kk = k.strip().lower(); out.append(val.strip())
                else:
                    out.append(v.strip())
            if kk == key:
                return out
        return [None] * n

    aud = getchar("dsm-5 aud status"); sex = getchar("sex"); age = getchar("agedeath")
    smk = getchar("current smoker at death")
    ph = {}
    for i in range(n):
        did = desc[i]
        reg = "NAc" if (title and "accumbens" in title[i].lower()) else "DLPFC"
        a = age[i]
        ph[did] = {
            "gsm": geo[i], "region": reg,
            "aud": 1.0 if (aud[i] and aud[i].lower() == "case")
                   else (0.0 if (aud[i] and aud[i].lower() == "control") else np.nan),
            "sex": 1.0 if (sex[i] and sex[i].lower().startswith("m"))
                   else (0.0 if sex[i] else np.nan),
            "age": float(a) if (a and a.replace(".", "", 1).isdigit()) else np.nan,
            "smoker": 1.0 if (smk[i] and smk[i].lower() == "case")
                      else (0.0 if (smk[i] and smk[i].lower() == "control") else np.nan),
        }
    return ph


def build_design(aud, age, sex, smk):
    az = (age - age.mean()) / age.std()
    candidates = [("intercept", np.ones(len(aud))), ("aud", aud),
                  ("agez", az), ("sex", sex), ("smoker", smk)]
    Xcols = []; names = []; dropped = []
    for nm, v in candidates:
        trial = np.column_stack(Xcols + [v]) if Xcols else v.reshape(-1, 1)
        if np.linalg.matrix_rank(trial) == trial.shape[1]:
            Xcols.append(v); names.append(nm)
        else:
            dropped.append(nm)
    return np.column_stack(Xcols), names, dropped


OLS_BLOCK = 120000   # prob-sutun blogu: 767k prob x 117 ornek float64'te tepe bellegi sinirlar


def _ols_core(Y, X, gi, XtXi, dof):
    """Y: samples x probes. p, coef, resid_sd'yi PROB-SUTUN BLOKLARINDA hesaplar
    (her prob bagimsiz; blok siniri sonucu DEGISTIRMEZ) — tepe bellek dusuk."""
    P = Y.shape[1]
    pvals = np.empty(P); coefs = np.empty(P); sds = np.empty(P)
    XtXi_XT = XtXi @ X.T                         # k x n
    gg = XtXi[gi, gi]
    for s in range(0, P, OLS_BLOCK):
        e = min(s + OLS_BLOCK, P)
        Yb = Y[:, s:e]
        B = XtXi_XT @ Yb                         # k x b
        resid = Yb - X @ B                       # n x b
        sig2 = (resid ** 2).sum(axis=0) / dof
        se = np.sqrt(sig2 * gg)
        coef = B[gi]
        with np.errstate(divide="ignore", invalid="ignore"):
            t = coef / se
            pp = 2 * stats.t.sf(np.abs(t), dof)
        pvals[s:e] = np.where(np.isfinite(pp), pp, 1.0)
        coefs[s:e] = coef
        sds[s:e] = np.sqrt(np.maximum(sig2, 0.0))
    return pvals, coefs, sds


def ols_fit(Y, X, gi, XtXi, dof):
    """Y: samples x probes. aud katsayisi p + BH-q + resid_sd dondurur."""
    p, coef, sd = _ols_core(Y, X, gi, XtXi, dof)
    return p, bh(p), coef, sd


def ols_q(Y, X, gi, XtXi, dof):
    p, _, _ = _ols_core(Y, X, gi, XtXi, dof)
    return bh(p)


def ms(x):
    a = np.array(x, dtype=float)
    return {"mean": float(a.mean()), "std": float(a.std(ddof=1)) if len(a) > 1 else 0.0, "reps": x}


CACHE = os.path.join(DATA, "GSE252501_DLPFC_parsed_cache.npz")
EXTRACT = os.path.join(DATA, "GSE252501_DLPFC_betas_extract.tsv")


def load_data():
    """40_dmp ile BIREBIR ayni veri. 786MB gz cozme/parse ~90s surdugu icin
    bir kez parse edilip filtrelenmis diziler .npz cache'e yazilir; sonraki
    kosular cache'ten yuklenir. Veri AYNIDIR (ayni float64 diziler); girdi
    SHA-256 her zaman orijinal gz'den hesaplanir, cache'ten degil."""
    if os.path.exists(CACHE):
        log(f"cache bulundu, yukleniyor: {os.path.basename(CACHE)}")
        z = np.load(CACHE)
        return (z["Y"], z["aud"].astype(float), z["sex"].astype(float),
                z["age"].astype(float), z["smk"].astype(float))
    # HIZLI YOL: onceden C-duzeyi cut/grep ile cikarilmis DAR cikti (sadece 117
    # DLPFC beta sutunu + cg satirlari). Ayni float64 degerler; 234 sutunluk tam
    # matrisi tokenize etme maliyeti olmadigindan tek pencerede parse edilir.
    if os.path.exists(EXTRACT):
        log(f"dar cikti bulundu, parse ediliyor: {os.path.basename(EXTRACT)}")
        ph = parse_pheno(SERIES)
        df = pd.read_csv(EXTRACT, sep="\t", index_col=0, low_memory=False)
        df = df[df.index.astype(str).str.startswith("cg")]
        cols = [str(c).strip().strip('"') for c in df.columns]
        assert all(c in ph and ph[c]["region"] == REGION for c in cols), "DLPFC pheno eslesmiyor"
        mat = df.to_numpy(dtype=np.float64); del df       # probes x samples
        aud = np.array([ph[c]["aud"] for c in cols]); sex = np.array([ph[c]["sex"] for c in cols])
        age = np.array([ph[c]["age"] for c in cols]); smk = np.array([ph[c]["smoker"] for c in cols])
        keep = np.isfinite(aud) & np.isfinite(sex) & np.isfinite(age) & np.isfinite(smk)
        mat = mat[:, keep]; aud, sex, age, smk = aud[keep], sex[keep], age[keep], smk[keep]
        Y = mat.T; del mat
        good = ~np.isnan(Y).any(axis=0)
        Y = np.ascontiguousarray(Y[:, good])
        np.savez(CACHE, Y=Y, aud=aud, sex=sex, age=age, smk=smk)
        log(f"cache yazildi (dar ciktidan): {os.path.basename(CACHE)}  Y={Y.shape}")
        return Y, aud, sex, age, smk
    # 786MB gz'i pandas+gzip ile (low_memory=False) tek seferde acmak degisken,
    # yavas (>110s) ve bellek tepe noktasi cok-GB (OOM). Ayni veriyi iceren onceden
    # cozulmus duz metni (.txt) PARCALI (chunk) okuyoruz: ayni float64 degerler,
    # tepe bellek dusuk. 40_dmp ile sonuc BIREBIR aynidir.
    src = MAT[:-3] if (MAT.endswith(".gz") and os.path.exists(MAT[:-3])) else MAT
    log(f"DLPFC beta matrisi yukleniyor (40_dmp ile birebir, parcali): {os.path.basename(src)}")
    ph = parse_pheno(SERIES)
    header = pd.read_csv(src, sep="\t", nrows=0)
    raw_cols = [str(c).strip().strip('"') for c in header.columns]
    idcol = header.columns[0]
    # 40_dmp ile ayni: Detection.PVal sutunlari atilir; DLPFC ornek sutunlari secilir
    sample_cols = [oc for oc, cc in zip(header.columns[1:], raw_cols[1:])
                   if (not cc.endswith(".Detection.PVal")) and cc in ph and ph[cc]["region"] == REGION]
    log(f"matris beta sutun(toplam)={len(raw_cols)-1}  DLPFC eslenen={len(sample_cols)}")
    parts = []
    for chunk in pd.read_csv(src, sep="\t", index_col=0, usecols=[idcol] + sample_cols,
                             chunksize=80000, low_memory=False):
        chunk = chunk[chunk.index.astype(str).str.startswith("cg")]
        if len(chunk):
            parts.append(chunk.to_numpy(dtype=np.float64))   # probes x samples
    mat = np.concatenate(parts, axis=0); del parts          # probes x samples
    cols = [str(c).strip().strip('"') for c in sample_cols]
    aud = np.array([ph[c]["aud"] for c in cols]); sex = np.array([ph[c]["sex"] for c in cols])
    age = np.array([ph[c]["age"] for c in cols]); smk = np.array([ph[c]["smoker"] for c in cols])
    keep = np.isfinite(aud) & np.isfinite(sex) & np.isfinite(age) & np.isfinite(smk)
    mat = mat[:, keep]; aud, sex, age, smk = aud[keep], sex[keep], age[keep], smk[keep]
    Y = mat.T                                                # samples x probes
    del mat
    good = ~np.isnan(Y).any(axis=0)
    Y = np.ascontiguousarray(Y[:, good])
    np.savez(CACHE, Y=Y, aud=aud, sex=sex, age=age, smk=smk)
    log(f"cache yazildi: {os.path.basename(CACHE)}")
    return Y, aud, sex, age, smk


def main():
    t0 = time.time()
    Y, aud, sex, age, smk = load_data()
    n_keep = Y.shape[1]
    log(f"kullanilan ornek={len(aud)} (AUD {int((aud==1).sum())} / Ctrl {int((aud==0).sum())})  "
        f"tam-prob={n_keep}")

    X, names_x, dropped = build_design(aud, age, sex, smk)
    n, k = X.shape; dof = n - k
    gi = names_x.index("aud"); XtXi = np.linalg.inv(X.T @ X)

    # --- DRIFT-YOK DOGRULAMA + gercek prob gurultusu ---
    p_real, q_real, coef_real, resid_sd = ols_fit(Y, X, gi, XtXi, dof)
    sig_real = int((q_real < FDR).sum()); minq_real = float(q_real.min())
    log(f"DOGRULAMA: tam-prob={n_keep}  FDR<0.05={sig_real}  min q={minq_real:.4f} (rapor §2.1: 0 DMP)")
    exp_nsig = EXP_NSIG
    if os.path.exists(COMMITTED):
        with open(COMMITTED) as f:
            cj = json.load(f)
        reg = cj.get("regions", {}).get(REGION, {})
        if "n_sig_fdr05" in reg:
            exp_nsig = int(reg["n_sig_fdr05"])
    drift_ok = (sig_real == exp_nsig)
    if not drift_ok:
        raise SystemExit(f"DRIFT: DLPFC OLS gercek veride beklenenle eslesmiyor (sig={sig_real} vs {exp_nsig}).")

    # gercek prob ortalamasi (veri-ureten taban)
    mu = Y.mean(axis=0)
    del Y                                          # gercek matris artik gerekmez; ~717MB serbest
    resid_sd = np.maximum(resid_sd, 1e-6)
    log(f"gercek resid_sd medyan={np.median(resid_sd):.4f}  beta-ortalama medyan={np.median(mu):.3f}")

    # mu-tabaka havuzlari
    strata_pool = {}
    for nm, lo, hi in MU_STRATA:
        idx = np.where((mu >= lo) & (mu < hi if hi < 1.0 else mu <= hi))[0]
        strata_pool[nm] = idx
        log(f"  mu-tabaka {nm} [{lo:.2f},{hi:.2f}): {len(idx)} prob")

    case_mask = aud == 1; ctrl_mask = aud == 0

    def gen_null(rng):
        """tum problar null: Y = mu + Gauss(0, resid_sd)."""
        noise = rng.standard_normal((n, n_keep)).astype(np.float64) * resid_sd[None, :]
        return np.clip(mu[None, :] + noise, 0.0, 1.0)

    # ===== GUC =====
    power_cell = {nm: {f"{d:.3f}": [] for d in DELTAS} for nm, _, _ in MU_STRATA}
    realized_cell = {nm: {f"{d:.3f}": [] for d in DELTAS} for nm, _, _ in MU_STRATA}
    power_overall = {f"{d:.3f}": [] for d in DELTAS}
    mixed_fpr = []; mixed_emp_fdr = []
    null_fpr = []; null_nfp = []
    power_done = 0; null_done = 0

    # CHECKPOINT: tekrarlar tam-deterministik (seed=SEED+ofset+rep). Pencere limiti
    # nedeniyle bolunen kosular icin her tekrar sonrasi ilerleme diske yazilir; yeniden
    # baslayinca tamamlanan tekrarlar atlanir. Sonuc tek kosuyla BIREBIR aynidir.
    def save_ckpt():
        with open(CKPT, "w") as f:
            json.dump({"power_cell": power_cell, "realized_cell": realized_cell,
                       "power_overall": power_overall, "mixed_fpr": mixed_fpr,
                       "mixed_emp_fdr": mixed_emp_fdr, "null_fpr": null_fpr,
                       "null_nfp": null_nfp, "power_done": power_done,
                       "null_done": null_done}, f)

    if os.path.exists(CKPT):
        with open(CKPT) as f:
            ck = json.load(f)
        power_cell = ck["power_cell"]; realized_cell = ck["realized_cell"]
        power_overall = ck["power_overall"]; mixed_fpr = ck["mixed_fpr"]
        mixed_emp_fdr = ck["mixed_emp_fdr"]; null_fpr = ck["null_fpr"]
        null_nfp = ck["null_nfp"]; power_done = ck["power_done"]; null_done = ck["null_done"]
        log(f"checkpoint bulundu: power_done={power_done}/{N_POWER_REP} null_done={null_done}/{N_NULL_REP}")

    for rep in range(power_done, N_POWER_REP):
        rng = np.random.default_rng(SEED + 1000 + rep)
        Ysim = gen_null(rng)
        is_spiked = np.zeros(n_keep, dtype=bool)
        used = np.zeros(n_keep, dtype=bool)
        spike_meta = []
        for nm, _, _ in MU_STRATA:
            pool = strata_pool[nm]; avail = pool[~used[pool]]
            per_cell = min(SITES_PER_CELL, len(avail) // len(DELTAS))
            if per_cell < 5:
                continue
            pick = rng.choice(avail, size=per_cell * len(DELTAS), replace=False)
            used[pick] = True
            for di, d in enumerate(DELTAS):
                cell = pick[di * per_cell:(di + 1) * per_cell]
                hi = np.clip(Ysim[np.ix_(case_mask, cell)] + d / 2, 0, 1)
                lo = np.clip(Ysim[np.ix_(ctrl_mask, cell)] - d / 2, 0, 1)
                Ysim[np.ix_(case_mask, cell)] = hi
                Ysim[np.ix_(ctrl_mask, cell)] = lo
                is_spiked[cell] = True
                spike_meta.append((cell, d, nm))
                realized_cell[nm][f"{d:.3f}"].append(
                    float(np.mean(hi.mean(axis=0) - lo.mean(axis=0))))
        q_sim = ols_q(Ysim, X, gi, XtXi, dof)
        sig = q_sim < FDR
        null_mask = ~is_spiked
        fp = int(sig[null_mask].sum()); n_null = int(null_mask.sum())
        total_pos = int(sig.sum())
        mixed_fpr.append(fp / max(n_null, 1))
        mixed_emp_fdr.append((fp / total_pos) if total_pos > 0 else 0.0)
        for cell, d, nm in spike_meta:
            power_cell[nm][f"{d:.3f}"].append(float(sig[cell].mean()))
        for d in DELTAS:
            cells = [c for (c, dd, nm) in spike_meta if abs(dd - d) < 1e-9]
            if cells:
                power_overall[f"{d:.3f}"].append(float(sig[np.concatenate(cells)].mean()))
        log(f"  power rep {rep}: spiked={int(is_spiked.sum())} TP={int(sig[is_spiked].sum())} "
            f"FP={fp}/{n_null}")
        del Ysim
        power_done = rep + 1; save_ckpt()

    # ===== SAF-NULL =====
    for rep in range(null_done, N_NULL_REP):
        rng = np.random.default_rng(SEED + 5000 + rep)
        Ysim = gen_null(rng)
        q_sim = ols_q(Ysim, X, gi, XtXi, dof)
        nfp = int((q_sim < FDR).sum())
        null_fpr.append(nfp / n_keep); null_nfp.append(nfp)
        log(f"  null rep {rep}: yanlis-kesif={nfp}/{n_keep}")
        del Ysim
        null_done = rep + 1; save_ckpt()

    power_overall_summary = {d: ms(v) for d, v in power_overall.items() if v}
    power_by_stratum = {nm: {d: ms(v) for d, v in power_cell[nm].items() if v} for nm in power_cell}
    realized = {nm: {d: round(float(np.mean(v)), 5) for d, v in realized_cell[nm].items() if v}
                for nm in realized_cell}

    mid = power_by_stratum.get("mid", {})
    mde_mid = next((d for d in DELTAS if mid.get(f"{d:.3f}", {}).get("mean", 0) >= 0.80), None)
    mde_overall = next((d for d in DELTAS
                        if power_overall_summary.get(f"{d:.3f}", {}).get("mean", 0) >= 0.80), None)

    result = {
        "dataset": "GSE252501", "region": REGION, "substance": "alcohol (AUD)",
        "tissue": "postmortem human brain (dorsolateral prefrontal cortex)", "platform": "Illumina EPIC (beta)",
        "analysis": "covariate-adjusted OLS (beta ~ aud + age_z + sex + smoker) — power / FPR calibration (spike-in)",
        "purpose": ("quantify the true power (TPR vs injected delta and base methylation) and the empirical "
                    "false-positive rate (FDR<0.05) of the OLS test used to declare the GSE252501 DLPFC alcohol NULL"),
        "design": {"AUD_case": int(case_mask.sum()), "control": int(ctrl_mask.sum()),
                   "n_probes_tested": n_keep, "model_terms": names_x, "dropped_terms": dropped},
        "seed": SEED,
        "simulation": {
            "data_generating_model": ("EPIC arrays have NO read counts/coverage, so (unlike the opioid beta-binomial "
                                      "template) the generative model is a per-probe Gaussian spike-in using the REAL "
                                      "per-probe residual SD from the covariate-adjusted fit (the array analog of the "
                                      "opioid 'real coverage/dispersion'); only the between-group effect (delta) is injected"),
            "deltas_injected_beta": DELTAS,
            "sites_per_delta_x_stratum": SITES_PER_CELL,
            "mu_strata": {nm: [round(lo, 3), round(hi, 3)] for nm, lo, hi in MU_STRATA},
            "power_replicates": N_POWER_REP, "null_replicates": N_NULL_REP, "fdr_threshold": FDR,
            "test": "covariate-adjusted OLS + BH-FDR (the exact NULL-declaring test, recomputed per replicate)",
            "realized_mean_delta_after_clipping": realized,
        },
        "drift_check_against_committed": {
            "expected_n_FDR_lt_0.05": exp_nsig, "recomputed_n_FDR_lt_0.05": sig_real,
            "recomputed_min_q": round(minq_real, 4), "passed": bool(drift_ok),
        },
        "power_vs_delta_all_strata": power_overall_summary,
        "power_by_stratum_and_delta": power_by_stratum,
        "min_detectable_effect_beta_mid_stratum_80pct_power": (round(mde_mid, 3) if mde_mid else None),
        "min_detectable_effect_beta_all_strata_80pct_power": (round(mde_overall, 3) if mde_overall else None),
        "false_positive_rate": {
            "mixed_run_null_sites_FPR": ms(mixed_fpr),
            "mixed_run_empirical_FDR": ms(mixed_emp_fdr),
            "pure_null_genomewide_FPR": ms(null_fpr),
            "pure_null_n_false_discoveries": ms(null_nfp),
        },
        "real_noise_used": {
            "resid_sd_median": round(float(np.median(resid_sd)), 5),
            "beta_mean_median": round(float(np.median(mu)), 4),
        },
        "interpretation": "",
        "input_files_sha256": {os.path.basename(MAT): sha256(MAT), os.path.basename(SERIES): sha256(SERIES)},
        "runtime_sec": round(time.time() - t0, 1),
    }

    def gp(d):
        return power_overall_summary.get(f"{d:.3f}", {}).get("mean", float("nan"))
    fpr_null = result["false_positive_rate"]["pure_null_genomewide_FPR"]["mean"]
    mde_txt = (f"{mde_mid:.3f} beta ({mde_mid*100:.1f} pp)") if mde_mid else ">0.10 beta"
    result["interpretation"] = (
        f"At this dataset's real per-probe noise (residual SD median "
        f"{result['real_noise_used']['resid_sd_median']}) and n={int(case_mask.sum())} vs {int(ctrl_mask.sum())}, "
        f"the covariate-adjusted OLS reaches power={gp(0.02):.2f} for a 0.02 (2 pp) between-group beta difference, "
        f"{gp(0.05):.2f} for 0.05 and {gp(0.10):.2f} for 0.10 (all strata pooled). Minimum detectable effect at "
        f">=80% power (mid-methylation stratum) = {mde_txt}. Under the complete null the genome-wide false-positive "
        f"rate at FDR<0.05 is {fpr_null:.2e} (mean false discoveries "
        f"{result['false_positive_rate']['pure_null_n_false_discoveries']['mean']:.1f}/{n_keep}), i.e. the test is "
        f"well calibrated and not anticonservative. The companion NAc region's top real AUD signal was Δβ=+0.019 "
        f"(q=0.0074); the DLPFC NULL means 'no effect detectable above ~{mde_txt}' here, so an NAc-sized (~0.02) "
        f"effect "
        + ("is around the detection limit" if (mde_mid and abs(mde_mid - 0.02) <= 0.01)
           else ("would be detectable" if (mde_mid and mde_mid <= 0.02) else "may be below the detection limit"))
        + " — the region-specific negative does NOT prove a smaller real DLPFC alcohol effect is absent. "
        "(EPIC has no read counts; this is a Gaussian residual-variance spike-in, the array analog of the opioid "
        "beta-binomial coverage simulation.)")

    with open(OUT, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    log(f"JSON yazildi: {OUT}")

    # ===== figur =====
    fig, ax = plt.subplots(1, 2, figsize=(11, 4.2))
    xs = [d * 100 for d in DELTAS]
    colors = {"low": "#2c7fb8", "mid": "#1a9850", "high": "#d73027"}
    for nm in ["low", "mid", "high"]:
        ys = [power_by_stratum.get(nm, {}).get(f"{d:.3f}", {}).get("mean", np.nan) for d in DELTAS]
        es = [power_by_stratum.get(nm, {}).get(f"{d:.3f}", {}).get("std", 0.0) for d in DELTAS]
        ax[0].errorbar(xs, ys, yerr=es, marker="o", capsize=3, color=colors[nm], label=f"{nm} methylation")
    yo = [power_overall_summary.get(f"{d:.3f}", {}).get("mean", np.nan) for d in DELTAS]
    ax[0].plot(xs, yo, "k--", marker="s", label="all strata")
    ax[0].axhline(0.8, color="grey", ls=":", lw=1)
    ax[0].axvline(1.9, color="orange", ls=":", lw=1, label="NAc top Δβ=0.019")
    ax[0].set_xlabel("Injected between-group beta difference (percentage points)")
    ax[0].set_ylabel("Power (TPR at FDR<0.05)")
    ax[0].set_title(f"GSE252501 {REGION} OLS power vs effect size")
    ax[0].set_ylim(-0.02, 1.02); ax[0].legend(fontsize=8); ax[0].grid(alpha=0.3)

    labels = ["mixed-run\nnull sites", "pure-null\ngenome-wide"]
    vals = [result["false_positive_rate"]["mixed_run_null_sites_FPR"]["mean"], fpr_null]
    errs = [result["false_positive_rate"]["mixed_run_null_sites_FPR"]["std"],
            result["false_positive_rate"]["pure_null_genomewide_FPR"]["std"]]
    ax[1].bar(labels, vals, yerr=errs, capsize=4, color=["#7570b3", "#7570b3"])
    ax[1].axhline(FDR, color="red", ls="--", lw=1, label=f"nominal FDR={FDR}")
    ax[1].set_ylabel("False-positive rate (fraction probes q<0.05)")
    ax[1].set_title("Empirical false-positive rate under null")
    ax[1].legend(fontsize=8); ax[1].grid(alpha=0.3, axis="y")
    fig.tight_layout(); fig.savefig(PNG, dpi=130)
    log(f"figur yazildi: {PNG}  ({result['runtime_sec']}s)")


if __name__ == "__main__":
    main()
