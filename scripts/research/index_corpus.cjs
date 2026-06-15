#!/usr/bin/env node
// Corpus indexer: extract -> page-tracked chunks -> Postgres (content + FTS).
// No external API. Fully local & reproducible.
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const TEXT_DIR = 'attached_assets/research_corpus/text';
const TARGET = 1400;
const INS_BATCH = 400;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function loadTitles() {
  const map = {};
  try {
    for (const l of fs.readFileSync('scripts/research/titles.tsv', 'utf8').trim().split('\n')) {
      const [nn, , , ti] = l.split('\t');
      if (nn) map[nn] = (ti || '').slice(0, 200);
    }
  } catch {}
  return map;
}

// Page-tracked chunking. page_start/page_end always reference pages that
// actually contributed text (empty pages are skipped, never extend a range,
// and the trailing form-feed phantom page never inflates page_end).
function chunkBook(txt) {
  const pages = txt.split('\f');
  const chunks = [];
  let buf = '', startPage = 0, lastPage = 0, idx = 0;
  const flush = (endPage) => {
    const content = buf.replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
    if (content.length > 30) chunks.push({ idx: idx++, ps: startPage, pe: endPage, content });
    buf = ''; startPage = 0;
  };
  const MAXSPAN = 6; // a chunk may not cite a range wider than this many pages
  for (let p = 0; p < pages.length; p++) {
    const pageNo = p + 1;
    let pageText = pages[p];
    if (!pageText || !pageText.trim()) continue; // skip empty pages
    // sparse-page guard: flush before a chunk's citation span grows too wide
    if (buf !== '' && startPage !== 0 && pageNo - startPage >= MAXSPAN) flush(lastPage);
    if (startPage === 0) startPage = pageNo;
    lastPage = pageNo;
    while (pageText.length > TARGET * 1.6) {
      let cut = pageText.lastIndexOf(' ', TARGET);
      if (cut < TARGET * 0.5) cut = TARGET;
      buf += (buf ? '\n' : '') + pageText.slice(0, cut);
      flush(pageNo); startPage = pageNo;
      pageText = pageText.slice(cut);
    }
    buf += (buf ? '\n' : '') + pageText;
    if (buf.length >= TARGET) flush(pageNo);
  }
  if (buf.trim()) flush(lastPage); // never pages.length
  return chunks;
}

async function main() {
  const titles = loadTitles();
  const files = fs.readdirSync(TEXT_DIR).filter(f => /^\d\d\.txt$/.test(f)).sort();
  for (const f of files) {
    const book = f.replace('.txt', '');
    const done = await pool.query('SELECT done FROM corpus_books WHERE book=$1', [book]);
    if (done.rows[0]?.done) continue;
    const txt = fs.readFileSync(path.join(TEXT_DIR, f), 'utf8');
    const chunks = chunkBook(txt);
    await pool.query(
      `INSERT INTO corpus_books(book,title,n_chunks,done) VALUES($1,$2,$3,false)
       ON CONFLICT(book) DO UPDATE SET title=EXCLUDED.title, n_chunks=EXCLUDED.n_chunks`,
      [book, titles[book] || null, chunks.length]
    );
    for (let i = 0; i < chunks.length; i += INS_BATCH) {
      const batch = chunks.slice(i, i + INS_BATCH);
      const vals = [], params = [];
      batch.forEach((c, j) => {
        const b = j * 6;
        params.push(book, titles[book] || null, c.ps, c.pe, c.idx, c.content);
        vals.push(`($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6})`);
      });
      await pool.query(
        `INSERT INTO corpus_chunks(book,title,page_start,page_end,chunk_idx,content)
         VALUES ${vals.join(',')} ON CONFLICT(book,chunk_idx) DO NOTHING`,
        params
      );
    }
    await pool.query('UPDATE corpus_books SET done=true WHERE book=$1', [book]);
    process.stdout.write(`[${book}] ${chunks.length} chunks\n`);
  }
  const tot = await pool.query('SELECT count(*)::int n FROM corpus_chunks');
  console.log(`TOTAL chunks=${tot.rows[0].n}  books=${files.length}`);
  await pool.end();
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
