const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const W = 1080, H = 1080;
const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const outDir = path.join(__dirname, '..', 'client', 'public', 'instagram_infographics');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const INFOGRAPHICS = [
  {
    id: '01_gsr',
    title: 'ATIŞ ARTIKLARI ANALİZİ (GSR)',
    subtitle: 'Yakın Mesafe Ateşli Silah Kalıntıları',
    sections: [
      {
        heading: '🔬 BARUT KALINTILARI',
        color: '#F59E0B',
        items: [
          '● Yanmamış barut taneleri (disk, küre, silindir şekilli)',
          '● Namlu çıkışında 30 cm\'e kadar yayılır',
          '● Dimetilftalat (DPA) kimyasal tespit ile doğrulanır',
        ]
      },
      {
        heading: '⚡ METALİK PARÇACIKLAR',
        color: '#3B82F6',
        items: [
          '● Pb (Kurşun) — çekirdek izleri',
          '● Cu (Bakır) — ceket izleri',
          '● Ba + Sb + Pb üçlüsü = GSR pozitif (SEM-EDX)',
        ]
      },
      {
        heading: '🔥 KARBON BİRİKİMİ',
        color: '#EF4444',
        items: [
          '● İs (Soot): Temas & yakın atışta yoğun siyah halka',
          '● Bullet wipe: Mermi yüzeyinden kalan halka',
          '● Stippling (tatuaj): 15-90 cm arası saçma paterni',
        ]
      },
      {
        heading: '📐 ATIŞ MESAFESİ TAYİNİ',
        color: '#10B981',
        items: [
          '● Temas (0 cm): Yıldız yırtık + is + gaz cebi',
          '● Yakın (1-15 cm): Yoğun is + barut tatuajı',
          '● Ara (15-90 cm): Sadece stippling (tatuaj)',
          '● Uzak (>90 cm): Sadece mermi giriş deliği',
        ]
      },
    ],
    footer: 'Kaynak: DiMaio — Gunshot Wounds (3rd Ed.) • Forensic Sci Int (2024)'
  },
  {
    id: '02_postmortem',
    title: 'ÖLÜM SONRASI DEĞİŞİKLİKLER',
    subtitle: 'Erken & Geç Postmortem Bulgular — Zaman Çizelgesi',
    sections: [
      {
        heading: '🌡️ ERKEN BULGULAR (0-24 SAAT)',
        color: '#3B82F6',
        items: [
          '● Algor mortis: Vücut ısısı ↓ ~1°C/saat (Henssge nomogramı)',
          '● Livor mortis: 30 dk\'da başlar → 8-12 saatte fikse',
          '● Rigor mortis: 2-4 saat → tam 12 saat → çözülme 36 saat',
          '● Kornea bulanıklaşması: Açık gözde 2-3 saat',
        ]
      },
      {
        heading: '⏰ GEÇ BULGULAR (1-14 GÜN)',
        color: '#F59E0B',
        items: [
          '● Yeşil renk değişikliği: Sağ alt kadran → 24-36 saat',
          '● Gaz oluşumu (şişme): 2-3 gün (sıcakta hızlanır)',
          '● Mermer görünümü: Yüzeyel damar ağı → 3-5 gün',
          '● Deri soyulması + saç/tırnak gevşemesi → 5-7 gün',
        ]
      },
      {
        heading: '💀 İLERİ DEĞİŞİKLİKLER',
        color: '#EF4444',
        items: [
          '● Dekompozisyon: Yumuşak doku kaybı → 2-4 hafta',
          '● Adiposir (mumyalaşma): Nemli ortam → 3-6 ay',
          '● Mumyalaşma: Sıcak/kuru ortam → haftalar-aylar',
          '● İskeletleşme: 1-10+ yıl (iklime bağlı)',
        ]
      },
      {
        heading: '🧪 PMI TAYİN YÖNTEMLERİ',
        color: '#8B5CF6',
        items: [
          '● Rektal sıcaklık (Henssge): ±2.8 saat hassasiyet',
          '● Vitröz K⁺ artışı: Saatlik lineer artış',
          '● Entomolojik analiz: ADD hesaplama',
        ]
      },
    ],
    footer: 'Kaynak: Knight\'s Forensic Pathology (4th Ed.) • Saukko & Knight (2015)'
  },
  {
    id: '03_yaralama',
    title: 'ADLİ TIPTA YARA TİPLERİ',
    subtitle: 'Künt & Kesici-Delici Yaralanma Sınıflandırması',
    sections: [
      {
        heading: '🔨 KÜNT TRAVMA',
        color: '#EF4444',
        items: [
          '● Abrazyon (sıyrık): Epidermis hasarı, patern iz bırakır',
          '● Kontüzyon (ekimoz): Subkutan kanama, renk değişimi',
          '  → Kırmızı-mor (0-3 gün) → Yeşil (5-7) → Sarı (7-14)',
          '● Laserasyon (ezik-yırtık): Düzensiz kenar + doku köprüleri',
        ]
      },
      {
        heading: '🔪 KESİCİ YARALANMA',
        color: '#3B82F6',
        items: [
          '● İnsizyon (kesi): Düzgün kenar, uzunluk > derinlik',
          '● Kuyruk izi: Başlangıç derin, bitiş sığ',
          '● Tereddüt yaraları: Paralel yüzeyel kesiler (intihar?)',
          '● Savunma yaraları: El-kol palmar yüzde derin kesiler',
        ]
      },
      {
        heading: '🗡️ DELİCİ-KESİCİ YARALANMA',
        color: '#F59E0B',
        items: [
          '● Derinlik > yüzey uzunluğu (bıçak tipi)',
          '● Tek keskin kenarlı: 1 sivri + 1 künt uç',
          '● Çift keskin kenarlı: 2 sivri uç (hançer tipi)',
          '● İç organ yaralanma paterni → alet boyutu tahmini',
        ]
      },
      {
        heading: '⚖️ TCK DEĞERLENDİRME',
        color: '#10B981',
        items: [
          '● Basit tıbbi müdahale (BTM) ile giderilebilir mi?',
          '● Kemik kırığı → ağırlaştırıcı neden',
          '● Yüzde sabit iz → ağırlaştırıcı neden',
          '● Yaşamsal tehlike → en ağır kategori',
        ]
      },
    ],
    footer: 'Kaynak: TCK m.86-87 • Adli Tıp Ders Kitabı (Gündoğmuş, 2024)'
  },
  {
    id: '04_asfiksi',
    title: 'ASFİKSİ TÜRLERİ & BULGULARI',
    subtitle: 'Mekanik Asfiksi — Sınıflandırma & Otopsi Bulguları',
    sections: [
      {
        heading: '🔗 ASI (HANGING)',
        color: '#EF4444',
        items: [
          '● Tipik: Düğüm arkada → bilateral karotis basısı',
          '● Atipik: Düğüm yanda/önde → tek taraflı bası',
          '● İp izi: Yukarı açılı, kesintili, pergament reaksiyon',
          '● Bulgu: Tardieu lekeleri, boyun kas kanaması',
        ]
      },
      {
        heading: '🤲 BOĞMA (STRANGULATION)',
        color: '#3B82F6',
        items: [
          '● Ligature: Yatay ip izi, tam halka, kesintisiz',
          '● Manuel: Tırnak izleri, ekimozlar, krikoid kırığı',
          '● Hyoid kemik kırığı: >40 yaş sonrası ossifikasyon',
          '● İç bulgu: Subplevral-subepikardyal peteşiler',
        ]
      },
      {
        heading: '💧 BOĞULMA (DROWNING)',
        color: '#06B6D4',
        items: [
          '● Tatlı su: Hemodilüsyon, hipervolemi, VF',
          '● Tuzlu su: Hemokonsentrasyon, pulmoner ödem',
          '● Diatom testi: Akciğer + kemik iliğinde alg tespiti',
          '● Mantar köpük: Ağız-burunda ince beyaz köpük',
        ]
      },
      {
        heading: '🔍 ORTAK BULGULAR',
        color: '#F59E0B',
        items: [
          '● Siyanoz (yüz-boyun morarması)',
          '● Peteşiyal kanamalar (göz, yüz, konjonktiva)',
          '● Pulmoner ödem + konjesyon',
          '● Tardieu lekeleri (visseral plevra, perikard)',
        ]
      },
    ],
    footer: 'Kaynak: Knight\'s Forensic Pathology • DiMaio & DiMaio — Forensic Pathology (2001)'
  },
  {
    id: '05_toksikoloji',
    title: 'ADLİ TOKSİKOLOJİ REHBERİ',
    subtitle: 'Zehirlenme Türleri, Numune & Analiz Yöntemleri',
    sections: [
      {
        heading: '☠️ YAYGIN ZEHİRLER',
        color: '#EF4444',
        items: [
          '● Organofosfat: Kolinerjik kriz, miyozis, terleme',
          '● CO (karbon monoksit): Cherry-red livor mortis',
          '● Siyanür: Acı badem kokusu, parlak kırmızı livor',
          '● Arsenik: Kronik → Mees çizgileri (tırnakta)',
        ]
      },
      {
        heading: '🧪 NUMUNE TÜRLERİ',
        color: '#3B82F6',
        items: [
          '● Periferik kan (femoral): Altın standart, 10 mL',
          '● İdrar: İlaç metabolitleri, tarama testi',
          '● Vitröz hümör: Alkol düzeyi, kontaminasyona dirençli',
          '● Mide içeriği: Alınan madde + zaman tahmini',
          '● Saç: Kronik kullanım geçmişi (3 ay)',
        ]
      },
      {
        heading: '🔬 ANALİZ YÖNTEMLERİ',
        color: '#F59E0B',
        items: [
          '● İmmünoassay: Hızlı tarama (ön test)',
          '● GC-MS: Uçucu maddeler, doğrulama testi',
          '● LC-MS/MS: İlaçlar, peptidler — altın standart',
          '● ICP-MS: Ağır metal (Pb, As, Hg, Tl) tayini',
        ]
      },
      {
        heading: '⚠️ POST-MORTEM REDİSTRİBÜSYON',
        color: '#8B5CF6',
        items: [
          '● Ölüm sonrası ilaç konsantrasyonları değişir!',
          '● Santral/periferik kan oranı önemli (C/P ratio)',
          '● Femoral kan > kardiyak kan (güvenilirlik)',
        ]
      },
    ],
    footer: 'Kaynak: Baselt — Disposition of Toxic Drugs (12th Ed.) • Forensic Toxicol (2025)'
  },
  {
    id: '06_kemik_yasi',
    title: 'İSKELET YAŞ TAYİNİ',
    subtitle: 'Radyolojik Yöntemler & Epifiz Kapanma Zamanları',
    sections: [
      {
        heading: '✋ EL-BİLEK (GREULICH-PYLE)',
        color: '#3B82F6',
        items: [
          '● Sol el-bilek AP röntgeni standart',
          '● Atlas karşılaştırma yöntemi',
          '● 0-18 yaş arası geçerli, ±6 ay hata payı',
          '● Tanner-Whitehouse: Skorlama sistemi (daha objektif)',
        ]
      },
      {
        heading: '🦴 ÖNEMLİ EPİFİZ KAPANMA YAŞLARI',
        color: '#F59E0B',
        items: [
          '● Dirsek (olekranon): 14-16 yaş',
          '● Distal radius: 17-19 yaş (K<E)',
          '● İliak krest (pelvis): 16-20 yaş',
          '● Klavikula medial epifizi: 18-25 yaş ★',
          '  → 18 yaş sınırı için EN ÖNEMLİ belirteç',
        ]
      },
      {
        heading: '🦷 DİŞ GELİŞİMİ',
        color: '#10B981',
        items: [
          '● Demirjian yöntemi: 8 aşamalı skorlama (3-16 yaş)',
          '● 3. molar (yirmilik diş): 17-25 yaş arası',
          '● Cameriere: Açık apeks oranı hesabı',
          '● Panoramik röntgen standart',
        ]
      },
      {
        heading: '⚖️ HUKUKİ SINIRLAR',
        color: '#EF4444',
        items: [
          '● 12 yaş: Cezai sorumluluk başlangıcı',
          '● 15 yaş: Cinsel rıza yaşı (TCK)',
          '● 18 yaş: Reşitlik, tam cezai ehliyet',
          '● Kemik yaşı ±2 yıl hata payı: Lehe yorum ilkesi',
        ]
      },
    ],
    footer: 'Kaynak: Schmeling et al. — Int J Legal Med (2024) • Greulich & Pyle Atlas'
  },
  {
    id: '07_dna',
    title: 'ADLİ DNA ANALİZİ',
    subtitle: 'Örnekten Profile: Adım Adım DNA Tiplemesi',
    sections: [
      {
        heading: '🩸 NUMUNE KAYNAKLARI',
        color: '#EF4444',
        items: [
          '● Kan, tükürük, semen, saç kökü, deri hücresi',
          '● Touch DNA: 5-10 hücre yeterli (kapı kolu, silah)',
          '● Kemik/diş: Yıllar sonra bile DNA izole edilebilir',
          '● Tırnak altı kazıntısı: Saldırgan DNA\'sı',
        ]
      },
      {
        heading: '🧬 ANALİZ SÜRECİ',
        color: '#3B82F6',
        items: [
          '● 1. Ekstraksiyon: DNA izolasyonu (Chelex, organik)',
          '● 2. Kantitasyon: DNA miktarı ölçümü (qPCR)',
          '● 3. Amplifikasyon: PCR ile STR bölgesi çoğaltma',
          '● 4. Kapiller elektroforez: Allel ayrımı',
          '● 5. Profil yorumu: Elektroferogramdan genotip',
        ]
      },
      {
        heading: '📊 STR PROFİLİ',
        color: '#F59E0B',
        items: [
          '● 16-24 STR lokusu analiz edilir (GlobalFiler)',
          '● Rastgele eşleşme olasılığı: 1 / 10¹⁸',
          '● Amelogenin: Cinsiyet tayini (X/Y)',
          '● Y-STR: Baba soy hattı takibi',
        ]
      },
      {
        heading: '🆕 YENİ TEKNOLOJİLER',
        color: '#8B5CF6',
        items: [
          '● NGS (Yeni nesil sekanslama): SNP + STR birlikte',
          '● DNA Fenotipleme: Göz/saç/ten rengi tahmini',
          '● Genetik soyağacı (GED match): Soğuk vakalarda devrim',
        ]
      },
    ],
    footer: 'Kaynak: Butler — Forensic DNA Typing (3rd Ed.) • Forensic Sci Int Genet (2025)'
  },
  {
    id: '08_olum_nedeni',
    title: 'ÖLÜM NEDENİ & ŞEKLİ',
    subtitle: 'Adli Tıp Raporunda Ölüm Sınıflandırması',
    sections: [
      {
        heading: '📋 ÖLÜM NEDENİ (Cause)',
        color: '#EF4444',
        items: [
          '● Yakın neden: Doğrudan ölüme yol açan patoloji',
          '  → Örn: Beyin kanaması, pulmoner emboli',
          '● Altta yatan neden: Olaylar zincirinin başlangıcı',
          '  → Örn: Künt kafa travması → epidural kanama',
        ]
      },
      {
        heading: '⚖️ ÖLÜM ŞEKLİ (Manner)',
        color: '#3B82F6',
        items: [
          '● Doğal ölüm: Hastalık kaynaklı (MI, SVO, kanser)',
          '● Cinayet (Homicide): Bir başkası tarafından öldürme',
          '● İntihar (Suicide): Kendi eliyle ölüm',
          '● Kaza (Accident): İstem dışı travmatik ölüm',
          '● Belirlenemeyen: Kanıtlar yetersiz',
        ]
      },
      {
        heading: '💀 ANİ ÖLÜM NEDENLERİ',
        color: '#F59E0B',
        items: [
          '● Kardiyak: MI, aort diseksiyonu, aritmiler (%80)',
          '● Serebral: SAK, intraserebral kanama',
          '● Pulmoner: Masif PE, pnömotoraks',
          '● Abdominal: AAA rüptürü, ektopik gebelik',
        ]
      },
      {
        heading: '🔍 İNCELEME BASAMAKLARI',
        color: '#10B981',
        items: [
          '● Olay yeri inceleme → Dış muayene → Otopsi',
          '● Histopatoloji + Toksikoloji + Biyokimya',
          '● Olay yeri bilgileri + tıbbi özgeçmiş',
          '● Nihai rapor: Neden + Şekil + Katkıda bulunan nedenler',
        ]
      },
    ],
    footer: 'Kaynak: Saukko & Knight — Knight\'s Forensic Pathology (4th Ed., 2015)'
  },
  {
    id: '09_cinsel_saldiri',
    title: 'CİNSEL SALDIRI MUAYENESİ',
    subtitle: 'Adli Muayene Protokolü & Kanıt Toplama',
    sections: [
      {
        heading: '📋 MUAYENE PROTOKOLÜ',
        color: '#8B5CF6',
        items: [
          '● Aydınlatılmış onam alınması (yazılı)',
          '● Detaylı anamnez: Olay öyküsü, zaman, yer',
          '● Genel vücut muayenesi: Ekstragenital bulgular',
          '● Genital muayene: Kolposkopi + fotoğraflama',
        ]
      },
      {
        heading: '🧪 KANIT TOPLAMA KİTİ',
        color: '#3B82F6',
        items: [
          '● Giysiler: Ayrı ayrı kağıt poşetlere (naylon değil!)',
          '● Vücut sürüntüleri: Ağız, vajinal, anal, deri',
          '● Tırnak altı kazıntısı + saç taraması',
          '● Referans kan + tükürük örneği (mağdurdan)',
          '● Optimal süre: Olaydan sonra ilk 72 saat',
        ]
      },
      {
        heading: '🔬 LABORATUVAR',
        color: '#F59E0B',
        items: [
          '● PSA (Prostat Spesifik Antijen): Semen varlığı tespiti',
          '● Asit fosfataz (AP): Seminal sıvı ön testi',
          '● DNA profili: Spermatozoadan STR analizi',
          '● Y-STR: Azoospermik failin bile tespiti mümkün',
        ]
      },
      {
        heading: '⚠️ KRİTİK NOTLAR',
        color: '#EF4444',
        items: [
          '● Bulgu yokluğu ≠ Olay olmadı (penetrasyon olmayabilir)',
          '● Hymen esnekliği: Yırtık olmaması olayı dışlamaz',
          '● Rıza ile olan ilişkide de aynı bulgular olabilir',
        ]
      },
    ],
    footer: 'Kaynak: WHO Guidelines (2024) • J Forensic Legal Med (2025)'
  },
  {
    id: '10_olay_yeri',
    title: 'OLAY YERİ İNCELEME',
    subtitle: 'Adli Olay Yeri Protokolü & Delil Yönetimi',
    sections: [
      {
        heading: '🚧 GÜVENLİK & KORUMA',
        color: '#EF4444',
        items: [
          '● İç-dış kordon oluşturma',
          '● Kontaminasyon önleme: Eldiven, bone, galoş',
          '● Giriş-çıkış güzergahı belirleme',
          '● Yetkisiz kişilerin alandan uzaklaştırılması',
        ]
      },
      {
        heading: '📸 DOKÜMANTASYON',
        color: '#3B82F6',
        items: [
          '● Fotoğraflama: Genel → orta → yakın çekim (cetvelli)',
          '● Video kaydı: 360° genel görünüm',
          '● Krokiz (sketç): Ölçekli olay yeri planı',
          '● Yazılı kayıt: Her delil numaralanır + konumu not edilir',
        ]
      },
      {
        heading: '🔎 DELİL TOPLAMA',
        color: '#F59E0B',
        items: [
          '● Biyolojik: Kan, tükürük, semen, saç → kağıt poşet',
          '● Parmak izi: Toz, süper yapıştırıcı, ninhydrin',
          '● Ateşli silah kalıntısı (GSR): Stub ile toplama',
          '● Dijital: Telefon, bilgisayar → Faraday torbası',
          '● Locard ilkesi: "Her temas bir iz bırakır"',
        ]
      },
      {
        heading: '⛓️ DELİL ZİNCİRİ',
        color: '#10B981',
        items: [
          '● Kim topladı → Kim taşıdı → Kim analiz etti',
          '● Her el değiştirmede tutanak düzenlenir',
          '● Zincir kırılırsa delil mahkemede geçersiz olabilir',
        ]
      },
    ],
    footer: 'Kaynak: Saferstein — Criminalistics (13th Ed.) • Adli Bilimler Dergisi (2025)'
  },
  {
    id: '11_kafa_travma',
    title: 'KAFA TRAVMASI & ADLİ DEĞERLENDİRME',
    subtitle: 'Kraniyal Yaralanmalar — Patern Analizi',
    sections: [
      {
        heading: '💀 KAFATASI KIRIKLARI',
        color: '#EF4444',
        items: [
          '● Lineer: Düz çizgisel, en sık temporal kemik',
          '● Çökme: İçe doğru, alet ucu paterni verir',
          '● Diastasis: Sütür ayrılması (yüksek enerji)',
          '● Baziler: Kafa tabanı, Battle + Raccoon işareti',
        ]
      },
      {
        heading: '🧠 İNTRAKRANYAL KANAMALAR',
        color: '#3B82F6',
        items: [
          '● Epidural hematom: A. meningea media → lens şekli',
          '  → Lucid interval → hızlı kötüleşme → ACİL',
          '● Subdural hematom: Köprü venleri → hilal şekli',
          '  → Akut (<3 gün) / Subakut (3-21) / Kronik (>21)',
          '● Subaraknoid kanama: Travmatik veya spontan (anevrizma)',
        ]
      },
      {
        heading: '🔍 ADLİ AÇIDAN ÖNEMİ',
        color: '#F59E0B',
        items: [
          '● Coup vs Contrecoup: Vuruş noktası vs karşı taraf',
          '● Darbe vs düşme ayrımı: Konum + şiddet + patern',
          '● Shaken Baby Sendromu: Retinal kanama + SDH + BÖ',
        ]
      },
      {
        heading: '📊 GLASKOw KOMA SKALASI (GKS)',
        color: '#10B981',
        items: [
          '● Göz açma (1-4) + Sözel (1-5) + Motor (1-6) = 3-15',
          '● Hafif (13-15) / Orta (9-12) / Ağır (3-8)',
          '● GKS ≤8: Entübasyon endikasyonu',
          '● TCK\'da yaşamsal tehlike değerlendirmesi',
        ]
      },
    ],
    footer: 'Kaynak: Reith et al. — Forensic Neuropathology (2024) • Knight Ch. 5'
  },
  {
    id: '12_doku_donoru',
    title: 'YARA İYİLEŞME EVRELERİ',
    subtitle: 'Histopatolojik Zamanlama — Yara Yaşı Tayini',
    sections: [
      {
        heading: '🔴 İNFLAMASYON FAZı (0-3 GÜN)',
        color: '#EF4444',
        items: [
          '● 0-4 saat: Kanama, fibrin tıkacı, trombosit agregasyonu',
          '● 4-12 saat: Nötrofil (PMN) infiltrasyonu başlar',
          '● 12-24 saat: Yoğun PMN birikimi + ödem',
          '● 24-72 saat: Makrofaj dominansı → debris temizliği',
        ]
      },
      {
        heading: '🟡 PROLİFERASYON FAZı (3-14 GÜN)',
        color: '#F59E0B',
        items: [
          '● 3-5 gün: Fibroblast proliferasyonu + granülasyon dokusu',
          '● 5-7 gün: Neovaskülarizasyon (yeni damar oluşumu)',
          '● 7-14 gün: Kollajen sentezi + epitelizasyon',
          '● Hemosiderin birikimi: 4-7 gün sonra (demir)',
        ]
      },
      {
        heading: '🟢 REMODELING FAZı (14+ GÜN)',
        color: '#10B981',
        items: [
          '● Kollajen yeniden düzenlenmesi → skar dokusu',
          '● Çekme kuvveti: 6 haftada orijinalin %80\'i',
          '● Olgunlaşma: Aylar-yıllar sürer',
        ]
      },
      {
        heading: '🔬 İHK BELİRTEÇLERİ',
        color: '#8B5CF6',
        items: [
          '● Fibronektin: İlk 1-3 saat (en erken belirteç)',
          '● Tenascin-C: 12 saat-5 gün',
          '● CD15 (nötrofil): 6-24 saat / CD68 (makrofaj): 24-72 saat',
          '● VEGF: 3+ gün (anjiogenez belirteci)',
        ]
      },
    ],
    footer: 'Kaynak: Kondo — Int J Legal Med (2024) • Forensic Sci Med Pathol (2025)'
  },
];

function makeSVG(info) {
  const padX = 50;
  let y = 0;

  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${W}" height="${H}" fill="#0F172A" />`;

  y = 48;
  svg += `<rect x="${padX}" y="${y}" width="6" height="32" rx="3" fill="#F59E0B" />`;
  svg += `<text x="${padX + 18}" y="${y + 25}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="24" fill="#FFFFFF" letter-spacing="1">${esc(info.title)}</text>`;

  y += 42;
  svg += `<text x="${padX}" y="${y + 14}" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="14.5" fill="#94A3B8" font-style="italic">${esc(info.subtitle)}</text>`;

  y += 30;
  svg += `<rect x="${padX}" y="${y}" width="${W - padX * 2}" height="1.5" fill="rgba(255,255,255,0.08)" />`;
  y += 16;

  const sectionCount = info.sections.length;
  const availableH = H - y - 80;
  const sectionH = Math.floor(availableH / sectionCount);

  for (const sec of info.sections) {
    svg += `<rect x="${padX}" y="${y}" width="4" height="${Math.min(sectionH - 10, sec.items.length * 22 + 30)}" rx="2" fill="${sec.color}" opacity="0.6" />`;

    svg += `<text x="${padX + 16}" y="${y + 18}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="16" fill="${sec.color}">${esc(sec.heading)}</text>`;
    y += 30;

    for (const item of sec.items) {
      const isIndented = item.startsWith('  →') || item.startsWith('  →');
      const xOff = isIndented ? 30 : 16;
      const fSize = isIndented ? '13' : '13.5';
      const fill = isIndented ? 'rgba(148,163,184,0.85)' : 'rgba(226,232,240,0.92)';
      const weight = isIndented ? '400' : '400';

      svg += `<text x="${padX + xOff}" y="${y + 12}" font-family="Arial, Helvetica, sans-serif" font-weight="${weight}" font-size="${fSize}" fill="${fill}">${esc(item)}</text>`;
      y += 19;
    }
    y += 12;
  }

  const footerY = H - 28;
  svg += `<rect x="${padX}" y="${footerY - 18}" width="${W - padX * 2}" height="1" fill="rgba(255,255,255,0.06)" />`;
  svg += `<text x="${padX}" y="${footerY}" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="11" fill="rgba(148,163,184,0.45)">${esc(info.footer)}</text>`;
  svg += `<text x="${W - padX}" y="${footerY}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="12" fill="rgba(245,158,11,0.7)" text-anchor="end">Nurcan Denli Bayır</text>`;

  svg += `</svg>`;
  return svg;
}

async function generate() {
  for (const info of INFOGRAPHICS) {
    const svg = makeSVG(info);
    const outPath = path.join(outDir, `${info.id}.png`);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outPath);

    console.log(`✓ ${info.id} — ${info.title}`);
  }
  console.log(`\n${INFOGRAPHICS.length} infografik oluşturuldu → ${outDir}`);
}

generate().catch(e => { console.error(e); process.exit(1); });
