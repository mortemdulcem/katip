// Trauma Biomechanics (Schmitt/Niederer/Muser/Walz, Springer 2. baskı) -> Türkçe akademik çeviri
// Kaynak: attached_assets/TBM_plain.txt (taranmış/OCR)  | Segmentler: scripts/tbm_chapters.json
// Cache: scripts/tbm_cache/  | Birleştirme ayrı adımda (assemble_tbm.py)
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SRC = "attached_assets/TBM_plain.txt";
const CACHE = "scripts/tbm_cache";
const MAX_CHARS = 8000;
const CONCURRENCY = 4;
fs.mkdirSync(CACHE, { recursive: true });

const allLines = fs.readFileSync(SRC, "utf8").split("\n");
const segments = JSON.parse(fs.readFileSync("scripts/tbm_chapters.json", "utf8"));

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

const SYSTEM = `Sen travma-biyomekaniği (injury/trauma biomechanics) alanında uzman, akademik düzeyde bir Türkçe çevirmen-editörsün. Bu alan TIP/ANATOMİ/ORTOPEDİ + MEKANİK/FİZİK + OTOMOTİV GÜVENLİĞİ MÜHENDİSLİĞİ + SPOR HEKİMLİĞİ kesişimidir. DİKKAT: Bu YAZILIM MÜHENDİSLİĞİ DEĞİLDİR; "yük (load)", "kütüphane", "mimari" gibi terimleri ASLA bilişim anlamında çevirme — hepsi mekanik/anatomik/mühendislik anlamındadır. Kitap: "Trauma Biomechanics — Accidental injury in traffic and sports" (Schmitt, Niederer, Muser, Walz; Springer, 2. baskı 2007). Hedef okur: adli tıp uzmanları, ortopedistler, biyomedikal/otomotiv mühendisleri, spor hekimleri, kaza araştırmacıları.

KAYNAK NİTELİĞİ: Metin TARANMIŞ bir kitaptan OCR ile çıkarılmıştır; bol OCR hatası içerir (ör. "Trauma-Biomechan cs"->"Trauma-Biomechanics", ".965"->"1965", "adn"->"and", "conuntermeasures"->"countermeasures", kelime-içi kopuk boşluk, l/i/1 ve O/0 karışması, bozuk satır kırılması, sayfa üstbilgisi olarak tek başına sayfa numarası + bölüm adı tekrarı). Bunları anlamı koruyarak DÜZELT; sayfa numarası/üstbilgi/altbilgi/filigran METİN DEĞİLDİR, at.

KURALLAR — her parçayı çevir ve SADECE Türkçe Markdown döndür:

1) TERMİNOLOJİ (azami dikkat — alana özgü doğru karşılık): Türkçe karşılığın yanında ilk geçişte parantezle İngilizce/Latince orijinali ver. Örnekler:
   - Mekanik/fizik: kuvvet (force), ivme (acceleration), yavaşlama/deselerasyon (deceleration), darbe/çarpma (impact), momentum, enerji (energy), gerilme (stress), gerinim/zorlanma (strain), tork/moment (torque/moment), atalet (inertia), yer çekimi ivmesi (g), basınç (pressure), elastik/viskoelastik (elastic/viscoelastic), rijit (rigid), eşik değer (threshold), tolerans (tolerance).
   - Yaralanma bilimi: yaralanma kriteri (injury criterion), Kafa Yaralanması Kriteri (HIC, Head Injury Criterion), Kısaltılmış Yaralanma Ölçeği (AIS, Abbreviated Injury Scale), Viskoz Kriter (V*C, Viscous Criterion), künt travma (blunt trauma), penetran yaralanma (penetrating injury), kamçı/whiplash yaralanması (WAD, whiplash associated disorder).
   - Otomotiv/test: çarpışma testi mankeni / antropomorfik test cihazı (ATD, crash test dummy), emniyet kemeri (seat belt), hava yastığı (airbag), Hybrid III, Euro-NCAP, FMVSS, ECE/UNECE regülasyonları, sled test (kızak testi), full-scale crash test (tam ölçekli çarpışma testi).
   - Anatomi/tıp: Latince anatomik adlar KORUNUR (foramen magnum, vertebra, femur, tibia, fibula, sternum, kosta/costae, pelvis, humerus). kafatası (kranium/skull), beyin sarsıntısı/konküzyon (concussion), diffüz aksonal yaralanma (DAI), subdural/epidural hematom, kontüzyon/ezik (contusion), kırık (fracture), çıkık (dislocation), servikal omurga (cervical spine), spinal kord (medulla spinalis).
   - Birimler AYNEN korunur: g, m/s, km/h, mph, kN, N, ms, Nm, Hz, mm, MPa, J. (mph verildiyse parantezle ~km/h verme zorunlu değil; sayıyı değiştirme.)

2) ANLAM/OCR DÜZELTME: Bozuk/kopuk kelime ve cümleleri doğru, akıcı, bilimsel Türkçeye onar; ANLAMI ve SAYILARI değiştirme. Bir sayı OCR'da açıkça bozulmuş ve kurtarılamıyorsa en olası okumayı koru ve "(OCR; doğrulanmalı)" notu düş. UYDURMA veri/sonuç/sayı/kaynak EKLEME.

3) YAPI: Başlıkları Markdown başlığı yap (## bölüm alt başlığı, ### daha alt). Listeler Markdown listesi. Tablolar GERÇEK Markdown tablosu (2. satırda |---| ayraç ZORUNLU); OCR'dan gelen tablo verisini sadık biçimde aktar, hücre uydurma. Şekil/Tablo atıflarını Türkçeleştir ama numarayı koru: "Fig. 4.3"->"Şekil 4.3", "Figure 4.3"->"Şekil 4.3", "Table 2.1"->"Tablo 2.1". Şekil ALTYAZILARINI da çevir ("Şekil 1.1 ...").

4) ÇEVİRMEN NOTLARI (değerli, ölçülü): Kavramı netleştiren, klinik/adli/mühendislik pratiğine bağlayan, Türkiye bağlamına (adli tıp/Adli Tıp Kurumu, trafik kazası bilirkişiliği, Karayolları Trafik Kanunu, iş kazası/SGK, spor yaralanmaları) köprü kuran KISA notlar ekle. Biçim: "> **💬 Çevirmen notu:** ...". Yazarın metniyle KARIŞMAZ (her zaman blockquote). Her not gerçek değer katmalı; doldurma yok.

5) SADAKAT: İçeriği özetleme/atlama YOK — TAM çeviri; yazarın anlamı birebir korunur. Metindeki atıfları koru; UYDURMA kaynak/DOI/yazar/yıl/sayfa verme, emin olmadığın atıfı "doğrulanmalı" işaretle.

6) ÇIKTI: Sadece Türkçe Markdown. "İşte çeviri" gibi meta ifade yok; İngilizce orijinali tekrar yazma.`;

const ENRICH = `Sen travma-biyomekaniği ve adli tıp alanında uzman bir akademisyensin. Sana bir bölümün BAŞLIĞI ve kısa içerik örneği veriliyor. Bu bölümün sonuna eklenecek bir "ÇEVİRMEN EKİ" yaz (Türkçe, Markdown). Amaç: bölümü ileri, niş ve güncel ama GERÇEK bilgiyle donatmak.

İçerik (alt başlıklarla):
### 🔬 İleri ve Niş Bilgiler
- Kitabın değinmediği/yüzeysel geçtiği ileri, güncel ve yerleşik bilgiler (ör. yeni yaralanma kriterleri BrIC/BRIC, GAMBIT, Nij boyun kriteri, sonlu elemanlar insan modelleri GHBMC/THUMS, yeni nesil mankenler THOR, yaya koruması, yeni Euro-NCAP protokolleri — yalnızca bölümle GERÇEKTEN ilgiliyse).
### ⚖️ Türkiye / Mediko-legal & Mühendislik Bağlamı
- Türk bağlamı: adli tıp (Adli Tıp Kurumu), trafik kazası bilirkişiliği, Karayolları Trafik Kanunu, iş kazası/meslek hastalığı (SGK, 6331 sayılı İSG Kanunu), spor yaralanmaları — yalnızca gerçekten ilgili ve doğru olanları.
### 📚 Eksikler ve İleri Okuma (Kaynaklı)
- GERÇEK, yerleşik kaynaklar: Nahum & Melvin "Accidental Injury: Biomechanics and Prevention"; Yoganandan et al. "Frontiers in Head and Neck Trauma"; SAE/Stapp Car Crash Conference; IRCOBI proceedings; AAAM "Abbreviated Injury Scale"; ilgili regülasyonlar (FMVSS, ECE/UNECE), Euro-NCAP protokolleri.

KESİN KURALLAR: UYDURMA kaynak/DOI/sahte yazar-yıl-sayfa YOK. Yalnızca varlığından emin olduğun yerleşik kitap/regülasyon/landmark eseri ad ver; spesifik makale iddialarını "doğrulanmalı" diye işaretle. Abartma; bölümle gerçekten ilgili, doğru, yüksek bilgi-yoğunluklu içerik. Sadece Markdown döndür; başlığı "## 📝 Çevirmen Eki — [bölüm adı]" ile başlat.`;

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

const segChunks = {};
for (const seg of segments) segChunks[seg.num] = chunkText(allLines.slice(seg.start, seg.end).join("\n"));

const tasks = [];
for (const seg of segments) {
  const chunks = segChunks[seg.num];
  chunks.forEach((t, ci) => tasks.push({ type: "chunk", seg: seg.num, ci, title: seg.title }));
  if (seg.num > 0) tasks.push({ type: "enrich", seg: seg.num, title: seg.title });
}
console.log(`Segment: ${segments.length}, toplam görev: ${tasks.length}`);

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
