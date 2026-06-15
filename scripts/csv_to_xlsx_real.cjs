const fs = require('fs');
const ExcelJS = require('exceljs');

const csvPath = 'attached_assets/NURCAN_NİSAN_AYI_BEYİN_BT_ACİL_1776758600096.csv';
const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/).filter(l => l.trim());

function parseLine(l){
  const out=[]; const re=/"=""((?:[^"]|"")*)"""/g;
  let m; while ((m=re.exec(l))!==null) out.push(m[1].replace(/""/g,'"'));
  return out;
}
function yas(d,c){
  const dy=+d.slice(0,4),dm=+d.slice(4,6),dd=+d.slice(6,8);
  const cy=+c.slice(0,4),cm=+c.slice(4,6),cd=+c.slice(6,8);
  let y=cy-dy; if(cm<dm||(cm===dm&&cd<dd))y--; return y;
}
function fmtDate(s){return s.length<8?s:s.slice(6,8)+'.'+s.slice(4,6)+'.'+s.slice(0,4);}
function adSoyad(r){const p=r.split('^');return{soyad:(p[0]||'').trim(),ad:(p[1]||'').trim()};}

const rows=lines.slice(1).map(parseLine);
const kadin=[],erkek=[],cocuk=[],yasli=[];
const seen=new Set();
for(const r of rows){
  if(r.length<6)continue;
  const [tc,adRaw,dog,cins,cal,orn]=r;
  if(!tc||!dog||!cal)continue;
  const k=tc+'|'+cal; if(seen.has(k))continue; seen.add(k);
  const y=yas(dog,cal); const n=adSoyad(adRaw);
  const o={tc,soyad:n.soyad,ad:n.ad,dogum:fmtDate(dog),yas:y,cinsiyet:cins==='F'?'Kadın':'Erkek',calisma:fmtDate(cal),ornek:+orn||orn};
  if(y<18)cocuk.push(o);
  else if(y>65)yasli.push(o);
  else if(cins==='F')kadin.push(o);
  else if(cins==='M')erkek.push(o);
}
const sf=(a,b)=>a.soyad.localeCompare(b.soyad,'tr')||a.ad.localeCompare(b.ad,'tr');
[kadin,erkek,cocuk,yasli].forEach(a=>a.sort(sf));

(async()=>{
  const wb=new ExcelJS.Workbook();
  wb.creator='Nurcan Denli Bayır - Tez';
  function addSheet(name,list){
    const ws=wb.addWorksheet(name);
    ws.columns=[
      {header:'Sıra',key:'i',width:6},
      {header:'TC',key:'tc',width:14},
      {header:'Soyad',key:'soyad',width:20},
      {header:'Ad',key:'ad',width:20},
      {header:'Doğum Tarihi',key:'dogum',width:13},
      {header:'Yaş',key:'yas',width:6},
      {header:'Cinsiyet',key:'cinsiyet',width:10},
      {header:'Çalışma Tarihi',key:'calisma',width:14},
      {header:'Kesit Sayısı',key:'ornek',width:12},
    ];
    list.forEach((o,i)=>ws.addRow({i:i+1,...o}));
    ws.getRow(1).eachCell(c=>{
      c.font={bold:true,color:{argb:'FFFFFFFF'}};
      c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF305496'}};
      c.alignment={horizontal:'center',vertical:'middle'};
    });
    ws.views=[{state:'frozen',ySplit:1}];
    ws.autoFilter={from:'A1',to:'I1'};
  }
  addSheet('KADIN 18-65',kadin);
  addSheet('ERKEK 18-65',erkek);
  const out='attached_assets/NURCAN_18-65_KADIN_ERKEK.xlsx';
  await wb.xlsx.writeFile(out);
  console.log('K:',kadin.length,'E:',erkek.length,'C:',cocuk.length,'Y:',yasli.length);
  console.log('YAZILDI:',out);
})();
