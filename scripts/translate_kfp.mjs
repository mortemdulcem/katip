// Knight's Forensic Pathology -> Türkçe akademik çeviri (yoğun çevirmen notu + bölüm sonu kaynaklı zenginleştirme)
// Kaynak: attached_assets/KFP_plain.txt  | Bölümler: scripts/kfp_chapters.json
// Cache: scripts/kfp_cache/  | Çıktı birleştirme ayrı adımda (assemble_kfp.mjs)
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SRC = "attached_assets/KFP_plain.txt";
const CACHE = "scripts/kfp_cache";
const MAX_CHARS = 8000;
const CONCURRENCY = 4;
fs.mkdirSync(CACHE, { recursive: true });

const allLines = fs.readFileSync(SRC, "utf8").split("\n");
const chapters = JSON.parse(fs.readFileSync("scripts/kfp_chapters.json", "utf8"));

// ön kısım (Preface/Acknowledgements/Abbreviations): 262..621 (1-indexed)
const segments = [{ num: 0, title: "Ön Kısım (Önsöz, Teşekkür, Kısaltmalar)", start: 261, end: 621 }];
for (const c of chapters) segments.push(c);
// son segmentin sonunu boş/formfeed öncesine çek
segments[segments.length - 1].end = Math.min(segments[segments.length - 1].end, 63337);

function chunkText(text) {
  const paras = text.split(/\n\s*\n/).map((p) => p.replace(/[ \t]+\n/g, "\n").trim()).filter(Boolean);
  const out = [];
  let cur = "";
  for (const p of paras) {
    if ((cur + "\n\n" + p).length > MAX_CHARS && cur) { out.push(cur); cur = p; }
    else cur = cur ? cur + "\n\n" + p : p;
  }
  if (cur) out.push(cur);
  return out;
}

const SYSTEM = `Sen adli patoloji, adli tıp, patoloji ve mediko-legal hukuk alanlarında uzman, akademik düzeyde bir Türkçe çevirmen-editörsün. "Knight's Forensic Pathology" (Saukko & Knight, 4. baskı, CRC Press 2015) kitabını İngilizceden Türkçeye çeviriyorsun. Hedef okur: adli tıp uzmanları, patologlar, hukukçular, adli bilim uzmanları.

KURALLAR — her parçayı çevir ve SADECE Türkçe Markdown döndür:

1) TERMİNOLOJİ (azami dikkat): Tıbbi/anatomik/patolojik/adli ve hukuki terimleri DOĞRU karşıla. Türkçe karşılığı yerleşik değilse ya da anlam kayması riski varsa, Türkçe terimin yanına parantez içinde İngilizce/Latince orijinalini yaz. Örn: "ölüm sonrası morarma (livor mortis, post-mortem lividity)", "ölü katılığı (rigor mortis)", "boğulma (asfiksi; asphyxia)", "çürüme (putrefaction)", "yağ-mumu oluşumu (adipocere)", "peteşi (petechiae)", "kontüzyon/ezik (contusion)", "laserasyon/yırtık (laceration)", "insizyon/kesi (incision)", "ani bebek ölümü sendromu (SIDS)", "diatom testi". Latince anatomik adlar korunur. Birimler (cm, mg/L, ‰) aynen.
2) ANLAM DÜZELTME: PDF'ten gelen satır kırılmaları, sayfa numaraları, üstbilgi/altbilgi (bölüm adı tekrarları, tek başına sayılar), filigran ve form-feed karakterleri METİN DEĞİLDİR — at, paragrafları doğru birleştir. Bir cümle çeviride bozuk/anlamsız olacaksa anlamını koruyarak doğru, akıcı, bilimsel Türkçeye çevir. Uydurma bilgi EKLEME; yalnız ifadeyi düzelt.
3) YAPI: Başlıkları Markdown başlığı yap (## bölüm alt başlığı, ### daha alt). Listeler Markdown listesi. Tablo varsa Markdown tablosu. Şekil/Tablo atıflarını koru ("Şekil 4.3", "Tablo 2.1"). Vurguları koru.
4) ÇEVİRMEN NOTLARI (BOL ve DEĞERLİ): Metin boyunca, kavramı netleştiren, klinik/adli pratiğe bağlayan, Türkiye adli tıp bağlamına (Adli Tıp Kurumu, CMK, TCK ilgili maddeleri, ATK uygulamaları) köprü kuran KISA notlar ekle. Biçim: "> **💬 Çevirmen notu:** ...". Notlar yazarın metniyle KARIŞMAZ (her zaman blockquote). Önceki kitaptan DAHA SIK not ekle, ama her not gerçek bir değer katmalı; doldurma yapma.
5) REFERANS/SADAKAT: Metindeki atıfları koru. UYDURMA kaynak/DOI/yazar/sayfa verme. Emin olmadığın spesifik atıfları "doğrulanmalı" diye işaretle. İçeriği özetleme/atlama yok — TAM çeviri; yazarın anlamı birebir korunur.
6) ÇIKTI: Sadece Türkçe Markdown. "İşte çeviri" gibi meta ifade yok, İngilizce orijinali tekrar yazma.`;

const ENRICH = `Sen adli patoloji/adli tıp alanında uzman bir akademisyensin. Sana bir bölümün BAŞLIĞI ve KISA özeti veriliyor. Bu bölümün sonuna eklenecek bir "ÇEVİRMEN EKİ" yaz (Türkçe, Markdown). Amaç: bölümü ileri, niş ve güncel bilgiyle donatmak.

İçerik (alt başlıklarla):
### 🔬 İleri ve Niş Bilgiler
- Kitabın değinmediği veya yüzeysel geçtiği ileri düzey, niş ama gerçek ve yerleşik bilgiler (özgül adli patoloji nüansları, ayırıcı tanı incelikleri, son yıllardaki yöntemsel gelişmeler: ör. post-mortem BT/MR "virtopsi", moleküler otopsi, biyokimyasal ölüm zamanı tayini, vb. — yalnızca konuyla ilgiliyse).
### ⚖️ Türkiye / Mediko-legal Bağlam
- Türk hukuku ve adli tıp pratiğiyle ilişki (Adli Tıp Kurumu uygulamaları, CMK otopsi hükümleri, TCK ilgili maddeleri, Sağlık Bakanlığı/ATK kılavuzları). Yalnızca gerçekten ilgili ve doğru olanları yaz.
### 📚 Eksikler ve İleri Okuma (Kaynaklı)
- Bölümün eksik/güncellenmesi gereken yönleri ve ileri okuma için GERÇEK, yerleşik kaynaklar: standart başvuru kitapları (ör. DiMaio & DiMaio "Forensic Pathology"; Spitz & Fisher "Medicolegal Investigation of Death"; Payne-James "Encyclopedia of Forensic and Legal Medicine"; Saukko & Knight), ilgili kılavuzlar (ör. Avrupa Konseyi R(99)3, ulusal otopsi kılavuzları) ve konuya özgü yerleşik landmark çalışmalar.

KESİN KURALLAR: UYDURMA kaynak, DOI, sahte yazar/yıl/sayfa YOK. Yalnızca varlığından emin olduğun yerleşik kitap/kılavuz/landmark eserleri ad ver. Spesifik makale iddialarında dergiyi genel ifadeyle belirt ve "doğrulanmalı" notu düş. Abartma; bölümle gerçekten ilgili, doğru, yüksek bilgi-yoğunluklu içerik yaz. Sadece Markdown döndür; başlığı "## 📝 Çevirmen Eki — [bölüm adı]" ile başlat.`;

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

// build task list
const tasks = [];
for (const seg of segments) {
  const text = allLines.slice(seg.start, seg.end).join("\n");
  const chunks = chunkText(text);
  chunks.forEach((t, ci) =>
    tasks.push({ type: "chunk", seg: seg.num, ci, total: chunks.length, title: seg.title, text })
  );
  if (seg.num > 0) tasks.push({ type: "enrich", seg: seg.num, title: seg.title, text });
}
// store chunk texts per seg so enrich can summarize
const segChunks = {};
for (const seg of segments) segChunks[seg.num] = chunkText(allLines.slice(seg.start, seg.end).join("\n"));

console.log(`Segment: ${segments.length}, toplam görev: ${tasks.length}`);
fs.writeFileSync(path.join(CACHE, "_tasks.txt"), String(tasks.length));

function pathFor(t) {
  if (t.type === "chunk")
    return path.join(CACHE, `ch${String(t.seg).padStart(2, "0")}_chunk${String(t.ci).padStart(2, "0")}.md`);
  return path.join(CACHE, `ch${String(t.seg).padStart(2, "0")}_enrich.md`);
}

async function doTask(t) {
  const p = pathFor(t);
  if (fs.existsSync(p) && fs.statSync(p).size > 0) return "cache";
  if (t.type === "chunk") {
    const chunks = segChunks[t.seg];
    const out = await call([
      { role: "system", content: SYSTEM },
      { role: "user", content: `Bölüm: "${t.title}". Parça ${t.ci + 1}/${chunks.length}. Çevir:\n\n${chunks[t.ci]}` },
    ]);
    fs.writeFileSync(p, out + "\n");
    return `ok ${out.length}`;
  } else {
    const chunks = segChunks[t.seg];
    const ctx = chunks.join("\n\n").slice(0, 9000);
    const out = await call([
      { role: "system", content: ENRICH },
      { role: "user", content: `Bölüm başlığı: "${t.title}".\nBölüm içeriğinden örnek (özet için):\n${ctx}` },
    ]);
    fs.writeFileSync(p, out + "\n");
    return `enrich ${out.length}`;
  }
}

async function run() {
  // pending only
  const pending = tasks.filter((t) => !(fs.existsSync(pathFor(t)) && fs.statSync(pathFor(t)).size > 0));
  console.log(`Bekleyen: ${pending.length}/${tasks.length}`);
  let done = 0;
  const q = [...pending];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (q.length) {
      const t = q.shift();
      try {
        const r = await doTask(t);
        done++;
        console.log(`[${done}/${pending.length}] seg${t.seg} ${t.type}${t.ci !== undefined ? "#" + t.ci : ""} -> ${r}`);
      } catch (e) {
        console.error(`HATA seg${t.seg} ${t.type}#${t.ci}: ${e.message}`);
      }
    }
  });
  await Promise.all(workers);
  const left = tasks.filter((t) => !(fs.existsSync(pathFor(t)) && fs.statSync(pathFor(t)).size > 0)).length;
  console.log(left === 0 ? "TÜMÜ BİTTİ" : `KALAN: ${left}`);
}
run().catch((e) => { console.error("FATAL", e); process.exit(1); });
