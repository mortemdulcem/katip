const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const W = 1080, H = 1080;
const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const POSTERS = [
  {
    file: 'n01_iris.png', num: '01',
    title: 'İris Deseni Parmak İzinden\nDaha Benzersiz!',
    subtitle: 'Gözünüz sizin kimliğiniz',
    points: [
      '🔬 Her insanın iris deseni doğumdan itibaren benzersizdir — tek yumurta ikizlerinde bile farklıdır',
      '🧬 Parmak izinde 40 bağımsız özellik varken, iriste 266 farklı ölçülebilir özellik bulunur',
      '👁️ Ölümden 24 saat sonra bile iris ile kimlik tespiti yapılabilir — adli tıpta yeni çığır',
    ],
    ref: 'J Forensic Sci (2024) • Biometric Technology Today (2025)'
  },
  {
    file: 'n02_bones.png', num: '02',
    title: 'Kemikler 50 Yıl Sonra\nBile Konuşur!',
    subtitle: 'İskelet kalıntıları sessiz tanıklardır',
    points: [
      '💀 Kemiklerden cinsiyet tayini %95 doğrulukla yapılabilir — sadece pelvis kemiğinden',
      '📏 Femur (uyluk kemiği) uzunluğundan boy ±2 cm hata payıyla hesaplanır',
      '⚔️ Kırık paterni ölüm anını verir: Canlıyken mi, öldükten sonra mı kırıldı ayırt edilebilir',
    ],
    ref: 'Am J Phys Anthropol (2024) • Int J Legal Med (2025)'
  },
  {
    file: 'n03_hair.png', num: '03',
    title: 'Tek Bir Saç Teli\nKatili Ele Verir!',
    subtitle: 'Saçınız hayatınızın günlüğüdür',
    points: [
      '💇 Saç teli son 3 ayda kullandığınız ilaçları, uyuşturucuları ve zehirleri kaydeder',
      '🔍 Saç kökünden DNA profili çıkarılır — ama gövdeden bile coğrafi köken tahmin edilebilir',
      '⚗️ Napolyon\'un saç tellerinden 200 yıl sonra arsenik zehirlenmesi tespit edildi!',
    ],
    ref: 'Forensic Sci Int (2024) • Drug Test Analysis (2025)'
  },
  {
    file: 'n04_fingerprint.png', num: '04',
    title: 'Görünmez Parmak İzi\nNasıl Ortaya Çıkar?',
    subtitle: 'CSI gerçekten böyle çalışır',
    points: [
      '🔦 Luminol kimyasalı kanla tepkimeye girer ve karanlıkta mavi ışık yayar — temizlenmiş kanı bile bulur',
      '✋ Süper Yapıştırıcı (Siyanoakrilat) buharı görünmez parmak izlerini beyaz renge çevirir',
      '⏰ Cam üzerindeki parmak izi 40 yıl sonra bile tespit edilebilir!',
    ],
    ref: 'J Forensic Identification (2025) • Forensic Sci Int (2024)'
  },
  {
    file: 'n05_poison.png', num: '05',
    title: 'Tarihin En Kurnaz\nZehirleri!',
    subtitle: 'Mükemmel cinayet diye bir şey yoktur',
    points: [
      '☠️ Arsenik "kralların zehri" olarak bilinir — yüzyıllar boyu tespit edilemedi, şimdi saç telinden bile bulunur',
      '🧪 Polonyum-210 ile suikast: Alexander Litvinenko vakası — radyoaktif izotop çaydanlıktan tespit edildi',
      '💊 Modern toksikoloji 1 mL kandan 1500+ maddeyi aynı anda tarayabilir',
    ],
    ref: 'Clin Toxicol (2025) • Forensic Toxicol (2024)'
  },
  {
    file: 'n06_insect.png', num: '06',
    title: 'Böcekler Ölüm Saatini\nSöyler!',
    subtitle: 'Adli entomoloji: Doğanın tanıkları',
    points: [
      '🪰 Et sineği (Calliphora) ölümden dakikalar sonra cesede ulaşır — larva evresi ölüm saatini verir',
      '🌡️ Kurtçuk gelişim hızı sıcaklığa bağlıdır — hava durumu verileriyle ölüm zamanı ±12 saat hesaplanır',
      '🔬 Larvalardan yapılan toksikoloji testi, çürümüş cesette bile zehir/ilaç tespiti sağlar',
    ],
    ref: 'J Med Entomol (2025) • Forensic Sci Int (2024)'
  },
  {
    file: 'n07_dna.png', num: '07',
    title: '1 Damla Kan,\n7 Milyar İnsan İçinden Sizi Bulur!',
    subtitle: 'DNA: Doğanın barkodu',
    points: [
      '🩸 Sadece 0.5 nanogram DNA (birkaç hücre!) yeterli — modern PCR ile milyarlarca kopya üretilir',
      '👨‍👩‍👧 Soy ağacı DNA\'sı ile tanınmayan cesetler 100 yıl sonra bile kimliklendirilebilir',
      '🧬 DNA fenotipleme: Kan damlasından göz rengi, saç rengi ve yüz şekli tahmin edilebilir',
    ],
    ref: 'Forensic Sci Int Genet (2025) • Nature Genet (2024)'
  },
  {
    file: 'n08_child.png', num: '08',
    title: '12 Yaşında Çocuk\nCezaevine Girmeli mi?',
    subtitle: 'Türkiye\'nin en tartışmalı konusu',
    points: [
      '🧒 TCK m.31: 12 yaş altı çocuklar "cezai ehliyetsiz" — hiçbir suçtan yargılanamaz',
      '🧠 Bilim diyor ki: İnsan beyni 25 yaşına kadar gelişmeye devam eder — karar verme merkezi en son olgunlaşır',
      '⚖️ Dünyada yaş sınırı: İngiltere 10, Almanya 14, İskandinav ülkeleri 15 — Türkiye 12',
    ],
    ref: 'Ankara Barosu Dergisi (2025) • BM Çocuk Hakları Komitesi (2024)'
  },
  {
    file: 'n09_skull.png', num: '09',
    title: 'Kafatasından Yüz\nRekonstrüksiyonu!',
    subtitle: 'Kemiğin altındaki yüzü bulmak',
    points: [
      '🎭 Kafatasındaki 34 anatomik noktadan yumuşak doku kalınlığı ölçülerek yüz yeniden inşa edilir',
      '🖥️ 3D yazıcı + AI ile artık birkaç saatte dijital yüz rekonstrüksiyonu yapılabiliyor',
      '📰 9.000 yıllık Jericho kafatasından yapılan rekonstrüksiyon — dünyanın en eski portresi!',
    ],
    ref: 'J Forensic Sci (2025) • Forensic Sci Int (2024)'
  },
  {
    file: 'n10_time.png', num: '10',
    title: 'Ölüm Saati Nasıl\nTespit Edilir?',
    subtitle: 'Vücut saati durduğunda bile konuşur',
    points: [
      '🌡️ Vücut sıcaklığı saatte ~1°C düşer — rektal ölçümle ölüm saati ±2.8 saat hassasiyetle hesaplanır',
      '🟣 Mor lekeler (livor mortis) 30 dk\'da başlar, 12 saatte sabitlenir — ceset hareket ettirildiyse anlaşılır',
      '💎 Göz sıvısındaki potasyum seviyesi saatlik artış gösterir — en güvenilir PMI belirteci',
    ],
    ref: 'Legal Medicine (2025) • Am J Forensic Med Pathol (2024)'
  },
  {
    file: 'n11_islam.png', num: '11',
    title: 'İslam Hukukunda Otopsi\nCaiz mi?',
    subtitle: 'Din ve bilim aynı masada',
    points: [
      '📜 Hanefi mezhebinde "zaruret" ilkesiyle otopsi caizdir — hukuki gereklilikte şer\'i engel yoktur',
      '🕌 Diyanet İşleri Başkanlığı 1952 fetvası: "Adli tıp otopsisi dinen uygundur"',
      '⚖️ İslam hukukunda yaralama tazminatı (diyet-erş) sistemi modern ceza hukukundan yüzyıllar önce kurulmuştur',
    ],
    ref: 'İslam Hukuku Araştırmaları (2024) • Diyanet İlmi Dergi (2025)'
  },
  {
    file: 'n12_justice.png', num: '12',
    title: 'Yanlış Mahkumiyet:\nMasum İnsanlar Cezaevinde!',
    subtitle: 'DNA delili 375+ kişiyi özgür bıraktı',
    points: [
      '🔓 ABD\'de DNA testiyle 375+ mahkum suçsuz bulunarak serbest bırakıldı — ortalama 14 yıl hapis yatmışlardı',
      '🧪 Yanlış bilirkişi raporu en yaygın sebep: Saç, kan grubu ve bite mark analizlerinde ciddi hatalar',
      '🇹🇷 Türkiye\'de ATK raporu ile üniversite raporu çeliştiğinde hakim hangisini seçer? Cevap: Hiçbiri kesin bağlayıcı değil!',
    ],
    ref: 'Innocence Project (2025) • Yargıtay CGK Kararları (2024)'
  },
  {
    file: 'n13_teeth.png', num: '13',
    title: 'Dişleriniz Sizi\nEle Verir!',
    subtitle: 'Adli odontoloji: Diş izinden kimlik',
    points: [
      '🦷 Diş minesi vücudun en sert dokusu — yangın, patlama ve çürümeden sonra bile sağlam kalır',
      '🔍 Isırık izi analizi ile suçlu tespiti yapılır — ancak son yıllarda güvenilirliği sorgulanıyor',
      '📋 Tsunami ve uçak kazası gibi afetlerde kimlik tespitinin %60\'ı dental kayıtlarla yapılır',
    ],
    ref: 'J Forensic Odontostomatol (2025) • Forensic Sci Int (2024)'
  },
  {
    file: 'n14_digital.png', num: '14',
    title: 'Telefonunuz Sizi\nHer An İzliyor!',
    subtitle: 'Dijital ayak izi: Yeni nesil delil',
    points: [
      '📱 Akıllı saatiniz kalp ritminizi kaydeder — bir cinayette maktulün ölüm anı Apple Watch\'tan tespit edildi',
      '📍 Google Konum Geçmişi mahkemede delil olarak kabul ediliyor — nerede olduğunuz dakika dakika belli',
      '🤖 Deepfake video ile sahte itiraf: Artık "gördüğünüze inanmayın" — adli bilişim yeni savaş alanı',
    ],
    ref: 'Digital Investigation (2025) • J Forensic Sci (2024)'
  },
  {
    file: 'n15_malpractice.png', num: '15',
    title: 'Doktor Hatası mı,\nKomplikasyon mu?',
    subtitle: 'Tıbbi malpraktis: İnce çizgi',
    points: [
      '⚕️ Her kötü sonuç malpraktis değildir — komplikasyon öngörülemeyen, malpraktis önlenebilir olandır',
      '📝 Yargıtay: "Aydınlatılmış onam alınmadan yapılan her müdahale, başarılı olsa bile hukuka aykırıdır"',
      '🤖 Robot cerrahide hata: Üretici mi, hekim mi sorumlu? Henüz dünyada kesin bir cevap yok!',
    ],
    ref: 'Türkiye Klinikleri Adli Tıp (2025) • Med Law (2024)'
  },
  {
    file: 'n16_ct.png', num: '16',
    title: 'Otopsi Yapmadan\nÖlüm Sebebi Bulunabilir!',
    subtitle: 'Virtopsi: Bıçaksız otopsi',
    points: [
      '🏥 Post-mortem CT ve MR ile "sanal otopsi" — kesiye gerek kalmadan iç organlar görüntülenir',
      '✈️ İsviçre\'de tüm adli ölümler önce virtopsiden geçer — klasik otopsiyle %95 uyum gösterir',
      '🕋 Dini hassasiyetlerde çözüm: Cenazeye dokunmadan tam bir adli inceleme yapılabilir',
    ],
    ref: 'Forensic Sci Med Pathol (2025) • Radiology (2024)'
  },
  {
    file: 'n17_tox.png', num: '17',
    title: 'Kanınızdaki Gizli\nKimyasal Günlük!',
    subtitle: 'Toksikoloji: Vücudunuz her şeyi kaydeder',
    points: [
      '💉 1 mL kan örneğinden 1500+ farklı madde aynı anda taranabilir — LC-MS/MS teknolojisi',
      '🍷 Saçınız son 3 ayın alkol tüketim geçmişini saklar — ehliyet davasında bile delil olur',
      '💀 Ölümden günler sonra bile göz içi sıvısından (vitröz hümör) madde tespiti yapılabilir',
    ],
    ref: 'Clin Toxicol (2025) • Forensic Toxicol (2024)'
  },
  {
    file: 'n18_bullet.png', num: '18',
    title: 'Mermi Her Silahın\nParmak İzini Taşır!',
    subtitle: 'Adli balistik: Silahın DNA\'sı',
    points: [
      '🔫 Her silahın namlu içi çizgileri (yiv-set) benzersizdir — mermi üzerinde silahın "imzası" kalır',
      '💥 Barut kalıntısı (GSR) analizi: Ateş eden kişinin elinde baryum, antimon ve kurşun parçacıkları bulunur',
      '📐 Atış mesafesi barut isi ve saçma dağılımından hesaplanır — temas, yakın, uzak mesafe ayrımı',
    ],
    ref: 'Forensic Sci Int (2025) • J Forensic Sci (2024)'
  },
  {
    file: 'n19_xray.png', num: '19',
    title: 'El Röntgeniniz\nYaşınızı Söyler!',
    subtitle: 'Kemik yaşı: Biyolojik saat',
    points: [
      '🦴 El-bilek röntgenindeki büyüme plaklarının kapanma durumu biyolojik yaşı ±1 yıl hassasiyetle verir',
      '⚖️ Suça sürüklenen çocuklarda yaş tayini hayati: 12 yaş altı = cezai sorumsuzluk',
      '🔬 Klavikula (köprücük kemiği) medial epifizi son kapanan kemiktir — 18 yaş sınırı için altın standart',
    ],
    ref: 'Int J Legal Med (2025) • Eur Radiol (2024)'
  },
  {
    file: 'n20_crime.png', num: '20',
    title: 'Olay Yeri Asla\nYalan Söylemez!',
    subtitle: 'Locard İlkesi: Her temas iz bırakır',
    points: [
      '🔎 "Her temas bir iz bırakır" — Edmond Locard (1910). Adli bilimin temel prensibi hâlâ geçerli',
      '🩸 Kan sıçrama patern analizi ile saldırının yönü, şiddeti ve pozisyonu belirlenebilir',
      '🧬 Touch DNA: Bir kapı koluna dokunmak bile DNA transferi için yeterli — 5-10 hücre yeter',
    ],
    ref: 'J Forensic Sci (2025) • Forensic Sci Int (2024)'
  },
];

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > maxChars) {
      lines.push(current.trim());
      current = w;
    } else {
      current = current ? current + ' ' + w : w;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

function makeSVG(p) {
  const titleLines = p.title.split('\n');
  const titleY = 105;
  const titleSize = 40;
  const titleLineH = 52;

  let titleSvg = '';
  titleLines.forEach((line, i) => {
    titleSvg += `<text x="60" y="${titleY + i * titleLineH}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="${titleSize}" fill="#FFFFFF" style="text-shadow: 2px 2px 8px rgba(0,0,0,0.8)">${esc(line)}</text>\n`;
  });

  const subtitleY = titleY + titleLines.length * titleLineH + 15;

  let pointsSvg = '';
  let curY = 590;
  p.points.forEach((pt) => {
    const lines = wrapText(pt, 52);
    lines.forEach((line, li) => {
      const weight = li === 0 ? '700' : '400';
      const fill = li === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.82)';
      const size = li === 0 ? '17' : '15';
      pointsSvg += `<text x="${li === 0 ? 60 : 80}" y="${curY}" font-family="Arial, Helvetica, sans-serif" font-weight="${weight}" font-size="${size}" fill="${fill}">${esc(line)}</text>\n`;
      curY += li === 0 ? 28 : 24;
    });
    curY += 22;
  });

  const refY = Math.min(curY + 12, 975);

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0.9)" />
      <stop offset="60%" stop-color="rgba(0,0,0,0.5)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0)" />
    </linearGradient>
    <linearGradient id="botG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)" />
      <stop offset="20%" stop-color="rgba(0,0,0,0.4)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.95)" />
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="${W}" height="380" fill="url(#topG)" />
  <rect x="0" y="360" width="${W}" height="720" fill="url(#botG)" />

  <rect x="60" y="42" width="5" height="35" rx="2" fill="#F59E0B" />
  <text x="78" y="70" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="15" fill="#F59E0B" letter-spacing="4">ADLİ TIP GERÇEKLERİ</text>
  <rect x="60" y="80" width="50" height="3" rx="1.5" fill="#F59E0B" opacity="0.6" />

  ${titleSvg}

  <text x="60" y="${subtitleY}" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="20" fill="rgba(245,158,11,0.9)" font-style="italic">${esc(p.subtitle)}</text>

  ${pointsSvg}

  <rect x="60" y="${refY}" width="960" height="1" fill="rgba(255,255,255,0.12)" />
  <text x="60" y="${refY + 25}" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="12.5" fill="rgba(255,255,255,0.4)">${esc(p.ref)}</text>
  <text x="60" y="${refY + 52}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="14" fill="rgba(255,255,255,0.6)">Nurcan Denli Bayır</text>
  <text x="1020" y="${refY + 52}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="14" fill="#F59E0B" text-anchor="end"></text>

  <circle cx="520" cy="1055" r="14" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
  <text x="520" y="1060" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="12" fill="rgba(255,255,255,0.4)" text-anchor="middle">${esc(p.num)}</text>
  <text x="556" y="1060" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="11" fill="rgba(255,255,255,0.25)">/20</text>
</svg>`;
}

async function generate() {
  const inDir = path.join(__dirname, '..', 'client', 'public', 'instagram_posters');
  const outDir = path.join(__dirname, '..', 'client', 'public', 'instagram_posters_v2');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const p of POSTERS) {
    const inPath = path.join(inDir, p.file);
    const outPath = path.join(outDir, p.file.replace('n', ''));
    const svg = makeSVG(p);

    await sharp(inPath)
      .resize(W, H)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png({ quality: 95 })
      .toFile(outPath);

    console.log(`✓ ${p.num} — ${p.title.split('\n')[0]}`);
  }
  console.log(`\n${POSTERS.length} poster oluşturuldu → ${outDir}`);
}

generate().catch(e => { console.error(e); process.exit(1); });
