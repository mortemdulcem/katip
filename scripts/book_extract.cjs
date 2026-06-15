#!/usr/bin/env node
/*
 * book_extract.cjs — Extract per-page text, figure caption blocks, and embedded
 * images from the source PDF for the book-translation pipeline.
 *
 * Reproducible: deterministic. Inputs are the committed PDF; outputs land in
 * scripts/book_out/. No network, no randomness.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PDF = process.argv[2] || 'attached_assets/gdrive/cevrilecek_kitap_321s.pdf';
const OUT = 'scripts/book_out';
const MEDIA = path.join(OUT, 'media');
fs.mkdirSync(MEDIA, { recursive: true });

if (!fs.existsSync(PDF)) { console.error('PDF not found:', PDF); process.exit(1); }

// --- 1. Per-page text via pdftotext (form-feed delimited) -------------------
const txtPath = path.join(OUT, 'raw_text.txt');
execSync(`pdftotext "${PDF}" "${txtPath}"`, { stdio: 'inherit' });
const raw = fs.readFileSync(txtPath, 'utf8');
const pages = raw.split('\f'); // index 0 => page 1
console.log('pages:', pages.length);

// --- 2. Figure caption detection + sentinel-marked source -------------------
const figRe = /^Figure\s+(\d+\.\d+)\b\s*(.*)$/;
const figures = []; // {num, page, captionEn}
const seenFig = new Set();
const markedPages = [];

for (let p = 0; p < pages.length; p++) {
  const pageNo = p + 1;
  const lines = pages[p].split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(figRe);
    if (m) {
      const num = m[1];
      // collect caption: this line's remainder + following non-empty lines
      let cap = m[2] ? m[2].trim() : '';
      let j = i + 1;
      let words = cap.split(/\s+/).filter(Boolean).length;
      while (j < lines.length) {
        const nxt = lines[j];
        if (nxt.trim() === '') break;            // paragraph break ends caption
        if (figRe.test(nxt)) break;              // next figure begins
        cap += (cap ? ' ' : '') + nxt.trim();
        words = cap.split(/\s+/).filter(Boolean).length;
        j++;
        if (words >= 60) break;                  // safety cap
      }
      i = j - 1;
      if (!seenFig.has(num)) { seenFig.add(num); figures.push({ num, page: pageNo, captionEn: cap }); }
      else { figures.push({ num, page: pageNo, captionEn: cap, dup: true }); }
      out.push(`\u27e6FIG:${num}\u27e7${cap}\u27e6/FIG\u27e7`);
    } else {
      out.push(lines[i]);
    }
  }
  markedPages.push(out.join('\n'));
}

const source = markedPages.join('\n');
fs.writeFileSync(path.join(OUT, 'source_marked.txt'), source);
fs.writeFileSync(path.join(OUT, 'figures.json'), JSON.stringify(figures, null, 2));
console.log('figure markers:', figures.length, '(unique', seenFig.size + ')');

// --- 3. Extract embedded images, filter tiny/decorative, map page -> files ---
const imgRoot = path.join(MEDIA, 'img');
const already = fs.readdirSync(MEDIA).filter(f => f.startsWith('img-'));
if (already.length === 0 || process.env.FORCE_EXTRACT) {
  for (const f of fs.readdirSync(MEDIA)) fs.unlinkSync(path.join(MEDIA, f));
  console.log('extracting images via pdfimages...');
  execSync(`pdfimages -all -p "${PDF}" "${imgRoot}"`, { stdio: 'inherit' });
} else {
  console.log('reusing', already.length, 'already-extracted images (set FORCE_EXTRACT=1 to redo)');
}

// One pdfimages -list pass: dims keyed by global image num (matches filename).
const listOut = execSync(`pdfimages -list "${PDF}"`, { encoding: 'utf8' });
const dimByNum = {};      // num -> {page,w,h,obj}
const objCount = {};      // object id -> how many pages it appears on (dedup)
for (const line of listOut.split('\n')) {
  const c = line.trim().split(/\s+/);
  if (c.length < 12 || !/^\d+$/.test(c[0])) continue;
  const page = parseInt(c[0], 10), num = parseInt(c[1], 10);
  const w = parseInt(c[3], 10), h = parseInt(c[4], 10), obj = c[10];
  dimByNum[num] = { page, w, h, obj };
  objCount[obj] = (objCount[obj] || 0) + 1;
}

const imagesByPage = {};
let kept = 0, dropTiny = 0, dropRepeat = 0;
const files = fs.readdirSync(MEDIA).filter(f => f.startsWith('img-')).sort();
for (const f of files) {
  const m = f.match(/^img-(\d+)-(\d+)\.(\w+)$/);
  if (!m) continue;
  const pageNo = parseInt(m[1], 10);
  const num = parseInt(m[2], 10);
  const fp = path.join(MEDIA, f);
  const d = dimByNum[num] || { w: 999, h: 999, obj: 'x' };
  if (d.w < 90 || d.h < 90) { fs.unlinkSync(fp); dropTiny++; continue; }
  // decorative element repeated on >2 pages (chapter banners, rules, logos)
  if (objCount[d.obj] > 2) { fs.unlinkSync(fp); dropRepeat++; continue; }
  let outName = f;
  if (!/\.(jpg|jpeg|png)$/i.test(f)) {
    outName = f.replace(/\.\w+$/, '.png');
    execSync(`magick "${fp}" "${path.join(MEDIA, outName)}"`);
    fs.unlinkSync(fp);
  }
  (imagesByPage[pageNo] = imagesByPage[pageNo] || []).push({ file: outName, w: d.w, h: d.h });
  kept++;
}
const dropped = dropTiny + dropRepeat;
console.log('dropped tiny:', dropTiny, 'dropped repeated-decorative:', dropRepeat);
fs.writeFileSync(path.join(OUT, 'images.json'), JSON.stringify(imagesByPage, null, 2));
console.log('images kept:', kept, 'dropped(tiny):', dropped, 'pages with images:', Object.keys(imagesByPage).length);
console.log('DONE extract');
