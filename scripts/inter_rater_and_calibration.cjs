#!/usr/bin/env node
/**
 * TOMEC §2.12 — Inter-rater agreement (Cohen κ) + uluslararası kalibrasyon.
 * Rater 1 (uzman): kullanıcı manuel etiketleri (REL/PARTIAL/IRR).
 * Rater 2 (LLM): GPT-4o, aynı kesit verisi + aynı şema, bağımsız.
 * Çıktı: scripts/interrater_and_calibration_report.json + stdout.
 */
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai').default;

const samples = require('./data/sample35.json');
const N = samples.length; // 35
const MODEL = 'gpt-4o'; // proxy yalnızca alias’ı destekliyor; pinli versiyon (gpt-4o-2024-08-06) reddediliyor
const SEED = 20260512;
let _rngState = SEED;
function seededRandom() {
  _rngState = (_rngState * 1664525 + 1013904223) % 0x100000000;
  return _rngState / 0x100000000;
}
const SNAPSHOT_PATH = path.join(__dirname, 'data', 'rater2_gpt4o_snapshot.json');
const USE_SNAPSHOT = fs.existsSync(SNAPSHOT_PATH) && process.env.REFRESH_LLM !== '1';

// ---- Rater 1: uzman okuyucu (manuel) ----
const R1 = {
  1: 'REL', 2: 'REL', 3: 'IRR', 4: 'IRR', 5: 'IRR', 6: 'IRR', 7: 'IRR',
  8: 'IRR', 9: 'IRR', 10: 'IRR', 11: 'IRR', 12: 'REL', 13: 'PARTIAL',
  14: 'PARTIAL', 15: 'REL', 16: 'PARTIAL', 17: 'PARTIAL', 18: 'PARTIAL',
  19: 'IRR', 20: 'PARTIAL', 21: 'REL', 22: 'PARTIAL', 23: 'REL', 24: 'REL',
  25: 'IRR', 26: 'REL', 27: 'IRR', 28: 'IRR', 29: 'REL', 30: 'REL',
  31: 'PARTIAL', 32: 'REL', 33: 'IRR', 34: 'IRR', 35: 'REL',
};

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `Sen adli tıp + obstetri uzmanı bir okuyucusun. Sana bir Türk yargı kararından kesit verilecek. Kararı şu üç kategoriden birine etiketle:

REL = Karar doğrudan "gebe kadına yönelik travma → obstetrik komplikasyon (düşük, erken doğum, dekolman, fetal/neonatal ölüm, intrauterin ölüm, sezaryen komplikasyonu)" konusunu içeriyor; TCK m.87/88 veya obstetrik tıbbi malpraktis bağlamında.
PARTIAL = Gebelik veya düşük yan-referans olarak geçiyor (örn. boşanma davasında "düşük yaptım" beyanı, kişisel öyküde gebelik kaybı zikri, embriyo davası), ancak karar konusu doğrudan gebelikte travma–komplikasyon değil.
IRR = Konuyla ilgisiz: FETÖ/darbe/silahlı terör boilerplate, askeri yargılama, gebe olmayan adam öldürme, vs.

Yalnızca tek kelime cevap ver: REL, PARTIAL veya IRR.`;

async function labelOne(s) {
  try {
    const resp = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0,
      seed: SEED,
      max_tokens: 5,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Karar tipi: ${s.tip} ${s.daire} | Esas: ${s.esas} | Sinyaller: ${s.signals.join(', ')}\n\nKesit:\n${s.kesit}` },
      ],
    });
    const out = (resp.choices[0].message.content || '').trim().toUpperCase();
    if (out.startsWith('REL')) return 'REL';
    if (out.startsWith('PAR')) return 'PARTIAL';
    if (out.startsWith('IRR')) return 'IRR';
    return 'IRR';
  } catch (e) {
    console.error('LLM hata no=', s.no, e.message);
    return 'ERR';
  }
}

function cohenKappa(a, b) {
  const cats = ['REL', 'PARTIAL', 'IRR'];
  const n = a.length;
  let agree = 0;
  const m1 = {}, m2 = {};
  cats.forEach(c => { m1[c] = 0; m2[c] = 0; });
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) agree++;
    m1[a[i]]++; m2[b[i]]++;
  }
  const po = agree / n;
  const pe = cats.reduce((s, c) => s + (m1[c] / n) * (m2[c] / n), 0);
  const k = (po - pe) / (1 - pe);
  return { kappa: k, po, pe, n, agree };
}

function bootstrapKappaCI(a, b, B = 2000) {
  const n = a.length;
  const ks = [];
  _rngState = SEED;
  for (let b_i = 0; b_i < B; b_i++) {
    const aa = [], bb = [];
    for (let i = 0; i < n; i++) {
      const j = Math.floor(seededRandom() * n);
      aa.push(a[j]); bb.push(b[j]);
    }
    const r = cohenKappa(aa, bb);
    if (Number.isFinite(r.kappa)) ks.push(r.kappa);
  }
  ks.sort((x, y) => x - y);
  return { lo: ks[Math.floor(0.025 * ks.length)], hi: ks[Math.floor(0.975 * ks.length)], B: ks.length };
}

// ---- Uluslararası kalibrasyon ----
// Türk korpusu (n=313 saf obstetrik) içinde alt-grup motif sayıları —
// regex tabanlı kaba indikatörler.
function countTurkishSubgroups() {
  const data = require('./sinerji_dump/refined_v5_dusuk_erken_v2.json');
  const FP = [/Kanunsuz emir/i, /FETÖ.*PDY/i, /darbe teşebbüsü/i, /Yurtta Sulh Konseyi/i, /askeri hizmete müteallik/i, /silahlı terör örgütü/i];
  const OBS = [/erken doğum/i, /düşük yap/i, /missed abortus/i, /plasenta dekolman/i, /intrauterin/i, /fetus|fetüs|cenin/i, /gebeliğ.*kayb/i, /hamile.*darp|darp.*hamile/i, /preeklampsi/i, /HELLP/i, /sezaryen|sezeryan/i, /ölü doğum/i];
  const clean = data.filter(r => {
    const t = (r.full_metin || r.kesit || '').toString();
    return OBS.some(p => p.test(t)) && !FP.some(p => p.test(t));
  });
  const buckets = { abruption: 0, fetal_death: 0, preterm: 0, mvc: 0, ipv: 0, blunt_abdominal: 0 };
  clean.forEach(r => {
    const t = (r.full_metin || r.kesit || '').toString();
    if (/dekolman/i.test(t)) buckets.abruption++;
    if (/intrauterin.*öl|fetal öl|fetus öl|cenin öl|ölü doğum/i.test(t)) buckets.fetal_death++;
    if (/erken doğum|prematür/i.test(t)) buckets.preterm++;
    if (/trafik kaza|motorlu taşıt|araç kaza/i.test(t)) buckets.mvc++;
    if (/aile içi şiddet|eş.*darp|kadına.*şiddet/i.test(t)) buckets.ipv++;
    if (/künt.*batın|batın travma|karın.*darp/i.test(t)) buckets.blunt_abdominal++;
  });
  return { n_clean: clean.length, buckets };
}

// 2x2 chi-square + OR (95% CI) için yardımcı
function or2x2(a, b, c, d) {
  // a/b vs c/d  : a=Türk-pozitif, b=Türk-negatif, c=Lit-pozitif, d=Lit-negatif
  if (a === 0 || b === 0 || c === 0 || d === 0) {
    a += 0.5; b += 0.5; c += 0.5; d += 0.5;
  }
  const or = (a * d) / (b * c);
  const seLn = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
  const lnOR = Math.log(or);
  const lo = Math.exp(lnOR - 1.96 * seLn);
  const hi = Math.exp(lnOR + 1.96 * seLn);
  // chi-square (Yates-corrected)
  const N = a + b + c + d;
  const num = N * Math.pow(Math.abs(a * d - b * c) - N / 2, 2);
  const den = (a + b) * (c + d) * (a + c) * (b + d);
  const chi = num / den;
  // p-value approximation for df=1
  const p = Math.exp(-chi / 2); // crude upper-bound; for reporting only
  return { or: or.toFixed(2), ci: `${lo.toFixed(2)}–${hi.toFixed(2)}`, chi: chi.toFixed(2), p_approx: p.toExponential(2) };
}

(async () => {
  let r2Results;
  if (USE_SNAPSHOT) {
    console.log('=== Rater 2 (' + MODEL + ') snapshot kullanılıyor: ' + path.relative(process.cwd(), SNAPSHOT_PATH) + ' ===');
    r2Results = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  } else {
    console.log('=== Rater 2 (' + MODEL + ', seed=' + SEED + ') etiketleme başlıyor — n=' + N + ' ===');
    const r2Promises = samples.map(s => labelOne(s).then(l => ({ no: s.no, label: l })));
    r2Results = await Promise.all(r2Promises);
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(r2Results, null, 2));
    console.log('Snapshot kaydedildi:', path.relative(process.cwd(), SNAPSHOT_PATH));
  }
  const R2 = {};
  r2Results.forEach(x => { R2[x.no] = x.label; });

  const a = [], b = [];
  samples.forEach(s => { a.push(R1[s.no]); b.push(R2[s.no]); });

  const k = cohenKappa(a, b);
  const ci = bootstrapKappaCI(a, b, 2000);

  console.log('\n--- Etiket karşılaştırma tablosu ---');
  console.log('No | R1(uzman) | R2(GPT-4o) | Eşleşme');
  samples.forEach(s => {
    console.log(`${String(s.no).padStart(2)} | ${R1[s.no].padEnd(7)} | ${R2[s.no].padEnd(7)} | ${R1[s.no] === R2[s.no] ? '✓' : '✗'}`);
  });

  console.log('\n--- Cohen κ ---');
  console.log('Eşleşme (po):', (k.po * 100).toFixed(1) + '%', '(' + k.agree + '/' + k.n + ')');
  console.log('Şans-eşleşme (pe):', k.pe.toFixed(3));
  console.log('κ:', k.kappa.toFixed(3), '| %95 CI:', ci.lo.toFixed(3), '–', ci.hi.toFixed(3), '(bootstrap B=' + ci.B + ')');
  const interp = k.kappa < 0.2 ? 'zayıf' : k.kappa < 0.4 ? 'düşük' : k.kappa < 0.6 ? 'orta' : k.kappa < 0.8 ? 'iyi' : 'çok iyi (Landis-Koch)';
  console.log('Yorum:', interp);

  console.log('\n=== Uluslararası kalibrasyon ===');
  const sub = countTurkishSubgroups();
  console.log('Türk korpusu temiz alt-küme n =', sub.n_clean);
  console.log('Alt-grup sayıları:', sub.buckets);

  // Karşılaştırmalar (Türk = sub.buckets, Litaratür benchmark oranları)
  // El Kady 2004 — n=10316 hospitalize gebe travma
  const elKady = { n: 10316, abruption: Math.round(0.035 * 10316), fetal_death: Math.round(0.020 * 10316), preterm: Math.round(0.225 * 10316) };
  // Aboutanos 2007 — n=321 trauma center
  const aboutanos = { n: 321, fetal_death: Math.round(0.10 * 321) };
  // Schiff 2002 — Washington MVC (kategori-spesifik OR; biz kategori karşılaştırması yapacağız)

  const cmp = {};
  cmp.abruption_vs_elKady = or2x2(sub.buckets.abruption, sub.n_clean - sub.buckets.abruption, elKady.abruption, elKady.n - elKady.abruption);
  cmp.fetal_death_vs_elKady = or2x2(sub.buckets.fetal_death, sub.n_clean - sub.buckets.fetal_death, elKady.fetal_death, elKady.n - elKady.fetal_death);
  cmp.preterm_vs_elKady = or2x2(sub.buckets.preterm, sub.n_clean - sub.buckets.preterm, elKady.preterm, elKady.n - elKady.preterm);
  cmp.fetal_death_vs_aboutanos = or2x2(sub.buckets.fetal_death, sub.n_clean - sub.buckets.fetal_death, aboutanos.fetal_death, aboutanos.n - aboutanos.fetal_death);

  Object.entries(cmp).forEach(([k, v]) => {
    console.log(k, '→ OR =', v.or, '(95% CI', v.ci + ')', 'χ² =', v.chi, 'p≈', v.p_approx);
  });

  const out = {
    inter_rater: {
      n: N, agree: k.agree, po: k.po, pe: k.pe, kappa: k.kappa,
      ci95_bootstrap: { lo: ci.lo, hi: ci.hi, B: ci.B },
      landis_koch: interp,
      labels: samples.map(s => ({ no: s.no, R1: R1[s.no], R2: R2[s.no], match: R1[s.no] === R2[s.no] })),
    },
    calibration: {
      turkish_clean_n: sub.n_clean, turkish_buckets: sub.buckets,
      benchmarks: { elKady, aboutanos }, comparisons: cmp,
      caveat: 'Türk korpusu yargı kararı korpusudur; popülasyon-tabanlı klinik insidans değil. Bu nedenle OR mutlak risk farkı değil, korpus içi göreli prevalans karşılaştırmasıdır.',
    },
  };
  fs.writeFileSync(path.join(__dirname, 'interrater_and_calibration_report.json'), JSON.stringify(out, null, 2));
  console.log('\nÇıktı:', 'scripts/interrater_and_calibration_report.json');
})();
