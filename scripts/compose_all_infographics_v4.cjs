const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const W = 1080;
const H = 1080;
const PAD = 20;
const GAP = 10;

const INFOGRAPHICS = [
  {
    id: '01_kunt_travma',
    title: 'KÜNT TRAVMA: DIŞARIDAN GÖRÜNMEZ!',
    subtitle: 'Trafik kazalarında en sık travma tipi',
    layout: 'main_bottom3',
    panels: [
      { img: '01_contusion.png', label: 'Künt Travma', info: 'İç organlar hasar görür ama dışarıdan iz olmayabilir!' },
      { img: '02_abrasion.png', label: 'Sıyrık Çeşitleri', info: 'Yönü saldırı açısını gösterir' },
      { img: '03_laceration.png', label: 'Morluk Rengi', info: 'Kırmızı→Mor→Yeşil→Sarı' },
      { img: '04_skin_cross.png', label: 'Laserasyon', info: 'Köprü damarlar: kesi değil!' },
    ],
  },
  {
    id: '02_otopsi',
    title: 'OTOPSİ: ÖLÜLER KONUŞUR!',
    subtitle: 'Türkiye\'de yılda 25.000 adli otopsi',
    layout: 'quad',
    panels: [
      { img: '05_autopsy_room.png', label: 'Otopsi Masası', info: 'İstanbul ATK dünyanın en yoğun merkezlerinden!' },
      { img: '06_y_incision.png', label: 'Y-Kesi', info: 'Tüm organlar çıkarılır, tartılır. 3-5 saat sürer' },
      { img: '17_tox_lab.png', label: 'Toksikoloji', info: 'Kan, idrar, mide, saç, karaciğerden zehir taranır' },
      { img: '07_evidence_kit.png', label: 'Delil Toplama', info: 'Tırnak kazıntısı, mermi, doku numuneleri' },
    ],
  },
  {
    id: '03_atesli_silah',
    title: 'KURŞUN İZLERİ YALAN SÖYLEMEZ!',
    subtitle: 'Ateşli silah yaralanmalarının sırları',
    layout: 'main_bottom3',
    panels: [
      { img: '09_entry_wound.png', label: 'Giriş Yarası', info: 'Bitişik: barut+yanık. Uzak: sadece delik. Mesafe tespiti kritik!' },
      { img: '11_range_chart.png', label: 'Çıkış Yarası', info: 'Girişten büyük ve düzensiz' },
      { img: '12_bullet_trajectory.png', label: 'Mermi Yörüngesi', info: 'Cinayet mi, intihar mı?' },
      { img: '10_ballistics_lab.png', label: 'Atış Artığı', info: 'Elde baryum, antimon kalır' },
    ],
  },
  {
    id: '04_postmortem',
    title: 'ÖLÜM SAATİ NASIL BELİRLENİR?',
    subtitle: 'Cesetteki izler zamanı söyler',
    layout: 'quad',
    panels: [
      { img: '13_livor_mortis.png', label: 'Livor Mortis', info: '30 dk\'da başlar. Ceset çevrilmişse cinayet şüphesi!' },
      { img: '14_rigor_mortis.png', label: 'Rigor Mortis', info: 'Sertlik 2-4 saatte başlar, 36 saatte çözülür' },
      { img: '16_entomology.png', label: 'Adli Entomoloji', info: 'Böcek larvaları ile zaman tespiti yapılır' },
      { img: '15_algor_mortis.png', label: 'Algor Mortis', info: 'Vücut saatte 1°C soğur, ölüm zamanı hesaplanır' },
    ],
  },
  {
    id: '05_toksikoloji',
    title: 'BİR DAMLA KAN, BİN SIRRI AÇAR!',
    subtitle: 'Böcek ailesi davası: otopside tespit edildi!',
    layout: 'main_bottom3',
    panels: [
      { img: '17_tox_lab.png', label: 'Zehir Taraması', info: '1 mL kandan 1500+ madde taranır. Hiçbir zehir gizlenemez!' },
      { img: '18_blood_tubes.png', label: 'Uyuşturucu Testi', info: 'Saçtan 3 aylık kullanım çıkar!' },
      { img: '37_gcms_analysis.png', label: 'GC-MS Analizi', info: 'Her maddenin parmak izi!' },
      { img: '38_poison_symptoms.png', label: 'Zehir İpuçları', info: 'Badem kokusu = siyanür!' },
    ],
  },
  {
    id: '06_olay_yeri',
    title: 'OLAY YERİNE İLK DOKUNAN KAYBEDER!',
    subtitle: 'Delil kontaminasyonu en büyük tehlike',
    layout: 'quad',
    panels: [
      { img: '19_crime_scene.png', label: 'Olay Yeri', info: 'İlk dokunan delilleri bozar! 8-12 saat inceleme' },
      { img: '20_fingerprint.png', label: 'Parmak İzi', info: '8 milyar insanda aynısı yok!' },
      { img: '21_dna_lab.png', label: 'DNA Labı', info: 'Bir damla kan, bir tükürük yeter!' },
      { img: '22_dna_helix.png', label: 'Eser Delil', info: '"Her temas iz bırakır!" — Locard' },
    ],
  },
  {
    id: '07_atesli_silah_ballistik',
    title: 'HER SİLAHIN PARMAK İZİ VARDIR!',
    subtitle: 'Jandarma Kriminal yılda binlerce silah inceliyor',
    layout: 'main_bottom3',
    panels: [
      { img: '32_comparison_micro.png', label: 'Balistik Karşılaştırma', info: 'Namlu izleri her silahta farklı. Mikroskopla eşleştirilir.' },
      { img: '31_rifling.png', label: 'Yiv-Set İzleri', info: 'Spiral izler silah markasını verir' },
      { img: '33_cartridge_marks.png', label: 'Kovan = Kimlik', info: 'İğne izi, ejektör izi benzersiz' },
      { img: '34_nibin.png', label: 'IBIS Veritabanı', info: 'Farklı olay yerleri eşleştirilir' },
    ],
  },
  {
    id: '08_mermi_kovan_karsilastirma',
    title: 'MERMİ VE KOVAN: SUÇUN HARİTASI!',
    subtitle: 'Balistik kanıtlar mahkemede belirleyici',
    layout: 'quad',
    panels: [
      { img: '30_handgun_mech.png', label: 'Silah Mekanizması', info: 'İzler eşleşirse aynı silahtan atılmış!' },
      { img: '33_cartridge_marks.png', label: 'İğne İzi', info: 'Her silahın iğne izi kendine özgü' },
      { img: '12_bullet_trajectory.png', label: 'Yörünge Hesabı', info: 'Lazer ile atış hattı belirlenir' },
      { img: '11_range_chart.png', label: 'Atış Mesafesi', info: 'Yakın: barut tanecikleri. Uzak: sadece delik' },
    ],
  },
  {
    id: '09_kimyasal_zehirlenme',
    title: 'ZEHİR: GÖRÜNMEYENİ BULMAK!',
    subtitle: 'Türkiye\'de her kış CO zehirlenmesi ölümleri',
    layout: 'main_bottom3',
    panels: [
      { img: '36_chemical_invest.png', label: 'Arsenik', info: 'Saç analizi ile aylarca geriye dönük tespit! Osmanlı\'nın zehiri' },
      { img: '38_poison_symptoms.png', label: 'Karbonmonoksit', info: 'Soba zehiri! Kiraz kırmızısı livor mortis' },
      { img: '39_food_samples.png', label: 'Organofosfat', info: 'Tarım ilacı: terleme, miyozis, ölüm' },
      { img: '37_gcms_analysis.png', label: 'Sahte İçki', info: '30 mL metanol bile öldürebilir!' },
    ],
  },
  {
    id: '10_tibbi_malpraktis',
    title: 'DOKTOR HATASI MI, KADER Mİ?',
    subtitle: 'Yenidoğan çetesi davası Türkiye\'yi sarstı',
    layout: 'quad',
    panels: [
      { img: '41_malpractice.png', label: 'Malpraktis', info: 'Yılda 1000+ dava açılıyor!' },
      { img: '40_nicu.png', label: 'Yenidoğan Skandalı', info: 'Bebeklere kasıtlı zarar: büyük dava' },
      { img: '42_negligence_flow.png', label: 'Tıbbi Kayıtlar', info: 'Kayıt yoksa savunma zayıf!' },
      { img: '43_court_expert.png', label: 'Bilirkişi Raporu', info: 'ATK kusur oranını belirler' },
    ],
  },
  {
    id: '11_bas_boyun_travma',
    title: 'KAFAYA BİR DARBE HER ŞEYİ DEĞİŞTİRİR!',
    subtitle: '2024\'te Türkiye\'de 403 kadın öldürüldü',
    layout: 'main_bottom3',
    panels: [
      { img: '23_skull_fractures.png', label: 'Kafatası Kırıkları', info: 'Kadın cinayetlerinde en sık: künt kafa travması!' },
      { img: '47_brain_hematoma.png', label: 'Beyin Kanaması', info: 'Epidural: iyi görünür, sonra ani ölüm' },
      { img: '46_neck_structures.png', label: 'Boyun Yaralanması', info: 'Asıda hyoid kırığı, boğmada tiroid hasarı' },
      { img: '45_skull_anatomy.png', label: 'Kafa Anatomisi', info: 'Temporal kemik en ince: kırılma riski' },
    ],
  },
  {
    id: '12_uyusturucu_tespiti',
    title: 'SAÇINIZ SİZİ ELE VERİR!',
    subtitle: 'İdrarda 3 gün, saçta 90 gün tespit edilir!',
    layout: 'quad',
    panels: [
      { img: '48_hair_test.png', label: 'Saç Testi', info: '3 cm saç = 3 aylık kullanım öyküsü!' },
      { img: '49_detection_windows.png', label: 'Tespit Pencereleri', info: 'İdrar: 3-30 gün. Saç: 90+ gün' },
      { img: '37_gcms_analysis.png', label: 'GC-MS Doğrulama', info: 'Kesin madde ve miktar belirlenir' },
      { img: '17_tox_lab.png', label: 'ATK Laboratuvarı', info: 'Yılda 100.000+ numune analiz!' },
    ],
  },
  {
    id: '13_olum_mu_cinayet_mi',
    title: 'ÖLÜM MÜ, CİNAYET Mİ?',
    subtitle: 'Savcı otopsi emri verir, adli tıp çözer',
    layout: 'main_bottom3',
    panels: [
      { img: '70_murder_mystery.png', label: 'Şüpheli Ölüm', info: 'Doğal mı, kaza mı, intihar mı, cinayet mi? Her şey araştırılır!' },
      { img: '71_uv_blood.png', label: 'Gizli Kan İzleri', info: 'Temizlenen yüzeylerde bile!' },
      { img: '86_bones_id.png', label: 'Kemik Analizi', info: 'Yaş, boy, cinsiyet belirlenir' },
      { img: '87_face_recon.png', label: 'Yüz Tespiti', info: 'Kafatasından 3D yüz modeli' },
    ],
  },
  {
    id: '14_unlu_zehirlenmeler',
    title: 'TARİHİN EN KURNAZ ZEHİRLENMELERİ!',
    subtitle: 'Mükemmel Cinayet Diye Bir Şey Yoktur',
    layout: 'quad',
    panels: [
      { img: '72_poison_history.png', label: 'Zehir: Sessiz Katil', info: 'Arsenik yüzyıllarca "poudre de succession" (miras tozu) olarak kullanıldı. 1836\'da Marsh testi ile ilk kez tespit edildi. Osmanlı sarayında şüpheli ölümler...' },
      { img: '73_napoleon.png', label: 'Napoleon\'un Ölümü', info: 'St. Helena\'da öldü. Saç analizi: yüksek arsenik. Duvar kağıdındaki Scheele yeşili (CuHAsO₃) nemle arsenik gazı salıyordu!' },
      { img: '74_polonium.png', label: 'Litvinenko Suikasti', info: '2006 Londra: Eski KGB ajanı çay bardağından Polonyum-210 ile zehirlendi. Radyoaktif iz 12 lokasyonda bulundu!' },
      { img: '37_gcms_analysis.png', label: 'Modern Zehir Tespiti', info: '1 mL kandan 1500+ madde taranır. Artık hiçbir zehir gizlenemez. Türkiye\'de ATK toksikoloji labı dünyanın en gelişmişlerinden.' },
    ],
  },
  {
    id: '15_soguk_vakalar',
    title: '30 YIL SONRA YAKALANDI!',
    subtitle: 'DNA Teknolojisi ile Çözülen Soğuk Vakalar',
    layout: 'main_bottom3',
    panels: [
      { img: '75_cold_case.png', label: 'Soğuk Vaka Dosyaları', info: 'Yıllarca çözülemeyen cinayet dosyaları yeni DNA teknolojileriyle tekrar açılıyor. Türkiye\'de de ATK bünyesinde soğuk vaka birimi kuruldu. Delil saklama süresi kritik öneme sahip.' },
      { img: '76_dna_cold.png', label: 'Touch DNA', info: 'Bir kapı koluna, silah sapına dokunmak yeterli. 5-10 hücre ile DNA profili çıkarılır!' },
      { img: '77_genealogy.png', label: 'Genetik Soy Ağacı', info: 'GEDmatch ile suçlunun 3. kuşak akrabası bulunup katile ulaşılıyor. Etik tartışmalar sürüyor.' },
      { img: '78_suspect_board.png', label: 'Golden State Killer', info: 'ABD 1974-1986: 13 cinayet, 50+ tecavüz. 44 yıl sonra genetik soy ağacı ile yakalandı!' },
    ],
  },
  {
    id: '16_dizi_vs_gercek',
    title: 'DİZİ vs GERÇEK: CSI YALAN SÖYLÜYOR!',
    subtitle: 'Televizyon Adli Tıbbı Ne Kadar Gerçek?',
    layout: 'quad',
    panels: [
      { img: '79_tv_vs_real.png', label: 'TV: 5 Dakikada Sonuç!', info: 'Gerçek: DNA analizi 3-6 hafta sürer! Parmak izi eşleştirme günler alır. Türkiye\'de ATK raporları ortalama 3-6 ay bekliyor.' },
      { img: '05_autopsy_room.png', label: 'Gerçek Otopsi', info: 'Steril ameliyathane değil! Koku çok ağır, 3-5 saat sürer. Dizilerdeki gibi loş ortam yok, parlak aydınlatma şart.' },
      { img: '71_uv_blood.png', label: 'Luminol Yanıltır!', info: 'Her parıltı kan değil! Çamaşır suyu, bakır, yaban turpu da parlar. Doğrulayıcı test (Kastle-Meyer) şart.' },
      { img: '19_crime_scene.png', label: 'Olay Yeri İnceleme', info: 'Dizide 5 dk, gerçekte 8-12 saat! Fotoğraflama, ölçüm, delil toplama. Tek hata tüm davayı çöpe atar.' },
    ],
  },
  {
    id: '17_dijital_delil',
    title: 'TELEFONUNUZ HER ŞEYİ BİLİYOR!',
    subtitle: 'Dijital Adli Bilişim: Silinen Veriler Bile Konuşur',
    layout: 'main_bottom3',
    panels: [
      { img: '80_digital_forensics.png', label: 'Dijital Delil Analizi', info: 'Silinen WhatsApp mesajları, arama kayıtları, konum geçmişi... Hepsi geri getirilebilir! Türkiye\'de ByLock davasında 75.000+ kişinin şifreli iletişimi çözüldü.' },
      { img: '81_deepfake.png', label: 'Deepfake Tehlikesi', info: 'Yapay zeka ile sahte video üretilebilir. Masum insanlar suçlanabiliyor. Ses klonlama ile dolandırıcılık artıyor.' },
      { img: '82_phone_extract.png', label: 'Telefon Veri Çıkarma', info: 'Cellebrite UFED: Kilitli telefondan bile veri alınır. Silinmiş fotoğraflar, mesajlar ortaya çıkar.' },
      { img: '83_iris.png', label: 'Biyometrik Kimlik', info: 'İris deseni parmak izinden bile benzersiz. 6 aylıkken oluşur, ölene kadar değişmez.' },
    ],
  },
  {
    id: '18_vucudunuz_ele_veriyor',
    title: 'VÜCUDUNUZ SİZİ ELE VERİYOR!',
    subtitle: 'Saç, Tırnak, Kemik — Her İz Bir Delildir',
    layout: 'quad',
    panels: [
      { img: '84_hair_micro.png', label: 'Tek Bir Saç Teli', info: 'Irksal özellikler, ilaç kullanımı, beslenme durumu, DNA profili — hepsi tek bir saç telinden çıkar! Mitokondriyal DNA ile anne soyağacı belirlenir.' },
      { img: '85_nail_uv.png', label: 'Tırnak Altı Deliller', info: 'Boğma, tecavüz vakalarında saldırganın DNA\'sı mağdurun tırnak kazıntısında bulunur. Otopside rutin alınır!' },
      { img: '83_iris.png', label: 'İris: Doğanın Barkodu', info: '6 aylıkken oluşur, ölene kadar değişmez. Tek yumurta ikizlerinde bile farklı! 266 benzersiz özellik noktası.' },
      { img: '87_face_recon.png', label: 'Kafatasından Yüz', info: 'Yumuşak doku kalınlığı ölçümleri ile 3D yüz modeli oluşturulur. Kimliği bilinmeyen cesetlerde son çare yöntemi.' },
    ],
  },
  {
    id: '19_koroner_arter',
    title: 'ANİ ÖLÜM: KALP UYARI VERMEDEN DURUR!',
    subtitle: 'Koroner Arter Hastalığı — Türkiye\'de 1 Numaralı Ölüm Nedeni',
    layout: 'quad',
    panels: [
      { img: '50_coronary_plaque.png', label: 'Ateroskleroz Evreleri', info: 'Yağ çizgisi → fibröz plak → kalsifiye plak → tıkanma. 20\'li yaşlarda başlar, 50\'lerde öldürür! Türkiye\'de kalp-damar hastalıkları ölüm nedenlerinin %40\'ı.' },
      { img: '51_heart_coronary.png', label: 'Koroner Arterler', info: 'LAD, LCx, RCA: Kalbi besleyen 3 ana damar. LAD tıkanması "dul yapıcı" olarak bilinir, ani ölüm riski en yüksek!' },
      { img: '52_thrombus.png', label: 'Plak Rüptürü & Tromboz', info: 'Plak yırtılır → pıhtı oluşur → damar tıkanır → kalp krizi. 20 dakikada geri dönüşümsüz hasar başlar.' },
      { img: '53_mi_heart.png', label: 'Miyokard İnfarktüsü', info: 'Kalp kası oksijensiz kalır ve ölür. Otopside "sarı yumuşama" alanı görülür. Troponin yüksekliği.' },
    ],
  },
  {
    id: '20_pulmoner_emboli',
    title: 'UÇAK YOLCULUĞU ÖLDÜREBILIR!',
    subtitle: 'Pulmoner Emboli — Ekonomi Sınıfı Sendromu',
    layout: 'main_bottom3',
    panels: [
      { img: '56_pe_pathway.png', label: 'Bacaktaki Pıhtı Akciğere Gider', info: 'Derin ven trombozu (DVT) → alt vena cava → pulmoner arter → ani ölüm! Uzun uçuş, hareketsizlik, oral kontraseptif, obezite risk faktörleri. Virchow triadı: staz, endotel hasarı, hiperkoagülabilite.' },
      { img: '58_dvt.png', label: 'Derin Ven Trombozu', info: 'Bacak şişliği, ağrı, kızarıklık. Uzun yolculukta her 2 saatte yürüyün! Kompresyon çorabı koruyucu.' },
      { img: '57_pe_lungs.png', label: 'Eyer Embolisi', info: 'Dev pıhtı pulmoner arter çatalına oturur. Dakikalar içinde ani ölüm. Otopside dramatik görüntü.' },
      { img: '59_pe_cross.png', label: 'Akciğer İnfarktüsü', info: 'Hemorajik kama şeklinde lezyon. Plevral ağrı ve hemoptizi. Alt loblarda daha sık.' },
    ],
  },
  {
    id: '21_beyin_kanamasi',
    title: 'BEYNİNİZDEKİ BOMBA: ANEVRİZMA!',
    subtitle: 'İntrakraniyal Kanama Türleri ve Adli Tıp',
    layout: 'quad',
    panels: [
      { img: '60_subdural.png', label: 'Subdural Hematom', info: 'Köprü venleri yırtılması. Yaşlılar, alkolikler, kan sulandırıcı kullananlar risk grubu. Çocuklarda: Shaken Baby Sendromu! Türkiye\'de çocuk istismarı vakalarında sık bulgu.' },
      { img: '61_berry_aneurysm.png', label: 'Berry Anevrizması', info: 'Willis poligonunda 2-10 mm balon. Hipertansiyon, sigara, genetik yatkınlık. Patlayınca subaraknoid kanama → ani ölüm!' },
      { img: '62_cerebral_infarct.png', label: 'Serebral İnfarkt', info: 'Orta serebral arter (MCA) tıkanması en sık. 4.5 saat altın süre! Trombolitik tedavi uygulanmazsa kalıcı hasar.' },
      { img: '47_brain_hematoma.png', label: 'Epidural Hematom', info: 'Orta meningeal arter yırtılması. "Lucid interval": Darbe sonrası iyi görünüp saatler içinde koma ve ölüm! Acil cerrahi şart.' },
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

function createHeaderOverlay(infographic) {
  const headerH = 165;
  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(10,10,10,0.97)"/><stop offset="100%" stop-color="rgba(15,23,42,0.95)"/></linearGradient></defs>`;
  svg += `<rect x="0" y="0" width="${W}" height="${headerH}" fill="url(#hg)" />`;

  svg += `<rect x="0" y="0" width="${W}" height="5" fill="#DC2626" />`;

  svg += `<rect x="${PAD}" y="18" width="5" height="18" rx="2" fill="#DC2626" />`;
  svg += `<text x="${PAD + 16}" y="33" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="16" fill="#DC2626">ADL&#x130;  TIP  GERÇEKLER&#x130;</text>`;

  const titleLines = wrapText(infographic.title, 24);
  titleLines.forEach((line, i) => {
    svg += `<text x="${PAD}" y="${72 + i * 40}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="38" fill="#FFFFFF">${esc(line)}</text>`;
  });

  const subtitleY = 72 + titleLines.length * 40 + 8;
  svg += `<text x="${PAD}" y="${subtitleY}" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="17" fill="rgba(255,255,255,0.6)" font-style="italic">${esc(infographic.subtitle)}</text>`;

  svg += `<rect x="0" y="${headerH - 4}" width="${W}" height="4" fill="#DC2626" />`;

  const footerH = 44;
  svg += `<rect x="0" y="${H - footerH}" width="${W}" height="${footerH}" fill="rgba(10,10,10,0.95)" />`;
  svg += `<rect x="0" y="${H - footerH}" width="${W}" height="3" fill="#DC2626" />`;
  svg += `<rect x="${PAD}" y="${H - footerH + 13}" width="4" height="18" rx="1" fill="#DC2626" />`;
  svg += `<text x="${PAD + 14}" y="${H - footerH + 29}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="17" fill="#FFFFFF">Nurcan Denli Bayır</text>`;

  svg += `</svg>`;
  return Buffer.from(svg);
}

function createPanelLabel(panel, w, h, isLarge) {
  const fontSize = isLarge ? 18 : 16;
  const labelFontSize = isLarge ? 22 : 20;
  const charsPerLine = Math.floor(w / (fontSize * 0.58));
  const infoLines = wrapText(panel.info, charsPerLine);
  const lineH = fontSize + 5;
  const maxInfoLines = isLarge ? 4 : 3;
  const shownLines = infoLines.slice(0, maxInfoLines);
  const labelH = 36 + shownLines.length * lineH + 10;

  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<defs><linearGradient id="lg${w}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="20%" stop-color="rgba(0,0,0,0.65)"/><stop offset="100%" stop-color="rgba(0,0,0,0.95)"/></linearGradient></defs>`;
  svg += `<rect x="0" y="${h - labelH}" width="${w}" height="${labelH}" fill="url(#lg${w})" />`;
  svg += `<rect x="0" y="${h - labelH}" width="${w}" height="3" fill="#DC2626" />`;
  svg += `<text x="10" y="${h - labelH + 26}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="${labelFontSize}" fill="#FFFFFF">${esc(panel.label)}</text>`;
  shownLines.forEach((line, i) => {
    svg += `<text x="10" y="${h - labelH + 26 + 6 + (i + 1) * lineH}" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="${fontSize}" fill="rgba(255,255,255,0.92)">${esc(line)}</text>`;
  });
  svg += `</svg>`;
  return Buffer.from(svg);
}

async function compositeQuad(infographic) {
  const panelDir = path.join(__dirname, '..', 'client', 'public', 'infographic_panels');
  const headerH = 165;
  const footerH = 44;
  const cellW = Math.floor((W - PAD * 2 - GAP) / 2);
  const cellH = Math.floor((H - headerH - footerH - GAP - PAD) / 2);
  const startY = headerH + 3;

  const base = sharp({ create: { width: W, height: H, channels: 4, background: { r: 10, g: 10, b: 15, alpha: 1 } } }).png();
  const composites = [];

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = PAD + col * (cellW + GAP);
    const y = startY + row * (cellH + GAP);
    const imgPath = path.join(panelDir, infographic.panels[i].img);
    const panelBuf = await sharp(imgPath).resize(cellW, cellH, { fit: 'cover' }).png().toBuffer();
    composites.push({ input: panelBuf, left: x, top: y });
    composites.push({ input: createPanelLabel(infographic.panels[i], cellW, cellH, false), left: x, top: y });
  }

  composites.push({ input: createHeaderOverlay(infographic), left: 0, top: 0 });
  return base.composite(composites).png().toBuffer();
}

async function compositeMainBottom3(infographic) {
  const panelDir = path.join(__dirname, '..', 'client', 'public', 'infographic_panels');
  const headerH = 165;
  const footerH = 44;
  const startY = headerH + 3;
  const totalContent = H - headerH - footerH - GAP * 2;
  const mainH = Math.floor(totalContent * 0.58);
  const mainW = W - PAD * 2;
  const bottomH = totalContent - mainH;
  const bottomW = Math.floor((W - PAD * 2 - GAP * 2) / 3);

  const base = sharp({ create: { width: W, height: H, channels: 4, background: { r: 10, g: 10, b: 15, alpha: 1 } } }).png();
  const composites = [];

  const mainBuf = await sharp(path.join(panelDir, infographic.panels[0].img)).resize(mainW, mainH, { fit: 'cover' }).png().toBuffer();
  composites.push({ input: mainBuf, left: PAD, top: startY });
  composites.push({ input: createPanelLabel(infographic.panels[0], mainW, mainH, true), left: PAD, top: startY });

  const bottomY = startY + mainH + GAP;
  for (let i = 0; i < 3; i++) {
    const x = PAD + i * (bottomW + GAP);
    const panel = infographic.panels[i + 1];
    const panelBuf = await sharp(path.join(panelDir, panel.img)).resize(bottomW, bottomH, { fit: 'cover' }).png().toBuffer();
    composites.push({ input: panelBuf, left: x, top: bottomY });
    composites.push({ input: createPanelLabel(panel, bottomW, bottomH, false), left: x, top: bottomY });
  }

  composites.push({ input: createHeaderOverlay(infographic), left: 0, top: 0 });
  return base.composite(composites).png().toBuffer();
}

async function main() {
  const outDir = path.join(__dirname, '..', 'client', 'public', 'instagram_infographics_v2');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const info of INFOGRAPHICS) {
    try {
      const buf = info.layout === 'quad' ? await compositeQuad(info) : await compositeMainBottom3(info);
      fs.writeFileSync(path.join(outDir, `${info.id}.png`), buf);
      console.log(`✓ ${info.id}`);
    } catch (err) {
      console.error(`✗ ${info.id}: ${err.message}`);
    }
  }
  console.log(`\nToplam ${INFOGRAPHICS.length} infografik oluşturuldu!`);
}

main().catch(console.error);
