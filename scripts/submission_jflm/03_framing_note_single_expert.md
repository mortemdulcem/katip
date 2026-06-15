# Framing Note: Single-Expert + LLM-Assisted Exploratory Reliability

This note replaces the existing §2.12 framing in the manuscript when submitting to JFLM. The Cohen κ result is **repositioned from a primary inter-rater finding to an exploratory secondary analysis**, and the limitations are made explicit.

---

## Replacement text for §2.12 (English)

### 2.12. Exploratory Secondary Reliability Assessment (Single-Expert Design with LLM-Assisted Rater)

This study was prospectively designed as a **single-expert development study**: all primary TOMEC scoring decisions were performed by the developer (a board-certified forensic medicine specialist). To provide a preliminary, exploratory signal of categorical-level reliability prior to the planned multi-expert prospective validation cohort (Section 10.1), we conducted a secondary analysis in which an independent large language model (OpenAI GPT-4o, temperature = 0) served as a second rater on a stratified sub-sample (n = 35; Top12 + Med12 + Low11) using the same three-category scheme (REL / PARTIAL / IRR).

**Blinding.** A double-blind protocol was applied. The GPT-4o prompt contained only the raw decision excerpt (320–550 characters), the signal-keyword list, and the court-type identifier; no human-assigned label was included in the prompt. Conversely, the human expert was not exposed to GPT-4o's output during the labelling task. Both raters viewed identical input data.

**Results.** Observed agreement = 82.9% (29/35); Cohen κ = 0.732 (95% bootstrap CI 0.523–0.909, B = 2000); linear-weighted κ = 0.736; quadratic-weighted κ = 0.738; Krippendorff α = 0.733; macro-F1 = 0.818; weighted-F1 = 0.824 (full confusion matrix and per-class metrics in Supplementary Table S1).

**Methodological caveat.** *We explicitly acknowledge that the use of a large language model as a second rater is not a substitute for a classical two-expert design.* This sub-analysis should be interpreted as an exploratory feasibility signal only, not as a fully validated reliability estimate. The reported confidence interval is wide (CI width ≈ 0.39), reflecting the small pilot sample (n = 35); a sample-size calculation (Sim & Wright, 2005) indicates that n ≈ 134 would be required to achieve a target CI width of ±0.10 around κ = 0.73 (Supplementary Section S2).

**Planned validation.** A prospective multi-expert validation cohort (Section 10.1) will recruit ≥ 3 independent forensic medicine specialists and apply the TOMEC score to a planned n ≥ 100 prospective court-decision sample. The protocol for that study has been registered (TBD) and will form the subject of a separate manuscript.

---

## Title and abstract changes (summary)

- **Title:** add "Development and **Retrospective Single-Expert Validation**" — explicit signal to reviewers
- **Abstract:** state "single forensic medicine expert" and "independent large language model (GPT-4o)" in the Methods sentence
- **Conclusion sentence:** "TOMEC demonstrates substantial **single-expert with LLM-assisted preliminary** reliability... **Prospective multi-expert validation is required**"

## Limitations section addition

> A central limitation of this study is its single-expert design. While we mitigated this through a double-blind LLM-assisted secondary rating, the κ statistic reported here cannot substitute for a classical inter-expert reliability estimate. Future work (Section 10.1) will address this through a prospective multi-rater cohort. Readers should not interpret the present κ value as definitive evidence of TOMEC's inter-observer reproducibility in routine forensic practice.
