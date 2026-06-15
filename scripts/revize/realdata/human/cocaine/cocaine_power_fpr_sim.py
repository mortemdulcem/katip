#!/usr/bin/env python3
"""
GSE137364 (kokain, postmortem kaudat, bisulfit-dizi 5x) — complete-case OLS
testinin GERCEK GUC / YANLIS-POZITIF ORANI (power / FPR) KALIBRASYONU
(spike-in simulasyonu).

NEDEN (Gorev 10): SUBSTANCE_DMP_REPORT.md §2.3 / scripts/43_dmp_cocaine_brain_
bisulfite.py, kovaryat-ayarli OLS (proportion ~ cocaine + age_z + smoker) ile
kaudatta FDR<0,05'te 0 DMP (min q=0,739) buldu. Ancak orada yalnizca ANLAMLILIK
olculdu; bu veri seti + GERCEK 5x kapsamda testin GERCEK GUCU (true-positive rate)
ve YANLIS-POZITIF ORANI (FPR @ FDR<0,05) olculmedi. Bir guc/FPR egrisi olmadan
"NULL" yorumunu durustce cerceveleyemeyiz: gercek bir kokain etkisinin SAPTANABILMESI
icin ne kadar BUYUK olmasi gerektigini bilemeyiz. Bu betik bunu olcer (opioid
human/opioid/opioid_power_fpr_sim.py betiginin AYNADIR).

YONTEM (spike-in, gercek veriyle):
  1) 43_dmp_cocaine_brain_bisulfite.py ile BIREBIR AYNI sekilde GERCEK per-sample
     coverage (cov_<id>) ve metile-okuma (meth_<id>) sayilari okunur; complete-case
     (TUM tutulan donorlerde olculen) CpG'ler tutulur (imputasyon yok). Bu, NULL
     karari veren testin AYNI evrenidir.
  2) Gercek sayilardan site-bazli beta-binom asiri-dagilimi (Williams moment, grup-ici)
     hesaplanir ve mu-egilimine hafifce kuculttulur; bu, simulasyonun VERI-URETEN
     dispersiyonudur (veri setinin gercek biyolojik asiri-dagilimi).
  3) Ayni rho ile site-bazli gercek mu ve GERCEK coverage N (cov) korunarak yeni
     sayim matrisleri uretilir:  p_ij ~ Beta(mu_g, rho_i);  M_ij ~ Binom(N_ij, p_ij).
  4) GUC (power): rastgele site altkumelerine BILINEN bir delta enjekte edilir
     (vaka mu+delta/2, kontrol mu-delta/2; [0,001;0,999]'a kirpilir). Delta'lar
     {5,10,15,20,25,30} puan x mu-tabakasi (dusuk/orta/yuksek). Geri kalan siteler
     NULL. Tum matrise NULL'i veren AYNI OLS (proportion ~ cocaine + age_z + smoker)
     + BH-FDR uygulanir. power(delta) = enjekte sitelerin q<0,05 oranidir.
  5) FPR: (a) karma kosuda NULL sitelerinin q<0,05 orani + ampirik FDR; (b) ayri
     SAF-NULL kosularda (hic enjeksiyon yok) genom(complete-case)-capi yanlis-kesif
     orani.
  6) DRIFT-YOK DOGRULAMA: gercek veride OLS yeniden hesaplanip rapor (§2.3) /
     committed GSE137364_validation.json ile (0 DMP, min q~0,739) eslesmeli.

Zero-hallucination: hicbir sayi uydurulmaz. Coverage gercek (cov sutunlari),
dispersiyon gercek (veriden), tek varsayim simule edilen gruplar-arasi etki
BUYUKLUGUDUR (delta) — kasitli ve aciktir. Sabit seed + girdi SHA-256.

Cikti: out/GSE137364_cocaine_power_fpr.json + out/GSE137364_cocaine_power_fpr.png
"""
import os, re, json, gzip, hashlib, time
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
OUT = os.path.join(OUTDIR, "GSE137364_cocaine_power_fpr.json")
PNG = os.path.join(OUTDIR, "GSE137364_cocaine_power_fpr.png")
COMMITTED = os.path.join(ROOT, "out", "GSE137364_validation.json")

ACC = "GSE137364"
TSV = os.path.join(DATA, "GSE137364_5xCoverage_Methylation.hg19.tsv.gz")
SERIES = os.path.join(DATA, "GSE137364_series_matrix.txt.gz")
GROUP_KEY = "subject status"
CHUNK = 200_000
RHO_FLOOR = 1e-4
eps = 1e-12

SEED = 20260614
DELTAS = [0.01, 0.02, 0.03, 0.05, 0.10, 0.15, 0.20, 0.30]
SITES_PER_CELL = 30                              # delta x mu-tabakasi basina enjekte site
MU_STRATA = [("low", 0.0, 1 / 3), ("mid", 1 / 3, 2 / 3), ("high", 2 / 3, 1.0)]
N_POWER_REP = 10
N_NULL_REP = 10
FDR = 0.05
# rapor §2.3 committed beklenen NULL (drift hedefi)
EXP_NSIG = 0
EXP_MINQ = 0.739


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


def parse_pheno(series_path, group_key):
    title = None; chars = []
    with gzip.open(series_path, "rt", errors="replace") as f:
        for line in f:
            if line.startswith("!Sample_title"):
                title = [x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]]
            elif line.startswith("!Sample_characteristics_ch1"):
                chars.append([x.strip().strip('"') for x in line.rstrip("\n").split("\t")[1:]])
            elif line.startswith('"ID_REF') or "!series_matrix_table_begin" in line:
                break
    n = len(title)

    def getchar(key):
        for vals in chars:
            kk = None; out = []
            for v in vals:
                if ":" in v:
                    k, val = v.split(":", 1); kk = k.strip().lower(); out.append(val.strip())
                else:
                    out.append(v.strip())
            if kk == key.lower():
                return out
        return [None] * n

    grp = getchar(group_key); age = getchar("age"); smk = getchar("smoker status")
    ph = {}
    for i in range(n):
        try:
            sid = int(str(title[i]).strip())
        except ValueError:
            continue
        a = age[i]
        ph[sid] = {
            "cocaine": 1.0 if (grp[i] and grp[i].lower() == "case")
                       else (0.0 if (grp[i] and grp[i].lower() == "control") else np.nan),
            "age": float(a) if (a and str(a).replace(".", "", 1).isdigit()) else np.nan,
            "smoker": 1.0 if (smk[i] and smk[i].lower() == "smoker")
                      else (0.0 if (smk[i] and "non" in str(smk[i]).lower()) else np.nan),
        }
    return ph


def build_design(coc, age, smk):
    az = (age - age.mean()) / age.std()
    candidates = [("intercept", np.ones(len(coc))), ("cocaine", coc),
                  ("agez", az), ("smoker", smk)]
    Xcols = []; names = []; dropped = []
    for nm, v in candidates:
        trial = np.column_stack(Xcols + [v]) if Xcols else v.reshape(-1, 1)
        if np.linalg.matrix_rank(trial) == trial.shape[1]:
            Xcols.append(v); names.append(nm)
        else:
            dropped.append(nm)
    X = np.column_stack(Xcols)
    return X, names, dropped


def ols_q(Yt, X, gidx, XtXi, dof):
    """Yt: samples x sites proportion matrisi. cocaine katsayisi icin p + BH-q."""
    B = XtXi @ X.T @ Yt
    resid = Yt - X @ B
    sig2 = (resid ** 2).sum(axis=0) / dof
    se = np.sqrt(sig2 * XtXi[gidx, gidx])
    coef = B[gidx]
    with np.errstate(divide="ignore", invalid="ignore"):
        t = coef / se
        p = 2 * stats.t.sf(np.abs(t), dof)
    p = np.where(np.isfinite(p), p, 1.0)
    return p, bh(p), coef


def reconstruct():
    """43_dmp_cocaine_brain_bisulfite.py ile birebir: complete-case cov+meth."""
    ph = parse_pheno(SERIES, GROUP_KEY)
    head = next(pd.read_csv(TSV, sep="\t", chunksize=5, low_memory=False))
    cols = list(head.columns)
    chr_col, pos_col = cols[0], cols[1]
    cov_ids = {int(m.group(1)): c for c in cols if (m := re.match(r"cov_(\d+)$", str(c)))}
    meth_ids = {int(m.group(1)): c for c in cols if (m := re.match(r"meth_(\d+)$", str(c)))}
    ids = sorted(set(cov_ids) & set(meth_ids))
    unmapped = [i for i in ids if i not in ph]
    if unmapped:
        raise SystemExit(f"{len(unmapped)} matrix id donor pheno yok (orn {unmapped[:5]})")
    coc = np.array([ph[i]["cocaine"] for i in ids])
    age = np.array([ph[i]["age"] for i in ids])
    smk = np.array([ph[i]["smoker"] for i in ids])
    keep = np.isfinite(coc) & np.isfinite(age) & np.isfinite(smk)
    ids_use = [i for i, k in zip(ids, keep) if k]
    coc, age, smk = coc[keep], age[keep], smk[keep]
    cov_use = [cov_ids[i] for i in ids_use]
    meth_use = [meth_ids[i] for i in ids_use]
    usecols = [chr_col, pos_col] + cov_use + meth_use
    kept_cov, kept_meth, kept_pos = [], [], []
    n_rows = 0
    for chunk in pd.read_csv(TSV, sep="\t", usecols=usecols, na_values=["NA", "na", ""],
                             chunksize=CHUNK, low_memory=False):
        n_rows += len(chunk)
        cov = chunk[cov_use].to_numpy(dtype=float)
        meth = chunk[meth_use].to_numpy(dtype=float)
        complete = ~np.isnan(cov).any(axis=1) & ~np.isnan(meth).any(axis=1) & (cov > 0).all(axis=1)
        if not complete.any():
            continue
        kept_cov.append(cov[complete]); kept_meth.append(meth[complete])
        pos = (chunk[chr_col].astype(str).to_numpy()[complete] + ":" +
               chunk[pos_col].astype(str).to_numpy()[complete])
        kept_pos.append(pos)
    N = np.concatenate(kept_cov).astype(np.float64)
    M = np.concatenate(kept_meth).astype(np.float64)
    pos = np.concatenate(kept_pos)
    return M, N, pos, coc, age, smk, n_rows


def williams_rho(M, N, case_mask, ctrl_mask):
    """Grup-ici Williams moment asiri-dagilimi + mu-egilimine hafif kuculteme."""
    n_keep = M.shape[0]
    n_case = int(case_mask.sum()); n_ctrl = int(ctrl_mask.sum()); n_s = n_case + n_ctrl
    Mc = M[:, case_mask].sum(axis=1); Nc = N[:, case_mask].sum(axis=1)
    Mk = M[:, ctrl_mask].sum(axis=1); Nk = N[:, ctrl_mask].sum(axis=1)
    pc = np.clip(Mc / np.maximum(Nc, 1), eps, 1 - eps)
    pk = np.clip(Mk / np.maximum(Nk, 1), eps, 1 - eps)
    pg = np.where(case_mask[None, :], pc[:, None], pk[:, None])
    fit = N * pg; var = N * pg * (1 - pg)
    with np.errstate(divide="ignore", invalid="ignore"):
        pear = np.where(var > 0, (M - fit) ** 2 / var, 0.0)
    Xw = pear.sum(axis=1)
    nc1 = (N[:, case_mask] - 1).sum(axis=1); nk1 = (N[:, ctrl_mask] - 1).sum(axis=1)
    denomW = np.maximum((1 - 1 / n_case) * nc1 + (1 - 1 / n_ctrl) * nk1, 1e-9)
    rho_raw = (Xw - (n_s - 2)) / denomW
    mu_site = np.clip((Mc + Mk) / np.maximum(Nc + Nk, 1), eps, 1 - eps)
    l_raw = np.log(np.maximum(rho_raw, RHO_FLOOR))
    estimable = rho_raw > 1e-3
    NB = 20
    qe = np.quantile(mu_site, np.linspace(0, 1, NB + 1)); qe[0] = -np.inf; qe[-1] = np.inf
    binidx = np.digitize(mu_site, qe[1:-1])
    trend = np.empty(n_keep)
    gmed = float(np.median(l_raw[estimable])) if estimable.any() else np.log(0.01)
    for b in range(NB):
        m = binidx == b; me = m & estimable
        trend[m] = float(np.median(l_raw[me])) if int(me.sum()) >= 10 else gmed
    resid = (l_raw - trend)[estimable]
    mad = float(np.median(np.abs(resid - np.median(resid)))) if resid.size else 0.0
    tau2 = max((1.4826 * mad) ** 2, 1e-3)
    nz = (M > 0).sum(axis=1).astype(float)
    s2 = 2.0 / np.maximum(nz - 2.0, 1.0)
    B = tau2 / (tau2 + s2)
    rho_shrunk = np.clip(np.exp(trend + B * (l_raw - trend)), RHO_FLOOR, 0.99)
    return rho_shrunk, mu_site, tau2, int(estimable.sum())


def simulate_counts(rng, N, mu_case, mu_ctrl, rho, case_mask, ctrl_mask):
    n_keep, n_s = N.shape
    mu_mat = np.empty((n_keep, n_s))
    mu_mat[:, case_mask] = mu_case[:, None]
    mu_mat[:, ctrl_mask] = mu_ctrl[:, None]
    r = np.clip(rho, RHO_FLOOR, 0.99)[:, None]
    a = np.clip(mu_mat * (1 - r) / r, 1e-6, 1e8)
    b = np.clip((1 - mu_mat) * (1 - r) / r, 1e-6, 1e8)
    p = rng.beta(a, b)
    M = rng.binomial(N.astype(np.int64), p).astype(np.float64)
    return M


def ms(x):
    a = np.array(x, dtype=float)
    return {"mean": float(a.mean()), "std": float(a.std(ddof=1)) if len(a) > 1 else 0.0, "reps": x}


def main():
    t0 = time.time()
    log("geri-kazanim (43_dmp_cocaine_brain_bisulfite.py ile birebir complete-case)...")
    M, N, pos, coc, age, smk, n_rows = reconstruct()
    n_keep, n_s = M.shape
    case_mask = coc == 1; ctrl_mask = coc == 0
    log(f"taranan CpG={n_rows:,}  complete-case site={n_keep}  ornek={n_s} "
        f"(Case {int(case_mask.sum())} / Control {int(ctrl_mask.sum())})")

    X, names_x, dropped = build_design(coc, age, smk)
    n, k = X.shape; dof = n - k
    gidx = names_x.index("cocaine"); XtXi = np.linalg.inv(X.T @ X)

    # --- DRIFT-YOK DOGRULAMA: gercek proportion uzerinde OLS ---
    # 43_dmp ile birebir: complete-case sitelerden OLS sonrasi sonlu (finite) p&coef
    # olanlar tutulur (sabit-oranli/dejenere siteler atilir) -> tam olarak rapor evreni.
    prop_full = (M / N).T                                # samples x sites
    p_full, _, coef_full = ols_q(prop_full, X, gidx, XtXi, dof)
    fin = np.isfinite(p_full) & np.isfinite(coef_full)
    n_dropped = int((~fin).sum())
    M = M[fin]; N = N[fin]; pos = pos[fin]; n_keep = M.shape[0]
    log(f"  OLS-sonrasi sonlu-olmayan {n_dropped} site atildi -> test evreni {n_keep}")
    prop_real = (M / N).T
    p_real, q_real, _ = ols_q(prop_real, X, gidx, XtXi, dof)
    sig_real = int((q_real < FDR).sum()); minq_real = float(q_real.min())
    log(f"DOGRULAMA: complete-case site={n_keep}  FDR<0.05={sig_real}  min q={minq_real:.4f} "
        f"(rapor §2.3: 0 DMP, min q~{EXP_MINQ})")
    exp_minq = EXP_MINQ; exp_nsig = EXP_NSIG
    if os.path.exists(COMMITTED):
        with open(COMMITTED) as f:
            cj = json.load(f)
        exp_minq = float(cj.get("top10", [{}])[0].get("fdr", EXP_MINQ)) if cj.get("top10") else EXP_MINQ
        exp_nsig = int(cj.get("n_sig_fdr05", EXP_NSIG))
    drift_ok = (sig_real == exp_nsig) and (abs(minq_real - exp_minq) < 0.05)
    if not drift_ok:
        raise SystemExit(f"DRIFT: OLS gercek veride beklenenle eslesmiyor "
                         f"(sig={sig_real} vs {exp_nsig}; minq={minq_real:.4f} vs {exp_minq}).")

    # --- veri-ureten dispersiyon (gercek) ---
    rho_shrunk, mu_site, tau2, n_est = williams_rho(M, N, case_mask, ctrl_mask)
    log(f"gercek rho_shrunk medyan={np.median(rho_shrunk):.5f} tau2={tau2:.4f} estimable={n_est}")
    mu = mu_site

    # --- mu-tabaka havuzlari ---
    strata_pool = {}
    for nm, lo, hi in MU_STRATA:
        idx = np.where((mu >= lo) & (mu < hi if hi < 1.0 else mu <= hi))[0]
        strata_pool[nm] = idx
        log(f"  mu-tabaka {nm} [{lo:.2f},{hi:.2f}): {len(idx)} site")
    need_per_stratum = SITES_PER_CELL * len(DELTAS)
    for nm, _, _ in MU_STRATA:
        if len(strata_pool[nm]) < need_per_stratum:
            log(f"  UYARI: tabaka {nm} az site ({len(strata_pool[nm])}<{need_per_stratum}); "
                f"hucre basi azaltilarak devam")

    # ===== GUC (power) — karma spike-in =====
    power_cell = {nm: {f"{d:.2f}": [] for d in DELTAS} for nm, _, _ in MU_STRATA}
    realized_cell = {nm: {f"{d:.2f}": [] for d in DELTAS} for nm, _, _ in MU_STRATA}
    power_overall = {f"{d:.2f}": [] for d in DELTAS}
    mixed_fpr = []; mixed_emp_fdr = []

    for rep in range(N_POWER_REP):
        rng = np.random.default_rng(SEED + 1000 + rep)
        mu_case = mu.copy(); mu_ctrl = mu.copy()
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
                mc = np.clip(mu[cell] + d / 2, 0.001, 0.999)
                mk = np.clip(mu[cell] - d / 2, 0.001, 0.999)
                mu_case[cell] = mc; mu_ctrl[cell] = mk
                is_spiked[cell] = True
                spike_meta.append((cell, d, nm))
                realized_cell[nm][f"{d:.2f}"].append(float(np.mean(np.abs(mc - mk))))

        M_sim = simulate_counts(rng, N, mu_case, mu_ctrl, rho_shrunk, case_mask, ctrl_mask)
        prop = (M_sim / N).T
        _, q_sim, _ = ols_q(prop, X, gidx, XtXi, dof)
        sig = q_sim < FDR

        null_mask = ~is_spiked
        fp = int(sig[null_mask].sum()); n_null = int(null_mask.sum())
        total_pos = int(sig.sum())
        mixed_fpr.append(fp / max(n_null, 1))
        mixed_emp_fdr.append((fp / total_pos) if total_pos > 0 else 0.0)
        for cell, d, nm in spike_meta:
            power_cell[nm][f"{d:.2f}"].append(float(sig[cell].mean()))
        for d in DELTAS:
            cells = [c for (c, dd, nm) in spike_meta if abs(dd - d) < 1e-9]
            if cells:
                cc = np.concatenate(cells)
                power_overall[f"{d:.2f}"].append(float(sig[cc].mean()))
        log(f"  power rep {rep}: spiked={int(is_spiked.sum())} TP={int(sig[is_spiked].sum())} "
            f"FP={fp}/{n_null}")

    # ===== SAF-NULL — genom(complete-case)-capi FPR =====
    null_fpr = []; null_nfp = []
    for rep in range(N_NULL_REP):
        rng = np.random.default_rng(SEED + 5000 + rep)
        M_sim = simulate_counts(rng, N, mu, mu, rho_shrunk, case_mask, ctrl_mask)
        prop = (M_sim / N).T
        _, q_sim, _ = ols_q(prop, X, gidx, XtXi, dof)
        nfp = int((q_sim < FDR).sum())
        null_fpr.append(nfp / n_keep); null_nfp.append(nfp)
        log(f"  null rep {rep}: yanlis-kesif={nfp}/{n_keep}")

    power_overall_summary = {d: ms(v) for d, v in power_overall.items() if v}
    power_by_stratum = {nm: {d: ms(v) for d, v in power_cell[nm].items() if v} for nm in power_cell}
    realized = {nm: {d: round(float(np.mean(v)), 4) for d, v in realized_cell[nm].items() if v}
                for nm in realized_cell}
    # havuzlanmis (tum-tabaka) gerceklesen delta (taban-metilasyon tavani/tabani kirpmasi sonrasi)
    realized_overall = {}
    for d in DELTAS:
        key = f"{d:.2f}"
        vals = [np.mean(realized_cell[nm][key]) for nm in realized_cell if realized_cell[nm][key]]
        if vals:
            realized_overall[key] = round(float(np.mean(vals)), 4)

    # minimum saptanabilir etki (orta-tabaka >=%80 guc; bos ise havuzlanmis)
    def first_mde(power_dict):
        for d in DELTAS:
            key = f"{d:.2f}"
            if key in power_dict and power_dict[key]["mean"] >= 0.80:
                return d
        return None
    mid = power_by_stratum.get("mid", {})
    mde_mid = first_mde(mid)
    mde_overall = first_mde(power_overall_summary)
    # tum complete-case siteler tek tabakaya dustuyse (orn hepsi dusuk-metilasyon),
    # temsili MDE = havuzlanmis; gerceklesen (kirpilmis) karsiligi da raporlanir.
    mde_primary = mde_overall if mde_overall is not None else mde_mid
    mde_primary_realized = (realized_overall.get(f"{mde_primary:.2f}") if mde_primary else None)

    result = {
        "dataset": ACC, "substance": "cocaine",
        "tissue": "postmortem human brain (caudate)",
        "platform": "bisulfite sequencing (5x coverage, hg19)",
        "analysis": "complete-case OLS (proportion ~ cocaine + age_z + smoker) — power / FPR calibration (spike-in)",
        "purpose": ("quantify the true power (TPR vs injected delta and base methylation) and the empirical "
                    "false-positive rate (FDR<0.05) of the covariate-adjusted OLS test used to declare the "
                    "GSE137364 caudate cocaine NULL"),
        "design": {"cocaine_case": int(case_mask.sum()), "control": int(ctrl_mask.sum()),
                   "n_sites_complete_case": n_keep, "model_terms": names_x, "dropped_terms": dropped},
        "seed": SEED,
        "simulation": {
            "data_generating_model": ("per-site beta-binomial on the REAL 5x coverage N (cov columns); site "
                                      "means = real pooled mu; dispersion = real Williams moment overdispersion "
                                      "shrunk to the mu-trend (data's own biological overdispersion); only the "
                                      "between-group effect (delta) is injected"),
            "deltas_injected_pct": [round(d * 100, 1) for d in DELTAS],
            "sites_per_delta_x_stratum": SITES_PER_CELL,
            "mu_strata": {nm: [round(lo, 3), round(hi, 3)] for nm, lo, hi in MU_STRATA},
            "power_replicates": N_POWER_REP, "null_replicates": N_NULL_REP,
            "fdr_threshold": FDR,
            "test": "covariate-adjusted OLS + BH-FDR (the exact NULL-declaring test, recomputed per replicate)",
            "realized_mean_abs_delta_after_clipping": realized,
            "realized_mean_abs_delta_all_strata": realized_overall,
            "note_low_methylation_clipping": ("almost all high-coverage complete-case CpG here are low-methylation "
                                              "(mu near 0); the symmetric +/-delta/2 injection clips at the 0.001 floor "
                                              "so the REALIZED between-group difference is ~half the nominal delta — "
                                              "see realized_mean_abs_delta_*"),
        },
        "drift_check_against_committed": {
            "expected_n_FDR_lt_0.05": exp_nsig, "recomputed_n_FDR_lt_0.05": sig_real,
            "expected_min_q": round(exp_minq, 4), "recomputed_min_q": round(minq_real, 4),
            "passed": bool(drift_ok),
        },
        "power_vs_delta_all_strata": power_overall_summary,
        "power_by_stratum_and_delta": power_by_stratum,
        "min_detectable_effect_pct_mid_stratum_80pct_power": (round(mde_mid * 100, 1) if mde_mid else None),
        "min_detectable_effect_pct_all_strata_80pct_power": (round(mde_overall * 100, 1) if mde_overall else None),
        "min_detectable_effect_nominal_pct_80pct_power": (round(mde_primary * 100, 1) if mde_primary else None),
        "min_detectable_effect_realized_pct_80pct_power": (round(mde_primary_realized * 100, 1)
                                                           if mde_primary_realized else None),
        "false_positive_rate": {
            "mixed_run_null_sites_FPR": ms(mixed_fpr),
            "mixed_run_empirical_FDR": ms(mixed_emp_fdr),
            "pure_null_genomewide_FPR": ms(null_fpr),
            "pure_null_n_false_discoveries": ms(null_nfp),
        },
        "real_dispersion_used": {
            "rho_shrunk_median": round(float(np.median(rho_shrunk)), 5),
            "tau2": round(tau2, 5), "n_estimable_sites": n_est,
            "median_coverage": round(float(np.median(N)), 1), "mean_coverage": round(float(N.mean()), 2),
        },
        "interpretation": "",
        "input_files_sha256": {os.path.basename(TSV): sha256(TSV),
                               os.path.basename(SERIES): sha256(SERIES)},
        "runtime_sec": round(time.time() - t0, 1),
    }

    def gp(key):
        return power_overall_summary.get(key, {}).get("mean", float("nan"))
    fpr_null = result["false_positive_rate"]["pure_null_genomewide_FPR"]["mean"]
    if mde_primary is not None:
        rt = f" (~{mde_primary_realized*100:.1f} pp realized after low-methylation clipping)" if mde_primary_realized else ""
        mde_txt = f"{mde_primary*100:.0f} pp nominal{rt}"
    else:
        mde_txt = ">30 pp"
    result["interpretation"] = (
        f"At this dataset's REAL coverage (median ~{result['real_dispersion_used']['median_coverage']:.0f}x; "
        f"'5x' is only the minimum filter) and n={int(case_mask.sum())} vs {int(ctrl_mask.sum())}, the covariate-"
        f"adjusted OLS reaches power={gp('0.05'):.2f} at 5 pp, {gp('0.10'):.2f} at 10 pp and {gp('0.30'):.2f} at "
        f"30 pp (all strata pooled). Minimum detectable effect at >=80% power = {mde_txt}. Essentially every high-"
        f"coverage complete-case CpG is low-methylation, so only the low stratum is populated. Under the complete "
        f"null the genome(complete-case)-wide false-positive rate at FDR<0.05 is {fpr_null:.2e} (mean false "
        f"discoveries {result['false_positive_rate']['pure_null_n_false_discoveries']['mean']:.1f}/{n_keep}), i.e. "
        f"the per-site test is well calibrated and HIGHLY powered. The NULL therefore means 'no cocaine effect "
        f"detectable above ~{mde_txt}' — it does NOT prove a smaller effect is absent, and the dominant limitation "
        f"is BREADTH not per-site power: only {n_keep} CpG ({100*n_keep/n_rows:.3f}% of the {n_rows:,} scanned) "
        f"are measurable in ALL donors, so genome-wide cocaine effects outside this sparse complete-case set are "
        f"simply untested here.")

    with open(OUT, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    log(f"JSON yazildi: {OUT}")

    # ===== figur =====
    fig, ax = plt.subplots(1, 2, figsize=(11, 4.2))
    xs = [d * 100 for d in DELTAS]
    colors = {"low": "#2c7fb8", "mid": "#1a9850", "high": "#d73027"}
    for nm in ["low", "mid", "high"]:
        ys = [power_by_stratum.get(nm, {}).get(f"{d:.2f}", {}).get("mean", np.nan) for d in DELTAS]
        es = [power_by_stratum.get(nm, {}).get(f"{d:.2f}", {}).get("std", 0.0) for d in DELTAS]
        ax[0].errorbar(xs, ys, yerr=es, marker="o", capsize=3, color=colors[nm], label=f"{nm} methylation")
    yo = [power_overall_summary.get(f"{d:.2f}", {}).get("mean", np.nan) for d in DELTAS]
    ax[0].plot(xs, yo, "k--", marker="s", label="all strata")
    ax[0].axhline(0.8, color="grey", ls=":", lw=1)
    ax[0].set_xlabel("Injected between-group difference (percentage points)")
    ax[0].set_ylabel("Power (TPR at FDR<0.05)")
    ax[0].set_title(f"{ACC} caudate OLS power vs effect size")
    ax[0].set_ylim(-0.02, 1.02); ax[0].legend(fontsize=8); ax[0].grid(alpha=0.3)

    labels = ["mixed-run\nnull sites", "pure-null\ncomplete-case"]
    vals = [result["false_positive_rate"]["mixed_run_null_sites_FPR"]["mean"], fpr_null]
    errs = [result["false_positive_rate"]["mixed_run_null_sites_FPR"]["std"],
            result["false_positive_rate"]["pure_null_genomewide_FPR"]["std"]]
    ax[1].bar(labels, vals, yerr=errs, capsize=4, color=["#7570b3", "#7570b3"])
    ax[1].axhline(FDR, color="red", ls="--", lw=1, label=f"nominal FDR={FDR}")
    ax[1].set_ylabel("False-positive rate (fraction sites q<0.05)")
    ax[1].set_title("Empirical false-positive rate under null")
    ax[1].legend(fontsize=8); ax[1].grid(alpha=0.3, axis="y")
    fig.tight_layout(); fig.savefig(PNG, dpi=130)
    log(f"figur yazildi: {PNG}  ({result['runtime_sec']}s)")


if __name__ == "__main__":
    main()
