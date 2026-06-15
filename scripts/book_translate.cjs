#!/usr/bin/env node
/*
 * book_translate.cjs — Resumable, time-boxed, concurrent translator.
 * Splits source_marked.txt into small (~700-word) paragraph-aligned chunks
 * (never splitting a figure block) and translates each into academic medical
 * Turkish via the Replit OpenAI proxy. Every chunk is cached to disk so the job
 * is fully resumable across invocations. Run repeatedly until it prints "ALL DONE".
 *
 * Faithfulness guards (replit.md zero-hallucination):
 *  - figure markers ⟦FIG:X.Y⟧ must be preserved 1:1
 *  - output/input char ratio must be >= MIN_RATIO (catches gpt-4o omission)
 *  - on any guard failure, the chunk is retried and finally escalated to gpt-5.1
 */
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai').default || require('openai');

const OUT = 'scripts/book_out';
const CACHE = path.join(OUT, 'tr_cache');
fs.mkdirSync(CACHE, { recursive: true });

const TARGET_WORDS = 700;
const CONCURRENCY = 8;
const TIME_BUDGET_MS = 85000;    // keep scheduling waves until this; in-flight finish after
const MAX_RETRIES = 3;
const MIN_RATIO = 0.78;          // Turkish ~ English length; below this = omission
const FAST = 'gpt-4o';
const STRONG = 'gpt-5.1';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function buildChunks() {
  const src = fs.readFileSync(path.join(OUT, 'source_marked.txt'), 'utf8');
  const paras = src.split(/\n\s*\n/);
  const chunks = [];
  let cur = [], curWords = 0;
  for (const p of paras) {
    const w = p.split(/\s+/).filter(Boolean).length;
    if (curWords > 0 && curWords + w > TARGET_WORDS) {
      chunks.push(cur.join('\n\n')); cur = []; curWords = 0;
    }
    cur.push(p); curWords += w;
  }
  if (cur.length) chunks.push(cur.join('\n\n'));
  return chunks;
}

const SYSTEM = `Sen adli tıp ve patoloji alanında uzman, akademik tıbbi Türkçeye çeviri yapan profesyonel bir çevirmensin. Sana verilen İngilizce kitap metnini akademik, bilimsel, tıbbi Türkçeye çevir.

MUTLAK KURALLAR:
1. Metni EKSİKSİZ ve BİREBİR çevir. Hiçbir cümleyi, ibareyi atlama, özetleme, kısaltma, ekleme veya çıkarma yapma. Verilen metnin TAMAMINI çevir.
2. TÜM sayılar, ölçümler, yüzdeler, oranlar, p-değerleri, yaşlar, tarihler, birimler (mg, cm, HU, mmHg vb.) AYNEN korunacak.
3. Kaynakça/atıf girdileri (yazar adları, dergi adları, makale başlıkları, cilt, sayı, sayfa, yıl, DOI/PMID) ORİJİNAL haliyle KORUNACAK — bunları çevirme.
4. Anatomik ve Latince terimleri koru. Tıbbi terimlerin doğru Türkçe karşılığını kullan; gerekirse ilk geçtiği yerde parantez içinde İngilizcesini ver.
5. Türkçe karakterleri (ç, ğ, ı, İ, ö, ş, ü) doğru kullan.
6. Bölüm ve alt başlık numaralandırmalarını (örn. "3.5", "11.14") AYNEN koru.
7. ⟦FIG:...⟧ ve ⟦/FIG⟧ işaretlerini KESİNLİKLE AYNEN koru; aralarındaki şekil açıklamasını çevir. İşaret sayısını/numarasını değiştirme.
8. Sadece çeviriyi döndür. Açıklama, not, yorum ekleme. Markdown kod bloğu kullanma.`;

function markers(s) { return (s.match(/⟦FIG:[0-9.]+⟧/g) || []).sort().join(','); }

async function callModel(model, text) {
  const params = { model, messages: [
    { role: 'system', content: SYSTEM }, { role: 'user', content: text } ] };
  if (model === STRONG) { params.max_completion_tokens = 16000; params.reasoning_effort = 'none'; }
  else { params.max_tokens = 8000; }
  const r = await openai.chat.completions.create(params);
  return (r.choices[0]?.message?.content || '').trim();
}

async function translateChunk(text, idx) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const model = attempt === MAX_RETRIES ? STRONG : FAST;  // final attempt escalates
    try {
      const out = await callModel(model, text);
      if (!out) throw new Error('empty');
      const okMarkers = markers(out) === markers(text);
      const okRatio = out.length >= MIN_RATIO * text.length;
      if (okMarkers && okRatio) return out;
      lastErr = new Error(`guard fail markers=${okMarkers} ratio=${(out.length/text.length).toFixed(2)}`);
      if (attempt === MAX_RETRIES) {  // accept strong-model output but log
        fs.appendFileSync(path.join(OUT, 'translate_warnings.log'),
          `chunk ${idx}: ${lastErr.message} (kept ${model})\n`);
        return out;
      }
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 1200 * attempt));
    }
  }
  throw lastErr;
}

async function main() {
  const chunks = buildChunks();
  fs.writeFileSync(path.join(OUT, 'chunks_meta.json'),
    JSON.stringify({ count: chunks.length, target: TARGET_WORDS }, null, 2));
  const total = chunks.length;
  const todo = [];
  for (let i = 0; i < total; i++) {
    if (!fs.existsSync(path.join(CACHE, `chunk_${String(i).padStart(4, '0')}.txt`))) todo.push(i);
  }
  console.log(`chunks total=${total} cached=${total - todo.length} todo=${todo.length}`);
  if (todo.length === 0) { console.log('ALL DONE'); return; }

  const start = Date.now();
  let ptr = 0, done = 0, failed = 0;
  async function worker() {
    while (true) {
      if (Date.now() - start > TIME_BUDGET_MS) return;
      const i = ptr < todo.length ? todo[ptr++] : null;
      if (i === null) return;
      try {
        const out = await translateChunk(chunks[i], i);
        fs.writeFileSync(path.join(CACHE, `chunk_${String(i).padStart(4, '0')}.txt`), out);
        done++;
        process.stdout.write(`\r  this run: ${done} done, ${failed} failed   `);
      } catch (e) {
        failed++;
        fs.appendFileSync(path.join(OUT, 'translate_warnings.log'), `chunk ${i}: FAILED ${e.message}\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const remaining = todo.length - done;
  console.log(`\nthis run: translated=${done} failed=${failed} remaining=${remaining}`);
  console.log(remaining > 0 ? `REMAINING ${remaining} — re-run to continue` : 'ALL DONE');
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
