# LitReview - Academic Paper Management Platform

## Overview

LitReview is a full-stack web application designed for researchers to manage academic literature reviews. It facilitates organizing papers, creating collections, taking notes, and leveraging AI for advanced paper analysis and literature search. The platform also integrates specialized forensic science features, including AI-powered book translation, forensic signature analysis (ChiroBench), lens thickness statistical analysis, and an AI-driven academic database search engine.

## User Preferences

Preferred communication style: Simple, everyday language.

### Akademik Makale Üretiminde Mutlak Kurallar (Dr. Nurcan — kalıcı, her makale için geçerli)

Kullanıcı her akademik makale/tez/bilimsel rapor talebinde aşağıdaki kuralların **istisnasız ve hatırlatma gerektirmeden** uygulanmasını ister. İhlali kabul edilemez.

**1. Veri/Kanıt bütünlüğü (Zero-Hallucination Policy)**
- **YASAK:** Plausible/uydurma metodoloji, placeholder veri, hayali sayı, hayali referans, hayali yazar, hayali DOI/PMID, hayali tablo/şekil, "tahmini olarak", "muhtemelen şu civardadır", "literatürde genelde" gibi sahte-otorite ifadeleri.
- **ZORUNLU:** Her sayı, oran, OR/RR/HR, p-değeri, CI, n, %; ya gerçek kaynaktan (PubMed/Cochrane/WHO/RCOG/ACOG/UpToDate/TÜİK/SağBakanlığı/yerel veri) doğrulanmış olacak ya da kendi gerçek hesabımızdan (yeniden üretilebilir betikle) gelecek. Doğrulanamıyorsa "veri yok / kaynak gerekli" diye açıkça yazılacak.
- **ZORUNLU:** Her dış referansın yıl + dergi + cilt/sayı + sayfa + DOI/PMID erişilebilir olacak; web fetch ile doğrulanabiliyorsa doğrula, doğrulanmıyorsa uyar.

**2. Bilişsel hatalar — sıfır tolerans**
- **Inconsistency:** Aynı sayı bir bölümde 108, başka bölümde 201 olmayacak. Tüm rakamlar tek bir gerçek-veri kaynağından beslenip otomatik tutarlılık kontrolü yapılacak.
- **Context loss:** Önceki turlardaki düzeltmeler unutulmayacak (örn. Aboutanos "8-yıl" değil "5-yıl"; Mendez-Figueroa duplikat değil; Schiff iki ayrı makale).
- **Confirmation bias:** TOMEC/skor lehine sonuç peşinde koşulmayacak; karşı bulgu da aynı titizlikle raporlanacak.
- **Repetition:** Aynı paragraf/cümle iki kez yazılmayacak; özet ve gövde arasında copy-paste değil sentez olacak.
- **Formatting errors:** AMA referans formatı tutarlı, Türkçe karakterler bozulmayacak, tablo başlıkları/numaralandırmaları sıralı olacak.

**3. Araştırma boşluğu (Research Gap) tespiti — zorunlu adım**
- Her makalenin Giriş bölümünde, sistematik literatür taraması sonrası **somut research gap**: "X yapılmış, Y yapılmış, ancak Z hâlâ açık — bu çalışma Z’yi şu yöntemle dolduruyor" cümlesi açık yer alacak.

**4. Kaynak tarama — derin ve güncel**
- PubMed (son 5 yıl + landmark eski), Cochrane, EMBASE benzeri, ACOG/RCOG/NICE/RANZCOG/Queensland kılavuzları, TÜİK, T.C. Sağlık Bakanlığı, AdliTıp Kurumu yayınları, Yargıtay/Danıştay/AYM/AİHM kararları (Sinerji + UYAP), Türk hukuk doktrini (Özgenç/Hakeri/Centel-Zafer), uluslararası mediko-legal: J Forensic Sci, Forensic Sci Int, Int J Legal Med, J Trauma, Am J Obstet Gynecol, BJOG, NEJM, Lancet, BMJ.
- Mümkün her durumda **web search + integrations** kullanılacak; gerçek erişim sağlanamayan kaynak referans verilmeyecek.

**5. İstatistik — gerçek hesap, en güncel yöntem**
- **Yasak:** "Yaklaşık", "tahminen", "kabaca". Her test için kesin değer + CI + p (kesin sayı, "p<0.05" değil; örn. p=0.003).
- **Kullan:** uygun durumda Welch t, Mann-Whitney U, Wilcoxon, Kruskal-Wallis + Dunn post-hoc + Bonferroni/Holm/BH-FDR; χ² (Yates ya da Fisher exact n<5), McNemar/Cochran Q; logistic + multinomial + ordinal regresyon; Cox PH + log-rank + Schoenfeld; Linear/GLMM/LMM (lme4), GEE; PCA/EFA/CFA; SEM (AMOS/lavaan) + model uyumu (CFI ≥0.95, TLI ≥0.95, RMSEA ≤0.06, SRMR ≤0.08, χ²/df <3); Cronbach α + McDonald ω + composite reliability + AVE; Cohen κ + Krippendorff α + ICC + Bland-Altman; ROC-AUC + DeLong CI + Youden J + DCA; bootstrap (B≥2000) + permütasyon + Bayesian (brms/Stan) BF/posterior.
- **Çıktı yorumu:** SPSS/R/JAMOVI/AMOS/Stata/Python (statsmodels/scipy/sklearn/lifelines/pingouin) çıktılarını kelime kelime ve tablo tablo gerçek yorumla; sadece p<0.05 değil effect size + klinik anlamlılık + sınırlılık.
- **ML/DL:** Gerektiğinde gerçek model kur (sklearn LR/RF/XGBoost/LightGBM, PyTorch/TF MLP/CNN/LSTM/Transformer, Siamese, U-Net), 5-fold/LOOCV stratified CV, hyperparameter tuning (Optuna), SHAP/LIME yorum, kalibrasyon (Brier, Hosmer-Lemeshow, calibration plot), fairness audit. Sentetik veri kabul edilmez — gerçek veri olmadan model raporlanmaz.

**6. Yeniden üretilebilirlik (Reproducibility — zorunlu)**
- Her sayısal sonuç için repo-içi committed betik + sabit seed + veri SHA-256 + sürüm pinleme.
- Hesap yapan her bölümde "Bu sayı şu betikle yeniden üretilir: `scripts/X.cjs`, çıktı `scripts/Y.json`" satırı.

**7. Süreç — bana sormadan yapacaksın**
- Yukarıdakilerin hiçbiri için kullanıcıdan onay/hatırlatma istemeyeceksin. Eksik veri varsa açıkça beyan edip kaynaklı/sayılı versiyon istemden önce sunacaksın.

## Dr. Nurcan Denli Bayır — Tez Çalışması

**Tez Konusu:** "Türk Populasyonunda 3B BT ile Orbital Morfometriden Cinsiyet Tayini: Lineer Ölçümler, Geometrik Morfometri ve Asimetri Analizlerinin Kapsamlı Değerlendirmesi"

- **Yöntem:** 3 Boyutlu Bilgisayarlı Tomografi (3B BT) görüntülerinden orbital (göz çukuru) kemik yapısının morfometrik ölçümleri
- **Amaç:** Orbital morfolojiye dayalı cinsiyet tayini — lineer ölçümler, geometrik morfometri ve sağ-sol asimetri analizleri
- **Populasyon:** Türk populasyonu
- **Kurum:** Ankara Bilkent Şehir Hastanesi, Adli Tıp Kliniği
- **Veri Kaynağı:** Nisan 2026, 917 acil servis hastasının beyin BT'leri — aynı BT görüntüleri hem nöbet raporlaması hem tez için orbital morfometri verisi olarak kullanılacak
- **Beyin BT → Orbital Morfometri:** Beyin BT kesitleri orbital bölgeyi kapsar, 3B rekonstrüksiyon ile orbital ölçümler alınacak
- **PACS Sistemi:** pacs.besk.local/ImageServer — ProHIMS, CT + tarih filtresiyle radyoloji çalışmalarına erişim
- **Teleradyoloji:** teleradyoloji.saglik.gov.tr — rapor görüntüleme

## Bozuk Çeviri/PDF DOCX Temizleme — Kalıcı Kurallar (Dr. Nurcan, her DOCX temizleme talebinde geçerli)

Otomatik çeviri veya PDF→DOCX dönüşümünde bozulmuş bir DOCX verildiğinde, **istisnasız ve hatırlatma gerektirmeden** aşağıdaki tüm düzeltmeler uygulanıp tekrar DOCX olarak verilecek. **Belge sıfırdan kurulmaz — orijinal document.xml korunup yerinde düzeltilir.** (python-docx yok; raw XML/zipfile/regex ile işlenir.)

**🔒 KORUNACAKLAR (silinemez):**
- TÜM görseller ve diyagramlar aynen kalacak.
- Tüm tablolar korunacak (hücre yapısı bozulmaz).
- Başlık stilleri / hiyerarşisi korunacak (sz≥24 başlık puntolarına dokunulmaz).

**🔤 Yazı tipi ve punto:**
- Kod blokları/kümeleri → **Consolas** (monospace). Kod tespiti: güçlü semboller (`#include`, `{`, `}`, `::`, `->`, `);`, `){`) + satır başı anahtar kelimeler (struct/class/public/void/int/double…).
- Geri kalan her şey → **Times New Roman, gövde 10 punto** (sz=20).
- **Harf aralığı her yerde tek tip** — PDF'ten gelen değişken karakter aralığı (`<w:spacing w:val=…>` kerning) tamamen kaldırılır.

**🧹 Bozuk oluşumları temizle:**
- Her bölüm başındaki **dev puntolu (≥60pt / sz≥120) bozuk dekoratif başlıkları sil.** Bozuk metin bir görselle aynı paragraftaysa sadece metni temizle, görseli koru.
- **DİKKAT:** Punto ile gerçek başlıktan ayırt edilemeyen bozuk metin (ör. her ikisi de 36pt/sz=72) içeriği riske atmamak için SİLİNMEZ — açıkça beyan edilir.

**📐 Çakışma ve yerleşim:**
- Görsel/tablo ile metin üst üste binmesi giderilir: yüzen görseller (`wp:anchor`) satıriçine (`wp:inline`) çevrilir.

**📄 Sayfa düzeni ve sıkıştırma:**
- A4, dar kenar (~1,27 cm), 1,15 satır aralığı.
- Tüm sayfa/bölüm sonları kaldırılıp metin kesintisiz akışa çevrilir (tek sectPr kalır), boş paragraflar silinir, paragraf öncesi/sonrası boşluk sıfırlanır.
- Boş sayfa / yarım sayfa kalmaz, tüm sayfalar dolu olur (tam sayfa diyagram/görsel istisna).
- PDF'ten gelen gri gölge (D9D9D9 `<w:shd>`) tüm belgeden kaldırılır (kod işareti değildir).

**✍️ Metin düzeltmeleri (içerik birebir korunarak):**
- `ı/i` bozulması, kelime içi gereksiz boşluk, `ç/ö/ü/ş/ğ` hataları, ağır harf ikameleri (l→i, ç→g, Yunan/CJK), satır-sonu tireleri (paragraf içi + arası), özel ad büyük/küçük harf.

**🚫 Zero-Hallucination:** Hiçbir cümle yeniden yazılmaz, özetlenmez, eklenmez/çıkarılmaz; sayılar aynen korunur. Sadece yazım/boşluk/harf + biçim/yerleşim düzeltmesi yapılır. Çıktıdan sonra XML geçerliliği ve korunan görsel/tablo/diyagram sayıları doğrulanır.

## Dr. Nurcan — Yan Çalışma: TOMEC Algoritması (Adli Obstetri)

**Konu:** Gebe kadına yönelik kasten yaralama (TCK m.87-88) sonrası obstetrik komplikasyonlarda fiil-sonuç illiyet bağının standardize edilmesi için **TOMEC (Travma Obstetrik Mediko-legal Causality)** skoru.

**Model:** 5 alanlı ağırlıklı skor [0-100]:
- T (Travma Niteliği/Şiddeti) %25
- O (Obstetrik Durum/Gestasyonel Dönem) %20
- M (Maternal Komorbid/Fizyolojik) %15
- E (Eylem Özellikleri/Enerji-Mekanizma) %20
- C (Kronolojik/Temporal İlişki) %20

**Eşikler:** 85-100 Kesin · 70-84 Yüksek Olasılıklı · 55-69 Muhtemel · 40-54 Mümkün · 25-39 Düşük · 10-24 Uzak · 0-9 Yok Nedensellik

### Veri Seti / Kaynaklar (`attached_assets/`)

**1. Queensland Clinical Guideline — Trauma in Pregnancy (MN19.31-V2-R24, Ağustos 2019)**
- Tam PDF: `g-trauma_1778241474112.pdf` (39 sayfa)
- Sayfa-sayfa JPG: `g-trauma.zip_01..40_*.jpg` (Appendix A-H + Acknowledgements dahil tam metin)

**2. TOMEC Çalışması Kendi Dosyaları**
- `TOMEC_Metodolojik_Makale_*.md` (452 satır) — Dergi formatı metodolojik makale taslağı
- `TOMEC_SKORLAMASI_*.docx` (1955 satır) — Hasta rehberi + değerlendirme formu (karakter bozukluğu var, temizlik gerekiyor)
- `TOMEC_SKORLAMASI_*.pdf` (826 satır) — DOCX'in PDF hali

**3. Olgu Sunumu**
- `Travma_sonrasi_erken_gebelik_kaybi_olgu_sunumu_*.pdf` — Cenger CD, Göçeoğlu ÜÜ, Özbek BY, Sezgin U, Fincancı ŞK. Med J SDU 2018;25(2):194-199. Künt travma + biber gazı sonrası 6 haftalık gebeliğin kaybı, kemik sintigrafisi ile travma kanıtı, TSSB+majör depresyon eşlik. **TOMEC için TCK m.87 örnek vakası.**

**4. Soysal Külliyatı — İÜ Cerrahpaşa TF 1999 (`attached_assets/gdrive/`)**
- `Soysal_Adli_Otopsi_Cilt_I_1999.pdf` (507 s)
- `Soysal_Adli_Otopsi_Cilt_II_1999.pdf` (454 s)
- `Soysal_Adli_Otopsi_Cilt_III_1999.pdf` (503 s)
- `Soysal_Cakalir_Adli_Tip_Cilt_I_1999.pdf` (598 s)
- `Soysal_Cakalir_Adli_Tip_Cilt_II_1999.pdf` (615 s)
- `Soysal_Cakalir_Adli_Tip_Cilt_III_1999.pdf` (598 s)
- Editörler: Prof. Dr. Zeki Soysal (Adli Tıp + Kadın Doğum), Prof. Dr. Canser Çakalır; Adli Otopsi: Soysal/S. Murat Eke/A. Sadi Çağdır

**5. Taranmış PDF'ler — OCR YOK** (`attached_assets/gdrive/`)
- `Taranmis_PDF_402sayfa_OCR_yok.pdf` — başlık tespit edilemedi
- `Taranmis_PDF_580sayfa_OCR_yok.pdf` — başlık tespit edilemedi
- `Taranmis_PDF_682sayfa_OCR_yok.pdf` — başlık tespit edilemedi
- (Gerekirse OCR yapılabilir — saatler sürer)

**6. Drive'dan gelen ders dosyası (TOMEC ile ilgisiz)**
- `Hacettepe_OOP_Odev_Nurcan.pdf` (13 s) — Hacettepe Yazılım Müh. YL Nesneye Yönelik Yazılım Geliştirme ara sınav cevap belgesi (N25110987, 30 Nisan 2026)

**7. Eski büyük dosyalar (50MB limit aşımı, okuyamadım)**
- `attached_assets/adli_obstetri_1.pdf` (59 MB)
- `attached_assets/adli_obstetri_2.pdf` (69 MB)
- `attached_assets/adli_obstetri_3.pdf` (boş)
- (Drive'dan gelen Soysal külliyatı bunların yerini tutuyor olabilir)

## Aktif Tez Odağı (Dr. Nurcan — kalıcı)

- **TEK TEZ KONUSU:** Orbita (göz çukuru) ölçümlerinden 3B BT ile cinsiyet tayini. Bu birincil tezdir; tüm orbital morfometri araçları buna hizmet eder.
- **LENS KALINLIĞI işi bırakıldı** — artık geliştirilmeyecek, tez kapsamı dışı. Kullanıcı açıkça "lens kalınlığı işini unut" dedi (08 Haziran 2026).

## System Architecture

### Monorepo Structure

The project utilizes a monorepo with `client/` for the React frontend, `server/` for the Express.js backend, and `shared/` for common types, schemas, and route definitions.

### Frontend Architecture

- **Framework**: React with TypeScript and Vite.
- **Routing**: Wouter.
- **State Management**: TanStack React Query for server state.
- **UI Components**: shadcn/ui (New York style) built on Radix UI, styled with Tailwind CSS.
- **Theming**: `next-themes` for dark/light mode.
- **Fonts**: 'Outfit' and 'DM Sans'.
- **Authentication**: `useAuth()` hook for user authentication via `/api/auth/user`.
- **Key Features**: Public landing page, protected routes for Dashboard, Paper management, Collection management, and various forensic analysis tools.

### Backend Architecture

- **Framework**: Express.js with TypeScript.
- **API**: RESTful JSON API under `/api/` prefix, with type-safe contracts defined in `shared/routes.ts`.
- **Authentication**: Replit Auth via OpenID Connect (Passport.js), sessions stored in PostgreSQL.
- **AI Integration**: OpenAI API for paper analysis, literature search, chat, and image generation, accessed via Replit AI Integrations proxy.
- **Development**: Vite dev server middleware served through Express.
- **Specific Features**:
    - **Book Translation**: AI-powered Turkish translation for multiple academic books (e.g., "Causation in Law and Medicine," "Knight's Forensic Pathology"). Features on-demand PDF text extraction, chapter-by-chapter translation with terminology dictionaries, translation caching, and DOC/PDF export.
    - **Signature Analysis (ChiroBench)**:
        - **Data Collection**: Canvas-based drawing interface for collecting signatures with pressure sensing.
        - **Import**: Bulk import from scanned forms.
        - **Analysis**: GPT-4o Vision for forensic graphology comparisons, ML dataset generation.
        - **Statistics**: Q1-level statistical analysis (sensitivity, specificity, ROC curves, etc.).
        - **Deep Learning**: Real-time Siamese CNN using MobileNet v2 via TensorFlow.js for genuine/forged/uncertain decisions. Supports various input modes.
        - **Variation Analysis**: DTW for stroke alignment, intra-writer/inter-writer variation, stability scores.
        - **Training**: Python script (`scripts/train_siamese.py`) for Siamese CNN training with various backbones, loss functions, augmentation, and metrics.
        - **Results**: Displays real Google Colab training results for different architectures.
    - **AI Academic Database Search**: GPT-4o powered search analyzing queries to recommend optimal academic databases, generating MeSH terms, Boolean queries, and relevance scores.

### Database

- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM with `drizzle-zod` for schema validation.
- **Schema**: Defined in `shared/schema.ts`, `shared/models/auth.ts`, and `shared/models/chat.ts`.
- **Tables**: `users`, `sessions`, `papers`, `collections`, `collection_papers`, `notes`, `conversations`, `messages`, `signature_participants`, `signature_samples`, `signature_comparisons`.

### Replit Integrations

Pre-built modules in `server/replit_integrations/` and `client/replit_integrations/` for:
- **Auth**: Replit Auth setup.
- **Chat**: Conversation/message CRUD.
- **Audio**: Voice recording/playback.
- **Image**: Image generation via OpenAI.
- **Batch**: Batch processing utilities.

## External Dependencies

- **PostgreSQL**: Primary data store.
- **Replit Auth (OpenID Connect)**: Authentication provider.
- **OpenAI API**: AI features (analysis, search, chat, image gen) via Replit AI Integrations proxy.
- **shadcn/ui + Radix UI**: UI component library.
- **TanStack React Query**: Async state management.
- **Drizzle ORM + drizzle-zod**: Database ORM and schema validation.
- **Wouter**: Client-side routing.
- **next-themes**: Dark mode support.
- **react-markdown**: AI analysis rendering.
- **connect-pg-simple**: PostgreSQL session store for Express.
- **TensorFlow.js**: Client-side deep learning inference (for signature analysis).
- **pdftotext**: PDF text extraction.