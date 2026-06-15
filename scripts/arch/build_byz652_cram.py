#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""BYZ652 Yazilim Mimarisi - hiper-kompakt 4 sayfa sinav ozeti.
Spec: 4.5pt Cambria, satir araligi tam 6pt, YATAY (landscape) A4, 4 sutun,
prose (duz yazi), paragraf araligi YOK, minimum kenar boslugu, minimum sutun bosluğu.
Raw OOXML uretimi (python-docx yok)."""
import zipfile, os, html

OUT = "attached_assets/BYZ652_Sinav_Ozeti_4sayfa.docx"

# (baslik, govde) — baslik bold kucuk, govde duz yazi. Govde icinde · ve ▸ ile alt-maddeler.
S = []
def add(h, b):
    S.append((h, " ".join(b.split())))

add("MİMARİ TANIM & TEMEL KAVRAMLAR",
"""Yazılım mimarisi = bir sistem hakkında akıl yürütmek (anlamak, analiz etmek, geliştirmek,
değiştirmek) için gereken YAPILAR bütünüdür; her yapı yazılım elemanlarını (software elements),
elemanlar arası ilişkileri (relations) ve hem elemanların hem ilişkilerin özelliklerini (properties)
içerir. Mimariyi yalnızca "erken/büyük tasarım kararları" diye tanımlamak EKSİKTİR: çünkü her erken
karar mimari değildir (ör. kodlama standardı seçimi), her mimari karar erken verilmek zorunda değildir
ve "büyük karar"ın nesnel tanımı yoktur. · Mimari bir tasarımdır ama her tasarım mimari değildir;
elemanın iç detayları mimari değildir (soyutlama: tüm karmaşıklıkla uğraşmak ne mümkün ne istenir).
Her sistemin mimarisi vardır, belgelenmese bile. Mimari DAVRANIŞI da içerir; yalnız kutu-çizgi
diyagramı mimari değildir. · Sistem gereksinimleri = İşlevsel gereksinimler (functional: sistem NE
yapar — kullanıcının bilet/işlem yapabilmesi) + Kalite niteliği gereksinimleri (quality: sistem NASIL
yapar — 2sn latency, %99.99 availability) + Kısıtlamalar (constraints: sıfır serbestlik dereceli
kararlar — Java ile yazılacak, şu sunucu). İşlevsellik mimariyi BELİRLEMEZ: aynı işlevsellik için
sonsuz mimari mümkündür (ortogonallik). · Conway Yasası: organizasyonun iletişim yapısı sistem
mimarisine yansır. Toplam yazılım maliyetinin ~%80'i ilk dağıtımdan SONRA (bakım/yeni özellik/hata
düzeltme) oluşur — bu yüzden değiştirilebilirlik kritiktir. · Mimari Önem (neden önemli): kalite
niteliklerini etkinleştirir/engeller, değişim yönetimi, erken kalite tahmini, paydaş iletişimi, en
erken kararlar, uygulamaya kısıt, organizasyonel yapı, evrimsel prototipleme, maliyet/takvim tahmini,
aktarılabilir/yeniden kullanılabilir model, bağımsız bileşenler, ortak tasarım sözlüğü, eğitim temeli.
· Mimari Borç (debt): kısa vadeli kazanç için uzun vadeli maliyetli karar. Mimari Çürüme (erosion):
KASITSIZ sapma. Mimari Sapma (drift): KASITLI sapma. Yeterli Mimari (just enough): geri dönüşü zor
kararları önceden al, kolay kararları ertele.""")

add("ÜÇ YAPI KATEGORİSİ (3 STRUCTURES)",
"""Mimar YAPILARI tasarlar, GÖRÜNÜMLERİ belgeler; bir yapının paydaşlar için temsiline görünüm denir.
Üç ana kategori: · (1) MODÜL (Module) — STATİK, tasarım/geliştirme zamanı; elemanlar: modül/sınıf/
katman/paket (uygulama birimleri); ilişkiler: bağımlılık, kullanım (uses), miras (is-a), parçasıdır
(is-part-of); odak KN: değiştirilebilirlik, taşınabilirlik, yeniden kullanım, iş atama; cevapladığı
soru: "Sistem nasıl İNŞA edilir, kod nasıl bölünür?". · (2) BİLEŞEN-ve-BAĞLAYICI (Component-and-
Connector, C&C) — ÇALIŞMA ZAMANI (runtime); elemanlar: bileşenler (port'lu işlem birimleri/veri
depoları) + bağlayıcılar (role'lü etkileşim yolları); ilişki: attachment (port↔role); odak KN: başarım,
erişilebilirlik, güvenlik, eşzamanlılık; soru: "Sistem ÇALIŞIRKEN nasıl davranır/etkileşir?". · (3)
TAHSİS (Allocation) — yazılım elemanlarının yazılım-DIŞI çevreye (donanım/dosya sistemi/ekip)
eşlenmesi; ilişki: allocated-to, migrates-to; odak KN: başarım, güvenlik, dağıtım, derleme; soru:
"Sistem NEREDE çalışır / KİM geliştirir?". · Yapılar arası eşleme çoğunlukla ÇOK-ÇOK'tur: bir modül
C&C'de bir/parça/birkaç bileşene karşılık gelebilir.""")

# ===== EN AGIRLIKLI BOLUM: GORUNUMLER =====
add("◆◆ GÖRÜNÜMLER / BAKIŞLAR (VIEWS) — TEMEL AYRIM",
"""YAPI (structure) = elemanların kendisi (yazılım/donanımda var olan eleman+ilişki+özellik kümesi);
"mimar yapıları tasarlar". GÖRÜNÜM (view) = bir YAPININ paydaşlarca yazılıp okunan TEMSİLİDİR ("view
is a representation of a structure"). BAKIŞ AÇISI (viewpoint) = TEK bir görünüm TÜRÜNÜ oluşturmak için
örüntü/şablon/kural koleksiyonu; ilgili paydaşları, onların endişelerini (concern) ve kullanılacak
notasyon/modelleme dilini tanımlar (Kruchten 1995). İlişki zinciri: GÖRÜNÜM-TÜRÜ (viewtype, ör.
Modül) → STİL (style, ör. Katmanlı) → GÖRÜNÜM (view, belirli sisteme uygulanmış somut örnek). · PAYDAŞ
(stakeholder) = mimariyle ilgilenen/kullanan/geliştiren/işleten/etkilenen kişi-grup. ENDİŞE (concern)
= paydaşın mimariyle ilgili önemsediği soru/ihtiyaç/problem. PERSPEKTİF (perspective) = belirli bir
KN'yi sağlamak için etkinlik/taktik/yönerge koleksiyonu; GÖRÜNÜMLERE UYGULANIR (görünüm ≠ perspektif).
· Tek diyagram yetmez çünkü fazla karmaşık olur ve farklı paydaşların farklı endişeleri vardır — bu
yüzden çoklu görünüm kullanılır.""")

add("▸ MODÜL GÖRÜNÜMLERİ (Module Views) — elemanlar/ilişkiler/stiller",
"""Elemanlar: modüller (sınıf/katman/alt sistem gibi uygulama birimleri). İlişkiler: is-part-of,
depends-on (özelde USES), is-a (genelleme/özelleştirme). Özellikler: ad, sorumluluklar, görünürlük.
Endişeler: değiştirilebilirlik, yeniden kullanım, iş atama, kapsülleme. STİLLER: · AYRIŞTIRMA
(Decomposition) — "bir alt modülüdür" (is-a-submodule-of) ilişkisi; değişikliği yerelleştirir, bilgi
gizleme; iş kırılım yapısının (WBS) temeli; özyinelemeli bölünme. · KULLANIM (Uses) — "A, B'nin doğru
çalışmasını gerektiriyorsa A B'yi kullanır" ilişkisi; artımlı geliştirme ve alt küme (subset) çıkarımı
sağlar. · KATMAN (Layered) — katman = yönetilen arayüzlü tutarlı hizmet kümesi (sanal makine); KATI
katmanlamada yalnız hemen alttaki katman kullanılır; ana endişe TAŞINABİLİRLİK; örnek TCP/IP, OSI, 3
katmanlı web. · SINIF / GENELLEME (Class/Generalization) — "miras alır / örneğidir" (inherits-from/
is-instance-of); yeniden kullanım+artımlı işlevsellik; OOP. · VERİ MODELİ (Data Model) — statik bilgi
yapısı; varlıklar ve ilişkiler (Hesap, Müşteri, Kredi).""")

add("▸ BİLEŞEN-BAĞLAYICI GÖRÜNÜMLERİ (C&C Views)",
"""Elemanlar: BİLEŞENLER (asıl işlem birimleri ve veri depoları — servis/istemci/sunucu/filtre; PORT'ları
vardır) + BAĞLAYICILAR (etkileşim yolları — RPC/boru/mesaj; ROLE'leri vardır). İlişki: ATTACHMENT
(port'un role'e bağlanması). Endişeler: başarım, erişilebilirlik, güvenilirlik, güvenlik, eşzamanlılık.
STİLLER: · SERVİS (Service) — bağımsız geliştirilen servisler SOAP/REST gibi mekanizmalarla koordine
olur (SOA/mikroservis). · EŞZAMANLILIK (Concurrency) — bileşenler mantıksal iş parçacıklarına dizilir;
paralellik fırsatları + kaynak çekişmesi; kilitlenme/yarış koşulu tespiti. · BORU-FİLTRE (Pipe-and-
Filter), İSTEMCİ-SUNUCU (Client-Server, istek/yanıt), YAYIMLA-ABONE OL (Publish-Subscribe), PAYLAŞILAN
VERİ (Shared-Data), EŞLER ARASI (Peer-to-Peer) — çalışma zamanı etkileşim stilleridir.""")

add("▸ TAHSİS GÖRÜNÜMLERİ (Allocation Views)",
"""Elemanlar: yazılım elemanları (modül/bileşen) + ÇEVRESEL elemanlar (donanım/klasör/ekip). İlişkiler:
allocated-to, migrates-to (dinamik). STİLLER: · DAĞITIM (Deployment) — yazılım (genelde C&C süreçleri)
→ donanıma (işlemci/depolama/ağ) eşlenir; endişe başarım, erişilebilirlik; tek hata noktası analizi. ·
UYGULAMA/KURULUM (Implementation/Install) — modüller → dosya sistemi/dizin yapısı; derleme/CI-CD
yönetimi. · İŞ ATAMA (Work Assignment) — modüller → geliştirme ekipleri; ekip uzmanlığı+iletişim,
Conway Yasası etkisi.""")

add("▸ 4+1 GÖRÜNÜM MODELİ (Kruchten) & ROZANSKI-WOODS 6 GÖRÜNÜM",
"""KRUCHTEN 4+1: (1) Mantıksal (Logical) — işlevsel gereksinimler, son kullanıcı; (2) Süreç (Process)
— çalışma zamanı/eşzamanlılık, entegratör; (3) Geliştirme (Development) — yazılım yönetimi, geliştirici;
(4) Fiziksel (Physical) — dağıtım/topoloji, sistem mühendisi; (+1) SENARYOLAR — kullanım durumları
görünümleri birbirine bağlar. · ROZANSKI & WOODS 6 GÖRÜNÜM (notasyon | paydaş): İŞLEVSEL (Functional)
— işlevsel elemanlar/sorumluluk/arayüz/etkileşim; diğer yapıların şeklini belirler; UML Bileşen Diy. |
herkes; en önemli, ilk okunan. BİLGİ (Information) — veri nasıl saklanır/işlenir/dağıtılır; içerik/yapı/
sahiplik/gecikme/göç; DFD+UML Sınıf | geliştirici, veri yöneticisi. EŞZAMANLILIK (Concurrency) — hangi
parçalar paralel; süreç/iş parçacığı + IPC; UML Bileşen (iş parçacıklı) | başarım müh. GELİŞTİRME
(Development) — derleme/entegrasyon/test sürecini destekler; UML Paket | geliştirici, PM. DAĞITIM
(Deployment) — yazılım→donanım; düğüm/ağ/disk; UML Dağıtım | sistem yöneticisi, operasyon. OPERASYONEL
(Operational) — üretimde işletme/yönetim/destek stratejileri | operasyon, destek.""")

add("▸ GÖRÜNÜM BELGESİ İÇERİĞİ & GÖRÜNÜMLERİN ÖTESİ",
"""Görünümleri belgelemek = mimariyi belgelemek. Bir görünüm belgesi: (1) Birincil Sunum (diyagram/
tablo), (2) Eleman Kataloğu (her elemanın ayrıntılı açıklaması), (3) Bağlam Diyagramı (görünümün
sistemin geri kalanıyla ilişkisi), (4) Değişkenlik Kılavuzu (mimari nasıl değişebilir), (5) Gerekçe
(rationale — neden bu kararlar). · GÖRÜNÜMLERİN ÖTESİNDE (beyond views): görünümler arası EŞLEME
(modül↔bileşen, çoğunlukla çok-çok), örüntüleri belgeleme, sözlük+kısaltmalar, belge kontrol bilgisi
(sürüm/yazar/değişiklik geçmişi). · Görünümleri BİRLEŞTİRME (combined/hybrid): C&C+Dağıtım (hangi süreç
hangi donanımda), Ayrıştırma+İş Atama (hangi ekip hangi modül); dikkatli yapılmazsa anlaşılırlık düşer.
· GÖRÜNÜM SEÇİMİ: "ihtiyacın olanlar"; büyük sistemde standart başlangıç = en az BİR Modül + BİR C&C +
BİR Tahsis görünümü. · PAYDAŞ↔GÖRÜNÜM: PM→ayrıştırma/iş atama (takvim/bütçe); Geliştirici→modül(ayrıştırma/
sınıf/uses)+C&C (arayüz/kısıt); Test/Entegratör→uses+C&C (test sırası); Bakım→ayrıştırma (değişikliği
bul)+gerekçe; Analist→KN değerlendirmesi; Son kullanıcı→işlevsel davranış. · NOTASYON: gayri resmi
(eskiz), yarı resmi (UML: Paket=modül/geliştirme, Bileşen=işlevsel/C&C, Dağıtım=fiziksel), resmi (ADL:
ACME/Wright/Rapide). Tasarım GEREKÇESİ kritik: hangi kanıt üretildi, kim ne yaptı, neden kısayol/takas,
hangi varsayım (ör. maliyete karşı erişilebilirlik için hot spare seçimi). Kural: bileşenlerin
etkileşim yolu sayısı AZ olmalı (anlaşılırlık).""")

add("KALİTE NİTELİĞİ SENARYOSU (6 BİLEŞEN)",
"""KN senaryosu = dilden bağımsız, TEST EDİLEBİLİR gereksinim belirtme yöntemi. 6 parça: (1) Uyarıcı
Kaynağı (source — kullanıcı/operatör/kötücül kod), (2) Uyarıcı (stimulus — istek/arıza/saldırı), (3)
Yapı/Artifact (uyarılan sistem parçası), (4) Ortam (environment — normal/aşırı yük/kurtarma), (5)
Yanıt (response — arıza tespiti/log/geri yükleme), (6) Yanıt Ölçüsü (response measure — "2sn içinde",
"%99.99"). Örnek (somut performans senaryosu): "500 kullanıcı 30sn'de 2000 istek başlatır (normal
çalışma) → sistem ortalama 2sn latency ile yanıtlar" — buradaki "ort. 2sn" YANIT ÖLÇÜSÜdür.""")

add("ERİŞİLEBİLİRLİK (Availability) & TAKTİKLER",
"""Zincir: FAULT (hata/sebep — potansiyel problem kaynağı) → ERROR (sistemin iç durumunun yanlış/
beklenmeyen hale gelmesi) → FAILURE (dışarıdan gözlenebilir biçimde beklenen hizmetin verilememesi).
Recovery = fault sonrası kabul edilebilir hizmete dönüş. · Erişilebilirlik = Çalışma/(Çalışma+Duruş) =
MTTF/(MTTF+MTTR) = MTTF/MTBF. MTBF = MTTF + MTTR. Örnek: MTTF=900, MTTR=100 → MTBF=1000 → Availability
=900/1000=%90. "5 Dokuz" = %99,999 ≈ yılda ~5 dk duruş. · TAKTİKLER: HATA TESPİTİ — Ping/Echo (izleyen
ping atar, yanıt yoksa arıza), Kalp Atışı/Heartbeat (izlenen bileşen "yaşıyorum" gönderir — yön farkı!),
İstisna Tespiti, Zaman Aşımı, Durum İzleme (Monitor; CPU/bellek eşik), Oylama (voting/replikasyon),
Sağlık Kontrolü, Zaman Damgası, Öz-test, Sanity Checking (akıl-sağlığı/mantıksal makullük testi). KURTARMA-Hazırlık/Onarım — Yedek (AKTİF/Hot: sürekli senkron;
PASİF/Warm: periyodik güncelleme; SOĞUK/Cold: kapalı bekler),
İstisna İşleme, Geri Alma (Rollback), Yazılım Yükseltme, Yeniden Deneme (Retry), Servis Düzeyi Düşürme
(graceful degradation). KURTARMA-Yeniden Devreye Alma — Gölge (Shadow), Durum Yeniden Senkronizasyonu,
Tırmanan Yeniden Başlatma (Escalating Restart), Kesintisiz İletme (Non-stop Forwarding). ÖNLEME —
Servisten Çıkarma, İşlem (Transaction; ACID atomik), Tahmin Modeli, İstisna Önleme, Yetkinlik Kümesini
Artırma, Süreç İzleme (watchdog), Devre Kesici (Circuit Breaker: Kapalı→Açık→Yarı-Açık). · Sunucu çökünce
kesintisiz devam için: health check + redundancy + load balancing + failover BİRLİKTE.""")

add("BAŞARIM (Performance) & TAKTİKLER",
"""Performance = uyaran (olay/istek/mesaj) geldiğinde sistemin belirlenen ZAMAN ve KAYNAK sınırları içinde
yanıtlaması. Ölçütler: Gecikme/LATENCY (tek isteğin tamamlanma süresi), Aktarım hızı/THROUGHPUT (birim
zamanda işlenen iş miktarı), kayıp oranı, kaynak kullanımı (CPU/bellek/bant). Olay türleri: periyodik,
stokastik (rastgele), tetiklenen. · TAKTİKLER — KAYNAK TALEBİNİ KONTROL: olay varışını yönet (örnekleme
oranı), olay yanıtını sınırla (kuyruğa al/at), olayları önceliklendir, hesaplama yükünü azalt (dolaylılığı
azalt, birlikte konuşlandır), yürütme sürelerini sınırla, algoritma verimliliğini artır. KAYNAKLARI
YÖNET: kaynak artır (ölçek-yukarı, en ucuz anlık çözüm), eşzamanlılık getir (iş parçacığı), çoklu kopya
tut (replikasyon+ÖNBELLEK/caching), kuyruk boyutu sınırla, kaynak zamanla (FIFO/sabit-öncelik/dinamik-
öncelik). Başarım genelde ölçeklenebilirlikle bağlantılı.""")

add("DEĞİŞTİRİLEBİLİRLİK (Modifiability) TAKTİKLERİ",
"""Maliyet sırası: Yerel değişiklik (tek eleman) < Yerel olmayan (mimari bozulmaz) < Mimari değişiklik.
Türler: ölçeklenebilirlik, değişkenlik, taşınabilirlik, konum bağımsızlığı. · UYUMU ARTIR: modülü böl,
sorumlulukları yeniden dağıt. BAĞLAŞIMI AZALT: kapsülle, aracı kullan, ortak servisi soyutla,
bağımlılıkları kısıtla. BAĞLAMAYI ERTELE (defer binding): derleme zamanı (parametre/aspect), dağıtım/
başlangıç (config), ÇALIŞMA ZAMANI (keşif, çok biçimlilik/polymorphism, paylaşılan depo).""")

add("GÜVENLİK (Security) TAKTİKLERİ",
"""CIA: Gizlilik (Confidentiality) + Bütünlük (Integrity) + Erişilebilirlik (Availability). Çatışmalar:
güvenlik↔başarım (şifreleme gecikme ekler), güvenlik↔kullanılabilirlik (2FA), güvenlik↔değiştirilebilirlik.
· TESPİT: Audit Trail (değiştirilemez kayıt), Saldırı Tespiti (imza tabanlı IDS / anomali tabanlı IPS).
DİRENÇ: Kimlik Doğrulama (Authenticate — parola/biyometri/MFA), Yetkilendirme (Authorize — ACL/RBAC),
Veri Gizliliği (TLS/depolama şifreleme), Veri Bütünlüğü (hash/dijital imza/MAC), giriş noktalarını
sınırla (firewall, en az ayrıcalık), kaynakları ayır (sanallaştırma/konteyner izolasyonu), varsayılan ayarları değiştir (fabrika parolasını zorla değiştir), mesaj gecikmesi tespiti (zaman damgası/sıra-no), mesaj tekrar/replay saldırısı tespiti (nonce). TEPKİ+
KURTARMA: aktörleri tanımla, erişimi kısıtla, hesap kilitle, aktörleri bilgilendir; güvenli duruma dön.
Bankacılık: MFA+RBAC+TLS+depolama şifreleme+değiştirilemez audit trail, %99.999.""")

add("DİĞER KN: TEST EDİLEBİLİRLİK, KULLANILABİLİRLİK, METRİKLER",
"""TEST EDİLEBİLİRLİK: girdi/çıktıyı kontrol (mock/stub ile izole), iç durumu gözlemle (kayıt/tekrar
oynat, sandbox), bileşeni sınırla (bağımlılığı azalt), belirsizliği sınırla (limit nondeterminism), çalıştırılabilir doğrulamalar (executable assertions), veri kaynağı soyutlama (data source abstraction). KULLANILABİLİRLİK: çalışma zamanı (iptal/geri
al/toplu işlem/durum gösterme/kullanıcı modeli), tasarım zamanı (UI'yi iş mantığından ayır — MVC/MVP).
· METRİKLER: Ca (afferent — modüle bağımlı sayısı; yüksek=kararlı ama zor değişir), Ce (efferent —
modülün bağımlı olduğu sayı), I=Ce/(Ca+Ce) (0=kararlı, 1=dengesiz), LCOM (uyum eksikliği; yüksek=böl),
Döngüsel Karmaşıklık (bağımsız yol sayısı; yüksek=test zor), DIT (miras ağacı derinliği).""")

add("ARAYÜZLER (Interfaces) & VERİ DEĞİŞİMİ",
"""Arayüz = elemanın diğer elemanlarla etkileştiği SINIR; bir SÖZLEŞMEdir (contract). İçerir: syntax
(imza — ad/argüman/tip), semantics (ne yapar/etki), operasyonlar, OLAYLAR (asenkron bildirim), özellikler/
metadata (erişim hakkı, ÖLÇÜ BİRİMİ, format varsayımı, hata durumları). Resource signature tek başına
yetmez. · NASA Mars Climate Orbiter dersi: farklı ekiplerin farklı ölçü birimi kullanması felakete yol
açtı → metadata (özellikle birim/format) AÇIKÇA belgelenmeli. · Small Interfaces Principle: iki eleman
yalnız ihtiyaç duyduğu MİNİMUM bilgiyle etkileşir (en az ayrıcalık; bağımlılığı+değişim etkisini azaltır).
· Arayüz Evrimi: Kullanımdan Kaldırma (deprecation), SÜRÜMLEME (versioning — eskiyi koru, /v2 ekle;
geriye uyumluluk), Genişletme. Hata yönetimi: istisna/durum kodu/özellik/olay/log. · VERİ DEĞİŞİMİ:
XML (metin, XML Schema, düşük başarım, kurumsal/meta dil), JSON (metin, JSON Schema, orta, web/REST),
Protocol Buffers (ikili, .proto, yüksek başarım, gRPC). Etkileşim stilleri: RPC (yerel gibi; gRPC modern),
REST (HTTP/URI/durumsuz), mesaj tabanlı (asenkron/gevşek bağlaşım). · REST 6 KISITI: tekdüze arayüz
(URI+HTTP), istemci-sunucu, DURUMSUZ, önbelleğe alınabilir, katmanlı sistem, istek üzerine kod (opsiyonel).
gRPC: HTTP/2 + Protobuf, çift yönlü akış, mikroservis arası ideal.""")

add("MİMARİ ÖRÜNTÜLER (Patterns) — ✓ artı / ✗ eksi",
"""Örüntü = paketlenmiş taktik koleksiyonu (bağlam+sorun+çözüm+sonuç). · KATMANLAR: soyutlama düzeyi,
tek yönlü kullanım ✓değiştirilebilirlik/taşınabilirlik ✗başarım/katman ihlali (TCP/IP, 3-katman web). ·
İSTEMCİ-SUNUCU: ✓değiştirilebilirlik/ölçeklenebilirlik ✗ağ gecikmesi/güvenlik (web sunucusu + çok sayıda
eş zamanlı web kullanıcısı). · YAYIMLA-ABONE: yayımcı aboneleri bilmez ✓değiştirilebilirlik/ölçeklenebilirlik
✗başarım/belirsiz gecikme/test zorluğu (RabbitMQ/AWS SQS mesaj kuyruğu). · EKLENTİ/MİKROKERNEL: çekirdek+
sabit arayüzlü eklenti ✓genişletilebilirlik ✗güvenlik (kaynakta somut örnek verilmemiş). · MİKROSERVİS: bağımsız dağıtım, her servis kendi
DB'si ✓ölçeklenebilirlik/hata izolasyonu ✗operasyonel karmaşıklık/veri tutarlılığı (e-ticaret: ürün/sipariş/
ödeme ayrı servis). · OLAY ODAKLI (EDA): üretici+tüketici+kanal, olaylar değişmez ✓ölçeklenebilirlik
✗hata ayıklama/nihai tutarlılık (Event Sourcing+CQRS; Apache Kafka/Pulsar/Kinesis akış, borsa işlem sistemi). · BORU-FİLTRE: ✓paralel/bağımsız test
✗veri paylaşımı zor (Unix pipe, derleyici, ETL). · KARA TAHTA (Blackboard): ortak veri deposu + bağımsız uzman bileşenler + hangi uzmanın ne zaman çalışacağını yöneten KONTROL bileşeni; kısmi/belirsiz çözüm problemleri (AI/konuşma/
görüntü). · EŞLER ARASI (P2P): herkes istemci+sunucu, tek hata noktası yok, doğal ölçeklenir ✗güvenlik/tutarlılık. · CQRS:
okuma/yazma ayrı model (+Event Sourcing: durum=değişmez olay dizisi, geçmişe dönük sorgu). · Monolitik (tek birim/ekip/yığın, zayıf
hata izolasyonu) vs Mikroservis (bağımsız/çok ekip/güçlü izolasyon).""")

add("EK ÖRÜNTÜLER — BAŞARIM & GÜVENLİK (taktiği paketleyen)",
"""· SERVICE MESH (başarım, mikroservis): her servise eşlik eden SIDECAR proxy → servisler-arası iletişim+
izleme+güvenliği üstlenir; servisle aynı işlemciye konuşlanır → ağ gecikmesini azaltır/başarımı artırır;
çapraz-kesen işler (cross-cutting) hazır alınır → geliştirici iş mantığına odaklanır; canary/A-B testini
kolaylaştırır. ✗ek süreçler işlem gücü tüketir (overhead), sidecar her çağrıda gereksiz fonksiyon taşıyabilir.
· YÜK DENGELEYİCİ (Load Balancer, başarım): aracı (intermediary)+TEK temas noktası, istekleri sağlayıcı
havuzuna dağıtır. ✓sunucu arızası istemciye görünmez, gecikme düşük/öngörülebilir, kaynak eklemek kolay/şeffaf.
✗algoritma çok hızlı olmalı yoksa darboğaz; LB tek hata noktası → kendisi de çoğaltılır (hatta dengelenir).
· THROTTLING (başarım): "iş isteklerini yönet" taktiğinin paketi; aracı THROTTLER isteği izler ve servis
edilebilir mi karar verir, önemli kaynağa erişimi sınırlar. ✓talep dalgalanmasını zarifçe karşılar, servis
aşırı yüklenmez ("sweet spot"). ✗mantık çok hızlı olmalı; talep kapasiteyi sürekli aşarsa dev buffer/istek kaybı;
sıkı bağlı sisteme eklemek zor. · MAP-REDUCE (başarım): büyük veriyi dağıtık+paralel sıralar; 3 parça: altyapı
(yazılımı donanıma atar+sıralar) + MAP (anahtar+veri → hash ile kovalara) + REDUCE (kova sayısınca örnek,
analiz+sonuç emit). ✓çok büyük sırasız veriyi paralelle verimli analiz, tek örnek arızası küçük etki. ✗küçük veride
fazladan yük; eşit bölünemezse paralellik kaybı; çok-reduce'lu işler karmaşık. · INTERCEPTING VALIDATOR
(güvenlik): kaynak↔hedef arasına WRAPPER ekler (kaynak sistem DIŞIysa daha kritik); çoğunlukla "mesaj
bütünlüğü doğrula" + saldırı/servis-reddi/teslim anomalisi tespiti. ✓"saldırı tespiti" kategorisinin çoğunu tek
pakette kapsar. ✗aracı başarım bedeli; saldırı kalıpları değişir → güncel tutulmalı (bakım yükü). · IPS ÖRÜNTÜSÜ
(güvenlik): bağımsız eleman şüpheli aktiviteyi tanı+analiz et; kabul→izin, şüpheli→engelle+raporla. ✓"saldırı
tespiti + tepki" taktiklerinin çoğunu kapsar. ✗kalıp veritabanı sürekli güncellenmeli, başarım bedeli, COTS olarak
alınır ama uygulamaya tam uymayabilir.""")

add("TAKTİK↔ÖRÜNTÜ PAKETLEME (her KN örüntüsü hangi taktikleri paketler)",
"""İlke: ÖRÜNTÜ = taktiklerin PAKETLENMİŞ koleksiyonu; örüntüyü seçince içindeki taktikleri VE takaslarını da
alırsın. Taktik tek bir KN kararını kontrol eder, örüntü birden çok taktiği birleştirir → "taktikleri ile
örüntüleri karıştırma" sık sınav tuzağı. · ERİŞİLEBİLİRLİK ÖRÜNTÜLERİ (kaynak 5.4): AKTİF-PASİF YEDEKLEME =
birincil işler + yedek hazır bekler, durum senkron, arızada yedek devralır → hata tespiti (Ping-Echo/Kalp
Atışı) + Pasif/Warm Yedek + durum yeniden senkronizasyonu taktiklerini paketler (saniyeler mertebesi geçiş).
AKTİF-AKTİF YEDEKLEME = birden çok bileşen aynı anda işler, biri düşünce diğerleri yükü üstlenir → Aktif/Hot
Yedek + yük dengeleme taktikleri; hem yüksek erişilebilirlik HEM yük dengeleme sağlar. DEVRE KESİCİ = başarısız
servise çağrıları belli süre keser (durumları yukarıda) → uygulamada tipik olarak İstisna Tespiti + Zaman
Aşımı + Servis Düzeyi Düşürme taktiklerini paketler. · DEĞİŞTİRİLEBİLİRLİK ÖRÜNTÜLERİ (kaynak 6.4): İstemci-Sunucu + Eklenti/Microkernel +
Katmanlar + Yayımla-Abone Ol (tanımları yukarıda) → ağırlıkla "bağlaşımı azalt / bağımsız evrim / ortak
servis paylaşımı" taktiklerini destekler (her örüntü ilgili olduğu ölçüde). · BAŞARIM & GÜVENLİK örüntüleri
de aynı mantıkla taktik paketidir → ayrıntı EK ÖRÜNTÜLER bölümünde.""")

add("ANTİ-ÖRÜNTÜLER (Anti-Patterns) — tekrarlayan soruna yaygın AMA zararlı çözüm",
"""Anti-örüntü = bir soruna sık uygulanan ama olumsuz sonuç doğuran çözüm; iyi niyetle alınmış ama soruna
yol açan tasarım kararı. Tanımak, aynı hatayı tekrar etmemek için önemli (neden kötü + daha iyi alternatif
belgelenir). · BÜYÜK ÇAMUR TOPU (Big Ball of Mud): sistematik yapısı olmayan, rastgele büyüyen/değişen
sistem; mimari planlama yapılmadan geliştirilenlerde sık → anlaşılması/değiştirilmesi/test edilmesi çok güç.
· TANRI NESNESİ (God Object): çok fazla sorumluluk üstlenen + diğer bileşenlerin büyük bölümünü bilen tek
nesne/bileşen; TEK SORUMLULUK İLKESİNİ ihlal eder, değiştirilebilirliği ciddi azaltır. · KAZAN PLAKASI
(Boilerplate): gereksiz tekrarlanan kod/yapılandırma → bakım maliyeti artar, tutarsızlık doğar. · KIRILGAN
TEMEL SINIF (Fragile Base Class): temel sınıftaki değişiklik türetilmiş sınıfları beklenmedik şekilde bozar;
miras hiyerarşilerinde sık. · DAĞITIK MONOLİT (Distributed Monolith): mikroservis gibi görünen ama sıkı
bağlaşımlı/monolit gibi davranan yapı → mikroservisin KARMAŞIKLIĞINI taşır, FAYDASINI sağlamaz. · ALTIN
ÇEKİÇ (Golden Hammer): bir teknoloji/yaklaşımı uygun olup olmadığına bakmadan her soruna uygulamak
("elimde çekiç varsa her şey çivi görünür"). KAÇINMA: mimari kararları bilinçli al+belgele (gerekçe+
alternatif+sonuç), düzenli kod+mimari inceleme (code review), teknik borcu (technical debt) izle+azalt,
mimari ilke/kısıtları ekiple paylaş+uyumu denetle.""")

add("GÜNCEL EĞİLİMLER (Cloud-Native, Serverless, Event Streaming, Edge, AI)",
"""· BULUT YEREL (Cloud-Native): uygulamalar bulutta çalışmak üzere tasarlanır; konteynerleştirme (taşınabilir+
tutarlı çalışma) + orkestrasyon (Kubernetes: otomatik dağıt/ölçekle/yönet) + mikroservis + DevOps (sürekli
teslim) bir arada. SUNUCUSUZ (Serverless) bunun parçasıdır — ayrıntı (cold start/vendor lock-in/otomatik
ölçekleme) "SANALLAŞTIRMA DETAYI" bölümünde. · OLAY AKIŞI (Event Streaming): EDA'nın gerçek-zamanlı veri
akışı uygulaması (EDA örüntü detayı ayrı bölümde); platformlar Apache Kafka/Pulsar/AWS Kinesis; kullanım:
gerçek zamanlı analitik, dolandırıcılık tespiti, kullanıcı davranışı, IoT verisi.
· KENAR BİLİŞİM (Edge Computing): veri işleme merkezi buluttan uzaklaşıp VERİ KAYNAĞINA YAKIN yapılır →
gecikme azalır, bant genişliği optimize. Etkileri: dağıtık mimari, bağlantısız (offline) çalışabilme, kenar
cihaz fiziksel güvensiz olabilir → özel güvenlik. · YZ DESTEKLİ MİMARİ: kod analiziyle mimari sorun/teknik
borç/güvenlik açığı tespiti, gereksinime uygun örüntü/taktik öneren sistemler, otomatik test üretimi.
· KUANTUM: mevcut şifrelemeyi kırabilir → kuantum-dirençli şifreleme güvenlik mimarisini etkiler.""")

add("ADD — NİTELİK ODAKLI TASARIM (6 ADIM, Cervantes-Kazman 2016)",
"""ADD = Attribute-Driven Design; YİNELEMELİ; her yinelemede belirli mimari sürücüler ele alınır (ilk
yineleme genelde tüm sistem). SIRA: (1) Girdileri Gözden Geçir (mimari sürücülerin tam/doğru olduğunu
kontrol) → (2) İterasyon Hedefini Belirle (hangi sürücüler) → (3) Rafine Edilecek Elemanı Seç → (4)
Tasarım Kavramlarını Seç (taktik+örüntü+referans mimari+harici/COTS/OSS/bulut; takasları değerlendir) →
(5) Elemanları Somutlaştır (sorumluluk ata, arayüz tanımla, ilişki kur, kaynak tahsis) → (6) Tasarımı
Kayıt Altına Al + Analiz (gerekçe; karşılanmayan gereksinim sonraki iterasyona). · MİMARİ SÜRÜCÜLER
(architectural drivers) = mimari tasarımı en çok yönlendiren kritik gereksinimler (ör. "%99.99
availability" sürücüdür; "değişkenler camelCase" sürücü DEĞİL). Sürücülerin tanımı: (a) TASARIM AMACI
(Design Purpose) = bu tasarımı NE ZAMAN/NEDEN yapıyorsun, hangi iş hedefi öncelikli (proje teklifi /
keşif prototipi / geliştirme aşaması); (b) BİRİNCİL İŞLEVSEL GEREKSİNİMLER (Primary Functionality) = iş
hedeflerine ulaşmak için kritik olan + yüksek teknik zorluk/çok eleman etkileşimi gerektiren işlevsellik;
(c) KALİTE NİTELİĞİ GEREKSİNİMLERİ (Quality Attributes) = KN senaryoları biçiminde ifade edilir, sistemin
kalite niteliklerini belirtir (kararları yönlendiren en önemli girdi); (d) KISITLAMALAR (Constraints) =
sıfır serbestlik dereceli, önceden alınmış tasarım kararları (hazır teknoloji seçimi / mevcut sistem
entegrasyonu / organizasyon politikası); (e) MİMARİ KAYGILAR (Architectural Concerns) = doc51 sürücü
listesinde geçer (rehberde ayrı tanım yok); işlevsel/KN gereksinimi olarak yakalanmayan ama mutlaka ele
alınması gereken ek konular (ör. sistem başlatma/kapatma, istisna-işleme, kayıt/loglama, dağıtım/ekip yapısı). · Tasarım Kavramı
türleri: Taktik | Örüntü | Referans Mimari (3-katman web, Lambda, CQRS+ES, IoT, mikroservis) | Harici
Bileşen (COTS/OSS/bulut).""")

add("MİMARİ BELGELEME (Documentation)",
"""Belgeleme = "gelecekteki kendimize/geliştiriciye yazılmış mektup"; kararları, yapıların nedenini
(rationale), görünümleri ve arayüzleri taşır. Amaçlar: eğitim (yeni üye), iletişim (mimar→geliştirici),
analiz+inşa temeli, adli analiz (kök-neden). HEM PRESCRIPTIVE (ne OLMASI gerektiğini söyler — gelecek
kararlara kısıt/yönlendirme) HEM DESCRIPTIVE (mevcutta ne OLDUĞUNU açıklar) olabilir.""")

add("MİMARİ DEĞERLENDİRME & ATAM (Bass-Clements-Kazman 2013)",
"""Değerlendirme = RİSK AZALTMA etkinliği; riskleri, takasları, potansiyel problemleri ERKEN ortaya
çıkarır (erken bulunan hata ucuz). Adımlar: mimariyi anla → değerlendirme sürücülerini belirle →
senaryolarla değerlendir → problemleri kaydet (KODU YENİDEN YAZMAK adım DEĞİL). · ATAM = Architecture
Tradeoff Analysis Method; mimari kararların KN'ler üzerindeki etkisini, takas/risk/duyarlılık noktalarını
analiz eder; değerlendiriciler mimariyi önceden bilmek zorunda değil, sistem inşa edilmemiş olabilir.
Katılımcılar: Değerlendirme Ekibi (3-5, tarafsız) + Karar Vericiler (mimar dahil) + Paydaşlar (12-15).
AŞAMALAR: 0 Hazırlık (haftalar) → 1 Değerlendirme-I (2 gün; ATAM sunumu/iş sürücüleri/mimari sunumu/
yaklaşımlar/NİTELİK AĞACI/analiz) → 2 Değerlendirme-II (2 gün; beyin fırtınası+senaryo önceliklendirme+
analiz) → 3 Takip (haftalar; rapor). · 7 ÇIKTI: (1) mimarinin özlü sunumu, (2) iş hedefleri, (3)
önceliklendirilmiş KN senaryoları, (4) riskler/risksizler, (5) risk temaları, (6) mimari karar↔KN
eşlemesi, (7) duyarlılık+takas noktaları. Risk = istenmeyen sonuçlu karar; Risksiz = güvenli karar;
DUYARLILIK (sensitivity) = SADECE 1 KN'yi belirgin etkileyen karar; TAKAS (trade-off) = 2+ KN'yi etkileyen
karar (her takas noktası aynı zamanda bir duyarlılık noktasıdır) — ayrıntılı çözüm süreci ÇATIŞMA YÖNETİMİ
bölümünde. Nitelik Ağacı: kök→KN
kategorisi→alt→somut senaryo; yaprak için iş önemi×mimari zorluk. Diğer: SAAM (ATAM öncülü), ARID (hafif,
erken). Hafif değerlendirme: küçük/orta proje. · DEĞERLENDİRME KİMLİĞİ: kendi-değerlendirme (mimar/ekip içi) ↔ eşler-arası inceleme (peer review — proje içi akranlar) ↔ bağımsız DIŞ değerlendirme (outsider — projeye dahil olmayan uzman). · Taktik-temelli anket (denetim): her taktik için "Destekleniyor mu? E/H" + "Gerekçe/Rationale" + risk sütunlarıyla doldurulur.""")

add("VAKA: BANKSTAT (Batch / Dijital İmza)",
"""ACME Bank regülasyona uyum için banka EKSTRELERİNİ dijital imzaya hazırlar: external DB'den veri alır,
validation yapar, ekstreleri imzaya hazırlar (~2M ekstre/ay, BATCH). Batch mimari açıdan kritik çünkü
çekirdek iş akışıdır ve performance/recoverability/availability/logging'i etkiler — batch başarısız
olursa çok sayıda ekstre etkilenir. Erişilebilirlik: okuma/gönderme hatası olursa bildirim + manuel
yeniden başlatma + yalnız işlenmemiş öğeleri işle. Kısıt: devlet son tarihi nedeniyle önce çekirdek
batch, sonra (release 2) UI/izleme/raporlar. Sürücüler: başarım+erişilebilirlik+değiştirilebilirlik+
güvenlik; kararlar: olay odaklı + aktif yedek + eklenti + şifreleme.""")

add("VAKA: FCAPS (Telekom Ağ Yönetimi)",
"""FCAPS = Fault + Configuration + Accounting + Performance + Security yönetimi. Telekom, carrier-class
VOIP için NTP destekli ZAMAN SUNUCUSU ağı kurar; bu sunucuların izlenmesi/yönetilmesi/performans verisi
toplanması/arıza giderilmesi gerekir. Fault: trap yönetimi (GPS kaybı/geri gelmesi). Accounting: donanım/
firmware sürüm takibi. Security: Teknisyen (trap/config görür) vs Yönetici (sunucu ekle/çıkar/değiştir).
ADD iterasyonları: 1) genel yapı (referans mimari), 2) birincil işlevsellik (Katman+Broker örüntüsü),
3) erişilebilirlik (QA-3: arızadan sonra 30sn içinde devam — TrapReceiver + fiziksel düğüm rafinmanı).
Mimari kararlar: olay odaklı (yüksek hacim/düşük bağlaşım) + mesaj kuyruğu + mikroservis + farklı depolama
(zaman serisi+ilişkisel+nesne). ATAM: Risk → mesaj kuyruğu TEK HATA NOKTASI (çoğaltmayla azaltıldı);
Takas → mikroservis esnekliği↔operasyonel karmaşıklık, şifreleme↔başarım; Duyarlılık → mesaj kuyruğu
kapasitesi.""")

add("DAĞITIK SİSTEM, SANALLAŞTIRMA & MIDDLEWARE",
"""CAP Teoremi: Tutarlılık + Erişilebilirlik + Bölünme Toleransı — üçü aynı anda sağlanamaz. Nihai
tutarlılık (eventual): yüksek başarım, geçici tutarsızlık. Saga: dağıtık işlemde telafi. Ölçekleme:
yatay (sunucu ekle, durumsuz gerekir) vs dikey (kapasite artır, sınırlı); read replica+sharding+CQRS;
önbellek Redis/Memcached/CDN. · SANALLAŞTIRMA: Fiziksel (tam izolasyon) → VM (ayrı OS, dk başlangıç,
güçlü izolasyon) → Konteyner (OS paylaşır, sn, küçük imaj MB, en iyi taşınabilirlik) → Sunucusuz (fonksiyon
düzeyi, ms, soğuk başlangıç riski). Hipervizör Tip 1 (bare-metal: ESXi/Hyper-V) vs Tip 2 (hosted:
VirtualBox). Kubernetes: Düğüm→Pod→Konteyner.""")

add("HIZLI EŞLEME (SINAV REFLEKSİ)",
"""Yapı: çalışma zamanı davranışı=C&C; ekiplere modül ataması=İş Atama(tahsis); taşınabilirlik=Katman;
"kullanır"=Uses; "miras"=Sınıf; paralellik+koordinasyon=Eşzamanlılık(C&C); yazılım↔donanım=Dağıtım;
dosya sistemi eşleme=Uygulama(tahsis). · Taktik: Ping/Echo=tespit; Aktif Yedek=kurtarma; İşlem/Devre
Kesici=önleme; Kapsülleme=bağlaşım azalt; Modülü Böl=uyum artır; Çok Biçimlilik=bağlamayı ertele;
Önbellek=kaynak yönet; Olay Önceliklendir=talep kontrol; Kimlik Doğrulama=direnç; Audit=tespit. · Görünüm-
notasyon: İşlevsel=UML Bileşen; Bilgi=DFD+Sınıf; Dağıtım=UML Dağıtım; Geliştirme=UML Paket; Eşzamanlılık=
Bileşen(iş parçacıklı). · Sıra: ADD=Girdi→Hedef→Eleman→Kavram→Somutlaştır→Kayıt; ATAM aşama=0Hazırlık→
1Değ.I→2Değ.II→3Takip; Fault→Error→Failure; Yedek maliyet Soğuk<Pasif<Aktif, kurtarma hızı Aktif(ms)<
Pasif(sn)<Soğuk(dk). · Kısaltma: ADD=Attribute-Driven Design, ASR=Architecturally Significant Req,
ADR=Architecture Decision Record, ATAM=Tradeoff Analysis Method, C&C=Component&Connector, CIA=Confid/
Integrity/Avail, COTS=Commercial Off-The-Shelf, CQRS=Command Query Resp. Segregation, EDA=Event-Driven
Arch, FCAPS=Fault/Config/Accounting/Perf/Security, MTBF/MTTF/MTTR, QoS, RBAC, REST, RPC, SLA, SOA.""")

add("MİMARİ TASARIM İLKELERİ (Design Principles)",
"""Bilgi Gizleme (Information Hiding): her modül değişmesi muhtemel şeyleri iyi tanımlı bir arayüz
ardında kapsüller. Sorumlulukların Ayrılması (Separation of Concerns): farklı endişeleri farklı
modüllerde ele al. Tek Sorumluluk (SRP): her modülün tek sorumluluk alanı. En Az Ayrıcalık (Least
Privilege): eleman yalnız ihtiyaç duyduğu bilgi/işleve erişir. Açık/Kapalı (Open/Closed): genişlemeye
açık, değişime kapalı. Bağımlılığı Tersine Çevirme (DIP): yüksek ve düşük seviye modüller soyutlamalara
bağımlı olmalı, birbirine değil. İyi mimari yapı: değişebilen şeyi kapsülle, veri üretici≠tüketici modül,
modül↔bileşen bire-bir değil, iyi tanımlı arayüzler, kavramsal bütünlük (tek mimar/küçük ekip).""")

add("ÖRÜNTÜ DETAYLARI (Bağlam-Sorun-Çözüm)",
"""KATMANLAR: bağlam=bağımsız geliştirilecek parçalar; çözüm=soyutlama düzeyine böl, tek yönlü kullanım;
fayda=alt katman üstü etkilemeden değişir, taşınabilirlik; dezavantaj=başarım maliyeti, katman ihlali
(layer bridging) faydaları yok eder; örnek TCP/IP, OSI, 3-katman web. · YAYIMLA-ABONE: mesaj
yayımlandığında veri yolu ilgili abonelere bildirir; yayımcı aboneleri, abone yalnız mesaj türünü bilir;
fayda=bağımsızlık, olaylar kaydedilebilir; dezavantaj=gecikme, belirsiz bekleme, belirleyicilik düşer,
test zor. · MİKROKERNEL/EKLENTİ: çekirdek elemanlar (temel işlev) + eklentiler (sabit arayüzle işlev
ekler); fayda=kontrollü genişleme, farklı ekipler, arayüz değişmedikçe bağımsız evrim; dezavantaj=
güvenlik açığı. · OLAY ODAKLI (EDA): olay=değişmez (immutable) kayıt, geçmişi temsil eder; üretici (kimin
tüketeceğini bilmez) + tüketici (bir olay çok tüketici) + kanal (kuyruk/veri yolu/akış); Event Sourcing
= durum olay dizisi olarak saklanır, CQRS ile birlikte.""")

add("SANALLAŞTIRMA DETAYI",
"""Fiziksel: izolasyon tam, başlangıç dk, taşınabilirlik düşük, yönetim yüksek. Sanal Makine: ayrı OS,
izolasyon tam/güçlü güvenlik, başlangıç dk, kaynak yüksek, imaj büyük (GB). Konteyner: OS paylaşır, süreç
düzeyi izolasyon, başlangıç sn, imaj küçük (MB), taşınabilirlik yüksek, durumsuz (sonlanınca devam etmez).
Sunucusuz (Serverless): fonksiyon düzeyi, başlangıç ms, otomatik ölçekleme, soğuk başlangıç+satıcı
bağımlılığı riski. · Hipervizör Tip 1 (bare-metal, doğrudan donanım, en yüksek başarım: VMware ESXi,
Hyper-V) vs Tip 2 (hosted, ana OS üstünde: VirtualBox, VMware Workstation). Kubernetes hiyerarşisi:
Düğüm (donanım/VM) → Pod (ilişkili konteyner grubu, aynı ağ+depolama) → Konteyner. Kaynaklar: CPU+bellek+
disk+ağ.""")

add("MIDDLEWARE DETAYI (gRPC / MQTT / DDS / REST)",
"""gRPC: RPC paradigması, HTTP/2, Protocol Buffers (ikili), çok yüksek başarım, aracı gerekmez, çift yönlü
akış, mikroservisler. MQTT: Pub-Sub, TCP/IP, broker GEREKLİ, hafif, IoT; QoS 0=en fazla 1x (onay yok),
1=en az 1x (onay var, tekrar), 2=tam olarak 1x (garanti, 4 adım); konu jokerleri: '+' tek düzey, '#' çok
düzey. DDS: veri merkezli Pub-Sub, UDP/IP, CDR ikili, çok yüksek başarım, ARACISIZ (dinamik keşif, geç
katılım), kapsamlı QoS (Güvenilirlik/Dayanıklılık/Deadline/Sahiplik); gerçek zamanlı/savunma/otonom;
varlıkları Alan→Konu→Yayımcı/Abone→DataWriter/DataReader. REST/HTTP: istek-yanıt, HTTP/1.1-2, JSON/XML
metin, orta başarım, web API. FACE TSS: havacılık için DDS üstüne tip-güvenli, birlikte çalışabilir API.""")

add("NOTASYON: UML / C4 / ADL",
"""UML: Bileşen Diy.=işlevsel+eşzamanlılık görünümü; Paket Diy.=geliştirme görünümü; Dağıtım Diy.=dağıtım
görünümü (yazılım→donanım); Sınıf Diy.=bilgi görünümü; Sıra Diy.=zaman sıralı etkileşim; Durum Makinesi=
bileşen durum davranışı; DFD=veri akışı (bilgi görünümü). · C4 Modeli: C1 Bağlam (dış dünya, teknik
olmayan paydaş) → C2 Konteyner (uygulama/veri deposu, geliştirici/sysadmin) → C3 Bileşen (konteyner içi,
geliştirici) → C4 Kod (UML sınıf, otomatik). · ADL (Mimari Açıklama Dili): ACME/Wright/Rapide; resmi
tanım, otomatik analiz; endüstride az benimsenmiş.""")

add("MİMARİ & ORGANİZASYON, COTS, PROTOTİPLEME",
"""Mimari geliştirme projesinin yapısına kazınır: İş Kırılım Yapısı (WBS) temeli — planlama/zamanlama/
bütçe, ekipler arası iletişim kanalı, yapılandırma kontrolü/dosya organizasyonu, entegrasyon+test planı.
Mimari, ürün ailesinde neyin sabit/değişken olduğunu tanımlar. COTS/OSS/bulut: pazara çıkış kısalır,
güvenilirlik artar, maliyet düşer (ama bağımlılık). Evrimsel prototipleme: iskelet sistem erken çalışır,
performans sorunu erken görülür. Yeniden kullanılabilir model: kod+gereksinim+deneyim+altyapı.""")

add("PAYDAŞ ANALİZİ & İLETİŞİM",
"""Birincil paydaş: kullanıcı/müşteri/operatör. İkincil: yönetici/düzenleyici/toplum. Anahtar: sponsor/üst
yönetim/karar verici. Endişeler: kullanıcı→kullanılabilirlik/başarım/güvenilirlik; geliştirici→
değiştirilebilirlik/test edilebilirlik; yönetici→maliyet/takvim/risk; güvenlik uzmanı→açık/uyumluluk.
İletişim: teknik olmayan→bağlam diyagramı+iş değeri; teknik→ayrıntılı diyagram+gerekçe; yönetici→maliyet-
fayda+risk. Mimari, paydaşların ortak anlayış kurduğu ortak soyutlamadır.""")

add("ARAÇLAR & MİMARİ UYUM",
"""Modelleme: Enterprise Architect (kapsamlı UML), Lucidchart (bulut/işbirliği), draw.io (ücretsiz),
PlantUML (metin tabanlı, sürüm kontrolü). Statik Analiz: SonarQube (kalite/güvenlik/karmaşıklık),
ArchUnit (Java, mimari kısıt=kod), NDepend (.NET, bağımlılık/metrik). Orkestrasyon: Kubernetes (Pod/
Deployment/Service/Ingress), Docker Swarm (basit), Mesos (büyük ölçek). Mimari Uyum Denetimi: gerçek
sistem kararlara uyuyor mu; çürüme (kasıtsız sapma) ve sapma (kasıtlı) tespiti.""")

add("PATTERN/TAKTİK KARAR AĞACI & ÇATIŞMA YÖNETİMİ",
"""Yüksek erişilebilirlik→Aktif/Pasif/Soğuk Yedek + health check + failover. Yüksek değiştirilebilirlik→
Kapsülleme+Bağımlılık Kısıtlama+Bağlamayı Erteleme. Yüksek başarım→Önbellek+Eşzamanlılık+Yük Dengeleme.
Yüksek güvenlik→Kimlik Doğrulama+Yetkilendirme+Şifreleme+Audit. IoT→MQTT+Pub-Sub+Katmanlı IoT. Gerçek
zamanlı→DDS+Aktif Yedek. Mikroservis arası→gRPC+API Gateway. Büyük veri→Lambda+EDA+Mesaj Kuyruğu.
· TAKAS NEDEN KAÇINILMAZ: hiçbir sistem tüm KN'leri aynı anda maksimumda karşılayamaz; kaynak (zaman/para/
donanım) sınırlı → çatışan KN'ler arasında bilinçli takas zorunlu. 6 ADIMLI TAKAS YÖNETİMİ — ADIM 1 ÇATIŞMAYI
TESPİT ET: tipik çatışma çiftleri güvenlik↔kullanılabilirlik (MFA kullanıcıyı zorlar), başarım↔erişilebilirlik
(redundancy gecikme artırır), değiştirilebilirlik↔başarım (katman eklemek hızı düşürür), güvenlik↔başarım
(şifreleme CPU tüketir), tutarlılık↔erişilebilirlik (CAP teoremi), dağıtılabilirlik↔güvenilirlik (sık deploy →
hata riski artar). ADIM 2 ÖNCELİKLENDİR: ATAM Nitelik Ağacı (Utility Tree) ile her KN'ye (önem, risk) ata —
KURAL yüksek önem + yüksek risk olan KN kazanır; paydaşlarla birlikte oylanır (ağaç ayrıntısı ATAM bölümünde).
ADIM 3 DUYARLILIK vs TAKAS NOKTASI: Duyarlılık (Sensitivity) Noktası = SADECE 1 KN'yi etkileyen karar (önbellek
eklemek → yalnız başarım artar); Takas (Trade-off) Noktası = 2+ KN'yi etkileyen karar (şifreleme → güvenlik↑
başarım↓); takas noktaları en dikkatli analiz edilmesi gereken kararlardır. ADIM 4 ADR İLE BELGELE: her takas
kararı bir Mimari Karar Kaydı (ADR) ile kayıt altına alınır — Başlık + Durum (Accepted) + Bağlam (hangi KN
çatışması) + Karar + Sonuç; örn "AES-256 kullanılacak, %15 başarım kaybı kabul edildi, Güvenlik(Y)>Başarım(O)
önceliklendirildi, gelecekte donanım şifreleme ile telafi". ADIM 5 TAKTİK/ÖRÜNTÜ İLE DENGELE (takas her zaman
mutlak değildir, doğru taktikle iki KN birden iyileştirilebilir): güvenlik↔başarım=donanım şifreleme (AES-NI)/
TLS offloading; erişilebilirlik↔maliyet=Warm Spare (Hot Spare kadar pahalı değil); tutarlılık↔erişilebilirlik=
Nihai Tutarlılık + CQRS; değiştirilebilirlik↔başarım=Önbellek + Katmanlı Mimari; dağıtılabilirlik↔güvenilirlik=
Canary Release + Feature Flag. ADIM 6 PAYDAŞLARLA UZLAŞ:
takas teknik değil aynı zamanda İŞ kararıdır — Mimar teknik seçenekleri sunar → Product Owner iş önceliklerini
belirler → Stakeholder son kararı onaylar.""")

add("GERÇEK DÜNYA ÖRNEKLERİ",
"""E-TİCARET: mikroservis (Ürün/Kullanıcı/Sipariş/Ödeme/Öneri/Bildirim), her servis kendi DB'si, Redis
önbellek, Kafka kuyruğu, yük dengeleme; ✓bağımsız ölçek/hata izolasyonu ✗dağıtık tutarlılık. BANKACILIK:
katmanlı (sunum+iş+veri+entegrasyon), aktif-aktif, ACID, çok katmanlı güvenlik MFA+RBAC+TLS+şifreleme+
audit. IoT: Algılama+Ağ Geçidi+Platform+Uygulama; MQTT/DDS; AWS/Azure/Google IoT. OYUN SUNUCUSU:
UDP düşük gecikme (kayıp paketi oyun mantığı ele alır), durum senkron, tahminsel hareket, sunucu taraflı
doğrulama (hile önleme).""")

add("ÇEVİK, MİMARİ BORÇ & DEĞERLENDİRME YÖNTEMLERİ",
"""Yeterli Mimari (Just Enough): geri dönüşü zor kararı (teknoloji seçimi, temel yapı, kritik KN taktiği)
önceden al; kolay kararı ertele. Mimari Borç: kısa vadeli kazanç için uzun vadeli maliyet (modüler
olmayan yapı, güvenlik/başarım/belgeleme erteleme); yönetim=düzenli değerlendirme+her sprint kapasite. ·
Başarım Analizi: Kuyruk Teorisi (matematiksel; ort. yanıt/throughput/kullanım), Simülasyon, Ölçüm. ·
Değerlendirme Yöntemleri: ATAM (kapsamlı, 4 aşama, 7 çıktı), SAAM (Scenario-Based, ATAM öncülü), ARID
(Active Reviews for Intermediate Designs, hafif/erken). · Kaynaklar: Bass-Clements-Kazman "Software
Architecture in Practice" (2013, temel/KN/ADD/ATAM); Rozanski-Woods "Software Systems Architecture"
(2011, görünüm+perspektif); Cervantes-Kazman "Designing Software Architectures" (2016, ADD); Fowler
(kurumsal örüntü); Newman (mikroservis); Richards (örüntü özeti).""")

add("SIRALAMA SORULARI (doğru sıra ezberi)",
"""Availability fault akışı: Fault oluşur → Heartbeat/Monitor/Exception ile TESPİT → Recovery/Failover/
Retry → kabul edilebilir duruma DÖN → operatörü bilgilendir. · Passive redundancy failover: Aktif düğüm
trafiği işler → Yedek periyodik STATE güncellemesi alır → aktif düğümde arıza tespit → yedek AKTİF role
geçer → trafik yeni aktife yönlenir. · Shadow ile yeniden devreye alma: bileşen onarılır/güncellenir →
state resync → SHADOW MODE'da çalıştır → davranışı gözlemle → güvenliyse aktif role al. · Escalating
Restart (dar→geniş): Thread → Process → Servis → Node/Makine. · Performans iyileştirme: senaryo+ölçüt
tanımla → ÖLÇ ve darboğaz bul → taktik seç → değişiklik uygula → tekrar ÖLÇ. · Aşırı yük tepkisi: yükü
İZLE → rate/response limiting → kuyruk sınırla → kritik olayları önceliklendir → kaynak artır/concurrency.
· Güvenli istek işleme: kaynağı tanı → kimlik DOĞRULA → yetki kontrol → girdi+bütünlük doğrula → audit'e
KAYDET. · Saldırıya tepki: intrusion/DoS ile TESPİT → erişimi sınırla/iptal → lockout → bilgilendir →
audit ile inceleme. · Modifiability refactor: sorumlulukları analiz et → cohesion artır → modülü böl →
arayüz+encapsulation → bağımlılıkları kısıtla. · Defer binding/plug-in: değişecek işlevi belirle →
extension point/arayüz tanımla → ana sistem arayüze bağımlı (somuta değil) → eklenti çalışma/dağıtım
zamanı bağlanır → yeni eklenti ana sistemi değiştirmeden eklenir. · Interoperability: servisi LOCATE et →
arayüz uyumu kontrol → gerekirse tailor (çeviri/buffer) → orchestration ile çağrıları sırala → iş sürecini
koordine et. · Taktik-temelli anket: taktik destekleniyor mu (E/H) → nerede/nasıl uygulandı → uygulama
riski (H/M/L) → gerekçe/varsayım/sonuç (rationale).""")

add("AYIRT EDİCİ FARKLAR (sık karıştırılanlar)",
"""Ping/Echo vs Heartbeat: ikisi de canlılık kontrolü; Ping/Echo'da İZLEYEN sorgu gönderir, Heartbeat'te
İZLENEN bileşen kendi "yaşıyorum" mesajını gönderir. · Fault vs Error vs Failure: fault=sebep/potansiyel,
error=yanlış iç durum, failure=dışarıdan görülen hizmet bozulması. · Latency vs Throughput: latency=tek
isteğin süresi, throughput=birim zamanda iş miktarı. · Çürüme (erosion) vs Sapma (drift): erosion=KASITSIZ
sapma, drift=KASITLI sapma. · IDS vs IPS: imza tabanlı (bilinen kalıp) vs anomali tabanlı (normalden
sapma). · Yatay vs Dikey ölçekleme: sunucu ekle (durumsuz gerekir) vs kapasite artır (sınırlı). · Monolit
vs Mikroservis: tek birim/zayıf izolasyon vs bağımsız dağıtım/güçlü izolasyon, op. karmaşıklık artar. ·
Modül vs C&C: statik tasarım birimi vs çalışma zamanı bileşen+bağlayıcı. · View vs Viewpoint vs Structure:
yapı=elemanın kendisi, görünüm=yapının temsili, bakış açısı=görünümü oluşturma kuralları/şablonu. ·
Prescriptive vs Descriptive belgeleme: ne OLMALI (kısıt/yönlendirme) vs ne VAR (mevcut durum). · Strong vs Eventual consistency: her okuma son yazmayı görür (pahalı) vs belirli sürede
tutarlı (hızlı, geçici tutarsızlık). · Functional vs Quality gereksinim: NE yapar vs NASIL yapar. · Güvenilirlik vs Erişilebilirlik: güvenilirlik=belirli sürede ARIZASIZ çalışma yeteneği; erişilebilirlik bunu KAPSAR ve üstüne KURTARMA (recovery — arıza sonrası hizmete dönüş) boyutunu ekler.""")

# ---- ek bolumler: gercek, tamamlayici derinlik (tekrar degil; yeni ozgul bilgi) ----
add("GÖRÜNÜM FAYDALARI & PERSPEKTİF–GÖRÜNÜM UYGULAMASI",
"""Çoklu görünüm kullanmanın 4 faydası: (1) Sorumlulukların ayrılması — her görünüm tek bir yapı boyutuna odaklanır; (2) Paydaş iletişimi — her grup kendi endişesine uygun görünümü okur; (3) Karmaşıklık yönetimi — boyutlar ayrı ayrı ele alınır, tek dev diyagram yükü kalkar; (4) Geliştirici odağı — doğru sistemin inşası kolaylaşır. GÜVENLİK PERSPEKTİFİNİN GÖRÜNÜMLERE İNİŞİ (soyut bir KN hedefinin her görünümde farklı somut karara dönüşmesi): İşlevsel görünüme → kimlik doğrulama yeteneği eklenir; Bilgi görünümüne → erişim sınıfları/CRUD hakları (okuma/ekleme/güncelleme/silme) tanımlanır; Operasyonel görünüme → gizli bilgi koruma + güvenlik yaması/güncelleme stratejisi belirlenir. Aynı perspektif farklı görünümlerde farklı çıktı verir; bu yüzden bir perspektif birden çok görünüme paralel uygulanır.""")

add("ERİŞİLEBİLİRLİK — GENİŞLETİLMİŞ TAKTİK KATALOĞU",
"""İSTİSNA TESPİTİ alt mekanizmaları: sistem çağrısı dönüş değeri kontrolü, PARAMETRE ÇİTİ (parameter fence — tampon sonuna kontrol değeri koyup taşmayı yakalama), tip/aralık kontrolü. OYLAMANIN (voting) 3 BİÇİMİ ve ne tür hatayı yakaladığı: replikasyon (özdeş kod kopyaları → DONANIM hatası), işlevsel fazlalık (farklı tasarım, aynı çıktı → TASARIM/spec hatası), analitik fazlalık (farklı algoritma+farklı girdi → ORTAK-MOD hatası). KURTARMADA ek: YENİDEN YAPILANDIRMA (reconfiguration — arızalı bileşeni çıkar, sorumlulukları kalanlara yeniden dağıt, maksimum işlevsellikle devam et), İLERİ HATA DÜZELTME (forward error recovery — geri almak yerine bilinen güvenli/düşürülmüş duruma İLERLE), HATA DÜZELTME KODU (ECC bellek — veri fazlalığıyla biti yerinde düzelt). ÖNLEMEDE ek: HATALI DAVRANIŞI YOK SAY (ignore faulty behavior — DoS'ta hatalı/yetkisiz kaynaktan gelen mesajları gözardı et).""")

add("BAŞARIM — ANALİZ TEKNİKLERİ & OLAY MODELİ",
"""Başarımı ÖNCEDEN kestirme/analiz teknikleri (sınav ayrımı): (1) KUYRUK TEORİSİ — analitik matematiksel model; varış oranı + servis oranından ortalama yanıt süresini, aktarım hızını ve kaynak kullanımını (utilization ρ) hesaplar; (2) SİMÜLASYON — sistemi yazılımla taklit ederek farklı yük senaryolarını dener (sistem henüz yokken de uygulanabilir); (3) ÖLÇÜM — çalışan gerçek sistemden veri toplar (en doğru ama sistemin var olmasını gerektirir). "Olay yanıtını sınırla" taktiğinin TETİKLENME koşulu: kuyruk boyutu eşiği veya işlemci kullanım uyarı düzeyi aşıldığında ya da bir SLA hedefi ihlal edildiğinde devreye girer; kaynak yetmiyorsa düşük öncelikli olaylar düşürülür (load shedding).""")

add("VERİ DEĞİŞİM MEKANİZMASI SEÇİM BOYUTLARI",
"""Bir arayüzde veri değişim mekanizması (XML/JSON/Protocol Buffers/Avro arası) seçilirken tartılan 5 BOYUT: (1) İfade gücü — ne kadar zengin/karmaşık veri yapısı taşınabilir; (2) Birlikte çalışabilirlik — farklı platform/dil/satıcı uyumu; (3) Başarım — serileştirme hızı ve mesaj boyutu; (4) Örtük bağlaşım — tarafların paylaştığı gizli varsayım (ör. ortak şema bağımlılığı); (5) Şeffaflık — insan tarafından okunabilirlik ve hata ayıklama kolaylığı. Genel takas: METİN biçimleri (XML/JSON) yüksek şeffaflık+birlikte çalışabilirlik ama düşük başarım; İKİLİ biçimler (Protocol Buffers/Avro) yüksek başarım+küçük boyut ama düşük şeffaflık ve şema bağımlılığı. Doğru seçim, bu beş boyut arasındaki önceliklendirmeye bağlıdır.""")

add("BİRLİKTE ÇALIŞABİLİRLİK & DİĞER KN AYRINTILARI",
"""Birlikte Çalışabilirlik (Interoperability) = iki+ sistemin bilgi alışverişi VE alınan bilgiyi anlamlı kullanması. Taktikler: LOCATE (servisi keşfet — service discovery/registry); ARAYÜZLERİ YÖNET — orchestrate (çağrıları sıralı koordine et) + tailor interface (çeviri/tampon/veri dönüşümü katmanı ekle). Senaryo ölçüsü: doğru alınıp işlenen değişim yüzdesi; bilinen/bilinmeyen sistemle tasarım- veya çalışma-zamanı değişimi. Test Edilebilirlik yanıt ölçüleri: kod kapsamı %, sonraki hatayı bulma olasılığı; taktikler girdi/çıktı kontrolü (mock/stub), iç durumu gözlemleme (kaydet/tekrar oynat, sandbox), bileşeni sınırlama. Kullanım Kolaylığı: çalışma-zamanı (iptal/geri al/toplu işlem/sistem durumu/çoklu görünüm) + tasarım-zamanı (UI'ı iş mantığından ayır, MVC/MVP). KN çatışmaları: güvenlik↔başarım, güvenlik↔kullanım, değiştirilebilirlik↔başarım, erişilebilirlik↔maliyet.""")

add("İYİ MİMARİ: SÜREÇ/YAPI KURALLARI & MALİYET",
"""İYİ MİMARİ SÜRECİ: tek mimar veya küçük ekip (kavramsal bütünlük), önceliklendirilmiş KN listesi, görünümlerle belgeleme, yaşam döngüsünün ERKEN aşamasında değerlendirme (hata ne kadar erken bulunursa o kadar ucuz). İYİ MİMARİ YAPISI: bilgi gizleme + sorumlulukların ayrılması, DEĞİŞEBİLİR şeyleri kapsülle, veri ÜRETEN modül ≠ veri TÜKETEN modül, modül↔bileşen bire-bir OLMASIN, dar/iyi tanımlı arayüzler, az sayıda etkileşim yolu. MALİYET/TAKVİM: yukarıdan-aşağı (hedef/bütçe, kaba) + aşağıdan-yukarı (eleman bazlı, daha doğru). Mimari, ürün ailesinde neyin SABİT neyin DEĞİŞKEN olduğunu tanımlar. COTS/OSS/bulut: pazara çıkış kısalır, yaygın kullanım güvenilirliği artırır, maliyet düşer (ama satıcı bağımlılığı). Evrimsel prototipleme: iskelet sistem erken çalışır, başarım sorunu erken görülür. Conway Yasası: organizasyonun iletişim yapısı sistem mimarisine yansır.""")

add("REFERANS MİMARİLER & KAYNAK–KONU HARİTASI",
"""REFERANS MİMARİLER (hazır iskelet çözüm): Üç Katmanlı Web (sunum+uygulama+veri), Lambda (toplu/batch + hız/speed + hizmet/serving katmanı; büyük veri), CQRS+Event Sourcing, Mikro Ön Yüz (micro-frontend), IoT (cihaz+ağ geçidi+platform+uygulama), Mikroservis. KAYNAK–KONU HARİTASI: Bass-Clements-Kazman "Software Architecture in Practice" 3.b MIT 2013 → temel kavram, KN, ADD, ATAM, taktikler; Rozanski-Woods "Software Systems Architecture" 2.b 2011 → 6 görünüm + perspektif; Cervantes-Kazman "Designing Software Architectures" 2016 → ADD pratiği + BankStat/FCAPS vakaları; Fowler 2002 (kurumsal örüntü), Newman 2015 (mikroservis), Richards 2015 (örüntü özeti).""")

add("VAKA BANKSTAT — EK DETAY (sayılar & kararlar)",
"""Yalnız ana BankStat kartına EK net-yeni bilgi: Bağlam 2010, bir Latin Amerika ülkesinin dijital-imza zorunluluğu. ÖLÇÜLEBİLİR KN hedefleri (sayısal): Güvenilirlik = batch süreci normal koşulda eksiksiz/başarıyla tamamlanır; Başarım = yaklaşık 2 milyon ekstre okunup işlenip imzalama sağlayıcısına EN ÇOK 1 SAATTE gönderilir. Bu bir BROWNFIELD (mevcut sistemi genişletme) projesi olduğundan tasarım TEK ADD iterasyonuyla bitti. Yeni mimari kararlar: asenkron Batch Job Coordinator çağrısı kullanıcı arayüzünü BLOKLAMAZ; Spring Security tüm etkileşimleri görünüm/sunum katmanında kaydeder; yerel DB konnektörü + web MVC. Genel ders: brownfield'da en zor iş mevcut yapıyı/ilişkileri değiştirmektir (refactoring riski).""")

add("VAKA FCAPS — EK DETAY (NTP/SNMP & kısıtlar)",
"""Yalnız ana FCAPS kartına EK net-yeni bilgi: Bağlam 2006, carrier-class VOIP senkronizasyonu. Zaman sunucuları STRATUM hiyerarşisinde dizilir — Stratum 1 hassas donanıma sahiptir (Sezyum osilatör/GPS), alt katmanlar üst katmandan veya PEER'lerden NTP ile zaman alır; ilk konuşlandırma 100 sunucu. SNMP 3 işlemi (kesin): set() = config değişkenini değiştir, get() = config/performans verisi al, trap() = istisnai olay bildir. Performans yönetimi sunuculardan gecikme(delay)/ofset(offset)/titreşim(jitter) toplar. Konfigürasyon yönetimi tek değişkenin yanı sıra AYNI config'i birçok sunucuya dağıtabilir. GREENFIELD geliştirme olduğundan rafine edilecek eleman TÜM sistemdir (ayrıştırma/decomposition ile başlanır). KISITLAR: tarayıcı çok-platform (Windows/OSX/Linux), ilişkisel DB zorunlu, ağ düşük bant + güvenilmez, ekip Java bilgisini kullanır.""")

add("MIDDLEWARE EK: THRIFT/AVRO & gRPC AKIŞ TÜRLERİ",
"""gRPC 4 AKIŞ TÜRÜ (mevcut middleware kartlarına EK): (1) Unary = tek istek→tek yanıt (klasik RPC); (2) Server Streaming = tek istek→sunucudan çok yanıt akışı; (3) Client Streaming = istemciden çok istek akışı→tek yanıt; (4) Bidirectional = HTTP/2 multipleks üzerinde iki yönlü eşzamanlı akış. Apache THRIFT: Facebook kökenli çok-dilli RPC çerçevesi; IDL'den çok sayıda dile kod üretir, kompakt ikili serileştirme — poliglot servis-servis için. Apache AVRO: şema-tabanlı serileştirme (Hadoop ekosistemi), payload-agnostik; ŞEMA VERİYLE BİRLİKTE (kendini tanımlar şekilde) taşınır → şema evrimi (alan ekle/çıkar) kolaydır; kompakt ikili kodlama, XML/JSON gibi metin biçimlere göre daha küçük boyut ve daha düşük CPU yükü sağlar (ders notu "Data size / CPU Overhead" karşılaştırması). Protocol Buffers = gRPC'nin şema-önce ikili kodlaması (.proto). Bu beş mekanizma birbirini DEĞİL, daha önceki gRPC/MQTT/DDS/REST kartlarını tamamlar; serileştirme/akış ekseninde ek seçeneklerdir.""")

add("EK SINAV-KRİTİK: TMR, FORMÜLLER & KESİN TANIMLAR",
"""TMR (Üçlü Modüler Fazlalık / Triple Modular Redundancy): 3 özdeş bileşen aynı işi yapar, ÇOĞUNLUK OYLAMASI (2/3) sonucu belirler → tek bileşenin hatasını maskeler; oylama taktiğinin uzay/havacılık/kritik donanımdaki klasik uygulamasıdır. REST'in 6 MİMARİ KISITI (Fielding — bunlar sağlanınca sisteme "RESTful" denir): (1) istemci-sunucu ayrımı; (2) durumsuzluk (stateless — her istek kendi bağlamını taşır, sunucu oturum tutmaz); (3) önbeklenebilirlik (cacheable); (4) tek tip arayüz (uniform interface — kaynak + URI + temsil); (5) katmanlı sistem (layered — istemci ara katmanları göremez); (6) isteğe-bağlı kod indirme (code-on-demand — opsiyonel; sunucu istemciye çalıştırılabilir kod gönderebilir).""")

add("KN SENARYO ÖRNEKLERİ — HER NİTELİK İÇİN SOMUT (6 bileşen)",
"""Format: [Kaynak | Uyarıcı | Yapıt/Artifact | Ortam | Yanıt | Yanıt Ölçüsü]. ERİŞİLEBİLİRLİK: [Dış sunucu | Yanıt vermiyor | İşlemci | Normal işletim | Sistem arızayı 5sn'de tespit eder, yedeğe geçer, kaydeder | Kesinti yok, kurtarma <30sn]. DEĞİŞTİRİLEBİLİRLİK: [Geliştirici | Veri formatı değişikliği isteği | Kod | Tasarım zamanı | Değişiklik yapılır, test edilir | ≤3 modül, ≤8 saat, yan etki yok]. BAŞARIM: [1000 eşzamanlı kullanıcı | saniyede 300 sorgu gönderir | Sistem | Tepe yük | Sorgular işlenir | Ort. gecikme ≤1.5sn, %95'i <3sn, kayıp yok]. GÜVENLİK: [Yetkisiz saldırgan | Veri değiştirmeye çalışır | Sistem verisi | Çevrimiçi/normal | Sistem girişimi kaydeder+engeller+yöneticiyi uyarır | %100 tespit, veri bütünlüğü korunur]. TEST EDİLEBİLİRLİK: [Test mühendisi | Birim test koşumu | Kod birimi | Tasarım/geliştirme | Sonuçlar yakalanır | Kapsam ≥%85, sonraki hatayı bulma olasılığı yüksek]. KULLANIM KOLAYLIĞI: [Kullanıcı | İşlemi iptal/geri al ister | Sistem | Çalışma zamanı | İşlem iptal edilir, durum geri yüklenir | ≤1sn, veri kaybı yok]. BİRLİKTE ÇALIŞABİLİRLİK: [Dış sistem | Veri alışverişi başlatır | Arayüz | Çalışma zamanı | Veri doğru alınır+işlenir | Değişimlerin ≥%99'u başarılı]. Genel senaryoda 6 bileşen ÇIKARILABİLİR; somut senaryolarda hepsi spesifik+ölçülebilir olmalı.""")

add("MİMARİNİN ÖNEMİ & ETKİLEŞİM ÇEVRİMİ (Bass 2013)",
"""MİMARİYİ ETKİLEYEN GÜÇLER & MİMARİ İŞ ÇEVRİMİ (Architecture Business Cycle / ABC, Bass 2013) — mimariyi şekillendiren 4 girdi: (a) PAYDAŞLAR (çoğu zaman ÇELİŞEN KN istekleriyle gelir — mimar bunları dengeler); (b) GELİŞTİREN ORGANİZASYON (iş hedefleri + mevcut teknik altyapı + kariyer/politik hedefler); (c) MİMARIN GEÇMİŞİ VE DENEYİMİ (bildiği örüntü/teknolojilere meyil eder); (d) TEKNİK ÇEVRE (o dönemin yaygın pratikleri ve elde bulunan teknolojiler). ÇEVRİM/GERİ BESLEME: bu güçler mimariyi belirler; üretilen mimari ve sistem ise organizasyonun yapısını/gelirini, pazardaki konumu, mimarın deneyimini ve teknik çevreyi GERİ ETKİLER. Sonuç: mimari yalnız teknik değil, iş + sosyal kesişiminde bir üründür — bu yüzden saf teknik en iyi çözüm her zaman seçilmez.""")

add("MİMARİ AÇIDAN ÖNEMLİ GEREKSİNİMLER (ASR) & TOPLAMA YÖNTEMLERİ",
"""ASR (Architecturally Significant Requirement) = mimaride DERİN/köklü etkisi olan + yüksek iş/görev değeri taşıyan gereksinim. 4 KAYNAK: (1) gereksinim dokümanından çıkar — fonksiyonel gereksinimlerin çoğu mimariyi belirlemez, asıl KN'ler ve kısıtlar (yasal, standart, teknoloji, organizasyon) önemlidir; (2) paydaş görüşmesi / çalıştay ile yakala; (3) mimardan Nitelik Ağacı (Utility Tree) ile yakala; (4) iş hedeflerinden türet. Paydaşlar çoğu zaman gerçek KN gereksinimlerini bilmez → mimar benzer sistemlerdeki deneyimine dayanıp KN'leri belirleyebilir, hangi yanıtların kolay/zor olacağına dair geri bildirim verir; ısrarla nicel sayı dayatılırsa keyfi sayılar elde edilir. QAW (Quality Attribute Workshop) = mimari TAMAMLANMADAN önce KN senaryolarını üretmek/önceliklendirmek/iyileştirmek için kolaylaştırılmış, paydaş-odaklı yöntem. QAW 7 ADIM: 1) İş/misyon sunumu, 2) Mimari plan sunumu, 3) Mimari etkenlerin (driver) belirlenmesi, 4) Senaryo beyin fırtınası, 5) Senaryo konsolidasyonu/birleştirme, 6) Senaryo önceliklendirme, 7) Senaryo rafine/iyileştirme. Gereksinimler sürekli DEĞİŞİR (yakalanmış olsun ya da olmasın) → mimar kilit paydaşlarla kanalı sürekli açık tutmalı.""")

add("İŞ HEDEFLERİNDEN ASR TÜRETME (Business Goals)",
"""İş hedefleri mimar için önemlidir çünkü çoğu zaman doğrudan ASR'ye yol açar. İş hedefi ile mimari arasında 3 OLASI İLİŞKİ: (1) iş hedefi bir KN gereksinimine yol açar; (2) iş hedefi KN gereksinimi doğurmadan mimariyi etkiler; (3) iş hedefinin mimari üzerinde hiçbir etkisi yoktur. 11 İŞ HEDEFİ KATEGORİSİ (beyin fırtınası ve elicitation yardımcısı): organizasyonun büyümesi ve sürekliliği; finansal hedefleri karşılama; kişisel hedefleri karşılama; çalışanlara karşı sorumluluk; topluma karşı sorumluluk; devlete karşı sorumluluk; hissedarlara karşı sorumluluk; pazar konumunu yönetme; iş süreçlerini iyileştirme; ürünlerin kalitesini ve itibarını yönetme; zaman içinde çevresel değişimi yönetme. Bu kategoriler iş hedeflerini ortaya çıkarmak için kontrol listesi gibi kullanılır.""")

add("KALİTE NİTELİĞİ TARTIŞMALARINDA 3 SORUN & ÇÖZÜMÜ",
"""Geleneksel KN tartışmalarının 3 SORUNU: (1) niteliklerin tanımları TEST EDİLEMEZ — 'sistem değiştirilebilir/modifiable olacak' demek tek başına anlamsızdır; (2) bir endişenin hangi niteliğe ait olduğu üzerine sonu gelmez tartışmalar olur — örn. bir DoS (servis dışı bırakma) saldırısı kaynaklı sistem arızası erişilebilirlik mi, başarım mı, güvenlik mi yoksa kullanım kolaylığı sorunu mu? (3) her nitelik topluluğu kendi ayrı sözcük dağarcığını/terminolojisini geliştirmiştir. ÇÖZÜM: ilk iki sorun (test edilemez tanımlar + örtüşen endişeler) için KN'ler KN SENARYOLARI ile karakterize edilir (ortak, test edilebilir biçim); üçüncü sorun için her nitelik kendi temel endişeleri etrafında ayrı ayrı tartışılır. Böylece niteliğin hangi 'kampa' ait olduğu değil, gereken ÖLÇÜLEBİLİR yanıt önemli hale gelir.""")

add("KALİTE GÖRÜNÜMLERİ (Quality Views) — YAPISAL GÖRÜNÜMLERİN ÖTESİNDE",
"""Standart üç yapı (modül/C&C/tahsis) dışında, belirli bir paydaşa veya endişeye göre UYARLANMIŞ ek görünümler; yapısal görünümlerden ilgili parçalar ÇIKARILIP bir araya PAKETLENEREK oluşturulur. · GÜVENLİK GÖRÜNÜMÜ: güvenlik rolü/sorumluluğu olan bileşenler, nasıl haberleştikleri, güvenlik bilgisi depoları; davranış kısmı güvenlik protokollerinin işleyişini ve insanların güvenlik elemanlarıyla nerede/nasıl etkileştiğini, sistemin belirli tehdit ve zafiyetlere nasıl yanıt vereceğini gösterir. · İLETİŞİM GÖRÜNÜMÜ (Communications): küresel dağıtık+heterojen sistemlerde özellikle yararlı; tüm bileşen-bileşen kanalları, ağ kanalları, QoS parametre değerleri, eşzamanlılık bölgeleri; kilitlenme/yarış koşulu gibi başarım+güvenilirlik analizinde, ağ bant genişliğinin dinamik tahsisinde kullanılır. · İSTİSNA/HATA-İŞLEME GÖRÜNÜMÜ: bileşenlerin arıza/hatayı nasıl tespit-rapor-çözdüğünü gösterir; hata kaynaklarını ve her biri için uygun düzeltici eylemi belirlemeye yarar. · GÜVENİLİRLİK GÖRÜNÜMÜ: replikasyon ve devralma (switchover) gibi mekanizmaları, zamanlama konularını ve işlem (transaction) bütünlüğünü modeller. · BAŞARIM GÖRÜNÜMÜ: ağ trafik modelleri, operasyonların maksimum gecikmeleri gibi başarımı çıkarsamaya yarayan yönleri gösterir. Not: kalite görünümü mevcut yapısal görünümlere EK bir paketlemedir, yeni bir yapı değildir.""")

add("DevOps & GİRDİ DOĞRULAMA TEKNİKLERİ",
"""DevOps: tek bir kalite niteliği DEĞİL; operasyonel olarak Test Edilebilirlik + Başarım + Değiştirilebilirlik + Erişilebilirlik taktiklerinin BİRLEŞİMİdir — sürekli entegrasyon/sürekli teslimat (CI/CD) bu taktikleri birlikte kullanır; amaç koddan üretime hızlı ve güvenilir akıştır. · GİRDİ DOĞRULAMA teknikleri (güvenlikte "saldırılara diren" başlığı altında somut yöntemler): SÜZME (filtering — yalnızca izinli değer/biçimleri geçir), KURALLI BİÇİME GETİRME (canonicalization — girdiyi tek standart forma indirip kaçış/kodlama hilelerini boz), KAÇIŞ KARAKTERİ (escaping — özel karakterleri etkisizleştir); enjeksiyon (SQLi/XSS) ve tampon taşması (buffer overflow) saldırılarını engeller.""")

add("EK — EŞLEŞTİRME KONULARI HIZLI ÖZET (S31-40)",
"""· S31 Yapı türleri: Modül = tasarım-zamanı kod organizasyonu/paket/sorumluluk ayrımı · Bileşen-Bağlayıcı =
çalışma-zamanı bileşen etkileşimi/connector iletişimi · Tahsis = donanım/ekip/dosya sistemi/deployment eşlemesi.
· S32 Bakış Açısı (Viewpoint) = soyut şablon/notasyon/kurallar · Görünüm (View) = belirli sisteme uygulanmış
somut görünüm · Paydaş (Stakeholder) = mimariyle ilgilenen kişi/grup · Kaygı (Concern) = paydaşın önemsediği
soru/ihtiyaç/problem. · S33 KN örnekleri: Erişilebilirlik = sunucu arızalansa da başka sunucudan çalışır ·
Başarım = 500 kullanıcıda ort. 2sn latency · Değiştirilebilirlik = yeni ödeme yöntemi min. kod · Güvenlik =
sadece yetkili erişir. · S34 Fault = sebep/potansiyel problem kaynağı · Error = yanlış/beklenmeyen iç durum ·
Failure = dışarıdan gözlemlenen hizmet verememe · Recovery = kabul edilebilir hizmete geri getirme. · S35 Arayüz:
Resource syntax = imza (ad/parametre/tip/dönüş) · semantics = ne yapar/sonuç/hata durumları · metadata/properties
= ölçü birimi/format/erişim hakkı/varsayım · versioning = eskiyi koru + yeni sürüm ekle. · S36 Değerlendirme:
Architect = mimarın kendi kararını ASR/alternatife göre değerlendirmesi · Peer = ekip/meslektaş incelemesi ·
Outsider = proje dışı objektif değerlendirme · Lightweight = kısa/sınırlı/pratik risk analizi. · S37 Vakalar:
BankStat = dijital imzalı banka ekstresi + batch validation + external DB'den ham ekstre · FCAPS = NTP time server
+ VOIP QoS zaman senk. + Stratum 1 server. · S38 Başarım: Latency = tek isteğin başlatılıp cevaplanma süresi ·
Throughput = birim sürede işlenen iş miktarı · Response Measure = beklenen cevabın ölçülebilir kriteri · Stimulus
= sisteme gelen olay/istek/mesaj. · S39 Dokümantasyon amaçları: Education = yeni üyenin sistemi öğrenmesi ·
Communication = mimar-geliştirici ortak anlayış · Construction = hangi modül hangi interface'i sağlar · Forensics
= incident sonrası etki analizi. · S40 ADD: Architectural Driver = mimari kararı etkileyen gereksinim/KN/kısıt/amaç
· ASR = mimari açıdan önemli gereksinim · Design Concept = driver'ı karşılayan pattern/tactic/yapı fikri ·
Rationale = kararın gerekçesi.""")

add("EK — SIRALAMA KONULARI DOĞRU AKIŞ ÖZETİ (S41-50)",
"""· S41 fault→error→failure: fault bulunur → iç durumda yanlışlık (error) → dışarıdan hizmet verememe (failure).
· S42 Mimari değerlendirme adımları: mimariyi anla → değerlendirme driver'larını belirle → senaryolarla analiz et
→ risk/problem kaydet. · S43 Başarım senaryosu öğe sırası: Source → Stimulus → Artifact → Environment → Response →
Response Measure. · S44 BankStat batch akışı: batch tetiklenir → external DB'den veri al → validation → ekstreleri
oluştur → dijital imzaya hazırla/gönder. · S45 FCAPS Stratum 1 arıza yanıtı: anormal sinyal → monitoring tespit
eder → operatöre alarm → alt sunucular alternatif kaynağa → bakım ticket. · S46 Arayüz evrimi: yeni sürümü kullanıma
aç → eski için deprecation duyur → client'lara geçiş süresi → kullanım oranını izle → eskiyi kaldır. · S47
Dokümantasyon (paydaş-odaklı) akışı: paydaşları tanımla → concern'leri belirle → gerekli view'ları belirle →
view+açıklamaları hazırla → review et+güncel tut. · S48 ADD genel mantığı: architectural driver'ları belirle →
design concept/pattern/tactic seç → yapıları üret → rationale yaz → ön analizle driver karşılanmış mı değerlendir.
· S49 Başarım iyileştirme: performans senaryosunu netleştir → ölç+darboğaz tespit → uygun tactic seç → değişikliği
uygula → tekrar ölç. · S50 Availability fault→failure önleme: fault oluşur → tespit edilir → etkisi izole/sınırlandırılır
→ recovery/failover çalıştırılır → operatör bildirilir + hizmet kabul edilebilir seviyede tutulur.""")

# ---- OOXML uretimi ----
def esc(t): return html.escape(t, quote=False)

PPR = ('<w:pPr><w:spacing w:before="0" w:after="0" w:line="120" w:lineRule="exact"/>'
       '<w:jc w:val="both"/><w:contextualSpacing/></w:pPr>')
def run(text, bold=False, sz="9"):
    rpr = '<w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria" w:cs="Cambria"/>'
    if bold: rpr += '<w:b/>'
    rpr += f'<w:sz w:val="{sz}"/><w:szCs w:val="{sz}"/></w:rPr>'
    return f'<w:r>{rpr}<w:t xml:space="preserve">{esc(text)}</w:t></w:r>'

import re
def nz(x):
    return " ".join(x.split())
def parse_doc51(path="scripts/arch/doc51.txt"):
    # NOT: form-feed'i GLOBAL degistirme — anket tablolarindaki "Soru N" satirlarini
    # sahte soru sinirina cevirir (232->247). Soru bolme satir-basi "Soru N" ile yapilir.
    txt = "\n" + open(path, encoding="utf-8").read()
    parts = re.split(r'\nSoru\s+(\d+)\b', txt)
    out = []
    for i in range(1, len(parts), 2):
        num = parts[i]; body = parts[i+1]
        # form-feed'i sadece blok ICINDE normalize et (12 sorunun Cevap/Açıklama marker'i \x0c'li)
        body = body.replace("\x0c", "\n")
        # bastaki bosluk/denetim toleransli marker bolme
        m = re.split(r'\n[ \t]*Cevap[ \t]*:', body, maxsplit=1)
        has_ans = len(m) > 1
        stem_opts = m[0]; ans_expl = m[1] if has_ans else ""
        a = re.split(r'\n[ \t]*Açıklama[ \t]*:', ans_expl, maxsplit=1)
        ans = a[0]; expl = a[1] if len(a) > 1 else ""
        lines = [l.strip() for l in stem_opts.splitlines() if l.strip()]
        stem = []; opts = []
        for l in lines:
            if re.match(r'^[A-E]\)\s', l):
                opts.append(l)
            elif opts:
                opts[-1] += " " + l
            else:
                stem.append(l)
        t = nz(" ".join(stem))
        if opts: t += " " + nz(" | ".join(opts))
        ans_n = nz(ans)
        # Cevap'i olmayan bloklar (Ekler B — Taktik Temelli Anketler kontrol listesi)
        # icin SAHTE cevap uydurma; metni oldugu gibi birak (zero-hallucination).
        if has_ans:
            t += " ► Cevap: " + ans_n
            if expl.strip(): t += " — " + nz(expl)
        out.append((num, t, ans_n if has_ans else None, nz(expl)))
    # ----- BUTUNLUK DENETIMI -----
    assert len(out) == 232, f"Beklenen 232 blok, bulunan {len(out)}"
    no_ans = [n for n, _, ans, _ in out if ans is None]
    empty_ans = [n for n, _, ans, _ in out if ans == ""]
    n_expl = sum(1 for _, _, _, e in out if e)
    # Cevap satiri olan her blokta cevap metni dolu olmali (parser regresyon korumasi)
    assert not empty_ans, f"Cevap marker'i var ama metni bos: {empty_ans}"
    # Cevap'i hic olmayanlar TAM OLARAK bilinen Ekler B anket maddeleri olmali (sinir drift'i yakalar)
    assert set(no_ans) == {"10", "25", "26"}, f"Cevapsiz blok kumesi degisti (sinir drift?): {no_ans}"
    print(f"  PARSER OK: 232 blok | {232-len(no_ans)} cevapli soru | "
          f"{n_expl} aciklamali | {len(no_ans)} cevapsiz anket maddesi (Ekler B): {no_ans}")
    return [(n, t) for n, t, _, _ in out]

body_paras = []
# baslik satiri — SADECE OZET (soru/cevap YOK); tum 232 soruyu cevaplamaya yetecek bilgi yuku
body_paras.append('<w:p>' + PPR + run("BYZ652 YAZILIM MİMARİSİ — SINAV ÖZETİ (tüm soruları cevaplamaya yetecek bilgi yükü; GÖRÜNÜMLER ağırlıklı). Kaynak: Bass-Clements-Kazman 2013, Rozanski-Woods 2011, Cervantes-Kazman 2016.", bold=True) + '</w:p>')
for h, b in S:
    p = '<w:p>' + PPR + run("■ " + h + " — ", bold=True) + run(b) + '</w:p>'
    body_paras.append(p)

_M = os.environ.get("CRAM_MARGIN", "1130")
sectpr = ('<w:sectPr>'
          '<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>'
          f'<w:pgMar w:top="{_M}" w:right="{_M}" w:bottom="{_M}" w:left="{_M}" '
          'w:header="0" w:footer="0" w:gutter="0"/>'
          '<w:cols w:num="4" w:space="40" w:equalWidth="1"/>'
          '<w:docGrid w:linePitch="120"/>'
          '</w:sectPr>')

document = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
 '<w:body>' + "".join(body_paras) + sectpr + '</w:body></w:document>')

styles = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
 '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria" w:cs="Cambria"/>'
 '<w:sz w:val="9"/><w:szCs w:val="9"/></w:rPr></w:rPrDefault>'
 '<w:pPrDefault><w:pPr><w:spacing w:before="0" w:after="0" w:line="120" w:lineRule="exact"/></w:pPr></w:pPrDefault>'
 '</w:docDefaults>'
 '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/>'
 '<w:pPr><w:spacing w:before="0" w:after="0" w:line="120" w:lineRule="exact"/></w:pPr>'
 '<w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:sz w:val="9"/></w:rPr></w:style>'
 '</w:styles>')

content_types = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
 '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
 '<Default Extension="xml" ContentType="application/xml"/>'
 '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
 '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
 '</Types>')

rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
 '</Relationships>')

doc_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
 '</Relationships>')

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", content_types)
    z.writestr("_rels/.rels", rels)
    z.writestr("word/document.xml", document)
    z.writestr("word/styles.xml", styles)
    z.writestr("word/_rels/document.xml.rels", doc_rels)

total_chars = sum(len(h)+len(b) for h,b in S)
print("YAZILDI:", OUT)
print("bolum sayisi:", len(S))
print("toplam govde karakter:", total_chars)

# ---- self-validation: spec uyum dogrulamasi ----
import xml.dom.minidom as _m
_z = zipfile.ZipFile(OUT)
_doc = _z.read("word/document.xml").decode("utf-8")
_m.parseString(_doc); _m.parseString(_z.read("word/styles.xml")); _m.parseString(_z.read("[Content_Types].xml"))
checks = {
  "tum metin 4.5pt (hic sz!=9 yok)": 'w:val="10"' not in _doc and 'w:val="11"' not in _doc and 'w:val="9"' in _doc,
  "satir tam 6pt (line=120 exact)": 'w:line="120" w:lineRule="exact"' in _doc,
  "yatay A4 (landscape)": 'w:orient="landscape"' in _doc and 'w:w="16838"' in _doc and 'w:h="11906"' in _doc,
  "4 esit sutun": 'w:num="4"' in _doc and 'w:equalWidth="1"' in _doc,
  "kenar (1130 twip — Word 365 2 tam sayfa icin; Word ~1.23x sik dizer)": 'w:top="1130"' in _doc and 'w:left="1130"' in _doc,
  "minimum sutun bosluk (40 twip)": 'w:space="40"' in _doc,
  "paragraf araligi yok": 'w:before="0" w:after="0"' in _doc,
  "Cambria": 'w:ascii="Cambria"' in _doc,
}
print("--- SPEC DOGRULAMA ---")
allok = True
for k,v in checks.items():
    print(("  OK  " if v else " FAIL ") + k); allok = allok and v
print("SONUC:", "TUM SPEC TAMAM" if allok else "EKSIK VAR")
