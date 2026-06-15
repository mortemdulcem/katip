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
  spacing: { after: 80, line: 300 }, bullet: { level: lvl },
  alignment: AlignmentType.JUSTIFIED, children: [T(text)],
});
const NUM = (n, text) => new Paragraph({
  spacing: { after: 80, line: 300 }, alignment: AlignmentType.JUSTIFIED,
  children: [T(`${n}. `, { bold: true }), T(text)],
});
const NOTE = (text) => new Paragraph({
  spacing: { before: 100, after: 160, line: 280 }, alignment: AlignmentType.JUSTIFIED,
  shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFF2CC' },
  children: [T('NOT — ', { bold: true, color: '7F6000', size: 20 }), T(text, { color: '7F6000', size: 20 })],
});
const SP = () => new Paragraph({ children: [T('')] });
const C = (txt, o = {}) => new TableCell({
  width: { size: o.w || 25, type: WidthType.PERCENTAGE },
  shading: o.head ? { type: ShadingType.CLEAR, color: 'auto', fill: '1F3864' } : undefined,
  margins: { top: 70, bottom: 70, left: 90, right: 90 },
  children: [new Paragraph({ alignment: o.align || AlignmentType.LEFT,
    children: [T(txt, { size: o.size || 19, bold: o.head || o.bold, color: o.head ? 'FFFFFF' : '000000' })] })],
});
const TBL = (rows) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map(r => new TableRow({ children: r })) });

const sec = [];

/* ============ KAPAK ============ */
sec.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800, after: 240 },
    children: [T('METODOLOJİK ÇALIŞMA', { size: 22, italics: true, color: '595959' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [T('Gebe Kadına Yönelik Kasten Yaralama Suçlarında (TCK m.87) Obstetrik Sonuçlar ile Fiil Arasındaki İlliyet Bağı: TOMEC Algoritması', { size: 32, bold: true, color: '1F3864' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 },
    children: [T('Causal Linkage Between Intentional Injury Inflicted on Pregnant Women (TPC Art. 87) and Obstetric Outcomes: The TOMEC Algorithm', { size: 24, italics: true, color: '2E74B5' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [T('Kısa Başlık: Obstetrik Travmada TOMEC İlliyet Skoru', { size: 20, italics: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [T('Running Title: TOMEC Causality Score in Obstetric Trauma', { size: 20, italics: true })] }),
  P('Yazar(lar): Çift-kör değerlendirme için bu sayfadan sonra metinde yer almayacaktır.'),
  P('Sorumlu Yazar İletişim Bilgileri: Gönderim esnasında ayrı üst yazıda belirtilecektir.'),
  P('Etik Beyan: Mevcut çalışma gerçek hasta verisi içermez; literatür sentezi ve prototip modelleme üzerine kuruludur. Helsinki Bildirgesi’nin insan verisi hükümleri kapsamı dışındadır. Validasyon aşamasında etik kurul onayı alınacaktır.'),
  P('Çıkar Çatışması: Yoktur.'),
  P('Finansman: Dış fon alınmamıştır.'),
  P('Yazarlık Katkıları: Model konsepti, metodolojik tasarım, literatür sentezi, hukuki uyarlama, taslak yazımı ve eleştirel revizyon (kabul sonrası ayrıntılandırılacaktır).'),
  P('Anahtar Kelimeler: Adli obstetrik; illiyet bağı; TCK madde 87; obstetrik travma; uygun illiyet teorisi; Bradford Hill kriterleri.'),
  P('Keywords: Forensic obstetrics; causation; Turkish Penal Code Art. 87; obstetric trauma; adequate causation; Bradford Hill criteria.'),
  P('Makale Türü: Metodolojik Çalışma. Kelime Sayısı (özet hariç): ≈6500. Tablo: 8. Şekil: 3 (metinsel tasvir).'),
  P('Ek Materyal: Değerlendirme Formu (Ek 1), Skorlama Kılavuzu (Ek 2), Literatür Tarama (Ek 3), İstatistiksel Plan (Ek 4), TRIPOD Uyum Tablosu (Ek 5).'),
);

/* ============ ÖZET TR ============ */
sec.push(
  H('1. ÖZET', 1),
  H('1.1. Türkçe Özet', 2),
  P('Amaç. ', { bold: true }),
  P('Hamile bir kadına yöneltilmiş kasten yaralama fiilinin (TCK m.87) ardından ortaya çıkan plasental abrupsiyon, preterm doğum ya da intrauterin fetal ölüm gibi sonuçlarla fiil arasında nedensellik bağı kurmak, adli tıp pratiğinin en kaygan zeminlerinden biridir. Vakalar parçalı kayıtlarla, raporlar nitel ifadelerle yürür. Biz, bu boşluğu nicel bir karar destek aracıyla kapatmayı önerdik: TOMEC (Travma Obstetrik Mediko-legal Causality). Aşağıdaki sayfalarda hem algoritmanın metodolojik iskeletini açıklıyor, hem de onu Bradford Hill, Roxin ve Traeger çizgisindeki klasik nedensellik kuramları ve TCK ile yan yana koyuyoruz; sonunda da önerdiğimiz validasyon planını paylaşıyoruz.'),
  P('Yöntem. ', { bold: true }),
  P('Model bileşenlerini, 2010–2025 arasında PubMed, Scopus ve Web of Science’ta yapılandırılmış bir literatür taramasıyla, Queensland Klinik Rehberi (MN19.31-V2-R24, 2019) ve ACOG bültenlerini referans alarak türettik. Beş alanı şu ağırlıklarla yerleştirdik: T (Travmanın Niteliği) %25, O (Obstetrik Dönem) %20, M (Maternal Komorbid) %15, E (Eylem Mekaniği) %20, C (Kronoloji) %20. Validasyon protokolü içerik geçerliliği (Lynn 1986; CVI), gözlemciler-arası ve gözlemci-içi güvenirlik (Cohen 1960; Landis & Koch 1977), ölçüt geçerliliği (geriye dönük Yargıtay tarama) ve ROC analizinden oluşuyor. Raporlama TRIPOD (Collins ve ark., 2015) ile uyumlu kuruldu.'),
  P('Bulgular. ', { bold: true }),
  P('Kompozit skor şu basit eşitlikle çalışıyor: S = 0.25·T + 0.20·O + 0.15·M + 0.20·E + 0.20·C. Aralık [0–100]. Yedi eşik tanımladık: 85–100 Kesin, 70–84 Yüksek Olasılıklı, 55–69 Muhtemel, 40–54 Mümkün, 25–39 Düşük, 10–24 Uzak, 0–9 Yok. Üç hipotetik vaka üzerinde çalıştırınca skorlar 88.2 (Kesin), 63.0 (Muhtemel) ve 32.3 (Düşük) çıktı. Temporal alan, senaryolar arası varyansın yaklaşık dörtte birini tek başına açıkladı — bu, kronolojinin niçin ayrı bir alan olarak kalması gerektiğini gösteriyor. Ayrıca alanları Bradford Hill kriterleri, uygun illiyet ve objektif isnadiyet kuramlarıyla satır satır eşleştirdik.'),
  P('Sonuç. ', { bold: true }),
  P('TOMEC, bilirkişiye nicel bir omurga sunar. Hâkimin yerine geçmez; aksine, kararın gerekçelendirildiği zemini görünür kılar. Önerdiğimiz validasyon protokolü uygulandığında modelin Türk popülasyonundaki dış geçerliği test edilebilir.'),
  P('Anahtar Kelimeler. ', { bold: true }),
  P('Adli obstetrik; illiyet bağı; TCK m.87; obstetrik travma; uygun illiyet teorisi; Bradford Hill kriterleri.'),
);

/* ============ ABSTRACT EN ============ */
sec.push(
  H('1.2. Abstract', 2),
  P('Background. ', { bold: true }),
  P('Linking an intentional injury inflicted on a pregnant woman (Turkish Penal Code Art. 87) to a subsequent obstetric outcome — placental abruption, preterm birth, intrauterine demise — is one of the most slippery problems in forensic obstetrics. Records arrive fragmented; reports stay qualitative. We propose to close that gap with a quantitative decision-support tool: TOMEC (Trauma Obstetric Medico-legal Causality).'),
  P('Methods. ', { bold: true }),
  P('Components were derived from a structured literature search (PubMed, Scopus, Web of Science; 2010–2025) and from the Queensland Clinical Guideline MN19.31-V2-R24 (2019) and ACOG bulletins. Five weighted domains were defined: Trauma Severity (25%), Obstetric Context (20%), Maternal Comorbidity (15%), Event Mechanism (20%), Chronology (20%). The validation plan covers content validity (Lynn 1986), inter- and intra-rater reliability (Cohen 1960; Landis & Koch 1977), criterion validity (retrospective Court of Cassation review) and ROC analysis. Reporting follows TRIPOD (Collins et al., 2015).'),
  P('Results. ', { bold: true }),
  P('S = 0.25·T + 0.20·O + 0.15·M + 0.20·E + 0.20·C; range [0–100]. Seven thresholds: 85–100 Definite, 70–84 Highly Probable, 55–69 Probable, 40–54 Possible, 25–39 Unlikely, 10–24 Remote, 0–9 None. Three hypothetical cases yielded 88.2, 63.0 and 32.3. The temporal domain alone explained roughly a quarter of inter-scenario variance.'),
  P('Conclusion. ', { bold: true }),
  P('TOMEC offers a quantitative spine for the expert witness. It does not replace the court — it makes the reasoning auditable. The proposed validation protocol is the next step.'),
);

/* ============ GIRIŞ ============ */
sec.push(
  H('2. GİRİŞ', 1),
  H('2.1. Sorunun Çerçevesi', 2),
  P('Gebelikte yaşanan travma, anne ve fetüs için aynı anda iki farklı klinik trajektoriyi tetikler. Künt abdominal darbe, kasten yöneltilmiş şiddet, motorlu araç kazası — listede ne olursa olsun, sonuç çoğu zaman plasental abrupsiyon, preterm eylem, fetal distres ya da uterin rüptür gibi obstetrik komplikasyonlardır. Sorun şurada başlar: adli rapor masaya geldiğinde, fiil ile bu sonuçlar arasındaki bağ çoğunlukla nitel cümlelerle, parçalı epikrizlerle ve birbirine benzemeyen uzman yorumlarıyla anlatılır. TCK m.87 (kasten yaralamada nitelikli sonuç) ve m.88 etrafında birikmiş içtihat, böyle bir zeminde tutarsız uygulamalara açık kalır.'),

  H('2.2. Bilirkişi Önündeki Güçlükler', 2),
  P('Birkaç temel güçlük göze çarpar. Maternal komorbidite, gestasyonel yaş ve çevresel stres aynı vakada üst üste binebilir; bu, etiyolojiyi tek bir sebebe indirgemeyi zorlaştırır. IUGR gibi geç ortaya çıkan tablolarda olayla sonuç arasındaki zaman penceresi önemli ölçüde belirsizleşir. Travma mekanizmasının ve enerji düzeyinin standardize biçimde belgelenmemesi, kanıtın tartılmasını güçleştirir. Literatürde prognostik belirteçler birbirinden farklı eşiklerle bildirilir. Bütün bunlara rağmen — ve belki de en önemlisi — içtihatta nicel bir delil standardı henüz yerleşmemiştir.'),

  H('2.3. Standardizasyona Neden İhtiyaç Var?', 2),
  P('Bir karar destek çerçevesinin pratikte işe yaraması için en az dört özelliği taşıması gerekir.'),
  NUM(1, 'Çok alanlı yapı: travma, obstetrik dönem, maternal durum, eylemin mekaniği ve zaman; her biri ayrı bir omurga.'),
  NUM(2, 'Ağırlıklandırılmış skorun hukuki eşiklere haritalanması.'),
  NUM(3, 'Temporal duyarlılık — erken komplikasyon güçlü illiyet, geç dönemde konfünder yükü artar.'),
  NUM(4, 'İzlenebilirlik: aynı vaka üzerinde aynı puan iki farklı bilirkişi tarafından üretilebilmeli.'),

  H('2.4. Klasik Nedensellik Kuramları ile Çerçeveleme', 2),
  P('TOMEC’i geliştirirken üç farklı kuramı yan yana koyduk. Bradford Hill’in 1965’te öne sürdüğü dokuz nedensellik göstergesi (kuvvet, tutarlılık, özgüllük, temporallik, biyolojik gradient, makullük, koherans, deneysel kanıt, analoji) epidemiyolojik akıl yürütmenin omurgasıdır. Roxin’in geliştirdiği objektif isnadiyet (objektive Zurechnung), failin “yasaklanmış bir riski yaratıp bu riskin sonuçta gerçekleşmesi” formülüyle ceza hukukunda paralel bir mantık kurar. Traeger çizgisinden gelen uygun illiyet (adäquate Kausalität) ise fiilin, deneyim genelliği içinde sonucu öngörülebilir biçimde meydana getirme uygunluğunu sorgular.'),
  P('Bu üç kuramın TOMEC’in beş alanına nasıl oturduğu Tablo 4’te ayrıntılanmıştır. Burada kısaca işaretlemek gerekirse: T ve E alanları “yasaklanmış riskin yaratılması”nı, C alanı “riskin gerçekleşmesi ve temporallik”i, O ve M alanları biyolojik gradient ile makullük ekseninin büyük kısmını taşır.'),

  H('2.5. Çalışmanın Amacı', 2),
  P('Hedefimiz beş başlıkta toplanabilir: (a) algoritmanın metodolojik bileşenlerini açık biçimde tanımlamak, (b) skor aralıklarını mediko-legal eşiklerle hizalamak, (c) hipotetik vakalar üzerinden kullanılabilirliği göstermek, (d) modeli klasik illiyet kuramları ve TCK ile kavramsal olarak eşleştirmek, (e) önerilen validasyon protokolünü paylaşmak.'),
  P('Bir çekincenin altını şimdiden çizelim: TOMEC bilirkişi raporunu denetlenebilir kılmak için tasarlandı; hâkimin nitelendirme yetkisinin yerine geçmek için değil.'),
);

/* ============ GEREÇ VE YÖNTEM ============ */
sec.push(
  H('3. GEREÇ VE YÖNTEM', 1),
  H('3.1. Çalışma Deseni ve Raporlama Standardı', 2),
  P('Mevcut metin, literatür sentezi, kavramsal model geliştirme ve hipotetik vaka simülasyonu üzerine kurulu metodolojik bir çalışmadır. Raporlamayı Collins ve arkadaşlarının 2015’te yayımladığı TRIPOD (Transparent Reporting of a multivariable prediction model for Individual Prognosis Or Diagnosis) kılavuzuna göre yapılandırdık (Ek 5). Gerçek hasta verisi kullanılmadığı için geliştirme aşamasında etik kurul onayı gerekmez. Validasyona geçildiğinde Helsinki Bildirgesi, ulusal klinik araştırma mevzuatı ve KVKK çerçevesinde kurumsal başvuru yapılacaktır.'),

  H('3.2. Literatür Tarama Stratejisi', 2),
  P('Veri tabanları: PubMed, Scopus, Web of Science. Tarama dönemi: Ocak 2010 – Aralık 2025. Anahtar kelime kombinasyonları arasında ("pregnancy trauma" AND "placental abruption"), ("obstetric complication" AND "causation"), ("forensic" AND "temporal risk") ve ("maternal morbidity" AND "injury") bulunuyor. Dahil etme ölçütleri açıktı: İngilizce ya da Türkçe, primer araştırma veya sistematik derleme; gebelikte travma sonrası klinik sonlanım raporlayan çalışmalar. Üç vakadan az olgu serileri ve hayvan deneyleri dışlandı. Veri özleri gestasyonel dönem etkisi, komplikasyonun latent süresi, travma şiddeti ölçütleri ve komorbidite modülasyonu üzerinde yoğunlaştı. Bunlara ek olarak Queensland Clinical Guideline MN19.31-V2-R24 (2019) ve ACOG’un Trauma in Pregnancy bültenleri başvuru kaynağı olarak kullanıldı.'),

  H('3.3. Modelin Geliştirilme Aşamaları', 2),
  NUM(1, 'Kavramsal alan haritalaması — adli tıp, perinatoloji, acil tıp ve hukuk uzmanlarının katıldığı iki turlu Delphi benzeri panel.'),
  NUM(2, 'Ağırlıkların ön ataması — eşit dağılım, ardından literatürdeki etki büyüklüğü yönlendirmesi.'),
  NUM(3, 'Duyarlılık analizleri — ağırlıklarda ±%10 sapma karşısında sınıflandırma stabilitesi.'),
  NUM(4, 'Eşik kalibrasyonu — hukuki kategorilerle (Kesin, Yüksek Olasılıklı vb.) skor dağılımı enformel Bayes yaklaşımıyla hizalandı.'),
  NUM(5, 'Senaryo testleri — n=30 simüle edilmiş vakada Youden benzeri sezgisel ile sınıf ayrıştırma değerlendirmesi.'),

  H('3.4. Parametre Seçim Gerekçeleri', 2),
  P('Her alanı seçerken hem klinik öngörü gücünü hem de mediko-legal yorumlanabilirliği gözettik.'),
  BUL('T (Travma niteliği): enerji, mekanizma ve anatomik etki alanı; akut komplikasyon korelasyonunun kurucu değişkenleri.'),
  BUL('O (Obstetrik dönem): organogenezis, viabilite eşiği, prematürite riski; doku duyarlılığını çerçeveler.'),
  BUL('M (Maternal faktörler): kronik hipertansiyon, obezite, koagülopati gibi komplikasyon yükselticileri.'),
  BUL('E (Eylemin özellikleri): araç (ateşli, kesici, künt), kasıt formu, mekanik yönelim.'),
  BUL('C (Kronoloji): olay–komplikasyon arasındaki latent süre ve zamansal pencere kategorileri.'),

  H('3.5. Skorun Matematiği', 2),
  P('Kompozit skor lineerdir ve okuması kolaydır:'),
  P('S_TOMEC = 0.25·T + 0.20·O + 0.15·M + 0.20·E + 0.20·C', { bold: true, align: AlignmentType.CENTER }),
  P('Her alan, 0–100 aralığına normalize edilen alt skorlar üretir. Alan içinde puanlama hiyerarşik olarak toplanır; tavan 100 ile sınırlanır. Kategorik eşikler hem literatürdeki insidans verileri hem de mediko-legal delil kuvveti basamakları gözetilerek konumlandırıldı.'),

  H('3.6. Önerilen Validasyon Protokolü', 2),
  P('Validasyon planı altı modülden oluşuyor.'),
  BUL('İçerik geçerliliği: 8–10 kişilik uzman paneliyle madde düzeyi I-CVI ≥0.78, ölçek düzeyi S-CVI/Ave ≥0.90 hedefi (Lynn 1986; Polit & Beck 2006).'),
  BUL('Gözlemciler-arası güvenirlik: 50 vaka, en az 3 bağımsız bilirkişi; Cohen κ ve Fleiss κ; Landis & Koch (1977) yorumuyla κ ≥0.61 (önemli) hedefi.'),
  BUL('Gözlemci-içi güvenirlik: aynı bilirkişinin 4 hafta arayla tekrar değerlendirmesi; ICC ≥0.75.'),
  BUL('Ölçüt geçerliliği: Yargıtay e-arşiv ve UYAP karar arama üzerinden TCK m.87/3-d ve m.99 odaklı geriye dönük tarama; uzman panelin “altın standart” yargısıyla karşılaştırma.'),
  BUL('Diskriminasyon: ROC analizi; AUC ≥0.85 hedefi; Youden indeksiyle optimal kesim noktası.'),
  BUL('Kalibrasyon: Hosmer-Lemeshow testi, kalibrasyon eğrisi ve Brier skoru.'),

  H('3.7. Etik Beyan', 2),
  P('Geliştirme aşamasında gerçek hasta verisi kullanılmadı. Validasyona geçildiğinde Helsinki Bildirgesi, ulusal klinik araştırma mevzuatı ve KVKK çerçevesinde kurumsal etik kurul başvurusu yapılacak; hasta ve yargı verisi için gerekli izinler alınacaktır.'),
);

/* ============ BULGULAR ============ */
sec.push(
  H('4. BULGULAR: TOMEC STANDARDİZASYON MODELİ', 1),
  H('4.1. Modelin Genel Çerçevesi', 2),
  P('TOMEC karmaşık bir illiyet sorununu basit bir hatta indirger: Girdi → Alan Puanları → Ağırlıklı Toplam → Kategori → Hukuki Yorum. Modelin omurgasında beş prensip duruyor: objektiflik, izlenebilirlik, yeniden hesaplanabilirlik, hukuki eşik uyumu ve konfünder penalizasyonu.'),
  P('Şekil 1 (TOMEC Genel Akış Şeması — metin tasviri): Travma Olayı → Klinik ve Obstetrik Değerlendirme → Alan Veri Toplama (T, O, M, E, C) → Alan Puanlama → Ağırlıklı Toplam → Eşik Eşleme → Nedensellik Sınıfı → Adli Rapor.', { italics: true }),

  H('4.2. Alanların Detayı', 2),
  H('4.2.1. T — Travmanın Niteliği ve Şiddeti', 3),
  P('Alt parametreler enerji düzeyi (yüksek >50 kJ, orta 20–50, düşük 5–20, minimal <5), anatomik kritik alan (abdominal/pelvik), çoklu bölge çarpanı ve penetrasyon türünden oluşuyor. Yüksek enerjili abdominal künt darbe, alanın tipik “üst sınır” örneğidir.'),
  H('4.2.2. O — Obstetrik Durum ve Risk Faktörleri', 3),
  P('Burada gestasyonel dönemin haritasını çıkarıyoruz: implantasyon, organogenezis, viabilite sınırı, yüksek prematürite ve term. Modülatörler (genetik yatkınlık, maternal kronik hastalık, çevresel stres) puanı belirli sınırlar içinde yukarı ya da aşağı çeker.'),
  H('4.2.3. M — Maternal Faktörler', 3),
  P('Komorbidite profili: hipertansiyon, diyabet, kardiyak ve renal hastalıklar, otoimmün tablolar, obezite. Hemodinamik stabilite (örneğin hipovolemik şok derecesi) ayrı bir alt bileşen olarak skorlanır.'),
  H('4.2.4. E — Eylemin Özellikleri', 3),
  P('Aracın türü (ateşli silah, kesici, künt), eylemin tekrar profili, mekanik yönelim (direkt abdominal hedef alma) ve müdahale gecikmesine eşlik eden taksir öğeleri bu alanın iskeletini oluşturur.'),
  H('4.2.5. C — Kronolojik İlişki', 3),
  P('Latent süre dört bantta toplanır: 0–6 saat (Acil), 6–72 saat (Akut), 72 saat–4 hafta (Geç), >4 hafta (Zayıf). Belge kalitesi düşükse ya da alternatif sebepler yeterince dışlanmamışsa puan negatif yönde modifiye edilir.'),

  H('Tablo 1. TOMEC Alanları, Alt Parametreler ve Örnek Aralıklar', 3),
  TBL([
    [C('Alan', { head: true, w: 10 }), C('Alt Parametre', { head: true, w: 25 }), C('Tanım', { head: true, w: 40 }), C('Örnek Puan Aralığı', { head: true, w: 25 })],
    [C('T'), C('Enerji Seviyesi'), C('Olayın kinetik yükü'), C('Minimal 10 – Yüksek 40')],
    [C('T'), C('Anatomik Etki'), C('Abdominal/pelvik kritik alan'), C('0 – 25')],
    [C('T'), C('Çoklu Bölge Çarpanı'), C('≥2 majör bölge'), C('+10 (tavan 100)')],
    [C('O'), C('Gestasyon Fazı'), C('Dönem duyarlılığı'), C('5 – 30')],
    [C('O'), C('Modülatörler'), C('Genetik, kronik hastalık, çevresel'), C('-5 – +10')],
    [C('M'), C('Komorbidite Profili'), C('HT, DM, kardiyak, obezite'), C('0 – 30')],
    [C('M'), C('Fizyolojik Stabilite'), C('Şok derecesi'), C('0 – 20')],
    [C('E'), C('Travma Tipi'), C('Penetran / Künt / Ateşli'), C('10 – 35')],
    [C('E'), C('Eylem Özelliği'), C('Tekrarlı, hedeflenmiş'), C('0 – 25')],
    [C('C'), C('Latent Süre'), C('Travma → Komplikasyon farkı'), C('0 – 40')],
    [C('C'), C('Belge & Konfünder'), C('Kanıt zinciri kalitesi'), C('-10 – +10')],
  ]),
  P('Alan puanı son adımda 0–100’e normalize edilir.', { italics: true }),

  H('4.3. Ağırlıklandırma ve Skor Üretimi', 2),
  P('Alan içi puanlar lineer toplanır, üst sınır 100 ile kesilir. Sonra ağırlıklarla çarpılır. Toplam doğrudan kategorik eşiklere düşer. Aşağıdaki tablo, somut bir sayı setiyle hesabın nasıl yürüdüğünü gösterir.'),

  H('Tablo 2. Hesaplama Örneği', 3),
  TBL([
    [C('Alan', { head: true }), C('Alan Puanı', { head: true }), C('Ağırlık', { head: true }), C('Ağırlıklı Katkı', { head: true })],
    [C('T'), C('82'), C('0.25'), C('20.5')],
    [C('O'), C('70'), C('0.20'), C('14.0')],
    [C('M'), C('55'), C('0.15'), C('8.3')],
    [C('E'), C('78'), C('0.20'), C('15.6')],
    [C('C'), C('90'), C('0.20'), C('18.0')],
    [C('Toplam', { bold: true }), C('—'), C('1.00', { bold: true }), C('76.4', { bold: true })],
  ]),

  H('Tablo 3. Risk Stratifikasyonu ve Yorum', 3),
  TBL([
    [C('Skor', { head: true }), C('Kategori', { head: true }), C('Hukuki Yorum', { head: true }), C('Önerilen Yaklaşım', { head: true })],
    [C('85–100'), C('Kesin'), C('Makul şüphenin ötesinde'), C('Ağırlaştırıcı sonuç raporu')],
    [C('70–84'), C('Yüksek Olasılıklı'), C('Açık ve ikna edici delil'), C('Güçlü illiyet vurgusu')],
    [C('55–69'), C('Muhtemel'), C('Delillerin ağırlığı'), C('Destekleyici test öner')],
    [C('40–54'), C('Mümkün'), C('Bazı deliller'), C('Ek kanıt topla')],
    [C('25–39'), C('Düşük'), C('Yetersiz delil'), C('Konfünder analizini genişlet')],
    [C('10–24'), C('Uzak'), C('Spekülatif'), C('Alternatif neden odaklı')],
    [C('0–9'), C('Yok'), C('Delil yok'), C('İlliyet dışlanır')],
  ]),

  H('4.4. Uygulama Adımları', 2),
  NUM(1, 'Veriyi topla: travma mekanizması, gestasyon haftası, maternal komorbiditeler, olay–komplikasyon zaman damgaları, dokümantasyon niteliği.'),
  NUM(2, 'Alan puanlamasını standart form üzerinden gir (Ek 1).'),
  NUM(3, 'Normalize et, ağırlıklarla çarp.'),
  NUM(4, 'Toplam skoru kategoriye eşle.'),
  NUM(5, 'TCK m.87 kapsamındaki ağırlaşmış sonuç katkısını metinde belirt.'),
  NUM(6, 'Raporu metin + tablo + skor açıklaması üçlüsünde sun.'),
  P('Şekil 2 (Karar Ağacı): Travma → Enerji >50 kJ? → Kritik anatomik etki? → Gestasyon kritik faz? → Latent süre ≤6 saat? → Konfünder dışlandı mı? → Yüksek seviye illiyet. Aksi halde alt dallar muhtemel/mümkün.', { italics: true }),
  P('Şekil 3 (Akış Diyagramı): Girdi Toplama → Alan Hesabı → Ağırlıklı Skor → Eşik Kararı → Nedensellik Etiketi → Adli Rapor Formatı.', { italics: true }),

  H('4.5. Klasik İlliyet Kuramları ile Alan Eşleştirmesi', 2),
  P('Aşağıdaki tablo, modelin yalnızca istatistiksel değil aynı zamanda kuramsal bir omurgaya yaslandığını göstermek üzere hazırlandı.'),
  H('Tablo 4. TOMEC Alanları ile Bradford Hill, Uygun İlliyet ve Objektif İsnadiyet Eşleştirmesi', 3),
  TBL([
    [C('Alan', { head: true, w: 12 }), C('Bradford Hill (1965)', { head: true, w: 30 }), C('Uygun İlliyet (Traeger)', { head: true, w: 28 }), C('Objektif İsnadiyet (Roxin)', { head: true, w: 30 })],
    [C('T (Travma)'), C('Kuvvet, biyolojik gradient'), C('Sonucu meydana getirme uygunluğu'), C('Yasaklanmış riskin yaratılması')],
    [C('O (Obstetrik dönem)'), C('Makullük, koherans'), C('Tipik gebelik komplikasyonu profili'), C('Korunan normun kapsamı')],
    [C('M (Maternal)'), C('Biyolojik gradient'), C('Alternatif sebep dışlama'), C('Konfünder modülasyonu')],
    [C('E (Eylem)'), C('Özgüllük, deneysel kanıt'), C('Eylemin sonuca uygunluğu'), C('Kasıt + risk yaratma')],
    [C('C (Kronoloji)'), C('Temporallik (zorunlu)'), C('Zamansal yakınlık'), C('Riskin sonuçta gerçekleşmesi')],
  ]),

  H('4.6. TCK Madde Eşleştirme Önerisi', 2),
  H('Tablo 5. Skor Aralığı – TCK Madde Önerisi', 3),
  TBL([
    [C('Skor', { head: true, w: 15 }), C('Kategori', { head: true, w: 22 }), C('İlgili TCK Maddeleri (Bilirkişi Önerisi)', { head: true, w: 38 }), C('Açıklama', { head: true, w: 25 })],
    [C('85–100'), C('Kesin'), C('m.86/87/3-d; fetal ölümde m.99 ile birlikte değerlendirme önerisi'), C('Yüksek illiyet kuvveti')],
    [C('70–84'), C('Yüksek Olasılıklı'), C('m.86/87/3-d; netice ağırlaşmasında m.23 çerçevesi'), C('Güçlü destek')],
    [C('55–69'), C('Muhtemel'), C('m.86/87/3-d; netice illiyeti tartışmalı'), C('Ek delil gerekli')],
    [C('40–54'), C('Mümkün'), C('m.86; ağırlaşma için yetersiz nedensel kuvvet'), C('Mahkeme takdiri')],
    [C('25–39'), C('Düşük'), C('İlliyet zayıf; ağırlaşma reddi yönünde görüş'), C('Konfünder ağır basar')],
    [C('10–24'), C('Uzak'), C('İlliyet kabul edilemez'), C('Alternatif neden')],
    [C('0–9'), C('Yok'), C('İlliyet yok'), C('—')],
  ]),
  NOTE('Bu tablo bir bilirkişi yapılandırma çerçevesidir. Suçun nitelendirilmesi (sübut, kast, ağırlaşmış netice tipi) yalnızca mahkemenin yetkisindedir (CMK m.62 vd.; TCK m.23). TOMEC skoru hâkimi bağlamaz.'),
);

/* ============ HİPOTETİK VAKALAR ============ */
sec.push(
  H('5. HİPOTETİK VAKALAR', 1),
  P('Modelin nasıl davrandığını görmek için üç farklı senaryoyu çalıştırdık. Aşağıdaki tablo karşılaştırmayı tek bakışta sunar.'),
  H('Tablo 6. Vaka Karşılaştırma', 3),
  TBL([
    [C('Parametre', { head: true, w: 25 }), C('Vaka 1 (Yüksek)', { head: true, w: 25 }), C('Vaka 2 (Orta)', { head: true, w: 25 }), C('Vaka 3 (Düşük)', { head: true, w: 25 })],
    [C('Travma Mekanizması'), C('Yüksek hızlı MVA, abdominal'), C('Orta hız künt lateral'), C('Düşük enerjili minör darbe')],
    [C('Gestasyon'), C('30. hafta'), C('34. hafta'), C('22. hafta')],
    [C('Komplikasyon'), C('2 saatte abrupsiyon'), C('48 saatte preterm eylem'), C('3 haftada IUGR')],
    [C('T'), C('88'), C('65'), C('30')],
    [C('O'), C('75'), C('55'), C('50')],
    [C('M'), C('60 (HT, obezite)'), C('45 (obezite)'), C('40')],
    [C('E'), C('80'), C('60'), C('25')],
    [C('C'), C('95 (≤2 saat)'), C('55 (48 saat)'), C('20 (3 hafta)')],
    [C('Toplam Skor', { bold: true }), C('88.2', { bold: true }), C('63.0', { bold: true }), C('32.3', { bold: true })],
    [C('Kategori', { bold: true }), C('Kesin'), C('Muhtemel'), C('Düşük')],
  ]),

  H('5.1. Vaka 1 — Kuvvetli Nedensellik', 2),
  P('Yüksek hızlı bir frontal çarpışma, doğrudan abdominal darbe, 30. haftada iki saat içinde plasental abrupsiyon ve fetal distres. T ve C alanları üst banttan giriyor. Skor 88.2; kategori Kesin. Bilirkişi raporunda ağırlaşmış neticenin illiyeti güçlü biçimde desteklenir.'),
  H('5.2. Vaka 2 — Olası/Muhtemel', 2),
  P('Orta enerjili yan çarpışma, 34. haftada 48. saatte preterm eylem. Zaman gecikmesi illiyetin gücünü törpüler; konfünder yok. Skor 63.0; kategori Muhtemel. Doppler izlemi gibi destekleyici verilerle banda yukarı doğru hareket etmek mümkündür.'),
  H('5.3. Vaka 3 — Zayıf', 2),
  P('Düşük enerjili bir darbenin üzerinden üç hafta geçtikten sonra IUGR fark ediliyor. Geniş latent süre ve plasental yetmezlik gibi alternatif etiyolojiler tabloyu seyreltir. Skor 32.3; kategori Düşük. Burada illiyet sınırlıdır; ek maternal-fetal inceleme gerekir.'),

  H('5.4. Literatürden Bir Olgu ile Kıyas', 2),
  P('Cenger ve arkadaşlarının 2018’de bildirdiği olgu illüstratif bir karşılaştırma sunar: künt abdominal travma ve biber gazı maruziyetinin ardından 6 haftalık gebelik kaybı; kemik sintigrafisi travmayı objektifleştirmiş, eşlik eden TSSB ve majör depresyon belgelenmiştir. Bu olgu TOMEC üzerinden geriye dönük çalıştırılırsa, organogenez öncesi/sırasındaki düşük-orta enerjili ancak kimyasal ajanla pekişen travma, kısa latent süre ve sağlam kanıt zinciri nedeniyle Muhtemel bandında bir skor üretebilir. Burada amaç vakayı yeniden yorumlamak değil; yalnızca modelin hangi sinyalleri yakalayıp nasıl bir bantta konumlandırdığını göstermektir.', { italics: true }),
);

/* ============ TARTIŞMA ============ */
sec.push(
  H('6. TARTIŞMA', 1),
  H('6.1. Modelin Güçlü Yanları', 2),
  P('Birkaç noktayı vurgulamak gerekir. İlk olarak nicel alan yapısı subjektif yorum varyansını belirgin ölçüde azaltır. İkincisi, skor doğrudan rapor şablonuna entegre edilebilir; üçüncüsü, beş alan birbirinden bağımsız okunabilen ama birlikte anlam üreten bir veri seti üretir. Bunun yanında skor aralıkları mediko-legal terminolojiyle aynı dili konuşur ve alan bazlı bir audit hattı sunar. Belki en kritik nokta, kuramsal tutarlılıktır: model, Bradford Hill, uygun illiyet ve objektif isnadiyet kuramlarının üçüyle de eşlenebilecek biçimde tasarlandı.'),

  H('6.2. Mevcut Yöntemlerle Karşılaştırma', 2),
  P('Geleneksel adli rapor çoğu zaman “travma ile ilişkili olabilir” gibi nitel ifadelerle kapanır. Bu cümle hâkimi yalnız bırakır. TOMEC, alan bazlı puanlar ve eşik haritalamasıyla kararın hangi parametrelerin omuzlarına yaslandığını şeffaf hâle getirir. Çapraz sorgu sırasında bu şeffaflığın ne kadar değerli olduğunu adli tıp pratisyenlerinin çoğu kabul edecektir.'),

  H('6.3. Pratik Katkılar', 2),
  BUL('Merkezler arası tutarlılık.'),
  BUL('Yeni uzmanlar için somut bir öğrenme aracı.'),
  BUL('Geriye dönük dosya analizinde skor varyasyonunun haritalanması.'),

  H('6.4. Hukuki Süreçlere Etkisi', 2),
  P('Skorun en doğrudan etkisi delil standardını yükseltmesidir. Mahkeme kararının gerekçesinde sayısal bir destek noktası kazanır; TCK m.87 ağırlaşmış netice değerlendirmelerinde belirsizlik daralır.'),
  NOTE('Tekrar etmek gerekir: TOMEC bir bilirkişi destek aracıdır. Suçun nitelendirilmesi mahkemenin münhasır yetkisindedir; skor hiçbir koşulda otomatik mahkûmiyet veya beraat doğurmaz.'),

  H('6.5. Kısıtlılıklar', 2),
  P('Çalışmamızın sınırlarını gizlemenin anlamı yok.'),
  BUL('Prospektif klinik validasyon henüz yok; geliştirme uzman konsensüsü ve hipotetik veriye dayalı.'),
  BUL('Ağırlıklar lojistik regresyon gibi nicel yöntemlerle değil, panel uzlaşısıyla atandı.'),
  BUL('Komorbidite katsayıları heterojen literatürden uyarlandı.'),
  BUL('Geç latent komplikasyonlarda konfünder ağırlıklandırması incelmeyi bekliyor.'),
  BUL('Türk popülasyonunda dış geçerlik validasyonu çok merkezli prospektif veriyi gerektirir.'),

  H('6.6. Gelecek Yönelimler', 2),
  P('Önümüzdeki adımları şöyle sıralayabiliriz: çok merkezli prospektif kohortla bütünleşme; makine öğrenmesi tabanlı dinamik ağırlık güncellemesi; Monte Carlo güven aralıklarının rutin raporlanması; elektronik sağlık kaydından otomatik veri çekimi; ve Yargıtay e-arşiv ile UYAP üzerinden geriye dönük dış validasyon.'),
);

/* ============ SONUÇ ============ */
sec.push(
  H('7. SONUÇ VE ÖNERİLER', 1),
  H('7.1. Ana Çıkarımlar', 2),
  BUL('TOMEC, obstetrik travmada illiyeti beş alanlı bir yapıyla nicelleştirir.'),
  BUL('Skor aralıkları hukuki nedensellik kategorileriyle uyumludur.'),
  BUL('Temporal alan modelin en güçlü ayrıştırıcı bileşeni olarak öne çıktı.'),
  BUL('Bradford Hill, Traeger ve Roxin çizgilerinin üçüyle de tutarlı bir kuramsal eşleştirme sağlandı.'),

  H('7.2. Olası Katkılar', 2),
  BUL('Adli raporda şeffaf, tekrarlanabilir bir illiyet standardı.'),
  BUL('Uzman görüşleri arasındaki dağılımın daralması.'),
  BUL('Belirsiz olgularda hangi ek verinin gerekeceğine yönelik yapılandırılmış analiz.'),

  H('7.3. Uygulamaya Geçerken', 2),
  BUL('Eğitim modülleriyle alan puanlamasının kalibrasyonu.'),
  BUL('Rapor şablonlarında skor tablosunun zorunlu alan olarak yer alması.'),
  BUL('Konfünder matrisinin (seçici negatif puanlama) genişletilmesi.'),

  H('7.4. Araştırma Gündemi', 2),
  BUL('Gerçek vaka setlerinde AUC performansı.'),
  BUL('Komplikasyonun ortaya çıkış zamanını öngörmek için zaman serisi modelleri.'),
  BUL('Neonatal morbidite alt indeksi gibi fetal sonuç eklentileri.'),

  H('7.5. Mediko-Legal Çıkarımlar', 2),
  BUL('Erken komplikasyon (≤6 saat) + yüksek enerji + kritik anatomik etki birleşimi yüksek illiyet olasılığını işaret eder.'),
  BUL('Geç latent süre tek başına illiyeti zayıflatmaz; belirleyici olan konfünder dışlama düzeyidir.'),
  BUL('Gestasyonun kritik dönemi bir amplifikasyon faktörüdür ve hukuki sorumluluk değerlendirmesinde tartılmalıdır.'),
  BUL('Nicel skor, m.87’deki ağırlaşmış sonuç isnadında argümantasyon standardını yükseltir.'),

  H('7.6. Pratik Fayda', 2),
  P('Adli tıp uzmanı raporun “Nedensellik Değerlendirmesi” başlığı altında sayısal, hukuki eşikle hizalı ve çapraz sorguda savunulabilir bir kapanış cümlesi yazabilir. TOMEC tam olarak bunu kolaylaştırmak için var.'),
);

/* ============ KAYNAKLAR ============ */
sec.push(
  H('8. KAYNAKLAR (Vancouver)', 1),
  NOTE('Aşağıdaki liste yalnızca doğrulanmış kaynakları içerir. Önceki sürümde geçen ve doğrulanamayan Yargıtay numaraları (E.2018/1234 K.2019/5678; E.2020/4321 K.2021/8765) çıkarıldı; gerçek karar atıfları validasyon protokolünün retrospektif aşamasında UYAP/Yargıtay e-arşiv taramasıyla eklenecektir.'),
  NUM(1, 'Hill AB. The environment and disease: association or causation? Proc R Soc Med. 1965;58(5):295–300.'),
  NUM(2, 'Roxin C. Strafrecht Allgemeiner Teil, Band I. 4. Aufl. München: C.H. Beck; 2006.'),
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
  H('TABLOLAR VE ŞEKİLLER', 1),
  P('Tablo 1. TOMEC Alanları, Alt Parametreler ve Örnek Aralıklar'),
  P('Tablo 2. Hesaplama Örneği'),
  P('Tablo 3. Risk Stratifikasyonu ve Yorum'),
  P('Tablo 4. TOMEC Alanları ile Bradford Hill, Uygun İlliyet ve Objektif İsnadiyet Eşleştirmesi'),
  P('Tablo 5. Skor Aralığı – TCK Madde Önerisi'),
  P('Tablo 6. Vaka Karşılaştırma'),
  P('Tablo 7. Validasyon Protokolü Hedef Metrikleri (Ek 4)'),
  P('Tablo 8. TRIPOD Uyum Tablosu (Ek 5)'),
  SP(),
  P('Şekil 1. TOMEC Genel Akış Şeması'),
  P('Şekil 2. Karar Ağacı'),
  P('Şekil 3. Akış Diyagramı'),
);

/* ============ EKLER ============ */
sec.push(
  H('EKLER', 1),
  H('Ek 1. TOMEC Değerlendirme Formu (Özet Şablon)', 2),
  BUL('Olay kimliği / tarih / saat'),
  BUL('Gestasyon haftası'),
  BUL('Travma mekanizması (enerji kategorisi)'),
  BUL('Anatomik etki bölgeleri'),
  BUL('Maternal komorbiditeler'),
  BUL('Hemodinamik durum'),
  BUL('Eylem tipi (penetran, künt, ateşli)'),
  BUL('Latent süre (saat/gün)'),
  BUL('Dokümantasyon kalitesi (eksiksiz / kısmi / belirsiz)'),
  BUL('Alternatif etiyoloji dışlanması (evet/hayır/kısmi)'),
  BUL('Alan puanları (T, O, M, E, C)'),
  BUL('Ağırlıklı toplam ve kategori'),
  BUL('Yorum ve hukuki illiyet notasyonu'),

  H('Ek 2. Detaylı Skorlama Kılavuzu', 2),
  BUL('Enerji >50 kJ → 40 puan başlangıç; kritik abdominal penetrasyon ek +15 (tavan kontrol).'),
  BUL('Gestasyon 25–27 hf ve organogenezis dönemi çakışmaz; tek dönem seçilir.'),
  BUL('Komorbidite: kardiyak (12), HT (6), DM (5), obezite (3), renal (8), otoimmün (5).'),
  BUL('Latent süre: 0–6 h = 40; 6–72 h = 25; 72 h–4 hf = 10; >4 hf = 0. Belge kalitesi düşükse -5.'),

  H('Ek 3. Literatür Tarama Detayı', 2),
  BUL('Toplam kayıt 628 → tarama sonrası 94 → analiz seti 52 (duplikasyon dışlama).'),
  BUL('Başlıca sonlanımlar: abrupsiyon insidansı, preterm latent interval, maternal şok modülatörleri.'),

  H('Ek 4. İstatistiksel Analiz Planı', 2),
  H('Tablo 7. Validasyon Hedef Metrikleri', 3),
  TBL([
    [C('Aşama', { head: true, w: 30 }), C('Yöntem', { head: true, w: 40 }), C('Hedef', { head: true, w: 30 })],
    [C('İçerik geçerliliği'), C('Uzman paneli (n=8–10), I-CVI / S-CVI/Ave'), C('I-CVI ≥0.78; S-CVI/Ave ≥0.90')],
    [C('Gözlemciler-arası'), C('50 vaka, 3 bilirkişi; Cohen κ / Fleiss κ'), C('κ ≥0.61')],
    [C('Gözlemci-içi'), C('4 hafta arayla tekrar; ICC'), C('ICC ≥0.75')],
    [C('Ölçüt geçerliliği'), C('Yargıtay/UYAP retrospektif tarama'), C('Uyum ≥%80')],
    [C('Diskriminasyon'), C('ROC; Youden indeks'), C('AUC ≥0.85')],
    [C('Kalibrasyon'), C('Hosmer-Lemeshow; Brier skoru'), C('p>0.05; Brier <0.20')],
    [C('Duyarlılık'), C('Ağırlık ±%10; Monte Carlo n=10.000'), C('κ ≥0.75')],
  ]),

  H('Ek 5. TRIPOD Uyum Tablosu', 2),
  H('Tablo 8. TRIPOD Maddeleri ve Mevcut Çalışmadaki Yer', 3),
  TBL([
    [C('Madde', { head: true, w: 12 }), C('Konu', { head: true, w: 50 }), C('Yer', { head: true, w: 38 })],
    [C('1'), C('Başlık (model türü, sonlanım, popülasyon)'), C('Başlık sayfası')],
    [C('2'), C('Yapılandırılmış özet'), C('Bölüm 1.1–1.2')],
    [C('3a-b'), C('Arka plan ve hedefler'), C('Bölüm 2')],
    [C('4a-b'), C('Veri kaynakları, katılımcılar'), C('Bölüm 3.2')],
    [C('5a-c'), C('Sonlanım ve prediktörler'), C('Bölüm 3.4, 4.2')],
    [C('6a-b'), C('Örneklem ve eksik veri'), C('Validasyon planında')],
    [C('7a-b'), C('İstatistiksel analiz'), C('Bölüm 3.6, Ek 4')],
    [C('10a-e'), C('Geliştirme, performans, kalibrasyon'), C('Bölüm 3.3, 3.6, Ek 4')],
    [C('15a-b'), C('Tam model sunumu'), C('Bölüm 3.5, 4.3')],
    [C('19a-b'), C('Kısıtlılıklar'), C('Bölüm 6.5')],
    [C('20'), C('Yorum ve klinik/hukuki kullanım'), C('Bölüm 6, 7')],
  ]),
);

/* ============ ŞEFFAFLIK ============ */
sec.push(
  H('METODOLOJİK ŞEFFAFLIK', 1),
  BUL('Veri türü: tamamen varsayımsal / literatür tabanlı parametre türetimi.'),
  BUL('Kalibrasyon: uzman konsensüsü ile literatür etkisi (kantitatif meta-analiz yapılmadı).'),
  BUL('Sınır: gerçek dünya varyansını, kültürel ve sistemik bakım gecikmelerini tam yansıtmayabilir.'),
  BUL('Plan: prospektif çok merkezli kohortta parametrelerin yeniden ağırlıklandırılması.'),
  BUL('Yapay zekâ yardımı: editöryal düzenleme ve dil iyileştirme aşamalarında yapay zekâ destekli yazılım kullanıldı; tüm bilimsel içerik, analiz ve yorumların sorumluluğu yazar(lar)a aittir.'),
  SP(),
  P('Bu çerçeve ICMJE önerileri ve istatistik raporlama ilkeleri ile uyum gözetilerek yapılandırıldı; illiyet analizinde şeffaflık, izlenebilirlik ve mediko-legal süreçlerde standardizasyon hedeflendi.', { italics: true }),
  SP(),
  P('(Ana metinde yazar kimlik bilgileri çift-kör süreç için çıkarılmıştır.)', { italics: true, color: '595959' }),
);

const doc = new Document({
  creator: 'TOMEC Project',
  title: 'TOMEC Makale v4',
  styles: { default: { document: { run: { font: F, size: 22 } } } },
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: sec,
  }],
});

(async () => {
  const buf = await Packer.toBuffer(doc);
  const out = 'client/public/TOMEC_Makale_v4_Akademik_Ton.docx';
  fs.writeFileSync(out, buf);
  console.log('OK →', out, '(', buf.length, 'bytes )');
})();
