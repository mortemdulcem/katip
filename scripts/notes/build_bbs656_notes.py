# -*- coding: utf-8 -*-
"""
BBS656 Nesneye Yönelik Yazılım Geliştirme — SÖZEL sınav notu.
Kaynak: Ebru Hoca slaytları (Slide 0–5). Hoca: sözel sorular BBS656'dan; özellikle Slide 2 & 4.
Zero-hallucination: her kavram slayta sadık.
Çıktı: attached_assets/BBS656_Sozel_Sinav_Notu.docx
"""
import os
from docx_helper import (new_doc, title_block, h1, h2, field, para, bullets,
                         callout, table, ACCENT, ACCENT2, _set_run)

OUT = os.path.join(os.path.dirname(__file__), "..", "..",
                   "attached_assets", "BBS656_Sozel_Sinav_Notu.docx")


def qa(doc, soru, cevap):
    p = doc.add_paragraph(); p.paragraph_format.space_after = 0
    _set_run(p.add_run("S: "), bold=True, color=ACCENT2)
    _set_run(p.add_run(soru), bold=True)
    c = doc.add_paragraph()
    _set_run(c.add_run("C: "), bold=True, color=ACCENT)
    _set_run(c.add_run(cevap))


def build():
    doc = new_doc()
    title_block(
        doc,
        "BBS656 — Nesneye Yönelik Yazılım Geliştirme",
        "SÖZEL Sınav Notu · Slide 0–5 (Ebru Hoca)",
        "Hoca: sözel sorular BBS656'dan gelir; özellikle Slide 2 (gereksinim) ve Slide 4 (Scrum) · Dr. Nurcan Denli Bayır",
    )

    h1(doc, "Sınav Stratejisi", "0.")
    bullets(doc, [
        ("Kaynak", "Sözel (tanım/karşılaştır/açıkla) sorular bu dersten. En çok vurgulanan: Slide 2 (gereksinim & agile) ve Slide 4 (Scrum)."),
        ("Yöntem", "Kavramın TANIMINI net ver + bir örnek/karşılaştırma ekle. 'Şelale vs Agile', 'Use Case vs User Story', 'FURPS+' gibi karşılaştırmalar sık sorulur."),
    ])

    # ---------------- SLIDE 0: UML & UP
    h1(doc, "UML ve Birleşik Süreç (UP) — Slide 0", "1.")
    h2(doc, "UML nedir, ne DEĞİLDİR (sık sözel soru)")
    bullets(doc, [
        ("UML nedir", "Bir yazılım sistemini görselleştirmek, belirtmek (specify), tanımlamak ve belgelemek için kullanılan bir NOTASYON (gösterim dili)."),
        ("UML ne DEĞİLDİR", "Bir yöntem/metodoloji ya da süreç DEĞİLDİR; nasıl tasarım yapılacağını söylemez. Ayrıca TAM/eksiksiz de değildir. Herhangi bir nesneye yönelik tasarım yöntemiyle kullanılabilir."),
    ])
    h2(doc, "UML'in temel diyagramları (saymanız istenebilir)")
    bullets(doc, [
        ("Use case diyagramı", "Kullanıcı (aktör) ile sistem etkileşimleri; sistemin temel işlevselliği."),
        ("Class diyagramı", "Sistemin statik (sınıf) yapısı; OO tasarımın çekirdeği."),
        ("Object diyagramı", "Belirli bir andaki nesneler ve ilişkileri (sınıf diyagramına benzer)."),
        ("Activity diyagramı", "Bir işlem içindeki etkinlik/iş akışı; grafiksel sözde-kod gibi."),
        ("Sequence diyagramı", "İşbirliği yapan nesneler arası mesaj SIRASI; kontrol akışını vurgular."),
        ("Collaboration (iletişim) diyagramı", "Aynı mesajlaşma, ama nesneler arası İLİŞKİleri vurgular (sequence ile birbirine çevrilebilir)."),
        ("Statechart (durum) diyagramı", "Bir nesnenin durumları ve durumlar arası geçişleri."),
        ("Component diyagramı", "Kodun fiziksel yapısı (kaynak/derleme birimleri; Java'da .class, JAR/WAR/EAR)."),
        ("Deployment diyagramı", "Sistemin fiziksel mimarisi (süreçler, ağ, bileşen konumları)."),
    ])
    h2(doc, "UP (Unified Process) — iteratif yaklaşım")
    bullets(doc, [
        "Biraz planla → biraz belirt/tasarla/gerçekle → entegre et, test et, çalıştır → geri bildirim al → sonraki iterasyon.",
        ("Use case'lerin rolü", "Kullanıcıları ve gereksinimleri belirler; mimarinin oluşturulup doğrulanmasına yardım eder; test senaryolarını üretir; iterasyon planını ve dağıtımı yönlendirir; kullanıcı belgelerini üretir."),
    ])

    # ---------------- SLIDE 1: SDLC, CMM, Waterfall, V
    h1(doc, "Yazılım Yaşam Döngüsü, CMM, Modeller — Slide 1", "2.")
    h2(doc, "CMM — Yetenek Olgunluk Modeli (5 seviye)")
    para(doc, "Bir organizasyonun yazılım sürecinin OLGUNLUĞUNU ölçen kıyas (benchmark); belirli Anahtar Süreç Alanlarına (KPA) dayanır. Seviyeler (yaklaşık oran):")
    table(doc, ["Seviye", "Ad", "Öne çıkan KPA"],
          [["1", "Initial (Başlangıç) ~%70", "Tanımsız, kahramanlığa dayalı"],
           ["2", "Repeatable (Tekrarlanabilir) ~%15", "Gereksinim yön., proje plan/izleme, SQA, konfig. yön."],
           ["3", "Defined (Tanımlı) <%10", "Peer review, gruplar arası eşgüdüm, eğitim, süreç tanımı"],
           ["4", "Managed (Yönetilen) <%5", "Nicel süreç yönetimi, yazılım kalite yönetimi"],
           ["5", "Optimizing (Optimize) <%1", "Süreç/teknoloji değişim yönetimi, hata önleme"]],
          widths=[1.6, 6.0, 10.0])
    h2(doc, "Şelale (Waterfall) Modeli")
    bullets(doc, [
        ("Kaynak", "W. W. Royce, 1970. Fonksiyon ve veri temelli ayrıştırma; veri kapsüllenmez (global/file/function scope)."),
        ("Aşamalar", "Fizibilite → Sistem Analizi → Tasarım → Gerçekleme (Implementation) → Sistem Entegrasyonu → Gözden Geçirme ve Bakım (sıralı)."),
        ("Varsayımları (gerçekçi değil)", "Gereksinimler baştan bilinir ve nadiren değişir; kullanıcı ne istediğini bilir; tasarım soyut uzayda yapılabilir; teknoloji sonunda uyumlu olur; sistem çok karmaşık değildir."),
        ("Big Bang Delivery riski", "Kanıt en sona bırakılır; geç dağıtım gizli riskler taşır: teknolojik (uyumsuzluk), kavramsal (yanlış anlama), personel (ekip dağılır), kullanıcı gerçeği en sonda görür ve beğenmez; test çok geç başlar."),
    ])
    h2(doc, "V-Modeli")
    para(doc, "Şelalenin bir türevi; DOĞRULAMA ve GEÇERLEME (verification & validation) vurgusu. Her geliştirme aşamasının KARŞISINA paralel bir test aşaması konur (gereksinim ↔ kabul testi, tasarım ↔ sistem/entegrasyon testi).")

    # ---------------- SLIDE 2: Requirements, FURPS+, Agile  (VURGULU)
    h1(doc, "Gereksinim Mühendisliği & Agile — Slide 2  ★ÖNEMLİ★", "3.")
    callout(doc, "HOCA VURGULADI:", "Bu slayt sözel için kritik. Gereksinim, FURPS+ ve agile/inception kavramlarını ezbersiz ama net bilmek gerekiyor.", color=ACCENT2)
    h2(doc, "Gereksinim (Requirement) nedir?")
    bullets(doc, [
        ("Tanım", "Sistemin —ve daha genel olarak projenin— uyması gereken yetenekler (capabilities) ve koşullar (conditions)."),
        ("Gereksinim Yönetimi", "Değişen gereksinimleri bulma, belgeleme, düzenleme ve izleme için sistematik yaklaşım."),
    ])
    h2(doc, "FURPS+ Gereksinim Modeli (ezberlenmeli)")
    table(doc, ["Harf", "Boyut", "İçerik"],
          [["F", "Functional (İşlevsel)", "Özellikler, yetenekler, güvenlik"],
           ["U", "Usability (Kullanılabilirlik)", "İnsan faktörleri, yardım, belgeler"],
           ["R", "Reliability (Güvenilirlik)", "Hata sıklığı, kurtarılabilirlik, öngörülebilirlik"],
           ["P", "Performance (Başarım)", "Yanıt süresi, throughput, doğruluk, erişilebilirlik, kaynak kullanımı"],
           ["S", "Supportability (Desteklenebilirlik)", "Uyarlanabilirlik, bakım, uluslararasılaştırma, yapılandırılabilirlik"],
           ["+", "Ek kısıtlar", "Implementation, Interface, Operations, Packaging, Legal"]],
          widths=[1.3, 5.2, 11.1])
    para(doc, "Not: F = işlevsel (fonksiyonel) gereksinim; URPS+ = işlevsel-olmayan (non-functional) gereksinimler / kalite öznitelikleri.", italic=True)
    h2(doc, "Agile süreç & Re-Inception artifacts")
    bullets(doc, [
        "Örnek agile temelli süreçte iş, iterasyonlara bölünür; başlangıç (inception) ve yeniden-başlangıç (re-inception) aşamalarında artifact (üretilen belge/model) üretilir.",
        "Gereksinimler iterasyonlar boyunca rafine edilir (baştan tam dondurulmaz).",
    ])

    # ---------------- SLIDE 3: SSD, Domain Model
    h1(doc, "SSD ve Alan (Domain) Modeli — Slide 3", "4.")
    h2(doc, "System Sequence Diagram (SSD)")
    bullets(doc, [
        ("Tanım", "Bir use case senaryosu için, dış aktörlerin ürettiği OLAYLARI, sıralarını ve sistemler arası olayları gösteren resim."),
        ("Terimler", "Operasyon/parametre/dönüş verisi kısa yazılır; gerekiyorsa Sözlük (Glossary) ile açıklanır."),
        ("Hangi fazda", "Çoğunlukla ELABORATION (detaylandırma) fazında üretilir; inception'da genelde üretilmez. Sistem operasyonlarını ve sözleşmelerini netleştirmeye yarar."),
    ])
    h2(doc, "Domain (Alan) Modeli")
    bullets(doc, [
        ("Tanım", "Bir ilgi alanındaki kavramsal sınıfların / gerçek dünya nesnelerinin GÖRSEL temsili. UML'de OPERASYON İÇERMEYEN sınıf diyagramlarıyla çizilir. Alanın 'görsel sözlüğü'dür."),
        ("Ne gösterir", "Kavramsal sınıflar (domain nesneleri), aralarındaki ilişkiler (association) ve öznitelikler."),
        ("Kavramsal sınıf bulma", "(1) Kavramsal sınıf kategori listesi kullan, (2) İsim/isim öbeklerini belirle (linguistic analysis: metindeki isimleri aday sınıf/öznitelik kabul et)."),
        ("Nasıl yapılır", "Aday sınıfları listele → domain modeline çiz → gerekli ilişkileri ekle → bilgi gereksinimini karşılayan öznitelikleri ekle. (İteratif olarak elaboration'da büyür.)"),
    ])

    # ---------------- SLIDE 4: SCRUM  (VURGULU)
    h1(doc, "Scrum — Slide 4  ★ÖNEMLİ★", "5.")
    callout(doc, "HOCA VURGULADI:", "Scrum sözel için en olası konu. Manifesto, roller, seremoniler, artifacts ve user story kalıbını mutlaka bil.", color=ACCENT2)
    h2(doc, "Scrum nedir?")
    bullets(doc, [
        "Çevik (agile), hafif (lightweight) bir SÜREÇ; yazılım/ürün geliştirmeyi yönetir ve kontrol eder.",
        "İteratif ve artımlı (incremental) pratikler kullanır; basit uygulanır; üretkenliği artırır, fayda süresini kısaltır.",
        "Uyarlanabilir, deneysel (empirical) geliştirme; şelalenin TAM ZIDDI. Sadece yazılıma özgü değildir.",
        ("Kökeni", "Jeff Sutherland (1993, Easel) & Ken Schwaber (OOPSLA '96); Scrum Alliance (2002)."),
    ])
    h2(doc, "Agile Manifesto (4 değer — soldakini yeğle)")
    table(doc, ["Daha değerli (sol)", "—den çok (sağ)"],
          [["Bireyler ve etkileşimler", "Süreç ve araçlar"],
           ["Çalışan yazılım", "Kapsamlı belgeler"],
           ["Müşteri ile işbirliği", "Sözleşme pazarlığı"],
           ["Değişime yanıt vermek", "Bir planı izlemek"]],
          widths=[8.5, 8.5])
    para(doc, "Vurgu: Sağdakiler değersiz değil; ama soldakiler DAHA değerli.", italic=True)
    h2(doc, "Scrum Çerçevesi: Roller · Seremoniler · Artifacts")
    bullets(doc, [
        ("Roller", "Product Owner (ürün sahibi — backlog'u önceliklendirir), Scrum Master (süreci kolaylaştırır/engelleri kaldırır), Team (kendi kendini örgütleyen geliştirme ekibi)."),
        ("Seremoniler", "Sprint Planlama, Sprint Review (gözden geçirme), Sprint Retrospective (değerlendirme), Daily Scrum (24 saatte bir, kısa)."),
        ("Artifacts", "Product Backlog, Sprint Backlog, (Potansiyel sevk edilebilir) Ürün Artımı."),
    ])
    h2(doc, "Akış (Scrum at a Glance)")
    bullets(doc, [
        "Product Backlog (PO önceliklendirir) → Sprint planlamada Sprint Backlog seçilir → ~30 günlük Sprint → her gün 24 saatlik Daily Scrum → Sprint sonunda potansiyel sevk edilebilir ürün artımı.",
        ("Sıralı vs Örtüşen", "Şelalede her şey sırayla; Scrum'da ekip her şeyden biraz, sürekli yapar (requirements/design/code/test örtüşür)."),
    ])
    h2(doc, "Daily Scrum (Günlük toplantı) — 3 soru")
    bullets(doc, [
        "Her takım üyesi 24 saatte bir, kısa (15 dk) ayakta toplantıda 3 soruyu yanıtlar:",
        ("1", "Dün ne yaptın? (What did you do yesterday?)"),
        ("2", "Bugün ne yapacaksın? (What will you do today?)"),
        ("3", "Önünde hangi engeller var? (What obstacles are in your way?)"),
        ("Scrum Master", "Engelleri (impediments) ve politikayı kaldırır, herkesi üretken tutar; üyelik yalnızca sprint'ler ARASINDA değişmeli."),
    ])
    h2(doc, "'Pigs' ve 'Chickens' (taahhüt vs ilgi)")
    bullets(doc, [
        ("Pig (domuz)", "Projeye TAAHHÜTLÜ (committed) olanlar — gerçek işi yapan ekip."),
        ("Chicken (tavuk)", "İlgili ama taahhütlü olmayanlar (involved, not committed)."),
        ("Fıkra (slayttan)", "Tavuk 'restoran açalım' der; domuz 'ben taahhütlü olurdum, sen sadece ilgili kalırdın (committed vs involved)' der. Vurgu: kararları taahhütlüler (pigs) verir."),
    ])
    h2(doc, "Burndown Chart (yanma grafiği)")
    para(doc, "Kalan işin (ör. saat/story point) zamana göre azalışını gösteren grafik; sprint'in hedefe ulaşıp ulaşmadığını izlemeye yarar. Scrum artifact'larından biridir (Product Backlog, Sprint Backlog, Burndown chart).")
    h2(doc, "Product Backlog & User Story")
    bullets(doc, [
        ("Product Backlog", "Projede istenen tüm işlerin listesi; ideal olarak 'story point'li user story'lerle ifade edilir; PO önceliklendirir, her sprint başında yeniden önceliklendirilir."),
        ("User Story kalıbı", "Use Case yerine agile'da user story: 'As a [rol], I want to [hedef], so I can [neden].' Örn: 'Bir kullanıcı olarak giriş yapmak istiyorum ki abone içeriğine erişebileyim.'"),
        ("Story Point", "Bir story'yi gerçeklemek için gereken EFOR puanı (1-10, ya da XS/S/M/L/XL gibi)."),
    ])

    # ---------------- SLIDE 5: XP
    h1(doc, "Extreme Programming (XP) — Slide 5", "6.")
    h2(doc, "XP nedir?")
    bullets(doc, [
        ("Tanım", "Kent Beck tarafından, KÜÇÜK ekiplerin BELİRSİZ ve DEĞİŞEN gereksinimlerle çalışma ihtiyacına göre geliştirilen hafif (lightweight) bir metodoloji."),
        ("Anahtar etkinlik", "KODLAMA (coding) anahtar etkinliktir; programcı XP'nin kalbidir."),
        ("Neden 'extreme'?", "Sağduyulu ilkeleri uç noktaya taşır: Kod incelemesi iyiyse → sürekli incele (pair programming). Test iyiyse → herkes sürekli test etsin (unit test). Tasarım iyiyse → günlük işin parçası olsun (refactoring). Entegrasyon önemliyse → günde birkaç kez entegre et. Kısa iterasyon iyiyse → çok çok kısa yap."),
        ("Değişim maliyeti", "Klasik varsayım: yazılımı değiştirme maliyeti zamanla ÜSTEL artar. XP'de maliyet eğrisi DÜZ; bu basit tasarım, testler ve sürekli iyileştirme tutumu ile sağlanır."),
    ])
    h2(doc, "4 Temel Etkinlik (coding, testing, listening, designing)")
    bullets(doc, [
        ("Coding (kodlama)", "Kodlamazsan gün sonunda hiçbir şey yapmamış olursun."),
        ("Testing (test)", "Test etmezsen kodlamayı ne zaman bitirdiğini bilemezsin."),
        ("Listening (dinleme)", "Dinlemezsen neyi kodlayacağını/test edeceğini bilemezsin."),
        ("Designing (tasarım)", "İyi tasarım sistemi tek yerde değişiklikle genişletmeyi sağlar; kodlama-test-dinlemeyi sürdürülebilir kılar."),
    ])
    h2(doc, "4 Temel Değer ve İlkeler")
    bullets(doc, [
        ("4 değer", "Communication (iletişim), Simplicity (basitlik), Feedback (geri bildirim), Courage (cesaret)."),
        ("İlkeler", "Hızlı geri bildirim, basitliği varsay, artımlı değişim, değişimi kucakla, kaliteli iş."),
    ])
    h2(doc, "XP Pratikleri (12 uygulama)")
    bullets(doc, [
        "Planning Game, Small releases, Metaphor, Simple design, Testing, Refactoring,",
        "Pair Programming, Collective ownership, Continuous integration, 40-hour week, On-site Customer, Coding Standards.",
        ("Pair Programming", "İki programcı tek ekranda aynı tasarım/algoritma/kod/test üzerinde çalışır; eşleşme dinamiktir. Araştırma: çiftler tek kişiden fazla adam-saat HARCAMAZ, daha az hata ve daha az satır üretir, işten daha çok keyif alır."),
        ("Collective ownership", "Herkes her an koda ekleme yapabilir; tüm sistemden herkes sorumludur; bilgi ekibe yayılır, risk azalır."),
        ("Continuous integration", "Kod birkaç saatte bir entegre edilip test edilir; her check-in'de baştan sona derle ('daily build is for wimps'); haftalarca süren hata avından kurtarır."),
        ("On-site Customer", "Gerçek müşteri tam zamanlı ekiple oturur; hızlı karar verir. 'Sistem bir müşterinin zamanına değmiyorsa belki yapmaya değmez.'"),
        ("40-hour week", "Fazla mesai ciddi sorun belirtisidir; üst üste iki hafta fazla mesai olmaz; programcı dinlenmiş olmalı."),
        ("Coding Standards", "Herkes gönüllü kurallara göre yazar; kimin yazdığı belli olmamalı; standart yoksa pair/refactoring yavaşlar."),
    ])
    h2(doc, "Avantaj / Dezavantaj")
    bullets(doc, [
        ("Avantaj", "Müşteri odağı → yazılım gerçekten ihtiyacı karşılar; küçük artımlı sürümler riski azaltır; sürekli test/entegrasyon kaliteyi artırır; süreç istemeyen programcılara bile çekici gelir."),
        ("Dezavantaj", "Tek proje/tek ekibe göredir; 'bad apple' (uyumsuz/bencil) geliştiriciye karşı kırılgan; tam ön-spesifikasyon dayatılan ortamda işlemez; coğrafi olarak dağınık ekipte işlemez; ölçeklenme sorunları kanıtlanmamıştır."),
        ("Özet", "XP insanlara odaklanır, güç yerine takım çalışmasını yeğler; belirsiz/değişken gereksinimlerde iyi çalışır; bir SÜREÇtir, her sorunu çözen mucize DEĞİLDİR."),
    ])

    # ---------------- OLASI SÖZEL SORULAR
    h1(doc, "Olası Sözel Sorular ve Kısa Cevaplar", "7.")
    qa(doc, "UML bir metodoloji midir?",
       "Hayır. UML yalnızca bir NOTASYONDUR; nasıl tasarım yapılacağını söylemez ve eksiksiz değildir. Herhangi bir OO yöntemiyle birlikte kullanılır.")
    qa(doc, "Şelale ile Scrum/Agile arasındaki temel fark nedir?",
       "Şelale sıralı ve tek seferlik; gereksinimlerin baştan bilindiğini varsayar, ürün en sonda görülür (Big Bang riski). Scrum iteratif/artımlı, deneysel ve değişime açıktır; her sprint sonunda çalışan artım üretilir.")
    qa(doc, "FURPS+ açılımı ve hangisi fonksiyonel gereksinimdir?",
       "Functional, Usability, Reliability, Performance, Supportability (+ Implementation/Interface/Operations/Packaging/Legal). Sadece F fonksiyoneldir; URPS+ fonksiyonel-olmayan (kalite) gereksinimlerdir.")
    qa(doc, "Use Case ile User Story farkı nedir?",
       "Use case, aktör-sistem etkileşimini ayrıntılı senaryoyla anlatır (UP). User story ise agile'da kısa kalıptır: 'As a [rol], I want [hedef], so [neden]', efor 'story point' ile ölçülür.")
    qa(doc, "Domain modeli ile sınıf (tasarım) diyagramı farkı?",
       "Domain modeli kavramsal sınıfları gösterir ve OPERASYON İÇERMEZ (alanın görsel sözlüğü). Tasarım sınıf diyagramı ise operasyonları/metotları ve yazılım sınıflarını içerir.")
    qa(doc, "SSD ne işe yarar, hangi fazda üretilir?",
       "Bir use case senaryosundaki dış olayların sırasını ve sistem operasyonlarını gösterir; çoğunlukla Elaboration fazında üretilir.")
    qa(doc, "CMM seviyelerini sırala.",
       "1-Initial, 2-Repeatable, 3-Defined, 4-Managed, 5-Optimizing. Üst seviyeye çıktıkça süreç olgunluğu/öngörülebilirliği artar.")
    qa(doc, "Scrum rollerini ve seremonilerini say.",
       "Roller: Product Owner, Scrum Master, Team. Seremoniler: Sprint Planning, Sprint Review, Sprint Retrospective, Daily Scrum. Artifacts: Product/Sprint Backlog, Burndown chart, Ürün Artımı.")
    qa(doc, "Daily Scrum'da yanıtlanan 3 soru nedir?",
       "1) Dün ne yaptın? 2) Bugün ne yapacaksın? 3) Önünde hangi engeller (obstacles/impediments) var? Toplantı 24 saatte bir, kısa ve ayaktadır; Scrum Master engelleri kaldırır.")
    qa(doc, "Scrum'da 'pig' ve 'chicken' nedir?",
       "Pig = projeye TAAHHÜTLÜ (committed) olanlar (işi yapan ekip). Chicken = ilgili ama taahhütlü olmayanlar (involved). Kararları taahhütlüler verir.")
    qa(doc, "XP nedir ve anahtar etkinliği nedir?",
       "Kent Beck'in, küçük ekiplerin belirsiz/değişen gereksinimleri için geliştirdiği hafif metodolojidir; anahtar etkinlik KODLAMA'dır, programcı XP'nin kalbidir.")
    qa(doc, "XP'nin 4 temel değeri ve 4 temel etkinliği nedir?",
       "Değerler: Communication, Simplicity, Feedback, Courage. Etkinlikler: Coding, Testing, Listening, Designing.")
    qa(doc, "Pair programming neden yapılır?",
       "İki programcı tek ekranda çalışır; sürekli kod incelemesi sağlar. Araştırma: çiftler fazla adam-saat harcamaz, daha az hata ve daha az kod üretir, işten daha çok keyif alır; bilgi ekibe yayılır.")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc.save(OUT)
    print("KAYDEDILDI:", os.path.abspath(OUT))


if __name__ == "__main__":
    build()
