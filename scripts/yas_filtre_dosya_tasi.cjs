const fs = require('fs');
const csvPath = 'attached_assets/NURCAN_NİSAN_AYI_BEYİN_BT_ACİL_1776758600096.csv';
const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/).filter(l => l.trim());
function parseLine(l){const out=[];const re=/"=""((?:[^"]|"")*)"""/g;let m;while((m=re.exec(l))!==null)out.push(m[1].replace(/""/g,'"'));return out;}
function yas(d,c){const dy=+d.slice(0,4),dm=+d.slice(4,6),dd=+d.slice(6,8);const cy=+c.slice(0,4),cm=+c.slice(4,6),cd=+c.slice(6,8);let y=cy-dy;if(cm<dm||(cm===dm&&cd<dd))y--;return y;}

const haricTC=new Set(); const tutTC=new Set();
const haricLst=[]; const tutLst=[];
for(const r of lines.slice(1).map(parseLine)){
  if(r.length<6)continue;
  const [tc,adRaw,dog,cins,cal]=r;
  if(!tc||!dog||!cal)continue;
  const y=yas(dog,cal);
  const ad=adRaw.replace('^',' ');
  if(y<18||y>65){ haricTC.add(tc); haricLst.push(`${tc}\t${y} yaş\t${ad}`);}
  else if(cins==='F'||cins==='M'){ tutTC.add(tc); tutLst.push(`${tc}\t${y} yaş\t${cins==='F'?'K':'E'}\t${ad}`);}
}

fs.writeFileSync('attached_assets/HARIC_TUTULACAK_TC.txt',
  `# 18 yaş altı veya 65 yaş üstü hastalar (${haricTC.size} TC)\n# Bu TC numaralı bt_*.webm dosyaları kullanılmayacak\n\n`+
  [...haricTC].join('\n'),'utf8');
fs.writeFileSync('attached_assets/KULLANILACAK_TC.txt',
  `# 18-65 yaş arası hastalar (${tutTC.size} TC) - TEZDE KULLANILACAK\n\n`+
  [...tutTC].join('\n'),'utf8');

// PowerShell scripti - Downloads klasöründe çalışır
const ps=`# Nurcan Tez - Yaş Filtresi: 18 altı ve 65 üstü videoları ayır
# Kullanımı: bu dosyayı Downloads klasörüne kopyalayın, sağ tık > "PowerShell ile çalıştır"

$haricTcList = @(
${[...haricTC].map(t=>`    "${t}"`).join(',\n')}
)

$kaynak = $PSScriptRoot
$hedef = Join-Path $kaynak "HARIC_TUTULAN_18alti_65ustu"
if (-not (Test-Path $hedef)) { New-Item -ItemType Directory -Path $hedef | Out-Null }

$tasinan = 0
$bulunmayan = 0
foreach ($tc in $haricTcList) {
    $dosyalar = Get-ChildItem -Path $kaynak -Filter "bt_$tc*.webm" -ErrorAction SilentlyContinue
    if ($dosyalar) {
        foreach ($d in $dosyalar) {
            Move-Item -Path $d.FullName -Destination $hedef -Force
            Write-Host "TASINDI: $($d.Name)" -ForegroundColor Yellow
            $tasinan++
        }
    } else {
        $bulunmayan++
    }
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "TOPLAM TASINAN: $tasinan dosya" -ForegroundColor Green
Write-Host "Hedef klasor: $hedef" -ForegroundColor Cyan
Write-Host "Kalan (18-65) videolar Downloads klasorunde duruyor" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Read-Host "Kapatmak icin Enter'a basin"
`;
fs.writeFileSync('attached_assets/YAS_FILTRESI_DOSYA_TASI.ps1', ps, 'utf8');

console.log('Hariç tutulacak TC:', haricTC.size);
console.log('Kullanılacak TC (18-65):', tutTC.size);
console.log('Dosyalar yazıldı:');
console.log(' - HARIC_TUTULACAK_TC.txt');
console.log(' - KULLANILACAK_TC.txt');
console.log(' - YAS_FILTRESI_DOSYA_TASI.ps1');
