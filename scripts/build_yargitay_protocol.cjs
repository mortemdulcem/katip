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
  children: [T(text, opts)],
});
const H = (text, lvl = 1) => {
  const sizes = { 1: 32, 2: 26, 3: 23 };
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
const NOTE = (text) => new Paragraph({
  spacing: { before: 100, after: 160, line: 280 },
  alignment: AlignmentType.JUSTIFIED,
  shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFF2CC' },
  children: [T('NOT — ', { bold: true, color: '7F6000', size: 20 }), T(text, { color: '7F6000', size: 20 })],
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

sec.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800, after: 200 },
    children: [T('ÇALIŞMA PROTOKOLÜ', { size: 22, italics: true, color: '595959' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [T('TOMEC Algoritmasının Yargıtay Karar Tarama ile Kriter Geçerliliği Validasyon Çalışması', { size: 30, bold: true, color: '1F3864' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 },
    children: [T('Criterion Validity of the TOMEC Algorithm Through Retrospective Court of Cassation Decision Screening — Study Protocol', { size: 22, italics: true, color: '2E74B5' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [T('v1.0 — Etik Kurul Başvurusu için Hazır', { size: 20, italics: true })] }),

  NOTE('Bu protokol, etik kurul başvurusunda kullanılmak üzere hazırlanmıştır. Belge içerisinde HİÇBİR Yargıtay karar numarası, taraf bilgisi veya kişisel veri yer almaz; çalışmanın tasarım, yöntem ve istatistiksel planını içerir. Karar numaraları ve içerik yalnızca çalışma yürütüldüğünde ANONİMLEŞTİRİLMİŞ kayıt formlarında saklanacaktır.'),
);

sec.push(
  H('1. ARKA PLAN VE GEREKÇE', 1),
  P('TCK m.87/1-(e) ve m.87/2-(e) hükümleri, gebe kadına karşı işlenen kasten yaralama fiilinin neticesinde çocuğun vaktinden önce doğmasına veya düşmesine sebebiyet verilmesi halinde temel yaralama cezasının sırasıyla bir kat ve iki kat artırılmasını öngörmektedir. Bu maddelerin uygulamasında, fiil ile obstetrik sonuç arasındaki illiyet bağının kurulması temel mediko-legal sorundur.'),
  P('TOMEC (Travma Obstetrik Mediko-legal Causality) algoritması, bu illiyet değerlendirmesinin standardize edilmesi amacıyla geliştirilmiş, beş alanlı (T, O, M, E, C) ağırlıklandırılmış bir bilirkişi destek skorlama sistemidir. Mevcut metodolojik makale (v2.0), modelin Bradford Hill kriterleri (Hill 1965), uygun illiyet teorisi (Adäquanztheorie; von Kries 1888; Traeger 1904), objektif isnadiyet teorisi (Roxin 1970) ve Queensland MN19.31 (2019) klinik kılavuzu ile kavramsal hizalanmasını sunar. Ancak modelin KRİTER GEÇERLİLİĞİ — yani TOMEC kategorilerinin gerçek mahkeme nitelendirmeleri ile ne ölçüde uyum gösterdiği — henüz test edilmemiştir.'),
  P('Bu çalışma, Türk Yargıtayı\'nın 2010–2025 dönemine ait, gebe kadına yönelik kasten yaralama içeren ceza dairesi ve Ceza Genel Kurulu kararlarının retrospektif, sistematik ve anonimleştirilmiş taranması ile TOMEC skoru ↔ mahkeme nitelendirmesi uyumunun ölçülmesini amaçlamaktadır.'),
);

sec.push(
  H('2. ARAŞTIRMA SORULARI VE HİPOTEZLER', 1),
  H('2.1. Birincil Araştırma Sorusu', 2),
  P('TOMEC algoritması ile retrospektif olarak skorlanan Yargıtay kararlarındaki nedensellik sınıflandırması, mahkemenin nihai nitelendirmesi (TCK m.86 / m.87 ağırlaştırıcı bent / m.99 / beraat) ile ne ölçüde uyumludur?'),
  H('2.2. İkincil Araştırma Soruları', 2),
  BUL('Hangi TOMEC eşik değeri (örn. 70, 75, 80, 85), m.87 ağırlaştırıcı bent uygulamasını öngörmede en yüksek Youden indeksini sağlar?'),
  BUL('Hangi TOMEC alanı (T, O, M, E, C) mahkeme nitelendirmesi ile en güçlü korelasyona sahiptir?'),
  BUL('Mahkeme nitelendirmesi ile TOMEC kategorisi arasında uyumsuzluk gösteren kararlarda hangi tematik özellikler öne çıkmaktadır?'),
  H('2.3. Hipotezler', 2),
  BUL('H1: TOMEC sürekli skoru ile m.87 ağırlaştırıcı bent uygulanması arasında AUC ≥0.75 düzeyinde ayrım gücü vardır.'),
  BUL('H2: 85 ve üzeri TOMEC skoru, m.87 ağırlaştırıcı bent uygulamasını ≥%80 sensitivite ile öngörür.'),
  BUL('H3: C (kronolojik) alanı, mahkeme nitelendirmesini öngörmede en güçlü tek alan olacaktır.'),
);

sec.push(
  H('3. YÖNTEM', 1),

  H('3.1. Çalışma Tasarımı', 2),
  P('Retrospektif, gözlemsel, anonimleştirilmiş kararlar üzerinde değerlendirici-bağımsız çift-kör skorlama tasarımı.'),

  H('3.2. Veri Kaynakları', 2),
  BUL('Yargıtay Karar Arama Sistemi (karararama.yargitay.gov.tr) — birincil kaynak.'),
  BUL('UYAP Mevzuat ve İçtihat Bilgi Bankası — tamamlayıcı kaynak.'),
  BUL('Resmi Gazete (yargi.gov.tr) — Ceza Genel Kurulu içtihadı bağlayıcılığı için.'),
  BUL('Yayımlanmış Yargıtay Karar Dergisi sayıları (UYAP harici doğrulama).'),

  H('3.3. Anahtar Kelime Tarama Stratejisi', 2),
  P('Aşağıdaki Türkçe anahtar kelime kombinasyonları, "TÜM ALANLAR" arama parametresi ile uygulanır:'),
  SP(),
  TBL([
    [C('Sorgu Grubu', { head: true, w: 30 }), C('Anahtar Kelime Kombinasyonu', { head: true, w: 70 })],
    [C('Birincil'), C('"kasten yaralama" + "gebelik"')],
    [C('Birincil'), C('"kasten yaralama" + "düşük"')],
    [C('Birincil'), C('"kasten yaralama" + "abortus"')],
    [C('Birincil'), C('"kasten yaralama" + "preterm"')],
    [C('İkincil'), C('"yaralama" + "abrupsiyon"')],
    [C('İkincil'), C('"yaralama" + "fetal kayıp"')],
    [C('İkincil'), C('"yaralama" + "intrauterin ölüm"')],
    [C('Hukuki çerçeve'), C('"madde 87" + "gebe"')],
    [C('Hukuki çerçeve'), C('"neticesi sebebiyle" + "gebe"')],
    [C('Hukuki çerçeve'), C('"çocuk düşürme" + "yaralama"')],
    [C('Hariç tutma kontrolü'), C('"madde 99" / "kürtaj" / "rıza"')],
  ]),

  H('3.4. Dahil Etme Kriterleri', 2),
  BUL('Karar tarihi: 01.01.2010 – 31.12.2025.'),
  BUL('Yargıtay 1., 3., 4. Ceza Daireleri ve Ceza Genel Kurulu kararları.'),
  BUL('TCK m.86, 87 ve/veya 99 kapsamında olduğu açıkça belirtilen kararlar.'),
  BUL('Mağdurun gebe olduğu, karar metninde net şekilde belirtilen kararlar.'),
  BUL('Tıbbi bilirkişi raporu özetinin karar metninde yer aldığı kararlar (TOMEC alan-skorlamasının yapılabilmesi için zorunlu).'),

  H('3.5. Hariç Tutma Kriterleri', 2),
  BUL('Yalnızca usul incelemesi içeren (esasa girmeyen) kararlar.'),
  BUL('Tıbbi bilirkişi raporuna atıf yapmayan kararlar.'),
  BUL('TCK m.99 kapsamında doğrudan çocuk düşürtme kastı içeren kararlar (TOMEC kapsam dışı; ayrı analiz başlığı altında değerlendirilebilir).'),
  BUL('Trafik kazası veya iş kazası kaynaklı taksirli yaralama kararları (kasıt unsuru olmaması nedeniyle).'),
  BUL('Mağdurun gebeliğinin karar metninden çıkarılamadığı kararlar.'),

  H('3.6. Anonimleştirme ve Veri Güvenliği', 2),
  NOTE('Bu protokolün etik kurul onayı koşuludur. Hiçbir yayında karar numarası, tarafların adı, hastane adı veya tarihi kişiselleştirilmiş şekilde sunulmayacaktır.'),
  BUL('Her karar için araştırma kayıt numarası (ARK-001, ARK-002, ...) atanacak.'),
  BUL('Karar numaraları ayrı, şifre korumalı offline dosyada tutulacak (yalnızca PI erişebilir).'),
  BUL('Tüm kişi adları, hastane adları ve coğrafi belirteçler kayıt formuna alınmadan önce maskelenecek.'),
  BUL('KKVK 5237 sayılı kanun, 6698 sayılı KVKK ve Yargıtay Kişisel Veri Politikası ile uyumlu işlem.'),
  BUL('Veri saklama süresi: çalışma yayınlandıktan sonra 5 yıl; sonra güvenli imha (NIST 800-88 uyumlu).'),

  H('3.7. Veri Çıkarım Formu (CRF)', 2),
  P('Her karar için aşağıdaki yapılandırılmış form doldurulacaktır:'),
  SP(),
  TBL([
    [C('Alan', { head: true, w: 30 }), C('Veri Tipi', { head: true, w: 25 }), C('Açıklama', { head: true, w: 45 })],
    [C('ARK No'), C('Otomatik'), C('Anonim kayıt numarası')],
    [C('Karar yılı (10\'lu dilim)'), C('Kategorik'), C('2010-15 / 2016-20 / 2021-25')],
    [C('Daire'), C('Kategorik'), C('1.CD / 3.CD / 4.CD / CGK')],
    [C('Mağdurun gebelik haftası'), C('Sayısal veya aralık'), C('Mümkünse hafta; yoksa trimester')],
    [C('Travma mekanizması'), C('Kategorik'), C('Künt / penetran / ateşli / kombine')],
    [C('Anatomik etki bölgesi'), C('Kategorik'), C('Abdominal / pelvik / diğer / belirtilmemiş')],
    [C('Latent süre (travma→komplikasyon)'), C('Kategorik'), C('<6 sa / 6-72 sa / 72sa-4 hafta / >4 hafta')],
    [C('Obstetrik komplikasyon'), C('Kategorik'), C('Abrupsiyon / preterm / IUFD / IUGR / yok')],
    [C('Maternal komorbidite'), C('Çoklu seçim'), C('HT, DM, kardiyak, obezite, yok, belirtilmemiş')],
    [C('Maternal psikiyatrik tanı'), C('Kategorik'), C('TSSB / MDB / yok / belirtilmemiş')],
    [C('Bilirkişi raporu sayısı'), C('Sayısal'), C('Tek / heyet / ATK / üniversite')],
    [C('TOMEC T puanı'), C('Sayısal 0-100'), C('Skorlayıcı 1 / Skorlayıcı 2')],
    [C('TOMEC O puanı'), C('Sayısal 0-100'), C('Skorlayıcı 1 / Skorlayıcı 2')],
    [C('TOMEC M puanı'), C('Sayısal 0-100'), C('Skorlayıcı 1 / Skorlayıcı 2')],
    [C('TOMEC E puanı'), C('Sayısal 0-100'), C('Skorlayıcı 1 / Skorlayıcı 2')],
    [C('TOMEC C puanı'), C('Sayısal 0-100'), C('Skorlayıcı 1 / Skorlayıcı 2')],
    [C('TOMEC toplam'), C('Sayısal 0-100'), C('Hesaplanır')],
    [C('TOMEC kategorisi'), C('Kategorik (7)'), C('Kesin → Yok')],
    [C('Mahkeme nitelendirmesi (altın standart)'), C('Kategorik'), C('m.86 / m.87/1 / m.87/2 / m.99 / beraat')],
    [C('TCK m.23 (taksir) tartışması var mı?'), C('Evet/Hayır'), C('Karar metninde geçiyorsa')],
    [C('Uygunluk değerlendirmesi'), C('Evet/Hayır + neden'), C('Dahil/hariç gerekçesi')],
  ]),

  H('3.8. Skorlayıcı Eğitimi ve Çift-Kör Tasarım', 2),
  BUL('İki bağımsız skorlayıcı (adli tıp uzmanı veya kıdemli adli tıp asistanı).'),
  BUL('Eğitim: 4 saatlik standardize workshop + 5 örnek vinyet üzerinde kalibrasyon.'),
  BUL('Skorlayıcılar mahkeme nitelendirmesine KÖR olmalıdır (bu nedenle anonimleştirme öncesi karar metninden mahkeme sonucu maskelenir).'),
  BUL('Anlaşmazlık halinde üçüncü uzman (perinatoloji veya adli tıp profesörü) tahkim eder.'),

  H('3.9. Örneklem Büyüklüğü', 2),
  P('Cohen κ için örneklem hesaplaması: beklenen κ = 0.70, kabul edilebilir alt sınır 0.50, α = 0.05, güç = 0.80, 7-sınıflı kategorik sonuç → minimum n = 60 karar (Sim & Wright 2005 formülü temelli yaklaşık değer; tam hesaplama için yazar power-analizi yazılımı (R irr, PASS) ile son kontrol yapmalıdır).'),
  P('ROC analizi için minimum: her sınıfta (m.87 uygulanan / uygulanmayan) en az 30 vaka önerilir; toplam hedef n = 80–120 karar.'),

  H('3.10. İstatistiksel Analiz Planı', 2),
  BUL('Tanımlayıcı: medyan, IQR (sürekli); n, % (kategorik).'),
  BUL('Inter-rater güvenirlik: Cohen κ (kategorik), ICC two-way mixed absolute (sürekli skor).'),
  BUL('Birincil analiz: TOMEC sürekli skor ile m.87 ağırlaştırıcı uygulanması ROC; AUC + %95 GA bootstrap (1000 örneklem).'),
  BUL('Eşik analizi: 70, 75, 80, 85 noktalarında sensitivite, spesifite, PPV, NPV; Youden J maksimum noktası.'),
  BUL('Alan-bazlı analiz: her TOMEC alanı için bağımsız ROC; en güçlü öngörücü alan.'),
  BUL('Kalibrasyon: Hosmer-Lemeshow benzeri grup-bazlı uyum.'),
  BUL('Uyumsuzluk vakaları: TOMEC kategori vs. mahkeme nitelendirmesi ≠ olduğu kararlarda kalitatif tematik analiz (Braun & Clarke 2006 6 aşamalı).'),
  BUL('Yazılım: R 4.x (irr, pROC, psych paketleri) veya SPSS 28+; analiz kodu OSF\'ye yüklenecek.'),
);

sec.push(
  H('4. ETİK ÇERÇEVE', 1),
  H('4.1. Etik Kurul Onayı', 2),
  P('Çalışma başlatılmadan önce yazarın bağlı bulunduğu kurumun (Ankara Bilkent Şehir Hastanesi Klinik Araştırmalar Etik Kurulu) onayı alınacaktır. Kararlar hâlihazırda kamuya açık veritabanlarında bulunsa da, sistematik tarama ve toplulaştırılmış analiz için etik kurul onayı şeffaflık açısından zorunlu kabul edilir.'),
  H('4.2. KKVK ve KVKK Uyumu', 2),
  P('6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, yargı kararlarındaki kişisel veriler işlenirken Yargıtay Kişisel Veri Politikası ve Kişisel Verileri Koruma Kurulu kararlarına uyulacaktır. Ham karar metinleri yayınlanmayacak; yalnızca toplulaştırılmış istatistikler raporlanacaktır.'),
  H('4.3. Adalet Bakanlığı Bilgilendirmesi', 2),
  P('Yayım öncesi, çalışmanın metodu ve bulgularının özet metni Adalet Bakanlığı ilgili genel müdürlüğüne bilgilendirme amaçlı sunulacaktır (zorunlu olmasa da etik şeffaflık için önerilen uygulama).'),
  H('4.4. Çıkar Çatışması ve Finansman', 2),
  P('Yazarlar çıkar çatışması bildirmeyecektir. Çalışma için herhangi bir dış fon talep edilmemekte; gerekli yazılım lisansları (R açık kaynak; SPSS varsa kurum lisansı) ve insan gücü mevcut akademik kaynaklardan karşılanacaktır.'),
);

sec.push(
  H('5. ZAMAN ÇİZELGESİ', 1),
  SP(),
  TBL([
    [C('Aşama', { head: true, w: 50 }), C('Süre', { head: true, w: 25 }), C('Çıktı', { head: true, w: 25 })],
    [C('Etik kurul başvurusu ve onayı'), C('1-2 ay'), C('Onay belgesi')],
    [C('Skorlayıcı eğitimi ve kalibrasyon'), C('2 hafta'), C('Eğitim sertifikası')],
    [C('Pilot tarama (n=20)'), C('1 ay'), C('Pilot rapor')],
    [C('Tam tarama ve veri çıkarımı'), C('3-4 ay'), C('Anonim CRF veritabanı')],
    [C('İstatistiksel analiz'), C('1-2 ay'), C('Analiz raporu + kod')],
    [C('Makale yazımı ve revizyon'), C('2 ay'), C('Gönderim hazır makale')],
    [C('TOPLAM', { bold: true }), C('10-12 ay', { bold: true }), C('-')],
  ]),
);

sec.push(
  H('6. RAPORLAMA', 1),
  P('Çalışma sonuçları aşağıdaki kılavuzlara uygun olarak raporlanacaktır:'),
  BUL('Birincil çalışma: TRIPOD (Collins ve ark. 2015) kontrol listesi — model validasyon kısmı.'),
  BUL('Tanı doğruluğu kısmı: STARD 2015 (Bossuyt PM ve ark.) kontrol listesi.'),
  BUL('Anlaşma analizi: GRRAS (Guidelines for Reporting Reliability and Agreement Studies; Kottner ve ark. 2011).'),
  BUL('Ön kayıt: PROSPERO (uygunsa) veya Open Science Framework (OSF) protokol kaydı.'),
);

sec.push(
  H('KAYNAKLAR', 1),
  P('1. Hill AB. The Environment and Disease: Association or Causation? Proc R Soc Med. 1965;58:295-300.', { size: 20 }),
  P('2. Collins GS, Reitsma JB, Altman DG, Moons KGM. TRIPOD Statement. Ann Intern Med. 2015;162(1):55-63.', { size: 20 }),
  P('3. Cohen J. A coefficient of agreement for nominal scales. Educ Psychol Meas. 1960;20(1):37-46.', { size: 20 }),
  P('4. Landis JR, Koch GG. The measurement of observer agreement for categorical data. Biometrics. 1977;33(1):159-174.', { size: 20 }),
  P('5. Sim J, Wright CC. The kappa statistic in reliability studies: use, interpretation, and sample size requirements. Phys Ther. 2005;85(3):257-268.', { size: 20 }),
  P('6. Bossuyt PM, Reitsma JB, Bruns DE, et al. STARD 2015: an updated list of essential items for reporting diagnostic accuracy studies. BMJ. 2015;351:h5527.', { size: 20 }),
  P('7. Kottner J, Audigé L, Brorson S, et al. Guidelines for Reporting Reliability and Agreement Studies (GRRAS). J Clin Epidemiol. 2011;64(1):96-106.', { size: 20 }),
  P('8. Braun V, Clarke V. Using thematic analysis in psychology. Qual Res Psychol. 2006;3(2):77-101.', { size: 20 }),
  P('9. Türkiye Cumhuriyeti. Türk Ceza Kanunu (5237). Resmi Gazete 12.10.2004, sayı 25611.', { size: 20 }),
  P('10. Türkiye Cumhuriyeti. Kişisel Verilerin Korunması Kanunu (6698). Resmi Gazete 07.04.2016, sayı 29677.', { size: 20 }),
);

const doc = new Document({
  creator: 'TOMEC Çalışma Grubu',
  title: 'TOMEC Yargıtay Karar Tarama Validasyon Çalışma Protokolü v1.0',
  styles: { default: { document: { run: { font: F, size: 22 } } } },
  sections: [{
    properties: { page: { margin: { top: 1100, bottom: 1100, left: 1200, right: 1200 } } },
    headers: { default: new Header({ children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [T('TOMEC Yargıtay Validasyon Protokolü v1.0', { size: 18, italics: true, color: '7F7F7F' })],
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
  const out = path.join(__dirname, '..', 'client', 'public', 'TOMEC_Yargitay_Validasyon_Protokolu_v1.docx');
  fs.writeFileSync(out, buf);
  console.log(`OK ${out} (${(buf.length/1024).toFixed(1)} KB)`);
})();
