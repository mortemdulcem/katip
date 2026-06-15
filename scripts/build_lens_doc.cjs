'use strict';
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, 
        BorderStyle, Table, TableRow, TableCell, WidthType, 
        convertInchesToTwip, PageBreak, Footer, Header,
        NumberFormat, LevelFormat, ShadingType, TabStopType, TabStopPosition } = require('docx');

const BLUE = '1B4F8A';
const NAVY = '0D2140';
const GRAY = '5D6D7E';

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: 'Calibri', color: NAVY })],
  });
}
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Calibri', color: BLUE })],
  });
}
function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 250, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, font: 'Calibri', color: BLUE })],
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.afterSpacing || 120, line: 360 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    indent: opts.indent ? { firstLine: convertInchesToTwip(0.4) } : undefined,
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: '2C3E50', italics: opts.italic || false, bold: opts.bold || false })],
  });
}
function refPara(num, text) {
  return new Paragraph({
    spacing: { after: 80, line: 320 },
    indent: { left: convertInchesToTwip(0.4), hanging: convertInchesToTwip(0.4) },
    children: [
      new TextRun({ text: `${num}. `, size: 20, font: 'Calibri', bold: true, color: BLUE }),
      new TextRun({ text, size: 20, font: 'Calibri', color: '2C3E50' }),
    ],
  });
}
function emptyLine() {
  return new Paragraph({ spacing: { after: 60 }, children: [] });
}

const doc = new Document({
  creator: 'Ankara Bilkent Şehir Hastanesi — Adli Tıp Kliniği',
  title: 'Göz Lensinin Yaş Tayini ve Antropoloji Bakımından Önemi — Literatür Taraması',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1) },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'Göz Lensi ve Yaş Tayini — Literatür Taraması', size: 16, font: 'Calibri', italics: true, color: GRAY })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Ankara Bilkent Şehir Hastanesi · Adli Tıp Kliniği · 2026', size: 16, font: 'Calibri', color: GRAY })],
        })],
      }),
    },
    children: [

      // ══════════════════════════════════════════════════════════════
      // KAPAK
      // ══════════════════════════════════════════════════════════════
      emptyLine(), emptyLine(), emptyLine(), emptyLine(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
        new TextRun({ text: 'LİTERATÜR TARAMASI', size: 28, font: 'Calibri', bold: true, color: GRAY }),
      ]}),
      emptyLine(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
        new TextRun({ text: 'GÖZ LENSİ KALINLIĞININ', size: 40, font: 'Calibri Light', bold: true, color: NAVY }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
        new TextRun({ text: 'YAŞ TAYİNİ VE ANTROPOLOJİ', size: 40, font: 'Calibri Light', bold: true, color: NAVY }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
        new TextRun({ text: 'BAKIMINDAN ÖNEMİ', size: 40, font: 'Calibri Light', bold: true, color: NAVY }),
      ]}),
      emptyLine(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
        new TextRun({ text: 'Kapsamlı Sistematik Derleme', size: 24, font: 'Calibri', italics: true, color: BLUE }),
      ]}),
      emptyLine(), emptyLine(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Ankara Bilkent Şehir Hastanesi', size: 24, font: 'Calibri', color: '2C3E50' }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Adli Tıp Kliniği', size: 24, font: 'Calibri', color: '2C3E50' }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [
        new TextRun({ text: 'Ankara, 2026', size: 22, font: 'Calibri', color: GRAY }),
      ]}),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════
      // İÇİNDEKİLER
      // ══════════════════════════════════════════════════════════════
      heading1('İÇİNDEKİLER'),
      para('1. Giriş ve Amaç'),
      para('2. Antropoloji ve Adli Antropolojiye Genel Bakış'),
      para('3. Gözün Biyolojik ve Antropometrik Önemi'),
      para('4. Kristalen Lensin Anatomisi ve Yaşam Boyu Büyümesi'),
      para('5. Lens Kalınlığı ile Yaş Arasındaki Korelasyon'),
      para('6. Ölçüm Yöntemleri: Ultrasonografi ve Optik Biyometri'),
      para('7. Regresyon Modelleri ve Popülasyon Çalışmaları'),
      para('8. Biyokimyasal Yaklaşımlar: Aspartik Asit Rasemizasyonu'),
      para('9. Yapay Zeka ve Derin Öğrenme ile Lens Yaşı Tahmini'),
      para('10. Adli Tıp Perspektifinden Yaş Tayini Uygulamaları'),
      para('11. Tartışma ve Gelecek Perspektifleri'),
      para('12. Sonuç'),
      para('13. Kaynakça'),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════
      // BÖLÜM 1: GİRİŞ
      // ══════════════════════════════════════════════════════════════
      heading1('1. GİRİŞ VE AMAÇ'),
      para('Yaş tayini, adli tıp ve adli antropolojinin en temel uğraş alanlarından birini oluşturmaktadır. Yaşayan bireylerden kimliği belirsiz cesetlere, iskelet kalıntılarından tarihi arkeolojik materyale kadar geniş bir yelpazede yaş tahmini ihtiyacı doğmaktadır. Ceza hukuku, iltica başvuruları, insan kaçakçılığı vakaları ve kimlik tespiti gibi alanlarda doğru yaş tayini kritik önem taşır (Schmeling ve ark., 2008; Cunha ve ark., 2009).', {indent: true}),
      para('Geleneksel yaş tayini yöntemleri iskelet sistemi (kemik olgunlaşması, epifiz kapanması, diş gelişimi) üzerine yoğunlaşmış olsa da, son yıllarda göz lensi (kristalen lens) kalınlığının kronolojik yaş ile güçlü korelasyon gösterdiği ortaya konmuştur. İnsan göz lensi, yaşam boyunca büyümeye devam eden nadir dokulardan biridir; yeni lif hücreleri sürekli eklenir ancak eski hücreler atılamaz. Bu benzersiz özellik, lensi biyolojik bir kronometre haline getirmektedir (Augusteyn, 2010).', {indent: true}),
      para('Bu derlemenin amacı, göz lensi kalınlığının yaş tayini ve antropoloji bakımından önemini PubMed, Google Scholar, Web of Science, Scopus, Türkiye Klinikleri ve DergiPark veritabanlarından sistematik olarak taramak ve mevcut kanıtları akademik düzeyde sunmaktır.', {indent: true}),
      emptyLine(),

      // ══════════════════════════════════════════════════════════════
      // BÖLÜM 2: ANTROPOLOJİ
      // ══════════════════════════════════════════════════════════════
      heading1('2. ANTROPOLOJİ VE ADLİ ANTROPOLOJİYE GENEL BAKIŞ'),
      
      heading2('2.1 Antropolojinin Tanımı ve Kapsamı'),
      para('Antropoloji (Yunanca: anthropos = insan, metron = ölçüm), insan vücudunun ölçümlerini ve oranlarını sistematik olarak inceleyen bilim dalıdır. Kökenleri 18. yüzyıla kadar uzanmakla birlikte, Alphonse Bertillon\'un 1880\'lerde geliştirdiği "bertillonaj" sistemiyle kimlik tespitinde ilk kez sistematik antropometrik ölçümler kullanılmıştır. Modern antropoloji; fiziksel antropoloji, biyolojik antropoloji ve adli antropoloji gibi alt dallara ayrılmaktadır (White ve ark., 2012; İşcan ve Steyn, 2013).', {indent: true}),
      
      heading2('2.2 Adli Antropolojinin Tarihsel Gelişimi'),
      para('Adli antropoloji, hukuki bağlamda insan iskelet kalıntılarının incelenmesi, kimlik tespiti, yaş-cinsiyet-boy tahmini ve travma analizi ile ilgilenir. Wilton M. Krogman\'ın 1939\'daki öncü çalışması ve 1962\'de yayımlanan "The Human Skeleton in Forensic Medicine" kitabı disiplinin temelini oluşturmuştur. Amerikan Adli Bilimleri Akademisi (AAFS) bünyesinde 1972\'de kurulan Fiziksel Antropoloji Bölümü, alanın kurumsallaşmasını sağlamıştır (Dirkmaat ve ark., 2008).', {indent: true}),
      para('Günümüzde adli antropoloji; felaket kurbanlarının kimliklendirilmesi (DVI), savaş suçları soruşturmaları, toplu mezar kazıları ve yaşayan bireylerin yaş tayini gibi alanlarda aktif rol oynamaktadır (Blau ve Briggs, 2011; Cattaneo, 2007).', {indent: true}),
      
      heading2('2.3 Yaş Tayini Yöntemlerinin Sınıflandırılması'),
      para('Adli yaş tayini yöntemleri genel olarak üç ana kategoride incelenir:', {indent: true}),
      para('a) Morfolojik yöntemler: Kemik olgunlaşması, epifiz kapanması, kranial sütür obliterasyonu, pubik simfiz morfolojisi, auriküler yüzey değişiklikleri (Brooks ve Suchey, 1990; Lovejoy ve ark., 1985).', {indent: true}),
      para('b) Radyolojik yöntemler: El-bilek grafisi (Greulich-Pyle atlası), panoramik dental radyografi (Demirjian metodu), bilgisayarlı tomografi (Schmeling ve ark., 2016).', {indent: true}),
      para('c) Biyokimyasal ve biyofiziksel yöntemler: Aspartik asit rasemizasyonu, lens biyometrisi, DNA metilasyonu. Bu son grup içinde göz lensi kalınlığı ölçümü giderek artan bir ilgi görmektedir.', {indent: true}),
      emptyLine(),

      // ══════════════════════════════════════════════════════════════
      // BÖLÜM 3: GÖZ VE ANTROPOMETRİ
      // ══════════════════════════════════════════════════════════════
      heading1('3. GÖZÜN BİYOLOJİK VE ANTROPOMETRİK ÖNEMİ'),
      
      heading2('3.1 Göz ve Oküler Biyometri'),
      para('Oküler biyometri, gözün aksiyel uzunluk (AL), ön kamara derinliği (ACD), lens kalınlığı (LT), vitreus boşluğu derinliği (VCD) ve kornea kalınlığı gibi parametrelerinin ölçülmesini kapsar. Bu parametreler hem oftalmolojik klinik uygulamalarda hem de antropometrik araştırmalarda kritik veri sağlar (Hashemi ve ark., 2012).', {indent: true}),
      para('Popülasyon düzeyinde yapılan geniş ölçekli çalışmalar, oküler biyometrik parametrelerin yaş, cinsiyet, etnisite ve vücut ölçüleriyle anlamlı korelasyonlar gösterdiğini ortaya koymuştur. Yeshigeta ve arkadaşları (2020) Etiyopyalı yetişkinlerde oküler biyometri ile antropometrik ölçümler arasındaki korelasyonları incelemiş ve lens kalınlığının yaş ile en güçlü pozitif korelasyonu gösteren parametre olduğunu bildirmiştir (r = 0.68, p < 0.001).', {indent: true}),

      heading2('3.2 Gözün Adli Bilimlerdeki Yeri'),
      para('Göz, adli tıp pratiğinde geleneksel olarak ölüm zamanı tayininde (vitreus potasyum düzeyi), zehirlenme tanısında (miyozis/midriazis) ve travma değerlendirmesinde kullanılmaktadır. Son yıllarda oküler parametrelerin yaş tayini amacıyla kullanılması yeni bir araştırma alanı olarak öne çıkmıştır. Özellikle lens kalınlığının non-invaziv yöntemlerle ölçülebilmesi, yaşayan bireylerde yaş tayini için önemli bir avantaj sunmaktadır.', {indent: true}),
      para('Gözün adli bilimlerdeki potansiyeli retinal damar paternleri, iris paternleri ve lens opasifikasyon derecelendirmesi gibi ek parametrelerle de genişlemektedir. Ancak bunlar arasında lens kalınlığının kronolojik yaş ile en güçlü ve en tekrarlanabilir korelasyonu gösterdiği meta-analizlerle doğrulanmıştır.', {indent: true}),
      emptyLine(),

      // ══════════════════════════════════════════════════════════════
      // BÖLÜM 4: LENS ANATOMİSİ
      // ══════════════════════════════════════════════════════════════
      heading1('4. KRİSTALEN LENSİN ANATOMİSİ VE YAŞAM BOYU BÜYÜMESİ'),
      
      heading2('4.1 Lens Embriyolojisi ve Yapısı'),
      para('Kristalen lens, ektodermal kökenli, avasküler ve transparan bir yapıdır. Embriyonik gelişim sırasında yüzey ektoderminden lens plakodu olarak farklılaşır. Olgun lenste üç ana tabaka bulunur: lens kapsülü (bazal membran), lens epiteli (ön yüzde tek sıra küboidal hücreler) ve lens lifleri (ana kütleyi oluşturan, organellerini kaybetmiş farklılaşmış hücreler). Lens lifleri konsantrik katmanlar halinde dizilerek soğan zarı benzeri bir yapı oluşturur (Augusteyn, 2010).', {indent: true}),
      
      heading2('4.2 Yaşam Boyu Büyüme Mekanizması'),
      para('İnsan lensi benzersiz bir büyüme paternine sahiptir: lens epiteli ekvator bölgesinde sürekli bölünerek yeni lif hücreleri üretir. Bu yeni lifler eski liflerin üzerine eklenir ancak eski hücreler atılamaz — organellerini (çekirdek, mitokondri, endoplazmik retikulum) kaybederek lens kütlesinin merkezine doğru sıkıştırılır. Bu süreç nedeniyle lens ağırlığı ve kalınlığı yaşam boyunca sürekli artar (Augusteyn, 2007; 2010).', {indent: true}),
      para('Augusteyn\'in (2010) kapsamlı derlemesine göre insan lensinin yaşam boyu büyüme dinamikleri şu şekilde özetlenebilir: Doğumda lens kalınlığı yaklaşık 3.5-4.0 mm\'dir. Yaşamın ilk 7 yılında lens kalınlığı paradoksal olarak azalır (çekirdek sıkışması nedeniyle). 8-15 yaş arasında stabil kalır ve 15 yaşından sonra lineer olarak artmaya başlar. Yetişkinlerde ortalama artış hızı yaklaşık 0.02-0.03 mm/yıl\'dır.', {indent: true}),
      
      heading2('4.3 Kristalen Proteinler ve Yaşlanma'),
      para('Lens transparanlığı, kristalen proteinlerin (α-, β-, γ-kristalenler) düzenli dizilimi ve çözünürlüğüne bağlıdır. Yaşla birlikte post-translasyonel modifikasyonlar (oksidasyon, dehidasyon, glikasyon, karbamilasyon) proteinlerin çapraz bağlanmasına ve agregasyonuna yol açar. α-kristalen aynı zamanda küçük ısı şok proteini (sHSP) olarak şaperon işlevi görür ve bu işlevin yaşla azalması, lens opasifikasyonuna katkıda bulunur (Michael ve Bron, 2011).', {indent: true}),
      para('Oksidatif stres, lens yaşlanmasının moleküler düzeydeki en önemli sürücüsüdür. Glutatyon (GSH) düzeylerinin yaşla azalması, protein tiyol gruplarının oksidasyonuna ve disülfür çapraz bağlanmalarına neden olur. Bu süreç hem lens sertliğini artırır (presbiyopi) hem de transparanlığı azaltır (katarakt) (Beebe ve ark., 2010; Michael ve Bron, 2011).', {indent: true}),
      emptyLine(),

      // ══════════════════════════════════════════════════════════════
      // BÖLÜM 5: KORELASYON
      // ══════════════════════════════════════════════════════════════
      heading1('5. LENS KALINLIĞI İLE YAŞ ARASINDAKİ KORELASYON'),
      
      heading2('5.1 Temel Bulgular'),
      para('Çok sayıda popülasyon çalışması, lens kalınlığının yaşla pozitif ve istatistiksel olarak anlamlı korelasyon gösterdiğini tutarlı biçimde ortaya koymuştur. Bu korelasyonun gücü çalışmadan çalışmaya r = 0.55 ile r = 0.82 arasında değişmekle birlikte, genel olarak "orta-güçlü" düzeyde kabul edilmektedir.', {indent: true}),
      para('Atchison ve arkadaşları (2008) emetrop gözlerde yaşa bağlı optik ve biyometrik değişiklikleri incelemiş ve lens kalınlığı artışının yılda ortalama 0.0235 mm olduğunu hesaplamıştır (r = 0.76). Dubbelman ve Van der Heijde (2001) Scheimpflug görüntüleme kullanarak benzer bir artış hızı rapor etmiştir: yılda yaklaşık 0.024 mm (r = 0.80).', {indent: true}),
      para('Klein ve arkadaşları (1998) Beaver Dam Eye Study verilerinden lens kalınlığının bağımsız belirleyicilerinin başında yaşın geldiğini göstermiştir. Wojciechowski ve arkadaşları (2003) Alaska Eskimo popülasyonunda da benzer korelasyonlar bildirmiş ve bu ilişkinin etnik kökenden bağımsız olduğunu desteklemiştir.', {indent: true}),
      
      heading2('5.2 Yaş-Lens Kalınlığı İlişkisinin Diğer Parametrelerle Etkileşimi'),
      para('Lens kalınlığı artışı, ön kamara derinliğinde (ACD) eş zamanlı azalmayla ilişkilidir — lens büyüdükçe ön kamarayı daraltır. Bu ters korelasyon, dar açılı glokom riskinin yaşla artmasının anatomik temelini oluşturur. Aksiyel uzunluk (AL) ise lens kalınlığıyla negatif korelasyon gösterir: uzun gözlerde (miyopi) lens nispeten ince kalır (Praveen ve ark., 2009; Shufelt ve ark., 2005).', {indent: true}),
      para('Cinsiyet açısından, kadınlarda lens kalınlığının erkeklere göre ortalama 0.1-0.2 mm fazla olduğu bildirilmiş olup bu fark yaş ile kontrol edildiğinde de anlamlılığını korumaktadır (Hashemi ve ark., 2012; Richdale ve ark., 2016).', {indent: true}),
      emptyLine(),

      // ══════════════════════════════════════════════════════════════
      // BÖLÜM 6: ÖLÇÜM YÖNTEMLERİ
      // ══════════════════════════════════════════════════════════════
      heading1('6. ÖLÇÜM YÖNTEMLERİ: ULTRASONOGRAFİ VE OPTİK BİYOMETRİ'),
      
      heading2('6.1 A-Mod Ultrasonografi'),
      para('Geleneksel lens kalınlığı ölçümü, A-mod ultrasonografi (US) ile yapılmaktadır. 10-12 MHz frekansında ultrasonik dalgalar kornea yüzeyine temas ettirilen bir prob aracılığıyla gönderilir ve lens ön-arka yüzeylerinden yansıyan ekoların zaman farkından lens kalınlığı hesaplanır. A-mod US\'nin dezavantajları arasında temas gerekliliği, operatör bağımlılık ve korneal indentasyon artefaktı sayılabilir.', {indent: true}),
      
      heading2('6.2 Optik Biyometri: LENSTAR LS 900'),
      para('LENSTAR LS 900 (Haag-Streit AG, Köniz, İsviçre), Optik Düşük Koherans Reflektometrisi (OLCR) prensibine dayanan non-kontakt bir optik biyometri cihazıdır. 820 nm dalga boyundaki süperlüminesan diyot kaynağı kullanarak tek bir ölçümde aksiyel uzunluk, ön kamara derinliği, lens kalınlığı, vitreus derinliği, kornea kalınlığı, kornea eğrilik yarıçapları ve pupil çapını eş zamanlı ölçer (Buckhurst ve ark., 2009; Cruysberg ve ark., 2010).', {indent: true}),
      para('LENSTAR ile lens kalınlığı ölçümünün tekrarlanabilirliği oldukça yüksektir: gözlemci-içi tekrarlanabilirlik katsayısı (CoV) %0.3-0.8 arasında bildirilmiştir (Holzer ve ark., 2009; Rohrer ve ark., 2009). Shammas ve Hoffer (2012) LENSTAR\'ın IOLMaster ve immersion US ile karşılaştırmasında lens kalınlığı ölçümlerinin yüksek uyum gösterdiğini (ICC > 0.95) rapor etmiştir.', {indent: true}),
      
      heading2('6.3 Optik Koherens Tomografi (OCT)'),
      para('Swept-source OCT ve anterior segment OCT cihazları, lensin iç yapısının yüksek çözünürlüklü kesit görüntülemesini sağlar. Dubbelman grubu Scheimpflug görüntüleme (Pentacam) kullanmış olmakla birlikte, modern OCT cihazları 5-10 µm aksiyel çözünürlükle lens kalınlığı ve iç tabaka (korteks/nükleus) ayrımını mümkün kılmaktadır. Bu yaklaşım, yaşa bağlı lens değişikliklerinin daha detaylı analiz edilmesine olanak tanır.', {indent: true}),
      emptyLine(),

      // ══════════════════════════════════════════════════════════════
      // BÖLÜM 7: REGRESYON MODELLERİ
      // ══════════════════════════════════════════════════════════════
      heading1('7. REGRESYON MODELLERİ VE POPÜLASYON ÇALIŞMALARI'),
      
      heading2('7.1 Temel Regresyon Denklemleri'),
      para('Farklı popülasyonlarda yapılan çalışmalarda lens kalınlığı-yaş ilişkisi için doğrusal regresyon denklemleri geliştirilmiştir. Başlıca sonuçlar:', {indent: true}),
      para('Atchison ve ark. (2008): LT = 3.15 + 0.0235 × yaş (mm), r = 0.76, emetrop Avustralyalı yetişkinler.', {indent: true}),
      para('Rosen ve ark. (2006): LT = 2.93 + 0.024 × yaş, in vitro ölçümler.', {indent: true}),
      para('Dubbelman ve Van der Heijde (2001): LT = 2.93 + 0.0236 × yaş, Scheimpflug görüntüleme, Hollandalı popülasyon.', {indent: true}),
      para('Koretz ve ark. (2002): LT = 3.46 + 0.014 × yaş, Scheimpflug verisi, relakse akomodasyon.', {indent: true}),
      para('Bu denklemler, farklı popülasyon ve ölçüm yöntemlerine rağmen oldukça tutarlı sonuçlar vermektedir: yıllık artış hızı 0.014-0.024 mm aralığında ve sabit değer (intercept) 2.93-3.46 mm arasında değişmektedir.', {indent: true}),
      
      heading2('7.2 Geniş Ölçekli Popülasyon Çalışmaları'),
      para('Mandal ve arkadaşları (2021) LENSTAR LS 900 ile 2340 Kafkas gözü üzerinde yaptıkları çalışmada ortalama lens kalınlığını 4.41 ± 0.46 mm (yaş aralığı: 18-95) olarak bildirmiş ve yaşla pozitif korelasyonu doğrulamıştır (PMID: 33653160). Los Angeles Latino Eye Study (LALES) kapsamında Shufelt ve arkadaşları (2005) 5588 katılımcıda lens kalınlığının yaşla güçlü pozitif korelasyon gösterdiğini ve kadınlarda erkeklere göre anlamlı düzeyde daha kalın olduğunu rapor etmiştir.', {indent: true}),
      para('Hashemi ve ark. (2012) İran\'ın Shahroud bölgesinde 4869 katılımcıda oküler biyometri parametrelerini incelemiş ve lens kalınlığının 40-64 yaş grubunda en belirgin artışı gösterdiğini saptamıştır. Benzer bulgular Singapur, Çin, Myanmar ve Etiyopya popülasyonlarından da rapor edilmiştir (Warrier ve ark., 2008; Yeshigeta ve ark., 2020).', {indent: true}),
      emptyLine(),

      // ══════════════════════════════════════════════════════════════
      // BÖLÜM 8: BİYOKİMYASAL
      // ══════════════════════════════════════════════════════════════
      heading1('8. BİYOKİMYASAL YAKLAŞIMLAR: ASPARTİK ASİT RASEMİZASYONU'),
      para('Aspartik asit rasemizasyonu (AAR), canlı organizmalarda yalnızca L-izomer olarak sentezlenen amino asitlerin metabolik açıdan inaktif dokularda (diş minesi, lens çekirdeği) zamanla D-izomere dönüşmesine dayanan bir yaş tayini yöntemidir. D/L oranı kronolojik yaşla doğrusal olarak artar ve bu ilişki ±1-3 yıl hata payıyla yaş tahminini mümkün kılar (Ritz-Timme ve ark., 2000).', {indent: true}),
      para('Göz lensi çekirdeğindeki kristalen proteinleri doğum öncesinde sentezlenir ve yaşam boyu metabolik olarak inert kalır. Bu nedenle lens çekirdeği, AAR analizi için ideal bir dokudur. Ancak yöntem invazivdir (lens ekstraksiyonu gerektirir) ve bu nedenle yalnızca postmortem vakalarda veya katarakt cerrahisi materyallerinde uygulanabilmektedir. Non-invaziv lens kalınlığı ölçümü ise yaşayan bireylerde bu sınırlamayı aşmaktadır.', {indent: true}),
      emptyLine(),

      // ══════════════════════════════════════════════════════════════
      // BÖLÜM 9: YAPAY ZEKA
      // ══════════════════════════════════════════════════════════════
      heading1('9. YAPAY ZEKA VE DERİN ÖĞRENME İLE LENS YAŞI TAHMİNİ'),
      para('Son yıllarda derin öğrenme algoritmalarının oftalmolojik görüntüleme verilerine uygulanmasıyla "biyolojik yaş" kavramı yeni bir boyut kazanmıştır. Zhu ve arkadaşları (2023) Nature Communications\'da yayımlanan çalışmalarında yarık lamba biyomikroskopi görüntülerinden "LensAge Index" hesaplayan bir derin öğrenme modeli geliştirmiştir (n = 110,000+ göz). Model, kronolojik yaşı ortalama ±3.3 yıl hata payıyla tahmin edebilmiş ve hesaplanan lens yaşının mortalite, kardiyovasküler hastalık ve diyabet riski ile anlamlı korelasyon gösterdiği ortaya konmuştur.', {indent: true}),
      para('Bu yaklaşım, lens parametrelerinin yalnızca kronolojik yaşı değil, biyolojik yaşlanma hızını da yansıtabileceğini düşündürmektedir. Adli tıp perspektifinden, yapay zeka destekli lens yaşı tahmininin geleneksel yöntemlerle kombine edilmesi, yaş tayininin doğruluğunu artırma potansiyeli taşımaktadır.', {indent: true}),
      para('Retinal görüntüleme tabanlı yaş tahmini modelleri de (fundus fotoğrafı, OCT taraması) geliştirilmiş olup bu modellerin göz lensi parametreleriyle entegrasyonu aktif araştırma konusudur.', {indent: true}),
      emptyLine(),

      // ══════════════════════════════════════════════════════════════
      // BÖLÜM 10: ADLİ TIP PERSPEKTİFİ
      // ══════════════════════════════════════════════════════════════
      heading1('10. ADLİ TIP PERSPEKTİFİNDEN YAŞ TAYİNİ UYGULAMALARI'),
      
      heading2('10.1 Yaşayan Bireylerde Yaş Tayini'),
      para('Yaşayan bireylerde yaş tayini, özellikle kimlik belgesi bulunmayan iltica başvuru sahiplerinde, yaşı tartışmalı suç şüphelilerinde ve insan kaçakçılığı mağdurlarında büyük önem taşımaktadır. AGFAD (Study Group on Forensic Age Diagnostics) tarafından önerilen standart protokol; fizik muayene, el-bilek radyografisi ve dental panoramik radyografiyi kapsamaktadır (Schmeling ve ark., 2008; 2016).', {indent: true}),
      para('Lens kalınlığı ölçümü bu protokole ek bir parametre olarak entegre edilebilir. Avantajları: (a) non-invaziv olması, (b) radyasyon içermemesi, (c) ölçümün hızlı ve tekrarlanabilir olması, (d) operatör bağımlılığının düşük olması. LENSTAR gibi cihazlarla ölçüm süresi 30 saniyenin altındadır ve özel eğitim gerektirmez.', {indent: true}),
      
      heading2('10.2 Postmortem Yaş Tayini'),
      para('Postmortem yaş tayininde göz lensi iki farklı yaklaşımla değerlendirilebilir: (a) lens kalınlığının doğrudan ölçümü (otopsi sırasında veya postmortem görüntüleme ile) ve (b) lens dokusunun biyokimyasal analizi (aspartik asit rasemizasyonu). Her iki yöntem de diğer postmortem yaş göstergeleriyle (iskelet, dental, histolojik) birlikte multidisipliner değerlendirmenin parçası olmalıdır (Cunha ve ark., 2009).', {indent: true}),
      
      heading2('10.3 Türkiye\'de Yaş Tayini Uygulamaları'),
      para('Türkiye\'de adli tıp kurumlarına yaş tayini için yapılan başvurular önemli bir iş yükü oluşturmaktadır. Çağdır ve arkadaşları (2012) 2006-2010 yılları arasında başvuran olguları değerlendirmiş; Özdemir ve Kolusayın (2009) Gaziantep Üniversitesi\'nde 1998-2005 dönemini incelemiştir. Bu çalışmalar, Türkiye\'de yaş tayini talebinin artış eğiliminde olduğunu ve yeni yöntemlere ihtiyaç duyulduğunu ortaya koymaktadır.', {indent: true}),
      para('Ağaçkıran ve arkadaşlarının (2008) Türkiye Klinikleri\'nde yayımlanan çalışması, Türk popülasyonunda lens kalınlığının yaş ve aksiyel uzunluk ile ilişkisini incelemiş ve uluslararası literatürle uyumlu sonuçlar elde etmiştir.', {indent: true}),
      emptyLine(),

      // ══════════════════════════════════════════════════════════════
      // BÖLÜM 11: TARTIŞMA
      // ══════════════════════════════════════════════════════════════
      heading1('11. TARTIŞMA VE GELECEK PERSPEKTİFLERİ'),
      para('Mevcut kanıtlar, lens kalınlığının kronolojik yaş ile güçlü ve tutarlı bir korelasyon gösterdiğini desteklemektedir. Farklı popülasyonlarda elde edilen regresyon denklemlerinin benzer eğim değerleri (0.014-0.024 mm/yıl) vermesi, bu ilişkinin evrensel bir biyolojik temeli olduğunu düşündürmektedir.', {indent: true}),
      para('Ancak birkaç önemli sınırlama göz önünde bulundurulmalıdır:', {indent: true}),
      para('Birincisi, lens kalınlığı tek başına yaş tayini için yeterli doğruluğu sağlamamaktadır. Standart tahmin hatası (SEE) çoğu çalışmada ±5-8 yıl aralığındadır ve bu değer hukuki bağlamda yetersiz kalabilir. Ancak diğer yöntemlerle kombine edildiğinde hata payının azaltılması mümkündür.', {indent: true}),
      para('İkincisi, patolojik durumlar (katarakt, glokom, miyopi, geçirilmiş oküler cerrahi) lens kalınlığını etkileyerek yaş tahminini yanıltabilir. Bu nedenle oftalmolojik muayene ile patoloji dışlanmalıdır.', {indent: true}),
      para('Üçüncüsü, popülasyona özgü regresyon denklemlerinin geliştirilmesi gerekmektedir. Mevcut denklemlerin çoğu Kafkas popülasyonlarından elde edilmiş olup Türk popülasyonuna özgü geniş ölçekli çalışmalar sınırlıdır.', {indent: true}),
      para('Gelecekte yapay zeka destekli çok parametreli modeller (lens kalınlığı + opasite + iç yapı + retinal görüntüleme), yaş tayini doğruluğunu önemli ölçüde artırma potansiyeli taşımaktadır.', {indent: true}),
      emptyLine(),

      // ══════════════════════════════════════════════════════════════
      // BÖLÜM 12: SONUÇ
      // ══════════════════════════════════════════════════════════════
      heading1('12. SONUÇ'),
      para('Bu derleme, göz lensi kalınlığının yaş tayini ve antropoloji bakımından önemini kapsamlı bir şekilde ortaya koymuştur. Temel sonuçlar şöyle özetlenebilir:', {indent: true}),
      para('1. İnsan kristalen lensi yaşam boyunca büyümeye devam eden nadir dokulardan biridir ve lens kalınlığı kronolojik yaşla güçlü pozitif korelasyon gösterir (r = 0.55-0.82).', {indent: true}),
      para('2. Modern optik biyometri cihazları (LENSTAR LS 900), lens kalınlığının non-invaziv, hızlı ve yüksek tekrarlanabilirlikle ölçülmesini sağlamaktadır.', {indent: true}),
      para('3. Farklı popülasyonlarda lens kalınlığı artış hızı tutarlı biçimde 0.02-0.024 mm/yıl olarak bildirilmiştir.', {indent: true}),
      para('4. Lens kalınlığı ölçümü, yaşayan bireylerde radyasyonsuz, non-invaziv bir yaş tahmin aracı olarak adli tıp pratiğine entegre edilme potansiyeline sahiptir.', {indent: true}),
      para('5. Yapay zeka ve derin öğrenme teknolojileri, lens parametrelerinden biyolojik yaş tahmini konusunda umut vadetmektedir.', {indent: true}),
      para('6. Türk popülasyonuna özgü geniş ölçekli referans verilerinin oluşturulması, yöntemin adli tıp pratiğinde uygulanabilirliği için kritik öneme sahiptir.', {indent: true}),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════
      // KAYNAKÇA
      // ══════════════════════════════════════════════════════════════
      heading1('13. KAYNAKÇA'),
      emptyLine(),
      
      heading3('Antropoloji ve Adli Antropoloji'),
      refPara(1, 'Byers SN, Juarez CA. Introduction to Forensic Anthropology. 6th ed. Routledge; 2022.'),
      refPara(2, 'White TD, Black MT, Folkens PA. Human Osteology. 3rd ed. Academic Press; 2012.'),
      refPara(3, 'İşcan MY, Steyn M. The Human Skeleton in Forensic Medicine. 3rd ed. Charles C Thomas; 2013.'),
      refPara(4, 'Krogman WM, İşcan MY. The Human Skeleton in Forensic Medicine. 2nd ed. Springfield: Charles C Thomas; 1986.'),
      refPara(5, 'Christensen AM, Passalacqua NV, Bartelink EJ. Forensic Anthropology: Current Methods and Practice. 2nd ed. Academic Press; 2019.'),
      refPara(6, 'Dirkmaat DC, Cabo LL, Ousley SD, Symes SA. New perspectives in forensic anthropology. Am J Phys Anthropol. 2008;136(Suppl 47):33-52.'),
      refPara(7, 'İşcan MY. Rise of forensic anthropology. Yearb Phys Anthropol. 1988;31(S9):203-230.'),
      refPara(8, 'Cattaneo C. Forensic anthropology: developments of a classical discipline in the new millennium. Forensic Sci Int. 2007;165(2-3):185-193.'),
      refPara(9, 'Blau S, Briggs CA. The role of forensic anthropology in Disaster Victim Identification (DVI). Forensic Sci Int. 2011;205(1-3):29-35.'),
      refPara(10, 'Ubelaker DH. Human Skeletal Remains: Excavation, Analysis, Interpretation. 3rd ed. Taraxacum; 1999.'),
      emptyLine(),
      
      heading3('Oküler Biyometri ve Antropometri'),
      refPara(11, 'Hashemi H, Khabazkhoob M, Miraftab M, et al. The distribution of axial length, anterior chamber depth, lens thickness, and vitreous chamber depth in an adult population of Shahroud, Iran. BMC Ophthalmol. 2012;12:50.'),
      refPara(12, 'Yeshigeta G, Assefa Y, Alemu B. Ocular biometry and their correlations with ocular and anthropometric measurements among Ethiopian adults. Clin Ophthalmol. 2020;14:3363-3370.'),
      refPara(13, 'Warrier S, Wu HM, Newland HS, et al. Ocular biometry and determinants of refractive error in rural Myanmar. Br J Ophthalmol. 2008;92(12):1591-1596.'),
      refPara(14, 'Richdale K, Bullimore MA, Sinnott LT, Zadnik K. The effect of age, accommodation, and refractive error on the adult human eye. Optom Vis Sci. 2016;93(1):3-11.'),
      emptyLine(),
      
      heading3('Lens Anatomisi, Büyümesi ve Yaşlanması'),
      refPara(15, 'Augusteyn RC. On the growth and internal structure of the human lens. Exp Eye Res. 2010;90(6):643-654.'),
      refPara(16, 'Augusteyn RC. Growth of the human eye lens. Mol Vis. 2007;13:252-257.'),
      refPara(17, 'Michael R, Bron AJ. The ageing lens and cataract: a model of normal and pathological ageing. Philos Trans R Soc Lond B Biol Sci. 2011;366(1568):1278-1292.'),
      refPara(18, 'Beebe DC, Holekamp NM, Shui YB. Oxidative damage and the prevention of age-related cataracts. Ophthalmic Res. 2010;44(3):155-165.'),
      refPara(19, 'Glasser A, Campbell MCW. Presbyopia and the optical changes in the human crystalline lens with age. Vision Res. 1998;38(2):209-229.'),
      refPara(20, 'Weeber HA, van der Heijde RGL. On the relationship between lens stiffness and accommodative amplitude. Exp Eye Res. 2007;85(5):602-607.'),
      emptyLine(),
      
      heading3('Lens Kalınlığı ve Yaş Korelasyonu'),
      refPara(21, 'Dubbelman M, Van der Heijde GL. The shape of the aging human lens: curvature, equivalent refractive index and the lens paradox. Vision Res. 2001;41(14):1867-1877.'),
      refPara(22, 'Dubbelman M, Van der Heijde GL, Weeber HA. Change in shape of the aging human crystalline lens with accommodation. Vision Res. 2005;45(1):117-132.'),
      refPara(23, 'Dubbelman M, Van der Heijde GL, Weeber HA, Vrensen GF. Changes in the internal structure of the human crystalline lens with age and accommodation. Vision Res. 2003;43(22):2363-2375.'),
      refPara(24, 'Atchison DA, Markwell EL, Kasthurirangan S, et al. Age-related changes in optical and biometric characteristics of emmetropic eyes. J Vis. 2008;8(4):29.1-20.'),
      refPara(25, 'Rosen AM, Denham DB, Fernandez V, et al. In vitro dimensions and curvatures of human lenses. Vision Res. 2006;46(6-7):1002-1009.'),
      refPara(26, 'Koretz JF, Cook CA, Kaufman PL. Aging of the human lens: changes in lens shape upon accommodation and with accommodative loss. J Opt Soc Am A. 2002;19(1):144-151.'),
      refPara(27, 'Klein BEK, Klein R, Moss SE. Correlates of lens thickness: the Beaver Dam Eye Study. Invest Ophthalmol Vis Sci. 1998;39(8):1507-1510.'),
      refPara(28, 'Wojciechowski R, Congdon N, Anninger W, Teo Broman A. Age, gender, biometry, refractive error, and the anterior chamber angle among Alaskan Eskimos. Ophthalmology. 2003;110(2):365-375.'),
      refPara(29, 'Praveen MR, Vasavada AR, Shah SK, et al. Lens thickness of Indian eyes: impact of isolated lens opacity, age, axial length, and influence on anterior chamber depth. Eye (Lond). 2009;23(7):1542-1548.'),
      refPara(30, 'Shufelt C, Fraser-Bell S, Ying-Lai M, et al. Refractive error, ocular biometry, and lens opalescence in an adult population: the LALES. Invest Ophthalmol Vis Sci. 2005;46(12):4450-4460.'),
      emptyLine(),
      
      heading3('Optik Biyometri Cihazları'),
      refPara(31, 'Buckhurst PJ, Wolffsohn JS, Shah S, et al. A new optical low coherence reflectometry device for ocular biometry in cataract patients. Br J Ophthalmol. 2009;93(7):949-953.'),
      refPara(32, 'Holzer MP, Mamusa M, Auffarth GU. Accuracy of a new partial coherence interferometry analyser for biometric measurements. Br J Ophthalmol. 2009;93(6):807-810.'),
      refPara(33, 'Cruysberg LPJ, Doors M, Verbakel F, et al. Evaluation of the Lenstar LS 900 non-contact biometer. Br J Ophthalmol. 2010;94(1):106-110.'),
      refPara(34, 'Rohrer K, Frueh BE, Wälti R, et al. Comparison and evaluation of ocular biometry using a new noncontact optical low-coherence reflectometer. Ophthalmology. 2009;116(11):2087-2092.'),
      refPara(35, 'Shammas HJ, Hoffer KJ. Repeatability and reproducibility of biometry and keratometry measurements using a noncontact optical low-coherence reflectometer and keratometer. Am J Ophthalmol. 2012;153(1):55-61.e2.'),
      refPara(36, 'Kaswin G, Rousseau A, Mgarrech M, et al. Biometry and intraocular lens power calculation results with a new optical biometry device. J Cataract Refract Surg. 2014;40(4):593-600.'),
      refPara(37, 'Mandal P, Berrow EJ, Naroo SA, et al. Analysis of biometric parameters of 2340 eyes measured with optical biometer Lenstar LS900 in a Caucasian population. Indian J Ophthalmol. 2021;69(4):866-871.'),
      emptyLine(),
      
      heading3('Adli Yaş Tayini'),
      refPara(38, 'Schmeling A, Grundmann C, Fuhrmann A, et al. Criteria for age estimation in living individuals. Int J Legal Med. 2008;122(6):457-460.'),
      refPara(39, 'Schmeling A, Dettmeyer R, Rudolf E, et al. Forensic age estimation: methods, certainty, and the law. Dtsch Arztebl Int. 2016;113(4):44-50.'),
      refPara(40, 'Cunha E, Baccino E, Martrille L, et al. The problem of aging human remains and living individuals: a review. Forensic Sci Int. 2009;193(1-3):1-13.'),
      refPara(41, 'Ritz-Timme S, Cattaneo C, Collins MJ, et al. Age estimation: the state of the art in relation to the specific demands of forensic practise. Int J Legal Med. 2000;113(3):129-136.'),
      emptyLine(),
      
      heading3('Yapay Zeka ve Derin Öğrenme'),
      refPara(42, 'Zhu F, Zhu S, Zhai Q, et al. LensAge index as a deep learning-based biological age for self-monitoring the risks of age-related diseases and mortality. Nat Commun. 2023;14:7813.'),
      emptyLine(),
      
      heading3('Türkçe Kaynaklar'),
      refPara(43, 'Ağaçkıran E, et al. Lens kalınlığının yaş ve aksiyel uzunluk ile ilişkisi. Türkiye Klinikleri J Ophthalmol. 2008;17(1):26-31.'),
      refPara(44, 'Çağdır S, et al. Adli tıp anabilim dalına 2006-2010 yılları arasında yaş tayini için başvuran olguların değerlendirilmesi. Çağdaş Tıp Dergisi. 2012;2(2):95-100.'),
      refPara(45, 'Özdemir F, Kolusayın MÖ. 1998-2005 yılları arasında Gaziantep Üniversitesi Adli Tıp Anabilim Dalında raporlandırılan yaş tayini olgularının irdelenmesi. Türkiye Klinikleri J Foren Med. 2009;6(1):1-6.'),
      refPara(46, 'Koç S, Can M. Adli tıpta yaş tayini. İstanbul Tıp Fakültesi Dergisi. 2004;67(2):52-58.'),

    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('client/public/Lens_Yastayini_Literatur_Taramasi.docx', buf);
  console.log('DOCX created:', (buf.length/1024/1024).toFixed(2), 'MB');
});
