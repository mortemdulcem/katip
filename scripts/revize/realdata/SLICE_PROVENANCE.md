# Partial-genome slice provenance (env-constrained datasets)

Two GEO datasets are too large to download/decompress in full within this environment's
~120 s-per-call wall (see `.agents/memory/geo-large-matrix-env-limits.md`). For each, a
**label-blind, position-based slice** (the first N probe rows in array order) is streamed
with `head`, which is independent of case/control status and therefore leakage-free. The
exact, reproducible commands are recorded here. `data/` is git-ignored, so the raw slices
are regenerated with these commands; the SHA-256 of each slice is also baked into the
trainer's `oof_metrics.data_sha256`.

---

## 1. GSE109914 — arsenic exposure (450K whole blood, n=119: 84 exposed / 35 unexposed)

Trainer: `scripts/33_arsenic_model.py` → `out/dl/models/exposure_arsenic.joblib`

**Labels** (`arsenic exposure: Yes/No`) + **betas** are both in the series matrix
(`!series_matrix_table_begin` block), but the full file gz is ~395 MB and decompresses past
the wall, so only the first 120 000 probe rows are kept.

```bash
cd data
URL="https://ftp.ncbi.nlm.nih.gov/geo/series/GSE109nnn/GSE109914/matrix/GSE109914_series_matrix.txt.gz"
curl -s -o GSE109914_series_matrix.txt.gz "$URL"
# beta slice: skip the "!"-prefixed metadata header lines, keep ID_REF row + first 120k probes
zcat GSE109914_series_matrix.txt.gz \
  | sed -n '/^!series_matrix_table_begin/,/^!series_matrix_table_end/p' \
  | grep -v '^!' | head -120001 | tr -d '"' > GSE109914_betas_slice.tsv
```

- Output: `data/GSE109914_betas_slice.tsv` — 120 000 probes × 119 samples (tab-separated; GSM column headers).
- SHA-256: `473df5d8866afd4b14f01560ea0225e506df3a4fbe9989fcebd043e1dad438c1`
- Candidate pool declared in JSON as "first ~120k array-order probes (env-constrained, label-blind subset of the 450K array)".

---

## 2. GSE152026 — schizophrenia / first-episode psychosis (EU-GEI, EPIC whole blood, n=934: 413 case / 521 control)

Trainer: `scripts/34_schizophrenia_model.py` → `out/dl/models/condition_schizophrenia.joblib`

The series matrix is a **22 KB metadata-only STUB** (no betas). It is downloaded ONLY for the
`sentrix-id → Case/Control` labels (`!Sample_title` first token = sentrix id, matching the
signal column names; `!Sample_characteristics_ch1 phenotype: Case/Control`). The actual betas
live in the 8 GB supplementary `GSE152026_EUGEI_processed_signals.csv.gz`, where each sample
contributes **two interleaved columns**: a direct beta value column and a `*_Detection_Pval`
column (header width = 1 + 934×2 = 1869). The slice keeps the probe-id column + the 934 even
(beta) columns, dropping every `_Detection_Pval` column, for the first 40 000 probe rows.

```bash
cd data
# labels (stub series matrix, 22 KB)
curl -s -o GSE152026_series_matrix.txt.gz \
  "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE152nnn/GSE152026/matrix/GSE152026_series_matrix.txt.gz"
# beta slice from the 8 GB supplementary signals file
U="https://ftp.ncbi.nlm.nih.gov/geo/series/GSE152nnn/GSE152026/suppl/GSE152026_EUGEI_processed_signals.csv.gz"
curl -s --max-time 110 "$U" | zcat \
  | head -40001 \
  | cut -d',' -f1,$(seq -s, 2 2 1868) \
  | tr -d '"' > GSE152026_betas_slice.csv
```

- Output: `data/GSE152026_betas_slice.csv` — 40 000 probes × 934 samples (comma-separated; sentrix-id column headers).
- SHA-256: `835546636c0b1eab8410364c0c44581e7d5509be42f2ad79c1182867b64e9e33`
- The trainer asserts no `Detection_Pval` column survived and that labels are exactly 413/521 (`fail loudly on GEO format / label drift`).
- Candidate pool declared in JSON as "first ~40k array-order probes (env-constrained, label-blind subset of the EPIC array)".

---

### Why this is honest, not a shortcut
- The slice boundary (first N rows of the array) is fixed by probe order on the chip and is
  **independent of the case/control label**, so it cannot leak outcome information.
- It is a *partial-genome* limitation — declared verbatim in every model's `oof_metrics`,
  in `predict.py` output, and here. It is NOT a claim of whole-genome coverage.
- Reported AUCs are within-cohort out-of-fold (StratifiedKFold-5, seed 42) with per-fold
  TRAIN-only imputation, feature selection and class weighting.
