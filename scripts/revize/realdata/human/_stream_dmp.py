#!/usr/bin/env python3
"""
Paylasilan akis-tabanli (chunk'li) DMP yardimcilari. 1GB+ matrisleri bellege
sigdirmadan, satir-bloklari halinde isler. Her prob tek bir chunk'ta tam sutunla
bulundugu icin Welch t-test her chunk'ta dogrudan hesaplanir; BH-FDR en sonda
tum problar uzerinden uygulanir.

Tasarim ilkeleri (replit.md Zero-Hallucination):
- Sahte sayi/placeholder yok; sadece gercek matristen hesap.
- NaN-duyarli Welch t (detection ile maskelenen hucreler NaN olur).
- Grup atamasi series_matrix !Sample_title alanindan (etiket sizmasi yok).
"""
import gzip, io, hashlib, re
import numpy as np
import pandas as pd
from scipy.stats import t as tdist


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _open_text(path):
    if path.endswith(".gz"):
        return gzip.open(path, "rt", errors="replace")
    return open(path, "rt", errors="replace")


def read_sample_titles(meta_path):
    """series_matrix dosyasindan !Sample_title degerlerini sirali liste olarak dondurur."""
    with _open_text(meta_path) as f:
        for line in f:
            if line.startswith("!Sample_title"):
                parts = [p for p in line.rstrip("\n").split('"') if p and not p.startswith("!Sample_title")]
                return parts
    raise SystemExit(f"{meta_path}: !Sample_title bulunamadi")


def welch_nan(A, C):
    """A (rows x na), C (rows x nc) icin NaN-duyarli Welch t. Dondurur: t, p, delta(=meanA-meanC).
    Yetersiz n (<2) / sifir varyans satirlarinda p=NaN."""
    na = np.sum(~np.isnan(A), axis=1).astype(np.float64)
    nc = np.sum(~np.isnan(C), axis=1).astype(np.float64)
    with np.errstate(invalid="ignore", divide="ignore"):
        ma = np.nanmean(A, axis=1); mc = np.nanmean(C, axis=1)
        va = np.nanvar(A, axis=1, ddof=1); vc = np.nanvar(C, axis=1, ddof=1)
        se = va / na + vc / nc
        t = (ma - mc) / np.sqrt(se)
        df = se ** 2 / ((va / na) ** 2 / (na - 1) + (vc / nc) ** 2 / (nc - 1))
        p = 2 * tdist.sf(np.abs(t), df)
    delta = ma - mc
    bad = (na < 2) | (nc < 2) | (se <= 0) | ~np.isfinite(t) | ~np.isfinite(p)
    p = np.where(bad, np.nan, p)
    return t, p, delta


def bh_fdr(pvals):
    """Benjamini-Hochberg q-degerleri (monoton)."""
    n = len(pvals)
    order = np.argsort(pvals)
    ranked = np.empty(n); ranked[order] = np.arange(1, n + 1)
    q = pvals * n / ranked
    qs = q[order]
    for k in range(n - 2, -1, -1):
        qs[k] = min(qs[k], qs[k + 1])
    out = np.empty(n); out[order] = np.clip(qs, 0, 1)
    return out


def run_chunked(matrix_path, case_idx, ctrl_idx, transform=None, sep="\t", chunksize=40000):
    """matrix_path: prob x ornek matris (index_col=0). case_idx/ctrl_idx: deger-sutunlari
    uzerinde (transform sonrasi) tam-sayi konumlari. transform: chunk_values(rows x rawcols)
    -> beta(rows x nsamples) [NaN maskeli olabilir] veya None (kimlik)."""
    pvs, dls, pids = [], [], []
    colnames = None
    n_total = 0
    comp = "gzip" if matrix_path.endswith(".gz") else "infer"
    reader = pd.read_csv(matrix_path, sep=sep, index_col=0, chunksize=chunksize,
                         compression=comp, low_memory=False)
    for chunk in reader:
        if colnames is None:
            colnames = list(chunk.columns)
        vals = chunk.to_numpy(dtype=np.float64)
        beta = transform(vals) if transform is not None else vals
        A = beta[:, case_idx]; C = beta[:, ctrl_idx]
        _, p, delta = welch_nan(A, C)
        pvs.append(p); dls.append(delta); pids.append(chunk.index.to_numpy())
        n_total += len(chunk)
    p_all = np.concatenate(pvs); d_all = np.concatenate(dls)
    id_all = np.concatenate(pids).astype(str)
    good = np.isfinite(p_all)
    p_g = p_all[good]; d_g = d_all[good]; id_g = id_all[good]
    q_g = bh_fdr(p_g) if len(p_g) else np.array([])
    return {"colnames": colnames, "n_total": n_total, "n_tested": int(good.sum()),
            "probe": id_g, "p": p_g, "delta": d_g, "q": q_g}


def top_hits(res, k=25, round_delta=3):
    order = np.argsort(res["p"])[:k]
    return [{"probe": res["probe"][i], "delta": round(float(res["delta"][i]), round_delta),
             "p": float(res["p"][i]), "q_BH": round(float(res["q"][i]), 6)} for i in order]


# --------------------------------------------------------------------------- #
# Kovaryat-ayarli (lineer model) DMP + referanssiz vekil degiskenler (SVA tarzi)
# --------------------------------------------------------------------------- #

def _split_quoted(line, tag):
    """series_matrix satirini tirnakli degerlere ayirir; tag etiketini ve bos
    (yalniz sekme/bosluktan olusan) jetonlari atar."""
    toks = [p for p in line.rstrip("\n").split('"') if p.strip()]
    return [t for t in toks if not t.startswith(tag)]


def read_meta_fields(meta_path):
    """series_matrix'ten ornek baslIklarini ve karakteristik (kovaryat) alanlarini
    okur. Dondurur: (titles, chars) — titles: ornek-sirali liste; chars: liste of
    (label, [per-sample value]) — her karakteristik satiri icin 'label: value'
    ayristirilmis, ornek-sirali. Tum listeler !Sample_title ile ayni sirada."""
    titles = None
    chars = []
    with _open_text(meta_path) as f:
        for line in f:
            if line.startswith("!Sample_title"):
                titles = _split_quoted(line, "!Sample_title")
            elif line.startswith("!Sample_characteristics_ch1"):
                vals = _split_quoted(line, "!Sample_characteristics_ch1")
                if not vals:
                    continue
                label = vals[0].split(":", 1)[0].strip()
                parsed = [v.split(":", 1)[1].strip() if ":" in v else v.strip() for v in vals]
                chars.append((label, parsed))
    if titles is None:
        raise SystemExit(f"{meta_path}: !Sample_title bulunamadi")
    return titles, chars


def run_chunked_adjusted(matrix_path, X0, group_col, sample_idx=None, transform=None,
                         n_sv=5, sep="\t", chunksize=40000):
    """Prob basina KOVARYAT-AYARLI lineer model (OLS) + BH-FDR, bellek-guvenli akis.

    Model: y = X b + e ;  X = [intercept | group | kovaryatlar | SV_1..SV_k].
    Grup etkisi = b[group_col]; t = b/se, p = 2*sf(|t|, df=N-p). Etki (delta) =
    ayarlanmis grup katsayisi.

    X0 (N x p0): intercept + group + bilinen kovaryatlar (yas/cinsiyet/PMI/irk).
    group_col: X0 icindeki grup sutununun indeksi.
    sample_idx: transform sonrasi ORNEK sutunlari uzerinde, X0 satirlariyla ayni
        sirada kullanilacak ornek konumlari ( or. Psych Control disla / Smoker+
        Nonsmoker sec). None = tum ornekler.
    transform: chunk_raw(rows x rawcols) -> deger(rows x nsamples) [NaN olabilir].
    n_sv: referanssiz vekil degisken (surrogate variable) sayisi. BIRINCIL ve
        ONERILEN kullanim n_sv=0'dir = SADECE olculen kovaryatlar (yas/cinsiyet/
        PMI/irk). Bu model iyi kalibredir (pur-null sentetik veride p<0.05 orani
        ~0.05, FDR<0.05 = 0).

        UYARI — n_sv>0 GUVENLI DEGILDIR, cikarim icin KULLANMAYIN: SV'ler bilinen
        modelin artiklari uzerinde PCA ile bulunur ve gizli yapilari (hucre-
        kompozisyonu + batch) yakalamayi amaclar. Ancak null-kalibrasyon testleri
        gosterdi ki tahmini SV'leri SABIT/bilinen kovaryat gibi modele koymak —
        SV'ler ister ayni problardan (self-fit) ister capraz-ornekleme (cross-fit)
        ile turetilsin — anti-konservatiftir: pur-null veride yanlis "anlamli"
        sonuc uretir (p<0.05 orani ~0.19, FDR<0.05'te yuzlerce sahte prob).
        Bu yuzden uretim betikleri n_sv=0 kullanir. Bu kod yolu yalnizca o
        kalibrasyon bulgusunu yeniden-uretmek icin saklanir; ASLA rapor edilen
        cikarimda kullanilmaz. (Referansli beyin-hucre dekonvolusyonu — Houseman/
        EpiDISH — saf numpy/scipy hattinda paketlenmedigi icin hucre-orani ayri
        olarak tahmin edilemedi; durustce boyle raporlanir.)

    Yalniz TAM-VERILI problar (hicbir ornekte NaN yok) test edilir (sabit-X
    vektorize cozum); NaN iceren problar dusurulur ve n_dropped_nan'da raporlanir.
    """
    import hashlib
    from numpy.linalg import inv, pinv
    comp = "gzip" if matrix_path.endswith(".gz") else "infer"
    X0 = np.asarray(X0, dtype=np.float64)
    N = X0.shape[0]
    use_sv = bool(n_sv and n_sv > 0)

    def _read():
        return pd.read_csv(matrix_path, sep=sep, index_col=0, chunksize=chunksize,
                           compression=comp, low_memory=False)

    def _values(chunk):
        vals = chunk.to_numpy(dtype=np.float64)
        beta = transform(vals) if transform is not None else vals
        if sample_idx is not None:
            beta = beta[:, sample_idx]
        return beta

    def _split(ids):
        # deterministik, chunk-sinirindan bagimsiz prob-id pariter bolunmesi
        return np.fromiter(
            (int(hashlib.md5(str(i).encode()).hexdigest(), 16) & 1 for i in ids),
            dtype=np.int8, count=len(ids))

    sv_varexp = []
    if use_sv:
        # Pass 1: her yari icin ayri artik-Gram matrisi (capraz-ornekleme)
        M0 = np.eye(N) - X0 @ pinv(X0)   # artik-yapici (simetrik)
        G = [np.zeros((N, N)), np.zeros((N, N))]
        for chunk in _read():
            beta = _values(chunk)
            mask = np.isfinite(beta).all(axis=1)
            if not mask.any():
                continue
            sp = _split(chunk.index.to_numpy())
            for s in (0, 1):
                m = mask & (sp == s)
                if m.any():
                    R = beta[m] @ M0
                    G[s] += R.T @ R

        def _topsv(Gs):
            w, V = np.linalg.eigh(Gs)
            keep = np.argsort(w)[::-1][:n_sv]
            S = V[:, keep]
            S = (S - S.mean(0)) / (S.std(0) + 1e-12)
            tot = float(w[w > 0].sum()) or 1.0
            return S, [round(float(w[i]) / tot, 4) for i in keep]

        SV0, _ = _topsv(G[0])            # split-0 problardan -> split-1'i test eder
        SV1, sv_varexp = _topsv(G[1])    # split-1 problardan -> split-0'i test eder
        # split-0 problari icin tasarim SV1 (diger yari), split-1 icin SV0
        designs = {0: np.hstack([X0, SV1]), 1: np.hstack([X0, SV0])}
    else:
        designs = {None: X0}

    # Her tasarim icin (P = (X'X)^-1 X', c_g, df) onceden hesapla
    prep = {}
    for key, X in designs.items():
        pX = X.shape[1]
        dfX = N - pX
        if dfX < 1:
            raise SystemExit(f"serbestlik derecesi <1 (N={N}, p={pX}): cok fazla kovaryat/SV")
        XtX_inv = inv(X.T @ X)
        prep[key] = (XtX_inv @ X.T, float(XtX_inv[group_col, group_col]), dfX, X)
    df_report = min(v[2] for v in prep.values())
    n_params = max(v[3].shape[1] for v in prep.values())

    pvs, dls, pids = [], [], []
    n_total = 0
    n_drop = 0
    for chunk in _read():
        beta = _values(chunk)
        n_total += len(chunk)
        mask = np.isfinite(beta).all(axis=1)
        n_drop += int((~mask).sum())
        if not mask.any():
            continue
        ids = chunk.index.to_numpy()
        sp = _split(ids) if use_sv else None
        for key, (Pm, c_g, dfX, X) in prep.items():
            m = mask & (sp == key) if use_sv else mask
            if not np.any(m):
                continue
            Yc = beta[m]                          # rows x N
            B = Yc @ Pm.T                         # rows x p
            fitted = B @ X.T                      # rows x N
            resid = Yc - fitted
            rss = np.sum(resid * resid, axis=1)
            with np.errstate(invalid="ignore", divide="ignore"):
                seg = np.sqrt(rss / dfX * c_g)
                bg = B[:, group_col]
                tval = bg / seg
                pval = 2 * tdist.sf(np.abs(tval), dfX)
            bad = ~np.isfinite(pval) | (seg <= 0)
            pval = np.where(bad, np.nan, pval)
            pvs.append(pval)
            dls.append(bg)
            pids.append(ids[m])

    p_all = np.concatenate(pvs) if pvs else np.array([])
    d_all = np.concatenate(dls) if dls else np.array([])
    id_all = np.concatenate(pids).astype(str) if pids else np.array([], dtype=str)
    good = np.isfinite(p_all)
    p_g = p_all[good]; d_g = d_all[good]; id_g = id_all[good]
    q_g = bh_fdr(p_g) if len(p_g) else np.array([])
    return {"n_total": n_total, "n_tested": int(good.sum()), "n_dropped_nan": int(n_drop),
            "probe": id_g, "p": p_g, "delta": d_g, "q": q_g,
            "df": int(df_report), "n_sv": int(n_sv), "n_params": int(n_params),
            "sv_crossfit": use_sv, "sv_varexp": sv_varexp}


# --------------------------------------------------------------------------- #
# Cok-cekirdekli kovaryat-ayarli kosucu (yalniz n_sv=0; olculen kovaryatlar).
# Mantik run_chunked_adjusted ile BIREBIR AYNI (ayni OLS, ayni complete-case
# dusurmesi, ayni BH-FDR) — tek fark, gz EBEVEYNDE BIR KEZ cozulur (tek cekirdek,
# ~124 MB/s), cozulen ham metin BLOKLARI iscilere dagitilir; pahali olan
# ayristirma+OLS N cekirdege yayilir. Boylece cozme cogaltilmaz, bellek-bandi
# doygunlugu olmaz. Buyuk matrisleri (663 sutun) tek cagri butcesinde (120s)
# bitirmek icin kullanilir. Sonuc serial yol ile BIT-OZDESTIR (dogrulandi).
# --------------------------------------------------------------------------- #
_PCTX = None


def _parse_block(block):
    c = _PCTX
    Pm = c["Pm"]; c_g = c["c_g"]; dfX = c["df"]; X = c["X"]
    group_col = c["group_col"]; transform = c["transform"]
    sample_idx = c["sample_idx"]; sep = c["sep"]
    d = pd.read_csv(io.BytesIO(block), sep=sep, header=None, index_col=0, low_memory=False)
    ids = d.index.to_numpy()
    vals = d.to_numpy(dtype=np.float64)
    beta = transform(vals) if transform is not None else vals
    if sample_idx is not None:
        beta = beta[:, sample_idx]
    n_total = len(ids)
    mask = np.isfinite(beta).all(axis=1)
    n_drop = int((~mask).sum())
    if not mask.any():
        return (np.array([], dtype=str), np.array([]), np.array([]), n_total, n_drop)
    Yc = beta[mask]
    B = Yc @ Pm.T
    resid = Yc - B @ X.T
    rss = np.sum(resid * resid, axis=1)
    with np.errstate(invalid="ignore", divide="ignore"):
        seg = np.sqrt(rss / dfX * c_g)
        bg = B[:, group_col]
        tval = bg / seg
        pval = 2 * tdist.sf(np.abs(tval), dfX)
    bad = ~np.isfinite(pval) | (seg <= 0)
    pval = np.where(bad, np.nan, pval)
    return (ids[mask].astype(str), pval, bg, n_total, n_drop)


def run_parallel_adjusted(matrix_path, X0, group_col, sample_idx=None, transform=None,
                          sep="\t", nproc=8, block_bytes=32 << 20,
                          start_block=0, end_block=None, raw=False):
    """run_chunked_adjusted'in cok-cekirdekli, n_sv=0 esdegeri. Ayni sayilari uretir
    (sabit-X OLS, yalniz olculen kovaryatlar). Ebeveyn gz'yi BIR KEZ ikili (binary)
    bloklar halinde cozer (satir-bazli Python yuku yok, ~124 MB/s), ham bayt
    bloklarini iscilere imap ile akitir; ayristirma+OLS cekirdeklere yayilir."""
    global _PCTX
    import multiprocessing as mp
    from numpy.linalg import inv
    X = np.asarray(X0, dtype=np.float64)
    N, pX = X.shape
    dfX = N - pX
    if dfX < 1:
        raise SystemExit(f"serbestlik derecesi <1 (N={N}, p={pX})")
    XtX_inv = inv(X.T @ X)
    Pm = XtX_inv @ X.T
    c_g = float(XtX_inv[group_col, group_col])
    _PCTX = dict(path=matrix_path, sep=sep, Pm=Pm, c_g=c_g, df=dfX, X=X,
                 group_col=group_col, transform=transform, sample_idx=sample_idx)

    def gen_blocks():
        # Deterministik blok sinirlari (sabit block_bytes). idx<start_block -> ucuz
        # cozulup atilir (IPC/parse yok); idx>=end_block -> cozme durur. Boylece
        # is iki cagriya bolunebilir (resumable). Birlesim = tum bloklar.
        opener = (lambda: gzip.open(matrix_path, "rb")) if matrix_path.endswith(".gz") \
            else (lambda: open(matrix_path, "rb"))
        leftover = b""
        header_done = False
        idx = 0
        with opener() as f:
            while True:
                if end_block is not None and idx >= end_block:
                    return
                chunk = f.read(block_bytes)
                if not chunk:
                    break
                data = leftover + chunk
                if not header_done:
                    nl = data.find(b"\n")
                    if nl < 0:
                        leftover = data
                        continue
                    data = data[nl + 1:]
                    header_done = True
                cut = data.rfind(b"\n")
                if cut < 0:
                    leftover = data
                    continue
                blk = data[:cut + 1]
                leftover = data[cut + 1:]
                if idx >= start_block:
                    yield blk
                idx += 1
            if leftover.strip() and (end_block is None or idx < end_block) and idx >= start_block:
                yield leftover

    ids_l, p_l, d_l = [], [], []
    n_total = 0; n_drop = 0
    with mp.get_context("fork").Pool(nproc) as pool:
        for ids, p, dl, nt, nd in pool.imap(_parse_block, gen_blocks(), chunksize=1):
            n_total += nt; n_drop += nd
            if len(p):
                ids_l.append(ids); p_l.append(p); d_l.append(dl)
    id_all = np.concatenate(ids_l) if ids_l else np.array([], dtype=str)
    p_all = np.concatenate(p_l) if p_l else np.array([])
    d_all = np.concatenate(d_l) if d_l else np.array([])
    if raw:
        # Checkpoint icin BH-FDR YOK: ham probe/p/delta + sayaclar dondurulur.
        # BH-FDR yalniz tum bloklar birlestikten sonra (son cagri) uygulanir.
        return {"n_total": n_total, "n_dropped_nan": int(n_drop),
                "probe": id_all, "p": p_all, "delta": d_all,
                "df": int(dfX), "n_params": int(pX)}
    good = np.isfinite(p_all)
    p_g = p_all[good]; d_g = d_all[good]; id_g = id_all[good]
    q_g = bh_fdr(p_g) if len(p_g) else np.array([])
    return {"n_total": n_total, "n_tested": int(good.sum()), "n_dropped_nan": int(n_drop),
            "probe": id_g, "p": p_g, "delta": d_g, "q": q_g,
            "df": int(dfX), "n_sv": 0, "n_params": int(pX),
            "sv_crossfit": False, "sv_varexp": []}
