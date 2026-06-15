# Gerçek, Yeniden Üretilebilir Yeniden Analiz — Şeffaflık Raporu

**Tarih:** 12 Haziran 2026
**Amaç:** `scripts/revize` içindeki epigenetik makalenin uydurma (sentetik) veri ve
sonuçlarının yerine, **halka açık gerçek GEO verisi** ve **kendi yeniden üretilebilir
kodumuzla** hesaplanmış gerçek sonuçlar koymak. Tüm sayılar ya gerçek kaynaktan ya da
sabit-seed'li, committed betikten gelir. Yeniden üretilemeyen her şey açıkça beyan edilmiştir
(Zero-Hallucination Policy, `replit.md`).

> **Nihai teslimat:** Bu raporun bulgularına dayanan kısa, yeniden üretilebilir IMRaD özeti
> `MAKALE_GERCEK.md` dosyasındadır. Teslim edilen tam makale ise `scripts/revize/makale.txt`
> üzerinde **yerinde düzeltilerek** hazırlanır (fabrikasyon temizliği + gerçek EPİCLOCK
> modüllerinin §2.4'e entegrasyonu) ve `build/build.cjs` ile `build/makale_revize.docx` olarak
> derlenir; fabrikasyon→gerçek eşlemesi bu rapordadır.

---

## 1. Neden bu yeniden analiz gerekti (fabrikasyon kanıtı)

Orijinal makale "15 veri setinden 10.542 DNA metilasyon profili, 7 madde sınıfı, 1.847 CpG
imzası, %87.3 sınıflandırma doğruluğu" iddia ediyordu. Doğrulama:

- Repoda **hiçbir metilasyon verisi yok** ve **hiçbir analiz/istatistik betiği yok** (yalnızca
  figür çizen ve docx kuran kod vardı). Yani GO/KEGG/RF sayıları hiçbir hesaba dayanmıyordu.
- Makalede kaynak gösterilen **14 accession'ın tamamı** canlı olarak NCBI/EBI/PMC'den
  sorgulandı (`scripts/11_verify_cited_sources.py`, ham yanıtlar `out/cited_raw/`,
  özet `out/cited_sources_verification.json`). **Hiçbiri makalenin iddia ettiği veri/sayı
  değildir.** Tablo 1'in tamamı uydurma veya yanlış etiketlidir:

| Makale Tablo 1 iddiası | GERÇEK kimlik (canlı doğrulandı) | GERÇEK n | Madde verisi mi? |
|---|---|---|---|
| GSE110043 — Alkol, EPIC, 732 | Alkol tüketimi EWAS, tam kan, **450K** | **94** | ✅ Evet (n uydurma; 732 aslında GSE87571'in N'si) |
| GSE181817 — Kokain, 1030 | Solid tümör hücre durumları atlası | 6 | ❌ Hayır |
| GSE149229 — Metamfetamin, 48 | **Fare** karaciğeri fenobarbital deneyi | 28 | ❌ Hayır (insan bile değil) |
| GSE112987 — Alkol/FASD, 96 | Fetal Alkol Spektrum Bozukluğu | 103 | ⚠️ Alkol ama **prenatal maruziyet** |
| GSE105018 — Çoklu madde, 394 | E-Risk ikiz çalışması (yaş 18) | 1658 | ❌ Hayır |
| GSE49393 — Alkol beyin, 24 | **AUD postmortem prefrontal korteks** | **48** | ✅ **Evet** (n uydurma) |
| GSE80261 — Alkol BA9, 48 | Fetal alkol spektrum bozukluğu imzası | 216 | ⚠️ Alkol ama **prenatal maruziyet** |
| GSE125105 — Opioid beyin, 36 | Depresyon kan (MPIP) | 699 | ❌ Hayır |
| GSE87571 — (referans) | İnsan metilomunun yaşlanması | 732 | ❌ Hayır (N'si GSE110043'e atfedilmiş) |
| GSE154566 — (referans) | Ergen mağduriyeti ikiz metilasyonu | 1177 | ❌ Hayır |
| E-MTAB-5738 — Kontrol, 2687 | Skuamöz hücreli karsinom alt sınıfları | — | ❌ Hayır |
| E-MTAB-7309 — Alkol+Sigara, 456 | SATSA ikiz yaşlanma | — | ❌ Hayır |
| E-MTAB-10888 — Karışık, 234 | İnsan yolk sac fetal gelişim | — | ❌ Hayır |
| PMC9979153 — Opioid, 1240 | **Gerçek opioid kan EWAS meta-analizi** (Epigenomics 2022;14(23):1479-1492, PMID 36700736) | **282 kullanıcı / 10.560 kontrol** | ✅ **Evet** (n uydurma) |
| EWAS Hub-1/2/3 (alkol/kannabis/kontrol) | EWAS Data Hub'da bu N'lerle hazır "madde" alt kümesi mevcut değil | — | ⚠️ Doğrulanamadı |

- Ek ipucu: makale "en anlamlı CpG" olarak alkole **cg05575921** atamış; bu literatürdeki en
  ünlü **sigara** CpG'sidir (AHRR). Bu hem fabrikasyonu doğrular hem de bize yer-gerçeği verir.
- **Önemli:** Bu doğrulama, makalenin gizlediği **iki gerçek madde kaynağını** ortaya çıkardı —
  GSE49393 (gerçek alkol beyin) ve PMC9979153 (gerçek opioid kan). İkisi de aşağıda işlendi.

## 2. Gerçek veri manzarası (canlı GEO envanteri)

NCBI E-utilities ile "insan + metilasyon + madde" araması. Sonuç: halka açık veri **sigara/
tütün** tarafından domine ediliyor; kokain/opioid/metamfetamin/esrar için ise yalnızca
**küçük** kohortlar var ve çoğu farklı doku/platform. Birleşik "7 sınıf / 10.542 örnek / %87.3"
kurgusu birebir yeniden üretilemez. Bunun yerine her madde için bulunabilen **en iyi gerçek
kohort ayrı ayrı** analiz edildi (aşağıda madde-madde).

## 3. Bu çalışmada kullanılan gerçek veri

| Dosya | İçerik | n | SHA-256 |
|---|---|---|---|
| `GSE50660_series_matrix.txt.gz` | Sigara EWAS, periferik kan, 450K (referans/yer-gerçeği) | 464 | `e8a2829b…2fed2dc` |
| `GSE110043_series_matrix.txt.gz` | Alkol EWAS, tam kan, 450K | 94 | `3f556b85…b4d22c` |
| `GSE49393_series_matrix.txt.gz` | Alkol (AUD), **postmortem beyin** (prefrontal korteks), 450K | 48 | `09fc6b43…2ceca0` |
| `GSE77056_series_matrix.txt.gz` | Kokain/crack bağımlılığı, tam kan, 450K | 47 | `f4d18426…5ac486ed` |
| `GSE154971_series_matrix.txt.gz` | Metamfetamin bağımlılığı, periferik kan lenfositi, 450K | 24 | `6c47e245…2fe07cbda` |
| `GSE98203_beta.txt.gz` | Opioid/eroin, **postmortem beyin** (orbitofrontal korteks nöron çekirdekleri), 450K | 65 | `21cd4b85…3c466a05` |
| `GSE41826_series_matrix.txt.gz` | **Postmortem beyin** (frontal korteks, NeuN nöron/glia), 450K — PMI stabilite (modül 7); PMI 4–34s | 58+58 | `40694e6d…c92dc247` |
| `GSE255929_series_matrix.txt.gz` | Esrar, kan (EPIC/850K) — **karışımlı, atıldı** | 93 | `41e3530e…422c98` |
| `GPL13534_manifest.csv.gz` | Resmi Illumina 450K manifesti (CpG→gen) | — | `df3d5009…452c33` |
| `horvath2013_coef.csv` | Horvath 2013 (Genome Biology) 353-CpG saat katsayıları | — | `1d028d6a…65f88c` |
| `clocks/Hannum.csv` | Hannum 2013 (Mol Cell) 71-CpG saat katsayıları (biolearn deposu) | — | `f37744fa…d37a88` |
| `clocks/PhenoAge.csv` | Levine 2018 (Aging) PhenoAge 513-CpG katsayıları + intercept 60.664 (biolearn) | — | `a5a6b4e4…96dcd9` |

Tüm SHA-256'lar `data/manifest.json` ve betik çıktılarında kayıtlı.

## 4. Madde madde GERÇEK bulgular (her sayı bizim hesabımız)

### 4.1 Sigara — GSE50660 (450K, kan, 22 güncel vs 179 hiç) — REFERANS
- **DMP:** yaş+cinsiyet düzeltmeli OLS + BH-FDR → **FDR<0.05'te 89 CpG**.
- **Yer-gerçeği:** cg05575921 (AHRR) **1. sıra, p=2.4e-55**; tüm kanonik sigara CpG'leri
  (cg21566642 #2, F2RL3 #4, cg05951221 #6, cg06126421 #7) en üstte → boru hattı doğru.
- **GO-BP:** FDR<0.05'te **2 terim** (Rho protein sinyali GO:0035025; MAPK kaskadı GO:0043410).
- **KEGG:** 98 yolak, FDR<0.05'i geçen **yok** (dürüst null; 51 genle güç düşük).
- **Sınıflandırıcı:** sızıntısız RF, 5-kat CV → **ROC-AUC=0.95**, permütasyon p=0.016;
  dengesizlik (22/179) nedeniyle dengeli doğruluk 0.57, duyarlılık 0.14, özgüllük 0.99 dürüstçe.
- **Horvath saati:** DNAmAge ↔ yaş **r=0.77 (p=1.4e-90), MAE=3.5 yıl**; yaş hızlanması
  sigaraya göre **anlamlı değil** (Welch p=0.24, dürüst null).

### 4.2 Alkol — GSE110043 (450K, tam kan, 94: içen vs içmeyen)
- **DMP:** cinsiyet düzeltmeli OLS + BH-FDR → **FDR<0.05'te 4.387 CpG**.
- **Önemli sınırlılık:** bu kohortta **sigara için düzeltme yapılamadı** (kovaryat yalnız
  cinsiyet). Yoğun alkol kullanımı sigara ile güçlü birlikte gittiğinden bu liste **keşifsel
  ve büyük olasılıkla sigara-karışımlı**; saf alkol etkisi olarak sunulamaz. Yolak/saat
  analizi bu sınırlılık nedeniyle bu turda yapılmadı (dürüst beyan).

### 4.2b Alkol (BEYİN) — GSE49393 (450K, postmortem prefrontal korteks, 48: 23 AUD vs 25 kontrol)
- Makalenin "GSE49393 Alkol n=**24**" diye gösterdiği set; gerçekte **n=48** (canlı doğrulandı).
  Gerçek EWAS'ı bu turda kendimiz hesapladık (`12_dmp_alcohol_brain.py`).
- **DMP:** yaş+cinsiyet düzeltmeli OLS + BH-FDR → **FDR<0.05'te 8 CpG** (430.407 prob test edildi).
  En üst: cg00393248 (Δβ=+0.051, p=9.3e-08).
- **Sigaradan temiz:** kanonik sigara CpG'leri anlamsız (AHRR cg05575921 sıra ≈169.000) → bu
  beyin alkol imzası, kan kohortlarının aksine sigara-karışımlı **değil**.
- **GO-BP:** 2 terim (endotel hücre göçü, intrinsik apoptotik sinyal); **KEGG:** 9 terim.
  **Uyarı:** yalnız 3 genden geldiği için her terim **tek-gen örtüşmeli → istatistiksel olarak
  kırılgan/düşündürücü** (opioid-beyindeki gibi).
- **Horvath saati (beyin):** DNAmAge↔yaş **r=0.796 (p=1.4e-11), MAE=6.5 yıl**; yaş hızlanması
  AUD vs kontrol **anlamlı değil** (vaka −0.43 vs kontrol +0.39, Welch p=0.29, dürüst null).

### 4.3 Kokain/crack — GSE77056 (450K, tam kan, 47: 23 vs 24)
- **DMP:** yaş+cinsiyet düzeltmeli → **FDR<0.05'te 11.987 CpG** (485.577 prob test edildi).
  Sigara-karışım kontrolü `out/GSE77056_validation.json` içinde raporlandı.
- **GO-BP:** 4.121 terim, FDR<0.05 **yok** (gen listesi en anlamlı 1.500 ile sınırlandı).
- **KEGG:** **14 yolak FDR<0.05** — HPV enfeksiyonu (FDR=0.005), prostat kanseri, insülin
  sinyali, **hücresel yaşlanma**, akut miyeloid lösemi, Hippo, Wnt, meme/endometrium/tiroid
  kanseri. (Geniş gen listesiyle yorum temkinli yapılmalı.)
- **Horvath saati:** r=0.435 (p=0.0022), MAE=12.3 yıl — kohort yaşı dar (23–29) olduğundan
  korelasyon zayıf. Yaş hızlanması **anlamlı değil** (vaka −0.34 vs kontrol +0.32, Welch p=0.57).

### 4.4 Metamfetamin — GSE154971 (450K, periferik kan lenfositi, 24: 16 vs 8)
- **DMP:** cinsiyet düzeltmeli → **FDR<0.05'te 398 CpG** (yaş GEO'da yok).
- **GO-BP & KEGG:** her ikisinde de FDR<0.05 **yok** (n=24 çok küçük; dürüst null). En üst —
  anlamsız da olsa — nöronal temalar: akson kılavuzu, semaforin-pleksin, Rap1/Ras sinyali.
- **Horvath saati:** GEO depozitinde **kronolojik yaş YOK** → saat doğrulanamaz, yaş
  hızlanması iddiası **yapılmadı** (DNAmAge yalnız şeffaflık için listelendi).

### 4.5 Opioid/eroin — GSE98203 (450K, **postmortem BEYİN**, 65: 37 eroin vs 28 kontrol)
- **DMP:** yaş düzeltmeli → **FDR<0.05'te 12 CpG** (456.513 prob). AHRR anlamlı **değil** →
  bu beyin imzası sigaradan **temiz** (kan kohortlarının aksine).
- **GO-BP:** 135 terim, **25 FDR<0.05** — tümü **sinaptik/nöronal** (sinaptik vezikül
  tomurcuklanması, sinaptik plastisite pozitif düzenlenmesi, nörotransmiter reseptör
  internalizasyonu). **Uyarı:** yalnız ~12 genden geldiği için her terim **tek-gen örtüşmesiyle**
  (1/5–1/8) sürükleniyor → biyolojik tema güçlü ama istatistiksel olarak **kırılgan/düşündürücü**.
- **KEGG:** 81 terim, **1 FDR<0.05** (kalsiyum geri emilimi); "Kokain bağımlılığı" yolağı
  p=0.12 (anlamsız) olarak göründü.
- **Horvath saati (beyin):** DNAmAge ↔ yaş **r=0.906 (p=3.7e-25), MAE=10.8 yıl** → pan-doku
  saat beyinde çok iyi çalışıyor (MAE ofseti beyin dokusu için bilinen bir durum). Yaş
  hızlanması eroin −0.64 vs kontrol +0.84, **anlamlı değil** (Welch p=0.18, dürüst null).
- **Tamamlayıcı gerçek opioid KAN kaynağı (PMC9979153):** makalenin "n=1240" diye yanlış
  gösterdiği bu atıf, aslında gerçek bir **opioid kan EWAS meta-analizidir** (Epigenomics
  2022;14(23):1479-1492, PMID 36700736, DOI 10.2217/epi-2022-0353): **282 ilaç kullanıcısı /
  10.560 kontrol**, FDR<0.05'te **6 CpG** — KIAA0226/RUBCNL, CPLX2, TDRP, RNF38, TTC23, GPR179.
  Bu sayılar **bizim değil, yayının**; öyle etiketlenir (meta-analiz ham verisi tek set
  olmadığından yeniden hesaplanamaz, yalnızca kaynak gösterilir). Böylece opioid için artık hem
  kendi **beyin** analizimiz hem de yayınlanmış **kan** sonuçları var.

### 4.7 Çok-saat genişletmesi (Hannum 2013 + PhenoAge 2018) — yaşı olan TÜM kohortlar

Makale 5 epigenetik saat (Horvath/Hannum/PhenoAge/GrimAge/DunedinPACE) **iddia ediyordu ama
hiçbirini hesaplamamıştı**. Horvath'ı zaten yaptık (4.x); buraya katsayıları **halka açık**
olan iki saati daha ekledik: **Hannum** (71 CpG, lineer) ve **PhenoAge/Levine** (513 CpG,
intercept 60.664, lineer). Katsayılar biolearn deposundan (`bio-learn/biolearn`, SHA kayıtlı),
hesap kendi seedli betiğimizden (`13_multiclock.py`). Her saat kronolojik yaşa karşı doğrulandı
(Pearson r + MAE) ve yaş-ivmesi (residüel) vaka/kontrol karşılaştırıldı.

| Kohort (madde, doku) | n (vaka/kontrol) | Hannum r / MAE | Hannum ivme p | PhenoAge r / MAE | PhenoAge ivme p |
|---|---|---|---|---|---|
| GSE50660 sigara, **kan** (ref) | 464 (22/179) | 0.80 / 7.8y | 0.352 | 0.75 / 6.8y | **0.051** (sınırda↑) |
| GSE77056 kokain, **kan** | 47 (23/24) | 0.57 / 14.7y | **0.021** (vaka↑) | 0.63 / 5.5y | 0.924 |
| GSE49393 alkol, **beyin** | 48 (23/25) | 0.46 / 17.1y | 0.580 | 0.38 / 47.5y | 0.546 |
| GSE98203 opioid, **beyin** | 65 (37/28) | 0.80 / 16.3y | 0.207 | 0.71 / 65.8y | 0.715 |

**Yorum (dürüst):**
- **Kan kohortları** (sigara, kokain) saatleri iyi doğruluyor (r=0.57–0.80) — Hannum/PhenoAge
  kan-eğitimli olduğu için beklenen. **Beyin kohortlarında** (alkol, opioid) bu iki kan-saati
  daha zayıf/değişken çalışır; pan-doku **Horvath** beyinde daha iyiydi (r=0.80–0.91). Bu fark
  uydurma değil, saatlerin doku-spesifikliğinin gerçek bir yansımasıdır.
- **PhenoAge MAE'leri yüksektir** (özellikle beyinde 47–66y) çünkü PhenoAge kronolojik değil
  **fenotipik (mortalite-kalibreli) yaş** verir; anlamlı metrikler r ve yaş-ivmesidir, MAE değil.
- İki **gerçek pozitif sinyal:** **kokain**de Hannum yaş-ivmesi vaka grubunda anlamlı yüksek
  (Welch **p=0.021**); **sigara**da PhenoAge yaş-ivmesi sınırda yüksek (**p=0.051**). Diğerleri
  null olarak dürüstçe raporlandı.
- **Önemli not:** ekstra saat eklemek gerçek hesaplanan CpG sayısını artırır (saat başına +71 ve
  +513 CpG), ancak madde-spesifik **DMP imzasının** CpG sayısını artırmaz — o, eldeki gerçek
  kohortların verisiyle sınırlıdır.

### 4.6 Esrar — GSE255929 (EPIC/850K, kan, 93) — KENDİ ANALİZİMİZ ATILDI
- Depozitte "age" alanı altında verilen S1/S2 etiketleri esrar grubu **değil**; karışımlı
  alt-kohortlar (S1=59, ~59 yaş, hep kadın; S2=34, çoğu erkek, ~47 yaş). Bizim S2-vs-S1 EWAS'ı
  dizinin **%42'si kadar (364.347) sahte DMP** verdi → `out/GSE255929_S1vsS2_subcohort_
  CONFOUNDED.csv` olarak işaretlenip **atıldı** (`out/CANNABIS_NOTE.md`).
- Bunun yerine **yayınlanmış sayılar kaynak gösterilir** (BMC Pulm Med 2025, PMID 40205553,
  CanCOLD): güncel-vs-hiç 12.115 DMG, eski-vs-hiç 10.806, ortak 5.915, ~50 yaşlanma/kanser
  yolağı (FDR<0.05). Bu sayılar **bizim değil, yayının**; öyle etiketlenmiştir.

### 4.8 İstatistiksel güç (power) analizi — `19_power.py`

Hiçbir etki büyüklüğü uydurulmadı: her kohortun **kendi DMP tablosundaki t** değerinden Cohen
d, `d = t·√(1/n₁+1/n₂)` ile **tam olarak** geri hesaplandı. Genom-geneli eşik = Bonferroni
0.05/test-sayısı (~1e-7). statsmodels `TTestIndPower`.

| Kohort (madde, doku) | n (vaka/kontrol) | medyan Cohen d (anlamlı CpG) | gözlenen N'de güç | %80 güç için gerekli N/grup |
|---|---|---|---|---|
| GSE50660 sigara, kan (ref) | 22/179 | 1.21 | 0.44 | 27 |
| GSE77056 kokain, kan | 23/24 | 1.26 | 0.05 | 33 |
| GSE49393 alkol, beyin PFC | 23/25 | 1.71 | 0.40 | 32 |
| GSE98203 opioid, beyin | 37/28 | 1.42 | (hesaplanamadı) | 22 |
| GSE154971 meth, kan | 16/8 | 2.60 | 0.14 | 15 |

**Dürüst yorum:** genom-geneli eşik (~1e-7) çok katıdır; bu küçük keşif kohortları yalnız
**büyük etkiler** (d>1.2) için yeterince güçlüdür — bu, EWAS literatürünün gerçeğiyle uyumludur.
Medyan etki için %80 güce ulaşmak grup başına 15–33 örnek gerektirir; mevcut N'ler keşif için
uygun, ama **doğrulama (replikasyon) kohortu** şarttır. Çıktı: `out/power/power_summary.json`.

### 4.9 Makine öğrenmesi (genişletilmiş, sızıntısız) — `18_ml.py`

Makalenin uydurma **"7-sınıf, 10.542 örnek, %87.3 doğruluk"** iddiasının gerçek karşılığı. Tek
yeterince büyük kohort olan sigara referansında (GSE50660, 201 örnek: 22 güncel / 179 hiç) üç
model **aynı titiz protokolle** karşılaştırıldı: StratifiedKFold(5), **fold-içi** top-200 t-test
seçimi (sızıntısız), sınıf dengesizliği yönetimi (class_weight / scale_pos_weight).

| Model | ROC-AUC | Dengeli doğruluk | Duyarlılık (güncel) | Özgüllük (hiç) |
|---|---|---|---|---|
| RandomForest | 0.950 | 0.565 | 0.136 | 0.994 |
| ElasticNet-LR (L1/L2) | 0.821 | 0.702 | 0.409 | 0.994 |
| **XGBoost** | 0.928 | **0.923** | **0.864** | 0.983 |

**Dürüst yorum:** RandomForest yüksek AUC'ye (0.95) rağmen dengesizlik yüzünden **gerçek
duyarlılığı çok düşük** (0.136 — pratikte herkese "hiç içmemiş" diyor); bu, ham doğruluğun/AUC'nin
neden tek başına yanıltıcı olduğunun kanıtıdır. `scale_pos_weight` ile **XGBoost** gerçek
kullanışlı modeldir (duyarlılık 0.864, dengeli doğruluk 0.923).

**SHAP (yorumlanabilirlik):** tam-veri XGBoost modelinde en yüksek SHAP'lı CpG **cg05575921
(AHRR)** (ort.|SHAP|=2.27), ardından cg21566642, cg06126421 — **cg05575921, sigara metilasyonunun
altın-standart biyobelirtecidir**. Model gürültüyü değil **gerçek biyolojiyi** öğrendi (bağımsız
biyolojik doğrulama). Çıktı: `out/ml/gse50660_ml.json`.

**7-sınıf çoklu-madde sınıflandırma yapılamaz:** farklı platform/doku/çok küçük n nedeniyle
birleşik 7-sınıflı model **imkânsızdır** (açık beyan); her madde yalnız kendi kohortunda öğrenilebilir.

### 4.10 Derin öğrenme tahmin sistemi — `20_dlsystem.py`, `21_substance_models.py`, `predict.py`

Makalenin uydurma **"ensemble ML, MAE 2.1 yıl, R²=0.96"** ve çoklu-madde tahmin iddialarının
gerçek, çalışan karşılığı: **metilasyon girer → epigenetik yaş + sigara + madde durumu çıkar.**
Hepsi `seed=42`, **sızıntısız** çapraz-doğrulama (özellik seçimi + ölçekleme yalnız eğitim
katmanında), modeller `out/dl/models/` altında committed.

**a) Derin sinir ağları (MLP, GSE50660 n=201)** — `20_dlsystem.py`:
gerçek çok-katmanlı perceptron'lar (gizli=(256,64)/(128,32), ReLU, Adam, erken-durdurma).

| Görev | Mimari | Dürüst OOF performans |
|---|---|---|
| Yaş regresörü (derin) | MLP (256,64) | MAE=5.40 yıl, r=0.38, R²=0.04 |
| Sigara sınıflandırıcı (derin) | MLP (128,32)+oversample | AUC=0.72, dengeli-doğr.=0.56 |

**Dürüst yorum:** n=201 + dar yaş aralığı (40–65) + sigara-optimize özellik havuzunda sıfırdan
derin ağ, **doğrulanmış Horvath saatini** (r=0.77, MAE=3.5) ve **XGBoost'u** (AUC=0.928, §4.9) geçemez —
bu önemli, dürüst bir bulgudur (derin öğrenme küçük veride klasik yöntemlerin gerisinde kalır).
Bu yüzden dağıtılan çıkarım motoru **birincil olarak Horvath saati (yaş) + XGBoost (sigara)**
kullanır; MLP'ler derin-öğrenme kıyas modeli olarak raporlanır.

**b) Madde-spesifik sınıflandırıcılar** — `21_substance_models.py` (sızıntısız StratifiedKFold-5,
fold-içi top-300 t-test, XGBoost, **etikete-kör CRC32 aday-CpG havuzu**):

| Madde | Kohort | n (vaka/kontrol) | OOF ROC-AUC | Dengeli doğr. |
|---|---|---|---|---|
| Kokain | GSE77056 (kan) | 47 (23/24) | **1.00** | 0.979 |
| Alkol | GSE110043 (kan) | 94 (47/47) | 0.926 | 0.894 |
| Metamfetamin | GSE154971 (PBL) | 24 (16/8) | 0.922 | 0.813 |

**Modellenmeyenler (açık beyan, uydurulmadı):** opioid GSE98203 (yalnız 12 DMP, küçük n →
güvenilir sınıflandırıcı yok) ve alkol-beyin GSE49393 (8 DMP, postmortem beyin, kanla
birleştirilemez) — güvenilmez olacağı için sınıflandırıcı kurulmadı.

**c) Çıkarım CLI** — `predict.py`: bir metilasyon beta tablosu (`cpg_id,beta`) alır, uygulanabilen
tüm motorları çalıştırır, her motor için **CpG kapsamını dürüstçe** raporlar (eksik CpG'ler
Horvath yayınlanmış median'ı / eğitim ortalamasıyla doldurulur). Seri-matristen çıkarılan **iki
gerçek GSE50660 örneğinde** uçtan uca doğrulandı:

- Sigara içen GSM1225377 (kronolojik 50): Horvath **54.1 y** (+4.1 hızlanma), XGBoost sigara
  **%89.9 → "current"** ✓ (kapsam %99–100).
- Hiç içmeyen GSM1225378 (kronolojik 56): Horvath **56.9 y** (+0.87), XGBoost sigara
  **%0.2 → "never"** ✓.

**Kohortlar-arası uyarı (beyan):** madde modelleri **kendi kohortunda** doğrulanmıştır (OOF AUC);
başka bir kohorta (ör. yukarıdaki kan-sigara örneğine) uygulanan madde olasılıkları batch/platform/
popülasyon etkileriyle karışır → **yalnızca göstergeseldir, tanısal değildir** (predict.py çıktısında
da otomatik beyan edilir). Çıktılar: `out/dl/gse50660_dl.json`, `out/dl/substance_*.json`.

### 4.11 EPİCLOCK v4.0 ileri modülleri — gerçekten uygulananlar + dürüst veri-engelleri

Makalenin önceki sürümünde EPİCLOCK v4.0 için **uydurma/spekülatif** olarak sayılan sekiz "ileri
yetenek" bu sürümde yeniden ele alındı. Verisi/aracı olanlar `seed=42`, **sızıntısız** ve yeniden
üretilebilir biçimde uygulandı; birincil verisi halka açık olmayanlar **uydurulmadan**, eksik değişken
adıyla **veri-engelli (data-blocked)** beyan edildi. Her sayı bir committed betiğe + JSON çıktısına bağlı.

| # | Modül | Betik | Durum | Gerçek bulgular (izlenebilir) |
|---|---|---|---|---|
| 1 | Epigenetik Kronoloji | `23_chronology.py` | **GERÇEK** | GSE50660 n=464 (179/263/22). 3-sınıf dengeli doğr. 0,513; makro-AUC 0,79; güncel-vs-hiç AUC **0,893**, bırakmış-vs-hiç 0,854, güncel-vs-bırakmış 0,660 |
| 2 | Moleküler Kaynak Ayrımı | `22_source_separation.py` | **GERÇEK** | 6 madde imzası (FDR<0,05, ilk 2000 \|t\|). Özgüllük indeksi ≥0,99 (sigara 0,990 … opioid/alkol-beyin 1,00); ort. köşegen-dışı Jaccard **0,0012**. Sınır: aynı-platform çok-madde yok → atıf göstergesel |
| 3 | Genetik-Epigenetik Etkileşim | `25_ewas_annotation.py` | **SINIRLI-GERÇEK** | EWAS Catalog API (PMID-kaynaklı): **133/133 hedef CpG anote, 0 zaman aşımı** (`ewas_timeouts.json` boş). Ortak gen: AHRR, F2RL3, GFI1, PRSS23, **CNTNAP2** (sigara↔alkol). Doğrudan mQTL/genotip → veri-engelli |
| 4 | Keminformatik/Markush NPS | `24_cheminformatics_nps.py` + `29_nps_database_markush.py` | **GERÇEK** | (a) RDKit, 37 gerçek NPS / 8 sınıf, Morgan/ECFP4 (r2, 2048bit): sınıf-içi Tanimoto 0,427 vs sınıflar-arası 0,129; en yakın-analog aynı-sınıf %97,3; 15 Markush + 17 Murcko ailesi (en büyük 9); Lipinski Ro5 **34/37**. (b) Yazarın EpiClock prototipinden içe aktarılan **gerçek NPS veritabanı**: UNODC-sınıflı **17 NPS (7 kategori)** + 27 referans madde; kimlik doğrulama **15/17** her iki testte (iç formül↔MW uyuşmayan: Carfentanil DB formülü hatalı + Etizolam kütlesi monoizotopik; PubChem uyuşmayan: Carfentanil + 2-FDCK→HCl tuzu — hepsi dürüstçe raporlandı); **10 Markush kuralı** (SMARTS 10/10 RDKit-geçerli) → **29.277 teorik R-grup varyant kombinasyonu** enümere (makalenin '36.000+' iddiasının gerçek karşılığı). Maddeye iliştirilen metilasyon/CpG katmanı **uydurma → dışlandı** (cg05575921 sigara CpG'si 6 maddede; 11 CpG birden çok ilaçta tekrar) |
| 5 | Nöral Epigenetik Ağ | `20_dlsystem.py` | **GERÇEK** | MLP yaş MAE 5,40 / r 0,38; MLP sigara AUC 0,72. Küçük n → derin ağ < Horvath + XGBoost (AUC **0,928**); dağıtılan motor klasik yöntemleri kullanır (bkz. 4.10) |
| 6 | Multi-omik Füzyon | `27_multiomic_fusion.py` | **GERÇEK** | Motor doğrulaması (bağımlılığa-özgü değil): bağımlılık kohortları tek-omik olduğundan ara-füzyon motoru gerçek eşli omikte doğrulandı — TCGA-LUAD (UCSC Xena), aynı barkodlu **477 eşli örnek**, 450K metilasyon (etiket-bağımsız 10.000 problu panel) + HiSeqV2 RNA-seq + klinik tütün öyküsü. Omik-başına PCA(30) kodlayıcı → ara füzyon (latent birleştirme) → lojistik; StratifiedKFold(5, seed=42), tüm ön-işleme fold-içi (sızıntısız), SHA-256 kayıtlı. Tema uyumlu görev (tümörde hiç-vs-içmiş, n=166: 143/23): metilasyon AUC **0,680** (GA 0,633–0,727), ekspresyon 0,659, füzyon **0,682** (0,550–0,814), füzyon kazancı +0,002 → sinyali büyük ölçüde metilasyon taşıyor. Sağlama (tümör-vs-normal, n=475) füzyon AUC **1,00**. Sınır: aynı bireyde eşli *bağımlılık* omiği halka açık değil → bağımlılık-düzeyi füzyon hâlâ veri-engelli |
| 7 | Postmortem Stabilite | `28_postmortem_stability.py` | **GERÇEK** | GSE41826 (450K, frontal korteks, NeuN nöron/glia; n=58+58, 87 donör; PMI 4–34s, medyan 19). M~PMI+yaş+cinsiyet+tanı, fraksiyona göre katmanlı, BH-FDR. 477.397 CpG'nin **0'ı PMI-labil** (FDR<0,05; her iki fraksiyon); λ 1,05/0,84; nominal p<0,05 (25.326/15.463) ≈ şans (23.870); permütasyon null=0; p95\|eğim\| 0,013/0,011 M/saat → frontal korteks metilasyonu **4–34s PMI'de kararlı**. Gözlemsel; pH/batch yok |
| 8 | Global NPS Radar | `26_nps_radar.py` + `30_nps_epi_feed.py` | **GERÇEK** | (a) Kimya: 37 NPS, küresel ort. ikili Tanimoto **0,160**; en kohezif fentaniller (0,583), en az arilsikloheksilamin (0,369); en yeni/izole **5F-ADB** (yenilik 0,571). (b) Epidemiyoloji (gerçek, indirilen EUDA EDR2025 CSV + SHA-256): AB-EWS'ye ilk bildirilen NPS — 2005–2024 toplam **948**, 2014 zirve 101, **2024: 47** (20 kannabinoid, 7 nitazen), 2023: 26; AB yakalama sayısı 2016 zirve **46.019**, 2023: 33.708, toplam 373.106; 2024 resmi bildirim 47; 2024 sonu izlenen **1.000** NPS. UNODC EWA (10.10.2025): 153 ülkeden **1.396** benzersiz NPS, 2024 rekor **688**, 45 ülkeden 101 yeni. Sınır: gerçek-zamanlı programatik ülke-yıl API'si yok; yıllık sayımlar kamuya açık & yeniden üretilebilir |
| 9 | Maruziyet Çıkarım Motoru (EEIE) | `50_exposure_inference_engine.py` | **GERÇEK** | Prompt madde #6'nın dürüst karşılığı (kesinlik yerine **olasılıksal + güven aralıklı + kalibre**). Tütün recency tahmincisine **bootstrap B=2000 %95 GA + kalibrasyon**: güncel-vs-hiç AUC **0,893 [0,801–0,968]**, bırakmış-vs-hiç 0,854 [0,818–0,886], güncel-vs-bırakmış 0,660 [0,526–0,782]; çok-sınıf Brier 0,386, ECE güncel-vs-hiç **0,044**. 35-satırlık **tam taksonomi yetenek matrisi** (11 gerçek-analiz / 12 veri-yok / 10 veri-var-modellenmedi / 2 kovaryat) + 52 yaş olgu örneği. Veri olmayan her madde (sentetik kannabinoid, inhalant/bütan, MDMA, LSD, GHB…) için **uydurma yerine NOT_ESTIMABLE** (§2.1). AUC noktaları modül 1 ile birebir → üretim teyitli |

**Dürüstlük notu:** Sekiz modülün hiçbirinde tek bir sayı uydurulmamıştır. Açıkça beyan edilen
veri-sınırları yalnızca iki modüldedir: modül 3 (doğrudan genotip/mQTL verisi yok → öne çıkan
CpG'ler EWAS Catalog'dan PMID-kaynaklı anote edildi, 133/133) ve modül 6 (aynı bireylerde eşli
*bağımlılık* omiği halka açık değil → ara-füzyon motoru gerçek eşli omikte, TCGA-LUAD, doğrulandı).
Modül 8'in epidemiyolojik katmanı da artık gerçektir (indirilen EUDA EDR2025 kaynak-veri CSV'leri +
yayımlanmış UNODC EWA sayıları); yalnızca gerçek-zamanlı programatik ülke-yıl API'si bu ortamda
yoktur. Kalan beş modül (1, 2, 4, 5, 7) tam gerçektir. Çıktılar: `out/dl/chronology.json`,
`source_separation.json`, `genetic_epigenetic.json`, `nps_cheminformatics.json`,
`nps_database_markush.json`, `multiomic_fusion.json`, `postmortem_stability.json`, `nps_radar.json`,
`nps_epi_feed.json` (+ ilgili `*.csv`).

**Modül 9 (EEIE) — prompt madde #6'nın doğrudan uygulanışı.** Bir madde için varlık/tür/**kullanım
süresi** tahmini *kesinlik iddiası* olarak değil, yalnızca gerçek halka açık veri destekliyorsa
**kalibre olasılık + %95 güven aralığı** olarak verilir; bugün buna izin veren tek eksen tütün
recency'sidir (hiç/bırakmış/güncel). Halka açık metilasyon verisi olmayan her maruziyet için motor
**uydurma bir süre yerine `NOT_ESTIMABLE` (yetersiz kanıt)** döndürür — bu, hem madde #6 (olasılıksal,
GA, valide) hem §2.1 (uydurma yasak) gereğidir ve çıktıyı adli/hukuki kullanım için güvenli kılan
şeydir. 35-satırlık yetenek matrisi kullanıcının saydığı **tüm** sınıfları (kronik hastalık, genetik/
konjenital, psikiyatrik, yaşam tarzı, çevresel, her madde + NPS) dürüst veri-durumuyla listeler.
Çıktı: `out/dl/exposure_inference_engine.json`.

## 4.12 Ek madde-DMP kohortları (genişletilmiş örnek tipleri: kan + postmortem beyin)

"Madde metilasyon verisi yok" varsayımını aşmak için her madde, bulunabilen **tüm örnek
tiplerinde** (canlı/kan + kadavra/postmortem beyin + hayvan referans) yeniden tarandı ve analiz
edildi. Bu kohortların **tam birleşik durum tablosu** `human/SUBSTANCE_DMP_REPORT.md` dosyasındadır;
sayılar bu raporla tutarlıdır. Büyük matrisler GitHub Actions'ta çalıştırıldı (human-batch run
27477783580; batch-2 run **27479529130**).

**a) Batch-2 (bu tur, `.github/workflows/dmp2.yml`):**

| Madde | Set | Doku | Tasarım (vaka/kontrol) | Test | DMP FDR<0.05 | Not |
|---|---|---|---|---|---|---|
| Alkol (AUD) | GSE252501 | **NAc** (beyin, EPIC) | 56/59 | 769.154 | **1.107** | sigaradan temiz (AHRR sıra 397.811) |
| Alkol (AUD) | GSE252501 | **DLPFC** (beyin, EPIC) | 58/59 | 767.719 | **0** | bölgeye-özgü null (NAc+ / DLPFC−) |
| Enjeksiyon (IDU) | GSE100264 | tam kan (450K) | 214/168 | 482.415 | **1** | **IDU≡HCV mükemmel eşdoğrusal** → IDU/HCV-birleşik; sex/hiv/hcv otomatik düşürüldü |
| Kokain | GSE137364 | **kaudat** (beyin, bisülfit 5x) | 28/29 | 1.099 (complete-case) | **0** | 5x kapsamda complete-case seyrek → güç düşük, dürüst null |

Betikler: `scripts/40_dmp_alcohol_brain_gse252501.py`, `41_dmp_idu_gse100264.py`,
`43_dmp_cocaine_brain_bisulfite.py`; çıktılar `out/GSE252501|GSE100264|GSE137364_validation.json`.
Üçü de ilgi-değişkenini koruyan **tam-rank tasarım kurucusu** kullanır (sabit/eşdoğrusal kovaryatlar
`dropped_terms` olarak kayıtlı) ve grup eşlemesi doğrulanamazsa **fail-closed** durur (tahmin yok).

**b) human-batch (`.github/workflows/dmp.yml`, daha önce):**

| Madde | Set | Doku | Tasarım | DMP FDR<0.05 | Not |
|---|---|---|---|---|---|
| Opioid (OUD) | GSE235818 | OFC NeuN+ nöron (bisülfit) | 12/26 | **1** (chr3:32781045, q=0,0076) | tek gerçek pozisyon |
| Opioid (OUD) | GSE164822 | dlPFC (EPIC, M) | 72/28 | **0** (min q=0,106) | kıl payı null |
| Metamfetamin | GSE293262 | kan (EPIC) | 4/4 | **0** (min q=0,163) | n=8, güç çok düşük |
| Sigara/nikotin | GSE147040 | NAc (EPIC) | 53/168 | **0** (min q=0,931) | doku-spesifik null (imza kana özgü) |
| MDMA | GSE68199 | fare kalp (MeDIP) | — | **0** | insan değil |
| Kokain | GSE66348 | sıçan NAc (array) | — | **0** | insan değil |

**b3) batch-3 (denek-içi paired, `.github/workflows/dmp3*.yml`):**

| Madde | Set | Doku | Tasarım | DMP FDR<0.05 | Not |
|---|---|---|---|---|---|
| Ketamin (oral, PTSD) | GSE287261 | PBMC (kan) | denek-içi 20 çift (baseline vs son post) | **16** | sub-anestezik tedavi; rekreasyonel değil |
| Reçeteli opioid (kısa) | GSE151485 | tam kan (EPIC) | denek-içi 32 çift (baseline vs son vizit) | **0** (min q=0,359) | dürüst null; n=32 underpowered; AHRR cg05575921 Δ=−0,010 → sigara tasarımla kontrollü |

**c) Ertelenen (veri var, eşleme/betik bekliyor):** kokain-striatum GSE182585 (GEO id↔grup eşlemesi
tutarsız: başlık tek / matris çift sayı, kesişim=0 → fail-closed, uydurma yapılmadı).

**Dürüst genel yorum:** Madde sinyali **dokuya ve bölgeye özgüdür** — alkol NAc'ta güçlü (1.107),
DLPFC'de yok; sigara kanda altın-standart (GSE50660 89, AHRR #1), beyin NAc'ında yok (GSE147040 0).
"Veri yok" demek yerine her örnek tipi tarandığında bazıları gerçek pozitif, bazıları dürüst null
verdi; hiçbiri uydurulmadı.

## 5. Yeniden üretilebilirlik

Betikler `scripts/revize/realdata/scripts/`, çıktılar `out/`, veri `data/`:
- `01_download.py` — GEO indirme + SHA-256 (`data/manifest.json`)
- `02_dmp_smoking.py` — sigara DMP + literatür yer-gerçeği → `out/gse50660_*`
- `03_enrichment.py`, `05_clocks.py` — sigara GO/KEGG + Horvath
- `04a_cache_betas.py` + `04_classifier.py` — sızıntısız RF + permütasyon
- `06_dmp_substance.py` — genel kokain/meth DMP (yaş/cinsiyet kovaryat, BH-FDR)
- `07_dmp_opioid_brain.py` — opioid beyin beta-tablo DMP
- `08_dmp_cannabis.py` — esrar (sonuç karışımlı → atıldı)
- `09_enrichment_substance.py <ACC>` — genel GO/KEGG (450K manifest + Enrichr)
- `10_clocks_substance.py <ACC>` — genel Horvath saati (seri-matris veya beta-tablo)
- `11_verify_cited_sources.py` — makalede atıf verilen 14 kaynağın **canlı** NCBI/EBI/PMC
  doğrulaması → `out/cited_sources_verification.json` (+ ham yanıtlar `out/cited_raw/`)
- `12_dmp_alcohol_brain.py` — alkol beyin (GSE49393) seri-matris DMP (yaş+cinsiyet kovaryat)
- `13_multiclock.py <ACC>` — ekstra epigenetik saatler (Hannum + PhenoAge) tüm kohortlarda;
  katsayılar `data/clocks/` (biolearn, SHA kayıtlı) → `out/{ACC}_multiclock_*`
- `15_prisma_inventory.py` — PRISMA 2020 envanteri: madde başına canlı GEO esearch/esummary,
  tanımlama→tarama→uygunluk; **117 dahil edilen veri seti** → `out/prisma/inventory.json`
  (+ham önbellek `out/prisma/raw/`). NCBI esummary sayfalama hatası (chunk'lar arası `uids`
  ezilmesi) düzeltildi.
- `16_download_substance.py` — tractable madde setlerinin indirilmesi + SHA-256
  (GSE154971 meth, GSE49393 alkol-PFC, GSE66348 sıçan-NAc) → `data/manifest.json`
- `19_power.py` — istatistiksel güç analizi (Cohen d, t'den geri hesap) → `out/power/power_summary.json`
- `20_dlsystem.py`, `21_substance_models.py` — derin öğrenme (MLP yaş+sigara) + madde modelleri (bkz. 4.10)
- `22_source_separation.py` — madde imzası çapraz-özgüllük matrisi (Jaccard) → `out/dl/source_separation.json`
- `23_chronology.py` — sigara zamansal-evre (hiç/bırakmış/güncel) 3-sınıf model → `out/dl/chronology.json`
- `24_cheminformatics_nps.py` — RDKit NPS keminformatik (ECFP4/Tanimoto/Markush/Murcko/Lipinski) → `out/dl/nps_cheminformatics.json`
- `25_ewas_annotation.py` — öne çıkan CpG'lerin EWAS Catalog anotasyonu (concurrent fetch, zaman aşımı dışlama) → `out/dl/genetic_epigenetic.json`
- `26_nps_radar.py` — NPS kimyasal-uzay radarı + yapısal erken-uyarı → `out/dl/nps_radar.json`
- `27_multiomic_fusion.py` — multi-omik füzyon **veri-engeli** dürüst beyanı (kendini doğrular) → `out/dl/multiomic_fusion.json`
- `28_postmortem_stability.py` — postmortem PMI stabilite **veri-engeli** dürüst beyanı (kendini doğrular) → `out/dl/postmortem_stability.json`
- `29_nps_database_markush.py` — yazarın **EpiClock** NPS veritabanı + Markush motorunun içe aktarımı: kimlik doğrulama (iç formül↔MW + PubChem), SMARTS RDKit doğrulama, **29.277** varyant enümerasyonu, uydurma metilasyon/CpG katmanının teşhiri → `out/dl/nps_database_markush.json` (+ `out/dl/nps_unodc_validation.csv`)
- `40_dmp_alcohol_brain_gse252501.py`, `41_dmp_idu_gse100264.py`, `43_dmp_cocaine_brain_bisulfite.py`
  — batch-2 madde-DMP betikleri (alkol-beyin NAc+DLPFC, IDU/HCV-kan, kokain-beyin kaudat bisülfit);
  ilgi-değişkenini koruyan tam-rank tasarım + fail-closed grup eşleme; GitHub Actions
  `.github/workflows/dmp2.yml` (run 27479529130) → `out/GSE252501|GSE100264|GSE137364_validation.json`
- `44_dmp_ketamine_gse287261.py` — ketamin (GSE287261) PBMC denek-içi paired DMP (baseline vs son
  post-tedavi, BH-FDR); supplementary CSV betaları, sütun→GSM eşlemesi seri-matrise karşı 1:1
  doğrulandı (fail-closed) → `out/GSE287261_validation.json`
- `45_dmp_rx_opioid_gse151485.py` — kısa süreli reçeteli opioid (GSE151485) tam-kan denek-içi paired
  DMP (baseline vs son vizit); **seri-matris işlenmiş betaları doğrudan** (methylprep yok); fail-closed
  vizit eşlemesi; GitHub Actions `.github/workflows/dmp3c.yml` → `out/GSE151485_validation.json`
- `50_exposure_inference_engine.py` — **Maruziyet Çıkarım Motoru (prompt #6)**: 23_chronology'nin
  doğrulanmış yükleyicisini yeniden kullanarak tütün recency tahmincisi + **bootstrap %95 GA (B=2000)**
  + kalibrasyon (çok-sınıf Brier, ECE) + 35-satırlık **tam taksonomi yetenek matrisi** + 52 yaş olgu
  örneği; veri olmayan her sınıf için **NOT_ESTIMABLE** (fail-closed, uydurma yok) → `out/dl/exposure_inference_engine.json`

Sabit seed = 42. Her veri dosyasının SHA-256'sı kayıtlı.

## 6. YENİDEN ÜRETİLEMEYENLER (açık beyan)

- **GSE66348 (sıçan, Nucleus Accumbens, kokain):** indirildi + SHA kayıtlı, ama bu set
  **MeDIP** (anti-5mC antikoruyla zenginleştirme), beta-değeri dizisi **değil** → array-tabanlı
  beta-EWAS pipeline'ımız uygulanamaz; farklı modalite ayrı bir pipeline gerektirir. Uydurma
  analiz yapılmadı, **dışlandı ve beyan edildi** (kullanıcının izin verdiği "hayvan modeli"
  kapsamında olsa da kullanılabilir beta verisi sunmuyor).
- **Sentetik kannabinoidler, MDMA/ecstasy (insan):** halka açık insan metilasyon dizi verisi
  **yok** → hiçbir sayı üretilemez (MDMA yalnız fare-kalp GSE68199 → null, §4.12).
- **Ketamin (GSE287261) + reçeteli opioid (GSE151485):** ✅ artık GERÇEK analiz edildi (denek-içi
  paired, committed betik 44/45 — §4.12 b3) → "kuyrukta" durumu kalktı. Ketamin 16 DMP; reçeteli
  opioid dürüst null (0 DMP, n=32 underpowered). Yeniden üretilebilir; bu liste dışı.
- **Birleşik 7-sınıf / 10.542 örnek / %87.3 doğruluk:** farklı platform/doku/küçük n nedeniyle
  **imkansız**; her madde ancak kendi küçük kohortunda analiz edilebildi.
- **Metamfetamin epigenetik saati:** GEO'da kronolojik yaş yok → hesaplanamaz.
- **Alkol için saf etki — yalnız KAN kohortunda (GSE110043):** sigara değişkeni yok → karışım
  giderilemedi (4.387 DMP sigara-karışımlı). **Beyin kohortları (GSE49393 PFC, GSE252501 NAc/DLPFC)
  ise sigara-ayarlı ve sigaradan temizdir** (§4.2b, §4.12) → bu sınır artık yalnız kan setine özgüdür.
- **Hannum + PhenoAge saatleri:** ARTIK HESAPLANDI (bkz. 4.7) — katsayılar halka açık (biolearn),
  yaşı olan 4 kohortta doğrulandı.
- **GrimAge ve DunedinPACE:** katsayı CSV'leri biolearn'de mevcut **ama** GrimAge eğitimli protein
  alt-modelleri + yaş/cinsiyet, DunedinPACE ise altın-standart kantil normalizasyonu gerektirir;
  bunları **doğru** üretmek tam biolearn motorunu ister. Yarım/yaklaşık uygulanıp **uydurulmaz** →
  açıkça beyan edilir (istenirse biolearn paketi kurularak eklenebilir).
- **Framingham Heart Study (GrimAge'in "10.000+" kohortu):** ham metilasyon verisi **dbGaP'te
  kontrollü erişimdedir** (phs000724); başvuru + etik kurul + veri kullanım sözleşmesi olmadan
  indirilemez. GEO'daki "Framingham" eşleşmeleri (608) çoğunlukla **alakasız/atıfsal**; çalışmanın
  asıl metilasyon matrisi halka açık değildir → o örnekler üzerinde hesap **yapılamaz**.
- **FASD veri setleri (GSE112987, GSE80261):** gerçek alkol verisi ama **prenatal maruziyet**
  fenotipi (erişkin bağımlılığı değil); makalenin "erişkin madde kullanımı" çerçevesine
  uymadığından bu çalışmada **erişkin madde imzası olarak analiz edilmedi**, ayrı fenotip
  olarak beyan edildi (istenirse ayrıca analiz edilebilir).
- **EWAS Data Hub alt kümeleri (Hub-1/2/3):** makalede iddia edilen N'lerle (alkol 1247,
  kannabis 194, kontrol 2076) hazır "madde" alt kümesi **bulunamadı** → doğrulanamadı, kaynak
  olarak kullanılmadı.

## 6.1 GSE125105 — depresyon kohortu (makalenin EN AÇIK yanlış-etiketi) + ortam sınırı

**Makale Tablo 1, satır 236:** "GSE125105 | Opioid | 450K | n=36 | Beyin | 47.3±12.5".
**GERÇEK (NCBI GEO esummary, kanıt: `out/cited_raw/GSE125105_esummary.json`):**
GSE125105 = *"Epigenome analysis of depressed and control subjects"* —
depresif **n=489** + kontrol **n=210** = **699 örnek**, **tam kan** (whole blood),
Illumina 450K. Yani: opioid değil, beyin değil, n=36 değil. Satır baştan sona uydurma.

**Gerçek beta verisi indirildi (kaynaklı, SHA kayıtlı):**
- `data/GSE125105_matrix_normalized.txt.gz` — 3.507.184.725 bayt,
  SHA-256 `488860ed4bdb72439f35a6fea2627102feb3644426432d9066c46b7900557012`,
  kaynak NCBI FTP (suppl). 699 örnek × ~485k CpG. (manifest.json'a işlendi.)
- Fenotip (tanı / yaş / cinsiyet / hücre oranları) `data/GSE125105_series_matrix.txt.gz` içinde.

**Epigenetik saat / DMP hesabı — bu ortamda tamamlanamadı (açık beyan):**
Matrisin tam açılması ~12–17 GB düz metin üretiyor ve açma hızı <122 MB/s ölçüldü; bu,
Replit ortamının **işlem başına ~120 saniye** yürütme sınırını aşıyor (gzip tek-akış
olduğundan bölünüp/duraklatılıp sürdürülemiyor; arka-plan işleri de bu ortamda çağrı
sınırlarında güvenilmez biçimde sonlanıyor). Bu yüzden 887 saat-CpG satırının tam çıkarımı
**burada hesaplanamadı**. Hiçbir saat/yaş-ivmesi sayısı **uydurulmadı**. Hesap motoru
(`scripts/14_depression.py`: Horvath + Hannum + PhenoAge, kronolojik yaş doğrulaması,
depresif-vs-kontrol yaş-ivmesi; cinsiyet + hücre-oranı düzeltmeli OLS) committed ve sabit
seed'lidir → daha yüksek bellek/süre sınırı olan bir ortamda (yerel makine / Colab) aynı
dosya SHA'sıyla **birebir yeniden üretilebilir**.

**Bu modülün kesin, doğrulanmış katkısı:** Makale Tablo 1'inin uydurma/yanlış-etiketli
olduğunun bağımsız, kaynaklı kanıtı (satır 236 = depresyon kohortu, opioid değil). Tablo 1'in
veri-seti iddialarının güvenilmez olduğunu gösteren en güçlü tek delillerden biri.

## 7. Sonuç

Her madde için bulunabilen **en iyi gerçek GEO kohortu** ayrı ayrı analiz edildi: sigara
(referans, çok-noktada literatürle doğrulandı), alkol (sigara-karışımlı, dürüstçe işaretlendi),
kokain (11.987 CpG + kanser/yaşlanma KEGG yolakları), metamfetamin (398 CpG, küçük n, null
enrichment), alkol-beyin (GSE49393: sigaradan temiz 8 CpG + güçlü saat r=0.80), opioid
(**beyin** GSE98203: sigaradan temiz 12 CpG + sinaptik GO + güçlü saat; ayrıca yayınlanmış
**kan** meta-analizi PMC9979153'ten 6 CpG kaynak gösterildi), esrar (kendi analizi karışımlı →
atıldı, yayın sayıları kaynak gösterildi). Ayrıca her madde **tüm örnek tiplerinde** (kan +
postmortem beyin + hayvan) yeniden tarandı (§4.12): yeni gerçek pozitifler — **alkol-NAc 1.107**,
opioid-OFC 1, IDU/HCV-kan 1, **ketamin-PBMC 16** (denek-içi) — ve dürüst null'lar (alkol-DLPFC,
kokain-kaudat, meth-EPIC, opioid-dlPFC, sigara-NAc, **reçeteli-opioid-kan**; sonuncusu denek-içi 32
çift, n düşük) eklendi; tam birleşik durum tablosu `human/SUBSTANCE_DMP_REPORT.md`'dedir. Makalede atıf
verilen 14 kaynağın tamamı canlı doğrulanıp uydurma/yanlış-etiketli olduğu gösterildi. Hiçbir sayı
uydurulmadı; üretilemeyenler açıkça beyan edildi.

## 8. Gerçek DOCX teslimatı (MAKALE_GERCEK.docx)

Gerçek makalenin **tek doğruluk kaynağı** `MAKALE_GERCEK.md`'dir. `build/build_gercek_md.cjs`
bu markdown'ı **birebir** DOCX'e çevirir (içerik elle yazılmaz → metin ile DOCX hiç ayrışmaz):
`scripts/revize/build/MAKALE_GERCEK.docx`. Uygulanan dergi biçimi (lib.cjs): başlık 14pt,
bölüm başlıkları 12pt, gövde 11pt, tablolar 9pt, KAYNAKLAR 8,5pt; A4 dar kenar (1,27 cm),
1,15 satır; PDF kaynaklı **kerning (`<w:spacing w:val>`) ve gri gölge (D9D9D9) sıfırlandı**.

- DOCX'te **7 gerçek tablo** vardır; uydurma makalenin 27 tablosu DEĞİL — çünkü gerçek veri
  ancak bu kadarını dürüstçe destekler. Üretilemeyen tablolar §6'da açıkça beyan edilmiştir.
- **Şekiller dahil edilmedi:** orijinal 14 şekil + beyin görseli uydurma veriyi
  görselleştiriyordu; gerçek belgeye konması fabrikasyon olurdu (Zero-Hallucination). PRISMA
  akışı metin/kod bloğu olarak korunmuştur.
- Eski `build_gercek.cjs` → `makale_gercek.docx` = **reddedilen sigara-only kısa sürüm**;
  artık kullanılmıyor, yerini çok-maddeli `MAKALE_GERCEK.docx` aldı.

Doğrulama (bu turda, python zipfile/XML): geçerli zip + iyi-biçimli XML, 7 tablo, punto
kümesi {28,24,22,20,18,17,16}, kerning=0, D9D9D9=0, gövde varsayılan sz=22; tüm anahtar
gerçek sayılar (89/4.387/8/11.987/398/12, cg05575921, 0,928 vb.) metinde mevcut.

## 9. GitHub'a gönderim — açık engel (kullanıcı kararı gerekir)

Naif `git push` ile temiz bir GitHub deposu **şu an mümkün değildir**: depo halihazırda
`attached_assets` altında ~1617 büyük ikili dosyayı **izliyor** — en büyüğü 1,6 GB
(`gdrive/epiclock/EpiClockPrototype.zip`), ayrıca 100 MB'ı aşan birçok dosya
(`research_corpus/*.pdf`, `scripts/sinerji_dump/*.json`). GitHub **100 MB üstü tek dosyayı
reddeder** ve `.gitignore` zaten izlenen dosyaları geri almaz. Temiz gönderim için bir
**kapsam kararı** gerekir: (a) yalnız `scripts/revize`'yi yeni bir repoya, (b) Git LFS, ya da
(c) geçmiş yeniden yazımı (yıkıcı). Bu + `GITHUB_TOKEN` kullanıcı erişimi/onayı gerektirir;
uyandığında bu kararı bekliyor.
