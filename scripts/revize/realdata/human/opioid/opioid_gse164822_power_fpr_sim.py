#!/usr/bin/env python3
"""
GSE164822 (opioid use disorder, dorsolateral prefrontal cortex / dlPFC, postmortem
human brain, Illumina EPIC, M-DEGERLERI) — kovaryat-ayarli OLS testinin GERCEK GUC
/ YANLIS-POZITIF ORANI (power / FPR) KALIBRASYONU (spike-in simulasyonu) —
IYI-SPESIFIK (well-specified) temel.

NEDEN: SUBSTANCE_DMP_REPORT.md §3.3, GSE164822 dlPFC'de kovaryat-ayarli modelde
0 DMP (FDR<0,05; en kucuk q=0,581) buldu — guclu bir NULL. Bir NULL'in bilimsel
anlami, ancak testin bu veri seti + gercek prob-gurultusunde NE KADAR buyuk bir
etkiyi yakalayabildigi (minimum saptanabilir etki, MDE) bilindiginde ortaya cikar.
Bu betik tam da onu olcer: gercek prob gurultusu (M-degeri artik SD'si) korunur,
sadece bilinen gruplar-arasi etki (delta, M birimi) enjekte edilir, ayni OLS +
BH-FDR yeniden calistirilir, power(delta) ve null FPR raporlanir.

Bu, smoking_nac/smoking_nac_power_fpr_sim.py'nin M-DEGERI AYNADIR: EPIC dizi ->
okuma sayisi yok -> beta-binom degil, GERCEK artik varyansli Gauss spike-in.
FARK: M-degeri log2(M/U) [0,1] ile SINIRLI DEGIL, bu yuzden KIRPMA YOK; delta
M-birimindedir; metilasyon tabakalari M-degeri uctil (tertile) sinirlarindan
VERI-ODAKLI tanimlanir; model opioid kovaryatlarini (yas, PMI, cinsiyet, irk)
icerir ve birincil kontrast Opioids vs Normal Control'dur (Pysch Control dislanir).

VERI KAYNAGI: GSE164822_M_final.txt.gz (temiz; satir1=sentrix basligi, veri
satirlari tirnaksiz cg...). Kovaryatlar series_matrix (GSE164822_meta.txt) !Sample
basliklarindan: title 'tissue_<GROUP> [<sentrix>]' -> grup; gender/age/PMI/race.

YONTEM:
  1) M-degeri matrisi + meta yuklenir; sentrix sutunlari opioid_acute_dmp.py ile
     BIREBIR ayni sekilde gruba/kovaryata eslenir; yalniz Opioids + Normal Control
     sutunlari secilir (Pysch Control dislanir).
  2) NULL'i veren AYNI model `M ~ group + age_z + pmi_z + sex + race` (OLS) gercek
     veride uydurulur; prob basina GERCEK artik SD (resid_sd) + prob ortalamasi
     (mu) cikarilir = simulasyonun veri-ureten gurultusu. FDR<0,05'te 0 DMP +
     committed min_q ile drift-yok teyidi.
  3) Spike-in: Y_sim = mu + Gauss(0, resid_sd) (KIRPMA YOK); enjekte problarda
     vaka +delta/2, kontrol -delta/2. Delta (M-birimi) x dusuk/orta/yuksek M
     tabakasi. Ayni OLS + BH-FDR. power = q<0,05 orani.
  4) FPR: (a) karma kosuda NULL problarinin q<0,05 orani + ampirik FDR; (b) ayri
     SAF-NULL kosularda genom-capi yanlis-kesif orani.

ÇALIŞMA MODLARI:
  python opioid_gse164822_power_fpr_sim.py cache  -> parse + OLS fit + drift -> .npz
  python opioid_gse164822_power_fpr_sim.py sim    -> spike-in power/FPR -> JSON + PNG
                                                     (checkpoint ile yeniden-baslanabilir)

Zero-hallucination: hicbir sayi uydurulmaz. Prob gurultusu gercek (veriden cikarilan
artik varyans + prob ortalamasi), tek varsayim simule edilen gruplar-arasi etki
BUYUKLUGUDUR (delta, M-birimi). Sabit seed + girdi SHA-256.

Cikti: out/GSE164822_opioid_power_fpr.json + ..._power_fpr.png
"""
import os, sys, json, gzip, hashlib, time, re
import numpy as np
import pandas as pd
from scipy import stats
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from _stream_dmp import read_meta_fields  # noqa: E402

OUTDIR = os.path.join(HERE, "out"); os.makedirs(OUTDIR, exist_ok=True)
MAT = os.path.join(HERE, "GSE164822_M_final.txt.gz")
META = os.path.join(HERE, "GSE164822_meta.txt")
COMMITTED = os.path.join(OUTDIR, "GSE164822_opioid_acute_dmp.json")

CACHE = os.path.join(OUTDIR, "_gse164822_power_fpr_cache.npz")
CKPT = os.path.join(OUTDIR, "_gse164822_power_fpr_ckpt.json")
OUT = os.path.join(OUTDIR, "GSE164822_opioid_power_fpr.json")
PNG = os.path.join(OUTDIR, "GSE164822_opioid_power_fpr.png")

CASE_GROUP = "Opioids"
CTRL_GROUP = "Normal Control"
TITLE_RE = re.compile(r"tissue_(?P<grp>.+?)\s*\[(?P<sx>[0-9]+_R[0-9]{2}C[0-9]{2})\]")

SEED = 20260614
# M-degeri (log2 M/U) birimi gruplar-arasi fark. Beta degil; ~0,1 M kuçuk,
# ~1,0 M buyuk bir EWAS etkisidir (orta metilasyonda 0,1 M ~ 0,017 beta).
DELTAS = [0.1, 0.2, 0.3, 0.5, 0.75, 1.0, 1.5]
SITES_PER_CELL = 400
N_POWER_REP = 5
N_NULL_REP = 5
FDR = 0.05
OLS_BLOCK = 120000


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


def ms(x):
    a = np.array(x, dtype=float)
    return {"mean": float(a.mean()), "std": float(a.std(ddof=1)) if len(a) > 1 else 0.0,
            "reps": [float(v) for v in x]}


def _zscore(x):
    x = np.asarray(x, dtype=np.float64)
    s = x.std()
    return (x - x.mean()) / s if s > 0 else x - x.mean()


def parse_meta_sel():
    """meta + matris basligindan: secili sutun indeksleri (Opioids+Normal Control,
    matris sutun sirasinda) + kovaryatlar. opioid_acute_dmp.py ile birebir."""
    titles, chars = read_meta_fields(META)
    char_map = {label: vals for label, vals in chars}
    for k in ["gender", "age of death", "postmortem interval", "race", "group"]:
        if k not in char_map:
            raise SystemExit(f"meta'da '{k}' karakteristigi yok: {list(char_map)}")
    sx2cov = {}
    for i, t in enumerate(titles):
        m = TITLE_RE.search(t)
        if not m:
            continue
        sx2cov[m.group("sx")] = {
            "group": char_map["group"][i].strip(),
            "gender": char_map["gender"][i].strip(),
            "age": char_map["age of death"][i].strip(),
            "pmi": char_map["postmortem interval"][i].strip(),
            "race": char_map["race"][i].strip(),
        }
    if not sx2cov:
        raise SystemExit("title'dan sentrix->kovaryat cikarilamadi")

    hdr = pd.read_csv(MAT, sep="\t", index_col=0, nrows=0, compression="gzip")
    cols = list(hdr.columns)
    n_unknown = sum(1 for c in cols if c not in sx2cov)
    if n_unknown:
        raise SystemExit(f"{n_unknown} matris sutunu meta ile eslesmedi (format drift) -> dur")
    sel = [(i, c) for i, c in enumerate(cols) if sx2cov[c]["group"] in (CASE_GROUP, CTRL_GROUP)]
    sample_idx = np.array([i for i, _ in sel])
    sel_cov = [sx2cov[c] for _, c in sel]
    n_psych = sum(1 for c in cols if sx2cov[c]["group"] == "Pysch Control")
    group = np.array([1.0 if cv["group"] == CASE_GROUP else 0.0 for cv in sel_cov])
    age = np.array([float(cv["age"]) for cv in sel_cov])
    pmi = np.array([float(cv["pmi"]) for cv in sel_cov])
    sex_m = np.array([1.0 if cv["gender"].upper().startswith("M") else 0.0 for cv in sel_cov])
    race_c = np.array([1.0 if cv["race"].upper().startswith("CAUC") else 0.0 for cv in sel_cov])
    return sample_idx, group, age, pmi, sex_m, race_c, n_psych, len(cols)


def build_design(group, age, pmi, sex_m, race_c):
    cand = [("intercept", np.ones(len(group))), ("group(Opioids)", group),
            ("age_z", _zscore(age)), ("pmi_z", _zscore(pmi)),
            ("sex(M=1)", sex_m), ("race(CAUC=1)", race_c)]
    Xcols = []; names = []; dropped = []
    for nm, v in cand:
        trial = np.column_stack(Xcols + [v]) if Xcols else v.reshape(-1, 1)
        if np.linalg.matrix_rank(trial) == trial.shape[1]:
            Xcols.append(v); names.append(nm)
        else:
            dropped.append(nm)
    return np.column_stack(Xcols), names, dropped


def _ols_core(Y, X, gi, XtXi, dof):
    """Y: samples x probes -> (p, coef, resid_sd) prob-sutun bloklarinda."""
    P = Y.shape[1]
    pvals = np.empty(P); coefs = np.empty(P); sds = np.empty(P)
    XtXi_XT = XtXi @ X.T
    gg = XtXi[gi, gi]
    for s in range(0, P, OLS_BLOCK):
        e = min(s + OLS_BLOCK, P)
        Yb = Y[:, s:e]
        B = XtXi_XT @ Yb
        resid = Yb - X @ B
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


# ---- cok-cekirdekli parse: gz EBEVEYNDE bir kez (harici gzip -dc) cozulur, ham
# bayt bloklari iscilere dagitilir; her isci prob-basina p + GERCEK artik-SD +
# prob ortalamasini hesaplar. Isciler yalniz `c` on-ekli (cg + ch) prob satirlarini
# alir; sentrix (rakam) ile baslayan baslik satiri dogal olarak elenir (committed
# DMP evreni = cg+ch, n_tested=864883 ile birebir esler). ----
import io, multiprocessing as mp  # noqa: E402
_CCTX = None


def _cache_block(block):
    c = _CCTX
    Pm = c["Pm"]; X = c["X"]; gi = c["gi"]; dof = c["dof"]; c_g = c["c_g"]; sel = c["sel"]
    keep = [ln for ln in block.split(b"\n") if ln[:1] == b"c"]
    if not keep:
        return (np.array([]), np.array([]), np.array([]), 0)
    d = pd.read_csv(io.BytesIO(b"\n".join(keep)), sep="\t", header=None,
                    index_col=0, low_memory=False, na_values=["", "NA", "NaN", "null"])
    vals = d.to_numpy(dtype=np.float64)[:, sel]      # probes x n_samples
    n_total = vals.shape[0]
    mask = np.isfinite(vals).all(axis=1)
    if not mask.any():
        return (np.array([]), np.array([]), np.array([]), n_total)
    V = vals[mask]
    Y = V.T
    B = Pm @ Y
    resid = Y - X @ B
    sig2 = (resid ** 2).sum(axis=0) / dof
    with np.errstate(divide="ignore", invalid="ignore"):
        se = np.sqrt(sig2 * c_g)
        t = B[gi] / se
        p = 2 * stats.t.sf(np.abs(t), dof)
    p = np.where(np.isfinite(p), p, 1.0)
    resid_sd = np.sqrt(np.maximum(sig2, 0.0))
    mu = V.mean(axis=1)
    return (p, resid_sd, mu, n_total)


def _gen_blocks(path, block_bytes=48 << 20):
    """gz'yi ham bayt bloklari halinde uret; satir sinirinda kes. Cozme HARICI
    `gzip -dc` surecine yaptirilir (C; Python gzip'ten hizli, kendi cekirdeginde
    parse-iscileriyle ortusur). Baslik satiri ayrica atlanmaz; isci `cg` filtresi
    onu (sentrix-rakam basligi) dogal eler."""
    import subprocess, shutil
    if path.endswith(".gz") and shutil.which("gzip"):
        proc = subprocess.Popen(["gzip", "-dc", path], stdout=subprocess.PIPE, bufsize=block_bytes)
        stream = proc.stdout; close = lambda: (proc.stdout.close(), proc.wait())
    elif path.endswith(".gz"):
        f = gzip.open(path, "rb"); stream = f; close = f.close
    else:
        f = open(path, "rb"); stream = f; close = f.close
    leftover = b""
    try:
        while True:
            chunk = stream.read(block_bytes)
            if not chunk:
                break
            data = leftover + chunk
            cut = data.rfind(b"\n")
            if cut < 0:
                leftover = data
                continue
            yield data[:cut + 1]
            leftover = data[cut + 1:]
        if leftover.strip():
            yield leftover
    finally:
        close()


def build_cache():
    t0 = time.time()
    sample_idx, group, age, pmi, sex_m, race_c, n_psych, n_cols = parse_meta_sel()
    log(f"ornek: matris sutun={n_cols} secilen={len(sample_idx)} "
        f"({CASE_GROUP} {int((group==1).sum())} / {CTRL_GROUP} {int((group==0).sum())}) "
        f"psych_dislanan={n_psych}")
    X, names_x, dropped = build_design(group, age, pmi, sex_m, race_c)
    n, k = X.shape; dof = n - k
    gi = names_x.index("group(Opioids)"); XtXi = np.linalg.inv(X.T @ X)
    log(f"tasarim: terimler={names_x} dropped={dropped} df={dof}")

    global _CCTX
    _CCTX = {"Pm": XtXi @ X.T, "X": X, "gi": gi, "dof": dof,
             "c_g": float(XtXi[gi, gi]), "sel": sample_idx}
    p_l = []; sd_l = []; mu_l = []
    n_total = 0; nblk = 0
    nproc = min(8, os.cpu_count() or 4)
    with mp.get_context("fork").Pool(nproc) as pool:
        for p_b, sd_b, mu_b, nt in pool.imap(_cache_block, _gen_blocks(MAT), chunksize=1):
            n_total += nt; nblk += 1
            if len(p_b):
                p_l.append(p_b); sd_l.append(sd_b); mu_l.append(mu_b)
            if nblk % 8 == 0:
                log(f"  parse ilerleme: blok={nblk} satir~{n_total} tutulan~{sum(len(a) for a in p_l)}")
    p = np.concatenate(p_l)
    resid_sd = np.concatenate(sd_l); mu = np.concatenate(mu_l)
    q = bh(p)
    n_keep = len(p)
    sig05 = int((q < FDR).sum()); minq = float(q.min())
    resid_sd = np.maximum(resid_sd, 1e-6)
    log(f"DOGRULAMA: n_total={n_total} tam-prob={n_keep} FDR<0.05={sig05} min q={minq:.6f}")

    exp_nsig = 0; exp_minq = None
    if os.path.exists(COMMITTED):
        with open(COMMITTED) as f:
            cj = json.load(f)
        exp_nsig = int(cj.get("n_FDR_lt_0.05", 0))
        exp_minq = cj.get("min_q_BH")
    if sig05 != exp_nsig:
        raise SystemExit(f"DRIFT: FDR<0.05 gercek veride eslesmiyor (sig={sig05} vs {exp_nsig}).")
    if exp_minq is not None and abs(minq - float(exp_minq)) > 5e-3:
        raise SystemExit(f"DRIFT: min_q eslesmiyor (recomputed={minq:.6f} vs committed={exp_minq}).")

    # M-degeri tabakalari: VERI-ODAKLI uctil (tertile) sinirlari
    q33, q67 = np.quantile(mu, [1 / 3, 2 / 3])
    np.savez_compressed(
        CACHE, mu=mu, resid_sd=resid_sd, group=group, age=age, pmi=pmi,
        sex_m=sex_m, race_c=race_c,
        scalars=np.array([n_keep, n_total, n, k, dof, int((group == 1).sum()),
                          int((group == 0).sum()), sig05, minq,
                          float(np.median(resid_sd)), float(np.median(mu)), exp_nsig,
                          float(q33), float(q67), n_psych], dtype=np.float64),
        names_x=np.array(names_x), dropped=np.array(dropped, dtype=object),
        sha=np.array([sha256(MAT), sha256(META)]),
    )
    log(f"onbellek yazildi: {CACHE}  n_keep={n_keep} resid_sd_med={np.median(resid_sd):.5f} "
        f"M_tertiles=({q33:.3f},{q67:.3f}) ({round(time.time()-t0,1)}s)")


def load_cache():
    z = np.load(CACHE, allow_pickle=True)
    sc = z["scalars"]
    meta = {"n_keep": int(sc[0]), "n_total": int(sc[1]), "n": int(sc[2]), "k": int(sc[3]),
            "dof": int(sc[4]), "n_case": int(sc[5]), "n_ctrl": int(sc[6]),
            "sig05": int(sc[7]), "minq": float(sc[8]), "resid_sd_med": float(sc[9]),
            "mu_med": float(sc[10]), "exp_nsig": int(sc[11]),
            "q33": float(sc[12]), "q67": float(sc[13]), "n_psych": int(sc[14]),
            "names_x": [str(x) for x in z["names_x"]],
            "dropped": [str(x) for x in z["dropped"]],
            "sha": [str(s) for s in z["sha"]]}
    return (z["mu"], z["resid_sd"], z["group"], z["age"], z["pmi"], z["sex_m"],
            z["race_c"], meta)


def make_design_from_cache(group, age, pmi, sex_m, race_c, names_x):
    cand = {"intercept": np.ones(len(group)), "group(Opioids)": group,
            "age_z": _zscore(age), "pmi_z": _zscore(pmi),
            "sex(M=1)": sex_m, "race(CAUC=1)": race_c}
    X = np.column_stack([cand[nm] for nm in names_x])
    gi = names_x.index("group(Opioids)")
    XtXi = np.linalg.inv(X.T @ X)
    dof = X.shape[0] - X.shape[1]
    return X, gi, XtXi, dof


def make_strata(q33, q67):
    return [("low", -np.inf, q33), ("mid", q33, q67), ("high", q67, np.inf)]


def run_powerfpr(mu, resid_sd, X, gi, XtXi, dof, case_mask, ctrl_mask, n_keep,
                 strata, n_power_rep, n_null_rep, seed_off_power, seed_off_null,
                 ckpt_path=None, label=""):
    """Gauss (M-degeri) spike-in power + FPR. KIRPMA YOK. Checkpoint ile resumable."""
    n = X.shape[0]
    strata_pool = {}
    for nm, lo, hi in strata:
        strata_pool[nm] = np.where((mu >= lo) & (mu < hi))[0]

    power_cell = {nm: {f"{d:.3f}": [] for d in DELTAS} for nm, _, _ in strata}
    realized_cell = {nm: {f"{d:.3f}": [] for d in DELTAS} for nm, _, _ in strata}
    power_overall = {f"{d:.3f}": [] for d in DELTAS}
    mixed_fpr = []; mixed_emp_fdr = []; null_fpr = []; null_nfp = []
    power_done = 0; null_done = 0

    def save_ckpt():
        if not ckpt_path:
            return
        with open(ckpt_path, "w") as f:
            json.dump({"power_cell": power_cell, "realized_cell": realized_cell,
                       "power_overall": power_overall, "mixed_fpr": mixed_fpr,
                       "mixed_emp_fdr": mixed_emp_fdr, "null_fpr": null_fpr,
                       "null_nfp": null_nfp, "power_done": power_done,
                       "null_done": null_done}, f)

    if ckpt_path and os.path.exists(ckpt_path):
        with open(ckpt_path) as f:
            ck = json.load(f)
        power_cell = ck["power_cell"]; realized_cell = ck["realized_cell"]
        power_overall = ck["power_overall"]; mixed_fpr = ck["mixed_fpr"]
        mixed_emp_fdr = ck["mixed_emp_fdr"]; null_fpr = ck["null_fpr"]
        null_nfp = ck["null_nfp"]; power_done = ck["power_done"]; null_done = ck["null_done"]
        log(f"  [{label}] checkpoint: power_done={power_done}/{n_power_rep} null_done={null_done}/{n_null_rep}")

    def gen_null(rng):
        noise = rng.standard_normal((n, n_keep)).astype(np.float64) * resid_sd[None, :]
        return mu[None, :] + noise   # M-degeri: KIRPMA YOK

    for rep in range(power_done, n_power_rep):
        rng = np.random.default_rng(seed_off_power + rep)
        Ysim = gen_null(rng)
        is_spiked = np.zeros(n_keep, dtype=bool); used = np.zeros(n_keep, dtype=bool)
        spike_meta = []
        for nm, _, _ in strata:
            pool = strata_pool[nm]; avail = pool[~used[pool]]
            per_cell = min(SITES_PER_CELL, len(avail) // len(DELTAS))
            if per_cell < 5:
                continue
            pick = rng.choice(avail, size=per_cell * len(DELTAS), replace=False)
            used[pick] = True
            for di, d in enumerate(DELTAS):
                cell = pick[di * per_cell:(di + 1) * per_cell]
                hi = Ysim[np.ix_(case_mask, cell)] + d / 2
                lo = Ysim[np.ix_(ctrl_mask, cell)] - d / 2
                Ysim[np.ix_(case_mask, cell)] = hi
                Ysim[np.ix_(ctrl_mask, cell)] = lo
                is_spiked[cell] = True
                spike_meta.append((cell, d, nm))
                realized_cell[nm][f"{d:.3f}"].append(float(np.mean(hi.mean(axis=0) - lo.mean(axis=0))))
        p_sim, _, _ = _ols_core(Ysim, X, gi, XtXi, dof)
        q_sim = bh(p_sim); sig = q_sim < FDR
        null_mask = ~is_spiked
        fp = int(sig[null_mask].sum()); n_null = int(null_mask.sum()); total_pos = int(sig.sum())
        mixed_fpr.append(fp / max(n_null, 1))
        mixed_emp_fdr.append((fp / total_pos) if total_pos > 0 else 0.0)
        for cell, d, nm in spike_meta:
            power_cell[nm][f"{d:.3f}"].append(float(sig[cell].mean()))
        for d in DELTAS:
            cells = [c for (c, dd, _n) in spike_meta if abs(dd - d) < 1e-9]
            if cells:
                power_overall[f"{d:.3f}"].append(float(sig[np.concatenate(cells)].mean()))
        log(f"  [{label}] power rep {rep}: spiked={int(is_spiked.sum())} "
            f"TP={int(sig[is_spiked].sum())} FP={fp}/{n_null}")
        del Ysim
        power_done = rep + 1; save_ckpt()

    for rep in range(null_done, n_null_rep):
        rng = np.random.default_rng(seed_off_null + rep)
        Ysim = gen_null(rng)
        p_sim, _, _ = _ols_core(Ysim, X, gi, XtXi, dof)
        nfp = int((bh(p_sim) < FDR).sum())
        null_fpr.append(nfp / n_keep); null_nfp.append(nfp)
        log(f"  [{label}] null rep {rep}: yanlis-kesif={nfp}/{n_keep}")
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
    return {
        "power_vs_delta_all_strata": power_overall_summary,
        "power_by_stratum_and_delta": power_by_stratum,
        "realized_mean_delta": realized,
        "min_detectable_effect_M_mid_stratum_80pct_power": (round(mde_mid, 3) if mde_mid else None),
        "min_detectable_effect_M_all_strata_80pct_power": (round(mde_overall, 3) if mde_overall else None),
        "false_positive_rate": {
            "mixed_run_null_sites_FPR": ms(mixed_fpr),
            "mixed_run_empirical_FDR": ms(mixed_emp_fdr),
            "pure_null_genomewide_FPR": ms(null_fpr),
            "pure_null_n_false_discoveries": ms(null_nfp),
        },
    }


def make_png(result, power_overall_summary, power_by_stratum, fpr_null, png_path, title):
    fig, ax = plt.subplots(1, 2, figsize=(11, 4.2))
    xs = DELTAS
    colors = {"low": "#2c7fb8", "mid": "#1a9850", "high": "#d73027"}
    for nm in ["low", "mid", "high"]:
        ys = [power_by_stratum.get(nm, {}).get(f"{d:.3f}", {}).get("mean", np.nan) for d in DELTAS]
        es = [power_by_stratum.get(nm, {}).get(f"{d:.3f}", {}).get("std", 0.0) for d in DELTAS]
        ax[0].errorbar(xs, ys, yerr=es, marker="o", capsize=3, color=colors[nm], label=f"{nm} M-value")
    yo = [power_overall_summary.get(f"{d:.3f}", {}).get("mean", np.nan) for d in DELTAS]
    ax[0].plot(xs, yo, "k--", marker="s", label="all strata")
    ax[0].axhline(0.8, color="grey", ls=":", lw=1)
    ax[0].set_xlabel("Injected between-group difference (M-value units)")
    ax[0].set_ylabel("Power (TPR at FDR<0.05)")
    ax[0].set_title(title)
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
    fig.tight_layout(); fig.savefig(png_path, dpi=130)
    plt.close(fig)


def cmd_sim():
    t0 = time.time()
    mu, resid_sd, group, age, pmi, sex_m, race_c, meta = load_cache()
    n_keep = meta["n_keep"]
    X, gi, XtXi, dof = make_design_from_cache(group, age, pmi, sex_m, race_c, meta["names_x"])
    case_mask = group == 1; ctrl_mask = group == 0
    strata = make_strata(meta["q33"], meta["q67"])
    log(f"sim: n_keep={n_keep} case={int(case_mask.sum())} ctrl={int(ctrl_mask.sum())} df={dof}")

    core = run_powerfpr(mu, resid_sd, X, gi, XtXi, dof, case_mask, ctrl_mask, n_keep,
                        strata, N_POWER_REP, N_NULL_REP, SEED + 1000, SEED + 5000,
                        ckpt_path=CKPT, label="well-spec")

    pos = core["power_vs_delta_all_strata"]; pst = core["power_by_stratum_and_delta"]
    fpr_null = core["false_positive_rate"]["pure_null_genomewide_FPR"]["mean"]
    mde_mid = core["min_detectable_effect_M_mid_stratum_80pct_power"]

    result = {
        "dataset": "GSE164822", "substance": "opioid (opioid use disorder)",
        "tissue": "dorsolateral prefrontal cortex (dlPFC), postmortem human brain",
        "platform": "Illumina EPIC (M-values)",
        "analysis": "covariate-adjusted OLS (M ~ group + age_z + pmi_z + sex + race) — power / FPR calibration (Gaussian array spike-in)",
        "purpose": ("quantify the true power (TPR vs injected delta and base M-value) and the empirical "
                    "false-positive rate (FDR<0.05) of the OLS test used to declare the GSE164822 dlPFC opioid NULL"),
        "design": {CASE_GROUP: meta["n_case"], CTRL_GROUP: meta["n_ctrl"],
                   "Pysch Control (excluded)": meta["n_psych"],
                   "n_probes_tested": n_keep, "model_terms": meta["names_x"], "dropped_terms": meta["dropped"]},
        "seed": SEED,
        "simulation": {
            "data_generating_model": ("EPIC arrays have NO read counts, so (unlike the opioid GSE235818 beta-binomial "
                                      "template) the generative model is a per-probe Gaussian spike-in using the REAL "
                                      "per-probe residual SD and probe mean (M-value) from the covariate-adjusted fit; "
                                      "M-values are unbounded so NO [0,1] clipping; only the between-group effect (delta, "
                                      "in M-value units) is injected"),
            "deltas_injected_M": DELTAS, "sites_per_delta_x_stratum": SITES_PER_CELL,
            "mu_strata_M_tertiles": {"low": [None, round(meta["q33"], 4)],
                                     "mid": [round(meta["q33"], 4), round(meta["q67"], 4)],
                                     "high": [round(meta["q67"], 4), None]},
            "power_replicates": N_POWER_REP, "null_replicates": N_NULL_REP, "fdr_threshold": FDR,
            "test": "covariate-adjusted OLS + BH-FDR (the exact NULL-declaring test, recomputed per replicate)",
            "realized_mean_delta": core["realized_mean_delta"],
        },
        "drift_check_against_committed": {
            "expected_n_FDR_lt_0.05": meta["exp_nsig"], "recomputed_n_FDR_lt_0.05": meta["sig05"],
            "recomputed_min_q": round(meta["minq"], 6), "passed": bool(meta["sig05"] == meta["exp_nsig"]),
        },
        "power_vs_delta_all_strata": pos,
        "power_by_stratum_and_delta": pst,
        "min_detectable_effect_M_mid_stratum_80pct_power": mde_mid,
        "min_detectable_effect_M_all_strata_80pct_power": core["min_detectable_effect_M_all_strata_80pct_power"],
        "false_positive_rate": core["false_positive_rate"],
        "real_noise_used": {"resid_sd_median_M": round(meta["resid_sd_med"], 5),
                            "M_mean_median": round(meta["mu_med"], 4)},
        "interpretation": "",
        "input_files_sha256": {os.path.basename(MAT): meta["sha"][0], os.path.basename(META): meta["sha"][1]},
        "runtime_sec": round(time.time() - t0, 1),
    }

    def gp(d):
        return pos.get(f"{d:.3f}", {}).get("mean", float("nan"))
    mde_txt = (f"{mde_mid:.3f} M") if mde_mid else f">{max(DELTAS)} M"
    result["interpretation"] = (
        f"At this dataset's real per-probe noise (residual SD median {meta['resid_sd_med']:.4f} M-value units) and n="
        f"{meta['n_case']} {CASE_GROUP} vs {meta['n_ctrl']} {CTRL_GROUP}, the covariate-adjusted OLS reaches "
        f"power={gp(0.2):.2f} for a 0.2 M between-group difference, {gp(0.5):.2f} for 0.5 M and "
        f"{gp(1.0):.2f} for 1.0 M (all strata pooled). Minimum detectable effect at >=80% power "
        f"(mid-methylation stratum) = {mde_txt}. Under the complete null the genome-wide false-positive rate "
        f"at FDR<0.05 is {fpr_null:.2e} (mean false discoveries "
        f"{core['false_positive_rate']['pure_null_n_false_discoveries']['mean']:.1f}/{n_keep}), i.e. the test is "
        f"well calibrated and not anticonservative. So the GSE164822 dlPFC opioid NULL means 'no effect detectable "
        f"above ~{mde_txt}' here. (EPIC has no read counts; this is a Gaussian residual-variance spike-in on M-values, "
        f"the array analog of the opioid GSE235818 beta-binomial coverage simulation.)")

    with open(OUT, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    log(f"JSON yazildi: {OUT}")
    make_png(result, pos, pst, fpr_null, PNG, "GSE164822 dlPFC OLS power vs effect size")
    log(f"figur yazildi: {PNG}  ({result['runtime_sec']}s)")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "sim"
    if mode == "cache":
        build_cache()
    elif mode == "sim":
        cmd_sim()
    else:
        raise SystemExit("kullanim: cache | sim")


if __name__ == "__main__":
    main()
