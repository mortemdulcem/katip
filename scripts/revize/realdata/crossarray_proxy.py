#!/usr/bin/env python3
"""
Diziler-arasi (EPIC <-> 450K) KOORDINAT-TABANLI YAKIN-PROB VEKILI — paylasilan modul.

Neden bu modul var:
  EPIC'e OZGU bir aday marker (450K dizisinde AYNI-PROB olarak YOK), bagimsiz dogrulama
  kohortu yalniz eski 450K dizisindeyse eskiden "anchor yok" gerekcesiyle hic test
  edilemiyordu. Bunun yerine dizi-surumleri arasi koordinat-tabanli "yakin-prob" vekili
  calistirilir: markerin hg38 konumu yerel UCSC chain dosyasiyla (pyliftover) hg19'a
  cevrilir ve bu hg19 anchor'inin ±WINDOW_BP icindeki 450K proplari bagimsiz kohortta
  test edilir. Boylece sonuc "olculemez" yerine GERCEK (vekil-duzeyi) bir replike-eder /
  replike-etmez yanitina donusur. Liftover sonrasi pencerede HIC 450K prob yoksa, bu da
  olculen gercek bir sonuctur (en yakin prob mesafesi raporlanir) — uydurma yapilmaz.

Bu mantik ilk olarak alkol betiginde
  (human/alcohol/alcohol_crossregion_independent_validation.py) yazildi; her madde icin
  (kannabis, ketamin, opioid, ...) EPIC'e ozgu aday + 450K bagimsiz kohort durumunda
  yeniden kullanilabilir olsun diye buraya cikarildi. Davranis alkol betigindekiyle
  birebir aynidir; cikti baytina kadar korunur (delta_field/pencere/FDR parametreleri
  cagiran betikten gelir).

Disa acilan yardimcilar:
  sha256, bh_fdr, load_450k_chr_pos, lift_hg38_to_hg19, nearest_probe, build_window
"""
import gzip
import hashlib

import numpy as np

WINDOW_BP = 2000
FDR_THR = 0.05


def sha256(path, buf=1 << 20):
    """Dosyanin SHA-256 ozetini (hex) hesapla — girdi-bütünlüğü/yeniden-üretilebilirlik."""
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


def load_450k_chr_pos(manifest_path, chroms=None):
    """450K manifestinden (Illumina GPL13534, hg19/build37) {cg: (CHR, MAPINFO)} oku.
    chroms verilirse YALNIZ o kromozomlardaki proplar (hiz icin) — pencere-vekili
    hedefle ayni kromozomdaki ±WINDOW_BP komsulariyla sinirli oldugu icin yeterli."""
    want = None if chroms is None else {c.replace("chr", "") for c in chroms}
    coords = {}
    with gzip.open(manifest_path, "rt") as f:
        # gercek header satiri 'IlmnID' ile baslar (ilk 7 satir Illumina ust bilgisi)
        for line in f:
            if line.startswith("IlmnID,"):
                header = line.rstrip("\n").split(",")
                break
        idx = {c: i for i, c in enumerate(header)}
        ic, ip, im = idx["CHR"], idx["IlmnID"], idx["MAPINFO"]
        for line in f:
            parts = line.split(",")
            if len(parts) <= im:
                continue
            chrm = parts[ic].strip()
            if want is not None and chrm not in want:
                continue
            pos = parts[im].strip()
            if not chrm or not pos.isdigit():
                continue
            coords[parts[ip]] = ("chr" + chrm, int(pos))
    return coords


def lift_hg38_to_hg19(lo, hg38):
    """'chrN:POS' (1-tabanli, hg38) -> ('chrN', POS_1tabanli_hg19) veya None.
    pyliftover 0-tabanli calisir: 1-tabanli girdi icin pos-1 cevrilir, sonuc +1 ile
    1-tabanliya geri donulur. Belirsiz/coklu eslesme olursa en yuksek skorlu alinir."""
    chrom, pos = hg38.split(":")
    pos = int(pos)
    res = lo.convert_coordinate(chrom, pos - 1)  # 0-tabanli
    if not res:
        return None
    res = sorted(res, key=lambda x: -x[3])  # en yuksek chain skoru
    nchr, npos0 = res[0][0], res[0][1]
    return (nchr, npos0 + 1)  # 1-tabanli hg19


def nearest_probe(anchor, coords450):
    """coords450 icinde anchor ile AYNI kromozomdaki en yakin 450K probu -> (cg, pos, dist)."""
    achr, apos = anchor
    best = None
    for ncg, (nchr, npos) in coords450.items():
        if nchr != achr:
            continue
        d = abs(npos - apos)
        if best is None or d < best[2]:
            best = (ncg, npos, d)
    return best


def build_window(anchor, coords450, gcohort, disc_sign, delta_field,
                 target_cg=None, window_bp=WINDOW_BP, fdr_thr=FDR_THR):
    """anchor (chr, hg19_pos) etrafinda ±window_bp icindeki, bagimsiz 450K kohortunda
    (gcohort) test edilmis proplari toplar; pencere-ici BH-FDR hesaplar; her prob icin
    yon/anlamlilik doner.

    gcohort: {cg: {delta_field: float, "t": float, "p": float, ...}} — bagimsiz kohort DMP.
    delta_field: gcohort'taki delta-beta anahtarinin adi (orn. 'delta_beta_aud_minus_control',
      'delta_beta_heroin_minus_control'). Cikti satir anahtari da bu olur -> betige ozgu
      cikti birebir korunur.
    disc_sign: kesif yonunun isareti (np.sign(...); hiper=+1, hipo=-1).
    target_cg: verilirse o prob 'is_target' isaretlenir ve replike-eden-komsu sayiminda
      haric tutulur (ayni-prob testi ayrica yapildigi icin).
    """
    achr, apos = anchor
    neigh = []
    for ncg, (nchr, npos) in coords450.items():
        if nchr == achr and abs(npos - apos) <= window_bp and ncg in gcohort:
            neigh.append((ncg, npos))
    neigh.sort(key=lambda x: abs(x[1] - apos))
    ps = [gcohort[n[0]]["p"] for n in neigh]
    qs = bh_fdr(ps) if ps else []
    qmap = {neigh[i][0]: float(qs[i]) for i in range(len(neigh))}
    win_rows = []
    repl_neighbors = []
    for ncg, npos in neigh:
        s = gcohort[ncg]
        wsign = np.sign(s[delta_field])
        wsame = bool(wsign == disc_sign and disc_sign != 0)
        wfdr = qmap[ncg]
        wsig = bool(wfdr < fdr_thr)
        is_disc = bool(target_cg is not None and ncg == target_cg)
        win_rows.append({
            "probe": ncg,
            "hg19": f"{achr}:{npos}",
            "dist_to_anchor_bp": int(abs(npos - apos)),
            "is_target": is_disc,
            delta_field: s[delta_field],
            "t": s["t"], "p": s["p"],
            "fdr_window": wfdr,
            "sig_window_fdr05": wsig,
            "same_direction_as_discovery": wsame,
        })
        if (not is_disc) and wsig and wsame:
            repl_neighbors.append(ncg)
    return {
        "applied": True,
        "anchor_hg19": f"{achr}:{apos}",
        "n_probes_in_window": len(win_rows),
        "window_replicating_neighbors": repl_neighbors,
        "any_neighbor_replicates": bool(len(repl_neighbors) > 0),
        "window_probes": win_rows,
    }
