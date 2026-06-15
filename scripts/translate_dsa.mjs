// Designing Software Architectures -> Türkçe akademik çeviri pipeline
// Kaynak: attached_assets/DSA_plain.txt (pdftotext düz çıktı)
// Çıktı: scripts/dsa_cache/chunk_NNN.md (cache) -> birleştirme ayrı adımda
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SRC = "attached_assets/DSA_plain.txt";
const CACHE = "scripts/dsa_cache";
const START_LINE = 409;   // Preface (1-indexed)
const END_LINE = 15559;   // before Index
const MAX_CHARS = 7000;   // hedef parça boyutu (giriş)
const CONCURRENCY = 4;

fs.mkdirSync(CACHE, { recursive: true });

const allLines = fs.readFileSync(SRC, "utf8").split("\n");
const body = allLines.slice(START_LINE - 1, END_LINE).join("\n");

// paragrafları boş satırlarla ayır, sonra MAX_CHARS'a göre grupla
const paras = body.split(/\n\s*\n/).map((p) => p.replace(/[ \t]+\n/g, "\n").trim()).filter(Boolean);
const chunks = [];
let cur = "";
for (const p of paras) {
  if ((cur + "\n\n" + p).length > MAX_CHARS && cur) {
    chunks.push(cur);
    cur = p;
  } else {
    cur = cur ? cur + "\n\n" + p : p;
  }
}
if (cur) chunks.push(cur);

console.log(`Toplam parça: ${chunks.length}`);
fs.writeFileSync(path.join(CACHE, "_count.txt"), String(chunks.length));

const SYSTEM = `Sen yazılım mühendisliği ve yazılım mimarisi alanında uzman, akademik bir Türkçe çevirmensin. "Designing Software Architectures: A Practical Approach" (Cervantes & Kazman, Addison-Wesley, 2016) kitabını İngilizceden Türkçeye çeviriyorsun.

GÖREV — her parçayı aşağıdaki kurallara göre Türkçeye çevir ve SADECE Markdown çıktı ver:

1) TERMİNOLOJİ: Yazılım mühendisliği terimlerini doğru karşıla. Türkçe karşılığı yerleşik değilse veya anlamı kayboluyorsa, Türkçe karşılığın yanına parantez içinde İngilizce orijinalini yaz. Örn: "nitelik temelli tasarım (Attribute-Driven Design, ADD)", "kalite niteliği (quality attribute)", "taktik (tactic)", "dağıtım deseni (deployment pattern)", "mimari sürücü (architectural driver)", "paydaş (stakeholder)". Kısaltmalar (ADD, ASR, QAS, ACDM, RUP) ilk geçtiğinde açıldıktan sonra korunur.
2) ANLAM DÜZELTME: PDF'ten gelen satır kırılmaları, sayfa numaraları, üstbilgi/altbilgi (örn. "Chapter 1—Introduction", tek başına sayılar), "www.EBooksWorld.ir" gibi filigranlar METİN DEĞİLDİR — bunları at, paragrafları doğru şekilde birleştir. Bir cümle çeviride anlamsız olacaksa anlamı koruyarak akıcı ve doğru Türkçeye çevir (uydurma EKLEME yok, sadece düzgün ifade).
3) YAPI: Başlıkları Markdown başlığı yap. Bölüm başlıkları (örn. "CHAPTER 2 Architectural Design") => "# 2. Mimari Tasarım". Numaralı alt başlıklar (örn. "2.4 Architectural Drivers") => "## 2.4 Mimari Sürücüler", "2.4.1 ..." => "### ...". Listeleri Markdown listesi yap. Kod/sözde-kod varsa üç backtick ile kod bloğu yap. Tablo varsa Markdown tablosu yap.
4) ÇEVİRMEN YORUMU: Yalnızca okumayı kolaylaştıracak, kavramı netleştirecek yerlerde KISA çevirmen notu ekle. Biçim: "> **💬 Çevirmen notu:** ...". Aşırıya kaçma; her parçada en fazla 1-2 not, gereksizse hiç ekleme. Kendi yorumun yazarın metniyle KARIŞMASIN (her zaman blockquote içinde).
5) REFERANS: Metinde atıf yapılan kaynak/yazar/yöntem varsa koru. Gerçekten yardımcı olacaksa kısa bir açıklayıcı referans notu blockquote içinde verilebilir; UYDURMA kaynak/DOI/sayfa verme.
6) SADAKAT: İçeriği özetleme, atlama, kısaltma yok — tam çeviri. Yazarın anlamı birebir korunur. Sayılar, isimler, şekil/tablo numaraları aynen korunur (örn. "Şekil 2.1", "Tablo 4.3").
7) ÇIKTI: Sadece Türkçe Markdown döndür. Açıklama, önsöz, "İşte çeviri" gibi ekleme yapma. İngilizce orijinal metni tekrar yazma.`;

async function translateChunk(idx, text) {
  const outPath = path.join(CACHE, `chunk_${String(idx).padStart(3, "0")}.md`);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
    return { idx, cached: true };
  }
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const resp = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Parça ${idx + 1}/${chunks.length}. Aşağıdaki metni yukarıdaki kurallara göre Türkçeye çevir:\n\n${text}` },
        ],
      });
      const out = resp.choices[0]?.message?.content?.trim() || "";
      if (!out) throw new Error("empty response");
      fs.writeFileSync(outPath, out + "\n");
      return { idx, ok: true, len: out.length };
    } catch (e) {
      console.error(`  ! parça ${idx} deneme ${attempt} hata: ${e.message}`);
      if (attempt === 4) return { idx, error: e.message };
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
}

async function run() {
  const queue = chunks.map((t, i) => [i, t]);
  let done = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const [i, t] = queue.shift();
      const r = await translateChunk(i, t);
      done++;
      const tag = r.cached ? "cache" : r.ok ? `ok ${r.len}` : `ERR ${r.error}`;
      console.log(`[${done}/${chunks.length}] parça ${i} -> ${tag}`);
    }
  });
  await Promise.all(workers);
  console.log("BİTTİ");
}

run().catch((e) => { console.error("FATAL", e); process.exit(1); });
