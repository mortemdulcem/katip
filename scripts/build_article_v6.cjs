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
  const buf = fs.readFileSync(path.join('client/public/figures', filename));
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 },
    children: [new ImageRun({ data: buf, type: 'png', transformation: { width: w, height: Math.round(w * 0.66) } })] });
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
  children: [T('Travma Sonrası Erken Doğum ve Düşük Olgularında', { bold: true, size: 36, color: NAVY })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
  children: [T('Fiil–Sonuç İlliyet Bağının Standardize Edilmesi:', { bold: true, size: 30, color: NAVY })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480 },
  children: [T('TOMEC (Travma–Obstetrik Mediko-legal Causality) Skorunun', { bold: true, size: 28, color: NAVY }),
             T('\n3.501 Yargı Kararı Üzerinde Retrospektif Sınanması', { bold: true, size: 28, color: WINE })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
  children: [T('Metodolojik Makale — v6 (Genişletilmiş)', { italics: true, size: 24 })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800, after: 100 },
  children: [T('Dr. Nurcan Denli Bayır', { bold: true, size: 26, color: NAVY })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
  children: [T('Adli Tıp Kliniği, Ankara Bilkent Şehir Hastanesi', { size: 22 })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
  children: [T(new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }), { size: 22 })] }));
c.push(new Paragraph({ children: [new PageBreak()] }));

// === İÇİNDEKİLER (manuel) ===
c.push(H1('İçindekiler'));
const TOC = [
  ['Türkçe Özet · English Abstract', '3'],
  ['1. Giriş', '5'],
  ['2. Literatür: Gebelikte Mekanik Travma ve İlliyet Bağı', '7'],
  ['3. Yöntem', '12'],
  ['4. Bulgular — Tematik Analiz (8 alt-grup)', '17'],
  ['5. Patofizyolojik Çerçeve', '32'],
  ['6. TOMEC Skorunun Adli Karar Mekanizmasındaki Yeri', '34'],
  ['7. Tartışma', '36'],
  ['8. Sınırlılıklar ve Prospektif Validasyon Önerisi', '38'],
  ['9. Sonuç', '39'],
  ['Kaynaklar (AMA stili)', '40'],
  ['Ek 1. Şekil ve Tablo Listesi', '42'],
  ['Ek 2. Anahtar Emsal Karar Künye Listesi (15 karar)', '43'],
  ['Ek 3. Tamamlayıcı Veri Dosyaları', '44'],
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
c.push(P([T('Standardization of Causality Assessment in Pregnancy-Related Trauma Leading to Preterm Birth or Pregnancy Loss: Retrospective Testing of the TOMEC (Trauma–Obstetric Medico-legal Causality) Score on 3,501 Turkish Court Decisions',
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
c.push(Body('Anayasa Mahkemesi, gebe kadının travmaya maruz kalması ve sonucunda gebeliğini kaybetmesi olgularını Anayasa m.17 (yaşam hakkı) ve Sözleşme m.2/3 standartları altında değerlendirmektedir. AYM 2. Bölüm, B.B. No 2013/2803 (K.T. 21.01.2016) kararı, hamileliğin 9. ayında ölü doğum yapan başvurucunun şikâyetini, sağlık hizmetinden kaynaklı yaşam hakkı ihlali iddiası kapsamında ele almıştır.'));
c.push(Body('Avrupa İnsan Hakları Mahkemesi pratiğinde, S. Aydoğdu/Türkiye (B.B. No 40448/06, K.T. 30.08.2016) kararı, gebeliğinin 30. haftasında erken doğum belirtileriyle başvuran annenin hastane tarafından kabul edilmemesi ve yenidoğanın hayatını kaybetmesi olgusunu Sözleşme m.2 (yaşam hakkı) ihlali olarak değerlendirmiştir. Bu karar, TOMEC modelinin "kamu sağlık hizmetinden kaynaklı dolaylı travma" genişletmesi (TOMEC-Med varyantı) için referans niteliğindedir.'));

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

c.push(new Paragraph({ children: [new PageBreak()] }));

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

// === 8. SINIRLILIKLAR ===
c.push(H1('8. Sınırlılıklar ve Prospektif Validasyon Önerisi'));
c.push(Body('Bu çalışmanın başlıca sınırlılığı, tek bir içtihat veritabanına dayanması ve veritabanındaki kararların Sinerji Mevzuat tarafından belirlenen indeksleme algoritmasından etkilenmesidir. UYAP üzerinden ek tarama, ATK kurul kararları arşivinden bağımsız bir kontrol grubu ve uluslararası karşılaştırma (ABD ACOG, NICE, RANZCOG rehberleri) ileride yapılmalıdır. Otomatik regex tabanlı sınıflandırma yanlış pozitif/negatif içerebileceğinden, prospektif çalışmada üç adli tıp uzmanı tarafından bağımsız kor edilmesi planlanmalıdır.'));
c.push(Body('Prospektif validasyon için Bilkent Şehir Hastanesi Adli Tıp Kliniği’nde başlatılacak bir kohort önerilmektedir. Çalışma popülasyonu: kliniğe gebe kadına yönelik şiddet, trafik kazası, iş kazası veya tıbbi malpraktis iddiası ile başvurulan tüm vakalar. Birincil çıktı: TOMEC kategorisi ile ATK İhtisas Kurulu sonucu/yargı sonucu arasındaki uyum (Cohen κ). İkincil çıktılar: gözlemciler arası güvenirlik, alt-bileşen ağırlıklarının optimizasyonu, eşik kalibrasyonu.'));

// === 9. SONUÇ ===
c.push(H1('9. Sonuç'));
c.push(Body('Hocam, bu çalışma TOMEC skorunu Türk yargı içtihat tabanı (4 dalga, 3.501 karar) üzerinden retrospektif olarak konumlandıran ilk metodolojik adımdır. 571 erken doğum/düşük spesifik karar, modelin ana alanlarının (T, O, M, E, C) yargı pratiğindeki gerçek olgularla uyumlu olduğunu göstermektedir. Bir sonraki adım, prospektif kohort üzerinde validasyon ve sonrasında ATK Kurullarına bir rehber önerisi olarak sunulmasıdır.'));

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

// === EK 4. ÇALIŞMA KÂĞIDI ŞABLONU ===
c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(H1('Ek 4. TOMEC Çalışma Kâğıdı Şablonu'));
c.push(Body('Aşağıdaki şablon, her TOMEC değerlendirmesinde bir kez doldurularak ATK İhtisas Kurulu raporunun ekine konulması önerilen standardize formdur. Tek sayfada (A4 yatay) tüm puanlama matrisi, eşik bandı, formül ve imza alanı yer almaktadır.'));
c.push(imageRatio('sekil9_calisma_kagidi.png', 700, 450));
c.push(Caption('Şekil 9. TOMEC Çalışma Kâğıdı şablonu — A4 yatay basılabilir form. Hekim her alandan bir düzey kutusunu (D0–D4) işaretler, ağırlıkla çarpıp toplar ve sonuç kategorisini eşik bandından belirler.'));

const doc = new Document({
  creator: 'Dr. Nurcan Denli Bayır',
  title: 'TOMEC v6 — Genişletilmiş Metodolojik Makale',
  description: 'Travma sonrası erken doğum ve düşük olgularında illiyet bağı – TOMEC skoru',
  sections: [{
    properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [T('TOMEC v6 — Metodolojik Makale', { italics: true, size: 16, color: NAVY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [T('— ', { size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                 T(' / ', { size: 18 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
                 T(' —', { size: 18 })] })] }) },
    children: c,
  }],
});

(async () => {
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync('client/public/TOMEC_v6_Genisletilmis_Makale.docx', buf);
  console.log('v6 Makale:', Math.round(buf.length / 1024), 'KB');
})();
