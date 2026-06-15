# DNA metilasyon saatleriyle bağımlılıkta epigenetik yaş ivmelenmesinin tespiti: Uçtan uca hesaplamalı bir yaklaşım

*Detection of epigenetic age acceleration in addiction using DNA methylation clocks: An end-to-end computational approach*

> **Bu belge, `scripts/revize/makale.txt` içindeki FABRİKE (uydurma) makalenin gerçek, yeniden
> üretilebilir karşılığıdır.** Buradaki her sayı ya halka açık bir kaynaktan doğrulanmıştır ya
> da bu repodaki sabit-seed'li (seed=42), committed Python betiklerinden üretilmiştir. Yeniden
> üretilemeyen her şey "YAPILAMADI" olarak açıkça beyan edilmiştir (Zero-Hallucination ilkesi).
> Metinde köşeli parantezli her atıf numarası (ör. [8]) "Kaynaklar" bölümündeki canlı doğrulanmış
> (PMID/DOI) bir kayda işaret eder. Tam denetim izi ve fabrikasyon kanıtı için bkz. `REPORT.md`.

---

**Yazar:** Nurcan Denli Bayır, MD¹ · ORCID: 0009-0004-2874-4594
**Kurum¹:** Adli Tıp Anabilim Dalı, Ankara Bilkent Şehir Hastanesi, Ankara, Türkiye
**Sorumlu yazar:** drnurcandenlibayir@gmail.com
**DOI:** [atanacak] · **Makale türü:** Orijinal araştırma (yeniden analiz) ·
**Çalışma kaydı:** retrospektif, halka açık ikincil veri

> Yalnızca **DOI/dergi** alanları yer-tutucudur (atama yapılınca doldurulacak); yazar kimliği
> orijinal makaleden birebir korunmuştur.

---

## Öz

**Amaç.** Yasa dışı ve kompleks maddelerin (metamfetamin, kokain, opioid/eroin, doğal esrar ve
sentetik kannabinoidler, halüsinojenler, MDMA, ketamin) periferik ve beyin DNA metilasyonu
üzerindeki izlerini ve uygulamalı adli soruyu — **"hangi madde, ne kadar süredir kullanılıyor?"**
— **yalnızca halka açık ve birebir doğrulanmış** veriyle, uçtan uca yeniden üretilebilir bir boru
hattıyla değerlendirmek; yasal bir madde olan **sigarayı yalnız boru hattını kalibre eden bir
karşılaştırma ölçütü** olarak kullanmak; ulaşılamayan her madde/eksen için sonucu **uydurmak
yerine** kanıt düzeyini (A–E) ve veri-durumunu (ANALYZED_REAL / NO_PUBLIC_DATA / NOT_ESTIMABLE)
açıkça etiketlemek.

**Yöntem.** PRISMA 2020 uyumlu bir envanterle [1] NCBI GEO'da madde + insan + DNA metilasyonu
çalışmaları tarandı. Madde başına bulunabilen en uygun gerçek kohort, ham seri-matris / beta
verisinden başlanarak aynı istatistik protokolüyle (yaş/cinsiyet düzeltmeli doğrusal model +
Benjamini-Hochberg FDR [24]) yeniden analiz edildi. Epigenetik yaş (Horvath [2], Hannum [3],
PhenoAge [4]), istatistiksel güç ve sızıntısız (leakage-free) makine öğrenmesi (RandomForest [25],
ElasticNet, XGBoost [26] + SHAP) eklendi. Her bulgu, beş düzeyli (A–E) bir kanıt ölçeğiyle
derecelendirildi.

**Bulgular.** Tarama 7.859 kayıt tanımladı, 1.295'i tarandı, **117 veri seti** dahil edildi.
Yeniden analiz edilen kohortlarda anlamlı diferansiyel metile CpG (FDR<0,05) sayıları: sigara
(referans) **89**, alkol-kan **4.387** (sigara-karışımlı, keşifsel), alkol-beyin PFC (GSE49393)
**8**, alkol-beyin ödül-devresi NAc (GSE252501) **1.107** (aynı deneklerin DLPFC'sinde **0** →
bölgeye-özgü), kokain-kan **11.987**, metamfetamin-kan **398**, opioid-beyin (GSE98203) **12**.
Sigarada altın-standart biyobelirteç **cg05575921 (AHRR)** birinci sırada doğrulandı
(p=2,4×10⁻⁵⁵) — literatürdeki kanonik sigara imzasıyla birebir uyumlu [8,9]. Kokainde Hannum yaş
ivmesi vaka grubunda anlamlı yüksekti (p=0,021). Sigara sınıflandırmasında XGBoost dengeli
doğruluk 0,923 / duyarlılık 0,864'e ulaştı; SHAP bağımsız olarak yine **AHRR**'yi en bilgilendirici
belirteç seçti. **Negatif kontroller titizdir:** alkol-NAc DMP'lerinin **%97,2'si** aynı-denek
DLPFC'de tutmaz (bölgeye-özgü); tek bağımsız-kohort adayı GSE49393'te **replike olmaz**; opioid
aday lokusu chr3:32781045 okuma-derinliği + aşırı-dağılım hesaba katıldığında **doğrulanmaz
(NOT_CONFIRMED)**; bir "opioid" sinyali (cg20100151) aslında bilinen bir **nöron-glia hücre-tipi
belirteci** (GSE41826'da Cohen d=−4,66) olarak teşhis edildi [10,11]. "Ne kadar süredir
kullanıldı?" sorusu yalnız recency-etiketli tek eksende (tütün never/former/current, GSE50660)
olasılıksal yanıtlanabildi (güncel-vs-hiç OOF AUC 0,893); diğer maddeler için süre
**NOT_ESTIMABLE** (uydurulmadı).

**Sonuç.** Halka açık veri büyük ölçüde **sigara** ağırlıklıdır; diğer maddeler için kohortlar
**küçük, farklı doku/platformda** ve sıklıkla **sigara ile karışmıştır**. Orijinal makaledeki
"15 set / 10.542 örnek / 7 sınıf / %87,3 doğruluk" kurgusu **yeniden üretilemez**; her madde
ancak kendi sınırlı kohortunda dürüstçe analiz edilebilir. Çalışmanın asıl katkısı yalnız pozitif
sayılar değil, **yanlış-pozitif üretmeyen, kanıt-dereceli bir doğrulama disiplinidir.**

**Anahtar kelimeler:** DNA metilasyonu, EWAS, yasa dışı madde kullanımı, metamfetamin, kokain,
opioid, esrar, kullanım süresi (recency), epigenetik saat, yeniden üretilebilirlik, PRISMA 2020,
AHRR, kanıt derecelendirme, adli toksikoloji.

---

## Kısaltmalar

| Kısaltma | Açılım |
|---|---|
| AHRR | Aril-hidrokarbon reseptörü baskılayıcısı (aryl-hydrocarbon receptor repressor) geni |
| AUC | Eğri altı alan (area under the curve) |
| AUD | Alkol kullanım bozukluğu (alcohol use disorder) |
| BH-FDR | Benjamini-Hochberg yanlış-keşif oranı düzeltmesi |
| BMI | Beden kütle indeksi (body mass index) |
| CpG | Sitozin-fosfat-guanin dinükleotidi (metilasyon hedefi) |
| ÇV (CV) | Çapraz doğrulama (cross-validation) |
| DLPFC | Dorsolateral prefrontal korteks |
| DMP | Diferansiyel metile pozisyon (differentially methylated position) |
| DMS | Diferansiyel metilasyon skoru (aday CpG sıralaması için bileşik skor) |
| DSS | Dağılım-küçültmeli (dispersion-shrinkage) bisülfit-dizileme istatistiği |
| EAA | Epigenetik yaş ivmesi (epigenetic age acceleration) |
| ECFP | Genişletilmiş-bağlanırlık parmak izi (extended-connectivity fingerprint) |
| EWAS | Epigenom-geneli ilişkilendirme çalışması (epigenome-wide association study) |
| EPIC | Illumina MethylationEPIC (~850K) dizisi |
| EpiToxScore | Kimyasal özelliklerden epigenetik etki çıkarım skoru (yalnız kavramsal/hipotez) |
| FACS | Floresan-aktif hücre sıralama (fluorescence-activated cell sorting) |
| GEO | Gene Expression Omnibus (NCBI veri deposu) |
| GLM | Genelleştirilmiş doğrusal model (generalized linear model) |
| MAE | Ortalama mutlak hata (mean absolute error) |
| MDE | Saptanabilir en küçük etki (minimum detectable effect) |
| MLP | Çok-katmanlı perceptron (multilayer perceptron) |
| NAc | Nükleus akkumbens (ödül devresi) |
| NPS | Yeni psikoaktif madde (new psychoactive substance) |
| OFC | Orbitofrontal korteks |
| OOF | Kat-dışı (out-of-fold) tahmin |
| OUD | Opioid kullanım bozukluğu (opioid use disorder) |
| PBL | Periferik kan lenfositi |
| PFC | Prefrontal korteks |
| RDKit | Açık kaynak kemoinformatik kütüphanesi |
| SHAP | Shapley katkı açıklaması (SHapley Additive exPlanations) |
| SMILES | Basitleştirilmiş moleküler giriş satır gösterimi (kimyasal yapı notasyonu) |
| TCK | Türk Ceza Kanunu |
| WGBS | Tüm-genom bisülfit dizilemesi (whole-genome bisulfite sequencing) |

---

## 1. Giriş

### 1.1 DNA metilasyonu, bağımlılık ve adli/klinik önem

Madde bağımlılığı, çevresel maruziyetin epigenetik düzeyde kalıcı iz bırakabildiği bir alandır;
DNA metilasyonu (özellikle CpG dinükleotidlerinde) bu izlerin en çok çalışılan ve en
tekrarlanabilir biçimidir ve bağımlılık nörobiyolojisinde köklü bir mekanizma olarak
gösterilmiştir [19,20]. Bağımlılık epigenetiğinin adli ve klinik önemi açıktır: metilasyon
profili, bir bireyin geçmiş ve güncel madde maruziyetine dair — kan/idrar toksikolojisinin
saptama penceresi kapandıktan çok sonra bile — kalıcı bir biyolojik kayıt sunabilir. Bu nedenle
**"hangi maddeye, ne kadar süredir maruz kalındı?"** sorusu hem klinik (tedavi planı, relaps
izlemi) hem de adli (TCK kapsamında madde kullanımı, ehliyet, vesayet değerlendirmeleri)
bağlamlarda doğrudan karşılık bulur. Ancak bu çıkarımın **sahte-kesinlik içermeden**, yalnız
gerçek veriye dayanarak yapılması zorunludur; adli bir bağlamda uydurma bir "X yıldır kullanıyor"
beyanı bir kişiye doğrudan zarar verebilir.

### 1.2 Yasa dışı ve kompleks maddelerin metilasyon imzaları: mevcut literatür

Literatürün olgunluğu maddeden maddeye çarpıcı biçimde değişir. **Metamfetamin** bağımlılığında
yakın zamanda epigenom-geneli ilişkilendirme çalışması yayımlanmıştır [28]; **kokain** kullanım
bozukluğunda insan prefrontal korteksinde epigenom-geneli metilasyon farklılıkları rapor edilmiştir
[29]; **opioid** kullanım bozukluğunda hem beyin (orbitofrontal korteks nöronal
metilom/hidroksimetilom [40]) hem de kan (meta-analiz [22]) düzeyinde sinyaller bildirilmiştir;
**esrar** için çok-soylu büyük bir meta-analiz [31], ağır maruziyet kohortları [32], kullanım
bozukluğu kohortları [33] ve hatta sperm epigenomu çalışmaları [43] mevcuttur. **Enjeksiyon yoluyla
madde kullanımı** da epigenom-geneli olarak çalışılmıştır [30]. Buna karşın **sentetik
kannabinoidler ("bonzai"), halüsinojenler (LSD, psilosibin), MDMA ve ketamin** için kamuya açık
**insan** metilasyon dizi verisi pratik olarak yoktur (§3.8c); bu, çalışmanın meşru bir araştırma
boşluğu olarak vurguladığı gerçektir. Yasal bir madde olan **sigara** ise istisnadır: AHRR geninde
(özellikle cg05575921) güçlü, tekrarlanabilir hipometilasyon on binlerce bireylik meta-analizlerde
doğrulanmıştır [8,9]; bu olgunluk, sigaranın bu çalışmada bir **odak** değil, boru hattını kalibre
eden bir **karşılaştırma ölçütü** (pozitif kontrol) olarak kullanılmasının nedenidir. Alkolün kanda
ölçülebilir bir metilasyon imzası verdiği de büyük kohortlarda gösterilmiştir [12], ancak bu imza
diğer maddelere genellenememektedir.

### 1.3 Epigenetik saatler ve yaş ivmesi

Epigenom-geneli ilişkilendirme çalışmalarının (EWAS) tasarım ve analizinde hücre-tipi
kompozisyonu, batch etkisi ve çoklu-test düzeltmesi kritik tuzaklardır [13,14,15]; bu nedenle her
sinyal teknik ve biyolojik konfonder kontrollerinden geçirilmelidir. Epigenetik saatler
(Horvath [2], Hannum [3], PhenoAge [4], deri-kan saati [42], ileri sürümler GrimAge [5] ve
DunedinPACE [6]) kronolojik yaşa ek olarak biyolojik yaşı ve mortaliteyi kestirir; yaş ivmesi
(EAA) hızlanmış biyolojik yaşlanmanın bir göstergesidir [7]. Bağımlılıkta hızlanmış epigenetik
yaşlanma çeşitli maddelerde tanımlanmıştır; örneğin alkol bağımlılığında epigenetik yaşın anlamlı
biçimde hızlandığı gösterilmiştir [34].

### 1.4 "Ne kadar süredir?" — kullanım süresi, recency ve tersine-çevrilebilirlik

Uygulamalı adli sorunun ikinci yarısı — **süre/recency** — metilasyonun zamansal davranışına
dayanır. En zengin kanıt yine sigaradadır: cg05575921 demetilasyonu doza ve maruziyet süresine
bağımlıdır [41]; sigaraya başlama ile bırakmanın ayrı epigenetik imzaları vardır [36]; imza
bırakıldıktan sonra yıllar içinde kısmen — ama tam olmayan biçimde — geri döner [35] ve bu dinamik
bir "bırakma biyobelirteci" olarak önerilmiştir [37]. Esrarda da bırakıldıktan sonra bile süren
kalıcı epigenom-geneli bozulmalar bildirilmiştir [23]. Daha genel düzeyde, epigenetik yaşın diyet
ve yaşam tarzı müdahaleleriyle kısmen tersine çevrilebildiği/yavaşlatılabildiği randomize
çalışmalarda gösterilmiştir [38,39]. Bu literatür, "ne kadar süredir?" sorusunun en azından bazı
eksenlerde olasılıksal olarak yanıtlanabilir olduğunu, ancak her madde için recency-etiketli
kohort gerektirdiğini ortaya koyar.

### 1.5 Araştırma boşluğu ve amaç

**Bu çalışmanın çıkış noktası özeldir:** elimizdeki ön-makale, hiçbiri repoda bulunmayan veriye
dayanarak birleşik 7-sınıflı bir model ve çok sayıda sayı rapor ediyordu. Atıf verilen 14
accession canlı olarak sorgulandığında **hiçbirinin** iddia edilen veri/sayı olmadığı görüldü
(bkz. `REPORT.md`, Tablo 1). Bu nedenle çalışma, sıfırdan ve **yalnızca doğrulanmış** veriyle
yeniden kurulmuştur.

**Araştırma boşluğu (research gap).** Yasa-dışı/kompleks madde-metilasyon literatüründe (i) tek tek
küçük kohort çalışmaları artmaktadır [28,29,30,40], ancak (ii) **maddeler arası, aynı şeffaf
protokolle, uçtan uca yeniden üretilebilir** bir karşılaştırma; (iii) hangi maddelerin
**gerçekten üretilebilir** sonuç verdiğinin, hangilerinin **hiç insan verisi içermediğinin**
(sentetik kannabinoid, halüsinojen, MDMA, ketamin) ve (iv) "ne kadar süredir?" sorusunun hangi
eksende dürüstçe yanıtlanabilir olduğunun açıkça beyan edildiği, kanıt-dereceli bir envanter
eksiktir. Mevcut çalışma tam olarak bu boşluğu doldurur: PRISMA 2020 envanteri + madde-özgü yeniden
analiz + her sayının kaynağının (gerçek veri mi, bizim hesabımız mı, yoksa yapılamaz mı) ve her
iddianın kanıt düzeyinin (A–E) açık etiketlenmesi. Yasal bir madde olan sigara yalnız kalibrasyon
ölçütüdür; çalışmanın odağı **yasa dışı ve kompleks maddeler ile kullanım süresidir**.

---

## 2. Yöntemler

Çalışmanın uçtan uca analiz iş akışı (sistematik envanter → veri indirme/doğrulama →
diferansiyel metilasyon → makine öğrenmesi → biyolojik yorum/validasyon) Şekil 2'de
şematize edilmiştir.

![Şekil 2. Uçtan uca analiz iş akışı: sistematik envanter, veri doğrulama (SHA-256), diferansiyel metilasyon, makine öğrenmesi ve biyolojik validasyon aşamaları.](out/figures_tr/sekil_pipeline.png)

### 2.1 Sistematik envanter (PRISMA 2020)

NCBI E-utilities (esearch/esummary) ile her madde için "insan + DNA metilasyonu" sorguları
çalıştırıldı (`scripts/15_prisma_inventory.py`). Akış, PRISMA 2020 önerisine uygun dört aşamadan
oluşur: **tanımlama → tarama → uygunluk → dahil etme** (Bölüm 3.1, Şekil 1) [1]. esummary
sayfalama (chunk'lar arası kayıt ezilmesi) hatası düzeltildi. Ham yanıtlar `out/prisma/raw/`,
özet `out/prisma/inventory.json`.

**PICO/PECO yapısı.** Her madde/hastalık sorusu PRISMA 2020 [1] uyumlu PECO çerçevesinde
tanımlandı — **Popülasyon:** insan (gerektiğinde hayvan/hücre hattı/postmortem materyal);
**Maruziyet (Exposure):** belirli madde, ilaç, kronik/genetik hastalık, çevresel etken veya yaşam
tarzı değişkeni; **Karşılaştırma:** sağlıklı/maruz-kalmamış kontrol ya da farklı doz/süre grubu;
**Sonlanım:** CpG metilasyon değişimi, DMR, epigenetik yaş, ilişkili gen/yolak.

**Arama stratejisi (Boolean).** Madde ekseni çekirdek dizisi: `("DNA methylation" OR "EWAS" OR
"CpG methylation") AND ("synthetic cannabinoid" OR "opioid" OR "inhalant" OR "butane" OR "toluene"
OR <madde>) AND ("exposure" OR "duration" OR "biomarker")`; hastalık ekseni: `("DNA methylation"
OR "EWAS") AND ("heart failure" OR "obesity" OR "thalassemia" OR <hastalık>) AND ("blood" OR
"brain" OR "postmortem")`. Diziler NCBI E-utilities üzerinden çalıştırıldı; tam sorgu kayıtları
`out/prisma/inventory.json` içindedir.

**Dahil/dışlama ölçütleri.** *Dahil:* DNA metilasyonu ölçen (EWAS, WGBS, RRBS, EPIC/450K,
piroseküenslama veya hedefli metilasyon) ve maruziyet/hastalık/fenotip bilgisiyle istatistik
raporlayan çalışmalar. *Dışlama:* metilasyon ölçmeyen, yalnız ekspresyon/protein içeren,
metodolojisi belirsiz, tekrarlanamayan veya doğrulanamayan kaynaklar; yetersiz örneklemli
düşük-kaliteli çalışmalar ayrı risk kategorisine alındı.

**Kalite ve yanlılık (bias) değerlendirmesi.** Kanıt tipine göre standart araçlar uygulandı:
randomize-olmayan maruziyet için **ROBINS-I** [68], randomize çalışma için **Cochrane RoB 2** [69],
tanısal doğruluk için **QUADAS-2** [70], tahmin modeli yanlılığı için **PROBAST** [71], AI/ML
tahmin raporlaması için **TRIPOD+AI** [72], görüntü/AI klinik modeli için **CLAIM** [73], gözlemsel
epidemiyoloji raporlaması için **STROBE** [74], genetik ilişkilendirme için **STREGA** [75] ve
metilasyon/mikrodizi veri standardı için **MIAME** [76]. Bu çalışmanın kendi tahmin modelleri
TRIPOD+AI ve PROBAST ölçütlerine göre denetlendi.

### 2.2 Veri kaynakları ve doğrulama

Madde başına bulunabilen en uygun gerçek kohort GEO'dan indirildi; her dosyanın **SHA-256**
özeti `data/manifest.json` içinde sabitlendi. Makalede atıf verilen 14 accession ayrıca canlı
NCBI/EBI/PMC ile doğrulandı (`scripts/11_verify_cited_sources.py`). Bu doğrulama, makalenin
yanlış etiketlediği **iki gerçek madde kaynağını** ortaya çıkardı: GSE49393 (gerçek alkol-beyin)
ve PMC9979153 (gerçek opioid-kan meta-analizi). Yeniden analiz edilen kohortlar Tablo 1'de
özetlenmiştir (tümü Illumina 450K, aksi belirtilmedikçe).

**Tablo 1.** Yeniden analiz edilen gerçek kohortlar (kaynak, doku, örneklem ve not).

| Veri seti | Madde / doku | n | Not |
|---|---|---|---|
| GSE50660 | Sigara / periferik kan | 464 | Referans / yer-gerçeği |
| GSE110043 | Alkol / tam kan | 94 | Sigara-karışımlı (keşifsel) |
| GSE49393 | Alkol / postmortem prefrontal korteks | 48 | 23 AUD / 25 kontrol |
| GSE77056 | Kokain-crack / tam kan | 47 | 23 / 24 |
| GSE154971 | Metamfetamin / periferik kan lenfositi | 24 | 16 / 8; kronolojik yaş yok |
| GSE98203 | Opioid-eroin / postmortem orbitofrontal korteks (nöron çekirdekleri) | 65 | 37 / 28 |
| GSE255929 | Esrar / kan (EPIC-850K) | 93 | Karışımlı → **atıldı** |
| GSE252501 | Alkol / postmortem beyin — NAc + DLPFC (EPIC-850K) | 115 NAc / 117 DLPFC | aynı denekler iki bölge; NAc 56/59, DLPFC 58/59 |
| GSE235818 | Opioid (OUD) / postmortem OFC, FACS-saf nöron (bisülfit, 5mC%) | 38 | 12 OUD / 26 kontrol; okuma sayıları %'den geri kazanıldı |
| GSE164822 | Opioid (OUD) / postmortem dlPFC (EPIC, bulk doku) | 100 | 72 / 28; çapraz-doğrulama + bulk-doku kontrolü |
| GSE137364 | Kokain / postmortem kaudat (bisülfit 5x) | 57 | 28 / 29; dürüst null (bkz. §3.7f) |
| GSE41826 | Nöron (NeuN+) vs glia (NeuN−) referans paneli (450K) | 116 | 58 / 58; hücre-tipi belirteç testi (§3.7e) |

Tablo 1'deki kohortların doku ve platform bakımından heterojenliği, alanın yapısal bir
gerçeğidir: sigara dışındaki maddelerde örneklemler küçük ve sıklıkla postmortem beyindendir.
Bu heterojenlik, kan-eğitimli saatlerin beyne ve EPIC-özgü probların 450K'ya doğrudan
taşınamamasının da temel nedenidir [13,16] ve sonuçların yorumunda boyunca göz önünde tutulmuştur.

**Sistematik tarama kapsamı (veri tabanları).** PRISMA taraması ve doğrulama şu kaynak gruplarını
hedefledi: (i) **literatür** — PubMed/MEDLINE, Scopus, Web of Science, Embase, Cochrane Library,
Google Scholar, Europe PMC, bioRxiv/medRxiv (yalnız metodoloji için arXiv); (ii) **omik/epigenomik
depolar** — GEO, ArrayExpress, ENCODE, Roadmap Epigenomics, TCGA, IHEC, EWAS Catalog, MethBank,
BLUEPRINT, GTEx (ekspresyon entegrasyonu için), erişim gerektiren dbGaP/EGA/SRA; (iii) **kimya/
toksikoloji** — PubChem, ChEMBL, DrugBank, ToxCast, Tox21, Comparative Toxicogenomics Database (CTD),
HMDB, KEGG, Reactome; (iv) **klinik/farmakovijilans** — ClinicalTrials.gov, FDA FAERS, EMA
kaynakları, WHO VigiBase (erişim varsa), ICD-10/11 ve ATC sınıflamaları. Bu çalışmada yeniden analiz
edilen tüm gerçek kohortlar GEO'dan indirildi ve canlı NCBI/EBI/PMC ile doğrulandı; erişim kısıtlı
depolar (dbGaP/EGA) yalnız kapsam beyanı için listelenmiştir, veri çekilmemiştir.

### 2.3 Diferansiyel metilasyon (DMP)

Her kohort için β-değer matrisi okundu; mevcut olduğunda **yaş ve cinsiyet** kovaryat olarak
alınarak CpG başına eşit-varyanslı doğrusal model (OLS, limma-eşdeğeri) kuruldu ve **Benjamini-
Hochberg FDR** uygulandı (`scripts/06/07/08/12`) [24]. Bu protokol **tek doğruluk kaynağıdır**;
aynı veriye farklı bir test (örn. Welch) uygulamak farklı anlamlı CpG sayısı üreteceğinden,
tutarlılık için tüm rapor `out/*_dmp.csv` tablolarından beslenir. Gen eşleştirmesi resmi Illumina
450K manifestiyle yapıldı; GO-BP ve KEGG zenginleştirmesi hipergeometrik test + FDR ile hesaplandı
(`scripts/03/09`). Ham IDAT mevcut olduğunda normalizasyon için minfi standartları temel alındı
[16]; batch farkları, EWAS önerileri uyarınca tasarım aşamasında değerlendirildi [14,15].

### 2.4 Epigenetik yaş (saatler)

Horvath 2013 (353 CpG) [2], Hannum 2013 (71 CpG) [3] ve PhenoAge/Levine 2018 (513 CpG) [4]
saatleri, katsayıları halka açık depolardan (SHA kayıtlı) alınarak uygulandı (`scripts/05/10/13`).
Her saat kronolojik yaşa karşı Pearson r ve MAE ile doğrulandı; **yaş ivmesi (EAA)** = saatin yaşa
regresyonunun residüeli, vaka/kontrol arasında Welch t ile karşılaştırıldı. GrimAge [5] ve
DunedinPACE [6], katsayıları kapalı/lisanslı ve/veya R-Bioconductor gerektirdiği için
**hesaplanmadı ve beyan edildi**; bu saatlerin mortalite ve yaşlanma-hızı kestirimindeki üstünlüğü
literatürde gösterilmiştir [5,6,7].

### 2.5 İstatistiksel güç

Her kohortun kendi DMP t-değerlerinden Cohen d tam olarak geri hesaplandı
(d = t·√(1/n₁+1/n₂)); genom-geneli eşik (Bonferroni 0,05/test) altında, gözlenen N'deki güç ve
%80 güç için gerekli örneklem `statsmodels` ile bulundu (`scripts/19_power.py`).

### 2.6 Makine öğrenmesi (sızıntısız)

Yalnızca yeterince büyük tek kohort olan sigara (GSE50660) üzerinde, **güncel vs hiç içmemiş**
ikili sınıflandırması yapıldı. Protokol (`scripts/04`, `scripts/18`): StratifiedKFold (k=5,
seed=42); öznitelik seçimi (top-200 t-test) **her fold'un yalnız eğitim kısmında** yapıldı
(sızıntı yok). Sınıf dengesizliği `class_weight`/`scale_pos_weight` ile yönetildi. Üç model
karşılaştırıldı (RandomForest [25], ElasticNet-lojistik, XGBoost [26]); modeller scikit-learn ve
XGBoost ile kuruldu [27]. SHAP yorumu tam-veri XGBoost modelinde hesaplandı (yorum amaçlı;
tarafsız başarım yine çapraz-doğrulamadan).

Ayrıca **metilasyon → yaş + sigara + madde** çıkarımı için çalışan bir tahmin sistemi kuruldu
(`scripts/20_dlsystem.py`, `21_substance_models.py`, `predict.py`): (i) gerçek çok-katmanlı
sinir ağları (MLP; yaş regresörü gizli=(256,64), sigara sınıflandırıcı gizli=(128,32), ReLU,
Adam, erken-durdurma) GSE50660'ta; (ii) madde-özgü XGBoost sınıflandırıcıları (kokain/alkol/
metamfetamin), fold-içi top-K t-test seçimi ve etikete-kör aday-CpG havuzuyla; (iii) bir
metilasyon beta tablosu alıp uygulanabilen tüm motorları çalıştıran, CpG kapsamını dürüstçe
raporlayan bir çıkarım komut satırı aracı. Tüm modeller `seed=42`, sızıntısız ÇV; `out/dl/models/`
altında committed.

### 2.7 Yeniden üretilebilirlik

Tüm betikler `scripts/revize/realdata/scripts/`, çıktılar `out/`, veriler `data/` altında
committed'dır. Sabit seed = 42. Her veri dosyasının SHA-256'sı kayıtlıdır. Her sayısal sonuç,
üreten betiğe ve çıktı dosyasına işaret eder (bkz. `REPORT.md` Bölüm 5; ayrıca Ek 2).

### 2.8 Kanıt derecelendirme çerçevesi (A–E)

Her madde/eksen için bir iddianın **dayanağı**, beş düzeyli bir ölçekle ve makineyle-okunabilir
bir etiketle işaretlendi. Bu çerçeve, "veri yok" demenin ötesinde, hangi sonucun ne kadar
güvenilir olduğunu ve adli/klinik yorumda ne ağırlık taşıyabileceğini şeffaflaştırır (Şekil 16,
kanıt piramidi):

- **A — Doğrudan, replike edilmiş insan kanıtı:** Birden çok bağımsız insan kohortunda
  tekrarlanmış EWAS bulgusu (ör. sigara-AHRR [8,9]).
- **B — Doğrudan tek-kohort insan kanıtı:** Tek gerçek insan kohortunda gösterilmiş; bağımsız
  replikasyon henüz yok. Çalışmamızdaki çoğu madde-özgü bulgu bu düzeydedir.
- **C — Dolaylı insan kanıtı:** Sigara-karışımlı/konfonderli kohort, ilişkili fenotip ya da
  tek-set olarak yeniden hesaplanamayan meta-analiz (ör. opioid-kan meta-analizi [22], esrar [23]).
- **D — Yalnız hayvan / in vitro / mekanistik:** İnsan metilasyon verisi yok; hayvan/hücre kanıtı
  ya da mekanik gerekçe (ör. MDMA fare-kalp DNA metilasyonu [53]; metamfetamin/THC/kokain/opioid
  hayvan modelleri [54-58]).
- **E — İnsan metilasyon verisi yok:** Yalnız yapısal/kimyasal/teorik çıkarım → **NOT_ESTIMABLE**
  (fail-closed; uydurma yapılmaz).

Etiket sözlüğü: **ANALYZED_REAL** (kendi kohortunda yeniden analiz edildi), **COVARIATE_ADJUSTED**
(yaş/cinsiyet/sigara/doku gibi kovaryat), **NO_PUBLIC_HUMAN_DATA → NOT_ESTIMABLE** (kamuya açık
insan verisi yok). Tam taksonomi Ek 1'dedir.

### 2.9 Temel hesaplamalar ve denklemler

Aşağıdaki çekirdek nicelikler tüm madde/doku analizlerinde aynı biçimde hesaplandı (tek doğruluk
kaynağı, §2.3); tanımlar standart EWAS literatürünü izler [16,24] ve hepsi committed betiklerle
yeniden üretilir (Ek 2):

- **β-değeri (metilasyon oranı):** β = M ÷ (M + U + α); burada M metile, U metilsiz sinyal
  yoğunluğu, α (=100) küçük paydalarda kararlılık için eklenen sabittir. β ∈ [0, 1] doğrudan
  yorumlanabilir bir orandır.
- **M-değeri:** M-değeri = log₂(β ÷ (1 − β)). İstatistiksel testler, varyansı sabitlediği için
  M-değerleri üzerinde kuruldu; raporlanan etki yönleri yorum kolaylığı için β cinsindendir.
- **Delta-beta (etki büyüklüğü):** Δβ = β(maruz) − β(kontrol). Şekillerde ve metinde verilen
  yön/büyüklük bu farktır.
- **Diferansiyel metilasyon skoru (yalnız aday sıralaması):** DMS = w₁·|Δβ| + w₂·(−log₁₀ FDR) +
  w₃·C; burada C biyolojik önem (gen/anotasyon) ağırlığı, w₁–w₃ model ağırlıklarıdır. Bu bileşik
  skor sadece aday CpG **sıralamasında** kullanıldı; istatistiksel anlamlılık her zaman BH-FDR'den
  okundu (DMS bir anlamlılık testi değildir).
- **Maruziyet olasılığı (çok-sınıf, softmax):** P(E_k | X) = exp(z_k) ÷ Σ_j exp(z_j), j = 1…K;
  burada z_k, k'ıncı madde sınıfının model skorudur. Madde-özgü sınıflandırıcıların çıktısı bu
  olasılıktır; kalibrasyonu Şekil 9'da gösterilmiştir.
- **Kullanım süresi (genel biçim):** T_tahmini = f(X, A, S, C, D, M, G) — metilasyon profili X ile
  yaş A, cinsiyet S, kronik hastalık C, ilaç D, madde sınıfı M ve genetik hastalık G'nin işlevi;
  sonuç daima güven aralığıyla verilir: T_tahmini %95 GA = [T_alt, T_üst]. **Önemli kısıt:** bu genel
  model ancak recency/süre-etiketli gerçek kohort olduğunda çözülebilir; çalışmamızda yalnız
  **tütün** için ampirik olarak kestirilebildi (§3.8); diğer maddelerde fail-closed
  **NOT_ESTIMABLE** döndürülür (uydurma süre verilmez).

### 2.10 Konfonder kontrol modeli

Madde sinyalini karıştırıcılardan ayırmak için her CpG'de çok-değişkenli doğrusal model kuruldu:

> Y(CpG) = β₀ + β₁·E + β₂·Yaş + β₃·Cinsiyet + β₄·BMI + β₅·Sigara + β₆·İlaç + β₇·Hastalık +
> β₈·HücreTipi + ε

Burada E ilgili maruziyettir (madde/doz/süre); kalan terimler karıştırıcıdır. Hangi karıştırıcının
ölçülü olduğu veri setine göre değişir; **ölçülemeyen** karıştırıcılar açıkça beyan edilir ve ilgili
bulgunun kanıt düzeyini düşürür. Karıştırıcıların kaynağı, olası etkisi ve bu çalışmada ele alınışı
Tablo 9'da; doku/hücre-tipi/batch/sigara karışımının sinyale etkisinin şematik haritası Şekil
15'tedir.

**Tablo 9.** Konfonder kontrol matrisi: her karıştırıcının olası etkisi ve bu çalışmadaki ele
alınışı.

| Karıştırıcı | Olası etki | Bu çalışmada ele alınış |
|---|---|---|
| Yaş | Genom-geneli saat kayması | Model kovaryatı; üç epigenetik saatle ayrıca ölçüldü (§3.3) |
| Cinsiyet | X + binlerce otozomal CpG'de fark | Model kovaryatı; ayrı sentezlendi (§4.13) |
| BMI / obezite | ABCG1/SREBF1 vb. replike sinyal | Kovaryat; ham veride yoksa beyan (§4.9) |
| Sigara | Güçlü AHRR hipometilasyonu | En büyük karıştırıcı; ayrı analiz + kovaryat (§3.7d, §4.7) |
| Alkol | Kan/beyin DMP'leri | Ayrı analiz (§4.6) |
| İlaç kullanımı | Antidepresan/opioid tedavi etkisi | Çoğu kohortta ölçülemedi → beyan (§4.10) |
| Hücre-tipi kompozisyonu | Bulk dokuda sahte sinyal | Referans panelle test edildi (§3.7e); araç seti §2.12, Tablo 11 [10,11,59] |
| Batch etkisi | Teknik kayma | Tasarım aşamasında değerlendirildi [14,15] |
| Doku tipi | Kan↔beyin taşınamazlığı | Bölge-özgü analiz (§3.7; Şekil 24) |
| Postmortem aralık | Postmortem dokuda metilasyon kayması | Sabit/dar olduğunda beyan (§3.7) |
| Psikiyatrik hastalık | Depresyon/şizofreni DMP'leri | Kovaryat; ayrı sentez (§4.12) |
| Kronik/genetik hastalık | Kanser/yaşlanma örtüşmesi | Kovaryat (§4.9) |

### 2.11 Ölçüm platformları: 450K / EPIC / WGBS

Metilasyon ölçüm platformları kapsam ve çözünürlük bakımından ayrışır; bu, bulguların doku ve
platform arası taşınabilirliğini doğrudan sınırlar [13,16]. Üç ana platformun karşılaştırması Tablo
10'da, dahil edilen kohortların platform dağılımı Şekil 18'dedir.

**Tablo 10.** Metilasyon ölçüm platformlarının karşılaştırması.

| Platform | Yaklaşık kapsam | Çözünürlük | Güçlü yön | Kısıt |
|---|---|---|---|---|
| Illumina 450K | ~485.000 CpG | Tek-CpG, dizi (array) | Geniş kohort, ucuz, standart anotasyon | Genomun küçük kısmı; prob-tabanlı |
| Illumina EPIC (850K) | ~865.000 CpG | Tek-CpG, dizi (array) | Daha çok geliştirici/enhancer kapsamı | 450K ile prob örtüşmesi kısmi → taşıma zor |
| WGBS | Genom-geneli (~28M CpG) | Tek-baz, dizileme | En kapsamlı; CHG/CHH ayrımı | Pahalı; derinlik-bağımlı; küçük n |
| RRBS / hedefli BS | CpG-zengin bölgeler | Tek-baz, dizileme | Maliyet-etkin derin kapsam | Kapsam CpG-adası ağırlıklı; ölçülebilir-site darboğazı |

Bu farklar, kan-eğitimli saatlerin beyne ve EPIC-özgü probların 450K'ya doğrudan taşınamamasının
temel nedenidir ve sonuç yorumunda gözetilmiştir (§2.2, §3.7).

### 2.12 Hücre-tipi heterojenliği düzeltmesi: araç seti

Bulk (karışık) doku örneklerinde gözlenen metilasyon farkı, gerçek bir epigenetik değişimden değil
örnekler arası **hücre-tipi kompozisyonu** farkından kaynaklanabilir; bu, kan, beyin ve tümör
örneklerinde EWAS'ın en kritik karıştırıcılarından biridir [13,14]. Alanda standart düzeltme iki
aileye ayrılır. **(i) Referans-tabanlı dekonvolüsyon**, bilinen saf hücre tiplerinin metilasyon
profillerini kullanarak oranları kestirir: minfi'nin `estimateCellCounts` işlevi Houseman
algoritmasıyla kan için CD4+/CD8+ T, B, NK, monosit ve granülosit oranlarını verir [10,16]; EpiDISH
(RPC/CBS/CP yöntemleri) kan ve karışık doku için sağlam dekonvolüsyon sağlar [59]; EPIC dizileri için
güncel kan referans paneli FlowSorted.Blood.EPIC'tir [60]; beyinde nöron/glia ayrımı için Guintivano
referans paneli kullanılır [11]. **(ii) Referanssız yaklaşımlar**, uygun referans panel
bulunmadığında (beyin, tümör, nadir doku) gizli kompozisyonu doğrudan modelden çıkarır: RefFreeEWAS
referans gerektirmeden hücre karışımını düzeltir [61]; RUVm negatif kontrol problarıyla istenmeyen
varyasyonu giderir [62]; sva/ComBat surrogate değişken ve batch etkisini modele ekler [63]. ChAMP,
450K/EPIC için kalite kontrol-normalizasyon-DMP-DMR adımlarıyla birlikte referans-tabanlı kompozisyon
tahminini uçtan uca sunar [64]; tümör mikroçevresi ve immün infiltrasyon için MethylCIBERSORT [65],
referanssız profil ayrıştırması için MethylResolver [66] kullanılır. Sigara bu çalışmada en güçlü
karıştırıcı olduğundan (§3.7d), hem spesifik CpG metilasyonunu hem de immün hücre oranını etkileyen
sigara imzası EpiSmokEr ile ayrıca sınıflandırılabilir [67]. Bu araç ailesinin özeti Tablo 11'dedir.

R/Bioconductor ortamı bu çalışmada bulunmadığından (§6, madde 1), yukarıdaki dekonvolüsyon araçları
doğrudan **çalıştırılamamıştır**; bunun yerine, yayımlanmış β-matrisleri üzerinde **ampirik bir
referans-panel teşhisi** uygulanmış (saf nörona karşı saf glia, GSE41826; §3.7e) ve hücre-tipi
belirteci olan sahte sinyaller bu yolla işaretlenmiştir. Bu araçların doku-eşleşmiş, ham IDAT'lı
replikasyon kohortlarında standart olarak uygulanması §5.5'te önerilir. Sınır açıkça beyan edilir:
hücre-tipi düzeltmesi yapılmamış bulk doku bulguları temkinle yorumlanır.

**Tablo 11.** DNA metilasyonunda hücre-tipi heterojenliği için yaygın R/Bioconductor araçları.

| Araç | Referans gerekir mi? | En uygun veri | Temel amaç |
|---|---|---|---|
| minfi (`estimateCellCounts`) | Evet | 450K/EPIC kan | Hücre tipi tahmini + genel boru hattı [10,16] |
| FlowSorted.Blood.EPIC | Referans paketi | Kan (EPIC) | Referans metilasyon profili [60] |
| EpiDISH (RPC/CBS/CP) | Evet | Kan / karışık doku | Hücre tipi dekonvolüsyonu [59] |
| Guintivano paneli | Evet | Beyin (nöron/glia) | Beyin için referans dekonvolüsyon [11] |
| RefFreeEWAS | Hayır | Referansı olmayan doku | Referanssız kompozisyon düzeltmesi [61] |
| RUVm | Kısmen | EWAS | Negatif kontrolle istenmeyen varyasyon giderme [62] |
| sva / ComBat | Hayır | EWAS | Gizli değişken + batch düzeltme [63] |
| ChAMP | Evet | 450K/EPIC | Uçtan uca analiz + kompozisyon tahmini [64] |
| MethylCIBERSORT | Evet | Tümör / immün doku | İmmün hücre ayrıştırma [65] |
| MethylResolver | Hayır | Karışık doku | Referanssız profil ayrıştırma [66] |
| EpiSmokEr | Referans imza | Kan | Sigara durumu sınıflandırması (karıştırıcı kontrolü) [67] |

### 2.13 Kemoinformatik modül (yeni psikoaktif maddeler)

Yeni psikoaktif maddeler (NPS) için ölçülmüş insan metilasyon verisi neredeyse hiç bulunmadığından,
bir **yapısal triyaj** katmanı tanımlandı. Bu katman maddenin **kimyasal yapısını** betimler:
SMILES/InChI gösterimi, molekül ağırlığı, LogP, polar yüzey alanı, hidrojen-bağ verici/alıcı sayısı,
halka/halojen sayısı; parmak izleri olarak ECFP4 [50] ve Mordred tanımlayıcıları [51], RDKit ile
hesaplanır [52]. Tanimoto benzerliğiyle bilinen ajanlara (ör. sentetik kannabinoid çekirdek
yapıları) yakınlık ve olası reseptör hedefi (CB1/CB2, μ-opioid) önceliklendirilir. Bir
**EpiToxScore = g(KimyasalÖzellikler, Toksisite, ReseptörAktivitesi, OksidatifStres, İnflamasyon)**
çıkarımı **yalnız kavramsal/hipotez düzeyinde (kanıt düzeyi D–E)** raporlanır (Şekil 22–23).
**Kritik sınır:** kimyasal yapı, ölçülmüş DNA metilasyonunun yerine geçmez; bu modül NPS için
yapısal bir önceliklendirme verir, epigenetik tanı koymaz. Maddenin gerçek metilasyon imzası yoksa
sonuç **NOT_ESTIMABLE** kalır.

---

## 3. Bulgular ve Yorumlar

Aşağıdaki her altbölümde, ilgili tablodan **önce** bulgunun literatürdeki yerini konumlayan bir
atıf paragrafı, tablodan **sonra** ise sonucun yorumu ve kanıt düzeyi verilmiştir.

### 3.1 PRISMA akışı (Şekil 1)

PRISMA 2020, sistematik taramaların raporlanmasında standart akışı tanımlar [1]; aşağıdaki
envanter bu akışa birebir uyar.

![Şekil 1. PRISMA 2020 dört-aşamalı veri seti seçim akışı (tanımlama → tarama → uygunluk → dahil etme).](out/figures_tr/sekil_prisma.png)

```
TANIMLAMA   GEO/E-utilities sorgularıyla tanımlanan kayıt: 7.859
                │
TARAMA      Madde başına alınıp taranan kayıt: 1.295
                │   (konu-dışı / metilasyon-olmayan / yinelenen elendi)
UYGUNLUK    Uygunluk değerlendirmesi → modaliteye göre:
                │   saat+EWAS 52 · EWAS-dizileme 58 · EWAS-dizi(array) 7
DAHİL       Dahil edilen veri seti: 117
                │   (atıf doğrulamasında bulunan 3 yeni gerçek madde kaynağı dahil)
```

Tam envanter `out/prisma/inventory.json` içindedir (117 kayıt + sorgular + ham önbellek; özet Ek 3).
Bu akış, alanın **sigara-ağırlıklı ve heterojen** yapısını sayısal olarak gösterir: tanımlanan
binlerce kaydın yalnızca küçük bir bölümü madde-özgü, doku-eşleşmiş ve yeniden analiz edilebilir
niteliktedir.

### 3.2 Madde-özgü diferansiyel metilasyon

Sigara imzasının altın standardı olan AHRR/cg05575921 hipometilasyonu, büyük insan kohortlarında
tekrar tekrar gösterilmiştir [8,9]; bu nedenle sigara kohortu boru hattımız için bir **yer-gerçeği**
(ground truth) işlevi görür. Tablo 2, altı maddeyi aynı protokolle yan yana koyar.

**Tablo 2.** Madde-özgü diferansiyel metilasyon (aynı yaş/cinsiyet düzeltmeli model + BH-FDR).

| Madde (kohort, doku) | Test edilen prob | FDR<0,05 CpG | Öne çıkan / not |
|---|---|---|---|
| Sigara (GSE50660, kan) — **referans** | ~450K | **89** | cg05575921 **AHRR** #1, p=2,4×10⁻⁵⁵; kanonik sigara CpG'leri en üstte |
| Alkol (GSE110043, kan) | ~450K | **4.387** | **sigara-karışımlı**, yalnız cinsiyet düzeltmesi → keşifsel |
| Alkol (GSE49393, beyin PFC) | 430.407 | **8** | en üst cg00393248 Δβ=+0,051 p=9,3×10⁻⁸; sigaradan **temiz** |
| Alkol (GSE252501, beyin NAc) | EPIC (~770K) | **1.107** | en üst cg03373913 Δβ=+0,019 q=0,0074; **DLPFC'de 0** → bölgeye-özgü; sigaradan temiz (§3.7a) |
| Kokain (GSE77056, kan) | 485.577 | **11.987** | KEGG'de 14 yolak FDR<0,05 |
| Metamfetamin (GSE154971, kan) | ~450K | **398** | yalnız cinsiyet düzeltmeli (yaş yok) |
| Opioid (GSE98203, beyin OFC) | 456.513 | **12** | AHRR anlamsız → sigaradan **temiz**; GO sinaptik ama tek-gen kırılgan |

Volkan grafiği ve en güçlü CpG'lerin görselleştirmesi Şekil 3 ve Şekil 4'tedir.

![Şekil 3. Sigara (GSE50660) için volkan grafiği: AHRR/cg05575921 en güçlü hipometile CpG.](out/figures_tr/sekil_volkan_sigara.png)

![Şekil 4. Sigara kohortunda en güçlü diferansiyel metile CpG'ler ve etki yönleri.](out/figures_tr/sekil_en_guclu_cpg.png)

**Yorum (kanıt düzeyi).** Sigara bulgusu **A düzeyi** (doğrudan, replike): hem klasik EWAS'ta
(#1, p=2,4×10⁻⁵⁵) hem de bağımsız makine-öğrenmesi yorumunda (SHAP, §3.5) AHRR'yi yeniden
bulmamız, literatürdeki kanonik imzayla tam uyumludur [8,9] ve boru hattının doğruluğunu kanıtlar
(ANALYZED_REAL). Kan kohortlarındaki büyük CpG sayıları (alkol-kan 4.387, kokain 11.987) **C
düzeyi**dir: madde kullanan gruplarda sigara içiciliği yüksek olduğundan ve bu kohortlarda sigara
için tam düzeltme yapılamadığından, listeler önemli ölçüde **sigara karışımı** yansıtabilir
(keşifsel). Beyin kohortları (alkol-PFC/NAc, opioid-OFC) küçük ama **sigaradan temiz** ve
nöronal/sinaptik temalıdır → **B düzeyi** (tek-kohort, replikasyon bekliyor). Zenginleştirme
desenleri Şekil 14'tedir.

![Şekil 14. GO-BP/KEGG zenginleştirme: anlamlı terim sayıları ve tek-gen kırılganlığı.](out/figures_tr/sekil_zenginlestirme.png)

**Zenginleştirme (dürüst):** sigarada GO-BP'de 2, KEGG'de 0 (51 genle güç düşük); kokainde
KEGG'de 14 yolak (geniş listeyle temkinli); opioid-beyin ve alkol-beyinde GO/KEGG terimleri
**tek-gen örtüşmeyle** sürüklendiği için biyolojik tema güçlü ama istatistiksel olarak
kırılgan/düşündürücü olarak işaretlendi. Metamfetaminde GO/KEGG'de anlamlı terim yok (n=24).

**Tamamlayıcı opioid-kan kanıtı (bizim değil, yayının):** opioid-kan meta-analizinde (Epigenomics
2022;14(23):1479-1492 [22]) 282 kullanıcı / 10.560 kontrol, 6 CpG (KIAA0226/RUBCNL, CPLX2, TDRP,
RNF38, TTC23, GPR179). Ham veri tek set olmadığından yeniden hesaplanamaz; yalnızca kaynak
gösterilir → **C düzeyi**.

### 3.3 Epigenetik saatler ve yaş ivmesi

Epigenetik saatler kronolojik yaşı ve biyolojik yaşlanmayı kestirir; Horvath pan-dokuyken [2],
Hannum kan-eğitimli [3] ve PhenoAge fizyolojik yaşlanma/sağkalımla ilişkilidir [4]. Saatlerin
mortalite kestirimindeki ileri sürümleri (GrimAge, DunedinPACE) burada hesaplanamadı ama
çerçevenin parçasıdır [5,6,7]. Saat doğrulaması Şekil 5'te, sonuçlar Tablo 3'tedir.

![Şekil 5. Üç epigenetik saatin kronolojik yaşa karşı doğrulanması (Pearson r, MAE).](out/figures_tr/sekil_saat_dogrulama.png)

**Tablo 3.** Saat doğrulaması (r/MAE) ve yaş ivmesi (EAA) vaka-kontrol karşılaştırması.

| Kohort (doku) | Horvath r / MAE | Horvath EAA p | Hannum r/MAE · p | PhenoAge r/MAE · p |
|---|---|---|---|---|
| Sigara (kan) | 0,77 / 3,5y | 0,24 (null) | 0,80 / 7,8y · 0,352 | 0,75 / 6,8y · **0,051**↑ |
| Kokain (kan) | 0,435 / 12,3y | 0,57 (null) | 0,57 / 14,7y · **0,021**↑ | 0,63 / 5,5y · 0,924 |
| Alkol (beyin) | 0,796 / 6,5y | 0,29 (null) | 0,46 / 17,1y · 0,580 | 0,38 / 47,5y · 0,546 |
| Opioid (beyin) | 0,906 / 10,8y | 0,18 (null) | 0,80 / 16,3y · 0,207 | 0,71 / 65,8y · 0,715 |
| Metamfetamin (kan) | — | — | — | — (GEO'da kronolojik yaş **yok** → saat doğrulanamaz) |

**Yorum (kanıt düzeyi).** İki gerçek pozitif sinyal vardır: **kokain**de Hannum yaş ivmesi vaka
grubunda anlamlı yüksek (p=0,021, **B düzeyi**); **sigara**da PhenoAge yaş ivmesi sınırda yüksek
(p=0,051). Diğer EAA karşılaştırmaları **null** olarak dürüstçe raporlandı ve abartılmamalıdır.
Kan-eğitimli Hannum/PhenoAge beyin dokusunda daha zayıf; pan-doku Horvath beyinde daha iyi
(r=0,80–0,91) — bu, saatlerin doku-spesifikliğinin gerçek bir yansımasıdır [2,3,4] ve farklı
dokulardaki sonuçların doğrudan kıyaslanamayacağını gösterir.

### 3.4 İstatistiksel güç

Küçük keşif kohortlarında bir null sonucun "etki yok" mu yoksa "güç yok" mu olduğunu ayırmak
zorunludur; bu nedenle her kohort için gözlenen etki büyüklüğünden güç hesaplandı (Tablo 4,
Şekil 6).

![Şekil 6. Kohort başına medyan etki büyüklüğü ve %80 güç için gerekli örneklem.](out/figures_tr/sekil_guc.png)

**Tablo 4.** İstatistiksel güç (anlamlı CpG'lerde medyan Cohen d ve %80 güç için grup başına N).

| Kohort | medyan Cohen d (anlamlı CpG) | %80 güç için N/grup |
|---|---|---|
| Metamfetamin | 2,60 | 15 |
| Alkol-beyin | 1,71 | 32 |
| Opioid-beyin | 1,42 | 22 |
| Kokain-kan | 1,26 | 33 |
| Sigara-kan | 1,21 | 27 |

**Yorum.** Genom-geneli eşik (~10⁻⁷) çok katı olduğundan bu küçük keşif kohortları yalnız
**büyük etkiler** (d>1,2) için yeterince güçlüdür; medyan etki için %80 güç grup başına 15–33
örnek gerektirir → **doğrulama (replikasyon) kohortu şarttır.** Bu, küçük-n bulgularının neden
en fazla **B düzeyi** sayıldığının da niceliksel gerekçesidir.

### 3.5 Makine öğrenmesi (sigara, sızıntısız)

Sınıf dengesizliğinde AUC'nin tek başına yanıltıcı olabileceği iyi bilinir; bu nedenle birden çok
metrik ve birden çok model (RandomForest [25], ElasticNet, XGBoost [26]) karşılaştırıldı. Model
karşılaştırması Şekil 7, ROC eğrileri Şekil 8, kalibrasyon Şekil 9, SHAP Şekil 10'dadır.

![Şekil 7. Üç modelin metrik karşılaştırması (AUC, dengeli doğruluk, duyarlılık, özgüllük).](out/figures_tr/sekil_model_karsilastirma.png)

![Şekil 8. Sızıntısız 5-katlı ÇV ROC eğrileri (RandomForest, ElasticNet, XGBoost).](out/figures_tr/sekil_roc.png)

![Şekil 9. XGBoost olasılık kalibrasyon eğrisi (gözlenen vs beklenen).](out/figures_tr/sekil_kalibrasyon.png)

**Tablo 5.** Sigara sınıflandırma başarımı (güncel vs hiç içmemiş; sızıntısız StratifiedKFold-5).

| Model | ROC-AUC | Dengeli doğruluk | Duyarlılık | Özgüllük |
|---|---|---|---|---|
| RandomForest | 0,950 | 0,565 | 0,136 | 0,994 |
| ElasticNet (L1/L2) | 0,821 | 0,702 | 0,409 | 0,994 |
| **XGBoost** | 0,928 | **0,923** | **0,864** | 0,983 |

![Şekil 10. SHAP: tam-veri XGBoost modelinde en bilgilendirici belirteçler (AHRR ilk sırada).](out/figures_tr/sekil_shap.png)

**Yorum.** RandomForest yüksek AUC'ye rağmen dengesizlik nedeniyle gerçek duyarlılığı çok düşüktür
(0,136) — AUC'nin tek başına neden yanıltıcı olduğunun somut kanıtı. `scale_pos_weight`'li
**XGBoost** gerçek kullanışlı modeldir [26]. RandomForest için permütasyon testi şans-üstü
doğruladı (p=0,016). **SHAP**, tam-veri XGBoost modelinde en bilgilendirici belirteç olarak yine
**cg05575921 (AHRR)**'yi seçti (ardından cg21566642, cg06126421) — modelin gürültü değil **gerçek
biyoloji** öğrendiğinin, literatürdeki AHRR imzasıyla örtüşen bağımsız bir doğrulaması [8,9]
(**A düzeyi**). **Çoklu-madde 7-sınıf sınıflandırma yapılamadı:** farklı platform/doku/çok küçük n
nedeniyle birleşik model **imkânsızdır** (açık beyan).

### 3.6 Tahmin sistemi: derin ağlar, madde sınıflandırıcıları ve çıkarım

Makalenin uydurma "ensemble ML, MAE 2,1 yıl, R²=0,96" ve çoklu-madde tahmin iddialarının gerçek,
çalışan karşılığı kuruldu: **metilasyon girer → epigenetik yaş + sigara + madde durumu çıkar.**
ML mimarisi Şekil 19'da şematize edilmiştir.

![Şekil 19. Uçtan uca tahmin sisteminin mimarisi (girdi β-matrisi → saat + sınıflandırıcılar → çıktı).](out/figures_tr/sekil_ml_mimari.png)

**(a) Derin sinir ağları (MLP, GSE50660, n=201).** Sıfırdan eğitilen gerçek çok-katmanlı
perceptron'lar (Tablo 6):

**Tablo 6.** Derin ağ (MLP) başarımı (dürüst kat-dışı OOF).

| Görev | Mimari | Dürüst OOF başarım |
|---|---|---|
| Yaş regresörü (derin) | MLP (256,64) | MAE = 5,40 yıl; r = 0,38; R² = 0,04 |
| Sigara sınıflandırıcı (derin) | MLP (128,32) + oversample | AUC = 0,72; dengeli doğr. = 0,56 |

n=201, dar yaş aralığı (40–65) ve sigara-optimize özniteliklerle sıfırdan derin ağ, **doğrulanmış
Horvath saatini** (r=0,77; MAE=3,5y; §3.3) ve **XGBoost'u** (AUC=0,928; §3.5) **geçemedi** — küçük
veride derin öğrenmenin klasik yöntemlerin gerisinde kaldığının dürüst bir kanıtıdır. Düşük R²
(0,04) bilinçli olarak raporlanır: ön-makalenin "R²=0,96" iddiasının aksine, bu dar yaş aralığında
gerçek açıklanan varyans küçüktür. Bu nedenle dağıtılan çıkarım motoru birincil olarak **Horvath
saati (yaş) + XGBoost (sigara)** kullanır; MLP'ler derin-öğrenme kıyas modeli olarak raporlanır.

**(b) Madde-özgü sınıflandırıcılar** (sızıntısız StratifiedKFold-5, fold-içi top-K t-test, XGBoost;
Tablo 7). Madde AUC'leri Şekil 11'de görselleştirilmiştir.

![Şekil 11. Madde-özgü sınıflandırıcıların kat-dışı ROC-AUC değerleri.](out/figures_tr/sekil_madde_auc.png)

**Tablo 7.** Madde-özgü sınıflandırıcılar (kohort, örneklem, OOF başarım).

| Madde | Kohort (doku) | n (vaka/kontrol) | OOF ROC-AUC | Dengeli doğr. |
|---|---|---|---|---|
| Kokain | GSE77056 (kan) | 47 (23/24) | **1,00** | 0,979 |
| Alkol | GSE110043 (kan) | 94 (47/47) | 0,926 | 0,894 |
| Metamfetamin | GSE154971 (PBL) | 24 (16/8) | 0,922 | 0,813 |

**Modellenmeyenler (açık beyan, uydurulmadı):** opioid (GSE98203, yalnız 12 DMP) ve alkol-beyin
(GSE49393, 8 DMP, postmortem) için güvenilir sınıflandırıcı kurulmadı — küçük n ile başarım
yanıltıcı olurdu. Kokain AUC=1,00, küçük örneklemde (n=47) ayrılabilirliği gösterir ama dış
doğrulama gerektirir (**B düzeyi**).

**(c) Çıkarım aracı** (`predict.py`). Bir metilasyon beta tablosu alır, uygulanabilen tüm motorları
çalıştırır ve her motor için **CpG kapsamını** dürüstçe raporlar. Seri-matristen çıkarılan iki
gerçek GSE50660 örneğinde uçtan uca doğrulandı: sigara içen GSM1225377 (kronolojik 50) → Horvath
54,1 y (+4,1), XGBoost sigara %89,9 → "güncel"; hiç içmeyen GSM1225378 (kronolojik 56) → Horvath
56,9 y (+0,87), XGBoost sigara %0,2 → "hiç" — ikisi de doğru. **Kohortlar-arası uyarı:** madde
modelleri yalnız kendi kohortunda doğrulanmıştır; başka kohorta uygulanan madde olasılıkları
batch/platform etkileriyle karışır → **göstergeseldir, tanısal değildir** (araç çıktısında
otomatik beyan edilir) [15]. Karar mantığı Şekil 21'dedir.

![Şekil 21. Çıkarım karar ağacı: hangi eksende olasılıksal yanıt, hangisinde NOT_ESTIMABLE.](out/figures_tr/sekil_karar_agaci.png)

### 3.7 Doğrulama titizliği: bölgeye-özgülük, hücre-tipi konfaundu ve negatif kontroller

Bir bulgunun gerçek madde sinyali mi yoksa **teknik/biyolojik artefakt** mı olduğunu ayırmak adli
ve klinik yorum için kritiktir; EWAS'ta hücre-tipi kompozisyonu ve batch en sık iki konfonderdir
[10,13,14,15]. Bu nedenle her aday sinyal sistematik negatif kontrollerden geçirildi (konfonder
haritası Şekil 15; validasyon akışı Şekil 20).

![Şekil 15. Konfonder haritası: doku, hücre-tipi, batch ve sigara karışımının sinyale etkisi.](out/figures_tr/sekil_konfonder_haritasi.png)

![Şekil 20. Validasyon akışı: aday DMP → bölge/replikasyon/derinlik/hücre-tipi testleri.](out/figures_tr/sekil_validasyon_akisi.png)

**(a) Alkol-beyin sinyali bölgeye-özgüdür (ödül devresi NAc).** GSE252501'de aynı deneklerin iki
beyin bölgesi (nucleus accumbens, NAc; dorsolateral prefrontal korteks, DLPFC) ayrı analiz edildi.
NAc'ta **1.107 DMP** (en üst cg03373913 Δβ=+0,019, q=0,0074) bulunurken **DLPFC'de 0 DMP** çıktı.
NAc'taki 1.107 DMP'nin **tamamı** aynı-denek DLPFC verisinde per-lokus (±2 kb pencere, BH-FDR) test
edildi: **1.076'sı (%97,2)** yalnız NAc'a özgü (REGION_SPECIFIC_NAc_ONLY), **29'u (%2,6)** iki
bölgede de aynı yönde tutar, 2'si DLPFC'de ölçülmemiş. En güçlü DMP (cg03373913) DLPFC'de p=0,61.
Sinyal bir batch/teknik kuyruk olsaydı DLPFC'de de yanması beklenirdi; yanmaması bunların **gerçek
ama ödül-devresine özgü** sinyaller olduğunu gösterir (**B düzeyi**).

**(b) İki-bölge adayları bağımsız kohortta replike olmadı.** İki bölgede de tutan en genellenebilir
2 aday, tamamen bağımsız bir alkol-beyin kohortunda (GSE49393, postmortem PFC, 450K, n=48) test
edildi: cg01861657 bağımsız kohortta **ters yönde ve anlamsız** (p=0,486) → DOES_NOT_REPLICATE;
cg03301622 EPIC'e özgü bir probtur, hg38→hg19 lift edildi ama lift edilen konumun ±2 kb'inde test
edilmiş 450K probu yok (en yakın prob **5.521 bp** uzakta) → NOT_MEASURABLE_ON_INDEPENDENT_COHORT.
Bu adaylar GSE252501'e özgü kalır; tek-kohort-ötesi sağlamlık **henüz desteklenmemiştir** (dürüst
beyan).

**(c) Opioid aday lokusu, okuma-derinliği hesaba katılınca doğrulanmaz.** GSE235818 (OUD, postmortem
OFC, FACS-saf nöron, bisülfit) ilk taramada % üzerinde Welch t ile tek DMP vermişti: chr3:32781045
(q=0,0076). Bu test okuma derinliğini ve replika aşırı-dağılımını yok sayar. Ham okuma sayıları
kamuya açık olmadığından, her % değerinden sürekli-kesir ile (M/N) okuma sayıları **tam** geri
kazanıldı (geri-kazanım hatası 5,7×10⁻¹⁴ %; medyan ~32× kapsam; en-sade-terim → muhafazakâr **alt**
sınır). Aşırı-dağılımlı F testi: **0 DMP** (q=1,0). DSS dağılım-küçültmeli beta-binom Wald: **0 DMP**
(min q=0,131; chr3:32781045 q=0,159) → **NOT_CONFIRMED**, iki bağımsız dağılım-duyarlı testle
teyitli [17,18]. Orijinal q=0,0076, yüzde-yaklaşımının (derinliği ve biyolojik varyansı yok
saymanın) bir artefaktıdır. Bağımsız kohort GSE98203'te (saf nöron, 450K) ve GSE164822'de (dlPFC)
de aynı lokus doğrulanmaz.

**(d) Bu NULL bir "yokluk kanıtı" değil, bir güç kısıtıdır (dürüst çerçeve).** DSS testinin gerçek
gücü spike-in kalibrasyonuyla ölçüldü: bu veri seti + kapsamda ≥%80 güce ulaşılan en küçük etki
(MDE) **20 puan** (orta-metilasyon tabakası); tam-null altında genom-çapı yanlış-pozitif oranı
**4,6×10⁻⁵** (iyi kalibre) [17]. Aday etkisi (~2,3 puan) MDE'nin (~20 puan) **çok altındadır** →
"bu kadar küçük bir etki bu derinlik/örneklemde (n=12 vs 26) saptanamaz" demektir; daha büyük
gerçek bir etkinin yokluğunu **kanıtlamaz**. Mis-spesifik (5× şişirilmiş) dispersiyon altında bile
MDE 20–25 puan bandında kalır.

**(e) Bir "opioid" sinyali aslında hücre-tipi belirtecidir (konfaund teşhisi).** Pencere
kenarındaki ayrı bir prob (cg20100151, chr3:32782825, hedeften 1.780 bp) yalnız **bulk** dlPFC
dokuda (GSE164822) anlamlıydı (FDR=0,0021, hipometilasyon), ama **saf-nöron** OFC kohortunda
(GSE98203) yön ters/anlamsız (p=0,645). Bunun hücre-tipi kompozisyon artefaktı mı olduğu
**doğrudan referansla** test edildi: kanonik nöron/glia paneli GSE41826 (Guintivano 2013; 58 saf
nöron NeuN+, 58 saf glia NeuN−, 450K) [11]. cg20100151 nöron (β=0,743) ile glia (β=0,901) arasında
**devasa** fark gösteriyor: Δ=−0,158, Welch t=−25,1, p=1,2×10⁻³⁶, **Cohen d=−4,66** →
IS_A_CELL_TYPE_MARKER. Dolayısıyla bulk dokudaki "opioid hipometilasyonu" neredeyse kesinlikle
gruplar arası **nöron/glia oranı** farkından kaynaklanır (vakalarda görece daha yüksek nöron oranı
tam da bu hipometilasyonu üretir; bu, saf-nöron kohortunda sinyalin neden kaybolduğunu da açıklar)
— opioide bağlı gerçek bir nöronal değişim olarak **alınamaz**. Bu, hücre-tipi düzeltmesi yapılmadan
yorumlanan bulk-beyin EWAS'larının nasıl sahte sinyal üretebileceğinin somut bir örneğidir [10,11].
Sistematik pencere taraması (±2 kb, 9 prob) yalnız bu probu artefakt işaretledi (1/9) → gizli ikinci
bir bulk-yalnız sahte sinyal yok.

**(f) Kokain-beyin NULL'u kapsam değil, ölçülebilir site sayısı darboğazıdır.** GSE137364 (kaudat,
bisülfit) 57 denekte 0 DMP (min q=0,739); 5× complete-case filtresinden yalnız ~1.120 CpG tüm
donörlerde eşzamanlı ölçülebildi. Spike-in: yüksek kapsam (medyan ~62×) sayesinde per-site güç
yüksek (MDE 3 pp nominal; 3 pp'de güç 0,88), tam-null FPR 0/1.120 → darboğaz **prob sayısı**,
per-site duyarlılık değil [17,18].

Bu negatif kontroller çalışmanın **yanlış-pozitif üretmeme** disiplinini gösterir: istatistiksel
anlamlılık tek başına yeterli sayılmaz; bölge, doku-hazırlığı (bulk vs saf hücre), platform ve
okuma-derinliği etkileri sistematik olarak elenir [13,14,15].

### 3.8 Maruziyet çıkarımı: "hangi madde, ne kadar süredir?" (olasılıksal ve dürüst sınırlar)

Çalışmanın uygulamalı hedefi, bir metilasyon profilinden **hangi maddenin** ve **ne kadar süredir**
kullanıldığını çıkarmaktır. Bu, kesinlik iddiasıyla değil **olasılıksal + güven-aralıklı + valide
model** çıktısıyla yanıtlanır; veri olmayan eksende fabrikasyon yerine `NOT_ESTIMABLE` (fail-closed)
döndürülür — adli/TCK bağlamında uydurma bir "X yıldır kullanıyor" bir sanığa zarar verebileceğinden,
güvenli olan budur. Madde imzalarının ayırt-edilebilirliği Şekil 12'de, recency yeniden kurulumu
Şekil 13'tedir.

![Şekil 12. Maddeye-özgü DMP imzalarının çapraz-Jaccard ısı haritası (imzalar birbirinden ayrı).](out/figures_tr/sekil_kaynak_ayrimi_isiharitasi.png)

![Şekil 13. Tütün recency yeniden kurulumu (never/former/current ikili karşıtlıkları, OOF AUC).](out/figures_tr/sekil_kronoloji.png)

**(a) Hangi madde? — imza ayırt edilebilirliği.** Altı gerçek kohortun DMP imzaları (top-2.000 |t|)
arasında çakışma neredeyse sıfırdır: ortalama çapraz-Jaccard **0,0012**, en yüksek **0,0095**
(sigara↔metamfetamin); her maddenin özgüllük indeksi 0,99–1,00. Maddeye-özgü metilasyon imzaları
**birbirinden ayrılabilir** — ancak bu, aynı doku/platformda ve madde için gerçek kohort olduğunda.

**(b) Ne kadar süredir? — kronoloji/recency yeniden kurulumu.** Süre/recency yalnız never/former/
current etiketi kamuya açık olan tek eksende — tütünde — gerçekten kestirilebilir (GSE50660, n=464;
never 179 / former 263 / current 22). Sızıntısız ÇV (StratifiedKFold-5, seed=42, fold-içi ANOVA-F
top-400, sınıf-dengeli XGBoost): üç-sınıf makro AUC **0,79**. İkili karşıtlıklar (OOF AUC):
**güncel-vs-hiç 0,893**, **eski-vs-hiç 0,854**, **güncel-vs-eski 0,660**. eski-vs-hiç'in 0,5'in
üstünde olması, **bırakıldıktan sonra bile** geçmiş tütün maruziyetinin metilasyonda kalıcı iz
bıraktığını (geçmiş rekonstrüksiyonu); güncel-vs-eski'nin ayrılabilirliği ise **recency** (aktif vs
geçmiş) sinyalini gösterir. Bu kalıcılık, sigara bırakımından sonra bile süren epigenetik
bozulmanın gösterildiği literatürle uyumludur [9,23]. Güncel-vs-eski'nin görece zayıf (0,66)
olması yalnız 22 güncel içiciden kaynaklanır ve dürüstçe raporlanır.

**(c) Yetenek taksonomisi (dürüst etiketleme).** Tüm madde taksonomisi §2.8'deki etiketlerle
işaretlenir. Aşağıdaki maddeler için kamuya açık **insan** metilasyon dizi verisi canlı taramada
bulunamadı; bunlar için DMP sayısı veya süre kestirimi **üretilmez** (uydurulmaz; **E düzeyi**,
Tablo 8).

**Tablo 8.** İnsan metilasyon verisi bulunamayan madde/sınıflar (NO_PUBLIC_HUMAN_DATA → E düzeyi).

| Madde / sınıf | Durum | Not |
|---|---|---|
| MDMA / ecstasy | NO_PUBLIC_HUMAN_DATA | yalnız hayvan (fare-kalp GSE68199, MeDIP, null) → D düzeyi |
| LSD · psilosibin · GHB | NO_PUBLIC_HUMAN_DATA | psikedelik/diğer metilasyon dizisi paylaşılmamış |
| Sentetik kannabinoidler ("bonzai") | NO_PUBLIC_HUMAN_DATA | NPS kimyası ayrı modülde gerçek ama bu **metilasyon değildir** |
| Sentetik katinonlar ("bath salts") | NO_PUBLIC_HUMAN_DATA | kimya var, metilasyon yok |
| Uçucular/inhalanlar (toluen, çakmak gazı/bütan) | NO_PUBLIC_HUMAN_DATA | — |
| PCP (fensiklidin) | NO_PUBLIC_HUMAN_DATA | — |
| Benzodiazepinler · barbitüratlar | NO_PUBLIC_HUMAN_DATA | karışık-ilaç kohortlarında ayrıştırılamıyor |

**(d) Eştanı/konjenital durumlar kovaryattır, madde sinyali değil.** Talasemi, kalp yetmezliği,
obezite gibi konjenital/kronik durumlar modele **kovaryat** olarak girer; böylece bir madde
sinyaliyle karıştırılmaz (COVARIATE_ADJUSTED). Kemoinformatik/NPS (Markush) katmanı yalnız
kimyasal **yapıyı** haritalar; bir metilasyon sinyali vermez — yapı sayımı asla madde-özgü
metilasyon yerine geçirilmez (kimyasal-epigenetik ayrımı Şekil 22–23).

![Şekil 22. Kemoinformatik/NPS (Markush) yapısal katmanı — yalnız kimyasal yapı haritası.](out/figures_tr/sekil_cheminformatik.png)

![Şekil 23. Kemoinformatik-epigenetik entegrasyon: yapı katmanı metilasyon yerine geçmez.](out/figures_tr/sekil_chem_epi_entegrasyon.png)

**(e) Çıkarım davranışı.** Bir çıkarım talebi geldiğinde sistem, gerçek modeli olan eksenlerde
olasılıksal yanıt verir (ör. tütün için güncel/eski/hiç olasılığı + epigenetik yaş ivmesi), gerçek
insan verisi olmayan her madde için açıkça **NOT_ESTIMABLE** döndürür, konjenital/kronik durumları
kovaryat olarak ekler. Bu, "hiç veri yok" uyarısı değil; talebin istediği **kalibre, güven-aralıklı,
sahte-kesinlik içermeyen** yanıttır.

---

## 4. Kapsamlı literatür sentezi (kanıt-dereceli)

Bu bölüm, çalışmanın kendi bulgularını alanın geniş literatürüne yerleştirir; her madde/etken için
kanıt düzeyi (A–E, §2.8), veri-durumu etiketi (ANALYZED_REAL / NO_PUBLIC_DATA / NOT_ESTIMABLE) ve
varsa kullanım-süresi/recency kanıtı ayrı ayrı verilir. **Yasa dışı ve kompleks maddeler önce ele
alınır;** yasal bir madde olan sigara, yalnız boru hattını kalibre eden bir karşılaştırma ölçütü
olduğundan sona (§4.7) bırakılmıştır. Genel çerçeve Şekil 16 (kanıt piramidi) ve Şekil 17
(madde–hastalık–ilaç–metilasyon etkileşim ağı) ile özetlenir.

![Şekil 16. Kanıt piramidi (A–E): replike insan kanıtından NOT_ESTIMABLE'a.](out/figures_tr/sekil_kanit_piramidi.png)

![Şekil 17. Madde–hastalık–ilaç–metilasyon etkileşim ağı (düğüm içi harf = kanıt düzeyi).](out/figures_tr/sekil_etkilesim_agi.png)

Madde kohortlarının çoğu postmortem beyinden geldiğinden, çalışmada yeniden analiz edilen beyin
bölgeleri ve bunlara karşılık gelen kohortlar Şekil 24'te şematik olarak özetlenmiştir.

![Şekil 24. Çalışmada yeniden analiz edilen beyin bölgeleri (şematik sagital görünüm): prefrontal/dorsolateral prefrontal korteks, orbitofrontal korteks, nükleus akkumbens, kaudat çekirdek ve hipokampus; her bölge ilgili postmortem kohortla (alkol/opioid/kokain) etiketlenmiştir.](out/figures_tr/sekil_beyin_bolgeleri.png)

### 4.1 Uyarıcılar: metamfetamin ve kokain

**Metamfetamin — B (ANALYZED_REAL).** Metamfetamin bağımlılığında epigenom-geneli ilişkilendirme
çalışması yakın zamanda yayımlanmıştır [28]. Bu çalışmada yeniden analiz ettiğimiz küçük kan
kohortunda (n=24) güçlü ayrılabilirlik bulunmuştur (OOF AUC=0,922; §3.6b), ancak kohortta
kronolojik yaş bulunmadığından epigenetik saat doğrulanamamış (§3.3) ve örneklem küçüklüğü
(güç analizi: %80 güç için grup başına ~15 gerekir; §3.4) dış doğrulamayı zorunlu kılmıştır.
*Kullanım süresi:* metamfetamin için recency-etiketli (yeni/eski/hiç) kamuya açık kohort
bulunmadığından süre kestirimi **NOT_ESTIMABLE** olarak fail-closed döndürülür. *Hayvan kanıtı (D):*
fare modelinde metamfetaminin kalp dokusunda DNA metilasyonunu ve gen ifadesini değiştirdiği
gösterilmiştir (GSE64157) [55] — bu, maddenin gerçek bir epigenetik iz bıraktığını doğrular, ancak
bulgu kalp dokusuna ait ve hayvandan insana geçiş dolaylı olduğundan insan kan/beyin imzasına
genellenemez (literatürden aktarılan kanıt, bu çalışmada yeniden analiz edilmemiştir).

**Kokain — B (ANALYZED_REAL).** Kokain kullanım bozukluğunda insan prefrontal korteksinde
epigenom-geneli metilasyon farklılıkları rapor edilmiştir [29]. Bizim kan kohortumuzda (n=47) tam
ayrılabilirlik (OOF AUC=1,00) ve — incelenen tüm maddeler içinde tek tutarlı epigenetik-yaş
sinyali olarak — Hannum yaş ivmesinde anlamlı yükseklik (p=0,021) bulunmuştur (§3.3, §3.6b). Ancak
yüksek DMP sayısı kısmen sigara karışımını yansıtabilir (madde kullananlarda sigara prevalansı
yüksektir) ve n küçüktür; beyin (kaudat) kohortu ise ölçülebilir-site darboğazıyla null kalmıştır
(§3.7f) → dış doğrulama şarttır. *Kullanım süresi:* recency-etiketli kohort yok → **NOT_ESTIMABLE**.
*Hayvan kanıtı (D):* fare hipokampusunda tüm-genom bisülfit dizilemeyle kokaine bağlı metilasyon
değişiklikleri (GSE200254) [56] ve sıçanda nesiller-arası kokain etkileri (GSE72401) [57] gösterilmiş
olup, bu hayvan verileri kokainin merkezi sinir sisteminde gerçek epigenetik iz bıraktığını
bağımsız biçimde destekler (literatürden aktarılan kanıt; insan süre kestirimine genellenemez).

### 4.2 Opioidler (eroin ve reçeteli opioidler)

**Opioid — beyin: B; kan-meta: C (ANALYZED_REAL / yayın).** Opioid kullanım bozukluğunda insan
orbitofrontal korteksinde saf-nöron metilom ve hidroksimetilom profilleri çıkarılmıştır [40]. Bizim
saf-nöron kohortumuzda aday lokus, okuma-derinliği ve aşırı-dağılım hesaba katıldığında
doğrulanmamış (NOT_CONFIRMED; §3.7c); bir "opioid" adayı ise aslında bir nöron–glia hücre-tipi
belirteci olarak teşhis edilmiştir (§3.7e) — hücre-tipi düzeltmesinin zorunluluğunun somut bir
örneği [10,11]. Kan düzeyinde opioid kullanımı bir meta-analizde CpG'lerle ilişkilendirilmiştir
ama ham veri tek-set olmadığından yeniden hesaplanamaz (C) [22]. Bağımlılık epigenetiğinin
nörobiyolojik temeli mekanistik olarak iyi tanımlanmıştır [19,20]. *Kullanım süresi:* tıbbi opioid
kullanımı ile bağımlılık ayrımı bile veride yapılamadığından süre **NOT_ESTIMABLE**'dır. *Hayvan
kanıtı (D):* fare nöral kök hücrelerinde morfin ve naloksonun TET1-bağımlı bir demetilasyon yolu
üzerinden DNA metilasyonunu değiştirdiği gösterilmiştir (GSE107525) [58] — opioidlerin epigenetik
makineyi doğrudan etkilediğinin bağımsız hayvan kanıtıdır (insan süre/şiddet kestirimine genellenemez).

### 4.3 Esrar ve kannabinoidler

**Doğal esrar — alan düzeyinde A/B; kendi verisi C (yayın).** Esrar, yasa dışı maddeler içinde
metilasyon literatürü en zengin olanıdır: çok-soylu büyük bir meta-analiz yaşam-boyu esrar
kullanımıyla ilişkili metilasyon farklılıkları bildirmiş [31], ağır maruziyet (Yeni Zelanda
boylamsal kohortu [32]) ve kullanım bozukluğu (gazi kohortu [33]) çalışmaları bunu desteklemiş,
esrar kullanımının sperm epigenomunu da etkileyebildiği gösterilmiştir [43]. Süre/kalıcılık
açısından kritik bir bulgu: esrar içiminin **bırakıldıktan sonra bile süren** kalıcı epigenom-geneli
bozulmalarla ilişkili olduğu rapor edilmiştir [23]. Bizim kendi temiz alt-kohort denememiz
sigara-karışımlı çıkıp dışlandığından (§6.6), esrar için yalnız yayımlanmış kanıt aktarılır (C).
*Kullanım süresi:* yaşam-boyu/kümülatif maruziyet bazı çalışmalarda modellenmiştir [31], ancak
bizim yeniden analiz edebileceğimiz recency-etiketli ham kohort olmadığından kendi kestirimimiz
üretilmez. *Hayvan kanıtı (D):* sıçan nükleus akkumbensinde ergenlik dönemi THC maruziyetinin
nesiller-arası metilasyon değişiklikleriyle ilişkili olduğu gösterilmiştir (GSE69984) [54] — bu,
esrarın doğrudan adli açıdan kritik beyin ödül bölgesinde gerçek bir epigenetik iz bıraktığını
hayvan düzeyinde doğrular (literatürden aktarılan kanıt; insan süre kestirimine genellenemez).

**Sentetik kannabinoidler ("bonzai", JWH/AB-türevleri) — E (NO_PUBLIC_DATA → NOT_ESTIMABLE).**
Sentetik kannabinoidler için kamuya açık metilasyon dizi verisi — **insan, hayvan modeli ve
postmortem doku** dahil — canlı taramada bulunamamıştır (GEO hayvan-organizma filtresinde de sıfır
sonuç). Bu maddelerin doğal esrardan farmakolojik olarak çok daha güçlü ve değişken
olduğu, dolayısıyla doğal esrar imzasının onlara genellenemeyeceği bilinmektedir; bağımlılık
süreçlerinin epigenetik düzlemde iz bıraktığı mekanistik olarak gösterilse de [19,20], bu bir
madde-özgü metilasyon imzası değildir. Kemoinformatik/NPS (Markush) katmanımız bu maddelerin yalnız
kimyasal **yapısını** haritalar; bir metilasyon sinyali vermez (§3.8d). Bu nedenle sentetik
kannabinoidler için DMP veya süre **üretilmez**.

### 4.4 Halüsinojenler, MDMA, ketamin ve diğer yeni psikoaktif maddeler (NPS)

**LSD, psilosibin, DMT, meskalin — E (NO_PUBLIC_DATA → NOT_ESTIMABLE).** Klasik halüsinojenler için
kamuya açık metilasyon dizi verisi insan, hayvan modeli ve postmortem doku dahil canlı taramada
bulunamamıştır; bu eksenler için DMP veya süre kestirimi üretilmez (Tablo 8).

**MDMA / ecstasy — insan: E (NO_PUBLIC_DATA); hayvan: D (ANIMAL_DATA, ANALYZED_REAL).** İnsan
metilasyon dizi verisi canlı taramada (insan kan/beyin ve postmortem doku dahil) bulunamamıştır.
Tek doğrudan kaynak fare kalp dokusudur: ilgili yayın MDMA'nın kalpte DNA metilasyonunu değiştirdiğini
bildirir [53]. Bu iddiayı sınamak için aynı veri setini (GSE68199; 19 fare) kendi boru hattımızda
yeniden analiz ettik (promotör penceresi TSS ±2 kb tepe-skoru, Welch t + BH-YKO; betik
`nonhuman/mdma_dmp.py`). Sonuç dürüstçe **null**'dur: eşleştirilmiş kontrastların hiçbiri YKO<0,05
eşiğini geçmez (MDMA 10 gün vs salin 10 gün en güçlü q=0,134; MDMA 35 gün vs salin 35 gün q=0,646);
yalnız havuzlanmış tüm-MDMA vs tüm-salin karşılaştırmasında 3 gen öneri düzeyinde kalır (Pak2, Efhb,
Esr2; q=0,068) ve bu da zaman-noktası karışıklığı taşır. Ayrıca veri tepe-temelli olduğundan "tepe
yok = 0" değeri sansürlenmiş kanıttır, ölçülmüş sıfır metilasyon değildir. Dolayısıyla yayın bir etki
bildirse de bizim bağımsız yeniden analizimiz fare kalbinde anlamlı bir MDMA imzası ortaya koymaz;
karşı-bulgu da aynı titizlikle raporlanır. İnsan için madde-özgü DMP ve kullanım süresi
**NOT_ESTIMABLE**'dır.

**Ketamin — E (NO_PUBLIC_DATA → NOT_ESTIMABLE).** Kronik ketamin/eğlence amaçlı kullanım için
kamuya açık insan EWAS canlı taramamızda bulunamamıştır. Hayvan modelleri (fare/sıçan) ayrıca
tarandığında da ketamin maruziyetine özgü bir DNA metilasyon veri seti bulunamamıştır; dolayısıyla
bu eksen insan ve hayvan düzeyinde gerçekten boştur ve süre kestirimi üretilmez.

Bu gruplar için tablo şudur: **sentetik kannabinoidler, klasik halüsinojenler (LSD/psilosibin/DMT/
meskalin) ve ketamin** insan, **hayvan ve postmortem** modelleri dahil canlı taramada hiçbir
madde-özgü metilasyon verisi vermez — bu, "veri yok" demenin değil, alanın gerçek bir araştırma
boşluğunu çok-kaynaklı biçimde belgelemenin sonucudur (§1.5). **MDMA** için yalnız hayvan verisi
vardır; üstelik ilgili yayın bir etki bildirse de aynı veri setini kendi boru hattımızda yeniden
analiz ettiğimizde sonuç null çıkmıştır (kanıt düzeyi D; GSE68199 [53]; ayrıntı §4.4). Hiçbiri için
insan adli bağlamında metilasyona dayalı sayısal bir iddia **savunulamaz**. Genel olarak, bu çalışmada veri taraması yalnız insan kohortlarıyla
sınırlandırılmamış; kanıt piramidinin (§2.8) alt basamaklarını da kapsayacak biçimde **hayvan
modeli, hücre/kök-hücre ve postmortem** kaynaklar da sistematik olarak taranmıştır; bu kaynaklardan
gelen kanıt, çerçevemizde **kanıt düzeyi D** (yalnız hayvan/in vitro) olarak işaretlenir (§2.8).

### 4.5 Enjeksiyon madde kullanımı ve çoklu-madde

**Enjeksiyon madde kullanımı (IDU) — C (yayın).** Aktif enjeksiyon madde kullanımı epigenom-geneli
olarak çalışılmıştır [30]; ancak IDU pratikte çoklu-madde (eroin + kokain + ...) ve sık görülen
HIV/HCV gibi konfaundlarla iç içedir, bu nedenle madde-özgü atıf güçtür. Çoklu-madde kohortlarında
bireysel maddeler ayrıştırılamadığından bunlar için madde-özgü süre kestirimi **üretilmez**.

### 4.6 Alkol

**Alkol — kan: C; beyin: B (ANALYZED_REAL).** Alkol tüketiminin kanda ölçülebilir metilasyon imzası
büyük kohortlarda gösterilmiş (alan düzeyinde A) [12] ve alkol bağımlılığında epigenetik yaşın
anlamlı biçimde hızlandığı bildirilmiştir [34]. Bizim kan kohortumuz (GSE110043) sigara-karışımlı
olduğundan C; alkol-beyin (NAc) sinyali gerçek ama bölgeye-özgü (DLPFC'de sıfır DMP) ve
replikasyonsuz olduğundan B'dir (§3.2, §3.7a-b). *Kullanım süresi:* alkol için recency-etiketli
kamuya açık kohort kullanılmadığından süre **NOT_ESTIMABLE**.

### 4.7 Sigara / tütün (kalibrasyon ölçütü — odak değil)

**Sigara — A (ANALYZED_REAL).** AHRR/cg05575921 hipometilasyonu büyük insan meta-analizlerinde
replike edilmiş kanonik imzadır [8,9]; bu çalışmada hem klasik EWAS'ta hem de bağımsız SHAP
yorumunda yeniden bulunarak boru hattının doğruluğunu kanıtlamıştır (§3.2, §3.5). Bu nedenle sigara
bir **odak değil**, yöntemin pozitif kontrolü / kalibrasyon ölçütüdür. Sigara aynı zamanda
süre/recency sorusunun dürüstçe yanıtlanabildiği **tek** eksendir (§4.8).

### 4.8 Kullanım süresi, kronisite ve tersine-çevrilebilirlik

Çalışmanın uygulamalı hedefi olan "ne kadar süredir?" sorusu, ancak recency-etiketli (hiç /
eski / güncel) veri bulunan eksende — tütünde — gerçekten kestirilebilmiştir: üç-sınıf makro
AUC≈0,79; güncel-vs-hiç OOF AUC=0,893; eski-vs-hiç=0,854 (§3.8b). Bu bulgu literatürle tutarlıdır:
cg05575921 demetilasyonu doza ve maruziyet süresine bağımlıdır [41]; başlama ile bırakmanın ayrı
epigenetik imzaları vardır [36]; imza bırakıldıktan sonra yıllar içinde kısmen — ama tam olmayan
biçimde — geri döner [35] ve bu dinamik bir "bırakma biyobelirteci" olarak önerilmiştir [37].
Esrarda bırakım sonrası kalıcılık [23], genel düzeyde ise epigenetik yaşın diyet/yaşam tarzı
müdahaleleriyle kısmen tersine çevrilebilmesi veya yavaşlatılabilmesi [38,39] de bu zamansal
çerçeveyi destekler. Buna karşın metamfetamin, kokain, opioid ve alkol için recency-etiketli kamuya
açık kohort bulunmadığından süre bu maddelerde **NOT_ESTIMABLE** olarak fail-closed döndürülür —
adli bağlamda sahte-kesinliği önlemek için bilinçli bir tasarım kararıdır.

### 4.9 Kronik, metabolik ve genetik hastalıklar (kovaryat)

Talasemi, kalp yetmezliği gibi konjenital/kronik durumlar bu çalışmada **madde sinyali değil,
kovaryat**tır (COVARIATE_ADJUSTED). Yaşa bağlı metilasyon değişimlerinin kanser gibi hastalıklarla
ilişkisi gösterilmiştir [21]; epigenetik saatlerin biyolojik yaş ve mortalite kestirimi de hastalık
yükünü yansıtır [4,5,7].

**Obezite / BMI — A (doğrudan, replike insan kanıtı; kovaryat).** Beden kütle indeksinin metilomda
güçlü ve tekrarlanmış bir izi vardır: çok-kohortlu büyük bir EWAS, BMI ile ilişkili yüzlerce CpG
bildirmiş, en tutarlı sinyali *ABCG1* (cg06500161) ve *SREBF1* lokuslarında bulmuştur [44].
Mendelyen randomizasyon, bu ilişkinin büyük ölçüde adipozitenin **sonucu** olduğunu — yani
BMI→metilasyon yönünün baskın olduğunu — göstermiştir [45]. Bu nedenle obezite, madde kohortlarında
ayrıştırılması gereken birinci-sınıf bir karıştırıcıdır (Tablo 9); kendi madde kohortlarımızda BMI
çoğunlukla **ölçülmediğinden**, bu eksen sahte-kesinlikten kaçınmak için kovaryat olarak beyan
edilmiş, madde sinyaliyle karıştırılmamıştır.

**Diyabet, kardiyovasküler hastalık ve metabolik sendrom — B/C.** Bu fenotiplerin metilasyon
ilişkileri (büyük ölçüde BMI/inflamasyon ile örtüşerek) insan kohortlarında raporlanmıştır; ancak
elimizde bu hastalıkların **bağımsız, yeniden analiz edilebilir kohortları** bulunmadığından
hastalık-özgü DMP üretilmez, kovaryat düzeyinde ele alınır.

**Genetik/konjenital hastalıklar (talasemi, hemoglobinopatiler, folat-MTHFR ekseni, DNMT/TET/MECP2)
— C/D.** Bu durumların metilasyon makinesini (metil-donör akışı, bakım metilasyonu) etkilediği
mekanistik olarak bilinir [19]; doğrudan insan dizi verimiz olmadığından mekanistik/kovaryat
düzeyde değerlendirilir.

### 4.10 İlaçlar

- **Opioid analjezikler — C.** Kan metilasyon meta-analizi mevcut ama tek-set değil [22]; tıbbi
  kullanım ile bağımlılık ayrımı veride yapılamaz.
- **Antidepresanlar, benzodiazepinler, barbitüratlar — E (NO_PUBLIC_HUMAN_DATA → NOT_ESTIMABLE).**
  Karışık-ilaç kohortlarında ayrıştırılamadığından madde-özgü metilasyon kestirimi üretilmez
  (Tablo 8). İlaç-bağımlılık etkileşimlerinin epigenetik düzlemde var olduğu mekanistik olarak
  bilinse de [19,20], doğrulanabilir insan dizi verisi yoktur.

### 4.11 Yaşam tarzı etkenleri

Yaşam tarzı ekseninde **doğrulanabilir** metilasyon kanıtı esas olarak sigara [8,9] ve alkol [12]
için mevcuttur; bu ikisi yukarıda A/C düzeyinde ele alınmıştır.

**Egzersiz / fiziksel aktivite — B (doğrudan insan kanıtı).** Düzenli antrenmanın iskelet kasında
epigenomu ve transkriptomu eşgüdümlü olarak yeniden programladığı, egzersize-yanıtlı genlerde
metilasyon değişimi yarattığı insan çalışmasında gösterilmiştir [46]. İki yıllık diyet + fiziksel
aktivite müdahalesi epigenetik yaş hızını yavaşlatmış (DAMA) [39]; bir pilot randomize çalışmada ise
yaşam tarzı müdahalesiyle epigenetik yaşın kısmen geri çevrilebildiği bildirilmiştir [38]. Egzersiz
bu nedenle madde sinyaline karışabilen **koruyucu/yön-değiştirici** bir kovaryattır; kendi madde
kohortlarımızda fiziksel aktivite **ölçülmediğinden**, bu etken için madde-özgü sayısal kestirim
üretilmemiş, kovaryat olarak beyan edilmiştir.

**Diyet ve metil-donörler (folat, B12, metiyonin, kolin) — B/D.** Metil-donör akışının bakım
metilasyonunu doğrudan beslediği iyi bilinir; randomize müdahalelerde epigenetik yaş üzerinde
etkiler görülmüştür [38,39]. Doğrudan yeniden analiz edilebilir kohortumuz olmadığından
mekanistik/kovaryat düzeyde ele alınır.

Bu beyanlar bir eksiklik gizleme değil, alanın dürüst sınırının ifadesidir: kanıtı olan etkenler
A–B düzeyinde gerçek literatürle sentezlenmiş, kanıtı olmayanlar E/NOT_ESTIMABLE olarak
işaretlenmiştir.

### 4.12 Psikiyatrik hastalıklar (kovaryat)

Bağımlılık kohortlarında psikiyatrik komorbidite kuraldır; bu hastalıkların kendi metilasyon
imzaları olduğundan, madde sinyalinden ayrıştırılmaları zorunludur.

**Depresyon — A (çok-etnili meta-analiz; kovaryat).** Orta-ileri yaşta depresif belirtilerin kan
metilomuyla ilişkisi çok-etnili bir EWAS meta-analizinde gösterilmiştir [47]. **Şizofreni — B
(doğrudan insan kanıtı; kovaryat).** Şizofrenide epigenom-geneli metilasyon farkları bağımsız bir
EWAS'ta raporlanmıştır [48]. Bu fenotipler madde kohortlarında ölçüldüğünde model kovaryatı yapılır;
ölçülmediğinde etkileri beyan edilir ve ilgili madde bulgusunun kanıt düzeyi buna göre yorumlanır.
Bağımlılık–psikiyatri ekseninin nörobiyolojik/epigenetik örtüşmesi mekanistik olarak da iyi
tanımlanmıştır [19,20].

### 4.13 Biyolojik değişkenler: cinsiyet ve yaş

**Cinsiyet — A (doğrudan, replike insan kanıtı; kovaryat).** Cinsiyet, metilomun en güçlü tek
belirleyicilerindendir: X-kromozomu inaktivasyonunun yanı sıra binlerce **otozomal** CpG'de tutarlı
cinsiyet farkı 450K verisinde gösterilmiştir [49]. Bu nedenle tüm DMP modellerimizde cinsiyet
(mevcut olduğunda) kovaryattır (§2.3, §2.10); cinsiyet-dengesiz küçük kohortlarda bu, dış
doğrulamayı zorunlu kılan bir kısıttır.

**Yaş — A (kovaryat + ayrı eksen).** Yaş hem kovaryat hem de başlı başına bir çıktıdır: üç epigenetik
saatle (Horvath [2], Hannum [3], PhenoAge [4]) ayrıca ölçülmüş ve yaş ivmesi (EAA) madde
eksenlerinde test edilmiştir (§3.3). İncelenen maddeler içinde tutarlı EAA sinyali yalnız kokainde
(Hannum, p=0,021) ve literatürde alkolde [34] görülmüştür.

---

## 5. Tartışma

Bu çalışmanın temel mesajı, madde bağımlılığı epigenetiğinin halka açık veriyle **dürüstçe ama
parça parça** incelenebileceği; "tek büyük birleşik model" anlatısının değil, madde-madde, doku-doku,
kanıt-dereceli bir okumanın gerçeği yansıttığıdır. Aşağıda önce çalışmanın vurucu çıktıları
sentezlenmekte, ardından bunların literatürle uyumu, çalışmanın güçlü ve zayıf yönleri ile gelecek
öneriler sunulmaktadır.

### 5.1 Vurucu çıktılar

**(1) Boru hattı doğrulanmıştır (pozitif kontrol).** Sigara/tütün sinyali hem klasik EWAS'ta
(cg05575921/AHRR #1, p=2,4×10⁻⁵⁵; 89 DMP) hem de tamamen bağımsız bir makine-öğrenmesi yorumunda
(SHAP) yeniden bulundu [8,9]. Aynı belirtecin iki ayrı yöntemle işaret edilmesi, sonraki tüm madde
analizlerinin teknik olarak güvenilir bir boru hattından geçtiğinin kanıtıdır; sigara bu çalışmada
bir odak değil, yalnızca bu kalibrasyon ölçütüdür (§3.2, §3.5).

**(2) Sinyal niceliği maddeye göre çarpıcı biçimde dengesizdir.** Kan kohortlarında büyük CpG
sayıları (alkol-kan 4.387, kokain 11.987) elde edilirken beyin kohortları küçük ama temiz sinyaller
verdi. Bu dengesizlik gerçek bir biyolojik fark değil, büyük ölçüde **örneklem büyüklüğü ve sigara
karışımı** farkıdır: madde kullanan gruplarda sigara içiciliği yüksektir ve kan kohortlarında sigara
için tam düzeltme yapılamadı. Bu nedenle kan kohortlarındaki yüksek sayılar keşifsel kabul
edilmelidir; "tek büyük birleşik model" anlatısı (ön-makalenin yaptığı gibi) bu dengesiz veriyle
**desteklenemez** ve örneklem büyüklüğü ile replikasyonun EWAS'ta neden vazgeçilmez olduğunu
vurgulayan metodolojik önerilerle de örtüşmez [13,14] (§3.2, §6).

**(3) İstatistiksel anlamlılık tek başına yeterli değildir — hücre-tipi tuzağı.** Bulk beyin
dokusunda "opioid" hipometilasyonu gibi görünen cg20100151'in aslında bilinen güçlü bir
**nöron-glia hücre-tipi belirteci** olduğu gösterildi (saf nöron β=0,743'e karşı saf glia β=0,901;
GSE41826'da Cohen d=−4,66) [11]. Bu, hücre-tipi kompozisyonu düzeltilmeden yapılan beyin EWAS'larının
nasıl sahte sinyal üretebileceğinin somut bir örneğidir [10] (§3.7).

**(4) Gerçek bulgular bile bölgeye-özgü olabilir.** Aynı deneklerde alkol-NAc DMP'lerinin **%97,2'si**
DLPFC'de tutmadı; yani bir beyin bölgesinden diğerine genelleme yapılamaz. Bu, adli yorumda "beyin
metilasyonu" gibi tek bir etiketle konuşmanın yanıltıcı olabileceğini gösterir (§3.7).

**(5) Epigenetik yaş ivmesi abartılmamalıdır.** Üç saat (Horvath, Hannum, PhenoAge) içinde tek
tutarlı sinyal kokainde Hannum ivmesidir (p=0,021); geri kalan EAA karşılaştırmaları istatistiksel
olarak anlamsızdır (§3.3, §3.6b). Bu bulgu, ön-makalenin "tüm maddelerde belirgin hızlanmış
yaşlanma" iddiasıyla doğrudan çelişir ve yayımlanmış sayıların eleştirel okunması gerektiğini
gösterir.

**(6) "Ne kadar süredir?" sorusu yalnız tek eksende dürüstçe yanıtlanabildi.** Recency-etiketli
(hiç/eski/güncel) tek kohort olan tütünde süre/recency olasılıksal olarak kestirildi (üç-sınıf makro
AUC≈0,79; güncel-vs-hiç OOF AUC 0,893; eski-vs-hiç 0,854; §3.8). Diğer tüm maddelerde recency-etiketli
kamuya açık kohort bulunmadığından süre **NOT_ESTIMABLE** olarak fail-closed döndürüldü; MDMA, LSD,
psilosibin, sentetik kannabinoid ve ketamin için ise kamuya açık insan EWAS hiç bulunamadı
(NO_PUBLIC_DATA). Bu sınırları gizlemek yerine açıkça beyan etmek, adli raporlamada sahte-kesinliği
önler.

### 5.2 Literatürle uyum ve çelişkiler

Sigara bulgumuz (AHRR/cg05575921) literatürdeki kanonik tütün imzasıyla birebir örtüşür [8,9] ve
boru hattının dış geçerliliğini destekler. Uyarıcılar ve opioidler için kendi gerçek sonuçlarımız,
yayımlanmış kohort temelli çalışmaların yönüyle uyumludur ancak etki büyüklükleri küçük örneklemde
temkinle yorumlanmalıdır [28,29,40]. Buna karşılık, ön-makalenin "+2,8…+7,3 yıl genel hızlanmış
yaşlanma" anlatısı bizim gerçek verimizle **desteklenmemektedir**: gerçek EAA değerleri küçük ve
çoğunlukla anlamsızdır. Esrar/kannabinoidler için temiz bir kohort bulunamadığından ilgili etkiler
yalnız yayımlanmış kaynaklar üzerinden ve kanıt düzeyi belirtilerek aktarıldı [23,31,32,33];
halüsinojen, MDMA, ketamin ve sentetik kannabinoidler için kamuya açık insan verisinin yokluğu,
makalenin meşru araştırma boşluğu katkısıdır (§4.4).

### 5.3 Güçlü yönler

(1) **Uçtan uca yeniden üretilebilirlik:** her sayı sabit-seed'li (seed=42), committed betiklerden
veya doğrulanmış kaynaktan gelir; veri SHA-256 ile sabitlenmiştir. (2) **Sızıntısız makine-öğrenmesi
protokolü** ve çok-metrikli değerlendirme [26,27]; SHAP'ın bağımsız olarak AHRR'yi yeniden bulması
iç-geçerliliği güçlendirir. (3) **Sistematik negatif kontroller** ile hücre-tipi/derinlik konfaund
teşhisi [10,11,17,18]. (4) **Kanıt derecelendirme (A–E) ve veri-durumu etiketleri** (ANALYZED_REAL /
NO_PUBLIC_DATA / NOT_ESTIMABLE): her iddianın arkasındaki kanıtın gücü ve sınırı açıkça okunabilir.
(5) **PRISMA 2020 envanteri** (7.859 kayıt → 1.295 tarama → 117 set) ile şeffaf, izlenebilir bir
tarama (§3.1).

### 5.4 Zayıf yönler

Çalışmanın en önemli kısıtları küçük örneklemler, doku/platform heterojenliği ve kan kohortlarındaki
sigara karışımıdır; ayrıca R/Bioconductor gerektiren saatler (GrimAge, DunedinPACE) ile ham IDAT
normalizasyonu bu ortamda hesaplanamamıştır. Bu kısıtlar, abartılı genelleme yapmamayı zorunlu kılar
ve §6'da madde madde ayrıntılandırılmıştır.

### 5.5 Gelecek çalışmalar

Öncelik, **sigara-düzeltmeli, doku-eşleşmiş, recency-etiketli ve güç analizine göre yeterince büyük
(grup başına ≥30) replikasyon kohortlarıdır.** Beyin çalışmalarında referans-tabanlı hücre-tipi
dekonvolüsyonu (Guintivano paneli [11], EpiDISH [59]) veya beyin için referanssız düzeltme
(RefFreeEWAS/RUVm/sva [61,62,63]) ile ham IDAT'tan minfi/SeSAMe normalizasyonu [16] standart hâle
gelmelidir; uygun olduğunda ChAMP [64] gibi uçtan uca boru hatları kompozisyon tahminini analizle
bütünleştirir.
Kamuya açık insan verisi hiç bulunmayan maddeler (MDMA, halüsinojenler, sentetik kannabinoidler,
ketamin) için öncelikli ihtiyaç, etik onaylı ve recency-etiketli birincil kohortların
oluşturulmasıdır. Böylece çalışmanın temel katkısı yalnız pozitif sayılar değil, **yanlış-pozitif
üretmeyen, kanıt-dereceli bir doğrulama disiplinidir.**

## 6. Sınırlılıklar

1. **R/Bioconductor yok:** ham IDAT→β normalizasyonu (minfi/SeSAMe [16]), GrimAge [5] ve
   DunedinPACE [6] hesaplanamadı; yayımlanmış β/seri-matris verisi kullanıldı, bu saatler beyan
   edilerek atlandı.
2. **Küçük kohortlar:** kokain (47), meth (24), alkol-beyin (48), opioid-beyin (65) — güç
   analizinin gösterdiği gibi yalnız büyük etkiler için güçlü; replikasyon gerekir.
3. **Sigara karışımı:** kan kohortlarında (özellikle alkol-kan) sigara için tam düzeltme
   yapılamadı; bu listeler keşifseldir.
4. **Doku karışıklığı:** kan ve postmortem beyin kohortları doğrudan birleştirilemez; saat
   doku-spesifikliği sonuçları etkiler [2,3].
5. **Metamfetaminde kronolojik yaş yok:** epigenetik yaş doğrulanamadı.
6. **Esrar:** uygun temiz kohort bulunamadı; kendi alt-kohort analizimiz karışımlı çıkıp atıldı,
   yerine yayımlanmış sayılar yalnız kaynak olarak verildi [23].
7. **GSE66348 (sıçan, NAc):** MeDIP modalitesi β-dizisi olmadığından dizi-tabanlı boru hatta
   uymadı; dışlandı.
8. **Hücre-tipi kompozisyonu:** Bulk beyin kohortlarında gruplar arası nöron/glia oranı farkı
   sahte DMP üretebilir; R/Bioconductor ortamı olmadığından referans-tabanlı (minfi/EpiDISH/
   FlowSorted [16,59,60], Guintivano paneli [11], Houseman [10]) ve referanssız (RefFreeEWAS/RUVm/
   sva [61,62,63]) dekonvolüsyon araçları çalıştırılamamış, yerine ampirik referans-panel teşhisi
   uygulanmıştır (§2.12, §3.7e); bu araçlar olmadan bulk beyin bulguları temkinle yorumlanmalıdır.
9. **Süre/recency yalnız tütünde:** "Ne kadar süredir kullanıldı?" sorusu yalnız never/former/
   current etiketi olan tütün ekseninde (GSE50660) kestirilebildi; diğer maddeler için recency-
   etiketli kamuya açık kohort olmadığından süre **NOT_ESTIMABLE**'dır (uydurulmaz).
10. **Veri olmayan maddeler:** MDMA, LSD, psilosibin, GHB, sentetik kannabinoid/katinon,
    inhalanlar, PCP, benzodiazepin ve barbitüratlar için kamuya açık insan EWAS bulunamadı; bu
    maddeler için DMP/süre sayısı üretilemez (§3.8c, Tablo 8).

## 7. Sonuç

Madde bağımlılığı epigenetiği, halka açık veriyle **dürüstçe** ancak parça parça incelenebilir.
Bu çalışma, fabrike bir makalenin yerine, PRISMA 2020 envanteri (117 set [1]), kohortların yeniden
analizi, bölgeye-özgü alkol-NAc imzası (1.107 DMP, DLPFC'de 0), hücre-tipi konfaund teşhisi
(cg20100151 → nöron-glia belirteci [11]), üç epigenetik saat [2,3,4], spike-in güç kalibrasyonu,
sızıntısız makine öğrenmesi [26] ve dürüst, kanıt-dereceli (A–E) maruziyet-çıkarım
taksonomisinden (olasılıksal yanıt + NOT_ESTIMABLE) oluşan **tamamen yeniden üretilebilir** bir
iskelet sunar. Sigara dışında güçlü sonuç için daha büyük, sigara-düzeltmeli, doku-eşleşmiş
**replikasyon kohortları** gereklidir.

---

## Etik beyanı

Çalışma yalnızca halka açık, kimliksizleştirilmiş ikincil veri (GEO) kullanır; yeni insan/hayvan
verisi toplanmamıştır. Her kaynak kohort kendi orijinal etik onayı altında yayımlanmıştır.

## Veri ve kod erişilebilirliği

Tüm GEO setleri herkese açıktır (accession'lar metinde). Analiz kodu, çıktılar ve veri SHA-256
değerleri bu repoda committed'dır: betikler `scripts/revize/realdata/scripts/`, sonuç tabloları
`out/`, şeffaflık raporu `REPORT.md`. Sabit seed = 42 ile yeniden üretilebilir (betik→çıktı
eşlemesi Ek 2).

## Çıkar çatışması

Beyan edilmemiştir.

## Yazar katkıları

N.D.B. çalışmanın tasarımını, veri toplama ve doğrulama protokolünü, analiz ve yorumu yürütmüş ve
makaleyi yazmıştır.

## Finansman

Bu çalışma için dış finansman alınmamıştır.

## Teşekkür

Yazar, halka açık veri setlerini paylaşan tüm araştırma gruplarına ve NCBI GEO, EBI ve PMC
altyapılarına teşekkür eder; bu veri paylaşımı olmasaydı bu yeniden analiz mümkün olmazdı.

---

## Kaynaklar

1. Page MJ, McKenzie JE, Bossuyt PM, ve ark. The PRISMA 2020 statement: an updated guideline for
   reporting systematic reviews. *BMJ.* 2021;372:n71. doi:10.1136/bmj.n71 (PMID 33782057)
2. Horvath S. DNA methylation age of human tissues and cell types. *Genome Biol.* 2013;14(10):R115.
   doi:10.1186/gb-2013-14-10-r115 (PMID 24138928)
3. Hannum G, Guinney J, Zhao L, ve ark. Genome-wide methylation profiles reveal quantitative views
   of human aging rates. *Mol Cell.* 2013;49(2):359-367. doi:10.1016/j.molcel.2012.10.016
   (PMID 23177740)
4. Levine ME, Lu AT, Quach A, ve ark. An epigenetic biomarker of aging for lifespan and healthspan
   (PhenoAge). *Aging (Albany NY).* 2018;10(4):573-591. doi:10.18632/aging.101414 (PMID 29676998)
5. Lu AT, Quach A, Wilson JG, ve ark. DNA methylation GrimAge strongly predicts lifespan and
   healthspan. *Aging (Albany NY).* 2019;11(2):303-327. doi:10.18632/aging.101684 (PMID 30669119)
6. Belsky DW, Caspi A, Corcoran DL, ve ark. DunedinPACE, a DNA methylation biomarker of the pace of
   aging. *eLife.* 2022;11:e73420. doi:10.7554/eLife.73420 (PMID 35029144)
7. Horvath S, Raj K. DNA methylation-based biomarkers and the epigenetic clock theory of ageing.
   *Nat Rev Genet.* 2018;19(6):371-384. doi:10.1038/s41576-018-0004-3 (PMID 29643443)
8. Joehanes R, Just AC, Marioni RE, ve ark. Epigenetic Signatures of Cigarette Smoking. *Circ
   Cardiovasc Genet.* 2016;9(5):436-447. doi:10.1161/CIRCGENETICS.116.001506 (PMID 27651444)
9. Zeilinger S, Kühnel B, Klopp N, ve ark. Tobacco smoking leads to extensive genome-wide changes
   in DNA methylation. *PLoS One.* 2013;8(5):e63812. doi:10.1371/journal.pone.0063812
   (PMID 23691101)
10. Houseman EA, Accomando WP, Koestler DC, ve ark. DNA methylation arrays as surrogate measures of
    cell mixture distribution. *BMC Bioinformatics.* 2012;13:86. doi:10.1186/1471-2105-13-86
    (PMID 22568884)
11. Guintivano J, Aryee MJ, Kaminsky ZA. A cell epigenotype specific model for the correction of
    brain cellular heterogeneity bias and its application to age, brain region and major depression.
    *Epigenetics.* 2013;8(3):290-302. doi:10.4161/epi.23924 (PMID 23426267) (nöron/glia referans
    paneli, GSE41826).
12. Liu C, Marioni RE, Hedman ÅK, ve ark. A DNA methylation biomarker of alcohol consumption.
    *Mol Psychiatry.* 2018;23(2):422-433. doi:10.1038/mp.2016.192 (PMID 27843151)
13. Rakyan VK, Down TA, Balding DJ, ve ark. Epigenome-wide association studies for common human
    diseases. *Nat Rev Genet.* 2011;12(8):529-541. doi:10.1038/nrg3000 (PMID 21747404)
14. Michels KB, Binder AM, Dedeurwaerder S, ve ark. Recommendations for the design and analysis of
    epigenome-wide association studies. *Nat Methods.* 2013;10(10):949-955. doi:10.1038/nmeth.2632
    (PMID 24076989)
15. Leek JT, Scharpf RB, Bravo HC, ve ark. Tackling the widespread and critical impact of batch
    effects in high-throughput data. *Nat Rev Genet.* 2010;11(10):733-739. doi:10.1038/nrg2825
    (PMID 20838408)
16. Aryee MJ, Jaffe AE, Corrada-Bravo H, ve ark. Minfi: a flexible and comprehensive Bioconductor
    package for the analysis of Infinium DNA methylation microarrays. *Bioinformatics.*
    2014;30(10):1363-1369. doi:10.1093/bioinformatics/btu049 (PMID 24478339)
17. Park Y, Wu H. Differential methylation analysis for BS-seq data under general experimental
    design. *Bioinformatics.* 2016;32(10):1446-1453. doi:10.1093/bioinformatics/btw026
    (PMID 26819470)
18. Feng H, Conneely KN, Wu H. A Bayesian hierarchical model to detect differentially methylated
    loci from single nucleotide resolution sequencing data. *Nucleic Acids Res.* 2014;42(8):e69.
    doi:10.1093/nar/gku154 (PMID 24561809)
19. Nestler EJ. Epigenetic mechanisms of drug addiction. *Neuropharmacology.* 2014;76 Pt B:259-268.
    doi:10.1016/j.neuropharm.2013.04.004 (PMID 23643695)
20. Cadet JL. Epigenetics of Stress, Addiction, and Resilience: Therapeutic Implications. *Mol
    Neurobiol.* 2016;53(1):545-560. doi:10.1007/s12035-014-9040-y (PMID 25502297)
21. Teschendorff AE, Menon U, Gentry-Maharaj A, ve ark. Age-dependent DNA methylation of genes that
    are suppressed in stem cells is a hallmark of cancer. *Genome Res.* 2010;20(4):440-446.
    doi:10.1101/gr.103606.109 (PMID 20219944)
22. Lee M, Joehanes R, McCartney DL, ve ark. Opioid medication use and blood DNA methylation:
    epigenome-wide association meta-analysis. *Epigenomics.* 2022;14(23):1479-1492.
    doi:10.2217/epi-2022-0353 (PMID 36700736)
23. Cordero AIH, Li X, Yang CX, ve ark. Cannabis smoking is associated with persistent epigenome-
    wide disruptions despite smoking cessation. *BMC Pulm Med.* 2025;25(1):168.
    doi:10.1186/s12890-025-03634-9 (PMID 40205553)
24. Benjamini Y, Hochberg Y. Controlling the false discovery rate: a practical and powerful approach
    to multiple testing. *J R Stat Soc Series B.* 1995;57(1):289-300.
    doi:10.1111/j.2517-6161.1995.tb02031.x
25. Breiman L. Random forests. *Mach Learn.* 2001;45(1):5-32. doi:10.1023/A:1010933404324
26. Chen T, Guestrin C. XGBoost: a scalable tree boosting system. *Proc 22nd ACM SIGKDD Int Conf
    Knowl Discov Data Min.* 2016:785-794. doi:10.1145/2939672.2939785
27. Pedregosa F, Varoquaux G, Gramfort A, ve ark. Scikit-learn: machine learning in Python.
    *J Mach Learn Res.* 2011;12:2825-2830.
28. Shirai T, Okazaki S, Tanifuji T, ve ark. Epigenome-wide association study on methamphetamine
    dependence. *Addict Biol.* 2024;29(3):e13383. doi:10.1111/adb.13383 (PMID 38488760)
29. Poisel E, Zillich L, Streit F, ve ark. DNA methylation in cocaine use disorder—An epigenome-wide
    approach in the human prefrontal cortex. *Front Psychiatry.* 2023;14:1075250.
    doi:10.3389/fpsyt.2023.1075250 (PMID 36865068)
30. Shu C, Jaffe AE, Sabunciyan S, ve ark. Epigenome-wide association analyses of active injection
    drug use. *Drug Alcohol Depend.* 2022;235:109431. doi:10.1016/j.drugalcdep.2022.109431
    (PMID 35395503)
31. Fang F, Quach B, Lawrence KG, ve ark. Trans-ancestry epigenome-wide association meta-analysis of
    DNA methylation with lifetime cannabis use. *Mol Psychiatry.* 2024;29(1):124-133.
    doi:10.1038/s41380-023-02310-w (PMID 37935791)
32. Osborne AJ, Pearson JF, Noble AJ, ve ark. Genome-wide DNA methylation analysis of heavy cannabis
    exposure in a New Zealand longitudinal cohort. *Transl Psychiatry.* 2020;10(1):114.
    doi:10.1038/s41398-020-0800-3 (PMID 32321915)
33. Garrett ME, Dennis MF, Bourassa KJ, ve ark. Genome-wide DNA methylation analysis of cannabis use
    disorder in a veteran cohort enriched for posttraumatic stress disorder. *Psychiatry Res.*
    2024;333:115757. doi:10.1016/j.psychres.2024.115757 (PMID 38309009)
34. Rosen AD, Robertson KD, Hlady RA, ve ark. DNA methylation age is accelerated in alcohol
    dependence. *Transl Psychiatry.* 2018;8(1):182. doi:10.1038/s41398-018-0233-4 (PMID 30185790)
35. Wilson R, Wahl S, Pfeiffer L, ve ark. The dynamics of smoking-related disturbed methylation: a
    two time-point study of methylation change in smokers, non-smokers and former smokers. *BMC
    Genomics.* 2017;18(1):805. doi:10.1186/s12864-017-4198-0 (PMID 29047347)
36. McCartney DL, Stevenson AJ, Hillary RF, ve ark. Epigenetic signatures of starting and stopping
    smoking. *EBioMedicine.* 2018;37:214-220. doi:10.1016/j.ebiom.2018.10.051 (PMID 30389506)
37. Fang F, Andersen AM, Philibert R, ve ark. Epigenetic biomarkers for smoking cessation. *Addict
    Neurosci.* 2023;6:100079. doi:10.1016/j.addicn.2023.100079 (PMID 37123087)
38. Fitzgerald KN, Hodges R, Hanes D, ve ark. Potential reversal of epigenetic age using a diet and
    lifestyle intervention: a pilot randomized clinical trial. *Aging (Albany NY).*
    2021;13(7):9419-9432. doi:10.18632/aging.202913 (PMID 33844651)
39. Fiorito G, Caini S, Palli D, ve ark. DNA methylation-based biomarkers of aging were slowed down
    in a two-year diet and physical activity intervention trial: the DAMA study. *Aging Cell.*
    2021;20(10):e13439. doi:10.1111/acel.13439 (PMID 34535961)
40. Rompala G, Nagamatsu ST, Martínez-Magaña JJ, ve ark. Profiling neuronal methylome and
    hydroxymethylome of opioid use disorder in the human orbitofrontal cortex. *Nat Commun.*
    2023;14(1):4544. doi:10.1038/s41467-023-40285-y (PMID 37507366)
41. Dawes K, Andersen A, Papworth E, ve ark. Refinement of cg05575921 demethylation response in
    nascent smoking. *Clin Epigenetics.* 2020;12(1):92. doi:10.1186/s13148-020-00882-w
    (PMID 32580755)
42. Horvath S, Oshima J, Martin GM, ve ark. Epigenetic clock for skin and blood cells applied to
    Hutchinson Gilford Progeria Syndrome and ex vivo studies. *Aging (Albany NY).*
    2018;10(7):1758-1775. doi:10.18632/aging.101508 (PMID 30048243)
43. Schrott R, Murphy SK. Cannabis use and the sperm epigenome: a budding concern? *Environ
    Epigenet.* 2020;6(1):dvaa002. doi:10.1093/eep/dvaa002 (PMID 32211199)
44. Wahl S, Drong A, Lehne B, ve ark. Epigenome-wide association study of body mass index, and the
    adverse outcomes of adiposity. *Nature.* 2017;541(7635):81-86. doi:10.1038/nature20784
    (PMID 28002404)
45. Mendelson MM, Marioni RE, Joehanes R, ve ark. Association of body mass index with DNA
    methylation and gene expression in blood cells and relations to cardiometabolic disease: A
    Mendelian randomization approach. *PLoS Med.* 2017;14(1):e1002215.
    doi:10.1371/journal.pmed.1002215 (PMID 28095459)
46. Lindholm ME, Marabita F, Gomez-Cabrero D, ve ark. An integrative analysis reveals coordinated
    reprogramming of the epigenome and the transcriptome in human skeletal muscle after training.
    *Epigenetics.* 2014;9(12):1557-1569. doi:10.4161/15592294.2014.982445 (PMID 25484259)
47. Story Jovanova O, Nedeljkovic I, Spieler D, ve ark. DNA methylation signatures of depressive
    symptoms in middle-aged and elderly persons: meta-analysis of multiethnic epigenome-wide
    studies. *JAMA Psychiatry.* 2018;75(9):949-959. doi:10.1001/jamapsychiatry.2018.1725
    (PMID 29998287)
48. Montano C, Taub MA, Jaffe A, ve ark. Association of DNA methylation differences with
    schizophrenia in an epigenome-wide association study. *JAMA Psychiatry.* 2016;73(5):506-514.
    doi:10.1001/jamapsychiatry.2016.0144 (PMID 27074206)
49. Yousefi P, Huen K, Davé V, ve ark. Sex differences in DNA methylation assessed by 450K BeadChip
    in newborns. *BMC Genomics.* 2015;16(1):911. doi:10.1186/s12864-015-2034-y (PMID 26553366)
50. Rogers D, Hahn M. Extended-connectivity fingerprints. *J Chem Inf Model.* 2010;50(5):742-754.
    doi:10.1021/ci100050t (PMID 20426451)
51. Moriwaki H, Tian YS, Kawashita N, Takagi T. Mordred: a molecular descriptor calculator.
    *J Cheminform.* 2018;10(1):4. doi:10.1186/s13321-018-0258-y (PMID 29411163)
52. Landrum G, ve ark. RDKit: açık kaynak kemoinformatik yazılımı. https://www.rdkit.org
    (erişim Haziran 2026).
53. Koczor CA, ve ark. Ecstasy (MDMA) alters cardiac gene expression and DNA methylation:
    implications for circadian rhythm dysfunction in the heart. *Toxicol Sci.* 2015;148(1):183-191.
    doi:10.1093/toxsci/kfv170 (PMID 26251327; veri: GEO GSE68199)
54. Watson CT, ve ark. Genome-wide DNA methylation profiling reveals epigenetic changes in the rat
    nucleus accumbens associated with cross-generational effects of adolescent THC exposure.
    *Neuropsychopharmacology.* 2015;40(13):2993-3005. doi:10.1038/npp.2015.155
    (PMID 26044905; veri: GEO GSE69984)
55. Koczor CA, ve ark. Methamphetamine and HIV-Tat alter murine cardiac DNA methylation and gene
    expression. *Toxicol Appl Pharmacol.* 2015;288(3):409-419. doi:10.1016/j.taap.2015.08.012
    (PMID 26307267; veri: GEO GSE64157)
56. Zhao X, ve ark. HIV Tat and cocaine interactively alter genome-wide DNA methylation and gene
    expression and exacerbate learning and memory impairments. *Cell Rep.* 2022;39(5):110765.
    doi:10.1016/j.celrep.2022.110765 (PMID 35508123; veri: GEO GSE200254)
57. Le Q, ve ark. Drug-seeking motivation level in male rats determines offspring susceptibility or
    resistance to cocaine seeking. *Nat Commun.* 2017;8:15527. doi:10.1038/ncomms15527
    (PMID 28556835; veri: GEO GSE72401)
58. Liang L, ve ark. Morphine and naloxone facilitate neural stem cells proliferation via a
    TET1-dependent and receptor-independent pathway. *Cell Rep.* 2020;30(11):3625-3631.e6.
    doi:10.1016/j.celrep.2020.02.075 (PMID 32187535; veri: GEO GSE107525)
59. Teschendorff AE, Breeze CE, Zheng SC, ve ark. A comparison of reference-based algorithms for
    correcting cell-type heterogeneity in Epigenome-Wide Association Studies (EpiDISH). *BMC
    Bioinformatics.* 2017;18(1):105. doi:10.1186/s12859-017-1511-5 (PMID 28193155)
60. Salas LA, Koestler DC, Butler RA, ve ark. An optimized library for reference-based deconvolution
    of whole-blood biospecimens assayed using the Illumina HumanMethylationEPIC BeadArray
    (FlowSorted.Blood.EPIC). *Genome Biol.* 2018;19(1):64. doi:10.1186/s13059-018-1448-7
    (PMID 29843789)
61. Houseman EA, Molitor J, Marsit CJ. Reference-free cell mixture adjustments in analysis of DNA
    methylation data (RefFreeEWAS). *Bioinformatics.* 2014;30(10):1431-1439.
    doi:10.1093/bioinformatics/btu029 (PMID 24451622)
62. Maksimovic J, Gagnon-Bartsch JA, Speed TP, Oshlack A. Removing unwanted variation in a
    differential methylation analysis of Illumina HumanMethylation450 array data (RUVm). *Nucleic
    Acids Res.* 2015;43(16):e106. doi:10.1093/nar/gkv526 (PMID 25990733)
63. Leek JT, Johnson WE, Parker HS, ve ark. The sva package for removing batch effects and other
    unwanted variation in high-throughput experiments. *Bioinformatics.* 2012;28(6):882-883.
    doi:10.1093/bioinformatics/bts034 (PMID 22257669)
64. Tian Y, Morris TJ, Webster AP, ve ark. ChAMP: updated methylation analysis pipeline for Illumina
    BeadChips. *Bioinformatics.* 2017;33(24):3982-3984. doi:10.1093/bioinformatics/btx513
    (PMID 28961746)
65. Chakravarthy A, Furness A, Joshi K, ve ark. Pan-cancer deconvolution of tumour composition using
    DNA methylation (MethylCIBERSORT). *Nat Commun.* 2018;9(1):3220.
    doi:10.1038/s41467-018-05570-1 (PMID 30104673)
66. Arneson D, Yang X, Wang K. MethylResolver—a method for deconvoluting bulk DNA methylation
    profiles into known and unknown cell contents. *Commun Biol.* 2020;3(1):422.
    doi:10.1038/s42003-020-01146-2 (PMID 32747663)
67. Bollepalli S, Korhonen T, Kaprio J, Anders S, Ollikainen M. EpiSmokEr: a robust classifier to
    determine smoking status from DNA methylation data. *Epigenomics.* 2019;11(13):1469-1486.
    doi:10.2217/epi-2019-0206 (PMID 31466478)

---

## Ekler

### Ek 1. Kanıt derecelendirme ölçütleri ve madde-bazlı yetenek taksonomisi

| Madde / etken | Kohort / kaynak | Etiket | Kanıt düzeyi |
|---|---|---|---|
| Sigara | GSE50660 (kan) | ANALYZED_REAL | A |
| Alkol (kan) | GSE110043 | ANALYZED_REAL (sigara-karışımlı) | C |
| Alkol (beyin NAc/PFC) | GSE252501 / GSE49393 | ANALYZED_REAL | B |
| Kokain (kan) | GSE77056 | ANALYZED_REAL | B |
| Metamfetamin (kan) | GSE154971 | ANALYZED_REAL | B |
| Opioid (beyin) | GSE98203 / GSE235818 / GSE164822 | ANALYZED_REAL (NOT_CONFIRMED) | B |
| Opioid (kan-meta) | PMID 36700736 | yayın (tek-set değil) | C |
| Esrar | PMID 40205553 (kendi verisi atıldı) | yayın | C |
| Yaş / cinsiyet / doku | tüm modeller | COVARIATE_ADJUSTED | A (kovaryat) |
| Kronik/genetik hastalık | — | COVARIATE_ADJUSTED | C/D |
| Obezite / BMI | EWAS + MR yayını (ABCG1/SREBF1) | COVARIATE_ADJUSTED (yayın) | A (kovaryat) |
| Depresyon | çok-etnili EWAS meta-analizi | COVARIATE_ADJUSTED (yayın) | A (kovaryat) |
| Şizofreni | EWAS yayını | COVARIATE_ADJUSTED (yayın) | B (kovaryat) |
| Egzersiz / fiziksel aktivite | insan kas EWAS + RKÇ | NO_PUBLIC_HUMAN_DATA | B |
| Diyet / metil-donör | RKÇ (epigenetik yaş) | NO_PUBLIC_HUMAN_DATA | B/D |
| MDMA | yalnız hayvan: fare-kalp (GSE68199) | NO_PUBLIC_HUMAN_DATA / ANIMAL_DATA | D |
| Ketamin | — (hayvan dahil tarandı, madde-özgü set yok) | NO_PUBLIC_DATA | E (NOT_ESTIMABLE) |
| LSD/psilosibin/GHB/PCP | — (hayvan+postmortem dahil tarandı) | NO_PUBLIC_DATA | E (NOT_ESTIMABLE) |
| Sentetik kannabinoid/katinon | — (hayvan dahil tarandı, 0 sonuç) | NO_PUBLIC_DATA | E (NOT_ESTIMABLE) |
| İnhalanlar (toluen vb.) | — (hayvan+insan tarandı, madde-özgü set yok) | NO_PUBLIC_DATA | E (NOT_ESTIMABLE) |
| Benzodiazepin/barbitürat | — | NO_PUBLIC_HUMAN_DATA | E (NOT_ESTIMABLE) |

### Ek 2. Yeniden üretilebilirlik — betik → çıktı eşlemesi

| Adım | Betik | Çıktı |
|---|---|---|
| PRISMA envanteri | `scripts/15_prisma_inventory.py` | `out/prisma/inventory.json` |
| Atıf doğrulama | `scripts/11_verify_cited_sources.py` | `out/verify/*.json` |
| Referans doğrulama (PMID/DOI) | `scripts/22_verify_references.py` | `out/refs/references_verified.json` |
| DMP analizi (insan) | `scripts/06/07/08/12` | `out/*_dmp.csv` |
| Hayvan modeli DMP re-analizi (MDMA/kokain) | `nonhuman/mdma_dmp.py`, `nonhuman/cocaine_rat_dmp.py` | `nonhuman/out/*_dmp.json` |
| Zenginleştirme | `scripts/03/09` | `out/*_enrichment.*` |
| Epigenetik saatler | `scripts/05/10/13` | `out/clocks/*` |
| İstatistiksel güç | `scripts/19_power.py` | `out/power/*` |
| Makine öğrenmesi | `scripts/04`, `scripts/18` | `out/ml/*`, `data/gse50660_cache.npz` |
| Tahmin sistemi | `scripts/20/21`, `predict.py` | `out/dl/models/*` |
| Türkçe figürler (23, 300dpi) | `scripts/60_figures_tr.py` | `out/figures_tr/*.png` |
| Beyin-bölgesi figürü (Şekil 24) | `scripts/61_figure_brain_tr.py` | `out/figures_tr/sekil_beyin_bolgeleri.png` |

Tüm betikler `seed=42`; tüm veri dosyalarının SHA-256'sı `data/manifest.json` içindedir.

### Ek 3. PRISMA dahil-edilen veri setlerinin özet envanteri

Dahil edilen toplam **117** veri seti modaliteye göre dağılır: saat+EWAS 52, EWAS-dizileme 58,
EWAS-dizi(array) 7. Tam liste (accession + başlık + sorgu + ham önbellek)
`out/prisma/inventory.json` içindedir. Yeniden analiz edilen 12 çekirdek kohort Tablo 1'de;
platform dağılımı (450K vs EPIC vs WGBS) Şekil 18'de özetlenmiştir.

![Şekil 18. Platform karşılaştırması (450K / EPIC / WGBS): kapsam ve prob sayısı farkları.](out/figures_tr/sekil_platform_karsilastirma.png)
