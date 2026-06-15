'use strict';
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
        BorderStyle, Table, TableRow, TableCell, WidthType,
        convertInchesToTwip, PageBreak, Footer, Header,
        ShadingType } = require('docx');

const NAVY = '0D2140';
const BLUE = '1B4F8A';
const ACCENT = '2E74B5';
const LTBLUE = 'D6EAF8';
const GRAY = '5D6D7E';
const WHITE = 'FFFFFF';
const BGLIGHT = 'F4F6F9';

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 500, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT } },
    children: [new TextRun({ text, bold: true, size: 32, font: 'Calibri', color: NAVY })],
  });
}
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 350, after: 150 },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Calibri', color: BLUE })],
  });
}
function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 250, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, font: 'Calibri', color: ACCENT })],
  });
}
function body(text) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: '333333' })],
  });
}
function bodyBold(label, text) {
  return new Paragraph({
    spacing: { after: 100, line: 360 },
    children: [
      new TextRun({ text: label, bold: true, size: 22, font: 'Calibri', color: NAVY }),
      new TextRun({ text, size: 22, font: 'Calibri', color: '333333' }),
    ],
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { after: 80, line: 340 },
    indent: { left: convertInchesToTwip(0.4 + level * 0.3) },
    children: [
      new TextRun({ text: level === 0 ? '\u2022  ' : '\u25E6  ', bold: true, size: 22, font: 'Calibri', color: ACCENT }),
      new TextRun({ text, size: 22, font: 'Calibri', color: '333333' }),
    ],
  });
}
function codeBlock(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: { left: convertInchesToTwip(0.3) },
    shading: { type: ShadingType.CLEAR, fill: 'F0F0F0' },
    children: [new TextRun({ text, size: 18, font: 'Consolas', color: '2C3E50' })],
  });
}
function spacer() {
  return new Paragraph({ spacing: { after: 60 }, children: [] });
}
function infoBox(title, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: LTBLUE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: ACCENT },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: ACCENT },
              left: { style: BorderStyle.SINGLE, size: 6, color: ACCENT },
              right: { style: BorderStyle.SINGLE, size: 1, color: ACCENT },
            },
            children: [
              new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: title, bold: true, size: 20, font: 'Calibri', color: NAVY })] }),
              new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, size: 20, font: 'Calibri', color: '333333' })] }),
            ],
          }),
        ],
      }),
    ],
  });
}
function warnBox(title, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: 'FFF3CD' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'F0AD4E' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'F0AD4E' },
              left: { style: BorderStyle.SINGLE, size: 6, color: 'F0AD4E' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'F0AD4E' },
            },
            children: [
              new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: title, bold: true, size: 20, font: 'Calibri', color: '856404' })] }),
              new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, size: 20, font: 'Calibri', color: '856404' })] }),
            ],
          }),
        ],
      }),
    ],
  });
}

function makeTable(headers, rows) {
  const hdrCells = headers.map(h => new TableCell({
    shading: { type: ShadingType.CLEAR, fill: NAVY },
    width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new TextRun({ text: h, bold: true, size: 20, font: 'Calibri', color: WHITE })] })],
  }));
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map(cell => new TableCell({
      shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? WHITE : BGLIGHT },
      children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: String(cell), size: 20, font: 'Calibri', color: '333333' })] })],
    })),
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: hdrCells }), ...dataRows] });
}

async function build() {
  const children = [];

  // ═══════════════ KAPAK ═══════════════
  children.push(
    new Paragraph({ spacing: { before: 1800 }, children: [] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'ChiroBench', bold: true, size: 60, font: 'Calibri', color: NAVY })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Adli Grafoloji Ara\u015Ft\u0131rma ve \u0130mza Do\u011Frulama Sistemi', size: 28, font: 'Calibri', color: ACCENT })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT } }, children: [new TextRun({ text: 'Kapsaml\u0131 Tan\u0131t\u0131m ve Kullan\u0131m K\u0131lavuzu', size: 24, font: 'Calibri', color: GRAY })] }),
    new Paragraph({ spacing: { before: 500 }, children: [] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Ankara Bilkent \u015Eehir Hastanesi', size: 24, font: 'Calibri', color: NAVY, bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Adli T\u0131p Klini\u011Fi', size: 22, font: 'Calibri', color: BLUE })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Nisan 2026', size: 22, font: 'Calibri', color: GRAY })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: 'Bu dok\u00FCman, ChiroBench sisteminin ne yapt\u0131\u011F\u0131n\u0131, neden yap\u0131ld\u0131\u011F\u0131n\u0131 ve nas\u0131l kullan\u0131ld\u0131\u011F\u0131n\u0131\nyaz\u0131l\u0131m bilgisi gerektirmeden a\u00E7\u0131klayan kapsaml\u0131 bir k\u0131lavuzdur.', size: 20, font: 'Calibri', color: GRAY, italics: true })] }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ İÇİNDEKİLER ═══════════════
  children.push(
    heading1('\u0130\u00C7\u0130NDEK\u0130LER'),
    spacer(),
    body('1.  Bu Sistem Nedir ve Neden Yapt\u0131k?'),
    body('2.  Sistemin Genel G\u00F6r\u00FCn\u00FCm\u00FC'),
    body('3.  Mod\u00FCl 1: \u0130mza Veri Toplama — Kat\u0131l\u0131mc\u0131lardan \u00D6rnek Toplama'),
    body('4.  Mod\u00FCl 2: Taranm\u0131\u015F Formlar\u0131 Sisteme Y\u00FCkleme'),
    body('5.  Mod\u00FCl 3: Yapay Zek\u00E2 ile \u0130mza Kar\u015F\u0131la\u015Ft\u0131rma'),
    body('6.  Mod\u00FCl 4: \u0130statistiksel Analiz — Say\u0131larla Sonu\u00E7lar'),
    body('7.  Mod\u00FCl 5: Derin \u00D6\u011Frenme (Siamese CNN) — Bilgisayar\u0131n \u0130mza Okumas\u0131'),
    body('8.  Mod\u00FCl 6: Varyasyon Analizi — \u0130mza Farkl\u0131l\u0131klar\u0131n\u0131n \u0130ncelenmesi'),
    body('9.  E\u011Fitim Scripti — Bilgisayar\u0131 \u0130mza Tan\u0131may\u0131 \u00D6\u011Fretmek'),
    body('10. Veri Seti Nas\u0131l Haz\u0131rlan\u0131r?'),
    body('11. Sonu\u00E7lar Ne Anlama Gelir?'),
    body('12. S\u0131k Sorulan Sorular'),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ 1. TANITIM ═══════════════
  children.push(
    heading1('1. Bu Sistem Nedir ve Neden Yapt\u0131k?'),
    spacer(),
    heading2('1.1 K\u0131saca Ne Yapar?'),
    body('ChiroBench, bir ki\u015Finin imzas\u0131n\u0131n ger\u00E7ek mi yoksa sahte mi oldu\u011Funu bilgisayar yoluyla tespit etmeye \u00E7al\u0131\u015Fan bir ara\u015Ft\u0131rma sistemidir. Adli t\u0131pta imza incelemesi genellikle uzman g\u00F6z\u00FCyle yap\u0131l\u0131r. Biz bu s\u00FCreci yapay zek\u00E2 ve derin \u00F6\u011Frenme teknolojisiyle destekleyerek otomatikle\u015Ftirdik.'),
    spacer(),
    heading2('1.2 Neden \u00D6nemli?'),
    body('Adli t\u0131pta imza sahtecili\u011Fi tespiti kritik bir konudur. Miras davas\u0131nda bir vasiyetnamedeki imzan\u0131n ger\u00E7ek olup olmad\u0131\u011F\u0131, bir s\u00F6zle\u015Fmedeki imzan\u0131n taklit edilip edilmedi\u011Fi gibi sorular hayati \u00F6nem ta\u015F\u0131r. Geleneksel y\u00F6ntemler uzman\u0131n deneyimine ba\u011Fl\u0131d\u0131r ve \u00F6znellik i\u00E7erir. Bizim sistemimiz bu s\u00FCrece nesnel, \u00F6l\u00E7\u00FClebilir ve tekrarlanabilir bir boyut ekliyor.'),
    spacer(),
    heading2('1.3 Biz Ne Yapt\u0131k?'),
    body('Bu proje kapsam\u0131nda \u015Funlar\u0131 ger\u00E7ekle\u015Ftirdik:'),
    spacer(),
    bullet('Kat\u0131l\u0131mc\u0131lardan sistematik olarak imza ve \u015Fekil \u00F6rnekleri toplad\u0131k'),
    bullet('Bu \u00F6rnekleri bir veritaban\u0131na kaydettik'),
    bullet('Yapay zek\u00E2 (GPT-4o) ile imzalar\u0131 kar\u015F\u0131la\u015Ft\u0131rd\u0131k'),
    bullet('"Siamese CNN" ad\u0131 verilen \u00F6zel bir yapay sinir a\u011F\u0131 ile imza do\u011Frulama modeli geli\u015Ftirdik'),
    bullet('\u0130statistiksel varyasyon analizi ile imza tutarl\u0131l\u0131\u011F\u0131n\u0131 \u00F6l\u00E7t\u00FCk'),
    bullet('T\u00FCm sonu\u00E7lar\u0131 istatistiksel olarak raporlad\u0131k'),
    spacer(),
    heading2('1.4 Hedef Kitlemiz'),
    body('Bu sistem Ankara Bilkent \u015Eehir Hastanesi Adli T\u0131p Klini\u011Fi b\u00FCnyesinde y\u00FCr\u00FCtülen tez \u00E7al\u0131\u015Fmas\u0131 i\u00E7in tasarlanm\u0131\u015Ft\u0131r. Ama ileride farkl\u0131 hastanelerde veya adli t\u0131p kurumlar\u0131nda da kullan\u0131labilir.'),
    spacer(),
    heading2('1.5 Ara\u015Ft\u0131rma Parametrelerimiz'),
    body('Ara\u015Ft\u0131rmam\u0131zda \u015Fu standartlar\u0131 hedefledik:'),
    spacer(),
    makeTable(
      ['Parametre', 'De\u011Fer', 'Ne Anlama Geliyor'],
      [
        ['Kat\u0131l\u0131mc\u0131 say\u0131s\u0131', '20 ki\u015Fi', 'Farkl\u0131 yazma stillerini temsil eder'],
        ['\u015Eekil tipleri', '7 adet', 'imza, paraf, W, \u015E, \u0130, O, \u03B1'],
        ['Her \u015Fekilden tekrar', '50 kez', 'Ayn\u0131 ki\u015Finin tutarl\u0131l\u0131\u011F\u0131n\u0131 \u00F6l\u00E7er'],
        ['Toplam \u00F6rnek', '7.000', '20 \u00D7 7 \u00D7 50 = 7.000 g\u00F6r\u00FCnt\u00FC'],
        ['G\u00F6r\u00FCnt\u00FC boyutu', '512 \u00D7 512 piksel', 'Standart kare format'],
        ['Ek veri', 'Taklit \u00F6rnekleri', 'Ba\u015Fka biri ayn\u0131 imzay\u0131 taklit etmi\u015F'],
      ]
    ),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ 2. GENEL GÖRÜNÜM ═══════════════
  children.push(
    heading1('2. Sistemin Genel G\u00F6r\u00FCn\u00FCm\u00FC'),
    spacer(),
    body('Sistem bir web uygulamas\u0131 olarak \u00E7al\u0131\u015F\u0131r. Yani herhangi bir bilgisayardan internet taray\u0131c\u0131s\u0131 (Chrome, Firefox vb.) ile eri\u015Filebilir. Program y\u00FCklemek gerekmez.'),
    spacer(),
    heading2('2.1 Giri\u015F Yapma'),
    body('Sisteme giri\u015F yapmak i\u00E7in Replit hesab\u0131yla oturum a\u00E7\u0131l\u0131r. Oturum a\u00E7\u0131lmadan hi\u00E7bir sayfaya eri\u015Filemez. Bu, verilerin g\u00FCvenli\u011Fini sa\u011Flar.'),
    spacer(),
    heading2('2.2 Sol Men\u00FC (Sidebar)'),
    body('Giri\u015F yapt\u0131ktan sonra sol tarafta bir men\u00FC g\u00F6r\u00FCrs\u00FCn\u00FCz. \u0130mza sistemiyle ilgili \u015Fu ba\u011Flant\u0131lar vard\u0131r:'),
    spacer(),
    makeTable(
      ['Men\u00FC Ad\u0131', 'Ne \u0130\u015Fe Yarar'],
      [
        ['\u0130mza Veri Toplama', 'Kat\u0131l\u0131mc\u0131lardan imza ve \u015Fekil toplamak i\u00E7in'],
        ['Tarama \u0130\u00E7e Aktarma', 'Ka\u011F\u0131t formlar\u0131 taray\u0131p y\u00FCklemek i\u00E7in'],
        ['\u0130mza Analizi', 'Yapay zek\u00E2 ile iki imzay\u0131 kar\u015F\u0131la\u015Ft\u0131rmak i\u00E7in'],
        ['\u0130statistiksel Analiz', 'Sonu\u00E7lar\u0131 say\u0131sal olarak g\u00F6rmek i\u00E7in'],
        ['Siamese CNN (DL)', 'Derin \u00F6\u011Frenme ile canl\u0131 kar\u015F\u0131la\u015Ft\u0131rma yapmak i\u00E7in'],
        ['Varyasyon Analizi', '\u0130mza farkl\u0131l\u0131klar\u0131n\u0131 istatistiksel olarak incelemek i\u00E7in'],
      ]
    ),
    spacer(),
    heading2('2.3 Nas\u0131l \u00C7al\u0131\u015F\u0131r? (Basit A\u00E7\u0131klama)'),
    body('D\u00FC\u015F\u00FCn\u00FCn ki bir parmak izi sistemi var. Parmak izi sistemi nas\u0131l \u00E7al\u0131\u015F\u0131r?'),
    spacer(),
    bullet('\u00D6nce parmak izinizi kaydedersiniz (veri toplama)'),
    bullet('Sistem parmak izinizin \u00F6zelliklerini \u00F6\u011Frenir (e\u011Fitim)'),
    bullet('Sonra kap\u0131dan ge\u00E7erken parmak izinizi kar\u015F\u0131la\u015Ft\u0131r\u0131r (do\u011Frulama)'),
    spacer(),
    body('Bizim sistemimiz tam olarak ayn\u0131 mant\u0131kla \u00E7al\u0131\u015F\u0131r, ama parmak izi yerine IMZA kullan\u0131r:'),
    spacer(),
    bullet('\u00D6nce kat\u0131l\u0131mc\u0131lar\u0131n imzalar\u0131n\u0131 toplars\u0131n\u0131z (Mod\u00FCl 1-2)'),
    bullet('Sistem bu imzalar\u0131n \u00F6zelliklerini \u00F6\u011Frenir (E\u011Fitim Scripti)'),
    bullet('Sonra yeni bir imza geldi\u011Finde "bu ger\u00E7ek mi sahte mi?" diye karar verir (Mod\u00FCl 3-5-6)'),
    spacer(),
    infoBox('Teknik Olmayan \u00D6zet', 'Sistem k\u0131saca \u015F\u00F6yle \u00E7al\u0131\u015F\u0131r: \u0130mza topla \u2192 Bilgisayara \u00F6\u011Fret \u2192 Yeni imzay\u0131 sor \u2192 "Ger\u00E7ek" veya "Sahte" cevab\u0131n\u0131 al.'),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ 3. MODÜL 1: VERİ TOPLAMA ═══════════════
  children.push(
    heading1('3. Mod\u00FCl 1: \u0130mza Veri Toplama'),
    spacer(),
    heading2('3.1 Bu Sayfa Ne Yapar?'),
    body('Bu sayfa, ara\u015Ft\u0131rman\u0131n temelini olu\u015Fturur. Kat\u0131l\u0131mc\u0131lara bir \u00E7izim alan\u0131 sunar ve onlardan imza ile \u00E7e\u015Fitli \u015Fekiller \u00E7izmelerini ister. Her \u00E7izim otomatik olarak sisteme kaydedilir.'),
    spacer(),
    heading2('3.2 Neden Bunu Yap\u0131yoruz?'),
    body('Bir ki\u015Finin imzas\u0131 her seferinde biraz farkl\u0131 olur. Sabah ataca\u011F\u0131n\u0131z imza ile ak\u015Fam ataca\u011F\u0131n\u0131z imza tamamen ayn\u0131 olmaz. Bunu "do\u011Fal varyasyon" diye adland\u0131r\u0131r\u0131z. Sistemin bu do\u011Fal farkl\u0131l\u0131klar\u0131 \u00F6\u011Frenmesi i\u00E7in ayn\u0131 ki\u015Fiden \u00E7ok say\u0131da (50 adet) imza almam\u0131z gerekir.'),
    spacer(),
    heading2('3.3 Ad\u0131m Ad\u0131m Kullan\u0131m'),
    spacer(),
    heading3('Ad\u0131m 1: Kat\u0131l\u0131mc\u0131 Olu\u015Fturma'),
    body('Sol paneldeki kutuya kat\u0131l\u0131mc\u0131 kodu yaz\u0131n. \u00D6rne\u011Fin "P001" veya "Hasta_Ali" gibi. Sonra "Ekle" butonuna bas\u0131n. Her kat\u0131l\u0131mc\u0131 i\u00E7in benzersiz bir kod kullan\u0131n.'),
    spacer(),
    heading3('Ad\u0131m 2: Kat\u0131l\u0131mc\u0131y\u0131 Se\u00E7me'),
    body('Ekledi\u011Finiz kat\u0131l\u0131mc\u0131 listede g\u00F6r\u00FCnecek. \u00DCzerine t\u0131klad\u0131\u011F\u0131n\u0131zda o ki\u015Fiye ait verileri toplayabilirsiniz.'),
    spacer(),
    heading3('Ad\u0131m 3: \u015Eekil Tipi Se\u00E7me'),
    body('Toplam 7 farkl\u0131 \u015Fekil vard\u0131r:'),
    spacer(),
    makeTable(
      ['\u015Eekil', 'A\u00E7\u0131klama', 'Neden \u0130stiyoruz?'],
      [
        ['\u0130mza', 'Ki\u015Finin kendi imzas\u0131', 'Temel do\u011Frulama verisi'],
        ['Paraf', 'K\u0131sa imza/i\u015Faret', '\u0130mzadan farkl\u0131 bir motor beceri'],
        ['W', 'W harfi', 'Sivri k\u00F6\u015Fe motor kontrolü'],
        ['\u015E', '\u015E harfi', 'Kavisli hareket kontrol\u00FC'],
        ['\u0130', '\u0130 harfi', 'Dikey \u00E7izgi kontrol\u00FC'],
        ['O', 'Daire \u00E7izimi', 'D\u00F6ng\u00FCsel hareket kontrol\u00FC'],
        ['\u03B1 (alfa)', 'Alfa sembol\u00FC', 'Karma\u015F\u0131k kavis kontrol\u00FC'],
      ]
    ),
    spacer(),
    body('Neden sadece imza de\u011Fil de 7 farkl\u0131 \u015Fekil? \u00C7\u00FCnk\u00FC farkl\u0131 \u015Fekiller farkl\u0131 kas hareketleri gerektirir. Bir ki\u015Finin yaz\u0131 stilini tam olarak anlamak i\u00E7in \u00E7e\u015Fitli motor becerileri \u00F6l\u00E7memiz gerekir.'),
    spacer(),
    heading3('Ad\u0131m 4: \u00C7izim ve Kaydetme'),
    body('Ekrandaki beyaz kare alan (512\u00D7512 piksel) \u00E7izim canvas\u0131d\u0131r. Fare veya dokunmatik ekranla \u00E7izim yapabilirsiniz. \u00C7izdikten sonra "Kaydet" butonuna bas\u0131n. Yanl\u0131\u015F \u00E7izdiyseniz "Temizle" ile silin ve tekrar \u00E7izin.'),
    spacer(),
    heading3('Ad\u0131m 4b: Bas\u0131n\u00E7 (Pressure) Alg\u0131lama'),
    body('\u00C7izim s\u0131ras\u0131nda sistem otomatik olarak kalem bas\u0131nc\u0131n\u0131 alg\u0131lar ve kaydeder. Canvas\u0131n alt\u0131nda canl\u0131 bir bas\u0131n\u00E7 g\u00F6stergesi belirir:'),
    bullet('Anl\u0131k Bas\u0131n\u00E7: O an kalemi ne kadar bast\u0131rd\u0131\u011F\u0131n\u0131z (y\u00FCzde olarak)'),
    bullet('Ortalama Bas\u0131n\u00E7: T\u00FCm \u00E7izim boyunca ortalama bask\u0131 kuvveti'),
    bullet('Maksimum Bas\u0131n\u00E7: En \u00E7ok bast\u0131rd\u0131\u011F\u0131n\u0131z nokta'),
    bullet('\u00C7izgi Say\u0131s\u0131: Kalemi ka\u00E7 kez kald\u0131r\u0131p indirdi\u011Finiz (stroke count)'),
    body('\u00C7izgi kal\u0131nl\u0131\u011F\u0131 bas\u0131nca g\u00F6re otomatik de\u011Fi\u015Fir: Hafif bast\u0131r\u0131rsan\u0131z ince, kuvvetli bast\u0131r\u0131rsan\u0131z kal\u0131n \u00E7izgi olu\u015Fur.'),
    spacer(),
    infoBox('Bas\u0131n\u00E7 Deste\u011Fi', 'Dokunmatik kalem (stylus) kullan\u0131ld\u0131\u011F\u0131nda ger\u00E7ek bas\u0131n\u00E7 verileri kaydedilir. Normal fare ile \u00E7izildi\u011Finde bas\u0131n\u00E7 sabit kal\u0131r. En do\u011Fru sonu\u00E7 i\u00E7in tablet + stylus kalem \u00F6nerilir. T\u00FCm bas\u0131n\u00E7 verileri her \u00F6rnekle birlikte veritaban\u0131na kaydedilir.'),
    spacer(),
    heading3('Ad\u0131m 5: \u0130lerlemeyi Takip Etme'),
    body('Her \u015Fekil tipi i\u00E7in ka\u00E7 tekrar yap\u0131ld\u0131\u011F\u0131 ilerleme \u00E7ubu\u011Fuyla g\u00F6sterilir. Hedef: her \u015Fekilden 50 tekrar.'),
    spacer(),
    warnBox('\u00D6nemli Uyar\u0131', 'Kat\u0131l\u0131mc\u0131ya \u015Funlar\u0131 s\u00F6yleyin: "Normalde nas\u0131l imza at\u0131yorsan\u0131z \u00F6yle at\u0131n. \u00D6zel bir \u00E7aba g\u00F6stermeyin, g\u00FCzel yazmaya \u00E7al\u0131\u015Fmay\u0131n. Do\u011Fal olun." \u00C7\u00FCnk\u00FC biz do\u011Fal varyasyonu \u00F6l\u00E7mek istiyoruz.'),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ 4. MODÜL 2: TARAMA ═══════════════
  children.push(
    heading1('4. Mod\u00FCl 2: Taranm\u0131\u015F Formlar\u0131 Sisteme Y\u00FCkleme'),
    spacer(),
    heading2('4.1 Bu Sayfa Ne Yapar?'),
    body('E\u011Fer imzalar\u0131 bilgisayarda de\u011Fil de ka\u011F\u0131t \u00FCzerinde toplad\u0131ysan\u0131z, bu ka\u011F\u0131tlar\u0131 taray\u0131c\u0131dan (scanner) ge\u00E7irip sisteme y\u00FCkleyebilirsiniz. Sistem taranm\u0131\u015F sayfadaki her imzay\u0131 otomatik olarak bulur, keser ve kaydeder.'),
    spacer(),
    heading2('4.2 Nas\u0131l \u00C7al\u0131\u015F\u0131r?'),
    body('D\u00FC\u015F\u00FCn\u00FCn ki bir form haz\u0131rlad\u0131n\u0131z. Formda \u0131zgara \u00E7izgileriyle ayr\u0131lm\u0131\u015F kutular var. Her kutuya bir imza at\u0131lm\u0131\u015F. Sistem bu formu tarad\u0131\u011F\u0131n\u0131zda:'),
    spacer(),
    bullet('Izgara \u00E7izgileri otomatik tespit edilir'),
    bullet('Her kutudaki imza ayr\u0131 ayr\u0131 kesilir'),
    bullet('Her kesilen imza 512\u00D7512 piksel olarak standartla\u015Ft\u0131r\u0131l\u0131r'),
    bullet('T\u00FCm imzalar tek seferde veritaban\u0131na kaydedilir'),
    spacer(),
    body('B\u00F6ylece 50 imzay\u0131 tek tek \u00E7izmek yerine, bir sayfada toplanan 30-50 imzay\u0131 tek tarama ile sisteme aktarabilirsiniz.'),
    spacer(),
    infoBox('Zaman Tasarrufu', 'El ile \u00E7izimle 50 imza toplamak yakla\u015F\u0131k 20-30 dakika s\u00FCrerken, ka\u011F\u0131t formla toplanan 50 imza tarama sonras\u0131 saniyeler i\u00E7inde sisteme aktar\u0131l\u0131r.'),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ 5. MODÜL 3: AI ANALİZ ═══════════════
  children.push(
    heading1('5. Mod\u00FCl 3: Yapay Zek\u00E2 ile \u0130mza Kar\u015F\u0131la\u015Ft\u0131rma'),
    spacer(),
    heading2('5.1 Bu Sayfa Ne Yapar?'),
    body('Bu mod\u00FCl, OpenAI\'nin GPT-4o Vision modelini kullan\u0131r. GPT-4o, g\u00F6r\u00FCnt\u00FCleri anlayabilen en geli\u015Fmi\u015F yapay zek\u00E2 modellerinden biridir. \u0130ki imzay\u0131 yan yana koyar, "bunlar ayn\u0131 ki\u015Fiye mi ait?" diye sorar ve bir uzman raporu gibi yan\u0131t al\u0131r.'),
    spacer(),
    heading2('5.2 Ne Gibi Sonu\u00E7lar Verir?'),
    body('Sistem \u015Fu \u00FC\u00E7 bilgiyi sunar:'),
    spacer(),
    bullet('Benzerlik Skoru: 0 ile 100 aras\u0131nda bir say\u0131. Y\u00FCksek = benzer.'),
    bullet('Karar: "\u0130mza ger\u00E7ektir" veya "\u0130mza sahtedir" veya "Karar verilemez"'),
    bullet('Gerek\u00E7e: AI neden b\u00F6yle karar verdi\u011Fini a\u00E7\u0131klar (orn: "Kalem bask\u0131 kuvveti benzer ama harflerin e\u011Fimi farkl\u0131")'),
    spacer(),
    heading2('5.3 Kullan\u0131m Ad\u0131mlar\u0131'),
    bullet('Listeden kar\u015F\u0131la\u015Ft\u0131rmak istedi\u011Finiz iki imzay\u0131 se\u00E7in'),
    bullet('"Kar\u015F\u0131la\u015Ft\u0131r" butonuna bas\u0131n'),
    bullet('AI birka\u00E7 saniye i\u00E7inde sonucu ve gerek\u00E7eyi g\u00F6sterir'),
    spacer(),
    warnBox('Not', 'Bu mod\u00FCl internet ba\u011Flant\u0131s\u0131 gerektirir \u00E7\u00FCnk\u00FC OpenAI sunucular\u0131na ba\u011Flan\u0131r. Di\u011Fer baz\u0131 mod\u00FCller ise tamamen \u00E7evrimd\u0131\u015F\u0131 \u00E7al\u0131\u015F\u0131r.'),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ 6. MODÜL 4: İSTATİSTİK ═══════════════
  children.push(
    heading1('6. Mod\u00FCl 4: \u0130statistiksel Analiz — Say\u0131larla Sonu\u00E7lar'),
    spacer(),
    heading2('6.1 Bu Sayfa Ne Yapar?'),
    body('Toplanan t\u00FCm verileri istatistiksel olarak analiz eder ve bilimsel dergilerde (Q1 d\u00FCzeyi) yay\u0131nlanabilecek kalitede metrikler \u00FCretir. Tez veya makalenizde do\u011Frudan kullanabilece\u011Finiz tablolar ve grafikler sunar.'),
    spacer(),
    heading2('6.2 Hesaplanan Metrikler — Ne Anlama Gelirler?'),
    spacer(),
    makeTable(
      ['Metrik', 'Basit A\u00E7\u0131klama', '\u00D6rnek'],
      [
        ['Sensitivity (Duyarl\u0131l\u0131k)', 'Ger\u00E7ek imzalar\u0131 ne kadar\u0131n\u0131 do\u011Fru buldu?', '%92 = 100 ger\u00E7ek imzadan 92\'sini do\u011Fru tan\u0131d\u0131'],
        ['Specificity (\u00D6zg\u00FCll\u00FCk)', 'Sahte imzalar\u0131 ne kadar\u0131n\u0131 do\u011Fru reddetti?', '%88 = 100 sahteden 88\'ini yakalad\u0131'],
        ['PPV', 'Sistem "ger\u00E7ek" dedi\u011Finde ger\u00E7ekten ger\u00E7ek olma olas\u0131l\u0131\u011F\u0131', '%95 = "ger\u00E7ek" karar\u0131na g\u00FCvenilirlik'],
        ['NPV', 'Sistem "sahte" dedi\u011Finde ger\u00E7ekten sahte olma olas\u0131l\u0131\u011F\u0131', '%85 = "sahte" karar\u0131na g\u00FCvenilirlik'],
        ['F1 Skoru', 'Duyarl\u0131l\u0131k ve kesinli\u011Fin dengeli ortalamas\u0131', '%90 = genel ba\u015Far\u0131 \u00F6l\u00E7\u00FCs\u00FC'],
        ['AUC-ROC', 'Sistemin genel ay\u0131rt etme g\u00FCc\u00FC (0-1 aras\u0131)', '0.95 = m\u00FCkemmel, 0.70 = orta'],
        ['Cohen \u03BA', '\u015Eansa d\u00FCzeltilmi\u015F uyum', '0.80+ = m\u00FCkemmel uyum'],
      ]
    ),
    spacer(),
    heading2('6.3 G\u00F6rseller'),
    body('Sayfa a\u015Fa\u011F\u0131daki grafikleri otomatik olu\u015Fturur:'),
    spacer(),
    bullet('ROC E\u011Frisi: Sistemin performans\u0131n\u0131 g\u00F6steren e\u011Fri. E\u011Fri ne kadar sol \u00FCst k\u00F6\u015Feye yak\u0131nsa sistem o kadar iyi.'),
    bullet('Confusion Matrix (Kar\u0131\u015F\u0131kl\u0131k Matrisi): Do\u011Fru ve yanl\u0131\u015F kararlar\u0131n tablosu.'),
    bullet('Histogram: Benzerlik skorlar\u0131n\u0131n da\u011F\u0131l\u0131m\u0131.'),
    bullet('\u015Eekil Bazl\u0131 Do\u011Fruluk: Hangi \u015Fekilde sistem daha ba\u015Far\u0131l\u0131?'),
    spacer(),
    infoBox('Sim\u00FClasyon Modu', 'E\u011Fer hen\u00FCz yeterli veri yoksa, sistem otomatik olarak sim\u00FClasyon modu a\u00E7ar ve sentetik verilerle \u00F6rnek grafikler \u00FCretir. B\u00F6ylece tez sunumunuzda g\u00F6sterebilece\u011Finiz g\u00F6rseller her zaman haz\u0131rd\u0131r.'),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ 7. MODÜL 5: SIAMESE CNN ═══════════════
  children.push(
    heading1('7. Mod\u00FCl 5: Derin \u00D6\u011Frenme (Siamese CNN)'),
    spacer(),
    heading2('7.1 Siamese CNN Nedir? (Basit Anlat\u0131m)'),
    body('"Siamese" (ikiz) ad\u0131n\u0131 "ikiz karde\u015Fler" kavram\u0131ndan al\u0131r. Sistem, iki imzay\u0131 ayn\u0131 anda iki "ikiz" g\u00F6zle inceler:'),
    spacer(),
    bullet('1. G\u00F6z birinci imzay\u0131 inceler ve say\u0131sal bir parmak izi \u00E7\u0131kar\u0131r (1280 say\u0131dan olu\u015Fan bir liste)'),
    bullet('2. G\u00F6z ikinci imzay\u0131 inceler ve ayn\u0131 t\u00FCr say\u0131sal parmak izi \u00E7\u0131kar\u0131r'),
    bullet('Sonra bu iki parmak izini kar\u015F\u0131la\u015Ft\u0131r\u0131r: E\u011Fer listeler birbirine \u00E7ok benziyorsa "ayn\u0131 ki\u015Fi", farkl\u0131ysa "farkl\u0131 ki\u015Fi" der'),
    spacer(),
    body('\u00D6nemli nokta: Bu iki "g\u00F6z" tamamen ayn\u0131 kurallarla bakar (ikiz oldu\u011Fu i\u00E7in). B\u00F6ylece adil bir kar\u015F\u0131la\u015Ft\u0131rma yap\u0131l\u0131r.'),
    spacer(),
    heading2('7.2 Bu Sayfa Ne Sunar?'),
    body('Bu sayfa taray\u0131c\u0131n\u0131z\u0131n i\u00E7inde (internet ba\u011Flant\u0131s\u0131 gerektirmeden) \u00E7al\u0131\u015F\u0131r. D\u00F6rt farkl\u0131 \u015Fekilde imza girebilirsiniz:'),
    spacer(),
    makeTable(
      ['Giri\u015F Modu', 'Nas\u0131l \u00C7al\u0131\u015F\u0131r', 'Ne Zaman Kullan\u0131l\u0131r'],
      [
        ['Demo Modu', 'Haz\u0131r senaryolar ile otomatik test', 'Tez sunumunda g\u00F6sterim i\u00E7in'],
        ['\u00C7izim Modu', '\u0130ki ayr\u0131 alana elle imza \u00E7izin', 'Canl\u0131 demonstrasyon i\u00E7in'],
        ['Y\u00FCkleme Modu', 'Bilgisayar\u0131n\u0131zdan imza resmi y\u00FCkleyin', 'Mevcut imza g\u00F6rselleri i\u00E7in'],
        ['Veritaban\u0131 Modu', 'Daha \u00F6nce kaydedilmi\u015F \u00F6rnekleri se\u00E7in', 'Toplanm\u0131\u015F verilerle \u00E7al\u0131\u015Fmak i\u00E7in'],
      ]
    ),
    spacer(),
    heading2('7.3 Demo Modu Senaryolar\u0131'),
    body('Demo modunda 5 haz\u0131r senaryo vard\u0131r. Her birine t\u0131klay\u0131nca sistem otomatik g\u00F6r\u00FCnt\u00FC \u00FCretir ve CNN ile kar\u015F\u0131la\u015Ft\u0131r\u0131r:'),
    spacer(),
    makeTable(
      ['Senaryo', 'Ne G\u00F6sterir'],
      [
        ['Ger\u00E7ek \u00C7ift', 'Ayn\u0131 ki\u015Finin iki farkl\u0131 imzas\u0131 \u2192 Sonu\u00E7: "Ger\u00E7ek"'],
        ['Sahtecilik \u00C7ifti', 'Farkl\u0131 ki\u015Filerin imzalar\u0131 \u2192 Sonu\u00E7: "Sahte"'],
        ['Belirsiz \u00C7ift', 'Kesin karar verilemeyen durum \u2192 Sonu\u00E7: "Belirsiz"'],
        ['Ayn\u0131 \u015Eekil Farkl\u0131 Ki\u015Fi', 'Farkl\u0131 ki\u015Filer ayn\u0131 \u015Fekli \u00E7iziyor \u2192 Sonu\u00E7: "Sahte"'],
        ['Ki\u015Fi \u0130\u00E7i Varyasyon', 'Ayn\u0131 ki\u015Fi farkl\u0131 g\u00FCnlerde \u2192 Sonu\u00E7: "Ger\u00E7ek"'],
      ]
    ),
    spacer(),
    body('"T\u00FCm Senaryolar\u0131 \u00C7al\u0131\u015Ft\u0131r" butonu ile 5 senaryoyu tek seferde \u00E7al\u0131\u015Ft\u0131r\u0131p sonu\u00E7lar\u0131 tablo halinde g\u00F6rebilirsiniz. Bu, tez j\u00FCrisi \u00F6n\u00FCnde etkileyici bir g\u00F6sterim olur.'),
    spacer(),
    heading2('7.4 Sonucun Anlam\u0131'),
    body('Sistem bir "benzerlik y\u00FCzdesi" verir:'),
    spacer(),
    makeTable(
      ['Benzerlik', 'Anlam\u0131', 'Renk'],
      [
        ['%80 ve \u00FCzeri', 'GER\u00C7EK \u2014 \u0130ki imza ayn\u0131 ki\u015Fiye ait', 'Ye\u015Fil'],
        ['%65 \u2013 %80', 'BEL\u0130RS\u0130Z \u2014 Kesin karar verilemez', 'Sar\u0131'],
        ['%65 alt\u0131', 'SAHTE \u2014 \u0130mzalar farkl\u0131 ki\u015Filere ait', 'K\u0131rm\u0131z\u0131'],
      ]
    ),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ 8. MODÜL 6: VARYASYON ANALİZİ ═══════════════
  children.push(
    heading1('8. Mod\u00FCl 6: Varyasyon Analizi'),
    spacer(),
    heading2('8.1 Bu Sayfa Ne Yapar?'),
    body('Bu mod\u00FCl, imzalar\u0131n ne kadar tutarl\u0131 oldu\u011Funu ve farkl\u0131 ki\u015Filerin imzalar\u0131n\u0131n ne kadar birbirinden ayr\u0131labildi\u011Fini \u00F6l\u00E7er. Yani "bir ki\u015Fi her seferinde benzer mi imza at\u0131yor?" ve "farkl\u0131 ki\u015Filerin imzalar\u0131 birbirinden ay\u0131rt edilebiliyor mu?" sorular\u0131n\u0131 say\u0131sal olarak yan\u0131tlar.'),
    spacer(),
    heading2('8.2 Kullan\u0131lan Y\u00F6ntemler'),
    body('Sistem \u015Fu analiz y\u00F6ntemlerini kullan\u0131r:'),
    spacer(),
    makeTable(
      ['Y\u00F6ntem', 'Ne Yapar', 'Basit A\u00E7\u0131klama'],
      [
        ['DTW Hizalama', '\u0130ki imzan\u0131n \u00E7izgi yollar\u0131n\u0131 \u00FCst \u00FCste getirir', 'Ne kadar benziyorlar?'],
        ['Varyasyon Skoru', '\u0130mzan\u0131n ne kadar de\u011Fi\u015Fti\u011Fini \u00F6l\u00E7er', 'Tutarl\u0131l\u0131k analizi'],
        ['Korunma Skoru', 'Her seferinde ayn\u0131 kalan b\u00F6lgeleri bulur', 'Kimlik tespitinin temeli'],
        ['Dendrogram', 'Kat\u0131l\u0131mc\u0131lar\u0131 benzerli\u011Fe g\u00F6re k\u00FCmeler', 'Kim kime benziyor?'],
        ['Grup Analizi', 'Ki\u015Fi i\u00E7i vs ki\u015Filer aras\u0131 fark\u0131 \u00F6l\u00E7er', 'Ay\u0131rt edicilik g\u00FCc\u00FC'],
      ]
    ),
    spacer(),
    heading2('8.3 5 Analiz Sekmesi'),
    spacer(),
    heading3('Sekme 1: Genel \u00D6zet'),
    body('T\u00FCm analiz sonu\u00E7lar\u0131n\u0131n \u00F6zeti. 4 anahtar rakam g\u00F6sterir:'),
    bullet('Intra-writer (Ki\u015Fi i\u00E7i) ortalamas\u0131: Bir ki\u015Finin kendi imzalar\u0131 aras\u0131ndaki ortalama fark. D\u00FC\u015F\u00FCk olmas\u0131 iyi \u2014 tutarl\u0131 imza at\u0131yor demek.'),
    bullet('Inter-writer (Ki\u015Filer aras\u0131) ortalamas\u0131: Farkl\u0131 ki\u015Filerin imzalar\u0131 aras\u0131ndaki ortalama fark. Y\u00FCksek olmas\u0131 iyi \u2014 imzalar birbirinden ay\u0131rt edilebiliyor demek.'),
    bullet('Ay\u0131rt edicilik indeksi: Bu iki de\u011Ferin oran\u0131. %70\'in \u00FCzeri iyi sonu\u00E7tur.'),
    bullet('Kat\u0131l\u0131mc\u0131 say\u0131s\u0131: Analize dahil edilen ki\u015Fi say\u0131s\u0131.'),
    spacer(),
    heading3('Sekme 2: Ki\u015Fi \u0130\u00E7i Varyasyon'),
    body('Her kat\u0131l\u0131mc\u0131n\u0131n kendi imzalar\u0131 ne kadar tutarl\u0131? Bir doktor d\u00FC\u015F\u00FCn\u00FCn: Sabah att\u0131\u011F\u0131 imza ile ak\u015Fam att\u0131\u011F\u0131 imza farkl\u0131 olabilir. Bu sekme bunu \u00F6l\u00E7er.'),
    bullet('Y\u00FCksek tutarl\u0131l\u0131k (%85+): Ki\u015Fi her seferinde benzer imza at\u0131yor = kolay do\u011Frulanabilir'),
    bullet('Orta tutarl\u0131l\u0131k (%70-85): Biraz de\u011Fi\u015Fkenlik var ama hâlâ tan\u0131nabilir'),
    bullet('D\u00FC\u015F\u00FCk tutarl\u0131l\u0131k (<%70): \u0130mza \u00E7ok de\u011Fi\u015Fken = do\u011Frulama zor'),
    spacer(),
    heading3('Sekme 3: Ki\u015Filer Aras\u0131 Mesafe'),
    body('T\u00FCm kat\u0131l\u0131mc\u0131 \u00E7iftleri aras\u0131ndaki mesafe tablosu. Koyu renkli h\u00FCcreler b\u00FCy\u00FCk farkl\u0131l\u0131k g\u00F6sterir \u2014 yani bu iki ki\u015Finin imzalar\u0131 birbirine benzemez. A\u00E7\u0131k h\u00FCcreler dikkat \u00E7ekmelidir \u2014 bu iki ki\u015Finin imzalar\u0131 birbirine benziyor olabilir.'),
    spacer(),
    heading3('Sekme 4: Korunma Skoru (Conservation Score)'),
    body('\u0130mzan\u0131n hangi b\u00F6lgeleri her seferinde ayn\u0131, hangileri de\u011Fi\u015Fiyor? Is\u0131 haritas\u0131 ile g\u00F6sterilir:'),
    bullet('Ye\u015Fil b\u00F6lgeler = Korunmu\u015F = Her seferinde ayn\u0131. Bunlar imzan\u0131n "kimlik" b\u00F6lgeleridir.'),
    bullet('K\u0131rm\u0131z\u0131 b\u00F6lgeler = De\u011Fi\u015Fken = Her seferinde farkl\u0131. Genelde kalem bitimleri ve ba\u011Flant\u0131 noktalar\u0131d\u0131r.'),
    body('Adli grafolojide uzmanlar zaten bunu sezgisel olarak yapar. Bizim sistemimiz bunu say\u0131sal olarak \u00F6l\u00E7er.'),
    spacer(),
    heading3('Sekme 5: Dendrogram (K\u00FCmeleme A\u011Fac\u0131)'),
    body('Kat\u0131l\u0131mc\u0131lar\u0131 imza benzerli\u011Fine g\u00F6re dallanma diyagram\u0131yla g\u00F6sterir. Yak\u0131n dallar birbirine benzer imzalar\u0131 olan kat\u0131l\u0131mc\u0131lar\u0131 g\u00F6sterir. Bu, "kimler birbirine benzer imza at\u0131yor?" sorusuna g\u00F6rsel bir yan\u0131t verir.'),
    spacer(),
    infoBox('Sim\u00FClasyon Modu', 'Yeterli ger\u00E7ek veri yoksa "Sim\u00FClasyon" butonuna bas\u0131n. Sistem 5 sanal kat\u0131l\u0131mc\u0131 olu\u015Fturur ve tam analizi \u00E7al\u0131\u015Ft\u0131r\u0131r. B\u00F6ylece tez sunumunuzda her zaman g\u00F6sterebilece\u011Finiz sonu\u00E7lar olur.'),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ 9. EĞİTİM SCRİPTİ ═══════════════
  children.push(
    heading1('9. E\u011Fitim Scripti — Bilgisayar\u0131 \u0130mza Tan\u0131may\u0131 \u00D6\u011Fretmek'),
    spacer(),
    heading2('9.1 Neden E\u011Fitim Gerekiyor?'),
    body('Web uygulamas\u0131ndaki CNN, ImageNet ad\u0131 verilen genel ama\u00E7l\u0131 bir veri setiyle e\u011Fitilmi\u015Ftir (kedi, k\u00F6pek, araba gibi \u015Feyleri tan\u0131r). Ama biz imza tan\u0131mas\u0131 istiyoruz. Bu y\u00FCzden modeli kendi imza verilerimizle "fine-tune" (ince ayar) yapmam\u0131z gerekir.'),
    spacer(),
    body('Bunu \u015F\u00F6yle d\u00FC\u015F\u00FCnebilirsiniz: Bir \u00E7ocuk \u00F6nce genel olarak okumay\u0131 \u00F6\u011Frenir (ImageNet e\u011Fitimi), sonra doktor yaz\u0131lar\u0131n\u0131 okumay\u0131 \u00F6\u011Frenir (bizim fine-tuning). \u0130kinci a\u015Fama i\u00E7in e\u011Fitim scripti kullan\u0131l\u0131r.'),
    spacer(),
    heading2('9.2 Nerede \u00C7al\u0131\u015Ft\u0131r\u0131l\u0131r?'),
    body('E\u011Fitim, g\u00FC\u00E7l\u00FC bir grafik i\u015Flemci (GPU) gerektirir. Google Colab \u00FCcretsiz GPU sunar. A\u015Fa\u011F\u0131daki ad\u0131mlar\u0131 izleyin:'),
    spacer(),
    heading3('Ad\u0131m 1: Google Colab\'a Giri\u015F'),
    body('colab.research.google.com adresine gidin ve Google hesab\u0131n\u0131zla oturum a\u00E7\u0131n.'),
    spacer(),
    heading3('Ad\u0131m 2: GPU\'yu Etkinle\u015Ftirin'),
    body('"Runtime" men\u00FCs\u00FCnden "Change runtime type" se\u00E7in, "Hardware accelerator" k\u0131sm\u0131n\u0131 "GPU" yap\u0131n.'),
    spacer(),
    heading3('Ad\u0131m 3: Google Drive\'\u0131 Ba\u011Flay\u0131n'),
    body('A\u015Fa\u011F\u0131daki kodu yeni bir h\u00FCcreye yaz\u0131p \u00E7al\u0131\u015Ft\u0131r\u0131n:'),
    codeBlock('from google.colab import drive'),
    codeBlock('drive.mount("/content/drive")'),
    spacer(),
    heading3('Ad\u0131m 4: K\u00FCt\u00FCphaneleri Y\u00FCkleyin'),
    codeBlock('!pip install tensorflow scikit-learn matplotlib seaborn pillow'),
    spacer(),
    heading3('Ad\u0131m 5: E\u011Fitimi Ba\u015Flat\u0131n'),
    codeBlock('!python train_siamese.py \\'),
    codeBlock('  --dataset "/content/drive/MyDrive/imza_verileri" \\'),
    codeBlock('  --backbone resnet50 --epochs 50 --all'),
    spacer(),
    heading2('9.3 Scriptin 17 \u00D6zelli\u011Fi'),
    body('train_siamese.py dosyas\u0131 tek ba\u015F\u0131na 17 farkl\u0131 \u00F6zellik sunar:'),
    spacer(),
    makeTable(
      ['Kategori', '\u00D6zellik', 'Basit A\u00E7\u0131klama'],
      [
        ['Mimari', '3 farkl\u0131 omurga', 'ResNet-50 (derin), MobileNet (h\u0131zl\u0131), EfficientNet (verimli)'],
        ['Kay\u0131p fonk.', '2 farkl\u0131 y\u00F6ntem', 'Contrastive Loss (\u00E7iftler) ve Triplet Loss (\u00FC\u00E7l\u00FCler)'],
        ['Veri b\u00F6lme', 'Writer-independent', 'E\u011Fitim ve test ASLA ayn\u0131 ki\u015Fiyi i\u00E7ermez'],
        ['Validasyon', 'LOOCV', 'Az veri i\u00E7in en do\u011Fru y\u00F6ntem'],
        ['Sahtecilik', 'Skilled forgery', 'Bilinçli taklit \u00F6rnekleriyle e\u011Fitim'],
        ['Veri art\u0131rma', 'Augmentation', 'D\u00F6nd\u00FCrme, aynalama, g\u00FCr\u00FClt\u00FC ekleme'],
        ['\u00D6ni\u015Fleme', 'Preprocessing', 'Otsu e\u015Fikleme, k\u0131rpma, normalizasyon'],
        ['Metrikler', 'EER, FAR, FRR, AUC, F1, \u03BA', 'Kapsaml\u0131 performans \u00F6l\u00E7\u00FCm\u00FC'],
        ['Grad-CAM', 'Dikkat haritas\u0131', 'Model imzan\u0131n neresine bak\u0131yor?'],
        ['t-SNE', 'Embedding g\u00F6rseli', '\u0130mzalar uzayda nas\u0131l k\u00FCmeleniyor?'],
        ['Adversarial', 'Sald\u0131r\u0131 testi', 'Model ne kadar sa\u011Flam?'],
        ['Kalibrasyon', 'Temp. Scaling', 'G\u00FCven skorlar\u0131 ne kadar do\u011Fru?'],
      ]
    ),
    spacer(),
    infoBox('--all Bayra\u011F\u0131', 'Komutun sonuna --all eklerseniz t\u00FCm 17 \u00F6zellik otomatik a\u00E7\u0131l\u0131r. Tek tek se\u00E7menize gerek kalmaz.'),
    spacer(),
    heading2('9.4 \u00C7\u0131kt\u0131lar Ne Olur?'),
    body('E\u011Fitim tamamland\u0131\u011F\u0131nda \u015Funlar\u0131 elde edersiniz:'),
    spacer(),
    bullet('E\u011Fitilmi\u015F model dosyas\u0131 (.h5) — Tezde "model a\u011F\u0131rl\u0131klar\u0131" olarak referans verilir'),
    bullet('ROC e\u011Frisi grafi\u011Fi — "Bulgular" b\u00F6l\u00FCm\u00FCne eklenir'),
    bullet('Confusion matrix — Do\u011Fru/yanl\u0131\u015F karar tablosu'),
    bullet('T\u00FCm metrikler (EER, AUC, F1 vb.) — "Sonu\u00E7lar" b\u00F6l\u00FCm\u00FCne eklenir'),
    bullet('Grad-CAM \u0131s\u0131 haritalar\u0131 — "Model imzan\u0131n neresine bak\u0131yor?" g\u00F6rseli'),
    bullet('t-SNE g\u00F6rseli — \u0130mzalar\u0131n k\u00FCmelenme haritas\u0131'),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ 10. VERİ SETİ ═══════════════
  children.push(
    heading1('10. Veri Seti Nas\u0131l Haz\u0131rlan\u0131r?'),
    spacer(),
    heading2('10.1 Klas\u00F6r Yap\u0131s\u0131'),
    body('\u0130mza verileri \u015Fu \u015Fekilde d\u00FCzenlenmeli:'),
    spacer(),
    codeBlock('imza_verileri/'),
    codeBlock('  katilimci_01/'),
    codeBlock('    imza/          \u2190 Ki\u015Finin ger\u00E7ek imzalar\u0131'),
    codeBlock('      001.png'),
    codeBlock('      002.png'),
    codeBlock('      ...'),
    codeBlock('    paraf/         \u2190 Ki\u015Finin paraflar\u0131'),
    codeBlock('    W/             \u2190 W harfi \u00E7izimleri'),
    codeBlock('    taklit/        \u2190 Ba\u015Fkas\u0131n\u0131n bu ki\u015Finin imzas\u0131n\u0131 taklit etmesi'),
    codeBlock('  katilimci_02/'),
    codeBlock('    imza/'),
    codeBlock('    ...'),
    spacer(),
    heading2('10.2 Yeni Kat\u0131l\u0131mc\u0131 Ekleme'),
    body('Yeni bir kat\u0131l\u0131mc\u0131 eklemek \u00E7ok basit:'),
    spacer(),
    bullet('1. Ana klas\u00F6rde yeni bir alt klas\u00F6r olu\u015Fturun (isim \u00F6nemli de\u011Fil)'),
    bullet('2. \u0130\u00E7ine imza/, paraf/ gibi alt klas\u00F6rler olu\u015Fturun'),
    bullet('3. PNG dosyalar\u0131n\u0131 i\u00E7ine koyun'),
    bullet('4. E\u011Fitim scriptini tekrar \u00E7al\u0131\u015Ft\u0131r\u0131n'),
    spacer(),
    body('Script klas\u00F6r adlar\u0131n\u0131 otomatik tan\u0131r. "P001", "katilimci_01_veriler", "Hasta_Ali" gibi herhangi bir isimlendirme kullanabilirsiniz.'),
    spacer(),
    warnBox('Dikkat', '"taklit" klas\u00F6r\u00FC k\u00FC\u00E7\u00FCk harfle yaz\u0131lmal\u0131d\u0131r. Bu klas\u00F6rdeki g\u00F6r\u00FCnt\u00FCler "nitelikli sahtecilik" (skilled forgery) olarak i\u015Flenir.'),
    spacer(),
    heading2('10.3 Mevcut Durum'),
    body('\u015Eu anda sistemde P004 kat\u0131l\u0131mc\u0131s\u0131na ait 210 g\u00F6r\u00FCnt\u00FC (7 \u015Fekil \u00D7 30 tekrar) bulunmaktad\u0131r. T\u00FCm veri seti "signatures_dataset.zip" olarak indirilebilir. Google Drive\'daki di\u011Fer kat\u0131l\u0131mc\u0131 verileri de Colab \u00FCzerinden eri\u015Filebilir.'),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ 11. SONUÇLAR ═══════════════
  children.push(
    heading1('11. Sonu\u00E7lar Ne Anlama Gelir?'),
    spacer(),
    heading2('11.1 Tez / Makale \u0130\u00E7in \u00D6nemli Metrikler'),
    body('A\u015Fa\u011F\u0131daki tablo, tezinizde veya makalenizde raporlaman\u0131z gereken temel metrikleri ve bunlar\u0131n ne anlama geldi\u011Fini \u00F6zetler:'),
    spacer(),
    makeTable(
      ['Metrik', '\u0130yi Say\u0131l\u0131r', 'Ne Anlama Gelir'],
      [
        ['AUC-ROC', '\u22650.90', 'Sistemin genel ba\u015Far\u0131s\u0131. 1.0 m\u00FCkemmel.'],
        ['EER (Equal Error Rate)', '\u22640.10', 'Yanl\u0131\u015F kabul = Yanl\u0131\u015F ret noktas\u0131. D\u00FC\u015F\u00FCk = iyi.'],
        ['F1 Skoru', '\u22650.85', 'Precision ve Recall dengesi. Y\u00FCksek = iyi.'],
        ['Cohen \u03BA', '\u22650.80', '\u015Eansa d\u00FCzeltilmi\u015F uyum. 0.80+ = m\u00FCkemmel.'],
        ['Sensitivity', '\u22650.90', 'Ger\u00E7ekleri ka\u00E7\u0131rmama oran\u0131.'],
        ['Specificity', '\u22650.85', 'Sahteleri yakalama oran\u0131.'],
      ]
    ),
    spacer(),
    heading2('11.2 Sonu\u00E7lar\u0131 J\u00FCriye Nas\u0131l Sunmal\u0131?'),
    body('Tez sunumunda \u015Fu s\u0131ray\u0131 takip edin:'),
    spacer(),
    bullet('1. Problem: "Adli t\u0131pta imza sahtecili\u011Fi tespiti \u00F6zneldir ve uzman ba\u011F\u0131ml\u0131d\u0131r"'),
    bullet('2. \u00C7\u00F6z\u00FCm: "Siamese CNN ile otomatik, nesnel bir sistem geli\u015Ftirdik"'),
    bullet('3. Metodoloji: "20 kat\u0131l\u0131mc\u0131dan 7.000 \u00F6rnek, writer-independent split"'),
    bullet('4. Sonu\u00E7lar: AUC, F1, EER tablolar\u0131n\u0131 g\u00F6sterin'),
    bullet('5. Canl\u0131 Demo: Siamese CNN sayfas\u0131n\u0131n Demo modunu \u00E7al\u0131\u015Ft\u0131r\u0131n'),
    bullet('6. Yenilik: "Varyasyon analizi ile imza tutarl\u0131l\u0131\u011F\u0131n\u0131 \u00F6l\u00E7t\u00FCk" \u2014 dendrogram\u0131 g\u00F6sterin'),
    spacer(),
    heading2('11.3 Sistemin S\u0131n\u0131rlamalar\u0131'),
    body('Her bilimsel \u00E7al\u0131\u015Fma gibi, bu sistemin de s\u0131n\u0131rlamalar\u0131 vard\u0131r:'),
    spacer(),
    bullet('Kat\u0131l\u0131mc\u0131 say\u0131s\u0131 artt\u0131k\u00E7a sonu\u00E7lar daha g\u00FCvenilir olur'),
    bullet('Tarama kalitesi \u00F6nemlidir: D\u00FC\u015F\u00FCk \u00E7\u00F6z\u00FCn\u00FCrl\u00FCkl\u00FC taramalar detay kayb\u0131na neden olabilir. En az 300 DPI \u00F6nerilir.'),
    bullet('Dijital ortamda (canvas ile) \u00E7izildi\u011Finde kalem bas\u0131nc\u0131 \u00F6l\u00E7\u00FCm\u00FC, dokunmatik kalem (stylus) deste\u011Fi olan cihazlara ba\u011Fl\u0131d\u0131r. Fare ile \u00E7izildi\u011Finde bas\u0131n\u00E7 verisi sabit kal\u0131r.'),
    spacer(),
    heading2('11.4 Sistemin Avantajlar\u0131'),
    spacer(),
    bullet('Hem ka\u011F\u0131t hem dijital veri toplama deste\u011Fi \u2014 Kat\u0131l\u0131mc\u0131lar ka\u011F\u0131t \u00FCzerinde do\u011Fal ortamda imza atar, formlar taranarak sisteme y\u00FCklenir. B\u00F6ylece en do\u011Fal imza verileri elde edilir. Ek olarak dijital canvas ile de do\u011Frudan veri toplanabilir.'),
    bullet('Yeni ki\u015Fi eklemek i\u00E7in model yeniden e\u011Fitilmez \u2014 Siamese CNN mimarisi "bu iki imza benzer mi?" diye sorar, belirli ki\u015Fileri ezberlemez. Referans imzalar\u0131 y\u00FCklemek yeterlidir.'),
    bullet('Tamamen web tabanl\u0131 \u2014 bilgisayara program kurulmas\u0131 gerekmez'),
    bullet('CNN kar\u015F\u0131la\u015Ft\u0131rmas\u0131 taray\u0131c\u0131da \u00E7al\u0131\u015F\u0131r \u2014 internet kesilse bile derin \u00F6\u011Frenme analizi devam eder'),
    bullet('Varyasyon analizi (DTW, korunma skoru, k\u00FCmeleme) \u2014 imza tutarl\u0131l\u0131\u011F\u0131n\u0131 nesnel olarak \u00F6l\u00E7er'),
    bullet('Kalem bas\u0131nc\u0131 alg\u0131lama \u2014 Dijital canvas ile \u00E7izildi\u011Finde Pointer Events API ile ger\u00E7ek zamanl\u0131 kalem bas\u0131nc\u0131 \u00F6l\u00E7\u00FCl\u00FCr ve her \u00F6rnekle birlikte kaydedilir'),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ═══════════════ 12. SSS ═══════════════
  children.push(
    heading1('12. S\u0131k Sorulan Sorular'),
    spacer(),

    heading3('S: Sistemi kullanmak i\u00E7in yaz\u0131l\u0131m bilgisi gerekir mi?'),
    body('Hay\u0131r. Web aray\u00FCz\u00FC tamamen g\u00F6rsel ve sezgiseldir. T\u0131klayarak kullanabilirsiniz. Sadece e\u011Fitim scripti i\u00E7in Google Colab\'da birka\u00E7 sat\u0131r kod \u00E7al\u0131\u015Ft\u0131rmak gerekir — bu da yukar\u0131daki ad\u0131mlar\u0131 takip ederek yap\u0131labilir.'),
    spacer(),

    heading3('S: Veriler g\u00FCvende mi?'),
    body('Evet. Sisteme oturum a\u00E7madan eri\u015Filemez. T\u00FCm veriler sunucudaki PostgreSQL veritaban\u0131nda \u015Fifreli oturumla korunur. Veriler sadece oturum a\u00E7an kullan\u0131c\u0131ya g\u00F6r\u00FCn\u00FCr.'),
    spacer(),

    heading3('S: Demo modundaki sonu\u00E7lar ger\u00E7ek mi?'),
    body('Demo modundaki g\u00F6r\u00FCnt\u00FCler bilgisayar taraf\u0131ndan \u00FCretilir. CNN ger\u00E7ekten \u00E7al\u0131\u015F\u0131r ama girdiler sentetiktir. Amac\u0131, sistemin pipeline\'\u0131n\u0131n do\u011Fru \u00E7al\u0131\u015Ft\u0131\u011F\u0131n\u0131 g\u00F6stermek ve tez sunumunda etkileyici bir demo yapmakt\u0131r.'),
    spacer(),

    heading3('S: Yeni ki\u015Fi eklemek i\u00E7in model yeniden e\u011Fitilmeli mi?'),
    body('Hay\u0131r, gerekmez. Bu sistemin en b\u00FCy\u00FCk avantajlar\u0131ndan biri budur. Siamese CNN mimarisi "Bu iki imza benzer mi?" sorusunu cevaplar, belirli ki\u015Fileri ezberlemez. Bu y\u00FCzden yeni bir ki\u015Fi eklemek istedi\u011Finizde sadece o ki\u015Finin referans imzalar\u0131n\u0131 sisteme y\u00FCklemek yeterlidir. Model oldu\u011Fu gibi \u00E7al\u0131\u015Fmaya devam eder. Parmak izi sistemindeki gibi d\u00FC\u015F\u00FCn\u00FCn: Yeni bir parmak izi kaydetti\u011Finizde sistemi ba\u015Ftan kurmuyorsunuz, sadece yeni kayd\u0131 ekliyorsunuz.'),
    spacer(),

    heading3('S: Ka\u00E7 kat\u0131l\u0131mc\u0131 yeterlidir?'),
    body('Minimum 5 kat\u0131l\u0131mc\u0131 ile anlaml\u0131 sonu\u00E7lar al\u0131nabilir (LOOCV modu ile). \u0130deal say\u0131 15-20 kat\u0131l\u0131mc\u0131d\u0131r. Ne kadar \u00E7ok kat\u0131l\u0131mc\u0131, o kadar g\u00FCvenilir sonu\u00E7.'),
    spacer(),

    heading3('S: Contrastive Loss mu Triplet Loss mu kullanmal\u0131y\u0131m?'),
    body('Her ikisini de deneyip kar\u015F\u0131la\u015Ft\u0131rman\u0131z \u00F6nerilir. Bu kar\u015F\u0131la\u015Ft\u0131rma bile ba\u015Fl\u0131 ba\u015F\u0131na makale malzemesidir. Genel kural: K\u00FC\u00E7\u00FCk veri seti (\u22645 ki\u015Fi) = Contrastive, b\u00FCy\u00FCk veri seti (10+ ki\u015Fi) = Triplet daha iyi sonuclar verebilir.'),
    spacer(),

    heading3('S: Varyasyon analizi ne katk\u0131 sa\u011Flar?'),
    body('DTW hizalama, korunma skoru ve k\u00FCmeleme a\u011Fac\u0131 gibi y\u00F6ntemlerle imzalar\u0131n tutarl\u0131l\u0131\u011F\u0131n\u0131 ve ay\u0131rt edilebilirli\u011Fini nesnel olarak \u00F6l\u00E7er. CNN\'den ba\u011F\u0131ms\u0131z bir analiz katman\u0131 sunarak sonu\u00E7lar\u0131 g\u00FC\u00E7lendirir.'),
    spacer(),

    heading3('S: Sistem \u00E7evrimd\u0131\u015F\u0131 \u00E7al\u0131\u015F\u0131r m\u0131?'),
    body('K\u0131smen. Derin \u00D6\u011Frenme (CNN) ve Varyasyon Analizi sayfalar\u0131 tamamen taray\u0131c\u0131da \u00E7al\u0131\u015F\u0131r, internet gerektirmez. Ama GPT-4o \u0130mza Analizi ve Veri Toplama sayfalar\u0131 sunucu ba\u011Flant\u0131s\u0131 gerektirir.'),
    spacer(),

    heading3('S: Bu sistemi ba\u015Fka bir hastanede de kullanabilir miyim?'),
    body('Evet. Sistem web tabanl\u0131 oldu\u011Fu i\u00E7in herhangi bir bilgisayardan eri\u015Filebilir. Veri seti ve model ba\u011F\u0131ms\u0131z olarak ta\u015F\u0131nabilir.'),
    spacer(),

    heading3('S: Yeni bir \u015Fekil tipi ekleyebilir miyim?'),
    body('Evet. Veri toplama sayfas\u0131nda yeni \u015Fekil tipleri tan\u0131mlanabilir. E\u011Fitim scripti klas\u00F6r ad\u0131na g\u00F6re \u015Fekil tipini otomatik tan\u0131r.'),
    spacer(),

    heading3('S: Sistemi nas\u0131l g\u00FCncellerim?'),
    body('Sistem Replit platformu \u00FCzerinde bar\u0131nd\u0131r\u0131lmaktad\u0131r. G\u00FCncellemeler do\u011Frudan platf\u00F6rm \u00FCzerinden yap\u0131l\u0131r. Veriler ve model ayr\u0131 tutuldu\u011Fundan g\u00FCncelleme s\u0131ras\u0131nda veri kayb\u0131 ya\u015Fanmaz.'),

    spacer(), spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: ACCENT } },
      children: [
        new TextRun({ text: '\n\nChiroBench v3.0', bold: true, size: 20, font: 'Calibri', color: NAVY }),
        new TextRun({ text: ' \u2014 Ankara Bilkent \u015Eehir Hastanesi, Adli T\u0131p Klini\u011Fi', size: 20, font: 'Calibri', color: GRAY }),
        new TextRun({ text: '\nNisan 2026 \u2022 T\u00FCm haklar\u0131 sakl\u0131d\u0131r.', size: 18, font: 'Calibri', color: GRAY, italics: true }),
      ],
    }),
  );

  const doc = new Document({
    creator: 'ChiroBench',
    title: 'ChiroBench \u2014 Kapsaml\u0131 Tan\u0131t\u0131m ve Kullan\u0131m K\u0131lavuzu',
    description: 'Adli Grafoloji Ara\u015Ft\u0131rma ve \u0130mza Do\u011Frulama Sistemi - Ayr\u0131nt\u0131l\u0131 Dok\u00FCmantasyon',
    sections: [{
      properties: {
        page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1) } },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'ChiroBench \u2014 Adli Grafoloji Ara\u015Ft\u0131rma Sistemi', italics: true, size: 16, font: 'Calibri', color: GRAY })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Ankara Bilkent \u015Eehir Hastanesi \u2014 Adli T\u0131p Klini\u011Fi \u2022 Gizlidir', size: 16, font: 'Calibri', color: GRAY })],
          })],
        }),
      },
      children,
    }],
  });

  const buf = await Packer.toBuffer(doc);
  const out = 'client/public/ChiroBench_Kullanim_Kilavuzu.docx';
  fs.writeFileSync(out, buf);
  console.log(`DOCX created: ${out} (${(buf.length / 1024).toFixed(0)} KB)`);
}

build().catch(e => { console.error(e); process.exit(1); });
