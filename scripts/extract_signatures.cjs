/**
 * Taranmış form sayfalarından imza hücrelerini kırpar.
 * Grid çizgileri otomatik tespit edilmiş kesin koordinatlar kullanılıyor.
 *
 * Kullanım: node scripts/extract_signatures.cjs
 */
const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

// ─── Katılımcı metadata ──────────────────────────────────────────────────────
const PARTICIPANTS = [
  {
    code:   'P004',
    no:      4,
    gender: 'E',
    age:     37,
    hand:   'Sol',
    pages: [
      { file: 'attached_assets/202512181203_page_00_1773300350870.png', cols: 2 },
      { file: 'attached_assets/202512181203_page_01_1773300350871.png', cols: 4 },
      { file: 'attached_assets/202512181203_page_02_1773300350871.png', cols: 4 },
      { file: 'attached_assets/202512181203_page_03_1773300350872.png', cols: 4 },
      { file: 'attached_assets/202512181203_page_04_1773300350872.png', cols: 4 },
      { file: 'attached_assets/202512181203_page_05_1773300350872.png', cols: 4 },
      { file: 'attached_assets/202512181203_page_06_1773300350872.png', cols: 4 },
      { file: 'attached_assets/202512181203_page_07_1773300350873.png', cols: 4 },
    ],
  },
  // Yeni katılımcılar buraya eklenecek:
  // { code: 'P001', no: 1, gender: 'K', age: 29, hand: 'Sağ', pages: [...] },
];

// ─── Tespit edilmiş kesin grid koordinatları ─────────────────────────────────
//
// 4-sütunlu sayfalar (page_01..07):
//   Dikey ayraçlar: [560, 1327, 2278, 3231, 4190]
//   → Sütun aralıkları: (560,1327) (1327,2278) (2278,3231) (3231,4190)
//
// 2-sütunlu sayfa (page_00):
//   Dikey ayraçlar: [787, 1734, 2686]
//   → Sütun aralıkları: (787,1734) (1734,2686)
//
// Yatay ayraçlar (tüm sayfalar):
//   [157, 1108, 2050, 2992, 3939, 4878, 5816, 6723]
//   → 7 satır (imza→alfa)

const GRID_4COL = {
  vLines: [560, 1327, 2278, 3231, 4190],  // 5 çizgi → 4 sütun
  hLines: [157, 1108, 2050, 2992, 3939, 4878, 5816, 6723],  // 8 çizgi → 7 satır
};
const GRID_2COL = {
  vLines: [787, 1734, 2686],  // 3 çizgi → 2 sütun
  hLines: [167, 1108, 2049, 2991, 3935, 4876, 5811, 6720],  // 8 çizgi → 7 satır
};

const SHAPES      = ['imza', 'paraf', 'W', 'S', 'I', 'O', 'alfa'];
const SHAPES_ORIG = ['imza', 'paraf', 'W', 'Ş', 'İ', 'O', 'α'];

const OUTPUT_DIR = 'data/signatures_dataset';
const BORDER_PAD = 30;   // grid çizgisi kalınlığı + güvenlik payı (px)
const CONTENT_PAD = 40;  // içerik etrafına eklenen beyaz boşluk (px)
const OUTPUT_SIZE = 512; // çıktı boyutu (px × px)

const csvRows = ['participant_code,participant_no,gender,age,hand,shape,shape_orig,rep_number,file_path'];

// ─── Yardımcı: hücre içeriğinin bounding box'ını bul ─────────────────────────
async function findContentBBox(imgBuffer) {
  const { data, info } = await sharp(imgBuffer)
    .toColorspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width, H = info.height, C = info.channels;
  const THRESHOLD = 180; // piksel değeri bu değerin altındaysa "içerik" sayılır

  let minX = W, maxX = 0, minY = H, maxY = 0;
  let hasContent = false;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const r = data[(y * W + x) * C];
      if (r < THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasContent = true;
      }
    }
  }

  if (!hasContent) return null;
  return { minX, maxX, minY, maxY, width: W, height: H };
}

// ─── Yardımcı: tek hücreyi kırp, ortala ve 512×512 PNG'ye dönüştür ────────────
async function processCell(pageFile, left, top, width, height, outFile) {
  // 1. Hücre içeriğini al (border padding ile)
  const cellBuf = await sharp(pageFile)
    .toColorspace('srgb')
    .extract({ left, top, width, height })
    .toBuffer();

  // 2. İçeriğin bounding box'ını tespit et
  const bbox = await findContentBBox(cellBuf);

  let finalBuf;
  if (!bbox) {
    // İçerik yok → tamamen beyaz kare
    finalBuf = await sharp({
      create: { width: OUTPUT_SIZE, height: OUTPUT_SIZE, channels: 3, background: { r: 255, g: 255, b: 255 } }
    }).png().toBuffer();
  } else {
    // 3. Bounding box etrafına padding ekle
    const padX1 = Math.max(0, bbox.minX - CONTENT_PAD);
    const padY1 = Math.max(0, bbox.minY - CONTENT_PAD);
    const padX2 = Math.min(bbox.width - 1, bbox.maxX + CONTENT_PAD);
    const padY2 = Math.min(bbox.height - 1, bbox.maxY + CONTENT_PAD);
    const cW = padX2 - padX1;
    const cH = padY2 - padY1;

    // 4. Content alanını kırp
    const contentBuf = await sharp(cellBuf)
      .extract({ left: padX1, top: padY1, width: cW, height: cH })
      .toBuffer();

    // 5. En-boy oranı koruyarak 512×512 içine sığdır (beyaz arka plan)
    finalBuf = await sharp({
      create: { width: OUTPUT_SIZE, height: OUTPUT_SIZE, channels: 3, background: { r: 255, g: 255, b: 255 } }
    })
      .composite([{
        input: await sharp(contentBuf)
          .resize(OUTPUT_SIZE - 2 * CONTENT_PAD, OUTPUT_SIZE - 2 * CONTENT_PAD, {
            fit: 'inside',
            background: { r: 255, g: 255, b: 255 },
          })
          .png()
          .toBuffer(),
        gravity: 'center',
      }])
      .png()
      .toBuffer();
  }

  await sharp(finalBuf).toFile(outFile);
}

// ─── Ana çıkarım fonksiyonu ──────────────────────────────────────────────────
async function extractParticipant(p) {
  console.log(`\n▶ Katılımcı: ${p.code} (no=${p.no}, cinsiyet=${p.gender}, yaş=${p.age})`);
  const repCounters = {};
  SHAPES.forEach(s => repCounters[s] = 0);

  for (const pageInfo of p.pages) {
    if (!fs.existsSync(pageInfo.file)) {
      console.warn(`  ⚠ Dosya bulunamadı: ${pageInfo.file}`);
      continue;
    }

    const grid = pageInfo.cols === 4 ? GRID_4COL : GRID_2COL;
    const vLines = grid.vLines;
    const hLines = grid.hLines;
    const numCols = vLines.length - 1;
    const numRows = hLines.length - 1;

    console.log(`  Sayfa: ${path.basename(pageInfo.file)} | ${numCols} sütun | ${numRows} satır`);

    for (let row = 0; row < numRows; row++) {
      const shapeName = SHAPES[row];
      const shapeOrig = SHAPES_ORIG[row];
      const shapeDir  = path.join(OUTPUT_DIR, p.code, shapeName);
      fs.mkdirSync(shapeDir, { recursive: true });

      const rowTop    = hLines[row]     + BORDER_PAD;
      const rowBottom = hLines[row + 1] - BORDER_PAD;
      const cellH     = rowBottom - rowTop;

      for (let col = 0; col < numCols; col++) {
        const colLeft  = vLines[col]     + BORDER_PAD;
        const colRight = vLines[col + 1] - BORDER_PAD;
        const cellW    = colRight - colLeft;

        repCounters[shapeName]++;
        const repStr  = String(repCounters[shapeName]).padStart(3, '0');
        const outFile = path.join(shapeDir, `${repStr}.png`);
        const relPath = path.relative('.', outFile);

        await processCell(pageInfo.file, colLeft, rowTop, cellW, cellH, outFile);

        csvRows.push([
          p.code, p.no, p.gender, p.age, p.hand,
          shapeName, shapeOrig, repCounters[shapeName], relPath
        ].join(','));

        process.stdout.write(`    ${shapeName} ${repStr} ✓\r`);
      }
    }
  }

  console.log(`\n  ✅ ${p.code} tamamlandı.`);
  SHAPES.forEach(s => console.log(`     ${s}: ${repCounters[s]} örnek`));
}

// ─── Çalıştır ────────────────────────────────────────────────────────────────
(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const p of PARTICIPANTS) {
    await extractParticipant(p);
  }

  const csvPath = path.join(OUTPUT_DIR, 'metadata.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n') + '\n');
  console.log(`\n✅ Bitti. metadata.csv: ${csvRows.length - 1} kayıt → ${csvPath}`);
})().catch(err => { console.error(err); process.exit(1); });
