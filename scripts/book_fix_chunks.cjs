#!/usr/bin/env node
/*
 * book_fix_chunks.cjs — Repair specific chunks whose figure markers were lost
 * during bulk translation. Splits the chunk on figure blocks and translates
 * each segment (body text and each caption) separately, guaranteeing that every
 * ⟦FIG:X.Y⟧ marker is preserved 1:1. Overwrites the cached chunk file.
 *
 * Usage: node scripts/book_fix_chunks.cjs 80 83 92 174 210
 */
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai').default || require('openai');

const OUT = 'scripts/book_out';
const CACHE = path.join(OUT, 'tr_cache');
const TARGET_WORDS = 700;
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function buildChunks() {
  const src = fs.readFileSync(path.join(OUT, 'source_marked.txt'), 'utf8');
  const paras = src.split(/\n\s*\n/);
  const chunks = []; let cur = [], cw = 0;
  for (const p of paras) {
    const w = p.split(/\s+/).filter(Boolean).length;
    if (cw > 0 && cw + w > TARGET_WORDS) { chunks.push(cur.join('\n\n')); cur = []; cw = 0; }
    cur.push(p); cw += w;
  }
  if (cur.length) chunks.push(cur.join('\n\n'));
  return chunks;
}

const SYS_BODY = `Sen adli tıp uzmanı bir çevirmensin. Verilen İngilizce metni EKSİKSİZ, BİREBİR akademik tıbbi Türkçeye çevir. Hiçbir şeyi atlama/özetleme/ekleme. Sayıları, atıfları (yazar/dergi/yıl/sayfa) ve bölüm numaralarını aynen koru. Türkçe karakterleri doğru kullan. Sadece çeviriyi döndür.`;
const SYS_CAP = `Sen adli tıp uzmanı bir çevirmensin. Verilen şekil (figür) açıklamasını EKSİKSİZ, BİREBİR akademik tıbbi Türkçeye çevir. Hiçbir şeyi atlama/ekleme. Sayıları, A/B/C panel harflerini, ok renklerini ve terimleri koru. Sadece çevrilmiş açıklamayı döndür, başka hiçbir şey ekleme.`;

async function tr(sys, text) {
  if (!text.trim()) return text;
  const r = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'system', content: sys }, { role: 'user', content: text }],
    max_tokens: 4000,
  });
  return (r.choices[0]?.message?.content || '').trim();
}

async function fixChunk(chunk) {
  const parts = chunk.split(/(⟦FIG:[0-9.]+⟧[\s\S]*?⟦\/FIG⟧)/);
  const out = [];
  for (const part of parts) {
    const m = part.match(/^⟦FIG:([0-9.]+)⟧([\s\S]*?)⟦\/FIG⟧$/);
    if (m) {
      const cap = await tr(SYS_CAP, m[2].trim());
      out.push(`⟦FIG:${m[1]}⟧${cap}⟦/FIG⟧`);
    } else if (part.trim()) {
      out.push(await tr(SYS_BODY, part));
    } else {
      out.push(part);
    }
  }
  return out.join('');
}

(async () => {
  const idxs = process.argv.slice(2).map(Number);
  const chunks = buildChunks();
  const M = s => (s.match(/⟦FIG:[0-9.]+⟧/g) || []).sort().join(',');
  for (const i of idxs) {
    const inp = chunks[i];
    const fixed = await fixChunk(inp);
    const ok = M(fixed) === M(inp);
    fs.writeFileSync(path.join(CACHE, `chunk_${String(i).padStart(4, '0')}.txt`), fixed);
    console.log(`chunk ${i}: markers ${ok ? 'OK' : 'STILL MISMATCH'} (${(inp.match(/⟦FIG:/g) || []).length} figs)`);
  }
  console.log('FIX DONE');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
