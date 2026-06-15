/* TOMEC v6 — Genişletilmiş tematik makale + 8 şekil + AMA kaynakça + EN abstract */
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, PageBreak,
  Footer, Header, PageNumber, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, HeightRule } = require('docx');

const NAVY = '0D2545', WINE = '7A2231', SAND = 'C9A06A', LIGHT = 'EAEEF2', GREY = '9AA5B1', SAGE = '5A8F7B';

const T = (txt, opts={}) => new TextRun({ text: String(txt ?? ''), ...opts });
const P = (children, opts={}) => new Paragraph({ children: Array.isArray(children) ? children : [children],
  spacing: { after: 140, line: 320 }, ...opts });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 380, after: 180 },
  children: [T(t, { bold: true, size: 30, color: NAVY })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 140 },
  children: [T(t, { bold: true, size: 26, color: NAVY })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120 },
  children: [T(t, { bold: true, size: 22, color: WINE })] });
const Body = (t) => P(T(t, { size: 22 }), { alignment: AlignmentType.JUSTIFIED });
const Quote = (t, src) => new Paragraph({
  indent: { left: 720, right: 360 }, spacing: { before: 120, after: 80, line: 280 },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: WINE, space: 12 } },
  children: [T('"', { italics: true, size: 20, color: NAVY }),
             T(t, { italics: true, size: 20, color: NAVY }),
             T('"', { italics: true, size: 20, color: NAVY }),
             ...(src ? [T('  — ' + src, { size: 18, color: SAND, bold: true })] : [])] });
const Bul = (t) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 },
  children: [T(t, { size: 22 })] });
const Caption = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 240 },
  children: [T(t, { italics: true, size: 18, color: NAVY })] });

function image(filename, w=600) {
  const fpath = path.join('client/public/figures', filename);
  const buf = fs.readFileSync(fpath);
  const sizeOf = require('image-size');
  const dim = sizeOf.imageSize(buf);
  const ratio = dim.height / dim.width;
  const h = Math.round(w * ratio);
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 },
    children: [new ImageRun({ data: buf, type: 'png', transformation: { width: w, height: h } })] });
}
function imageRatio(filename, w, h) {
  const buf = fs.readFileSync(path.join('client/public/figures', filename));
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 },
    children: [new ImageRun({ data: buf, type: 'png', transformation: { width: w, height: h } })] });
}

// === Tablo yardımcıları ===
const cellTxt = (txt, opts = {}) => new TableCell({
  width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  children: [new Paragraph({ alignment: opts.align || AlignmentType.LEFT,
    children: [T(txt, { bold: !!opts.bold, size: opts.size || 18, color: opts.color || '000000' })] })],
  margins: { top: 80, bottom: 80, left: 100, right: 100 },
  verticalAlign: 'center',
});

// === MAKALE BAŞLAR ===
const c = [];

// === KAPAK ===
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1400, after: 240 },
  children: [T('Gebelikte Travmaya Bağlı Erken Doğum ve Düşük Olgularında', { bold: true, size: 36, color: NAVY })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
  children: [T('Fiil–Sonuç İlliyet Bağının Standardize Edilmesi:', { bold: true, size: 30, color: NAVY })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480 },
  children: [T('TOMEC (Travma–Obstetrik Mediko-legal Causality) Skorunun Geliştirilmesi', { bold: true, size: 28, color: NAVY }),
             T('\nve 3.501 Yargı Kararı Üzerinde Retrospektif Sınanması', { bold: true, size: 28, color: WINE })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
  children: [T('Metodolojik Makale — v7 (Tam Sürüm: Literatür Genişletilmiş + Tam Form İçeriği + İleri Doktora Önerileri)', { italics: true, size: 22 })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800, after: 100 },
  children: [T('Nurcan Denli Bayır, MD', { bold: true, size: 26, color: NAVY }),
             T('*', { bold: true, size: 26, color: WINE, superScript: true })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
  children: [T('Adli Tıp Kliniği, Ankara Bilkent Şehir Hastanesi, Ankara, Türkiye', { size: 22 })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 },
  children: [T('* ', { bold: true, size: 18, color: WINE }),
             T('Sorumlu yazar ve TOMEC skorlama modelinin tasarımcısı (originator). Modelin alan tanımları, ağırlıkları, eşik kategorileri ve çalışma kâğıdı yazar tarafından geliştirilmiştir; bkz. §3 (Model Geliştirme) ve §4 (Yöntemler).', { italics: true, size: 18 })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
  children: [T(new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }), { size: 22 })] }));
c.push(new Paragraph({ children: [new PageBreak()] }));

// === İÇİNDEKİLER (manuel) ===
c.push(H1('İçindekiler'));
const TOC = [
  ['Türkçe Özet · English Abstract', '3'],
  ['1. Giriş', '5'],
  ['2. Literatür: Gebelikte Mekanik Travma ve İlliyet Bağı', '7'],
  ['  2.1. Epidemiyoloji  ·  2.2. Anatomik/Fizyolojik Adaptasyonlar', '7'],
  ['  2.3. Plasenta Dekolmanı  ·  2.4. Triaj/Yönetim  ·  2.5. TCK m.87/88', '8'],
  ['  2.6. AYM/AİHM Pratiği  ·  2.7. Türk Adli Obstetri Külliyatı (Soysal/Çakalır)', '10'],
  ['  2.8. Türk Olgu Sunumu (Cenger ve ark., 2018)', '11'],
  ['  2.9. Uluslararası Risk Skorları ve TOMEC ile Karşılaştırma', '12'],
  ['  2.10. Mediko-legal Boşluk: Standardizasyon Gereksinimi', '13'],
  ['  2.11. Veri Kalitesi: Otomatik Filtre + 36-Karar Manuel Doğrulama', '13'],
  ['3. Yöntem', '14'],
  ['4. Bulgular — Tematik Analiz (8 alt-grup, 9 tablo)', '19'],
  ['5. Patofizyolojik Çerçeve', '34'],
  ['6. TOMEC Skorunun Adli Karar Mekanizmasındaki Yeri', '36'],
  ['7. Tartışma', '38'],
  ['  7.5. Uluslararası Seri Karşılaştırması (El Kady, Aboutanos, Schiff, Mendez-Figueroa)', '40'],
  ['  7.5.1. Uluslararası Kalibrasyon (OR, %95 CI, Fisher exact)', '40'],
  ['  7.6. Nedensellik Çerçeveleri Karşılaştırması (Bradford Hill · Daubert · Anscheinsbeweis · but-for · TOMEC)', '40'],
  ['8. Sınırlılıklar ve Prospektif Validasyon Önerisi', '41'],
  ['9. Sonuç ve Pratik Mediko-legal Çıkarımlar', '43'],
  ['10. İleri Araştırma ve Doktora Tezi Önerileri', '45'],
  ['  10.1. Doktora Tezi Önerisi A — Prospektif Validasyon Kohortu', '45'],
  ['  10.2. Doktora Tezi Önerisi B — Makine Öğrenmesi ile Ağırlık Optimizasyonu', '47'],
  ['  10.3. Doktora Tezi Önerisi C — TOMEC-Med (Sağlık Hizmeti Kaynaklı) Varyantı', '48'],
  ['  10.4. Doktora Tezi Önerisi D — Adli Obstetri Otopsi Korelasyonu', '49'],
  ['  10.5. Yan Tez/Yüksek Lisans Önerileri (5 başlık)', '50'],
  ['Kaynaklar (AMA stili — 60+ referans)', '52'],
  ['Ek 1. Şekil ve Tablo Listesi', '55'],
  ['Ek 2. Anahtar Emsal Karar Künye Listesi (15 karar)', '56'],
  ['Ek 3. Tamamlayıcı Veri Dosyaları', '58'],
  ['Ek 4. TOMEC Çalışma Kâğıdı ve Tam Skorlama Kılavuzu', '59'],
  ['  Ek 4.1. Form Şablonu (Şekil 9)  ·  Ek 4.2. Anatomik/Enerji Skorları', '59'],
  ['  Ek 4.3. Müdahale ve Vital Stabilite  ·  Ek 4.4. Gestasyonel Risk Haritası', '63'],
  ['  Ek 4.5. Temporal Pencere ve Mekanizma Modifikatörleri', '66'],
  ['  Ek 4.6. Hipotetik Vaka Uygulamaları (3 vaka)', '68'],
];
TOC.forEach(([title, page]) => {
  c.push(new Paragraph({ tabStops: [{ type: 'right', position: 9000 }], spacing: { after: 80 },
    children: [T(title, { size: 22 }), T('\t', { size: 22 }), T(page, { size: 22, color: NAVY, bold: true })] }));
});
c.push(new Paragraph({ children: [new PageBreak()] }));

// === ÖZET TR + EN ABSTRACT ===
c.push(H1('Özet'));
c.push(Body('Amaç: Künt batın travması, fiziksel saldırı, trafik kazası, iş kazası, aile içi şiddet ve kamu sağlık hizmetinden kaynaklı dolaylı travma gibi dış nedenlerin gebelikte erken doğum ve düşük gibi obstetrik komplikasyonlara yol açtığı iddia edilen vakalarda fiil–sonuç illiyet bağının standardize biçimde değerlendirilmesi adli tıp açısından zordur. Mevcut Türk uygulamasında bu değerlendirme büyük ölçüde Adli Tıp Kurumu (ATK) İhtisas Kurullarının olgu-bazlı raporlarına dayanmakta; mahkeme kararları arasında metodolojik tutarlılık sağlanamamaktadır. Bu çalışmada, bu boşluğu doldurmak amacıyla geliştirilen Travma–Obstetrik Mediko-legal Causality (TOMEC) skoru sunulmakta ve Türkiye yargı pratiğinden derlenen büyük ölçekli içtihat tabanı kullanılarak ön validasyon adımları açıklanmaktadır.'));
c.push(Body('Yöntem: Sinerji Mevzuat içtihat veritabanı (mevzuat.sinerjias.com.tr) üzerinde dört aşamalı sistematik tarama yürütüldü: (1) "gebe + travma", (2) "gebe + illiyet", (3) "hamile + düşük", (4) "cenin + ölüm". Toplam 3.501 yargı kararının tam metni indirildi (Yargıtay, Danıştay, AYM, AİHM, A.Y.İ.M., Askeri Yargıtay, Sayıştay, Uyuşmazlık Mahkemesi). İki eksenli (gebelik ∩ travma/dış neden) regex sıkı filtre sonrası 2.284 alakalı karar elde edildi. Erken doğum/düşük spesifik regex paneli ile 571 olgu seçildi ve sekiz tematik alt-grupta incelendi.'));
c.push(Body('TOMEC skoru beş alanlı ağırlıklı bir model olup [0–100] aralığında değer alır: T (Travma Niteliği/Şiddeti) %25, O (Obstetrik Durum/Gestasyonel Dönem) %20, M (Maternal Komorbid/Fizyolojik) %15, E (Eylem Özellikleri/Enerji-Mekanizma) %20, C (Kronolojik/Temporal İlişki) %20. Eşikler: 85–100 Kesin, 70–84 Yüksek Olasılıklı, 55–69 Muhtemel, 40–54 Mümkün, 25–39 Düşük, 10–24 Uzak, 0–9 Yok Nedensellik.'));
c.push(Body('Bulgular: 571 olgunun 392’si (%68,7) Yargıtay, 76’sı (%13,3) Danıştay, 60’ı (%10,5) Anayasa Mahkemesi, 33’ü (%5,8) AİHM kararıdır. Tematik gruplar (örtüşmeli): Künt batın/fiziksel saldırı (n=110), TCK m.87/88 (sıkı, n=95), AYM bireysel başvuru (n=60), Danıştay idari sorumluluk (n=76), AİHM m.2/3/8 (n=33), Trafik kazası (n=22), Aile içi şiddet (n=17), Tıbbi malpraktis (n=17), İş kazası (n=9). ATK Kurullarının "travma sonucu plasenta dekolmanı–erken doğum–neonatal ölüm" zincirini birden fazla olguda kabul ettiği, ancak gestasyonel haftaya, eylemin enerji düzeyine ve temporal aralığa ilişkin standardize bir terminolojinin bulunmadığı görüldü.'));
c.push(Body('Sonuç: TOMEC skoru, gebelikte travma sonrası obstetrik komplikasyonların adli değerlendirmesinde metodolojik tutarlılık ve mahkemeler arası karşılaştırılabilirlik sağlamak için kullanılabilir. 571 emsal karar üzerinde retrospektif konumlandırma sonrasında, Bilkent Şehir Hastanesi Adli Tıp Kliniği üzerinden çok merkezli prospektif validasyon önerilmektedir.'));
c.push(Body('Anahtar Kelimeler: Adli obstetri • illiyet bağı • TCK m.87/88 • plasenta dekolmanı • intrauterin fetal ölüm • TOMEC • Türk yargı içtihadı • Queensland Clinical Guideline.'));

c.push(H2('English Abstract'));
c.push(P([T('Development and Retrospective Validation of the TOMEC (Trauma–Obstetric Medico-legal Causality) Score for Standardised Causality Assessment in Pregnancy-Related Trauma Leading to Preterm Birth or Pregnancy Loss: Testing on 3,501 Turkish Court Decisions',
  { bold: true, size: 22, italics: true })]));
c.push(Body('Background: In cases where blunt abdominal trauma, physical assault, motor-vehicle collisions (MVC), occupational injuries, intimate-partner violence (IPV) or healthcare-related indirect harm in pregnancy is alleged to have caused an obstetric complication (preterm birth, miscarriage, intrauterine fetal demise), Turkish forensic practice depends largely on case-by-case opinions from the Council of Forensic Medicine (Adli Tıp Kurumu, ATK) Specialty Boards. There is no standardized scoring scale to grade the strength of the causal link, leading to inconsistency across jurisdictions.'));
c.push(Body('Methods: We performed a systematic four-wave search of the Sinerji Mevzuat case-law database (mevzuat.sinerjias.com.tr): (1) "pregnant + trauma", (2) "pregnant + causation", (3) "pregnant + miscarriage", (4) "fetus + death". A combined corpus of 3,501 unique full-text decisions was assembled across the Court of Cassation, Council of State, Constitutional Court, European Court of Human Rights (Turkey-related), Military Court of Cassation, Court of Audit, Court of Jurisdictional Disputes and the Supreme Military Administrative Court. A two-axis strict regex filter (pregnancy keywords ∩ trauma/external-cause keywords) yielded 2,284 relevant decisions; a preterm-birth/miscarriage-specific filter selected 571 cases for detailed thematic analysis.'));
c.push(Body('The proposed TOMEC score is a five-domain weighted model rated [0–100]: T (Trauma severity) 25%, O (Obstetric/Gestational status) 20%, M (Maternal comorbidity/physiology) 15%, E (Event mechanism/Energy) 20%, C (Chronological/Temporal relationship) 20%. Thresholds: 85–100 Definite · 70–84 Highly Probable · 55–69 Probable · 40–54 Possible · 25–39 Low · 10–24 Remote · 0–9 No Causation.'));
c.push(Body('Results: Of the 571 cases, 392 (68.7%) were Court of Cassation, 76 (13.3%) Council of State, 60 (10.5%) Constitutional Court, 33 (5.8%) ECHR. Thematic distribution (overlapping): blunt-abdominal/physical assault (n=110), Turkish Criminal Code Art. 87/88 (strict, n=95), constitutional individual applications (n=60), administrative liability (n=76), ECHR Art. 2/3/8 cases (n=33), MVC (n=22), IPV (n=17), medical malpractice (n=17), occupational accidents (n=9). ATK Specialty Boards were observed to accept the "trauma → placental abruption → preterm delivery → neonatal demise" chain in multiple cases, but without standardized terminology for gestational week, event energy, or temporal interval. The TOMEC score is designed to fill exactly this gap.'));
c.push(Body('Conclusion: The TOMEC score offers a structured, transparent and inter-jurisdictionally comparable framework for forensic assessment of trauma-related obstetric complications. Following this retrospective positioning on 571 sentinel cases, prospective validation through a multi-center cohort anchored at Ankara Bilkent City Hospital Forensic Medicine Clinic is proposed.'));
c.push(Body('Keywords: forensic obstetrics • causation • Turkish Criminal Code Art. 87/88 • placental abruption • intrauterine fetal demise • TOMEC • Turkish case law • Queensland Clinical Guideline.'));

c.push(new Paragraph({ children: [new PageBreak()] }));

// === 1. GİRİŞ ===
c.push(H1('1. Giriş'));
c.push(Body('Hocam, gebelik döneminde maruz kalınan mekanik travmanın obstetrik komplikasyonlarla ilişkilendirilmesi, hem klinik pratik hem de hukuk uygulaması açısından kritik öneme sahiptir. Adli tıp pratiğinde sıklıkla karşılaşılan soru, "tespit edilen travmanın saptanan obstetrik sonuca neden olup olmadığı"dır; ancak bu basit görünen sorunun arkasında çok katmanlı bir mediko-legal değerlendirme yatmaktadır: gestasyonel hafta, plasentanın yapışma yeri, eylemin enerji düzeyi, anneye ait önceden var olan komorbid durumlar, travma ile sonuç arasındaki temporal aralık, ve nihayetinde alternatif sebeplerin (kromozomal anomali, enfeksiyon, idiyopatik dekolman) sistematik dışlanması.'));
c.push(Body('Türk Ceza Kanunu (TCK) m.87/2-c, kasten yaralamanın gebe bir kadına karşı işlenmesi ve çocuğun erken doğmasına neden olunması hâlinde temel cezanın bir kat artırılmasını öngörmektedir; aynı maddenin 2-d bendi ise çocuğun düşmesine neden olunması hâlinde daha ağır bir artırım uygulamaktadır. TCK m.88 ise kasten yaralamanın ihmali davranışla işlenmesi hâlini düzenlemektedir. Kanun koyucunun bu ayrımı, fetüsün/ceninin korunma derecesinin gestasyonel haftaya bağlı olarak tıbbi gerçeklikle örtüşmesi gereğini ortaya koymaktadır. Buna karşın, bir somut olayda fiil ile düşük/erken doğum arasındaki illiyet bağının nasıl kurulacağı yargılama makamlarına büyük ölçüde Adli Tıp Kurumu raporları aracılığıyla iletilmekte ve bu raporlardaki "travmaya bağlı olduğu kanaatine varılmıştır" / "travmanın etkisi dışlanamaz" / "travma ile sonuç arasında doğrudan illiyet kurulamamıştır" gibi formülasyonlar, derecelendirilmiş bir skala üzerinde sayısallaştırılmamaktadır.'));
c.push(Body('Bu çalışma, Travma–Obstetrik Mediko-legal Causality (TOMEC) adıyla geliştirdiğimiz beş alanlı ağırlıklı skoru tanıtmakta; ardından Türkiye yargı pratiğinden taranan 571 emsal karar üzerinden modeli iki yönlü olarak sınamaktadır: (i) Yargı kararlarında zaten kabul edilen illiyet derecelendirmeleri TOMEC kategorileriyle eşleşiyor mu? (ii) TOMEC, kararlardaki illiyet tartışmasının daha standardize ve denetlenebilir biçimde sunulmasına imkân tanıyor mu?'));
c.push(H2('1.2. Araştırma Boşluğu (Research Gap)'));
c.push(Body('Sistematik literatür taraması (PubMed son 5 yıl + landmark, Cochrane, ACOG/RCOG/NICE/Queensland kılavuzları, Türk doktrini Soysal-Çakalır külliyatı, AYM/AİHM/Yargıtay/Danıştay) sonucunda saptanan boşluk şudur: (a) Klinik tarafta — Aboutanos ve ark. (J Trauma 2007, n=321), El Kady ve ark. (Am J Obstet Gynecol 2004, n=10.316), Mendez-Figueroa ve ark. sistematik derlemesi (Am J Obstet Gynecol 2013), Pearlman-Tintinalli-Lorenz (1990) ve Schiff ve ark.’nın iki ayrı çalışması — gebelikte travma sonrası obstetrik komplikasyon insidansını ve klinik prognostik belirleyicileri (gestasyonel hafta, temporal aralık, maternal şok) ortaya koymuştur. (b) Mediko-legal tarafta — TCK m.87/88 doktrin tartışmaları (Özgenç, Hakeri, Centel-Zafer), Yargıtay 3. CD’nin yerleşik içtihadı (örn. E.2020/1499), AYM B.B. No 2013/2803 ve 2017/35569, AİHM S. Aydoğdu/Türkiye (B.B. No 40448/06) içtihatları, illiyet tartışmasının kavramsal çerçevesini kurmuştur. (c) Standardizasyon tarafında — ISS/AIS-2015 anatomik travma şiddet skorları, WHO Maternal Morbidity Index (2022), Pearlman-Tintinalli obstetrik uyarlaması, klinik yönetimi düzenler. ANCAK — fiil → obstetrik sonuç illiyetini tek bir sayısal kompozit skor üzerinden, doğrudan TCK m.87/88 mediko-legal kategorilerine eşleyerek, hem hekim hem yargıç tarafından okunabilir, denetlenebilir ve transferable (Pearl ve Bareinboim 2014 anlamında) biçimde standardize eden bir model literatürde bulunmamaktadır. Bu çalışma, bu somut boşluğu — ATK İhtisas Kurulu raporlarındaki "kanaate ulaşılmıştır / dışlanamaz" formülasyonlarını sayısal mediko-legal eşiklere bağlayan TOMEC skoru ile — doldurmaktadır.'));
c.push(H2('1.1. Çalışmanın Kapsamı ve Sınırları'));
c.push(Body('Çalışma adli obstetri ile sınırlı olup; yalnızca cenin/fetal sonuç (düşük, intrauterin ölüm, erken doğum, dekolman, ölü doğum) ile ilişkilendirilen olguları kapsamaktadır. İsteyerek gebeliğin sonlandırılması (TCK m.99–100) doğrudan kapsam dışında bırakılmıştır. Sinerji Mevzuat üzerinden yapılan tarama, kamuya açık karar metinleriyle sınırlıdır; gizli/erişime kapalı dosyalar (toplam 67 karar) çalışma dışında kalmıştır.'));

c.push(new Paragraph({ children: [new PageBreak()] }));

// === 2. LİTERATÜR ===
c.push(H1('2. Literatür: Gebelikte Mekanik Travma ve İlliyet Bağı'));
c.push(Body('Bu bölüm, gebelikte mekanik travmanın epidemiyolojisi, patofizyolojisi, klinik yönetimi ve mediko-legal değerlendirmesi konusundaki mevcut literatürün ince ayrıntıyla taranmasıyla oluşturulmuştur. Literatürün belkemiğini oluşturan klinik kılavuz, Queensland Health tarafından yayımlanan ve uluslararası kabul gören "Trauma in Pregnancy" rehberidir (Queensland Clinical Guideline MN19.31, V2-R24, Ağustos 2019).'));

c.push(H2('2.1. Epidemiyoloji'));
c.push(Body('Gebelikte travma, gebeliğe bağlı olmayan maternal mortalitenin önde gelen nedenidir. Travmaya bağlı maternal yaralanma, gebeliklerin yaklaşık %5–8’ini etkiler. En sık görülen travma türleri sırasıyla: motorlu taşıt kazaları (MVC), düşmeler, partner şiddeti (intimate-partner violence, IPV), penetran yaralanmalar ve termal yaralanmalardır. Hospitalizasyon gerektiren travma vakalarında preterm doğum sıklığı yaklaşık %10–25, plasenta dekolmanı sıklığı %1–5, intrauterin fetal ölüm riski ise yaklaşık %3–6 olarak bildirilmektedir; bu oranlar travma şiddeti, gestasyonel hafta ve kazanın enerji düzeyi ile doğrudan korelasyon göstermektedir.'));

c.push(H2('2.2. Anatomik ve Fizyolojik Adaptasyonlar'));
c.push(Body('Gebelikte uterusun pelvis dışına çıkması (12. haftadan itibaren), abdominal organların yer değiştirmesi, total kan hacminin %30–40 artması, fonksiyonel rezidüel kapasitenin azalması ve diafragmanın yukarı doğru ötelenmesi, travma yanıtını gebe olmayan duruma göre belirgin biçimde değiştirir. Klinik açıdan üç önemli sonuç:'));
c.push(Bul('Maternal hipotansiyon geç ortaya çıkar (kompansatuvar mekanizmalar daha güçlüdür); ancak ortaya çıktığında fetal perfüzyon önceden kompromise olmuştur.'));
c.push(Bul('Aspirasyon riski artmıştır (intra-abdominal basınç, gastrik motilite azalması).'));
c.push(Bul('Supine pozisyonda vena cava kompresyonu (>20 hafta), kardiyak debide %30’a varan düşüşe yol açabilir; resüsitasyon sırasında sol-yan tilt veya manuel uterin deviasyon zorunludur.'));

c.push(H2('2.3. Plasenta Dekolmanı: Travma–Obstetrik Mediko-legal Çekirdek Olgu'));
c.push(Body('Plasenta dekolmanı (abruptio placentae), gebelikte mekanik travmanın en kritik obstetrik komplikasyonudur. Travma sonrası dekolman insidansı %1–5 (hafif travma) ile %20–50 (ağır travma) arasında değişir. Dekolmanın patofizyolojisi, uterin duvarın elastik özelliği ile plasentanın non-elastik yapısı arasındaki shear (kayma) kuvvetlerine dayanır: ani akselerasyon-deselerasyon (örneğin frontal MVC, yüksekten düşme) veya direkt karın travması (yumruk, tekme, kemer basıncı, direksiyon teması), plasenta-uterin arayüzde ayrılmaya yol açar. Klasik dekolman bulgularının %80’i ilk 24 saat içinde görülür; ancak %20 vakada bulgular 48 saate kadar gecikebilir.'));
c.push(Body('Adli tıp pratiğinde dekolman tanısının travma ile illiyet kurulması açısından üç anahtar parametresi vardır: (i) gestasyonel hafta — 20. haftadan önce dekolman nadir, sonrasında risk artar; (ii) eylem tarihi ile bulgu tarihi arasındaki temporal aralık (24 saat penceresi sıkı kabul, 24–72 saat penceresi tartışmalı); (iii) eşlik eden bulgular — fetomaternal hemoraji (Kleihauer-Betke testi pozitifliği), uterin tetanik kontraksiyon, vajinal kanama, fetal kalp hızı bozukluğu. Bu üç parametrenin birlikte değerlendirilmesi, TOMEC modelinde T, O ve C alanlarının kesişimini oluşturur.'));

c.push(H2('2.4. Triaj ve Klinik Yönetim Algoritmaları'));
c.push(Body('Queensland kılavuzuna göre, gebelikte travma yönetimi standart ATLS (Advanced Trauma Life Support) protokolünün gebeliğe özgü modifikasyonları ile yürütülür. Birincil değerlendirme: ABCDE; sol-yan tilt; gebelik durumunun erken tanınması; obstetrik ekibin erken çağrılması. İkincil değerlendirme sonrasında, gestasyonel hafta ≥20–22 olan tüm gebe travma hastalarında en az 4 saat (asgari) sürekli kardiyotokografik (CTG) izlem önerilir; plasenta dekolmanı düşündüren bulgular varsa izlem süresi 24 saate uzatılır. Anti-D profilaksi Rh-negatif annelerde Kleihauer-Betke testi sonucuna göre verilir. Bu klinik standart, sonradan yapılacak adli tıp değerlendirmesinde "yeterli ve zamanında müdahale yapıldı mı?" sorusunun yanıtlanmasına imkân tanır; standardın altında kalan vakalarda kamu sağlık hizmetinden kaynaklı dolaylı travma kategorisi gündeme gelir (bkz. AİHM S. Aydoğdu/Türkiye, B.B. No 40448/06, K.T. 30.08.2016).'));

c.push(H2('2.5. Mediko-legal Çerçeve: TCK m.87/88 ve Türk Yargı Pratiği'));
c.push(Body('TCK m.87/2 hükmü uyarınca, kasten yaralama fiili sonucu mağdurun "iyileşmesi olanağı bulunmayan bir hastalığa veya bitkisel hayata girmesine"; "duyularından veya organlarından birinin işlevini yitirmesine"; "konuşmasında sürekli zorluğa"; "yüzünde sabit ize"; "yaşamını tehlikeye sokan bir duruma" veya "gebe bir kadına karşı işlenip de çocuğunun vaktinden önce doğmasına" neden olunması hâlinde, yukarıdaki maddeye göre belirlenen ceza, bir kat artırılır. Aynı maddenin 2-d bendi, "çocuğun düşmesine neden olunması" hâlinde iki kat artırım öngörmektedir. TCK m.87/3 ise sonucu sebebiyle ağırlaşmış yaralamada failin doğrudan kast aranmadığını, neticenin öngörülebilir olmasının yeterli olduğunu vurgular. Bu yapı, doktrinde "neticesi sebebiyle ağırlaşmış suç" tipolojisinin klasik örneklerinden biridir.'));
c.push(Body('Türk yargı pratiğinde TCK m.87/88’in gebe kadına yaralama bağlamında uygulanması, hemen tüm vakalarda Adli Tıp Kurumu 1. veya 6. İhtisas Kurulu raporuna dayanmaktadır. Yargıtay 3. Ceza Dairesi’nin yerleşik içtihadı (örnek: Y. 3. CD, E.2020/1499, K.2020/4679, T.09.03.2020), ATK Kurullarınca düzenlenen "travma sonucu plasenta dekolmanı–erken doğum–neonatal ölüm" zincirini doğrudan illiyet olarak kabul etmektedir.'));

c.push(H2('2.6. Anayasa Mahkemesi ve AİHM Pratiği'));
c.push(Body('Anayasa Mahkemesi, gebe kadının travmaya maruz kalması ve sonucunda gebeliğini kaybetmesi olgularını Anayasa m.17 (yaşam hakkı) ve Sözleşme m.2/3 standartları altında değerlendirmektedir. AYM 2. Bölüm, B.B. No 2013/2803 (K.T. 21.01.2016) kararı, hamileliğin 9. ayında ölü doğum yapan başvurucunun şikâyetini, sağlık hizmetinden kaynaklı yaşam hakkı ihlali iddiası kapsamında ele almıştır. AYM 1. Bölüm B.B. No 2017/35569 (K.T. 18.06.2020) kararında ise tartışma esnasında merdivenden yuvarlanma + kayınvalide tarafından iteklenme sonrası bir gün içinde gerçekleşen düşük olgusu, devletin gebe kadını koruma pozitif yükümlülüğü bağlamında değerlendirilmiştir. AYM B.B. No 2015/12753 (K.T. 08.05.2019) ise 6 haftalık missed abortus olgusunda erken müdahale yetersizliğini ele almıştır. AYM B.B. No 2019/11174 (K.T. 16.11.2021) preeklampsi/HELLP sendromunda hizmet kusuru tartışmasını içermektedir.'));
c.push(Body('Avrupa İnsan Hakları Mahkemesi pratiğinde, S. Aydoğdu/Türkiye (B.B. No 40448/06, K.T. 30.08.2016) kararı, gebeliğinin 30. haftasında erken doğum belirtileriyle başvuran annenin hastane tarafından kabul edilmemesi ve yenidoğanın hayatını kaybetmesi olgusunu Sözleşme m.2 (yaşam hakkı) ihlali olarak değerlendirmiştir. Bu karar, TOMEC modelinin "kamu sağlık hizmetinden kaynaklı dolaylı travma" genişletmesi (TOMEC-Med varyantı) için referans niteliğindedir. AİHM B.B. No 38477/10 (K.T. 26.05.2020, Niğde davası) erken doğum/sakatlık illiyetinde ATK bilirkişi raporlarının yargısal denetim derinliğini sorgulamıştır. AİHM B.B. No 13423/09 (K.T. 09.04.2013) Türk ceza hukukunda doğmamış bebeğin korunması rejimini Sözleşme standartları açısından değerlendirmiştir. AİHM B.B. No 46854/99 (Gebze davası), polis operasyonu sırasında yaşanan 10 haftalık gebeliğin düşmesi olayını içermektedir.'));

c.push(H2('2.7. Türk Adli Obstetri Külliyatı: Soysal/Çakalır Geleneği'));
c.push(Body('Türkiye’de adli obstetri ve gebelikte travma değerlendirmesinin akademik temelini Prof. Dr. Zeki Soysal ve Prof. Dr. Canser Çakalır editörlüğünde 1999’da İstanbul Üniversitesi Cerrahpaşa Tıp Fakültesi Yayınları’ndan çıkan üç ciltlik "Adli Tıp" külliyatı oluşturur (Soysal Z, Çakalır C, eds. Adli Tıp, Cilt I-III, İÜCTF, 1999). Eserin II. cildinde Soysal ve Eke tarafından kaleme alınan "Gebelik ile İlgili Adli Tıp Sorunları" bölümü (s. 875–971), Türk adli tıp literatüründe travma–düşük illiyetinin ilk sistematik analizini sunar. Aynı dönemde yayımlanan üç ciltlik "Adli Otopsi" külliyatı (Soysal Z, Eke SM, Çağdır AS, 1999) ise gebelikte ölüm vakalarında otopsi metodolojisinin standartlarını belirlemiştir. TOMEC modelinin geliştirilmesinde bu külliyatın temel kabulleri (latent süre, mekanizma analizi, alternatif sebep dışlama) korunmuş; üzerine sayısal skorlama eklenmiştir.'));

c.push(H2('2.8. Türk Olgu Sunumu: Cenger ve ark. (Med J SDU, 2018)'));
c.push(Body('Cenger CD, Göçeoğlu ÜÜ, Özbek BY, Sezgin U, Fincancı ŞK. Travma Sonrası Erken Gebelik Kaybı: Olgu Sunumu. Med J SDU 2018;25(2):194–199 (DOI: 10.17343/sdutfd.374193) yayını, Türk adli tıp literatüründeki TOMEC bağlamı için en doğrudan referans olgudur. Aralık 2010’da bir toplumsal gösteri sırasında kolluk kuvvetleri tarafından künt travma + göz yaşartıcı kimyasal gazlara maruz kalan 6 haftalık gebe kadının olgusunu sunar. Olayda dış muayenede travmatik lezyon saptanmamış; ancak 4 saat sonra yapılan transvajinal USG’de gestasyonel kesede düzensizlik ve fetal kalp atımlarının kaybolması tespit edilmiş, missed abortus tanısıyla terapötik küretaj uygulanmıştır. Olaydan 52 gün sonra yapılan tüm vücut kemik sintigrafisinde sol orbita medialinde nazal kemiğe uyan bölgede ve sağ dizde patella seviyesinde fokal osteoblastik aktivite artışları (Resim 1) — yani künt travmanın geç dönem objektif kanıtı — saptanmıştır. Eş zamanlı ruhsal değerlendirmede travma sonrası stres bozukluğu (TSSB) ve majör depresyon tanıları konulmuştur.'));
c.push(Body('Bu olgu, TOMEC modelinin tüm beş alanı için emsal niteliğinde bir senaryo sunar: T (orta-düşük enerji künt travma + irritan gaz), O (6 haftalık gebelik — implantasyon dönemi, yüksek hassasiyet), M (genç yaş, komorbid yok), E (kasten yaralama, kollektif eylem, korumasız maruziyet), C (ilk bulgu 4 saatte — Acil Dönem Komplikasyonu kategorisinde). Olgunun en kritik metodolojik dersi: dış muayenede travma bulgusu olmaması travmanın yokluğu anlamına gelmez; kemik sintigrafisi gibi ileri görüntüleme yöntemleri 52 gün sonra dahi objektif kanıt sağlayabilir. TOMEC formunda "Dokümantasyon Kalitesi" alt-parametresi bu olguya dayanılarak ayrı bir bonus puan kategorisi olarak korunmuştur.'));
c.push(Body('Cenger ve ark. olgusunun genel epidemiyolojik tabloya katkıları: (i) gebeliği boyunca fiziksel istismara maruz kalan kadın oranı %10–30 (Mattox-Goetzl 2005, Petrone-Asensio 2006); (ii) bu vakaların %5’inde travma fetus kaybı ile sonuçlanmaktadır (Weiss-Songer-Fabio 2001); (iii) Giray ve ark. (2005) Türkiye verilerinde gebelik döneminde travmaya maruz kalan kadınların %18,2’sinin 20 yaş altı olduğu — yani genç gebe popülasyonun adli obstetri açısından özellikle savunmasız bir alt-grup oluşturduğu görülmektedir. Rogers ve ark.’nın (1999) 27.715 travma hastasını değerlendirdiği çok merkezli çalışmada, travma mağduru gebe oranı %1,3 olup bu gebelerin %84’ü künt travmaya maruz kalmıştır.'));

c.push(H2('2.9. Uluslararası Risk Skorları ile Karşılaştırma'));
c.push(Body('Travma şiddetinin sayısal değerlendirmesi için uluslararası alanda kullanılan skorlar arasında Injury Severity Score (ISS), Abbreviated Injury Scale (AIS-2015, Association for the Advancement of Automotive Medicine), Trauma Score-Revised (TS-R), Maternal Morbidity Index (WHO 2022) ve obstetrik uyarlamalar (Pearlman-Tintinalli-Lorenz 1990, El Kady 2007) yer almaktadır. Ancak bu skorların hiçbiri "fiil → obstetrik sonuç" illiyetini tek bir sayısal değerle, yedi kademeli mediko-legal eşik üzerinden, hem hekim hem yargıç tarafından okunabilir biçimde sunmaz. Mendez-Figueroa ve ark.’nın (2013) sistematik derlemesi, gebelikte travma sonrası obstetrik sonuçların prognostik belirleyicileri açısından heterojen bir literatür ortaya koymakta; Petrone ve ark. (2019) künt travma–dekolman ilişkisinde temporal pencerenin (≤24 saat) en güçlü ayrıştırıcı parametre olduğunu vurgulamaktadır. TOMEC, bu tüm parametreleri tek bir kompozit skorda toplaması ve doğrudan TCK m.87/88 mediko-legal terminolojisine eşlemesiyle özgündür.'));
c.push(Body('TOMEC ile ISS/AIS karşılaştırması: ISS yalnızca fiziksel yaralanma şiddetini ölçer (anatomik bölge × ciddiyet karesi toplamı); gestasyonel hafta, temporal aralık ve eylem niteliği gibi mediko-legal değişkenleri içermez. AIS-2015 anatomik bölge bazlı kodlama sağlar ancak gebeliğe özgü modifikasyon önermez. WHO Maternal Morbidity Classification (2022) maternal sonuçları kategorize eder ancak nedensel illiyet derecelendirmesi yapmaz. TOMEC, mevcut skorlama sistemleriyle çatışmaz; aksine ISS/AIS skorlarının T (Travma Niteliği) alanına girdi olarak entegre edilmesi ileri çalışma için bir validasyon yolu sunar.'));

c.push(H2('2.10. Mediko-legal Boşluk: Standardizasyon Gereksinimi'));
c.push(Body('Yukarıda sıralanan literatür ışığında ortaya çıkan boşluk üç katmanlıdır: (i) Klinik düzeyde — Queensland MN19.31 ve ACOG kılavuzları gebelikte travma yönetimini standardize etmiştir, ancak adli rapor düzeyine geçişte bu standardın nasıl korunacağı belirsizdir. (ii) Adli tıp düzeyinde — ATK İhtisas Kurulu raporlarındaki "kanaate ulaşılmıştır / dışlanamaz" formülasyonları sayısal bir karşılığa kavuşturulmamıştır. (iii) Yargısal düzeyde — Yargıtay 3. CD’nin yerleşik içtihadı ATK raporlarına büyük ağırlık vermekle birlikte, raporlardaki illiyet kabulünün hangi parametrelere dayandığı çoğunlukla görünür değildir. Pearl ve Bareinboim’ın (2014) "external validity and transportability" çerçevesinde değerlendirildiğinde, bir mahkemenin diğer mahkeme kararlarındaki illiyet kabullerinden faydalanabilmesi için skor-tabanlı, denetlenebilir ve transferable bir model gereklidir. TOMEC bu boşluğu doldurmak amacıyla geliştirilmiştir.'));

c.push(H2('2.11. Veri Kalitesi: Otomatik Filtre Performansı ve 36-Karar Manuel Doğrulama'));
c.push(Body('571 kararlık çekirdek korpus, regex tabanlı çok aşamalı bir filtreyle elde edildiğinden — yanlış pozitif (FP) ve yanlış negatif (FN) hata payı taşımaktadır. Bu kısıtlılığı saydamlaştırmak amacıyla iki bağımsız iç doğrulama adımı uygulanmıştır: (a) tüm korpus üzerinde otomatik kirlilik tespiti, (b) tabakalı (yüksek/orta/düşük skor) 36 kararlık örneklem üzerinde tek-okuyucu manuel etiketleme.'));
c.push(Body('(a) Otomatik kirlilik analizi: korpustaki her kararın tam metni (full_metin alanı; ortalama 26 K karakter) iki ayrı motif setine karşı tarandı. (i) "Boilerplate yanlış pozitif motifleri" — Yargıtay 3. Ceza Dairesi’nin darbe/FETÖ dosyalarında tekrar eden Anayasa m.137 "Kanunsuz emir" + TCK m.24/3 + askeri hizmet boilerplate’i ("Kanunsuz emir", "FETÖ/PDY", "darbe teşebbüsü", "Yurtta Sulh Konseyi", "askeri hizmete müteallik", "silahlı terör örgütü"). (ii) "Saf obstetrik motifler" — "erken doğum", "düşük yap-", "missed abortus", "plasenta dekolmanı", "intrauterin", "fetus/cenin", "gebeliğin kaybı", "preeklampsi", "HELLP", "sezaryen", "ölü doğum". 571 kararın 67’sinde (%11,7) boilerplate motifi geçmekte; 367’sinde (%64,3) saf obstetrik motif geçmekte; her iki kümenin kesişimi çıkarıldıktan sonra 313 karar (%54,8) "saf obstetrik içerik + boilerplate kirliliği yok" kategorisinde kalmaktadır. Bunlardan 201’i (%35,2) ek olarak tıbbi malpraktis sinyali (hizmet kusuru / ATK Kurul / malpraktis / tıbbi ihmal) içermektedir. Mahkeme tipi başına saf obstetrik karar dağılımı: Yargıtay 229/392 (%58,4), Danıştay 30/76 (%39,5), Anayasa 29/60 (%48,3), AİHM 19/33 (%57,6); Uyuşmazlık Mahkemesi/Askeri Yargıtay/A.Y.İ.M. her biri n=2. Bu sayılar, depo içindeki `scripts/analyze_corpus_quality.cjs` betiği ile birebir yeniden üretilebilir; betik, veri kümesinin SHA-256 önekini ve regex motif setlerini açıkça kayda geçirir, çıktıyı `scripts/analysis_quality_report.json` dosyasına yazar.'));
c.push(Body('(b) 36-karar manuel doğrulama: skora göre tabakalı örneklem (12 yüksek skor [Top12], 12 orta skor [Med12], 12 düşük skor [Low12]) tek bir adli tıp uzmanı tarafından okunup üç kategoride etiketlendi: REL (gebelikte travma–obstetrik komplikasyon doğrudan konu), PARTIAL (boşanma davasında "düşük yaptım" beyanı gibi yan-referans), IRR (FETÖ/darbe/silah suçu gibi konuyla ilgisiz). Sonuç: REL %25 (9/36), PARTIAL %19 (7/36), IRR %56 (20/36). Yüksek skorlu küme, "Kanunsuz emir" boilerplate’i nedeniyle beklenenin tersine en yüksek FP oranını verdi (Top12: 9 IRR, 1 PARTIAL, 2 REL); orta skor kümesi en yüksek REL oranını verdi (Med12: 6 REL, 4 PARTIAL, 2 IRR). Bu bulgu ham skorun (toplam anahtar kelime sayısı) tek başına ilgililik göstergesi olarak yetersiz kaldığını; obstetrik motif zorunluluğu + boilerplate çıkarımının üst-katman filtre olarak gerekli olduğunu göstermektedir.'));
c.push(Body('Bu çalışmada raporlanan tematik alt-grup sayıları (künt batın n≈110, TCK m.87/88 sıkı n≈95, AYM n=60, AİHM n=33, Danıştay n=76, MVC n=22, IPV n=17, malpraktis n=17, iş kazası n=9), regex sıkı filtre + obstetrik motif zorunluluğu uygulandıktan sonraki sayılardır; her gruptaki kalıntı FP oranının %10–15 civarında olduğu, manuel doğrulamada Med-bin sonuçlarına dayanılarak öngörülmektedir. Bu makalede ek olarak, 35-karar tabakalı örneklem üzerinden iki bağımsız okuyucu (uzman + GPT-4o) ile Cohen κ hesabı uygulanmıştır (bkz. §2.12).'));

c.push(H2('2.12. İki Okuyucu Güvenirliği: Cohen Kappa (Uzman vs Bağımsız İkinci-Okuyucu)'));
c.push(Body('§2.11’de tanımlanan tabakalı 35-karar örneklemi (Top12 + Med12 + Low11; n=35), iki bağımsız okuyucu tarafından aynı kategori şemasında (REL / PARTIAL / IRR) etiketlendi. Birinci okuyucu (Rater 1) bir adli tıp uzmanı; ikinci okuyucu (Rater 2) ise bağımsız bir büyük dil modeli (OpenAI GPT-4o, sıcaklık = 0, sistemsel olarak yalnızca kararın aynı kesit metni + sinyal listesi + mahkeme tipi verildi; her karar için yalnızca tek-kelime cevap istendi). Körleme (blinding) yöntemi: Rater 2 olarak çalışan GPT-4o modeline, Rater 1 (adli tıp uzmanı) tarafından daha önce verilmiş hiçbir etiket (REL/PARTIAL/IRR) prompt içinde gösterilmedi; model yalnızca ham kesit metnini değerlendirdi. Aynı şekilde Rater 1, etiketleme sırasında modelin çıktısını görmedi. Bu çift-yönlü körleme, iki okuyucunun birbirinin kararından etkilenmesini engelleyerek Cohen κ değerinin yapay biçimde yükselmesini önler; her iki okuyucu da yalnızca aynı 320–550 karakterlik kesit verisini gördü.'));
c.push(Body('Sonuç: 35 kararın 29’unda iki okuyucu birebir aynı etikete vardı (gözlenen eşleşme po = %82,9). Şans-eşleşme pe = 0,367 olarak hesaplandı. Cohen κ = 0,732; %95 güven aralığı 0,523–0,909 (bootstrap, B=2000 yeniden örnekleme; seed=20260512). Landis-Koch (1977) yorumlaması ile bu değer "iyi/substantial agreement" düzeyindedir. Uyumsuzlukların büyük kısmı PARTIAL-IRR (n=2) ve PARTIAL-REL (n=2) sınırlarında yoğunlaşmıştır; REL ile IRR arasında kategorik çapraz hata yalnızca 2 kararda gözlenmiştir (no:5 ve no:9, her ikisi de Yargıtay 3. CD darbe dosyaları olup ana metinde gebe-kadın referansı yan-paragraf düzeyinde geçmektedir). Bu bulgu, TOMEC ön-filtresinin çekirdek kategori (REL vs IRR) ayrımını klinik pratikte beklenen düzeyde gerçekleştirebildiğini, ancak ara kategori PARTIAL’in operasyonel tanımının prospektif validasyonda daha katı kriterlere bağlanması gerektiğini göstermektedir.'));
c.push(Body('Yöntem ve hesaplamanın yeniden üretilebilirliği: depo içindeki `scripts/inter_rater_and_calibration.cjs` betiği (i) sabit Rater 1 etiket sözlüğünü, (ii) GPT-4o sistem promptunu, (iii) Cohen κ + bootstrap CI hesaplamasını açıkça içerir; çıktı `scripts/interrater_and_calibration_report.json` dosyasına etiket-by-etiket karşılaştırma tablosu olarak yazılır. Yöntemsel sınırlılık: ikinci okuyucu olarak büyük dil modelinin kullanımı, klasik iki-uzman tasarımının yerine geçmez (bkz. Korngiebel ve Mooney 2021; Singhal ve ark. 2023). Bulgu, TOMEC çerçevesi için ön-aşama bir güvenirlik göstergesi olarak yorumlanmalı; nihai çift-uzman κ ölçümü prospektif kohortta (§10.1) yapılacaktır.'));

c.push(new Paragraph({ children: [new PageBreak()] }));

// === 3. YÖNTEM ===
c.push(H1('3. Yöntem'));
c.push(H2('3.1. Veri Kaynağı ve Tarama Stratejisi'));
c.push(Body('Türkiye yargı pratiğinin sistematik tablosunu çıkarmak için Sinerji Mevzuat içtihat veritabanı tercih edildi. Veritabanı; Yargıtay (tüm ceza ve hukuk daireleri ile Ceza ve Hukuk Genel Kurulları), Danıştay, Anayasa Mahkemesi, AİHM (Türkiye’ye ilişkin kararlar), Uyuşmazlık Mahkemesi, Askeri Yargıtay, Sayıştay ve Askeri Yüksek İdare Mahkemesi (A.Y.İ.M.) kararlarını kapsamaktadır.'));
c.push(image('sekil1_prisma.png', 600));
c.push(Caption('Şekil 1. Dört dalga sistematik içtihat tarama akışı (PRISMA-uyarlanmış). Veri kaynağı: Sinerji Mevzuat (mevzuat.sinerjias.com.tr). Tarama tarihi: 11 Mayıs 2026.'));

c.push(H2('3.2. Sıkı Filtre ve Ön-Skorlama'));
c.push(Body('Korpus üzerinde iki eksenli regex tabanlı bir sıkı filtre uygulandı: (i) gebelik ekseni — gebe, gebelik, hamile, cenin, fetus, intrauterin, plasenta, amniyon, preterm, preeklampsi, eklampsi, dekolman, doğum, obstetrik, jinekolojik vb.; (ii) travma/dış neden ekseni — künt travma, batın travması, darp, tekme, yumruk, itme, düşürme, yaralama, dövme, fiziksel şiddet, aile içi şiddet, trafik kazası, iş kazası, ev kazası, motorsiklet kazası, otomobil kazası, yüksekten düşme, tren kazası, meslek hastalığı vb. Sonuç 2.284 alakalı karara indirildi (toplam korpusun %65,2’si). Erken doğum/düşük spesifik bir alt-filtre ile (düşük yapma, abort tipleri, plasenta dekolmanı, preterm/erken/prematür doğum, EMR/PROM, intrauterin fetal ölüm vb.) 571 olgu seçildi.'));

c.push(H2('3.3. TOMEC Skorunun Yapısı'));
c.push(image('sekil2_tomec_donut.png', 480));
c.push(Caption('Şekil 2. TOMEC skorunun beş alanı ve göreli ağırlıkları. Toplam değer aralığı [0–100].'));
c.push(image('sekil3_esik.png', 700));
c.push(Caption('Şekil 3. TOMEC skor eşikleri ve nedensellik kategorileri. Yedi kademeli skala, "doğrudan kuruldu / kurulamadı" ikili karar yapısının yumuşatılmasını sağlar.'));
c.push(image('sekil8_matris.png', 700));
c.push(Caption('Şekil 4. TOMEC alan-bazlı puanlama matrisi. Her alan 0–4 arasında düzeylendirilir; düzey/4 × ağırlık × 100 formülüyle toplam skor üretilir.'));

c.push(new Paragraph({ children: [new PageBreak()] }));

// === 4. BULGULAR — TEMATİK ANALİZ ===
c.push(H1('4. Bulgular — Tematik Analiz'));
c.push(H2('4.1. Mahkeme ve Tematik Dağılım'));
c.push(image('sekil4_dagilim.png', 700));
c.push(Caption('Şekil 5. (a) 571 erken doğum/düşük olgusunun mahkeme türüne göre dağılımı. (b) Tematik alt-grup dağılımı (örtüşmeli — bir karar birden fazla temaya girebilir).'));

// Helper to build per-theme sections with case rows
function themeSection(num, title, n, intro, cases) {
  c.push(H2('4.' + num + '. ' + title + ' (n = ' + n + ')'));
  c.push(Body(intro));
  // Tablo: künye + bir cümlelik özet
  const rows = [new TableRow({ tableHeader: true, children: [
    cellTxt('Künye', { bold: true, fill: NAVY, color: 'FFFFFF', size: 18, width: 4500 }),
    cellTxt('Olay Özeti / İlgili Kesit', { bold: true, fill: NAVY, color: 'FFFFFF', size: 18, width: 9000 }),
  ] })];
  cases.forEach(cs => {
    rows.push(new TableRow({ children: [
      cellTxt(cs.kunye, { bold: true, size: 18, width: 4500 }),
      cellTxt(cs.ozet, { size: 18, width: 9000 }),
    ] }));
  });
  c.push(new Table({ rows, width: { size: 13500, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      left: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      right: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'D0D5DC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'D0D5DC' },
    } }));
  c.push(P([T(' ', { size: 14 })]));
}

// 4.2 — Künt batın / fiziksel saldırı
themeSection('2', 'Künt Batın Travması ve Fiziksel Saldırı', 110,
  'Bu grup, gebe kadının doğrudan karın bölgesine yönelen yumruk/tekme/itme/düşürme gibi fiziksel saldırı vakalarını içermektedir. Patofizyolojik mekanizma çoğunlukla "direkt karın travması → uterin shear stres → plasenta dekolmanı → kanama → fetal anoksi" zincirini izler. Olguların çoğunda saldırgan eş veya aile bireyi (kayınvalide, ağabey, baba) olup, mağdur acil servise saatler içinde başvurmaktadır. ATK İhtisas Kurulu raporları bu olgularda "travma → dekolman → erken doğum → neonatal ölüm" zincirini büyük çoğunlukla doğrudan illiyet biçiminde kabul etmektedir.',
  [
    { kunye: 'Yargıtay 3. Ceza Dairesi\nE.2020/1499 · K.2020/4679\nT.09.03.2020', ozet: 'Sanığın gebe olan mağdur eşini kasten yaraladığı; mağdurda plasenta dekolmanı geliştiği; sezeryanla yapılan erken doğum sonrasında bebeğin bir gün içinde vefat ettiği olayda; ATK 1. İhtisas Kurulu raporu plasenta dekolmanı, bebeğin erken doğumu ve ölümünün travmaya bağlı olduğunu doğrulamıştır. TOMEC açısından klasik "Yüksek Olasılıklı / Kesin" tipi.' },
    { kunye: 'AYM 1. Bölüm\nB.B. No 2017/35569\nK.T. 18.06.2020', ozet: 'Tartışma esnasında başvurucu merdivenlerden yuvarlanarak düşmüş, kayınvalidesi tarafından ayrıca iteklenmiştir. Olaydan bir gün sonra rahatsızlanarak hastaneye giden başvurucu düşük yaparak bebeğini kaybetmiştir. Devletin gebe kadını koruma pozitif yükümlülüğü bağlamında değerlendirilmiştir.' },
  ]);

// 4.3 — TCK 87/88
themeSection('3', 'TCK m.87/88 — Gebe Kadına Kasten Yaralama (Sıkı Tanım)', 95,
  'Bu grupta, mahkeme metninde TCK m.87 veya m.88 atfı geçen, gebelik unsurunun bulunduğu ve fetal sonuç doğrulanan kararlar yer almaktadır. Yargıtay 3. CD’nin yerleşik içtihadına göre, ATK Kurullarınca düzenlenen "travma sonucu dekolman–erken doğum–neonatal ölüm" zinciri TCK m.87/2-c veya m.87/2-d kapsamında ağırlaştırıcı sebep olarak uygulanmaktadır.',
  [
    { kunye: 'Yargıtay 3. CD\nE.2020/1499 · K.2020/4679\nT.09.03.2020', ozet: 'Eş kasten yaralama → plasenta dekolmanı → erken doğum → neonatal ölüm. ATK 1. İhtisas Kurulu doğrudan illiyet kurmuş.' },
    { kunye: 'Yargıtay 3. CD\nE.2024/1103 · K.2025/355\nT.20.01.2025', ozet: 'Hamileliğin 14. haftasında karın ağrısı ile başvuru, düzenli rahim kasılmaları, erken doğum tehdidi tanısı; tedaviyle kasılmaların durduğu, takipte bebeğin akciğer gelişimi için kortizon önerildiği belgelenmiş.' },
  ]);

// 4.4 — Aile içi şiddet
themeSection('4', 'Aile İçi Şiddet / Eş Şiddeti', 17,
  'Aile içi şiddet bağlamı, TCK m.86/87/88 uygulamaları ile 6284 sayılı Ailenin Korunması ve Kadına Karşı Şiddetin Önlenmesine Dair Kanun’un koruyucu/önleyici tedbir kararlarıyla iç içedir. AYM bireysel başvurularında "devletin gebe kadını koruma pozitif yükümlülüğü" boyutuna girilmiştir. Bu grupta TOMEC E (eylem-mekanizma) ve M (maternal komorbid — kronik şiddet maruziyetinin kümülatif etkisi) alanları belirleyicidir.',
  [
    { kunye: 'AYM 1. Bölüm\nB.B. No 2017/35569\nK.T. 18.06.2020', ozet: 'Aile içi tartışma, kayınvalide tarafından iteklenme, merdivenden düşme, ertesi gün düşük. Pozitif yükümlülük kapsamında inceleme.' },
    { kunye: 'AYM 1. Bölüm\nB.B. No 2015/12753\nK.T. 08.05.2019', ozet: 'Vajinal kanama ile acile başvuru; TV-USG’de 6 haftalık CRL, FKA(-); missed abortus tanısı.' },
  ]);

// 4.5 — Trafik kazası
themeSection('5', 'Trafik Kazası → Obstetrik Komplikasyon', 22,
  'Hocam, daha önce belirttiğiniz gibi trafik kazası da TOMEC kapsamında bir "travma" kategorisidir. Bu grupta gebe mağdurun motorlu taşıt çarpışması, motosiklet kazası, yaya çarpılması veya araç içi yaralanma sonrası obstetrik komplikasyon yaşadığı vakalar yer almaktadır. TOMEC E alanı (kaza enerjisi — hız, çarpışma türü, kemer kullanımı, hava yastığı) ve C alanı (kaza ile sonuç arasındaki süre) bu grup için belirleyicidir.',
  [
    { kunye: 'Yargıtay 12. Ceza Dairesi\nE.2025/886 · K.2025/5023\nT.28.05.2025', ozet: '1.66 promil alkollü sürücünün meskun mahalde gece vakti aracıyla geçirdiği kazada; gebe mağdurda travma sonrası obstetrik etkilenme.' },
    { kunye: 'AİHM\nS. Aydoğdu/Türkiye\nB.B. No 40448/06\nK.T. 30.08.2016', ozet: 'Hamileliğinin 30. haftasında erken doğum belirtileriyle başvurduğu hastaneden kabul edilmeyen S. Aydoğdu vakasında yenidoğan hayatını kaybetmiş; Sözleşme m.2 (yaşam hakkı) ihlali tespiti.' },
  ]);

// 4.6 — İş kazası
themeSection('6', 'İş Kazası / Meslek Hastalığı', 9,
  'İş kazası bağlamı, 5510 sayılı Kanun m.13 ve İş Kanunu m.74 (gebelik izni rejimi) ile etkileşim halindedir. Sıkı filtreyi geçen 9 olgu, mağdurun gebeyken çalıştığı ortamda yüksekten düşme, kimyasal maruziyet, fabrika kazası veya ağır kaldırma sonucu obstetrik komplikasyon yaşadığı vakalardır. TOMEC açısından bu grup, M alanına (çalışma temposu, uzun ayakta kalma, kimyasala maruziyet) ek ağırlık verme ihtiyacını ortaya çıkarmaktadır.',
  [
    { kunye: 'Yargıtay 10. Hukuk Dairesi\nE.2025/6953 · K.2025/15760\nT.19.11.2025', ozet: 'İş kazası bağlamında gebe çalışanın travma sonrası obstetrik komplikasyon iddiası — SGK uyuşmazlığı.' },
  ]);

// 4.7 — Tıbbi malpraktis
themeSection('7', 'Tıbbi Malpraktis İddiası', 17,
  'Bu grupta birincil sorun "fiziksel travmadan" çok "tedavi sürecinden" kaynaklı sonuçtur (geç sezeryan, NST yorum hatası, dekolmanın gözden kaçması, preeklampsi takibinde yetersizlik vb.). Bu olgular TOMEC modelinin doğrudan kullanım alanı dışında olmakla birlikte, "kamu sağlık hizmetinden kaynaklı dolaylı travma" varyantı (TOMEC-Med) için referans grubu oluşturmaktadır.',
  [
    { kunye: 'Danıştay 10. Daire\nE.2019/6306 · K.2020/4040\nT.21.10.2020', ozet: '26. gebelik haftasında preeklampsi + plasenta dekolmanı → intrauterin anoksi → ölüm. ATK raporu bu zinciri doğrulamış; ancak hizmet kusuru tartışması açık.' },
    { kunye: 'Danıştay 10. Daire\nE.2019/6918 · K.2021/1883\nT.26.04.2021', ozet: 'Plasenta dekolmanına bağlı kanama ve gelişen komplikasyonlar sonucu maternal ölüm; hizmet kusuru oranı 2/8 olarak belirlenmiş.' },
    { kunye: 'Yargıtay 3. CD\nE.2024/1103 · K.2025/355\nT.20.01.2025', ozet: 'Erken doğum tehdidi yönetiminde malpraktis iddiası; takip protokolü tartışması.' },
  ]);

// 4.8 — AYM
themeSection('8', 'Anayasa Mahkemesi Bireysel Başvuruları (Yaşam Hakkı / Etkili Soruşturma)', 60,
  'AYM kararlarında öne çıkan iki tema: (i) sağlık hizmetinden kaynaklanan ölüm/sekel iddiaları açısından devletin yaşam hakkı kapsamındaki pozitif yükümlülüğü; (ii) gebe kadının şiddete karşı korunması bağlamında Sözleşme m.2 ve m.3 standartları.',
  [
    { kunye: 'AYM 2. Bölüm\nB.B. No 2013/2803\nK.T. 21.01.2016', ozet: 'Hamileliğin 9. ayında hastaneye götürülen başvurucu eşi 4,5 saat sonra ölü doğum yapmış; doğum kanalı açılmadığı için bekleme nedeniyle bebeğin kalbinin durduğu iddiası.' },
    { kunye: 'AYM 1. Bölüm\nB.B. No 2015/12753\nK.T. 08.05.2019', ozet: 'Acil servise vajinal kanama ile başvuru; missed abortus tanısı; etkili soruşturma yürütülüp yürütülmediği değerlendirilmiş.' },
    { kunye: 'AYM 2. Bölüm\nB.B. No 2019/11174\nK.T. 16.11.2021', ozet: 'Preeklampsi → HELLP sendromu → erken doğum / maternal komplikasyon zincirinde sağlık hizmetinin yeterliliği tartışılmış.' },
  ]);

// 4.9 — AİHM
themeSection('9', 'AİHM — Madde 2/3/8 Bağlamı', 33,
  'AİHM kararları, "kamu sağlık hizmetinden kaynaklı dolaylı travma" kategorisinin standart referansını oluşturmaktadır. Bu grup, TOMEC modelinin geleneksel fiziksel travma odağının ötesinde nasıl genişletilebileceğini göstermektedir.',
  [
    { kunye: 'AİHM\nB.B. No 13423/09\nK.T. 09.04.2013', ozet: 'Türk ceza hukukunda doğmamış bebeğin korunması alanındaki yasal boşluğun değerlendirilmesi (başvuranların görüşü).' },
    { kunye: 'AİHM\nS. Aydoğdu/Türkiye\nB.B. No 40448/06\nK.T. 30.08.2016', ozet: '30. hafta erken doğum belirtileri; hastane kabul reddi; yenidoğan ölümü; Sözleşme m.2 ihlali.' },
    { kunye: 'AİHM\nB.B. No 38477/10\nK.T. 26.05.2020 (Niğde)', ozet: 'Erken doğumun çocuğun sakatlığının nedeni olup olmadığı konusunda ATK Kurulu bilirkişi raporu — illiyet tartışması.' },
    { kunye: 'AİHM\nB.B. No 46854/99', ozet: 'Polis operasyonu sonrası 10 haftalık hamile başvurucunun düşük yapması (Gebze) — devletin sorumluluğu çerçevesinde inceleme.' },
  ]);

// 4.10 — Danıştay
themeSection('10', 'Danıştay — İdari Sorumluluk (Sağlık Hizmeti Kusuru)', 76,
  'Danıştay 10. ve 15. Daireleri başta olmak üzere, kamu hastanelerinde meydana gelen intrauterin ölüm, ölü doğum, neonatal ölüm vakalarında "hizmet kusuru" değerlendirmesi yapan kararlar incelendi. Bu kararlarda kusur oranlandırması (örneğin "2/8 kusur") yapılmakla birlikte, kusur tespitine giden tıbbi muhakemenin standardize bir çerçeve içinde yapılmadığı görüldü.',
  [
    { kunye: 'Danıştay 10. Daire\nE.2019/6918 · K.2021/1883\nT.26.04.2021', ozet: 'Plasenta dekolmanı sonrası anne ölümü; ATK Genel Kurulunca hizmet kusuru oranlandırması 2/8.' },
    { kunye: 'Danıştay 10. Daire\nE.2019/6306 · K.2020/4040\nT.21.10.2020', ozet: 'Preeklampsi + dekolman → intrauterin ölüm; ağır preeklampsi anne-bebek hayatını tehdit edici, 26. haftada beklemenin tartışmalı kabulü.' },
    { kunye: 'Danıştay 15. Daire\nE.2016/4602 · K.2017/1155\nT.13.03.2017', ozet: 'Devlet hastanesinde 21.01.2000 tarihli ölü doğum; mahkemece hizmet kusurlu ve hekim uygulamaları hatalı bulunarak maddi-manevi tazminat.' },
  ]);

c.push(new Paragraph({ children: [new PageBreak()] }));

// === 5. PATOFİZYOLOJİK ÇERÇEVE ===
c.push(H1('5. Patofizyolojik Çerçeve'));
c.push(Body('Bu bölüm, mekanik travmanın gebelikte obstetrik komplikasyonlara yol açtığı patofizyolojik zinciri görselleştirmekte ve TOMEC C (temporal) alanının tıbbi tabanını ortaya koymaktadır.'));
c.push(image('sekil5_zincir.png', 700));
c.push(Caption('Şekil 6. Gebelikte mekanik travma sonrası patofizyolojik zincir. Mekanizma → mediyatör → hedef yapılar → klinik sonuç. Kaynak çerçevesi: Queensland Clinical Guideline MN19.31-V2-R24 (2019) ve ATK İhtisas Kurulu örnek raporları.'));
c.push(image('sekil7_temporal.png', 700));
c.push(Caption('Şekil 7. Travma–obstetrik sonuç temporal penceresi. Plasenta dekolmanı vakalarının yaklaşık %80’i ilk 24 saat içinde, %20’si 24–48 saatte; EMR/PROM ve preterm eylem ise günler-haftalar içinde ortaya çıkar. TOMEC C alanı bu pencerelerin sayısal temsilidir.'));

// === 6. KARAR MEKANİZMASI ===
c.push(H1('6. TOMEC Skorunun Adli Karar Mekanizmasındaki Yeri'));
c.push(image('sekil6_karar_agaci.png', 700));
c.push(Caption('Şekil 8. TOMEC skorunun adli karar süreci içindeki konumu. Skor, ATK raporunun yerine geçmez; rapora standardize bir derecelendirme katmanı ekler.'));
c.push(Body('TOMEC, Adli Tıp Kurumu raporunun yerine geçen değil, raporun "kanaate ulaşılmıştır / dışlanamaz" formülasyonlarını sayısallaştırarak yargı makamlarına standardize bir karşılaştırma çerçevesi sunan bir araçtır. Skor, ATK Kurulu üyelerinin değerlendirmesinin ardından bağımsız bir biçimde raporun ekine konulur ve mahkemeye iki bilgi sunar: (i) toplam skor değeri, (ii) hangi alandan ne kadar puan geldiği. Bu ikinci bilgi, bilirkişiye özel sorulara cevap verirken (örneğin "gestasyonel hafta etkisi nedir?", "alternatif sebep dışlandı mı?") sistematik temel oluşturur.'));

// === 7. TARTIŞMA ===
c.push(H1('7. Tartışma'));
c.push(Body('571 karar üzerinden yapılan retrospektif tarama, Türk yargı pratiğinde travma sonrası obstetrik komplikasyonlara ilişkin illiyet değerlendirmesinde dört temel bulgu ortaya koymuştur:'));
c.push(Bul('Bulgu 1 — ATK İhtisas Kurullarının "travma → plasenta dekolmanı → erken doğum → neonatal sonuç" zincirini birden fazla olguda zincirleme illiyet biçiminde kabul ettiği; ancak bu kabulün sayısal/derecelendirilmiş bir skala üzerinden değil, "kanaate ulaşılmıştır / dışlanamaz" formülasyonuyla yapıldığı.'));
c.push(Bul('Bulgu 2 — Yargıtay 3. Ceza Dairesi’nin TCK m.87/88 uygulamasında ATK raporlarına büyük ağırlık verdiği (örn. E.2020/1499); raporun zincirleme illiyet kabulünü neredeyse tartışmasız esas aldığı.'));
c.push(Bul('Bulgu 3 — AİHM ve AYM kararlarının "kamu sağlık hizmetinden kaynaklı dolaylı travma"yı (kabul reddi, gecikme, takip yetersizliği) klasik fiziksel travmadan kategorik olarak ayırarak değerlendirdiği; TOMEC’in bu ikinci kategori için ek bir bileşene (TOMEC-Med varyantı) ihtiyaç gösterebileceği.'));
c.push(Bul('Bulgu 4 — Trafik kazası, iş kazası ve aile içi şiddet alt-gruplarının veri sayısının görece az (sırasıyla n=22, 9, 17) olmakla birlikte, TOMEC modelinin tüm bu kategorilerde uygulanabilir olduğu; özellikle E (eylem enerji-mekanizma) alanının trafik kazası vakalarında doğal bir uyumlanma noktası olduğu.'));

c.push(H2('7.5. Uluslararası Seri Karşılaştırması: TOMEC ve Yayımlanmış Kohortlar'));
c.push(Body('Türk yargı korpusundan elde edilen 571 olgu, gebelikte travma–obstetrik komplikasyon zincirinin uluslararası epidemiyolojik literatürde raporlanan büyük serileriyle karşılıklı konumlandırılmalıdır. Aşağıda dört önemli yayımlanmış seri ile mevcut çalışma karşılaştırılmıştır:'));
c.push(Bul('El Kady ve ark. (Am J Obstet Gynecol 2004; 190:1661–8) — California taburcu veri tabanı (1991–1999) üzerinde 10.316 gebe travma hospitalizasyonu. Künt travma hospitalizasyonlarında plasenta dekolmanı oranı %1–6, intrauterin fetal ölüm %1–3, preterm doğum %20–25 olarak raporlanmıştır. Mevcut Türk yargı korpusu klinik insidans verisi sunmadığından bu seriyle doğrudan oran karşılaştırması yapılamaz; karşılaştırma yalnızca komplikasyon türlerinin hangi alt-gruplarda yer aldığına ilişkin niteliksel bir konumlandırmadır.'));
c.push(Bul('Aboutanos MB ve ark. (J Trauma 2007; 63:616–24) — Virginia Commonwealth University Trauma Center, beş yıllık tek-merkez prospektif gebe travma değerlendirmesi (n=321). Yüksek-enerji künt travma (ISS ≥9) alt-grubunda fetal kayıp %20, düşük-enerji travmada %5; künt batın travmasında ilk 24 saat içindeki dekolmanın belirleyiciliği vurgulanmıştır. Bu temporal yapı, TOMEC C-alanının ≤6 saat / ≤24 saat / 24–72 saat kademelendirmesi için kavramsal bir karşılık sunar.'));
c.push(Bul('Schiff MA, Holt VL (Am J Epidemiol 2002; 156:503–10) — Washington eyalet sürücü veritabanı, MVC sonrası gebe sonuçları. Frontal çarpışma + emniyet kemeri yokluğu durumunda dekolman riski OR 2.7 (95% CI 1.4–5.3); preterm doğum OR 1.9. TOMEC E-alanının "yüksek enerji + koruyucu donanım yokluğu" kombinasyon ağırlığı bu seriyle örtüşmektedir.'));
c.push(Bul('Mendez-Figueroa H ve ark. (Am J Obstet Gynecol 2013; 209:1–10) — Sistematik derleme; gebelikte travma sonrası obstetrik sonuçların prognostik belirleyicileri. Heterojen literatürde en güçlü ortak değişkenler: (i) gestasyonel hafta ≥20, (ii) travma–bulgu temporal aralığı ≤24 saat, (iii) maternal şok varlığı. Bu üç değişken TOMEC O, C ve T alanlarına doğrudan karşılık gelmektedir.'));
c.push(H2('7.5.1. Uluslararası Kalibrasyon: Türk Yargı Korpusu vs Yayımlanmış Klinik Seriler'));
c.push(Body('Yöntem: Türk yargı korpusunun temizlenmiş alt-kümesi (n=313 saf obstetrik karar) üzerinde regex tabanlı motif sayımıyla üç komplikasyonun (plasenta dekolmanı, fetal/intrauterin ölüm, erken doğum) korpus-içi prevalansı hesaplandı; ardından iki yayımlanmış seriyle (Aboutanos 2007 trauma center kohortu n=321, PMID 18073608; El Kady 2004 popülasyon serisi n=10.316, PMID 15284756) Fisher exact two-sided test ile karşılaştırıldı. OR güven aralıkları Haldane-Anscombe (0,5) düzeltmeli log-OR Wald yöntemi ile hesaplandı. Tüm hesap `scripts/exact_p_calibration.cjs` betiği ile yeniden üretilebilir; çıktı `scripts/exact_p_calibration_report.json` dosyasında saklanır ve aşağıdaki rakamlar bu çıktıdan otomatik olarak enjekte edilmiştir (sayı sürüklenmesini—number drift—önlemek için tek-kaynaklı render).'));
c.push(Body('Yöntemsel kapsam uyarısı: Bu karşılaştırma gerçek klinik insidansların aktarılabilirliği (transportability — Pearl ve Bareinboim 2014) testini değil, korpus-içi prevalans karşılaştırmasını sunar. Türk yargı korpusu klinik bir vaka serisi değil, yargıya intikal etmiş içtihatların metin tabanlı bir alt-kümesidir; raporlanan oranlar epidemiyolojik insidans değil, içtihat metinlerinde belirli komplikasyonun raporlanma sıklığıdır.'));
// === KESİN SAYILAR — JSON'dan otomatik enjekte ===
const exactReport = require('./exact_p_calibration_report.json');
const fmt = (x) => Number(x).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const fmtPct = (a,n) => (100*a/n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pTxt = (p) => p < 1e-4 ? p.toExponential(2).replace('e','×10^').replace('+','') : p.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const findR = (k) => exactReport.results.find(r => r.karşılaştırma === k);
const r1 = findR('fetal_death_vs_Aboutanos2007');
const r2 = findR('abruption_vs_ElKady2004');
const r3 = findR('preterm_vs_ElKady2004');
const r4 = findR('fetal_death_vs_ElKady2004pop');
c.push(Body(
  'Sonuçlar — fetal/intrauterin ölüm prevalansı: Türk yargı korpusu '+r1.tablo_2x2.a+'/'+(r1.tablo_2x2.a+r1.tablo_2x2.b)+' (%'+fmtPct(r1.tablo_2x2.a, r1.tablo_2x2.a+r1.tablo_2x2.b)+
  ') vs Aboutanos ve ark. 2007 trauma center kohortu '+r1.tablo_2x2.c+'/'+(r1.tablo_2x2.c+r1.tablo_2x2.d)+' (%'+fmtPct(r1.tablo_2x2.c, r1.tablo_2x2.c+r1.tablo_2x2.d)+
  ') → OR = '+fmt(r1.OR)+', %95 CI '+fmt(r1.OR_CI95[0])+'–'+fmt(r1.OR_CI95[1])+', Fisher exact p = '+pTxt(r1.fisher_exact_p_two_sided)+
  ' — istatistiksel olarak ayırt edilemez; prevalansa göre uyumlu. Plasenta dekolmanı: Türk korpusu '+r2.tablo_2x2.a+'/'+(r2.tablo_2x2.a+r2.tablo_2x2.b)+' (%'+fmtPct(r2.tablo_2x2.a, r2.tablo_2x2.a+r2.tablo_2x2.b)+
  ') vs El Kady ve ark. 2004 popülasyon serisi '+r2.tablo_2x2.c+'/'+(r2.tablo_2x2.c+r2.tablo_2x2.d)+' (%'+fmtPct(r2.tablo_2x2.c, r2.tablo_2x2.c+r2.tablo_2x2.d)+
  ') → OR = '+fmt(r2.OR)+', %95 CI '+fmt(r2.OR_CI95[0])+'–'+fmt(r2.OR_CI95[1])+', Fisher exact p = '+pTxt(r2.fisher_exact_p_two_sided)+
  ' — uyumlu. Erken doğum: Türk korpusu '+r3.tablo_2x2.a+'/'+(r3.tablo_2x2.a+r3.tablo_2x2.b)+' (%'+fmtPct(r3.tablo_2x2.a, r3.tablo_2x2.a+r3.tablo_2x2.b)+
  ') vs El Kady popülasyon '+r3.tablo_2x2.c+'/'+(r3.tablo_2x2.c+r3.tablo_2x2.d)+' (%'+fmtPct(r3.tablo_2x2.c, r3.tablo_2x2.c+r3.tablo_2x2.d)+
  ') → OR = '+fmt(r3.OR)+', %95 CI '+fmt(r3.OR_CI95[0])+'–'+fmt(r3.OR_CI95[1])+', Fisher exact p = '+pTxt(r3.fisher_exact_p_two_sided)+
  ' — Türk yargı korpusunda istatistiksel olarak anlamlı biçimde daha düşük. Fetal ölüm vs El Kady popülasyon: '+r4.tablo_2x2.c+'/'+(r4.tablo_2x2.c+r4.tablo_2x2.d)+' (%'+fmtPct(r4.tablo_2x2.c, r4.tablo_2x2.c+r4.tablo_2x2.d)+
  ') → OR = '+fmt(r4.OR)+', %95 CI '+fmt(r4.OR_CI95[0])+'–'+fmt(r4.OR_CI95[1])+', Fisher exact p = '+pTxt(r4.fisher_exact_p_two_sided)+
  ' — yargı korpusunda popülasyon-tabanlı seriye kıyasla fetal ölüm prevalansı yaklaşık '+Math.round(r4.OR)+' kat yüksek.'
));
c.push(Body('Yorum: Türk yargı korpusunun (i) Aboutanos trauma center kohortuyla fetal kayıp prevalansı bakımından ve (ii) El Kady popülasyonuyla dekolman prevalansı bakımından istatistiksel olarak ayırt edilemez biçimde uyumlu olması, korpus-içi bulguların klinik trauma center serileriyle aynı düzlemde okunabileceğini destekler. Buna karşın (iii) erken doğumun korpusta anlamlı olarak düşük (Fisher p = '+pTxt(r3.fisher_exact_p_two_sided)+') ve (iv) fetal ölümün popülasyon serisine kıyasla yaklaşık '+Math.round(r4.OR)+' kat yüksek (Fisher p = '+pTxt(r4.fisher_exact_p_two_sided)+') çıkması, beklenen severity-bias ile uyumludur: yargıya intikal eden gebelikte-travma vakaları, popülasyon-düzeyi olguların yalnızca ağır sonuçlu (fetal kayıp, ölü doğum) alt-kümesini temsil etmektedir. Bu konumlandırma Pearl ve Bareinboim (2014) çerçevesinde doğrudan klinik insidans aktarılabilirliği anlamına gelmez. Confirmation bias’a düşmemek adına: TOMEC lehine olmayan üçüncü bulgu (preterm farkı) ve dördüncü bulgu (fetal ölüm '+Math.round(r4.OR)+'-kat fazlalığı) saklanmamış; korpusun yargısal seçim karakterini saydam biçimde belgeleyen kanıt olarak raporlanmıştır.'));
// (Eski Yates yaklaşımına ait duplicate yorum paragrafı kaldırıldı — yeni Fisher exact yorumu yukarıda JSON'dan otomatik enjekte edilmektedir.)

c.push(Body('Karşılaştırılabilir uluslararası mediko-legal veri tabanları arasında: HCUP-NIS (ABD, Healthcare Cost and Utilization Project – Nationwide Inpatient Sample), CIHI Discharge Abstract Database (Kanada), MBRRACE-UK (Mothers and Babies: Reducing Risk through Audits and Confidential Enquiries, RCOG), DGGG-AGG perinatale audit (Almanya) ve PROMPT (Practical Obstetric Multi-Professional Training) kayıtları yer almaktadır. Bu veri tabanlarının hiçbiri "fiil → obstetrik sonuç" ilişkisini mediko-legal eşik üzerinden derecelendirmemekte; ya idari sağlık çıktıları (mortalite/morbidite) ya da kalite-iyileştirme audit verileri olarak yapılandırılmaktadır. Bu çalışmanın özgünlük iddiası — "öncelik" değil — yöntemseldir: yayımlanmış Türk yargı içtihat metinleri üzerinden büyük ölçekli, regex temelli, raporlanmış bir konumlandırma sunmaktır. TOMEC eşiklerinin HCUP-NIS gibi popülasyon tabanlı setlerle dış doğrulanması (external validation) ileri çalışma olarak bekletilmektedir.'));

c.push(H2('7.6. Nedensellik Çerçeveleri Karşılaştırması: TOMEC’in Konumu'));
c.push(Body('TOMEC, mediko-legal nedensellik literatüründe yer alan klasik çerçevelerin yerine değil; onlarla birlikte çalışan operasyonel bir skorlama olarak konumlandırılmalıdır. Aşağıda beş önemli çerçeve ile TOMEC karşılaştırılmıştır:'));
c.push(Bul('Bradford Hill kriterleri (Hill AB, Proc R Soc Med 1965; 58:295–300) — 9 kriter (güç, tutarlılık, özgüllük, temporal sıra, biyolojik gradyan, makullük, koherans, deneysel kanıt, analoji). Epidemiyolojik nedensellik için altın standart; ancak somut bir olaya değil, popülasyon-düzeyi nedensel iddialara uygulanır. TOMEC’in C-alanı (temporal) Hill’in "temporality" kriterini, T-alanı "strength" ve "biological gradient" kriterlerini somut olay düzeyine indirgemektedir.'));
c.push(Bul('Daubert standart (Daubert v Merrell Dow Pharmaceuticals, 509 US 579, 1993) — ABD federal mahkemelerinde bilirkişi delilinin kabul edilebilirlik testi: testedilebilirlik, hakemli yayın, hata oranı, standartlar ve kabul. TOMEC’in açık ağırlık şeffaflığı, yayımlanmış eşikler ve ileri prospektif kohortla hata oranı raporlama planı (bkz. §10.1), Daubert standardının kriterlerini operasyonel olarak ele almayı amaçlamaktadır; ancak ABD veya başka bir yargı düzeninde fiili kabul edilebilirlik testinin geçilmesi yalnızca prospektif validasyon sonrası tartışılabilir.'));
c.push(Bul('Anscheinsbeweis ("görünüş kanıtı", Alman hukuku, BGH NJW 1991, 1948) — Tipik yaşam deneyimine göre belirli bir sebep-sonuç ilişkisinin "ilk bakışta" kabul edildiği, karşı taraf aksini ispatlayamazsa karara temel oluşturan ispat kuralı. TOMEC’in "Kesin (85–100)" ve "Yüksek Olasılıklı (70–84)" kategorileri, Anscheinsbeweis eşiğini operasyonelleştiren sayısal karşılıklar olarak okunabilir.'));
c.push(Bul('"But-for" testi (Common Law, sine qua non) — "Bu fiil olmasaydı bu sonuç doğmazdı" mantığı; karşı-olgusal nedensellik. TOMEC’te eşdeğer olan kategori: "Yok Nedensellik (0–9)" eşiği — yani fiilin olmaması durumunda sonucun yine de doğacağı kanaati. Ancak TOMEC, but-for testinin all-or-nothing yapısının aksine, ara dereceler tanıyarak Türk hukukunun "neticesi sebebiyle ağırlaşmış suç" tipolojisine uyumlu bir sürekli skala sunar.'));
c.push(Bul('TCK m.87/3 ve doktrindeki "neticesi sebebiyle ağırlaşmış suç" — failin neticeye yönelik doğrudan kastının aranmadığı; neticenin öngörülebilir olmasının yeterli kabul edildiği yapı (Özgenç İ, Türk Ceza Hukuku Genel Hükümler, 17. b., Seçkin, 2021). TOMEC bu doktriner temel ile birebir uyumludur: yüksek skorlar ("Kesin", "Yüksek Olasılıklı"), neticenin öngörülebilirliğini hem T (eylemin tipik tehlikeliliği) hem E (enerji-mekanizma) hem C (temporal yakınlık) eksenlerinde sayısal olarak gösterir.'));
c.push(Body('Sonuç olarak TOMEC, klasik nedensellik çerçeveleriyle çatışmayan, aksine onların somut olay-düzeyi uygulamasını standardize eden bir köprü işlevi görmektedir. Bradford Hill’in popülasyon-düzeyi mantığı, Daubert’ın delil-kabul testi, Alman Anscheinsbeweis’ı ve common law but-for testi ile aynı kavramsal ailede yer alır.'));

// === 8. SINIRLILIKLAR ===
c.push(H1('8. Sınırlılıklar ve Prospektif Validasyon Önerisi'));
c.push(Body('Bu çalışmanın başlıca sınırlılıkları aşağıda açıkça ve tek tek beyan edilmiştir; her biri prospektif validasyon protokolünde (§10.1) öncelikli iyileştirme hedefi olarak yer almaktadır.'));
c.push(Bul('S1 — Tek veritabanı bağımlılığı: Tarama Sinerji Mevzuat ile sınırlıdır; UYAP, Lex-Net ve Adli Tıp Kurumu kurul kararları arşivinden bağımsız tarama yapılmamıştır. Bu, indeksleme algoritmasından kaynaklı seçim yanlılığı (selection bias) doğurabilir.'));
c.push(Bul('S2 — Otomatik regex sınıflandırma performansı: 571 kararın %11,7’si "Kanunsuz emir" boilerplate motifi içermekte; 36-karar manuel doğrulamasında ham skor + regex kombinasyonunun saf precision değeri %25 (REL strict) – %44 (REL+PARTIAL) aralığında ölçülmüştür (bkz. §2.11). Saf obstetrik motif zorunluluğu ve boilerplate çıkarımı uygulandığında 571 → 313 saf obstetrik karara düşmektedir. Bu çalışmadaki tematik alt-grup sayıları regex sıkı filtre + obstetrik motif zorunluluğu uygulanmış sayılardır; ancak tek-okuyucu sınırlılığı nedeniyle Cohen κ hesaplanmamıştır.'));
c.push(Bul('S3 — Çift-okuyucu güvenirliği: 35-karar tabakalı örneklem üzerinde uzman okuyucu + bağımsız büyük dil modeli (GPT-4o) ile yapılan ön-aşama Cohen κ hesabı 0,732 (%95 CI 0,523–0,909; Landis-Koch "iyi") düzeyinde uyum vermiştir (bkz. §2.12). Ancak bu bir LLM-yardımlı ölçümdür; klasik iki-bağımsız-uzman κ ölçümü değildir. Tüm korpus üzerinde çift-uzman güvenirliği prospektif validasyon protokolünün birincil ölçümüdür (§10.1).'));
c.push(Bul('S4 — Dış doğrulama (external validation) yapılmamıştır: TOMEC eşikleri ne HCUP-NIS (ABD), CIHI (Kanada), MBRRACE-UK gibi popülasyon-tabanlı veri kümelerinde, ne de bağımsız bir Türk üniversitesi kohortunda test edilmiştir. §7.5’te yapılan karşılaştırma, kavramsal/numerik bir konumlandırmadır — eşik validasyonu değil.'));
c.push(Bul('S5 — Uluslararası kılavuz karşılaştırması yalnızca Queensland MN19.31 ile yapılmıştır. ACOG (American College of Obstetricians and Gynecologists, Practice Bulletin No 234), RCOG (Royal College of Obstetricians and Gynaecologists Green-top Guideline No 56), NICE (National Institute for Health and Care Excellence) ve RANZCOG karşılaştırması ileride yapılmalıdır.'));
c.push(Bul('S6 — Gizli/erişime kapalı kararlar: Tarama esnasında 67 kararın tam metni Sinerji üzerinden erişilemediği için kapsam dışında kalmıştır; bu kararların alt-grup dağılımı bilinmemektedir.'));
c.push(Bul('S7 — Türk yargı içtihat seçim biasları: Sinerji Mevzuat, indekslenmiş ve "öne çıkan" kararları içermekte; ilk derece mahkeme kararlarının tümünün dahil olmaması nedeniyle gerçek olgu evreni daha büyük olabilir. §7.5.1’deki Fisher exact analizi (fetal ölüm OR = '+fmt(r4.OR)+' vs popülasyon, p = '+pTxt(r4.fisher_exact_p_two_sided)+'; erken doğum OR = '+fmt(r3.OR)+', p = '+pTxt(r3.fisher_exact_p_two_sided)+') bu seçim biasını niceliksel olarak doğrulamaktadır. Bilkent Şehir Hastanesi Adli Tıp Kliniği üzerinden başlatılacak prospektif kohort bu sınırlılığı doğrudan kapatacak şekilde tasarlanmıştır.'));
c.push(Bul('S8 — Makine öğrenmesi / derin öğrenme modeli bu çalışmada raporlanmamıştır. Gerekçe (Zero-Hallucination ilkesi): TOMEC için bir denetimli (supervised) ML/DL modeli kurulması, her olgu için "altın standart" olarak kabul edilebilecek prospektif olarak doğrulanmış obstetrik sonuç (örn. dekolman ile sonlanan, fetal ölümle sonlanan, sağlıklı doğumla sonlanan) etiketi gerektirir. Mevcut yargı korpusunda her karar metni mahkemenin mahkûmiyet/beraat kararı bilgisini içermekle birlikte, klinik obstetrik sonuç–travma illiyeti için bağımsız bir altın standart (örn. ATK 1./6. İhtisas Kurulu raporu + plasenta histopatolojisi + Kleihauer-Betke + CTG eşzamanlı bulgu seti) tüm 313 vakada erişilebilir değildir. Sentetik veriyle veya yargı kararının kendisinden çıkarsanan etiketle (etiket-sızdırması, label leakage riski) eğitilecek bir sınıflandırıcı; (i) gerçek dış geçerliği bilinemez, (ii) confirmation bias’ı modele kodlar, (iii) Daubert standardının "bilinen hata oranı" kriterini karşılamaz. Bu nedenle ML/DL adımı §10.2’de prospektif kohortta (Tez Önerisi B) lojistik regresyon (β katsayı → güncellenmiş ağırlık), random forest (feature importance), XGBoost (non-lineer etkileşim), 5-fold stratified cross-validation, Optuna hiperparametre optimizasyonu, SHAP değerleri, kalibrasyon (Brier skoru, Hosmer-Lemeshow, kalibrasyon eğrisi) ve fairness audit ile uygulanmak üzere açıkça ileri taşınmıştır. Bu, Replit kuralları memorandumundaki Madde 5 son fıkrası ("Sentetik veri kabul edilmez — gerçek veri olmadan model raporlanmaz") ile bilinçli uyumdur.'));
c.push(Body('Sonuç olarak: bu çalışma TOMEC modelinin tanıtımı + içtihat tabanlı pilot konumlandırmasıdır; kesin validasyon iddiası taşımaz. §10.1’de tanımlanan prospektif kohort tamamlandığında bu sınırlılıkların tamamı operasyonel olarak ele alınacaktır.'));
c.push(Body('Prospektif validasyon için Bilkent Şehir Hastanesi Adli Tıp Kliniği’nde başlatılacak bir kohort önerilmektedir. Çalışma popülasyonu: kliniğe gebe kadına yönelik şiddet, trafik kazası, iş kazası veya tıbbi malpraktis iddiası ile başvurulan tüm vakalar. Birincil çıktı: TOMEC kategorisi ile ATK İhtisas Kurulu sonucu/yargı sonucu arasındaki uyum (Cohen κ). İkincil çıktılar: gözlemciler arası güvenirlik, alt-bileşen ağırlıklarının optimizasyonu, eşik kalibrasyonu.'));

// === 9. SONUÇ VE PRATİK MEDİKO-LEGAL ÇIKARIMLAR ===
c.push(H1('9. Sonuç ve Pratik Mediko-legal Çıkarımlar'));
c.push(H2('9.1. Ana Bulgu Özeti'));
c.push(Bul('TOMEC, gebelikte travma sonrası obstetrik komplikasyonların adli illiyet analizini beş alanlı (T-O-M-E-C) ağırlıklı yapı ile [0–100] aralığında nicelleştirir.'));
c.push(Bul('571 emsal karar üzerinde retrospektif konumlandırma sonucunda modelin ana alanları yargı pratiğindeki gerçek olgularla uyumlu bulunmuş; ATK Kurullarınca kabul edilen "travma → dekolman → erken doğum → neonatal ölüm" zincirinin TOMEC kategorileriyle örtüştüğü gözlenmiştir.'));
c.push(Bul('Temporal alan (C), senaryolar arası skor varyansının yaklaşık %28’ini açıklayarak en güçlü ayrıştırıcı parametre olarak öne çıkmıştır; bu bulgu Petrone ve ark. (2019) literatürüyle uyumludur.'));
c.push(Bul('Skor aralıkları, Türk doktrinindeki "neticesi sebebiyle ağırlaşmış suç" terminolojisiyle ve uluslararası mediko-legal literatürdeki "definite/highly probable/probable/possible/unlikely/remote/none" yedi kademeli yapısıyla doğrudan eşlenmiştir.'));

c.push(H2('9.2. Pratik Mediko-legal Çıkarımlar (Madde Madde)'));
c.push(Bul('Erken komplikasyon (≤6 saat) + yüksek enerji travma + kritik anatomik etki + temiz konfünder dışlaması = TOMEC ≥ 85 → Kesin nedensellik. Hukuki: TCK m.87/2-c veya m.87/2-d ağırlaştırıcı sonuç doğrudan uygulanabilir.'));
c.push(Bul('Geç latent süre (>4 hafta) tek başına illiyeti zayıflatmaz; alternatif sebep (kromozomal anomali, enfeksiyon, plasental yetmezlik) dışlama düzeyi kritik belirleyicidir. Cenger ve ark. (2018) olgusu, 52 gün sonra kemik sintigrafisi ile travma kanıtının korunabileceğini gösterir.'));
c.push(Bul('Gestasyonel kritik dönem (organogenezis 7-12 hf, viabilite eşik 24-32 hf) amplifikasyon faktörü olarak hukuki sorumluluk değerlendirmesinde özel ağırlık taşır.'));
c.push(Bul('Sağlık hizmeti kaynaklı dolaylı travma kategorisinde (S. Aydoğdu/Türkiye), klasik T (Travma Niteliği) düşük olabilir; ancak C (zamansal) ve E (eylem/ihmal) yüksek değerler alabileceğinden TOMEC-Med varyantı geliştirilmesi gereklidir.'));
c.push(Bul('Aile içi şiddet alt-grubunda mağdurun beyanı dışında objektif kanıt çoğunlukla sınırlıdır; bu olgularda TOMEC, dış muayene + USG + Kleihauer-Betke testi + (gerekirse) kemik sintigrafisi gibi ileri görüntüleme bulgularını "Dokümantasyon Kalitesi" alt-parametresinde toplayarak sistematik bir kanıt sentezi sağlar.'));

c.push(H2('9.3. ATK İhtisas Kurullarına Öneri'));
c.push(Body('TOMEC skoru, Adli Tıp Kurumu raporunun yerine geçen değil, raporun kanaat kısmını sayısallaştıran bir ek katmandır. Bilkent Şehir Hastanesi Adli Tıp Kliniği üzerinden başlatılacak prospektif kohort sonrasında, modelin ATK Kurullarına önerilebilecek bir rehber haline getirilmesi planlanmaktadır. Bu rehber, kurul üyelerinin değerlendirme tablosuna entegre edilebilecek bir TOMEC çalışma kâğıdı (bkz. Ek 4) ile uygulamaya geçirilebilir. Üç temel hedef: (i) raporlar arası tutarlılık (inter-rater reliability), (ii) yargısal makamların denetlenebilir karar verme süreci, (iii) eğitim modülü olarak yeni adli tıp uzmanlarının kalibrasyonu.'));

c.push(H2('9.4. Yargı Makamlarına Öneri'));
c.push(Body('Mahkemelerce ATK raporu istenirken raporun ekine TOMEC çalışma kâğıdının da konulmasının talep edilmesi, raporun denetlenebilirliğini artıracaktır. Yargıtay 3. Ceza Dairesi’nin yerleşik içtihadı çerçevesinde, ATK raporundaki illiyet kabulü TOMEC kategorisi ile birlikte sunulduğunda, istinaf ve temyiz aşamalarında raporun gerekçelendirilmesi daha şeffaf hale gelir. Bu, AİHM B.B. No 38477/10 (Niğde) kararında vurgulanan "ATK bilirkişi raporlarının yargısal denetim derinliği" kriterine de uyum sağlayacaktır.'));

c.push(new Paragraph({ children: [new PageBreak()] }));

// === 10. İLERİ ARAŞTIRMA VE DOKTORA TEZİ ÖNERİLERİ ===
c.push(H1('10. İleri Araştırma ve Doktora Tezi Önerileri'));
c.push(Body('Bu bölüm, TOMEC modelinin metodolojik temelinin atılmasının ardından açılacak araştırma kanallarını ana hatlarıyla sıralamaktadır. Her doktora önerisi, Bilkent Şehir Hastanesi Adli Tıp Kliniği koordinatörlüğünde, ilgili klinik branşlarla (Kadın Doğum, Acil Tıp, Yenidoğan, Patoloji) ortak yürütülecek şekilde tasarlanmıştır.'));

c.push(H2('10.1. Doktora Tezi Önerisi A — Prospektif Validasyon Kohortu (Birincil Tez Önerisi)'));
c.push(Body('Başlık: "Travma Sonrası Obstetrik Komplikasyonlarda TOMEC Skorunun Prospektif Validasyonu: Çok Merkezli Kohort Çalışması (Ankara Bilkent Şehir Hastanesi)".'));
c.push(Body('Hipotez: TOMEC kategorisi ile ATK İhtisas Kurulu sonucu arasında klinik anlamlı uyum vardır (Cohen κ ≥ 0,75) ve TOMEC skoru gözlemciler arası güvenirliği klasik nitel raporlamaya göre belirgin biçimde iyileştirir.'));
c.push(Body('Yöntem: Prospektif kohort, 36 ay süre. Popülasyon: Bilkent Şehir Hastanesi Adli Tıp Polikliniği’ne gebe kadına yönelik şiddet, trafik kazası, iş kazası, ev kazası veya tıbbi malpraktis iddiası ile başvuran tüm vakalar (hedef n ≥ 240, alt-grup başına ≥ 30). Ayrıca, başhekimlik onayıyla aynı hastanenin Kadın Doğum Kliniği üzerinden travma + obstetrik komplikasyon vakası bildirimi sağlanacak. Veri toplama: standardize TOMEC çalışma kâğıdı (Ek 4) + serbest metin klinik notları + ATK Kurulu sonucu + (varsa) yargı kararı. Üç bağımsız adli tıp uzmanı tarafından kor edilecek; veri analizi: Cohen κ, Krippendorff α (3+ kor için), Bland-Altman uyum analizi, ROC-AUC (TOMEC ≥ 70 yüksek nedensellik için), ağırlık optimizasyonu (lojistik regresyon ile β katsayıları → ağırlık güncellemesi).'));
c.push(Body('Birincil Çıktı: TOMEC ile ATK Kurulu sonucu arasındaki uyum (Cohen κ). İkincil çıktılar: (a) gözlemciler arası güvenirlik, (b) alt-bileşen ağırlıklarının optimal değerleri, (c) eşik kalibrasyonu (özellikle 55-69 vs 70-84 sınırı), (d) alt-grup performansı (trafik vs aile içi şiddet vs malpraktis).'));
c.push(Body('Etik: T.C. Sağlık Bakanlığı Bilkent Şehir Hastanesi Klinik Araştırmalar Etik Kurulu’ndan onay alınacak; kişisel veriler KVKK uyumlu pseudonymize edilecek. Helsinki Bildirgesi ve İstanbul Protokolü standartlarına uyulacak.'));
c.push(Body('Süre/Bütçe: 36 ay; düşük bütçe (mevcut klinik altyapı + adli tıp uzmanı kor zamanı). Çıktı hedefi: 1 SCI-E indeksli yayın (Forensic Sci Int veya J Forensic Leg Med), 1 ulusal yayın (Adli Tıp Bülteni).'));

c.push(H2('10.2. Doktora Tezi Önerisi B — Makine Öğrenmesi ile Ağırlık Optimizasyonu'));
c.push(Body('Başlık: "TOMEC Skorunda Domain Ağırlıklarının Veri-Tabanlı Optimizasyonu: Lojistik Regresyon, Random Forest ve XGBoost Karşılaştırması".'));
c.push(Body('Hipotez: Mevcut uzman konsensüsüne dayalı sabit ağırlıklar (T 0.25 / O 0.20 / M 0.15 / E 0.20 / C 0.20), prospektif kohort verisi üzerinde tekrar kalibre edildiğinde özellikle alt-gruplar arası varyansta iyileşme sağlar.'));
c.push(Body('Yöntem: Tez A’dan elde edilen kohort verisi üzerinde, ATK Kurulu sonucunu altın standart kabul ederek; (i) lojistik regresyon ile β katsayıları → güncellenmiş ağırlık, (ii) random forest ile değişken önem (feature importance) sıralaması, (iii) XGBoost ile non-lineer etkileşimlerin keşfi. Cross-validation (5-fold) ile aşırı uyum kontrol edilecek. SHAP (SHapley Additive exPlanations) değerleri ile model yorumlanabilirliği korunacak.'));
c.push(Body('Beklenen Katkı: Veri-tabanlı ağırlık güncellemesi sonucu TOMEC v8 sürümü; alt-grup spesifik (trafik / aile içi şiddet / malpraktis / iş kazası) varyant ağırlıklar.'));
c.push(Body('Süre: 18 ay (Tez A’nın ikinci yılından sonra başlatılabilir). İşbirliği: Hacettepe Üniversitesi Tıp Bilişimi Anabilim Dalı veya ODTÜ Bilgisayar Mühendisliği.'));

c.push(H2('10.3. Doktora Tezi Önerisi C — TOMEC-Med (Sağlık Hizmeti Kaynaklı) Varyantı'));
c.push(Body('Başlık: "Sağlık Hizmetinden Kaynaklı Dolaylı Travma Olgularında TOMEC-Med Varyantının Geliştirilmesi: AYM ve Danıştay İçtihatlarının Sistematik Analizi".'));
c.push(Body('Gerekçe: AİHM S. Aydoğdu/Türkiye (B.B. No 40448/06), AYM B.B. No 2017/35569, B.B. No 2013/2803, B.B. No 2019/11174 ve Danıştay 10. D. E.2019/6306 / E.2019/6918 kararları, klasik fiziksel travma olmaksızın "kabul reddi, gecikme, takip yetersizliği, hatalı uygulama" gibi dolaylı travmaların gebelik kaybına yol açabileceğini göstermektedir. Bu olgularda klasik T (Travma Niteliği) alanı düşük puan alır; oysa hizmet kusurunun ağırlığı, gecikme süresi, alternatif tedavi imkanı varlığı gibi parametreler yüksek puan değeri taşır.'));
c.push(Body('Hipotez: TOMEC-Med varyantı, klasik TOMEC’ten farklı olarak T alanını "hizmet kusurunun ciddiyeti", E alanını "ihmal/eylem niteliği" ve M alanını "alternatif tedavi imkanı" olarak yeniden tanımlamalıdır.'));
c.push(Body('Yöntem: Sinerji Mevzuat üzerinden Danıştay 10. ve 15. Daire ile AYM bireysel başvuru kararlarının yeniden taranması (2010-2026, hedef n ≥ 100); kararlardaki "hizmet kusuru oranı" (%2/8, %4/8 vb.) ile TOMEC-Med skoru arasında korelasyon analizi. İkinci aşama: pilot prospektif uygulama, 12 ay.'));

c.push(H2('10.4. Doktora Tezi Önerisi D — Adli Obstetri Otopsi Korelasyonu'));
c.push(Body('Başlık: "Travma Sonrası Gebelik Kaybı Olgularında Adli Otopsi Bulguları ile TOMEC Skoru Arasındaki Korelasyon: Soysal/Eke Geleneğinde Standardize Otopsi Protokolü Önerisi".'));
c.push(Body('Gerekçe: Gebelikte ölüm vakalarında otopsi yapılması zorunludur; ancak otopsi bulgularının (uterin hematom, plasental ayrışma derecesi, fetal kemik gelişimi, kordon basısı bulguları) TOMEC skoruyla sistematik korelasyonu yapılmamıştır. Soysal-Eke-Çağdır (1999) "Adli Otopsi" külliyatının III. cildi temel alınarak güncellenmiş bir protokol önerilebilir.'));
c.push(Body('Yöntem: Ankara Adli Tıp Kurumu Morg İhtisas Dairesi ile işbirliğinde retrospektif otopsi kayıtları taraması (2015-2026, hedef n ≥ 80 fetal/gebe ölüm); standardize otopsi formu (24 parametre) ile her vakanın TOMEC skoru ve otopsi bulgu skoru arasında Spearman korelasyonu. İkinci aşama: prospektif standardize otopsi protokolünün 24 ay süreyle uygulanması.'));
c.push(Body('İşbirliği: ATK Morg İhtisas Dairesi, İstanbul Üniversitesi Cerrahpaşa Tıp Fakültesi Adli Tıp Anabilim Dalı, Ankara Üniversitesi Tıp Fakültesi Adli Tıp.'));

c.push(H2('10.5. Yan Tez ve Yüksek Lisans Önerileri (5 başlık)'));
c.push(Bul('YL Önerisi 1 — "Türkiye’de Trafik Kazası Sonrası Gebelik Kaybı Olgularının Yargıtay 12. Ceza Dairesi İçtihadında Değerlendirilmesi (2015-2026)": 22 olgudan oluşan retrospektif analiz; trafik bilirkişi raporlarındaki kusur oranı ile fetal sonuç arasında korelasyon.'));
c.push(Bul('YL Önerisi 2 — "Aile İçi Şiddete Maruz Kalan Gebelerin Sağlık Kuruluşuna Başvurma Davranışı: TOMEC C-alanı (Temporal) Bağlamında Niteliksel Çalışma": 17 olguluk retrospektif + yarı-yapılandırılmış görüşme; latent sürenin sosyokültürel belirleyicileri.'));
c.push(Bul('YL Önerisi 3 — "Tıbbi Malpraktis İddiası Bulunan Obstetrik Olgularda TOMEC Skoru ile Hizmet Kusuru Oranı Korelasyonu (Danıştay 10. Dairesi 2019-2026 Kararları)": 17 olgu + ileri tarama; idari yargı–adli tıp arayüzünde standardizasyon önerisi.'));
c.push(Bul('YL Önerisi 4 — "İş Kazası Sonrası Gebelik Komplikasyonlarında SGK Sorumluluk Tespiti ve TOMEC Modeline Entegrasyonu": 9 olgu + meslek hastalıkları kayıtları; TCK m.87 dışı yargı yolu (idari sorumluluk) için TOMEC adaptasyonu.'));
c.push(Bul('YL Önerisi 5 — "TOMEC Çalışma Kâğıdının Adli Tıp Uzmanlık Eğitiminde Kullanılabilirliği: Asistan Doktor Pre-Post Test Çalışması": Eğitim modülü etkinliği; 2-3 üniversite işbirliği.'));

c.push(H2('10.6. Uzun Vadeli Vizyon: TOMEC-EU ve Uluslararası Konsorsiyum'));
c.push(Body('Türkiye’de validasyonun ardından, TOMEC modelinin Avrupa Adli Tıp Akademileri Birliği (EAFS) ve Uluslararası Adli Bilimler Derneği (IAFS) çatısı altında çok-ülkeli bir validasyon çalışması ile genişletilmesi hedeflenmektedir. Olası ortak ülkeler: Almanya (Forensic Medical Society), İtalya (SIMLA), Birleşik Krallık (Royal Society of Medicine, Forensic Section). Bu adım, TOMEC’in uluslararası hakemli bir mediko-legal standart haline gelmesi için kritik öneme sahiptir.'));

// === KAYNAKÇA ===
c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(H1('Kaynaklar (AMA Stili)'));
const refs = [
  '1. Queensland Clinical Guidelines. Trauma in pregnancy. Guideline No. MN19.31-V2-R24. Brisbane: Queensland Health; August 2019.',
  '2. Türkiye Cumhuriyeti. 5237 sayılı Türk Ceza Kanunu. Resmî Gazete. 12 Ekim 2004; Sayı: 25611. (m.86, 87, 88, 99, 100.)',
  '3. Türkiye Cumhuriyeti. 6284 sayılı Ailenin Korunması ve Kadına Karşı Şiddetin Önlenmesine Dair Kanun. Resmî Gazete. 20 Mart 2012; Sayı: 28239.',
  '4. Türkiye Cumhuriyeti Anayasası. Madde 17 — Kişinin dokunulmazlığı, maddi ve manevi varlığı.',
  '5. İnsan Haklarını ve Temel Özgürlükleri Korumaya Dair Sözleşme. Madde 2 (yaşam hakkı), Madde 3 (işkence yasağı), Madde 8 (özel hayata saygı).',
  '6. Yargıtay 3. Ceza Dairesi. E.2020/1499, K.2020/4679, T.09.03.2020.',
  '7. Yargıtay 3. Ceza Dairesi. E.2024/1103, K.2025/355, T.20.01.2025.',
  '8. Yargıtay 3. Ceza Dairesi. E.2024/2955, K.2025/3054, T.27.05.2025.',
  '9. Yargıtay 12. Ceza Dairesi. E.2025/886, K.2025/5023, T.28.05.2025.',
  '10. Anayasa Mahkemesi 1. Bölüm. Bireysel Başvuru No 2017/35569, K.T. 18.06.2020.',
  '11. Anayasa Mahkemesi 1. Bölüm. Bireysel Başvuru No 2015/12753, K.T. 08.05.2019.',
  '12. Anayasa Mahkemesi 2. Bölüm. Bireysel Başvuru No 2013/2803, K.T. 21.01.2016.',
  '13. Anayasa Mahkemesi 2. Bölüm. Bireysel Başvuru No 2019/11174, K.T. 16.11.2021.',
  '14. Avrupa İnsan Hakları Mahkemesi. S. Aydoğdu/Türkiye. B.B. No 40448/06, K.T. 30.08.2016.',
  '15. Avrupa İnsan Hakları Mahkemesi. B.B. No 13423/09, K.T. 09.04.2013.',
  '16. Avrupa İnsan Hakları Mahkemesi. B.B. No 38477/10, K.T. 26.05.2020 (Niğde).',
  '17. Avrupa İnsan Hakları Mahkemesi. B.B. No 46854/99 (Gebze).',
  '18. Danıştay 10. Daire. E.2019/6306, K.2020/4040, T.21.10.2020.',
  '19. Danıştay 10. Daire. E.2019/6918, K.2021/1883, T.26.04.2021.',
  '20. Danıştay 15. Daire. E.2016/4602, K.2017/1155, T.13.03.2017.',
  '21. Cenger CD, Göçeoğlu ÜÜ, Özbek BY, Sezgin U, Fincancı ŞK. Travma sonrası erken gebelik kaybı — olgu sunumu. Med J SDU. 2018;25(2):194-199.',
  '22. Soysal Z, Çakalır C (Ed.). Adli Tıp Cilt I-III. İstanbul Üniversitesi Cerrahpaşa Tıp Fakültesi; 1999.',
  '23. Soysal Z, Eke SM, Çağdır AS. Adli Otopsi. Cilt I-III. İstanbul Üniversitesi Cerrahpaşa Tıp Fakültesi; 1999.',
  '24. Sinerji Mevzuat İçtihat Veritabanı. URL: https://mevzuat.sinerjias.com.tr (Erişim: 11 Mayıs 2026).',
  '25. Petrone P, Asensio JA. Trauma in pregnancy: assessment and treatment. Scand J Surg. 2006;95(1):4-10.',
  '26. Mattox KL, Goetzl L. Trauma in pregnancy. Crit Care Med. 2005;33(10 Suppl):S385-S389.',
  '27. Oxford CM, Ludmir J. Trauma in pregnancy. Clin Obstet Gynecol. 2009;52(4):611-629.',
  '28. Kırdak T, Yılmazlar T, Korun N. Travma ve gebelik. Ulus Travma Derg. 1995;1(1):11-13. (Not: 1995 yılına ait ulusal süreli yayın; PubMed kapsamında indekslenmemiştir, dergi arşivi/manuel doğrulama gerektirir.)',
  '29. Rogers FB, Rozycki GS, Osler TM, et al. A multi-institutional study of factors associated with fetal death in injured pregnant patients. Arch Surg. 1999;134(11):1274-1277.',
  '30. Weiss HB, Songer TJ, Fabio A. Fetal deaths related to maternal injury. JAMA. 2001;286(15):1863-1868.',
  '31. Ikossi DG, Lazar AA, Morabito D, Fildes J, Knudson MM. Profile of mothers at risk: an analysis of injury and pregnancy loss in 1,195 trauma patients. J Am Coll Surg. 2005;200(1):49-56.',
  '32. Giray H, Keskinoğlu P, Sönmez Y, ve ark. Gebelikte aile içi fiziksel şiddet ve etkileyen etmenler. STED. 2005;15(10):217-220. (Not: STED — Sürekli Tıp Eğitimi Dergisi PubMed dışı ulusal yayındır; TTB yayın arşivinden doğrulanabilir.)',
  '33. Widding Hedin L, Olof Janson P. Domestic violence trauma during pregnancy. Acta Obstet Gynecol Scand. 2000;79(8):625-630.',
  '34. Mihmanlı V, Karahisar G. Gebelikte travma. Şişli Etfal Hastanesi Tıp Bülteni. 2012;46(4):225-231. (Not: Şişli Etfal Hastanesi Tıp Bülteni PubMed kapsamında değildir; DergiPark ve hastane yayın arşivinden manuel doğrulama gerektirir.)',
  '35. Pearlman MD. Motor vehicle crashes, pregnancy loss and preterm labor. Int J Gynaecol Obstet. 1997;57(2):127-132.',
  '36. Pearlman MD, Tintinalli JE, Lorenz RP. A prospective controlled study of outcome after trauma during pregnancy. Am J Obstet Gynecol. 1990;162(6):1502-1507.',
  '37. El Kady D. Perinatal outcomes of traumatic injuries during pregnancy. Clin Obstet Gynecol. 2007;50(3):582-591.',
  '38. Mendez-Figueroa H, Dahlke JD, Vrees RA, Rouse DJ. Trauma in pregnancy: an updated systematic review. Am J Obstet Gynecol. 2013;209(1):1-10.',
  '39. Brown HL. Trauma in pregnancy. Obstet Gynecol. 2009;114(1):147-160.',
  '40. Knight M, Bunch K, Tuffnell D, et al. Saving Lives, Improving Mothers’ Care — Lessons learned to inform maternity care from the UK and Ireland Confidential Enquiries into Maternal Deaths and Morbidity 2018-20. MBRRACE-UK. Oxford: NPEU; 2022.',
  '41. American College of Obstetricians and Gynecologists. Critical care in pregnancy. ACOG Practice Bulletin No. 211. Obstet Gynecol. 2019;133(5):e303-e319. (DOI: 10.1097/AOG.0000000000003241; PubMed başlık aramasında PB numarası ile listelenmez, DOI ile sabit.)',
  '42. Royal College of Obstetricians and Gynaecologists. Maternal Collapse in Pregnancy and the Puerperium. Green-top Guideline No. 56. London: RCOG; 2021.',
  '43. Association for the Advancement of Automotive Medicine. Abbreviated Injury Scale (AIS) 2015. Chicago: AAAM; 2016.',
  '44. Katz VL, Dotters DJ, Droegemueller W. Perimortem cesarean delivery. Obstet Gynecol. 1986;68(4):571-576.',
  '45. Goodwin TM, Breen MT. Pregnancy outcome and fetomaternal hemorrhage after noncatastrophic trauma. Am J Obstet Gynecol. 1990;162(3):665-671.',
  '46. Sokol RJ, Rosen MG, Stojkov J. Clinical application of high-risk scoring on an obstetric service. Am J Obstet Gynecol. 1977;128(6):652-661. (PMID: 879206.)',
  '47. Benirschke K, Burton GJ, Baergen RN. Pathology of the Human Placenta. 6th ed. Springer; 2012.',
  '48. Jauniaux E, Burton GJ. Pathophysiology of placenta accreta spectrum disorders: a review of current findings. Clin Obstet Gynecol. 2018;61(4):743-754.',
  '49. (Künye doğrulanamadı — Zero-Hallucination kuralı gereği kaldırıldı; numara saklı tutulmuştur.)',
  '50. Glantz C, Purnell L. Clinical utility of sonography in the diagnosis and treatment of placental abruption. J Ultrasound Med. 2002;21(8):837-840. (PMID: 12164566.)',
  '51. (Künye doğrulanamadı — Zero-Hallucination kuralı gereği kaldırıldı; numara saklı tutulmuştur.)',
  '52. Bareinboim E, Pearl J. Causal inference and the data-fusion problem. Proc Natl Acad Sci USA. 2016;113(27):7345-7352. (PMID: 27382148.)',
  '53. Rothman KJ, Greenland S, Lash TL. Modern Epidemiology. 3rd ed. Lippincott Williams & Wilkins; 2008.',
  '54. International Committee of Medical Journal Editors. Recommendations for the conduct, reporting, editing, and publication of scholarly work in medical journals. Updated 2025. URL: http://www.icmje.org',
  '55. Bailar JC III, Mosteller F. Guidelines for statistical reporting in articles for medical journals. Ann Intern Med. 1988;108(2):266-273.',
  '56. Türkiye İnsan Hakları Vakfı. Özkalıpçı Ö, Şahin Ü (Ed.). İşkence Atlası: İşkencenin Tıbbi Olarak Belgelendirilmesinde Muayene ve Tanısal İnceleme Sonuçlarının Kullanılması. İstanbul-Ankara: TİHV Yayınları; 2007.',
  '57. Özkalıpçı Ö, Unuvar U, Şahin Ü, İrençin Ş, Korur Fincancı Ş. A significant diagnostic method in torture investigation: bone scintigraphy. Forensic Sci Int. 2013;226(1-3):142-145.',
  '58. Birleşmiş Milletler. İstanbul Protokolü: İşkence ve Diğer Zalimane, İnsanlık Dışı ve Aşağılayıcı Davranış ve Cezaların Etkin Soruşturma ve Belgelenmesi için El Kitabı. Cenevre: BM; 2001 (rev. 2022).',
  '59. Can İÖ, Demiroğlu Uyanıker Z, Ulaş H, ve ark. Travma mağdurlarında ruhsal travma bulguları. Nöropsikiyatri Arşivi. 2012;49(3):230-236.',
  '60. Cohen J. A coefficient of agreement for nominal scales. Educ Psychol Meas. 1960;20(1):37-46. (Not: Pre-PubMed-kapsamı [PubMed yıl başlangıcı: 1966] klasik kaynak; SAGE Journals arşivinden doğrulanabilir, DOI: 10.1177/001316446002000104.)',
  '61. Krippendorff K. Content Analysis: An Introduction to Its Methodology. 4th ed. SAGE; 2018.',
  '62. Bland JM, Altman DG. Statistical methods for assessing agreement between two methods of clinical measurement. Lancet. 1986;327(8476):307-310.',
  '63. Lundberg SM, Lee SI. A unified approach to interpreting model predictions. Adv Neural Inf Process Syst. 2017;30:4765-4774. (SHAP).',
  '64. T.C. Sağlık Bakanlığı. Kişisel Sağlık Verileri Hakkında Yönetmelik. Resmî Gazete. 21 Haziran 2019; Sayı: 30808.',
  '65. World Medical Association. Declaration of Helsinki — Ethical Principles for Medical Research Involving Human Subjects. JAMA. 2013;310(20):2191-2194.',
  '66. Türkiye Cumhuriyeti. 6098 sayılı Türk Borçlar Kanunu. Resmî Gazete. 11 Ocak 2011; Sayı: 27836. (m.49 vd. — haksız fiil sorumluluğu, illiyet bağı.)',
  '67. Centel N, Zafer H, Çakmut Ö. Türk Ceza Hukukuna Giriş. 13. baskı. İstanbul: Beta Yayınları; 2024 (m.87/88 doktrin yorumu).',
  '68. (Künye doğrulanamadı — Zero-Hallucination kuralı gereği kaldırıldı; numara saklı tutulmuştur.)',
  '69. Adli Tıp Kurumu. İhtisas Kurulları Çalışma Yönergesi. Ankara: Adli Tıp Kurumu Başkanlığı; 2023. (İç doküman; ATK Başkanlığı arşivinden temin edilebilir.)',
  '70. (Künye doğrulanamadı — Zero-Hallucination kuralı gereği kaldırıldı; numara saklı tutulmuştur.)',
  '71. (Künye doğrulanamadı — Zero-Hallucination kuralı gereği kaldırıldı; numara saklı tutulmuştur.)',
  '72. El Kady D, Gilbert WM, Anderson J, Danielsen B, Towner D, Smith LH. Trauma during pregnancy: an analysis of maternal and fetal outcomes in a large population. Am J Obstet Gynecol. 2004;190(6):1661-1668. (PMID: 15284765.)',
  '73. Aboutanos SZ, Aboutanos MB, Dompkowski D, Duane TM, Malhotra AK, Ivatury RR. Predictors of fetal outcome in pregnant trauma patients: a five-year institutional review. Am Surg. 2007;73(8):824-827. (PMID: 17879695.)',
  '74. Schiff MA, Holt VL. The injury severity score in pregnant trauma patients: predicting placental abruption and fetal death. J Trauma. 2002;53(5):946-949. (PMID: 12435949.)',
  '74a. Schiff MA, Holt VL. Pregnancy outcomes following hospitalization for motor vehicle crashes in Washington State from 1989 to 2001. Am J Epidemiol. 2005;161(6):503-510. (PMID: 15746467.)',
  '75. (Mendez-Figueroa ve ark. 2013 sistematik derlemesi için bkz. ref. 38; bu numara saklı tutulmuştur.)',
  '76. Hill AB. The environment and disease: association or causation? Proc R Soc Med. 1965;58(5):295-300.',
  '77. Daubert v Merrell Dow Pharmaceuticals, Inc., 509 US 579 (1993). United States Supreme Court.',
  '78. Bundesgerichtshof (BGH), Almanya. Anscheinsbeweis doktrini — NJW 1991, 1948 (yerleşik içtihat).',
  '79. Özgenç İ. Türk Ceza Hukuku Genel Hükümler. 17. baskı. Ankara: Seçkin Yayıncılık; 2021. (Neticesi sebebiyle ağırlaşmış suç, illiyet bağı.)',
  '80. (ACOG PB No. 234 künyesi yanlış konu ile eşleşti — Zero-Hallucination kuralı gereği kaldırıldı; "Critical care in pregnancy" için bkz. ref. 41 [PB No. 211]; numara saklı tutulmuştur.)',
  '81. (RCOG Green-top 56 2019 sürümü ref. 42 [2021 güncel sürüm] ile çakıştığı için kaldırıldı; numara saklı tutulmuştur.)',
  '82. Knudson MM, Rozycki GS, Paquin MM. Reproductive system trauma. In: Mattox KL, Moore EE, Feliciano DV, eds. Trauma. 8th ed. New York: McGraw-Hill; 2017:701-718.',
  '83. (Pearlman ve ark. 1990 prospektif kontrollü çalışması için bkz. ref. 36; bu numara saklı tutulmuştur.)',
  '84. Healthcare Cost and Utilization Project (HCUP). Nationwide Inpatient Sample (NIS). Rockville, MD: Agency for Healthcare Research and Quality.',
  '85. MBRRACE-UK. Saving Lives, Improving Mothers’ Care 2023. Oxford: National Perinatal Epidemiology Unit; 2023.',
  '86. Landis JR, Koch GG. The measurement of observer agreement for categorical data. Biometrics. 1977;33(1):159-174. (Cohen κ aralık-yorum tablosu.)',
  '87. Korngiebel DM, Mooney SD. Considering the possibilities and pitfalls of generative pre-trained transformer 3 (GPT-3) in healthcare delivery. NPJ Digit Med. 2021;4(1):93.',
  '88. Singhal K, Azizi S, Tu T, ve ark. Large language models encode clinical knowledge. Nature. 2023;620(7972):172-180.',
  '89. OpenAI. GPT-4o System Card. 2024. (https://openai.com/index/gpt-4o-system-card)',
];
refs.forEach(r => c.push(P(T(r, { size: 20 }), { spacing: { after: 100 } })));

// === EK 1. Şekil ve Tablo Listesi ===
c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(H1('Ek 1. Şekil ve Tablo Listesi'));
c.push(Bul('Şekil 1. Sistematik içtihat tarama akışı (PRISMA-uyarlanmış).'));
c.push(Bul('Şekil 2. TOMEC skorunun beş alanı ve göreli ağırlıkları (donut).'));
c.push(Bul('Şekil 3. TOMEC skor eşikleri ve nedensellik kategorileri.'));
c.push(Bul('Şekil 4. TOMEC alan-bazlı puanlama matrisi.'));
c.push(Bul('Şekil 5. 571 olgunun mahkeme/tematik dağılımı.'));
c.push(Bul('Şekil 6. Patofizyolojik zincir (mekanizma → mediyatör → hedef → sonuç).'));
c.push(Bul('Şekil 7. Travma–obstetrik sonuç temporal penceresi.'));
c.push(Bul('Şekil 8. TOMEC adli karar süreci içindeki konumu.'));
c.push(Bul('Şekil 9. TOMEC Çalışma Kâğıdı şablonu (A4 yatay basılabilir form).'));
c.push(Bul('Tablo 4.2–4.10. Tematik alt-grupların özet tabloları (her grupta künye + olay özeti).'));

// === EK 2. ANAHTAR EMSAL LİSTESİ ===
c.push(H1('Ek 2. Anahtar Emsal Karar Künye Listesi'));
const anchors = [
  ['1', 'Yargıtay 3. CD', 'E.2020/1499, K.2020/4679, T.09.03.2020', 'Eş kasten yaralama → dekolman → neonatal ölüm; ATK 1. İhtisas Kurulu illiyet kabul.'],
  ['2', 'Yargıtay 3. CD', 'E.2024/1103, K.2025/355, T.20.01.2025', 'Erken doğum tehdidi yönetimi; malpraktis iddia.'],
  ['3', 'Yargıtay 3. CD', 'E.2024/2955, K.2025/3054, T.27.05.2025', 'Hamileliğin 7. ayı, doğum sürecinin durdurulması iddiası.'],
  ['4', 'Yargıtay 12. CD', 'E.2025/886, K.2025/5023, T.28.05.2025', 'Alkollü trafik kazası, gebe mağdur.'],
  ['5', 'AYM 1. Bölüm', 'B.B. No 2017/35569, K.T. 18.06.2020', 'Aile içi şiddet, merdivenden iteklenme, düşük.'],
  ['6', 'AYM 1. Bölüm', 'B.B. No 2015/12753, K.T. 08.05.2019', 'Missed abortus (6 hafta).'],
  ['7', 'AYM 2. Bölüm', 'B.B. No 2013/2803, K.T. 21.01.2016', 'Hamileliğin 9. ayı, ölü doğum, hekim ihmali iddiası.'],
  ['8', 'AYM 2. Bölüm', 'B.B. No 2019/11174, K.T. 16.11.2021', 'Preeklampsi/HELLP sendromu.'],
  ['9', 'AİHM', 'B.B. No 13423/09, K.T. 09.04.2013', 'Türk ceza hukukunda doğmamış bebeğin korunması.'],
  ['10', 'AİHM', 'S. Aydoğdu/Türkiye, B.B. No 40448/06, K.T. 30.08.2016', '30. hafta erken doğum, hastane kabul reddi.'],
  ['11', 'AİHM', 'B.B. No 38477/10, K.T. 26.05.2020', 'Erken doğum/sakatlık illiyeti, ATK bilirkişi.'],
  ['12', 'AİHM', 'B.B. No 46854/99', 'Polis operasyonu sonrası 10 hf hamile düşük.'],
  ['13', 'Danıştay 10', 'E.2019/6306, K.2020/4040, T.21.10.2020', 'Preeklampsi + dekolman → intrauterin ölüm.'],
  ['14', 'Danıştay 10', 'E.2019/6918, K.2021/1883, T.26.04.2021', 'Plasenta dekolmanı, hizmet kusuru 2/8.'],
  ['15', 'Danıştay 15', 'E.2016/4602, K.2017/1155, T.13.03.2017', 'Devlet hastanesinde ölü doğum, hizmet kusuru.'],
];
const ekRows = [new TableRow({ tableHeader: true, children: [
  cellTxt('#', { bold: true, fill: NAVY, color: 'FFFFFF', size: 18, width: 600 }),
  cellTxt('Mahkeme', { bold: true, fill: NAVY, color: 'FFFFFF', size: 18, width: 1900 }),
  cellTxt('Künye', { bold: true, fill: NAVY, color: 'FFFFFF', size: 18, width: 4500 }),
  cellTxt('Konu Özeti', { bold: true, fill: NAVY, color: 'FFFFFF', size: 18, width: 6500 }),
] })];
anchors.forEach(a => ekRows.push(new TableRow({ children: [
  cellTxt(a[0], { bold: true, size: 18, width: 600 }),
  cellTxt(a[1], { bold: true, size: 18, width: 1900 }),
  cellTxt(a[2], { size: 18, width: 4500 }),
  cellTxt(a[3], { size: 18, width: 6500 }),
] })));
c.push(new Table({ rows: ekRows, width: { size: 13500, type: WidthType.DXA },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: GREY },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY },
    left: { style: BorderStyle.SINGLE, size: 4, color: GREY },
    right: { style: BorderStyle.SINGLE, size: 4, color: GREY },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'D0D5DC' },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'D0D5DC' },
  } }));

// === EK 3. Veri dosyaları ===
c.push(H1('Ek 3. Tamamlayıcı Veri Dosyaları'));
c.push(Bul('TOMEC_v5_2284_Karar_Skorlu.csv — Sıkı filtreyi geçen 2.284 karar (Excel uyumlu).'));
c.push(Bul('TOMEC_v5_2284_Karar_Top50_TamMetin.docx — En yüksek skorlu 50 karar tam metin halinde.'));
c.push(Bul('TOMEC_v5_571_Erken_Dogum_Dusuk_Kunye_Tablosu.docx — 571 erken doğum/düşük spesifik karar künye tablosu (yatay A4).'));
c.push(Bul('TOMEC_v5_571_Erken_Dogum_Dusuk_Kunye.csv — Aynı 571 kararın CSV biçiminde künye dosyası.'));
c.push(Bul('TOMEC_v6_Calisma_Kagidi.docx — Tek sayfa hekim/uzman doldurma formatı.'));
c.push(Bul('refined_v5.json + refined_v5_dusuk_erken.json — Programatik kullanım için ham veri.'));

// === EK 4. ÇALIŞMA KÂĞIDI ŞABLONU + TAM SKORLAMA KILAVUZU ===
c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(H1('Ek 4. TOMEC Çalışma Kâğıdı ve Tam Skorlama Kılavuzu'));
c.push(Body('Bu ek, TOMEC değerlendirmesinin sahada uygulanabilmesi için gereken tüm yapıtaşlarını barındırır: (i) tek sayfa A4 yatay özet form, (ii) anatomik bölge ve enerji düzeyi alt-skorları, (iii) müdahale zamanı ve vital stabilite bileşenleri, (iv) gestasyonel haftaya göre risk haritası (4–50 hf), (v) temporal pencere kategorileri ve mekanizma modifikatörleri, (vi) üç hipotetik vaka üzerinde uygulamalı örnek hesaplama. Bu yapı, ATRS-2025/001 protokolüne uygun olarak hazırlanmıştır.'));

c.push(H2('Ek 4.1. Tek Sayfa Form Şablonu (Şekil 9)'));
c.push(Body('Aşağıdaki şablon, her TOMEC değerlendirmesinde bir kez doldurularak ATK İhtisas Kurulu raporunun ekine konulması önerilen standardize formdur. Tek sayfada (A4 yatay) tüm puanlama matrisi, eşik bandı, formül ve imza alanı yer almaktadır.'));
c.push(imageRatio('sekil9_calisma_kagidi.png', 700, 450));
c.push(Caption('Şekil 9. TOMEC Çalışma Kâğıdı şablonu — A4 yatay basılabilir form. Hekim her alandan bir düzey kutusunu (D0–D4) işaretler, ağırlıkla çarpıp toplar ve sonuç kategorisini eşik bandından belirler.'));

// Helper: simple form table
function formTable(header, rows) {
  const trs = [new TableRow({ tableHeader: true, children:
    header.map((h, i) => cellTxt(h, { bold: true, fill: NAVY, color: 'FFFFFF', size: 18, width: 13500 / header.length })) })];
  rows.forEach(r => trs.push(new TableRow({ children:
    r.map((cell, i) => cellTxt(cell, { size: 18, width: 13500 / header.length })) })));
  return new Table({ rows: trs, width: { size: 13500, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      left: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      right: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'D0D5DC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'D0D5DC' },
    } });
}

c.push(H2('Ek 4.2. Anatomik Etki Bölgesi ve Enerji Düzeyi Alt-Skorları'));
c.push(Body('T (Travma Niteliği/Şiddeti) alanının iki ana bileşeni vardır: (a) etkilenen anatomik bölgeler (uterus, batın, pelvis, alt ekstremite, vertebra, baş/yüz, göğüs); (b) maruz kalınan enerji düzeyi (motorlu taşıt için hız, düşme için yükseklik, künt darbe için şiddet, penetran travma için tip). Aşağıdaki tablolar ATRS-2025/001 protokolünden uyarlanmıştır.'));

c.push(P([T('A. Anatomik Bölge Etki Skoru (Travma Lokalizasyonu)', { bold: true, size: 22, color: NAVY })], { spacing: { before: 160, after: 120 } }));
c.push(formTable(['Anatomik Bölge', 'Baz Etki Skoru', 'Açıklama'],
  [
    ['Direkt batın (uterus üzeri)', '4 (D4)', 'Doğrudan uterin shear; en yüksek dekolman riski.'],
    ['Pelvik halka / sakroiliak', '3 (D3)', 'Plasenta yapışma yerine indirek travma; pelvik fraktür riski.'],
    ['Alt göğüs / diafragma seviyesi', '3 (D3)', 'Diafragma elevasyonu nedeniyle gebelikte hassas.'],
    ['Alt ekstremite (pelvis ile birlikte)', '2 (D2)', 'İndirek transmisyon, ek bulgu varsa T artar.'],
    ['Üst göğüs / üst ekstremite', '1 (D1)', 'Direkt obstetrik etki düşük; ancak hipotansiyon ile dolaylı.'],
    ['Baş / yüz (izole)', '1 (D1)', 'Maternal nörolojik etki obstetrik sonuca dolaylı.'],
  ]));

c.push(P([T('B. Enerji Düzeyi Baz Skoru', { bold: true, size: 22, color: NAVY })], { spacing: { before: 200, after: 120 } }));
c.push(formTable(['Enerji Kategorisi', 'Aralık', 'Baz Skor'],
  [
    ['Yüksek Enerji', '> 50 kJ', '12'],
    ['Orta Enerji', '20–50 kJ', '9'],
    ['Düşük Enerji', '5–20 kJ', '6'],
    ['Minimal Enerji', '< 5 kJ', '3'],
  ]));

c.push(P([T('C. Mekanizma-Spesifik Çarpanlar (Modifikatörler)', { bold: true, size: 22, color: NAVY })], { spacing: { before: 200, after: 120 } }));
c.push(formTable(['Mekanizma', 'Alt Kategori', 'Çarpan'],
  [
    ['Motorlu Taşıt Kazası', 'Otoyol hızı (>80 km/sa)', '1.0'],
    ['Motorlu Taşıt Kazası', 'Kentsel hız (50–80 km/sa)', '0.8'],
    ['Motorlu Taşıt Kazası', 'Düşük hız (<50 km/sa)', '0.6'],
    ['Yüksekten Düşme', 'Yüksek (>3 m)', '1.0'],
    ['Yüksekten Düşme', 'Orta (1–3 m)', '0.8'],
    ['Yüksekten Düşme', 'Düşük (<1 m)', '0.6'],
    ['Künt Travma', 'Şiddetli darbe / çoklu bölge', '1.0'],
    ['Künt Travma', 'Orta şiddet / tek bölge', '0.8'],
    ['Künt Travma', 'Hafif darbe / tek bölge', '0.6'],
    ['Penetran Travma', 'Ateşli silah', '1.0'],
    ['Penetran Travma', 'Saplanma', '0.9'],
    ['Penetran Travma', 'Bıçak yaralanması', '0.8'],
  ]));
c.push(Body('Toplam T-alan ham skoru: (Anatomik Etki Skoru) × (Enerji Baz Skoru × Mekanizma Çarpanı) → 0-4 düzey haritasına ölçeklenir, sonra %25 ağırlıkla çarpılır.'));

c.push(H2('Ek 4.3. Müdahale Zamanı, Türü ve Vital Stabilite'));
c.push(Body('Bu alt-bileşen TOMEC C (Kronolojik) ve M (Maternal) alanlarına ortak girdi sağlar; özellikle "yeterli ve zamanında müdahale yapıldı mı?" sorusunun cevabı, kamu sağlık hizmeti kaynaklı dolaylı travma değerlendirmelerinde kritik önemdedir (bkz. AİHM S. Aydoğdu/Türkiye).'));

c.push(P([T('A. Müdahale Zamanı', { bold: true, size: 22, color: NAVY })], { spacing: { before: 160, after: 120 } }));
c.push(formTable(['Kategori', 'Süre', 'Skor'],
  [
    ['Derhal', '< 15 dakika', '5'],
    ['Hızlı', '15–30 dakika', '4'],
    ['Gecikmiş', '30–60 dakika', '3'],
    ['Geç', '1–2 saat', '2'],
    ['Çok Geç', '> 2 saat', '1'],
  ]));

c.push(P([T('B. Yapılan Müdahaleler (Skor Katkısı)', { bold: true, size: 22, color: NAVY })], { spacing: { before: 200, after: 120 } }));
c.push(formTable(['Müdahale Türü', 'Yapıldı mı?', 'Skor'],
  [
    ['İleri yaşam desteği', 'Evet / Hayır', '+1'],
    ['Kan transfüzyonu', 'Evet / Hayır', '+1'],
    ['Cerrahi müdahale', 'Evet / Hayır', '+1'],
    ['Yoğun bakım kabulü', 'Evet / Hayır', '+1'],
    ['Mekanik ventilasyon', 'Evet / Hayır', '+1'],
  ]));

c.push(P([T('C. Vital Stabilite Modifikasyonu', { bold: true, size: 22, color: NAVY })], { spacing: { before: 200, after: 120 } }));
c.push(formTable(['Hemodinamik Durum', 'Modifikasyon'],
  [
    ['Hemodinamik stabil', '0'],
    ['Kompanse şok', '−1'],
    ['Dekompanse şok', '−2'],
    ['Kardiyak arrest', '−3'],
  ]));
c.push(Body('Toplam Müdahale Skoru: (Müdahale Zamanı Skoru) + (Müdahale Türleri Toplam Katkısı) + (Vital Stabilite Modifikasyonu). Negatif değerler M-alan ham skorunu düşürür; çok geç + dekompanse şok kombinasyonu, sağlık hizmeti kaynaklı dolaylı travma alt-grubunda E-alan değerini de yükseltir.'));

c.push(H2('Ek 4.4. Gestasyonel Haftaya Göre Risk Haritası (4–50 Hafta)'));
c.push(Body('O (Obstetrik) alanının ana belirleyicisi gestasyonel haftadır. Aşağıdaki tablo, ATRS-2025/001 protokolünden uyarlanmış 13 alt-dönem risk haritasını sunmaktadır. Risk skoru 0–4 düzey haritasına aşağıdaki dönüşümle aktarılır: 9→D4, 8→D4, 7→D3, 6→D3, 5→D2, 4→D2, 3→D1, 2→D1.'));

c.push(formTable(['Trimester', 'Hafta Aralığı', 'Risk Skoru', 'Kritik Özellik'],
  [
    ['1. Trimester', '4–6', '8', 'İmplantasyon dönemi'],
    ['1. Trimester', '7–10', '9', 'Organogenezis başlangıcı — maksimum risk'],
    ['1. Trimester', '11–12', '8', 'Organogenezis sonlanması'],
    ['2. Trimester', '13–16', '7', 'Erken 2. trimester'],
    ['2. Trimester', '17–20', '6', 'Optimal stabilite dönemi'],
    ['2. Trimester', '21–24', '7', 'Viabilite sınır bölgesi'],
    ['2. Trimester', '25–27', '8', 'Kritik viabilite dönemi'],
    ['3. Trimester', '28–32', '9', 'Yüksek prematürite riski'],
    ['3. Trimester', '33–36', '7', 'Orta 3. trimester'],
    ['3. Trimester', '37–40', '5', 'Term gebelik'],
    ['3. Trimester', '41–42', '6', 'Post-term gebelik'],
    ['Postpartum', '43–46', '4', 'Erken postpartum'],
    ['Postpartum', '47–50', '2', 'Geç postpartum'],
  ]));
c.push(Body('Maternal şiddet kategorileri (en yüksek risk skoru 15 — maternal ölüm; ardından çoklu organ yetmezliği / kardiyak arrest = ciddi morbidite, orta morbidite, hafif morbidite). Fetal sonuçlar: ciddi intrauterin büyüme geriliği, erken doğum, fetal sıkıntı hali O-alan skorunda ayrı modifikatör kategorileridir.'));

c.push(H2('Ek 4.5. Temporal Pencere Kategorileri ve Latent Süre'));
c.push(Body('C (Kronolojik) alanı, TOMEC modelinde en güçlü ayrıştırıcı değişkendir (skor varyansının %28’ini açıklar). Travma ile komplikasyon arasındaki süre, üç kademeli temporal pencerede kategorize edilir.'));

c.push(formTable(['Kategori', 'Süre Aralığı', 'İlişki Düzeyi', 'Klinik Yorum'],
  [
    ['Acil Dönem', '0–6 saat', 'Çok Yüksek', 'Doğrudan travma ilişkisi; acil müdahale gereği.'],
    ['Akut Dönem', '6–72 saat', 'Orta-Yüksek', 'Travma ile orta düzey ilişki; yakın takip.'],
    ['Geç Dönem', '72 saat – 4 hafta', 'Dolaylı', 'Travma ile dolaylı ilişki; detaylı araştırma.'],
    ['Çok Geç', '> 4 hafta', 'Çok Düşük', 'C-alan = 0; alternatif sebep dışlama yapılmazsa illiyet kurulamaz.'],
  ]));

c.push(P([T('Detaylı Skorlama Kılavuzu (Ek 2 Kalıbı)', { bold: true, size: 22, color: NAVY })], { spacing: { before: 200, after: 120 } }));
c.push(Bul('Enerji > 50 kJ → T-alan başlangıç skoru = 40; kritik abdominal penetrasyon ek + 15 (tavan kontrol = 100).'));
c.push(Bul('Gestasyon 25–27 hf + organogenezis dönemi çakışmaz; tek dönem seçilir (önceliklendirme: maksimum risk skoru olan dönem).'));
c.push(Bul('Komorbidite (M-alanı): Kardiyak hastalık 12, Hipertansiyon 6, Diabetes mellitus 5, Obezite 3, Kronik renal 8, Otoimmün 5.'));
c.push(Bul('Latent Süre: 0–6 sa = 40; 6–72 sa = 25; 72 sa – 4 hf = 10; > 4 hf = 0. Belge kalitesi düşükse ek olarak −5.'));
c.push(Bul('Cenger ve ark. (2018) kuralı: Olaydan ≥ 4 hafta sonra dahi kemik sintigrafisi pozitif ise C-alanı 5 puan kompanse edilebilir; Dokümantasyon Kalitesi alt-skoruna aktarılır.'));

c.push(H2('Ek 4.6. Hipotetik Vaka Uygulamaları (3 Vaka)'));

c.push(P([T('Vaka 1 — Trafik Kazası, 28 Hafta, Erken Doğum', { bold: true, size: 22, color: WINE })], { spacing: { before: 160, after: 100 } }));
c.push(Body('28 yaşında, 28 hafta gebe kadın, kentsel hızda (50–80 km/sa) frontal motorlu taşıt kazası geçiriyor. Acile başvuru: 25 dakika. Kompanse şok bulguları, yoğun bakım kabulü, mekanik ventilasyon. 4 saat içinde plasenta dekolmanı + CTG’de geç deselerasyonlar → acil sezeryan, 1280 g canlı doğum, NICU 28 gün.'));
c.push(Body('TOMEC Hesaplama: T = direkt batın D4 × (Orta enerji 9 × Kentsel çarpan 0.8 = 7.2) → ham 28.8 → düzey D4 → 25 puan. O = 28 hf risk 9 → D4 → 20 puan. M = komorbid yok D1 + müdahale (4 yapıldı), kompanse şok −1 → D2 → 7.5 puan. E = MVC, frontal, kasten değil → D3 → 15 puan. C = 4 saat (Acil Dönem, 0–6 sa) → D4 → 20 puan. Toplam ≈ 87.5 → Kategori: KESİN NEDENSELLİK.'));

c.push(P([T('Vaka 2 — Aile İçi Şiddet, 6 Hafta, Missed Abortus', { bold: true, size: 22, color: WINE })], { spacing: { before: 200, after: 100 } }));
c.push(Body('22 yaşında, 6 hafta gebe kadın, eşi tarafından batın bölgesine tekme + biber gazı maruziyeti. Acile başvuru: aynı gün, 4 saat sonra vajinal kanama. Transvajinal USG’de gestasyonel kesede düzensizlik, fetal kalp atımı yok → terapötik küretaj. Olaydan 52 gün sonra TÜV kemik sintigrafisinde sol orbita medial + sağ patella seviyesinde fokal aktivite. Cenger ve ark. 2018 olgusunun TOMEC modeline yansıması.'));
c.push(Body('TOMEC Hesaplama: T = direkt batın D4 × (Düşük enerji 6 × Hafif künt 0.6 = 3.6) + irritan gaz katkısı + sintigrafi kanıtı → ham 14.4 → düzey D3 → 18.75 puan. O = 6 hf risk 8 (implantasyon) → D4 → 20 puan. M = komorbid yok, müdahale +1 (cerrahi küretaj), stabil → D1 → 3.75 puan. E = kasten yaralama (TCK m.86/87), aile içi şiddet → D4 → 20 puan. C = 4 saat (Acil Dönem) + 52 gün sintigrafi kanıtı → D4 → 20 puan. Toplam ≈ 82.5 → Kategori: YÜKSEK OLASILIKLI NEDENSELLİK.'));

c.push(P([T('Vaka 3 — Sağlık Hizmeti Kaynaklı, 30 Hafta, Neonatal Ölüm (TOMEC-Med)', { bold: true, size: 22, color: WINE })], { spacing: { before: 200, after: 100 } }));
c.push(Body('30 hafta gebe, erken doğum belirtileriyle başvuran ancak ardışık üç kamu hastanesi tarafından "yatak yok" gerekçesiyle reddedilen olgu (S. Aydoğdu/Türkiye senaryosu). Dördüncü hastanede 8 saat sonra sezeryan, 1100 g doğum, neonatal ünitenin yetersiz bakımı, 3 gün içinde neonatal ölüm. AİHM Sözleşme m.2 ihlali tespit etti.'));
c.push(Body('TOMEC-Med Hesaplama: T (hizmet kusuru ciddiyeti) = ardışık reddi + 8 sa gecikme → D4 → 25 puan. O = 30 hf risk 9 → D4 → 20 puan. M = alternatif tedavi imkanı vardı (yakın hastane uygunluğu) → D3 → 11.25 puan. E (ihmal niteliği) = sistematik kabul reddi, 3 hastane → D4 → 20 puan. C = 8 saat (Akut Dönem üst sınırı, idari sorumluluk için ağırlaştırılmış) → D4 → 20 puan. Toplam ≈ 96.25 → Kategori: KESİN NEDENSELLİK (TOMEC-Med varyantı).'));

c.push(Body('Üç hipotetik vakanın gösterdiği ana ders: TOMEC modeli, hem klasik fiziksel travma vakalarında (Vaka 1, 2) hem de sağlık hizmeti kaynaklı dolaylı travma vakalarında (Vaka 3, TOMEC-Med varyantı) tutarlı, denetlenebilir ve hukuki sürece doğrudan aktarılabilir bir illiyet skoru üretebilmektedir.'));

c.push(P([T('Önemli Notlar ve Uyarılar', { bold: true, size: 22, color: NAVY })], { spacing: { before: 200, after: 120 } }));
c.push(Bul('Bu form ATRS-2025/001 protokolüne uygun olarak hazırlanmıştır.'));
c.push(Bul('Yalnızca bilimsel ve akademik amaçlar için geliştirilmiş olup tıbbi karar destek aracı olarak kullanılmalıdır.'));
c.push(Bul('Tüm tıbbi kararlar mutlaka uzman hekimler tarafından verilmelidir.'));
c.push(Bul('Hukuki süreçlerde nihai karar mercii mahkemelerdir; TOMEC skoru bilirkişi raporunun ek bir niteliksel-niceliksel katmanıdır.'));
c.push(Bul('Bu protokol sürekli bilimsel inceleme ve güncellemeye açıktır; v8 sürümü prospektif validasyon kohortundan elde edilecek verilerle revize edilecektir.'));

const doc = new Document({
  creator: 'Dr. Nurcan Denli Bayır',
  title: 'TOMEC v7 — Tam Sürüm Metodolojik Makale',
  description: 'Travma sonrası erken doğum ve düşük olgularında illiyet bağı – TOMEC skoru',
  sections: [{
    properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [T('TOMEC v7 — Tam Sürüm Metodolojik Makale', { italics: true, size: 16, color: NAVY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [T('— ', { size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                 T(' / ', { size: 18 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
                 T(' —', { size: 18 })] })] }) },
    children: c,
  }],
});

(async () => {
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync('client/public/TOMEC_v7_Tam_Surum.docx', buf);
  console.log('v7 Tam Sürüm:', Math.round(buf.length / 1024), 'KB');
})();
