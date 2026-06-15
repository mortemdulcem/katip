// Causation in Law and Medicine (Freckelton & Mendelson, Routledge) -> Türkçe akademik HUKUK çevirisi
// Kaynak: scripts/causation_src/segNN.txt (EN-only PDF'ten temizlenmiş)  | Segment: scripts/causation_chapters.json
// Cache: scripts/causation_cache/  | Birleştirme ayrı (assemble_causation.py)
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CACHE = "scripts/causation_cache";
const MAX_CHARS = 3500;
const CONCURRENCY = 12;
fs.mkdirSync(CACHE, { recursive: true });

const segments = JSON.parse(fs.readFileSync("scripts/causation_chapters.json", "utf8"));

function chunkText(text) {
  text = text.replace(/[ \t]+\n/g, "\n").trim();
  const units = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const out = [];
  let cur = "";
  for (const u of units) {
    if (u.length > MAX_CHARS) {
      if (cur) { out.push(cur); cur = ""; }
      const sents = u.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [u];
      let s = "";
      for (const sent of sents) {
        if ((s + " " + sent).length > MAX_CHARS && s) { out.push(s); s = sent.trim(); }
        else s = s ? s + " " + sent.trim() : sent.trim();
      }
      if (s) out.push(s);
      continue;
    }
    if ((cur + "\n" + u).length > MAX_CHARS && cur) { out.push(cur); cur = u; }
    else cur = cur ? cur + "\n" + u : u;
  }
  if (cur) out.push(cur);
  return out.length ? out : [""];
}

const SYSTEM = `Sen ileri akademik düzeyde (hukuk yüksek lisans/doktora seviyesi) uzman bir Türkçe HUKUK çevirmeni-editörüsün. Kitap: "Causation in Law and Medicine" (Ian Freckelton & Danuta Mendelson, ed.; Routledge/Ashgate 2002/2016). Alan: MEDİKO-LEGAL NEDENSELLİK (illiyet bağı) — common law (Avustralya, İngiltere, Kanada, ABD) haksız fiil/ceza hukuku + Roma hukuku + tıp/adli tıp/psikiyatri/istatistik kesişimi. Hedef okur: hukukçular, adli tıp uzmanları, akademisyenler, bilirkişiler.

KAYNAK: Metin İngilizce orijinal PDF'ten çıkarılmıştır; nadiren sayfa üstbilgisi (kitap/bölüm adı tekrarı), sayfa numarası, kopuk satır kırılması içerir. Sayfa üstbilgisi/altbilgisi/numarası METİN DEĞİLDİR — at. Kopuk kelime/satırı anlamı koruyarak onar.

KURALLAR — her parçayı TAM çevir ve SADECE Türkçe Markdown döndür:

1) HUKUK TERMİNOLOJİSİ (azami özen; ilk geçişte Türkçe karşılığın yanında parantezle İngilizce/Latince orijinal): nedensellik/illiyet bağı (causation), haksız fiil (tort), ihmal/özensizlik (negligence — DİKKAT: ceza hukukunda "taksir" bağlamı ayrı), özen yükümlülüğü (duty of care), yükümlülüğün ihlali (breach of duty), "olmasaydı" testi / şart teorisi (the "but for" test / sine qua non), yakın-asıl neden (proximate cause), hukuki uzaklık (remoteness), öngörülebilirlik (foreseeability), araya giren yeni neden (novus actus interveniens), şans/fırsat kaybı (loss of chance), ispat yükü (burden of proof), olasılıkların dengesi/üstünlüğü (balance of probabilities), makul şüphenin ötesinde (beyond reasonable doubt), davacı (plaintiff/claimant), davalı (defendant), sorumluluk (liability), tazminat (damages), maddi vakıa olarak nedensellik (cause-in-fact), hukuki nedensellik (legal cause/scope of liability), katkıda bulunan ihmal (contributory negligence), müteselsil sorumluluk (joint and several liability), bilirkişi delili (expert evidence), emsal/içtihat (precedent). LATİNCE MAXİMLER KORUNUR (res ipsa loquitur, novus actus interveniens, condicio/conditio sine qua non, volenti non fit injuria) ve ilk geçişte kısa Türkçe açıklama ver.

2) DAVA ADLARI / ATIFLAR KORUNUR: Dava adları (ör. *March v Stramare*, *McGhee v National Coal Board*, *Chappel v Hart*, *Fairchild*) AYNEN İngilizce/italik bırakılır; çevrilmez. Mahkeme, yasa, dergi, künye, yıl, cilt, sayfa atıfları AYNEN korunur. UYDURMA dava/yasa/atıf/yıl EKLEME.

3) YAPI: Başlıkları Markdown başlığı yap (## ana, ### alt). Dipnot/sonnot numaralarını metinde üst-simge yerine [n] biçiminde koru; sonnotları bölüm sonunda "### Notlar" altında sırayla ver. Tablolar GERÇEK Markdown tablosu (2. satırda |---| ayraç ZORUNLU).

4) ⚖️ TÜRK HUKUKU KARŞILAŞTIRMASI (ZORUNLU, bu kitabın ÖZGÜN gereği): Metinde somut bir YABANCI hukuki dayanak/doktrin/kural/test/dava geçtiğinde (hangi ülkeye ait olduğunu belirterek), HEMEN ardından kısa bir karşılaştırmalı çevirmen notu ekle ve Türk hukukundaki karşılığını ver: ilgili TBK (özellikle haksız fiil m.49 vd., illiyet bağı), TCK, CMK, TMK, HMK, Karayolları Trafik Kanunu, ATK/adli tıp uygulaması, Yargıtay yerleşik içtihadı/teamülü. Biçim: "> **⚖️ Türk hukuku karşılaştırması:** [yabancı kural X ülkesinde ...]; Türk hukukunda karşılığı [TBK m.49 / uygun sebep teorisi / ilgili düzenleme] ...". 
   ZERO-HALLUCINATION: Yalnızca varlığından EMİN olduğun madde/ilke/teamülü ver. Spesifik Yargıtay karar numarası UYDURMA — ilkeyi yaz, gerekiyorsa "(ilgili Yargıtay yerleşik içtihadı; karar no doğrulanmalı)" de. Doğrulayamadığın düzenlemeyi "(doğrulanmalı)" diye işaretle. Türk hukukunda gerçek karşılığı yoksa açıkça "Türk hukukunda doğrudan karşılığı bulunmamaktadır; en yakın kurum ..." yaz.
   YERLEŞİK TÜRK HUKUKU ÇERÇEVESİ (doğrulanmış, kullanabilirsin): Haksız fiil sorumluluğu TBK m.49 vd.; unsurlar = hukuka aykırı fiil + kusur + zarar + illiyet bağı. İlliyet bağında Türk öğreti/Yargıtay UYGUN SEBEP (illiyet) TEORİSİ'ni (adequate causation) benimser; şart teorisi (conditio sine qua non) başlangıç noktasıdır ama tek başına yetmez. İlliyet bağını kesen haller: mücbir sebep, zarar görenin/üçüncü kişinin ağır kusuru (TBK m.52). Ceza hukukunda nedensellik + objektif isnadiyet (TCK genel hükümler; kasten/taksirle öldürme TCK m.81/85, yaralama m.86-89). Bilirkişilik CMK m.62 vd. / HMK m.266 vd.; adli raporlar Adli Tıp Kurumu.

5) ÇEVİRMEN NOTLARI (ölçülü, değerli): Kavramı netleştiren KISA notlar "> **💬 Çevirmen notu:** ..." biçiminde; yazarın metniyle KARIŞMAZ (her zaman blockquote). Doldurma yok.

6) SADAKAT: Özetleme/atlama YOK — TAM çeviri; yazarın anlamı birebir korunur. Hiçbir sayı/oran/tarih değiştirilmez. UYDURMA içerik/kaynak yok.

7) ÇIKTI: Sadece Türkçe Markdown. "İşte çeviri" gibi meta ifade yok; İngilizce orijinali tekrar yazma.`;

const ENRICH = `Sen mediko-legal nedensellik (illiyet bağı) alanında uzman bir Türk hukukçu-akademisyensin. Sana "Causation in Law and Medicine" kitabının bir bölümünün BAŞLIĞI ve içerik örneği veriliyor. Bu bölümün sonuna eklenecek bir "ÇEVİRMEN EKİ" yaz (Türkçe, Markdown). Amaç: bölümdeki YABANCI (common law / Roma hukuku) yaklaşımları TÜRK HUKUKU ile sistematik KARŞILAŞTIRMAK ve okura gerçek, yerleşik, sayılı-maddeli bilgi sunmak.

İçerik (alt başlıklarla):
### ⚖️ Türk Hukukunda Karşılığı (Karşılaştırmalı Analiz)
- Bölümün ele aldığı temel doktrin/test/kuralların Türk hukukundaki karşılığı: ilgili TBK (haksız fiil m.49 vd., illiyet bağı, TBK m.52 illiyetin kesilmesi), TCK, CMK, TMK, HMK, Karayolları Trafik Kanunu, ATK/adli tıp uygulaması ve Yargıtay yerleşik içtihadı/teamülü. Benzerlik ve FARKLARI net belirt (ör. common law "but for" testi ↔ Türk hukukunda şart teorisi + uygun sebep teorisi).
### 🔬 İleri / Güncel Hukuki Notlar
- Bölümle gerçekten ilgili ileri/güncel yerleşik bilgi (ör. uygun illiyet teorisi tartışmaları, objektif isnadiyet öğretisi, tıbbi malpraktiste ispat, belirsiz illiyet ve "fırsat kaybı"nın Türk hukukundaki durumu).
### 📚 İleri Okuma (Kaynaklı)
- GERÇEK, yerleşik Türk hukuk doktrini: ör. Fikret Eren (Borçlar Hukuku Genel Hükümler), Kemal Oğuzman/Turgut Öz, M. Kemal Oğuzman, Hakeri/Özgenç (Ceza), Erdem/Centel; mevzuat (TBK, TCK, CMK). Yabancı landmark: Hart & Honoré "Causation in the Law".

KESİN KURALLAR (ZERO-HALLUCINATION): UYDURMA Yargıtay karar no / sahte madde / sahte yazar-yıl-sayfa YOK. Yalnızca varlığından EMİN olduğun düzenleme/ilke/eseri ad ver; emin olmadığını "(doğrulanmalı)" işaretle. Türk hukukunda gerçek karşılığı yoksa açıkça öyle yaz. Abartma; bölümle gerçekten ilgili, doğru, yüksek bilgi-yoğunluklu, KARŞILAŞTIRMALI içerik. Sadece Markdown döndür; başlığı "## 📝 Çevirmen Eki — [bölüm adı]" ile başlat.`;

let lastStart = 0;
const MIN_INTERVAL = 1500;
async function gate() {
  const now = Date.now();
  const wait = Math.max(0, lastStart + MIN_INTERVAL - now);
  lastStart = Math.max(now, lastStart + MIN_INTERVAL);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

async function call(messages, attempts = 6) {
  for (let a = 1; a <= attempts; a++) {
    await gate();
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 80000);
    try {
      const r = await openai.chat.completions.create({ model: "gpt-5.1", messages }, { signal: ac.signal });
      clearTimeout(to);
      const out = r.choices[0]?.message?.content?.trim() || "";
      if (!out) throw new Error("empty");
      return out;
    } catch (e) {
      clearTimeout(to);
      if (a === attempts) throw e;
      await new Promise((r) => setTimeout(r, 2000 * a));
    }
  }
}

const segChunks = {};
for (const seg of segments) segChunks[seg.idx] = chunkText(fs.readFileSync(seg.file, "utf8"));

const tasks = [];
for (const seg of segments) {
  segChunks[seg.idx].forEach((t, ci) => tasks.push({ type: "chunk", idx: seg.idx, ci, title: seg.title, part: seg.part }));
  if (seg.enrich) tasks.push({ type: "enrich", idx: seg.idx, title: seg.title });
}
console.log(`Segment: ${segments.length}, toplam görev: ${tasks.length}`);

function pathFor(t) {
  const s = String(t.idx).padStart(2, "0");
  return t.type === "chunk"
    ? path.join(CACHE, `seg${s}_chunk${String(t.ci).padStart(2, "0")}.md`)
    : path.join(CACHE, `seg${s}_enrich.md`);
}

async function doTask(t) {
  const p = pathFor(t);
  if (fs.existsSync(p) && fs.statSync(p).size > 0) return "cache";
  if (t.type === "chunk") {
    const chunks = segChunks[t.idx];
    const hdr = t.ci === 0 && t.part ? `Bu parça yeni bir KISIM başlatıyor: "${t.part}". Önce kısım başlığını Markdown H1 (#) olarak çevir, sonra bölüme geç.\n\n` : "";
    const out = await call([
      { role: "system", content: SYSTEM },
      { role: "user", content: `Bölüm: "${t.title}". Parça ${t.ci + 1}/${chunks.length}. ${hdr}Çevir:\n\n${chunks[t.ci]}` },
    ]);
    fs.writeFileSync(p, out + "\n");
    return `ok ${out.length}`;
  } else {
    const ctx = segChunks[t.idx].join("\n\n").slice(0, 9000);
    const out = await call([
      { role: "system", content: ENRICH },
      { role: "user", content: `Bölüm başlığı: "${t.title}".\nBölüm içeriğinden örnek:\n${ctx}` },
    ]);
    fs.writeFileSync(p, out + "\n");
    return `enrich ${out.length}`;
  }
}

async function run() {
  const pending = tasks.filter((t) => !(fs.existsSync(pathFor(t)) && fs.statSync(pathFor(t)).size > 0));
  console.log(`Bekleyen: ${pending.length}/${tasks.length}`);
  let done = 0;
  const hb = setInterval(() => {
    const c = fs.readdirSync(CACHE).filter((f) => f.endsWith(".md")).length;
    process.stdout.write(`.hb cache=${c} done=${done}\n`);
  }, 4000);
  const q = [...pending];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (q.length) {
      const t = q.shift();
      try {
        const r = await doTask(t);
        done++;
        console.log(`[${done}/${pending.length}] seg${t.idx} ${t.type}${t.ci !== undefined ? "#" + t.ci : ""} -> ${r}`);
      } catch (e) {
        console.error(`HATA seg${t.idx} ${t.type}#${t.ci}: ${e.message}`);
      }
    }
  });
  await Promise.all(workers);
  clearInterval(hb);
  const left = tasks.filter((t) => !(fs.existsSync(pathFor(t)) && fs.statSync(pathFor(t)).size > 0)).length;
  console.log(left === 0 ? "TÜMÜ BİTTİ" : `KALAN: ${left}`);
}
run().catch((e) => { console.error("FATAL", e); process.exit(1); });
