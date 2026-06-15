/* Full text katalog: 783 başarılı kararı tek JSON'a topla,
 * TOMEC anahtar kelimelerine göre relevans skoru üret,
 * CSV (tam metin dahil) + DOCX özet (top relevans).
 */
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType } = require('docx');

const FULL_DIR = path.join(__dirname, 'sinerji_dump', 'full');
const META = require('./sinerji_dump/all_results.json');

function clean(s) { return (s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim(); }

// 1) Load full
const full = [];
let missing = 0;
META.forEach(m => {
  const f = path.join(FULL_DIR, m.id.replace(/[\/+=]/g, '_') + '.json');
  if (fs.existsSync(f) && fs.statSync(f).size > 100) {
    try {
      const j = JSON.parse(fs.readFileSync(f, 'utf-8'));
      const d = j.data || {};
      full.push({
        ...m,
        full_metin: clean(d.metin || ''),
        full_konu: clean(d.konu || ''),
      });
    } catch(e) { missing++; }
  } else missing++;
});
console.log(`Loaded ${full.length} full records, ${missing} missing/error`);

// 2) TOMEC Relevans skoru
const TOMEC_KW = {
  // Critical
  'gebe': 5, 'gebelik': 5, 'gebeliğ': 5, 'hamile': 4, 'hamileli': 4,
  'düşük': 3, 'cenin': 5, 'fetus': 5, 'fötus': 4, 'erken doğum': 5,
  'plasenta': 4, 'abrupti': 5, 'amniyon': 4, 'rüptür': 4,
  // Trauma
  'travma': 4, 'darp': 3, 'künt travma': 5, 'trafik kazası': 3,
  'düşme': 2, 'tekme': 3, 'darbe': 3, 'yaralama': 2,
  // Causality / Law
  'illiyet': 6, 'nedensellik': 5, 'sebep-sonuç': 4, 'sebep sonuç': 4,
  'ağırlaştırılmış': 4, 'TCK 87': 6, 'TCK 88': 6, 'tck 87': 6, 'tck 88': 6,
  '87/1-e': 7, '87/1.e': 7, '87/1.maddesi': 5, '88. madde': 5,
  'nitelikli yaralama': 5, 'kasten yaralama': 4,
  'mahkum': 1, 'beraat': 1,
  // Forensic medicine
  'adli rapor': 3, 'adli tıp': 3, 'ATK': 2, 'otopsi': 2,
  'ruh sağlığı': 2, 'ttb': 1,
  // Specific obstetric outcomes
  'fetal ölüm': 6, 'intrauterin': 5, 'iud': 4,
  'preterm': 5, 'preeklampsi': 4, 'eklampsi': 4,
  'plasenta dekolmanı': 7, 'dekolman': 5, 'kanama': 2,
};

function score(text) {
  const t = text.toLowerCase();
  let s = 0; const hits = [];
  for (const [kw, w] of Object.entries(TOMEC_KW)) {
    const re = new RegExp(kw.toLowerCase(), 'g');
    const matches = t.match(re);
    if (matches) { s += w * matches.length; hits.push(`${kw}(${matches.length})`); }
  }
  return { score: s, hits };
}

full.forEach(r => {
  const sc = score((r.full_metin || '') + ' ' + (r.full_konu || ''));
  r.tomec_score = sc.score;
  r.tomec_hits = sc.hits;
});

const sorted = [...full].sort((a, b) => b.tomec_score - a.tomec_score);
console.log(`Top 5 scores: ${sorted.slice(0,5).map(r=>r.tomec_score).join(', ')}`);
console.log(`Records score>20: ${sorted.filter(r=>r.tomec_score>20).length}`);
console.log(`Records score>50: ${sorted.filter(r=>r.tomec_score>50).length}`);

// 3) Save merged JSON
fs.writeFileSync(path.join(__dirname, 'sinerji_dump', 'merged_full_with_score.json'),
  JSON.stringify(full, null, 2));
console.log('Merged JSON saved.');

// 4) CSV — tüm 783 + tam metin
function tr(s) { return (s || '').toString().replace(/"/g, '""'); }
const headers = ['Rank','Skor','Tip','Daire','Esas','Karar','Tarih','İsabet','URL','Tam Metin'];
const lines = [headers.map(s=>`"${s}"`).join(',')];
sorted.forEach((r, i) => {
  const url = `https://mevzuat.sinerjias.com.tr/ictihat/yuksek-mahkeme/yargitay%20karari/${r.id}?s=gebe&alternatif=travma`;
  const row = [
    i+1, r.tomec_score, r.tipadi, r.dairetamadi || r.dairekisaadi || '',
    `${r.esasyil||''}/${r.esasno||''}`, `${r.kararyil||''}/${r.kararno||''}`,
    r.karartarihi || '', r.tomec_hits.slice(0,8).join(' '),
    url, r.full_metin.slice(0, 8000),
  ];
  lines.push(row.map(c => `"${tr(c)}"`).join(','));
});
fs.writeFileSync(path.join(__dirname, '..', 'client', 'public', 'TOMEC_783_Karar_TamMetin_Skorlu.csv'),
  '\ufeff' + lines.join('\n'));
console.log('CSV:', lines.length-1, 'rows,', fs.statSync(path.join(__dirname, '..', 'client', 'public', 'TOMEC_783_Karar_TamMetin_Skorlu.csv')).size, 'bytes');

// 5) DOCX — Top 60 kararın TAMAMI (tam metin) + alt 723 özet tablo
const F = 'Calibri';
const T = (t, o={}) => new TextRun({ text: t, font: F, size: o.size||20, bold: o.bold, italics: o.italics, color: o.color, break: o.break });
const P = (children, o={}) => new Paragraph({ spacing: { after: o.after||80, line: 280 },
  alignment: o.align || AlignmentType.JUSTIFIED,
  children: Array.isArray(children) ? children : [T(children, o)] });
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
  children: Array.isArray(t) ? t : [new Paragraph({ children: [T(t, { size: 16, bold: o.head, color: o.head?'FFFFFF':'000000' })] })],
});

const TOP_N = 60;
const top = sorted.slice(0, TOP_N);
const rest = sorted.slice(TOP_N);

const sec = [];
sec.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 200 },
    children: [T('TOMEC GERÇEK İÇTİHAT TABANI', { size: 36, bold: true, color: '1F3864' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
    children: [T('Sinerji Mevzuat — "gebe" × "travma" — 783 karar tam metin + skorlu', { size: 22, italics: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [T(`Top ${TOP_N} kararın TAM METNİ aşağıda. Kalan ${rest.length} karar özet tabloda.`, { size: 20, italics: true, color: '595959' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
    children: [T('Skorlama: gebelik (5p), illiyet (6p), TCK 87/88 (6-7p), travma (4p), künt travma (5p), plasenta dekolmanı (7p) vs.', { size: 18, italics: true, color: '595959' })] }),
);

// Top N tam metin
sec.push(H(`BÖLÜM I — Top ${TOP_N} En İlgili Karar (Tam Metin)`, 1));
top.forEach((r, i) => {
  sec.push(new Paragraph({ spacing: { before: 240, after: 80 }, pageBreakBefore: i > 0,
    children: [
      T(`${i+1}. ${r.tipadi} — ${r.dairetamadi || r.dairekisaadi || ''}`, { size: 24, bold: true, color: '1F3864' }),
    ]}));
  sec.push(new Paragraph({ spacing: { after: 60 }, children: [
    T(`Esas: `, {bold:true, size:18}), T(`${r.esasyil||''}/${r.esasno||''}   `, {size:18}),
    T(`Karar: `, {bold:true, size:18}), T(`${r.kararyil||''}/${r.kararno||''}   `, {size:18}),
    T(`Tarih: `, {bold:true, size:18}), T(`${r.karartarihi || ''}`, {size:18}),
  ]}));
  sec.push(new Paragraph({ spacing: { after: 60 }, children: [
    T(`Skor: `, {bold:true, size:18, color:'C00000'}), T(`${r.tomec_score}`, {size:18, bold:true, color:'C00000'}),
    T(`   |   İsabet: `, {bold:true, size:18}), T(`${r.tomec_hits.slice(0,12).join(', ')}`, {size:16, italics:true, color:'595959'}),
  ]}));
  if (r.full_konu) sec.push(new Paragraph({ spacing: {after:80}, children: [T('KONU: ', {bold:true, size:18}), T(r.full_konu, {size:18, italics:true})]}));
  // Tam metni paragraflara böl (her \n yeni paragraf, max 4000 char per para)
  const txt = r.full_metin.slice(0, 25000); // safeguard 25k char/karar
  const paras = txt.split(/\n+/).filter(p=>p.trim());
  paras.forEach(p => sec.push(new Paragraph({ spacing: { after: 80, line: 280 }, alignment: AlignmentType.JUSTIFIED, children: [T(p, { size: 18 })] })));
  if (r.full_metin.length > 25000) sec.push(new Paragraph({ children:[T(`[... ${r.full_metin.length - 25000} karakter daha — CSV'de tam metin var ...]`, {italics:true, size:16, color:'808080'})]}));
});

// Kalan kararlar özet tablo
sec.push(H(`BÖLÜM II — Kalan ${rest.length} Karar (Özet Tablo)`, 1));
const rows = [new TableRow({ children: [
  C('No', {head:true, w:4}), C('Skor', {head:true, w:5}), C('Tip', {head:true, w:10}),
  C('Daire', {head:true, w:14}), C('Esas/Karar', {head:true, w:13}), C('Tarih', {head:true, w:10}),
  C('İsabet', {head:true, w:18}), C('Snippet', {head:true, w:26}),
]})];
rest.forEach((r, i) => {
  rows.push(new TableRow({ children: [
    C(String(TOP_N+i+1), {w:4}), C(String(r.tomec_score), {w:5}),
    C(r.tipadi, {w:10}),
    C(r.dairetamadi || r.dairekisaadi || '', {w:14}),
    C(`${r.esasyil||''}/${r.esasno||''} • ${r.kararyil||''}/${r.kararno||''}`, {w:13}),
    C(r.karartarihi || '', {w:10}),
    C(r.tomec_hits.slice(0,5).join(' '), {w:18}),
    C(r.full_metin.slice(0, 200), {w:26}),
  ]}));
});
sec.push(new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows }));

const doc = new Document({ creator: 'TOMEC', title: 'TOMEC 783 Karar Tam Metin',
  styles: { default: { document: { run: { font: F } } } },
  sections: [{ properties: { page: { margin: { top:1100, bottom:1100, left:1100, right:1100 } } }, children: sec }] });

Packer.toBuffer(doc).then(buf => {
  const out = path.join(__dirname, '..', 'client', 'public', 'TOMEC_783_Karar_TamMetin_Top60.docx');
  fs.writeFileSync(out, buf);
  console.log('DOCX:', buf.length, 'bytes →', out);
});
