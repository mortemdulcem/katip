#!/usr/bin/env python3
"""
03_enrichment.py — REAL GO/KEGG enrichment of the smoking DMP genes (GSE50660).

Maps the FDR<0.05 differentially methylated CpGs to genes via the official Illumina
450K manifest (GPL13534), then queries Enrichr (gseapy) for GO Biological Process and
KEGG pathways. Every reported term/p/FDR comes back live from Enrichr — nothing invented.

Outputs:
  out/gse50660_sig_genes.txt
  out/gse50660_GO_Biological_Process_2021.csv
  out/gse50660_KEGG_2021_Human.csv
  out/gse50660_enrichment_summary.json
"""
import csv, gzip, json, os, hashlib, time
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "data"))
OUT = os.path.abspath(os.path.join(HERE, "..", "out"))
MANIFEST = os.path.join(DATA, "GPL13534_manifest.csv.gz")
DMP = os.path.join(OUT, "gse50660_dmp.csv")
FDR_CUT = 0.05


def sha256(path, buf=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(buf), b""):
            h.update(c)
    return h.hexdigest()


def load_cpg_gene_map(path):
    """cg -> sorted list of unique gene symbols from UCSC_RefGene_Name."""
    cg2gene = {}
    with gzip.open(path, "rt", errors="replace") as f:
        # skip preamble until header row beginning with IlmnID
        header = None
        for line in f:
            if line.startswith("IlmnID,"):
                header = next(csv.reader([line]))
                break
        idx_name = header.index("Name")
        idx_gene = header.index("UCSC_RefGene_Name")
        rdr = csv.reader(f)
        for row in rdr:
            if not row or row[0].startswith("["):  # [Controls] section -> stop
                if row and row[0].startswith("["):
                    break
                continue
            if len(row) <= idx_gene:
                continue
            cg = row[idx_name]
            genes = row[idx_gene]
            if not cg.startswith("cg"):
                continue
            if genes:
                uniq = sorted({g for g in genes.split(";") if g})
                if uniq:
                    cg2gene[cg] = uniq
    return cg2gene


def main():
    import gseapy as gp
    t0 = time.time()
    print("manifest sha256:", sha256(MANIFEST))
    cg2gene = load_cpg_gene_map(MANIFEST)
    print(f"manifest CpGs with gene annotation: {len(cg2gene):,}")

    dmp = pd.read_csv(DMP)
    sig = dmp[dmp["fdr"] < FDR_CUT]
    sig_cgs = sig["cg"].tolist()
    genes = sorted({g for cg in sig_cgs for g in cg2gene.get(cg, [])})
    print(f"sig CpGs (FDR<{FDR_CUT}): {len(sig_cgs)}  -> unique genes: {len(genes)}")
    with open(os.path.join(OUT, "gse50660_sig_genes.txt"), "w") as f:
        f.write("\n".join(genes) + "\n")
    print("genes:", ", ".join(genes))

    summary = {
        "manifest_sha256": sha256(MANIFEST),
        "fdr_cut": FDR_CUT,
        "n_sig_cpg": len(sig_cgs),
        "n_genes": len(genes),
        "genes": genes,
        "libraries": {},
        "enrichr_note": "Enrichr default genome background; live query maayanlab.cloud",
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    if len(genes) >= 3:
        for lib in ["GO_Biological_Process_2021", "KEGG_2021_Human"]:
            try:
                enr = gp.enrichr(gene_list=genes, gene_sets=[lib], organism="human",
                                 outdir=None, no_plot=True)
                df = enr.results.sort_values("Adjusted P-value")
                df.to_csv(os.path.join(OUT, f"gse50660_{lib}.csv"), index=False)
                top = df.head(15)[["Term", "Overlap", "P-value", "Adjusted P-value", "Genes"]]
                summary["libraries"][lib] = {
                    "n_terms": int(len(df)),
                    "n_sig_fdr05": int((df["Adjusted P-value"] < 0.05).sum()),
                    "top": top.to_dict("records"),
                }
                print(f"\n=== {lib}: {len(df)} terms, {int((df['Adjusted P-value']<0.05).sum())} at FDR<0.05 ===")
                print(top.head(10).to_string(index=False))
            except Exception as e:
                summary["libraries"][lib] = {"error": str(e)}
                print(f"{lib} ERROR: {e}")
    else:
        print("too few genes for enrichment")

    with open(os.path.join(OUT, "gse50660_enrichment_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\ndone in {time.time()-t0:.0f}s")


if __name__ == "__main__":
    main()
