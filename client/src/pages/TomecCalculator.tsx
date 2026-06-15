import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/Sidebar";
import { Scale, Calculator, FileText, Printer, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

type ParamDef = { key: string; label: string; options: { v: number; t: string }[] };

const T_PARAMS: ParamDef[] = [
  { key: "t_energy", label: "Enerji düzeyi (kinetik yük)", options: [
    { v: 0, t: "Belgelenmemiş / yok" },
    { v: 10, t: "Minimal (<5 kJ)" },
    { v: 22, t: "Düşük (5–20 kJ)" },
    { v: 32, t: "Orta (20–50 kJ)" },
    { v: 40, t: "Yüksek (>50 kJ)" },
  ]},
  { key: "t_anatomic", label: "Anatomik etki alanı", options: [
    { v: 0, t: "Yok" },
    { v: 8, t: "Periferik (uzak ekstremite)" },
    { v: 15, t: "Toraks/orta hat" },
    { v: 25, t: "Abdominal/pelvik kritik alan" },
  ]},
  { key: "t_multi", label: "Çoklu bölge çarpanı", options: [
    { v: 0, t: "Tek bölge" },
    { v: 10, t: "≥2 majör bölge (+10)" },
  ]},
  { key: "t_dic", label: "DIC göstergeleri (Queensland MN19.31 Tablo 24)", options: [
    { v: 0, t: "Yok / değerlendirilmedi" },
    { v: 5, t: "Tek belirteç (D-dimer ↑↑)" },
    { v: 12, t: "İki belirteç (D-dimer + fibrinojen <2 g/L)" },
    { v: 18, t: "Üç+ belirteç (DIC tanı kriteri)" },
  ]},
];

const O_PARAMS: ParamDef[] = [
  { key: "o_gestation", label: "Gestasyon dönemi", options: [
    { v: 5, t: "<6 hafta (implantasyon)" },
    { v: 18, t: "6–12 hafta (organogenezis)" },
    { v: 25, t: "13–22 hafta (mid-trimester)" },
    { v: 30, t: "23–27 hafta (viabilite sınırı)" },
    { v: 28, t: "28–36 hafta (yüksek prematürite)" },
    { v: 15, t: "≥37 hafta (term)" },
  ]},
  { key: "o_placenta", label: "Plasenta yerleşimi", options: [
    { v: 0, t: "Posterior, normal" },
    { v: 5, t: "Anterior, normal (+5)" },
    { v: 8, t: "Plasenta previa marginal (+8)" },
    { v: 12, t: "Plasenta previa totalis / akreta (+12)" },
  ]},
  { key: "o_kb", label: "Kleihauer-Betke testi (FMH)", options: [
    { v: 0, t: "Yapılmadı / negatif" },
    { v: 5, t: "Pozitif, 1–4 mL fetal kan" },
    { v: 10, t: "Pozitif, >4 mL (masif FMH)" },
  ]},
  { key: "o_modulator", label: "Genetik / çevresel stres modülatörü", options: [
    { v: -5, t: "Koruyucu (-5)" },
    { v: 0, t: "Nötr" },
    { v: 5, t: "Hafif risk artışı (+5)" },
    { v: 10, t: "Belirgin risk artışı (+10)" },
  ]},
];

const M_PARAMS: ParamDef[] = [
  { key: "m_comorb", label: "Komorbidite profili (HT, DM, kardiyak, renal)", options: [
    { v: 0, t: "Yok" },
    { v: 10, t: "Tek hafif (örn. kontrollü HT)" },
    { v: 20, t: "Çoklu / orta düzey" },
    { v: 30, t: "Ağır / dekompanse" },
  ]},
  { key: "m_shock", label: "Hemodinamik stabilite (şok)", options: [
    { v: 0, t: "Stabil" },
    { v: 10, t: "Hafif (taşikardi, normotansif)" },
    { v: 20, t: "Hipotansif / şok bulguları" },
  ]},
  { key: "m_psych", label: "Psikiyatrik travma (DSM-5; TCK m.87 'ruh sağlığında bozulma')", options: [
    { v: 0, t: "Yok / değerlendirilmedi" },
    { v: 3, t: "Anksiyete bozukluğu (yeni başlangıçlı, +3)" },
    { v: 5, t: "Akut stres bozukluğu (1 ay içinde, +5)" },
    { v: 5, t: "Majör depresif bozukluk (travma sonrası, +5)" },
    { v: 10, t: "TSSB tanısı (yapılandırılmış görüşme, +10)" },
  ]},
  { key: "m_history", label: "Önceki obstetrik öykü", options: [
    { v: 0, t: "Özellik yok" },
    { v: 3, t: "Önceki preterm doğum (+3)" },
    { v: 3, t: "≥1 önceki sezaryen (+3)" },
    { v: 5, t: "Önceki abrupsiyon (+5)" },
  ]},
];

const E_PARAMS: ParamDef[] = [
  { key: "e_type", label: "Travma tipi", options: [
    { v: 10, t: "Düşük enerjili künt (sürtünme, hafif darbe)" },
    { v: 20, t: "Orta enerjili künt" },
    { v: 28, t: "Ağır künt (yüksek hızlı çarpma)" },
    { v: 30, t: "Kesici / delici" },
    { v: 35, t: "Ateşli silah" },
  ]},
  { key: "e_pattern", label: "Eylem örüntüsü", options: [
    { v: 0, t: "Tek atış / tekil" },
    { v: 10, t: "Tekrarlı (≥2 darbe)" },
    { v: 18, t: "Tekrarlı + hedeflenmiş abdominal" },
    { v: 25, t: "Sürekli + hedefli + korumasız (sistematik)" },
  ]},
  { key: "e_intent", label: "Manevi unsur (kasıt düzeyi)", options: [
    { v: 0, t: "Basit taksir (gebelikten habersiz)" },
    { v: 3, t: "Bilinçli taksir (+3)" },
    { v: 8, t: "Olası kast (görünür gebelik, non-abdominal alan, +8)" },
    { v: 15, t: "Doğrudan kast (gebe kadın hedef, abdominal +15)" },
  ]},
];

const C_PARAMS: ParamDef[] = [
  { key: "c_latent", label: "Latent süre (travma → komplikasyon)", options: [
    { v: 40, t: "0–6 saat (Acil)" },
    { v: 28, t: "6–72 saat (Akut)" },
    { v: 15, t: "72 saat – 4 hafta (Geç)" },
    { v: 5, t: ">4 hafta (Zayıf temporallik)" },
  ]},
  { key: "c_doc", label: "Dokümantasyon kalitesi", options: [
    { v: -10, t: "Çok zayıf (kayıt eksik, çelişkili)" },
    { v: 0, t: "Yetersiz" },
    { v: 5, t: "Yeterli (kayıt var)" },
    { v: 10, t: "Mükemmel (kamera + ambulans + acil + obstetrik kayıt)" },
  ]},
  { key: "c_alt", label: "Alternatif neden dışlama", options: [
    { v: -10, t: "Güçlü alternatif neden mevcut" },
    { v: 0, t: "Belirsiz" },
    { v: 5, t: "Kısmen dışlandı" },
    { v: 10, t: "Tam dışlandı (objektif isnadiyet açısından zincir kesintisiz)" },
  ]},
  { key: "c_ctg", label: "CTG bulguları (Queensland: ≥4 saat monitörizasyon)", options: [
    { v: 0, t: "Yapılmadı / değerlendirilemedi" },
    { v: 5, t: "Reasürre edici (4 saat)" },
    { v: 10, t: "Patolojik (geç deselerasyon, sinusoidal, taşikardi)" },
  ]},
];

const DOMAINS: { key: "T"|"O"|"M"|"E"|"C"; name: string; weight: number; params: ParamDef[]; max: number; color: string }[] = [
  { key: "T", name: "T — Travma Niteliği / Şiddeti", weight: 0.25, params: T_PARAMS, max: 100, color: "#dc2626" },
  { key: "O", name: "O — Obstetrik Durum / Gestasyonel Dönem", weight: 0.20, params: O_PARAMS, max: 100, color: "#7c3aed" },
  { key: "M", name: "M — Maternal Komorbid / Fizyolojik", weight: 0.15, params: M_PARAMS, max: 100, color: "#0891b2" },
  { key: "E", name: "E — Eylem Mekanizması / Enerji", weight: 0.20, params: E_PARAMS, max: 100, color: "#ea580c" },
  { key: "C", name: "C — Kronolojik / Temporal İlişki", weight: 0.20, params: C_PARAMS, max: 100, color: "#16a34a" },
];

function categorize(score: number) {
  if (score >= 85) return { cat: "Kesin", color: "bg-red-600", legal: "TCK m.87/2-(e) veya m.87/1-(e) ağırlaştırıcı bentinin uygulanmasına yeterli düzeyde nedensellik desteği. Mahkeme nitelendirmesi münhasıran mahkemeye aittir." };
  if (score >= 70) return { cat: "Yüksek Olasılıklı", color: "bg-orange-600", legal: "Uygun illiyet teorisi açısından m.87 ağırlaştırıcı bentinin uygulanması savunulabilir; karşı kanıt aksini ortaya koymadıkça nedensellik kabul edilebilir." };
  if (score >= 55) return { cat: "Muhtemel", color: "bg-amber-500", legal: "Nedensellik makul olasılık dahilindedir; ek tıbbi inceleme veya bilirkişi heyeti raporu önerilir; m.86 (temel) + m.23 değerlendirmesi gerekebilir." };
  if (score >= 40) return { cat: "Mümkün", color: "bg-yellow-500", legal: "Nedensellik dışlanamaz fakat kanıt zayıftır; m.87 ağırlaştırıcı bent için yetersiz; alternatif neden değerlendirilmelidir." };
  if (score >= 25) return { cat: "Düşük", color: "bg-lime-500", legal: "Nedensellik düşük olasılıklıdır; ek delil yokluğunda m.87 ağırlaştırıcı bent önerilmez." };
  if (score >= 10) return { cat: "Uzak", color: "bg-emerald-500", legal: "Nedensellik uzak ihtimaldir; alternatif neden daha güçlüdür." };
  return { cat: "Yok", color: "bg-slate-500", legal: "Nedensel ilişki desteklenmemektedir." };
}

export default function TomecCalculator() {
  const [vals, setVals] = useState<Record<string, number>>({});

  const domainScores = useMemo(() => {
    const out: Record<"T"|"O"|"M"|"E"|"C", number> = { T: 0, O: 0, M: 0, E: 0, C: 0 };
    for (const d of DOMAINS) {
      let sum = 0;
      for (const p of d.params) sum += vals[p.key] ?? 0;
      sum = Math.max(0, Math.min(d.max, sum));
      out[d.key] = sum;
    }
    return out;
  }, [vals]);

  const total = useMemo(() => {
    let s = 0;
    for (const d of DOMAINS) s += domainScores[d.key] * d.weight;
    return Math.max(0, Math.min(100, s));
  }, [domainScores]);

  const cat = categorize(total);
  const filledCount = Object.keys(vals).length;
  const totalParams = DOMAINS.reduce((a, d) => a + d.params.length, 0);

  function reset() { setVals({}); }

  function exportReport() {
    const ts = new Date().toLocaleString("tr-TR");
    const lines: string[] = [];
    lines.push("TOMEC SKORLAMA RAPORU");
    lines.push("Travma Obstetrik Mediko-legal Causality Score");
    lines.push("=".repeat(60));
    lines.push(`Tarih: ${ts}`);
    lines.push("");
    for (const d of DOMAINS) {
      lines.push(`${d.name}  [Ağırlık: ${(d.weight * 100).toFixed(0)}%]`);
      lines.push(`  Domain puanı: ${domainScores[d.key].toFixed(1)} / 100`);
      lines.push(`  Ağırlıklı katkı: ${(domainScores[d.key] * d.weight).toFixed(2)}`);
      for (const p of d.params) {
        const v = vals[p.key];
        const optTxt = v != null ? p.options.find(o => o.v === v)?.t : "(seçilmedi)";
        lines.push(`    - ${p.label}: ${optTxt} [${v ?? 0}]`);
      }
      lines.push("");
    }
    lines.push("=".repeat(60));
    lines.push(`TOPLAM SKOR: ${total.toFixed(1)} / 100`);
    lines.push(`KATEGORİ: ${cat.cat}`);
    lines.push("");
    lines.push("HUKUKİ YORUM (BİLİRKİŞİ ÖNERİSİ):");
    lines.push(cat.legal);
    lines.push("");
    lines.push("UYARI: Bu çıktı BİLİRKİŞİ DESTEK ARACIDIR. Hukuki nitelendirme yetkisi münhasıran mahkemeye aittir.");
    lines.push("Referans: TOMEC Algoritması v2.0 (Travma Obstetrik Mediko-legal Causality Score).");
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TOMEC_Rapor_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6" data-testid="page-tomec-calculator">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
                <Scale className="w-8 h-8 text-primary" />
                TOMEC Hesaplayıcı
              </h1>
              <p className="text-muted-foreground mt-1">
                Travma Obstetrik Mediko-legal Causality Score — Algoritma v2.0
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} data-testid="button-reset">Sıfırla</Button>
              <Button onClick={exportReport} data-testid="button-export"><FileText className="w-4 h-4 mr-1" />Rapor (.txt)</Button>
              <Button variant="outline" onClick={() => window.print()} data-testid="button-print"><Printer className="w-4 h-4 mr-1" />Yazdır</Button>
            </div>
          </div>

          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20" data-testid="card-disclaimer">
            <CardContent className="pt-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Bilirkişi Destek Aracıdır.</strong> Bu hesaplayıcı, gebe kadına yönelik kasten yaralama (TCK m.87) sonrası obstetrik komplikasyonlarda fiil-sonuç illiyet bağının yapılandırılmış değerlendirmesi için tasarlanmıştır. <strong>Hukuki nitelendirme yetkisi münhasıran mahkemeye aittir.</strong> Çıktı, bilirkişi raporunun yapılandırılmış destek metni olarak kullanılır; tek başına delil değildir.
              </div>
            </CardContent>
          </Card>

          {/* Skorlama */}
          <Card className="sticky top-2 z-10 border-2 border-primary/40 shadow-lg" data-testid="card-score-summary">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                {DOMAINS.map(d => (
                  <div key={d.key} className="text-center" data-testid={`domain-summary-${d.key}`}>
                    <div className="text-xs text-muted-foreground">{d.key} ({(d.weight * 100).toFixed(0)}%)</div>
                    <div className="text-2xl font-bold" style={{ color: d.color }}>{domainScores[d.key].toFixed(0)}</div>
                  </div>
                ))}
                <div className="text-center md:col-span-1">
                  <div className="text-xs text-muted-foreground">TOPLAM</div>
                  <div className="text-3xl font-bold" data-testid="text-total-score">{total.toFixed(1)}</div>
                </div>
                <div className="text-center md:col-span-1">
                  <div className="text-xs text-muted-foreground">KATEGORİ</div>
                  <Badge className={`${cat.color} text-white text-base px-3 py-1`} data-testid="badge-category">{cat.cat}</Badge>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="text-sm text-muted-foreground flex items-start gap-2" data-testid="text-legal-interpretation">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <div><strong>Hukuki yorum (bilirkişi önerisi):</strong> {cat.legal}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2" data-testid="text-progress">
                <CheckCircle2 className="w-3 h-3" />
                {filledCount} / {totalParams} parametre dolduruldu
              </div>
            </CardContent>
          </Card>

          {/* Domains */}
          {DOMAINS.map(d => (
            <Card key={d.key} data-testid={`card-domain-${d.key}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                  <span style={{ color: d.color }}>{d.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Ağırlık: {(d.weight * 100).toFixed(0)}%</Badge>
                    <Badge>Domain: {domainScores[d.key].toFixed(0)} / 100</Badge>
                    <Badge variant="secondary">Katkı: {(domainScores[d.key] * d.weight).toFixed(2)}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.params.map(p => (
                  <div key={p.key} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                    <Label className="md:col-span-2 text-sm" htmlFor={`select-${p.key}`}>{p.label}</Label>
                    <div className="md:col-span-3">
                      <Select
                        value={vals[p.key]?.toString() ?? ""}
                        onValueChange={(val) => setVals(s => ({ ...s, [p.key]: parseInt(val) }))}
                      >
                        <SelectTrigger data-testid={`select-${p.key}`}>
                          <SelectValue placeholder="Seçiniz..." />
                        </SelectTrigger>
                        <SelectContent>
                          {p.options.map((o, i) => (
                            <SelectItem key={`${p.key}-${i}`} value={o.v.toString()} data-testid={`option-${p.key}-${i}`}>
                              [{o.v >= 0 ? `+${o.v}` : o.v}] {o.t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* References */}
          <Card data-testid="card-references">
            <CardHeader>
              <CardTitle className="text-base">Referans Çerçeve</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div>• Hill AB. The Environment and Disease: Association or Causation? Proc R Soc Med. 1965;58:295–300.</div>
              <div>• Roxin C. Gedanken zur Problematik der Zurechnung im Strafrecht. Festschrift Honig, 1970:133–150.</div>
              <div>• Collins GS, Reitsma JB, Altman DG, Moons KGM. TRIPOD Statement. Ann Intern Med. 2015;162(1):55–63.</div>
              <div>• Queensland Clinical Guidelines. Trauma in pregnancy. MN19.31-V2-R24. Queensland Health, August 2019.</div>
              <div>• Cenger CD ve ark. Travma sonrası erken gebelik kaybı: olgu sunumu. Med J SDU. 2018;25(2):194–199.</div>
              <div>• TCK Kanun No: 5237. Resmi Gazete 12.10.2004, sayı 25611.</div>
              <div>• Cohen J 1960; Fleiss JL 1971; Landis & Koch 1977; Lynn 1986; Polit & Beck 2006.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
