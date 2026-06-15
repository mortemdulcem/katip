const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType } = require('docx');

const data = require('./sinerji_dump/all_results.json');

function clean(s) { return (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
function tr(s) { return (s || '').toString().replace(/"/g, '""'); }

const ictihatTipleri = new Set(['Yargıtay','Anayasa','Danıştay','Bölge Adliye Mahkemesi','A.İ.H.M.','Askeri Yargıtay','A.Y.İ.M.','Bölge İdare Mahkemesi','Sigorta Tahkim Komisyonu ','Kamu Denetçiliği Kurumu']);
const filtered = data.filter(r => ictihatTipleri.has(r.tipadi));
console.log(`Filtered ${filtered.length} mahkeme/kurul kararı (${data.length} toplam)`);

const sorted = [...filtered].sort((a, b) => (b.karartarihi || '').localeCompare(a.karartarihi || ''));

/* ============ CSV ============ */
const headers = ['No','Tip','Mahkeme/Daire','Esas','Karar','Tarih','ID (Sinerji)','URL','Anahtar Kelimeler','Snippet'];
const lines = [headers.map(tr).map(s=>`"${s}"`).join(',')];
sorted.forEach((r, i) => {
  const url = `https://mevzuat.sinerjias.com.tr/ictihat/yuksek-mahkeme/yargitay%20karari/${r.id}`;
  const row = [
    i+1, r.tipadi, r.dairetamadi || r.dairekisaadi || '',
    `${r.esasyil || ''}/${r.esasno || ''}`,
    `${r.kararyil || ''}/${r.kararno || ''}`,
    r.karartarihi || '', r.id, url,
    (r.metinList || []).join(', '),
    clean(r.metin).slice(0, 500),
  ];
  lines.push(row.map(c => `"${tr(c)}"`).join(','));
});
fs.writeFileSync('client/public/Sinerji_Gebe_Travma_871_Karar.csv', '\ufeff' + lines.join('\n'));
console.log('CSV:', lines.length-1, 'rows');

/* ============ DOCX ÖZET ============ */
const F = 'Calibri';
const T = (t, o={}) => new TextRun({ text: t, font: F, size: o.size||20, bold: o.bold, italics: o.italics, color: o.color });
const P = (t, o={}) => new Paragraph({ spacing: { after: 100, line: 280 }, alignment: o.align || AlignmentType.JUSTIFIED,
  children: Array.isArray(t) ? t : [T(t, o)] });
const H = (t, lvl=1) => new Paragraph({
  heading: lvl===1?HeadingLevel.HEADING_1:HeadingLevel.HEADING_2,
  spacing: { before: lvl===1?360:240, after: 120 },
  pageBreakBefore: lvl===1,
  children: [T(t, { size: lvl===1?32:24, bold: true, color: lvl===1?'1F3864':'2E74B5' })],
});
const C = (t, o={}) => new TableCell({
  width: { size: o.w || 14, type: WidthType.PERCENTAGE },
  shading: o.head ? { type: ShadingType.CLEAR, color:'auto', fill:'1F3864' } : undefined,
  margins: { top: 50, bottom: 50, left: 60, right: 60 },
  children: [new Paragraph({ children: [T(t, { size: 16, bold: o.head, color: o.head?'FFFFFF':'000000' })] })],
});

const sec = [];
sec.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 200 },
    children: [T('SİNERJİ MEVZUAT — GEBE × TRAVMA İÇTİHAT KATALOĞU', { size: 32, bold: true, color: '1F3864' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
    children: [T('Arama: "gebe" + alternatif "travma" • 871 toplam kayıt', { size: 22, italics: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
    children: [T(`Bu özet: ${sorted.length} mahkeme/kurul kararı (mevzuat hariç) — Tarihe göre yeniden eskiye`, { size: 20, italics: true, color: '595959' })] }),
);

/* Tip dağılım özeti */
sec.push(H('1. Tip Dağılımı', 1));
const byTip = {};
sorted.forEach(r => byTip[r.tipadi] = (byTip[r.tipadi]||0)+1);
Object.entries(byTip).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) =>
  sec.push(new Paragraph({ spacing:{after:60}, children:[T(`• ${k}: `, {bold:true}), T(`${v} karar`)] }))
);

/* Daire dağılımı */
sec.push(H('2. Daire / Bölüm Dağılımı (ilk 20)', 1));
const byDaire = {};
sorted.forEach(r => {
  const k = `${r.tipadi} ${r.dairetamadi || r.dairekisaadi || ''}`.trim();
  byDaire[k] = (byDaire[k]||0)+1;
});
Object.entries(byDaire).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([k,v]) =>
  sec.push(new Paragraph({ spacing:{after:60}, children:[T(`• ${k}: `, {bold:true}), T(`${v} karar`)] }))
);

/* Tip tip listele */
const typeOrder = ['Anayasa','A.İ.H.M.','Yargıtay','Danıştay','Bölge Adliye Mahkemesi','Askeri Yargıtay','A.Y.İ.M.','Bölge İdare Mahkemesi','Sigorta Tahkim Komisyonu ','Kamu Denetçiliği Kurumu'];
typeOrder.forEach(tip => {
  const recs = sorted.filter(r => r.tipadi === tip);
  if (!recs.length) return;
  sec.push(H(`${tip} (${recs.length} karar)`, 1));
  // Tablo başlığı
  const rows = [new TableRow({ children: [
    C('No', {head:true, w:5}), C('Daire', {head:true, w:14}), C('Esas', {head:true, w:10}),
    C('Karar', {head:true, w:10}), C('Tarih', {head:true, w:11}), C('Anahtar', {head:true, w:18}),
    C('Snippet', {head:true, w:32}),
  ]})];
  recs.forEach((r, i) => {
    rows.push(new TableRow({ children: [
      C(String(i+1), {w:5}),
      C(r.dairetamadi || r.dairekisaadi || '', {w:14}),
      C(`${r.esasyil||''}/${r.esasno||''}`, {w:10}),
      C(`${r.kararyil||''}/${r.kararno||''}`, {w:10}),
      C(r.karartarihi || '', {w:11}),
      C((r.metinList||[]).join(', '), {w:18}),
      C(clean(r.metin).slice(0, 280), {w:32}),
    ]}));
  });
  sec.push(new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows }));
});

/* Footer */
sec.push(
  new Paragraph({ spacing:{before:400,after:100}, alignment: AlignmentType.CENTER,
    children:[T('— Hazırlayan: TOMEC Çalışması Veri Altyapısı —', { italics:true, size:18, color:'595959' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER,
    children:[T('Kaynak: Sinerji Mevzuat ve İçtihat (Sinerji Hukuk Yazılımları A.Ş.)', { italics:true, size:18, color:'595959' })] }),
);

const doc = new Document({ creator: 'TOMEC', title: 'Sinerji Gebe x Travma Katalog',
  styles: { default: { document: { run: { font: F } } } },
  sections: [{ properties: { page: { margin: { top:1100, bottom:1100, left:1100, right:1100 } } }, children: sec }] });

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('client/public/Sinerji_Gebe_Travma_871_Katalog.docx', buf);
  console.log('DOCX:', buf.length, 'bytes');
});
