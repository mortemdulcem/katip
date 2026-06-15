#!/usr/bin/env python3
# One-shot prose sync: replace fabricated numbers in makale.txt prose with REAL values.
# Line-count is PRESERVED per range (build.cjs is line-number-locked). Asserts total stays 1885.
import io

P = "makale.txt"
src = io.open(P, "r", encoding="utf-8").read().split("\n")
N0 = len(src)

# ---- English abstract (lines 21-41, 21 lines) ----
methods = ("Methods: We analyzed six publicly available GEO DNA methylation cohorts (Illumina 450K; total N=742), "
  "each analyzed separately rather than pooled into a single mega-cohort: smoking (GSE50660, n=464), alcohol use in "
  "blood (GSE110043, n=94) and in postmortem brain (GSE49393, n=48), cocaine (GSE77056, n=47), methamphetamine "
  "(GSE154971, n=24), and opioid use in postmortem brain (GSE98203, n=65). The modular pipeline implements "
  "quality-controlled data ingestion, CpG feature extraction, epigenetic-clock age estimation (Horvath, Hannum, "
  "PhenoAge), EAA metrics, and leakage-free per-substance classification. Cannabis and polysubstance cohorts were "
  "unavailable; individual-level physiological-mediator and psychological-moderator data are absent from all public "
  "methylation datasets and were therefore not modeled.")
results = ("Results: On the largest cohort (GSE50660, n=464), leakage-free cross-validated clock age estimation gave "
  "Horvath MAE=3.51 years (R2=0.586), Hannum MAE=7.82 years (R2=0.641) and PhenoAge MAE=6.77 years (R2=0.565); "
  "GrimAge could not be computed from 450K beta values alone and no ensemble clock was built. Horvath epigenetic age "
  "acceleration (case minus control) was small and in the NEGATIVE direction - alcohol (brain) -0.82 years, cocaine "
  "-0.66 years, opioid (brain) -1.48 years - and therefore did not support accelerated aging in these cohorts; "
  "methamphetamine EAA could not be computed (chronological age unavailable). Differential methylation (FDR<0.05) "
  "yielded cohort-specific CpG counts: smoking 89, cocaine 11987, methamphetamine 398, opioid 12, alcohol (brain) 8. "
  "Leakage-free cross-validated classification reached ROC-AUC 1.000 (cocaine), 0.928 (smoking), 0.926 (alcohol) and "
  "0.922 (methamphetamine); a single multi-substance accuracy was not computed. Mediation (insulin resistance, HPA "
  "axis, inflammation) and moderation (emotion regulation, self-control) could not be tested because the required "
  "individual phenotype data are absent from public methylation datasets (data unavailable).")
concl = ("Conclusions: This open-source framework provides a reproducible tool for clock-based epigenetic assessment "
  "of chronic substance exposure. Across six separate GEO cohorts (total N=742, analyzed independently), the real "
  "data did not reproduce the large accelerated-aging effects previously claimed; all results, including null and "
  "negative findings, are reported faithfully to support transparent and reproducible medicolegal interpretation.")
abstract = [methods, results, concl] + [""] * 18

# ---- Turkish ozet cohort/methods block (lines 178-182, 5 lines) ----
ozet = ("Calismamizda alti bagimsiz GEO veri setinden toplam 742 DNA metilasyon profili derlenmis ve her kohort "
  "havuzlanmadan ayri ayri analiz edilmistir: sigara/yas referans kohortu (GSE50660, n=464), alkol kullanim "
  "bozuklugu kan ornekleri (GSE110043, n=94) ve postmortem beyin (GSE49393, n=48), kokain (GSE77056, n=47), "
  "metamfetamin (GSE154971, n=24) ve opioid postmortem beyin (GSE98203, n=65). Kannabis ve coklu madde icin kamuya "
  "acik veri seti bulunamamistir. Entegre tek bir mega-kohort olusturulmamistir. Tum DNA metilasyon verileri Illumina "
  "450K dizileri kullanilarak elde edilmistir.")
ozet_block = [ozet, "", "", "", ""]

# ---- 3.1 Bulgular body (lines 348-360, 13 lines) ----
body31 = ("Bu calismada alti bagimsiz GEO kohortu ayri ayri (havuzlanmadan) analiz edilmistir; toplam orneklem "
  "n=742'dir: sigara GSE50660 n=464, alkol-kan GSE110043 n=94, alkol-beyin GSE49393 n=48, kokain GSE77056 n=47, "
  "metamfetamin GSE154971 n=24, opioid-beyin GSE98203 n=65. Veriler Illumina 450K platformundan, GEO uzerinden "
  "normalize beta-degerleri olarak indirilmistir. Her kohort kendi kontrol grubuyla karsilastirilmis, entegre tek bir "
  "mega-kohort kurulmamistir. Birlesik kalite-kontrol hunisi, gruplar arasi birlesik demografik karsilastirma (yas, "
  "cinsiyet, egitim, BMI) ve etnik dagilim icin gerekli bireysel-duzey ortak veri bulunmadigindan bu karsilastirmalar "
  "yapilmamistir (veri yok / kaynak gerekli). Kohort-ozgu yas ve orneklem bilgileri Tablo 1'de sunulmustur.")
body31_block = [body31] + [""] * 12

# ---- 3.5 classification prose (lines 492-493, 2 lines) ----
cls = ("Siniflandirma performansi, her madde icin ayri ikili (madde-vs-kontrol) modellerle ve sizintisiz "
  "(leakage-free) capraz-dogrulama ile degerlendirilmistir; elde edilen ROC-AUC degerleri kokain 1.000, sigara 0.928, "
  "alkol 0.926 ve metamfetamin 0.922'dir. Tek bir cok-sinifli genel dogruluk degeri, maddeler arasinda ortak bir "
  "kohort bulunmadigindan hesaplanmamistir (veri yok / kaynak gerekli).")
cls_block = [cls, ""]

# ---- 3.5 feature-importance tail (lines 505-507, 3 lines) ----
feat = ("Metamfetamin siniflandiricisinin gorece dusuk performansi, kucuk orneklem boyutundan (n=24) "
  "kaynaklanmaktadir. Sigara icin en guclu ayirt edici CpG cg05575921 (AHRR) olmustur; diger maddeler icin "
  "gen-anotasyonlu ozellik-onem (feature importance) siralamasi bu calismada hesaplanmamistir (veri yok / kaynak gerekli).")
feat_block = [feat, "", ""]

# ---- 3.6 mediation prose (lines 511-512, 2 lines) ----
med = ("Fizyolojik mediyatorler (insulin direnci/HOMA-IR, HPA ekseni/kortizol, sistemik inflamasyon/CRP-IL6) "
  "bireysel duzeyde hicbir kamuya acik metilasyon veri setinde bulunmadigindan mediyasyon analizi yapilamamistir "
  "(veri yok / kaynak gerekli).")
med_block = [med, ""]

# apply line-range replacements in DESCENDING start order (keeps earlier indices valid)
repls = [
    (511, 512, med_block),
    (505, 507, feat_block),
    (492, 493, cls_block),
    (348, 360, body31_block),
    (178, 182, ozet_block),
    (21, 41, abstract),
]
for start, end, newlines in sorted(repls, key=lambda r: -r[0]):
    assert (end - start + 1) == len(newlines), "len mismatch %d-%d got %d" % (start, end, len(newlines))
    src[start - 1:end] = newlines

# single-line in-place replace (line 169) - count unchanged
old169 = "15 bagimsiz veri setinden derlenen 10,542 DNA metilasyon profili"
new169 = "alti bagimsiz GEO veri setinden derlenen toplam 742 DNA metilasyon profili (Illumina 450K; her kohort ayri analiz edilmistir)"
# line 169 may use real Turkish chars; handle both ascii-ish and real-char by trying the real one
import re
def repl_line(idx, patterns_new):
    s = src[idx]
    for old, new in patterns_new:
        if old in s:
            src[idx] = s.replace(old, new); return True
    return False

# real Turkish-char version of the 169 fragment
old169_tr = "15 ba\u011f\u0131ms\u0131z veri setinden derlenen 10,542 DNA metilasyon profili"
new169_tr = "alt\u0131 ba\u011f\u0131ms\u0131z GEO veri setinden derlenen toplam 742 DNA metilasyon profili (Illumina 450K; her kohort ayr\u0131 analiz edilmi\u015ftir)"
ok169 = repl_line(168, [(old169_tr, new169_tr), (old169, new169)])

N1 = len(src)
assert N1 == N0, "LINE COUNT CHANGED %d -> %d" % (N0, N1)
io.open(P, "w", encoding="utf-8").write("\n".join(src))
print("OK line169_replaced=%s total_lines=%d" % (ok169, N1))
