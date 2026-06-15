#!/usr/bin/env node
/* Build IEEE 2-column 10pt DOCX from translated_full.txt + figures.json + images.json.
   Raw OOXML assembled with jszip. No content rewritten: only page-furniture noise
   (lone page numbers, repeated English running header, empty lines) is dropped and
   figure markers are replaced by the extracted image(s) + translated caption. */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const OUT = path.join(__dirname, 'book_out');
const MEDIA = path.join(OUT, 'media');
const text = fs.readFileSync(path.join(OUT, 'translated_full.txt'), 'utf8');
const figures = JSON.parse(fs.readFileSync(path.join(OUT, 'figures.json'), 'utf8'));
const images = JSON.parse(fs.readFileSync(path.join(OUT, 'images.json'), 'utf8'));

// ---- figure -> page map (first occurrence) ----
const figPage = {};
for (const f of figures) if (!(f.num in figPage)) figPage[f.num] = f.page;

// ---- document order of figure markers ----
const order = [...text.matchAll(/⟦FIG:([0-9.]+)⟧/g)].map(m => m[1]);

// ---- assign images to figures, grouped per page, doc order vs file order ----
const byPage = {};
for (const num of order) {
  const p = figPage[num];
  (byPage[p] = byPage[p] || []).push(num);
}
const figImgs = {};
const deficits = [];
for (const p of Object.keys(byPage)) {
  const figs = byPage[p];
  const imgs = (images[String(p)] || []).slice();
  figs.forEach(n => (figImgs[n] = []));
  let k = 0;
  for (const img of imgs) {
    const target = figs[Math.min(k, figs.length - 1)]; // extras absorbed by last fig
    figImgs[target].push(img);
    k++;
  }
  const empty = figs.filter(n => figImgs[n].length === 0);
  if (empty.length) deficits.push(`page ${p}: figs ${empty.join(',')} have no image (page had ${imgs.length} imgs / ${figs.length} figs)`);
}

// ---- XML helpers ----
const esc = s => s
  .replace(/[\u00A0\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F]/g, ' ') // normalize exotic spaces
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')                                          // strip invalid XML 1.0 control chars
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const RPR = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="20"/><w:szCs w:val="20"/>';
const PPR_BODY = '<w:spacing w:before="0" w:after="0" w:line="276" w:lineRule="auto"/><w:jc w:val="both"/><w:kern w:val="0"/>';

function run(t, rprExtra = '') {
  return `<w:r><w:rPr>${RPR}${rprExtra}</w:rPr><w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
}
// inline **bold** -> real bold runs (markdown emphasis the model added)
function runsFromText(t) {
  const out = [];
  const re = /\*\*(.+?)\*\*/g;
  let lastI = 0, mm;
  while ((mm = re.exec(t))) {
    if (mm.index > lastI) out.push(run(t.slice(lastI, mm.index)));
    out.push(run(mm[1], '<w:b/>'));
    lastI = re.lastIndex;
  }
  if (lastI < t.length) out.push(run(t.slice(lastI)));
  return out.join('') || run('');
}
function paraBody(t) {
  return `<w:p><w:pPr>${PPR_BODY}</w:pPr>${runsFromText(t)}</w:p>`;
}
function paraHeading(t, sz) {
  t = t.replace(/\*\*/g, '').trim();
  const pPr = `<w:spacing w:before="160" w:after="60" w:line="276" w:lineRule="auto"/><w:jc w:val="both"/><w:keepNext/><w:kern w:val="0"/>`;
  const rPr = `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;
  return `<w:p><w:pPr>${pPr}</w:pPr><w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
}
function paraCaption(t) {
  const pPr = `<w:spacing w:before="40" w:after="120" w:line="240" w:lineRule="auto"/><w:jc w:val="both"/><w:keepLines/><w:kern w:val="0"/>`;
  const rPr = `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:i/><w:sz w:val="18"/><w:szCs w:val="18"/>`;
  return `<w:p><w:pPr>${pPr}</w:pPr><w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
}

// ---- image sizing ----
const EMU_PER_TWIP = 635;
const COL_W_TWIP = 5020;                       // (usable 10466 - 425 gap) / 2
const MAXW = Math.round(COL_W_TWIP * EMU_PER_TWIP * 0.97); // ~3.09M EMU
const MAXH = Math.round(4.0 * 914400);          // 4 inches
let imgUid = 0;
const rels = []; // {id, target}
const usedMedia = new Set();
function paraImage(img) {
  const w = img.w || 1000, h = img.h || 1000;
  const aspect = h / w;
  let we = MAXW, he = Math.round(MAXW * aspect);
  if (he > MAXH) { he = MAXH; we = Math.round(MAXH / aspect); }
  imgUid++;
  const rid = `rIdImg${imgUid}`;
  rels.push({ id: rid, target: `media/${img.file}` });
  usedMedia.add(img.file);
  const did = imgUid;
  const drawing =
    `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${we}" cy="${he}"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${did}" name="Resim ${did}"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${did}" name="${img.file}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${we}" cy="${he}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;
  return `<w:p><w:pPr><w:spacing w:before="60" w:after="20" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:keepNext/></w:pPr><w:r>${drawing}</w:r></w:p>`;
}

// ---- noise filters ----
const RUNNING_HEADER = 'Forensic Pathology of Unexpected and Unexplained Deaths';
let droppedNoise = 0;
function isNoise(line) {
  const t = line.trim();
  if (t === '') return true;
  if (/^\d{1,3}$/.test(t)) return true;                       // lone page number
  if (t === RUNNING_HEADER) return true;                       // repeated running header
  if (/^Taylor\s*&\s*Francis/i.test(t)) return true;           // boilerplate
  if (/^https?:\/\/\S+$/i.test(t) && /taylorandfrancis|crcpress|routledge/i.test(t)) return true;
  return false;
}

// ---- heading detection ----
function classify(line) {
  const t = line.trim();
  // lone subsection number e.g. "3.2.4.2"
  if (/^\d+\.\d+(?:\.\d+)*$/.test(t)) return { kind: 'h', sz: 22, text: t };
  // numbered section heading e.g. "3.2 Title" / "3.2.4 Title"
  let m = t.match(/^(\d+\.\d+(?:\.\d+)*)\s+(\S.{1,80})$/);
  if (m && !/[.;]$/.test(t)) {
    const words = m[2].trim().split(/\s+/).length;
    if (words <= 14) return { kind: 'h', sz: 22, text: t };
  }
  // chapter heading e.g. "6 Sudden Death ..." (num 1-12, Title-case, short, no trailing period)
  m = t.match(/^(\d{1,2})\s+([\p{Lu}].{2,75})$/u);
  if (m && +m[1] >= 1 && +m[1] <= 12 && !/[.;:]$/.test(t)) {
    const words = m[2].trim().split(/\s+/).length;
    if (words >= 2 && words <= 13) return { kind: 'h', sz: 28, text: t };
  }
  return null;
}

// ---- tokenize text vs figure blocks ----
const reFig = /⟦FIG:([0-9.]+)⟧([\s\S]*?)⟦\/FIG⟧/g;
const parts = [];
let last = 0, m;
while ((m = reFig.exec(text))) {
  if (m.index > last) parts.push({ type: 'text', s: text.slice(last, m.index) });
  parts.push({ type: 'fig', num: m[1], cap: m[2].trim() });
  last = reFig.lastIndex;
}
if (last < text.length) parts.push({ type: 'text', s: text.slice(last) });

// ---- assemble body ----
const body = [];
let figRendered = 0, figNoImg = 0, paraCount = 0;
for (const part of parts) {
  if (part.type === 'text') {
    const lines = part.s.split(/\n/);
    for (const line of lines) {
      if (isNoise(line)) { if (line.trim() !== '') droppedNoise++; continue; }
      const t = line.trim();
      // markdown horizontal rule (--- *** ___) -> drop (not in original)
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { droppedNoise++; continue; }
      // markdown ATX heading (#, ##, ### ...) -> real heading, level by # count
      const mdh = t.match(/^(#{1,6})\s+(.+)$/);
      if (mdh) {
        const lvl = mdh[1].length;
        const sz = lvl <= 1 ? 28 : lvl === 2 ? 26 : lvl === 3 ? 22 : 20;
        const htext = mdh[2].replace(/\*\*/g, '').trim();
        if (htext) body.push(paraHeading(htext, sz));
        continue;
      }
      const h = classify(t);
      if (h) { body.push(paraHeading(h.text, h.sz)); }
      else { body.push(paraBody(t)); paraCount++; }
    }
  } else {
    const imgs = figImgs[part.num] || [];
    if (imgs.length === 0) figNoImg++;
    for (const img of imgs) body.push(paraImage(img));
    const capNum = part.num;
    const capText = part.cap.replace(/\s+/g, ' ').trim();
    body.push(paraCaption(`Şekil ${capNum}. ${capText}`));
    figRendered++;
  }
}

// ---- section properties (A4, narrow margins, 2 columns) ----
const sectPr =
  `<w:sectPr>` +
  `<w:pgSz w:w="11906" w:h="16838"/>` +
  `<w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="0" w:footer="0" w:gutter="0"/>` +
  `<w:cols w:num="2" w:space="425" w:equalWidth="1"/>` +
  `<w:docGrid w:linePitch="360"/>` +
  `</w:sectPr>`;

const documentXml =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
  `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
  `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
  `xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ` +
  `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
  `xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
  `<w:body>${body.join('')}${sectPr}</w:body></w:document>`;

// ---- relationships ----
const relItems = rels.map(r =>
  `<Relationship Id="${r.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${r.target}"/>`
).join('');
const documentRels =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relItems}</Relationships>`;

const rootRels =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
  `</Relationships>`;

const contentTypes =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
  `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
  `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
  `<Default Extension="xml" ContentType="application/xml"/>` +
  `<Default Extension="jpg" ContentType="image/jpeg"/>` +
  `<Default Extension="jpeg" ContentType="image/jpeg"/>` +
  `<Default Extension="png" ContentType="image/png"/>` +
  `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
  `</Types>`;

// ---- build zip ----
const zip = new JSZip();
zip.file('[Content_Types].xml', contentTypes);
zip.file('_rels/.rels', rootRels);
zip.file('word/document.xml', documentXml);
zip.file('word/_rels/document.xml.rels', documentRels);
for (const file of usedMedia) {
  zip.file(`word/media/${file}`, fs.readFileSync(path.join(MEDIA, file)));
}

const outFile = path.join(OUT, 'Gupta_Adli_Patoloji_TR_IEEE.docx');
zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  .then(buf => {
    fs.writeFileSync(outFile, buf);
    console.log('=== BUILD DONE ===');
    console.log('output:', outFile, '(' + (buf.length / 1048576).toFixed(2) + ' MB)');
    console.log('paragraphs:', paraCount, '| figures rendered:', figRendered, '| figs w/o image:', figNoImg);
    console.log('images embedded:', usedMedia.size, '| noise lines dropped:', droppedNoise);
    if (deficits.length) {
      console.log('--- image deficits (' + deficits.length + ' pages) ---');
      deficits.slice(0, 40).forEach(d => console.log('  ' + d));
    }
  })
  .catch(e => { console.error(e); process.exit(1); });
