# -*- coding: utf-8 -*-
"""
BBM486 Tasarım Örüntüleri — Sınav Notu üreticisi.
Kaynak: Ebru Hoca slaytları (Slide 1–19). Zero-hallucination: her örnek/çerçeve/Intent slayta sadık.
Sadece slaytta GERÇEKTEN öğretilen örüntüler kapsanır (Bridge/Prototype slaytta geçmiyor; Singleton
yalnızca 'Façade nesneleri genelde singleton'dır' notuyla anılıyor — fabrikasyon yapılmadı).
Çıktı: attached_assets/BBM486_Tasarim_Oruntuleri_Sinav_Notu.docx
"""
import os
from docx_helper import (new_doc, title_block, h1, h2, field, para, bullets,
                         callout, table, ACCENT, ACCENT2, _set_run)

OUT = os.path.join(os.path.dirname(__file__), "..", "..",
                   "attached_assets", "BBM486_Tasarim_Oruntuleri_Sinav_Notu.docx")

# ------------------------------------------------------------------ PATTERNS
# Kategori sırası: Yaratımsal → Yapısal → Davranışsal. "ien" = slayttaki İngilizce Intent (verbatim).
PATTERNS = [
    # ============================ YARATIMSAL (CREATIONAL) ============================
    {
        "ad": "Factory Method (Fabrika Metodu)", "kat": "Yaratımsal (Creational)", "slayt": "Slide 4",
        "ien": "Define an interface for creating an object, but let subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses.",
        "oz": "Nesne yaratmayı bir metoda devredip, hangi somut sınıfın üretileceği kararını alt sınıflara bırakmak.",
        "amac": "'Kim yaratmalı?' sorusuna yanıt. Üretim bilgisini (hangi alt sınıf yaratılacak) çerçeveden dışarı taşır; istemci somut sınıf adını bilmez, soyut Product tipine programlar.",
        "problem": "İstemci kodu içinde 'new SomutSinif()' dağılırsa, yeni tür eklendiğinde her yerde değişiklik gerekir ve istemci somut sınıflara bağımlı olur. Soyut bir sınıf (A), tam tipini bilmediği nesneleri yaratmak zorunda kalabilir.",
        "ornek": "Hocanın örneği — (1) Grafik gösterimi (Displayer): piechart, linechart, scatter türleri var, bu kısım gelişmekte. Displayer veriyi alır; veri 100 satırdan azsa scatter, çoksa ve içerik regresif ise linechart, diğer durumda piechart üretilir. Hangi grafiğin üretileceği kararı bir fabrika metoduna verilir. (2) Document framework: Application sınıfı createDocument() ile hangi Document alt türünü yaratacağını alt sınıfa bırakır.",
        "yapi": [
            ("Product", "Üretilen nesnelerin ortak arayüzü (ör. Chart, Document)."),
            ("ConcreteProduct", "Somut ürünler (PieChart/LineChart/ScatterChart)."),
            ("Creator", "createX() fabrika metodunu tanımlar; ürünle yalnızca Product arayüzü üzerinden çalışır."),
            ("ConcreteCreator", "Fabrika metodunu uygulayıp hangi ConcreteProduct'ı üreteceğine karar verir."),
        ],
        "nezaman": [
            "Bir sınıf, üreteceği nesnenin somut tipini önceden bilemiyorsa.",
            "Bir sınıf, ürettiği nesneleri alt sınıflarının belirlemesini istiyorsa.",
            "Yaratma sorumluluğu yardımcı alt sınıflara devredilip hangisinin devralacağı tek yerde tutulacaksa.",
        ],
        "arti": ["İstemci somut ürünlere bağlanmaz (sadece Product arayüzü).", "Yeni ürün türü eklemek kolay.", "Üretim mantığı tek yerde."],
        "eksi": ["İstemci yeni bir ürün için Creator'ı alt sınıflamak zorunda kalabilir.", "Hiyerarşi büyür."],
        "tani": "İpucu: 'hangi nesnenin yaratılacağı koşula göre belirlenecek', 'yeni tür eklenebilmeli, istemci değişmemeli', 'tek ürün' → Factory Method.",
    },
    {
        "ad": "Abstract Factory (Soyut Fabrika)", "kat": "Yaratımsal (Creational)", "slayt": "Slide 5",
        "ien": "Provide an interface for creating families of related or dependent objects without specifying their concrete classes.",
        "oz": "Birbiriyle uyumlu bir nesne AİLESİNİ, somut sınıflarını belirtmeden tek elden üretmek.",
        "amac": "Factory'den bir soyutlama üstü: fabrika, sınıf değil FABRİKA döndürür gibi düşün. Birlikte çalışması gereken ürünleri tek bir fabrika üzerinden, aynı aileden gelecek şekilde üretmek; aile değişimini tek noktadan yapmak.",
        "problem": "Bir ürün ailesi (birlikte çalışan parçalar) var ve uygulamanın aynı anda tek aileden nesne kullanması gerekiyor; aileler arası karışma olmamalı, yeni aile eklenebilmeli.",
        "ornek": "Hocanın örnekleri — (1) GUIFactory: WinFactory ve OSXFactory; her biri kendi Button'ını (WinButton/OSXButton) üretir. (2) Oyun motoru (Satranç & Tavla): her oyunun tahtası, taşları, başlangıç noktası, hamle ve kazanma tanımı bir ailedir; yeni oyun motoru değiştirmeden eklenmeli. (3) Computer parts: PC/Workstation/Server fabrikaları RAM/Processor/Monitor üretir. (4) ResFactory: LowRes/HighRes fabrikaları DisplayDriver/PrinterDriver üretir.",
        "yapi": [
            ("AbstractFactory", "Aileyi üreten arayüz (ör. GUIFactory: createButton()...)."),
            ("ConcreteFactory", "WinFactory, OSXFactory — somut ürünleri üretir."),
            ("AbstractProduct", "Bir ürün türünün arayüzü (Button)."),
            ("ConcreteProduct", "WinButton, OSXButton — ilgili fabrikanın ürettiği somutlar."),
            ("Client", "Yalnızca AbstractFactory ve AbstractProduct arayüzleriyle çalışır."),
        ],
        "nezaman": [
            "Sistem, ürünlerinin nasıl üretildiğinden/kompoze edildiğinden bağımsız olmalıysa.",
            "Sistem birden çok ürün ailesinden biriyle yapılandırılacaksa.",
            "İlişkili ürünler birlikte kullanılmak üzere tasarlandıysa ve bu kısıt zorlanacaksa.",
            "Ürün sınıfları kütüphanesi sunulup yalnızca arayüzleri açığa çıkarılacaksa.",
        ],
        "arti": ["Somut sınıfları yalıtır (istemci kodunda görünmez).", "Ürün ailesini değiştirmek kolay (fabrika tek yerde, tek satır).", "Ürünler arası tutarlılığı garanti eder."],
        "eksi": ["Aileye yeni ürün TÜRÜ eklemek (tüm fabrikaları değiştirmek) zordur."],
        "tani": "İpucu: 'birlikte çalışan parça AİLESİ', 'aynı anda tek aile', 'yeni aile eklenebilmeli' → Abstract Factory. (Factory Method TEK ürün; Abstract Factory ürün AİLESİ.)",
    },
    {
        "ad": "Builder (İnşacı / Kurucu)", "kat": "Yaratımsal (Creational)", "slayt": "Slide 19",
        "ien": "Separates the construction of a complex object from its representation so that the same construction process can create different representations.",
        "oz": "Karmaşık bir nesnenin KURULUŞUNU, gösteriminden (temsilinden) ayırmak; aynı inşa süreci farklı temsiller üretebilsin.",
        "amac": "Karmaşık nesneyi adım adım, verilen veriye göre kurmak. Director inşa SIRASINI bilir; Builder her adımı (parçayı) nasıl üreteceğini bilir. Böylece aynı süreçle farklı ürün temsilleri çıkar.",
        "problem": "Karmaşık bir nesnenin oluşturulma algoritması, onu oluşturan parçalardan ve parçaların nasıl birleştirileceğinden bağımsız olmalı; ayrıca oluşturulan nesnenin farklı temsilleri (gösterimleri) gerekebilir.",
        "ornek": "Hocanın örneği (Slide 19) — yapı üzerinden anlatılır: Director, Builder arayüzünü kullanarak ürünü kurar; ConcreteBuilder parçaları üretip ürünü biriktirir ve sonunda getResult() ile döndürür. Builder, verilere göre nesneleri çeşitli biçimlerde bir araya getirir (assemble).",
        "yapi": [
            ("Builder", "Ürünün parçalarını üretmek için soyut arayüz (buildPartA/buildPartB...)."),
            ("ConcreteBuilder", "Parçaları üretip birleştirir; ürettiği temsili izler; getProduct() ile ürünü verir."),
            ("Director", "Builder arayüzünü kullanarak nesneyi (adım sırasını çağırarak) kurar."),
            ("Product", "İnşa edilen karmaşık nesne."),
        ],
        "nezaman": [
            "Karmaşık nesnenin kuruluş algoritması, parçalardan ve birleştirme biçiminden bağımsız olmalıysa.",
            "İnşa süreci, kurulan nesnenin farklı temsillerine izin vermeliyse.",
        ],
        "arti": ["İnşa ayrıntılarını soyutlar; iç temsili değiştirebilirsin.", "Modülerliği artırır (nesnenin nasıl kurulduğu kapsüllenir).", "Süreç üzerinde ince denetim (adım adım metotlar).", "Her ConcreteBuilder diğerlerinden bağımsızdır."],
        "eksi": ["Her ürün temsili için ayrı bir ConcreteBuilder gerekir; sınıf sayısı artar."],
        "tani": "İpucu: 'KARMAŞIK tek bir nesne ADIM ADIM kurulacak', 'aynı süreç farklı temsiller üretsin', 'parçalar ayrı ayrı eklenip sonda toplanır' → Builder. (Abstract Factory aile döndürür; Builder tek karmaşık nesneyi kurar.)",
    },
    # ============================ YAPISAL (STRUCTURAL) ============================
    {
        "ad": "Adapter (Adaptör / Uyarlayıcı)", "kat": "Yapısal (Structural)", "slayt": "Slide 14",
        "ien": "The adapter is used to allow two incompatible types to communicate. Where one class relies upon a specific interface that is not implemented by another class, the adapter acts as a translator between the two types.",
        "oz": "Bir sınıfın arayüzünü, istemcinin beklediği başka bir arayüze çevirmek; uyumsuz arayüzlerin birlikte çalışmasını sağlamak.",
        "amac": "Mevcut (hazır/eski/3. parti) bir sınıfı, kaynağını değiştirmeden, istemcinin beklediği arayüze uydurmak. Bir 'çevirici/priz' görevi görür.",
        "problem": "İhtiyaç duyulan sınıf var ama arayüzü istemcinin beklediğiyle uyumsuz; kaynak kodu değiştirilemiyor ya da değiştirmek istenmiyor.",
        "ornek": "Hocanın örnekleri — (1) Japon telefon şebekesi: NetworkUtilities/Network beklenirken elde JapaneseNetwork var; araya adapter konur. (2) Maaş hesabı: uygulama ICalculate (calculateHourly/calculateSalary) bekler; elde XYZPayCalculator (performHourlyPayCalculation/performSalariedPayCalculation) var. CalculateAdapter, ICalculate'i uygular ve çağrıları XYZPayCalculator'a çevirir. Uygulamada tek satır değişir: 'ICalculate cp = new CalculateAdapter();'.",
        "yapi": [
            ("Target", "İstemcinin kullandığı/beklediği arayüz (ICalculate)."),
            ("Adaptee", "Uyarlanacak, uyumsuz arayüze sahip mevcut sınıf (XYZPayCalculator)."),
            ("Adapter", "Target'ı uygular; Object Adapter'da içinde Adaptee tutup çağrıları çevirir (Class Adapter'da her ikisinden kalıtır)."),
            ("Client", "Yalnızca Target arayüzüyle çalışır."),
        ],
        "nezaman": [
            "Mevcut bir sınıfı, uyumsuz arayüzü yüzünden kullanamıyorsan (yabancı/karmaşık kod entegrasyonu).",
            "İç bileşeni, farklı arayüze sahip bir 3. parti sınıfla değiştirmen gerekiyorsa.",
        ],
        "arti": ["Mevcut/3. parti kodu değiştirmeden tekrar kullanır.", "İstemci ile uyarlanan sınıfı ayrıştırır (genelde tek satır değişiklik)."],
        "eksi": ["Ek bir çeviri katmanı/karmaşıklık doğar."],
        "tani": "İpucu: 'arayüzler uyuşmuyor', 'mevcut sınıfı değiştiremeden uydur', 'çevir/priz/dönüştürücü' → Adapter. Decorator/Proxy aynı arayüzü KORUR; Adapter arayüzü DEĞİŞTİRİR.",
    },
    {
        "ad": "Composite (Bileşik / Parça-Bütün)", "kat": "Yapısal (Structural)", "slayt": "Slide 10",
        "ien": "Compose objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions of objects uniformly.",
        "oz": "Nesneleri ağaç yapısında (parça-bütün) düzenleyip, tekil nesne ile nesne grubunu istemciye AYNI şekilde kullandırmak.",
        "amac": "Yaprak (tekil) ile bileşik (grup) nesneleri ortak bir arayüzle ele almak; istemci 'bu tek mi grup mu?' diye ayırmak zorunda kalmasın.",
        "problem": "İç içe geçmiş hiyerarşik yapı (klasör-dosya, menü-alt menü, grafik-grup) var; tek nesne ve nesne grubu için farklı kod yazmak istemciyi karmaşıklaştırır.",
        "ornek": "Hocanın örnekleri — (1) Grafik uygulaması: Graphic ortak arayüz; Line/Circle yaprak, Picture ise içinde başka Graphic'ler tutan bileşik; draw() tüm ağaca uygulanır. (2) Swing menüleri: JMenu içine JLabel/JTextField (yaprak) eklenebildiği gibi başka JMenu (bileşik) de eklenir; JMenuItem/JCheckBoxMenuItem/JRadioButtonMenuItem hepsi aynı arayüzle ele alınır.",
        "yapi": [
            ("Component", "Yaprak ve bileşiğin ortak arayüzü; varsayılan davranışı tanımlar, çocuk yönetimi (add/remove/getChild) imzalarını bildirir."),
            ("Leaf (Yaprak)", "Çocuğu olmayan tekil nesne; davranışını doğrudan uygular."),
            ("Composite", "Çocukları tutar; çocuk ekle/çıkar ve Component işlemlerini (çocuklara ileterek) uygular."),
            ("Client", "Component arayüzü üzerinden tüm yapıyı tek tip kullanır."),
        ],
        "nezaman": [
            "Parça-bütün (ağaç) hiyerarşisi temsil edilecekse.",
            "İstemcinin tekil nesneler ile nesne gruplarını AYNI şekilde ele alması isteniyorsa.",
        ],
        "arti": ["İstemci kodu basitleşir (tekil/grup ayrımı yok).", "Yeni bileşen türü eklemek kolay."],
        "eksi": ["Tasarım fazla genelleşip tip güvenliğini zayıflatabilir (yaprakta anlamsız çocuk işlemleri)."],
        "tani": "İpucu: 'iç içe / ağaç yapısı', 'klasör-dosya, menü-alt menü', 'tekil ve grubu aynı muamele' → Composite.",
    },
    {
        "ad": "Decorator (Dekoratör / Sarmalayıcı)", "kat": "Yapısal (Structural)", "slayt": "Slide 2",
        "ien": "Attach additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality. (a.k.a. Wrapper)",
        "oz": "Bir nesneye, çalışma zamanında, sınıfını değiştirmeden yeni sorumluluklar (özellikler) eklemek; ek özellikleri üst üste sarmalayarak.",
        "amac": "Bir nesneyi aynı arayüze sahip bir 'sarmalayıcı' içine koyup, taban davranışın üstüne ek davranış/maliyet eklemek. Dekoratör, sarmaladığı bileşenin arayüzüne uyar (şeffaftır); isteği bileşene iletir ve öncesinde/sonrasında ek iş yapar. Kalıtımla alt sınıf patlamasını önler.",
        "problem": "Temel bir nesneye birbirinden bağımsız, isteğe bağlı eklentiler gelecek. Her kombinasyon için ayrı alt sınıf yazmak (LCD'li+projektörlü+klimalı...) sınıf patlamasına yol açar.",
        "ornek": "Hocanın örnekleri — (1) Pizza: Pizza taban; SadePizza ConcreteComponent; MalzemeliPizza dekoratör; Misirli/Salamli/Zeytinli her biri çağrıyı sarmalayıp kendi malzeme maliyetini ekler. (2) Toplantı salonu: özdeş salon taban fiyat; LCD/projektör/klima/ikram/kamera dekoratörleri ayrı ayrı maliyet ekler. (3) GUI TextView: VisualComponent; Border/Scroll dekoratörleri (BorderDecorator: Plain/3D/Fancy; ScrollDecorator).",
        "yapi": [
            ("Component", "Hem taban nesne hem dekoratörlerin uyduğu ortak arayüz (sorumluluk eklenebilen nesnelerin arayüzü)."),
            ("ConcreteComponent", "Sarmalanan taban nesne (SadePizza, TemelSalon)."),
            ("Decorator", "Component'i uygulayan ve içinde bir Component referansı tutan soyut sarmalayıcı."),
            ("ConcreteDecorator", "Eklenen her özellik (Salamli, LCD...); çağrıyı sarmaladığı nesneye iletip üstüne kendi katkısını ekler."),
        ],
        "nezaman": [
            "Tek tek nesnelere, diğer nesneleri etkilemeden, dinamik ve şeffaf biçimde sorumluluk eklenecekse.",
            "Geri alınabilen (çıkarılabilen) sorumluluklar için.",
            "Kalıtımla genişletmek pratik değilse (alt sınıf sayısı patlıyorsa).",
        ],
        "arti": ["Statik kalıtımdan daha esnek; özellikler çalışma zamanında tak-çıkar.", "Üst hiyerarşide şişkin sınıflardan kaçınır ('pay-as-you-go').", "Dekoratörleri karıştır-eşleştir; aynı eklenti birden çok kez sarılabilir."],
        "eksi": ["Dekoratör ile bileşeni özdeş değildir (nesne kimliğine güvenme).", "Çok sayıda küçük benzer nesne doğar; öğrenmesi/hata ayıklaması zor."],
        "tani": "Sınavda ipucu: 'taban fiyat/davranış + isteğe bağlı eklentiler', 'her özelliğin maliyeti ayrı ayrı', 'istediğini ekle', 'üst üste binebilir/birleştirilebilir' → Decorator.",
    },
    {
        "ad": "Facade (Cephe / Önyüz)", "kat": "Yapısal (Structural)", "slayt": "Slide 16",
        "ien": "Provide a unified interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use.",
        "oz": "Karmaşık bir alt sistemin tüm işlevselliğine BASİT, tek bir üst-düzey arayüz (cephe) sunmak.",
        "amac": "Karmaşıklığı azaltmak: istemcinin alt sistemin onlarca sınıfıyla tek tek uğraşması yerine, tek bir cephe nesnesi üzerinden basit bir giriş noktası sunmak. İstemci ile alt sistemi gevşek bağlar.",
        "problem": "Karmaşık bir sistemin genel işlevine sadeleştirilmiş bir arayüz gerekiyor; istemcilerin alt sistemin iç sınıflarına doğrudan bağımlı olması istenmiyor.",
        "ornek": "Hocanın anlatımı (Slide 16) — Cephe nesnesi, alt sistemin hangi sınıfının hangi isteği karşılayacağını bilir ve istemci isteklerini uygun alt sistem nesnelerine devreder. Alt sistem sınıflarının cepheden haberi yoktur. NOT (slayttan): 'Façade nesneleri genelde singleton'dır.'",
        "yapi": [
            ("Facade", "Alt sistem işlevini bilir; istemci isteklerini uygun alt sistem nesnelerine devreder; basit üst-düzey arayüz sunar."),
            ("Subsystem classes (alt sistem sınıfları)", "Asıl işi yapar; cephe tarafından atanan işi görür; cepheyi tanımaz."),
        ],
        "nezaman": [
            "Karmaşık bir sisteme basit bir arayüz sunmak istiyorsan.",
            "Alt sistemini katmanlamak istiyorsan (cephe her katmana giriş noktası olur).",
        ],
        "arti": ["İstemciyi alt sistemden korur → zayıf bağ (weak coupling).", "Sistemi başka platformlara taşımayı kolaylaştırır.", "Karmaşıklığı gizler."],
        "eksi": ["Cephe, istemcilerin gerektiğinde alt sınıflara doğrudan erişmesini ENGELLEMEZ (sadece kolaylaştırır)."],
        "tani": "İpucu: 'karmaşık alt sisteme TEK basit giriş kapısı', 'istemci ayrıntıyla uğraşmasın', 'sadeleştirilmiş arayüz' → Facade. (Mediator'a benzer ama Facade tek yönlüdür: cephe → alt sistem.)",
    },
    {
        "ad": "Proxy (Vekil)", "kat": "Yapısal (Structural)", "slayt": "Slide 12",
        "ien": "Provide a surrogate or placeholder for another object to control access to it.",
        "oz": "Gerçek bir nesneye erişimi kontrol etmek/ertelemek/optimize etmek için onun yerine geçen, aynı arayüzü sunan bir vekil nesne koymak.",
        "amac": "Gerçek nesneye doğrudan erişim yerine bir vekil koyup; gecikmeli yükleme (virtual), erişim denetimi (protection), uzak erişim (remote), önbellek/akıllı referans (housekeeping) gibi ek kontrol sağlamak. İstemci vekili gerçek nesne sanır.",
        "problem": "Gerçek nesnenin oluşturulması/kullanılması pahalı (büyük dosya, uzak kaynak), korunması gerekiyor ya da farklı adres uzayında; ama istemci aynı arayüzle çalışmaya devam etmeli.",
        "ornek": "Hocanın örneği — Yüksek çözünürlüklü resim yükleme: RealImage diskten yüklenirken pahalı. ProxyImage aynı Image arayüzünü sunar ama gerçek resmi yalnızca display() ilk çağrıldığında (talep üzerine) yükler. Hiç gösterilmeyen resim hiç yüklenmez (Virtual Proxy). Yazılım-dışı örnekler: 800'lü ücretsiz telefon hattı; çek (banka fonu için vekil).",
        "yapi": [
            ("Subject", "Hem gerçek nesnenin hem vekilin uyduğu ortak arayüz (Image)."),
            ("RealSubject", "Asıl işi yapan pahalı/gerçek nesne (RealImage)."),
            ("Proxy", "Subject'i uygular, RealSubject'e referans tutar; erişimi yönetir, gerektiğinde oluşturur/iletir."),
        ],
        "nezaman": [
            "Remote Proxy: gerçek nesnenin yerini/uzaklığını gizlemek (ör. RMI).",
            "Virtual Proxy: pahalı nesneyi talep üzerine yaratıp optimizasyon (ör. resim, copy-on-write).",
            "Housekeeping/Protection Proxy: erişim denetimi (firewall), önbellek, senkronizasyon, akıllı referans.",
        ],
        "arti": ["Erişimi şeffaf biçimde kontrol eder (denetlenebilir dolaylılık).", "Gereksiz/erken maliyeti önler."],
        "eksi": ["Ek dolaylılık (indirection) maliyeti.", "Vekil ile gerçek nesnede bilgi tekrarı gerekebilir."],
        "tani": "İpucu: 'aynı arayüz ama erişimi kontrol/ertele', 'pahalı kaynağı gerektiğinde yükle', 'yerine geçen' → Proxy. Decorator'dan fark: Proxy erişimi YÖNETİR, Decorator davranış EKLER.",
    },
    # ============================ DAVRANIŞSAL (BEHAVIORAL) ============================
    {
        "ad": "Chain of Responsibility (Sorumluluk Zinciri)", "kat": "Davranışsal (Behavioral)", "slayt": "Slide 11",
        "ien": "Avoid coupling the sender of a request to its receiver by giving more than one object a chance to handle the request. Chain the receiving objects and pass the request along until an object handles it.",
        "oz": "Bir isteği, onu işleyebilecek nesneler zincirinde, biri işleyene kadar elden ele geçirmek; gönderici ile alıcıyı gevşek bağlamak.",
        "amac": "İsteğin göndericisini, alıcısına sıkı bağlamamak. Birden çok nesneye, belirli bir sırayla, isteği işleme şansı vermek. Zincirin ilk halkası ya işler ya da sonrakine iletir; gönderici isteği kimin işleyeceğini bilmez (örtük alıcı).",
        "problem": "Bir isteği kimin işleyeceği önceden belli değil; gönderici, tek tek olası işleyicileri bilmek zorunda kalmamalı.",
        "ornek": "Hocanın örnekleri — (1) Bozuk para kabul eden kahve makinesi: 1 TL'lik kahve için atılan metal para (5, 10, 50, 100 kuruş; 1 TL) doğru para nesnesini bulana dek zincirde dolaşır. Her halka (BirLira, ElliKurus, OnKurus, BesKurus) parayı tanırsa kabul eder; tanımazsa 'para.checkPara(...)' ile sonrakine iletir. (2) Şirket harcama onayı: yetki sınırına göre Yönetici → Müdür → Genel Müdür Yardımcısı → Başkan.",
        "yapi": [
            ("Handler", "İstek işleme arayüzü; bir 'successor' (sonraki) bağı tutabilir."),
            ("ConcreteHandler", "Sorumlu olduğu isteği işler; değilse sonrakine (successor) iletir."),
            ("Client", "İsteği zincirin başındaki ConcreteHandler'a verir."),
        ],
        "nezaman": [
            "Birden çok nesne isteği işleyebilir ve işleyici önceden bilinmiyorsa.",
            "İsteği, alıcıyı açıkça belirtmeden birine göndermek gerekiyorsa.",
            "İşleyiciler kümesi dinamik (çalışma zamanında) belirlenecekse.",
        ],
        "arti": ["Gönderici-alıcı ayrışır (gevşek bağ).", "Esneklik: zincir çalışma zamanında değişir."],
        "eksi": ["İsteğin işleneceği garanti değil (zincir sonunda düşebilir).", "İstemci kimin işleyeceğini açıkça seçemez."],
        "tani": "İpucu: 'sırayla denesin, biri halledene kadar geçsin', 'kimin işleyeceği belli değil', 'aşamalı onay/işleme' → Chain of Responsibility. Observer'dan fark: CoR'da genelde BİRİ işleyince durur; Observer'da herkes alır.",
    },
    {
        "ad": "Mediator (Aracı)", "kat": "Davranışsal (Behavioral)", "slayt": "Slide 16-17",
        "ien": "Encapsulate object-to-object communication. Keeps objects from knowing about each other directly; this allows us to easily change an object's behavior.",
        "oz": "Birçok nesnenin birbiriyle doğrudan değil, merkezî bir ARACI üzerinden haberleşmesini sağlamak; nesneleri birbirinden ayrıştırmak.",
        "amac": "Nesneler birbirine açıkça referans verince zarafet kaybolur. Tüm etkileşimi tek bir aracı (iletişim merkezi/hub) sınıfında toplayarak gevşek bağ ve yeniden kullanım sağlamak. Nesneler birbirini değil, sadece Mediator'ı bilir (yıldız topolojisi).",
        "problem": "En az 3 nesne karmaşık biçimde etkileşiyor; her nesne diğerlerini tek tek tanırsa bağ artar (ağ topolojisi) ve yeniden kullanım zorlaşır.",
        "ornek": "Hocanın örneği — İniş problemi (Landing problem): Uçaklar (Colleague) birbirleriyle doğrudan değil, Kontrol Kulesi (Mediator) üzerinden haberleşir; kule mesajları alır ve gerekli komutları diğer uçaklara iletir. (Slaytta: Mediator bir Observer ile gerçeklenebilir; Façade'a benzer ama Façade tek yönlüdür.)",
        "yapi": [
            ("Abstract Mediator", "Colleague→Mediator arayüzünü tanımlar."),
            ("Concrete Mediator", "Tüm Colleague'ları ve amaçlarını bilir; bir colleague'dan mesaj alıp diğerlerine gerekli komutları gönderir."),
            ("Abstract Colleague", "Mediator→Colleague arayüzünü tanımlar; aracıyı bilir ama diğer colleague'ları bilmez."),
            ("Concrete Colleagues", "Kendi küçük-ölçek davranışını bilir, büyük-ölçek (sistem) davranışını bilmez; haberleşmeyi aracıya bırakır."),
        ],
        "nezaman": [
            "Bir veya daha çok nesne birçok farklı nesneyle etkileşmek zorundaysa.",
            "Merkezî denetim isteniyorsa.",
            "Basit nesneler karmaşık biçimlerde haberleşecekse.",
            "Sık etkileşen bir nesneyi yeniden kullanmak istiyorsan.",
        ],
        "arti": ["Etkileşim tek sınıfta toplanır → zarafet ve yeniden kullanılabilirlik.", "Gevşek bağ; daha okunur/temiz kod.", "Nesnelerin davranışını değiştirmek kolaylaşır."],
        "eksi": ["Aracı, tüm etkileşimi taşıdığı için zamanla karmaşık (tanrı-nesne) hale gelebilir."],
        "tani": "İpucu: 'çok sayıda nesne birbirine karmaşık biçimde bağlı', 'merkezî bir hub/aracı üzerinden haberleşsin', 'kontrol kulesi' → Mediator. Facade'dan fark: Mediator iki yönlü ve nesneler aracıyı tanır; Facade tek yönlü kapıdır.",
    },
    {
        "ad": "Memento (Hatıra / Anlık Görüntü)", "kat": "Davranışsal (Behavioral)", "slayt": "Slide 7",
        "ien": "Without violating encapsulation, capture and externalize an object's internal state so that the object can be restored to this state later.",
        "oz": "Bir nesnenin iç durumunu, kapsüllemeyi bozmadan dışarıya kaydedip, sonra geri yükleyebilmek.",
        "amac": "Geri al (undo) / yeniden yap (redo), kontrol noktası (checkpoint), hata kurtarma, geri izleme için nesnenin durum fotoğrafını dışarıda saklamak — iç yapıyı dışarıya açmadan. Memento pasiftir; içeriğine yalnızca onu yaratan Originator dokunur.",
        "problem": "Nesnenin durumunu kaydedip geri yüklemek gerekiyor; ama durumu doğrudan dışarıya açmak (getter/setter ile) kapsüllemeyi bozar.",
        "ornek": "Hocanın örnekleri — (1) Grafik editöründe taşıma (move) işlemini geri alma: editör move'dan önce nesneden memento ister; geri al sırasında mementoyu geri verir, originator eski durumuna döner; editör mementonun içine bakmaz. (2) AdressBook (Name/Surname/Tel) — Originator. (3) TextOriginator: text/size/italic/bold durumunu memento'da saklar.",
        "yapi": [
            ("Originator", "Durumu olan asıl nesne; memento yaratır (createMemento) ve mementodan geri yüklenir (setMemento)."),
            ("Memento", "Originator'ın durumunu saklar. İki arayüz: Originator'a GENİŞ (tüm durum), Caretaker'a DAR (sadece taşı)."),
            ("Caretaker", "Mementoyu saklar/güvende tutar; içeriğine bakmaz, üzerinde işlem yapmaz; sildiğinden de sorumludur."),
        ],
        "nezaman": [
            "Bir nesnenin anlık durumu kaydedilip sonra geri yüklenecekse (undo/redo, log, backtracking).",
            "Duruma doğrudan erişim, uygulama ayrıntısını açığa çıkarıp kapsüllemeyi bozacaksa.",
        ],
        "arti": ["Kapsülleme korunur (durum dışarı sızmaz).", "Originator basit kalır (durum yönetimi Caretaker'da)."],
        "eksi": ["Mementolar pahalı olabilir (çok bellek / sık kopyalama).", "Caretaker'ın depolama maliyeti/yaşam döngüsü yönetilmeli."],
        "tani": "İpucu: 'geri al/yeniden yap', 'durumu kaydet-geri yükle', 'ama iç yapı dışarı sızmasın (kapsülleme)' → Memento. State ile karıştırma: Memento durumu SAKLAR, State davranışı durumA GÖRE değiştirir.",
    },
    {
        "ad": "Observer (Gözlemci / Yayınla-Abone Ol)", "kat": "Davranışsal (Behavioral)", "slayt": "Slide 8, 13",
        "ien": "Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.",
        "oz": "Bir nesne (Subject) değişince ona bağlı tüm nesnelerin (Observer) otomatik haberdar edilip güncellenmesi — bire-çok bağımlılık.",
        "amac": "Bir nesnenin durum değişikliğini, ona gevşek bağlı birçok nesneye otomatik yaymak. a.k.a. dependence mechanism / publish-subscribe / broadcast / change-update. Observer'lar birbirinden habersizdir.",
        "problem": "Bir kaynak değiştiğinde birçok nesnenin (kaç tane olduğu bilinmeyen) güncellenmesi gerekiyor; ama kaynağın bu nesneleri tek tek, sıkı sıkıya tanıması istenmiyor.",
        "ornek": "Hocanın örneği — Kamil Koç sefer güzergâhı: KamilKoc (ConcreteSubject) güzergâhı değiştirince, ona kayıtlı yazıhaneler KızılayYazıhanesi ve BalgatYazıhanesi (ConcreteObserver) otomatik bilgilendirilip güncellenir (UpdateKamilKocsRout). Yazıhaneler birbirinden habersizdir.",
        "yapi": [
            ("Subject", "Observer listesi tutar; attach()/detach() arayüzü sağlar."),
            ("Observer", "update() güncelleme arayüzü."),
            ("ConcreteSubject", "İlgi çeken durumu tutar; değişince notify() ile haber verir."),
            ("ConcreteObserver", "update()'i uygular, gerekirse subject'ten durumu çeker."),
        ],
        "nezaman": [
            "Bir nesnenin durumu değişince, sayısı bilinmeyen başka nesnelerin haberdar olması gerekiyorsa.",
            "Kaynak ile bağımlılar gevşek/soyut bağlı olacaksa.",
        ],
        "arti": ["Subject ve Observer gevşek (soyut) bağlı.", "Subject'i değiştirmeden observer ekle/çıkar.", "Yayın (broadcast) desteği (alıcıları bilmeye gerek yok)."],
        "eksi": ["Beklenmedik kademeli güncellemeler.", "Observer 'neyin' değiştiğini bilemeyebilir (kör güncelleme)."],
        "tani": "İpucu: 'biri değişince diğerleri OTOMATİK güncellensin/haberdar olsun', 'abone ol-bildir', 'bire-çok' → Observer.",
    },
    {
        "ad": "State (Durum)", "kat": "Davranışsal (Behavioral)", "slayt": "Slide 13, 15",
        "ien": "Allow an object to alter its behavior when its internal state changes. The object will appear to change its class.",
        "oz": "Bir nesnenin iç durumu değiştiğinde davranışını değiştirmesi; her durumu ayrı bir sınıfa koyup nesnenin sınıf değiştirmiş gibi görünmesi.",
        "amac": "Duruma bağlı davranışı, her durum için ayrı bir sınıfta toplamak; büyük if/switch zincirlerini polimorfizmle değiştirmek. Durum geçişleri de bu sınıflarda (sarmalanarak) yönetilir.",
        "problem": "Nesne birçok durumda olabiliyor ve her durumda aynı işlemler farklı davranıyor. Bunu büyük koşullu ifadelerle çözmek karmaşık ve bakımı zor olur.",
        "ornek": "Hocanın örnekleri — (1) Suyun halleri (StateOfWater): Ice/LiquidWater/WaterVapor; increaseTemp()/decreaseTemp() her durumda farklı sonuç verir ve nesneyi başka duruma geçirir. (2) MyMood: happy/mad/angry durumlarına göre farklı davranış. (3) Garaj kapısı (Garage Door): DoorClosed/DoorOpening/DoorOpen/DoorClosing/DoorStayOpen durumları.",
        "yapi": [
            ("Context", "Dış dünyaya arayüz; mevcut duruma (state) bir işaretçi tutar; istekleri o duruma devreder."),
            ("State (soyut)", "Durum makinesinin durumlarına özgü davranış arayüzü."),
            ("ConcreteState (türetilmiş)", "Her durum (Ice, LiquidWater...); davranışı uygular ve gerekince Context'in durumunu değiştirir."),
        ],
        "nezaman": [
            "Nesne birkaç durumdan birinde olabiliyor ve her durumda davranışı farklıysa.",
            "Nesnenin durumuna bağlı büyük koşullu (if/switch) ifadeler varsa.",
        ],
        "arti": ["Duruma özgü davranış tek sınıfta toplanır.", "Yeni durum/geçiş eklemek kolay; bakım basitleşir.", "Durum geçişleri belirgin; durum nesneleri paylaşılabilir."],
        "eksi": ["Durum sayısınca sınıf doğar.", "Birçok durum birbirine geçiyorsa geçiş kodu çoğalabilir."],
        "tani": "İpucu: 'nesnenin DURUMU var (A1/A2/A3, dolu/yarı/boş, odaklı/odaksız)', 'duruma göre davranış değişir', 'bir işlem başka duruma GEÇİRİR' → State. Strategy'den fark: State'te durumlar birbirine geçiş yapar ve geçişi kendileri tetikler; Strategy'de algoritmayı dışarıdan istemci seçer.",
    },
    {
        "ad": "Strategy (Strateji)", "kat": "Davranışsal (Behavioral)", "slayt": "Slide 3",
        "ien": "Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from clients that use it.",
        "oz": "Birbirinin yerine geçebilen bir algoritma ailesini ayrı sınıflara koymak ve çalışma zamanında değiştirilebilir kılmak.",
        "amac": "Davranışı (algoritmayı) onu kullanan sınıftan ayırıp bir arayüz arkasına almak; nesne, davranışı kendisi yapmak yerine bir strateji nesnesine devreder (delegation/kompozisyon).",
        "problem": "Aynı işin birden çok yapılış biçimi var ve bunlar değişiyor. if/switch ile çözmek, her yeni biçimde sınıfı tekrar değiştirmeyi gerektirir; istemcinin bilmemesi gereken veriyi açar.",
        "ornek": "Hocanın örneği — Ördek (SimUDuck): Duck soyut; MallardDuck/RedHeadDuck/RubberDuck/DecoyDuck/ModelDuck. Uçma ve ötme DEĞİŞKENDİR → FlyBehavior (FlyWithWings/FlyNoWay/FlyRocketPowered) ve QuackBehavior (Quack/Squeak/MuteQuack) arayüzlerine taşınır. Duck, performFly()/performQuack() çağrısını tuttuğu davranış nesnesine devreder; davranış çalışma zamanında setFlyBehavior() ile değişir.",
        "yapi": [
            ("Strategy", "Ortak algoritma arayüzü (algorithmInterface) (ör. FlyBehavior)."),
            ("ConcreteStrategy", "Her somut algoritma (FlyWithWings, FlyNoWay)."),
            ("Context", "Bir Strategy referansı tutar ve işi ona devreder (Duck); contextInterface() sunar."),
        ],
        "nezaman": [
            "Çok sayıda algoritman varsa ve bunları farklı zamanlarda kullanacaksan.",
            "Koşullu dallanmadan (if/switch) kurtulmak gerekiyorsa.",
            "Algoritma(lar) istemcinin bilmemesi gereken veriyi kullanıyorsa.",
        ],
        "arti": ["Koşul cümlelerini eler (polimorfizm).", "İlişkili algoritma ailesi; alt sınıflamaya alternatif.", "Algoritma dinamik değişir; karmaşık kalıtımdan kaçınır."],
        "eksi": ["İstemci stratejiler arasındaki farkı bilmek zorunda.", "Nesne/iletişim yükü artar."],
        "tani": "İpucu: 'aynı işin farklı yolları', 'çalışma zamanında davranış değişsin', 'algoritma ailesi' → Strategy. ÜÇ İLKE buradan: (1) Değişeni belirle ve kapsülle, (2) Arayüze programla, (3) Kalıtım yerine kompozisyonu yeğle.",
    },
    {
        "ad": "Template Method (Şablon Metot)", "kat": "Davranışsal (Behavioral)", "slayt": "Slide 9",
        "ien": "Define the skeleton of an algorithm in an operation, deferring some steps to subclasses. Template Method lets subclasses redefine certain steps of an algorithm without changing the algorithm's structure. (Slaytta örnek kodla anlatılır; Intent klasik GoF tanımıdır.)",
        "oz": "Bir algoritmanın iskeletini üst sınıfta sabitleyip, değişen adımları alt sınıflara bırakmak.",
        "amac": "Algoritmanın genel akışını (sıra) bir metotta tek yerde tutmak; tek tek adımların uygulanmasını alt sınıflara devretmek. Akış sabit, adımlar değişken (ters kontrol / Hollywood ilkesi).",
        "problem": "Birden çok varyantın ortak bir iş akışı var ama bazı adımları farklı. Akışı her alt sınıfta tekrar yazmak kod tekrarı ve tutarsızlık doğurur.",
        "ornek": "Hocanın örneği — Oyun (Game): playOneGame() şablon metodu sabittir: initializeGame(); oyuncular sırayla makePlay(j); endOfGame() olana dek; sonra printWinner(). initializeGame/makePlay/endOfGame/printWinner soyuttur; Monopoly ve Chess bunları kendine göre uygular. Akış aynı, adımlar farklı.",
        "yapi": [
            ("AbstractClass", "templateMethod() (akışı tanımlar) + soyut/temel adım (primitive operation) metotları."),
            ("ConcreteClass", "Soyut adımları kendine göre uygular (Monopoly, Chess)."),
        ],
        "nezaman": [
            "Algoritmanın değişmez iskeleti + değişken adımları varsa.",
            "Kod tekrarını ortak üst sınıfta toplamak gerekiyorsa.",
            "Alt sınıfların yalnızca belirli noktaları (hook) genişletmesi isteniyorsa.",
        ],
        "arti": ["Kod tekrarını azaltır.", "Akışı tek yerden kontrol eder (ters kontrol)."],
        "eksi": ["Kalıtıma dayanır (esneklik sınırlı).", "Akış değişirse üst sınıf değişir."],
        "tani": "İpucu: 'adımların SIRASI sabit, içerikleri değişiyor', 'ortak iskelet + farklı adımlar' → Template Method. Strategy ile fark: Strategy kompozisyonla TÜM algoritmayı değiştirir; Template Method kalıtımla bazı ADIMLARI değiştirir.",
    },
    {
        "ad": "Visitor (Ziyaretçi)", "kat": "Davranışsal (Behavioral)", "slayt": "Slide 18",
        "ien": "Allows for new operations to be defined and used on the elements of an object structure without changing the contents (classes) of those elements.",
        "oz": "Bir nesne yapısının elemanlarını DEĞİŞTİRMEDEN, onlara uygulanan yeni işlemler tanımlayabilmek.",
        "amac": "İşlemleri elemanlardan ayırmak: yeni bir işlem eklemek için her eleman sınıfını değiştirmek yerine, tek bir Visitor sınıfı yazmak. Anahtar mekanizma ÇİFT GÖNDERİM (double dispatch): eleman accept(visitor) çağırır, visitor da o elemana özgü visitXxx() metodunu çalıştırır.",
        "problem": "Nesne yapısı (eleman sınıfları) nadiren değişiyor ama bu elemanlara sürekli yeni ve ilgisiz işlemler eklenecek; her işlemi her sınıfa gömmek sınıfları kirletir.",
        "ornek": "Hocanın örneği — Banka hesapları: Account (eleman) arayüzü; CheckingAccount ve SavingsAccount somut elemanlar. AccountVisitor arayüzü; InquiryVisitor somut ziyaretçi. 'Hesapları görüntüle (Display Accounts)' gibi bir sorgu işlemi, hesap sınıflarını DEĞİŞTİRMEDEN ziyaretçi olarak eklenir (çift gönderim ile).",
        "yapi": [
            ("Visitor (AccountVisitor)", "Her ConcreteElement için bir visit(...) işlemi bildiren arayüz."),
            ("ConcreteVisitor (InquiryVisitor)", "İşlemi (ör. hesap görüntüleme) her eleman türü için uygular."),
            ("Element (Account)", "accept(Visitor) işlemini bildiren arayüz."),
            ("ConcreteElement (CheckingAccount, SavingsAccount)", "accept()'i uygular: visitor.visit(this) çağırır (çift gönderim)."),
        ],
        "nezaman": [
            "Nesne yapısı nadiren değişiyor (eleman sınıfları sabit) ama yeni işlemler sık ekleniyorsa.",
            "Birbiriyle ilgisiz işlemler eleman sınıflarına bulaştırılmadan toplanacaksa.",
            "Farklı arayüzlere sahip birçok sınıf üzerinde işlem yapılacaksa.",
        ],
        "arti": ["Eleman sınıflarını değiştirmeden yeni işlem (ör. sorgulama/görüntüleme) eklenir.", "İlişkili işlemler tek ziyaretçide toplanır."],
        "eksi": ["Yeni bir ELEMAN türü eklemek zordur (tüm ziyaretçiler değişir) — Visitor'ın ters yüzü."],
        "tani": "İpucu: 'eleman sınıfları sabit ama üstlerine sürekli yeni işlem eklenecek', 'sınıfları değiştirmeden operasyon ekle', 'double dispatch' → Visitor.",
    },
]

# ------------------------------------------------------------------ COMBINED CASES
SLIDE6 = [
    ("Senaryo 1 — 'No pattern' (klasör/web bağlantıları)",
     "Her dizinin içinde dosyalar ve başka dizinler vardır. Her web sayfası başka sayfalara bağ verebilir ya da başka sayfalardan bağ alabilir.",
     "Hocanın etiketi: No pattern. Bu saf VERİ/İLİŞKİ modellemesidir (association/multiplicity). Davranış değişimi/üretim/erişim sorunu yok → GoF örüntüsü zorlamak yanlış olur. (Ağaç gibi görünse de salt yapı tanımıdır.)"),
    ("Senaryo 2 — Strategy mi Decorator mı? (Çağrı sınıflandırma)",
     "Çağrılar; öncelik (yüksek-düşük), etkinlik (düşük-orta-yüksek) ve aciliyet (var-yok) ölçütlerine göre BAĞIMSIZ sınıflandırılır. Acilse kaynak planlama; öncelik yüksekse yöneticiler bilgilendirilir; etkinlik yüksekse hesap yöneticisi onayı gerekir. Üçü bağımsız sınıflandırılmalı. İstemci bu özellikleri ekrana basmak ister. Sıralama <aciliyet, öncelik, etkinlik>.",
     "Hocanın etiketi: Strategy or Decorator? Üç ölçüt bağımsız ve üst üste eklenebilir; her ölçüt çağrıyı sarmalayıp kendi katkısını ekler ve belirli bir sarma SIRASI (<aciliyet, öncelik, etkinlik>) verilir → Decorator güçlü aday. (Her ölçütü ayrı 'algoritma' gibi düşünürsen Strategy de tartışılır; ikisini de gerekçelendir.)"),
    ("Senaryo 3 — 'No pattern' (tablo-kullanıcı sahipliği)",
     "Veritabanındaki her tablonun bir sahip kullanıcısı vardır. Bir kullanıcı birden çok tabloya sahip olabilir. Her tablo 0+ kullanıcı tarafından kullanılabilir. Bir tabloyu kullanmak için ya sahibi olmak ya da sahibince yetkilendirilmek gerekir.",
     "Hocanın etiketi: No Pattern. Yine saf ilişki/çokluk (sahiplik 1—*, kullanım *—*) ve yetki kuralı modellemesi; davranışsal/yapısal bir GoF örüntüsü gerektirmez."),
    ("Senaryo 4 — Decorator (toplantı/etkinlik salonu)",
     "Özdeş toplantı salonları firmalara kiralanıyor; basit bir rezervasyon ve ücret hesabı otomasyonu gerekiyor. Rezervasyonda firma LCD, projektör, klima, ikram, kamera gibi imkânlardan istediklerini belirtir. Her imkânın maliyeti ayrı düşünülür; kullanılan salonun ücreti = taban fiyat + eklenen imkânların maliyetleri toplamı.",
     "Hocanın etiketi: Decorator. Taban nesneye, isteğe bağlı, bağımsız ve birleştirilebilir maliyet/özellik ekleme → klasik Decorator."),
    ("Senaryo 5 — Abstract Factory (satranç/tavla motoru)",
     "Satranç ve Tavla gibi iki kişilik oyunlar aynı oyun denetleyicisi (engine) tarafından yönetilir. Kullanıcı oyunu seçer; motor oyunu başlatır, hamleleri ve kazanma koşulunu kontrol eder. Her oyunun tahtası, taşları, başlangıç noktası, hamle ve kazanan tanımı vardır. Yeni oyun, motoru DEĞİŞTİRMEDEN eklenebilmeli; bazı oyunlar ortak parçalara sahip olabilir ve kopyala-yapıştır yasak.",
     "Hocanın etiketi: Abstract Factory. Her oyun, birlikte çalışan bir ürün AİLESİ (tahta+taş+kurallar) sunar; motor soyut fabrikayla çalışıp aileyi tek elden üretir; yeni aile (oyun) eklemek motoru değiştirmez."),
    ("Senaryo 6 — Factory (grafik Displayer)",
     "piechart, linechart, scatter gibi farklı grafik gösterim türleri var ve bu kısım gelişmekte. Displayer veriyi parametre alıp ekranda gösterir. Veri 100 satırdan azsa scatter; daha çoksa ve içerik regresif ise linechart; diğer durumda piechart tercih edilir. Başka sistemler de aynı grafik desteğini kullanmalı ama Displayer sınıfını DEĞİL (o bu sisteme özgü).",
     "Hocanın etiketi: Factory. Hangi somut grafik nesnesinin yaratılacağı koşula göre bir fabrika metodunda belirlenir; istemci somut grafik sınıflarına bağlanmaz, grafik üretimi tekrar kullanılır."),
]

SLIDE15 = [
    ("Case-1 — Futbol ligi",
     "11 asil + 5 yedek oyunculu takımlar; oyuncu lisans/ad/doğum/pozisyon bilgisi; her maçta 2 takım, 4 sabit rollü hakem, skor; oyuncular takımlarda süreli oynar (transfer); lig maç programı baştan belirlenir, sonra skorlar işlenir.",
     "Tasarım/Domain modelleme (sınıf diyagramı). Tek bir GoF davranış örüntüsü değil; vurgulanan: doğru sınıflar, ilişkiler ve ÇOKLUKLAR (Takım 1—* Oyuncu, Maç—4 Hakem sabit roller, zaman içinde değişen transfer ilişkisi). 'Sabit roller' ve 'süreli üyelik' modellemesine dikkat."),
    ("Case-2 — Üniversite evrak imzası",
     "Tüm evrakları danışman paraflar; mezuniyet formuysa bölüm başkanı paraflar + dekan imzalar; dilekçeyse hem bölüm başkanı hem dekan imzalar. Süreci evrak türü belirler; her tür kendi imza/paraf kurallarını tanımlayabilmeli.",
     "Chain of Responsibility (+ olası Template/Strategy). Evrak, onay makamları zincirinde (danışman→bölüm başkanı→dekan) elden ele geçer; her makam sorumluysa işler, sonra iletir. 'Sürecin evrak türüne göre özelleşmesi' her tür için farklı zincir/akış → ikinci örüntü (Template Method ya da tür-bazlı Strategy) ile birleşebilir. (≥2 pattern!)"),
    ("Case-3 — Bulut ↔ cihaz senkronizasyonu",
     "Buluttaki belgenin her cihazda (PC/tablet/telefon) indirilmiş kopyası var. Bulut değişince cihaz kopyaları tazelenmeli; cihazda değişiklik olunca buluta, birbirini EZMEDEN yüklenmeli.",
     "Observer (+ Memento, + olası Proxy). Bulut = Subject, cihaz kopyaları = Observer: değişiklik olunca otomatik bildirim/güncelleme. 'Birbirini ezmeden' = sürüm/durum saklama → Memento. Cihazdaki indirilmiş kopya da bir tür önbellek vekili → Proxy. (≥2 pattern!)"),
    ("Case-4 — A varlığı durum geçişleri + geçmiş durum saklama",
     "A'nın A1/A2/A3 durumları var; doX()/doY()/doZ() her durumda farklı çalışır. A1'de doX()→A2; A2'de doY()→A3; A3'te doZ()→A1. EK: Durum değişince eski durum saklanmalı, geriye en çok 3 durum tutulabilmeli. Önemli not (slaytta): durumlar arası geçişin SARMALANMASI hedeflenmeli.",
     "State + Memento (≥2 pattern!). Davranış duruma göre değişiyor ve işlemler bir durumdan diğerine GEÇİŞ tetikliyor → State (her durum ayrı sınıf, geçişler sarmalanır). 'Eski durum saklanmalı, geriye en çok 3 durum' → Memento (durum anlık görüntülerini kapsüllemeyi bozmadan saklayıp geri yükleme; sınırlı geçmiş = en çok 3 memento, Caretaker FIFO tutar)."),
    ("Case-5 — Personel takvimi (etkinlik saati değişimi)",
     "Her personelin takvimi ardışık etkinlikler serisidir (ad, tarih, salon no, başlangıç/bitiş saati, diğer katılımcıların biricik numaraları). Bir etkinliğin başlangıç/bitiş saati değiştirilince, AYNI GÜN devamındaki etkinliklerin katılımcılarına ve toplantı salonu randevu sistemine OTOMATİK güncelleme düşmeli.",
     "Observer. Bir etkinliğin değişimi, ona bağlı nesnelere (diğer katılımcıların takvimleri + salon randevu sistemi) OTOMATİK yayılmalı → bire-çok bağımlılık, abonelere otomatik bildirim. 'Otomatik güncelleme düşmeli' ifadesi tipik Observer sinyalidir."),
    ("Case-6 — Toplantı salonu kiralama",
     "Özdeş salonlar; ücret = taban fiyat + seçilen imkânların (LCD/projektör/klima/ikram/kamera) ayrı ayrı maliyetleri.",
     "Decorator. (Slide 6'daki vakanın aynısı; tabana isteğe bağlı, bağımsız, birleştirilebilir maliyet ekleme → klasik Decorator.)"),
    ("Case-7 — Haftalık takvim doluluk",
     "9:00–17:00 etkinlikleri; gün durumu DOLU (etkinlikler arası ≤30 dk boşluk) / YARI DOLU (en az iki etkinlik arası 2 saat boşluk) / BOŞ; ekranda dolu→kırmızı, yarı→sarı, boş→yeşil.",
     "State (+ olası Strategy). Günün davranışı/görünümü DURUMUNA (dolu/yarı/boş) göre değişir → State. Doluluğu hesaplayan kural ayrı bir algoritma olarak ele alınırsa Strategy ile birleşebilir. (≥2 pattern olabilir)"),
    ("Case-8 — Animasyon odaklanma",
     "Karaktere odaklanılmadıkça 2B profil görünümü + noktadan noktaya kayma; odaklanınca gerçek 3B görünüm + düzgün yürüme.",
     "State. İki durum: odaklı / odaksız. Görünüm ve hareket davranışı duruma göre tamamen değişir; odaklanma durum geçişini tetikler."),
]

CONFUSE = [
    ("Strategy ↔ State", "İkisi de davranışı sınıflara böler. Strategy: algoritmayı DIŞARIDAN istemci seçer, durumlar arası geçiş yok. State: durumlar birbirine GEÇİŞ yapar, geçişi genelde durum nesneleri tetikler."),
    ("Strategy ↔ Decorator", "Strategy bir davranışı baştan başka bir davranışla DEĞİŞTİRİR (tek seçim). Decorator mevcut davranışın ÜSTÜNE ekleme yapar (üst üste sarma)."),
    ("Decorator ↔ Proxy ↔ Adapter", "Üçü de bir nesneyi sarar. Adapter arayüzü DEĞİŞTİRİR (uyumsuzu uydurur). Decorator arayüzü KORUR, davranış EKLER. Proxy arayüzü KORUR, erişimi KONTROL eder/erteler."),
    ("Factory Method ↔ Abstract Factory ↔ Builder", "Factory Method TEK bir ürünü, alt sınıf kararıyla üretir. Abstract Factory birlikte çalışan ürün AİLESİNİ üretir ('a la carte' ↔ Factory Method 'fixed price'). Builder ise KARMAŞIK tek bir nesneyi, verilen veriye göre ADIM ADIM kurar."),
    ("Facade ↔ Mediator", "Facade: alt sisteme TEK YÖNLÜ basit kapı; alt sistem cepheyi bilmez. Mediator: nesneler arası İKİ YÖNLÜ haberleşmeyi toplar; colleague'lar aracıyı bilir."),
    ("Observer ↔ Chain of Responsibility ↔ Mediator", "Observer: olay TÜM abonelere yayılır (bire-çok, herkes alır). CoR: istek zincirde İLERLER, genelde BİRİ işleyince durur. Mediator: haberleşme merkezî aracı üzerinden yönlendirilir."),
    ("Memento ↔ State", "Memento durumu SAKLAR/geri yükler (undo). State davranışı duruma göre DEĞİŞTİRİR. Farklı amaç (Case-4'te birlikte gelirler)."),
    ("Composite ↔ Decorator", "İkisi de özyinelemeli (recursive) yapı. Composite parça-bütün AĞACI kurar (çoklu çocuk). Decorator tek bir bileşeni sarıp davranış ekler (tek 'çocuk')."),
]

# ------------------------------------------------------------------ BUILD
def build():
    doc = new_doc()
    title_block(
        doc,
        "BBM486 — Tasarım Örüntüleri",
        "Sınav Notu · Slide 1–19 (Ebru Hoca) · 16 örüntü tam kapsam",
        "Hem basit anlatım hem ayrıntılı çözümleme · Kaynak: ders slaytları · Dr. Nurcan Denli Bayır",
    )

    # NASIL ÇALIŞILIR
    h1(doc, "Sınav Stratejisi (Önce Bunu Oku)", "0.")
    bullets(doc, [
        ("Soru tipi", "Bir senaryo verilir, 'hangi örüntü(ler)?' ya da 'tasarla' denir. Hoca: bir soruda EN AZ 2 örüntü olabilir."),
        ("Yöntem", "Senaryodaki anahtar kelimeleri yakala → bu nottaki 'Sınavda nasıl tanırım' ipuçlarıyla eşle → örüntüyü adlandır, GEREKÇE yaz, kısa sınıf/ilişki çiz."),
        ("≥2 örüntü refleksi", "Bir senaryoda hem 'duruma göre davranış' (State) hem 'değişikliği yay' (Observer) hem 'sürüm sakla' (Memento) gibi birden çok sinyal olabilir; hepsini ayrı ayrı gerekçelendir."),
        ("Tuzak", "Her senaryo örüntü istemez: salt veri/ilişki modellemesi 'No pattern' olabilir (bkz. Slide 6 Senaryo 1 ve 3)."),
        ("Kapsam", "Bu not yalnızca Ebru Hoca'nın slaytlarında GERÇEKTEN işlenen 16 örüntüyü içerir. Bridge ve Prototype slaytta örüntü olarak işlenmez; Singleton yalnızca 'Facade nesneleri genelde singleton'dır' notuyla geçer (aşağıda)."),
    ])

    # TEMEL OO + İLKELER (Slide 1-3)
    h1(doc, "Temel OO Kavramları ve Tasarım İlkeleri", "1.")
    h2(doc, "Temel kavramlar (Slide 1)")
    bullets(doc, [
        ("Encapsulation (kapsülleme)", "Uygulama ayrıntısını gizle, beklenen giriş/çıkışı tanımla."),
        ("Abstraction (soyutlama)", "Tüm sistemi gizle, sisteme erişim yolunu tanımla; bir şeyin ASIL/özsel niteliklerini ver."),
        ("Class / Association / Inheritance / Polymorphism", "Sınıf; sınıflar arası ilişki; is-a kalıtım; aynı arayüze farklı davranış."),
        ("Composite ilişki", "Parça-bütün güçlü birleşim: parçalar bütünle yaşar ve ölür (ör. Body–Liver/Heart, Car–Wheel/Engine)."),
        ("Association & Multiplicity", "Sınıflar arası ilişki ve kaç nesnenin ilişkili olabileceği (1-1, 1-*, *-*). is-a ve has-a temel ilişkilerdir."),
    ])
    h2(doc, "Tasarım İlkeleri (slaytta birebir geçen — sınavda altın kural)")
    bullets(doc, [
        ("İlke 1", "Find what varies and encapsulate it — Değişeni belirle ve kapsülle (sabit kalandan ayır)."),
        ("İlke 2", "Program to an interface, not an implementation — Uygulamaya değil, üst tipe/arayüze programla."),
        ("İlke 3", "Favor composition over (class) inheritance — Kalıtım yerine kompozisyonu yeğle."),
        ("Ek", "Design interfaces; Favour aggregation over inheritance (slaytta birlikte geçer)."),
        ("OCP (Açık-Kapalı)", "Sınıflar genişlemeye AÇIK, değişime KAPALI olmalı: yeni davranış = yeni sınıf, mevcut kod değişmez."),
    ])

    # PATTERNS
    h1(doc, "Örüntü Kataloğu (16 Örüntü — Tam Detay)", "2.")
    para(doc, "Sıra: Yaratımsal → Yapısal → Davranışsal. Her örüntüde slayttaki İngilizce Intent (verbatim) korunmuştur.", italic=True)
    for i, p in enumerate(PATTERNS, start=1):
        h2(doc, f"2.{i}  {p['ad']}  —  [{p['kat']}]  ·  {p['slayt']}", color=ACCENT)
        callout(doc, "TEK CÜMLE:", p["oz"])
        field(doc, "Intent (slayttan, İngilizce)", p["ien"])
        field(doc, "Amaç (Türkçe)", p["amac"])
        field(doc, "Hangi problemi çözer", p["problem"])
        field(doc, "Hocanın örneği", p["ornek"])
        para(doc, "Yapı / Katılımcılar:", color=ACCENT)
        bullets(doc, p["yapi"])
        para(doc, "Ne zaman kullanılır:", color=ACCENT)
        bullets(doc, p["nezaman"])
        pr = doc.add_paragraph(); pr.paragraph_format.space_after = 0
        _set_run(pr.add_run("Artı (+): "), bold=True, color=ACCENT)
        _set_run(pr.add_run("  •  ".join(p["arti"])))
        ek = doc.add_paragraph()
        _set_run(ek.add_run("Eksi (–): "), bold=True, color=ACCENT2)
        _set_run(ek.add_run("  •  ".join(p["eksi"])))
        callout(doc, "SINAVDA NASIL TANIRIM:", p["tani"])

    # SINGLETON NOTU (slaytta sadece anılıyor)
    h2(doc, "Not — Singleton (slaytta yalnızca anılır)", color=ACCENT2)
    callout(doc, "DÜRÜSTLÜK NOTU:",
            "Ebru Hoca'nın slaytlarında Singleton'a ayrı bir bölüm AYRILMAMIŞTIR; yalnızca Facade anlatımında "
            "'Façade objects are often singletons' (Façade nesneleri genelde singleton'dır) cümlesiyle geçer. "
            "Slaytta verilen TEK bilgi budur; ayrı bir Singleton bölümü/örnek YOKTUR. "
            "[SLAYT DIŞI — genel tanım, yalnızca sınavda sorulursa diye] Singleton: bir sınıftan TEK bir örnek (instance) "
            "olmasını garanti eden ve ona global tek erişim noktası veren yaratımsal örüntüdür. Bu satır slayttan değildir; "
            "slayta sadık kalmak için ayrı örüntü kartı olarak şişirmedik.", color=ACCENT2)

    # KARIŞTIRILANLAR
    h1(doc, "Birbirine Karıştırılan Örüntüler (Ayırt Etme)", "3.")
    para(doc, "Sınavda en çok puan kaybı buradan olur. Sinyallere göre ayır:")
    table(doc, ["Çift", "Kritik Fark"],
          [[a, b] for a, b in CONFUSE], widths=[5.5, 12.3])

    # BİRLEŞİK — SLIDE 6
    h1(doc, "Tasarım Vakaları – I (Slide 6): 'Hangi Örüntü?'", "4.")
    para(doc, "Hocanın ders içi 6 mini vakası ve ETİKETLEDİĞİ doğru cevaplar (gerekçeli):")
    for baslik, senaryo, cevap in SLIDE6:
        h2(doc, baslik)
        field(doc, "Senaryo", senaryo)
        callout(doc, "ÇÖZÜM:", cevap, color=ACCENT)

    # BİRLEŞİK — SLIDE 15
    h1(doc, "Tasarım Vakaları – II (Slide 15): Birleşik Örüntüler", "5.")
    callout(doc, "DİKKAT:", "Bu vakalar 'bir soruda en az 2 örüntü' kuralının tam örnekleridir. İşaretli (≥2 pattern!) vakalarda birden çok örüntüyü ayrı ayrı gerekçelendir.", color=ACCENT2)
    for baslik, senaryo, cevap in SLIDE15:
        h2(doc, baslik)
        field(doc, "Senaryo", senaryo)
        callout(doc, "ÇÖZÜM:", cevap, color=ACCENT)

    # ÖZET TABLO
    h1(doc, "Tek Bakışta Özet Tablo (16 Örüntü)", "6.")
    rows = []
    for p in PATTERNS:
        kisa = p["tani"].split("→")[0].replace("İpucu:", "").replace("Sınavda ipucu:", "").strip().strip("'")
        rows.append([p["ad"].split(" (")[0], p["kat"].split(" ")[0], kisa[:120]])
    table(doc, ["Örüntü", "Tür", "Anahtar sinyal"], rows, widths=[3.8, 2.6, 11.4])

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc.save(OUT)
    print("KAYDEDILDI:", os.path.abspath(OUT))
    print("Pattern sayisi:", len(PATTERNS), "| Slide6 vaka:", len(SLIDE6), "| Slide15 vaka:", len(SLIDE15))


if __name__ == "__main__":
    build()
