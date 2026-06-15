#!/usr/bin/env node
// Query the corpus knowledge base. Returns top passages with book + page citations.
// Usage: node scripts/research/ask.cjs "your question or keywords" [topK]
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const q = process.argv[2];
  const k = parseInt(process.argv[3] || '8', 10);
  if (!q) { console.error('Usage: node ask.cjs "query" [topK]'); process.exit(1); }

  // Build an OR tsquery from significant words for good recall (mixed TR/EN corpus).
  const orQuery = q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .join(' | ');

  const sql = `
    SELECT book, title, page_start, page_end,
           ts_rank(tsv, to_tsquery('simple', $1)) AS rank,
           content
    FROM corpus_chunks
    WHERE tsv @@ to_tsquery('simple', $1)
    ORDER BY rank DESC
    LIMIT $2`;
  const r = orQuery ? await pool.query(sql, [orQuery, k]) : { rows: [] };

  if (r.rows.length === 0) {
    console.log(`Sonuç yok: "${q}"`);
  } else {
    console.log(`\n=== "${q}" için ${r.rows.length} pasaj ===\n`);
    for (const row of r.rows) {
      const pg = row.page_start === row.page_end ? `s.${row.page_start}` : `s.${row.page_start}-${row.page_end}`;
      const snippet = row.content.replace(/\s+/g, ' ').slice(0, 400);
      console.log(`📖 [${row.book}] ${row.title || ''} — ${pg}  (rank ${row.rank.toFixed(4)})`);
      console.log(`   ${snippet}…\n`);
    }
  }
  await pool.end();
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
