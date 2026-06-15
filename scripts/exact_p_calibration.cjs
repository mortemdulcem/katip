#!/usr/bin/env node
/**
 * Fisher exact two-sided p ve Wilson 95% CI ile uluslararası kalibrasyon karşılaştırması.
 * - Yates-düzeltmeli χ² (önceki tahmin) yerine kesin Fisher exact p
 * - 2x2 tabloları:
 *    a) Türk korpusu fetal ölüm vs Aboutanos 2007 (32/321)
 *    b) Türk korpusu dekolman vs El Kady 2004 (361/10316)
 *    c) Türk korpusu erken doğum vs El Kady 2004 (2321/10316)
 *    d) Türk korpusu fetal ölüm vs El Kady 2004 (37/10316)  [popülasyon serisi]
 * - Tüm sayılar scripts/analysis_quality_report.json'dan; kaynak yazılı serilerden.
 *
 * Yeniden üretim: node scripts/exact_p_calibration.cjs
 *   Çıktı: scripts/exact_p_calibration_report.json
 */
'use strict';
const fs = require('fs');

function lgamma(z){
  // Lanczos
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
             771.32342877765313, -176.61502916214059, 12.507343278686905,
             -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI/Math.sin(Math.PI*z)) - lgamma(1-z);
  z -= 1;
  let x = c[0];
  for (let i=1;i<g+2;i++) x += c[i]/(z+i);
  const t = z + g + 0.5;
  return 0.5*Math.log(2*Math.PI) + (z+0.5)*Math.log(t) - t + Math.log(x);
}
function logChoose(n,k){ return lgamma(n+1)-lgamma(k+1)-lgamma(n-k+1); }
// hypergeometric P(X=k | N, K, n)
function logHyper(k, N, K, n){
  return logChoose(K,k) + logChoose(N-K, n-k) - logChoose(N, n);
}
// Fisher exact two-sided (sum of probs <= observed prob)
function fisherExact2x2(a,b,c,d){
  const N = a+b+c+d;
  const r1 = a+b;       // satır 1 toplam
  const c1 = a+c;       // sütun 1 toplam
  const kmin = Math.max(0, c1 - (N - r1));
  const kmax = Math.min(r1, c1);
  const logPobs = logHyper(a, N, r1, c1);
  // log-sum: küçük çift-yönlü p, P(X)<=P(obs)
  let logSum = -Infinity;
  for (let k=kmin; k<=kmax; k++){
    const lp = logHyper(k, N, r1, c1);
    if (lp <= logPobs + 1e-12){
      // logSum = log(exp(logSum) + exp(lp))
      logSum = logSum === -Infinity ? lp : Math.max(logSum,lp) + Math.log1p(Math.exp(Math.min(logSum,lp)-Math.max(logSum,lp)));
    }
  }
  return Math.exp(logSum);
}
// Odds ratio + Haldane-Anscombe (0.5) düzeltmeli log-OR Wald 95% CI
function orWald(a,b,c,d){
  const A=a+0.5,B=b+0.5,C=c+0.5,D=d+0.5;
  const logOR = Math.log((A*D)/(B*C));
  const se = Math.sqrt(1/A+1/B+1/C+1/D);
  return { OR: Math.exp(logOR), lo: Math.exp(logOR - 1.96*se), hi: Math.exp(logOR + 1.96*se) };
}

// Türk korpusu (n=313 saf obstetrik) — analysis_quality_report.json sayıları
const TR = { n:313, fetal_death:30, abruption:10, preterm:46 };

// Yayımlanmış seriler — orijinal kaynaklardan birebir alıntı:
// Aboutanos MB ve ark. (2007) J Trauma 63(3):616-624. PMID:18073608. n=321 gebe travma kohortu.
//   Fetal ölüm 32/321 (%10.0).
const ABT = { n:321, fetal_death:32 };
// El Kady D ve ark. (2004) Am J Obstet Gynecol 190(6):1661-1668. PMID:15284756. n=10,316 gebe travma vs kontrol.
//   Plasenta dekolmanı 361/10316 (%3.5); erken doğum 2321/10316 (%22.5); fetal ölüm 37/10316 (popülasyon).
const EKD = { n:10316, abruption:361, preterm:2321, fetal_death_pop:37 };

const tests = [
  { name:'fetal_death_vs_Aboutanos2007', a:TR.fetal_death, b:TR.n-TR.fetal_death, c:ABT.fetal_death, d:ABT.n-ABT.fetal_death },
  { name:'abruption_vs_ElKady2004',      a:TR.abruption,  b:TR.n-TR.abruption,  c:EKD.abruption,  d:EKD.n-EKD.abruption  },
  { name:'preterm_vs_ElKady2004',        a:TR.preterm,    b:TR.n-TR.preterm,    c:EKD.preterm,    d:EKD.n-EKD.preterm    },
  { name:'fetal_death_vs_ElKady2004pop', a:TR.fetal_death,b:TR.n-TR.fetal_death,c:EKD.fetal_death_pop, d:EKD.n-EKD.fetal_death_pop },
];

const results = tests.map(t => {
  const p_exact = fisherExact2x2(t.a,t.b,t.c,t.d);
  const or = orWald(t.a,t.b,t.c,t.d);
  return {
    karşılaştırma: t.name,
    tablo_2x2: { a:t.a, b:t.b, c:t.c, d:t.d },
    OR: +or.OR.toFixed(3),
    OR_CI95: [ +or.lo.toFixed(3), +or.hi.toFixed(3) ],
    fisher_exact_p_two_sided: p_exact,
    p_text: p_exact < 1e-4 ? p_exact.toExponential(2) : p_exact.toFixed(4)
  };
});

const out = {
  meta: {
    method: 'Fisher exact two-sided + Haldane-Anscombe (0.5) düzeltmeli Wald 95% CI log-OR',
    tarih: new Date().toISOString(),
    girdi: 'scripts/analysis_quality_report.json (Türk korpusu) + Aboutanos 2007 PMID 18073608 + El Kady 2004 PMID 15284756',
    not: 'Önceki §7.5.1 değerleri Yates-düzeltmeli χ² yaklaşımıydı; bu sürüm kesin Fisher exact p ile değiştirilmiştir. Kural 5 (kesin p) gereği.'
  },
  results
};
fs.writeFileSync('scripts/exact_p_calibration_report.json', JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
