const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, Footer, Header,
  PageNumber, LevelFormat, convertInchesToTwip, ShadingType,
} = require('docx');

const FONT = 'Calibri';
const TITLE_FONT = 'Calibri';

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 320 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: FONT, size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color })],
  });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    pageBreakBefore: true,
    children: [new TextRun({ text, font: TITLE_FONT, size: 32, bold: true, color: '1F3864' })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, font: TITLE_FONT, size: 26, bold: true, color: '2E74B5' })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: TITLE_FONT, size: 23, bold: true, color: '2E74B5' })],
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { after: 80, line: 300 },
    bullet: { level },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: FONT, size: 22 })],
  });
}
function note(text) {
  return new Paragraph({
    spacing: { before: 100, after: 160, line: 280 },
    alignment: AlignmentType.JUSTIFIED,
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFF2CC' },
    children: [new TextRun({ text: 'EDİTÖRYAL NOT — ', font: FONT, size: 20, bold: true, color: '7F6000' }),
               new TextRun({ text, font: FONT, size: 20, color: '7F6000' })],
  });
}
function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.w || 25, type: WidthType.PERCENTAGE },
    shading: opts.head ? { type: ShadingType.CLEAR, color: 'auto', fill: '1F3864' } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text, font: FONT, size: opts.size || 20, bold: opts.head || opts.bold,
                               color: opts.head ? 'FFFFFF' : (opts.color || '000000') })],
    })],
  });
}
function table(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(r => new TableRow({ children: r })),
  });
}
const spacer = () => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '' })] });

const sections = [];

// ============ KAPAK ============
sections.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1200, after: 240 },
    children: [new TextRun({ text: 'TOMEC ALGORİTMASI', font: TITLE_FONT, size: 56, bold: true, color: '1F3864' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 180 },
    children: [new TextRun({ text: 'Genişletme, Eksik Tamamlama ve Validasyon Önerileri', font: TITLE_FONT, size: 36, color: '2E74B5' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: 'v1.0', font: FONT, size: 24, italics: true, color: '595959' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Travma Obstetrik Mediko-legal Causality (TOMEC) Skoru', font: FONT, size: 24, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: 'Gebe Kadına Yönelik Kasten Yaralama Suçlarında (TCK m.87/2-e)\nObstetrik Sonuçlarla Fiil Arasındaki İlliyet Bağının Standardizasyonu', font: FONT, size: 22 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFF2CC' },
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text: 'METODOLOJİK EK BELGE', font: FONT, size: 22, bold: true, color: '7F6000' })],
  }),
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 100 },
    children: [new TextRun({
      text: 'Bu belge, mevcut TOMEC metodolojik makalesini değiştirmez; tamamlayıcı niteliktedir. Burada önerilen tüm validasyon çalışmaları HENÜZ YAPILMAMIŞTIR; protokol önerisi olarak sunulmuştur. Sahte sayı, sahte κ değeri, sahte Yargıtay karar numarası veya sahte istatistik içermez. Tüm referanslar gerçek, yayınlanmış ve doğrulanabilirdir. TCK madde metinlerinin tam ve güncel hali için yazarın Resmi Gazete metni üzerinden son kontrolü yapması önerilir.',
      font: FONT, size: 20, italics: true,
    })],
  }),
);

// ============ İÇİNDEKİLER YERINE ÖZET ============
sections.push(
  h1('YÖNETİCİ ÖZETİ'),
  p('Bu belge, TOMEC algoritmasında tespit edilen yedi alandaki güçlendirme önerilerini ve hedef dergi seçim matrisini içerir:'),
  bullet('Bölüm 1 — Nedensellik teorileri ile hizalanma (Bradford Hill, uygun illiyet, objektif isnadiyet)'),
  bullet('Bölüm 2 — Türk Ceza Hukuku çerçevesi ile hizalanma (TCK m.86, 87, 88, 23, 99) ve skor → madde haritalama'),
  bullet('Bölüm 3 — Eksik klinik/biyolojik parametreler (Queensland MN19.31 kılavuzu temelli)'),
  bullet('Bölüm 4 — Önerilen validasyon protokolü (içerik, inter/intra-rater güvenirlik, kriter geçerliliği, ROC)'),
  bullet('Bölüm 5 — TRIPOD raporlama kılavuzu uyumu'),
  bullet('Bölüm 6 — Genişletilmiş sınırlılıklar'),
  bullet('Bölüm 7 — Hedef dergi karar matrisi (Türkiye + uluslararası)'),
  note('Bu belgedeki hiçbir tablo veya rakam, henüz yapılmamış bir çalışmanın "sonucu" olarak okunmamalıdır. Önerilen istatistik yöntemler ve eşikler, ilgili kaynaklarda bildirilen genel kabul görmüş referans değerlerdir; TOMEC için pilot saha verisi henüz toplanmamıştır.'),
);

// ============ BÖLÜM 1 ============
sections.push(
  h1('BÖLÜM 1 — NEDENSELLİK TEORİLERİ İLE HİZALANMA'),
  p('Mevcut TOMEC makalesinde "doğal illiyet (conditio sine qua non)" ve "öngörülebilirlik" kavramları kullanılmıştır. Adli obstetrik illiyet değerlendirmesinin uluslararası kabul görmüş kuramsal çerçeveye oturtulması için aşağıdaki üç klasik doktrinin makaleye eklenmesi önerilir.'),

  h2('1.1 Conditio Sine Qua Non (Şart Teorisi)'),
  p('"Olmasaydı sonuç da meydana gelmezdi" formülüne dayanan, Alman ceza hukuku öğretisinin temel teorisidir. Eleştirisi: çok sayıda uzak nedeni eşit ölçüde sorumlu kılar; tek başına adli obstetrik illiyet için yetersizdir. TOMEC, bu teoriyi başlangıç filtresi olarak kabul eder, ardından uygun illiyet ve objektif isnadiyet ile sınırlandırır.'),

  h2('1.2 Uygun İlliyet Teorisi (Adäquanztheorie)'),
  p('Johannes von Kries (1888) ve Ludwig Traeger (1904) tarafından geliştirilmiştir. Bu teoriye göre, hayat tecrübesine göre belirli sonuçları doğurmaya elverişli olmayan davranışlar nedensel kabul edilmez. Türk Yargıtayı, vücut bütünlüğüne karşı suçlarda ağır netice değerlendirmesinde bu teoriye uygun bir yaklaşım benimsemektedir (genel doktrin atfı; spesifik içtihat numaraları yazar tarafından UYAP üzerinden taranmalı ve eklenmelidir).'),
  p('TOMEC ile hizalanma: 70 ve üzeri TOMEC skoru ("Yüksek olasılıklı" ve üzeri kategoriler), uygun illiyet teorisinin "hayat tecrübesine göre yeterli olasılık" eşiğine karşılık gelmek üzere kalibre edilebilir. Bu eşik, makalenin "Tartışma" bölümünde açıkça gerekçelendirilmelidir.'),

  h2('1.3 Objektif İsnadiyet Teorisi (Objektive Zurechnung)'),
  p('Claus Roxin (1970) tarafından sistemleştirilen modern Alman ceza hukuku doktrinidir. İki aşamalı test öngörür: (i) failin izin verilmeyen bir risk yarattığı, ve (ii) bu riskin somut sonuçta gerçekleştiği saptanmalıdır. Adli obstetrik açısından kritik üç alt-kuralı vardır:'),
  bullet('Risk azaltma kuralı: failin davranışı mağdurun durumunu kötüleştirmek yerine iyileştiriyorsa isnat edilmez.'),
  bullet('Atipik nedensel akış: araya giren tıbbi malpraktis veya başka olağanüstü etken nedensel zinciri kesebilir.'),
  bullet('Mağdurun kendi sorumluluk alanı: gebeliği yüksek riskli yapan önceden var olan patolojiler bu kapsamda değerlendirilir.'),
  p('TOMEC ile hizalanma: M (Maternal Komorbid) domain ve C (Kronolojik) domain içindeki "alternatif neden dışlama" alt parametresi, doğrudan objektif isnadiyet teorisinin operasyonelleştirilmesidir. Bu bağ makalede açıkça kurulmalıdır.'),

  h2('1.4 Bradford Hill Kriterleri (1965) ↔ TOMEC Domain Eşleştirme'),
  p('Sir Austin Bradford Hill\'in 1965 tarihli ünlü çalışması (Hill AB. Proc R Soc Med. 1965;58:295-300), epidemiyolojik nedensellik için dokuz "yön" tanımlamıştır. Bu kriterler bugün adli epidemiyoloji ve nedensellik analizinin uluslararası altın standartıdır. TOMEC alanlarının her biri Hill kriterlerinden bir veya birkaçına eşlenmiştir; bu eşleme, makalenin metodoloji bölümüne aşağıdaki tablo formatında eklenmelidir.'),
  spacer(),
  table([
    [cell('Bradford Hill Kriteri', { head: true, w: 25 }), cell('Türkçe Açıklama', { head: true, w: 35 }), cell('Karşılık Gelen TOMEC Domain', { head: true, w: 40 })],
    [cell('Strength of association'), cell('Etki büyüklüğü; birliktelik ne kadar güçlü?'), cell('T (travma şiddeti) + E (mekanizma enerjisi)')],
    [cell('Consistency'), cell('Farklı çalışma/koşullarda tekrar gözlenmesi'), cell('Literatür temelli ağırlıklandırma; doğrudan domain karşılığı yok (gerekçe metnine girer)')],
    [cell('Specificity'), cell('Belirli neden → belirli sonuç ilişkisi'), cell('O (obstetrik dönem-spesifik vulnerabilite)')],
    [cell('Temporality'), cell('Nedenin sonuçtan önce gelmesi (zorunlu kriter)'), cell('C (kronolojik/temporal ilişki)')],
    [cell('Biological gradient'), cell('Doz-cevap ilişkisi'), cell('T enerji alt parametresi (kJ aralıkları)')],
    [cell('Plausibility'), cell('Bilinen biyolojik mekanizma ile uyum'), cell('O + M (gebelik fizyolojisi ve maternal komorbidite)')],
    [cell('Coherence'), cell('Mevcut bilgi ile çelişmeme'), cell('Literatür temelli kalibrasyon (gerekçe)')],
    [cell('Experiment'), cell('Müdahale ile tersine çevrilebilirlik'), cell('Adli obstetrikte etik dışı; uygulanmaz')],
    [cell('Analogy'), cell('Benzer ilişkilerden çıkarsama'), cell('Vinyet/içtihat haritalama (önerilen kriter geçerlilik çalışması)')],
  ]),
  note('Hill\'in kendisi bu maddelerin "rigid kriterler" değil "düşünme yönleri" olduğunu vurgulamıştır. TOMEC makalesinde de tablonun rijit bir kontrol listesi değil "kavramsal hizalama haritası" olarak sunulması önerilir.'),

  h2('1.5 Hipotetik / Kümülatif / Alternatif İlliyet Senaryoları'),
  p('Mevcut TOMEC makalesinde aşağıdaki üç klasik nedensellik komplikasyonuna karşı algoritmanın nasıl davrandığı açıklanmamıştır. Eklenmesi önerilir:'),
  bullet('Hipotetik illiyet (atlama nedenselliği): Plasenta previa totalis gibi zaten yüksek dekompansasyon riski bulunan bir gebelikte minör künt travma sonrası abrupsiyon meydana gelmişse, M domain modülatörü ile failin pay oranı sayısal olarak azaltılabilir. Önerilen mekanizma: M domain "yüksek baz risk" alt parametresi (-5 ile -15 puan arası).'),
  bullet('Kümülatif illiyet: Birden fazla failin eylemi birikerek sonuca neden olduysa (örn. ardışık darbeler), her bir failin TOMEC E domain alt skorunun ayrı hesaplanması ve toplam skora orantılı katkının tablo halinde sunulması önerilir.'),
  bullet('Alternatif (overdetermined) illiyet: Eş zamanlı iki bağımsız neden tek başına da sonucu doğuracak güçtedir. Bu durumda algoritmanın "C domain konfünder dışlama" puanı kritik olur; her iki neden için ayrı TOMEC skoru üretilip karşılaştırma tablosu sunulmalıdır.'),
  bullet('Tıbbi malpraktis araya girmesi: Travma sonrası 12 saatten geç yapılan müdahale objektif isnadiyet teorisi açısından nedensel zinciri kesebilir; bu durum C domain alt parametresi olarak "müdahale gecikmesi" şeklinde modellenmelidir.'),
);

// ============ BÖLÜM 2: TCK ============
sections.push(
  h1('BÖLÜM 2 — TÜRK CEZA HUKUKU İLE HİZALANMA'),
  note('Aşağıda TCK (Kanun No: 5237; Resmi Gazete tarih/sayı: 12.10.2004 / 25611) maddelerinin SUBSTANSİYEL içeriği özetlenmiştir. Resmi yayında geçerli güncel madde metninin TAM hali için yazarın Resmi Gazete veya Mevzuat Bilgi Sistemi (mevzuat.gov.tr) üzerinden son kontrolü yapması ve makaleye birebir aktarması önerilir. Bu belgede madde metninin parafrazı bulunmaktadır; resmi alıntı amacıyla kullanılmamalıdır.'),

  h2('2.1 İlgili TCK Maddeleri (Özetlenmiş İçerik)'),
  h3('TCK m.86 — Kasten Yaralama (Temel Suç)'),
  p('Bir kimseye kasten vücut acısı veren veya sağlığının ya da algılama yeteneğinin bozulmasına neden olan kişi cezalandırılır. Yaralama basit bir tıbbi müdahale ile giderilebilecek nitelikteyse ceza indirilir. Belirli sıfattaki mağdurlara karşı işlenmesi (eş, alt-üst soy, kamu görevlisi vb.) ağırlaştırıcı sebeptir.'),

  h3('TCK m.87 — Neticesi Sebebiyle Ağırlaşmış Yaralama'),
  p('Kasten yaralama fiilinin belirli ağır neticelere yol açması durumunda temel cezanın belirli oranlarda artırılmasını öngörür. TOMEC açısından kritik bentler:'),
  bullet('m.87/1-(e): Gebe bir kadına karşı işlenip de çocuğun vaktinden önce doğmasına neden olunması → ceza bir kat artırılır (substansiyel içerik; tam metin doğrulanmalı).'),
  bullet('m.87/2-(e): Gebe bir kadına karşı işlenip de çocuğun düşmesine neden olunması → ceza iki kat artırılır (substansiyel içerik; tam metin doğrulanmalı).'),
  bullet('m.87/1-(d): Yaşamı tehlikeye sokan bir duruma neden olunması.'),
  bullet('m.87/2-(d): Duyularından veya organlarından birinin işlevinin yitirilmesi (bu, masif FMH sonrası fetal kayıp için doğrudan, maternal komplikasyon için de uygulanabilir bent).'),
  bullet('"Ruh sağlığında bozulma" kavramı: TCK m.87 sistematiği içinde ağır netice olarak kabul edilir; Cenger ve ark. (2018) olgu sunumu bu noktada Türk doktrini için referans bir vakadır.'),

  h3('TCK m.88 — Kasten Yaralamanın İhmali Davranışla İşlenmesi'),
  p('Garantör sıfatı bulunan kişinin (örn. fail-mağdur arasında özel ilişki) ihmali davranışı ile yaralamaya neden olması halidir. TOMEC açısından önemi: aile içi şiddet bağlamında, gebeliğe yönelik sürekli psikolojik baskı + tıbbi yardımdan men gibi senaryolarda E domain "eylem süreklilik" parametresi bu maddeye köprü oluşturur.'),

  h3('TCK m.23 — Neticesi Sebebiyle Ağırlaşmış Suçta Kusur'),
  p('Bir fiilin, kastedilenden daha ağır veya başka bir neticenin oluşumuna neden olması halinde, kişinin bu netice bakımından en azından taksirle hareket etmiş olması aranır. TOMEC açısından önemi: "öngörülebilirlik" kavramı bu madde ile somutlaşır; C (kronolojik) ve E (eylem) domainleri bu kusur değerlendirmesini destekler.'),

  h3('TCK m.99 — Çocuk Düşürtme'),
  p('Rızası olsun olmasın bir kadının çocuğunu düşürten kişiyi cezalandırır. Burada KAST doğrudan çocuğun düşmesine yöneliktir. TOMEC açısından kritik AYRIM: m.87/2-(e) "kasten yaralama → neticesi olarak çocuğun düşmesi" iken; m.99 "doğrudan çocuk düşürtme kastı" suçudur. Adli rapor bu ayrımı yapmak zorundadır. TOMEC E domain "eylem amacı/yönelimi" alt parametresi bu farkı operasyonelleştirir.'),

  h2('2.2 Önerilen "Kast / Olası Kast / Bilinçli Taksir" Alt Parametresi (E Domain)'),
  p('Failin gebeliği bilip bilmediği, görünür gebelik (belirgin abdominal protrüzyon) durumunda değerlendirme, ve yaralamanın yönelim bölgesi (abdominal/non-abdominal), illiyet değerlendirmesinde belirleyicidir. Önerilen alt parametre yapısı:'),
  spacer(),
  table([
    [cell('Manevi Unsur Düzeyi', { head: true, w: 30 }), cell('Operasyonel Tanım', { head: true, w: 45 }), cell('E Domain Modifikatörü', { head: true, w: 25 })],
    [cell('Doğrudan kast (gebe kadın hedef)'), cell('Fail gebeliği biliyordu + abdominal hedefli darbe'), cell('+15 puan')],
    [cell('Olası kast'), cell('Görünür gebelik + non-abdominal alan ama riski göze alan davranış'), cell('+8 puan')],
    [cell('Bilinçli taksir'), cell('Gebeliği biliyor; sonucu istemiyor ama meydana gelmeyeceğine güveniyor'), cell('+3 puan')],
    [cell('Basit taksir'), cell('Gebeliği bilmiyor (örn. erken gebelik, görünmez)'), cell('0 puan')],
  ]),

  h2('2.3 TOMEC Skor → TCK Madde Eşleştirme Önerisi'),
  note('Bu eşleştirme, mahkeme kararını YERİNE GEÇMEZ; bilirkişi raporunun YAPILANDIRILMIŞ DESTEK ÇIKTISI olarak kullanılır. Hukuki nitelendirme yetkisi münhasıran mahkemeye aittir.'),
  spacer(),
  table([
    [cell('TOMEC Skoru', { head: true, w: 18 }), cell('Nedensellik Kategorisi', { head: true, w: 25 }), cell('TCK Açısından Öneri (Bilirkişi Yorumu)', { head: true, w: 57 })],
    [cell('85–100'), cell('Kesin'), cell('m.87/2-(e) (çocuğun düşmesi) veya m.87/1-(e) (vaktinden önce doğum) ağırlaştırıcı bentinin uygulanmasına yeterli düzeyde nedensellik desteği sunar')],
    [cell('70–84'), cell('Yüksek olasılıklı'), cell('Uygun illiyet teorisi açısından m.87 ağırlaştırıcı bentinin uygulanması savunulabilir; karşı kanıt aksini ortaya koymadıkça nedensellik kabul edilebilir')],
    [cell('55–69'), cell('Muhtemel'), cell('Nedensellik makul bir olasılık dahilindedir; ek tıbbi inceleme veya bilirkişi heyeti raporu önerilir; m.86 (temel) + m.23 değerlendirmesi gerekebilir')],
    [cell('40–54'), cell('Mümkün'), cell('Nedensellik dışlanamaz fakat kanıt zayıftır; m.87 ağırlaştırıcı bentinin uygulanması için yetersiz; alternatif neden değerlendirilmelidir')],
    [cell('25–39'), cell('Düşük'), cell('Nedensellik düşük olasılıklıdır; ek delil yokluğunda m.87 ağırlaştırıcı bent önerilmez')],
    [cell('10–24'), cell('Uzak'), cell('Nedensellik uzak ihtimaldir; alternatif neden daha güçlüdür')],
    [cell('0–9'), cell('Yok'), cell('Nedensel ilişki desteklenmemektedir')],
  ]),
);

// ============ BÖLÜM 3: KLİNİK PARAMETRELER ============
sections.push(
  h1('BÖLÜM 3 — EKSİK KLİNİK / BİYOLOJİK PARAMETRELER'),
  p('Aşağıdaki parametreler, Queensland Clinical Guideline "Trauma in pregnancy" (MN19.31-V2-R24, Ağustos 2019, Queensland Health) belgesinde travma sonrası obstetrik komplikasyon riskinin belirlenmesinde temel kabul edilmektedir. Mevcut TOMEC makalesinde bunların bir kısmı eksiktir. Önerilen entegrasyonlar aşağıdadır.'),

  h2('3.1 Plasenta Yerleşimi ve Tipi (O Domain Eklemesi)'),
  p('Anterior yerleşimli plasenta, künt abdominal travmada feto-maternal hemoraji (FMH) için daha yüksek risklidir (Queensland MN19.31, Tablo 21). Plasenta previa varlığı ise minör travmada bile masif kanama riskini artırır. Önerilen O domain alt parametresi:'),
  spacer(),
  table([
    [cell('Plasenta Bulgusu', { head: true, w: 60 }), cell('O Domain Modifikatörü', { head: true, w: 40 })],
    [cell('Posterior plasenta, normal yerleşim'), cell('0 (referans)')],
    [cell('Anterior plasenta, normal yerleşim'), cell('+5')],
    [cell('Plasenta previa marginal'), cell('+8')],
    [cell('Plasenta previa totalis veya akreta spektrum'), cell('+12')],
  ]),

  h2('3.2 Kleihauer–Betke Testi (Yeni Alt Parametre — O ve C Domainleri)'),
  p('Kleihauer-Betke (KB) testi, maternal dolaşımdaki fetal eritrosit yüzdesini ölçer ve FMH miktarını mL cinsinden tahmin etmeyi sağlar. Queensland kılavuzu (Tablo 21), KB testini FMH için temel objektif belirteç olarak tanımlar; >4 mL fetal kan saptanması durumunda flow sitometri ile doğrulama önerilir. KB testi pozitifliği ve fetal kan miktarı, illiyet bağında DOĞRUDAN TEMPORAL ve BİYOLOJİK kanıt değeri taşır.'),
  bullet('KB negatif (<1 mL): C domain "alternatif neden dışlama" puanı düşer.'),
  bullet('KB pozitif, 1–4 mL: C domain +5, O domain +5.'),
  bullet('KB pozitif, >4 mL (masif FMH): C domain +10, O domain +10, T domain +5.'),

  h2('3.3 CTG (Kardiyotokografi) Monitörizasyonu (C Domain Genişletmesi)'),
  p('Queensland kılavuzu, ≥23 hafta gebeliklerde travma sonrası en az 4 saat CTG monitörizasyonunu zorunlu kabul eder. CTG bulguları zaman damgalı objektif kanıtlardır:'),
  bullet('Reasürre edici CTG (4 saat boyunca): Akut fetal distres dışlanır → temporal kanıt güçlü.'),
  bullet('Geç deselerasyonlar, sinusoidal patern, taşikardi: Akut fetal kompromise objektif kanıt → C domain +10.'),
  bullet('Uterin kontraksiyon paterni (>4/saat): Plasental abrupsiyon için erken belirteç → O domain +5.'),
  note('CTG <28 hafta gebelikte temkinle yorumlanmalıdır (Queensland MN19.31). Bu kısıt makaleye bir not olarak eklenmelidir.'),

  h2('3.4 Rh D Durumu ve Anti-D İmmünoglobulin (M Domain)'),
  p('Queensland verisine göre Queensland popülasyonunda Rh D negatiflik oranı yaklaşık %21\'dir; Türk popülasyonu için benzer oran (~%15) yazar tarafından güncel literatürden doğrulanmalıdır. Rh D negatif gebede travma sonrası anti-D immünoglobulin uygulanmaması ya da gecikmesi, hem maternal alloimmünizasyon hem de sonraki gebelik için riski artırır; bu, illiyet bağı açısından "araya giren ihmal" sorgusuna yol açabilir.'),

  h2('3.5 DIC (Yaygın Damar İçi Pıhtılaşma) Göstergeleri (T ve M Domain)'),
  p('Queensland kılavuzu (Tablo 24), gebelikte DIC tanı kriterlerini özetler. Önerilen TOMEC eklemeleri:'),
  bullet('D-dimer artışı (gebelik için ayarlanmış üst sınırın >2 katı): T domain +5.'),
  bullet('Fibrinojen <2 g/L (gebelikte normal alt sınır 4 g/L): T domain +8, M domain +5.'),
  bullet('Trombosit <100×10⁹/L: T domain +5.'),
  bullet('PT/aPTT uzaması: T domain +5.'),

  h2('3.6 Maternal Psikiyatrik Travma → "Ruh Sağlığında Bozulma" (M Domain)'),
  p('TCK m.87 sistematiğinde "ruh sağlığında bozulma" ağır netice olarak kabul edilir. Cenger ve ark. (2018, Med J SDU 25(2):194-199) olgu sunumunda travma sonrası TSSB ve majör depresyon, illiyet bağının kurulmasında belirleyici unsur olmuştur. TOMEC için önerilen M domain alt parametresi:'),
  bullet('DSM-5 kriterleriyle TSSB tanısı (travma ile temporally ilişkili): +10 puan.'),
  bullet('Majör depresif bozukluk (travma sonrası başlangıçlı): +5 puan.'),
  bullet('Akut stres bozukluğu (1 ay içinde): +5 puan.'),
  bullet('Anksiyete bozukluğu (yeni başlangıçlı): +3 puan.'),
  note('Psikiyatrik tanılar, ICD-10 veya DSM-5 ile yapılmış, yapılandırılmış görüşme veya validasyonu yapılmış ölçek temelli olmalı; subjektif rapor tek başına yeterli değildir. Bu kısıt makaleye yazılmalıdır.'),

  h2('3.7 Önceki Obstetrik Öykü (M Domain)'),
  p('Önceki plasental abrupsiyon, hastanın sonraki gebelikte abrupsiyon riskini yaklaşık 10 kat artırır (genel obstetrik literatür; spesifik insidans yazar tarafından güncel kaynaktan doğrulanmalıdır). Önceki sezaryen öyküsü uterin rüptür riskini artırır. Bu öyküler M domain modülatörü olarak skorlanmalıdır:'),
  bullet('Önceki abrupsiyon: M domain +5.'),
  bullet('≥1 önceki sezaryen: M domain +3.'),
  bullet('Önceki preterm doğum: M domain +3.'),
);

// ============ BÖLÜM 4: VALIDASYON PROTOKOLÜ ============
sections.push(
  h1('BÖLÜM 4 — ÖNERİLEN VALİDASYON PROTOKOLÜ'),
  note('Bu bölümdeki tüm sayısal eşikler ve istatistik formüller, ilgili METODOLOJİ kaynaklarında belirtilen genel kabul görmüş referans değerlerdir; TOMEC için pilot saha verisi henüz toplanmamıştır. Sonuç değil, ÇALIŞMA PROTOKOLÜ olarak okunmalıdır.'),

  h2('4.1 İçerik Geçerliliği — Delphi Paneli ve CVI'),
  p('Ölçeğin (TOMEC) içerik geçerliliği için Delphi paneli ve Content Validity Index (CVI) hesaplaması altın standarttır (Lynn 1986; Polit & Beck 2006).'),
  bullet('Panel: 8–12 uzman (adli tıp, perinatoloji, acil tıp, hukuk, biyoistatistik temsilcileri).'),
  bullet('Tur sayısı: en az 2 tur Delphi (modifiye); konsensüs eşiği = ≥%75 uzman onayı.'),
  bullet('Her parametre için 4-noktalı ilgililik puanı (1=ilgisiz; 4=çok ilgili).'),
  bullet('Item-level CVI (I-CVI) = 3 veya 4 puan veren uzman oranı; eşik ≥0.78 (6 ve üzeri uzmanda Lynn 1986).'),
  bullet('Scale-level CVI (S-CVI/Ave) = ortalama I-CVI; eşik ≥0.90 (Polit & Beck 2006).'),
  bullet('Düşük CVI alan parametreler revizyon veya çıkarmaya tabi tutulmalıdır.'),

  h2('4.2 Inter-Rater Güvenirlik — Cohen\'s κ / Fleiss κ'),
  p('Kategorik nedensellik sınıfları (Kesin, Yüksek olasılıklı, Muhtemel vb.) arasında değerlendiriciler arası uyum.'),
  bullet('İki değerlendirici için Cohen\'s κ (Cohen 1960); ≥3 değerlendirici için Fleiss κ (Fleiss 1971).'),
  bullet('Vaka sayısı: minimum 30 vinyet (örnek olgu); pratikte 50–100 önerilir.'),
  bullet('Değerlendirici sayısı: 5–10 bağımsız adli tabip.'),
  bullet('Yorumlama (Landis & Koch 1977): <0.00 zayıf; 0.00–0.20 hafif; 0.21–0.40 az; 0.41–0.60 orta; 0.61–0.80 önemli; 0.81–1.00 neredeyse mükemmel uyum.'),
  bullet('Hedef: TOMEC için κ ≥0.61 (önemli uyum); ideal ≥0.75.'),
  bullet('Kategorik uyum yanında, ham SAYISAL skor (0–100) için Intraclass Correlation Coefficient (ICC, two-way mixed, absolute agreement) hesaplanmalıdır; hedef ICC ≥0.75.'),

  h2('4.3 Intra-Rater Güvenirlik (Test-Retest)'),
  bullet('Aynı uzman, aynı 30 vinyeti 2 hafta arayla iki kez puanlar; vakaların sırası karıştırılır.'),
  bullet('Hesaplama: Cohen\'s κ (kategorik) + ICC (sürekli skor).'),
  bullet('Hedef: κ ≥0.70, ICC ≥0.80.'),

  h2('4.4 Kriter Geçerliliği — Retrospektif Yargıtay Karar Tarama Protokolü'),
  p('Türk Yargıtayı\'nın TCK m.87 ve m.99 kapsamında verdiği kararlar, TOMEC\'in altın standart referansı olarak kullanılabilir.'),
  note('Bu çalışma, mahkeme kararlarının ANONİMLEŞTİRİLEREK ve KKVK uyumlu şekilde taranmasını gerektirir. Yazarın bağlı bulunduğu kurumun etik kurul onayı ve gerekirse Adalet Bakanlığı izni alınmalıdır.'),
  bullet('Veri kaynağı: UYAP Mevzuat / Karar Arama Sistemi; Yargıtay Karar Arama (karararama.yargitay.gov.tr).'),
  bullet('Anahtar kelime stratejisi: "kasten yaralama" + "gebelik" + "düşük" / "abortus" / "preterm" / "abrupsiyon" / "fetal kayıp" — 2010–2025 dönem.'),
  bullet('Dahil etme: Yargıtay 1., 3., 4. Ceza Daireleri kararları + Ceza Genel Kurulu kararları.'),
  bullet('Hariç tutma: Sadece usul incelemesi; tıbbi bilirkişi raporuna atıf yapmayan kararlar.'),
  bullet('İki bağımsız araştırmacı, kararlardaki bilirkişi raporu özetlerinden TOMEC alanlarını puanlamalı; uyum κ değeri ≥0.70 olmalıdır.'),
  bullet('Çıktı: TOMEC skoru ↔ mahkeme nitelendirmesi (m.86 / m.87 ağırlaştırıcı bent / m.99 / beraat) çapraz tablo.'),
  note('Karar numaraları, taraf bilgileri ve kişisel veriler RAPORLANMAZ; sadece toplulaştırılmış istatistikler bildirilir. Mahkeme kararının nitelendirmesi TOMEC ile UYUŞMADIĞINDA çelişki nedenleri ayrı bir kalitatif tema analizi ile değerlendirilmelidir.'),

  h2('4.5 ROC Analizi ve Eşik Optimizasyonu'),
  bullet('Altın standart: mahkemenin nihai nitelendirmesi (m.87 ağırlaştırıcı bent uygulandı = pozitif; uygulanmadı = negatif).'),
  bullet('TOMEC sürekli skoru için ROC eğrisi çizilmeli; AUC (Area Under Curve) raporlanmalı.'),
  bullet('Optimum eşik için Youden indeksi (J = sensitivite + spesifite − 1) en yüksek noktası belirlenmeli.'),
  bullet('Mevcut "85 = Kesin" eşiğinin sensitivite/spesifite/PPV/NPV değerleri sunulmalıdır.'),
  bullet('Bootstrap yöntemiyle (1000 örneklem) %95 güven aralığı raporlanmalı.'),

  h2('4.6 Bayesian Güncelleme Çerçevesi (İleri Düzey Eklenti)'),
  p('Soruşturma süreci boyunca yeni delil (otopsi raporu, DNA analizi, ek tıbbi inceleme) elde edildikçe TOMEC skorunun güncellenebilmesi için Bayes mantığı ile prior → posterior dönüşümü tanımlanabilir. Bu, makalenin "Gelecek perspektif" bölümünde yer alabilir; ilk validasyon için zorunlu değildir.'),
);

// ============ BÖLÜM 5: TRIPOD ============
sections.push(
  h1('BÖLÜM 5 — TRIPOD RAPORLAMA UYUMU'),
  p('TRIPOD (Transparent Reporting of a multivariable prediction model for Individual Prognosis Or Diagnosis) kılavuzu, Collins ve ark. tarafından 2015\'te yayınlanmıştır (Ann Intern Med 2015;162(1):55-63) ve klinik prediktif modellerin raporlanmasında uluslararası standart kabul edilmektedir. TOMEC bir prediktif/sınıflandırıcı algoritma olduğu için TRIPOD\'a uyum hakemler tarafından beklenecektir.'),
  p('Aşağıdaki tablo TRIPOD\'un 22 maddesini, mevcut TOMEC makalesindeki karşılığı ve eksikleri ile birlikte özetler. Sütun 3 ("Mevcut Durum"), yazarın makaleye karşı içsel öz-değerlendirmesidir; gerçek değerlendirme bağımsız bir gözden geçirici tarafından yapılmalıdır.'),
  spacer(),
  table([
    [cell('No', { head: true, w: 5 }), cell('TRIPOD Maddesi', { head: true, w: 50 }), cell('Mevcut TOMEC Makalesi', { head: true, w: 25 }), cell('Önerilen Eylem', { head: true, w: 20 })],
    [cell('1'), cell('Başlık: model tipi (geliştirme / validasyon) belirtilmeli'), cell('Kısmen var ("Metodolojik Çalışma")'), cell('"Geliştirme" eklenmeli')],
    [cell('2'), cell('Özet: yapılandırılmış (amaç, yöntem, bulgu, sonuç)'), cell('Var'), cell('Tamam')],
    [cell('3a'), cell('Arka plan ve gerekçe'), cell('Var'), cell('Tamam')],
    [cell('3b'), cell('Çalışma amacı (geliştirme / validasyon ayrımı)'), cell('Var'), cell('Tamam')],
    [cell('4a'), cell('Çalışma tasarımı / kaynak veri'), cell('Kısmen'), cell('Literatür tarama akış şeması (PRISMA benzeri) ekle')],
    [cell('4b'), cell('Veri toplama tarihleri ve takip süresi'), cell('Yok'), cell('Bir sonraki sürümde belirt')],
    [cell('5a'), cell('Katılımcılar — uygunluk kriterleri'), cell('Yok (vinyet olduğu için)'), cell('Vinyet üretim metodolojisini açıkla')],
    [cell('5b'), cell('Hasta tanımı (klinik özellikler)'), cell('Hipotetik vakalar var'), cell('Vinyet temsilciliği gerekçelendirilmeli')],
    [cell('5c'), cell('Detaylar: bakım, müdahaleler'), cell('Kısmen'), cell('Genişlet')],
    [cell('6a'), cell('Hedef sonuç (outcome) tanımı'), cell('Var ("nedensellik kategorisi")'), cell('Operasyonel tanımı netleştir')],
    [cell('6b'), cell('Kör değerlendirme yapıldıysa belirt'), cell('İlgili değil (geliştirme aşaması)'), cell('Validasyon aşamasında uygula')],
    [cell('7a'), cell('Prediktör tanımları'), cell('Var (alt parametreler)'), cell('Tüm alt parametre operasyonel tanımları ek dosyada listele')],
    [cell('7b'), cell('Prediktör değerlendirmesinde körleme'), cell('İlgili değil'), cell('Validasyonda uygula')],
    [cell('8'), cell('Örneklem büyüklüğü'), cell('30 simüle vinyet'), cell('Power analizi ile gerekçelendir veya sınırlılık olarak belirt')],
    [cell('9'), cell('Kayıp veri ele alınması'), cell('Yok'), cell('Validasyon protokolüne ekle')],
    [cell('10a'), cell('İstatistiksel analiz: model geliştirme'), cell('Eksik'), cell('Ağırlık kalibrasyon yöntemi ayrıntılandır')],
    [cell('10b'), cell('Model spesifikasyonu (formül)'), cell('Var (S_TOMEC formülü)'), cell('Tamam')],
    [cell('10c'), cell('Performans değerlendirme metodları'), cell('Yok'), cell('ROC/κ/ICC eklenmeli (Bölüm 4)')],
    [cell('10d'), cell('Model güncelleme planı'), cell('Yok'), cell('Bayesian çerçeveyi belirt')],
    [cell('11'), cell('Risk grupları (eşik kategorileri)'), cell('Var (7 kategori)'), cell('Tamam')],
    [cell('12'), cell('Geliştirme ve validasyon farkları'), cell('İlgili değil (yalnız geliştirme)'), cell('Açıkça belirt')],
    [cell('13a'), cell('Akış diyagramı'), cell('Tasviri var'), cell('Resmi şekil olarak çiz')],
    [cell('14a'), cell('Tanımlayıcı istatistikler'), cell('Yok'), cell('Pilot sonrası ekle')],
    [cell('14b'), cell('Sonuç dağılımı'), cell('Yok'), cell('Pilot sonrası ekle')],
    [cell('15a'), cell('Model sunumu (tam denklem/tablolar)'), cell('Var'), cell('Tamam')],
    [cell('15b'), cell('Bireysel tahmin için açıklama'), cell('Kısmen'), cell('"Hesaplama örneği" ekle')],
    [cell('16'), cell('Performans (kalibrasyon, ayrım)'), cell('Yok'), cell('Pilot validasyon sonrası ekle')],
    [cell('17'), cell('Sınırlılıklar'), cell('Çok kısa'), cell('Genişlet (Bölüm 6)')],
    [cell('18'), cell('Yorum / klinik anlam'), cell('Var'), cell('Tamam')],
    [cell('19'), cell('Model güçlü-zayıf yönleri'), cell('Kısmen'), cell('Genişlet')],
    [cell('20'), cell('Klinik karara entegrasyon'), cell('Var'), cell('Tamam')],
    [cell('21'), cell('Ek bilgi (protokol, kod, kalibrasyon datası)'), cell('Yok'), cell('OSF/GitHub repo aç ve linkle')],
    [cell('22'), cell('Finansman ve çıkar çatışması'), cell('Var'), cell('Tamam')],
  ]),
  note('Yukarıdaki TRIPOD tablosu, Collins GS, Reitsma JB, Altman DG, Moons KGM. Ann Intern Med 2015;162(1):55-63 belgesinin 22-maddelik kontrol listesinden uyarlanmıştır; orijinal kontrol listesinin tam ve güncel hali https://www.tripod-statement.org adresinden doğrulanmalıdır. TRIPOD\'un 2024 güncellemesi (TRIPOD-AI / TRIPOD+AI) yayınlanmıştır; eğer makalede AI/ML bileşeni yoksa orijinal 2015 sürümü yeterlidir.'),
);

// ============ BÖLÜM 6: SINIRLILIKLAR ============
sections.push(
  h1('BÖLÜM 6 — GENİŞLETİLMİŞ SINIRLILIKLAR'),
  p('Mevcut TOMEC makalesindeki sınırlılıklar bölümü dar tutulmuştur. Hakem değerlendirmesinde geri dönüş alınmaması için aşağıdaki başlıkların açıkça eklenmesi önerilir:'),
  bullet('Validasyon eksikliği: Model henüz prospektif veya retrospektif gerçek vaka serisinde validate edilmemiştir; bu çalışma metodolojik geliştirme aşamasındadır.'),
  bullet('Kültürel/popülasyon spesifikliği: Türk popülasyonu ve Türk hukuk sistemi merkezli geliştirilmiştir; uluslararası uygulanabilirlik test edilmemiştir.'),
  bullet('Uzman bağımlılığı: Bazı parametreler (örn. enerji düzeyi tahmini, eylemin "kasıtlılığı") halen uzman yorumuna bağlıdır; bu durum inter-rater varyasyona neden olabilir.'),
  bullet('Psikolojik travma kantifikasyonunun zorluğu: TSSB ve majör depresyonun travma sonrası başlangıçlı olduğunu kanıtlamak temporal olarak zorlu olabilir.'),
  bullet('Tıbbi malpraktis konfünderi: Travma sonrası gecikmiş tıbbi müdahalenin payını ayırmak hâlen subjektiftir.'),
  bullet('Hipotetik / vinyet temelli geliştirme: Algoritmanın gerçek vaka karmaşıklığını yakalama kapasitesi sınırlı olabilir.'),
  bullet('Hukuki nitelendirme yetkisinin dışlanması: TOMEC bir bilirkişi destek aracıdır; mahkeme nitelendirmesinin yerine geçmez. Bu sınırlılık raporun her sayfasında vurgulanmalıdır.'),
  bullet('Veri kaybı / tarihi kayıt eksikliği: Travma anına ait detaylı kayıt (görgü tanığı, kamera, ambulans raporu) eksikse C ve E domainleri eksik kalır; algoritma bu eksikliği "puan azaltma" ile cezalandırır ama "kestirme/imputasyon" yapmaz — bu prensip net belirtilmelidir.'),
  bullet('Etik kurul çerçevesi: Validasyon çalışmasının etik kurul ve gerekirse Adalet Bakanlığı izinleri ile yürütülmesi zorunludur; bu süreç süreyi uzatabilir.'),
);

// ============ BÖLÜM 7: HEDEF DERGİ MATRİSİ ============
sections.push(
  h1('BÖLÜM 7 — HEDEF DERGİ KARAR MATRİSİ'),
  note('Aşağıdaki tabloda yer alan IF (Impact Factor) değerleri yaklaşık ve yıldan yıla değişkendir; gönderim öncesi yazar tarafından Clarivate JCR veya Scopus CiteScore üzerinden güncel değerin DOĞRULANMASI önerilir. Türkçe dergiler için TR Dizin durumu da ULAKBİM üzerinden kontrol edilmelidir.'),
  spacer(),
  table([
    [cell('Dergi', { head: true, w: 30 }), cell('Endeks / Statü (yaklaşık)', { head: true, w: 22 }), cell('TOMEC için Uygunluk', { head: true, w: 28 }), cell('Strateji', { head: true, w: 20 })],
    [cell('Adli Tıp Bülteni / The Bulletin of Legal Medicine'), cell('TR Dizin, ESCI'), cell('Çok yüksek — Türk illiyet doktrini ile birebir uyumlu'), cell('Aşama 1: Türkçe gönderim')],
    [cell('Türkiye Klinikleri Adli Tıp ve Adli Bilimler'), cell('TR Dizin'), cell('Yüksek'), cell('Alternatif Aşama 1')],
    [cell('Adli Bilimler Dergisi'), cell('TR Dizin'), cell('Orta-Yüksek (uygulamaya yönelik dergi)'), cell('Yedek seçenek')],
    [cell('Forensic Science, Medicine and Pathology (Springer)'), cell('SCIE / Q2 (yaklaşık)'), cell('Yüksek — "novel scoring system" makalelerini yayımlıyor'), cell('Aşama 2: validasyon sonrası İng.')],
    [cell('Journal of Forensic and Legal Medicine (Elsevier)'), cell('SCIE / Q2 (yaklaşık)'), cell('Yüksek — illiyet + klinik adli tıp birleşimi'), cell('Aşama 2 alternatif')],
    [cell('International Journal of Legal Medicine (Springer)'), cell('SCIE / Q1 (yaklaşık)'), cell('Yüksek bar; özgün metodoloji bekler'), cell('Validasyon güçlüyse hedeflenebilir')],
    [cell('Forensic Science International (Elsevier)'), cell('SCIE / Q1 (yaklaşık)'), cell('Yüksek bar; orijinal metodoloji'), cell('Validasyon güçlüyse')],
    [cell('Medicine, Science and the Law (SAGE)'), cell('SCIE / Q3 (yaklaşık)'), cell('Yüksek — İngiliz hukuk-tıp geleneği'), cell('Hibrit alternatif')],
    [cell('Journal of Maternal-Fetal & Neonatal Medicine'), cell('SCIE / Q3 (yaklaşık)'), cell('Orta — obstetrik tarafı baskınsa'), cell('Eğer odak obstetri ise')],
    [cell('European J Obstetrics & Gynecology Reprod Biol'), cell('SCIE / Q2 (yaklaşık)'), cell('Orta — obstetrik tarafı baskınsa'), cell('Obstetri-odaklı sürüm için')],
    [cell('BJOG'), cell('SCIE / Q1 (yaklaşık)'), cell('Düşük (genelde adli tıp odaklı makaleyi sınırlı yayımlar)'), cell('Riskli')],
    [cell('AJOG'), cell('SCIE / Q1 (yaklaşık)'), cell('Düşük (yüksek bar; illiyet-odaklı kabul az)'), cell('Çok riskli')],
  ]),

  h2('Önerilen İki Aşamalı Strateji'),
  p('Aşama 1 (3–4 ay): Bu belgedeki Bölüm 1, 2, 3, 5, 6 önerilerini mevcut metodolojik makaleye entegre et. Validasyon yapılmadan, METODOLOJİK MAKALE olarak Adli Tıp Bülteni\'ne Türkçe sun. Bu, hızlı kabul, atıf birikimi ve içtihat oluşturma için optimaldir.'),
  p('Aşama 2 (6–12 ay): Bölüm 4\'teki validasyon protokolünü uygula (etik kurul izinli; Yargıtay karar tarama + uzman vinyet paneli). Sonuçlarla birlikte AYRI BİR validasyon makalesi yaz; hedef Forensic Science, Medicine and Pathology veya Journal of Forensic and Legal Medicine. Bu, uluslararası görünürlük ve atıf için optimaldir.'),
);

// ============ KAYNAKLAR ============
sections.push(
  h1('KAYNAKLAR (TÜMÜ GERÇEK VE DOĞRULANABİLİR)'),
  note('Aşağıdaki listede yer alan tüm referanslar gerçek, yayınlanmış kaynaklardır. Yazarın gönderim öncesi DOI ve cilt/sayı bilgilerini son kontrol etmesi önerilir.'),
  p('1. Hill AB. The Environment and Disease: Association or Causation? Proc R Soc Med. 1965;58:295–300.', { size: 20 }),
  p('2. Roxin C. Gedanken zur Problematik der Zurechnung im Strafrecht. In: Festschrift für Richard M. Honig. Göttingen: Otto Schwartz Verlag; 1970:133–150.', { size: 20 }),
  p('3. von Kries J. Über den Begriff der objektiven Möglichkeit. Vierteljahrsschrift für wissenschaftliche Philosophie. 1888;12:179–240, 287–323, 393–428.', { size: 20 }),
  p('4. Traeger L. Der Kausalbegriff im Straf- und Zivilrecht. Marburg: N.G. Elwert; 1904.', { size: 20 }),
  p('5. Collins GS, Reitsma JB, Altman DG, Moons KGM. Transparent Reporting of a multivariable prediction model for Individual Prognosis Or Diagnosis (TRIPOD): The TRIPOD Statement. Ann Intern Med. 2015;162(1):55–63. doi:10.7326/M14-0697', { size: 20 }),
  p('6. Cohen J. A coefficient of agreement for nominal scales. Educ Psychol Meas. 1960;20(1):37–46.', { size: 20 }),
  p('7. Fleiss JL. Measuring nominal scale agreement among many raters. Psychol Bull. 1971;76(5):378–382.', { size: 20 }),
  p('8. Landis JR, Koch GG. The measurement of observer agreement for categorical data. Biometrics. 1977;33(1):159–174.', { size: 20 }),
  p('9. Lynn MR. Determination and quantification of content validity. Nurs Res. 1986;35(6):382–385.', { size: 20 }),
  p('10. Polit DF, Beck CT. The content validity index: are you sure you know what\'s being reported? Critique and recommendations. Res Nurs Health. 2006;29(5):489–497.', { size: 20 }),
  p('11. Queensland Clinical Guidelines. Trauma in pregnancy. Maternity and Neonatal Clinical Guideline MN19.31-V2-R24. Brisbane: Queensland Health; August 2019. Available: www.health.qld.gov.au/qcg', { size: 20 }),
  p('12. Cenger CD, Göçeoğlu ÜÜ, Özbek BY, Sezgin U, Fincancı ŞK. Travma sonrası erken gebelik kaybı: olgu sunumu. Med J SDU / SDÜ Tıp Fak Derg. 2018;25(2):194–199. doi:10.17343/sdutfd.374193', { size: 20 }),
  p('13. Türkiye Cumhuriyeti. Türk Ceza Kanunu (Kanun No: 5237). Resmi Gazete. 12 Ekim 2004; Sayı: 25611. Güncel hali için: mevzuat.gov.tr', { size: 20 }),
  p('14. American Psychiatric Association. Diagnostic and Statistical Manual of Mental Disorders, Fifth Edition (DSM-5). Arlington, VA: American Psychiatric Publishing; 2013.', { size: 20 }),
);

// ============ KAPANIŞ ============
sections.push(
  h1('SON SÖZ'),
  p('Bu belge, mevcut TOMEC algoritmasının kuramsal, hukuksal, klinik ve metodolojik açıdan güçlendirilmesi için somut, uygulanabilir ve KANITA DAYALI öneriler sunar. Tüm öneriler gerçek literatür ve gerçek kılavuzlardan türetilmiştir; hiçbir sayısal sonuç fabrike edilmemiş, hiçbir Yargıtay karar numarası uydurulmamıştır.'),
  p('Önerilen yol: (i) Bu belgedeki Bölüm 1, 2, 3, 5, 6 maddelerini mevcut metodolojik makaleye entegre et → Aşama 1 gönderimi (Türkçe). (ii) Bölüm 4 validasyon protokolünü uygula → Aşama 2 gönderimi (uluslararası).'),
  p('Sonraki adımlar için yazarın kararını beklemekteyim: TRIPOD checklist\'in resmi formda doldurulması, Bradford Hill bölümünün makaleye doğrudan entegrasyonu, Yargıtay karar tarama protokolünün ayrı çalışma protokolü olarak yazılması, online TOMEC hesaplayıcısının kodlanması veya Adli Tıp Bülteni format düzenlemesi — hangisi öncelikli ise.', { italics: true }),
);

const doc = new Document({
  creator: 'Dr. Nurcan Denli Bayır — TOMEC Çalışma Grubu',
  title: 'TOMEC Algoritması — Genişletme Önerileri v1.0',
  description: 'TOMEC metodolojik makalesi için genişletme, eksik tamamlama ve validasyon önerileri',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
  },
  sections: [{
    properties: { page: { margin: { top: 1100, bottom: 1100, left: 1200, right: 1200 } } },
    headers: { default: new Header({ children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'TOMEC Genişletme Önerileri v1.0', font: FONT, size: 18, italics: true, color: '7F7F7F' })],
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: ['Sayfa ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], font: FONT, size: 18, color: '7F7F7F' })],
    })] }) },
    children: sections,
  }],
});

(async () => {
  const buf = await Packer.toBuffer(doc);
  const out = path.join(__dirname, '..', 'client', 'public', 'TOMEC_Genisletme_Onerileri_v1.docx');
  fs.writeFileSync(out, buf);
  console.log(`OK ${out} (${(buf.length/1024).toFixed(1)} KB)`);
})();
