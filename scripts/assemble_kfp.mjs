import fs from "fs";
import path from "path";
const CACHE = "scripts/kfp_cache";
const chapters = JSON.parse(fs.readFileSync("scripts/kfp_chapters.json", "utf8"));
const allLines = fs.readFileSync("attached_assets/KFP_plain.txt", "utf8").split("\n");

const segs = [{ num: 0, title: "Ön Kısım (Önsöz, Teşekkür, Kısaltmalar)", start: 261, end: 621 }, ...chapters];
segs[segs.length - 1].end = Math.min(segs[segs.length - 1].end, 63337);

const MAX = 8000;
function chunkCount(text) {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  let n = 0, cur = "";
  for (const p of paras) { if ((cur + "\n\n" + p).length > MAX && cur) { n++; cur = p; } else cur = cur ? cur + "\n\n" + p : p; }
  if (cur) n++;
  return n;
}

const TR = {
  1: "Adli Otopsi", 2: "Ölümün Patofizyolojisi", 3: "İnsan Kalıntılarında Kimliklendirme",
  4: "Yaraların Patolojisi", 5: "Kafa ve Omurga Yaralanmaları", 6: "Göğüs ve Karın Yaralanmaları",
  7: "Kendi Eliyle Oluşturulan Yaralanmalar", 8: "Ateşli Silah ve Patlama Ölümleri",
  9: "Ulaşım/Trafik Yaralanmaları", 10: "İnsan Haklarının İhlali", 11: "Yanıklar ve Haşlanmalar",
  12: "Elektrik Kaynaklı Ölümler", 13: "Yaralanmanın Komplikasyonları", 14: "Asfiksi (Boğulma)",
  15: "Boyna Ölümcül Bası", 16: "Suda Boğulma (Immersiyon) Ölümleri",
  17: "İhmal, Açlık ve Hipotermi", 18: "Cinsel Suçlarla İlişkili Ölümler",
  19: "Gebelikle İlişkili Ölümler", 20: "Çocuk Cinayeti", 21: "Süt Çocuğunda Ani Ölüm",
  22: "Ölümcül Çocuk İstismarı", 23: "Cerrahi Girişimlerle İlişkili Ölümler",
  24: "Disbarik Ölümler ve Barotravma", 25: "Ani Ölümün Patolojisi",
  26: "Patolog için Adli Diş Hekimliği", 27: "Zehirlenmeler ve Patolog",
  28: "Alkolün Adli Yönleri", 29: "Karbonmonoksit Zehirlenmesi", 30: "Organofosfat Zehirlenmesi",
  31: "İlaçlarla Zehirlenme", 32: "Narkotik ve Halüsinojen Maddelere Bağlı Ölümler",
  33: "Aşındırıcı ve Metalik Zehirlenmeler", 34: "Organik Çözücülere Bağlı Ölümler",
};

let md = "";
md += "% Knight's Adli Patoloji — Türkçe Akademik Çeviri\n";
md += "% Saukko & Knight, 4. Baskı (CRC Press, 2015)\n\n";
md += "# Knight's Adli Patoloji (Knight's Forensic Pathology)\n\n";
md += "**Saukko P, Knight B. *Knight's Forensic Pathology*. 4. Baskı. Boca Raton: CRC Press; 2015.**\n\n";
md += "> **💬 Çevirmen önsözü:** Bu belge, adli patolojinin standart başvuru eserlerinden Knight's Forensic Pathology (4. baskı) kitabının tam metninin Türkçe akademik çevirisidir. Çeviri; tıbbi, anatomik, patolojik, adli ve mediko-legal terminolojiye azami özen gösterilerek yapılmış; yerleşik Türkçe karşılığı bulunmayan veya anlam kayması riski taşıyan terimlerin yanına parantez içinde İngilizce/Latince orijinalleri eklenmiştir. Metin boyunca **💬 Çevirmen notu** etiketli açıklamalar kavramları netleştirir ve Türkiye adli tıp pratiğine (Adli Tıp Kurumu, CMK, TCK) köprü kurar. **Her bölümün sonunda**, ilgili literatür ve standart başvuru eserlerine dayanan **📝 Çevirmen Eki** (ileri/niş bilgiler, mediko-legal bağlam, eksikler ve kaynaklı ileri okuma) yer alır. Uydurma kaynak, DOI veya veri kullanılmamıştır; doğrulanması gereken noktalar açıkça belirtilmiştir.\n\n";
md += "\\newpage\n\n";

for (const s of segs) {
  const text = allLines.slice(s.start, s.end).join("\n");
  const n = chunkCount(text);
  const heading = s.num === 0 ? `# ${s.title}` : `# Bölüm ${s.num}: ${TR[s.num] || s.title} *(${s.title})*`;
  md += heading + "\n\n";
  for (let ci = 0; ci < n; ci++) {
    const p = path.join(CACHE, `ch${String(s.num).padStart(2, "0")}_chunk${String(ci).padStart(2, "0")}.md`);
    if (fs.existsSync(p)) md += fs.readFileSync(p, "utf8").replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim() + "\n\n";
    else { console.error("EKSIK", p); process.exit(1); }
  }
  if (s.num > 0) {
    const e = path.join(CACHE, `ch${String(s.num).padStart(2, "0")}_enrich.md`);
    if (fs.existsSync(e)) md += "\n" + fs.readFileSync(e, "utf8").replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim() + "\n\n";
  }
  md += "\\newpage\n\n";
}

fs.writeFileSync("scripts/kfp_full.md", md);
console.log("kfp_full.md yazildi:", md.length, "karakter,", md.split("\n").length, "satir");
