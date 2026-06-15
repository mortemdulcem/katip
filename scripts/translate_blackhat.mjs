// Black Hat Go (No Starch, 2020) -> Türkçe sadık çeviri
// Kaynak: /tmp/blackhot.txt | Cache: scripts/blackhat/cache | Birleştirme: assemble (python)
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SRC = "/tmp/blackhot.txt";
const CACHE = "scripts/blackhat/cache";
const MAX_CHARS = 7000;
const CONCURRENCY = 8;
const START = 524; // 0-indexed: INTRODUCTION gövdesinden başla
const END = 16864; // INDEX öncesi
fs.mkdirSync(CACHE, { recursive: true });

const allLines = fs.readFileSync(SRC, "utf8").split("\n");
const body = allLines.slice(START, END).join("\n");

function chunkText(text) {
  const paras = text.split(/\n\s*\n/).map((p) => p.replace(/[ \t]+\n/g, "\n").trimEnd()).filter((p) => p.trim());
  const out = [];
  let cur = "";
  for (const p of paras) {
    if ((cur + "\n\n" + p).length > MAX_CHARS && cur) { out.push(cur); cur = p; }
    else cur = cur ? cur + "\n\n" + p : p;
  }
  if (cur) out.push(cur);
  return out;
}

const SYSTEM = `Sen, yazılım güvenliği ve Go (Golang) programlama dilinde uzman, akademik düzeyde bir Türkçe çevirmen-editörsün. "Black Hat Go: Go Programming for Hackers and Pentesters" (Tom Steele, Chris Patten, Dan Kottmann; No Starch Press, 2020) kitabını İngilizceden Türkçeye çeviriyorsun. Hedef okur: sızma testi uzmanları, güvenlik araştırmacıları ve Go geliştiricileri.

KURALLAR — sana verilen parçayı çevir ve SADECE Türkçe Markdown döndür:

1) KOD MUTLAK KORUNUR: Tüm kod listeleri, komutlar, terminal çıktıları, fonksiyon/değişken/paket adları, dosya yolları, URL'ler, import yolları, ortam değişkenleri ve birebir çıktı örnekleri ORİJİNAL HALİYLE (İngilizce/Go) kalır — ASLA çevrilmez. Kod bloklarını üç ters tırnak (\`\`\`) ile sarmala (mümkünse \`\`\`go veya \`\`\`bash). Satır içi kod/komut/tanımlayıcıları tek ters tırnak ile işaretle. Koddaki YORUM satırlarını (// ...) Türkçeye çevirebilirsin ama kodu bozma.

2) SADECE DÜZ METNİ ÇEVİR: Anlatım/açıklama metnini akıcı, doğru, teknik Türkçeye çevir. Teknik terimlerde yerleşik Türkçe karşılık kullan; yoksa veya anlam kayması riski varsa Türkçesinin yanına parantezle İngilizcesini yaz. Örn: "eşzamanlılık (concurrency)", "yarış durumu (race condition)", "soket (socket)", "yük/faydalı yük (payload)", "arabellek (buffer)", "iş parçacığı/goroutine", "kanal (channel)", "işaretçi (pointer)", "arayüz (interface)", "derleme (build/compile)". "goroutine", "package", "struct", "slice", "map" gibi Go'ya özgü terimleri çevirmeyip olduğu gibi bırakabilir veya yanına Türkçe açıklama ekleyebilirsin.

3) PDF GÜRÜLTÜSÜNÜ TEMİZLE: Satır kırılmaları, sayfa numaraları, üstbilgi/altbilgi (kitap/bölüm adı tekrarları, tek başına sayılar), "Chapter N" sayfa filigranları ve form-feed karakterleri METİN DEĞİLDİR — at, paragrafları doğru birleştir. OCR'dan gelen bariz harf bozukluklarını (ör. "Prosrommins"->"Programming") anlamı koruyarak düzelt. UYDURMA bilgi EKLEME.

4) YAPI: Bölüm/alt başlıkları Markdown başlığı yap (# bölüm, ## alt başlık, ### daha alt). Listeler Markdown listesi, tablolar Markdown tablosu. "Listing 2-1", "Figure 3-2" gibi atıfları "Liste 2-1", "Şekil 3-2" biçiminde koru ve numaralarını değiştirme. Vurguları (bold/italik) koru.

5) SADAKAT: İçeriği özetleme, atlama veya ekleme YOK — TAM çeviri; yazarın anlamı birebir korunur. Çeviriye kendi yorumunu/çevirmen notunu EKLEME. UYDURMA kaynak/URL verme.

6) ÇIKTI: Sadece Türkçe Markdown. "İşte çeviri" gibi meta ifade yok; İngilizce orijinali tekrar yazma.`;

async function call(messages, attempts = 4) {
  for (let a = 1; a <= attempts; a++) {
    try {
      const r = await openai.chat.completions.create({ model: "gpt-5.1", messages });
      const out = r.choices[0]?.message?.content?.trim() || "";
      if (!out) throw new Error("empty");
      return out;
    } catch (e) {
      if (a === attempts) throw e;
      await new Promise((r) => setTimeout(r, 3000 * a));
    }
  }
}

const chunks = chunkText(body);
console.log(`Toplam parça: ${chunks.length}`);
fs.writeFileSync(path.join(CACHE, "_count.txt"), String(chunks.length));

function pathFor(i) { return path.join(CACHE, `chunk_${String(i).padStart(4, "0")}.md`); }

async function doTask(i) {
  const p = pathFor(i);
  if (fs.existsSync(p) && fs.statSync(p).size > 0) return "cache";
  const out = await call([
    { role: "system", content: SYSTEM },
    { role: "user", content: `Parça ${i + 1}/${chunks.length}. Aşağıdaki bölümü çevir:\n\n${chunks[i]}` },
  ]);
  fs.writeFileSync(p, out + "\n");
  return `ok ${out.length}`;
}

async function run() {
  const idxs = chunks.map((_, i) => i).filter((i) => !(fs.existsSync(pathFor(i)) && fs.statSync(pathFor(i)).size > 0));
  console.log(`Bekleyen: ${idxs.length}/${chunks.length}`);
  let done = 0;
  const q = [...idxs];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (q.length) {
      const i = q.shift();
      try { const r = await doTask(i); done++; console.log(`[${done}/${idxs.length}] chunk ${i} -> ${r}`); }
      catch (e) { console.error(`HATA chunk ${i}: ${e.message}`); }
    }
  });
  await Promise.all(workers);
  const left = chunks.map((_, i) => i).filter((i) => !(fs.existsSync(pathFor(i)) && fs.statSync(pathFor(i)).size > 0)).length;
  console.log(left === 0 ? "TÜMÜ BİTTİ" : `KALAN: ${left}`);
}
run().catch((e) => { console.error("FATAL", e); process.exit(1); });
