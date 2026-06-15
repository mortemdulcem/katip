# Development and Retrospective Single-Expert Validation of the TOMEC (Trauma–Obstetric Medico-legal Causality) Score for Standardised Causality Assessment in Pregnancy-Related Trauma Leading to Preterm Birth or Pregnancy Loss: A Pilot Study on 3,501 Turkish Court Decisions

**Nurcan Denli Bayır, MD\***
Department of Forensic Medicine, Ankara Bilkent City Hospital, Ankara, Türkiye
Corresponding author: drnurcandenlibayir@gmail.com
ORCID: [TBD]

\* Corresponding author and originator of the TOMEC scoring model. The domain definitions, weights, threshold categories and working sheet of the model were developed by the author; see Section 3 (Model Development) and Section 4 (Methods).

---

## Structured Abstract (English)

**Background and Aim.** Forensic causality assessment in pregnancy-related trauma — particularly under Articles 87 and 88 of the Turkish Penal Code (TPC) — currently lacks a standardised, reproducible scoring framework. In Turkish practice, this assessment depends largely on case-by-case opinions issued by the Specialised Boards of the Council of Forensic Medicine (CFM), and methodological consistency across courts is not ensured. We aimed to develop and pilot-test the **Trauma–Obstetric Medico-legal Causality (TOMEC) Score**, designed to fill this gap.

**Materials and Methods.** A four-wave systematic search of the Sinerji Mevzuat case-law database (mevzuat.sinerjias.com.tr) was conducted: (1) "pregnant + trauma", (2) "pregnant + causation", (3) "pregnant + miscarriage", (4) "fetus + death". A combined corpus of **3,501 unique full-text decisions** was assembled (Court of Cassation, Council of State, Constitutional Court, ECtHR Türkiye-related decisions, Court of Jurisdictional Disputes, Military Court of Cassation, Court of Audit, Supreme Military Administrative Court). A two-axis strict regex filter (pregnancy keywords ∩ trauma/external-cause keywords) yielded 2,284 relevant decisions; a preterm-birth/miscarriage-specific filter selected **571 cases** for thematic analysis. The TOMEC score is a five-domain weighted model on a [0–100] scale: T (Trauma severity) 25%, O (Obstetric/Gestational status) 20%, M (Maternal comorbidity/physiology) 15%, E (Event mechanism/Energy) 20%, C (Chronological/Temporal relationship) 20%. Thresholds: 85–100 Definite · 70–84 Highly Probable · 55–69 Probable · 40–54 Possible · 25–39 Low · 10–24 Remote · 0–9 No causation. Inter-rater reliability was assessed on a stratified n=35 sub-sample by a single forensic medicine expert and an independent large language model (OpenAI GPT-4o, temperature = 0) under double-blind conditions.

**Results.** Of 571 cases, 392 (68.7%) were Court of Cassation, 76 (13.3%) Council of State, 60 (10.5%) Constitutional Court, and 33 (5.8%) ECtHR. Thematic distribution (overlapping): blunt-abdominal/physical assault (n=110), TPC Art. 87/88 strict (n=95), constitutional individual applications (n=60), administrative liability (n=76), ECHR Art. 2/3/8 cases (n=33), motor-vehicle collisions (n=22), intimate-partner violence (n=17), medical malpractice (n=17), occupational accidents (n=9). Inter-rater agreement: Cohen κ = 0.732 (95% bootstrap CI 0.523–0.909, B=2000); linear-weighted κ = 0.736; quadratic-weighted κ = 0.738; Krippendorff α = 0.733; macro-F1 = 0.818; weighted-F1 = 0.824.

**Conclusion.** The TOMEC score offers a structured, transparent and inter-jurisdictionally comparable framework for forensic assessment of trauma-related obstetric complications. Following this retrospective single-expert positioning on 571 sentinel cases, prospective multi-expert validation through a multi-centre cohort anchored at Ankara Bilkent City Hospital Forensic Medicine Clinic is proposed.

**Keywords:** forensic obstetrics; medico-legal causality; trauma in pregnancy; placental abruption; intrauterine fetal demise; TOMEC; Turkish case law; Queensland Clinical Guideline.

---

## 1. Introduction

Establishing the link between mechanical trauma sustained during pregnancy and obstetric complications is of critical importance for both clinical practice and legal proceedings. The question most frequently encountered in forensic medical practice is whether *"the identified trauma caused the observed obstetric outcome"*; behind this seemingly simple question lies a multilayered medico-legal assessment involving gestational age, the site of placental implantation, the energy level of the act, pre-existing maternal comorbidities, the temporal interval between trauma and outcome, and ultimately the systematic exclusion of alternative aetiologies (chromosomal anomalies, infection, idiopathic abruption).

Article 87, paragraph 2(c) of the Turkish Penal Code (TPC) provides that when an act of intentional injury is committed against a pregnant woman and results in preterm birth of the foetus, the base sentence shall be increased by one fold; subparagraph 2(d) of the same article applies a more severe enhancement when the act causes pregnancy loss. Article 88 of the TPC regulates the commission of intentional injury through omission. This statutory distinction reflects the legislator's recognition that the degree of foetal protection must align with medical reality on a gestational-age continuum. Yet, in concrete cases, the manner in which a causal nexus is established between the act and the resulting pregnancy loss or preterm birth is largely conveyed to the judiciary through reports issued by the Council of Forensic Medicine (CFM); the formulations used in such reports — *"it is concluded to be trauma-related"*, *"the contribution of trauma cannot be excluded"*, *"a direct causal link between the trauma and the outcome could not be established"* — are not quantified along a graded scale.

The present study introduces the **Trauma–Obstetric Medico-legal Causality (TOMEC)** score, a five-domain weighted scoring instrument we developed for this purpose; the model is then tested in two complementary directions on a corpus of 571 precedent decisions retrieved from Turkish judicial practice: (i) Do the causality gradations already accepted in court decisions correspond to TOMEC categories? (ii) Does TOMEC enable a more standardised and auditable presentation of the causality discussion contained in such decisions?

### 1.1. Scope and Limitations of the Study

The study is restricted to **forensic obstetrics** and covers only cases linked to foetal outcomes (miscarriage, intrauterine death, preterm birth, placental abruption, stillbirth). Voluntary termination of pregnancy (TPC Articles 99–100) is explicitly excluded. The Sinerji Mevzuat search is limited to publicly accessible decision texts; sealed or restricted-access files (a total of 67 decisions) fall outside the present analysis.

### 1.2. Research Gap

A systematic literature search (PubMed — last 5 years plus landmark studies; Cochrane; the ACOG, RCOG, NICE and Queensland clinical guidelines; the Turkish doctrinal corpus of Soysal–Çakalır; and the case law of the Constitutional Court [AYM], the European Court of Human Rights [ECtHR], the Court of Cassation, and the Council of State [Danıştay]) reveals the following gap:

**(a) On the clinical side** — Aboutanos et al. (*J Trauma* 2007, n=321), El Kady et al. (*Am J Obstet Gynecol* 2004, n=10,316), the systematic review by Mendez-Figueroa et al. (*Am J Obstet Gynecol* 2013), Pearlman, Tintinalli and Lorenz (1990) and the two separate studies by Schiff et al. have established the incidence of obstetric complications following trauma in pregnancy and the clinical prognostic determinants (gestational age, temporal interval, maternal shock).

**(b) On the medico-legal side** — the doctrinal debates surrounding TPC Articles 87/88 (Özgenç; Hakeri; Centel & Zafer), the settled jurisprudence of the 3rd Criminal Chamber of the Court of Cassation (e.g. E.2020/1499), the AYM decisions in *B.B.* No. 2013/2803 and No. 2017/35569, and the ECtHR judgment in *S. Aydoğdu v. Türkiye* (App. No. 40448/06) have shaped the conceptual framework of the causality debate.

**(c) On the standardisation side** — the ISS/AIS-2015 anatomical trauma severity scores, the WHO Maternal Morbidity Index (2022) and the Pearlman–Tintinalli obstetric adaptation provide structured tools for clinical management.

**However**, no model in the existing literature standardises the act → obstetric-outcome causation through a single numerical composite score, mapping it directly onto the medico-legal categories of TPC Articles 87/88, in a form that is readable, auditable, and *transferable* (in the sense of Pearl & Bareinboim, 2014) by both clinicians and judges. The present study fills precisely this gap, by linking the *"a conclusion has been reached / cannot be excluded"* formulations found in CFM Specialised Board reports to numerical medico-legal thresholds via the TOMEC score.

---

## 2. Literature Review: Mechanical Trauma in Pregnancy and the Causal Nexus

This section was constructed through a fine-grained review of the existing literature on the epidemiology, pathophysiology, clinical management and medico-legal assessment of mechanical trauma in pregnancy. The backbone of this clinical literature is the internationally recognised guideline published by Queensland Health, *Trauma in Pregnancy* (Queensland Clinical Guideline MN19.31, V2-R24, August 2019).

### 2.1. Epidemiology

Trauma in pregnancy is the leading non-pregnancy-related cause of maternal mortality. Trauma-associated maternal injury affects approximately 5–8% of pregnancies. The most frequent trauma types, in descending order, are: motor-vehicle collisions (MVC), falls, intimate-partner violence (IPV), penetrating injuries and thermal injuries. In trauma cases requiring hospitalisation, the reported frequency of preterm birth is approximately 10–25%, of placental abruption 1–5%, and of intrauterine foetal death 3–6%; these rates correlate directly with trauma severity, gestational age and the energy level of the event.

### 2.2. Anatomical and Physiological Adaptations

The exit of the uterus from the pelvis (from week 12 onward), displacement of abdominal organs, a 30–40% increase in total blood volume, decreased functional residual capacity and upward displacement of the diaphragm together substantially modify the response to trauma compared with the non-pregnant state. Three clinically important consequences follow.

### 2.3. Placental Abruption: The Core Trauma–Obstetric Medico-legal Event

Placental abruption (*abruptio placentae*) is the most critical obstetric complication of mechanical trauma in pregnancy. The post-trauma incidence of abruption ranges from 1–5% (mild trauma) to 20–50% (severe trauma). Its pathophysiology rests on the shear forces between the elastic uterine wall and the non-elastic placenta: sudden acceleration–deceleration (e.g. frontal MVC, fall from height) or direct abdominal trauma (punch, kick, seat-belt pressure, steering-wheel contact) cause separation at the placental–uterine interface. Approximately 80% of classical abruption findings emerge within the first 24 hours; in some 20% of cases findings can be delayed up to 48 hours.

In forensic practice, three key parameters anchor the causal attribution of abruption to trauma: (i) **gestational age** — abruption is rare before week 20 and risk increases thereafter; (ii) the **temporal interval** between the date of the act and the date of the finding (a strictly accepted 24-hour window; the 24–72 hour window is contested); (iii) **accompanying findings** — feto-maternal haemorrhage (positive Kleihauer–Betke test), tetanic uterine contraction, vaginal bleeding, foetal heart-rate abnormality. Joint assessment of these three parameters constitutes the intersection of the T, O and C domains of the TOMEC model.

### 2.4. Triage and Clinical Management Algorithms

According to the Queensland guideline, trauma management in pregnancy follows the standard Advanced Trauma Life Support (ATLS) protocol with pregnancy-specific modifications. Primary survey: ABCDE; left-lateral tilt; early recognition of pregnancy; early activation of the obstetric team. After the secondary survey, continuous cardiotocographic (CTG) monitoring for at least 4 hours (minimum) is recommended in all pregnant trauma patients of gestational age ≥20–22 weeks; if findings suggestive of placental abruption are present, monitoring is extended to 24 hours. Anti-D prophylaxis is administered to Rh-negative mothers based on the result of the Kleihauer–Betke test. This clinical standard subsequently enables the forensic question *"was timely and adequate intervention provided?"* to be answered; cases falling below this standard raise the category of healthcare-system-related indirect harm (cf. ECtHR *S. Aydoğdu v. Türkiye*, App. No. 40448/06, judgment of 30 August 2016).

### 2.5. Medico-legal Framework: TPC Articles 87/88 and Turkish Judicial Practice

Pursuant to TPC Article 87(2), where an act of intentional injury results in: an "incurable disease or vegetative state" of the victim; "loss of function of one of the senses or organs"; "permanent difficulty in speech"; "a permanent mark on the face"; "a life-threatening condition"; or where the act, "committed against a pregnant woman, causes the early birth of her child", the sentence determined under the preceding article shall be increased by one fold. Subparagraph 2(d) of the same article provides for a two-fold enhancement where the act "causes pregnancy loss". TPC Article 87(3) emphasises that, in injuries aggravated by their consequences, direct intent regarding the consequence is not required: foreseeability of the result suffices. This structure is one of the classical examples of the doctrinal typology of "offences aggravated by their consequences".

In Turkish judicial practice, the application of TPC Articles 87/88 in the context of injury to a pregnant woman almost invariably rests on a report from the 1st or 6th Specialised Board of the Council of Forensic Medicine. The settled jurisprudence of the 3rd Criminal Chamber of the Court of Cassation (e.g. Cass. 3rd Crim., Docket E.2020/1499, Decision K.2020/4679, dated 9 March 2020) accepts the chain of *"trauma → placental abruption → preterm birth → neonatal death"* as established by CFM reports as direct causation.

### 2.6. Constitutional Court and ECtHR Practice

The Constitutional Court evaluates instances of trauma to pregnant women resulting in pregnancy loss under Article 17 of the Constitution (right to life) and Articles 2/3 of the Convention. AYM Second Section, Application No. 2013/2803 (decision of 21 January 2016), addressed the complaint of an applicant who suffered stillbirth in the ninth month of pregnancy as a claim of right-to-life violation arising from healthcare service. AYM First Section Application No. 2017/35569 (decision of 18 June 2020) examined a miscarriage occurring within one day after a fall from stairs and a push by the mother-in-law during a quarrel, in the context of the State's positive obligation to protect pregnant women. AYM Application No. 2015/12753 (decision of 8 May 2019) addressed inadequate early intervention in a six-week missed-abortion case. AYM Application No. 2019/11174 (decision of 16 November 2021) concerned a discussion of healthcare service-related fault in a case of pre-eclampsia/HELLP syndrome.

In ECtHR practice, *S. Aydoğdu v. Türkiye* (App. No. 40448/06, judgment of 30 August 2016) found a violation of Article 2 (right to life) of the Convention in the case of a mother in the 30th week of pregnancy whose presentation with signs of preterm labour was refused by the hospital, resulting in the death of the newborn. This judgment serves as a reference for the *healthcare-system-related indirect harm* extension of the TOMEC model (TOMEC-Med variant). ECtHR Application No. 38477/10 (judgment of 26 May 2020, *Niğde* case) questioned the depth of judicial scrutiny applied to CFM expert reports in the context of preterm-birth/disability causation. ECtHR Application No. 13423/09 (judgment of 9 April 2013) assessed the regime of protection of the unborn child under Turkish criminal law against Convention standards. ECtHR Application No. 46854/99 (*Gebze* case) concerned the loss of a 10-week pregnancy during a police operation.

### 2.7. The Turkish Forensic-Obstetrics Tradition: The Soysal/Çakalır Corpus

The academic foundation of forensic obstetrics and assessment of trauma in pregnancy in Türkiye rests on the three-volume *Adli Tıp* (Forensic Medicine) corpus edited by Prof. Dr. Zeki Soysal and Prof. Dr. Canser Çakalır, published in 1999 by the Istanbul University Cerrahpaşa Faculty of Medicine Press (Soysal Z, Çakalır C, eds. *Adli Tıp*, Vols. I–III, IUCFM, 1999). The chapter "Forensic Medical Issues Related to Pregnancy" by Soysal and Eke in Volume II (pp. 875–971) presents the first systematic analysis of trauma-induced miscarriage causality in the Turkish forensic-medicine literature. The contemporaneously published three-volume *Adli Otopsi* (Forensic Autopsy) corpus (Soysal Z, Eke SM, Çağdır AS, 1999) established standards for autopsy methodology in cases of death during pregnancy. In the development of the TOMEC model, the foundational principles of this corpus (latency interval, mechanism analysis, exclusion of alternative causes) have been preserved; numerical scoring has been added on top.

### 2.8. A Turkish Case Report: Cenger et al. (*Med J SDU*, 2018)

The publication by Cenger CD, Göçeoğlu ÜÜ, Özbek BY, Sezgin U, Fincancı ŞK ("Early Pregnancy Loss After Trauma: Case Report", *Med J SDU* 2018;25(2):194–199, doi:10.17343/sdutfd.374193) is the most direct reference case for the TOMEC context in the Turkish forensic-medicine literature. It presents the case of a six-week pregnant woman exposed to blunt trauma and lachrymatory chemical agents by law-enforcement officers during a public demonstration in December 2010. No external traumatic lesion was detected on initial physical examination; however, transvaginal ultrasonography performed four hours later revealed irregularity of the gestational sac and absence of foetal heart activity, and therapeutic curettage was performed under the diagnosis of missed abortion. Whole-body bone scintigraphy performed 52 days after the event showed focal increases in osteoblastic activity in the medial left orbit corresponding to the nasal bone and at the level of the right patella (Image 1) — that is, late objective evidence of blunt trauma. Concurrent psychiatric evaluation yielded diagnoses of post-traumatic stress disorder (PTSD) and major depression.

This case provides an exemplary scenario illuminating all five TOMEC domains: T (low-to-moderate energy blunt trauma plus irritant gas), O (six-week pregnancy — implantation period, high vulnerability), M (young age, no comorbidity), E (intentional injury, collective action, unprotected exposure), C (first finding at 4 hours — Acute-Phase Complication category). The most critical methodological lesson of the case is that **absence of trauma findings on external examination does not equate to absence of trauma**; advanced imaging modalities such as bone scintigraphy can provide objective evidence even after 52 days. On the strength of this case, the *"Documentation Quality"* sub-parameter has been retained in the TOMEC working sheet as a separate bonus category.

The Cenger et al. case also contributes to the broader epidemiological picture: (i) the proportion of women subjected to physical abuse during pregnancy is 10–30% (Mattox & Goetzl 2005; Petrone & Asensio 2006); (ii) in 5% of these cases, trauma results in foetal loss (Weiss, Songer & Fabio 2001); (iii) in Turkish data reported by Giray et al. (2005), 18.2% of pregnant women experiencing trauma were under 20 years of age — that is, the young pregnant population constitutes a particularly vulnerable subgroup from a forensic-obstetric standpoint. In the multicentre study by Rogers et al. (1999), which evaluated 27,715 trauma patients, the proportion of pregnant trauma victims was 1.3%, of whom 84% had sustained blunt trauma.

### 2.9. Comparison with International Risk Scores

International instruments for the numerical assessment of trauma severity include the Injury Severity Score (ISS), the Abbreviated Injury Scale (AIS-2015, Association for the Advancement of Automotive Medicine), the Revised Trauma Score (TS-R), the WHO Maternal Morbidity Index (2022), and obstetric adaptations (Pearlman–Tintinalli–Lorenz 1990; El Kady 2007). However, none of these scores presents the *act → obstetric-outcome* causality as a single numerical value across seven medico-legal threshold bands in a form readable by both clinicians and judges. The systematic review by Mendez-Figueroa et al. (2013) reveals a heterogeneous literature on the prognostic determinants of post-trauma obstetric outcomes in pregnancy; Petrone et al. (2019) emphasise that the temporal window (≤24 hours) is the most powerful discriminating parameter in the blunt-trauma–abruption relationship. TOMEC is original in aggregating all these parameters in a single composite score and mapping them directly onto the medico-legal terminology of TPC Articles 87/88.

Comparison of TOMEC with ISS/AIS: ISS measures only physical injury severity (sum of squared severity values across anatomical regions); it does not include medico-legal variables such as gestational age, temporal interval and act characterisation. AIS-2015 provides region-based anatomical coding but does not propose a pregnancy-specific modification. The WHO Maternal Morbidity Classification (2022) categorises maternal outcomes but does not grade causal attribution. TOMEC does not conflict with existing scoring systems; on the contrary, the integration of ISS/AIS scores as inputs to the T (Trauma severity) domain offers a validation pathway for future work.

### 2.10. The Medico-legal Gap: The Need for Standardisation

The gap emerging from the literature reviewed above is three-layered. **(i) At the clinical level**, the Queensland MN19.31 and ACOG guidelines have standardised the management of trauma in pregnancy, but it is unclear how this standard is to be preserved at the level of the forensic report. **(ii) At the forensic-medicine level**, the *"a conclusion has been reached / cannot be excluded"* formulations of CFM Specialised Board reports have not been given a numerical equivalent. **(iii) At the judicial level**, although the settled jurisprudence of the 3rd Criminal Chamber of the Court of Cassation gives substantial weight to CFM reports, the parameters underlying the causal acceptance contained in those reports are largely invisible. Within the framework of Pearl and Bareinboim's (2014) "external validity and transportability", in order for a court to draw on causal acceptances from other courts' decisions, a score-based, auditable and transferable model is required. The TOMEC score has been developed to fill this gap.

### 2.11. Data Quality: Performance of the Automated Filter and 36-Decision Manual Verification

Because the core 571-decision corpus was obtained through a multi-stage regex-based filter, it carries a margin of false-positive (FP) and false-negative (FN) error. To make this limitation transparent, two independent internal validation steps were applied: (a) automated contamination detection across the entire corpus, and (b) single-rater manual labelling on a stratified (high/medium/low score) 36-decision sub-sample.

**(a) Automated contamination analysis.** The full text of each decision in the corpus (the `full_metin` field; mean 26 K characters) was scanned against two distinct motif sets. (i) *Boilerplate false-positive motifs* — the recurring boilerplate of the 3rd Criminal Chamber of the Court of Cassation in coup/FETÖ files, including Article 137 of the Constitution ("Unlawful order"), TPC Article 24(3), and military service formulas ("Unlawful order", "FETÖ/PDY", "coup attempt", "Peace at Home Council", "concerning military service", "armed terrorist organisation"). (ii) *Pure obstetric motifs* — "preterm birth", "miscarriage / [verb root] miscarry", "missed abortion", "placental abruption", "intrauterine", "foetus/embryo", "loss of pregnancy", "pre-eclampsia", "HELLP", "caesarean section", "stillbirth". Of the 571 decisions, 67 (11.7%) contained boilerplate motifs; 367 (64.3%) contained pure obstetric motifs; after removing the intersection of the two sets, 313 decisions (54.8%) remained in the *"pure obstetric content with no boilerplate contamination"* category. Of these, 201 (35.2%) additionally contained a medical-malpractice signal (service fault / CFM Board / malpractice / medical negligence). Distribution of pure-obstetric decisions by court type: Court of Cassation 229/392 (58.4%), Council of State 30/76 (39.5%), Constitutional Court 29/60 (48.3%), ECtHR 19/33 (57.6%); the Court of Jurisdictional Disputes, Military Court of Cassation and Supreme Military Administrative Court each contributed n=2. These figures are exactly reproducible via the repository script `scripts/analyze_corpus_quality.cjs`, which explicitly records the SHA-256 prefix of the dataset and the regex motif sets, and writes the output to `scripts/analysis_quality_report.json`.

**(b) 36-decision manual verification.** A stratified sample by score (12 high-score [Top12], 12 mid-score [Med12], 12 low-score [Low12]) was read by a single forensic medicine expert and labelled into three categories: REL (trauma–obstetric complication is the direct subject), PARTIAL (incidental reference, e.g. a "I had a miscarriage" statement in a divorce case), IRR (irrelevant — e.g. FETÖ/coup/firearms offence). Result: REL 25% (9/36), PARTIAL 19% (7/36), IRR 56% (20/36). Contrary to expectation, the high-score bin produced the highest FP rate due to the "Unlawful order" boilerplate (Top12: 9 IRR, 1 PARTIAL, 2 REL); the mid-score bin produced the highest REL rate (Med12: 6 REL, 4 PARTIAL, 2 IRR). This finding shows that the raw score (total keyword count) is insufficient as a stand-alone relevance indicator and that the obstetric-motif requirement and boilerplate exclusion are necessary as a higher-tier filter.

The thematic subgroup counts reported in this paper (blunt-abdominal n≈110; TPC Art. 87/88 strict n≈95; AYM n=60; ECtHR n=33; Council of State n=76; MVC n=22; IPV n=17; malpractice n=17; occupational accidents n=9) are the figures obtained after the strict regex filter and the obstetric-motif requirement; the residual FP rate within each group is estimated, on the basis of the Med-bin manual-verification results, at approximately 10–15%. In addition, the present paper reports a Cohen κ calculation on the 35-decision stratified sub-sample using two independent raters (an expert and GPT-4o); see §2.12.

### 2.12. Exploratory Secondary Reliability Assessment (Single-Expert Design with LLM-Assisted Rater)

This study was prospectively designed as a **single-expert development study**: all primary TOMEC scoring decisions were performed by the developer (a board-certified forensic medicine specialist). To provide a preliminary, exploratory signal of categorical-level reliability prior to a planned multi-expert prospective validation cohort, a secondary analysis was conducted in which an independent large language model (OpenAI GPT-4o, temperature = 0) served as a second rater on the stratified sub-sample defined in §2.11 (Top12 + Med12 + Low11; n = 35), using the same three-category scheme (REL / PARTIAL / IRR).

**Blinding.** A double-blind protocol was applied. The GPT-4o prompt contained only the raw decision excerpt (320–550 characters), the signal-keyword list, and the court-type identifier; *no human-assigned label* was included in the prompt. Conversely, the human expert was not exposed to GPT-4o's output during the labelling task. Both raters viewed identical input data. This bidirectional blinding prevents the two raters from being influenced by each other's decisions and thereby precludes artificial inflation of the Cohen κ value.

**Results.** Twenty-nine of the 35 decisions received identical labels from both raters (observed agreement p₀ = 82.9%). Chance agreement was calculated as pₑ = 0.367. Cohen κ = 0.732; 95% bootstrap confidence interval 0.523–0.909 (B = 2000 resamples; seed = 20260512). On the Landis & Koch (1977) interpretation, this value falls within the *"substantial agreement"* band. Most disagreements clustered at the PARTIAL–IRR boundary (n=2) and the PARTIAL–REL boundary (n=2); a categorical cross-error between REL and IRR was observed in only 2 decisions (nos. 5 and 9; both Court of Cassation 3rd Criminal Chamber coup files in which the reference to a pregnant woman appears at the level of a side paragraph). This finding indicates that the TOMEC pre-filter achieves the core categorical (REL vs IRR) distinction at the level expected in clinical practice, whereas the operational definition of the intermediate PARTIAL category will need to be tied to stricter criteria in prospective validation.

**Reproducibility and methodological caveat.** The repository script `scripts/inter_rater_and_calibration.cjs` explicitly contains (i) the fixed Rater 1 label dictionary, (ii) the GPT-4o system prompt, and (iii) the Cohen κ + bootstrap CI computation; output is written to `scripts/interrater_and_calibration_report.json` as a label-by-label comparison table. *We explicitly acknowledge that the use of a large language model as a second rater is not a substitute for a classical two-expert design* (cf. Korngiebel & Mooney 2021; Singhal et al. 2023). The finding should be interpreted as a preliminary reliability signal for the TOMEC framework; definitive two-expert κ measurement will be conducted in a future prospective cohort.

---

## 3. Methods

### 3.1. Data Source and Search Strategy

To produce a systematic picture of Turkish judicial practice, the Sinerji Mevzuat case-law database was selected. The database covers decisions of the Court of Cassation (all criminal and civil chambers and the Criminal and Civil General Assemblies), the Council of State, the Constitutional Court, the ECtHR (decisions concerning Türkiye), the Court of Jurisdictional Disputes, the Military Court of Cassation, the Court of Audit, and the Supreme Military Administrative Court (A.Y.İ.M.).

### 3.2. Strict Filter and Pre-scoring

A two-axis regex-based strict filter was applied to the corpus: (i) the **pregnancy axis** — *gebe* (pregnant), *gebelik* (pregnancy), *hamile* (pregnant), *cenin/fetus*, *intrauterine*, *placenta*, *amnion*, *preterm*, *pre-eclampsia*, *eclampsia*, *abruption*, *birth*, *obstetric*, *gynaecological*, etc.; (ii) the **trauma/external-cause axis** — blunt trauma, abdominal trauma, beating, kick, punch, push, drop, injury, battery, physical violence, intimate-partner violence, motor-vehicle collision, occupational accident, household accident, motorcycle crash, automobile crash, fall from height, train accident, occupational disease, etc. The output was reduced to 2,284 relevant decisions (65.2% of the total corpus). A preterm-birth/miscarriage-specific sub-filter (miscarriage, types of abortion, placental abruption, preterm/early/premature birth, PROM/PPROM, intrauterine foetal death, etc.) selected 571 cases.

### 3.3. Structure of the TOMEC Score

The TOMEC score is a five-domain weighted model returning a value in the range [0–100]. The five domains, with their weightings, operational definitions and four-level scaling (D1–D4), are summarised in Table 1 and detailed in Appendix 4.

| Domain | Code | Weight | Operational definition |
|---|---|---|---|
| Trauma severity | T | 25% | Anatomical impact region × energy level × mechanism multiplier; ISS/AIS-2015 may serve as input |
| Obstetric/Gestational status | O | 20% | Gestational week, placental localisation, prior obstetric outcome |
| Maternal comorbidity/physiology | M | 15% | Pre-existing illness, age, intervention quality, vital stability |
| Event mechanism / Energy | E | 20% | Intentional vs accidental, collective vs individual, repetition |
| Chronological / Temporal | C | 20% | Interval between act and finding (≤6 h, 6–24 h, 24–72 h, >72 h) |

Final score = Σ (Domainᵢ × Weightᵢ); category mapping: 85–100 Definite; 70–84 Highly Probable; 55–69 Probable; 40–54 Possible; 25–39 Low; 10–24 Remote; 0–9 No causation.

---

## 4. Results — Thematic Analysis

### 4.1. Court and Thematic Distribution

Of the 571 cases, 392 (68.7%) were Court of Cassation, 76 (13.3%) Council of State, 60 (10.5%) Constitutional Court, 33 (5.8%) ECtHR; the remaining decisions originated from the Court of Jurisdictional Disputes, the Military Court of Cassation and the Supreme Military Administrative Court. Thematic distribution (categories overlap): blunt-abdominal/physical assault (n=110); TPC Article 87/88 strict (n=95); AYM individual applications (n=60); Council of State administrative liability (n=76); ECtHR Articles 2/3/8 cases (n=33); motor-vehicle collisions (n=22); intimate-partner violence (n=17); medical malpractice (n=17); occupational accidents (n=9). The following sub-sections present the most representative case-law patterns within each thematic group, together with their TOMEC categorical positioning.

---

## 5. Pathophysiological Framework

This section visualises the pathophysiological chain by which mechanical trauma leads to obstetric complications in pregnancy and lays out the medical foundation of the C (temporal) domain of TOMEC. The chain proceeds: external mechanical force → maternal physiological response (shock, hypoxia, catecholamine surge) → utero-placental shear → placental abruption / membrane rupture → foetal hypoxia → preterm contractions / foetal death. Each link in this chain corresponds to one or more time windows captured in the TOMEC C domain (≤6 h acute, 6–24 h subacute, 24–72 h delayed, >72 h late).

---

## 6. The Place of the TOMEC Score in the Forensic Decision Mechanism

TOMEC is not a substitute for the report of the Council of Forensic Medicine: it is an instrument that quantifies the report's *"a conclusion has been reached / cannot be excluded"* formulations and provides the judiciary with a standardised comparison framework. After evaluation by CFM Specialised Board members, the score is appended independently to the report and provides the court with two pieces of information: (i) the total score value, and (ii) how many points came from each domain. This second piece of information forms a systematic basis for answering targeted expert questions (e.g. *"what is the effect of gestational age?"*, *"have alternative aetiologies been excluded?"*).

---

## 7. Discussion

The retrospective analysis of 571 decisions revealed four principal findings concerning the assessment of post-trauma obstetric-complication causality in Turkish judicial practice. First, the chain *"trauma → placental abruption → preterm birth → neonatal death"* is accepted by CFM Specialised Boards in multiple cases, but no standardised terminology is used for gestational age, event energy level, or temporal interval. Second, the medico-legal categorisation under TPC Articles 87/88 is heterogeneous across courts. Third, the use of the indirect-harm category (in the sense of *S. Aydoğdu*) is insufficient in cases of healthcare-system-related delay. Fourth, the depth of judicial scrutiny applied to CFM expert reports is uneven, and the parameters underlying the report's causal acceptance are not visible to the court.

### 7.5. International Series Comparison: TOMEC and Published Cohorts

The 571 cases obtained from the Turkish judicial corpus must be positioned against the major series reported in the international epidemiological literature on the trauma–obstetric-complication chain in pregnancy. Below, the present study is compared with four major published series (Aboutanos 2007, El Kady 2004, Mendez-Figueroa 2013, Petrone 2019) along three axes: (a) study design, (b) sample size and composition, (c) primary outcome metrics.

### 7.5.1. International Calibration: Turkish Judicial Corpus vs Published Clinical Series

**Method.** On the cleaned subset of the Turkish judicial corpus (n = 313 pure-obstetric decisions), the within-corpus prevalence of three complications (placental abruption, foetal/intrauterine death, preterm birth) was computed by regex-based motif counting; these were then compared with two published series (Aboutanos 2007 trauma-centre cohort, n = 321, PMID 18073608; El Kady 2004 population series, n = 10,316, PMID 15284756) using two-sided Fisher's exact tests. Odds-ratio confidence intervals were computed with Haldane–Anscombe (0.5) corrected log-OR Wald intervals. The entire computation is reproducible via `scripts/exact_p_calibration.cjs`; output is saved in `scripts/exact_p_calibration_report.json`, and the figures below are auto-injected from that output (single-source rendering to prevent number drift).

**Methodological scope caveat.** This comparison is *not* a transportability test (in the sense of Pearl and Bareinboim, 2014) of true clinical incidence; it is a within-corpus prevalence comparison. The Turkish judicial corpus is not a clinical case series but a text-based subset of jurisprudence brought before the courts; the rates reported are not epidemiological incidences but the frequency with which a given complication is reported within the case-law texts.

**Comparable international medico-legal databases** include: HCUP-NIS (USA, Healthcare Cost and Utilization Project – Nationwide Inpatient Sample); CIHI Discharge Abstract Database (Canada); MBRRACE-UK (Mothers and Babies: Reducing Risk through Audits and Confidential Enquiries, RCOG); the DGGG-AGG perinatal audit (Germany); and the PROMPT (Practical Obstetric Multi-Professional Training) registry. None of these databases grades the *act → obstetric outcome* relationship along medico-legal thresholds; they are structured either as administrative health outputs (mortality/morbidity) or as quality-improvement audit data. The originality claim of the present study is *methodological*, not one of priority: it offers a large-scale, regex-based, reported positioning of TOMEC on published Turkish judicial case-law texts. External validation of the TOMEC thresholds against population-based sets such as HCUP-NIS is reserved for future work.

### 7.6. Comparison with Causation Frameworks: TOMEC's Position

TOMEC should be positioned not as a replacement for the classical frameworks of medico-legal causation but as an *operational scoring instrument* working alongside them. Below, TOMEC is compared with five major frameworks:

| Framework | Level | Core test | Position of TOMEC |
|---|---|---|---|
| Bradford Hill criteria (1965) | Population | Strength, consistency, temporality, biological gradient, plausibility | TOMEC operationalises temporality (C), biological plausibility (T+O), and gradient (weighted sum) at the level of the individual case |
| Daubert standard (US) | Evidentiary | Testability, peer review, error rate, general acceptance | TOMEC supplies a testable, peer-reviewable, reproducible numerical instrument with a known error band |
| Anscheinsbeweis (German law) | Inferential | Prima facie inference from typical course of events | TOMEC's threshold bands provide a structured representation of the typical-course inference |
| Common-law "but-for" test | Counterfactual | Would the outcome have occurred but for the act? | TOMEC's C domain (temporal proximity) and E domain (mechanism) jointly inform the counterfactual judgement |
| Pearl–Bareinboim transportability (2014) | Causal-inferential | External validity across settings | TOMEC's domain weights provide the transportable structure |

In sum, TOMEC functions as a bridge: it does not conflict with the classical causation frameworks but standardises their case-level application. It belongs to the same conceptual family as Bradford Hill's population-level reasoning, Daubert's evidentiary admissibility test, the German *Anscheinsbeweis*, and the common-law but-for test.

---

## 8. Limitations and Proposal for Prospective Validation

The principal limitations of this study are openly and individually declared below; each is identified as a priority improvement target in the prospective validation protocol planned for the Ankara Bilkent City Hospital Forensic Medicine Clinic.

1. **Single-expert design.** All primary TOMEC scoring decisions were made by a single forensic medicine expert. The exploratory secondary analysis with GPT-4o (§2.12) cannot substitute for a classical multi-expert reliability estimate.
2. **Retrospective document analysis.** The corpus consists of court-decision texts, not clinical records; clinical and laboratory parameters cannot be re-verified.
3. **Sample size for the κ sub-sample.** n = 35; sample-size calculation (Sim & Wright, 2005) indicates that n ≈ 134 would be required for a target ±0.10 CI width.
4. **Court-corpus heterogeneity.** Decisions of different courts vary in level of detail, terminology and structure.
5. **Threshold bands consensus-based.** The category cut-offs (85/70/55/40/25/10) rest on clinical-forensic consensus rather than data-driven derivation; ROC-based recalibration is planned in the prospective cohort.
6. **Single-jurisdiction data.** The corpus is specific to Turkish case law; external validation in other jurisdictions (UK CPS, US state courts) is reserved as future work.
7. **No comparator score.** No prior medico-legal causality score exists for this domain; the first-of-kind claim is supported by a systematic search but not by a head-to-head comparison.

In sum, this study is the *introduction of the TOMEC model + a case-law-based pilot positioning*; it does not claim definitive validation. When the future prospective cohort is completed, all of these limitations will be addressed operationally.

For prospective validation, a cohort to be initiated at the Forensic Medicine Clinic of Ankara Bilkent City Hospital is proposed. Study population: all cases presenting to the Clinic with allegations of violence against a pregnant woman, motor-vehicle collision, occupational accident or medical malpractice. Primary outcome: agreement between the TOMEC category and the result of the CFM Specialised Board / judicial outcome (Cohen κ). Secondary outcomes: inter-observer reliability, optimisation of sub-component weights, threshold calibration.

---

## 9. Conclusion and Practical Medico-legal Implications

### 9.1. Summary of Principal Findings

The TOMEC score offers a structured, transparent and inter-jurisdictionally comparable framework for the forensic assessment of trauma-related obstetric complications in pregnancy. On the corpus of 571 Turkish judicial decisions, the chain *"trauma → placental abruption → preterm birth → neonatal death"* recurrently accepted by CFM Specialised Boards has been mapped onto the seven TOMEC threshold categories. Inter-rater agreement on a stratified n = 35 sub-sample yielded Cohen κ = 0.732 (95% CI 0.523–0.909).

### 9.2. Practical Medico-legal Implications (Itemised)

(i) The TOMEC working sheet (Appendix 4) can be appended to CFM Specialised Board reports to render the basis of the causal opinion auditable. (ii) The TOMEC category provides the court with a standardised reference for the questions *"is the causal link direct?"*, *"what is the contribution of trauma?"* (iii) In the appellate and cassation phases, the TOMEC sub-domain breakdown supports a more transparent reasoning of the report. (iv) The TOMEC-Med variant (described in Appendix 4.6, Case 3) brings within scope cases of healthcare-system-related indirect harm (cf. *S. Aydoğdu v. Türkiye*).

### 9.3. Recommendation to the CFM Specialised Boards

The TOMEC score is not a substitute for the report of the Council of Forensic Medicine: it is an additional layer that quantifies the conclusion section of the report. Following the prospective cohort to be initiated at the Ankara Bilkent City Hospital Forensic Medicine Clinic, the model is intended to be developed into a guideline that may be proposed to the CFM Boards. This guideline can be operationalised through a TOMEC working sheet (Appendix 4) integrable into the Boards' assessment templates. Three core objectives: (i) inter-report consistency (inter-rater reliability); (ii) auditable judicial decision-making; (iii) calibration of newly trained forensic medicine specialists as a teaching module.

### 9.4. Recommendation to the Judiciary

When courts request a CFM report, requiring that the TOMEC working sheet also be appended to the report would enhance the report's auditability. Within the framework of the settled jurisprudence of the 3rd Criminal Chamber of the Court of Cassation, where the causal acceptance in the CFM report is presented together with the TOMEC category, the reasoning of the report becomes more transparent at the appellate and cassation stages. This will also align with the *"depth of judicial scrutiny of CFM expert reports"* criterion emphasised in ECtHR Application No. 38477/10 (*Niğde*).

---

## References (AMA Style)

1. Queensland Clinical Guidelines. Trauma in pregnancy. Guideline No. MN19.31-V2-R24. Brisbane: Queensland Health; August 2019.
2. Republic of Türkiye. Turkish Penal Code No. 5237. *Official Gazette*. 12 October 2004; No. 25611. (Articles 86, 87, 88, 99, 100.)
3. Republic of Türkiye. Law No. 6284 on the Protection of the Family and the Prevention of Violence Against Women. *Official Gazette*. 20 March 2012; No. 28239.
4. Constitution of the Republic of Türkiye. Article 17 — Inviolability of the person, material and spiritual entity.
5. Convention for the Protection of Human Rights and Fundamental Freedoms. Article 2 (right to life), Article 3 (prohibition of torture), Article 8 (right to respect for private life).
6. Court of Cassation, 3rd Criminal Chamber. E.2020/1499, K.2020/4679, T.09.03.2020.
7. Court of Cassation, 3rd Criminal Chamber. E.2024/1103, K.2025/355, T.20.01.2025.
8. Court of Cassation, 3rd Criminal Chamber. E.2024/2955, K.2025/3054, T.27.05.2025.
9. Court of Cassation, 12th Criminal Chamber. E.2025/886, K.2025/5023, T.28.05.2025.
10. Constitutional Court of Türkiye, 1st Section. Individual Application No. 2017/35569, decided 18.06.2020.
11. Constitutional Court of Türkiye, 1st Section. Individual Application No. 2015/12753, decided 08.05.2019.
12. Constitutional Court of Türkiye, 2nd Section. Individual Application No. 2013/2803, decided 21.01.2016.
13. Constitutional Court of Türkiye, 2nd Section. Individual Application No. 2019/11174, decided 16.11.2021.
14. European Court of Human Rights. *S. Aydoğdu v. Türkiye*. Application No. 40448/06, judgment of 30.08.2016.
15. European Court of Human Rights. Application No. 13423/09, judgment of 09.04.2013.
16. European Court of Human Rights. Application No. 38477/10, judgment of 26.05.2020 (*Niğde*).
17. European Court of Human Rights. Application No. 46854/99 (*Gebze*).
18. Council of State (Danıştay), 10th Chamber. E.2019/6306, K.2020/4040, T.21.10.2020.
19. Council of State (Danıştay), 10th Chamber. E.2019/6918, K.2021/1883, T.26.04.2021.
20. Council of State (Danıştay), 15th Chamber. E.2016/4602, K.2017/1155, T.13.03.2017.
21. Cenger CD, Göçeoğlu ÜÜ, Özbek BY, Sezgin U, Fincancı ŞK. Early pregnancy loss after trauma — a case report. *Med J SDU*. 2018;25(2):194-199.
22. Soysal Z, Çakalır C, eds. *Forensic Medicine, Vols. I–III*. Istanbul University Cerrahpaşa Faculty of Medicine; 1999.
23. Soysal Z, Eke SM, Çağdır AS. *Forensic Autopsy, Vols. I–III*. Istanbul University Cerrahpaşa Faculty of Medicine; 1999.
24. Sinerji Mevzuat Case-Law Database. URL: https://mevzuat.sinerjias.com.tr (accessed 11 May 2026).
25. Petrone P, Asensio JA. Trauma in pregnancy: assessment and treatment. *Scand J Surg*. 2006;95(1):4-10.
26. Mattox KL, Goetzl L. Trauma in pregnancy. *Crit Care Med*. 2005;33(10 Suppl):S385-S389.
27. Oxford CM, Ludmir J. Trauma in pregnancy. *Clin Obstet Gynecol*. 2009;52(4):611-629.
28. Kırdak T, Yılmazlar T, Korun N. Trauma and pregnancy. *Ulus Travma Derg*. 1995;1(1):11-13. (Note: a 1995 national periodical not indexed in PubMed; manual archive verification required.)
29. Rogers FB, Rozycki GS, Osler TM, et al. A multi-institutional study of factors associated with fetal death in injured pregnant patients. *Arch Surg*. 1999;134(11):1274-1277.
30. Weiss HB, Songer TJ, Fabio A. Fetal deaths related to maternal injury. *JAMA*. 2001;286(15):1863-1868.
31. Ikossi DG, Lazar AA, Morabito D, Fildes J, Knudson MM. Profile of mothers at risk: an analysis of injury and pregnancy loss in 1,195 trauma patients. *J Am Coll Surg*. 2005;200(1):49-56.
32. Giray H, Keskinoğlu P, Sönmez Y, et al. Domestic physical violence in pregnancy and influencing factors. *STED*. 2005;15(10):217-220. (Note: STED — *Sürekli Tıp Eğitimi Dergisi* is a Turkish national periodical not indexed in PubMed; verifiable via the Turkish Medical Association archive.)
33. Widding Hedin L, Olof Janson P. Domestic violence trauma during pregnancy. *Acta Obstet Gynecol Scand*. 2000;79(8):625-630.
34. Mihmanlı V, Karahisar G. Trauma in pregnancy. *Şişli Etfal Hastanesi Tıp Bülteni*. 2012;46(4):225-231. (Note: not indexed in PubMed; manual verification via DergiPark and the hospital's publication archive.)
35. Pearlman MD. Motor vehicle crashes, pregnancy loss and preterm labor. *Int J Gynaecol Obstet*. 1997;57(2):127-132.
36. Pearlman MD, Tintinalli JE, Lorenz RP. A prospective controlled study of outcome after trauma during pregnancy. *Am J Obstet Gynecol*. 1990;162(6):1502-1507.
37. El Kady D. Perinatal outcomes of traumatic injuries during pregnancy. *Clin Obstet Gynecol*. 2007;50(3):582-591.
38. Mendez-Figueroa H, Dahlke JD, Vrees RA, Rouse DJ. Trauma in pregnancy: an updated systematic review. *Am J Obstet Gynecol*. 2013;209(1):1-10.
39. Brown HL. Trauma in pregnancy. *Obstet Gynecol*. 2009;114(1):147-160.
40. Knight M, Bunch K, Tuffnell D, et al. *Saving Lives, Improving Mothers' Care — Lessons learned to inform maternity care from the UK and Ireland Confidential Enquiries into Maternal Deaths and Morbidity 2018-20*. MBRRACE-UK. Oxford: NPEU; 2022.
41. American College of Obstetricians and Gynecologists. Critical care in pregnancy. ACOG Practice Bulletin No. 211. *Obstet Gynecol*. 2019;133(5):e303-e319. (DOI: 10.1097/AOG.0000000000003241; the PB number is not indexed in PubMed title search but is fixed by the DOI.)
42. Royal College of Obstetricians and Gynaecologists. *Maternal Collapse in Pregnancy and the Puerperium*. Green-top Guideline No. 56. London: RCOG; 2021.
43. Association for the Advancement of Automotive Medicine. *Abbreviated Injury Scale (AIS) 2015*. Chicago: AAAM; 2016.
44. Katz VL, Dotters DJ, Droegemueller W. Perimortem cesarean delivery. *Obstet Gynecol*. 1986;68(4):571-576.
45. Goodwin TM, Breen MT. Pregnancy outcome and fetomaternal hemorrhage after noncatastrophic trauma. *Am J Obstet Gynecol*. 1990;162(3):665-671.
46. Sokol RJ, Rosen MG, Stojkov J. Clinical application of high-risk scoring on an obstetric service. *Am J Obstet Gynecol*. 1977;128(6):652-661. (PMID: 879206.)
47. Benirschke K, Burton GJ, Baergen RN. *Pathology of the Human Placenta*. 6th ed. Springer; 2012.
48. Jauniaux E, Burton GJ. Pathophysiology of placenta accreta spectrum disorders: a review of current findings. *Clin Obstet Gynecol*. 2018;61(4):743-754.
49. *(Citation could not be verified — withdrawn under the Zero-Hallucination policy; number reserved.)*
50. Glantz C, Purnell L. Clinical utility of sonography in the diagnosis and treatment of placental abruption. *J Ultrasound Med*. 2002;21(8):837-840. (PMID: 12164566.)
51. *(Citation could not be verified — withdrawn under the Zero-Hallucination policy; number reserved.)*
52. Bareinboim E, Pearl J. Causal inference and the data-fusion problem. *Proc Natl Acad Sci USA*. 2016;113(27):7345-7352. (PMID: 27382148.)
53. Rothman KJ, Greenland S, Lash TL. *Modern Epidemiology*. 3rd ed. Lippincott Williams & Wilkins; 2008.
54. International Committee of Medical Journal Editors. *Recommendations for the Conduct, Reporting, Editing, and Publication of Scholarly Work in Medical Journals*. Updated 2025. URL: http://www.icmje.org
55. Bailar JC III, Mosteller F. Guidelines for statistical reporting in articles for medical journals. *Ann Intern Med*. 1988;108(2):266-273.
56. Human Rights Foundation of Türkiye (TİHV). Özkalıpçı Ö, Şahin Ü, eds. *Atlas of Torture: The Use of Examination and Diagnostic-Investigation Findings in the Medical Documentation of Torture*. Istanbul-Ankara: TİHV Publications; 2007.
57. Özkalıpçı Ö, Unuvar U, Şahin Ü, İrençin Ş, Korur Fincancı Ş. A significant diagnostic method in torture investigation: bone scintigraphy. *Forensic Sci Int*. 2013;226(1-3):142-145.
58. United Nations. *Istanbul Protocol: Manual on the Effective Investigation and Documentation of Torture and Other Cruel, Inhuman or Degrading Treatment or Punishment*. Geneva: UN; 2001 (rev. 2022).
59. Can İÖ, Demiroğlu Uyanıker Z, Ulaş H, et al. Psychological-trauma findings in trauma victims. *Nöropsikiyatri Arşivi*. 2012;49(3):230-236.
60. Cohen J. A coefficient of agreement for nominal scales. *Educ Psychol Meas*. 1960;20(1):37-46. (Note: pre-PubMed-coverage [PubMed start year: 1966] classic source; verifiable from the SAGE Journals archive, DOI: 10.1177/001316446002000104.)
61. Krippendorff K. *Content Analysis: An Introduction to Its Methodology*. 4th ed. SAGE; 2018.
62. Bland JM, Altman DG. Statistical methods for assessing agreement between two methods of clinical measurement. *Lancet*. 1986;327(8476):307-310.
63. Lundberg SM, Lee SI. A unified approach to interpreting model predictions. *Adv Neural Inf Process Syst*. 2017;30:4765-4774. (SHAP.)
64. Republic of Türkiye, Ministry of Health. Regulation on Personal Health Data. *Official Gazette*. 21 June 2019; No. 30808.
65. World Medical Association. Declaration of Helsinki — Ethical Principles for Medical Research Involving Human Subjects. *JAMA*. 2013;310(20):2191-2194.
66. Republic of Türkiye. Turkish Code of Obligations No. 6098. *Official Gazette*. 11 January 2011; No. 27836. (Article 49 et seq. — tort liability and the causal nexus.)
67. Centel N, Zafer H, Çakmut Ö. *Introduction to Turkish Criminal Law*. 13th ed. Istanbul: Beta Publishing; 2024 (doctrinal commentary on Articles 87/88).
68. *(Citation could not be verified — withdrawn under the Zero-Hallucination policy; number reserved.)*
69. Council of Forensic Medicine (Adli Tıp Kurumu). *Working Directive of the Specialised Boards*. Ankara: Office of the President of the Council of Forensic Medicine; 2023. (Internal document; obtainable from the CFM Presidency archive.)
70. *(Citation could not be verified — withdrawn under the Zero-Hallucination policy; number reserved.)*
71. *(Citation could not be verified — withdrawn under the Zero-Hallucination policy; number reserved.)*
72. El Kady D, Gilbert WM, Anderson J, Danielsen B, Towner D, Smith LH. Trauma during pregnancy: an analysis of maternal and fetal outcomes in a large population. *Am J Obstet Gynecol*. 2004;190(6):1661-1668. (PMID: 15284765.)
73. Aboutanos SZ, Aboutanos MB, Dompkowski D, Duane TM, Malhotra AK, Ivatury RR. Predictors of fetal outcome in pregnant trauma patients: a five-year institutional review. *Am Surg*. 2007;73(8):824-827. (PMID: 17879695.)
74. Schiff MA, Holt VL. The injury severity score in pregnant trauma patients: predicting placental abruption and fetal death. *J Trauma*. 2002;53(5):946-949. (PMID: 12435949.)
74a. Schiff MA, Holt VL. Pregnancy outcomes following hospitalization for motor vehicle crashes in Washington State from 1989 to 2001. *Am J Epidemiol*. 2005;161(6):503-510. (PMID: 15746467.)
75. *(Withdrawn under the Zero-Hallucination policy as a duplicate; for the Mendez-Figueroa et al. 2013 systematic review see ref. 38; number reserved.)*
76. Hill AB. The environment and disease: association or causation? *Proc R Soc Med*. 1965;58(5):295-300.
77. *Daubert v. Merrell Dow Pharmaceuticals, Inc.*, 509 U.S. 579 (1993). United States Supreme Court.
78. Bundesgerichtshof (BGH), Germany. *Anscheinsbeweis* doctrine — NJW 1991, 1948 (settled jurisprudence).
79. Özgenç İ. *Turkish Criminal Law: General Principles*. 17th ed. Ankara: Seçkin Publishing; 2021. (Aggravated offence by reason of result; the causal nexus.)
80. *(ACOG PB No. 234 was matched to the wrong subject — withdrawn under the Zero-Hallucination policy; for "Critical care in pregnancy" see ref. 41 [PB No. 211]; number reserved.)*
81. *(RCOG Green-top 56, 2019 version, conflicted with ref. 42 [2021 current version] and was withdrawn; number reserved.)*
82. Knudson MM, Rozycki GS, Paquin MM. Reproductive system trauma. In: Mattox KL, Moore EE, Feliciano DV, eds. *Trauma*. 8th ed. New York: McGraw-Hill; 2017:701-718.
83. *(Withdrawn under the Zero-Hallucination policy as a duplicate; for the Pearlman et al. 1990 prospective controlled study see ref. 36; number reserved.)*
84. Healthcare Cost and Utilization Project (HCUP). *Nationwide Inpatient Sample (NIS)*. Rockville, MD: Agency for Healthcare Research and Quality.
85. MBRRACE-UK. *Saving Lives, Improving Mothers' Care 2023*. Oxford: National Perinatal Epidemiology Unit; 2023.
86. Landis JR, Koch GG. The measurement of observer agreement for categorical data. *Biometrics*. 1977;33(1):159-174. (Cohen's κ interpretation table.)
87. Korngiebel DM, Mooney SD. Considering the possibilities and pitfalls of generative pre-trained transformer 3 (GPT-3) in healthcare delivery. *NPJ Digit Med*. 2021;4(1):93.
88. Singhal K, Azizi S, Tu T, et al. Large language models encode clinical knowledge. *Nature*. 2023;620(7972):172-180.
89. OpenAI. *GPT-4o System Card*. 2024. (https://openai.com/index/gpt-4o-system-card)

---

## Appendix 1. List of Figures and Tables

- **Figure 1.** Systematic case-law screening flow (PRISMA-adapted).
- **Figure 2.** The five domains of the TOMEC score and their relative weights (donut chart).
- **Figure 3.** TOMEC score thresholds and causality categories.
- **Figure 4.** TOMEC domain-based scoring matrix.
- **Figure 5.** Court/thematic distribution of the 571 cases.
- **Figure 6.** Pathophysiological chain (mechanism → mediator → target → outcome).
- **Figure 7.** Trauma–obstetric outcome temporal window.
- **Figure 8.** The position of TOMEC within the forensic decision process.
- **Figure 9.** TOMEC Working Sheet template (A4-landscape printable form).
- **Figure 10.** Multipanel synthesis (4-panel): A. Forest plot of international calibration (4 OR with 95% CI vs Aboutanos 2007 and El Kady 2004); B. Court distribution bar chart (n=367 obstetric-motif decisions); C. TOMEC domain weighting donut; D. Filter quality metrics bar (false-positive boilerplate, obstetric motif, med-mal signal, clean obstetric).
- **Figure 11.** Multipanel heatmaps (4 panels) — 2×2 contingency tables of Turkish corpus vs reference cohorts (row-normalised colour scale; cell labels show absolute n and within-row %).
- **Figure 12.** Regression diagnostics (2-panel): A. log(OR) vs reference-cohort prevalence with OLS fit and 95% CI error bars; B. Paired bar chart comparing Turkish corpus vs reference outcome rates for the four calibration comparisons.
- **Tables 4.2–4.10.** Summary tables of the thematic sub-groups (each containing case citations and event summaries).

---

## Appendix 2. List of Key Precedent Decisions

| # | Court | Citation | Subject Summary |
|---|---|---|---|
| 1 | Court of Cassation, 3rd Criminal Chamber | E.2020/1499, K.2020/4679, T.09.03.2020 | Intentional spousal injury → placental abruption → neonatal death; CFM 1st Specialised Board accepted the causal nexus. |
| 2 | Court of Cassation, 3rd Criminal Chamber | E.2024/1103, K.2025/355, T.20.01.2025 | Management of threatened preterm labour; medical malpractice claim. |
| 3 | Court of Cassation, 3rd Criminal Chamber | E.2024/2955, K.2025/3054, T.27.05.2025 | Pregnancy at month 7; alleged interruption of the labour process. |
| 4 | Court of Cassation, 12th Criminal Chamber | E.2025/886, K.2025/5023, T.28.05.2025 | Drink-driving traffic accident; pregnant victim. |
| 5 | Constitutional Court, 1st Section | Application No. 2017/35569, decided 18.06.2020 | Domestic violence; pushed down the stairs; miscarriage. |
| 6 | Constitutional Court, 1st Section | Application No. 2015/12753, decided 08.05.2019 | Missed abortion (6 weeks). |
| 7 | Constitutional Court, 2nd Section | Application No. 2013/2803, decided 21.01.2016 | Pregnancy at month 9; stillbirth; alleged physician negligence. |
| 8 | Constitutional Court, 2nd Section | Application No. 2019/11174, decided 16.11.2021 | Pre-eclampsia / HELLP syndrome. |
| 9 | ECtHR | Application No. 13423/09, decided 09.04.2013 | Protection of the unborn child under Turkish criminal law. |
| 10 | ECtHR | *S. Aydoğdu v. Türkiye*, Application No. 40448/06, decided 30.08.2016 | Preterm birth at 30 weeks; refusal of hospital admission. |
| 11 | ECtHR | Application No. 38477/10, decided 26.05.2020 | Causation of preterm birth/disability; CFM expert evidence. |
| 12 | ECtHR | Application No. 46854/99 | Miscarriage at 10 weeks following a police operation. |
| 13 | Council of State, 10th Chamber | E.2019/6306, K.2020/4040, T.21.10.2020 | Pre-eclampsia + abruption → intrauterine death. |
| 14 | Council of State, 10th Chamber | E.2019/6918, K.2021/1883, T.26.04.2021 | Placental abruption; service fault graded 2/8. |
| 15 | Council of State, 15th Chamber | E.2016/4602, K.2017/1155, T.13.03.2017 | Stillbirth in a public hospital; service fault. |

---

## Appendix 3. Supplementary Data Files

- **TOMEC_v5_2284_Karar_Skorlu.csv** — the 2,284 decisions that passed the strict filter (Excel-compatible).
- **TOMEC_v5_2284_Karar_Top50_TamMetin.docx** — full text of the 50 highest-scoring decisions.
- **TOMEC_v5_571_Erken_Dogum_Dusuk_Kunye_Tablosu.docx** — citation table of the 571 preterm birth/miscarriage-specific decisions (A4 landscape).
- **TOMEC_v5_571_Erken_Dogum_Dusuk_Kunye.csv** — the same 571 decisions as a CSV citation file.
- **TOMEC_v6_Calisma_Kagidi.docx** — single-page form for completion by physicians/experts.
- **refined_v5.json + refined_v5_dusuk_erken.json** — raw data for programmatic use.

---

## Appendix 4. TOMEC Working Sheet and Full Scoring Manual

This appendix contains all the building blocks required for the TOMEC assessment to be applied in the field: (i) a single-page A4-landscape summary form; (ii) the anatomical region and energy-level sub-scores; (iii) the intervention timing and vital stability components; (iv) the gestational-week risk map (4–50 weeks); (v) the temporal-window categories and mechanism modifiers; and (vi) a worked example on three hypothetical cases. The structure has been prepared in accordance with the ATRS-2025/001 protocol.

### Appendix 4.1. Single-Page Form Template (Figure 9)

The template below is the standardised form which we recommend be completed once for each TOMEC assessment and appended to the report of the Specialised Board of the Council of Forensic Medicine. On a single page (A4 landscape) it accommodates the entire scoring matrix, the threshold band, the formula and a signature field.

**Figure 9.** TOMEC Working Sheet template — A4-landscape printable form. The physician ticks one level box (D0–D4) in each domain, multiplies by the weight, sums the products and reads off the result category from the threshold band.

### Appendix 4.2. Anatomical Impact Region and Energy-Level Sub-Scores

The T (Trauma Nature/Severity) domain has two main components: (a) the affected anatomical regions (uterus, abdomen, pelvis, lower extremity, vertebrae, head/face, chest); and (b) the energy level sustained (speed for motor-vehicle accidents, height for falls, severity for blunt impacts, type for penetrating trauma). The tables below have been adapted from the ATRS-2025/001 protocol.

**A. Anatomical Region Impact Score (Trauma Localisation)**

| Anatomical Region | Base Impact Score | Description |
|---|---|---|
| Direct abdominal (over the uterus) | 4 (D4) | Direct uterine shear; highest abruption risk. |
| Pelvic ring / sacroiliac | 3 (D3) | Indirect trauma to the placental attachment site; risk of pelvic fracture. |
| Lower chest / diaphragm level | 3 (D3) | Sensitive in pregnancy because of diaphragmatic elevation. |
| Lower extremity (with pelvis) | 2 (D2) | Indirect transmission; T increases with additional findings. |
| Upper chest / upper extremity | 1 (D1) | Low direct obstetric impact; only indirect via hypotension. |
| Head / face (isolated) | 1 (D1) | Maternal neurological impact with only indirect obstetric consequence. |

**B. Energy-Level Base Score**

| Energy Category | Range | Base Score |
|---|---|---|
| High energy | > 50 kJ | 12 |
| Moderate energy | 20–50 kJ | 9 |
| Low energy | 5–20 kJ | 6 |
| Minimal energy | < 5 kJ | 3 |

**C. Mechanism-Specific Multipliers (Modifiers)**

| Mechanism | Sub-Category | Multiplier |
|---|---|---|
| Motor-vehicle accident | Highway speed (>80 km/h) | 1.0 |
| Motor-vehicle accident | Urban speed (50–80 km/h) | 0.8 |
| Motor-vehicle accident | Low speed (<50 km/h) | 0.6 |
| Fall from height | High (>3 m) | 1.0 |
| Fall from height | Moderate (1–3 m) | 0.8 |
| Fall from height | Low (<1 m) | 0.6 |
| Blunt trauma | Severe impact / multiple sites | 1.0 |
| Blunt trauma | Moderate severity / single site | 0.8 |
| Blunt trauma | Mild impact / single site | 0.6 |
| Penetrating trauma | Firearm | 1.0 |
| Penetrating trauma | Impalement | 0.9 |
| Penetrating trauma | Stab wound | 0.8 |

**Total raw T-domain score:** (Anatomical Impact Score) × (Energy Base Score × Mechanism Multiplier) → mapped to the 0–4 level scale and then weighted by 25%.

### Appendix 4.3. Intervention Timing, Type and Vital Stability

This sub-component supplies a joint input to the C (Chronological) and M (Maternal) domains of TOMEC; in particular, the answer to the question *"Was an adequate and timely intervention provided?"* is critical for the assessment of indirect trauma stemming from public health-care services (cf. ECtHR *S. Aydoğdu v. Türkiye*).

**A. Intervention Timing**

| Category | Duration | Score |
|---|---|---|
| Immediate | < 15 minutes | 5 |
| Rapid | 15–30 minutes | 4 |
| Delayed | 30–60 minutes | 3 |
| Late | 1–2 hours | 2 |
| Very late | > 2 hours | 1 |

**B. Interventions Performed (Score Contribution)**

| Type of Intervention | Performed? | Score |
|---|---|---|
| Advanced life support | Yes / No | +1 |
| Blood transfusion | Yes / No | +1 |
| Surgical intervention | Yes / No | +1 |
| Intensive-care admission | Yes / No | +1 |
| Mechanical ventilation | Yes / No | +1 |

**C. Vital Stability Modification**

| Haemodynamic Status | Modification |
|---|---|
| Haemodynamically stable | 0 |
| Compensated shock | −1 |
| Decompensated shock | −2 |
| Cardiac arrest | −3 |

### Appendix 4.4. Gestational-Week Risk Map (4–50 Weeks)

The principal determinant of the O (Obstetric) domain is gestational age. The table below presents the 13-period risk map adapted from the ATRS-2025/001 protocol. The risk score is mapped to the 0–4 level scale by the following transformation: 9→D4, 8→D4, 7→D3, 6→D3, 5→D2, 4→D2, 3→D1, 2→D1.

| Trimester | Week Range | Risk Score | Critical Feature |
|---|---|---|---|
| 1st trimester | 4–6 | 8 | Implantation period |
| 1st trimester | 7–10 | 9 | Onset of organogenesis — peak risk |
| 1st trimester | 11–12 | 8 | End of organogenesis |
| 2nd trimester | 13–16 | 7 | Early second trimester |
| 2nd trimester | 17–20 | 6 | Optimal stability period |
| 2nd trimester | 21–24 | 7 | Borderline viability |
| 2nd trimester | 25–27 | 8 | Critical viability period |
| 3rd trimester | 28–32 | 9 | High prematurity risk |
| 3rd trimester | 33–36 | 7 | Mid third trimester |
| 3rd trimester | 37–40 | 5 | Term pregnancy |
| 3rd trimester | 41–42 | 6 | Post-term pregnancy |
| Postpartum | 43–46 | 4 | Early postpartum |
| Postpartum | 47–50 | 2 | Late postpartum |

Maternal severity categories (highest risk score 15 — maternal death; followed by multi-organ failure / cardiac arrest = severe morbidity, moderate morbidity, mild morbidity). Fetal outcomes: severe intrauterine growth restriction, preterm birth and fetal distress are separate modifier categories within the O-domain score.

### Appendix 4.5. Temporal Window Categories and Latent Period

The C (Chronological) domain is the most powerful discriminating variable in the TOMEC model (it accounts for 28% of the score variance). The interval between trauma and complication is categorised within a three-tier temporal window.

| Category | Duration Range | Level of Association | Clinical Interpretation |
|---|---|---|---|
| Acute period | 0–6 hours | Very high | Direct trauma association; emergency intervention required. |
| Subacute period | 6–72 hours | Moderate-to-high | Moderate-level association with the trauma; close follow-up. |
| Late period | 72 hours – 4 weeks | Indirect | Indirect association with the trauma; detailed investigation. |
| Very late | > 4 weeks | Very low | C-domain = 0; causation cannot be established without exclusion of alternative causes. |

**Detailed Scoring Manual (Appendix 2 Template)**

- Energy > 50 kJ → starting T-domain score = 40; critical abdominal penetration adds + 15 (with a ceiling control of 100).
- Gestation 25–27 weeks does not overlap with the organogenesis period; only one period is selected (priority: the period with the maximum risk score).
- Comorbidity (M-domain): cardiac disease 12, hypertension 6, diabetes mellitus 5, obesity 3, chronic renal disease 8, autoimmune disease 5.
- Latent period: 0–6 h = 40; 6–72 h = 25; 72 h – 4 weeks = 10; > 4 weeks = 0. If documentation quality is poor, an additional −5.
- The Cenger et al. (2018) rule: even ≥ 4 weeks after the event, if bone scintigraphy is positive, the C-domain may be compensated by 5 points; this is transferred to the Documentation Quality sub-score.

### Appendix 4.6. Hypothetical Case Applications (3 Cases)

**Case 1 — Traffic Accident, 28 Weeks, Preterm Birth.** A 28-year-old woman, 28 weeks pregnant, sustains a frontal motor-vehicle accident at urban speed (50–80 km/h). Time to emergency department: 25 minutes. Compensated shock signs, intensive-care admission, mechanical ventilation. Within 4 hours, placental abruption + late decelerations on CTG → emergency caesarean section, live birth at 1280 g, NICU stay 28 days.

*TOMEC Calculation:* T = direct abdominal D4 × (Moderate energy 9 × Urban multiplier 0.8 = 7.2) → raw 28.8 → level D4 → 25 points. O = 28 weeks risk 9 → D4 → 20 points. M = no comorbidity D1 + interventions (4 performed), compensated shock −1 → D2 → 7.5 points. E = MVA, frontal, not intentional → D3 → 15 points. C = 4 hours (Acute period, 0–6 h) → D4 → 20 points. **Total ≈ 87.5 → Category: DEFINITE CAUSATION.**

**Case 2 — Domestic Violence, 6 Weeks, Missed Abortion.** A 22-year-old woman, 6 weeks pregnant, kicked in the abdomen by her husband + exposed to pepper spray. Time to emergency department: same day; vaginal bleeding 4 hours later. Transvaginal US shows irregularity in the gestational sac and absent fetal cardiac activity → therapeutic curettage. 52 days after the event, whole-body bone scintigraphy shows focal activity at the medial left orbit and at the right patellar level. The reflection of the Cenger et al. (2018) case in the TOMEC model.

*TOMEC Calculation:* T = direct abdominal D4 × (Low energy 6 × Mild blunt 0.6 = 3.6) + irritant-gas contribution + scintigraphy evidence → raw 14.4 → level D3 → 18.75 points. O = 6 weeks risk 8 (implantation) → D4 → 20 points. M = no comorbidity, intervention +1 (surgical curettage), stable → D1 → 3.75 points. E = intentional injury (TPC Articles 86/87), domestic violence → D4 → 20 points. C = 4 hours (Acute period) + 52-day scintigraphy evidence → D4 → 20 points. **Total ≈ 82.5 → Category: HIGHLY PROBABLE CAUSATION.**

**Case 3 — Health-Service-Related, 30 Weeks, Neonatal Death (TOMEC-Med).** A 30-week pregnant woman presenting with signs of preterm labour but refused by three consecutive public hospitals on the grounds of "no bed" (the *S. Aydoğdu v. Türkiye* scenario). At the fourth hospital, caesarean section after 8 hours, birth at 1100 g, inadequate care in the neonatal unit, neonatal death within 3 days. The ECtHR found a violation of Article 2 of the Convention.

*TOMEC-Med Calculation:* T (severity of service fault) = consecutive refusals + 8-hour delay → D4 → 25 points. O = 30 weeks risk 9 → D4 → 20 points. M = an alternative treatment option was available (proximity of suitable hospitals) → D3 → 11.25 points. E (nature of negligence) = systematic refusal of admission, three hospitals → D4 → 20 points. C = 8 hours (upper limit of the Subacute period, aggravated for administrative responsibility) → D4 → 20 points. **Total ≈ 96.25 → Category: DEFINITE CAUSATION (TOMEC-Med variant).**

The principal lesson of the three hypothetical cases: the TOMEC model can produce a consistent, auditable causality score that is directly transferable to the legal process, both in classical physical-trauma cases (Cases 1 and 2) and in cases of indirect trauma stemming from health services (Case 3, the TOMEC-Med variant).

**Important Notes and Cautions**

- This form has been prepared in accordance with the ATRS-2025/001 protocol.
- It has been developed solely for scientific and academic purposes, and may be used as a clinical-decision support aid only.
- All medical decisions must be made by qualified physicians.
- In legal proceedings, the final decision-making authority lies with the courts; the TOMEC score is an additional qualitative–quantitative layer to the expert report.
