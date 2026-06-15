#!/usr/bin/env node
/**
 * 89 referansı PubMed esearch + CrossRef ile batch doğrula.
 * Mahkeme/yasa/kitap/kılavuz referansları SKIP edilir (PubMed'de değil),
 * ama bilinen-doğru olarak işaretlenir.
 *
 * Çıktı: scripts/refs_verification_report.json
 */
'use strict';
const https = require('https');
const fs = require('fs');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function get(url){
  return new Promise((res,rej) => {
    https.get(url, { headers:{'User-Agent':'TOMEC-ref-verifier/1.0 (mailto:research@example.org)'} }, r => {
      let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(d));
    }).on('error', rej);
  });
}

// PubMed esearch
async function pubmed(q){
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&term=${encodeURIComponent(q)}`;
  try {
    const r = JSON.parse(await get(url));
    return { count: parseInt(r.esearchresult?.count||'0'), ids: r.esearchresult?.idlist||[] };
  } catch (e) { return { count: -1, error: e.message }; }
}
// CrossRef bibliographic
async function crossref(q){
  const url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(q)}&rows=3`;
  try {
    const r = JSON.parse(await get(url));
    const items = r.message?.items || [];
    return items.map(i => ({
      title: (i.title?.[0]||'').slice(0,80),
      doi: i.DOI,
      year: i.issued?.['date-parts']?.[0]?.[0],
      journal: (i['container-title']?.[0]||'')
    }));
  } catch (e) { return { error: e.message }; }
}

// Referans tipleri
const refs = [
  { n:1, type:'guideline', text:'Queensland Trauma in pregnancy MN19.31', verify:'manual', status:'KNOWN_REAL', note:'Queensland Health public guideline' },
  { n:2, type:'law', text:'TCK 5237', status:'KNOWN_REAL', note:'Resmî Gazete' },
  { n:3, type:'law', text:'6284 sayılı Kanun', status:'KNOWN_REAL' },
  { n:4, type:'law', text:'Anayasa m.17', status:'KNOWN_REAL' },
  { n:5, type:'treaty', text:'AİHS m.2/3/8', status:'KNOWN_REAL' },
  { n:6, type:'court', text:'Y3CD E.2020/1499', status:'NEEDS_LEGAL_DB', note:'Sinerji-only verifiable' },
  { n:7, type:'court', text:'Y3CD E.2024/1103', status:'NEEDS_LEGAL_DB' },
  { n:8, type:'court', text:'Y3CD E.2024/2955', status:'NEEDS_LEGAL_DB' },
  { n:9, type:'court', text:'Y12CD E.2025/886', status:'NEEDS_LEGAL_DB' },
  { n:10, type:'court', text:'AYM 2017/35569', status:'PUBLIC_DB' },
  { n:11, type:'court', text:'AYM 2015/12753', status:'PUBLIC_DB' },
  { n:12, type:'court', text:'AYM 2013/2803', status:'PUBLIC_DB' },
  { n:13, type:'court', text:'AYM 2019/11174', status:'PUBLIC_DB' },
  { n:14, type:'court', text:'AİHM Aydoğdu/Türkiye 40448/06', status:'PUBLIC_DB', note:'HUDOC' },
  { n:15, type:'court', text:'AİHM 13423/09', status:'NEEDS_HUDOC_VERIFY' },
  { n:16, type:'court', text:'AİHM 38477/10 Niğde', status:'NEEDS_HUDOC_VERIFY' },
  { n:17, type:'court', text:'AİHM 46854/99 Gebze', status:'NEEDS_HUDOC_VERIFY' },
  { n:18, type:'court', text:'Danıştay 10. D E.2019/6306', status:'NEEDS_LEGAL_DB' },
  { n:19, type:'court', text:'Danıştay 10. D E.2019/6918', status:'NEEDS_LEGAL_DB' },
  { n:20, type:'court', text:'Danıştay 15. D E.2016/4602', status:'NEEDS_LEGAL_DB' },
  { n:21, type:'turkish_journal', q:'Cenger travma erken gebelik kaybı SDU', doi:'10.17343/sdutfd.374193' },
  { n:22, type:'book', text:'Soysal Çakalır Adli Tıp 1999', status:'KNOWN_REAL', note:'Cerrahpaşa physical book' },
  { n:23, type:'book', text:'Soysal Eke Çağdır Adli Otopsi 1999', status:'KNOWN_REAL' },
  { n:24, type:'database', text:'Sinerji Mevzuat', status:'KNOWN_REAL' },
  { n:25, type:'pubmed', q:'Petrone Asensio trauma pregnancy Scand J Surg 2006' },
  { n:26, type:'pubmed', q:'Mattox Goetzl trauma pregnancy Crit Care Med 2005' },
  { n:27, type:'pubmed', q:'Oxford Ludmir trauma pregnancy Clin Obstet Gynecol 2009' },
  { n:28, type:'turkish_journal', q:'Kırdak Yılmazlar travma gebelik Ulus Travma 1995', risk:'HIGH', note:'1995 Turkish journal — needs DergiPark verify' },
  { n:29, type:'pubmed', q:'Rogers Rozycki Osler fetal death injured pregnant Arch Surg 1999' },
  { n:30, type:'pubmed', q:'Weiss Songer Fabio fetal deaths maternal injury JAMA 2001' },
  { n:31, type:'pubmed', q:'Ikossi Lazar Knudson injury pregnancy 1195 J Am Coll Surg 2005' },
  { n:32, type:'turkish_journal', q:'Giray Keskinoğlu gebelikte aile içi şiddet STED 2005', risk:'MEDIUM' },
  { n:33, type:'pubmed', q:'Hedin Janson domestic violence pregnancy Acta Obstet Gynecol Scand 2000' },
  { n:34, type:'turkish_journal', q:'Mihmanlı Karahisar gebelikte travma Şişli Etfal 2012', risk:'MEDIUM' },
  { n:35, type:'pubmed', q:'Pearlman motor vehicle crashes pregnancy Int J Gynaecol Obstet 1997' },
  { n:36, type:'pubmed', q:'Pearlman Tintinalli Lorenz prospective trauma pregnancy 1990' },
  { n:37, type:'pubmed', q:'El Kady perinatal traumatic injuries pregnancy Clin Obstet Gynecol 2007' },
  { n:38, type:'pubmed', q:'Mendez-Figueroa Dahlke Vrees Rouse trauma pregnancy systematic 2013' },
  { n:39, type:'pubmed', q:'Brown HL trauma pregnancy Obstet Gynecol 2009' },
  { n:40, type:'guideline', text:'MBRRACE-UK 2018-20', status:'KNOWN_REAL' },
  { n:41, type:'pubmed', q:'ACOG Practice Bulletin 211 critical care pregnancy 2019', risk:'CHECK_NUMBER', note:'PB211 vs PB234 - check year alignment' },
  { n:42, type:'guideline', text:'RCOG Green-top 56 Maternal Collapse 2021', status:'KNOWN_REAL' },
  { n:43, type:'standard', text:'AAAM AIS 2015', status:'KNOWN_REAL' },
  { n:44, type:'pubmed', q:'Katz Dotters Droegemueller perimortem cesarean Obstet Gynecol 1986' },
  { n:45, type:'pubmed', q:'Goodwin Breen pregnancy outcome fetomaternal noncatastrophic Am J Obstet 1990' },
  { n:46, type:'pubmed', q:'Sokol Hutchison Krouskop high-risk scoring obstetric Am J Obstet 1977' },
  { n:47, type:'book', text:'Benirschke Burton Baergen Pathology Human Placenta 6th 2012', status:'KNOWN_REAL' },
  { n:48, type:'pubmed', q:'Jauniaux Burton placenta accreta spectrum Clin Obstet Gynecol 2018' },
  { n:49, type:'pubmed', q:'Linden Grimmnitz pregnancy test screening J Emerg Med 2015', risk:'CHECK' },
  { n:50, type:'pubmed', q:'Ghi Pilu sonographic placental abruption Eur J Obstet Gynecol 2015', risk:'CHECK' },
  { n:51, type:'pubmed', q:'Mancuso temporal proximity legal causation Forensic Sci Int 2017', risk:'HIGH', note:'Single-author Mancuso — check existence' },
  { n:52, type:'pubmed', q:'Pearl Bareinboim transportability populations Stat Sci 2014' },
  { n:53, type:'book', text:'Rothman Greenland Modern Epidemiology 3rd', status:'KNOWN_REAL' },
  { n:54, type:'standard', text:'ICMJE recommendations 2025', status:'KNOWN_REAL' },
  { n:55, type:'pubmed', q:'Bailar Mosteller statistical reporting medical journals Ann Intern Med 1988' },
  { n:56, type:'book', text:'TİHV İşkence Atlası 2007', status:'KNOWN_REAL' },
  { n:57, type:'pubmed', q:'Özkalıpçı Unuvar bone scintigraphy torture Forensic Sci Int 2013' },
  { n:58, type:'standard', text:'Istanbul Protocol UN 2001 rev 2022', status:'KNOWN_REAL' },
  { n:59, type:'turkish_journal', q:'Can Demiroğlu Uyanıker travma ruhsal Nöropsikiyatri 2013', risk:'MEDIUM' },
  { n:60, type:'pubmed', q:'Cohen coefficient agreement nominal scales Educ Psychol Meas 1960', risk:'NON_PUBMED' },
  { n:61, type:'book', text:'Krippendorff Content Analysis 4th 2018', status:'KNOWN_REAL' },
  { n:62, type:'pubmed', q:'Bland Altman statistical methods agreement Lancet 1986' },
  { n:63, type:'pubmed', q:'Lundberg Lee unified approach interpreting model SHAP 2017', risk:'NON_PUBMED', note:'NeurIPS conference' },
  { n:64, type:'law', text:'Kişisel Sağlık Verileri Yönetmeliği 30808', status:'KNOWN_REAL' },
  { n:65, type:'pubmed', q:'Declaration Helsinki ethical medical research JAMA 2013' },
  { n:66, type:'law', text:'TBK 6098', status:'KNOWN_REAL' },
  { n:67, type:'book', text:'Centel Zafer Çakmut Ceza Hukukuna Giriş 13th', status:'NEEDS_VERIFY', risk:'CHECK_EDITION' },
  { n:68, type:'turkish_journal', q:'Kuşkonmaz causation Turkish penal jurisprudence 2021', risk:'HIGH_HALLUCINATION_SUSPECT' },
  { n:69, type:'standard', text:'ATK İhtisas Kurulları Yönergesi 2023', status:'INTERNAL_DOCUMENT' },
  { n:70, type:'turkish_journal', q:'Hekimoğlu Demircan Gümüş adli obstetri kalite 2022', risk:'CONFIRMED_HALLUCINATION' },
  { n:71, type:'standard', text:'IAFS Working Group obstetric forensic 2024', status:'CONFIRMED_HALLUCINATION', note:'No such IAFS document exists' },
  { n:72, type:'pubmed', q:'El Kady Gilbert Anderson trauma pregnancy maternal fetal Am J Obstet Gynecol 2004' },
  { n:73, type:'pubmed', q:'Aboutanos Aboutanos Dompkowski fetal outcome trauma J Trauma 2007' },
  { n:74, type:'pubmed', q:'Schiff Holt injury severity score pregnant trauma J Trauma 2002' },
  { n:'74a', type:'pubmed', q:'Schiff Holt pregnancy outcomes motor vehicle Washington Am J Epidemiol 2002' },
  { n:76, type:'pubmed', q:'Hill environment disease association causation Proc R Soc Med 1965' },
  { n:77, type:'court', text:'Daubert v Merrell Dow 509 US 579 1993', status:'KNOWN_REAL' },
  { n:78, type:'court', text:'BGH Anscheinsbeweis NJW 1991 1948', status:'KNOWN_REAL' },
  { n:79, type:'book', text:'Özgenç Ceza Hukuku Genel Hükümler 17th 2021', status:'KNOWN_REAL', risk:'CHECK_EDITION_NUMBER' },
  { n:80, type:'pubmed', q:'ACOG Practice Bulletin 234 critical care pregnancy 2021', risk:'CHECK_NUMBER' },
  { n:81, type:'guideline', text:'RCOG Green-top 56 Maternal Collapse 2019', status:'CONFLICT_WITH_42', note:'Ref 42 says 2021 — duplicate/version conflict' },
  { n:82, type:'book', text:'Knudson Reproductive trauma in Mattox Trauma 8th 2017', status:'KNOWN_REAL' },
  { n:84, type:'database', text:'HCUP NIS', status:'KNOWN_REAL' },
  { n:85, type:'guideline', text:'MBRRACE-UK Saving Lives 2023', status:'KNOWN_REAL' },
  { n:86, type:'pubmed', q:'Landis Koch observer agreement categorical Biometrics 1977' },
  { n:87, type:'pubmed', q:'Korngiebel Mooney generative pre-trained transformer GPT-3 healthcare NPJ Digit Med 2021' },
  { n:88, type:'pubmed', q:'Singhal Azizi Tu large language models clinical knowledge Nature 2023' },
  { n:89, type:'web', text:'OpenAI GPT-4o System Card 2024', status:'KNOWN_REAL' },
];

(async () => {
  const out = [];
  for (const r of refs) {
    if (r.type === 'pubmed' && r.q) {
      const pm = await pubmed(r.q);
      const status = pm.count > 0 ? 'PUBMED_FOUND' : 'PUBMED_NOT_FOUND';
      out.push({ ...r, pubmed: pm, status_final: status });
      await sleep(350); // polite rate-limit
    } else if (r.type === 'turkish_journal' && r.q) {
      const pm = await pubmed(r.q);
      const cr = await crossref(r.q);
      out.push({ ...r, pubmed: pm, crossref_top: Array.isArray(cr) ? cr.slice(0,2) : cr,
                 status_final: (pm.count>0 || (Array.isArray(cr) && cr.some(x => (x.title||'').length>5))) ? 'POSSIBLY_FOUND' : 'NOT_FOUND_NEEDS_MANUAL' });
      await sleep(700);
    } else {
      out.push({ ...r, status_final: r.status || 'SKIP' });
    }
    process.stdout.write('.');
  }
  console.log();
  fs.writeFileSync('scripts/refs_verification_report.json', JSON.stringify(out,null,2));
  // Özet
  const summary = {};
  out.forEach(r => summary[r.status_final] = (summary[r.status_final]||0)+1);
  console.log('Özet:', summary);
  console.log('\nKritik (NOT_FOUND / HALLUCINATION):');
  out.filter(r => /NOT_FOUND|HALLUCINATION/.test(r.status_final)).forEach(r => {
    console.log(`  [${r.n}] ${r.q || r.text} → ${r.status_final}`);
  });
})();
