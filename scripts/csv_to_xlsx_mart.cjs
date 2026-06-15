const fs = require('fs');
const ExcelJS = require('exceljs');

const CSV = 'attached_assets/Nurcan_23.03-31.03_beyin_BT_ACİL_1776859184199.csv';
const OUT = 'attached_assets/NURCAN_23-31_MART_18-65.xlsx';

const raw = fs.readFileSync(CSV, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/).filter(l => l.trim());

function parseLine(l) {
  const out = [];
  const re = /"=""((?:[^"]|"")*)"""/g;
  let m;
  while ((m = re.exec(l)) !== null) out.push(m[1].replace(/""/g, '"'));
  return out;
}
function yas(d, c) {
  const dy = +d.slice(0, 4), dm = +d.slice(4, 6), dd = +d.slice(6, 8);
  const cy = +c.slice(0, 4), cm = +c.slice(4, 6), cd = +c.slice(6, 8);
  let y = cy - dy;
  if (cm < dm || (cm === dm && cd < dd)) y--;
  return y;
}
function fmtDate(s) {
  return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
}

const kadin = [], erkek = [];
const seen = new Set();
for (const r of lines.slice(1).map(parseLine)) {
  if (r.length < 6) continue;
  const [tc, adRaw, dog, cins, cal, kesit] = r;
  if (!tc || !dog || !cal) continue;
  const key = tc + '|' + cal;
  if (seen.has(key)) continue;
  seen.add(key);
  const y = yas(dog, cal);
  if (y < 18 || y > 65) continue;
  const [soyad, ...adParts] = adRaw.split('^');
  const ad = adParts.join(' ');
  const row = {
    tc, soyad, ad,
    dogum: fmtDate(dog),
    yas: y,
    calisma: fmtDate(cal),
    kesit: +kesit || 0,
  };
  if (cins === 'F') kadin.push(row);
  else if (cins === 'M') erkek.push(row);
}
const cmp = (a, b) => a.soyad.localeCompare(b.soyad, 'tr') || a.ad.localeCompare(b.ad, 'tr');
kadin.sort(cmp);
erkek.sort(cmp);

(async () => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Nurcan Denli Bayır';
  wb.created = new Date();

  function addSheet(name, data) {
    const ws = wb.addWorksheet(name, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    ws.columns = [
      { header: 'Sıra', key: 'sira', width: 6 },
      { header: 'TC', key: 'tc', width: 14 },
      { header: 'Soyad', key: 'soyad', width: 18 },
      { header: 'Ad', key: 'ad', width: 22 },
      { header: 'Doğum Tarihi', key: 'dogum', width: 13 },
      { header: 'Yaş', key: 'yas', width: 6 },
      { header: 'Cinsiyet', key: 'cinsiyet', width: 9 },
      { header: 'Çalışma Tarihi', key: 'calisma', width: 14 },
      { header: 'Kesit Sayısı', key: 'kesit', width: 12 },
    ];
    const cins = name.startsWith('KADIN') ? 'K' : 'E';
    data.forEach((r, i) => {
      ws.addRow({
        sira: i + 1, tc: r.tc, soyad: r.soyad, ad: r.ad,
        dogum: r.dogum, yas: r.yas, cinsiyet: cins,
        calisma: r.calisma, kesit: r.kesit,
      });
    });
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: cins === 'K' ? 'FFFFE4EC' : 'FFE4F0FF' },
    };
    ws.autoFilter = { from: 'A1', to: 'I1' };
  }

  addSheet('KADIN 18-65', kadin);
  addSheet('ERKEK 18-65', erkek);

  await wb.xlsx.writeFile(OUT);
  console.log('Kadın:', kadin.length, 'Erkek:', erkek.length, 'TOPLAM:', kadin.length + erkek.length);
  console.log('YAZILDI:', OUT);
})();
