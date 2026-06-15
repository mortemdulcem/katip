/* TOMEC v7 — English DOCX (JFLM submission)
 * Converts scripts/submission_jflm/09_full_translation_EN.md → DOCX
 * Embeds 9 figures (client/public/figures/sekil1..9_*.png) at Figure markers
 * Renders Markdown tables as native DOCX tables
 * Output: client/public/TOMEC_v7_English.docx
 */
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, PageBreak,
  Footer, Header, PageNumber, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType } = require('docx');

const NAVY = '0D2545', WINE = '7A2231', SAND = 'C9A06A', LIGHT = 'EAEEF2', GREY = '9AA5B1';

const FIGS = {
  1: 'sekil1_prisma.png',
  2: 'sekil2_tomec_donut.png',
  3: 'sekil3_esik.png',
  4: 'sekil8_matris.png',
  5: 'sekil4_dagilim.png',
  6: 'sekil5_zincir.png',
  7: 'sekil7_temporal.png',
  8: 'sekil6_karar_agaci.png',
  9: 'sekil9_calisma_kagidi.png',
  10: 'sekil10_multipanel.png',
  11: 'sekil11_heatmaps.png',
  12: 'sekil12_regression.png',
};

// === Inline markdown parser: **bold**, *italic*, `code` ===
function parseInline(text) {
  const runs = [];
  // Tokenise on **...**, *...*, `...`
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index), size: 22 }));
    const tok = m[0];
    if (tok.startsWith('**')) runs.push(new TextRun({ text: tok.slice(2, -2), size: 22, bold: true }));
    else if (tok.startsWith('`')) runs.push(new TextRun({ text: tok.slice(1, -1), size: 22, font: 'Consolas' }));
    else runs.push(new TextRun({ text: tok.slice(1, -1), size: 22, italics: true }));
    last = re.lastIndex;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last), size: 22 }));
  if (runs.length === 0) runs.push(new TextRun({ text: '', size: 22 }));
  return runs;
}

const Body = (text) => new Paragraph({
  children: parseInline(text), spacing: { after: 140, line: 320 },
  alignment: AlignmentType.JUSTIFIED });
const Bul = (text) => new Paragraph({
  children: parseInline(text), bullet: { level: 0 }, spacing: { after: 80, line: 300 } });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 380, after: 180 },
  children: [new TextRun({ text: t, bold: true, size: 30, color: NAVY })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 140 },
  children: [new TextRun({ text: t, bold: true, size: 26, color: NAVY })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120 },
  children: [new TextRun({ text: t, bold: true, size: 22, color: WINE })] });
const Caption = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 240 },
  children: [new TextRun({ text: t, italics: true, size: 18, color: NAVY })] });

function imageBlock(figNum, captionText) {
  const fname = FIGS[figNum];
  if (!fname) return [Body(captionText)];
  const fpath = path.join('client/public/figures', fname);
  if (!fs.existsSync(fpath)) return [Body(captionText)];
  const buf = fs.readFileSync(fpath);
  const w = 520;
  const isMod = require('image-size');
  const sizeOf = isMod.imageSize || isMod.default || isMod;
  let dim;
  try { dim = sizeOf(buf); } catch { dim = { width: 800, height: 600 }; }
  const h = Math.round(w * dim.height / dim.width);
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
      children: [new ImageRun({ data: buf, type: 'png', transformation: { width: w, height: h } })] }),
    Caption(captionText),
  ];
}

// === Markdown table → docx Table ===
const cellPara = (txt, opts={}) => new Paragraph({
  children: parseInline(txt), spacing: { after: 0 },
  alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT });
function buildTable(rows) {
  // rows = array of arrays of strings (header first)
  const ncols = rows[0].length;
  const tableRows = rows.map((r, i) => new TableRow({
    children: r.map(cell => new TableCell({
      width: { size: Math.floor(9000 / ncols), type: WidthType.DXA },
      shading: i === 0 ? { type: ShadingType.SOLID, color: LIGHT } : undefined,
      children: [cellPara(cell, { center: false })],
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
    })),
  }));
  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      left: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      right: { style: BorderStyle.SINGLE, size: 4, color: GREY },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: GREY },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: GREY },
    },
  });
}

// === MAIN: parse MD line by line ===
const md = fs.readFileSync('scripts/submission_jflm/09_full_translation_EN.md', 'utf8');
const lines = md.split(/\r?\n/);
const out = [];
let i = 0;
while (i < lines.length) {
  let line = lines[i];
  const trimmed = line.trim();

  // Skip horizontal rules and blank lines
  if (!trimmed || trimmed === '---') { i++; continue; }

  // Headings
  if (/^#\s+/.test(trimmed)) { out.push(H1(trimmed.replace(/^#\s+/, ''))); i++; continue; }
  if (/^##\s+/.test(trimmed)) { out.push(H2(trimmed.replace(/^##\s+/, ''))); i++; continue; }
  if (/^###\s+/.test(trimmed)) { out.push(H3(trimmed.replace(/^###\s+/, ''))); i++; continue; }

  // Markdown table block (line starts with | and next line is separator)
  if (trimmed.startsWith('|') && i + 1 < lines.length && /^\s*\|[\s\-|:]+\|\s*$/.test(lines[i + 1])) {
    const tblRows = [];
    // header
    tblRows.push(trimmed.split('|').slice(1, -1).map(s => s.trim()));
    i += 2; // skip header + separator
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      tblRows.push(lines[i].trim().split('|').slice(1, -1).map(s => s.trim()));
      i++;
    }
    out.push(buildTable(tblRows));
    out.push(new Paragraph({ children: [new TextRun({ text: '', size: 8 })], spacing: { after: 120 } }));
    continue;
  }

  // Bullet list — embed figure inline when bullet starts with "**Figure N.**"
  if (/^[-*]\s+/.test(trimmed)) {
    const content = trimmed.replace(/^[-*]\s+/, '');
    const figMatch = content.match(/^\*\*Figure\s+(\d+)\.\*\*\s+(.+)$/);
    if (figMatch) {
      const n = parseInt(figMatch[1], 10);
      out.push(Bul(content));
      const blk = imageBlock(n, '');
      if (blk.length > 0) out.push(blk[0]);
    } else {
      out.push(Bul(content));
    }
    i++; continue;
  }

  // Numbered list (e.g., 89 AMA references, Section 8 limitations enumerations)
  if (/^\d+\.\s+/.test(trimmed)) {
    let buf = trimmed;
    i++;
    while (i < lines.length && lines[i].trim() && !/^[#\-\*\|]/.test(lines[i].trim())
           && !/^\d+\.\s+/.test(lines[i].trim()) && lines[i].trim() !== '---') {
      buf += ' ' + lines[i].trim();
      i++;
    }
    out.push(new Paragraph({
      children: parseInline(buf), spacing: { after: 80, line: 300 },
      indent: { left: 360, hanging: 360 },
    }));
    continue;
  }

  // Standalone "**Figure N.** caption" (e.g., Appendix 4.1) — embed once
  const standaloneFig = trimmed.match(/^\*\*Figure\s+(\d+)\.\*\*\s+(.+)$/);
  if (standaloneFig) {
    const n = parseInt(standaloneFig[1], 10);
    const blk = imageBlock(n, `Figure ${n}. ${standaloneFig[2]}`);
    blk.forEach(p => out.push(p));
    i++; continue;
  }

  // Regular paragraph (may span multiple lines until blank)
  let buf = trimmed;
  i++;
  while (i < lines.length && lines[i].trim() && !/^[#\-\*\|]/.test(lines[i].trim())
         && !/^\d+\.\s+/.test(lines[i].trim()) && lines[i].trim() !== '---') {
    buf += ' ' + lines[i].trim();
    i++;
  }
  out.push(Body(buf));
}

// === Cover page (prepend) ===
const cover = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1400, after: 240 },
    children: [new TextRun({ text: 'Development and Retrospective Single-Expert Validation', bold: true, size: 32, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: 'of the TOMEC (Trauma–Obstetric Medico-legal Causality) Score', bold: true, size: 28, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480 },
    children: [new TextRun({ text: 'A Pilot Study on 3,501 Turkish Court Decisions', bold: true, size: 26, color: WINE })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 },
    children: [new TextRun({ text: 'Nurcan Denli Bayır, MD*', bold: true, size: 26, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
    children: [new TextRun({ text: 'Department of Forensic Medicine, Ankara Bilkent City Hospital, Ankara, Türkiye', size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: '* Corresponding author and originator of the TOMEC scoring model.', italics: true, size: 18 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: 'Submission package — JFLM (Journal of Forensic and Legal Medicine)', italics: true, size: 20, color: WINE })] }),
  new Paragraph({ children: [new PageBreak()] }),
];

const allChildren = [...cover, ...out];

const doc = new Document({
  creator: 'Dr. Nurcan Denli Bayır',
  title: 'TOMEC — JFLM English Submission',
  description: 'Trauma–Obstetric Medico-legal Causality (TOMEC) Score — English version with figures and tables preserved',
  sections: [{
    properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'TOMEC — JFLM Submission', italics: true, size: 16, color: NAVY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '— ', size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                 new TextRun({ text: ' / ', size: 18 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
                 new TextRun({ text: ' —', size: 18 })] })] }) },
    children: allChildren,
  }],
});

(async () => {
  const buf = await Packer.toBuffer(doc);
  const outPath = 'client/public/TOMEC_v7_English.docx';
  fs.writeFileSync(outPath, buf);
  console.log('EN DOCX written:', outPath, '|', Math.round(buf.length / 1024), 'KB');
})();
