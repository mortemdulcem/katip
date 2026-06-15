const sharp = require('sharp');
const path = require('path');

const W = 1080, H = 1080;

const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const POSTERS = [
  {
    file: '01_ai_adli_tip.png',
    num: '01',
    title: 'Yapay Zeka ve Adli Tıp',
    subtitle: 'AI Destekli Otopsi & Görüntü Analizi',
    points: [
      { head: 'Derin öğrenme ile otomatik doku sınıflandırma', body: 'CNN tabanlı histopatolojik analiz %95+ doğruluk oranı' },
      { head: 'Post-mortem CT/MR görüntülerinde AI tespiti', body: 'Kırık, kanama, emboli otomatik segmentasyonu' },
      { head: 'Ölüm sebebi tahmininde makine öğrenmesi', body: 'Çok değişkenli regresyon + Random Forest modelleri' },
    ],
    ref: 'Forensic Sci Int (2024), J Forensic Legal Med (2025)'
  },
  {
    file: '02_adli_genetik.png',
    num: '02',
    title: 'Adli Genetik Güncellemeleri',
    subtitle: 'Yeni Nesil Sekanslama & DNA Fenotipleme',
    points: [
      { head: 'NGS ile küçük DNA fragmentlerinden profilleme', body: 'Degraded örneklerde STR+SNP kombine analiz' },
      { head: 'DNA fenotipleme: Yüz, göz, saç rengi tahmini', body: 'HIrisPlex-S sistemi ile %85+ prediktif doğruluk' },
      { head: 'Forensik epigenetik: Yaş ve doku tayini', body: 'Metilasyon saatleri ±3 yıl hata payı ile yaş tahmini' },
    ],
    ref: 'Int J Legal Med (2025), Forensic Sci Int Genet (2024)'
  },
  {
    file: '03_sentetik_maddeler.png',
    num: '03',
    title: 'Yeni Sentetik Maddeler',
    subtitle: 'Adli Toksikolojide Güncel Tehditler',
    points: [
      { head: 'Nitazen grubu: Fentanilden 10x güçlü opioidler', body: 'İsotonitazene, metonitazene — LC-MS/MS ile tespit' },
      { head: 'Sentetik kannabinoidlerde yeni nesil bileşikler', body: 'MDMB-4en-PINACA, ADB-BUTINACA yapısal varyantları' },
      { head: 'Xylazine (Tranq): Opioid krizi yeni boyut', body: 'Non-opioid veteriner sedatif, nalokson yanıtsız' },
    ],
    ref: 'Drug Test Analysis (2025), Clin Toxicol (2024)'
  },
  {
    file: '04_dijital_adli_tip.png',
    num: '04',
    title: 'Dijital Adli Tıp',
    subtitle: 'Siber Otopsi & Dijital Kanıt Analizi',
    points: [
      { head: 'IoT cihaz verisi ile ölüm zamanı doğrulama', body: 'Akıllı saat, fitness tracker — son aktivite kaydı' },
      { head: 'Deepfake tespiti adli bilişim uygulamaları', body: 'GAN üretimi sahte görüntü/video forensik analizi' },
      { head: 'Blockchain tabanlı dijital kanıt zinciri', body: 'Değiştirilemez kanıt bütünlüğü ve zaman damgası' },
    ],
    ref: 'Digital Investigation (2025), J Forensic Sci (2024)'
  },
  {
    file: '05_virtopsi.png',
    num: '05',
    title: 'Ölüm Sonrası Görüntüleme',
    subtitle: 'Virtopsi: Post-Mortem CT & MR',
    points: [
      { head: 'PM-CT ile non-invaziv travma değerlendirme', body: 'Kırıklar, hava embolisi, yabancı cisim lokalizasyonu' },
      { head: 'PM-MR ile yumuşak doku patolojisi', body: 'Beyin ödemi, miyokard lezyonları, organ hasarı' },
      { head: 'CT-anjiografi: Vasküler yaralanma haritalama', body: '3D rekonstrüksiyon ile cerrahi korelasyon' },
    ],
    ref: 'Forensic Sci Med Pathol (2025), Radiology (2024)'
  },
  {
    file: '06_malpraktis.png',
    num: '06',
    title: 'Medikolegal Malpraktis',
    subtitle: 'Tıbbi Hata & Hukuki Sorumluluk Güncellemeleri',
    points: [
      { head: 'Komplikasyon vs malpraktis ayrımında yeni kriterler', body: 'Yargıtay içtihatlarında "öngörülebilirlik" ölçütü' },
      { head: 'Aydınlatılmış onam eksikliğinde ispat yükü', body: 'Hasta özerkliği ve bilgilendirilme hakkı genişlemesi' },
      { head: 'Robotik cerrahi ve AI kararlarında sorumluluk', body: 'Algoritma hatası: Üretici mi, hekim mi sorumlu?' },
    ],
    ref: 'Türkiye Klinikleri Adli Tıp (2025), Med Law (2024)'
  },
  {
    file: '07_biomarkerlar.png',
    num: '07',
    title: 'Adli Patolojide Yeni Biomarkerlar',
    subtitle: 'Moleküler Tanı & İmmünohistokimya',
    points: [
      { head: 'Kardiyak troponin T/I post-mortem yorumu', body: 'Ani kardiyak ölümde serum vs perikard sıvısı korelasyonu' },
      { head: 'S100B ve NSE: Travmatik beyin hasarı belirteci', body: 'BOS ve vitröz hümörde ölçüm protokolleri' },
      { head: 'miRNA profilleme ile ölüm nedeni tayini', body: 'Organ-spesifik miRNA panelleri: Boğulma vs asfiksi' },
    ],
    ref: 'Int J Legal Med (2025), Forensic Sci Int (2024)'
  },
  {
    file: '08_cocuk_yas_siniri.png',
    num: '08',
    title: 'Suça Sürüklenen Çocuklar',
    subtitle: 'Cezai Sorumluluk Yaş Sınırı Tartışması',
    points: [
      { head: 'TCK m.31: 12 yaş altı cezai ehliyetsizlik', body: 'Nörobilimsel kanıtlar: Prefrontal korteks 25 yaşa dek gelişir' },
      { head: 'Yaş sınırı düşürme tartışması: Lehte argümanlar', body: 'Organize suçta çocuk istismarının önlenmesi' },
      { head: 'Karşıt görüş: Çocuk hakları perspektifi', body: 'BM Çocuk Hakları Sözleşmesi m.40 ve rehabilitasyon ilkesi' },
    ],
    ref: 'Ankara Barosu Dergisi (2025), Çocuk Hakları Araştırmaları (2024)'
  },
  {
    file: '09_tck_yaralama.png',
    num: '09',
    title: 'TCK Yaralama Rehberi',
    subtitle: 'Revizyon İhtiyacı & Güncel Sorunlar',
    points: [
      { head: 'Kemik kırığı sınıflandırmasında güncel sorunlar', body: 'Basit/çoklu kırık ayrımında radyolojik kriterler yetersiz' },
      { head: 'Yüzde sabit iz: Estetik ve fonksiyonel değerlendirme', body: 'Objektif skorlama sistemi ihtiyacı (POSAS, VSS)' },
      { head: 'Yaşamsal tehlike kavramında belirsizlikler', body: 'GKS skoru, ISS ve AIS entegrasyonu önerisi' },
    ],
    ref: 'Adli Tıp Bülteni (2025), ATK Protokolleri (2024)'
  },
  {
    file: '10_travma_mekanigi.png',
    num: '10',
    title: 'Travma Mekaniği & İlliyet',
    subtitle: 'Biyomekanik Modelleme & Nedensellik Analizi',
    points: [
      { head: 'Sonlu eleman analizi (FEA) ile çarpışma simülasyonu', body: 'Kafa travmasında HIC ve BrIC kriterleri' },
      { head: 'İlliyet bağı: Conditio sine qua non genişletilmesi', body: 'Çoklu neden analizinde olasılıksal nedensellik' },
      { head: 'Düşme vs darbe ayrımında biyomekanik kanıt', body: 'Hız-kuvvet-deformasyon analizi ile mekanizma tayini' },
    ],
    ref: 'J Biomechanics (2025), Forensic Sci Int (2024)'
  },
  {
    file: '11_yeni_kanunlar.png',
    num: '11',
    title: 'Tartışmalı Yeni Düzenlemeler',
    subtitle: 'Adli Tıbbı İlgilendiren Kanun & Yönetmelikler',
    points: [
      { head: 'İstanbul Sözleşmesi sonrası aile içi şiddet mevzuatı', body: '6284 sayılı Kanun uygulamasında güncel sorunlar' },
      { head: 'Zorunlu adli muayene protokolü değişiklikleri', body: 'Cinsel istismar muayenesinde yeni standartlar' },
      { head: 'Adli Tıp Kurumu yeniden yapılanma tartışmaları', body: 'Bağımsızlık, bilirkişilik reformu ve akreditasyon' },
    ],
    ref: 'Resmi Gazete (2025), Yargıtay CGK Kararları (2024-25)'
  },
  {
    file: '12_histopatoloji_islam.png',
    num: '12',
    title: 'Adli Histopatoloji & İslam Hukuku',
    subtitle: 'Geleneksel Tıp Hukuku ile Modern Patolojinin Kesişimi',
    points: [
      { head: 'İslam hukukunda diyet ve erş tazminatları', body: 'Hanefi-Şafii mezheplerinde yaralama sınıflandırması karşılaştırması' },
      { head: 'Otopsi ve organ nakli: Fıkhi perspektif', body: 'Zaruret ilkesi ve maslahat dengesi (Diyanet fetvaları)' },
      { head: 'Histopatolojik bulgunun hukuki delil değeri', body: 'Yara yaşı tayininde vital reaksiyon ile İslami şahitlik kuralları' },
    ],
    ref: 'İslam Hukuku Araştırmaları (2024), Diyanet İlmi Dergi (2025)'
  },
  {
    file: '13_adli_entomoloji.png',
    num: '13',
    title: 'Adli Entomoloji',
    subtitle: 'Böcek Kanıtı ile Ölüm Zamanı Tahmini',
    points: [
      { head: 'Calliphoridae yaşam döngüsü ile PMI hesaplama', body: 'ADD (Accumulated Degree Days) modeli — iklim korelasyonu' },
      { head: 'Kentsel vs kırsal entomofauna farklılıkları', body: 'Türkiye coğrafyasına özgü tür katalogları oluşturulması' },
      { head: 'Toksikolojik entomoloji: Larva analizinde madde tespiti', body: 'İlaç/zehir metabolitlerinin larva dokusundan LC-MS ile tayini' },
    ],
    ref: 'J Med Entomol (2025), Forensic Sci Int (2024)'
  },
  {
    file: '14_kemik_yasi.png',
    num: '14',
    title: 'Adli Radyoloji & Kemik Yaşı',
    subtitle: 'İskelet Yaş Tayini & Kimlik Tespiti',
    points: [
      { head: 'Greulich-Pyle ve Tanner-Whitehouse karşılaştırması', body: 'Türk popülasyonuna özgü referans değerleri ihtiyacı' },
      { head: 'Klavikula medial epifizi: 18 yaş sınırı belirteci', body: 'İnce kesit CT ile Kellinghaus Evre 2-4 ayrımı' },
      { head: '3. molar diş gelişimi ile yaş korelasyonu', body: 'Demirjian ve Cameriere yöntemlerinin Türk validasyonu' },
    ],
    ref: 'Int J Legal Med (2025), Eur Radiol (2024)'
  },
  {
    file: '15_yara_yasi.png',
    num: '15',
    title: 'Yara Yaşı Tayini',
    subtitle: 'Vital Reaksiyonlar & Histopatolojik Zamanlama',
    points: [
      { head: 'İnflamatuar hücre infiltrasyonu zaman çizelgesi', body: 'PMN (6-24 saat) → Makrofaj (24-72 saat) → Fibroblast (3-7 gün)' },
      { head: 'İmmünohistokimyasal belirteçler: CD15, CD68, TGF-β', body: 'Ante-mortem vs post-mortem yara ayrımı %90+ güvenilirlik' },
      { head: 'Fibronektin ve tenascin birikimiyle zamanlama', body: 'Erken dönem (0-3 gün) yara yaşında altın standart' },
    ],
    ref: 'Forensic Sci Med Pathol (2025), Int J Legal Med (2024)'
  },
  {
    file: '16_olum_belirlemeleri.png',
    num: '16',
    title: 'Ölüm Belirlemeleri',
    subtitle: 'Tanatololji & Ölüm Sertifikası Zorlukları',
    points: [
      { head: 'Erken ölüm bulguları: Livor, rigor, algor mortis', body: 'Henssge nomogramı ile ölüm zamanı ±2.8 saat hata payı' },
      { head: 'Beyin ölümü kriterleri ve organ bağışı etiği', body: 'Apne testi, EEG, transkraniyal Doppler — yasal çerçeve' },
      { head: 'Vitröz hümör biyokimyası ile PMI', body: 'Potasyum artış hızı, hipoksantin düzeyi korelasyonu' },
    ],
    ref: 'Legal Medicine (2025), Am J Forensic Med Pathol (2024)'
  },
  {
    file: '17_adli_antropoloji.png',
    num: '17',
    title: 'Adli Antropoloji',
    subtitle: 'İskelet Kalıntılarından Kimlik Tespiti',
    points: [
      { head: '3D yüz rekonstrüksiyonu: Kafatasından yüz tahmini', body: 'Ortalama yumuşak doku kalınlığı tabloları (Türk popülasyonu)' },
      { head: 'Cinsiyet tayini: Pelvis ve kranium morfometrisi', body: 'Diskriminant analiz fonksiyonları %95+ doğruluk' },
      { head: 'Travma analizi: Perimortem vs postmortem kırık ayrımı', body: 'Plastik deformasyon, çatlak yayılımı, renk değişimi kriterleri' },
    ],
    ref: 'J Forensic Sci (2025), Am J Phys Anthropol (2024)'
  },
  {
    file: '18_cinsel_saldiri.png',
    num: '18',
    title: 'Cinsel Saldırı Muayenesi',
    subtitle: 'Kanıt Toplama Protokolleri & Forensik Standartlar',
    points: [
      { head: 'SAFE kit uygulamasında yeni standartlar', body: '72 saat içinde DNA toplama, kolposkopik muayene protokolü' },
      { head: 'Genital ve ekstragenital bulguların yorumu', body: 'Onayla uyumlu bulgu vs travma kanıtı ayrımının önemi' },
      { head: 'Adli görüşme teknikleri: Çocuk mağdurlar', body: 'NICHD protokolü ve bilişsel görüşme yöntemi' },
    ],
    ref: 'J Forensic Legal Med (2025), Child Abuse Neglect (2024)'
  },
  {
    file: '19_balistik.png',
    num: '19',
    title: 'Ateşli Silah Yaralanmaları',
    subtitle: 'Adli Balistik & Yara Analizi',
    points: [
      { head: 'Atış mesafesi tayini: Barut kalıntısı patern analizi', body: 'SEM-EDX ile GSR elementel analiz (Ba, Sb, Pb)' },
      { head: 'Giriş-çıkış deliği ayrımı ve mermi yolu takibi', body: 'Beveling, grease ring, stellate yırtık paternleri' },
      { head: 'Terminal balistik: Doku hasarı simülasyonu', body: 'Jelatin bloğu ve bilgisayarlı simülasyon korelasyonu' },
    ],
    ref: 'Forensic Sci Int (2025), J Forensic Sci (2024)'
  },
  {
    file: '20_bilirkisi.png',
    num: '20',
    title: 'Bilirkişilik & Uzman Tanıklık',
    subtitle: 'Adli Tıp Uzmanının Mahkemedeki Rolü',
    points: [
      { head: 'Daubert standardı ve bilimsel kanıt kabul kriterleri', body: 'Tekrarlanabilirlik, yanlışlanabilirlik, peer review şartları' },
      { head: 'Türk hukukunda bilirkişi reformu tartışmaları', body: 'Bilirkişilik Kanunu (2016) ve uygulama sorunları' },
      { head: 'Adli tıp raporunun delil gücü ve bağlayıcılığı', body: 'ATK raporu vs üniversite raporu çelişkisinde hakimin takdiri' },
    ],
    ref: 'Türkiye Barolar Birliği Dergisi (2025), Yargıtay Kararları (2024)'
  },
];

function makeSVG(p) {
  const pts = p.points;
  const baseY = 665;
  const gap = 85;
  
  let pointsSvg = '';
  pts.forEach((pt, i) => {
    const y = baseY + i * gap;
    pointsSvg += `
      <text x="65" y="${y}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="18" fill="#F59E0B">▸ ${esc(pt.head)}</text>
      <text x="80" y="${y + 26}" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="15.5" fill="rgba(255,255,255,0.88)">${esc(pt.body)}</text>
    `;
  });

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0.88)" />
      <stop offset="70%" stop-color="rgba(0,0,0,0.45)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0)" />
    </linearGradient>
    <linearGradient id="botG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)" />
      <stop offset="25%" stop-color="rgba(0,0,0,0.35)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.93)" />
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="${W}" height="340" fill="url(#topG)" />
  <rect x="0" y="480" width="${W}" height="600" fill="url(#botG)" />

  <rect x="60" y="50" width="80" height="4" rx="2" fill="#F59E0B" />
  <text x="60" y="88" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="16" fill="#F59E0B" letter-spacing="3">MEDİKOLEGAL GELİŞMELER</text>

  <rect x="60" y="108" width="44" height="44" rx="22" fill="#F59E0B" />
  <text x="82" y="137" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="22" fill="#000" text-anchor="middle">${esc(p.num)}</text>

  <text x="118" y="140" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="34" fill="#FFFFFF">${esc(p.title)}</text>
  <text x="60" y="185" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="19" fill="rgba(255,255,255,0.82)">${esc(p.subtitle)}</text>

  ${pointsSvg}

  <rect x="60" y="${baseY + pts.length * gap + 10}" width="960" height="1" fill="rgba(255,255,255,0.15)" />

  <text x="60" y="${baseY + pts.length * gap + 40}" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="13" fill="rgba(255,255,255,0.45)">Kaynak: ${esc(p.ref)}</text>

  <text x="60" y="${baseY + pts.length * gap + 72}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="15" fill="rgba(255,255,255,0.65)">Ankara Bilkent Şehir Hastanesi — Adli Tıp Kliniği</text>

  <text x="1020" y="${baseY + pts.length * gap + 72}" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="14" fill="#F59E0B" text-anchor="end">@adlitip_bilkent</text>

  <text x="540" y="1055" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="13" fill="rgba(255,255,255,0.35)" text-anchor="middle">◀  ${esc(p.num)}/20  ▶</text>
</svg>`;
}

async function generate() {
  const inDir = path.join(__dirname, '..', 'client', 'public', 'instagram_posters');
  const outDir = path.join(__dirname, '..', 'client', 'public', 'instagram_posters_final');
  
  const fs = require('fs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const p of POSTERS) {
    const inPath = path.join(inDir, p.file);
    const outPath = path.join(outDir, p.file);
    const svg = makeSVG(p);

    await sharp(inPath)
      .resize(W, H)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png({ quality: 95 })
      .toFile(outPath);
    
    console.log(`✓ ${p.num} — ${p.title}`);
  }
  console.log(`\nTüm ${POSTERS.length} poster oluşturuldu: ${outDir}`);
}

generate().catch(e => { console.error(e); process.exit(1); });
