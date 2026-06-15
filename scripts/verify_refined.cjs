'use strict';
const https=require('https'),fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const get=u=>new Promise((res,rej)=>https.get(u,{headers:{'User-Agent':'TOMEC/1.0'}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej));
async function pm(q){const u=`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&term=${encodeURIComponent(q)}`;try{const r=JSON.parse(await get(u));return{count:+r.esearchresult.count,ids:r.esearchresult.idlist};}catch(e){return{err:e.message};}}
async function summary(id){const u=`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${id}`;try{const r=JSON.parse(await get(u));const x=r.result?.[id];return x?{title:x.title,journal:x.fulljournalname,year:x.pubdate,authors:(x.authors||[]).slice(0,3).map(a=>a.name).join(', ')}:null;}catch(e){return null;}}

const refined=[
  {n:31,q:'Ikossi DG[Author] Knudson MM[Author] 2005[PDAT]'},
  {n:36,q:'Pearlman MD[Author] 1990[PDAT] Am J Obstet Gynecol[Journal]'},
  {n:45,q:'Goodwin TM[Author] Breen MT[Author] 1990[PDAT]'},
  {n:46,q:'Sokol RJ[Author] 1977[PDAT] high-risk scoring'},
  {n:49,q:'Linden JA[Author] pregnancy test J Emerg Med'},
  {n:50,q:'Ghi T[Author] placental abruption sonographic'},
  {n:51,q:'Mancuso[Author] temporal causation Forensic Sci Int'},
  {n:52,q:'Pearl J[Author] Bareinboim E[Author] transportability'},
  {n:60,q:'Cohen J[Author] 1960[PDAT] coefficient agreement'},
  {n:72,q:'El Kady D[Author] Gilbert WM[Author] 2004[PDAT]'},
  {n:73,q:'Aboutanos MB[Author] 2007[PDAT] J Trauma[Journal]'},
  {n:'74a',q:'Schiff MA[Author] Holt VL[Author] 2002[PDAT] Am J Epidemiol[Journal]'},
  {n:80,q:'ACOG Practice Bulletin 234 critical care'},
  {n:41,q:'ACOG Practice Bulletin 211 critical care'},
];
(async()=>{
  const out=[];
  for(const r of refined){
    const p=await pm(r.q);
    let detail=null;
    if(p.count>0&&p.ids?.[0]){detail=await summary(p.ids[0]);await sleep(300);}
    out.push({...r,count:p.count,first:detail});
    console.log(`[${r.n}] count=${p.count}`,detail?`→ ${detail.year} ${detail.journal} | ${detail.authors} | ${detail.title?.slice(0,70)}`:'');
    await sleep(400);
  }
  fs.writeFileSync('scripts/refs_refined.json',JSON.stringify(out,null,2));
})();
