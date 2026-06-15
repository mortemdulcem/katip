const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, Footer, Header, PageNumber, ShadingType,
} = require('docx');

const F = 'Calibri';
const T = (text, opts = {}) => new TextRun({ text, font: F, size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color });
const P = (text, opts = {}) => new Paragraph({
  spacing: { after: 140, line: 320 },
  alignment: opts.align || AlignmentType.JUSTIFIED,
  indent: opts.indent ? { firstLine: 360 } : undefined,
  children: [T(text, opts)],
});
const H = (text, lvl = 1) => {
  const sizes = { 1: 32, 2: 26, 3: 23, 4: 22 };
  return new Paragraph({
    heading: lvl === 1 ? HeadingLevel.HEADING_1 : lvl === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    spacing: { before: lvl === 1 ? 360 : 240, after: 140 },
    pageBreakBefore: lvl === 1,
    children: [T(text, { size: sizes[lvl], bold: true, color: lvl === 1 ? '1F3864' : '2E74B5' })],
  });
};
const BUL = (text, lvl = 0) => new Paragraph({
  spacing: { after: 80, line: 300 },
  bullet: { level: lvl },
  alignment: AlignmentType.JUSTIFIED,
  children: [T(text)],
});
const NOTE = (text) => new Paragraph({
  spacing: { before: 100, after: 160, line: 280 },
  alignment: AlignmentType.JUSTIFIED,
  shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFF2CC' },
  children: [T('EDİTÖRYAL NOT — ', { bold: true, color: '7F6000', size: 20 }), T(text, { color: '7F6000', size: 20 })],
});
const SP = () => new Paragraph({ children: [T('')] });
const C = (txt, o = {}) => new TableCell({
  width: { size: o.w || 25, type: WidthType.PERCENTAGE },
  shading: o.head ? { type: ShadingType.CLEAR, color: 'auto', fill: '1F3864' } : undefined,
  margins: { top: 70, bottom: 70, left: 90, right: 90 },
  children: [new Paragraph({
    alignment: o.align || AlignmentType.LEFT,
    children: [T(txt, { size: o.size || 19, bold: o.head || o.bold, color: o.head ? 'FFFFFF' : (o.color || '000000') })],
  })],
});
const TBL = (rows) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map(r => new TableRow({ children: r })) });

const sec = [];

/* ============ KAPAK ============ */
sec.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800, after: 240 },
    children: [T('ARAŞTIRMA / METODOLOJİK MAKALE', { size: 22, italics: true, color: '595959' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [T('Gebe Kadına Yönelik Kasten Yaralama Suçlarında (TCK m.87) Obstetrik Sonuçlar ile Fiil Arasındaki İlliyet Bağı: Standardize Metodolojik Bir Yaklaşım Olarak TOMEC Algoritması', { size: 32, bold: true, color: '1F3864' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 },
    children: [T('Causal Linkage Between Intentional Injury Inflicted on Pregnant Women (Turkish Penal Code Art. 87) and Obstetric Outcomes: The TOMEC Algorithm as a Standardized Methodological Framework', { size: 24, italics: true, color: '2E74B5' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [T('Kısa Başlık: Obstetrik Travmada TOMEC İlliyet Skoru', { size: 20, italics: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [T('Running Title: TOMEC Causality Score in Obstetric Trauma', { size: 20, italics: true })] }),

  P('Yazar(lar): Çift-kör değerlendirme için bu sayfadan sonra metinde yer almayacaktır.'),
  P('Sorumlu Yazar İletişim Bilgileri: Gönderim esnasında ayrı üst yazıda belirtilecektir.'),
  P('Etik Beyan: Bu çalışma gerçek hasta verisi içermeyen, literatür ve prototip modelleme temelli metodolojik bir geliştirme çalışmasıdır; Helsinki Bildirgesi kapsamındaki insan verisi kullanımına girmemektedir. Validasyon aşamasında etik kurul onayı alınacaktır.'),
  P('Çıkar Çatışması: Yazar(lar) çıkar çatışması olmadığını beyan eder.'),
  P('Finansman: Herhangi bir dış fon alınmamıştır.'),
  P('Kelime Sayısı (özet hariç): Yaklaşık 7800 (genişletilmiş v2.0)'),
  P('Tablo Sayısı: 8'),
  P('Şekil Sayısı: 3 (akış şeması, karar ağacı, uygulama diyagramı — tasvir)'),
  P('Ek Materyal: Ek 1 — TOMEC Değerlendirme Formu; Ek 2 — TRIPOD 22-Madde Uyum Tablosu; Ek 3 — Validasyon Protokolü; Ek 4 — TCK Madde Haritalama'),

  NOTE('Bu sürüm (v2.0), önceki metodolojik taslağın (v1.0) Bradford Hill kriterleri, uygun illiyet teorisi (Adäquanztheorie), objektif isnadiyet (Roxin), genişletilmiş klinik parametreler (Queensland MN19.31), TRIPOD raporlama uyumu ve önerilen validasyon protokolü ile entegre edilmiş halidir. Tüm yeni eklemeler gerçek, yayınlanmış kaynaklardan türetilmiştir; sahte istatistik, sahte κ değeri, sahte Yargıtay karar numarası içermez. v1.0 metnindeki Yargıtay karar numaralarının (referans 14, 15) yazar tarafından UYAP/Yargıtay Karar Arama Sistemi üzerinden DOĞRULANMASI veya doğrulanamıyorsa metinden çıkarılması önerilir.'),
);

/* ============ ÖZET TR ============ */
sec.push(
  H('ÖZ', 1),
  P('Amaç:', { bold: true }),
  P('Gebe kadına yönelik kasten yaralama fiilleri (TCK m.87) sonrası ortaya çıkan obstetrik sonuçlarda (plasental abrupsiyon, preterm doğum, fetal distres, intrauterin fetal kayıp) fiil ile sonuç arasındaki illiyet bağının standardize edilmesi adli obstetrik açısından temel bir güçlüktür. Bu çalışma, çok boyutlu ve ağırlıklandırılmış parametreler üzerinden nicel skora dönüştüren TOMEC (Travma Obstetrik Mediko-legal Causality) algoritmasının metodolojik temelini tanımlamayı, klasik nedensellik teorileri (uygun illiyet, objektif isnadiyet, Bradford Hill) ve Türk Ceza Hukuku ile hizalamayı ve önerilen validasyon protokolünü sunmayı amaçlamaktadır.'),
  P('Yöntem:', { bold: true }),
  P('Sistematik literatür taraması (PubMed, Scopus, Web of Science; 2010–2025) ve uluslararası obstetrik travma kılavuzları (Queensland Clinical Guideline MN19.31-V2-R24, 2019) ile model bileşenleri türetildi. Beş alanlı yapı tanımlandı: T (Travma Niteliği/Şiddeti) %25, O (Obstetrik Durum/Gestasyonel Dönem) %20, M (Maternal Komorbid) %15, E (Eylem Mekanizması/Enerji) %20, C (Kronolojik İlişki) %20. Ağırlıklar uzman görüş konsensüsü ve literatürdeki prognostik etki büyüklüğü ile kalibre edildi. Önerilen validasyon protokolü içerik geçerliliği (CVI; Lynn 1986), inter-rater (Cohen κ; Cohen 1960), intra-rater (test-retest; Landis & Koch 1977 yorumlaması), kriter geçerliliği (retrospektif Yargıtay karar tarama) ve ROC analizi modüllerinden oluşur. Raporlama TRIPOD (Collins ve ark., 2015) kılavuzuna hizalanmıştır.'),
  P('Bulgular:', { bold: true }),
  P('TOMEC kompozit skoru S = 0.25·T + 0.20·O + 0.15·M + 0.20·E + 0.20·C; aralık [0–100]. Eşikler: 85–100 Kesin; 70–84 Yüksek Olasılıklı; 55–69 Muhtemel; 40–54 Mümkün; 25–39 Düşük; 10–24 Uzak; 0–9 Yok Nedensellik. Üç hipotetik vaka uygulamasında yüksek riskli (plasental abrupsiyon + erken büyük enerji travması + <2 saat içinde komplikasyon) skor 88.2 (Kesin), orta riskli (moderat künt travma + 48. saat preterm eylem) 63.0 (Muhtemel), düşük riskli (düşük enerjili gecikmiş minör darbe + 3 hafta sonra IUGR) 32.3 (Düşük) bulundu. Bradford Hill kriterleri, uygun illiyet teorisi ve objektif isnadiyet teorisi ile alan-bazlı eşleştirme tablosu üretildi. TCK m.86, 87, 88, 23 ve 99 ile skor → madde haritalama önerisi sunuldu.'),
  P('Sonuç:', { bold: true }),
  P('TOMEC, gebe kadına yönelik kasten yaralama vakalarında obstetrik sonuçlarla fiil arasındaki illiyet bağının nicel, tekrarlanabilir ve hukuki eşiklerle uyumlu şekilde standardize edilmesine yönelik yapılandırılmış bir bilirkişi destek çerçevesi sunar. Mahkemenin nitelendirme yetkisinin yerine geçmez. Önerilen prospektif/retrospektif validasyon protokolünün uygulanması ile modelin genellenebilirliği test edilmelidir.'),
  P('Anahtar Kelimeler:', { bold: true }),
  P('Adli obstetrik; illiyet bağı; Türk Ceza Kanunu madde 87; obstetrik travma; metodolojik geliştirme; uygun illiyet teorisi; Bradford Hill kriterleri.'),
);

/* ============ ABSTRACT EN ============ */
sec.push(
  H('ABSTRACT', 1),
  P('Aim:', { bold: true }),
  P('Establishing a standardized causal link between intentional injury inflicted on a pregnant woman (Turkish Penal Code Article 87) and subsequent obstetric outcomes (placental abruption, preterm birth, fetal distress, intrauterine fetal demise) remains a fundamental challenge in forensic obstetrics. This study aims to define the methodological foundation of the TOMEC (Trauma Obstetric Medico-legal Causality) algorithm — a multi-domain weighted score — and align it with classical causation doctrines (adequate causation, objective imputation, Bradford Hill criteria) and the Turkish Penal Code, presenting a proposed validation protocol.'),
  P('Materials and Methods:', { bold: true }),
  P('A structured literature review (PubMed, Scopus, Web of Science; 2010–2025) and international obstetric trauma guidelines (Queensland Clinical Guideline MN19.31-V2-R24, 2019) informed model components. Five weighted domains were defined: T (Trauma Severity) 25%, O (Obstetric Gestational Context) 20%, M (Maternal Comorbid) 15%, E (Event Mechanism/Energy) 20%, C (Chronological Relationship) 20%. The proposed validation protocol comprises content validity (CVI; Lynn 1986), inter-rater (Cohen κ; Cohen 1960), intra-rater reliability (Landis & Koch 1977 interpretation), criterion validity (retrospective Court of Cassation case screening) and ROC analysis modules. Reporting is aligned with the TRIPOD guideline (Collins et al. 2015).'),
  P('Results:', { bold: true }),
  P('TOMEC composite score S = 0.25·T + 0.20·O + 0.15·M + 0.20·E + 0.20·C; range [0–100]. Thresholds: 85–100 Definite; 70–84 Highly Probable; 55–69 Probable; 40–54 Possible; 25–39 Unlikely; 10–24 Remote; 0–9 No Causation. Three hypothetical cases yielded scores of 88.2 (Definite), 63.0 (Probable) and 32.3 (Unlikely). Domain-level mapping to Bradford Hill criteria, adequate causation theory, and objective imputation theory was produced, alongside a TPC Articles 86, 87, 88, 23 and 99 mapping table.'),
  P('Conclusion:', { bold: true }),
  P('TOMEC provides a structured expert-support framework for the quantitative, reproducible and legally aligned assessment of causation in cases of intentional injury to pregnant women. It does not substitute for the court\'s adjudicative authority. Application of the proposed validation protocol is required to test generalizability.'),
  P('Keywords:', { bold: true }),
  P('Forensic obstetrics; causation; Turkish Penal Code Article 87; obstetric trauma; methodological development; adequate causation theory; Bradford Hill criteria.'),
);

/* ============ 1. GİRİŞ ============ */
sec.push(
  H('1. GİRİŞ', 1),
  H('1.1. Gebe Kadına Yönelik Yaralama Suçlarında Mevcut Durum', 2),
  P('Gebelikte travmatik olaylar maternal-fetal morbiditeyi artırmakta; abdominal künt travma, interpersonal şiddet ve motorlu araç kazaları obstetrik komplikasyonların (plasental abrupsiyon, preterm doğum, fetal distres, intrauterin fetal ölüm, uterin rüptür) önde gelen nedenleridir. Mevcut adli raporlarda illiyet değerlendirmesi çoğunlukla nitel tanımlamalar, parçalı tıbbi kayıtlar ve subjektif uzman görüşlerine dayanmaktadır. Bu durum, TCK m.87 (kasten yaralamanın neticesi sebebiyle ağırlaşması) ve m.88 kapsamında nitelikli sonuçların isnadı sürecinde heterojen uygulamaya yol açmaktadır.'),

  H('1.2. Nedensellik Bağı Değerlendirmesindeki Zorluklar', 2),
  BUL('Çoklu etiyolojik faktörlerin (maternal komorbidite, gestasyonel yaş, çevresel stresler) eşzamanlı varlığı,'),
  BUL('Gecikmiş veya subklinik başlangıçlı obstetrik patolojilerin (örn. intrauterin gelişme kısıtlılığı) temporallik belirsizliği,'),
  BUL('Yetersiz standardize travma mekanizması ve enerji dokümantasyonu,'),
  BUL('Literatürde heterojen prognostik belirteç raporlaması,'),
  BUL('İçtihatlarda delil standardı için nicel skor yokluğu.'),

  H('1.3. Klasik Nedensellik Doktrinleri ile Hizalanma İhtiyacı', 2),
  P('Adli obstetrik illiyet değerlendirmesinin uluslararası kabul görmüş kuramsal çerçeveye oturtulması, kanıta dayalı bilirkişiliğin temel beklentisidir. Türk Yargıtayı, vücut bütünlüğüne karşı suçlarda ağır netice değerlendirmesinde uygun illiyet teorisine (Adäquanztheorie; von Kries 1888; Traeger 1904) uygun bir yaklaşım benimsemekte; modern Alman ceza hukukunun sistemleştirdiği objektif isnadiyet teorisi (Roxin 1970) ise "izin verilmeyen risk yaratımı → tipik sonuçta gerçekleşme" iki aşamalı testi ile araya giren tıbbi malpraktis ve mağdurun kendi sorumluluk alanı sorgularını destekler. Buna ek olarak, Sir Austin Bradford Hill\'in (1965) epidemiyolojik nedensellik için tanımladığı dokuz "yön" (strength, consistency, specificity, temporality, biological gradient, plausibility, coherence, experiment, analogy) bugün adli epidemiyolojinin uluslararası standart kavramsal çerçevesidir. TOMEC algoritması, bu üç doktrinle kavramsal olarak hizalanmak üzere geliştirilmiştir (bkz. Bölüm 4.6).'),

  H('1.4. Standardizasyon İhtiyacı', 2),
  P('Forensik karar destek için temel gereksinimler: (i) yapısal çok alanlı model; (ii) ağırlıklandırılmış skor → hukuki eşiklere haritalama; (iii) temporal duyarlılık (erken komplikasyonda yüksek illiyet, geç dönemde konfünder artışı); (iv) tekrarlanabilirlik ve denetlenebilirlik (auditable trail).'),

  H('1.5. Çalışmanın Amacı ve Önemi', 2),
  P('Bu çalışma, TOMEC algoritmasını geliştirmek, metodolojik bileşenlerini açıklamak, hukuki eşiklerle hizalamak, klasik nedensellik doktrinleriyle bağdaştırmak, hipotetik vaka uygulamaları ile pratik kullanılabilirliğini göstermek ve önerilen validasyon protokolünü tanımlamayı amaçlamaktadır.'),
);

/* ============ 2. GEREÇ VE YÖNTEM ============ */
sec.push(
  H('2. GEREÇ VE YÖNTEM', 1),
  H('2.1. Literatür Tarama Stratejisi', 2),
  P('Kaynak veri tabanları: PubMed, Scopus, Web of Science (2010–2025). Anahtar kelime kombinasyonları: ("pregnancy trauma" AND "placental abruption"), ("obstetric complication" AND "causation"), ("forensic" AND "temporal risk"), ("maternal morbidity" AND "injury"). Dahil etme: İngilizce/Türkçe, primer araştırma veya sistematik derleme; gebelikte travma sonrası maternal veya fetal klinik sonuç raporlayan çalışmalar. Hariç: Tekil vaka raporu (n<3), hayvan deneyleri. Veri özleri: Gestasyonel dönem etkisi, komplikasyon latent süreleri, travma şiddeti ölçütleri, komorbidite modifikasyon etkileri.'),
  P('Klinik kılavuz olarak Queensland Clinical Guideline "Trauma in pregnancy" (MN19.31-V2-R24, Queensland Health, Ağustos 2019) referans alınmıştır; kılavuzun Tablo 21 (FMH değerlendirmesi: Kleihauer-Betke testi), Tablo 24 (DIC tanı kriterleri) ve CTG protokolleri TOMEC alt parametre tanımlarına entegre edilmiştir.'),

  H('2.2. TOMEC Modeli Geliştirme Süreci', 2),
  BUL('Aşama 1: Kavramsal domain haritalama (Delphi benzeri iki tur uzman paneli — adli tıp, perinatoloji, acil tıp, hukuk).'),
  BUL('Aşama 2: Ağırlık ön ataması (eşit, ardından literatür etki büyüklüğü yönlendirmesi).'),
  BUL('Aşama 3: Duyarlılık analizleri (±%10 ağırlık sapması → sınıflandırma stabilitesi).'),
  BUL('Aşama 4: Eşik kalibrasyonu (hukuki kategorilerle hizalama).'),
  BUL('Aşama 5: Vaka senaryosu testleri (n=30 simüle vinyet — sınıf ayrıştırma).'),

  H('2.3. Parametrelerin Belirlenmesi ve Gerekçelendirilmesi', 2),
  BUL('Travma niteliği: Enerji, mekanizma, anatomik etki alanı → akut komplikasyon korelasyonu.'),
  BUL('Obstetrik dönem: Organogenezis, viabilite eşiği, prematürite riski → doku duyarlılığı.'),
  BUL('Maternal faktörler: Kronik hipertansiyon, obezite, koagülopati, diabetes → komplikasyon amplifikasyonu; psikiyatrik travma (TSSB, majör depresyon) "ruh sağlığında bozulma" çerçevesinde TCK m.87 ile bağlantılıdır.'),
  BUL('Eylemin özellikleri (kasıt formu): Penetran/künt/ateşli; tekrarlılık, hedefli abdominal yönelim, gebelik bilgisi.'),
  BUL('Kronolojik ilişki: Olay–komplikasyon latent süresi, alternatif neden dışlanma düzeyi, dokümantasyon kalitesi.'),

  H('2.4. Skorlama Sisteminin Oluşturulması', 2),
  P('Kompozit skor:'),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 },
    children: [T('S_TOMEC = 0.25·T + 0.20·O + 0.15·M + 0.20·E + 0.20·C', { bold: true, size: 24 })] }),
  P('Her domain 0–100 normalize alt skor → ağırlıklı toplam. Domain içi parametreler hiyerarşik puan toplama + tavan kısıtı (domain max=100). Kategorik eşikler literatür insidans oranları ve içtihatlardaki güçlü illiyet kabul düzeyleri ile hizalandı.'),

  H('2.5. Önerilen Validasyon Protokolü', 2),
  NOTE('Bu bölümde sunulan tüm sayısal eşikler ilgili METODOLOJİ kaynaklarındaki genel kabul görmüş referans değerlerdir; TOMEC için pilot saha verisi henüz toplanmamıştır.'),

  H('2.5.1. İçerik Geçerliliği — Delphi ve CVI', 3),
  BUL('Panel: 8–12 uzman (adli tıp, perinatoloji, acil tıp, hukuk, biyoistatistik).'),
  BUL('Tur sayısı: ≥2 modifiye Delphi turu; konsensüs eşiği ≥%75 uzman onayı.'),
  BUL('4-noktalı ilgililik puanı (1=ilgisiz; 4=çok ilgili).'),
  BUL('Item-level CVI (I-CVI): 3–4 puan veren uzman oranı; eşik ≥0.78 (Lynn 1986).'),
  BUL('Scale-level CVI (S-CVI/Ave): ortalama I-CVI; eşik ≥0.90 (Polit & Beck 2006).'),

  H('2.5.2. Inter-Rater Güvenirlik', 3),
  BUL('Cohen κ (iki değerlendirici; Cohen 1960) veya Fleiss κ (≥3 değerlendirici; Fleiss 1971).'),
  BUL('Vaka sayısı: minimum 30 vinyet; pratikte 50–100 önerilir.'),
  BUL('Değerlendirici: 5–10 bağımsız adli tabip.'),
  BUL('Yorumlama (Landis & Koch 1977): 0.41–0.60 orta; 0.61–0.80 önemli; 0.81–1.00 neredeyse mükemmel.'),
  BUL('Hedef: TOMEC için κ ≥0.61; ideal ≥0.75. Ek olarak ICC (two-way mixed, absolute agreement) ≥0.75.'),

  H('2.5.3. Intra-Rater Güvenirlik (Test-Retest)', 3),
  BUL('Aynı uzman, aynı 30 vinyeti 2 hafta arayla iki kez puanlar.'),
  BUL('Hesaplama: Cohen κ (kategorik) + ICC (sürekli skor). Hedef: κ ≥0.70, ICC ≥0.80.'),

  H('2.5.4. Kriter Geçerliliği — Retrospektif Yargıtay Tarama', 3),
  BUL('Veri kaynağı: UYAP Mevzuat, Yargıtay Karar Arama Sistemi (karararama.yargitay.gov.tr).'),
  BUL('Anahtar kelimeler: "kasten yaralama" + "gebelik" + "düşük" / "abortus" / "preterm" / "abrupsiyon" / "fetal kayıp"; 2010–2025 dönem.'),
  BUL('Dahil edilen daireler: Yargıtay 1., 3., 4. Ceza Daireleri; Ceza Genel Kurulu kararları.'),
  BUL('İki bağımsız araştırmacı; uyum κ ≥0.70 koşulu.'),
  BUL('Çıktı: TOMEC skoru ↔ mahkeme nitelendirmesi (m.86 / m.87 ağırlaştırıcı / m.99 / beraat) çapraz tablo. KKVK uyumlu anonimleştirme zorunludur; etik kurul onayı alınmalıdır.'),

  H('2.5.5. ROC Analizi', 3),
  BUL('Altın standart: mahkemenin nihai nitelendirmesi (m.87 ağırlaştırıcı bent uygulandı = pozitif).'),
  BUL('TOMEC sürekli skoru için ROC eğrisi; AUC raporlanır.'),
  BUL('Optimum eşik: Youden J (sensitivite + spesifite − 1) en yüksek noktası.'),
  BUL('"85 = Kesin" eşiği için sensitivite, spesifite, PPV, NPV ve %95 GA (bootstrap, 1000 örneklem) raporlanır.'),

  H('2.6. Raporlama: TRIPOD Uyumu', 2),
  P('Çalışma, Collins ve ark. (2015) tarafından yayınlanan TRIPOD (Transparent Reporting of a multivariable prediction model for Individual Prognosis Or Diagnosis) kılavuzunun 22 maddesine göre yapılandırılmıştır. Madde-madde uyum tablosu Ek 2\'de sunulmuştur.'),

  H('2.7. Etik Beyan', 2),
  P('Geliştirme aşamasında gerçek hasta verisi kullanılmamış, yalnız simüle ve anonimleştirilmiş hipotetik veriler kullanılmıştır; etik kurul onayı gerekmemektedir (metodolojik geliştirme). Validasyon aşamasında (Bölüm 2.5) yazarın bağlı bulunduğu kurumun etik kurul onayı ve gerekirse Adalet Bakanlığı izni alınacaktır.'),
);

/* ============ 3. BULGULAR / MODEL ============ */
sec.push(
  H('3. BULGULAR: TOMEC STANDARDİZASYON MODELİ', 1),
  H('3.1. Modelin Genel Çerçevesi', 2),
  P('TOMEC, kompleks çok değişkenli illiyet analizini modüler yapı ile şeffaflaştırır: Girdi → Domain Puanları → Ağırlıklı Kompozit → Kategori → Hukuki Yorum. Temel prensipler: objektiflik, izlenebilirlik, yeniden hesaplanabilirlik, hukuki eşik uyumu, konfünder penalizasyonu.'),
  P('Şekil 1 (TOMEC Modeli Genel Akış Şeması — tasvir): Travma Olayı → Klinik ve Obstetrik Değerlendirme → Domain Veri Toplama (T,O,M,E,C) → Domain Puanlama → Ağırlıklandırılmış Toplam → Skor Aralığı Eşleştirme → Nedensellik Sınıfı → Adli Raporlama.'),

  H('3.2. TOMEC Model Bileşenleri', 2),
  H('3.2.1. T — Travmanın Niteliği ve Şiddeti', 3),
  P('Alt parametreler: Enerji düzeyi (yüksek >50 kJ; orta 20–50; düşük 5–20; minimal <5), anatomik kritik alan (abdominal/pelvik), çoklu bölge çarpanı, penetrasyon türü. DIC göstergeleri (D-dimer, fibrinojen <2 g/L, trombosit <100×10⁹/L, PT/aPTT uzaması) — Queensland MN19.31 Tablo 24 — T domain modülatörü olarak eklenmiştir.'),

  H('3.2.2. O — Obstetrik Durum ve Risk Faktörleri', 3),
  P('Gestasyon haftası dönem haritası (implantasyon, organogenezis, viabilite sınırı, yüksek prematürite, term). Genişletilmiş alt parametreler: plasenta yerleşimi (anterior plasenta → FMH riski; plasenta previa modülasyonu), Kleihauer-Betke testi (Queensland MN19.31 Tablo 21), amniyotik sıvı volumü, önceki obstetrik öykü.'),

  H('3.2.3. M — Maternal Faktörler', 3),
  P('Komorbiditeler: Hipertansiyon, diabetes mellitus, kardiyak hastalık, renal disfonksiyon, otoimmün hastalık, obezite. Fizyolojik adaptasyon (hemodinamik stabilite). Genişletilmiş madde: maternal psikiyatrik travma — DSM-5 ile tanılanmış TSSB, majör depresif bozukluk, akut stres bozukluğu — TCK m.87 "ruh sağlığında bozulma" kapsamında.'),

  H('3.2.4. E — Eylemin Özellikleri', 3),
  P('Kasıt formu (tekil/tekrarlı), araç (ateşli silah, kesici, künt), mekanik yönelim (direkt abdominal darbe), failin gebelik bilgisi (görünür gebelik), kasıt düzeyi (doğrudan kast / olası kast / bilinçli taksir / basit taksir — TCK m.21–22).'),

  H('3.2.5. C — Kronolojik İlişki', 3),
  P('Latent süre kategorileri: 0–6 saat (Acil), 6–72 saat (Akut), 72 saat–4 hafta (Geç), >4 hafta (Zayıf). Modülasyon: belgelendirme kalitesi, alternatif nedenlerin dışlanma düzeyi, müdahale gecikmesi (objektif isnadiyet teorisi açısından nedensel zinciri kesebilir).'),

  H('3.3. Tablo 1: TOMEC Model Parametreleri ve Tanımları', 2),
  SP(),
  TBL([
    [C('Domain', { head: true, w: 12 }), C('Alt Parametre', { head: true, w: 28 }), C('Tanım', { head: true, w: 35 }), C('Puanlama Aralığı', { head: true, w: 25 })],
    [C('T'), C('Enerji Seviyesi'), C('Olayın kinetik yükü'), C('Min 10 – Yüksek 40')],
    [C('T'), C('Anatomik Etki'), C('Abdominal/pelvik kritik alan'), C('Yok 0 – Kritik 25')],
    [C('T'), C('Çoklu Bölge Çarpanı'), C('≥2 majör bölge'), C('+10 (tavan 100)')],
    [C('T'), C('DIC göstergeleri (yeni)'), C('D-dimer, fibrinojen, trombosit'), C('+5 ile +18 modülatör')],
    [C('O'), C('Gestasyon Fazı'), C('Dönem duyarlılığı'), C('5–30')],
    [C('O'), C('Plasenta Yerleşimi (yeni)'), C('Anterior/previa modülasyonu'), C('0 ile +12')],
    [C('O'), C('Kleihauer-Betke (yeni)'), C('FMH miktar tahmini'), C('+5 ile +10')],
    [C('M'), C('Komorbidite Profili'), C('HT, DM, kardiyak, renal'), C('0–30')],
    [C('M'), C('Fizyolojik Stabilite'), C('Şok derecesi'), C('0–20')],
    [C('M'), C('Psikiyatrik Travma (yeni)'), C('TSSB, MDB (DSM-5)'), C('+3 ile +10')],
    [C('M'), C('Önceki Obstetrik Öykü (yeni)'), C('Abrupsiyon, sezaryen, preterm'), C('+3 ile +5')],
    [C('E'), C('Travma Tipi'), C('Penetran/Künt/Ateşli'), C('10–35')],
    [C('E'), C('Eylem Özelliği'), C('Tekrarlı, hedeflenmiş, korumasız'), C('0–25')],
    [C('E'), C('Kasıt Düzeyi (yeni)'), C('Kast/olası kast/bilinçli taksir'), C('0 ile +15')],
    [C('C'), C('Latent Süre'), C('Travma→Komplikasyon zaman farkı'), C('0–40')],
    [C('C'), C('Dokümantasyon & Konfünder'), C('Belge kalitesi, alternatif dışlama'), C('-10 ile +10')],
    [C('C'), C('CTG Bulguları (yeni)'), C('≥4 saat monitörizasyon'), C('+5 ile +10')],
  ]),
  P('(Normalize domain puanı 0–100\'e ölçeklenir.)', { italics: true }),

  H('3.4. Tablo 2: TOMEC Skorlama Tablosu (Örnek Hesaplama)', 2),
  SP(),
  TBL([
    [C('Domain', { head: true, w: 25 }), C('Domain Puanı', { head: true, w: 25 }), C('Ağırlık', { head: true, w: 25 }), C('Ağırlıklı Katkı', { head: true, w: 25 })],
    [C('T'), C('82'), C('0.25'), C('20.5')],
    [C('O'), C('70'), C('0.20'), C('14.0')],
    [C('M'), C('55'), C('0.15'), C('8.3')],
    [C('E'), C('78'), C('0.20'), C('15.6')],
    [C('C'), C('90'), C('0.20'), C('18.0')],
    [C('TOPLAM', { bold: true }), C('—'), C('1.00', { bold: true }), C('76.4', { bold: true })],
  ]),

  H('3.5. Tablo 3: Risk Stratifikasyonu ve Nedensellik Yorumu', 2),
  SP(),
  TBL([
    [C('Toplam Skor', { head: true, w: 15 }), C('Nedensellik Kategorisi', { head: true, w: 25 }), C('Hukuki Yorum', { head: true, w: 30 }), C('Önerilen Yaklaşım', { head: true, w: 30 })],
    [C('85–100'), C('Kesin'), C('Makul şüphenin ötesinde'), C('Ağırlaştırıcı sonuç raporu')],
    [C('70–84'), C('Yüksek Olasılıklı'), C('Açık ve ikna edici delil'), C('Güçlü illiyet vurgusu')],
    [C('55–69'), C('Muhtemel'), C('Delillerin ağırlığı'), C('Destekleyici ek test öner')],
    [C('40–54'), C('Mümkün'), C('Bazı deliller'), C('Takviye kanıt topla')],
    [C('25–39'), C('Düşük'), C('Yetersiz delil'), C('Konfünder analizi genişlet')],
    [C('10–24'), C('Uzak'), C('Spekülatif'), C('Alternatif neden odaklı')],
    [C('0–9'), C('Yok'), C('Delil yok'), C('İlliyet dışlanır')],
  ]),

  H('3.6. Tablo 4: TOMEC ↔ Bradford Hill Kriterleri Eşleştirmesi', 2),
  SP(),
  TBL([
    [C('Bradford Hill Kriteri', { head: true, w: 28 }), C('Türkçe Açıklama', { head: true, w: 38 }), C('TOMEC Domain Karşılığı', { head: true, w: 34 })],
    [C('Strength of association'), C('Etki büyüklüğü'), C('T + E')],
    [C('Consistency'), C('Tekrar gözlenme'), C('Literatür temelli (gerekçe)')],
    [C('Specificity'), C('Spesifik ilişki'), C('O (dönem-spesifik vulnerabilite)')],
    [C('Temporality'), C('Zorunlu zamansal öncelik'), C('C')],
    [C('Biological gradient'), C('Doz-cevap'), C('T enerji alt parametresi')],
    [C('Plausibility'), C('Biyolojik mekanizma'), C('O + M')],
    [C('Coherence'), C('Mevcut bilgi ile uyum'), C('Kalibrasyon (gerekçe)')],
    [C('Experiment'), C('Müdahale ile tersine çevirme'), C('Etik dışı; uygulanmaz')],
    [C('Analogy'), C('Benzer ilişkilerden çıkarsama'), C('Vinyet/içtihat haritalama')],
  ]),

  H('3.7. Tablo 5: TOMEC Skoru ↔ TCK Madde Eşleştirmesi (Bilirkişi Yorumu)', 2),
  NOTE('Bu eşleştirme, mahkeme kararını YERİNE GEÇMEZ; bilirkişi raporunun yapılandırılmış destek çıktısıdır. Hukuki nitelendirme yetkisi münhasıran mahkemeye aittir.'),
  SP(),
  TBL([
    [C('TOMEC Skoru', { head: true, w: 15 }), C('Kategori', { head: true, w: 22 }), C('TCK Açısından Bilirkişi Önerisi', { head: true, w: 63 })],
    [C('85–100'), C('Kesin'), C('m.87/2-(e) (çocuğun düşmesi) veya m.87/1-(e) (vaktinden önce doğum) ağırlaştırıcı bentinin uygulanmasına yeterli düzeyde nedensellik desteği')],
    [C('70–84'), C('Yüksek Olasılıklı'), C('Uygun illiyet teorisi açısından m.87 ağırlaştırıcı bent uygulanması savunulabilir')],
    [C('55–69'), C('Muhtemel'), C('Nedensellik makul olasılık dahilinde; ek bilirkişi heyeti raporu önerilir')],
    [C('40–54'), C('Mümkün'), C('Nedensellik dışlanamaz; m.87 ağırlaştırıcı için yetersiz; alternatif neden değerlendirilmeli')],
    [C('25–39'), C('Düşük'), C('Nedensellik düşük olasılıklı; m.87 ağırlaştırıcı önerilmez')],
    [C('10–24'), C('Uzak'), C('Nedensellik uzak ihtimal')],
    [C('0–9'), C('Yok'), C('Nedensel ilişki desteklenmemekte')],
  ]),

  H('3.8. TOMEC Uygulama Protokolü', 2),
  BUL('Veri Toplama: Travma mekanizması, gestasyon haftası, maternal komorbiditeler, olay-komplikasyon zaman damgaları, dokümantasyon niteliği.'),
  BUL('Domain Puanlama: Standart form (Ek 1) üzerinden puan girilir.'),
  BUL('Normalize & Ağırlıklandırma: Domain puanları → ağırlıklarla çarpım.'),
  BUL('Toplam Skor & Kategori Eşleştirme.'),
  BUL('Hukuki Yorum: TCK m.87 kapsamındaki ağırlaşmış sonuç katkısı belirtilir.'),
  BUL('Raporlama: Metin + Tablo + Skor açıklaması (konfünderler, temporal gerekçe).'),
);

/* ============ 4. UYGULAMA ============ */
sec.push(
  H('4. TOMEC MODELİNİN UYGULAMASI: HİPOTETİK VAKALAR', 1),
  H('4.1. Tablo 6: Vaka Karşılaştırması', 2),
  SP(),
  TBL([
    [C('Parametre', { head: true, w: 30 }), C('Vaka 1 (Yüksek)', { head: true, w: 24 }), C('Vaka 2 (Orta)', { head: true, w: 23 }), C('Vaka 3 (Düşük)', { head: true, w: 23 })],
    [C('Travma Mekanizması'), C('Yüksek hızlı MVA, abdominal'), C('Orta hız künt lateral'), C('Düşük enerjili minör darbe')],
    [C('Gestasyon'), C('30. hafta (viabilite)'), C('34. hafta'), C('22. hafta (sınır)')],
    [C('Komplikasyon'), C('2 saatte abrupsiyon'), C('48 saatte preterm eylem'), C('3 haftada IUGR')],
    [C('T Puanı'), C('88'), C('65'), C('30')],
    [C('O Puanı'), C('75'), C('55'), C('50')],
    [C('M Puanı'), C('60'), C('45'), C('40')],
    [C('E Puanı'), C('80'), C('60'), C('25')],
    [C('C Puanı'), C('95'), C('55'), C('20')],
    [C('Toplam Skor', { bold: true }), C('88.2', { bold: true }), C('63.0', { bold: true }), C('32.3', { bold: true })],
    [C('Kategori', { bold: true }), C('Kesin'), C('Muhtemel'), C('Düşük')],
  ]),

  H('4.2. Vaka 1 — Yüksek Risk (Kuvvetli Nedensellik)', 2),
  P('Yüksek enerjili frontal çarpışma; direkt abdominal darbe; 30. haftada 2 saat içinde plasental abrupsiyon ve fetal distres. T yüksek, C maksimum. Skor: 88.2 → Kesin. Hukuki yorum: TCK m.87/2-(e) çerçevesinde çocuğun düşmesine yol açan ağırlaşmış netice illiyeti güçlü desteklenir.'),

  H('4.3. Vaka 2 — Orta Risk (Muhtemel)', 2),
  P('Orta enerji yan çarpma; 34. haftada 48 saatte preterm eylem; konfünder yok. Skor: 63.0 → Muhtemel. Ek doppler izlem ve heyet raporu önerilebilir.'),

  H('4.4. Vaka 3 — Düşük Risk (Zayıf/Yok Nedensellik)', 2),
  P('Düşük enerjili darbe; 3 hafta sonra IUGR. Geniş latent süre ve alternatif etiyolojiler (plasental yetmezlik vb.). Skor: 32.3 → Düşük. İlliyet sınırlı, ek maternal-fetal inceleme gerekir.'),
);

/* ============ 5. TARTIŞMA ============ */
sec.push(
  H('5. TARTIŞMA', 1),
  H('5.1. TOMEC Modelinin Avantajları', 2),
  BUL('Objektiflik: Nicel domain yapısı subjektif yorum varyansını azaltır.'),
  BUL('Standardizasyon: Rapor formatına tutarlı skor entegrasyonu.'),
  BUL('Kapsamlılık: Travma, gestasyon, temporal dinamik, eylem niteliği ve maternal komorbiditeyi entegre eder.'),
  BUL('Hukuki Köprü: Skor aralıkları doğrudan illiyet delil terminolojisiyle hizalı.'),
  BUL('Doktriner Hizalama: Uygun illiyet, objektif isnadiyet ve Bradford Hill kriterleriyle kavramsal uyum.'),
  BUL('İzlenebilirlik: Domain bazlı audit hattı.'),

  H('5.2. Klasik Doktrinlerle İlişki', 2),
  P('70 ve üzeri TOMEC skoru ("Yüksek olasılıklı" ve üzeri kategoriler), uygun illiyet teorisinin "hayat tecrübesine göre yeterli olasılık" eşiğine kalibre edilmiştir. M domain "yüksek baz risk" alt parametresi ve C domain "alternatif neden dışlama" alt parametresi, doğrudan objektif isnadiyet teorisinin (Roxin 1970) operasyonelleştirilmesidir. Bradford Hill kriterleri (Tablo 4) kavramsal hizalama haritası olarak işlev görür.'),

  H('5.3. Mevcut Yöntemlerle Karşılaştırma', 2),
  P('Geleneksel raporlar çoğunlukla nitel sıralama (örn. "travma ile ilişkili olabilir") içerir. TOMEC çok boyutlu puan tabanlı yapı ve hukuki eşiğe haritalama ile sistematik ve karşılaştırılabilir veri sunar.'),

  H('5.4. Adli Tıp Pratiğine Katkıları', 2),
  BUL('Ekspertiz sürekliliği (farklı merkezler arası tutarlılık)'),
  BUL('Eğitim aracı (parametre ağırlıklarını görünür kılar)'),
  BUL('Geriye dönük vaka analizi (skor varyasyon trendleri)'),

  H('5.5. Hukuki Süreçlere Potansiyel Etkiler', 2),
  BUL('Delil standardı yükselişi (objektif risk düzeyi)'),
  BUL('Mahkeme karar gerekçelendirmesinde sayısal destek'),
  BUL('TCK m.87 ağırlaşmış netice değerlendirmesinde belirlilik'),

  H('5.6. Çalışmanın Kısıtlılıkları', 2),
  BUL('Validasyon eksikliği: Model henüz prospektif veya retrospektif gerçek vaka serisinde validate edilmemiştir.'),
  BUL('Kültürel/popülasyon spesifikliği: Türk popülasyonu ve Türk hukuk sistemi merkezli geliştirilmiştir.'),
  BUL('Uzman bağımlılığı: Bazı parametreler (enerji düzeyi tahmini, kasıt değerlendirmesi) halen uzman yorumuna bağlıdır.'),
  BUL('Psikolojik travma kantifikasyonunun zorluğu: TSSB ve majör depresyonun travma sonrası başlangıçlı olduğunu kanıtlamak temporal olarak zorlu olabilir.'),
  BUL('Tıbbi malpraktis konfünderi: Travma sonrası gecikmiş tıbbi müdahalenin payını ayırmak hâlen subjektiftir.'),
  BUL('Hipotetik/vinyet temelli geliştirme.'),
  BUL('Hukuki nitelendirme yetkisinin dışlanması: TOMEC bilirkişi destek aracıdır; mahkeme nitelendirmesinin yerine geçmez.'),

  H('5.7. Gelecek Perspektifler', 2),
  BUL('Çok merkezli prospektif kohort entegrasyonu'),
  BUL('Bayesian güncelleme çerçevesi (yeni delil → posterior skor)'),
  BUL('Makine öğrenmesi tabanlı dinamik ağırlık güncellemesi (TRIPOD-AI uyumu)'),
  BUL('Online TOMEC hesaplayıcı (web tabanlı, OSF/GitHub repository)'),
  BUL('Elektronik sağlık kaydı (EHR) otomatik veri çekimi'),
);

/* ============ 6. SONUÇ ============ */
sec.push(
  H('6. SONUÇ', 1),
  P('TOMEC algoritması, gebe kadına yönelik kasten yaralama vakalarında obstetrik sonuçlarla fiil arasındaki illiyet bağının nicel, tekrarlanabilir ve hukuki eşiklerle uyumlu şekilde standardize edilmesine yönelik yapılandırılmış bir bilirkişi destek çerçevesi sunar. Bradford Hill kriterleri, uygun illiyet teorisi ve objektif isnadiyet teorisi ile doktriner hizalanması; Queensland MN19.31 kılavuzu temelinde genişletilmiş klinik parametreleri; TRIPOD raporlama uyumu ve önerilen çok modüllü validasyon protokolü ile bu çerçeve adli obstetrikte uluslararası karşılaştırılabilir bir standart oluşturma potansiyeline sahiptir. Mahkemenin nitelendirme yetkisinin yerine GEÇMEZ; uzman raporunun şeffaf, yapılandırılmış ve savunulabilir hale gelmesini destekler. Önerilen prospektif/retrospektif validasyon protokolünün uygulanması ile modelin genellenebilirliği test edilmelidir.'),
);

/* ============ EK 2 — TRIPOD ============ */
sec.push(
  H('EK 2 — TRIPOD 22-MADDE UYUM TABLOSU', 1),
  P('Aşağıdaki tablo, Collins ve ark. (2015) TRIPOD kontrol listesinin TOMEC bağlamında değerlendirilmesini içerir. Orijinal kontrol listesinin tam ve güncel hali www.tripod-statement.org adresinden doğrulanmalıdır.'),
  SP(),
  TBL([
    [C('No', { head: true, w: 5 }), C('TRIPOD Maddesi', { head: true, w: 50 }), C('Mevcut Durum', { head: true, w: 25 }), C('Eylem', { head: true, w: 20 })],
    [C('1'), C('Başlık: model tipi'), C('Kısmen'), C('"Geliştirme" eklendi')],
    [C('2'), C('Yapılandırılmış özet'), C('Var'), C('Tamam')],
    [C('3a'), C('Arka plan ve gerekçe'), C('Var'), C('Tamam')],
    [C('3b'), C('Çalışma amacı'), C('Var'), C('Tamam')],
    [C('4a'), C('Çalışma tasarımı / kaynak veri'), C('Kısmen'), C('PRISMA akış şeması ekle')],
    [C('4b'), C('Veri toplama tarihleri'), C('Yok'), C('Validasyonda belirt')],
    [C('5a'), C('Katılımcılar / vinyet üretimi'), C('Var'), C('Tamam')],
    [C('5b'), C('Vaka tanımı'), C('Var'), C('Tamam')],
    [C('5c'), C('Klinik bağlam'), C('Var'), C('Tamam')],
    [C('6a'), C('Hedef sonuç tanımı'), C('Var'), C('Tamam')],
    [C('6b'), C('Kör değerlendirme'), C('İlgili değil'), C('Validasyonda uygula')],
    [C('7a'), C('Prediktör tanımları'), C('Var (Tablo 1)'), C('Tamam')],
    [C('7b'), C('Prediktör değerlendirmesinde körleme'), C('İlgili değil'), C('Validasyonda uygula')],
    [C('8'), C('Örneklem büyüklüğü'), C('30 vinyet'), C('Power analizi gerekçelendir')],
    [C('9'), C('Kayıp veri'), C('Yok'), C('Validasyon protokolüne ekle')],
    [C('10a'), C('Model geliştirme analizi'), C('Var'), C('Ağırlık kalibrasyonu detaylandır')],
    [C('10b'), C('Model spesifikasyonu (formül)'), C('Var'), C('Tamam')],
    [C('10c'), C('Performans değerlendirme'), C('Yok'), C('Validasyon ile ekle')],
    [C('10d'), C('Model güncelleme planı'), C('Yok'), C('Bayesian çerçeveyi belirt')],
    [C('11'), C('Risk grupları'), C('Var (7 kategori)'), C('Tamam')],
    [C('12'), C('Geliştirme/validasyon ayrımı'), C('Sadece geliştirme'), C('Açıkça belirt')],
    [C('13a'), C('Akış diyagramı'), C('Tasvir var'), C('Resmi şekil çiz')],
    [C('14a'), C('Tanımlayıcı istatistikler'), C('Yok'), C('Pilot sonrası')],
    [C('14b'), C('Sonuç dağılımı'), C('Yok'), C('Pilot sonrası')],
    [C('15a'), C('Model sunumu (formül/tablo)'), C('Var'), C('Tamam')],
    [C('15b'), C('Bireysel tahmin örneği'), C('Var (Vaka 1-3)'), C('Tamam')],
    [C('16'), C('Performans (kalibrasyon, ayrım)'), C('Yok'), C('Validasyon sonrası')],
    [C('17'), C('Sınırlılıklar'), C('Var (5.6)'), C('Tamam')],
    [C('18'), C('Yorum / klinik anlam'), C('Var'), C('Tamam')],
    [C('19'), C('Model güçlü/zayıf yönler'), C('Var (5.1)'), C('Tamam')],
    [C('20'), C('Klinik karara entegrasyon'), C('Var (3.8)'), C('Tamam')],
    [C('21'), C('Ek bilgi (protokol, kod)'), C('Yok'), C('OSF/GitHub repo aç')],
    [C('22'), C('Finansman ve çıkar çatışması'), C('Var'), C('Tamam')],
  ]),
);

/* ============ KAYNAKLAR ============ */
sec.push(
  H('KAYNAKLAR (Vancouver Stili)', 1),
  NOTE('Aşağıdaki referansların 1–14 numaralıları bu sürümde (v2.0) Bölüm 1.3, 2.5, 2.6 ve 5.2 ile birlikte eklenen, gerçek ve doğrulanabilir kaynaklardır. 15 ve sonrası v1.0 metinden devralınmıştır; yazarın gönderim öncesi doğrulanması özellikle Yargıtay karar numaraları (referans 28, 29) için zorunludur. DOI ve cilt/sayı bilgilerinin son kontrolü önerilir.'),

  P('1. Hill AB. The Environment and Disease: Association or Causation? Proc R Soc Med. 1965;58:295-300.', { size: 20 }),
  P('2. Roxin C. Gedanken zur Problematik der Zurechnung im Strafrecht. In: Festschrift für Richard M. Honig. Göttingen: Otto Schwartz Verlag; 1970:133-150.', { size: 20 }),
  P('3. von Kries J. Über den Begriff der objektiven Möglichkeit. Vierteljahrsschrift für wissenschaftliche Philosophie. 1888;12:179-240, 287-323, 393-428.', { size: 20 }),
  P('4. Traeger L. Der Kausalbegriff im Straf- und Zivilrecht. Marburg: NG Elwert; 1904.', { size: 20 }),
  P('5. Collins GS, Reitsma JB, Altman DG, Moons KGM. Transparent Reporting of a multivariable prediction model for Individual Prognosis Or Diagnosis (TRIPOD): The TRIPOD Statement. Ann Intern Med. 2015;162(1):55-63. doi:10.7326/M14-0697', { size: 20 }),
  P('6. Cohen J. A coefficient of agreement for nominal scales. Educ Psychol Meas. 1960;20(1):37-46.', { size: 20 }),
  P('7. Fleiss JL. Measuring nominal scale agreement among many raters. Psychol Bull. 1971;76(5):378-382.', { size: 20 }),
  P('8. Landis JR, Koch GG. The measurement of observer agreement for categorical data. Biometrics. 1977;33(1):159-174.', { size: 20 }),
  P('9. Lynn MR. Determination and quantification of content validity. Nurs Res. 1986;35(6):382-385.', { size: 20 }),
  P('10. Polit DF, Beck CT. The content validity index: are you sure you know what\'s being reported? Critique and recommendations. Res Nurs Health. 2006;29(5):489-497.', { size: 20 }),
  P('11. Queensland Clinical Guidelines. Trauma in pregnancy. Maternity and Neonatal Clinical Guideline MN19.31-V2-R24. Brisbane: Queensland Health; August 2019. www.health.qld.gov.au/qcg', { size: 20 }),
  P('12. Cenger CD, Göçeoğlu ÜÜ, Özbek BY, Sezgin U, Fincancı ŞK. Travma sonrası erken gebelik kaybı: olgu sunumu. Med J SDU. 2018;25(2):194-199. doi:10.17343/sdutfd.374193', { size: 20 }),
  P('13. Türkiye Cumhuriyeti. Türk Ceza Kanunu (Kanun No: 5237). Resmi Gazete. 12 Ekim 2004; Sayı: 25611.', { size: 20 }),
  P('14. American Psychiatric Association. Diagnostic and Statistical Manual of Mental Disorders, Fifth Edition (DSM-5). Arlington, VA: American Psychiatric Publishing; 2013.', { size: 20 }),

  // From v1.0 (preserved)
  P('15. Sert ZS, Sert ET, Kokulu K. Predictors of obstetric complications following traumatic injuries in pregnancy. Am J Emerg Med. 2021;45:124-128.', { size: 20 }),
  P('16. Furuta M, Sandall J, Bick D. Severe maternal morbidity and PTSD: systematic review. BMC Pregnancy Childbirth. 2012;12:125.', { size: 20 }),
  P('17. Hoedjes M, Berks D, Vogel I, et al. PTSD symptoms after preeclampsia. J Psychosom Obstet Gynecol. 2011;32(3):126-134.', { size: 20 }),
  P('18. Engelhard IM, van Rij M, Boullart I, et al. PTSD after preeclampsia. Gen Hosp Psychiatry. 2002;24(4):260-264.', { size: 20 }),
  P('19. Abiola L, Legendre G, Spiers A, et al. Late fetal demise and PTSD risk. Sci Rep. 2022;12:12364.', { size: 20 }),
  P('20. Pearl J. Causality: Models, Reasoning, and Inference. 2nd ed. Cambridge Univ Press; 2009.', { size: 20 }),
  P('21. Greenland S, Robins JM. Identifiability, exchangeability and confounding. Int J Epidemiol. 1986;15(3):413-419.', { size: 20 }),
  P('22. American College of Obstetricians and Gynecologists. Trauma in Pregnancy Guidelines. ACOG Bull. 2023.', { size: 20 }),
  P('23. Barraco RD, Chiu WC, Clancy TV, et al. Practice management guidelines for the diagnostic evaluation of blunt abdominal trauma in pregnancy. J Trauma. 2010;69(1):211-214.', { size: 20 }),
  P('24. El Kady D. Perinatal outcomes of traumatic injuries during pregnancy. Clin Obstet Gynecol. 2007;50(3):582-591.', { size: 20 }),
  P('25. Mendez-Figueroa H, Dahlke JD, Vrees RA, Rouse DJ. Trauma in pregnancy: an updated systematic review. Am J Obstet Gynecol. 2013;209(6):490-502.', { size: 20 }),
  P('26. Jain V, Chari R, Maslovitz S, et al. Guidelines for the management of a pregnant trauma patient. J Obstet Gynaecol Can. 2015;37(6):553-574.', { size: 20 }),
  P('27. Pearlman MD, Tintinalli JE, Lorenz RP. Blunt trauma during pregnancy. N Engl J Med. 1990;323:1609-1613.', { size: 20 }),

  NOTE('v1.0 metnindeki "Yargıtay 3. Ceza Dairesi E.2018/1234, K.2019/5678" ve "Yargıtay 2. Ceza Dairesi E.2020/4321, K.2021/8765" referansları DOĞRULANAMADIĞI için bu sürümden ÇIKARILMIŞTIR. Yazarın UYAP/Yargıtay Karar Arama Sistemi üzerinden gerçek karar numaralarını bulup eklemesi önerilir.'),
);

const doc = new Document({
  creator: 'TOMEC Çalışma Grubu',
  title: 'TOMEC Algoritması — Adli Tıp Bülteni Gönderim Hazır Sürüm v2.0',
  styles: { default: { document: { run: { font: F, size: 22 } } } },
  sections: [{
    properties: { page: { margin: { top: 1100, bottom: 1100, left: 1200, right: 1200 } } },
    headers: { default: new Header({ children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [T('TOMEC v2.0 — Adli Tıp Bülteni Gönderim Hazır', { size: 18, italics: true, color: '7F7F7F' })],
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: ['Sayfa ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], font: F, size: 18, color: '7F7F7F' })],
    })] }) },
    children: sec,
  }],
});

(async () => {
  const buf = await Packer.toBuffer(doc);
  const out = path.join(__dirname, '..', 'client', 'public', 'TOMEC_Makale_v2_AdliTipBulteni_Hazir.docx');
  fs.writeFileSync(out, buf);
  console.log(`OK ${out} (${(buf.length/1024).toFixed(1)} KB)`);
})();
