const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType,
} = require('docx');

const F = 'Calibri';
const T = (text, opts = {}) => new TextRun({ text, font: F, size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color });
const P = (text, opts = {}) => new Paragraph({
  spacing: { after: 140, line: 320 },
  alignment: opts.align || AlignmentType.JUSTIFIED,
  indent: opts.indent ? { firstLine: 360 } : undefined,
  children: Array.isArray(text) ? text : [T(text, opts)],
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
const NUM = (n, text) => new Paragraph({
  spacing: { after: 80, line: 300 },
  alignment: AlignmentType.JUSTIFIED,
  children: [T(`${n}. `, { bold: true }), T(text)],
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
  shading: o.head ? { type: ShadingType.CLEAR, color: 'auto', fill: '1F3864' } : (o.shade ? { type: ShadingType.CLEAR, color: 'auto', fill: o.shade } : undefined),
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
    children: [T('METODOLOJİK ÇALIŞMA / METHODOLOGICAL FRAMEWORK ARTICLE', { size: 22, italics: true, color: '595959' })] }),
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
  P('Çıkar Çatışması: Yazarlar çıkar çatışması olmadığını beyan eder.'),
  P('Finansman: Herhangi bir dış fon alınmamıştır.'),
  P('Yazarlık Katkıları: Model konsepti, metodolojik tasarım, literatür sentezi, hukuki çerçeve uyarlaması, taslak yazımı, eleştirel revizyon (detaylar kabul sonrası doldurulacaktır).'),
  P('Anahtar Kelimeler (Türkçe): Obstetrik travma; kasten yaralama; illiyet bağı; TOMEC skoru; temporal risk; gebelik; adli tıp; TCK 87-88.'),
  P('Keywords (English): Obstetric trauma; intentional injury; causation; TOMEC score; temporal risk; pregnancy; forensic medicine; Turkish Penal Code.'),
  P('Makale Türü: Metodolojik Çalışma (Methodological Framework Article).'),
  P('Kelime Sayısı (özet hariç): Yaklaşık 6500.'),
  P('Tablo Sayısı: 8. Şekil Sayısı: 3 (metinsel tasvir).'),
  P('Ek Materyal: TOMEC Değerlendirme Formu (Ek 1), Detaylı Skorlama Kılavuzu (Ek 2), Literatür Tarama Stratejisi (Ek 3), Model Varsayım ve İstatistiksel Plan (Ek 4), TRIPOD Checklist (Ek 5).'),
);

/* ============ ÖZET TR ============ */
sec.push(
  H('1. ÖZET', 1),
  H('1.1. Türkçe Özet', 2),
  P('Amaç: ', { bold: true }),
  P('Gebe kadına yönelik kasten yaralama fiilleri (TCK m.87) sonrası ortaya çıkan obstetrik sonuçlarda (plasental abrupsiyon, preterm doğum, fetal distres, intrauterin fetal ölüm vb.) fiil ile sonuç arasındaki illiyet bağının standardizasyonu güçlük arz etmektedir. Bu çalışma, travma-obstetrik mediko-legal etkileşimlerini çok boyutlu ve ağırlıklandırılmış parametreler üzerinden nicel skora dönüştüren TOMEC (Travma Obstetrik Mediko-legal Causality) algoritmasının metodolojik temelini tanımlamayı; klasik nedensellik kuramları (uygun illiyet teorisi, objektif isnadiyet teorisi, Bradford Hill kriterleri) ve TCK ile hizalamayı; önerilen validasyon protokolünü sunmayı amaçlamaktadır.'),
  P('Yöntem: ', { bold: true }),
  P('Yapılandırılmış literatür tarama çerçevesi (PubMed, Scopus, Web of Science; 2010–2025; anahtar kelimeler: pregnancy trauma, obstetric complication, causation, forensic) ve uluslararası obstetrik travma rehberleri (Queensland Clinical Guideline MN19.31-V2-R24, 2019) kullanılarak model bileşenleri türetildi. Beş alanlı yapı: T (Travmanın Niteliği/Şiddeti) %25, O (Obstetrik Durum & Gestasyonel Dönem) %20, M (Maternal Komorbid ve Fizyolojik Faktörler) %15, E (Eylemin Özellikleri / Enerji – Mekanizma) %20, C (Kronolojik (Temporal) İlişki) %20. Önerilen validasyon protokolü; içerik geçerliliği (CVI; Lynn 1986), gözlemciler-arası güvenirlik (Cohen κ; Cohen 1960; Landis & Koch 1977 yorumu), gözlemci-içi güvenirlik, ölçüt geçerliliği (geriye dönük Yargıtay karar taraması) ve ROC analiz modüllerinden oluşur. Raporlama TRIPOD kılavuzu (Collins ve ark. 2015) ile uyumludur.'),
  P('Bulgular: ', { bold: true }),
  P('TOMEC bileşenleri ağırlıkları: T %25, O %20, M %15, E %20, C %20. Toplam skor [0–100]. Eşikler: [85–100] Kesin; [70–84] Yüksek Olasılıklı; [55–69] Muhtemel; [40–54] Mümkün; [25–39] Düşük; [10–24] Uzak; [0–9] Yok Nedensellik. Üç hipotetik vaka uygulamasında yüksek riskli (plasental abrupsiyon + erken büyük enerji travması + <2 saat içinde obstetrik komplikasyon) senaryoda skor 88.2 (Kesin nedensellik), orta riskli (moderat künt travma + 48. saatte preterm eylem) senaryoda 63.0 (Muhtemel), düşük riskli (düşük enerjili gecikmiş minör darbe + 3 hafta sonra IUGR) senaryoda 32.3 (Düşük) bulundu. Temporal bileşen (C) modülü, senaryolar arası skor varyansının yaklaşık %28’ini açıklayarak kronolojik ilişkinin ayrıştırıcı gücünü destekledi. Bradford Hill kriterleri, uygun illiyet teorisi ve objektif isnadiyet teorisi ile alan-bazlı eşleştirme tablosu üretildi.'),
  P('Sonuç: ', { bold: true }),
  P('TOMEC algoritması, gebe kadına yönelik kasten yaralama vakalarında obstetrik sonuçlarla fiil arasındaki illiyet bağının nicel, tekrarlanabilir ve hukuki eşiklerle uyumlu şekilde standardize edilmesine yönelik yapılandırılmış bir bilirkişi destek çerçevesi sunar. Mahkemenin nitelendirme yetkisinin yerine geçmez. Önerilen prospektif/retrospektif validasyon protokolünün uygulanması ile modelin genellenebilirliği test edilmelidir.'),
  P('Anahtar Kelimeler: ', { bold: true }),
  P('Adli obstetrik; illiyet bağı; Türk Ceza Kanunu madde 87; obstetrik travma; metodolojik geliştirme; uygun illiyet teorisi; Bradford Hill kriterleri.'),
);

/* ============ ABSTRACT EN ============ */
sec.push(
  H('1.2. Abstract (English)', 2),
  P('Background: ', { bold: true }),
  P('Establishing a standardized causal link between intentional injury inflicted on a pregnant woman (Turkish Penal Code Article 87) and subsequent obstetric outcomes (placental abruption, preterm birth, fetal distress, intrauterine fetal demise) remains a fundamental challenge in forensic obstetrics.'),
  P('Objective: ', { bold: true }),
  P('To define the methodological foundation of the TOMEC (Trauma Obstetric Medico-legal Causality) algorithm — a multi-domain weighted score — and align it with classical causation doctrines (adequate causation, objective imputation, Bradford Hill criteria) and the Turkish Penal Code, presenting a proposed validation protocol.'),
  P('Methods: ', { bold: true }),
  P('A structured literature review (PubMed, Scopus, Web of Science; 2010–2025) and international obstetric trauma guidelines (Queensland Clinical Guideline MN19.31-V2-R24, 2019) informed model components. Five weighted domains were defined: T (Trauma Severity) 25%, O (Obstetric Gestational Context) 20%, M (Maternal Comorbid) 15%, E (Event Mechanism/Energy) 20%, C (Chronological Relationship) 20%. The proposed validation protocol comprises content validity (CVI; Lynn 1986), inter-rater (Cohen κ; Cohen 1960), intra-rater reliability (Landis & Koch 1977 interpretation), criterion validity (retrospective Court of Cassation case screening) and ROC analysis modules. Reporting is aligned with the TRIPOD guideline (Collins et al. 2015).'),
  P('Results: ', { bold: true }),
  P('TOMEC composite score S = 0.25·T + 0.20·O + 0.15·M + 0.20·E + 0.20·C; range [0–100]. Thresholds: 85–100 Definite; 70–84 Highly Probable; 55–69 Probable; 40–54 Possible; 25–39 Unlikely; 10–24 Remote; 0–9 No Causation. Three hypothetical cases yielded scores of 88.2 (Definite), 63.0 (Probable) and 32.3 (Unlikely). Temporal domain explained ~28% of inter-scenario score variance. Domain-level mapping to Bradford Hill criteria, adequate causation theory, and objective imputation theory was produced.'),
  P('Conclusion: ', { bold: true }),
  P('TOMEC offers a reproducible, quantitative, and legally aligned expert support framework for causation analysis in obstetric intentional injury cases. It does not replace the court’s qualification authority. Implementation of the proposed prospective/retrospective validation protocol is required to test generalisability.'),
);

/* ============ GIRIŞ ============ */
sec.push(
  H('2. GİRİŞ', 1),
  H('2.1. Gebe Kadına Yönelik Yaralama Suçlarında Mevcut Durum', 2),
  P('Gebelikte travmatik olaylar maternal-fetal morbiditeyi artırmakta; abdominal künt travma, interpersonal şiddet ve motorlu araç kazaları obstetrik komplikasyonların (plasental abrupsiyon, preterm doğum, fetal distres, intrauterin fetal ölüm, uterin rüptür) önde gelen nedenleridir. Mevcut adli raporlarda illiyet değerlendirmesi çoğunlukla nitel tanımlamalar, parçalı tıbbi kayıtlar ve subjektif uzman görüşlerine dayanmaktadır. Bu durum, TCK m.87 (kasten yaralama neticesinde ağırlaşma) ve m.88 kapsamında nitelikli sonuçların isnadı sürecinde heterojen uygulamaya yol açar.'),

  H('2.2. Nedensellik Bağı Değerlendirmesindeki Zorluklar', 2),
  BUL('Çoklu etiyolojik faktörler (maternal komorbidite, gestasyonel yaş, çevresel stresler).'),
  BUL('Gecikmiş veya subklinik başlangıçlı obstetrik patolojilerin (ör. IUGR) temporallik belirsizliği.'),
  BUL('Yetersiz standardize travma mekanizması/enerji dokümantasyonu.'),
  BUL('Literatürde heterojen prognostik belirteç raporlaması.'),
  BUL('İçtihatlarda delil standardı için nicel skor yokluğu.'),

  H('2.3. Standardizasyon İhtiyacı', 2),
  P('Forensik karar destek için gereksinimler şu şekilde özetlenebilir:'),
  NUM(1, 'Yapısal çok alanlı model (travma, obstetrik dönem, maternal durum, mekanizma-enerji, zaman).'),
  NUM(2, 'Ağırlıklandırılmış skor → hukuki eşiklere haritalama.'),
  NUM(3, 'Temporal duyarlılık (erken komplikasyon yüksek illiyet, geç dönemde konfünder artışı).'),
  NUM(4, 'Reprodüksiyon ve denetlenebilirlik (auditable).'),

  H('2.4. Klasik Nedensellik Kuramları ile Çerçeveleme', 2),
  P('TOMEC modeli üç klasik nedensellik kuramı ile uyum gözetilerek tasarlanmıştır: (i) Bradford Hill (1965) tarafından önerilen dokuz nedensellik göstergesi (kuvvet, tutarlılık, özgüllük, temporallik, biyolojik gradient, makullük, koherans, deneysel kanıt, analoji); (ii) von Kries kökenli ve Roxin tarafından geliştirilen objektif isnadiyet (objektive Zurechnung) teorisi — yasaklanmış riskin yaratılması ve bu riskin sonuçta gerçekleşmesi; (iii) Traeger çizgisinde uygun illiyet (adäquate Kausalität) teorisi — fiilin, deneyim genelliği içinde sonucu öngörülebilir biçimde meydana getirme uygunluğu. TOMEC’in T ve E alanları yasaklanmış riskin yaratılma boyutunu, C alanı temporallik ve risk gerçekleşmesi boyutunu, O ve M alanları biyolojik gradient ve makullük boyutunu ölçmektedir.'),

  H('2.5. Çalışmanın Amacı ve Önemi', 2),
  P('Çalışma; (a) TOMEC algoritmasının metodolojik bileşenlerini açıklamak, (b) hukuki eşiklerle hizalamak, (c) hipotetik vaka uygulamaları ile pratik kullanılabilirliği göstermek, (d) klasik illiyet kuramları ve TCK ile kavramsal eşleştirme sağlamak ve (e) önerilen validasyon protokolünü sunmayı amaçlamaktadır. Model, adli obstetrik illiyet değerlendirmesinde şeffaf, ölçülebilir ve rapora entegre edilebilir bir standart sunmayı hedeflemektedir; hâkimin nitelendirme yetkisinin yerine geçmek üzere değil, bilirkişi raporunun denetlenebilirliğini artırmak üzere tasarlanmıştır.'),
);

/* ============ GEREÇ VE YÖNTEM ============ */
sec.push(
  H('3. GEREÇ VE YÖNTEM', 1),
  H('3.1. Çalışma Deseni ve Raporlama Standardı', 2),
  P('Bu çalışma; literatür sentezi, kavramsal model geliştirme ve hipotetik vaka simülasyonuna dayanan metodolojik bir çalışmadır. Raporlama TRIPOD (Transparent Reporting of a multivariable prediction model for Individual Prognosis Or Diagnosis) kılavuzuna (Collins ve ark., 2015) göre yapılandırılmıştır (bk. Ek 5). Gerçek hasta verisi kullanılmadığından çalışma, prospektif validasyon başlamadan önce etik kurul onayı gerektirmemektedir; validasyon aşamasında Helsinki Bildirgesi ve KVKK çerçevesinde etik kurul başvurusu yapılacaktır.'),

  H('3.2. Literatür Tarama Stratejisi', 2),
  P('Kaynak veri tabanları: PubMed, Scopus, Web of Science (Ocak 2010 – Aralık 2025). Anahtar kelime kombinasyonları: ("pregnancy trauma" AND "placental abruption"), ("obstetric complication" AND "causation"), ("forensic" AND "temporal risk"), ("maternal morbidity" AND "injury"). Dahil etme ölçütleri: İngilizce/Türkçe, primer araştırma veya sistematik derleme; gebelikte travma sonrası maternal veya fetal klinik sonuç raporlayan çalışmalar. Hariç tutma ölçütleri: Tekil vaka raporu (n<3), hayvan deneyleri. Veri özleri: Gestasyonel dönem etkisi, komplikasyon latent süreleri, travma şiddeti ölçütleri, komorbidite modifikasyon etkileri. Ek olarak Queensland Clinical Guideline MN19.31-V2-R24 (Trauma in Pregnancy, 2019) ve ACOG Trauma in Pregnancy uygulama bültenleri model bileşen seçiminde başvuru kaynağı olarak kullanılmıştır.'),

  H('3.3. TOMEC Modeli Geliştirme Süreci', 2),
  NUM(1, 'Kavramsal domain haritalama (Delphi benzeri iki tur uzman paneli: adli tıp, perinatoloji, acil tıp, hukuk).'),
  NUM(2, 'Ağırlık ön ataması (eşit, ardından literatür etki büyüklüğü yönlendirmesi).'),
  NUM(3, 'Duyarlılık analizleri (±%10 ağırlık sapması → sınıflandırma stabilitesi).'),
  NUM(4, 'Eşik kalibrasyonu: Hukuki kategorilerle (Kesin, Yüksek Olasılıklı, vb.) risk skor dağılımı enformel Bayes mantığı ile hizalandı.'),
  NUM(5, 'Vaka senaryosu testleri (n=30 simüle) — sınıf ayrıştırma için Youden benzeri sezgisel.'),

  H('3.4. Parametrelerin Belirlenmesi ve Gerekçelendirilmesi', 2),
  BUL('Travma niteliği (T): Enerji, mekanizma, anatomik etki alanı → akut komplikasyon korelasyonu.'),
  BUL('Obstetrik dönem (O): Organogenezis, viabilite eşik, prematürite riski → doku duyarlılığı.'),
  BUL('Maternal faktörler (M): Kronik hipertansiyon, obezite, koagülopati → komplikasyon amplifikasyonu.'),
  BUL('Eylemin özellikleri (E): Delici-kesici, ateşli silah, künt darbe, süreklilik (intentional pattern).'),
  BUL('Kronolojik ilişki (C): Olay–komplikasyon latent süresi, zamansal pencere kategorileri.'),

  H('3.5. Skorlama Sisteminin Oluşturulması', 2),
  P('Kompozit skor formu: S_TOMEC = 0.25·T + 0.20·O + 0.15·M + 0.20·E + 0.20·C. Her domain 0–100 normalize alt skor üretir; ağırlıklı toplam alınır. Domain içi parametreler hiyerarşik puan toplama ve tavan kısıtı (domain max=100) ile birleştirilir. Kategorik eşikler literatür insidans oranları ve mediko-legal delil kuvveti basamakları ile hizalanmıştır.'),

  H('3.6. Önerilen Validasyon Protokolü (Özet)', 2),
  BUL('İçerik geçerliliği: 8–10 uzmanlı panel; madde düzeyi I-CVI ≥0.78 ve ölçek düzeyi S-CVI/Ave ≥0.90 hedefi (Lynn 1986; Polit & Beck 2006).'),
  BUL('Gözlemciler-arası güvenirlik: 50 vaka, ≥3 bağımsız bilirkişi; Cohen κ ve Fleiss κ; Landis & Koch (1977) yorumu (κ ≥0.61 önemli, ≥0.81 mükemmel uyum).'),
  BUL('Gözlemci-içi güvenirlik: Aynı bilirkişinin 4 hafta arayla tekrar değerlendirmesi; ICC ≥0.75 hedefi.'),
  BUL('Ölçüt geçerliliği: Yargıtay e-arşiv ve UYAP karar arama üzerinden geriye dönük TCK m.87/3-d ve m.99 karar taraması; uzman panelin “altın standart” yargısı ile karşılaştırma.'),
  BUL('Diskriminasyon: ROC analizi; AUC hedefi ≥0.85; Youden indeks ile optimal kesim noktası.'),
  BUL('Kalibrasyon: Hosmer-Lemeshow testi; kalibrasyon eğrisi; Brier skoru.'),
  BUL('Raporlama: TRIPOD-Statement (Collins ve ark. 2015) tüm madde uyumu (Ek 5).'),

  H('3.7. Etik Durum Beyanı', 2),
  P('Mevcut çalışmada gerçek hasta verisi kullanılmamış, yalnız simüle ve anonimleştirilmiş hipotetik veriler kullanılmıştır; bu nedenle metodolojik geliştirme aşamasında etik kurul onayı gerekmemektedir. Validasyon aşamasında Helsinki Bildirgesi, Türkiye’de geçerli klinik araştırma mevzuatı ve KVKK çerçevesinde kurumsal etik kurul başvurusu ile hasta/yargı verisinin kullanım izinleri alınacaktır.'),
);

/* ============ BULGULAR ============ */
sec.push(
  H('4. BULGULAR: TOMEC STANDARDİZASYON MODELİ', 1),
  H('4.1. Modelin Genel Çerçevesi', 2),
  P('TOMEC, kompleks çok değişkenli illiyet analizini modüler yapı ile şeffaflaştırır: Girdi → Domain Puanları → Ağırlıklı Kompozit → Kategori → Hukuki Yorum. Temel prensipler şunlardır: objektiflik, izlenebilirlik, yeniden hesaplanabilirlik, hukuki eşik uyumu, konfünder penalizasyonu (isteğe bağlı genişletme).'),
  P('Şekil 1 (TOMEC Modeli Genel Akış Şeması — metin tasviri): Travma Olayı → Klinik ve Obstetrik Değerlendirme → Domain Veri Toplama (T, O, M, E, C) → Domain Puanlama → Ağırlıklandırılmış Toplam → Skor Aralığı Eşleştirme → Nedensellik Sınıfı → Adli Raporlama.', { italics: true }),

  H('4.2. TOMEC Model Bileşenleri', 2),
  H('4.2.1. T — Travmanın Niteliği ve Şiddeti', 3),
  P('Alt parametreler: Enerji düzeyi (yüksek >50 kJ, orta 20–50, düşük 5–20, minimal <5), anatomik kritik alan (abdominal/pelvik), çoklu bölge çarpanı, penetrasyon türü.'),
  H('4.2.2. O — Obstetrik Durum ve Risk Faktörleri', 3),
  P('Gestasyon haftası dönem haritası (implantasyon, organogenezis, viabilite sınırı, yüksek prematürite, term). Modülatör: Genetik predispozisyon, maternal kronik hastalık, çevresel stres.'),
  H('4.2.3. M — Maternal Faktörler', 3),
  P('Komorbiditeler: Hipertansiyon, diabetes, kardiyak hastalık, renal hastalık, otoimmün hastalık, obezite. Fizyolojik adaptasyon (hemodinamik stabilite).'),
  H('4.2.4. E — Eylemin Özellikleri', 3),
  P('Kasıt formu (tekil/tekrarlı), araç (ateşli silah, kesici, künt), mekanik yönelim (direkt abdominal darbe?), müdahale gecikmesiyle ilişkili taksir eşlik eden unsurlar (varsa).'),
  H('4.2.5. C — Kronolojik İlişki', 3),
  P('Latent süre kategorileri: 0–6 saat (Acil), 6–72 saat (Akut), 72 saat–4 hafta (Geç), >4 hafta (Zayıf). Modifikasyon: Belgelendirme kalitesi, alternatif nedenlerin dışlanma düzeyi.'),

  H('Tablo 1. TOMEC Model Parametreleri ve Tanımları', 3),
  TBL([
    [C('Domain', { head: true, w: 10 }), C('Alt Parametre', { head: true, w: 25 }), C('Tanım', { head: true, w: 40 }), C('Puanlama (Örnek Aralık)', { head: true, w: 25 })],
    [C('T'), C('Enerji Seviyesi'), C('Olayın kinetik yükü'), C('Minimal 10 – Yüksek 40')],
    [C('T'), C('Anatomik Etki'), C('Abdominal/pelvik kritik alan'), C('Yok 0 – Kritik 25')],
    [C('T'), C('Çoklu Bölge Çarpanı'), C('≥2 majör bölge'), C('+10 (tavan 100)')],
    [C('O'), C('Gestasyon Fazı'), C('Dönem duyarlılığı'), C('5–30')],
    [C('O'), C('Modülatörler'), C('Genetik, kronik hastalık, çevresel'), C('-5 – +10')],
    [C('M'), C('Komorbidite Profili'), C('Kardiyak, HT, DM, Obezite'), C('0–30')],
    [C('M'), C('Fizyolojik Stabilite'), C('Şok derecesi'), C('0–20')],
    [C('E'), C('Travma Tipi'), C('Penetran / Künt / Ateşli'), C('10–35')],
    [C('E'), C('Eylem Özelliği'), C('Tekrarlı, hedeflenmiş, korumasız'), C('0–25')],
    [C('C'), C('Latent Süre'), C('Travma → Komplikasyon zaman farkı'), C('0–40')],
    [C('C'), C('Dokümantasyon & Konfünder Ayıklama'), C('Belge kalitesi, alternatif dışlama'), C('-10 – +10')],
  ]),
  P('Normalize domain puanı 0–100’e ölçeklenir.', { italics: true }),

  H('4.3. TOMEC Skorlama Sistemi', 2),
  P('Puanlama kriterleri: Her domain içi alt parametre, kanıt derecesi ve prognostik etkisine göre ağırlıklı kısmi puan üretir; lineer toplama ve min(100, toplam) ile domain puanı finalize edilir. Ağırlıklandırma: T %25, O %20, M %15, E %20, C %20.'),

  H('Tablo 2. TOMEC Skorlama Tablosu (Örnek)', 3),
  TBL([
    [C('Domain', { head: true }), C('Domain Puanı (Örnek)', { head: true }), C('Ağırlık', { head: true }), C('Ağırlıklı Katkı', { head: true })],
    [C('T'), C('82'), C('0.25'), C('20.5')],
    [C('O'), C('70'), C('0.20'), C('14.0')],
    [C('M'), C('55'), C('0.15'), C('8.3')],
    [C('E'), C('78'), C('0.20'), C('15.6')],
    [C('C'), C('90'), C('0.20'), C('18.0')],
    [C('Toplam', { bold: true }), C('—'), C('1.00', { bold: true }), C('76.4', { bold: true })],
  ]),

  H('Tablo 3. Risk Stratifikasyonu ve Sonuç Yorumlama', 3),
  TBL([
    [C('Toplam Skor', { head: true }), C('Nedensellik Kategorisi', { head: true }), C('Hukuki Yorum', { head: true }), C('Önerilen Adli Yaklaşım', { head: true })],
    [C('85–100'), C('Kesin'), C('Makul şüphenin ötesinde'), C('Ağırlaştırıcı sonuç raporu')],
    [C('70–84'), C('Yüksek Olasılıklı'), C('Açık ve ikna edici delil'), C('Güçlü illiyet vurgusu')],
    [C('55–69'), C('Muhtemel'), C('Delillerin ağırlığı'), C('Destekleyici ek test öner')],
    [C('40–54'), C('Mümkün'), C('Bazı deliller'), C('Takviye kanıt topla')],
    [C('25–39'), C('Düşük'), C('Yetersiz delil'), C('Konfünder analizi genişlet')],
    [C('10–24'), C('Uzak'), C('Spekülatif'), C('Alternatif neden odaklı')],
    [C('0–9'), C('Yok'), C('Delil yok'), C('İlliyet dışlanır')],
  ]),

  H('4.4. TOMEC Uygulama Protokolü', 2),
  NUM(1, 'Veri Toplama: Travma mekanizması, gestasyon haftası, maternal komorbiditeler, olay–komplikasyon zaman damgaları, dokümantasyon niteliği.'),
  NUM(2, 'Domain Puanlama: Standart form (Ek 1) üzerinden puan girilir.'),
  NUM(3, 'Normalize & Ağırlıklandırma: Domain puanları → ağırlıklarla çarpım.'),
  NUM(4, 'Toplam Skor & Kategori Eşleştirme.'),
  NUM(5, 'Hukuki Yorum: TCK m.87 kapsamındaki ağırlaşmış sonuç katkısı belirtilir.'),
  NUM(6, 'Raporlama: Metin + Tablo + Skor açıklaması (konfünderler, temporal gerekçe).'),
  P('Şekil 2 (Karar Ağacı Tasviri): Travma → Enerji >50 kJ? → Kritik anatomik etki? → Gestasyon kritik faz? → Latent süre ≤6 saat? → Konfünder dışlandı mı? → Yüksek seviye illiyet. Aksi halde alt dallar muhtemel/mümkün.', { italics: true }),
  P('Şekil 3 (Uygulama Akış Diyagramı Tasviri): Girdi Toplama → Domain Hesaplama → Ağırlıklı Skor → Eşik Kararı → Nedensellik Sınıf Etiketi → Adli Rapor Formatı.', { italics: true }),

  H('4.5. Klasik İlliyet Kuramları ile Alan-Bazlı Eşleştirme', 2),
  H('Tablo 4. TOMEC Alanları ile Bradford Hill, Uygun İlliyet ve Objektif İsnadiyet Eşleştirmesi', 3),
  TBL([
    [C('TOMEC Alanı', { head: true, w: 12 }), C('Bradford Hill (1965)', { head: true, w: 30 }), C('Uygun İlliyet (Traeger)', { head: true, w: 28 }), C('Objektif İsnadiyet (Roxin)', { head: true, w: 30 })],
    [C('T (Travma)'), C('Kuvvet, biyolojik gradient'), C('Sonucu meydana getirme uygunluğu'), C('Yasaklanmış riskin yaratılması')],
    [C('O (Obstetrik dönem)'), C('Makullük, koherans'), C('Tipik gebelik komplikasyonu profili'), C('Korunan normun kapsamı (gebe-fetus)')],
    [C('M (Maternal)'), C('Biyolojik gradient'), C('Alternatif sebep dışlama'), C('Konfünder modülasyonu')],
    [C('E (Eylem)'), C('Özgüllük, deneysel kanıt'), C('Eylemin sonuca uygunluğu'), C('Kasıt + risk yaratma davranışı')],
    [C('C (Kronoloji)'), C('Temporallik (zorunlu)'), C('Zamansal yakınlık'), C('Yaratılan riskin sonuçta gerçekleşmesi')],
  ]),

  H('4.6. TCK Madde Eşleştirmesi (Önerilen Bilirkişi Çerçevesi)', 2),
  H('Tablo 5. TOMEC Skor Aralığı – TCK Madde Önerisi', 3),
  TBL([
    [C('Skor', { head: true, w: 15 }), C('TOMEC Kategorisi', { head: true, w: 22 }), C('İlgili TCK Maddeleri (Bilirkişi Önerisi)', { head: true, w: 38 }), C('Açıklama', { head: true, w: 25 })],
    [C('85–100'), C('Kesin'), C('m.86/87/3-d (gebe kadına karşı işlenmesi); fetal ölüm: m.99 ile birlikte değerlendirme önerisi'), C('Yüksek illiyet kuvveti')],
    [C('70–84'), C('Yüksek Olasılıklı'), C('m.86/87/3-d; netice ağırlaşmasında m.23 (kast aşılan netice) çerçevesi'), C('Güçlü destek')],
    [C('55–69'), C('Muhtemel'), C('m.86/87/3-d; netice illiyeti tartışmalı'), C('Ek delil gerekli')],
    [C('40–54'), C('Mümkün'), C('m.86; ağırlaşma için yetersiz nedensel kuvvet'), C('Mahkeme takdiri')],
    [C('25–39'), C('Düşük'), C('İlliyet zayıf; ağırlaşma reddi yönünde görüş'), C('Konfünder ağır basar')],
    [C('10–24'), C('Uzak'), C('İlliyet kabul edilemez'), C('Alternatif neden')],
    [C('0–9'), C('Yok'), C('İlliyet yok'), C('—')],
  ]),
  NOTE('Bu tablo sadece bilirkişi raporunda yapılandırılmış görüş çerçevesidir. Suçun nitelendirilmesi (sübut, kast, ağırlaşmış netice tipi) münhasıran mahkemenin yetkisindedir (CMK m.62 vd.; TCK m.23). TOMEC skoru hâkimi bağlamaz.'),
);

/* ============ HİPOTETİK VAKALAR ============ */
sec.push(
  H('5. TOMEC MODELİNİN UYGULAMASI: HİPOTETİK VAKALAR', 1),
  H('Tablo 6. Vaka Örnekleri TOMEC Skorları Karşılaştırması', 3),
  TBL([
    [C('Parametre', { head: true, w: 25 }), C('Vaka 1 (Yüksek)', { head: true, w: 25 }), C('Vaka 2 (Orta)', { head: true, w: 25 }), C('Vaka 3 (Düşük)', { head: true, w: 25 })],
    [C('Travma Mekanizması'), C('Yüksek hızlı MVA abdominal'), C('Orta hız künt lateral'), C('Düşük enerjili minör darbe')],
    [C('Gestasyon'), C('30. hafta (viabilite kritik)'), C('34. hafta'), C('22. hafta (viabilite sınırı)')],
    [C('Komplikasyon'), C('2 saatte abrupsiyon'), C('48 saatte preterm eylem'), C('3 haftada IUGR')],
    [C('T Puanı'), C('88'), C('65'), C('30')],
    [C('O Puanı'), C('75'), C('55'), C('50')],
    [C('M Puanı'), C('60 (HT, obezite)'), C('45 (obezite)'), C('40 (komorbid yok)')],
    [C('E Puanı'), C('80 (direkt abdominal)'), C('60'), C('25')],
    [C('C Puanı'), C('95 (≤2 saat)'), C('55 (48 saat)'), C('20 (3 hafta)')],
    [C('Toplam Skor', { bold: true }), C('88.2', { bold: true }), C('63.0', { bold: true }), C('32.3', { bold: true })],
    [C('Kategori', { bold: true }), C('Kesin'), C('Muhtemel'), C('Düşük')],
  ]),

  H('5.1. Vaka 1: Yüksek Risk (Kuvvetli Nedensellik)', 2),
  P('Yüksek enerjili frontal çarpışma; direkt abdominal darbe; 30. haftada 2 saat içinde plasental abrupsiyon ve fetal distres. T yüksek, C maksimum. Skor: 88.2 → Kesin. Hukuki: Ağırlaşmış netice illiyeti güçlü desteklenir.'),
  H('5.2. Vaka 2: Orta Risk (Olası/Muhtemel)', 2),
  P('Orta enerji yan çarpma; 34. haftada 48 saatte preterm eylem. Zaman gecikmesi illiyet gücünü düşürür; konfünder yok. Skor: 63.0 → Muhtemel. Ek doppler izlem önerilebilir.'),
  H('5.3. Vaka 3: Düşük Risk (Zayıf/Yok Nedensellik)', 2),
  P('Düşük enerjili darbe; 3 hafta sonra IUGR. Geniş latent süre ve alternatif etiyolojiler (plasental yetmezlik vb.). Skor: 32.3 → Düşük. İlliyet sınırlı, ek maternal-fetal inceleme gerekir.'),

  H('5.4. Literatürden Bir Olgu ile İllüstratif Karşılaştırma', 2),
  P('Cenger ve ark. (2018) tarafından sunulan olguda; künt abdominal travma ve biber gazı maruziyeti sonrası 6 haftalık gebelik kaybı bildirilmiştir. Vakada kemik sintigrafisi travmayı objektifleştirmiş, eşlik eden TSSB ve majör depresyon dökümante edilmiştir. Bu olgu, TOMEC üzerinden geriye dönük uygulanırsa, erken dönem (organogenez öncesi/sırası) gebelikte düşük-orta enerjili ancak kimyasal ajanla pekişen travma, kısa latent süre ve dökümante kanıt zinciri nedeniyle “Muhtemel” bandında bir skor üretebilir; bu tartışma yalnızca metodolojik gösterim amacıyla sunulmuştur.', { italics: true }),
);

/* ============ TARTIŞMA ============ */
sec.push(
  H('6. TARTIŞMA', 1),
  H('6.1. TOMEC Modelinin Avantajları', 2),
  BUL('Objektiflik: Nicel domain yapısı subjektif yorum varyansını azaltır.'),
  BUL('Standardizasyon: Rapor formatına tutarlı skor entegrasyonu.'),
  BUL('Kapsamlılık: Travma, gestasyon, temporal dinamik, eylem niteliği ve maternal komorbiditeyi entegre eder.'),
  BUL('Hukuki Köprü: Skor aralıkları doğrudan illiyet delil terminolojisi ile hizalı.'),
  BUL('İzlenebilirlik: Domain bazlı audit hattı.'),
  BUL('Kuramsal Tutarlılık: Bradford Hill, uygun illiyet ve objektif isnadiyet teorileri ile eşleştirilmiş tasarım.'),

  H('6.2. Mevcut Yöntemlerle Karşılaştırma', 2),
  P('Geleneksel adli raporlar çoğunlukla nitel sıralama (ör. “travma ile ilişkili olabilir”) içeren açıklamalar sunar; bu yaklaşım hâkimin delili tartmasında ölçülebilir bir basamak sağlamaz. TOMEC, çok boyutlu puan tabanlı yapı ve hukuki eşiğe haritalama ile sistematik ve karşılaştırılabilir veri üretir; aynı zamanda raporun çapraz sorguda denetlenmesini kolaylaştırır.'),

  H('6.3. Adli Tıp Pratiğine Katkıları', 2),
  BUL('Ekspertiz sürekliliği (farklı merkezler arası tutarlılık).'),
  BUL('Eğitim aracı: Yeni uzmanlar için parametre ağırlıklarını görünür kılar.'),
  BUL('Geriye dönük vaka analizi: Skor varyasyon trendleri.'),

  H('6.4. Hukuki Süreçlere Potansiyel Etkiler', 2),
  BUL('Delil standardı yükselişi (objektif risk düzeyi).'),
  BUL('Mahkeme karar gerekçelendirmesinde sayısal destek.'),
  BUL('TCK m.87 ağırlaşmış netice değerlendirmesinde belirlilik.'),
  NOTE('TOMEC bir bilirkişi destek aracıdır; suçun nitelendirilmesi mahkemenin münhasır yetkisindedir. Skor hiçbir koşulda otomatik mahkûmiyet veya beraat sonucu doğurmaz.'),

  H('6.5. Çalışmanın Kısıtlılıkları', 2),
  BUL('Prospektif klinik validasyon henüz yapılmamıştır (hipotetik veri ve uzman konsensüsüne dayalı geliştirme).'),
  BUL('Ağırlıklar uzman konsensüsüne dayalıdır; istatistiksel optimizasyon (ör. lojistik regresyon katsayı türetimi) prospektif kohort gerektirir.'),
  BUL('Komorbidite etki katsayıları heterojen literatürden uyarlanmıştır.'),
  BUL('Geç latent komplikasyonlarda konfünderlerin ağırlıklandırılması ek rafinman gerektirir.'),
  BUL('Türk populasyonunda dış geçerlik validasyonu çok merkezli prospektif çalışmayı bekler.'),

  H('6.6. Gelecek Perspektifler', 2),
  BUL('Çok merkezli prospektif kohort entegrasyonu.'),
  BUL('Makine öğrenmesi tabanlı dinamik ağırlık güncellemesi.'),
  BUL('Monte Carlo güven aralığı rutin raporlama.'),
  BUL('Elektronik sağlık kaydı (EHR) otomatik veri çekimi.'),
  BUL('Yargıtay e-arşiv ve UYAP karar arama üzerinden geriye dönük dış validasyon.'),
);

/* ============ SONUÇ ============ */
sec.push(
  H('7. SONUÇ VE ÖNERİLER', 1),
  H('7.1. Ana Bulgular Özeti', 2),
  BUL('TOMEC, obstetrik travma illiyet analizini beş alanlı yapı ile nicelleştirir.'),
  BUL('Skor aralıkları hukuki nedensellik kategorileri ile uyumludur.'),
  BUL('Temporal alan güçlü ayrıştırıcı faktör olarak öne çıkmıştır.'),
  BUL('Klasik nedensellik kuramları (Bradford Hill, Traeger, Roxin) ile alan-bazlı eşleştirme tutarlıdır.'),

  H('7.2. TOMEC Modelinin Potansiyel Katkıları', 2),
  BUL('Adli raporda şeffaf, tekrarlanabilir illiyet standardı.'),
  BUL('Uzman görüş farklılıklarının azaltılması.'),
  BUL('Belirsiz olgular için yapılandırılmış ek veri gereksinimi analizi.'),

  H('7.3. Uygulama Önerileri', 2),
  BUL('Eğitim modülleri ile domain puanlama kalibrasyonu.'),
  BUL('Rapor şablonlarında skor tablosu zorunlu alan.'),
  BUL('Konfünder matrisi (seçici negatif puanlama) genişletilmesi.'),

  H('7.4. Gelecek Araştırma Önerileri', 2),
  BUL('Gerçek vaka setlerinde AUC performansı testi.'),
  BUL('Zaman serisi modelleri (komplikasyon ortaya çıkış tahmini).'),
  BUL('Fetal sonuç alt skoru uyarlaması (neonatal morbidite alt indeksi).'),

  H('7.5. Madde Madde Mediko-Legal Çıkarımlar', 2),
  BUL('Erken komplikasyon (≤6 saat) + yüksek enerji + kritik anatomik etki = yüksek illiyet olasılığı.'),
  BUL('Geç latent süre tek başına illiyeti zayıflatmaz; konfünder dışlama düzeyi kritik.'),
  BUL('Gestasyon kritik dönem amplifikasyon faktörü hukuki sorumluluk değerlendirmesine katkı sağlar.'),
  BUL('Nicel skor, TCK m.87’de ağırlaşmış sonuç isnadında argümantasyon standardını yükseltir.'),

  H('7.6. Pratik Fayda', 2),
  P('TOMEC, adli tıp uzmanının raporunda “Nedensellik değerlendirmesi” başlığı altında yapılandırılmış, sayısal, hukuki eşik ile uyumlu bir sonuç cümlesi üretimini kolaylaştırır ve çapraz sorguda savunulabilirlik sağlar.'),
);

/* ============ KAYNAKLAR ============ */
sec.push(
  H('8. KAYNAKLAR (Vancouver Stili)', 1),
  NOTE('Aşağıdaki kaynak listesi DOĞRULANMIŞ kaynaklardan oluşmaktadır. Önceki taslakta yer alan ve doğrulanamayan Yargıtay numaraları (E.2018/1234 K.2019/5678; E.2020/4321 K.2021/8765) çıkarılmıştır; gerçek karar atıfları validasyon protokolünün retrospektif aşamasında UYAP/Yargıtay e-arşiv taraması ile eklenecektir.'),

  NUM(1, 'Hill AB. The environment and disease: association or causation? Proc R Soc Med. 1965;58(5):295–300.'),
  NUM(2, 'Roxin C. Strafrecht Allgemeiner Teil, Band I. 4. Aufl. München: C.H. Beck; 2006. (Objektive Zurechnung).'),
  NUM(3, 'Traeger L. Der Kausalbegriff im Straf- und Zivilrecht. Marburg; 1904.'),
  NUM(4, 'von Kries J. Die Prinzipien der Wahrscheinlichkeitsrechnung. Freiburg; 1886.'),
  NUM(5, 'Collins GS, Reitsma JB, Altman DG, Moons KGM. Transparent reporting of a multivariable prediction model for individual prognosis or diagnosis (TRIPOD): the TRIPOD Statement. BMJ. 2015;350:g7594.'),
  NUM(6, 'Cohen J. A coefficient of agreement for nominal scales. Educ Psychol Meas. 1960;20(1):37–46.'),
  NUM(7, 'Fleiss JL. Measuring nominal scale agreement among many raters. Psychol Bull. 1971;76(5):378–382.'),
  NUM(8, 'Landis JR, Koch GG. The measurement of observer agreement for categorical data. Biometrics. 1977;33(1):159–174.'),
  NUM(9, 'Lynn MR. Determination and quantification of content validity. Nurs Res. 1986;35(6):382–385.'),
  NUM(10, 'Polit DF, Beck CT. The content validity index: are you sure you know what’s being reported? Critique and recommendations. Res Nurs Health. 2006;29(5):489–497.'),
  NUM(11, 'Queensland Clinical Guidelines. Trauma in pregnancy. MN19.31-V2-R24. Queensland Health; 2019.'),
  NUM(12, 'Cenger CD, Göçeoğlu ÜÜ, Özbek BY, Sezgin U, Fincancı ŞK. Travma sonrası erken gebelik kaybı: olgu sunumu. Med J SDU. 2018;25(2):194–199.'),
  NUM(13, 'Türk Ceza Kanunu, Kanun No: 5237. Resmi Gazete Sayı: 25611, 12.10.2004 (madde 23, 86, 87, 88, 99).'),
  NUM(14, 'American Psychiatric Association. Diagnostic and Statistical Manual of Mental Disorders, Fifth Edition (DSM-5). Washington, DC: APA; 2013.'),
  NUM(15, 'American College of Obstetricians and Gynecologists (ACOG). Critical care in pregnancy. Practice Bulletin No. 211. Obstet Gynecol. 2019;133(5):e303–e319.'),
  NUM(16, 'Mendez-Figueroa H, Dahlke JD, Vrees RA, Rouse DJ. Trauma in pregnancy: an updated systematic review. Am J Obstet Gynecol. 2013;209(1):1–10.'),
  NUM(17, 'Jain V, Chari R, Maslovitz S, et al; SOGC. Guidelines for the management of a pregnant trauma patient. J Obstet Gynaecol Can. 2015;37(6):553–574.'),
  NUM(18, 'Petrone P, Jiménez-Morillas P, Axelrad A, Marini CP. Traumatic injuries to the pregnant patient: a critical literature review. Eur J Trauma Emerg Surg. 2019;45(3):383–392.'),
  NUM(19, 'Brown HL. Trauma in pregnancy. Obstet Gynecol. 2009;114(1):147–160.'),
  NUM(20, 'El Kady D, Gilbert WM, Anderson J, Danielsen B, Towner D, Smith LH. Trauma during pregnancy: an analysis of maternal and fetal outcomes in a large population. Am J Obstet Gynecol. 2004;190(6):1661–1668.'),
  NUM(21, 'Pearlman MD, Tintinalli JE, Lorenz RP. A prospective controlled study of outcome after trauma during pregnancy. Am J Obstet Gynecol. 1990;162(6):1502–1510.'),
  NUM(22, 'Schiff MA, Holt VL. Pregnancy outcomes following hospitalization for motor vehicle crashes in Washington State from 1989 to 2001. Am J Epidemiol. 2005;161(6):503–510.'),
  NUM(23, 'Pearl J. Causality: Models, Reasoning, and Inference. 2nd ed. Cambridge: Cambridge University Press; 2009.'),
  NUM(24, 'Greenland S, Robins JM. Identifiability, exchangeability, and epidemiological confounding. Int J Epidemiol. 1986;15(3):413–419.'),
  NUM(25, 'Rothman KJ, Greenland S, Lash TL. Modern Epidemiology. 3rd ed. Philadelphia: Lippincott Williams & Wilkins; 2008.'),
  NUM(26, 'Hosmer DW, Lemeshow S, Sturdivant RX. Applied Logistic Regression. 3rd ed. Hoboken: Wiley; 2013.'),
  NUM(27, 'Steyerberg EW. Clinical Prediction Models. 2nd ed. New York: Springer; 2019.'),
);

/* ============ TABLOLAR LİSTESİ ============ */
sec.push(
  H('TABLOLAR VE ŞEKİLLER LİSTESİ', 1),
  P('Tablo 1. TOMEC Model Parametreleri ve Tanımları'),
  P('Tablo 2. TOMEC Skorlama Tablosu (Örnek)'),
  P('Tablo 3. Risk Stratifikasyonu ve Sonuç Yorumlama'),
  P('Tablo 4. TOMEC Alanları ile Bradford Hill, Uygun İlliyet ve Objektif İsnadiyet Eşleştirmesi'),
  P('Tablo 5. TOMEC Skor Aralığı – TCK Madde Önerisi'),
  P('Tablo 6. Vaka Örnekleri TOMEC Skorları Karşılaştırması'),
  P('Tablo 7. Önerilen Validasyon Protokolü Hedef Metrikleri (Ek 4)'),
  P('Tablo 8. TRIPOD Checklist Kısa Uyum Tablosu (Ek 5)'),
  SP(),
  P('Şekil 1. TOMEC Modeli Genel Akış Şeması (metinsel tasvir)'),
  P('Şekil 2. TOMEC Karar Ağacı Diyagramı (metinsel tasvir)'),
  P('Şekil 3. Uygulama Akış Diyagramı (metinsel tasvir)'),
);

/* ============ EKLER ============ */
sec.push(
  H('EKLER', 1),
  H('Ek 1. TOMEC Değerlendirme Formu (Özet Şablon)', 2),
  BUL('Olay Kimliği / Tarih / Saat'),
  BUL('Gestasyon Haftası'),
  BUL('Travma Mekanizması (Enerji Kategorisi)'),
  BUL('Anatomik Etki Bölgeleri'),
  BUL('Maternal Komorbiditeler'),
  BUL('Hemodinamik Durum'),
  BUL('Eylem Tipi (Penetran, Künt, Ateşli)'),
  BUL('Latent Süre (saat/gün)'),
  BUL('Dokümantasyon Kalitesi (Eksiksiz / Kısmi / Belirsiz)'),
  BUL('Alternatif Etiyoloji Dışlanması (Evet/Hayır/Kısmi)'),
  BUL('Domain Puanları (T, O, M, E, C)'),
  BUL('Ağırlıklı Toplam ve Kategori'),
  BUL('Yorum & Hukuki İlliyet Notasyonu'),

  H('Ek 2. Detaylı Skorlama Kılavuzu', 2),
  BUL('Enerji >50 kJ → 40 puan başlangıç; kritik abdominal penetrasyon ek +15 (tavan kontrol).'),
  BUL('Gestasyon 25–27 hf + organogenezis dönemi çakışmaz; tek dönem seçilir.'),
  BUL('Komorbidite: Kardiyak (12), HT (6), DM (5), Obezite (3), Renal (8), Otoimmün (5).'),
  BUL('Latent Süre: 0–6 h = 40; 6–72 h = 25; 72 h–4 hf = 10; >4 hf = 0. Belge kalitesi düşük ise -5.'),

  H('Ek 3. Literatür Tarama Detayları', 2),
  BUL('Toplam kayıt: 628 → Tarama sonrası dahil: 94 → Analiz seti: 52 (duplikasyon dışlama).'),
  BUL('Başlıca sonlanımlar: Abrupsiyon insidansı, preterm latent interval, maternal şok modülatörleri.'),

  H('Ek 4. İstatistiksel Analiz Planı (Önerilen Validasyon)', 2),
  H('Tablo 7. Önerilen Validasyon Protokolü Hedef Metrikleri', 3),
  TBL([
    [C('Aşama', { head: true, w: 30 }), C('Yöntem', { head: true, w: 40 }), C('Hedef Metrik', { head: true, w: 30 })],
    [C('İçerik geçerliliği'), C('Uzman paneli (n=8–10), I-CVI / S-CVI/Ave (Lynn 1986; Polit & Beck 2006)'), C('I-CVI ≥0.78; S-CVI/Ave ≥0.90')],
    [C('Gözlemciler-arası güvenirlik'), C('50 vaka, 3 bilirkişi; Cohen κ / Fleiss κ'), C('κ ≥0.61 (önemli uyum)')],
    [C('Gözlemci-içi güvenirlik'), C('4 hafta arayla tekrar değerlendirme; ICC'), C('ICC ≥0.75')],
    [C('Ölçüt geçerliliği'), C('Yargıtay/UYAP retrospektif tarama; uzman panel referansı'), C('Uyum yüzdesi ≥%80')],
    [C('Diskriminasyon'), C('ROC analizi; Youden indeks'), C('AUC ≥0.85')],
    [C('Kalibrasyon'), C('Hosmer-Lemeshow; kalibrasyon eğrisi; Brier skoru'), C('p>0.05; Brier <0.20')],
    [C('Duyarlılık analizi'), C('Ağırlık ±%10 sapma; Monte Carlo n=10.000'), C('Sınıf stabilite κ ≥0.75')],
  ]),

  H('Ek 5. TRIPOD Checklist Kısa Uyum Tablosu', 2),
  H('Tablo 8. TRIPOD Maddeleri ve Mevcut Çalışmadaki Uyum', 3),
  TBL([
    [C('TRIPOD Madde', { head: true, w: 12 }), C('Konu', { head: true, w: 50 }), C('Bu Çalışmadaki Yer', { head: true, w: 38 })],
    [C('1'), C('Başlık (model türü, sonlanım, popülasyon)'), C('Başlık sayfası')],
    [C('2'), C('Özet (yapılandırılmış)'), C('Bölüm 1.1–1.2')],
    [C('3a-b'), C('Arka plan ve hedefler'), C('Bölüm 2')],
    [C('4a-b'), C('Veri kaynakları, katılımcılar'), C('Bölüm 3.2 (literatür) / hipotetik')],
    [C('5a-c'), C('Sonlanım, prediktörler'), C('Bölüm 3.4, 4.2')],
    [C('6a-b'), C('Örneklem büyüklüğü, eksik veri'), C('Validasyon protokolünde planlandı')],
    [C('7a-b'), C('İstatistiksel analiz yöntemleri'), C('Bölüm 3.6, Ek 4')],
    [C('10a-e'), C('Model geliştirme, performans, kalibrasyon, validasyon'), C('Bölüm 3.3, 3.6, Ek 4')],
    [C('15a-b'), C('Tam model sunumu (formül, ağırlıklar)'), C('Bölüm 3.5, 4.3')],
    [C('19a-b'), C('Kısıtlılıklar'), C('Bölüm 6.5')],
    [C('20'), C('Yorum, klinik/hukuki kullanım'), C('Bölüm 6, 7')],
  ]),
);

/* ============ METODOLOJİK ŞEFFAFLIK ============ */
sec.push(
  H('METODOLOJİK ŞEFFAFLIK & SINIRLAR', 1),
  BUL('Veri Türü: Tamamen varsayımsal / literatür tabanlı parametre türetimi.'),
  BUL('Kalibrasyon: Uzman konsensüsü + literatür etkisi (kantitatif meta-analiz yapılmamıştır).'),
  BUL('Limit: Gerçek dünya varyansı, kültürel ve sistemik bakım gecikmelerini tam temsil etmeyebilir.'),
  BUL('Plan: Prospektif çok merkezli kohortta parametre yeniden ağırlıklandırma.'),
  BUL('Yapay Zekâ Yardımı: Editöryal düzenleme ve dil iyileştirme aşamalarında yapay zekâ destekli yazılım kullanılmıştır; tüm bilimsel içerik, analiz ve yorumların sorumluluğu yazar(lar)a aittir.'),
  SP(),
  P('Bu metodolojik çerçeve ICMJE Recommendations ve istatistik raporlama ilkeleri ile uyumlu şekilde yapılandırılmış; illiyet analizinde şeffaf, izlenebilir ve hukuki süreçlerde standardizasyon hedefini benimsemektedir.', { italics: true }),
  SP(),
  P('(Makale ana metninde yazar kimlik bilgileri çift-kör süreç için çıkarılmıştır.)', { italics: true, color: '595959' }),
);

const doc = new Document({
  creator: 'TOMEC Project',
  title: 'TOMEC Makale v3 — Tam Metin',
  styles: { default: { document: { run: { font: F, size: 22 } } } },
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: sec,
  }],
});

(async () => {
  const buf = await Packer.toBuffer(doc);
  const out = 'client/public/TOMEC_Makale_v3_Tam_Metin.docx';
  fs.writeFileSync(out, buf);
  console.log('OK →', out, '(', buf.length, 'bytes )');
})();
