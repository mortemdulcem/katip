const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const W = 1080;
const H = 1080;
const PAD = 20;
const GAP = 12;

const INFOGRAPHICS = [
  {
    id: '07_atesli_silah_ballistik',
    title: 'ATEŞLİ SİLAH BALİSTİĞİ',
    subtitle: 'Namlu, Yiv-Set & Mermi İnceleme',
    layout: 'main_bottom3',
    panels: [
      { img: '30_handgun_mech.png', label: 'Silah Mekanizması', sublabel: 'Tetik → iğne → kapsül → barut → mermi' },
      { img: '31_rifling.png', label: 'Yiv-Set (Rifling)', sublabel: 'Namlu içi spiral oluklar, sınıf karakteristik' },
      { img: '35_shotgun_shell.png', label: 'Fişek Bileşenleri', sublabel: 'Kapsül, barut, saçma, wad, kovan' },
      { img: '33_cartridge_marks.png', label: 'Kovan İzleri', sublabel: 'İğne, sürgü yüzü, ejektör izi' },
    ],
    ref: 'DiMaio — Gunshot Wounds (3rd Ed.) • AFTE Journal (2025)',
  },
  {
    id: '08_mermi_kovan_karsilastirma',
    title: 'MERMİ-KOVAN KARŞILAŞTIRMA',
    subtitle: 'NIBIN & Comparison Microscopy',
    layout: 'quad',
    panels: [
      { img: '32_comparison_micro.png', label: 'Karşılaştırma Mikroskobu', sublabel: 'İki mermi eş zamanlı inceleme' },
      { img: '33_cartridge_marks.png', label: 'Kovan Üzeri İzler', sublabel: 'İğne, sürgü, ejektör, ekstraktör' },
      { img: '34_nibin.png', label: 'NIBIN Veritabanı', sublabel: '3D yüzey tarama, otomatik eşleme' },
      { img: '31_rifling.png', label: 'Striasyon Analizi', sublabel: 'Bireysel karakteristik, her namlu benzersiz' },
    ],
    ref: 'ATF-NIBIN Program • Forensic Sci Int (2024)',
  },
  {
    id: '09_kimyasal_zehirlenme',
    title: 'KİMYASAL ZEHİRLENME SORUŞTURMASI',
    subtitle: 'Vaka: Otel İçi Kimyasal Maruziyet (2025)',
    layout: 'quad',
    panels: [
      { img: '36_chemical_invest.png', label: 'Olay Yeri İnceleme', sublabel: 'HAZMAT ekibi, hava/yüzey numunesi' },
      { img: '38_poison_symptoms.png', label: 'Zehirlenme Bulguları', sublabel: 'Bulantı, solunum sıkıntısı, organ hasarı' },
      { img: '37_gcms_analysis.png', label: 'GC-MS Kimyasal Analiz', sublabel: 'Toksik madde kesin tanımlama' },
      { img: '39_food_samples.png', label: 'Numune Zinciri', sublabel: 'Gıda, su, hava → delil mühürü → lab' },
    ],
    ref: 'Böcek Ailesi Vakası (İstanbul 2025) • Clin Toxicol (2025)',
  },
  {
    id: '10_tibbi_malpraktis',
    title: 'TIBBİ MALPRAKTİS & ADLİ TIP',
    subtitle: 'Hekim Kusuru Değerlendirmesi — ATK Raporu',
    layout: 'main_bottom3',
    panels: [
      { img: '40_nicu.png', label: 'Hastane Ortamı & Klinik Kayıtlar', sublabel: 'Dosya, tedavi protokolü, ilaç takibi' },
      { img: '41_malpractice.png', label: 'Dosya İnceleme', sublabel: 'ATK ihtisas kurulu değerlendirmesi' },
      { img: '42_negligence_flow.png', label: 'Kusur Analizi', sublabel: 'Standart tedavi vs uygulanan tedavi' },
      { img: '43_court_expert.png', label: 'Bilirkişi İfadesi', sublabel: 'Mahkemede uzman tanıklık' },
    ],
    ref: 'Yenidoğan Davası (2025) • TCK 85, 89 • ATK İhtisas Kurulu',
  },
  {
    id: '11_bas_boyun_travma',
    title: 'BAŞ-BOYUN TRAVMA ANATOMİSİ',
    subtitle: 'Klinik Yönleriyle Topografik Anatomi',
    layout: 'quad',
    panels: [
      { img: '44_head_neck.png', label: 'Baş-Boyun Kesit Anatomisi', sublabel: 'Kafatası, beyin, servikal vertebra' },
      { img: '45_skull_anatomy.png', label: 'Kafatası Kırık Paternleri', sublabel: 'Pterion: En zayıf nokta, epidural kanama' },
      { img: '46_neck_structures.png', label: 'Boyun Yapıları', sublabel: 'Hyoid, tiroid, krikoid, trakea' },
      { img: '47_brain_hematoma.png', label: 'İntrakraniyal Kanama', sublabel: 'Epidural vs subdural hematom' },
    ],
    ref: 'Kahraman Yıldırım et al. — Topografik Anatomi (İÜC, 2023)',
  },
  {
    id: '12_uyusturucu_tespiti',
    title: 'UYUŞTURUCU TESPİT YÖNTEMLERİ',
    subtitle: 'Kan, İdrar, Saç & Tükürük Testleri',
    layout: 'main_bottom3',
    panels: [
      { img: '48_hair_test.png', label: 'Saç Analizi — Uzun Süreli Tespit', sublabel: 'Segmental analiz: aylık kullanım öyküsü' },
      { img: '18_blood_tubes.png', label: 'Kan Testi', sublabel: 'Aktif madde: 1-3 gün tespit penceresi' },
      { img: '49_detection_windows.png', label: 'Tespit Süreleri', sublabel: 'Kan < İdrar < Saç (90+ gün)' },
      { img: '37_gcms_analysis.png', label: 'GC-MS Doğrulama', sublabel: 'İmmünoassay tarama → kesin sonuç' },
    ],
    ref: 'Güncel Haberler (2025) • J Anal Toxicol (2025) • ATK Lab',
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
  svg += `<text x="${PAD + 16}" y="46" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="28" fill="#FFFFFF">${esc(infographic.title)}</text>`;
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
    const labelBuf = createLabelOverlay(infographic.panels[i], cellW, cellH);
    composites.push({ input: labelBuf, left: x, top: y });
    const borderSvg = Buffer.from(`<svg width="${cellW}" height="${cellH}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${cellW}" height="${cellH}" fill="none" stroke="rgba(245,158,11,0.3)" stroke-width="2" rx="6" /></svg>`);
    composites.push({ input: borderSvg, left: x, top: y });
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
  composites.push({ input: createSVGOverlay(infographic), left: 0, top: 0 });
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
  console.log(`\n${INFOGRAPHICS.length} yeni infografik oluşturuldu`);
}

main().catch(console.error);
