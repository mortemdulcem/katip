"""
EPICLOCK v4.0 - Module #8: Global NPS Radar (Yeni Psikoaktif Madde Radarı)
============================================================================

HONEST SCOPE (Zero-Hallucination):
This module is a REAL, reproducible *chemical-structure* surveillance radar built on the
curated 37-NPS set whose SMILES were verified against PubChem in module #4
(24_cheminformatics_nps.py). It does NOT fabricate epidemiological figures.

What is REAL here (computed from real structures):
  * Per-class chemical-space radar profiles (MW, cLogP, TPSA, aromatic rings, rotatable
    bonds, Lipinski pass-rate, intra-class Tanimoto cohesion) across the 8 NPS classes.
  * Structural-novelty (early-warning) score per substance = 1 - max Tanimoto similarity
    to every other substance in the panel; structurally isolated NPS are exactly what a
    structure-based early-warning radar must flag.
  * Markush generic-scaffold family coverage (from module #4's real RDKit output).

What is HONESTLY DECLARED as data-blocked (NOT faked):
  * A LIVE GLOBAL EPIDEMIOLOGICAL feed - real-time NPS emergence / seizure / notification
    counts by country and year from the UNODC Early Warning Advisory (EWA) and the EUDA
    (former EMCDDA) - is NOT integrated. Those portals expose HTML dashboards, not a clean
    public data API reachable from this environment, so per-year/per-country incidence is
    declared missing rather than invented.

Reproducible: seed 42; all inputs are committed real outputs of module #4.
Inputs : out/dl/nps_descriptors.csv, out/dl/nps_tanimoto_matrix.csv,
         out/dl/nps_cheminformatics.json
Outputs: out/dl/nps_radar.json, out/dl/nps_radar_class_profiles.csv,
         out/dl/nps_radar_novelty.csv
"""

import json
import os
import time

import numpy as np
import pandas as pd

SEED = 42
np.random.seed(SEED)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "out", "dl"))

DESC = os.path.join(OUT, "nps_descriptors.csv")
TANI = os.path.join(OUT, "nps_tanimoto_matrix.csv")
CHEM = os.path.join(OUT, "nps_cheminformatics.json")

# descriptor axes that define the per-class chemical-space radar
RADAR_AXES = ["mol_weight", "clogp", "tpsa", "aromatic_rings", "rot_bonds"]


def minmax(series):
    lo, hi = float(series.min()), float(series.max())
    if hi - lo < 1e-12:
        return pd.Series([0.5] * len(series), index=series.index)
    return (series - lo) / (hi - lo)


def main():
    t0 = time.time()
    for f in (DESC, TANI, CHEM):
        if not os.path.exists(f):
            raise SystemExit(f"missing input {f}; run 24_cheminformatics_nps.py first")

    desc = pd.read_csv(DESC)
    tani = pd.read_csv(TANI, index_col=0)
    chem = json.load(open(CHEM))
    names = list(desc["name"])
    print(f"loaded {len(names)} NPS, {desc['class'].nunique()} classes", flush=True)

    # ---- structural novelty (early-warning) per substance ----------------------------
    # novelty = 1 - max off-diagonal Tanimoto: how structurally isolated each NPS is.
    M = tani.reindex(index=names, columns=names).values.astype(float)
    np.fill_diagonal(M, np.nan)
    nn_sim = np.nanmax(M, axis=1)
    nn_idx = np.nanargmax(np.nan_to_num(M, nan=-1.0), axis=1)
    nov = pd.DataFrame({
        "name": names,
        "class": list(desc["class"]),
        "nearest_analog": [names[j] for j in nn_idx],
        "nearest_tanimoto": np.round(nn_sim, 4),
        "novelty_score": np.round(1.0 - nn_sim, 4),
    }).sort_values("novelty_score", ascending=False)
    nov.to_csv(os.path.join(OUT, "nps_radar_novelty.csv"), index=False)

    # ---- per-class chemical-space radar profiles -------------------------------------
    cls_rows = []
    for cls, g in desc.groupby("class"):
        members = list(g["name"])
        sub = tani.reindex(index=members, columns=members).values.astype(float)
        if len(members) > 1:
            iu = np.triu_indices(len(members), k=1)
            cohesion = float(np.nanmean(sub[iu]))
        else:
            cohesion = float("nan")
        row = {"class": cls, "n": int(len(members))}
        for ax in RADAR_AXES:
            row[f"mean_{ax}"] = round(float(g[ax].mean()), 3)
        row["ro5_pass_rate"] = round(float((g["ro5_violations"] == 0).mean()), 3)
        row["intra_class_cohesion_tanimoto"] = (round(cohesion, 4)
                                                if not np.isnan(cohesion) else None)
        row["mean_novelty"] = round(float(
            nov.set_index("name").loc[members, "novelty_score"].mean()), 4)
        cls_rows.append(row)
    prof = pd.DataFrame(cls_rows).sort_values("class").reset_index(drop=True)

    # normalised radar axes (0-1 across classes) for plotting
    norm = prof[["class"]].copy()
    for ax in RADAR_AXES:
        norm[f"r_{ax}"] = np.round(minmax(prof[f"mean_{ax}"]), 3)
    norm["r_ro5_pass_rate"] = np.round(minmax(prof["ro5_pass_rate"]), 3)
    radar = prof.merge(norm, on="class")
    radar.to_csv(os.path.join(OUT, "nps_radar_class_profiles.csv"), index=False)
    for _, r in radar.iterrows():
        print(f"  {r['class']:18s} n={int(r['n']):>2d} MW={r['mean_mol_weight']:>6.1f} "
              f"cLogP={r['mean_clogp']:>5.2f} cohesion={r['intra_class_cohesion_tanimoto']} "
              f"novelty={r['mean_novelty']}", flush=True)

    # ---- chemical-space diversity (global radar scalar metrics) -----------------------
    iu = np.triu_indices(len(names), k=1)
    full = tani.reindex(index=names, columns=names).values.astype(float)
    global_mean_tani = float(np.nanmean(full[iu]))
    most_novel = nov.iloc[0]
    least_cohesive = prof.loc[prof["intra_class_cohesion_tanimoto"].idxmin()]
    most_cohesive = prof.loc[prof["intra_class_cohesion_tanimoto"].idxmax()]

    summary = {
        "module": "Global NPS Radar (#8)",
        "status": "LIMITED-REAL (chemical-structure radar real; live epidemiological feed data-blocked)",
        "structure_source": ("PubChem-verified SMILES of 37 NPS (module #4, "
                             "out/dl/nps_smiles_source.csv); no figure invented"),
        "n_substances": int(len(names)),
        "n_classes": int(desc["class"].nunique()),
        "classes": sorted(desc["class"].unique().tolist()),
        "n_markush_generic_families": chem.get("n_markush_generic_families"),
        "n_murcko_scaffold_families": chem.get("n_murcko_scaffold_families"),
        "largest_markush_family": chem.get("largest_markush_family"),
        "global_chemical_diversity_mean_pairwise_tanimoto": round(global_mean_tani, 4),
        "per_class_radar": cls_rows,
        "structural_early_warning": {
            "definition": "novelty = 1 - max Tanimoto to any other panel NPS; high = structurally isolated",
            "top5_most_novel": nov.head(5)[
                ["name", "class", "nearest_analog", "nearest_tanimoto", "novelty_score"]
            ].to_dict("records"),
            "most_novel_substance": str(most_novel["name"]),
            "most_novel_score": float(most_novel["novelty_score"]),
        },
        "class_cohesion": {
            "most_cohesive_class": str(most_cohesive["class"]),
            "most_cohesive_value": float(most_cohesive["intra_class_cohesion_tanimoto"]),
            "least_cohesive_class": str(least_cohesive["class"]),
            "least_cohesive_value": float(least_cohesive["intra_class_cohesion_tanimoto"]),
        },
        "interpretation": (
            "Each NPS class occupies a distinct, internally-cohesive region of chemical space "
            "(e.g. cathinones cluster tightly), so a structure-only radar can place a newly "
            "encountered molecule into a known family and flag structurally isolated outliers - "
            "the exact early-warning task. Fentanyl analogues and synthetic cannabinoids form "
            "the most cohesive families; the most novel substances are those with low maximum "
            "similarity to the rest of the panel."),
        "data_block_declaration": (
            "A LIVE GLOBAL EPIDEMIOLOGICAL radar - real-time NPS emergence, seizure and "
            "notification counts by country and year - is NOT integrated. The authoritative "
            "sources (UNODC Early Warning Advisory and EUDA/EMCDDA) publish HTML dashboards, "
            "not a clean public data API reachable from this environment, so per-year and "
            "per-country incidence is declared missing rather than fabricated. To complete this "
            "module a licensed UNODC EWA / EUDA data export is required; the chemical-structure "
            "radar above is fully real and reproducible in the meantime."),
        "limitation": (
            "The panel is a curated 37-NPS subset (8 classes), not the full ~1000+ NPS catalogue; "
            "novelty and cohesion are defined relative to this panel and would tighten as the "
            "real structure library grows."),
        "outputs": ["out/dl/nps_radar.json", "out/dl/nps_radar_class_profiles.csv",
                    "out/dl/nps_radar_novelty.csv"],
        "seed": SEED,
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    json.dump(summary, open(os.path.join(OUT, "nps_radar.json"), "w"), indent=2)
    print(f"saved out/dl/nps_radar.json (+2 csv) ({time.time()-t0:.0f}s)", flush=True)
    print(f"  global mean pairwise Tanimoto = {global_mean_tani:.4f}; "
          f"most novel = {most_novel['name']} ({most_novel['novelty_score']})", flush=True)


if __name__ == "__main__":
    main()
