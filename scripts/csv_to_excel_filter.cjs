const fs = require('fs');
const path = require('path');

const csvPath = 'attached_assets/NURCAN_NİSAN_AYI_BEYİN_BT_ACİL_1776758600096.csv';
const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/).filter(l => l.trim());

function parseLine(l){
  // Format: "=""value""","=""value""",...
  const out=[];
  const re=/"=""((?:[^"]|"")*)"""/g;
  let m;
  while ((m=re.exec(l))!==null) out.push(m[1].replace(/""/g,'"'));
  return out;
}

const header = parseLine(lines[0]);
const rows = lines.slice(1).map(parseLine);

function yas(dogum, calisma){
  // YYYYMMDD
  const dy=parseInt(dogum.slice(0,4),10), dm=parseInt(dogum.slice(4,6),10), dd=parseInt(dogum.slice(6,8),10);
  const cy=parseInt(calisma.slice(0,4),10), cm=parseInt(calisma.slice(4,6),10), cd=parseInt(calisma.slice(6,8),10);
  let y=cy-dy;
  if (cm<dm || (cm===dm && cd<dd)) y--;
  return y;
}
function fmtDate(s){
  if (!s||s.length<8) return s;
  return s.slice(6,8)+'.'+s.slice(4,6)+'.'+s.slice(0,4);
}
function adSoyad(raw){
  const p = raw.split('^');
  const soyad = (p[0]||'').trim();
  const ad = (p[1]||'').trim();
  return { soyad, ad, tam: soyad+' '+ad };
}

const kadin=[], erkek=[], cocuk=[], yasli=[];
const seen=new Set();
for (const r of rows){
  if (r.length<6) continue;
  const tc=r[0], adRaw=r[1], dog=r[2], cins=r[3], cal=r[4], orn=r[5];
  if (!tc||!dog||!cal) continue;
  const key=tc+'|'+cal;
  if (seen.has(key)) continue;
  seen.add(key);
  const y=yas(dog,cal);
  const n=adSoyad(adRaw);
  const obj={ tc, soyad:n.soyad, ad:n.ad, dogum:fmtDate(dog), calisma:fmtDate(cal), cinsiyet:cins, yas:y, ornek:orn };
  if (y<18) cocuk.push(obj);
  else if (y>65) yasli.push(obj);
  else if (cins==='F') kadin.push(obj);
  else if (cins==='M') erkek.push(obj);
}
const sortFn=(a,b)=>a.soyad.localeCompare(b.soyad,'tr')||a.ad.localeCompare(b.ad,'tr');
kadin.sort(sortFn); erkek.sort(sortFn); cocuk.sort(sortFn); yasli.sort(sortFn);

console.log('Kadin (18-65):', kadin.length);
console.log('Erkek (18-65):', erkek.length);
console.log('Cocuk (<18, dahil edilmedi):', cocuk.length);
console.log('Yasli (>65, dahil edilmedi):', yasli.length);
console.log('Toplam (18-65):', kadin.length+erkek.length);

// SpreadsheetML 2003 (Excel XML) — multi-sheet
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function sheet(name, list){
  const cols=['Sıra','TC','Soyad','Ad','Doğum Tarihi','Yaş','Cinsiyet','Çalışma Tarihi','Kesit Sayısı'];
  let xml=`<Worksheet ss:Name="${esc(name)}"><Table>`;
  for (let i=0;i<cols.length;i++) xml+=`<Column ss:Width="${[40,100,140,140,90,50,70,100,90][i]}"/>`;
  xml+=`<Row ss:StyleID="hdr">`;
  cols.forEach(c=>xml+=`<Cell ss:StyleID="hdr"><Data ss:Type="String">${esc(c)}</Data></Cell>`);
  xml+=`</Row>`;
  list.forEach((o,i)=>{
    xml+=`<Row>`;
    [i+1,o.tc,o.soyad,o.ad,o.dogum,o.yas,o.cinsiyet==='F'?'Kadın':'Erkek',o.calisma,o.ornek].forEach((v,j)=>{
      const t=(j===0||j===5)?'Number':'String';
      xml+=`<Cell><Data ss:Type="${t}">${esc(v)}</Data></Cell>`;
    });
    xml+=`</Row>`;
  });
  xml+=`</Table></Worksheet>`;
  return xml;
}

const xml=`<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
<Styles>
 <Style ss:ID="hdr"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#305496" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
</Styles>
${sheet('KADIN 18-65', kadin)}
${sheet('ERKEK 18-65', erkek)}
${sheet('Cocuk 18 alti', cocuk)}
${sheet('Yasli 65 ustu', yasli)}
</Workbook>`;

const out='attached_assets/NURCAN_18-65_KADIN_ERKEK.xls';
fs.writeFileSync(out, xml, 'utf8');
console.log('YAZILDI:', out);
