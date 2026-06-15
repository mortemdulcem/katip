const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const W = 1080;
const H = 1080;
const PAD = 20;
const GAP = 12;

const INFOGRAPHICS = [
  {
    id: '13_olum_mu_cinayet_mi',
    title: 'ÖLÜM MÜ, CİNAYET Mİ?',
    subtitle: 'Adli Tıp Nasıl Ayırt Eder?',
    layout: 'main_bottom3',
    panels: [
      { img: '70_murder_mystery.png', label: 'Her Şüpheli Ölüm Araştırılır', sublabel: 'Doğal mı? Kaza mı? İntihar mı? Cinayet mi?' },
      { img: '71_uv_blood.png', label: 'Gizli Kanıtlar', sublabel: 'UV ışık altında görünmeyen izler' },
      { img: '86_bones_id.png', label: 'Kemik Analizi', sublabel: 'Yaş, boy, cinsiyet, ölüm nedeni' },
      { img: '87_face_recon.png', label: 'Yüz Rekonstrüksiyonu', sublabel: 'Kafatasından kimlik tespiti' },
    ],
    ref: 'Knight\'s Forensic Pathology • DiMaio & DiMaio (2001)',
  },
  {
    id: '14_unlu_zehirlenmeler',
    title: 'TARİHİN EN ÜNLÜ ZEHİRLENMELERİ',
    subtitle: 'Mükemmel Cinayet Diye Bir Şey Yoktur',
    layout: 'quad',
    panels: [
      { img: '72_poison_history.png', label: 'Zehir: Kralların Silahı', sublabel: 'Arsenik yüzyıllarca tespit edilemedi' },
      { img: '73_napoleon.png', label: 'Napoleon & Arsenik', sublabel: 'Yeşil duvar kağıdı: Scheele yeşili (CuHAsO₃)' },
      { img: '74_polonium.png', label: 'Litvinenko & Polonyum-210', sublabel: '2006: Çay bardağından radyoaktif iz' },
      { img: '37_gcms_analysis.png', label: 'Modern Toksikoloji', sublabel: '1 mL kandan 1500+ madde taranır' },
    ],
    ref: 'Trestrail — Criminal Poisoning (3rd Ed.) • Forensic Toxicol (2025)',
  },
  {
    id: '15_soguk_vakalar',
    title: '30 YIL SONRA YAKALANDI!',
    subtitle: 'DNA ile Çözülen Soğuk Vakalar',
    layout: 'main_bottom3',
    panels: [
      { img: '75_cold_case.png', label: 'Soğuk Vaka Dosyası Yeniden Açıldı', sublabel: '30 yıllık deliller modern teknikle analiz' },
      { img: '76_dna_cold.png', label: 'Touch DNA', sublabel: '5-10 hücre yeterli! Kapı kolu, silah sapı' },
      { img: '77_genealogy.png', label: 'Genetik Soy Ağacı', sublabel: 'GEDmatch: Akrabadan katile ulaşma' },
      { img: '78_suspect_board.png', label: 'Golden State Killer', sublabel: '1974-1986: 44 yıl sonra DNA ile yakalandı' },
    ],
    ref: 'Innocence Project (2025) • Nature Genet (2024)',
  },
  {
    id: '16_dizi_vs_gercek',
    title: 'OTOPSİ: DİZİ vs GERÇEK',
    subtitle: 'CSI Etkisi — Hollywood Yalan Söylüyor!',
    layout: 'quad',
    panels: [
      { img: '79_tv_vs_real.png', label: 'TV: 5 Dakikada Sonuç', sublabel: 'Gerçek: DNA analizi 3-6 hafta sürer!' },
      { img: '05_autopsy_room.png', label: 'Gerçek Otopsi Odası', sublabel: 'Steril değil! Koku korkunç, 3-4 saat sürer' },
      { img: '71_uv_blood.png', label: 'Luminol Sadece İlk Adım', sublabel: 'Her parıltı kan değil, doğrulama şart' },
      { img: '19_crime_scene.png', label: 'Olay Yeri: Saatler Sürer', sublabel: 'Dizide 5 dk, gerçekte 8-12 saat inceleme' },
    ],
    ref: 'The CSI Effect — J Forensic Sci (2024)',
  },
  {
    id: '17_dijital_delil',
    title: 'TELEFONUNUZ HER ŞEYİ BİLİYOR',
    subtitle: 'Deepfake, Dijital Delil & Adli Bilişim',
    layout: 'main_bottom3',
    panels: [
      { img: '80_digital_forensics.png', label: 'Telefonunuz = Tanığınız', sublabel: 'Silinen mesajlar bile geri getirilebilir!' },
      { img: '81_deepfake.png', label: 'Deepfake Tehlikesi', sublabel: 'Sahte video ile masum insanlar suçlanıyor' },
      { img: '82_phone_extract.png', label: 'Veri Çıkarma', sublabel: 'Cellebrite: Kilitli telefondan bile veri alınır' },
      { img: '83_iris.png', label: 'Biyometrik Kimlik', sublabel: 'İris deseni parmak izinden bile benzersiz' },
    ],
    ref: 'Digital Investigation (2025) • J Forensic Sci (2024)',
  },
  {
    id: '18_vucudunuz_ele_veriyor',
    title: 'VÜCUDUNUZ SİZİ ELE VERİYOR',
    subtitle: 'Saç, Tırnak, Göz — Gizli Deliller',
    layout: 'quad',
    panels: [
      { img: '84_hair_micro.png', label: 'Tek Bir Saç Teli', sublabel: 'Irk, ilaç kullanımı, beslenme, DNA' },
      { img: '85_nail_uv.png', label: 'Tırnak Altı Sırları', sublabel: 'Saldırgan DNA\'sı tırnak kazıntısında!' },
      { img: '83_iris.png', label: 'İris: Doğanın Barkodu', sublabel: '6 aylıkken oluşur, ölene kadar değişmez' },
      { img: '87_face_recon.png', label: 'Kafatasından Yüz', sublabel: 'Doku kalınlığı ile kimlik tespiti mümkün' },
    ],
    ref: 'Saferstein — Criminalistics (13th Ed.) • Forensic Sci Int (2025)',
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
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = PAD + col * (cellW + GAP);
    const y = startY + row * (cellH + GAP);
    const imgPath = path.join(panelDir, infographic.panels[i].img);
    const panelBuf = await sharp(imgPath).resize(cellW, cellH, { fit: 'cover' }).png().toBuffer();
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
  const mainPath = path.join(panelDir, infographic.panels[0].img);
  const mainBuf = await sharp(mainPath).resize(mainW, mainH, { fit: 'cover' }).png().toBuffer();
  composites.push({ input: mainBuf, left: PAD, top: startY });
  composites.push({ input: createLabelOverlay(infographic.panels[0], mainW, mainH), left: PAD, top: startY });
  composites.push({ input: Buffer.from(`<svg width="${mainW}" height="${mainH}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${mainW}" height="${mainH}" fill="none" stroke="rgba(245,158,11,0.3)" stroke-width="2" rx="6" /></svg>`), left: PAD, top: startY });
  const bottomY = startY + mainH + GAP;
  for (let i = 0; i < 3; i++) {
    const x = PAD + i * (bottomW + GAP);
    const panel = infographic.panels[i + 1];
    const imgPath = path.join(panelDir, panel.img);
    const panelBuf = await sharp(imgPath).resize(bottomW, bottomH, { fit: 'cover' }).png().toBuffer();
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
  console.log(`\n${INFOGRAPHICS.length} popüler infografik oluşturuldu`);
}

main().catch(console.error);
