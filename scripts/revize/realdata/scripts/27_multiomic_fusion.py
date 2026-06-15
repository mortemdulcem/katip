"""
EPICLOCK v4.0 - Module #6: Multi-omik Fuzyon (Multi-omics Fusion)
==================================================================

STATUS: REAL (own reproducible computation on real public paired-omics data; seed=42,
leakage-free). This is an ENGINE VALIDATION: it proves the intermediate-fusion pipeline
works on genuinely sample-matched multi-omics data. It is NOT an addiction multi-omics
result - no cohort in this project carries paired omics on the same individuals, and that
boundary is stated explicitly (see `addiction_boundary`).

Why this is honest, not a workaround:
  * Multi-omics fusion requires >=2 molecular layers measured on the SAME individuals.
    The article originally reported a fabricated addiction multi-omics fusion. No paired
    addiction omics exists publicly, so instead of inventing numbers we VALIDATE the same
    fusion machinery on a real, sample-matched dataset and declare the addiction gap.

Data (verified accessible before coding, UCSC Xena TCGA hub):
  * TCGA-LUAD (lung adenocarcinoma - smoking-relevant), same-barcode paired layers:
      - DNA methylation: Illumina HumanMethylation450  (TCGA.LUAD.sampleMap/HumanMethylation450)
      - Gene expression: IlluminaHiSeq RNA-seq (HiSeqV2, log2(norm_count+1))
      - Clinical: LUAD_clinicalMatrix (tobacco_smoking_history_indicator)
  * 477 same-barcode paired samples.
  * Methylation feature space = a fixed, LABEL-INDEPENDENT, deterministic probe subset
    (first 10000 alphabetical 450K probes streamed via `curl | zcat | head`); leakage-free
    because selection never sees the label. Final feature selection/scaling/encoding are
    all fit INSIDE each training fold only.

Two real tasks:
  * PRIMARY  - never- vs ever-smoker among tumours (TCGA tobacco_smoking_history_indicator):
    an on-theme task carrying a real DNA-methylation signal (e.g. AHRR), so the value of
    fusion vs a single omic can be measured meaningfully.
  * SANITY   - tumour (01) vs solid-tissue normal (11): an easy positive control.

Method (mirrors the single-omic models in this project):
  * StratifiedKFold(5, shuffle, seed=42). Inside each TRAIN fold only: median-impute ->
    top-variance feature selection per omic -> StandardScaler -> per-omic PCA encoder ->
    INTERMEDIATE FUSION (concatenate the two latent vectors) -> shared LogisticRegression.
  * Reported head-to-head with methylation-only and expression-only encoders so the value
    of fusion is measured, not assumed. Mean +/- SD and t-based 95% CI across the 5 folds.

Output: out/dl/multiomic_fusion.json
Run   : python3 scripts/27_multiomic_fusion.py
"""

import hashlib
import json
import os
import platform
import time

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.model_selection import StratifiedGroupKFold, StratifiedKFold
from sklearn.preprocessing import StandardScaler

try:
    from scipy import stats as _st
    def _t975(df):
        return float(_st.t.ppf(0.975, df))
except Exception:                                   # df=4 fallback
    def _t975(df):
        return 2.776 if df == 4 else 1.96

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(ROOT, "out", "dl")
SEED = 42

EXPR_GZ = os.path.join(OUT, "LUAD_HiSeqV2.gz")              # full RNA-seq matrix
METH_TSV = os.path.join(OUT, "LUAD_meth_panel10k.tsv")      # 10k-probe label-free panel
CLIN = os.path.join(OUT, "LUAD_clinicalMatrix")            # clinical (smoking status)
COHORT = "TCGA-LUAD"
TOPK = 2000          # in-fold top-variance features per omic
NPCA = 30            # per-omic latent dimension (encoder)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for blk in iter(lambda: fh.read(1 << 20), b""):
            h.update(blk)
    return h.hexdigest()


def sample_type(barcode):
    p = barcode.split("-")
    return p[3][:2] if len(p) > 3 else "??"


def patient(barcode):
    """TCGA patient id = first three barcode fields (project-TSS-participant)."""
    return "-".join(barcode.split("-")[:3])


def smoke_bin(s):
    """never-smoker=0, ever-smoker=1, else None (TCGA tobacco_smoking_history_indicator)."""
    if not isinstance(s, str):
        return None
    t = s.strip().lower()
    if "non-smoker" in t or "nonsmoker" in t:
        return 0
    if "smoker" in t:
        return 1
    return None


def load_matrix(path, **kw):
    """genes/probes x samples -> samples x features (DataFrame indexed by barcode)."""
    df = pd.read_csv(path, sep="\t", index_col=0, **kw)
    return df.T                                     # rows = samples, cols = features


def in_fold_transform(Xtr, Xte, topk):
    """median-impute -> top-variance select -> scale -> PCA encoder. ALL fit on TRAIN only."""
    med = np.nanmedian(np.where(np.isnan(Xtr).all(0), 0.0, Xtr), axis=0)
    med = np.where(np.isnan(med), 0.0, med)
    Xtr = np.where(np.isnan(Xtr), med, Xtr)
    Xte = np.where(np.isnan(Xte), med, Xte)
    var = Xtr.var(axis=0)
    sel = np.argsort(-var)[:min(topk, Xtr.shape[1])]
    Xtr, Xte = Xtr[:, sel], Xte[:, sel]
    sc = StandardScaler().fit(Xtr)
    Xtr, Xte = sc.transform(Xtr), sc.transform(Xte)
    ncomp = min(NPCA, Xtr.shape[1], Xtr.shape[0] - 1)
    enc = PCA(n_components=ncomp, random_state=SEED).fit(Xtr)
    return enc.transform(Xtr), enc.transform(Xte)


def make_splits(y, groups):
    """Patient-grouped CV. When every sample is already a distinct patient the grouped
    split is identical to standard StratifiedKFold; otherwise StratifiedGroupKFold keeps
    each patient wholly inside one fold so no patient leaks across a train/test split."""
    y = np.asarray(y)
    groups = np.asarray(groups)
    if len(set(groups.tolist())) == len(groups):
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
        return list(cv.split(np.zeros(len(y)), y)), "StratifiedKFold (every sample is a distinct patient)"
    cv = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED)
    return list(cv.split(np.zeros(len(y)), y, groups)), "StratifiedGroupKFold (patient-grouped, leakage-free)"


def evaluate(views, y, groups):
    """views: dict 'meth'/'expr' -> (samples x features). Per-fold metrics for
    meth-only, expr-only and fused (intermediate latent concatenation). CV is
    patient-grouped; no patient appears in both train and test of a fold."""
    splits, cv_used = make_splits(y, groups)
    garr = np.asarray(groups)
    res = {k: {"auc": [], "acc": [], "f1": []} for k in ["meth_only", "expr_only", "fused"]}
    for tr, te in splits:
        assert not (set(garr[tr].tolist()) & set(garr[te].tolist())), "patient leak across fold"
        ytr, yte = y[tr], y[te]
        lat_tr, lat_te = {}, {}
        for k in ("meth", "expr"):
            ztr, zte = in_fold_transform(views[k][tr], views[k][te], TOPK)
            lat_tr[k], lat_te[k] = ztr, zte
        designs = {
            "meth_only": (lat_tr["meth"], lat_te["meth"]),
            "expr_only": (lat_tr["expr"], lat_te["expr"]),
            "fused": (np.hstack([lat_tr["meth"], lat_tr["expr"]]),
                      np.hstack([lat_te["meth"], lat_te["expr"]])),
        }
        for name, (Ztr, Zte) in designs.items():
            clf = LogisticRegression(max_iter=2000, random_state=SEED)
            clf.fit(Ztr, ytr)
            prob = clf.predict_proba(Zte)[:, 1]
            pred = (prob >= 0.5).astype(int)
            res[name]["auc"].append(float(roc_auc_score(yte, prob)))
            res[name]["acc"].append(float(accuracy_score(yte, pred)))
            res[name]["f1"].append(float(f1_score(yte, pred, zero_division=0)))
    return res, cv_used


def summarise(vals):
    a = np.asarray(vals, float)
    mean, sd = float(a.mean()), float(a.std(ddof=1))
    ci = _t975(len(a) - 1) * sd / np.sqrt(len(a))
    return {"mean": round(mean, 4), "sd": round(sd, 4),
            "ci95": [round(mean - ci, 4), round(mean + ci, 4)],
            "folds": [round(v, 4) for v in vals]}


def run_task(expr, meth, samples, y):
    Xe = expr.loc[samples].to_numpy(np.float64)
    Xm = meth.loc[samples].to_numpy(np.float64)
    groups = [patient(b) for b in samples]
    res, cv_used = evaluate({"meth": Xm, "expr": Xe}, np.asarray(y), groups)
    gain = round(np.mean(res["fused"]["auc"]) -
                 max(np.mean(res["meth_only"]["auc"]),
                     np.mean(res["expr_only"]["auc"])), 4)
    return {
        "n": len(samples),
        "n_pos": int(np.sum(y)),
        "n_neg": int(len(y) - np.sum(y)),
        "n_unique_patients": len(set(groups)),
        "cv_used": cv_used,
        "results_auc": {k: summarise(res[k]["auc"]) for k in ("meth_only", "expr_only", "fused")},
        "results_accuracy": {k: summarise(res[k]["acc"]) for k in ("meth_only", "expr_only", "fused")},
        "results_f1": {k: summarise(res[k]["f1"]) for k in ("meth_only", "expr_only", "fused")},
        "fusion_gain_auc_vs_best_single": gain,
    }


def main():
    t0 = time.time()
    os.makedirs(OUT, exist_ok=True)

    expr = load_matrix(EXPR_GZ, compression="gzip")
    meth = load_matrix(METH_TSV)
    clin = pd.read_csv(CLIN, sep="\t", index_col=0, low_memory=False)
    print(f"loaded expr {expr.shape} meth {meth.shape} clin {clin.shape} "
          f"({time.time()-t0:.0f}s)", flush=True)

    common = set(expr.index) & set(meth.index)
    smoke = clin["tobacco_smoking_history_indicator"].map(smoke_bin)

    # PRIMARY: never vs ever smoker among tumours with paired omics + known status
    s_smk = sorted(b for b in common if sample_type(b) == "01"
                   and b in smoke.index and not pd.isna(smoke.get(b)))
    y_smk = [int(smoke[b]) for b in s_smk]
    assert len({patient(b) for b in s_smk}) == len(s_smk), \
        "PRIMARY task must be patient-unique (no aliquot duplicates) for its cited AUC"

    # SANITY: tumour vs normal
    s_tn = sorted(b for b in common if sample_type(b) in ("01", "11"))
    y_tn = [1 if sample_type(b) == "01" else 0 for b in s_tn]

    print(f"paired={len(common)} | smoke-task n={len(s_smk)} "
          f"(ever {int(np.sum(y_smk))}/never {len(y_smk)-int(np.sum(y_smk))}) | "
          f"tn-task n={len(s_tn)}", flush=True)

    task_smoke = run_task(expr, meth, s_smk, y_smk)
    task_tn = run_task(expr, meth, s_tn, y_tn)

    out = {
        "module": "Multi-omik Fuzyon (#6)",
        "status": "REAL (engine validation on real paired omics; seed=42, leakage-free)",
        "framing": ("Validates the intermediate-fusion ENGINE on genuinely sample-matched "
                    "multi-omics data. This is a methodological capability demonstration, "
                    "NOT an addiction-specific multi-omics finding."),
        "dataset": {
            "cohort": COHORT,
            "source": "UCSC Xena TCGA hub (tcga.xenahubs.net)",
            "layers": {
                "methylation": "Illumina HumanMethylation450 (beta); "
                               "label-free first-10000-alphabetical-probe panel",
                "expression": "IlluminaHiSeq RNA-seq HiSeqV2, log2(norm_count+1)",
                "clinical": "LUAD_clinicalMatrix (tobacco_smoking_history_indicator)",
            },
            "n_paired_same_barcode": len(common),
            "input_sha256": {
                "LUAD_HiSeqV2.gz": sha256(EXPR_GZ),
                "LUAD_meth_panel10k.tsv": sha256(METH_TSV),
                "LUAD_clinicalMatrix": sha256(CLIN),
            },
        },
        "method": {
            "cv": "patient-grouped 5-fold (StratifiedGroupKFold by TCGA patient id; reduces to "
                  "StratifiedKFold when every sample is already a distinct patient), shuffle, seed=42",
            "per_fold_pipeline": "median-impute -> top-%d-variance per omic -> StandardScaler "
                                 "-> per-omic PCA(%d) encoder -> intermediate fusion "
                                 "(latent concatenation) -> LogisticRegression" % (TOPK, NPCA),
            "leakage_control": "every transform (impute/select/scale/PCA) is fit on the TRAIN "
                               "fold only; methylation panel is label-independent; no patient "
                               "appears in both train and test of a fold (asserted per fold).",
            "seed": SEED,
        },
        "tasks": {
            "smoker_never_vs_ever_PRIMARY": {
                "label": "ever-smoker = 1  vs  never-smoker = 0; tumours only "
                         "(TCGA tobacco_smoking_history_indicator)",
                **task_smoke,
            },
            "tumour_vs_normal_SANITY": {
                "label": "primary tumour (01) = 1  vs  solid-tissue normal (11) = 0",
                **task_tn,
            },
        },
        "addiction_boundary": (
            "No addiction cohort in this project carries paired omics on the same individuals "
            "(all six are single-omic DNA methylation), so a real addiction multi-omics fusion "
            "remains DATA-BLOCKED. The article's original fabricated addiction fusion is replaced "
            "by this honest engine validation plus the explicit data gap."),
        "outputs": ["out/dl/multiomic_fusion.json"],
        "seed": SEED,
        "versions": {
            "python": platform.python_version(),
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "sklearn": __import__("sklearn").__version__,
        },
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    json.dump(out, open(os.path.join(OUT, "multiomic_fusion.json"), "w"), indent=2)
    sm = task_smoke["results_auc"]
    print(f"REAL smoke-task n={task_smoke['n']} (ever {task_smoke['n_pos']}/never {task_smoke['n_neg']}) | "
          f"AUC meth={sm['meth_only']['mean']} expr={sm['expr_only']['mean']} "
          f"FUSED={sm['fused']['mean']} (CI {sm['fused']['ci95']}) "
          f"gain={task_smoke['fusion_gain_auc_vs_best_single']} | "
          f"sanity tn AUC fused={task_tn['results_auc']['fused']['mean']} "
          f"({time.time()-t0:.0f}s)", flush=True)


if __name__ == "__main__":
    main()
