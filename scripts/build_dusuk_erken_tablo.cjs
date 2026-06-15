const fs = require('fs');
const { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, PageOrientation, HeightRule } = require('docx');

const data = JSON.parse(fs.readFileSync('scripts/sinerji_dump/refined_v5_dusuk_erken.json'));
console.log('Records:', data.length);

const para = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text: String(text ?? ''), ...opts })], ...opts });
const cell = (text, opts = {}, width) => new TableCell({
  width: width ? { size: width, type: WidthType.DXA } : undefined,
  children: [new Paragraph({ children: [new TextRun({ text: String(text ?? ''), size: opts.size || 16, bold: !!opts.bold })] })],
  margins: { top: 60, bottom: 60, left: 80, right: 80 },
});

const HEADER_BG = 'D9E1F2';
const headerCell = (text, width) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  shading: { fill: HEADER_BG },
  children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18 })] })],
  margins: { top: 80, bottom: 80, left: 80, right: 80 },
});

const cols = [
  { k: 'sira',    w: 600,  h: 'No' },
  { k: 'tipadi',  w: 1100, h: 'Mahkeme' },
  { k: 'daire',   w: 1500, h: 'Daire' },
  { k: 'esas',    w: 1100, h: 'Esas No' },
  { k: 'karar',   w: 1100, h: 'Karar No' },
  { k: 'tarih',   w: 1100, h: 'Karar Tarihi' },
  { k: 'score',   w: 600,  h: 'TOMEC Skor' },
  { k: 'sinyal',  w: 2200, h: 'Sinyaller' },
  { k: 'kesit',   w: 6500, h: 'Olay / İlgili Kesit' },
];

const rows = [new TableRow({ tableHeader: true, children: cols.map(c => headerCell(c.h, c.w)) })];

data.forEach((r, i) => {
  const esas = r.esasno ? (r.esasyil ? `${r.esasyil}/${r.esasno}` : r.esasno) : '';
  const v = {
    sira: i + 1,
    tipadi: r.tipadi || '',
    daire: r.daire || '',
    esas,
    karar: r.kararno || '',
    tarih: r.karartarihi || '',
    score: r.score,
    sinyal: (r.signals || []).join(' • '),
    kesit: r.kesit || '',
  };
  rows.push(new TableRow({
    children: cols.map(c => cell(v[c.k], { size: c.k === 'kesit' ? 14 : 15 }, c.w)),
  }));
});

const table = new Table({
  rows,
  width: { size: 15800, type: WidthType.DXA },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'BBBBBB' },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'BBBBBB' },
  },
});

const children = [
  new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `Erken Doğum / Düşük – ${data.length} Yargı Kararı Künye Tablosu`, bold: true, size: 28 })] }),
  para(''),
  para('Travma–Obstetrik Mediko-legal Causality (TOMEC) — kaynak: Sinerji Mevzuat içtihat tabanı (4 dalga arama, 3501 karar korpusu, 2284 alakalı, 571 erken doğum/düşük spesifik).', { italics: true, size: 18 }),
  para(`Hazırlayan: Replit Asistan • Dr. Nurcan Denli Bayır için • Tarih: ${new Date().toLocaleDateString('tr-TR')}`, { size: 18 }),
  para(''),
  para('Sütunlar: Mahkeme türü • Daire/birim • Esas (Yıl/No) • Karar No • Karar Tarihi • TOMEC ön-skor • Sinyaller (regex eşleşmeleri) • İlgili olay kesiti (otomatik çıkarım).', { size: 16 }),
  para(''),
  table,
];

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { orientation: PageOrientation.LANDSCAPE, width: 16838, height: 11906 },
        margin: { top: 720, bottom: 720, left: 720, right: 720 },
      },
    },
    children,
  }],
});

(async () => {
  const buf = await Packer.toBuffer(doc);
  const out = `client/public/TOMEC_v5_${data.length}_Erken_Dogum_Dusuk_Kunye_Tablosu.docx`;
  fs.writeFileSync(out, buf);
  console.log('DOCX:', out, '-', Math.round(buf.length / 1024), 'KB');
})();
