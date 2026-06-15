/* TOMEC v2 shortlist - 430 alakalı karardan makale-hazır DOCX + CSV */
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType } = require('docx');

const data = require('./sinerji_dump/refined_v2.json');
function tr(s) { return (s || '').toString().replace(/"/g, '""'); }

/* CSV - 430 hepsi */
const headers = ['Rank','v2 Skor','Tip','Daire','Esas','Karar','Tarih','Gebe','Travma','İlliyet','TCK','Sonuç','URL','Tam Metin'];
const lines = [headers.map(s=>`"${s}"`).join(',')];
data.forEach((r, i) => {
  const url = `https://mevzuat.sinerjias.com.tr/ictihat/yuksek-mahkeme/yargitay%20karari/${r.id}?s=gebe&alternatif=travma`;
  lines.push([i+1, r.v2_score, r.tipadi, r.dairetamadi||r.dairekisaadi||'',
    `${r.esasyil||''}/${r.esasno||''}`, `${r.kararyil||''}/${r.kararno||''}`,
    r.karartarihi||'', r.v2_breakdown.gebe, r.v2_breakdown.travma,
    r.v2_breakdown.illiyet, r.v2_breakdown.tck, r.v2_breakdown.outcome,
    url, r.full_metin.slice(0, 10000)
  ].map(c=>`"${tr(c)}"`).join(','));
});
fs.writeFileSync('client/public/TOMEC_430_Karar_v2_Skorlu.csv', '\ufeff'+lines.join('\n'));
console.log('CSV:', lines.length-1, 'rows');

/* DOCX — 50 top karar tam metin + 380 özet tablo */
const F='Calibri';
const T=(t,o={})=>new TextRun({text:t,font:F,size:o.size||20,bold:o.bold,italics:o.italics,color:o.color});
const H=(t,lvl=1)=>new Paragraph({heading:lvl===1?HeadingLevel.HEADING_1:HeadingLevel.HEADING_2,
  spacing:{before:lvl===1?360:240,after:120},pageBreakBefore:lvl===1,
  children:[T(t,{size:lvl===1?32:24,bold:true,color:lvl===1?'1F3864':'2E74B5'})]});
const C=(t,o={})=>new TableCell({width:{size:o.w||14,type:WidthType.PERCENTAGE},
  shading:o.head?{type:ShadingType.CLEAR,color:'auto',fill:'1F3864'}:undefined,
  margins:{top:50,bottom:50,left:60,right:60},
  children:[new Paragraph({children:[T(t,{size:16,bold:o.head,color:o.head?'FFFFFF':'000000'})]})]});

const TOP = 50;
const top = data.slice(0, TOP);
const rest = data.slice(TOP);

const sec = [];
sec.push(
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:600,after:200},
    children:[T('TOMEC İÇTİHAT TABANI v2', {size:36,bold:true,color:'1F3864'})]}),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:100},
    children:[T('Sıkı Filtreli Karar Veri Tabanı', {size:24,italics:true,color:'2E74B5'})]}),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:300},
    children:[T(`430 karar (gebelik + travma her ikisi mevcut) — 783 ham kayıttan filtrelendi`, {size:20,italics:true,color:'595959'})]}),
  new Paragraph({alignment:AlignmentType.JUSTIFIED,spacing:{after:120,line:300},
    children:[T('Kaynak: ', {bold:true,size:20}),T('Sinerji Mevzuat ve İçtihat Veri Tabanı (Sinerji Hukuk Yazılımları A.Ş.). Arama parametreleri: Ana terim "gebe", alternatif terim "travma", tüm tipler (Yargıtay, Anayasa Mahkemesi, Danıştay, Bölge Adliye Mahkemesi, AİHM, Askeri Yargıtay vd.). Tarama 11 Mayıs 2026 tarihinde gerçekleştirilmiştir.', {size:20})]}),
  new Paragraph({alignment:AlignmentType.JUSTIFIED,spacing:{after:120,line:300},
    children:[T('Filtre kriterleri: ', {bold:true,size:20}),T('Bir kararın TOMEC veri tabanına dahil edilmesi için (a) gebelik/cenin/hamile/intrauterin/plasenta/preterm/eklampsi/dekolman/doğum kümesinden en az bir kelime, ve (b) künt travma/darp/yaralama/düşme/tekme/yumruk/şiddet kümesinden en az bir kelime aynı karar metninde bulunmalıdır. Askeri/siyasi "darbe" homonimi bağlam analiziyle elenmiştir.', {size:20})]}),
  new Paragraph({alignment:AlignmentType.JUSTIFIED,spacing:{after:120,line:300},
    children:[T('Skorlama: ', {bold:true,size:20}),T('TCK 87/88 atfı (10p), obstetrik sonuç anahtarları (15p), illiyet/nedensellik (8p), gebelik anahtarları (5p), travma anahtarları (4p), darbe (fiziksel) (3p) ağırlıklarıyla hesaplanmıştır.', {size:20})]}),
);

/* Dağılım istatistikleri */
sec.push(H('1. Veri Tabanı İstatistikleri', 1));
const byTip={}, byYear={}, byDaire={};
data.forEach(r=>{
  byTip[r.tipadi]=(byTip[r.tipadi]||0)+1;
  byYear[r.kararyil]=(byYear[r.kararyil]||0)+1;
  const k=`${r.tipadi} ${r.dairetamadi||r.dairekisaadi||''}`.trim();
  byDaire[k]=(byDaire[k]||0)+1;
});

sec.push(new Paragraph({children:[T('Tip dağılımı: ', {bold:true,size:20})]}));
Object.entries(byTip).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>
  sec.push(new Paragraph({spacing:{after:40},children:[T(`  • ${k}: ${v} karar (%${(v/data.length*100).toFixed(1)})`,{size:20})]}))
);

sec.push(new Paragraph({spacing:{before:200},children:[T('Yıl dağılımı (son 10 yıl): ', {bold:true,size:20})]}));
Object.entries(byYear).sort((a,b)=>b[0]-a[0]).slice(0,10).forEach(([k,v])=>
  sec.push(new Paragraph({spacing:{after:40},children:[T(`  • ${k}: ${v} karar`,{size:20})]}))
);

sec.push(new Paragraph({spacing:{before:200},children:[T('En aktif daireler (ilk 10): ', {bold:true,size:20})]}));
Object.entries(byDaire).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,v])=>
  sec.push(new Paragraph({spacing:{after:40},children:[T(`  • ${k}: ${v} karar`,{size:20})]}))
);

/* Top 50 tam metin */
sec.push(H(`2. En Yüksek Alakalı 50 Karar — Tam Metin`, 1));
sec.push(new Paragraph({spacing:{after:200},alignment:AlignmentType.JUSTIFIED,children:[
  T('Aşağıdaki 50 karar v2 skoru sıralamasına göre TOMEC veri tabanının çekirdek emsalleridir. Her kararın atıf bilgisi (Tip, Daire, Esas/Karar No, Tarih), TOMEC anahtar sinyalleri (gebelik/travma/illiyet/TCK/sonuç sayıları) ve tam karar metni (en fazla 30.000 karakter) verilmiştir. Daha kısa kararlar tamamı, daha uzun kararlar başlangıç bölümü ile sunulmuştur — tam metin için CSV ekine bakınız.', {size:20,italics:true,color:'595959'})
]}));

top.forEach((r, i) => {
  sec.push(new Paragraph({spacing:{before:240,after:80},pageBreakBefore:i>0,
    children:[T(`Karar #${i+1}: ${r.tipadi} — ${r.dairetamadi||r.dairekisaadi||''}`,{size:24,bold:true,color:'1F3864'})]}));
  sec.push(new Paragraph({spacing:{after:60},children:[
    T('Esas: ',{bold:true,size:18}),T(`${r.esasyil||''}/${r.esasno||''}   `,{size:18}),
    T('Karar: ',{bold:true,size:18}),T(`${r.kararyil||''}/${r.kararno||''}   `,{size:18}),
    T('Tarih: ',{bold:true,size:18}),T(`${r.karartarihi||''}`,{size:18})]}));
  sec.push(new Paragraph({spacing:{after:60},children:[
    T('TOMEC v2 Skor: ',{bold:true,size:18,color:'C00000'}),T(`${r.v2_score}`,{size:18,bold:true,color:'C00000'}),
    T(`   |   Sinyaller: `,{bold:true,size:18}),
    T(`Gebe:${r.v2_breakdown.gebe}  Travma:${r.v2_breakdown.travma}  Darbe(fiz):${r.v2_breakdown.darbe}  İlliyet:${r.v2_breakdown.illiyet}  TCK87-88:${r.v2_breakdown.tck}  Obs.Sonuç:${r.v2_breakdown.outcome}`,{size:16,italics:true,color:'595959'})]}));
  if (r.full_konu) sec.push(new Paragraph({spacing:{after:80},children:[T('KONU: ',{bold:true,size:18}),T(r.full_konu,{size:18,italics:true})]}));
  
  const txt = r.full_metin.slice(0, 30000);
  const paras = txt.split(/\n+/).filter(p=>p.trim());
  paras.forEach(p=>sec.push(new Paragraph({spacing:{after:80,line:280},alignment:AlignmentType.JUSTIFIED,children:[T(p,{size:18})]})));
  if (r.full_metin.length > 30000)
    sec.push(new Paragraph({children:[T(`[... ${r.full_metin.length - 30000} karakter daha CSV'de mevcut ...]`, {italics:true,size:16,color:'808080'})]}));
});

/* Kalan 380 özet tablo */
sec.push(H(`3. Kalan ${rest.length} Karar — Özet Tablo`, 1));
const rows = [new TableRow({children:[
  C('No',{head:true,w:4}),C('v2',{head:true,w:5}),C('Tip',{head:true,w:8}),
  C('Daire',{head:true,w:13}),C('Esas/Karar',{head:true,w:13}),C('Tarih',{head:true,w:9}),
  C('G',{head:true,w:4}),C('T',{head:true,w:4}),C('İl',{head:true,w:4}),C('TCK',{head:true,w:5}),
  C('Snippet',{head:true,w:31}),
]})];
rest.forEach((r,i)=>{
  rows.push(new TableRow({children:[
    C(String(TOP+i+1),{w:4}),C(String(r.v2_score),{w:5}),C(r.tipadi,{w:8}),
    C(r.dairetamadi||r.dairekisaadi||'',{w:13}),
    C(`${r.esasyil||''}/${r.esasno||''}\n${r.kararyil||''}/${r.kararno||''}`,{w:13}),
    C(r.karartarihi||'',{w:9}),
    C(String(r.v2_breakdown.gebe),{w:4}),C(String(r.v2_breakdown.travma),{w:4}),
    C(String(r.v2_breakdown.illiyet),{w:4}),C(String(r.v2_breakdown.tck),{w:5}),
    C(r.full_metin.slice(0,250),{w:31}),
  ]}));
});
sec.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows}));

const doc = new Document({creator:'TOMEC v2',title:'TOMEC İçtihat Tabanı v2',
  styles:{default:{document:{run:{font:F}}}},
  sections:[{properties:{page:{margin:{top:1100,bottom:1100,left:1100,right:1100}}},children:sec}]});

Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync('client/public/TOMEC_430_Karar_v2_Top50_TamMetin.docx', buf);
  console.log('DOCX:', buf.length, 'bytes');
});
