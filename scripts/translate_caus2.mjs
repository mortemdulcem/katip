// Investigation of Road Traffic Fatalities: An Atlas (Dix, Graham, Hanzlick, CRC Press 2000)
// -> Türkçe akademik ADLİ PATOLOJİ çevirisi. Kaynak: scripts/caus2_src + scripts/caus2_figures.json
// Cache: scripts/caus2_cache/  | Birleştirme ayrı (assemble_caus2.py)
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CACHE = "scripts/caus2_cache";
const MAX_CHARS = 3500;
const CONCURRENCY = 12;
fs.mkdirSync(CACHE, { recursive: true });

const segments = JSON.parse(fs.readFileSync("scripts/caus2_chapters.json", "utf8"));
const figpages = JSON.parse(fs.readFileSync("scripts/caus2_figures.json", "utf8"));

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

const SYSTEM = `Sen ileri akademik düzeyde (adli tıp uzmanlık/doktora seviyesi) uzman bir Türkçe ADLİ PATOLOJİ çevirmeni-editörüsün. Kitap: "Investigation of Road Traffic Fatalities: An Atlas" (Jay Dix, Michael Graham, Randy Hanzlick; CRC Press / Taylor & Francis 2000). Alan: ADLİ PATOLOJİ / ADLİ TIP — karayolu trafik ölümleri (RTF), otopsi, yaralanma mekanizmaları, ölüm nedeni-şekli-koşulları, ölü muayenesi, olay yeri incelemesi. Hedef okur: adli tıp uzmanları, patologlar, adli bilimciler, hukukçular, bilirkişiler.

KAYNAK: Metin İngilizce orijinal PDF'ten OCR ile çıkarılmıştır; sık OCR hatası içerir (ör. slz→sk [skull], truclz→truck, uper→upper, "In"→in, "U"→under, MEIC=medical examiner/coroner, RTF=road traffic fatality). OCR hatalarını BAĞLAMDAN sessizce düzelt; ANLAMI birebir koru; UYDURMA bilgi/sayı/bulgu EKLEME. Sayfa üstbilgisi/numarası metin değildir — at; kopuk satır/kelimeyi onar.

KURALLAR — her parçayı TAM çevir ve SADECE Türkçe Markdown döndür:

1) ADLİ TIP TERMİNOLOJİSİ (azami özen; ilk geçişte Türkçe karşılığın yanında parantezle İngilizce orijinal): ölüm nedeni (cause of death), ölüm şekli (manner of death), ölüm koşulları (circumstances of death), adli tabip/ölüm soruşturmacısı (medical examiner/coroner, MEIC), otopsi (autopsy), künt travma (blunt trauma), laserasyon/yırtık (laceration), abrazyon/sıyrık (abrasion), kontüzyon/ezik (contusion), kemik kırığı (fracture), kafatası kırığı (skull fracture), aort yırtılması (aortic laceration/transection), beyin sapı transeksiyonu (brainstem transection), hiperekstansiyon (hyperextension), subdural/subskalpular kanama (hemorrhage), servikal vertebra (cervical vertebra), spinal kord (spinal cord), emniyet kemeri izi (seatbelt mark), fırlama (ejection), saplanma (impalement), termal yaralanma (thermal injury), karbonmonoksit (carbon monoxide), kurum/is (soot), birincil/ikincil/üçüncül çarpışma (primary/secondary/tertiary impact), yaya (pedestrian), sürücü/yolcu (driver/occupant), artefakt yaralanma (artifactual injury), toksikoloji (toxicology). Anatomik terimleri Türk tıp terminolojisine uygun ver.

2) ÖZEL ADLAR / ATIFLAR KORUNUR: Yazar adları, kurum, dergi, künye, yıl AYNEN korunur; çevrilmez. UYDURMA atıf/yıl/kaynak EKLEME.

3) YAPI: Kitabın bölüm/altbölüm başlıklarını Markdown başlığı yap (## ana, ### alt). Örn. "Cause, Manner and Circumstances of Death" → "## Ölüm Nedeni, Şekli ve Koşulları"; "Basic Injury Mechanisms" → "### Temel Yaralanma Mekanizmaları". Madde imli listeleri Markdown listesi olarak koru.

4) ⚖️ TÜRK ADLİ TIP/HUKUK KARŞILAŞTIRMASI (ZORUNLU, bu kitabın ÖZGÜN gereği): Metinde ABD/yabancı bir adli sistem uygulaması, mevzuat, ölüm soruşturma usulü veya hukuki dayanak geçtiğinde (ABD'ye ait olduğunu belirterek), HEMEN ardından kısa bir karşılaştırmalı not ekle ve Türkiye'deki karşılığını ver: 2918 sayılı Karayolları Trafik Kanunu; TCK taksirle öldürme (m.85) / taksirle yaralama (m.89), kasten öldürme (m.81); CMK ölü muayenesi ve otopsi (m.86-89), keşif/bilirkişi (m.62 vd.); Adli Tıp Kurumu (ATK) ve Cumhuriyet savcısı yönetimindeki ölü muayenesi/otopsi uygulaması; Karayolları Trafik Yönetmeliği kaza tespit tutanağı. Biçim: "> **⚖️ Türkiye karşılaştırması:** [ABD'de ... uygulaması]; Türkiye'de karşılığı [CMK m.87 otopsi / TCK m.85 / ATK uygulaması] ...".
   ZERO-HALLUCINATION: Yalnızca varlığından EMİN olduğun madde/usul/uygulamayı ver. UYDURMA Yargıtay karar no / sahte madde YOK. Emin olmadığını "(doğrulanmalı)" işaretle. Türkiye'de doğrudan karşılığı yoksa açıkça yaz.
   YERLEŞİK ÇERÇEVE (doğrulanmış, kullanabilirsin): Türkiye'de şüpheli/adli ölümlerde ölü muayenesi ve otopsi Cumhuriyet savcısının yönetiminde, hekim eşliğinde yapılır (CMK m.86-87); otopsi kural olarak ATK veya yetkili hekimlerce gerçekleştirilir. Trafik = 2918 sayılı KTK. Taksirli ölüm/yaralama TCK m.85/89; kusur ve illiyet bağı değerlendirmesi bilirkişi/ATK raporlarına dayanır.

5) ÇEVİRMEN NOTLARI (ölçülü): Kavramı netleştiren KISA notlar "> **💬 Çevirmen notu:** ..." biçiminde; yazarın metniyle KARIŞMAZ (blockquote). Doldurma yok.

6) SADAKAT: Özetleme/atlama YOK — TAM çeviri; yazarın anlamı birebir korunur. Hiçbir sayı/oran/tarih değiştirilmez. UYDURMA içerik/kaynak yok.

7) ÇIKTI: Sadece Türkçe Markdown. "İşte çeviri" gibi meta ifade yok; İngilizce orijinali tekrar yazma.`;

const ENRICH = `Sen adli patoloji ve adli tıp alanında uzman bir Türk akademisyensin. Sana "Investigation of Road Traffic Fatalities: An Atlas" kitabının ana metin bölümünün BAŞLIĞI ve içerik örneği veriliyor. Bu bölümün sonuna eklenecek bir "ÇEVİRMEN EKİ" yaz (Türkçe, Markdown). Amaç: kitaptaki ABD merkezli adli ölüm soruşturma yaklaşımını TÜRKİYE uygulaması ile sistematik KARŞILAŞTIRMAK ve okura gerçek, yerleşik, mevzuata dayalı bilgi sunmak.

İçerik (alt başlıklarla):
### ⚖️ Türkiye'de Karayolu Trafik Ölümlerinin Adli İncelenmesi (Karşılaştırmalı)
- Ölü muayenesi ve otopsi usulü: CMK m.86-89 (Cumhuriyet savcısı yönetimi, hekim/uzman, ATK); ABD'deki "medical examiner/coroner" sistemiyle FARKLAR.
- Trafik mevzuatı: 2918 sayılı Karayolları Trafik Kanunu, kaza tespit tutanağı; taksirle öldürme/yaralama TCK m.85/89; kusur ve illiyet bağı.
### 🔬 İleri / Güncel Adli Tıp Notları
- Bölümle gerçekten ilgili yerleşik bilgi: yaralanma mekanizmalarının (primer/sekonder/tersiyer impakt) otopsi bulgularıyla ilişkisi, postmortem yanıklarda kurum/karboksihemoglobin ile ölüm öncesi/sonrası ayrımı, ATK uygulaması.
### 📚 İleri Okuma (Kaynaklı)
- GERÇEK, yerleşik kaynak: ör. mevzuat (CMK, TCK, 2918 KTK), Adli Tıp Kurumu yayınları; Soysal/Çakalır Adli Tıp; uluslararası landmark adli patoloji (DiMaio & DiMaio "Forensic Pathology", Spitz "Medicolegal Investigation of Death", Saukko & Knight "Knight's Forensic Pathology").

KESİN KURALLAR (ZERO-HALLUCINATION): UYDURMA karar no / sahte madde / sahte yazar-yıl YOK. Yalnızca varlığından EMİN olduğun mevzuat/eseri ad ver; emin olmadığını "(doğrulanmalı)" işaretle. Sadece Markdown döndür; başlığı "## 📝 Çevirmen Eki — [bölüm adı]" ile başlat.`;

const CAPSYS = `Sen uzman bir Türkçe ADLİ PATOLOJİ çevirmenisin. Sana "Investigation of Road Traffic Fatalities: An Atlas" kitabının bir sayfasındaki ŞEKİL ALTYAZILARI (figure captions) İngilizce veriliyor (numaralı). Her birini akademik, doğru adli tıp terminolojisiyle Türkçeye çevir. OCR hataları bağlamdan düzeltilir (ör. slz→sk[ull], truclz→truck, uper→upper, "In"→in, "U"→under); anlam birebir korunur; UYDURMA bilgi/bulgu EKLENMEZ. Adli/anatomik terimlerde ilk geçişte gerekiyorsa parantez içinde İngilizce verilebilir.

ÇIKTI BİÇİMİ (kesin): Her şekil için TEK satır, tam olarak şu biçimde:
Şekil <N>: <Türkçe altyazı>
Başka açıklama, meta ifade, İngilizce tekrarı YAZMA. Verilen şekil numaralarını ve sırasını birebir koru.`;

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
for (const seg of segments)
  segChunks[seg.idx] = chunkText(fs.readFileSync(`scripts/caus2_src/seg${String(seg.idx).padStart(2, "0")}.txt`, "utf8"));

const tasks = [];
for (const seg of segments) {
  segChunks[seg.idx].forEach((t, ci) => tasks.push({ type: "chunk", idx: seg.idx, ci, title: seg.title }));
  if (seg.enrich) tasks.push({ type: "enrich", idx: seg.idx, title: seg.title });
}
for (const fp of figpages) tasks.push({ type: "cap", page: fp.page });
console.log(`prose seg: ${segments.length}, figür sayfa: ${figpages.length}, toplam görev: ${tasks.length}`);

function pathFor(t) {
  if (t.type === "cap") return path.join(CACHE, `fig_p${String(t.page).padStart(3, "0")}.md`);
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
    const out = await call([
      { role: "system", content: SYSTEM },
      { role: "user", content: `Bölüm: "${t.title}". Parça ${t.ci + 1}/${chunks.length}. Çevir:\n\n${chunks[t.ci]}` },
    ]);
    fs.writeFileSync(p, out + "\n");
    return `ok ${out.length}`;
  } else if (t.type === "enrich") {
    const ctx = segChunks[t.idx].join("\n\n").slice(0, 9000);
    const out = await call([
      { role: "system", content: ENRICH },
      { role: "user", content: `Bölüm başlığı: "${t.title}".\nBölüm içeriğinden örnek:\n${ctx}` },
    ]);
    fs.writeFileSync(p, out + "\n");
    return `enrich ${out.length}`;
  } else {
    const fp = figpages.find((f) => f.page === t.page);
    const list = fp.caps.map((c) => `Figure ${c.num}: ${c.en}`).join("\n");
    const out = await call([
      { role: "system", content: CAPSYS },
      { role: "user", content: `Sayfa ${t.page} şekil altyazıları:\n${list}` },
    ]);
    fs.writeFileSync(p, out + "\n");
    return `cap ${fp.caps.length}`;
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
        const id = t.type === "cap" ? `p${t.page}` : `seg${t.idx}${t.ci !== undefined ? "#" + t.ci : ""}`;
        console.log(`[${done}/${pending.length}] ${id} ${t.type} -> ${r}`);
      } catch (e) {
        console.error(`HATA ${t.type} ${t.page || t.idx}: ${e.message}`);
      }
    }
  });
  await Promise.all(workers);
  clearInterval(hb);
  const left = tasks.filter((t) => !(fs.existsSync(pathFor(t)) && fs.statSync(pathFor(t)).size > 0)).length;
  console.log(left === 0 ? "TÜMÜ BİTTİ" : `KALAN: ${left}`);
}
run().catch((e) => { console.error("FATAL", e); process.exit(1); });
