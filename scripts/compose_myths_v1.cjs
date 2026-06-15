const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const W = 1080;
const H = 1080;
const PAD = 24;

const BG_COLOR = { r: 245, g: 237, b: 220, alpha: 1 };
const ACCENT = '#8B0000';

const MYTHS = [
  {
    id: 'mit_01_parmak_izi',
    title: 'PARMAK İZİ HER ZAMAN BULUNUR MU?',
    myth: 'Suçlu parmak izi bırakır ve polis mutlaka bulur!',
    facts: [
      'Olay yerlerinin sadece %10\'unda kullanılabilir parmak izi bulunur (FBI, 2019)',
      'Terli, yağlı veya kuru parmak → iz kalitesi tamamen değişir',
      'Eldiven, silme, yüzey tipi iz bırakmayı engeller',
      'Latent izlerin çoğu eksik veya bulanıktır, eşleştirme yapılamaz',
    ],
    source: 'Champod et al., Fingerprints & Other Ridge Skin Impressions, CRC Press',
    panelImg: '20_fingerprint.png',
  },
  {
    id: 'mit_02_otopsi_olum_nedeni',
    title: 'OTOPSİ HER ZAMAN ÖLÜM NEDENİNİ BULUR MU?',
    myth: 'Otopsi yapılırsa ölüm nedeni kesinlikle anlaşılır!',
    facts: [
      'Otopsilerin %5-10\'unda ölüm nedeni belirlenemez (DiMaio, 2001)',
      'Ani kardiyak ölümlerde makroskopik bulgu olmayabilir',
      'Zehirlenmelerde toksikoloji sonucu 3-6 ay sürebilir',
      'Çürümüş cesetlerde bulgular tamamen kaybolabilir',
    ],
    source: 'DiMaio & DiMaio, Forensic Pathology, 2nd Ed., CRC Press',
    panelImg: '05_autopsy_room.png',
  },
  {
    id: 'mit_03_dna',
    title: 'DNA DELİLİ YANILMAZ MI?',
    myth: 'DNA bulunursa suçlu kesinlikle yakalanır!',
    facts: [
      'Transfer DNA ile masum kişiler suçlanabilir — kontaminasyon riski!',
      'Karışık DNA profillerinin yorumu öznel ve tartışmalıdır',
      'DNA orada olduğunuzu kanıtlar, suçu işlediğinizi değil!',
      'Veritabanında yoksa DNA profili kimseyle eşleşmez',
    ],
    source: 'Butler, Forensic DNA Typing, 3rd Ed., Academic Press',
    panelImg: '21_dna_lab.png',
  },
  {
    id: 'mit_04_yalan_makinesi',
    title: 'YALAN MAKİNESİ GERÇEKTEN ÇALIŞIR MI?',
    myth: 'Poligraf yalan söyleyeni kesin yakalar!',
    facts: [
      'Poligrafın güvenilirliği %60-70 — yazı-tura atmaktan biraz iyi!',
      'ABD Ulusal Bilimler Akademisi: "Poligraf güvenilir değil" (2003)',
      'Stres, ilaç, karşı önlemlerle kolayca yanıltılabilir',
      'Türkiye dahil çoğu ülkede mahkemede delil kabul edilmez',
    ],
    source: 'National Research Council, The Polygraph and Lie Detection, 2003',
    panelImg: '43_court_expert.png',
  },
  {
    id: 'mit_05_kursu_mesafe',
    title: 'ÇIKIŞ YARASI HER ZAMAN GİRİŞTEN BÜYÜK MÜ?',
    myth: 'Çıkış yarası her zaman giriş yarasından büyüktür!',
    facts: [
      'Çıkış yarası bazen girişten küçük olabilir (düşük hızlı mermi)',
      'Sırt yere dayalıysa çıkış yarası giriş gibi görünür (shored exit)',
      'Atipik giriş yaraları büyük olabilir — rikoşe, kemik etkisi',
      'Yara boyutu silahtan çok doku, kemik ve hıza bağlıdır',
    ],
    source: 'DiMaio, Gunshot Wounds, 3rd Ed., CRC Press',
    panelImg: '09_entry_wound.png',
  },
  {
    id: 'mit_06_morluk',
    title: 'MORLUK RENGİ DARBE ZAMANINI GÖSTERİR Mİ?',
    myth: 'Renk sırasıyla kırmızı→mor→yeşil→sarı yaşlanır!',
    facts: [
      'Morluk yaşlandırması bilimsel olarak güvenilir DEĞİL (Langlois, 2007)',
      'Aynı yaştaki morluklarda farklı renkler görülebilir',
      'Deri rengi, derinlik ve lokasyon rengi etkiler',
      'Tek güvenilir bulgu: SARI renk = en az 18 saat',
    ],
    source: 'Langlois & Gresham, J Forensic Sciences, 2007; 52(3):688-91',
    panelImg: '01_contusion.png',
  },
  {
    id: 'mit_07_olum_zamani',
    title: 'ÖLÜM SAATİ KESİN BELİRLENEBİLİR Mİ?',
    myth: 'Vücut sıcaklığı ile ölüm saati kesin bulunur!',
    facts: [
      'Ölüm zamanı tahmini her zaman bir ARALIK\'tır, kesin saat değil!',
      'Vücut sıcaklığı: ±3-5 saat hata payı (Henssge, 1988)',
      'Ortam sıcaklığı, giysi, obezite sonuçları bozar',
      'CSI\'daki "saat 14:23\'te ölmüş" tamamen kurgu',
    ],
    source: 'Henssge et al., Int J Legal Med, 1988; 102:68-75',
    panelImg: '15_algor_mortis.png',
  },
  {
    id: 'mit_08_bicak_yarasi',
    title: 'BIÇAK YARASI BIÇAĞI GÖSTERİR Mİ?',
    myth: 'Yara şekline bakarak bıçak türü belirlenir!',
    facts: [
      'Deri elastik — yara şekli bıçak kesitinden farklı olur',
      'Tek bıçak farklı açılarda farklı yara şekli oluşturur',
      'Langer çizgileri yara şeklini değiştirir',
      'Yara derinliği bıçak uzunluğunu göstermez (baskı kuvveti!)',
    ],
    source: 'Saukko & Knight, Knight\'s Forensic Pathology, 4th Ed., Ch.5',
    panelImg: '03_laceration.png',
  },
  {
    id: 'mit_09_bogulma',
    title: 'BOĞULAN KİŞİNİN AKCİĞERİNDE SU BULUNUR MU?',
    myth: 'Boğulan kişinin akciğerinde mutlaka su vardır!',
    facts: [
      'Kuru boğulma: laringospazm ile akciğere su girmez (%10-15)',
      'Tatlı su çok hızlı emilir — otopside bulunamayabilir',
      'Banyo küvetinde boğulmalarda su miktarı çok az',
      'Diatom (alg) testi bile %100 güvenilir değildir',
    ],
    source: 'Lunetta & Modell, Handbook of Drowning, Springer, 2014',
    panelImg: '36_chemical_invest.png',
  },
  {
    id: 'mit_10_luminol',
    title: 'LUMİNOL PARLADIYSA KAN MIDIR?',
    myth: 'Luminol parladıysa orada kesinlikle kan vardır!',
    facts: [
      'Çamaşır suyu, bakır, yaban turpu da luminol ile parlar!',
      'Yanlış pozitif oranı yüksek — doğrulayıcı test şart',
      'Kastle-Meyer veya LMG ile doğrulama yapılmalıdır',
      'Luminol kan izini seyrelterek DNA analizini zorlaştırır',
    ],
    source: 'Barni et al., Talanta, 2007; 72(3):896-913',
    panelImg: '71_uv_blood.png',
  },
  {
    id: 'mit_11_yangin',
    title: 'KUNDAKLAMA İZİ HER ZAMAN BULUNUR MU?',
    myth: 'Yangın incelenmesinde kundaklama kesinlikle tespit edilir!',
    facts: [
      'V-pattern ve pour pattern gibi izler yanıltıcı olabilir',
      '"Çılgın cam" kundaklama kanıtı değil — hızlı soğuma yapar',
      'Eski yangın göstergelerinin çoğu bilimsel olarak çürütüldü (NFPA 921)',
      'Yangınların %20-30\'unda neden belirlenemiyor',
    ],
    source: 'NFPA 921: Guide for Fire and Explosion Investigations, 2021',
    panelImg: '19_crime_scene.png',
  },
  {
    id: 'mit_12_zehir_koku',
    title: 'ZEHİRLER KOKULARIYLA TANINIR MI?',
    myth: 'Arsenik sarımsak, siyanür badem kokar — kokla bul!',
    facts: [
      'Siyanür kokusunu insanların %20-40\'ı genetik olarak ALAMAZ!',
      'Modern zehirlerin çoğu kokusuz ve tatsızdır (talyum, risin)',
      'Arsenik genellikle kokusuz — arsine gazı sarımsak kokar',
      'Zehir tespiti SADECE laboratuvar analizi ile güvenilir (GC-MS)',
    ],
    source: 'Levine, Principles of Forensic Toxicology, 4th Ed., AACC Press',
    panelImg: '38_poison_symptoms.png',
  },
];

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if (current.length + word.length + 1 > maxChars) {
      lines.push(current.trim());
      current = word + ' ';
    } else {
      current += word + ' ';
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

async function composeMythCard(myth) {
  const panelDir = path.join(__dirname, '..', 'client', 'public', 'infographic_panels');

  const headerH = 90;
  const imgH = 320;
  const mythBoxY = headerH + imgH + 10;
  const mythBoxH = 80;
  const factsStartY = mythBoxY + mythBoxH + 14;
  const footerH = 50;

  const bgBuf = await sharp({
    create: { width: W, height: H, channels: 4, background: BG_COLOR }
  }).png().toBuffer();

  const imgPath = path.join(panelDir, myth.panelImg);
  const imgW = W - PAD * 2;
  const panelBuf = await sharp(imgPath)
    .resize(imgW, imgH, { fit: 'cover' })
    .png()
    .toBuffer();

  const borderBuf = Buffer.from(
    `<svg width="${imgW}" height="${imgH}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="0" y="0" width="${imgW}" height="${imgH}" fill="none" stroke="${ACCENT}" stroke-width="3" />` +
    `</svg>`
  );

  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;

  svg += `<rect x="0" y="0" width="${W}" height="5" fill="${ACCENT}" />`;

  svg += `<rect x="${PAD}" y="16" width="5" height="18" rx="2" fill="${ACCENT}" />`;
  svg += `<text x="${PAD + 16}" y="31" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="13" fill="${ACCENT}" letter-spacing="1">ADL&#x130;  TIP  M&#x130;TLER&#x130;</text>`;

  const titleLines = wrapText(myth.title, 32);
  titleLines.forEach((line, i) => {
    svg += `<text x="${W/2}" y="${55 + i * 28}" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="24" fill="#1a1a1a" text-anchor="middle">${esc(line)}</text>`;
  });

  svg += `<rect x="0" y="${headerH - 3}" width="${W}" height="3" fill="${ACCENT}" />`;

  svg += `<rect x="${PAD}" y="${mythBoxY}" width="${W - PAD*2}" height="${mythBoxH}" rx="8" fill="#FEE2E2" stroke="#DC2626" stroke-width="2" />`;

  svg += `<text x="${PAD + 14}" y="${mythBoxY + 24}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="15" fill="#DC2626">&#x2716;  YANLI&#x15E; B&#x130;LG&#x130;:</text>`;

  const mythLines = wrapText(myth.myth, 46);
  mythLines.forEach((line, i) => {
    svg += `<text x="${PAD + 14}" y="${mythBoxY + 48 + i * 22}" font-family="Georgia, 'Times New Roman', serif" font-weight="600" font-size="18" fill="#991B1B">${esc(line)}</text>`;
  });

  svg += `<rect x="${PAD}" y="${factsStartY - 4}" width="6" height="22" rx="3" fill="#166534" />`;
  svg += `<text x="${PAD + 14}" y="${factsStartY + 14}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="16" fill="#166534">B&#x130;L&#x130;MSEL GERÇEKLER:</text>`;

  const factSpacing = 50;
  myth.facts.forEach((fact, i) => {
    const factLines = wrapText(fact, 50);
    const baseY = factsStartY + 44 + i * factSpacing;

    svg += `<circle cx="${PAD + 10}" cy="${baseY - 4}" r="4" fill="#166534" />`;

    factLines.forEach((fl, j) => {
      svg += `<text x="${PAD + 24}" y="${baseY + j * 20}" font-family="Georgia, 'Times New Roman', serif" font-weight="500" font-size="16" fill="#1a1a1a">${esc(fl)}</text>`;
    });
  });

  const srcLines = wrapText(myth.source, 72);
  srcLines.forEach((sl, i) => {
    svg += `<text x="${PAD}" y="${H - footerH - 18 + i * 13}" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="10" fill="#999999" font-style="italic">${esc(sl)}</text>`;
  });

  svg += `<rect x="0" y="${H - footerH}" width="${W}" height="2" fill="${ACCENT}" />`;
  svg += `<text x="${W - PAD}" y="${H - 18}" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="16" fill="#1a1a1a" text-anchor="end">Nurcan Denli Bay&#x131;r</text>`;
  svg += `<text x="${PAD}" y="${H - 18}" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="11" fill="#888888">adlitipgercekleri</text>`;

  svg += `</svg>`;
  const overlaySvg = Buffer.from(svg);

  return sharp(bgBuf)
    .composite([
      { input: panelBuf, left: PAD, top: headerH },
      { input: borderBuf, left: PAD, top: headerH },
      { input: overlaySvg, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();
}

async function main() {
  const outDir = path.join(__dirname, '..', 'client', 'public', 'instagram_myths');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const myth of MYTHS) {
    try {
      const buf = await composeMythCard(myth);
      fs.writeFileSync(path.join(outDir, `${myth.id}.png`), buf);
      console.log(`OK ${myth.id}`);
    } catch (err) {
      console.error(`FAIL ${myth.id}: ${err.message}`);
    }
  }
  console.log(`\nToplam ${MYTHS.length} mit karti olusturuldu!`);
}

main().catch(console.error);
