#!/usr/bin/env node
/**
 * TOMEC §2.11 — Korpus kalite analizi (yeniden üretilebilir).
 * Girdi: scripts/sinerji_dump/refined_v5_dusuk_erken_v2.json (n=571).
 * Alan: her kararın full_metin (ortalama 26K karakter) üzerinde regex tarama.
 * Çıktı: stdout tablosu + scripts/analysis_quality_report.json.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const datasetPath = path.join(__dirname, 'sinerji_dump', 'refined_v5_dusuk_erken_v2.json');
const raw = fs.readFileSync(datasetPath);
const sha = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
const data = JSON.parse(raw);

const FP_PATTERNS = [
  /Kanunsuz emir/i,
  /FETÖ.*PDY/i,
  /darbe teşebbüsü/i,
  /Yurtta Sulh Konseyi/i,
  /askeri hizmete müteallik/i,
  /silahlı terör örgütü/i,
];
const OBS_PATTERNS = [
  /erken doğum/i,
  /düşük yap/i,
  /missed abortus/i,
  /plasenta dekolman/i,
  /intrauterin/i,
  /fetus|fetüs|cenin/i,
  /gebeliğ.*kayb/i,
  /hamile.*darp|darp.*hamile/i,
  /preeklampsi/i,
  /HELLP/i,
  /sezaryen|sezeryan/i,
  /ölü doğum/i,
];
const MM_PATTERNS = [
  /hizmet kusur/i,
  /ATK.*kurul/i,
  /malpraktis/i,
  /tıbbi.*ihmal/i,
];

const buckets = { fp: 0, obs: 0, mm: 0, clean: 0 };
const byTipObs = {}, byTipFp = {}, byTipClean = {};

data.forEach(r => {
  const t = (r.full_metin || r.kesit || '').toString();
  const isFP = FP_PATTERNS.some(p => p.test(t));
  const isObs = OBS_PATTERNS.some(p => p.test(t));
  const isMM = MM_PATTERNS.some(p => p.test(t));
  if (isFP) { buckets.fp++; byTipFp[r.tipadi] = (byTipFp[r.tipadi] || 0) + 1; }
  if (isObs) { buckets.obs++; byTipObs[r.tipadi] = (byTipObs[r.tipadi] || 0) + 1; }
  if (isMM) buckets.mm++;
  if (isObs && !isFP) {
    buckets.clean++;
    byTipClean[r.tipadi] = (byTipClean[r.tipadi] || 0) + 1;
  }
});

const N = data.length;
const pct = x => `${(100 * x / N).toFixed(1)}%`;
const report = {
  dataset: path.basename(datasetPath),
  sha256_prefix: sha,
  n: N,
  fp_motifs: FP_PATTERNS.map(p => p.source),
  obs_motifs: OBS_PATTERNS.map(p => p.source),
  mm_motifs: MM_PATTERNS.map(p => p.source),
  counts: {
    fp_boilerplate: { n: buckets.fp, pct: pct(buckets.fp) },
    obstetric_motif: { n: buckets.obs, pct: pct(buckets.obs) },
    medmal_signal: { n: buckets.mm, pct: pct(buckets.mm) },
    clean_obstetric: { n: buckets.clean, pct: pct(buckets.clean) },
  },
  by_court_clean: byTipClean,
  by_court_obs: byTipObs,
  by_court_fp: byTipFp,
};
console.log('=== TOMEC §2.11 KORPUS KALİTE RAPORU ===');
console.log('Dosya:', report.dataset, '| SHA256[0..16]:', sha, '| n:', N);
console.log('Boilerplate FP motif eşleşen:', buckets.fp, pct(buckets.fp));
console.log('Saf obstetrik motif eşleşen:', buckets.obs, pct(buckets.obs));
console.log('Tıbbi malpraktis sinyali içeren:', buckets.mm, pct(buckets.mm));
console.log('Saf obstetrik + boilerplate temiz:', buckets.clean, pct(buckets.clean));
console.log('--- Saf-obstetrik mahkeme dağılımı ---');
Object.entries(byTipClean).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(' ', k, ':', v));

const outPath = path.join(__dirname, 'analysis_quality_report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log('\nÇıktı yazıldı:', path.relative(process.cwd(), outPath));
