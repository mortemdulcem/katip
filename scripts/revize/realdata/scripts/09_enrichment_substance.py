#!/usr/bin/env python3
"""
09_enrichment_substance.py — REAL GO/KEGG enrichment for a substance DMP set.

Generic version of 03_enrichment.py. Maps the FDR<0.05 CpGs of out/{ACC}_dmp.csv to genes
via the official Illumina 450K manifest (GPL13534) and queries Enrichr (gseapy) live.
All three substance cohorts (GSE77056 cocaine, GSE154971 meth, GSE98203 opioid-brain) are 450K.

Usage:  python 09_enrichment_substance.py GSE77056
Outputs: out/{ACC}_sig_genes.txt, out/{ACC}_GO_Biological_Process_2021.csv,
         out/{ACC}_KEGG_2021_Human.csv, out/{ACC}_enrichment_summary.json
"""
import csv, gzip, json, os, hashlib, time, sys
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
OUT = os.path.abspath(os.path.join(HERE, "..", "out"))
MANIFEST = os.path.join(DATA, "GPL13534_manifest.csv.gz")
FDR_CUT = 0.05
# cap genes sent to Enrichr for very large hit lists (cocaine) — keep most-significant
MAX_GENES = 1500


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(buf), b""):
            h.update(c)
    return h.hexdigest()


def load_cpg_gene_map(path):
    cg2gene = {}
    with gzip.open(path, "rt", errors="replace") as f:
        header = None
        for line in f:
            if line.startswith("IlmnID,"):
                header = next(csv.reader([line]))
                break
        idx_name = header.index("Name")
        idx_gene = header.index("UCSC_RefGene_Name")
        rdr = csv.reader(f)
        for row in rdr:
            if not row or row[0].startswith("["):
                if row and row[0].startswith("["):
                    break
                continue
            if len(row) <= idx_gene:
                continue
            cg, genes = row[idx_name], row[idx_gene]
            if not cg.startswith("cg"):
                continue
            if genes:
                uniq = sorted({g for g in genes.split(";") if g})
                if uniq:
                    cg2gene[cg] = uniq
    return cg2gene


def main():
    import gseapy as gp
    acc = sys.argv[1]
    dmp_path = os.path.join(OUT, f"{acc}_dmp.csv")
    t0 = time.time()
    print(f"{acc} | manifest sha256:", sha256(MANIFEST))
    cg2gene = load_cpg_gene_map(MANIFEST)
    print(f"manifest CpGs with gene annotation: {len(cg2gene):,}")

    dmp = pd.read_csv(dmp_path)
    sig = dmp[dmp["fdr"] < FDR_CUT].sort_values("p")
    sig_cgs = sig["cg"].tolist()
    # collect genes in significance order, dedup, cap
    seen, genes = set(), []
    for cg in sig_cgs:
        for g in cg2gene.get(cg, []):
            if g not in seen:
                seen.add(g); genes.append(g)
    capped = len(genes) > MAX_GENES
    genes_used = genes[:MAX_GENES] if capped else genes
    print(f"sig CpGs (FDR<{FDR_CUT}): {len(sig_cgs)} -> unique genes: {len(genes)}"
          + (f" (capped to {MAX_GENES} most-significant)" if capped else ""))
    with open(os.path.join(OUT, f"{acc}_sig_genes.txt"), "w") as f:
        f.write("\n".join(genes_used) + "\n")

    summary = {
        "dataset": acc, "manifest_sha256": sha256(MANIFEST), "fdr_cut": FDR_CUT,
        "n_sig_cpg": len(sig_cgs), "n_genes_total": len(genes),
        "n_genes_used": len(genes_used), "gene_list_capped": capped,
        "libraries": {},
        "enrichr_note": "Enrichr default genome background; live query maayanlab.cloud",
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    if len(genes_used) >= 3:
        for lib in ["GO_Biological_Process_2021", "KEGG_2021_Human"]:
            try:
                enr = gp.enrichr(gene_list=genes_used, gene_sets=[lib], organism="human",
                                 outdir=None, no_plot=True)
                df = enr.results.sort_values("Adjusted P-value")
                df.to_csv(os.path.join(OUT, f"{acc}_{lib}.csv"), index=False)
                nsig = int((df["Adjusted P-value"] < 0.05).sum())
                top = df.head(15)[["Term", "Overlap", "P-value", "Adjusted P-value", "Genes"]]
                summary["libraries"][lib] = {"n_terms": int(len(df)),
                                             "n_sig_fdr05": nsig, "top": top.to_dict("records")}
                print(f"\n=== {lib}: {len(df)} terms, {nsig} at FDR<0.05 ===")
                print(top.head(10)[["Term", "Overlap", "Adjusted P-value"]].to_string(index=False))
            except Exception as e:
                summary["libraries"][lib] = {"error": str(e)}
                print(f"{lib} ERROR: {e}")
    else:
        print(f"too few genes ({len(genes_used)}) for enrichment — reported honestly")

    with open(os.path.join(OUT, f"{acc}_enrichment_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\ndone in {time.time()-t0:.0f}s -> out/{acc}_enrichment_summary.json")


if __name__ == "__main__":
    main()
