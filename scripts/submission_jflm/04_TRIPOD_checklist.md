# TRIPOD Checklist — TOMEC Score Development

**Reference:** Collins GS et al. Transparent Reporting of a multivariable prediction model for Individual Prognosis Or Diagnosis (TRIPOD): The TRIPOD Statement. Ann Intern Med. 2015;162(1):55-63. doi:10.7326/M14-0697

| # | Item | Reported on page/section | Notes |
|---|---|---|---|
| **Title and abstract** | | | |
| 1 | Title — model development and/or validation, target population, outcome | Title page | "Development and Retrospective Single-Expert Validation of TOMEC" |
| 2 | Abstract — structured summary | Abstract (250 w) | Background/Methods/Results/Conclusion |
| **Introduction** | | | |
| 3a | Background and rationale, references to existing models | §1 Introduction | TCK m.87/88 + Queensland Guideline + Pearlman/Kuo gap |
| 3b | Objectives | §1.4 | Develop + retrospectively pilot-test TOMEC |
| **Methods** | | | |
| 4a | Source of data (cohort, registry, etc.) | §2.1 | Public Turkish court decisions corpus (Yargıtay/Danıştay/AYM/AİHM) |
| 4b | Dates of data | §2.1 | Retrieval window: 2000–2025 |
| 5a | Study setting + eligibility criteria | §2.2 | Decisions involving female plaintiffs/victims with pregnancy reference |
| 5b | Treatments received (if relevant) | N/A | Forensic-legal scoring, not clinical intervention |
| 6a | Outcome definition + assessment | §3.4 | TOMEC categorical output (7 levels: Definite → None) |
| 6b | Assessor blinding to predictors | §2.12 | Double-blind R1 vs R2 (LLM) |
| 7a | Predictors definition + measurement | §3.1–3.3 | Five domains T/O/M/E/C with operational definitions |
| 7b | Predictor blinding to outcome | §3.4 | Predictors scored prior to causality categorisation |
| 8 | Sample size | §2.5 + Suppl S2 | n = 3501 corpus → 313 relevant → 35 stratified for κ |
| 9 | Missing data handling | §2.6 | Excluded if domain non-extractable from text |
| 10a | Statistical methods — predictor handling | §4.1 | Weighted summation (T 25%, O 20%, M 15%, E 20%, C 20%) |
| 10b | Model-building procedures | §3.1–3.5 | Theory-driven (Queensland MN19.31 + literature); not data-derived |
| 10c | Risk groups | §3.5 | Seven thresholded categories (≥85, 70–84, 55–69, 40–54, 25–39, 10–24, 0–9) |
| 10d | Validation analysis | §5–§7 | Retrospective application + κ + confusion matrix |
| 11 | Risk groups specification | §3.5 | Cutoffs justified by clinical-forensic consensus (limitation: not data-derived) |
| **Results** | | | |
| 13a | Participant flow | Figure 1 (PRISMA flowchart) | 3501 → 313 → 35 |
| 13b | Participant characteristics | §5.1 | Court type, decision year, case category distribution |
| 14a | Number of participants and outcomes | §5.2 | n=313 obstetric, n=35 sub-sample (12 REL + 8 PARTIAL + 15 IRR) |
| 14b | Unadjusted predictor-outcome associations | §6 | Domain-wise descriptive statistics |
| 15a | Final model presentation | §3.5 | Weighted score formula |
| 15b | Model performance | §7 | Cohen κ, weighted κ, Krippendorff α, macro/weighted F1 |
| 16 | Model performance — calibration / discrimination | §7.5 | Per-class P/R/F1; Fisher exact for category boundaries |
| 17 | Comparison with alternatives | §1.2 | No existing comparator (gap analysis) |
| **Discussion** | | | |
| 18 | Interpretation | §8.1 | Substantial single-expert reliability, LLM-assisted exploratory |
| 19 | Limitations | §8.3 | Single-expert design, retrospective, n=35 sub-sample, judicial corpus heterogeneity |
| 20 | Implications for practice | §8.4 | Forensic expert testimony standardisation |
| 21 | Supplementary information | Suppl S1–S8 | Reproducibility scripts + data + protocols |
| 22 | Funding | Declarations | None |

**Adherence summary:** 22/22 items addressed. Item 11 (risk groups) reported as a known limitation (consensus-based, not data-derived); planned ROC-based recalibration in prospective cohort (§10.1).
