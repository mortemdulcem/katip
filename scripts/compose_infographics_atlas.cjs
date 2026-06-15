const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const W = 1080;
const H = 1080;
const PAD = 20;
const GAP = 12;

const INFOGRAPHICS = [
  {
    id: '19_koroner_arter',
    title: 'ANİ KARDİYAK ÖLÜM',
    subtitle: 'Koroner Arter Hastalığı — En Sık Ani Ölüm Nedeni!',
    layout: 'quad',
    panels: [
      { img: '50_coronary_plaque.png', label: 'Ateroskleroz Evreleri', sublabel: 'Yağ çizgisi → plak → tıkanma' },
      { img: '51_heart_coronary.png', label: 'Koroner Arterler', sublabel: 'LAD, LCx, RCA: Kalbi besleyen damarlar' },
      { img: '52_thrombus.png', label: 'Plak Rüptürü & Tromboz', sublabel: 'Plak yırtılır → pıhtı → infarkt' },
      { img: '53_mi_heart.png', label: 'Miyokard İnfarktüsü', sublabel: 'Kalp kası ölümü: 20 dk = geri dönüşümsüz' },
    ],
    ref: 'Fernando & Wijetunge — Color Atlas of Forensic Pathology (2020)',
  },
  {
    id: '20_pulmoner_emboli',
    title: 'UÇAK YOLCULUĞU ÖLDÜREBILIR!',
    subtitle: 'Pulmoner Emboli — Ekonomi Sınıfı Sendromu',
    layout: 'main_bottom3',
    panels: [
      { img: '56_pe_pathway.png', label: 'Bacaktaki Pıhtı Akciğere Gider', sublabel: 'DVT → IVC → Pulmoner Arter → Ani Ölüm' },
      { img: '58_dvt.png', label: 'Derin Ven Trombozu', sublabel: 'Uzun uçuş, hareketsizlik, oral kontraseptif' },
      { img: '57_pe_lungs.png', label: 'Eyer Embolisi', sublabel: 'Pulmoner arter çatalında devasa pıhtı' },
      { img: '59_pe_cross.png', label: 'Akciğer İnfarktüsü', sublabel: 'Hemorajik kama şekilli lezyon' },
    ],
    ref: 'Fernando & Wijetunge (2020) • Virchow Triadı',
  },
  {
    id: '21_beyin_kanamasi',
    title: 'KAFAYA BİR DARBE YETERLİ!',
    subtitle: 'İntrakraniyal Kanama Türleri',
    layout: 'quad',
    panels: [
      { img: '60_subdural.png', label: 'Subdural Hematom', sublabel: 'Köprü venleri yırtılması, yaşlı & alkolikler' },
      { img: '61_berry_aneurysm.png', label: 'Berry Anevrizması', sublabel: 'Willis poligonunda bomba: SAK riski' },
      { img: '62_cerebral_infarct.png', label: 'Serebral İnfarkt', sublabel: 'MCA tıkanması → felç → ölüm' },
      { img: '47_brain_hematoma.png', label: 'Epidural vs Subdural', sublabel: 'Epidural: lucid interval sonrası kötüleşme' },
    ],
    ref: 'Fernando & Wijetunge (2020) • Knight Ch. 5',
  },
];

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function createSVGOverlay(infographic) {
  const titleBgH = 130;
  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${W}" height="${titleBgH}" fill="rgba(15,23,42,0.92)" />`;
  svg += `<rect x="0" y="${titleBgH - 3}" width="${W}" height="3" fill="#F59E0B" />`;
  svg += `<rect x="${PAD}" y="20" width="5" height="32" rx="2" fill="#F59E0B" />`;
  svg += `<text x="${PAD + 16}" y="46" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="30" fill="#FFFFFF">${esc(infographic.title)}</text>`;
  svg += `<text x="${PAD + 16}" y="76" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="16" fill="rgba(245,158,11,0.85)" font-style="italic">${esc(infographic.subtitle)}</text>`;
  svg += `<text x="${PAD + 16}" y="108" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="12" fill="rgba(255,255,255,0.5)">${esc(infographic.ref)}</text>`;
  svg += `<rect x="0" y="${H - 40}" width="${W}" height="40" fill="rgba(15,23,42,0.9)" />`;
  svg += `<text x="${W - PAD}" y="${H - 14}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="14" fill="#F59E0B" text-anchor="end">Nurcan Denli Bayır</text>`;
  svg += `</svg>`;
  return Buffer.from(svg);
}

function createLabelOverlay(panel, w, h) {
  const labelLines = panel.label.split('\n');
  const labelH = 58 + (labelLines.length - 1) * 20;
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="${h - labelH}" width="${w}" height="${labelH}" fill="rgba(15,23,42,0.85)" />`;
  svg += `<rect x="0" y="${h - labelH}" width="${w}" height="3" fill="#F59E0B" />`;
  labelLines.forEach((line, i) => {
    svg += `<text x="10" y="${h - labelH + 22 + i * 20}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="15" fill="#FFFFFF">${esc(line)}</text>`;
  });
  svg += `<text x="10" y="${h - 10}" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="12" fill="rgba(255,255,255,0.7)">${esc(panel.sublabel)}</text>`;
  svg += `</svg>`;
  return Buffer.from(svg);
}

async function compositeQuad(infographic) {
  const panelDir = path.join(__dirname, '..', 'client', 'public', 'infographic_panels');
  const cellW = Math.floor((W - PAD * 2 - GAP) / 2);
  const cellH = Math.floor((H - 130 - 40 - GAP - PAD) / 2);
  const startY = 133;
  const base = sharp({ create: { width: W, height: H, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } } }).png();
  const composites = [];
  for (let i = 0; i < 4; i++) {
    const col = i % 2; const row = Math.floor(i / 2);
    const x = PAD + col * (cellW + GAP); const y = startY + row * (cellH + GAP);
    const panelBuf = await sharp(path.join(panelDir, infographic.panels[i].img)).resize(cellW, cellH, { fit: 'cover' }).png().toBuffer();
    composites.push({ input: panelBuf, left: x, top: y });
    composites.push({ input: createLabelOverlay(infographic.panels[i], cellW, cellH), left: x, top: y });
    composites.push({ input: Buffer.from(`<svg width="${cellW}" height="${cellH}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${cellW}" height="${cellH}" fill="none" stroke="rgba(245,158,11,0.3)" stroke-width="2" rx="6" /></svg>`), left: x, top: y });
  }
  composites.push({ input: createSVGOverlay(infographic), left: 0, top: 0 });
  return base.composite(composites).png().toBuffer();
}

async function compositeMainBottom3(infographic) {
  const panelDir = path.join(__dirname, '..', 'client', 'public', 'infographic_panels');
  const startY = 133;
  const mainH = Math.floor((H - 130 - 40 - GAP * 2 - PAD) * 0.6);
  const mainW = W - PAD * 2;
  const bottomH = H - 130 - 40 - mainH - GAP * 2;
  const bottomW = Math.floor((W - PAD * 2 - GAP * 2) / 3);
  const base = sharp({ create: { width: W, height: H, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } } }).png();
  const composites = [];
  const mainBuf = await sharp(path.join(panelDir, infographic.panels[0].img)).resize(mainW, mainH, { fit: 'cover' }).png().toBuffer();
  composites.push({ input: mainBuf, left: PAD, top: startY });
  composites.push({ input: createLabelOverlay(infographic.panels[0], mainW, mainH), left: PAD, top: startY });
  composites.push({ input: Buffer.from(`<svg width="${mainW}" height="${mainH}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${mainW}" height="${mainH}" fill="none" stroke="rgba(245,158,11,0.3)" stroke-width="2" rx="6" /></svg>`), left: PAD, top: startY });
  const bottomY = startY + mainH + GAP;
  for (let i = 0; i < 3; i++) {
    const x = PAD + i * (bottomW + GAP); const panel = infographic.panels[i + 1];
    const panelBuf = await sharp(path.join(panelDir, panel.img)).resize(bottomW, bottomH, { fit: 'cover' }).png().toBuffer();
    composites.push({ input: panelBuf, left: x, top: bottomY });
    composites.push({ input: createLabelOverlay(panel, bottomW, bottomH), left: x, top: bottomY });
    composites.push({ input: Buffer.from(`<svg width="${bottomW}" height="${bottomH}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${bottomW}" height="${bottomH}" fill="none" stroke="rgba(245,158,11,0.3)" stroke-width="2" rx="6" /></svg>`), left: x, top: bottomY });
  }
  composites.push({ input: createSVGOverlay(infographic), left: 0, top: 0 });
  return base.composite(composites).png().toBuffer();
}

async function main() {
  const outDir = path.join(__dirname, '..', 'client', 'public', 'instagram_infographics_v2');
  for (const info of INFOGRAPHICS) {
    let buf = info.layout === 'quad' ? await compositeQuad(info) : await compositeMainBottom3(info);
    fs.writeFileSync(path.join(outDir, `${info.id}.png`), buf);
    console.log(`✓ ${info.id}`);
  }
  console.log(`\n${INFOGRAPHICS.length} atlas infografik oluşturuldu`);
}

main().catch(console.error);
