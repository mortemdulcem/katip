const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const W = 1080;
const H = 1080;
const PAD = 16;
const GAP = 8;

const BG_COLOR = { r: 245, g: 237, b: 220, alpha: 1 };
const TITLE_COLOR = '#1a1a1a';
const PANEL_TITLE_COLOR = '#FFFFFF';
const PANEL_INFO_COLOR = 'rgba(255,255,255,0.95)';
const ACCENT = '#8B0000';
const BORDER_COLOR = '#8B0000';

const INFOGRAPHICS = [
  {
    id: '01_kunt_travma',
    title: 'KÜNT TRAVMA ANALİZİ',
    subtitle: 'Türkiye\'de trafik kazalarının en sık travma tipi',
    layout: 'quad',
    panels: [
      { img: '01_contusion.png', title: 'Kontüzyon & Ekimoz', info: 'İç organlar hasar görür ama\ndışarıdan iz olmayabilir!' },
      { img: '02_abrasion.png', title: 'Sıyrık (Abrazyon) Tipleri', info: 'Sürtünme yönü →\nsaldırı açısını gösterir' },
      { img: '03_laceration.png', title: 'Laserasyon Yarası', info: 'Köprü damarlar görülür,\nkesiden ayırt edilir!' },
      { img: '04_skin_cross.png', title: 'Deri Kesit Anatomisi', info: 'Morluk rengi ile darbe zamanı:\nKırmızı → Mor → Yeşil → Sarı' },
    ],
  },
  {
    id: '02_otopsi',
    title: 'ADLİ OTOPSİ SÜRECİ',
    subtitle: 'Türkiye\'de yılda 25.000+ adli otopsi yapılıyor',
    layout: 'quad',
    panels: [
      { img: '05_autopsy_room.png', title: 'Otopsi Masası', info: 'İstanbul ATK dünyanın\nen yoğun merkezlerinden' },
      { img: '06_y_incision.png', title: 'Y-Kesi & İç Muayene', info: 'Tüm organlar çıkarılır, tartılır\n3-5 saat sürer' },
      { img: '17_tox_lab.png', title: 'Toksikoloji Numunesi', info: 'Kan, idrar, mide içeriği,\nsaç ve karaciğerden tarama' },
      { img: '07_evidence_kit.png', title: 'Delil Toplama Kiti', info: 'Tırnak kazıntısı, mermi,\ndoku örnekleri saklanır' },
    ],
  },
  {
    id: '03_atesli_silah',
    title: 'ATEŞLİ SİLAH YARALANMALARI',
    subtitle: 'Kurşun izleri yalan söylemez!',
    layout: 'quad',
    panels: [
      { img: '09_entry_wound.png', title: 'Giriş Yarası Bulguları', info: 'Bitişik: barut izi + yanık\nUzak: sadece yuvarlak delik' },
      { img: '11_range_chart.png', title: 'Atış Mesafesi Tespiti', info: 'Çıkış yarası girişten büyük\nve düzensiz kenarlıdır' },
      { img: '12_bullet_trajectory.png', title: 'Mermi Yörünge Analizi', info: 'Giriş-çıkış hattı\natıcı konumunu belirler' },
      { img: '10_ballistics_lab.png', title: 'Atış Artığı (GSR)', info: 'Baryum, antimon, kurşun\nSEM-EDX ile tespit edilir' },
    ],
  },
  {
    id: '04_postmortem',
    title: 'ÖLÜM SAATİ TESPİTİ',
    subtitle: 'Postmortem değişiklikler zamanı söyler',
    layout: 'quad',
    panels: [
      { img: '13_livor_mortis.png', title: 'Livor Mortis', info: '30 dakikada başlar\nCeset çevrilmişse → cinayet!' },
      { img: '14_rigor_mortis.png', title: 'Rigor Mortis', info: '2-4 saatte başlar\n36-48 saatte çözülür' },
      { img: '16_entomology.png', title: 'Adli Entomoloji', info: 'Böcek larvaları ile\nölüm zamanı hesaplanır' },
      { img: '15_algor_mortis.png', title: 'Algor Mortis', info: 'Vücut saatte ~1°C soğur\nHenssge nomogramı' },
    ],
  },
  {
    id: '05_toksikoloji',
    title: 'ADLİ TOKSİKOLOJİ',
    subtitle: 'Böcek ailesi davası: otopside tespit edildi!',
    layout: 'quad',
    panels: [
      { img: '17_tox_lab.png', title: 'Zehir Tarama Sistemi', info: '1 mL kandan 1500+\nmadde taranır!' },
      { img: '18_blood_tubes.png', title: 'Uyuşturucu Testi', info: 'Saçtan 3 aylık\nkullanım öyküsü çıkar' },
      { img: '37_gcms_analysis.png', title: 'GC-MS Kütle Spektrumu', info: 'Her maddenin kendine\nözgü parmak izi' },
      { img: '38_poison_symptoms.png', title: 'Zehirlenme Bulguları', info: 'Badem kokusu = siyanür\nKiraz livor = CO' },
    ],
  },
  {
    id: '06_olay_yeri',
    title: 'OLAY YERİ İNCELEME',
    subtitle: '"Her temas bir iz bırakır!" — Edmond Locard',
    layout: 'quad',
    panels: [
      { img: '19_crime_scene.png', title: 'Olay Yeri Güvenliği', info: 'İlk dokunan delilleri bozar!\n8-12 saat inceleme süresi' },
      { img: '20_fingerprint.png', title: 'Parmak İzi Analizi', info: '8 milyar insanda\naynı parmak izi yok!' },
      { img: '21_dna_lab.png', title: 'DNA Laboratuvarı', info: 'Bir damla kan, bir\ntükürük bile yeterli' },
      { img: '22_dna_helix.png', title: 'Eser Delil İncelemesi', info: 'Lif, cam, toprak, boya,\nsaç → Locard prensibi' },
    ],
  },
  {
    id: '07_atesli_silah_ballistik',
    title: 'BALİSTİK KARŞILAŞTIRMA',
    subtitle: 'Jandarma Kriminal yılda binlerce silah inceliyor',
    layout: 'quad',
    panels: [
      { img: '32_comparison_micro.png', title: 'Karşılaştırma Mikroskobu', info: 'Namlu izleri her silahta\nfarklıdır — birebir eşleşme' },
      { img: '31_rifling.png', title: 'Yiv-Set İzleri', info: 'Spiral izler → silah markası\nSaat yönü, sayı, genişlik' },
      { img: '33_cartridge_marks.png', title: 'Kovan Üzerindeki İzler', info: 'İğne izi, çekici izi\nKovan = silahın kimliği' },
      { img: '34_nibin.png', title: 'IBIS/NIBIN Veritabanı', info: 'Farklı olay yerlerinden\nmermiler otomatik eşleştirilir' },
    ],
  },
  {
    id: '08_mermi_kovan_karsilastirma',
    title: 'MERMİ & KOVAN ANALİZİ',
    subtitle: 'Balistik kanıtlar mahkemede belirleyici',
    layout: 'quad',
    panels: [
      { img: '30_handgun_mech.png', title: 'Silah Mekanizması', info: 'İzler eşleşirse\naynı silahtan atılmış!' },
      { img: '33_cartridge_marks.png', title: 'İğne İzi Analizi', info: 'Her silahın iğne izi\nkendine özgüdür' },
      { img: '12_bullet_trajectory.png', title: 'Yörünge Hesaplama', info: 'Lazer ile atış hattı\nve atıcı konumu belirlenir' },
      { img: '11_range_chart.png', title: 'Atış Mesafesi Bulguları', info: 'Yakın: barut tanecikleri\nUzak: sadece delik' },
    ],
  },
  {
    id: '09_kimyasal_zehirlenme',
    title: 'KİMYASAL ZEHİRLENMELER',
    subtitle: 'Türkiye\'de her kış CO zehirlenmesi ölümleri',
    layout: 'quad',
    panels: [
      { img: '36_chemical_invest.png', title: 'Arsenik Zehirlenmesi', info: 'Saç analizi ile aylarca\ngeriye dönük tespit mümkün' },
      { img: '38_poison_symptoms.png', title: 'Karbonmonoksit (CO)', info: 'Soba zehiri! Kiraz kırmızısı\nlivor mortis bulgusu' },
      { img: '39_food_samples.png', title: 'Organofosfat Zehiri', info: 'Tarım ilacı: terleme,\nmiyozis, salivasyon' },
      { img: '37_gcms_analysis.png', title: 'Metanol (Sahte İçki)', info: '30 mL bile öldürebilir!\nGörme kaybı → ölüm' },
    ],
  },
  {
    id: '10_tibbi_malpraktis',
    title: 'TIBBİ MALPRAKTİS',
    subtitle: 'Yenidoğan çetesi davası Türkiye\'yi sarstı',
    layout: 'quad',
    panels: [
      { img: '41_malpractice.png', title: 'Malpraktis Nedir?', info: 'Standart bakımın altında\nkalma — yılda 1000+ dava' },
      { img: '40_nicu.png', title: 'Yenidoğan Skandalı', info: 'Bebeklere kasıtlı zarar:\nbüyük ceza davası' },
      { img: '42_negligence_flow.png', title: 'Tıbbi Kayıt Önemi', info: 'Kayıt yoksa savunma\nyapılamaz! Dijital delil' },
      { img: '43_court_expert.png', title: 'Bilirkişi & ATK Raporu', info: 'Kusur oranı belirlenir\nMahkemeye sunulur' },
    ],
  },
  {
    id: '11_bas_boyun_travma',
    title: 'KAFA & BOYUN TRAVMASI',
    subtitle: '2024 Türkiye: 403 kadın cinayeti — en sık künt kafa travması',
    layout: 'quad',
    panels: [
      { img: '23_skull_fractures.png', title: 'Kafatası Kırık Tipleri', info: 'Lineer, çökme, baziler\nDarbe gücü belirlenir' },
      { img: '47_brain_hematoma.png', title: 'İntrakraniyal Kanama', info: 'Epidural: lucid interval\nsonrası ani kötüleşme' },
      { img: '46_neck_structures.png', title: 'Boyun Yaralanması', info: 'Asıda hyoid kırığı\nBoğmada tiroid hasarı' },
      { img: '45_skull_anatomy.png', title: 'Temporal Kemik Riski', info: 'En ince bölge → kırılma\nEpidural hematom → ölüm' },
    ],
  },
  {
    id: '12_uyusturucu_tespiti',
    title: 'UYUŞTURUCU TESPİT YÖNTEMLERİ',
    subtitle: 'İdrarda 3 gün, saçta 90 gün tespit edilir!',
    layout: 'quad',
    panels: [
      { img: '48_hair_test.png', title: 'Saç Analizi Testi', info: '3 cm saç = 3 aylık\nkullanım öyküsü!' },
      { img: '49_detection_windows.png', title: 'Tespit Süreleri', info: 'İdrar: 3-30 gün\nKan: 12-72 saat\nSaç: 90+ gün' },
      { img: '37_gcms_analysis.png', title: 'GC-MS Doğrulama', info: 'Kesin madde ve miktar\nMahkemede geçerli rapor' },
      { img: '17_tox_lab.png', title: 'ATK Toksikoloji Labı', info: 'Yılda 100.000+ numune\nanaliz ediliyor!' },
    ],
  },
  {
    id: '13_olum_mu_cinayet_mi',
    title: 'ÖLÜM MÜ, CİNAYET Mİ?',
    subtitle: 'Savcı otopsi emri verir — adli tıp çözer',
    layout: 'quad',
    panels: [
      { img: '70_murder_mystery.png', title: 'Şüpheli Ölüm Soruşturması', info: 'Doğal mı? Kaza mı?\nİntihar mı? Cinayet mi?' },
      { img: '71_uv_blood.png', title: 'Gizli Kan İzi Tespiti', info: 'Temizlenmiş yüzeylerde\nbile kan ortaya çıkar!' },
      { img: '86_bones_id.png', title: 'İskelet Kimlik Tespiti', info: 'Yaş, boy, cinsiyet,\ntravma öyküsü belirlenir' },
      { img: '87_face_recon.png', title: 'Yüz Rekonstrüksiyonu', info: 'Kafatasından 3D yüz\nmodeli oluşturulur' },
    ],
  },
  {
    id: '14_unlu_zehirlenmeler',
    title: 'TARİHİN ÜNLÜ ZEHİRLENMELERİ',
    subtitle: 'Mükemmel cinayet diye bir şey yoktur',
    layout: 'quad',
    panels: [
      { img: '72_poison_history.png', title: 'Arsenik: Sessiz Katil', info: 'Osmanlı sarayında sık\n1836 Marsh testi ile çözüldü' },
      { img: '73_napoleon.png', title: 'Napoleon & Arsenik', info: 'Saç analizi: yüksek arsenik\nDuvar kağıdı suçlu!' },
      { img: '74_polonium.png', title: 'Litvinenko Suikasti', info: '2006: Çay bardağında\nPolonyum-210 bulundu!' },
      { img: '37_gcms_analysis.png', title: 'Modern Zehir Tespiti', info: '1 mL kandan 1500+\nmadde taranır — gizlenemez!' },
    ],
  },
  {
    id: '15_soguk_vakalar',
    title: '30 YIL SONRA YAKALANDI!',
    subtitle: 'DNA teknolojisi soğuk vakaları çözüyor',
    layout: 'quad',
    panels: [
      { img: '75_cold_case.png', title: 'Soğuk Vaka Dosyaları', info: 'Yeni DNA teknolojisi ile\ndosyalar tekrar açılıyor' },
      { img: '76_dna_cold.png', title: 'Touch DNA Teknolojisi', info: '5-10 hücre yeterli!\nKapı kolu, silah sapı' },
      { img: '77_genealogy.png', title: 'Genetik Soy Ağacı', info: 'GEDmatch ile akrabadan\nkatile ulaşılıyor' },
      { img: '78_suspect_board.png', title: 'Golden State Killer', info: '44 yıl sonra DNA ile\nyakalandı! 1974-1986' },
    ],
  },
  {
    id: '16_dizi_vs_gercek',
    title: 'DİZİ vs GERÇEK ADLİ TIP',
    subtitle: 'CSI etkisi — Hollywood yalan söylüyor!',
    layout: 'quad',
    panels: [
      { img: '79_tv_vs_real.png', title: 'TV: 5 Dakikada Sonuç!', info: 'Gerçek: DNA analizi\n3-6 hafta sürer!' },
      { img: '05_autopsy_room.png', title: 'Gerçek Otopsi Odası', info: 'Steril değil! 3-5 saat\nkoku çok ağır' },
      { img: '71_uv_blood.png', title: 'Luminol Yanıltabilir!', info: 'Her parıltı kan değil!\nDoğrulama testi şart' },
      { img: '19_crime_scene.png', title: 'Olay Yeri: 8-12 Saat', info: 'Dizide 5 dk!\nTek hata davayı çöpe atar' },
    ],
  },
  {
    id: '17_dijital_delil',
    title: 'DİJİTAL ADLİ BİLİŞİM',
    subtitle: 'ByLock davasında 75.000+ kişinin iletişimi çözüldü',
    layout: 'quad',
    panels: [
      { img: '80_digital_forensics.png', title: 'Dijital Delil Analizi', info: 'Silinen mesajlar bile\ngeri getirilebilir!' },
      { img: '81_deepfake.png', title: 'Deepfake Tehlikesi', info: 'Sahte video ile masum\ninsanlar suçlanıyor' },
      { img: '82_phone_extract.png', title: 'Telefon Veri Çıkarma', info: 'Cellebrite: kilitli telefondan\nbile veri alınır!' },
      { img: '83_iris.png', title: 'Biyometrik Kimlik', info: 'İris deseni parmak izinden\nbile benzersiz!' },
    ],
  },
  {
    id: '18_vucudunuz_ele_veriyor',
    title: 'VÜCUT DELİLLERİ',
    subtitle: 'Saç, tırnak, kemik — her iz bir delildir',
    layout: 'quad',
    panels: [
      { img: '84_hair_micro.png', title: 'Tek Bir Saç Teli', info: 'İlaç kullanımı, beslenme,\nDNA — hepsi tek saçtan!' },
      { img: '85_nail_uv.png', title: 'Tırnak Altı Deliller', info: 'Saldırganın DNA\'sı\ntırnak kazıntısında bulunur' },
      { img: '83_iris.png', title: 'İris: Doğanın Barkodu', info: 'İkizlerde bile farklı!\n266 benzersiz nokta' },
      { img: '87_face_recon.png', title: 'Kafatasından Yüz', info: '3D yüz modeli ile\nkimlik tespiti yapılır' },
    ],
  },
  {
    id: '19_koroner_arter',
    title: 'ANİ KARDİYAK ÖLÜM',
    subtitle: 'Türkiye\'de ölümlerin %40\'ı kalp-damar hastalığı',
    layout: 'quad',
    panels: [
      { img: '50_coronary_plaque.png', title: 'Ateroskleroz Evreleri', info: 'Yağ çizgisi → plak →\ntıkanma. 20 yaşında başlar!' },
      { img: '51_heart_coronary.png', title: 'Koroner Arter Anatomisi', info: 'LAD tıkanması =\n"dul yapıcı" — ani ölüm!' },
      { img: '52_thrombus.png', title: 'Plak Rüptürü & Tromboz', info: 'Plak yırtılır → pıhtı →\n20 dk\'da geri dönüşümsüz' },
      { img: '53_mi_heart.png', title: 'Miyokard İnfarktüsü', info: 'Kalp kası oksijensiz kalır\nOtopside sarı yumuşama' },
    ],
  },
  {
    id: '20_pulmoner_emboli',
    title: 'PULMONER EMBOLİ',
    subtitle: 'Ekonomi sınıfı sendromu — uçak yolculuğu öldürebilir!',
    layout: 'quad',
    panels: [
      { img: '56_pe_pathway.png', title: 'DVT → Pulmoner Emboli', info: 'Bacaktaki pıhtı kopup\nakciğere gider → ani ölüm' },
      { img: '58_dvt.png', title: 'Derin Ven Trombozu', info: 'Uzun uçuş, hareketsizlik\nHer 2 saatte yürüyün!' },
      { img: '57_pe_lungs.png', title: 'Eyer (Saddle) Embolisi', info: 'Dev pıhtı arter çatalında\nDakikalar içinde ölüm' },
      { img: '59_pe_cross.png', title: 'Akciğer İnfarktüsü', info: 'Hemorajik kama lezyon\nAlt loblarda daha sık' },
    ],
  },
  {
    id: '21_beyin_kanamasi',
    title: 'İNTRAKRANİYAL KANAMA',
    subtitle: 'Anevrizma: beyindeki bomba!',
    layout: 'quad',
    panels: [
      { img: '60_subdural.png', title: 'Subdural Hematom', info: 'Köprü ven yırtılması\nÇocuklarda: Shaken Baby!' },
      { img: '61_berry_aneurysm.png', title: 'Berry Anevrizması', info: 'Willis poligonunda balon\nPatlarsa → ani ölüm!' },
      { img: '62_cerebral_infarct.png', title: 'Serebral İnfarkt', info: 'MCA tıkanması en sık\n4.5 saat altın süre!' },
      { img: '47_brain_hematoma.png', title: 'Epidural Hematom', info: 'Lucid interval: iyi görünür\nsonra koma ve ölüm!' },
    ],
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

function createMainOverlay(infographic) {
  const topH = 80;
  const bottomH = 50;

  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;

  svg += `<rect x="0" y="0" width="${W}" height="${topH}" fill="rgba(245,237,220,0.97)" />`;
  svg += `<rect x="0" y="${topH - 2}" width="${W}" height="2" fill="${ACCENT}" />`;

  const titleLines = wrapText(infographic.title, 28);
  titleLines.forEach((line, i) => {
    svg += `<text x="${W/2}" y="${32 + i * 30}" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="28" fill="${TITLE_COLOR}" text-anchor="middle">${esc(line)}</text>`;
  });
  const stY = 32 + titleLines.length * 30;
  if (stY < topH - 8) {
    svg += `<text x="${W/2}" y="${stY}" font-family="Georgia, 'Times New Roman', serif" font-weight="400" font-size="14" fill="#666666" text-anchor="middle" font-style="italic">${esc(infographic.subtitle)}</text>`;
  }

  svg += `<rect x="0" y="${H - bottomH}" width="${W}" height="${bottomH}" fill="rgba(245,237,220,0.97)" />`;
  svg += `<rect x="0" y="${H - bottomH}" width="${W}" height="2" fill="${ACCENT}" />`;
  svg += `<text x="${PAD + 8}" y="${H - bottomH + 22}" font-family="Georgia, 'Times New Roman', serif" font-weight="400" font-size="12" fill="#888888">ADLİ TIP GERÇEKLERİ</text>`;
  svg += `<text x="${PAD + 8}" y="${H - bottomH + 40}" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="16" fill="${TITLE_COLOR}">Nurcan Denli Bayır</text>`;

  svg += `</svg>`;
  return Buffer.from(svg);
}

function createPanelTitleOverlay(panel, w, h) {
  const titleLines = panel.title.split('\n').length > 1 ? panel.title.split('\n') : wrapText(panel.title, Math.floor(w / 14));
  const infoLines = panel.info.split('\n');

  const titleBlockH = titleLines.length * 24 + 8;
  const infoBlockH = infoLines.length * 20 + 4;
  const totalH = titleBlockH + infoBlockH + 12;
  const startY = h - totalH;

  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;

  svg += `<defs><linearGradient id="pg${w}${h}" x1="0" y1="0" x2="0" y2="1">`;
  svg += `<stop offset="0%" stop-color="rgba(0,0,0,0)"/>`;
  svg += `<stop offset="30%" stop-color="rgba(0,0,0,0.5)"/>`;
  svg += `<stop offset="100%" stop-color="rgba(0,0,0,0.88)"/>`;
  svg += `</linearGradient></defs>`;
  svg += `<rect x="0" y="${startY}" width="${w}" height="${totalH}" fill="url(#pg${w}${h})" />`;

  titleLines.forEach((line, i) => {
    svg += `<text x="12" y="${startY + 20 + i * 24}" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="20" fill="${PANEL_TITLE_COLOR}">${esc(line)}</text>`;
  });

  infoLines.forEach((line, i) => {
    svg += `<text x="12" y="${startY + titleBlockH + 8 + i * 20}" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="16" fill="${PANEL_INFO_COLOR}">${esc(line)}</text>`;
  });

  svg += `</svg>`;
  return Buffer.from(svg);
}

async function compositeQuad(infographic) {
  const panelDir = path.join(__dirname, '..', 'client', 'public', 'infographic_panels');
  const topH = 80;
  const bottomH = 50;
  const contentH = H - topH - bottomH;
  const cellW = Math.floor((W - PAD * 2 - GAP) / 2);
  const cellH = Math.floor((contentH - GAP) / 2);
  const startY = topH + 1;

  const bgBuf = await sharp({
    create: { width: W, height: H, channels: 4, background: BG_COLOR }
  }).png().toBuffer();

  const composites = [];

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = PAD + col * (cellW + GAP);
    const y = startY + row * (cellH + GAP);
    const imgPath = path.join(panelDir, infographic.panels[i].img);

    const panelBuf = await sharp(imgPath)
      .resize(cellW, cellH, { fit: 'cover' })
      .png()
      .toBuffer();

    composites.push({ input: panelBuf, left: x, top: y });
    composites.push({ input: createPanelTitleOverlay(infographic.panels[i], cellW, cellH), left: x, top: y });

    composites.push({
      input: Buffer.from(`<svg width="${cellW}" height="${cellH}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${cellW}" height="${cellH}" fill="none" stroke="${BORDER_COLOR}" stroke-width="2" /></svg>`),
      left: x, top: y
    });
  }

  composites.push({ input: createMainOverlay(infographic), left: 0, top: 0 });

  return sharp(bgBuf).composite(composites).png().toBuffer();
}

async function main() {
  const outDir = path.join(__dirname, '..', 'client', 'public', 'instagram_infographics_v2');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const info of INFOGRAPHICS) {
    try {
      const buf = await compositeQuad(info);
      fs.writeFileSync(path.join(outDir, `${info.id}.png`), buf);
      console.log(`✓ ${info.id}`);
    } catch (err) {
      console.error(`✗ ${info.id}: ${err.message}`);
    }
  }
  console.log(`\nToplam ${INFOGRAPHICS.length} infografik oluşturuldu!`);
}

main().catch(console.error);
