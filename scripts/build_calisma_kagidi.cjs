/* TOMEC Çalışma Kâğıdı — tek sayfa A4, hekim/uzman doldurma formatı */
const fs = require('fs');
const { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  Footer, PageNumber, PageOrientation } = require('docx');

const NAVY='0D2545', WINE='7A2231', SAND='C9A06A', LIGHT='EAEEF2', GREY='9AA5B1';
const T = (txt, opts={}) => new TextRun({ text: String(txt ?? ''), ...opts });
const cellTxt = (txt, opts = {}) => new TableCell({
  width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  children: [new Paragraph({ alignment: opts.align || AlignmentType.LEFT, spacing: { line: 240 },
    children: [T(txt, { bold: !!opts.bold, size: opts.size || 16, color: opts.color || '000000' })] })],
  margins: { top: 60, bottom: 60, left: 80, right: 80 },
  verticalAlign: 'center',
});
const cellMulti = (lines, opts={}) => new TableCell({
  width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  children: lines.map(l => new Paragraph({ spacing: { line: 220, after: 30 },
    children: [T(l, { size: 14, color: opts.color || '000000' })] })),
  margins: { top: 50, bottom: 50, left: 80, right: 80 },
});

const c = [];
// Başlık
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [T('TOMEC ÇALIŞMA KÂĞIDI', { bold: true, size: 28, color: NAVY })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [T('Travma–Obstetrik Mediko-legal Causality Skoru — Doldurma Formu', { italics: true, size: 18, color: NAVY })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
  children: [T('Ankara Bilkent Şehir Hastanesi · Adli Tıp Kliniği', { size: 16, color: GREY })] }));

// Kimlik tablosu
const idRows = new Table({
  width: { size: 14400, type: WidthType.DXA },
  rows: [
    new TableRow({ children: [
      cellTxt('Vaka No', { bold: true, fill: NAVY, color: 'FFFFFF', width: 1800 }),
      cellTxt('', { width: 3000 }),
      cellTxt('Başvuru Tarihi', { bold: true, fill: NAVY, color: 'FFFFFF', width: 1800 }),
      cellTxt('', { width: 1800 }),
      cellTxt('Olay Tarihi', { bold: true, fill: NAVY, color: 'FFFFFF', width: 1800 }),
      cellTxt('', { width: 1800 }),
      cellTxt('Düzenleyen', { bold: true, fill: NAVY, color: 'FFFFFF', width: 1400 }),
      cellTxt('', { width: 1000 }),
    ]}),
    new TableRow({ children: [
      cellTxt('Yaş / Gravida-Para', { bold: true, fill: NAVY, color: 'FFFFFF', width: 1800 }),
      cellTxt('', { width: 3000 }),
      cellTxt('Gestasyonel Hafta', { bold: true, fill: NAVY, color: 'FFFFFF', width: 1800 }),
      cellTxt('', { width: 1800 }),
      cellTxt('Travma Türü', { bold: true, fill: NAVY, color: 'FFFFFF', width: 1800 }),
      cellTxt('☐ Künt  ☐ Trafik  ☐ İş  ☐ Şiddet  ☐ Düşme  ☐ Diğer:', { width: 4200 }),
    ]}),
  ],
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    left: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    right: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: GREY },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: GREY },
  }
});
c.push(idRows);
c.push(new Paragraph({ spacing: { after: 100 } }));

// Ana TOMEC matris
const HEADER = (t) => cellTxt(t, { bold: true, fill: NAVY, color: 'FFFFFF', size: 16, align: AlignmentType.CENTER });
const headerRow = new TableRow({ tableHeader: true, children: [
  HEADER('Alan (ağırlık)'),
  HEADER('0'), HEADER('1'), HEADER('2'), HEADER('3'), HEADER('4'),
  HEADER('Seçim'),
]});

const rows = [
  ['T (Travma Şiddeti) × 0,25',
   'Yok',
   'Hafif yumruk/itme',
   'Tekrarlayan darp / orta künt',
   'Yüksek-enerji (MVA, yüksekten düşme)',
   'Penetran / multipl ağır travma'],
  ['O (Obstetrik / Gestasyon) × 0,20',
   'Gebelik yok',
   '≤ 12 hafta',
   '13–22 hafta',
   '23–27 hafta',
   '≥ 28 hafta'],
  ['M (Maternal Komorbid) × 0,15',
   'Sağlıklı',
   'Hafif komorbid',
   'Preeklampsi / HT / DM',
   'HELLP / koagülopati',
   'Önceki dekolman / plasenta previa'],
  ['E (Eylem Mekanizma-Enerji) × 0,20',
   'İlgisiz',
   'Dolaylı (uzak bölge)',
   'Direkt karın (yumruk/tekme)',
   'Yüksek-hız (araç/düşme)',
   'Penetran karın + kemerli MVA'],
  ['C (Kronolojik / Temporal) × 0,20',
   'İlgisiz',
   '> 4 hafta (alternatif sebep dışlanmalı)',
   '1–4 hafta',
   '24 saat – 7 gün',
   '< 24 saat (klasik dekolman penceresi)'],
];
const palette = ['F0F4F8', 'D8E0E8', 'BFCCD8', 'A2B3C2', '7E91A4'];
const matrixRows = [headerRow];
rows.forEach(r => {
  matrixRows.push(new TableRow({ children: [
    cellTxt(r[0], { bold: true, fill: LIGHT, size: 16, width: 2400 }),
    cellTxt(r[1], { fill: palette[0], size: 13, width: 1900 }),
    cellTxt(r[2], { fill: palette[1], size: 13, width: 1900 }),
    cellTxt(r[3], { fill: palette[2], size: 13, width: 1900 }),
    cellTxt(r[4], { fill: palette[3], size: 13, width: 1900 }),
    cellTxt(r[5], { fill: palette[4], color: 'FFFFFF', size: 13, width: 1900 }),
    cellTxt('☐0  ☐1  ☐2  ☐3  ☐4', { bold: true, fill: 'FFF2DA', size: 14, width: 2500, align: AlignmentType.CENTER }),
  ]}));
});
c.push(new Table({ rows: matrixRows, width: { size: 14400, type: WidthType.DXA },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    left: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    right: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: GREY },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: GREY },
  } }));
c.push(new Paragraph({ spacing: { after: 80 } }));

// Hesaplama satırı
const calcRows = new Table({
  width: { size: 14400, type: WidthType.DXA },
  rows: [
    new TableRow({ children: [
      cellTxt('FORMÜL', { bold: true, fill: WINE, color: 'FFFFFF', size: 14, width: 1800, align: AlignmentType.CENTER }),
      cellTxt('Toplam = Σ(düzey/4 × ağırlık × 100)   →   Aralık [0–100]',
        { bold: true, size: 16, color: NAVY, width: 8200, align: AlignmentType.CENTER, fill: LIGHT }),
      cellTxt('TOPLAM SKOR', { bold: true, fill: WINE, color: 'FFFFFF', size: 14, width: 1800, align: AlignmentType.CENTER }),
      cellTxt('', { width: 2600, fill: 'FFF2DA', size: 22, align: AlignmentType.CENTER }),
    ]}),
  ],
  borders: {
    top: { style: BorderStyle.SINGLE, size: 6, color: WINE },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: WINE },
    left: { style: BorderStyle.SINGLE, size: 6, color: WINE },
    right: { style: BorderStyle.SINGLE, size: 6, color: WINE },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: WINE },
  }
});
c.push(calcRows);
c.push(new Paragraph({ spacing: { after: 100 } }));

// Eşik bandı
const bands = [
  ['0–9', 'Yok', '7B8794'],
  ['10–24', 'Uzak', 'A0AEC0'],
  ['25–39', 'Düşük', 'E2C275'],
  ['40–54', 'Mümkün', 'E08B4D'],
  ['55–69', 'Muhtemel', 'D26A4D'],
  ['70–84', 'Yüksek Olasılıklı', 'A8324A'],
  ['85–100', 'Kesin', '5C0E1F'],
];
const bandCells = bands.map(b => new TableCell({
  shading: { fill: b[2], type: ShadingType.CLEAR },
  children: [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
      children: [T(b[0], { bold: true, color: b[2] === 'E2C275' ? NAVY : 'FFFFFF', size: 14 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER,
      children: [T(b[1], { color: b[2] === 'E2C275' ? NAVY : 'FFFFFF', size: 12 })] }),
  ],
  margins: { top: 60, bottom: 60, left: 40, right: 40 },
}));
c.push(new Table({ rows: [new TableRow({ children: bandCells })],
  width: { size: 14400, type: WidthType.DXA },
  borders: {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
  } }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 100 },
  children: [T('TOMEC Eşik Skalası', { italics: true, size: 14, color: GREY })] }));

// Anlatı/sonuç bölmesi
const narrRows = new Table({
  width: { size: 14400, type: WidthType.DXA },
  rows: [
    new TableRow({ children: [
      cellMulti(['Olay özeti / mekanizma:', '', '', ''], { fill: 'FAFBFC', width: 7200 }),
      cellMulti(['Alternatif sebepler dışlandı mı? (kromozomal, enfeksiyon, idiyopatik):', '', '', ''], { fill: 'FAFBFC', width: 7200 }),
    ]}),
    new TableRow({ children: [
      cellMulti(['ATK / klinik bulgular (CTG, USG, Kleihauer-Betke, kanama, kontraksiyon):', '', '', ''], { fill: 'FAFBFC', width: 7200 }),
      cellMulti(['Kategorik kanaat (Yok / Uzak / Düşük / Mümkün / Muhtemel / Yük. Olas. / Kesin):', '', '', ''], { fill: 'FAFBFC', width: 7200 }),
    ]}),
  ],
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    left: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    right: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: GREY },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: GREY },
  }
});
c.push(narrRows);

c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240 },
  children: [T('Düzenleyen Hekim İmza/Tarih: ____________________________   ',
              { size: 14, color: NAVY }),
             T('Bilirkişi/Kurul İmza: ____________________________',
              { size: 14, color: NAVY })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 },
  children: [T('TOMEC v6 — © Adli Tıp Kliniği, Bilkent Şehir Hastanesi · Klinik kullanım için tasarlanmıştır.',
              { italics: true, size: 12, color: GREY })] }));

const doc = new Document({
  creator: 'Dr. Nurcan Denli Bayır',
  title: 'TOMEC Çalışma Kâğıdı',
  sections: [{
    properties: {
      page: {
        size: { orientation: PageOrientation.LANDSCAPE, width: 16838, height: 11906 },
        margin: { top: 720, bottom: 720, left: 720, right: 720 },
      },
    },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [T('TOMEC v6 · Tek Sayfa Çalışma Kâğıdı', { size: 14, color: GREY, italics: true })] })] }) },
    children: c,
  }],
});

(async () => {
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync('client/public/TOMEC_v6_Calisma_Kagidi.docx', buf);
  console.log('Çalışma kâğıdı:', Math.round(buf.length / 1024), 'KB');
})();
