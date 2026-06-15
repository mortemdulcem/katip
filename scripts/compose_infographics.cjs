const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const W = 1080;
const H = 1080;
const PAD = 20;
const GAP = 12;

const INFOGRAPHICS = [
  {
    id: '01_kunt_travma',
    title: 'KÜNT TRAVMA — YARA TİPLERİ',
    subtitle: 'Blunt Force Trauma Injury Classification',
    layout: 'quad',
    panels: [
      { img: '04_skin_cross.png', label: 'Deri Katmanları\n(Cross-Section)', sublabel: 'Epidermis → Dermis → Subkutan' },
      { img: '01_contusion.png', label: 'Kontüzyon (Ekimoz)', sublabel: 'Subkutan kanama, bası ile solmaz' },
      { img: '02_abrasion.png', label: 'Abrazyon (Sıyrık)', sublabel: 'Epidermal hasar, yön tayini mümkün' },
      { img: '03_laceration.png', label: 'Laserasyon (Yırtık)', sublabel: 'Düzensiz kenar, doku köprüleri sağlam' },
    ],
    ref: 'Knight\'s Forensic Pathology, Ch. 4-5 • DiMaio (2001)',
  },
  {
    id: '02_otopsi',
    title: 'OTOPSİ PROSEDÜRÜ',
    subtitle: 'Forensic Autopsy — Step by Step',
    layout: 'main_bottom3',
    panels: [
      { img: '05_autopsy_room.png', label: 'Otopsi Odası & Dış Muayene', sublabel: 'Kıyafet, yara, artık inceleme' },
      { img: '06_y_incision.png', label: 'Y-İnsizyon', sublabel: 'İç organ diseksiyonu' },
      { img: '07_evidence_kit.png', label: 'Numune Toplama', sublabel: 'Kan, idrar, vitreus, doku' },
      { img: '08_xray.png', label: 'Radyoloji', sublabel: 'Mermi, kırık, yabancı cisim' },
    ],
    ref: 'Saukko & Knight (2016) • ATK Otopsi Protokolü',
  },
  {
    id: '03_atesli_silah',
    title: 'ATEŞLİ SİLAH YARALARI',
    subtitle: 'Gunshot Wounds — Range Determination',
    layout: 'quad',
    panels: [
      { img: '09_entry_wound.png', label: 'Giriş Yarası', sublabel: 'Abrazyon halkası, is, stippling' },
      { img: '11_range_chart.png', label: 'Atış Mesafesi Tayini', sublabel: 'Temas → Yakın → Ara → Uzak' },
      { img: '12_bullet_trajectory.png', label: 'Mermi Trajektörü', sublabel: 'Geçici & kalıcı kavite' },
      { img: '10_ballistics_lab.png', label: 'Balistik Laboratuvarı', sublabel: 'Yiv-set karşılaştırma mikroskobu' },
    ],
    ref: 'DiMaio — Gunshot Wounds (3rd Ed.) • Forensic Sci Int (2024)',
  },
  {
    id: '04_postmortem',
    title: 'POSTMORTEM DEĞİŞİKLİKLER',
    subtitle: 'Ölüm Sonrası Bulgular & Süre Tayini',
    layout: 'quad',
    panels: [
      { img: '13_livor_mortis.png', label: 'Livor Mortis', sublabel: '0.5-2 saat: Sabit hale gelir 8-12 saat' },
      { img: '14_rigor_mortis.png', label: 'Rigor Mortis', sublabel: '2-6 saat başlar, 12 saat tam, 36 saat çözülür' },
      { img: '15_algor_mortis.png', label: 'Algor Mortis', sublabel: 'Vücut sıcaklığı: ~1.5°C/saat düşüş' },
      { img: '16_entomology.png', label: 'Adli Entomoloji', sublabel: 'Böcek döngüsü ile süre tayini' },
    ],
    ref: 'Knight\'s Forensic Pathology, Ch. 2 • Henssge Nomogram',
  },
  {
    id: '05_toksikoloji',
    title: 'ADLİ TOKSİKOLOJİ',
    subtitle: 'Forensic Toxicology — Lab Analysis',
    layout: 'main_bottom3',
    panels: [
      { img: '17_tox_lab.png', label: 'GC-MS / LC-MS Analiz Laboratuvarı', sublabel: 'Kantitatif madde tayini' },
      { img: '18_blood_tubes.png', label: 'Numune Tüpleri', sublabel: 'Kan, idrar, vitreus, saç' },
      { img: '20_fingerprint.png', label: 'Tarama Testleri', sublabel: 'İmmünoassay ön tarama' },
      { img: '25_evidence_collection.png', label: 'Doğrulama', sublabel: 'GC-MS ile kesin tanımlama' },
    ],
    ref: 'Baselt — Disposition of Toxic Drugs (12th Ed.) • Clin Toxicol (2025)',
  },
  {
    id: '06_olay_yeri',
    title: 'OLAY YERİ İNCELEME',
    subtitle: 'Crime Scene Investigation (CSI)',
    layout: 'main_bottom3',
    panels: [
      { img: '19_crime_scene.png', label: 'Olay Yeri Güvenliği & Dokümantasyon', sublabel: 'Bariyer, fotoğraflama, krokiler' },
      { img: '27_forensic_photo.png', label: 'Adli Fotoğrafçılık', sublabel: 'Ölçekli, sistematik kayıt' },
      { img: '20_fingerprint.png', label: 'Parmak İzi Tespiti', sublabel: 'Latent iz geliştirme teknikleri' },
      { img: '25_evidence_collection.png', label: 'Delil Toplama', sublabel: 'Paketleme, zincir, mühür' },
    ],
    ref: 'Lee & Harris — Physical Evidence (2020) • Forensic Sci Int (2024)',
  },
];

function createSVGOverlay(infographic, layoutType) {
  const titleBgH = layoutType === 'main_bottom3' ? 130 : 130;
  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${W}" height="${titleBgH}" fill="rgba(15,23,42,0.92)" />`;
  svg += `<rect x="0" y="${titleBgH - 3}" width="${W}" height="3" fill="#F59E0B" />`;
  svg += `<rect x="${PAD}" y="20" width="5" height="32" rx="2" fill="#F59E0B" />`;
  svg += `<text x="${PAD + 16}" y="46" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="30" fill="#FFFFFF">${esc(infographic.title)}</text>`;
  svg += `<text x="${PAD + 16}" y="76" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="16" fill="rgba(245,158,11,0.85)" font-style="italic">${esc(infographic.subtitle)}</text>`;
  svg += `<text x="${PAD + 16}" y="108" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="13" fill="rgba(255,255,255,0.5)">${esc(infographic.ref)}</text>`;

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

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function compositeQuad(infographic) {
  const panelDir = path.join(__dirname, '..', 'client', 'public', 'infographic_panels');
  const cellW = Math.floor((W - PAD * 2 - GAP) / 2);
  const cellH = Math.floor((H - 130 - 40 - GAP - PAD) / 2);
  const startY = 133;

  const base = sharp({ create: { width: W, height: H, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } } }).png();

  const composites = [];

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = PAD + col * (cellW + GAP);
    const y = startY + row * (cellH + GAP);

    const imgPath = path.join(panelDir, infographic.panels[i].img);
    const panelBuf = await sharp(imgPath).resize(cellW, cellH, { fit: 'cover' }).png().toBuffer();
    composites.push({ input: panelBuf, left: x, top: y });

    const labelBuf = createLabelOverlay(infographic.panels[i], cellW, cellH);
    composites.push({ input: labelBuf, left: x, top: y });

    const borderSvg = Buffer.from(`<svg width="${cellW}" height="${cellH}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${cellW}" height="${cellH}" fill="none" stroke="rgba(245,158,11,0.3)" stroke-width="2" rx="6" /></svg>`);
    composites.push({ input: borderSvg, left: x, top: y });
  }

  composites.push({ input: createSVGOverlay(infographic, 'quad'), left: 0, top: 0 });

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

  const mainPath = path.join(panelDir, infographic.panels[0].img);
  const mainBuf = await sharp(mainPath).resize(mainW, mainH, { fit: 'cover' }).png().toBuffer();
  composites.push({ input: mainBuf, left: PAD, top: startY });

  const mainLabel = createLabelOverlay(infographic.panels[0], mainW, mainH);
  composites.push({ input: mainLabel, left: PAD, top: startY });

  const mainBorder = Buffer.from(`<svg width="${mainW}" height="${mainH}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${mainW}" height="${mainH}" fill="none" stroke="rgba(245,158,11,0.3)" stroke-width="2" rx="6" /></svg>`);
  composites.push({ input: mainBorder, left: PAD, top: startY });

  const bottomY = startY + mainH + GAP;
  for (let i = 0; i < 3; i++) {
    const x = PAD + i * (bottomW + GAP);
    const panel = infographic.panels[i + 1];
    const imgPath = path.join(panelDir, panel.img);
    const panelBuf = await sharp(imgPath).resize(bottomW, bottomH, { fit: 'cover' }).png().toBuffer();
    composites.push({ input: panelBuf, left: x, top: bottomY });

    const labelBuf = createLabelOverlay(panel, bottomW, bottomH);
    composites.push({ input: labelBuf, left: x, top: bottomY });

    const borderSvg = Buffer.from(`<svg width="${bottomW}" height="${bottomH}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${bottomW}" height="${bottomH}" fill="none" stroke="rgba(245,158,11,0.3)" stroke-width="2" rx="6" /></svg>`);
    composites.push({ input: borderSvg, left: x, top: bottomY });
  }

  composites.push({ input: createSVGOverlay(infographic, 'main_bottom3'), left: 0, top: 0 });

  return base.composite(composites).png().toBuffer();
}

async function main() {
  const outDir = path.join(__dirname, '..', 'client', 'public', 'instagram_infographics_v2');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const info of INFOGRAPHICS) {
    let buf;
    if (info.layout === 'quad') {
      buf = await compositeQuad(info);
    } else {
      buf = await compositeMainBottom3(info);
    }
    const outPath = path.join(outDir, `${info.id}.png`);
    fs.writeFileSync(outPath, buf);
    console.log(`✓ ${info.id}`);
  }

  console.log(`\n${INFOGRAPHICS.length} infografik oluşturuldu → ${outDir}`);
}

main().catch(console.error);
