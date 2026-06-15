# Madde DNA-Metilasyonu — Birleşik Gerçek-Veri DMP Durum Raporu

**İlke:** Zero-Hallucination (`replit.md`). Hiçbir sayı uydurulmadı; her sonuç ya halka açık
gerçek ham veriden (NCBI GEO) **kendi yeniden-üretilebilir, committed betiklerimizle** hesaplandı,
ya da yeniden hesaplanamayan yerlerde **yayının kendi sayısı** olarak açıkça etiketlendi. Negatif
(null) bulgular pozitiflerle aynı titizlikle raporlanır.

**Bu rapor neyi düzeltir:** Bu dosyanın önceki sürümü yalnızca tek bir parti analizi (GSE293262,
GSE235818, GSE164822, GSE147040 + hayvan setleri) içeriyor ve "Alkol verisi karıştırıcı, dışlandı"
ile "tek pozitif bulgu opioid OFC" diyordu. Bu, kanonik `../REPORT.md` ile **çelişiyordu**: orada
alkol (kan + 2 beyin bölgesi), kokain-kan, metamfetamin-kan ve opioid-beyin zaten gerçek pozitif/
null sonuçlarla analiz edilmişti. Bu sürüm **tüm partileri tek tutarlı tabloda birleştirir** ve her
madde için durumu net ayırır: **analiz edildi · NULL · kuyrukta/ertelendi · gerçekten veri yok.**

> Yöntem/yolak/saat/ML ayrıntıları kohort-bazında `../REPORT.md` dosyasındadır; burada **madde-DMP
> manzarasının tamamı** özetlenir. İki dosyadaki sayılar birbiriyle tutarlıdır.

---

## 1. Ana durum tablosu (tüm partiler, tüm örnek tipleri)

Örnek tipleri ayrı ayrı işlendi: **canlı/kan**, **kadavra/postmortem beyin** ve **hayvan** (referans).
"DMP" = FDR(BH)<0.05'te anlamlı CpG/pozisyon sayısı.

| Madde | Veri seti | Organizma | Doku | Platform / ölçü | Tasarım (n) | Test edilen | FDR<0.05 | min q | Sonuç |
|---|---|---|---|---|---|---|---|---|---|
| Metamfetamin | GSE293262 | İnsan | Tam kan | EPIC, beta | 4 vs 4 | 484.864 prob | **0** | 0,163 | NULL |
| Opioid (OUD) | GSE235818 | İnsan | OFC, NeuN+ nöron | Bisülfit-dizi, % metilasyon | 12 vs 26 | 383.235 pozisyon | **0** (Welch-%: 1) | 0,0076 (Welch-%) | ⚪ NULL — dispersiyon-duyarlı yeniden testte doğrulanmadı (§2.4); GSE98203'te replike olmadı (§2.5) |
| Opioid (kronik/OUD) | GSE164822 | İnsan | dlPFC, postmortem | EPIC, M-değeri | 72 vs 28 | 864.883 prob | **0** | 0,581 | NULL (kovaryat-ayarlı) |
| Sigara / nikotin | GSE147040 | İnsan | Nucleus accumbens | EPIC, yoğunluk→beta | 53 vs 168 | 850.934 prob | **0** | 1,000 | NULL (kovaryat-ayarlı) |
| MDMA | GSE68199 | Fare | Kalp (sol ventrikül) | MeDIP, promotör peak | 3 kontrast | 12–17 bin gen | **0** | 0,067 | NULL |
| Kokain | GSE66348 | Sıçan | Nucleus accumbens | Array | 2 kontrast | 419.679 prob | **0** | 0,096 | NULL |

### 1A. İnsan — KAN (canlı)

| Madde | Veri seti | Platform/ölçü | Tasarım (vaka/kontrol) | Test edilen | DMP (FDR<0.05) | Durum | Kaynak |
|---|---|---|---|---|---|---|---|
| Sigara (referans) | GSE50660 | 450K, beta | 22 / 179 | 485.512 | **89** | ✅ Analiz edildi — AHRR cg05575921 #1 (yer-gerçeği) | REPORT.md §4.1 |
| Alkol | GSE110043 | 450K, beta | 47 / 47 | ~485 bin | **4.387** | ✅ Analiz edildi — **sigara-karışımlı** (yalnız cinsiyet ayarlandı) | REPORT.md §4.2 |
| Kokain/crack | GSE77056 | 450K, beta | 23 / 24 | 485.577 | **11.987** | ✅ Analiz edildi (yaş+cinsiyet) | REPORT.md §4.3 |
| Metamfetamin | GSE154971 | 450K, beta | 16 / 8 | ~485 bin | **398** | ✅ Analiz edildi (cinsiyet; yaş GEO'da yok) | REPORT.md §4.4 |
| Metamfetamin | GSE293262 | EPIC, beta | 4 / 4 | 484.864 | **0** (min q=0,163) | ⚪ NULL — n=8, güç çok düşük | human/meth |
| Enjeksiyon (IDU) | GSE100264 | 450K, beta | 214 / 168 | 482.415 | **1** (q=0,0094) | ✅ Analiz edildi — **IDU≡HCV mükemmel karışım** (aşağıda) | batch-2 (bu tur) |
| Esrar | GSE255929 | EPIC, beta | 93 (karışık) | — | (kendi analizi **atıldı**) | ⚠️ Confounded → yayın sayıları kaynak | REPORT.md §4.6 |
| Opioid (kan, meta-analiz) | PMC9979153 | 450K/EPIC meta | 282 / 10.560 | — | **6** (yayının sayısı) | 📚 Yayın kaynaklı (ham veri tek set değil → yeniden hesaplanamaz) | REPORT.md §4.5 |
| Ketamin (sub-anestezik oral, PTSD) | GSE287261 | EPIC, beta | **denek-içi** 20 çift (PBMC: baseline vs son post-tedavi) | 894.516 | **16** | ✅ Analiz edildi — denek-içi paired t-testi (BH-FDR); dalga-2 | human/ketamine |
| Reçeteli opioid (kısa süreli) | GSE151485 | EPIC, beta | **denek-içi** 32 çift (baseline vs son vizit) | 734.293 | **0** (min q=0,359) | ✅ Analiz edildi — denek-içi paired t-testi; **dürüst null** (n=32 güç düşük); veri VAR | human/opioid |

### 1B. İnsan — POSTMORTEM BEYİN (kadavra)

| Madde | Veri seti | Doku | Platform/ölçü | Tasarım (vaka/kontrol) | Test edilen | DMP (FDR<0.05) | Durum |
|---|---|---|---|---|---|---|---|
| Alkol (AUD) | GSE49393 | Prefrontal korteks | 450K, beta | 23 / 25 | 430.407 | **8** | ✅ Analiz edildi — sigaradan temiz (REPORT.md §4.2b) |
| Alkol (AUD) | GSE252501 | **Nucleus accumbens** | EPIC, beta | 56 / 59 | 769.154 | **1.107** | ✅ Analiz edildi — sigaradan temiz (batch-2) |
| Alkol (AUD) | GSE252501 | **DLPFC** | EPIC, beta | 58 / 59 | 767.719 | **0** | ⚪ NULL — **bölgeye-özgü** (NAc+ / DLPFC−) (batch-2) |
| Opioid/eroin | GSE98203 | OFC nöron çekirdekleri | 450K, beta | 37 / 28 | 456.513 | **12** | ✅ Analiz edildi — sigaradan temiz (REPORT.md §4.5) |
| Opioid (OUD) | GSE235818 | OFC, NeuN+ nöron | Bisülfit, %metilasyon | 12 / 26 | 383.235 | **0** (Welch-%: 1 @ q=0,0076) | ⚪ NULL — coverage-ağırlıklı testte **doğrulanmadı** (§2.4); **bağımsız GSE98203'te (§2.5) ve GSE164822'de (§2.5b) de replike olmadı** |
| Opioid (OUD) | GSE164822 | dlPFC (**BULK doku**) | EPIC, M-değeri | 72 / 28 | 864.883 | **0** (min q=0,106) | ⚪ NULL (kıl payı; kovaryat ayarlanmadı). cg20100151 yakın-prob sinyali yalnız bu BULK kohorta özgü → hücre-tipi karıştırıcısı (§2.5c) (human/opioid) |
| Kokain | GSE137364 | **Kaudat** | Bisülfit-dizi 5x, %metilasyon | 28 / 29 | 1.099 (complete-case) | **0** (min q=0,739) | ⚪ NULL — 5x kapsamda complete-case çok seyrek (batch-2) |
| Sigara/nikotin | GSE147040 | Nucleus accumbens | EPIC, yoğunluk→beta | 53 / 168 | 866.090 | **0** (min q=0,931) | ⚪ NULL — **doku-spesifik** (sigara imzası kana/akciğere özgü) (human) |

### 1C. Hayvan (referans, insan-dışı)

| Madde | Veri seti | Organizma/doku | Ölçü | DMP (FDR<0.05) | Durum |
|---|---|---|---|---|---|
| MDMA | GSE68199 | Fare, kalp (sol ventrikül) | MeDIP promotör | **0** (min q=0,067) | ⚪ NULL (insan değil) |
| Kokain | GSE66348 | Sıçan, nucleus accumbens | Array | **0** (min q=0,096) | ⚪ NULL (insan değil) |

**Özet sayım (insan):** 8 gerçek pozitif kohort (sigara-kan 89; alkol-kan 4.387; alkol-PFC 8;
alkol-NAc 1.107; kokain-kan 11.987; meth-kan 398; IDU-kan 1; opioid-beyin GSE98203 12)
 + 6 dürüst NULL (meth-EPIC, alkol-DLPFC, opioid-OFC GSE235818, opioid-dlPFC, kokain-kaudat, sigara-NAc)
 + yayın-kaynaklı opioid-kan (6) ve esrar. **GSE235818 (opioid-OFC) ilk taramada Welch-% testinde
pozitifti (chr3:32781045, q=0,0076) ama coverage-ağırlıklı, aşırı-dağılım-duyarlı yeniden testte
doğrulanmadı (§2.4); ayrıca İKİ bağımsız OUD kohortunda da replike olmadı — OFC-nöron eroin
(GSE98203, §2.5, en yakın prop cg18028347 p=0,905) ve dlPFC-EPIC (GSE164822, §2.5b, en yakın prop
cg18028347 p=0,118 + ters yön) → NULL'a alındı.** **"Veri yok" yalnızca §4'teki gerçekten
erişilemeyen maddeler için.**

---

## 2. Bu turda eklenen üç yeni kohort (GitHub Actions run 27479529130)

Üçü de büyük işlenmiş matris olduğundan Replit'in 120 sn açma duvarını aşmak için GitHub Actions
matrisinde çalıştırıldı (`.github/workflows/dmp2.yml`); validation JSON'ları repoya commit'lendi.

### 2.1 Alkol — beyin, GSE252501 (NAc + DLPFC, EPIC) → NAc'ta 1.107 DMP, DLPFC'de NULL
- Model: `beta ~ AUD(case) + agedeath(z) + sex + smoker(ölümde aktif içici)`; hiçbir terim
  düşmedi (tam-rank). NAc n=115 (56/59), DLPFC n=117 (58/59).
- **NAc: 1.107 DMP** (en üst cg03373913 Δβ=+0,019, q=0,0074). **DLPFC: 0 DMP.** Aynı kişilerde
  iki bölge → bulgu **bölgeye-özgü** (ödül devresi NAc'ta sinyal, DLPFC'de yok).
- **Sigaradan temiz:** AHRR cg05575921 NAc'ta sıra 397.811 (p=0,39), DLPFC'de 567.165 (p=0,66) —
  kan kohortlarının (GSE110043) aksine bu beyin imzası sigara-karışımlı değil.
- **DLPFC NULL'unun tespit gücü (spike-in güç/FPR kalibrasyonu, Görev 10):** DLPFC kolunda (n=58/59,
  767.719 prob) NULL'u veren aynı OLS testine, gerçek prob-bazlı artık varyansından (resid_sd medyan
  0,0235) üretilen Gauss spike-in ile bilinen gruplar-arası etkiler enjekte edildi. **MDE (≥%80 güç) =
  0,03 beta (3 pp) tüm-tabaka / 0,04 beta (4 pp) orta-metilasyon tabakası.** Güç eğrisi: 2 pp'de 0,62,
  3 pp'de 0,82, 5 pp'de 0,97, 10 pp'de ≈1,00. Tam-null altında **genom-capı yanlış-pozitif oranı =
  0 / 767.719** (5/5 tekrar; test antikonservatif değil, iyi kalibre). Drift teyit: 0 DMP, min q=0,6699.
  → DLPFC NULL'u "**~3–4 pp üstündeki bir etki tespit edilemezdi**" demektir; eşlik eden NAc'ın en üst
  gerçek sinyali (Δβ=+0,019 ≈ 2 pp) tam tespit sınırındadır — bölgeye-özgü negatif, daha küçük bir
  gerçek DLPFC etkisinin yokluğunu KANITLAMAZ. EPIC'te okuma sayısı olmadığı için bu, opioid beta-binom
  kapsam simülasyonunun dizi-karşılığı (Gauss artık-varyans spike-in) olarak açıkça etiketlidir.
- Betik: `scripts/40_dmp_alcohol_brain_gse252501.py` · çıktı: `out/GSE252501_validation.json`
- Güç/FPR betiği: `human/alcohol_dlpfc/alcohol_dlpfc_power_fpr_sim.py` · çıktı:
  `human/alcohol_dlpfc/out/GSE252501_DLPFC_alcohol_power_fpr.json` + `.png` (sabit seed 20260614,
  girdi SHA-256 JSON içinde).

#### 2.1a Bölgeye-özgülük taraması — alkol NAc DMP'leri gerçekten bölgeye-özgü mü, yoksa tek-bölge kuyrukları mı? → 1.076/1.107 (%97,2) BÖLGEYE-ÖZGÜ (NAc)

§2.1, NAc'taki 1.107 DMP'nin DLPFC'de tutmamasını **toplu (genom-çapı)** düzeyde gösterdi. Burada,
opioid bulk-yalnız pencere taramasının (§2.5d) **pozitif-bulgu aynası** olarak, **per-lokus** mantık
uygulanır: her bir **üst NAc DMP'sinin ±2 kb penceresi AYNI-DENEK DLPFC verisinde** test edilir.
Kesif prob NAc'ta genom-çapı FDR<0,05 (keşif ölçütü) iken **aynı prob DLPFC'de pencere-içi BH-FDR<0,05
+ aynı yön** ise `REPLICATES_BOTH_REGIONS`, değilse `REGION_SPECIFIC_NAc_ONLY` (opioid `classify()` ile
birebir aynı yapı). Bu, "gerçek" alkol bulgularının hangileri **gerçekten ödül-devresi (NAc)
bölgeye-özgü sinyali**, hangileri iki bölgede de tutan sağlam sinyal olduğunu sistematik olarak ayırır.

- **Taranan:** **TÜM 1.107 NAc DMP'si** (genom-çapı FDR<0,05; artık üst-50 örneklemi değil, tam kohort).
  Pencere ±2 kb, komşu proplar EPIC hg38 manifestinden bulunur.
- **Sonuç (tam kohort, 1.107/1.107):** **1.076 `REGION_SPECIFIC_NAc_ONLY` (%97,2)**,
  **29 `REPLICATES_BOTH_REGIONS` (%2,6)**, **2 `DLPFC_NOT_MEASURED` (%0,2)** (DLPFC matrisinde ölçülmemiş prob).
  En güçlü NAc DMP'si (cg03373913, NAc FDR=0,0074) DLPFC'de p=0,61 / pencere-FDR=0,79 → **bölgeye-özgü.**
  Yani §2.1'in toplu bulgusu **tek bir üst-50 örneklemiyle değil, 1.107 DMP'nin tamamı üzerinde** per-lokus
  düzeyde doğrulanır: NAc pozitiflerinin **%97,2'si** DLPFC'de tutmaz — bunlar tek-bölge kuyruğu değil,
  **gerçek ama bölgeye-özgü** sinyallerdir (DLPFC'de aynı CpG AUD ile ilişkili değil, dolayısıyla NAc sinyali
  bir batch/teknik kuyruk olsaydı DLPFC'de de yanması beklenirdi — yanmıyor). Yalnızca **%2,6**'sı (29 DMP)
  iki bölgede de aynı yönde tutar — bunlar bölgeden bağımsız sağlam AUD sinyali adaylarıdır.

- **Per-DMP tablo (en iyi 20; tam 1.107 DMP JSON'da):**

| Keşif probu (NAc DMP) | hg38 | NAc Δβ | NAc FDR (genom) | DLPFC p (aynı prob) | DLPFC FDR_pencere | Pencere prob | Yargı |
|---|---|---|---|---|---|---|---|
| cg03373913 | chr1:26318270 | +0,0194 | 0,0074 | 0,609 | 0,786 | 14 | REGION_SPECIFIC_NAc_ONLY |
| cg05148170 | chr17:5017080 | +0,0212 | 0,0076 | 0,045 | 0,091 | 2 | REGION_SPECIFIC_NAc_ONLY |
| cg16339042 | chr5:119353942 | +0,0165 | 0,0132 | 0,217 | 0,652 | 21 | REGION_SPECIFIC_NAc_ONLY |
| cg05355306 | chr11:47393621 | +0,0236 | 0,0132 | 0,600 | 0,688 | 7 | REGION_SPECIFIC_NAc_ONLY |
| cg11803771 | chr11:65641094 | +0,0254 | 0,0135 | 0,659 | 0,856 | 13 | REGION_SPECIFIC_NAc_ONLY |
| cg10650821 | chr6:31575908 | +0,0191 | 0,0223 | 0,072 | 0,123 | 23 | REGION_SPECIFIC_NAc_ONLY |
| cg04638395 | chr11:75181647 | +0,0219 | 0,0223 | 0,272 | 0,272 | 1 | REGION_SPECIFIC_NAc_ONLY |
| cg17963472 | chr12:68686860 | −0,0071 | 0,0256 | 0,365 | 0,841 | 21 | REGION_SPECIFIC_NAc_ONLY |
| cg26236329 | chr11:57432851 | +0,0295 | 0,0256 | 0,035 | 0,069 | 2 | REGION_SPECIFIC_NAc_ONLY |
| cg01818853 | chr2:99771907 | +0,0206 | 0,0256 | 0,247 | 0,494 | 2 | REGION_SPECIFIC_NAc_ONLY |
| cg11031945 | chr12:56127169 | +0,0188 | 0,0273 | 0,027 | 0,214 | 16 | REGION_SPECIFIC_NAc_ONLY |
| cg13441624 | chr6:48765537 | −0,0137 | 0,0273 | 0,648 | 0,648 | 3 | REGION_SPECIFIC_NAc_ONLY |
| cg10772723 | chr16:46735933 | +0,0118 | 0,0273 | 0,303 | 0,777 | 3 | REGION_SPECIFIC_NAc_ONLY |
| cg26904629 | chr2:25517015 | −0,0422 | 0,0278 | 0,711 | 0,711 | 1 | REGION_SPECIFIC_NAc_ONLY |
| cg21028171 | chr22:33920988 | −0,0067 | 0,0278 | 0,424 | 0,921 | 13 | REGION_SPECIFIC_NAc_ONLY |
| cg05614346 | chr5:177431606 | +0,0155 | 0,0283 | 0,409 | 0,681 | 5 | REGION_SPECIFIC_NAc_ONLY |
| cg00975876 | chr6:41785030 | +0,0198 | 0,0283 | 0,343 | 0,881 | 11 | REGION_SPECIFIC_NAc_ONLY |
| cg01276564 | chr8:1868325 | +0,0254 | 0,0283 | 0,114 | 0,382 | 10 | REGION_SPECIFIC_NAc_ONLY |
| cg16297444 | chr19:18699966 | +0,0231 | 0,0283 | 0,320 | 0,374 | 7 | REGION_SPECIFIC_NAc_ONLY |
| cg07733419 | chr6:7188750 | +0,0179 | 0,0283 | 0,096 | 0,287 | 3 | REGION_SPECIFIC_NAc_ONLY |

- **İki bölgede de tutan 29 DMP (`REPLICATES_BOTH_REGIONS`):** Hem NAc'ta hem aynı-denek DLPFC'de aynı
  yönde anlamlı (DLPFC pencere-içi BH-FDR<0,05 + aynı yön); bunlar bölgeden bağımsız sağlam AUD sinyali
  adaylarıdır (tam kohort taramasının %2,6'sı):

| Keşif probu | hg38 | NAc Δβ | NAc FDR | DLPFC Δβ | DLPFC p | DLPFC FDR_pencere |
|---|---|---|---|---|---|---|
| cg03301622 | chr14:75188791 | +0,0190 | 0,0283 | +0,0096 | 0,0072 | 0,0072 |
| cg01861657 | chr8:57204565 | +0,0170 | 0,0283 | +0,0120 | 0,0116 | 0,0349 |
| cg22840216 | chr12:117111710 | +0,0202 | 0,0294 | +0,0132 | 0,0052 | 0,0052 |
| cg11372214 | chr6:31789556 | +0,0159 | 0,0294 | +0,0125 | 0,0058 | 0,0116 |
| cg01856529 | chr12:54259306 | −0,0183 | 0,0307 | −0,0097 | 0,0064 | 0,0321 |
| cg21794163 | chr19:50341147 | +0,0249 | 0,0360 | +0,0096 | 0,0142 | 0,0142 |
| cg20058599 | chr10:100077073 | +0,0202 | 0,0364 | +0,0099 | 0,0077 | 0,0154 |
| cg26708596 | chr8:48665080 | +0,0178 | 0,0370 | +0,0080 | 0,0455 | 0,0455 |
| cg18618395 | chr14:74894251 | +0,0184 | 0,0370 | +0,0111 | 0,0146 | 0,0146 |
| cg12428546 | chr9:114518760 | +0,0175 | 0,0375 | +0,0099 | 0,0095 | 0,0189 |
| cg11438039 | chr3:62160022 | −0,0289 | 0,0375 | −0,0124 | 0,0240 | 0,0240 |
| cg05191535 | chr19:16313071 | +0,0284 | 0,0388 | +0,0140 | 0,0300 | 0,0300 |
| cg21852852 | chr15:66683032 | +0,0179 | 0,0421 | +0,0095 | 0,0161 | 0,0161 |
| cg00041401 | chr1:113871785 | +0,0165 | 0,0429 | +0,0146 | 0,0006 | 0,0044 |
| cg00068571 | chr5:66960884 | −0,0193 | 0,0429 | −0,0183 | 0,0031 | 0,0153 |
| cg20884522 | chr7:2763330 | −0,0170 | 0,0430 | −0,0144 | 0,0058 | 0,0303 |
| cg14813485 | chr2:195595896 | +0,0180 | 0,0440 | +0,0074 | 0,0448 | 0,0448 |
| cg15558195 | chr10:71045630 | +0,0264 | 0,0445 | +0,0113 | 0,0073 | 0,0073 |
| cg16766139 | chr4:15809125 | +0,0187 | 0,0454 | +0,0091 | 0,0187 | 0,0187 |
| cg12592772 | chr12:122682113 | +0,0214 | 0,0454 | +0,0095 | 0,0433 | 0,0433 |
| cg11024641 | chr10:130160990 | −0,0202 | 0,0454 | −0,0121 | 0,0144 | 0,0144 |
| cg05357862 | chr1:224203676 | +0,0164 | 0,0467 | +0,0091 | 0,0074 | 0,0074 |
| cg05684375 | chr6:37988857 | −0,0392 | 0,0468 | −0,0249 | 0,0190 | 0,0190 |
| cg27130289 | chr12:7675725 | +0,0152 | 0,0472 | +0,0113 | 0,0049 | 0,0146 |
| cg14606549 | chr1:186606110 | −0,0315 | 0,0478 | −0,0164 | 0,0256 | 0,0256 |
| cg01440738 | chr17:80327822 | +0,0169 | 0,0479 | +0,0084 | 0,0204 | 0,0204 |
| cg25421660 | chr11:122207812 | −0,0164 | 0,0495 | −0,0109 | 0,0051 | 0,0102 |
| cg00787856 | chr1:10797052 | −0,0129 | 0,0496 | −0,0146 | 0,0001 | 0,0014 |
| cg21467614 | chr6:31575860 | +0,0129 | 0,0499 | +0,0105 | 0,0069 | 0,0267 |

- **DLPFC'de ölçülmemiş 2 DMP (`DLPFC_NOT_MEASURED`):** cg27173711 @ chr12:106774554 (NAc FDR=0,0410) ve
  cg09871328 @ chr7:77537309 (NAc FDR=0,0472) — DLPFC matrisinde bu problar yer almadığından bölge
  karşılaştırması yapılamaz (yargıya dahil değil).
- **Betik:** `human/alcohol/alcohol_region_artifact_scan.py` · çıktı:
  `human/alcohol/out/alcohol_region_artifact_scan.json` (per-DMP tam tablo + ±2 kb pencere prop detayı +
  yargı sayımları + tüm girdi SHA-256'ları). Üretim hattı: matrisler bölge-bölge çözülüp
  `scripts/40d_parse_region.py` (parse→npz) + `scripts/40e_regress_region.py` (regresyon→DMP CSV) ile
  120 sn duvarı altında üretilir; `out/GSE252501_validation.json` iki bölge fragmanından birleştirilir.
  Girdi SHA-256'ları: `GSE252501_NAc_dmp.csv`=`8eb8e4ac…43a5`, `GSE252501_DLPFC_dmp.csv`=`73a3e2c2…5a59`,
  `EPIC.hg38.manifest.tsv.gz`=`7ebba6a5…7892` (SOURCES.txt'teki Zhou-lab hg38 manifest SHA'sı ile birebir).

#### 2.1a İki-bölgede-tutan 2 markerin BAĞIMSIZ kohort doğrulaması (GSE49393) → **replike OLMUYOR / ölçülemiyor**

Yukarıdaki iki `REPLICATES_BOTH_REGIONS` markeri tek bir kohorta (GSE252501) bağlı kalmamak için
**tamamen bağımsız** bir alkol-beyin EWAS kohortunda test edildi: **GSE49393** — yetişkin AUD
postmortem **prefrontal korteks**, Illumina **450K**, n=48 (23 AUD / 25 kontrol); GSE252501'den ayrı
denekler, ayrı platform, ayrı laboratuvar. Tam-array EWAS'i (`beta ~ AUD + age(z) + sex`, 430.407 prob,
BH-FDR) zaten `out/GSE49393_dmp.csv`'de mevcut. Hedefe-yönelik 2-prob ölçütü: **keşif yönüyle aynı
(hiper) + nominal p<0,05 → REPLICATES**; aksi → DOES_NOT_REPLICATE. **EPIC'e özgü** (450K'da olmayan)
probler için **koordinat-tabanlı vekil**: marker hg38 konumu yerel UCSC chain dosyasıyla (pyliftover,
hg38→hg19) çevrilir, lift edilen anchor'ın **±2 kb**'i içindeki en yakın 450K probu vekil olarak test
edilir → aynı yön + nominal p<0,05 → REPLICATES_VIA_PROXY, aksi → DOES_NOT_REPLICATE_VIA_PROXY; lift
edilen anchor'ın ±2 kb'inde **hiç** 450K probu yoksa (gerçek 450K kapsam boşluğu) →
NOT_MEASURABLE_ON_INDEPENDENT_COHORT (en yakın prob mesafesi raporlanır).

| Marker | hg38 | Keşif (GSE252501) yön | GSE49393 Δβ (AUD−kontrol) | t | p | array-FDR | Yargı |
|---|---|---|---|---|---|---|---|
| cg01861657 | chr8:57204565 | hiper (NAc+DLPFC) | **−0,0039** (ters yön) | −0,70 | 0,486 | 0,786 | **DOES_NOT_REPLICATE** |
| cg03301622 | chr14:75188791 | hiper (NAc+DLPFC) | — (EPIC'e özgü; vekil denendi) | — | — | — | **NOT_MEASURABLE_ON_INDEPENDENT_COHORT** (450K kapsam boşluğu) |

- **cg01861657:** Bağımsız kohortta etki **ters yönde ve anlamsız** (hipo, p=0,486) → **doğrulanmadı**.
  ±2 kb pencere-vekili de doğrulamadı: 3 komşu 450K probundan hiçbiri aynı-yön + pencere-FDR<0,05 değil
  (cg08087668 Δβ=−0,0065 p=0,170; cg07350421 Δβ=+0,0061 p=0,126).
- **cg03301622:** EPIC'e özgü bir probtur; 450K dizisinde aynı-prob olarak **yer almaz**. Artık
  dizi-sürümleri arası **koordinat-tabanlı vekil** uygulanıyor: hg38 `chr14:75188791` yerel UCSC chain
  dosyasıyla (pyliftover) **hg19 `chr14:75655494`**'e lift edildi. Ancak bu anchor'ın **±2 kb**'inde
  GSE49393'te test edilmiş **hiç** 450K probu yok — **en yakın 450K probu (cg24730612) 5.521 bp uzakta**.
  Bu, 450K dizisinin bu bölgedeki **gerçek kapsam boşluğunu** gösteren hesaplanmış bir sonuçtur (uydurma
  yok): vekil-düzeyinde dahi replike edilemiyor çünkü ölçülecek komşu prob yok →
  **NOT_MEASURABLE_ON_INDEPENDENT_COHORT**. (Önceki "anchor yok → vekil uygulanamaz" gerekçesinin yerini,
  artık fiilen denenip ölçülen kapsam-boşluğu sonucu aldı.)
- **Sonuç:** GSE252501'de iki-bölge-tutan iki markerden aynı-probu test edilebilen tek prob (cg01861657)
  bağımsız kohortta **replike olmuyor**; diğeri (cg03301622) lift edilip vekil denense de bağımsız
  platformda **ölçülemiyor** (450K kapsam boşluğu). Yani bu iki "en genellenebilir aday", tek-kohort-ötesi
  sağlamlık için **henüz desteklenmiş değil** — GSE252501'e özgü bulgular olarak kalır.
- **Betik:** `human/alcohol/alcohol_crossregion_independent_validation.py` · çıktı:
  `human/alcohol/out/alcohol_crossregion_independent_validation.json` (per-prob ayrıntı + pencere-vekili +
  liftover meta + tüm girdi SHA-256'ları). Girdi SHA-256'ları (JSON'da tam): `GSE49393_dmp.csv`,
  `GSE49393_validation.json`, `GSE252501_NAc_dmp.csv`, `GSE252501_DLPFC_dmp.csv`,
  `alcohol_region_artifact_scan.json`, `GPL13534_manifest.csv.gz`,
  `hg38ToHg19.over.chain.gz`=`14a712e8…587b1` (UCSC goldenPath/hg38/liftOver; pyliftover ile yerel/çevrimdışı).

### 2.2 Enjeksiyon yoluyla madde kullanımı (IDU) — kan, GSE100264 → 1 DMP, ağır karışım uyarısı
- WIHS kohortu (HIV+ kadınlar). n=382 (IDU+ 214 / IDU− 168), 482.415 prob.
- Model `beta ~ idu + age(z) + smoking`; **sex ve hiv sabit** (hepsi kadın / hepsi HIV+) →
  otomatik düşürüldü; **hcv_dx idu ile MÜKEMMEL eşdoğrusal** (her IDU+ HCV+, her IDU− HCV−,
  korelasyon=1,000) → tasarımı tekil yapmamak için düşürüldü.
- **1 DMP** (cg10439456, Δβ=−0,048, q=0,0094). **Yorumlama uyarısı:** Bu kohortta IDU ile HCV
  enfeksiyonu ayrıştırılamaz; sinyal **IDU/HCV-birleşik** bir ilişkidir, nedensellik değil; sigara
  modellendi ama IDU≡HCV karışımı veri yapısı gereği çözülemez.
- Betik: `scripts/41_dmp_idu_gse100264.py` · çıktı: `out/GSE100264_validation.json`

### 2.3 Kokain — beyin, GSE137364 (kaudat, bisülfit 5x) → NULL
- n=57 (vaka 28 / kontrol 29, hepsi erkek). 3.386.951 CpG tarandı; ancak **5x kapsam complete-case**
  filtresinden yalnız **1.099 CpG** tüm donörlerde eşzamanlı ölçülebildi (imputasyon yok).
- Model `proportion ~ cocaine(case) + age(z) + smoker`. **0 DMP** (min q=0,739) → dürüst NULL.
- **Sınırlılık:** Düşük kapsam + sınırlı complete-case → güç çok düşük; "veri yok" değil,
  **veri var ama bu kapsamda anlamlı sinyal yok** (sahte pozitif üretilmedi).
- **NULL'un tespit gücü (spike-in güç/FPR kalibrasyonu, Görev 10):** complete-case CpG evreninde
  (n=28/29) NULL'u veren aynı OLS testine, sitelerin GERÇEK kapsam/dispersiyonundan (medyan kapsam
  ~62x — "5x" yalnızca alt-filtre; shrink-rho medyan 0,00025) üretilen beta-binom spike-in ile bilinen
  etkiler enjekte edildi. **MDE (≥%80 güç) = 3 pp nominal (~1,4 pp gerçekleşen, düşük-metilasyon
  kırpması sonrası).** Güç eğrisi: 2 pp'de 0,63, 3 pp'de 0,88, 5 pp'de 0,99, ≥10 pp'de 1,00 — yüksek
  kapsam sayesinde az sayıdaki complete-case sitede güç aslında yüksek; gerçek darboğaz **prob sayısı**
  (yalnız ~1.120 ölçülebilir site), per-site duyarlılık değil. Tam-null altında **complete-case-capı
  yanlış-pozitif oranı = 0 / 1.120** (10/10 tekrar). Drift teyit: 0 DMP, min q=0,7532 (rapor §1: 0,739;
  kütüphane-sürümü/float kenar farkı, %2 içinde, NULL sonucu DEĞİŞMEZ). → Kokain-kaudat NULL'u "kapsam
  yeterli ama **complete-case site sayısı çok az** olduğu için genom-capı sonuç çıkarılamaz" demektir.
- Betik: `scripts/43_dmp_cocaine_brain_bisulfite.py` · çıktı: `out/GSE137364_validation.json`
- Güç/FPR betiği: `human/cocaine/cocaine_power_fpr_sim.py` · çıktı:
  `human/cocaine/out/GSE137364_cocaine_power_fpr.json` + `.png` (sabit seed, girdi SHA-256 JSON içinde).

### 2.4 Opioid — beyin, GSE235818 (OFC NeuN+ nöron) coverage-ağırlıklı yeniden test → NOT_CONFIRMED

İlk taramada (`human/opioid/opioid_dmp.py`, % üzerinde Welch t) tek DMP bulunmuştu:
**chr3:32781045**, OUD'da −2,3 puan hipometilasyon, p=2,0×10⁻⁸, q=0,0076. Bu test okuma derinliğini
ve biyolojik replika varyansını **yok sayar**. Bu turda coverage-ağırlıklı, aşırı-dağılım-duyarlı
modelle yeniden test edildi:

- **Ham okuma sayıları kamuya açık değil.** GEO yazarı açıkça "yalnızca beta değer tablom var, ham
  veriyi sunacak veriye sahip değilim" demiştir; GSM ek dosyaları YOK; GEO'da yalnızca
  `GSE235818_Meth.csv.gz` (5mC %) + `Hydroxy.csv.gz` (5hmC %) mevcut.
- **Okuma sayıları beta yüzdelerinden tam olarak geri kazanıldı:** her % değeri rasyonel bir M/N
  kesridir (ör. %10,1449275362319 = 7/69). Sürekli-kesir / en-sade-terim
  (`Fraction.limit_denominator(5000)`) ile her hücrenin (M=metile, N=toplam) okuma sayısı yeniden
  üretildi. Geri-kazanım hatası: **max |yeniden_kurulan% − orijinal%| = 5,7×10⁻¹⁴ %** (yani tam).
  Bu sayılar, beta tablosunu üreten okuma sayılarının ta kendisidir.
- Geri kazanılan coverage gerçekçi RRBS aralığında: **medyan ≈32×**, ortalama 34,6×. En-sade-terim,
  gcd(M,N)>1 olduğunda gerçek coverage'ın bir BÖLENİni döndürür → geri kazanılan coverage bir
  **alt sınırdır** → test **muhafazakârdır** (gerçek bir etki ancak hafife alınabilir, abartılamaz).
  %0 hücreler (%17,3) site-medyanı coverage ile dolduruldu (M=0 korundu).
- **Genom-çapında methylKit-tarzı aşırı-dağılımlı (overdispersed) lojistik / F testi:** FDR<0,05'te
  **0 DMP**, min q=1,0. Aday chr3:32781045 için q=1,0 → **anlamlı değil.**
- **Beta-binomyal MLE (adayda):** dağılım parametresi rho≈0'a çöktü; yani sade binomyale (= naive
  ki-kare ile aynı anti-muhafazakâr rejim) dejenere oldu. Düşük p'si (5,1×10⁻⁵) bu yüzden **tek başına
  bağımsız bir doğrulama değildir.** İmputasyonsuz muhafazakâr duyarlılık analizinde beta-binom
  **p=0,385 (anlamsız).**
- **DSS-tarzı dağılım-küçültmeli (dispersion-shrinkage) yeniden test (sağlamlaştırma):** rho≈0
  çökmesini gidermek için DSS (Feng/Conneely/Wu 2014) mantığıyla: (1) kondisyon-içi (within-group)
  Williams (1982) moment dispersiyonu, (2) genom-çapı **ortalama-dispersiyon eğilimi** (log-normal
  prior; 197.586 sitede tahmin edilebilir), (3) log-uzayında ampirik-Bayes küçültme (prior log-varyans
  τ²=0,84) → site-bazlı gerçekçi rho (genom-çapı medyan rho_shrunk=0,0016), (4) rho_shrunk **sabit**
  tutularak beta-binom Wald. **Aday chr3:32781045**: within-group rho_raw=−0,0095 (23 sıfırdan-farklı
  örnekle iyi tahmin edilmiş → küçültme ağırlığı B=0,90, yani dispersiyon gerçekten düşük, yapay
  şişirme yapılmadı); rho_shrunk=0,00015. **Genom-çapı DSS Wald: FDR<0,05'te 0 DMP, min q=0,131;
  chr3:32781045 q=0,159 → anlamlı değil.** (Noktasal p=3,7×10⁻⁶ küçük olsa da, diğer sitelerin
  gerçekçi dispersiyonlarıyla genom-çapı çoklu-test eşiği yükseldiğinden hiçbir site ayakta kalmaz.)
- **Sonuç:** chr3:32781045, okuma derinliği + replika aşırı-dağılımı hesaba katıldığında **doğrulanmaz**
  ve bu sonuç artık **iki bağımsız dağılım-duyarlı test** ile teyitlidir (aşırı-dağılımlı F: q=1,0;
  DSS dağılım-küçültmeli Wald: q=0,159). Orijinal q=0,0076, yüzde-yaklaşımının (derinlik ve biyolojik
  varyansı yok saymanın) bir artefaktıdır. Naive pooled ki-kare hâlâ onu işaretler (q=0,028) ama
  yalnızca replika aşırı-dağılımını yok saydığı için; dispersiyon gerçekçi (çökmemiş) bir düzeye
  küçültülünce sinyal kaybolur. Geri kazanılan coverage muhafazakâr bir alt sınır olduğundan, bulgunun
  ayakta kalamaması güçlü bir kanıttır — bir geri-kazanım kısıtlaması değil.
- **DSS testinin GERÇEK GÜCÜ ve YANLIŞ-POZİTİF ORANI (spike-in kalibrasyonu):** "NULL" yorumunu
  dürüstçe çerçeveleyebilmek için, NOT_CONFIRMED kararını veren DSS dağılım-küçültmeli beta-binom Wald
  testinin bu veri seti + coverage'da ne kadar büyük bir etkiyi yakalayabildiği ölçüldü. Gerçek geri
  kazanılan coverage (N_imp), gerçek site-bazlı ortalama metilasyon ve gerçek dispersiyon (rho_shrunk)
  korunarak beta-binom ile yeni sayım matrisleri üretildi; rastgele site altkümelerine **bilinen** bir
  gruplar-arası fark (delta ∈ {5,10,15,20,25,30} puan × düşük/orta/yüksek metilasyon tabakası, hücre başına
  400 site, 5 tekrar) enjekte edildi, geri kalan siteler null bırakıldı. Tüm matrise aynı DSS Wald + BH-FDR
  uygulandı (sabit seed=20260614; boru hattı gerçek veride yeniden hesaplanıp committed JSON'la birebir
  doğrulandı: min q=0,1309, chr3 q=0,1586 — drift yok). **Sonuçlar:** güç, 10 puanlık farkta 0,59; 15
  puanda 0,86; 20 puanda 0,96; 30 puanda 0,99 (tüm tabakalar birleşik). En zorlu (orta-metilasyon, β≈0,5;
  beta-binom varyansının en yüksek olduğu) tabakada **≥%80 güce ulaşılan en küçük etki = 20 puan (MDE).**
  Tam null altında (hiç enjeksiyon yok) genom-çapı **yanlış-pozitif oranı FDR<0,05'te 4,6×10⁻⁵** (ortalama
  17,8 / 383.235 sahte kesif) → test **iyi kalibre, anti-muhafazakâr değil.** **Yorum:** orijinal
  chr3:32781045 etkisi (~2,3 puan) testin minimum saptanabilir etkisinin (≈20 puan) **çok altındadır**;
  yani NOT_CONFIRMED kararı "bu kadar küçük bir etki bu derinlik/örneklem (n=12 vs 26, medyan ~32× coverage)
  ile saptanamaz" demektir — daha büyük gerçek bir opioid etkisinin **yokluğunu kanıtlamaz.** Negatif sonuç
  bu yüzden "sinyal yok" değil, "küçük sinyali ayırt edecek güç yok" olarak okunmalıdır.
- **Mis-spesifik (kötümserci) dispersiyon altında sağlamlık (spike-in simülasyonu, yukarıdaki güç/FPR
  kalibrasyonunun doğrudan uzantısı):** Yukarıdaki kalibrasyon, simülasyon verisini veri setinin KENDİ
  tahmin ettiği gürültüyle (rho_shrunk) üretir; bu, DSS testini "iyi-spesifik" kılar (gerçek gürültü
  ailesini bilir) ve güç sayılarını bir miktar iyimser yapabilir. Bunu test etmek için aynı boru hattı,
  veri-üreten dispersiyon **kasıtlı olarak şişirilmiş** dört senaryoda yeniden çalıştırıldı —
  rho_x1 (temel), **2×rho_shrunk**, **5×rho_shrunk** ve site-bazlı **muhafazakâr sabit taban rho≥0,02
  (sitelerin %91'ini şişirir)** — fakat **test her tekrarda dispersiyonu simüle edilen veriden yeniden
  tahmin eder** (yani gerçek/şişirilmiş gürültü ailesini BİLMEZ; mis-spesifikasyon tam da budur).
  **Sonuç — başlık bulgular sağlam:** orta-metilasyon tabakasında ≥%80 güce ulaşılan en küçük etki
  (MDE) 20 puan (temel) → **25 puan (5×)** / 20 puan (sabit taban) bandında kalır; 20 puanlık etkide güç
  (tüm tabakalar) 0,96 → **0,86 (5×)** olur. Tam null altında genom-çapı yanlış-pozitif oranı küçük ve
  **anti-muhafazakâr olmayan** düzeyde kalır: 2,2×10⁻⁵ (temel) → 1,4×10⁻⁴ (5×) / 1,9×10⁻⁴ (sabit taban)
  — hepsi nominal FDR=0,05'in çok altında. Yani orijinal güç sayıları bir "iyi-spesifikasyon artefaktı"
  **değildir**: varsayılandan daha kötü gürültü altında bile test hâlâ ~20 puan mertebesinde bir etkiye
  ihtiyaç duyar (chr3:32781045'in ~2,3 puanının çok üstünde), ve NOT_CONFIRMED kararı yokluk kanıtı
  değil bir **güç kısıtı** olarak kalır.
- Sağlamlık betiği: `human/opioid/opioid_power_fpr_misspec.py` (opioid_power_fpr_sim.py'nin
  simulate_counts / dss_shrunk_rho / dss_wald_q makinesini birebir mirror eder; sabit seed=20260614 +
  girdi SHA-256) · çıktı: `human/opioid/out/GSE235818_opioid_power_fpr_misspec.json` (4 senaryonun
  güç-vs-delta tabloları, MDE'leri ve null FPR'leri + committed iyi-spesifik JSON'la karşılaştırma)
- Betik: `human/opioid/opioid_coverage_dmp.py` · çıktı:
  `human/opioid/out/GSE235818_opioid_coverage_dmp.json` (verdict: `NOT_CONFIRMED`; `dss_shrinkage` bloğu
  τ², trend bin sayısı, site-bazlı rho_raw/rho_shrunk ve sabit-rho LRT dâhil)
- Güç/FPR kalibrasyon betiği: `human/opioid/opioid_power_fpr_sim.py` · çıktı:
  `human/opioid/out/GSE235818_opioid_power_fpr.json` + `..._power_fpr.png` (güç-vs-delta eğrisi + null FPR;
  güç tabaka×delta tablosu, ampirik FDR, sabit seed + girdi SHA-256, committed JSON'a karşı drift kontrolü)

### 2.5 chr3:32781045 — BAĞIMSIZ veri setinde çapraz-doğrulama (GSE98203) → NOT_CONFIRMED

§2.4 tek sete (GSE235818) dayanan bir negatif sonuçtu. Bu turda chr3:32781045 **bağımsız bir
OUD/beyin kohortunda** test edildi: **GSE98203** — postmortem OFC, FACS ile ayrılmış **nöronal
çekirdekler** (GSE235818 ile **aynı doku tipi**), **37 eroin vs 28 kontrol**, Illumina 450K.
Bağımsız kohort **ve** bağımsız platform (array vs bisülfit-dizi).

- **Pozisyon eşlemesi (hg38):** GSE235818 GRCh38'e haritalanmış (series_matrix `Assembly:
  Homo_sapiens.GRCh38.84`); hedef CpG = chr3:32781045. 450K cg propları → hg38 koordinatları
  **Zhou-lab (sesame) hg38 manifestinden** alındı (kaynak + SHA-256: `manifest/SOURCES.txt`).
  450K'da tam o bazda prop yok; **hedefe en yakın prop = cg18028347 @ chr3:32781025 (yalnızca
  20 bp uzakta)**. ±2 kb pencerede 8 prop var, hepsi GSE98203'te mevcut (eksik yok).
- **Test:** GSE98203 ana DMP'siyle **aynı model** `beta ~ heroin + age(z) + sex` (OLS), bölge-içi
  BH-FDR. Bağlam: GSE235818'de vakalar **hipometile** idi (Δ=−2,3 puan).
- **Sonuç — en yakın prop cg18028347 (20 bp):** Δβ=**−0,00058** (yön aynı ama büyüklük sıfıra yakın),
  vaka ort. β=0,103 / kontrol ort. β=0,108, t=−0,12, **p=0,905**, bölge-FDR=0,905 → **tamamen anlamsız.**
- **Sonuç — ±2 kb bölgesi (8 prop):** Hiçbiri bölge-içi FDR<0,05'i geçmez; en küçük ham p=0,016
  (cg27108452, 128 bp; bölge-FDR=0,130), **min bölge-FDR=0,130.**
- **Yorum:** GSE235818'in tek DMP'si chr3:32781045, **bağımsız OFC-nöron eroin kohortunda REPLİKE
  OLMADI.** Aynı doku tipinde, bağımsız kohort + bağımsız platformda sinyal yok → §2.4'teki
  "orijinal yüzde-yaklaşımı (derinlik/replika varyansını yok sayma) artefaktı" yorumu **pekişti.**
  *(Sınırlılık: array propu hedef CpG'den 20 bp ötede ayrı bir CpG'yi ölçer; bisülfit pozisyonuyla
  birebir aynı baz değildir. Yine de aynı CpG kümesi/bölgesidir ve hedef-çevresi tümüyle null'dur.)*
- Betik: `human/opioid/opioid_chr3_crossval.py` · çıktı:
  `human/opioid/out/GSE235818_chr3_32781045_crossval_GSE98203.json` (verdict: `NOT_CONFIRMED`)

#### 2.5b chr3:32781045 — İKİNCİ bağımsız doğrulama, FARKLI beyin bölgesi (GSE164822, dlPFC, EPIC) → NOT_CONFIRMED

§2.5 (GSE98203) aynı bölgede (OFC) bir doğrulamaydı. Üçüncü bir bağımsızlık katmanı olarak chr3:32781045
**ikinci bağımsız bir OUD kohortunda ve FARKLI bir beyin bölgesinde** test edildi: **GSE164822** —
postmortem **dorsolateral prefrontal korteks (dlPFC)**, Illumina **EPIC**, **M-değeri**, **72 Opioids vs
28 Normal Control** (53 "Pysch Control" birincil kontrasttan dışlandı). Bağımsız kohort + bağımsız platform
(EPIC) + farklı bölge.

- **Pozisyon eşlemesi (hg38):** Hedef CpG = chr3:32781045. EPIC cg propları → hg38 Zhou-lab (sesame)
  manifestinden (`manifest/SOURCES.txt`). En yakın prop = **cg18028347 @ chr3:32781025 (20 bp)**. ±2 kb
  pencerede **9 EPIC prop** var, hepsi GSE164822'de mevcut (eksik yok).
- **Test:** GSE164822 ana DMP'siyle (`opioid_acute_dmp.py`) **birebir aynı** kovaryat-ayarlı model
  `M ~ group(Opioids) + age(z) + pmi(z) + sex(M=1) + race(CAUC=1)` (OLS, df=94), bölge-içi BH-FDR.
- **Sonuç — en yakın prop cg18028347 (20 bp; KEŞİF lokusu):** Δ_M=**+0,068** (opioidde **HİPER**metilasyon —
  keşfin hipometilasyonuna **TERS yön**), t=1,58, **p=0,118**, bölge-FDR=0,402 → **anlamsız.** Hedef lokus
  **replike olmadı.**
- **Dürüstlük notu — ±2 kb bölgesi (9 prop):** Bir prop bölge-içi FDR<0,05 geçiyor: **cg20100151 @
  chr3:32782825 (hedeften 1780 bp, pencere kenarı)**, Δ_M=−0,199, t=−3,82, **p=0,0002, bölge-FDR=0,0021**.
  Ancak bu prop hedef CpG'den uzaktır ve keşfin tek-CpG bulgusu değildir (ayrı bir regülatuar konum
  olabilir) → **keşif bulgusunun replikasyonu sayılmaz.** Hedef-çevresi (≤650 bp) tümüyle null'dur.
- **Yorum:** chr3:32781045, ikinci bağımsız sette de (farklı kohort + EPIC + dlPFC) **REPLİKE OLMADI**;
  hedef lokusta yön bile terstir. NOT_CONFIRMED yargısı **daha da pekişti.**
  *(Sınırlılık: dlPFC, keşif/ilk doğrulamadaki **OFC'den farklı** bir beyin bölgesidir; buradaki null
  "bölge-tutarlı"dır ama AYNI-bölge replikasyonu değildir.)*
- Betik: `human/opioid/opioid_chr3_crossval_gse164822.py` · çıktı:
  `human/opioid/out/GSE235818_chr3_32781045_crossval_GSE164822.json` (verdict: `NOT_CONFIRMED`) ·
  girdi SHA-256: `GSE164822_M_final.txt.gz` = `8c8af12f…83ce568` (1.073.432.166 bayt, NCBI GEO).

#### 2.5c cg20100151 (yakındaki AYRI prob) — gerçek mi, doku/array artefaktı mı? → COHORT_SPECIFIC (yalnız dlPFC BULK)

§2.5b'de, keşif lokusu chr3:32781045 dlPFC'de replike OLMAZKEN, ±2 kb pencerenin **kenarında AYRI bir
prob** bölge-içi FDR<0,05 çıkmıştı: **cg20100151 @ chr3:32782825 (hedeften 1780 bp)**, Δ_M=−0,199,
p=0,0002, FDR=0,0021 (hipometilasyon). Bu, keşif CpG'si **değildir** ve replikasyon yargısından açıkça
dışlanmıştı; ama "gerçek bir dlPFC opioid-ilişkili DMP mi, yoksa bölge/array artefaktı mı?" sorusu
kaldığı için bu prob **diğer OUD kohortlarında özellikle** test edildi.

- **GSE164822 — dlPFC, EPIC, BULK doku** (FANS/hücre ayırma YOK; meta: "Genomic DNA … extracted from
  tissue samples"): cg20100151 **anlamlı** — Δ_M=−0,199, p=2,4×10⁻⁴, FDR_bölge=0,0021, hipometilasyon
  (72 Opioids vs 28 Normal Control). *(Committed crossval JSON'dan birebir; matris ~1 GB ayrı koştu.)*
- **GSE98203 — OFC, 450K, FACS-ayrılmış SAF NÖRON (NeuN+)**: cg20100151 **anlamsız ve YÖN TERS** —
  Δβ=**+0,0089** (vakada hafif HİPERmetilasyon eğilimi), vaka ort. β=0,691 / kontrol 0,695, t=0,46,
  **p=0,645** (37 eroin vs 28 kontrol; ana DMP modeli `beta ~ heroin + age(z) + sex`). Yerinde
  yeniden hesaplandı.
- **GSE235818 — OFC, bisülfit, FACS-ayrılmış SAF NÖRON (NeuN+)**: cg20100151 CpG'si (chr3:32782826/_27)
  bu RRBS-tarzı depozitte **hiç ÖLÇÜLMEMİŞ** (en yakın ölçülen CpG **1057 bp** uzakta @ chr3:32781769) →
  test edilemez (dürüst "not covered", uydurma değil).
- **Sonuç (verdict = `COHORT_SPECIFIC_dlPFC_BULK_ONLY`):** cg20100151 yalnızca **tek bir bulk dlPFC
  kohortunda** çıkıyor; aynı/yakın doku tipindeki **saf nöron** OFC kohortunda yön bile ters (GSE98203)
  veya hiç ölçülmemiş (GSE235818). Sinyal **bölge (dlPFC vs OFC)** ve **doku-hazırlığı (bulk vs saf
  nöron)** ile tamamen iç içe; bu tasarımla ayrıştırılamaz.
- **⚠️ HÜCRE-TİPİ KOMPOZİSYONU KARIŞTIRICI ADAYI (flagged):** cg20100151 yalnızca BULK dlPFC dokuda
  (nöron + glia + endotel karışımı) görülüyor, FACS-ayrılmış saf nöronlarda yok/ölçülmemiş. Bulk dokuda
  gözlenen fark, opioide bağlı **gerçek bir nöronal metilasyon değişimi** yerine, gruplar arası
  **hücre-tipi oranı** (ör. glia/nöron) farkından kaynaklanıyor olabilir. Referans-tabanlı beyin
  dekonvolüsyonu / nöron-oranı ayarı olmadan bu bulgu gerçek bir pan-kohort opioid DMP'si olarak
  **alınamaz.**
- Betik: `human/opioid/opioid_cg20100151_crossval.py` · çıktı:
  `human/opioid/out/cg20100151_crosstissue.json` (verdict + üç kohort tablosu + tüm girdi SHA-256'ları;
  GSE98203 ve GSE235818 yerel verilerden yerinde hesaplanır, GSE164822 committed JSON'dan aktarılır).

##### 2.5c-ek — cg20100151 BİLİNEN bir nöron-vs-glia hücre-tipi belirteci mi? → EVET (doğrudan referans testi)

Yukarıdaki karıştırıcı **adayı**, tam dekonvolüsyona girmeden, doğrudan kanıtla teyit edildi: cg20100151
**kendisi** bilinen bir nöron-vs-glia ayrımcı CpG'si mi? Bunun için beyin hücre-tipi dekonvolüsyonunun
**kanonik referans paneli** kullanıldı:

- **Referans: GSE41826 — Guintivano ve ark. 2013** ("A Cell Epigenotype Specific Model for the Correction
  of Cellular Heterogeneity in the Brain"), post-mortem frontal korteks, **FANS ile ayrılmış eşleşmiş
  NeuN+ (nöron) ve NeuN− (glia) çekirdekleri**, Illumina HM450. Sadece **saf** sıralı N (n=58) ve G (n=58)
  örnekleri kullanıldı; mix/bulk örnekler dışlandı. cg20100151 bu 450K dizisinde mevcut.
- **Sonuç:** cg20100151 nöron ile glia arasında **çok güçlü** metilasyon farkı gösteriyor:
  **nöron β ort. = 0,743** vs **glia β ort. = 0,901**, **Δ(nöron−glia) = −0,158** (nöron, gliadan **daha
  düşük** metile), **Welch t = −25,1**, **p = 1,2×10⁻³⁶**, **Mann-Whitney p = 1,6×10⁻²⁰**,
  **Cohen's d = −4,66** (devasa etki). Mutlak fark, biyolojik-anlamlı eşiği (0,10) açıkça aşar; katı 0,20
  eşiğinin hemen altında (0,158) ama etki büyüklüğü olağanüstü.
- **Verdict = `IS_A_CELL_TYPE_MARKER`.** cg20100151 **bilinen, güçlü bir nöron-vs-glia hücre-tipi belirteç
  CpG'sidir.** Dolayısıyla GSE164822 dlPFC **BULK** dokuda gözlenen "opioid" hipometilasyonu neredeyse
  kesinlikle gruplar arası **nöron/glia oranı** farkından (kompozisyon artefaktı) kaynaklanır; opioide
  bağlı gerçek bir nöronal metilasyon değişimi olarak alınamaz.
- **Yön tutarlılığı (mekanizma):** Bulk dlPFC'de vakalar **hipometile** çıktı; nöron gliadan **daha düşük**
  metile olduğu için, vakalarda görece **daha yüksek nöron / daha düşük glia** oranı tam da bu
  hipometilasyonu üretir. Bu, saf-nöron kohortunda (GSE98203, yön ters/NULL) sinyalin neden kaybolduğunu
  da doğrudan açıklar. Böylece §2.5c'deki "karıştırıcı adayı" → **doğrulanmış kompozisyon artefaktı.**
- Betik: `human/opioid/opioid_cg20100151_celltype.py` · çıktı:
  `human/opioid/out/cg20100151_celltype_marker.json` (nöron/glia n, ortalamalar, Δ, Welch/MWU/Cohen's d,
  karar kuralı dökümü, GSE41826 matris + meta SHA-256'ları; tüm sayılar yerel GSE41826 verisinden hesaplanır).

#### 2.5d SİSTEMATİK pencere-kenarı tarama — başka bulk-doku-yalnız sahte sinyal var mı? → tek artefakt (cg20100151)

§2.5c cg20100151'i **elle** yakalamıştı. Aynı desenin (replike OLMAYAN bir keşif lokusunun ±2 kb
penceresinin kenarında, YALNIZCA tek bir BULK-doku kohortunda yanan AYRI bir prob) gözden kaçan başka
örnekleri olup olmadığını görmek için cg20100151'in per-prob yargı mantığı, **rapordaki her non-replike
keşif lokusunun TÜM ±2 kb penceresine sistematik olarak** uygulandı. Pencere içindeki **her prob**,
bağlanmış üç OUD beyin kohortunda test edilip cg20100151 ile **birebir aynı** mantıkla sınıflandırılır:
**bulk dlPFC'de** (GSE164822, region-FDR<0,05) anlamlı **ama** sorted-nöron OFC'de (GSE98203, p≥0,05)
anlamsız olan proplar `COHORT_SPECIFIC_dlPFC_BULK_ONLY` olarak işaretlenir.

- **Taranan non-replike keşif lokusu:** chr3:32781045 (GSE235818 OUD; §2.4 + §2.5 + §2.5b'de replike
  olmadı). *(Raporda adlandırılmış başka non-replike beyin keşif lokusu yok; diğer madde kohortları ya
  NULL/min-q yüksek ya da kan dokusu olup bulk-vs-sorted ayrımı taşımıyor. Yeni bir non-replike beyin
  lokusu eklenirse betiğin `DISCOVERY_LOCI` listesine tek satırla eklenir.)*
- **Pencere (9 prob) tam sonuç tablosu — chr3:32781045 ±2 kb:**

| Prob | hg38 | Hedefe uzaklık | GSE164822 dlPFC BULK (FDR_bölge) | GSE98203 OFC sorted-nöron (p) | Yargı |
|---|---|---|---|---|---|
| cg18028347 | chr3:32781025 | 20 bp | 0,4015 | 0,905 | NULL_REGION |
| cg27108452 | chr3:32780917 | 128 bp | 0,4311 | 0,016 | NULL_REGION |
| cg05789938 | chr3:32781296 | 251 bp | 0,4015 | 0,456 | NULL_REGION |
| cg01111340 | chr3:32781544 | 499 bp | 0,4311 | 0,093 | NULL_REGION |
| cg11308114 | chr3:32780437 | 608 bp | 0,4311 | (450K'da yok) | NULL_REGION |
| cg23655934 | chr3:32781692 | 647 bp | 0,4311 | 0,154 | NULL_REGION |
| cg03779035 | chr3:32780144 | 901 bp | 0,4311 | 0,627 | NULL_REGION |
| **cg20100151** | **chr3:32782825** | **1780 bp** | **0,0021** | **0,645** | **COHORT_SPECIFIC_dlPFC_BULK_ONLY** ⚠️ |
| cg02451052 | chr3:32779158 | 1887 bp | 0,4311 | 0,040 | NULL_REGION |

- **Sonuç:** Sistematik tarama, **yalnızca cg20100151'i** bulk-doku-yalnız artefakt olarak işaretledi
  (1/9 prob); §2.5c'deki elle bulguyu **bağımsız ve otomatik olarak yeniden üretir.** Önemli ayrım:
  cg27108452 (p=0,016) ve cg02451052 (p=0,040) sorted-nöron OFC'de **nominal p<0,05** olsa da bulk
  dlPFC'de anlamlı **değil** (her ikisi de region-FDR≈0,43) → bunlar bulk-yalnız desen değildir, doğru
  şekilde NULL_REGION sınıflanır (tek-kohort nominal p, çoklu-test sonrası bölge-FDR<0,05'i geçmez).
  Yani pencerede **gözden kaçmış ikinci bir bulk-yalnız sahte sinyal yok.**
- Betik: `human/opioid/opioid_window_artifact_scan.py` · çıktı:
  `human/opioid/out/window_artifact_scan.json` (lokus başına 9-prob tam tablo + işaretlenen artefakt listesi
  + kohort tasarımları + tüm girdi SHA-256'ları; GSE98203 yerel veriden yerinde yeniden hesaplanır + pencere-içi
  BH-FDR, GSE164822 committed crossval JSON'dan aktarılır, GSE235818 bisülfit kapsam tek-geçişle aranır).
  Girdi SHA-256'ları: `region_probes…tsv`=`392cb339…`, `GSE98203_beta.txt.gz`=`21cd4b85…`,
  `GSE235818_Meth.csv.gz` ve GSE164822 committed (`GSE164822_M_final.txt.gz`=`8c8af12f…83ce568`) dâhil
  JSON'da tam liste.

#### 2.5e cg11308114 (EPIC'e özgü) — diziler-arası koordinat-tabanlı vekille 450K bağımsız kohortta test → **DOES_NOT_REPLICATE_VIA_PROXY**

§2.5d penceresinde tek bir prob, **cg11308114 (chr3:32780437, hedefe 608 bp)**, EPIC dizisine
**özgüdür** ve 450K'da aynı-prob olarak yer almadığı için tabloda **"(450K'da yok)"** kalmıştı —
yani 450K bağımsız kohort GSE98203'te hiç test edilememişti. Bu, alkol cg03301622 ile **birebir
aynı kör-noktadır**. Aynı **diziler-arası koordinat-tabanlı yakın-prob vekili** (alkol için yazılıp
artık `scripts/revize/realdata/crossarray_proxy.py` paylaşılan modülüne çıkarılan; alkol çıktısı
refaktör sonrası **bayt-bayt aynı**) burada da uygulanarak bu prob nihayet ölçüldü.

- **EPIC'e özgü kanıtı (otomatik doğrulandı):** cg11308114 EPIC.hg38 manifestinde **var**, GPL13534
  450K manifestinde **yok**, GSE98203 450K DMP'sinde **yok** → `EPIC-only`.
- **Vekil mantığı:** hg38 `chr3:32780437` → yerel UCSC chain (pyliftover) ile **hg19 `chr3:32821929`**'a
  lift edildi; bu anchor'ın **±2 kb**'inde GSE98203'te test edilmiş **8 adet 450K prob** bulundu. En
  yakın vekil-prob **cg03779035 (292 bp)**: Δβ=**+0,0017** (keşif yönü **hipo**; aynı_yön=**False**),
  **p=0,627**, pencere-FDR=0,716.
- **Yargı:** En yakın vekil-prob keşif yönünün **tersine** ve anlamsız → **DOES_NOT_REPLICATE_VIA_PROXY**.
  Bu, chr3:32781045 lokusunun §2.4/§2.5/§2.5b'deki **replike olmama** bulgusuyla tutarlıdır; artık
  penceredeki EPIC'e özgü prob da "ölçülemez" değil, **gerçek (vekil-düzeyi) negatif** sonuca sahiptir.
- **Betik:** `human/opioid/opioid_crossarray_proxy_validation.py` · çıktı:
  `human/opioid/out/opioid_crossarray_proxy_validation.json` (EPIC-only kanıtı + liftover meta +
  pencere-vekili tam tablo + tüm girdi SHA-256'ları). Girdi SHA-256'ları (JSON'da tam):
  `GSE98203_dmp.csv`=`458c6bca…632487`, `region_probes_chr3_32781045_hg38.tsv`=`392cb339…5ff877`,
  `GPL13534_manifest.csv.gz`=`df3d5009…452c33`,
  `hg38ToHg19.over.chain.gz`=`14a712e8…f587b1` (UCSC goldenPath/hg38/liftOver; pyliftover ile yerel/çevrimdışı).
- **Paylaşılan modül:** `crossarray_proxy.py` aynı kod yolunu alkol (`human/alcohol/alcohol_crossregion_independent_validation.py`)
  ve opioid betiklerinde kullanır; `delta_field`/pencere/FDR parametreleri çağıran betikten gelir, böylece
  alkol çıktısı korunurken opioid kendi `delta_beta_heroin_minus_control` alanını kullanır.

### 2.6 DAHA FAZLA madde için diziler-arası vekil taraması (metamfetamin · ketamin · esrar)

§2.1a (alkol) ve §2.5e (opioid) için yazılan diziler-arası koordinat-tabanlı yakın-prob vekili,
**diğer maddelere** sistematik olarak uygulandı. Aynı `crossarray_proxy.py` paylaşılan modülünü içe
aktaran tek bir **veri-güdümlü tarayıcı** (`human/crossarray_scan/crossarray_substance_scan.py`), her
madde için iki ön-koşulu **gerçek dosyalarla otomatik** doğrular: **(a)** aday marker EPIC'e özgü mü
(450K GPL13534 manifestinde aynı-prob olarak yok mu?), **(b)** aynı maddenin **bağımsız 450K kohort**
DMP tablosu var mı? Vekil yalnız her ikisi de sağlandığında çalışır; aksi halde **dürüst** bir yargı
(uydurma yok) yazılır. Her madde için `out/<madde>_crossarray_scan.json` + birleşik
`out/crossarray_scan_summary.json` üretilir (verdict + EPIC-only otomatik kanıt + girdi SHA-256).

- **Metamfetamin → `NO_EPIC_ONLY_CANDIDATE` (sonra aynı-prob testi).** EPIC keşfi **GSE293262**
  (kan, 4 vs 4, genom-çapı NULL) işlenmiş deposunda **482.420 prob** vardır ve bunların **tamamı** 450K
  manifestinde mevcuttur → **0 EPIC'e özgü prob** (otomatik kesişimle kanıtlandı). Yani metamfetaminde
  EPIC'e-özgü kör-nokta **hiç yoktur**; vekil gereksizdir. Bağımsız 450K kohort **GSE154971** (kan,
  16 vs 8, 398 DMP) **mevcut** olduğundan, keşfin lider adayı **cg13434263** (keşifte Δβ=−0,238, hipo)
  bu kohortta **aynı-prob** test edildi: GSE154971'de Δβ=**+0,0123** (yön **TERS**), t=0,22, **p=0,827**,
  FDR=0,982 → **DOES_NOT_REPLICATE**. *(Sınırlılık: keşif zaten genom-çapı NULL — q=0,16; bu, anlamlı
  bir lokusun değil, null dağılımın tepesinin testidir.)*
- **Ketamin → `NO_INDEPENDENT_450K_COHORT`.** EPIC keşfi **GSE287261** (PBMC, denek-içi paired, 16 DMP)
  **tam EPIC kapsamı** taşır → ilkesel olarak EPIC'e özgü aday içerebilir (kriter **(a)** sağlanabilir).
  Ancak GEO/ArrayExpress'te **bağımsız bir ketamin 450K kohortu yoktur**; tek kamuya açık ketamin
  metilasyon-dizi deposu GSE287261'in kendisidir (EPIC). Kriter **(b)** sağlanmadığından vekil
  **uygulanamaz** — eski-dizi karşılaştırma tablosu yok ve yargı bu nedenle değişmez.
  Yine de "ilkesel olarak EPIC'e özgü aday içerebilir" notunu **somut, otomatik-sayılan** bir sonuca
  dönüştürmek için per-prob DMP tablosu üretildi (`scripts/44_dmp_ketamine_gse287261.py` → seed/SHA-256
  sabitli `out/GSE287261_dmp.csv`) ve tarayıcı bunu okuyup her FDR<0,05 DMP'sinin EPIC'e-özgü durumunu
  450K (GPL13534) manifestine karşı otomatik denetler. **Kritik ayrıntı:** GSE287261 prob kimlikleri
  Illumina iplik/prob ekiyle gelir (ör. `cg07818869_BC11`, `…_TC21`); 450K manifesti ise **çıplak** IlmnID
  (`cgXXXXXXXX`) kullanır → üyelik testi ilk `_`'den önceki **temel CpG** üzerinden yapılır (aksi hâlde
  ekli her prob yanlışlıkla "450K'da yok" görünür). Sonuç: **16 anlamlı DMP'nin 9'u gerçekten EPIC'e özgü**
  (`cg04076721, cg04879680, cg04922513, cg06010208, cg06311747, cg08843968, cg12615022, cg22158582,
  cg24403159`), **7'si 450K dizisinde de mevcut** (`cg04276069, cg07818869, cg09626363, cg14957846,
  cg16714605, cg18037230, cg23092823`). Bu 9 prob, ileride bir 450K ketamin kohortu çıkarsa aynı-prob
  ile **doğrulanamayacak** olan markerlerdir. Sayılar `ketamine_crossarray_scan.json` →
  `epic_only_check.{n_sig_dmps=16, n_epic_only_among_sig_dmps=9, n_sig_dmps_also_on_450k=7}` alanlarında;
  girdi SHA-256: `GSE287261_dmp.csv`=`0c10f512…23d58`, `GPL13534_manifest.csv.gz`=`df3d5009…2452c33`.
- **Esrar → `NO_INDEPENDENT_450K_COHORT`.** **GSE255929** (kan, EPIC, n=93) kendi EWAS'ı **confounded**
  olduğu için **atılmıştır** (S1/S2 grubu yaş/cinsiyet alt-kohort karıştırıcısı; `*_CONFOUNDED.csv`) →
  güvenilir bir kendi-aday markeri yok. Ayrıca bağımsız bir **esrar 450K kohortu da yoktur**. Hem (a) hem
  (b) sağlanmaz; yayınlanmış sonuçlar (PMID 40205553) kullanılır (`CANNABIS_NOTE.md`).
- **Özet (zero-hallucination):** "Daha fazla maddeyi de tara" talebinin **dürüst** sonucu, alkol ve
  opioid dışında diziler-arası vekili **gerçekten gerektiren yeni bir madde olmadığıdır** — ya EPIC'e
  özgü aday yoktur (metamfetamin: EPIC deposu 450K-eşdeğeri), ya da bağımsız 450K kohort yoktur (ketamin,
  esrar). Bu negatif bulgu pozitiflerle aynı titizlikle, otomatik-doğrulanabilir kanıtla raporlanır.
- **Betik:** `human/crossarray_scan/crossarray_substance_scan.py` (kayıt-defteri tabanlı; yeni madde tek
  girişle eklenir — (a)+(b) sağlanırsa `crossarray_proxy.lift_hg38_to_hg19`+`build_window` dalı tetiklenir).
  Çıktı: `human/crossarray_scan/out/{methamphetamine,ketamine,cannabis}_crossarray_scan.json` +
  `crossarray_scan_summary.json`. Girdi SHA-256'ları (metamfetamin) JSON'da:
  `GSE293262_processed_data_Meth.csv.gz`=`ce749275…a5abba`, `GSE154971_dmp.csv`=`820840ae…972d1e`,
  `GPL13534_manifest.csv.gz`=`df3d5009…452c33`.


---

## 3. Kuyrukta / ertelenen gerçek setler (veri var, henüz raporlanabilir sayı yok)

- **Kokain — beyin striatum, GSE182585 (bisülfit):** Veri mevcut, ancak GEO depozitinde
  **örnek-id ↔ grup eşlemesi tutarsız**: series başlıkları tek sayı (1,3,5…), 5x kapsam matrisinin
  sütun id'leri çift sayı (2,4,…) → **kesişim = 0**. Çift id'ler tam olarak eşlik eden kaudat
  çalışmasının (GSE137364) başlıklarına denk geliyor. Doğrulanabilir bir id→grup kuralı kurulamadığı
  için **ertelendi** (tahminle eşleme = uydurma riski). Çözüm: orijinal makale ek dosyalarından/
  yazarlardan eşleme doğrulanınca analiz edilecek.
- **Ketamin — GSE287261 ve reçeteli opioid — GSE151485:** ✅ artık ANALİZ EDİLDİ (denek-içi paired,
  §1A tablosu) → kuyruktan çıktılar. Ketamin 16 DMP; reçeteli opioid 0 DMP (dürüst null, n=32).
  *(Önceki rapor "ketamin/opioid: veri yok" diyordu — bu artık tümüyle geçersiz.)*

### 3.1 Metamfetamin — GSE293262 (insan, kan) → NULL
- 4 metamfetamin vs 4 kontrol, Illumina EPIC beta değerleri, detection-p QC.
- 484.864 prob test edildi; FDR<0.05 = 0; en küçük q = 0,163.
- **Yorum:** n=8 ile güç çok düşük; dürüst NULL. Sahte "anlamlı" üretilmedi.
- Betik: `human/meth/meth_dmp.py` · çıktı: `human/meth/out/GSE293262_meth_dmp.json`

### 3.2 Opioid (OUD) — GSE235818 (insan, OFC nöronları) → NULL (Welch-% ilk taramada 1 DMP; dispersiyon-duyarlı yeniden testte NOT_CONFIRMED)
- 12 OUD+ vs 26 OUD−, NeuN+ nöron çekirdekleri, bisülfit-dizileme (% metilasyon), 1.844.968 pozisyon.
- Grup-kör saptanabilirlik filtresi (≥19/38 örnekte sıfırdan farklı & std>0) → 383.235 pozisyon test edildi.
- **chr3:32781045**: OUD'da **−2,3 puan hipometilasyon**, p=2,0×10⁻⁸, **q=0,0076**. Ham doğrulama: kontrollerin 22/26'sı ≈%1,3–4,9 metile; vakaların 11/12'si tam %0 — tek bir outlier değil, tutarlı sinyal.
- **Sınırlılık:** Matris yalnızca % metilasyon içerir; per-site okuma derinliği beta yüzdelerinden tam-kesir geri-kazanımıyla yeniden üretildi (max hata 5,7×10⁻¹⁴ %, muhafazakâr alt sınır). % üzerinde t-test bir yaklaşımdır; etki küçük.
- **Güncelleme — coverage-ağırlıklı + DSS dağılım-küçültmeli yeniden test (§2.4):** Bu Welch-% bulgusu okuma derinliği + replika aşırı-dağılımını yok sayar. İki bağımsız dağılım-duyarlı testte **doğrulanmadı**: methylKit-tarzı aşırı-dağılımlı F (genom-çapı q=1,0) **ve** DSS-tarzı dağılım-küçültmeli beta-binom Wald (within-group Williams dispersiyonu → genom-çapı ortalama-dispersiyon eğiliminden ampirik-Bayes küçültme; aday rho_shrunk=0,00015; **genom-çapı 0 DMP, chr3:32781045 q=0,159**). Sonuç: **NOT_CONFIRMED** — orijinal tek-hit yüzde-yaklaşımının artefaktıdır (ayrıntı ve betik §2.4'te).
- Betik: `human/opioid/opioid_dmp.py` (Welch-%) + `human/opioid/opioid_coverage_dmp.py` (coverage + DSS) · çıktı: `human/opioid/out/GSE235818_opioid_dmp.json`, `.../GSE235818_opioid_coverage_dmp.json`

### 3.3 Opioid (akut/kronik) — GSE164822 (insan, dlPFC) → NULL
- 72 Opioids vs 28 Normal Control (53 "Psych Control" birincil kontrasttan dışlandı), postmortem dlPFC, EPIC M-değerleri.
- **Kovaryat-ayarlı model:** `M ~ grup(Opioids) + yaş_z + PMI_z + cinsiyet(E=1) + ırk(CAUC=1)`; df=94, 6 model parametresi.
- 864.883 prob test edildi; FDR<0.05 = 0; FDR<0.10 = 0; en küçük q = **0,581** (cg17452254).
- **Not:** Ayarsız Welch t'de min q = 0,106 idi; kovaryat ayarı sonucu **daha da NULL** yaptı — yani ayarsız "kıl payı" görünüm gerçek sinyal değil, karıştırıcılara bağlı görünür bir etkiydi.
- **Sınırlılık:** Tek doku (dlPFC); hücre-tipi kompozisyonu ayarlanmadı (referans-tabanlı beyin dekonvolüsyonu numpy/scipy hattında yok; referanssız SVA anti-konservatif olduğu için reddedildi). M-değeri = log2(M/U).
- **Güç/FPR kalibrasyonu (dizi spike-in — NULL'ın anlamı):** EPIC'te okuma sayısı yok; bu yüzden GSE235818 beta-binom hattının **dizi-karşılığı** olarak prob-başına **gerçek artık-SD'li Gauss spike-in** kuruldu (M-değeri sınırsız → **kırpma yok**; gerçek prob gürültüsü korunur, yalnız bilinen gruplar-arası fark delta enjekte edilir). Aynı kovaryat-ayarlı OLS + BH-FDR; sabit seed=20260614 + girdi SHA-256; committed JSON'la **drift yok** (min q=0,581429, 0 DMP). **Sonuçlar:** gerçek artık-SD medyanı 0,266 M, n=72 vs 28'de güç 0,2 M farkta 0,30; 0,3 M'de 0,65; 0,5 M'de 0,91; 1,0 M'de 0,99 (tüm tabakalar). Orta-metilasyon tabakasında **≥%80 güce ulaşılan en küçük etki (MDE) = 0,5 M.** Tam null altında genom-çapı **yanlış-pozitif oranı FDR<0,05'te 0** (0/864.883 ortalama) → test iyi kalibre. Yani GSE164822 dlPFC opioid NULL'ı "burada ~0,5 M üstünde saptanabilir etki yok" demektir.
- **Mis-spesifik (kötümserci "daha gürültülü gerçek dünya") gürültü altında sağlamlık:** Aynı hat, veri-üreten artık-SD **kasıtlı şişirilmiş** dört senaryoda (x1 temel, 2×, 5×, ve site-bazlı muhafazakâr **sabit taban resid_sd≥0,5 M** [sitelerin %91'i]) yeniden çalıştırıldı; **test her tekrarda varyansını simüle edilen veriden yeniden tahmin eder** (gerçek/şişirilmiş gürültüyü "oracle" olarak bilmez — mis-spesifikasyon tam da budur). **Sonuç — başlık bulgular sağlam:** orta-metilasyon MDE 0,5 M (x1) → 0,75 M (sabit taban) / 1,0 M (2×) / >1,5 M ulaşılamadı (5×); 1,0 M etkide güç 0,99 (x1) → 0,20 (5×). Genom-çapı null FPR **her şişirmede 0** kalır (FDR<0,05) — GSE235818 DSS'in tersine OLS varyans kestirimi **yansız** olduğundan kötü gürültü **güç kaybettirir ama sahte pozitif üretmez.** NULL bir **güç kısıtıdır**, iyimser gürültü varsayımının artefaktı değil.
- Betik: `human/opioid/opioid_acute_dmp.py` · çıktı: `human/opioid/out/GSE164822_opioid_acute_dmp.json`
- Güç/FPR + sağlamlık betikleri: `human/opioid/opioid_gse164822_power_fpr_sim.py` (cache + sim) + `human/opioid/opioid_gse164822_power_fpr_misspec.py` (run NAME / assemble) · çıktı: `human/opioid/out/GSE164822_opioid_power_fpr.json` + `..._power_fpr.png` + `..._power_fpr_misspec.json` (4 senaryonun güç-vs-delta tabloları, MDE'leri, null FPR'leri + committed iyi-spesifik JSON ile karşılaştırma)

### 3.4 Sigara / nikotin — GSE147040 (insan, NAc) → NULL
- 53 Smoker vs 168 Nonsmoker, postmortem nucleus accumbens, EPIC ham yoğunluk → beta = M/(M+U+100), detection p≤0,01.
- **Kovaryat-ayarlı model:** `beta ~ grup(Smoker) + yaş_z + cinsiyet(E=1) + soy(CAUC=1)`; df=216, 5 model parametresi. (PMI `series_matrix`'te verilmemiş.)
- 850.934 prob test edildi (15.157 prob eksik veri/detection-NaN nedeniyle düşürüldü); FDR<0.05 = 0; FDR<0.10 = 0; en küçük q = **0,999986** (çok güçlü NULL).
- **Yorum:** Sigaranın güçlü metilasyon imzaları (örn. AHRR/cg05575921) **kan ve akciğere özgüdür**; beyin (NAc) dokusunda sinyal pratikte yok. Bu, dokuya-özgüllüğün beklenen sonucudur — kan-temelli imzaları beyne taşıma hatasına düşülmedi.
- **Güç/FPR kalibrasyonu (dizi spike-in — NULL'ın anlamı):** EPIC'te okuma sayısı yok → prob-başına **gerçek artık-SD'li Gauss spike-in** (GSE235818 beta-binom hattının dizi-karşılığı; gerçek beta gürültüsü korunur, yalnız delta enjekte, [0,1]'e kırpılır). Veri kaynağı GEO işlenmiş-beta serisi (856.909 prob; ham U/M yoğunluk ek-dosyası repoda yok — aynı veri/aynı NULL, **drift** FDR<0,05'te 0 DMP teyit eder, min q=0,999982). Aynı kovaryat-ayarlı OLS + BH-FDR; sabit seed=20260614 + girdi SHA-256. **Sonuçlar:** gerçek artık-SD medyanı 0,0278 beta, n=53 vs 168'de güç 2 puanda 0,59; 3 puanda 0,80; 5 puanda 0,96; 10 puanda 1,0. Orta-metilasyon **MDE = 0,04 beta (4 puan).** Tam null genom-çapı **FPR FDR<0,05'te 0** → iyi kalibre. NULL "burada ~4 puan üstünde saptanabilir sigara etkisi yok" demektir (kan/akciğer imzasının beyin-NAc'ta yokluğuyla tutarlı).
- **Mis-spesifik (kötümserci "daha gürültülü gerçek dünya") gürültü altında sağlamlık:** Veri-üreten artık-SD **kasıtlı şişirilmiş** dört senaryo (x1 temel, 2×, 5×, ve site-bazlı muhafazakâr **sabit taban resid_sd≥0,05 beta** [sitelerin %84'ü]); **test her tekrarda varyansını simüle edilen veriden yeniden tahmin eder** (oracle değil). **Sonuç — başlık bulgular sağlam:** orta-metilasyon MDE 0,05 beta (x1) → 0,10 beta (2×) / >0,10 beta ulaşılamadı (5×) / 0,05 beta (sabit taban); 5 puanlık etkide güç 0,96 (x1) → 0,29 (5×). Genom-çapı null FPR **her şişirmede ~0** (≤3,9×10⁻⁷) kalır — OLS varyans kestirimi **yansız**; kötü gürültü güç kaybettirir, sahte pozitif üretmez. NULL bir **güç kısıtıdır**, iyimser gürültü varsayımının artefaktı değil.
- Betik: `human/smoking_nac/smoking_nac_dmp.py` · çıktı: `human/smoking_nac/out/GSE147040_smoking_nac_dmp.json`
- Güç/FPR + sağlamlık betikleri: `human/smoking_nac/smoking_nac_power_fpr_sim.py` (cache + sim) + `human/smoking_nac/smoking_nac_power_fpr_misspec.py` (run NAME / assemble) · çıktı: `human/smoking_nac/out/GSE147040_smoking_nac_power_fpr.json` + `..._power_fpr.png` + `..._power_fpr_misspec.json` (4 senaryonun güç-vs-delta tabloları, MDE'leri, null FPR'leri + committed iyi-spesifik JSON ile karşılaştırma)

### 3.5 MDMA — GSE68199 (fare, kalp) → NULL
- MeDIP promotör (TSS ±2 kb maks peak) gen-düzeyi; 3 kontrast; tümü FDR<0.05 = 0; en küçük q = 0,067.
- Betik/çıktı: `nonhuman/.../GSE68199_mdma_mouse_dmp.json`

### 3.6 Kokain — GSE66348 (sıçan, NAc) → NULL
- Nucleus accumbens, 419.679 prob; 2 kontrast; tümü FDR<0.05 = 0; en küçük q = 0,096.
- Betik/çıktı: `nonhuman/.../GSE66348_cocaine_rat_dmp.json`

---

## 4. Gerçekten "veri yok" (zero-hallucination sınırları) — KESİN YANIT

**Soru:** "Hiç DNA-metilasyon verisi bulunmayan madde var mı?"
**Yanıt: EVET, var.** Aşağıdaki maddeler için kamuya açık, kullanılabilir **insan** metilasyon dizi
verisi canlı GEO/ArrayExpress taramasında **bulunamadı**; bu nedenle bu maddeler için hiçbir DMP
sayısı üretilemez ve uydurma yapılmadı. Bu, "aramadık" değil, "arandı ve kamuya açık veri yok"
demektir (negatif bulgu, pozitiflerle aynı titizlikle raporlanır).

### 4A. İnsan metilasyon verisi BULUNAMAYAN maddeler (madde-spesifik EWAS yok)

| Madde / sınıf | Canlı tarama sonucu | Not |
|---|---|---|
| MDMA / ecstasy | İnsan EWAS **yok** | Yalnız hayvan: fare-kalp GSE68199 (MeDIP, null) — insan değil |
| LSD | İnsan EWAS **yok** | Psikedelik metilasyon dizisi kamuya açık değil |
| Psilosibin | İnsan EWAS **yok** | Klinik denemeler var ama metilasyon dizisi paylaşılmadı |
| GHB | İnsan EWAS **yok** | — |
| Sentetik kannabinoidler ("bonzai" / Spice) | İnsan EWAS **yok** | NPS kimyası ayrı modülde gerçek (REPORT.md §4.11 modül 4/8) ama bu **metilasyon değil** |
| Sentetik katinonlar ("bath salts") | İnsan EWAS **yok** | NPS — kimya var, metilasyon yok |
| Uçucular / inhalanlar (toluen vb.) | İnsan EWAS **yok** | — |
| PCP (fensiklidin) | İnsan EWAS **yok** | — |
| Benzodiazepinler | İnsan **madde-spesifik** EWAS **yok** | Karışık ilaç kohortlarında ayrıştırılamıyor |
| Barbitüratlar | İnsan EWAS **yok** | — |

### 4B. Erişilemeyen / var-olmayan birleşik kaynaklar

- **Birleşik 10.542 örnek / 7-sınıflı set:** makalenin iddia ettiği bu birleşik set kamuya açık
  değil / indirilebilir değil → yeniden üretilemez.
- **dbGaP / Framingham:** erişim-kısıtlı; açık veri yok.

> **Özet:** Metilasyon verisi **olan** maddeler (analiz edildi/null): sigara, alkol, kokain,
> metamfetamin, opioid/eroin, reçeteli opioid, enjeksiyon (IDU), esrar, ketamin. Metilasyon verisi
> **olmayan** maddeler: yukarıdaki 4A listesi (MDMA, LSD, psilosibin, GHB, sentetik kannabinoid/
> katinon, inhalanlar, PCP, benzodiazepin, barbitürat). Sınır net çizildi; hiçbir yerde uydurulmadı.

---

## 5. Ortak yöntem ve yeniden üretilebilirlik

- **Test:** Beta/M veride yaş(z)+cinsiyet+sigara (ve uygunsa doku/madde-özel) kovaryatlı **OLS** +
  **Benjamini-Hochberg FDR**; çok küçük/yaş yok kohortlarda Welch t. Bisülfit/yoğunlukta
  **NaN-duyarlı** (detection-p / kapsam ile maskelenen hücreler dışlanır).
- **Tekil-tasarım koruması:** Tüm yeni betikler ilgi-değişkenini (madde) **her zaman koruyan**,
  sabit veya eşdoğrusal kovaryatları otomatik düşüren **tam-rank tasarım kurucusu** kullanır
  (`np.linalg.matrix_rank` ile); düşen terimler JSON'da `dropped_terms` olarak kayıtlı.
- **Grup ataması:** GEO `series_matrix` `!Sample_*` alanlarından; **fail-closed** — matris sütun
  id'leri ile grup etiketleri doğrulanabilir biçimde eşleşmiyorsa betik durur, tahmin yapmaz
  (GSE182585 bu nedenle ertelendi).
- **Coverage-ağırlıklı bisülfit testi (GSE235818, §2.4):** % metilasyon yalnızca verildiğinde,
  okuma sayıları (M/N) beta yüzdelerinden tam olarak geri kazanılır
  (`Fraction.limit_denominator`; geri-kazanım hatası ≈5,7×10⁻¹⁴ %, muhafazakâr alt sınır), ardından
  methylKit-tarzı overdispersed-F + beta-binomyal MLE uygulanır.
  Betik: `human/opioid/opioid_coverage_dmp.py` · çıktı:
  `human/opioid/out/GSE235818_opioid_coverage_dmp.json` (geri-kazanım hatası ve SHA-256 dahil).
- **Bellek-güvenli akış:** ≥1 GB matrisler/bisülfit dosyaları satır-bloklarıyla işlenir.
- **Büyük setler:** GitHub Actions üzerinde çalıştırıldı — human-batch `.github/workflows/dmp.yml`
  (run 27477783580), batch-2 `.github/workflows/dmp2.yml` (run **27479529130**). Sonuç JSON'ları
  repoya geri commit'lendi; ara ham veri repoya konmaz.
- **İzlenebilirlik:** Her çıktı JSON'unda girdi dosyalarının **SHA-256** özetleri kayıtlı; hesaplar
  deterministik (rastgele tohum gerekmeyen testler) veya sabit-seed.
- **GEO erişim kodları (insan):** GSE50660, GSE110043, GSE49393, GSE252501, GSE77056, GSE154971,
  GSE293262, GSE100264, GSE98203, GSE235818, GSE164822, GSE137364, GSE147040, GSE255929.
  Hayvan: GSE68199, GSE66348. Yayın kaynaklı: PMC9979153 (opioid-kan).
- Tüm hesaplar **deterministiktir** (Welch t veya kovaryat-ayarlı OLS + BH-FDR; rastgele tohum gerekmez).
- Büyük EPIC setleri (GSE164822, GSE147040) yerelde tek-çekirdek gz açma (~74 sn taban) + paralel ayrıştırma ile çalıştırıldı; ebeveyn çözücüye bir çekirdek bırakmak için `NPROC=7`. 1 GB matrisin SHA-256'sı `MATRIX_SHA256` ile geçilebilir (Actions'ta gerekmez); paralel motor seri ile bit-bit özdeş doğrulandı.
- Ortak motor: `scripts/revize/realdata/human/_stream_dmp.py`.
