import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Download, Printer, Maximize2, Minimize2 } from "lucide-react";

interface SlideData {
  title: string;
  content: string;
  images?: string[];
}

interface SectionData {
  id: string;
  title: string;
  slides: SlideData[];
}

const img = (file: string, caption: string) =>
  `<figure class="my-3"><img src="/knight-images/${file}" alt="${caption}" class="rounded border max-h-64 mx-auto" /><figcaption class="text-xs text-center text-gray-500 mt-1">${caption}</figcaption></figure>`;

const img2 = (f1: string, c1: string, f2: string, c2: string) =>
  `<div class="grid grid-cols-2 gap-3 my-3">
    <figure><img src="/knight-images/${f1}" alt="${c1}" class="rounded border w-full max-h-52 object-contain" /><figcaption class="text-xs text-center text-gray-500 mt-1">${c1}</figcaption></figure>
    <figure><img src="/knight-images/${f2}" alt="${c2}" class="rounded border w-full max-h-52 object-contain" /><figcaption class="text-xs text-center text-gray-500 mt-1">${c2}</figcaption></figure>
  </div>`;

const img3 = (f1: string, c1: string, f2: string, c2: string, f3: string, c3: string) =>
  `<div class="grid grid-cols-3 gap-2 my-3">
    <figure><img src="/knight-images/${f1}" alt="${c1}" class="rounded border w-full max-h-44 object-contain" /><figcaption class="text-xs text-center text-gray-500 mt-1">${c1}</figcaption></figure>
    <figure><img src="/knight-images/${f2}" alt="${c2}" class="rounded border w-full max-h-44 object-contain" /><figcaption class="text-xs text-center text-gray-500 mt-1">${c2}</figcaption></figure>
    <figure><img src="/knight-images/${f3}" alt="${c3}" class="rounded border w-full max-h-44 object-contain" /><figcaption class="text-xs text-center text-gray-500 mt-1">${c3}</figcaption></figure>
  </div>`;

const SECTIONS: SectionData[] = [
  {
    id: "cover",
    title: "Kapak ve Giriş",
    slides: [
      {
        title: "ADLİ PATOLOJİDE KÜNT TRAVMA",
        content: `<div class="text-center mt-4">
          <p class="text-3xl font-bold mb-3">ADLİ PATOLOJİDE KÜNT TRAVMA</p>
          <p class="text-xl mb-1">KAPSAMLI AKADEMİK REHBER</p>
          <p class="text-lg text-gray-500 mb-6">Yaralar, Tanımlar ve Künt Cisimler</p>
          <div class="border-t-2 border-b-2 border-gray-300 py-4 my-4 mx-auto max-w-lg">
            <p class="font-semibold">Referans:</p>
            <p class="italic">DiMaio's Forensic Pathology</p>
            <p class="italic">Knight's Forensic Pathology (4th Ed.)</p>
            <p class="text-sm mt-2">Bölüm: Blunt Force Injury</p>
          </div>
          <p class="text-sm text-gray-500 mt-6">MART 2026</p>
        </div>`,
      },
      {
        title: "Ön Söz ve Üç Kademe Eğitim Modeli",
        content: `<div class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p class="font-bold text-blue-700 dark:text-blue-300 text-center text-lg mb-2">I</p>
              <p class="font-semibold text-center mb-2">Temel Kavramlar</p>
              <p class="text-sm">Yara tanımları, mekanizmalar ve fiziksel temeller.</p>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p class="font-bold text-green-700 dark:text-green-300 text-center text-lg mb-2">II</p>
              <p class="font-semibold text-center mb-2">İleri Analiz</p>
              <p class="text-sm">İHK, moleküler yöntemler ve yaş tayini teknikleri.</p>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <p class="font-bold text-purple-700 dark:text-purple-300 text-center text-lg mb-2">III</p>
              <p class="font-semibold text-center mb-2">Akademik Derinlik</p>
              <p class="text-sm">Biyomekanik modelleme, FEA ve Daubert kriterleri.</p>
            </div>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded border text-sm">
            <p><strong>Akademik Yaklaşım:</strong> Bu sunum, adli patolojinin en geniş alanlarından biri olan künt travmayı, sadece morfolojik gözlemle değil, fiziksel prensipler ve moleküler kanıtlarla bütünleştiren kapsamlı bir rehberdir.</p>
            <p class="mt-2"><strong>Referans Standartları:</strong> Tüm bilimsel veriler APA 7 formatında atıflandırılmış olup, DiMaio's Forensic Pathology ve Knight's Forensic Pathology temel alınmıştır.</p>
          </div>
        </div>`,
      },
    ],
  },
  {
    id: "section1",
    title: "Bölüm 1: Giriş ve Temel Kavramlar (S3–S15)",
    slides: [
      {
        title: "S3: Künt Travma Tanımı ve Mekanik Enerji Aktarımı",
        content: `<div class="space-y-3">
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500">
            <p class="font-bold text-lg">Künt Travma Nedir?</p>
            <p>Keskin olmayan (künt) bir cismin vücut yüzeyine çarpması veya vücudun böyle bir yüzeye çarpması sonucu mekanik enerjinin dokulara aktarılmasıdır.</p>
          </div>
          <div class="text-sm space-y-1">
            <p><strong>Kritik Özellikler:</strong></p>
            <ul class="list-disc pl-5 space-y-1">
              <li>Cilt bütünlüğü korunabilir veya bozulabilir.</li>
              <li>Enerji transferi doku ezilmesi, gerilmesi veya yırtılmasına yol açar.</li>
              <li>En sık görülen adli travma türüdür.</li>
            </ul>
          </div>
          ${img("ch4-000.png", "Fig 4.1 — Types of injury to the skin (Knight, Ch.4)")}
          <p class="text-xs italic bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">WHO Verileri: Travmatik ölümlerin yaklaşık %60-70'i künt travma kaynaklıdır. En sık nedenler: Trafik kazaları, yüksekten düşmeler ve darp vakalarıdır.</p>
        </div>`,
      },
      {
        title: "S4: Epidemiyoloji: Travmatik Ölümlerin Küresel Dağılımı",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-3 gap-3">
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border">
              <p class="font-semibold">Cinsiyet Faktörü</p>
              <p class="text-sm">Erkek/kadın oranı ≈ 3:1. Riskli davranışlar, mesleki maruziyet ve şiddet olaylarındaki farklılıklar.</p>
            </div>
            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded border">
              <p class="font-semibold">Sosyo-Ekonomik Etki</p>
              <p class="text-sm">Gelişmekte olan ülkelerde trafik kazaları ilk sırada; gelişmiş ülkelerde yaşlı nüfustaki ev içi düşmeler önemli mortalite nedeni.</p>
            </div>
            <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border">
              <p class="font-semibold">Zamanlama</p>
              <p class="text-sm">Hafta sonları ve gece saatlerinde (alkol ve hız faktörüyle) insidans pik yapar.</p>
            </div>
          </div>
          <p class="text-xs italic">Kaynak: Global Burden of Disease Study (2022) verileri temel alınmıştır.</p>
        </div>`,
      },
      {
        title: "S5: Temel Fizik I: Kuvvet ve İvme İlişkisi",
        content: `<div class="space-y-3">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border text-center">
            <p class="text-3xl font-bold font-mono">F = m × a</p>
            <p class="font-semibold mt-1">Newton'un İkinci Hareket Yasası</p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border"><p class="font-bold">Kütle (m):</p><p>Vuran cismin ağırlığı arttıkça, aynı ivme ile daha büyük bir kuvvet (F) dokuya aktarılır.</p></div>
            <div class="p-3 rounded border"><p class="font-bold">İvme (a):</p><p>Hızdaki değişim oranıdır. Darbe anındaki ani durma (negatif ivme), kuvvetin şiddetini belirler.</p></div>
          </div>
          <div class="p-3 rounded border bg-yellow-50 dark:bg-yellow-900/20 text-sm">
            <p><strong>Adli Örnek: Yumruk vs. Sopa</strong></p>
            <p>Bir yumruk darbesinde kütle sınırlıdır. Ağır bir demir sopa kullanıldığında, kütle artışı nedeniyle aynı hızda bile kemik kırığı oluşturabilecek kuvvet değerlerine ulaşılır.</p>
          </div>
          <p class="text-xs italic">Referans: Knight's Forensic Pathology, 4th Edition.</p>
        </div>`,
      },
      {
        title: "S6: Temel Fizik II: Basınç ve Alan İlişkisi",
        content: `<div class="space-y-3">
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border text-center">
            <p class="text-3xl font-bold font-mono">P = F / A</p>
            <p class="font-semibold mt-1">Basınç, Kuvvet ve Alan İlişkisi</p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border"><p class="font-bold">Alan (A):</p><p>Kuvvetin yayıldığı yüzey alanı arttıkça, birim alana düşen basınç (P) azalır.</p></div>
            <div class="p-3 rounded border"><p class="font-bold">Basınç (P):</p><p>Dokunun direncini aşan basınç, yara oluşumunun temel belirleyicisidir.</p></div>
          </div>
          <div class="p-3 rounded border text-sm">
            <p><strong>Künt vs. Kesici Yara Farkı:</strong> Kesici aletlerde alan çok küçüktür (bıçak ucu), az kuvvetle devasa basınçlar oluşur → doku kesilir. Künt cisimlerde alan geniştir → doku ezilir veya yırtılır.</p>
          </div>
          <p class="text-xs italic">Aynı kuvvetle vurulan bir sopa (geniş alan) ekimoz oluştururken, bir çekiç ucu (dar alan) laserasyon veya çökme kırığına yol açar.</p>
        </div>`,
      },
      {
        title: "S7: Temel Fizik III: Kinetik Enerji ve Hız Faktörü",
        content: `<div class="space-y-3">
          <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border text-center">
            <p class="text-3xl font-bold font-mono">E = ½mv²</p>
            <p class="font-semibold mt-1">Kinetik Enerji Formülü</p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border"><p class="font-bold">Hız (v):</p><p>Enerji, hızın <strong>karesiyle</strong> doğru orantılıdır. Hızın iki katına çıkması, enerjiyi dört katına çıkarır.</p></div>
            <div class="p-3 rounded border"><p class="font-bold">Kütle (m):</p><p>Enerji, kütle ile doğru orantılıdır. Ancak hızın etkisi kütleden çok daha baskındır.</p></div>
          </div>
          <div class="p-3 rounded border bg-yellow-50 dark:bg-yellow-900/20 text-sm">
            <p><strong>Adli Örnek — Trafik Kazası:</strong> 50 km/h hızla giden bir aracın yayaya aktardığı enerji, 25 km/h hızla giden aracın aktardığı enerjinin <strong>4 katıdır</strong>. Bu karesel artış, ölümcül yaralanmaların neden hızla arttığını açıklar.</p>
          </div>
          <p class="text-xs italic">Referans: Forensic Biomechanics, Kranioti et al.</p>
        </div>`,
      },
      {
        title: "S8: Künt Cisim Türleri: Geniş Düz Yüzeyler",
        content: `<div class="space-y-3">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
            <p class="font-bold">Geniş Düz Yüzey</p>
            <p class="text-sm">Tahta parçaları, zemin, duvar veya geniş metal levhalar gibi yüzey alanı büyük olan cisimlerdir.</p>
          </div>
          <p class="text-sm"><strong>Fiziksel Etki:</strong> Kuvvet geniş alana yayıldığı için birim alana düşen basınç düşüktür. Doku kesilme yerine yaygın ezilme ve morarmaya yol açar.</p>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="p-2 rounded border text-center"><p class="font-semibold">Yaygın Ekimozlar</p><p class="text-xs">Sınırları belirsiz geniş morluklar</p></div>
            <div class="p-2 rounded border text-center"><p class="font-semibold">Yüzeyel Abrazyonlar</p><p class="text-xs">Geniş alanlı sürtünme sıyrıkları</p></div>
            <div class="p-2 rounded border text-center"><p class="font-semibold">Lineer Kırıklar</p><p class="text-xs">Çökme yerine çizgisel kırıklar</p></div>
          </div>
          ${img("ch4-001.png", "Fig 4.2 — General structure of skin (Knight, Ch.4)")}
        </div>`,
      },
      {
        title: "S9: Künt Cisim Türleri: Dar Düz ve Silindirik Cisimler",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded border bg-orange-50 dark:bg-orange-900/20">
              <p class="font-bold">Dar Düz Cisimler</p>
              <p class="text-sm">Kemer, cetvel, tahta çıta. Paternli yaralanmalar oluştururlar.</p>
            </div>
            <div class="p-3 rounded border bg-red-50 dark:bg-red-900/20">
              <p class="font-bold">Silindirik Cisimler</p>
              <p class="text-sm">Sopa, demir boru, beyzbol sopası. "Tramvay hattı" ekimozu için karakteristik.</p>
            </div>
          </div>
          ${img2("ch4-014.png", "Fig 4.19 — Tramline bruising from cylindrical object (Knight)", "ch4-015.png", "Fig 4.20 — Bruises from a broom handle beating (Knight)")}
          <div class="p-3 rounded border text-sm">
            <p><strong>Tramvay Hattı (Railway) Ekimozu:</strong> Silindirik cisimle vurulduğunda, darbe merkezindeki kan çevreye itilir → iki paralel mor çizgi oluşur. Ortadaki soluk alan darbe merkezidir.</p>
            <p class="mt-1"><strong>Negatif Görüntü (Patterned):</strong> Kemer tokası veya ayakkabı tabanı gibi desenli yüzeylerin deri üzerine ters kopya gibi mühürlenmesidir.</p>
          </div>
        </div>`,
      },
      {
        title: "S10: Künt Cisim Türleri: Küresel ve Köşeli Cisimler",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded border bg-purple-50 dark:bg-purple-900/20">
              <p class="font-bold">Küresel Cisimler</p>
              <p class="text-sm">Taş, yumruk, çekiç ucu. Odaklanmış yaralanmalar oluştururlar.</p>
            </div>
            <div class="p-3 rounded border bg-red-50 dark:bg-red-900/20">
              <p class="font-bold">Köşeli Cisimler</p>
              <p class="text-sm">Tuğla, masa köşesi, mermer blok. Karakteristik "stellate" (yıldız) laserasyonlar oluştururlar.</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="p-2 rounded border text-center"><p class="font-semibold">Odaklanmış Ekimozlar</p><p class="text-xs">Merkezde yoğun, kenarlara azalan</p></div>
            <div class="p-2 rounded border text-center"><p class="font-semibold">Stellate Laserasyonlar</p><p class="text-xs">Merkezden çevreye yırtılma</p></div>
            <div class="p-2 rounded border text-center"><p class="font-semibold">Depresyon Kırıkları</p><p class="text-xs">Cisim şeklini taşıyan çökme</p></div>
          </div>
          ${img("ch4-020.png", "Fig 4.25 — Laceration of the forehead with surrounding abrasion collar (Knight, Ch.4)")}
        </div>`,
      },
      {
        title: "S11: Temel Lezyon Tipleri: Abrazyon (Sıyrık) Mekanizması",
        content: `<div class="space-y-3">
          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-500">
            <p class="font-bold">Abrazyon (Sıyrık)</p>
            <p class="text-sm">Deri yüzeyinin (epidermis) mekanik bir kuvvetle soyulması veya aşınmasıdır. Künt travmanın en yüzeysel lezyonudur.</p>
          </div>
          ${img2("ch4-002.png", "Fig 4.3 — Simple abrasion of the skin (Knight)", "ch4-003.png", "Fig 4.4 — Linear abrasion or 'graze' (Knight)")}
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="p-2 rounded border"><p class="font-semibold">Sürtünme (Friction)</p><p class="text-xs">Teğetsel kuvvet, epitelyal taglar darbe yönünü gösterir</p></div>
            <div class="p-2 rounded border"><p class="font-semibold">Bası (Compression)</p><p class="text-xs">Dikey bası, cisim deseni mühürlenir</p></div>
            <div class="p-2 rounded border"><p class="font-semibold">Darbe (Impact)</p><p class="text-xs">Ani çarpma, kemik çıkıntıları üzerinde</p></div>
          </div>
        </div>`,
      },
      {
        title: "S12: Temel Lezyon Tipleri: Ekimoz (Kontüzyon) Patofizyolojisi",
        content: `<div class="space-y-3">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
            <p class="font-bold">Ekimoz (Morluk)</p>
            <p class="text-sm">Deri altındaki damarların yırtılması sonucu kanın doku aralıklarına sızmasıdır. Cilt bütünlüğü korunmuştur.</p>
          </div>
          ${img("ch4-011.png", "Fig 4.16 — Bruising on the upper arm, typical of forceful gripping (Knight, Ch.4)")}
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="p-2 rounded border text-center"><p class="font-semibold">Damar Yırtılması</p><p class="text-xs">Kapiller ve venüller ezilerek yırtılır</p></div>
            <div class="p-2 rounded border text-center"><p class="font-semibold">Ekstravazasyon</p><p class="text-xs">Kan interstisyel alana sızar</p></div>
            <div class="p-2 rounded border text-center"><p class="font-semibold">Renk Değişimi</p><p class="text-xs">Mor → mavi → yeşil → sarı</p></div>
          </div>
          <p class="text-xs italic">Ekimozlar, darbe yerini her zaman göstermez (gravitasyonel göç) ve yaş tayini için dikkatli değerlendirilmelidir.</p>
        </div>`,
      },
      {
        title: "S13: Temel Lezyon Tipleri: Laserasyon (Yırtık) ve Doku Köprüleri",
        content: `<div class="space-y-3">
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-500">
            <p class="font-bold">Laserasyon (Yırtık)</p>
            <p class="text-sm">Künt bir kuvvetin etkisiyle derinin tam kat (epidermis + dermis) yırtılmasıdır. En şiddetli künt yara türüdür.</p>
          </div>
          ${img2("ch4-023.png", "Fig 4.28 — Laceration of the scalp from a blunt weapon (Knight)", "ch4-024.png", "Fig 4.29 — Laceration of the scalp from a 30cm long weapon (Knight)")}
          <div class="p-3 rounded border bg-yellow-50 dark:bg-yellow-900/20 text-sm">
            <p><strong>Doku Köprüleri (Altın Standart):</strong> Yaranın derinliğinde sinirler, damarlar ve bağ dokusu lifleri kopmadan kalabilir. Bu bulgu, yaranın künt bir cisimle oluştuğunun kesin kanıtıdır.</p>
          </div>
          <p class="text-xs italic">İnsizyon (kesici alet yarası) ile ayırıcı tanı: Doku köprüsü yok, yara kenarları düzgün ve temiz.</p>
        </div>`,
      },
      {
        title: "S14: Temel Lezyon Tipleri: Fraktür (Kırık) ve Kemik Biyomekaniği",
        content: `<div class="space-y-3">
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-purple-500">
            <p class="font-bold">Fraktür (Kırık)</p>
            <p class="text-sm">Kemik dokusunun mekanik bir kuvvet altında bütünlüğünün bozulmasıdır. Künt travmanın en derin lezyonudur.</p>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="p-2 rounded border text-center"><p class="font-semibold">Kompresyon</p><p class="text-xs">Omurga çökme kırıkları</p></div>
            <div class="p-2 rounded border text-center"><p class="font-semibold">Tensile (Gerilme)</p><p class="text-xs">Avülsiyon kırıkları</p></div>
            <div class="p-2 rounded border text-center"><p class="font-semibold">Bükülme/Burulma</p><p class="text-xs">Spiral ve oblik kırıklar</p></div>
          </div>
          <p class="text-sm"><strong>Puppe Kuralı:</strong> Kırık hatlarının analizi, darbe sırasını ve yönünü belirlemede hayati önem taşır.</p>
        </div>`,
      },
      {
        title: "S15: Bölüm Özeti: Giriş ve Temel Kavramlar Analizi",
        content: `<div class="space-y-3">
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
            <p class="font-bold">Kritik Çıkarımlar</p>
            <p class="text-sm">Künt travma, mekanik enerjinin (F=ma, E=½mv²) dokulara aktarılmasıdır. Basınç (P=F/A), yara tipini belirleyen en temel fiziksel değişkendir.</p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border"><p class="font-semibold">Lezyon Hiyerarşisi</p><p>Abrazyon (en yüzeysel) → Ekimoz → Laserasyon → Fraktür (en derin). Doku köprüleri, laserasyonun künt travma kaynaklı olduğunun altın standart kanıtıdır.</p></div>
            <div class="p-3 rounded border"><p class="font-semibold">Akademik Hedef</p><p>Temel fiziksel prensipleri, histopatolojik ve moleküler verilerle birleştirerek Daubert standartlarına uygun bilirkişi raporları hazırlamak.</p></div>
          </div>
          ${img("ch4-026.png", "Fig 4.31 — Crushing impact of blunt object on skin overlying bone (Knight, Ch.4)")}
        </div>`,
      },
    ],
  },
  {
    id: "section2",
    title: "Bölüm 2: Abrazyonlar (S16–S25)",
    slides: [
      {
        title: "S16: Abrazyon Tanımı ve Epidermal Mekanik Soyulma",
        content: `<div class="space-y-3">
          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-500">
            <p class="font-bold">Abrazyon (Sıyrık)</p>
            <p class="text-sm">Epidermisin mekanik bir kuvvetle soyulması veya aşınmasıdır. Künt travmanın en sık görülen lezyonudur.</p>
          </div>
          ${img("ch4-002.png", "Fig 4.3 — Simple abrasion caused by a glancing blow (Knight, Ch.4)")}
          <div class="text-sm space-y-1">
            <p><strong>Temel Özellikler:</strong> Epidermis bütünlüğü bozulmuş, dermis korunmuş, kanama minimal.</p>
            <p><strong>Eksüdasyon ve Kabuk:</strong> Yüzeyden sızan serum ve minimal kan kuruyarak kabuk (krut) oluşturur.</p>
          </div>
        </div>`,
      },
      {
        title: "S17: Sürtünme Abrazyonu: Teğetsel Kayış ve Epitelyal Taglar",
        content: `<div class="space-y-3">
          <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border-l-4 border-orange-500">
            <p class="font-bold">Sürtünme Abrazyonu</p>
            <p class="text-sm">Deri yüzeyinin teğetsel (açılı) bir kuvvetle pürüzlü bir yüzeye sürtünmesi sonucu oluşur. En sık görülen abrazyon tipidir.</p>
          </div>
          ${img2("ch4-004.png", "Fig 4.5 — Direction of impact in tangential abrasion showing epidermal tags (Knight)", "ch4-005.png", "Fig 4.6 — Brush abrasion / grazes from skidding (Knight)")}
          <div class="p-3 rounded border text-sm">
            <p><strong>Epitelyal Taglar (Altın Standart):</strong> Deri yüzeyinden kopan küçük parçacıklar, darbenin bittiği yöne doğru yığılır. Darbe yönünü belirlemede en güvenilir bulgudur.</p>
            <p class="mt-1"><strong>Yol Sıyrıkları (Road Rash):</strong> Trafik kazalarında vücudun asfalt üzerinde sürüklenmesi sonucu oluşan yaygın sürtünme abrazyonlarıdır.</p>
          </div>
        </div>`,
      },
      {
        title: "S18: Bası Abrazyonu: Cisim Deseni ve Negatif Görüntü",
        content: `<div class="space-y-3">
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-purple-500">
            <p class="font-bold">Bası Abrazyonu</p>
            <p class="text-sm">Cismin deri üzerine dikey olarak bastırılması sonucu oluşur. Cismin yüzey özelliklerini deri üzerine mühürler.</p>
          </div>
          ${img2("ch4-008.png", "Fig 4.12 — Patterned abrasions from back edge of a knife (Knight)", "ch4-009.png", "Fig 4.13 — Patterned abrasion on forehead due to falling (Knight)")}
          <div class="p-3 rounded border text-sm">
            <p><strong>Negatif Görüntü:</strong> Kemer tokası, ayakkabı tabanı veya araç lastiği gibi desenli yüzeylerin deri üzerine ters kopya gibi mühürlenmesidir.</p>
            <p class="mt-1"><strong>Alet Tayini:</strong> Bası abrazyonları, vuran cismin "imzası" niteliğindedir ve mahkemede en güçlü kanıtlardan biridir.</p>
          </div>
        </div>`,
      },
      {
        title: "S19: Darbe Abrazyonu: Ani Çarpma ve Ekimoz Kombinasyonu",
        content: `<div class="space-y-3">
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-500">
            <p class="font-bold">Darbe Abrazyonu</p>
            <p class="text-sm">Ani ve dikey bir çarpma sonucu oluşur. Genellikle kemik çıkıntıları üzerinde saptanır.</p>
          </div>
          ${img("ch4-006.png", "Fig 4.7 — Brush abrasion from skidding contact with road surface (Knight, Ch.4)")}
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-2 rounded border"><p class="font-semibold">İntradermal Kanama</p><p class="text-xs">Darbe anında dermis içindeki kapillerden sızıntı eşlik edebilir.</p></div>
            <div class="p-2 rounded border"><p class="font-semibold">Ekimoz Kombinasyonu</p><p class="text-xs">Darbe abrazyonu sıklıkla alttaki ekimozla birlikte saptanır.</p></div>
          </div>
        </div>`,
      },
      {
        title: "S20: Parmak İzi Abrazyonları: Boğma ve Tırnak İzleri Analizi",
        content: `<div class="space-y-3">
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-600">
            <p class="font-bold">Parmak İzi Abrazyonu</p>
            <p class="text-sm">Boğma, sıkma veya kavrama vakalarında parmak uçlarının ve tırnakların deri üzerine bıraktığı hilal şeklindeki izlerdir.</p>
          </div>
          ${img("ch4-007.png", "Fig 4.9 — Abrasions in manual strangulation showing fingernail marks (Knight, Ch.4)")}
          <div class="p-3 rounded border text-sm">
            <p><strong>Lokalizasyon:</strong> Boyun (boğma), üst kol medial yüzü (kavrama), yüz (silkeleme).</p>
            <p><strong>Çocuk İstismarı:</strong> Kavrama izleri çocuk istismarının en erken ve en sık saptanan bulgularından biridir.</p>
          </div>
        </div>`,
      },
      {
        title: "S21: Abrazyon İyileşme Kronolojisi: İlk 24 Saat (Taze Faz)",
        content: `<div class="space-y-3">
          <div class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
            <p class="font-bold">İlk 24 Saat (Taze Faz)</p>
          </div>
          <table class="w-full text-sm border-collapse">
            <thead><tr class="bg-gray-100 dark:bg-gray-800"><th class="border p-2">Süre</th><th class="border p-2">Makroskobik</th><th class="border p-2">Histopatoloji</th></tr></thead>
            <tbody>
              <tr><td class="border p-2 font-semibold">0–6 saat</td><td class="border p-2">Taze, kırmızı, nemli</td><td class="border p-2">Epidermis defekti, fibrin ağı</td></tr>
              <tr><td class="border p-2 font-semibold">6–12 saat</td><td class="border p-2">Hafif kuruma başlar</td><td class="border p-2">Nötrofil göçü başlangıcı</td></tr>
              <tr><td class="border p-2 font-semibold">12–24 saat</td><td class="border p-2">Krut oluşumu başlar</td><td class="border p-2">İnflamatuar hücre infiltrasyonu</td></tr>
            </tbody>
          </table>
        </div>`,
      },
      {
        title: "S22: Abrazyon İyileşme Kronolojisi: 1-14 Gün (Krut ve Re-epitelizasyon)",
        content: `<div class="space-y-3">
          <table class="w-full text-sm border-collapse">
            <thead><tr class="bg-gray-100 dark:bg-gray-800"><th class="border p-2">Süre</th><th class="border p-2">Makroskobik</th><th class="border p-2">Histopatoloji</th></tr></thead>
            <tbody>
              <tr><td class="border p-2 font-semibold">1–3 gün</td><td class="border p-2">Krut kalınlaşır, kahverengi</td><td class="border p-2">Granülasyon dokusu başlangıcı</td></tr>
              <tr><td class="border p-2 font-semibold">3–7 gün</td><td class="border p-2">Krut kenarlardan kalkar</td><td class="border p-2">Re-epitelizasyon kenarlardan merkeze</td></tr>
              <tr><td class="border p-2 font-semibold">7–14 gün</td><td class="border p-2">Krut düşer, pembe alan</td><td class="border p-2">Tam re-epitelizasyon, kollajen</td></tr>
            </tbody>
          </table>
          <p class="text-xs italic">"The dating of abrasions is more reliable than that of bruises" — Knight, Ch.4</p>
        </div>`,
      },
      {
        title: "S23: Postmortem Abrazyon: Parşömenleşme Fenomeni",
        content: `<div class="space-y-3">
          <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border-l-4 border-gray-500">
            <p class="font-bold">Postmortem Abrazyon</p>
            <p class="text-sm">Ölüm sonrası cildin soyulması ve dermisin kuruması sonucu oluşan, parşömen kağıdına benzer sert ve kahverengi bir görünümdür.</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded border border-red-300 bg-red-50 dark:bg-red-900/20">
              <p class="font-bold text-sm">Antemortem</p>
              <ul class="text-xs space-y-1"><li>• Vital reaksiyon (+)</li><li>• İnflamatuar infiltrasyon</li><li>• İntradermal kanama</li><li>• Krut oluşumu</li></ul>
            </div>
            <div class="p-3 rounded border">
              <p class="font-bold text-sm">Postmortem</p>
              <ul class="text-xs space-y-1"><li>• Vital reaksiyon (−)</li><li>• Parşömenleşme</li><li>• Sarımsı-kahve, kuru</li><li>• İnflamasyon yok</li></ul>
            </div>
          </div>
        </div>`,
      },
      {
        title: "S24: Vital Reaksiyon Tayini: Antemortem vs. Postmortem Ayrımı",
        content: `<div class="space-y-3">
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border-l-4 border-green-500">
            <p class="font-bold">Vital Reaksiyon</p>
            <p class="text-sm">Yaranın canlıyken oluştuğunu gösteren biyolojik yanıtlardır. İnflamasyon, kanama ve doku onarımı belirteçleri kullanılır.</p>
          </div>
          <div class="text-sm space-y-2">
            <p><strong>İHK Belirteçleri:</strong> P-Selektin (dakikalar), Fibronektin (saatler), CD15/CD68 (günler)</p>
            <p><strong>Histokimyasal:</strong> Nötrofil estraz, asit fosfataz, serotonin</p>
            <p><strong>Makroskobik:</strong> Yara kenarı retraksiyonu, pıhtı oluşumu, vital kanama hattı</p>
          </div>
        </div>`,
      },
      {
        title: "S25: Abrazyon Derinlik Analizi: Stratum Corneum'dan Dermis'e",
        content: `<div class="space-y-3">
          <p class="text-sm"><strong>Derinlik Analizi:</strong> Abrazyonun derinliği, travma anındaki kuvvet ve cisim geometrisi ile doğru orantılıdır.</p>
          ${img("ch4-001.png", "Fig 4.2 — General structure of skin showing epidermal layers (Knight, Ch.4)")}
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="p-2 rounded border text-center bg-yellow-50 dark:bg-yellow-900/20"><p class="font-semibold">Yüzeysel</p><p class="text-xs">Stratum corneum</p><p class="text-xs">Kanama yok</p></div>
            <div class="p-2 rounded border text-center bg-orange-50 dark:bg-orange-900/20"><p class="font-semibold">Orta</p><p class="text-xs">Stratum basale</p><p class="text-xs">Seröz sızıntı</p></div>
            <div class="p-2 rounded border text-center bg-red-50 dark:bg-red-900/20"><p class="font-semibold">Derin</p><p class="text-xs">Papiller dermis</p><p class="text-xs">Kapiller kanama</p></div>
          </div>
        </div>`,
      },
    ],
  },
  {
    id: "section3",
    title: "Bölüm 3: Laserasyonlar (S26–S40)",
    slides: [
      {
        title: "S26: Laserasyon Fenomenleri I: Shelving ve Darbe Yönü",
        content: `<div class="space-y-3">
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-500">
            <p class="font-bold">Shelving (Rafa Kaldırma) Fenomeni</p>
            <p class="text-sm">Künt bir cisim vücuda eğik açıyla çarptığında, darbe yönündeki kenar altına kıvrılır, karşı kenar undermined olur.</p>
          </div>
          ${img("ch4-026.png", "Fig 4.31 — Crushing impact on skin showing mechanism (Knight, Ch.4)")}
          <p class="text-sm"><strong>Adli Önem:</strong> Shelving, darbenin geliş yönünü ve açısını belirler.</p>
        </div>`,
      },
      {
        title: "S27: Laserasyon Fenomenleri II: Undermining ve Enerji Analizi",
        content: `<div class="space-y-3">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
            <p class="font-bold">Undermining (Doku Oyulması)</p>
            <p class="text-sm">Deri ve deri altı dokunun, alttaki fasyadan geniş alanda ayrılmasıdır. Teğetsel kuvvet etkisiyle oluşur.</p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border"><p class="font-semibold">Enerji İlişkisi</p><p>Undermining alanı, aktarılan enerjinin büyüklüğüyle doğru orantılıdır.</p></div>
            <div class="p-3 rounded border"><p class="font-semibold">Adli Önemi</p><p>Geniş undermining → yüksek enerjili mekanizma (trafik, yüksekten düşme).</p></div>
          </div>
        </div>`,
      },
      {
        title: "S28: Doku Köprülerinin Histopatolojisi: Künt Travmanın İmzası",
        content: `<div class="space-y-3">
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-600">
            <p class="font-bold text-lg">Doku Köprüsü (Tissue Bridge) Nedir?</p>
            <p class="text-sm">Yara tabanında, iki kenar arasında kopmadan kalan sinir, damar ve bağ dokusu lifleridir. Künt travma tanısında tartışmasız altın standarttır.</p>
          </div>
          ${img("ch4-023.png", "Fig 4.28 — Laceration showing tissue bridges across the wound (Knight, Ch.4)")}
          <div class="grid grid-cols-3 gap-2 text-sm text-center">
            <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded">Sinir lifleri</div>
            <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">Kan damarları</div>
            <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">Bağ dokusu</div>
          </div>
        </div>`,
      },
      {
        title: "S29: Organ Hasarı I: Saçlı Deri ve Yüz Yaralanmaları",
        content: `<div class="space-y-3">
          <div class="p-3 rounded border">
            <p class="font-semibold">Saçlı Deri Anatomisi (S.C.A.L.P.)</p>
            <p class="text-sm">Skin → Connective tissue → Aponeurosis (galea) → Loose areolar tissue → Periosteum</p>
          </div>
          ${img2("ch4-021.png", "Fig 4.26 — Simple laceration of the eyebrow (Knight)", "ch4-022.png", "Fig 4.27 — Multiple homicidal lacerations of the forehead (Knight)")}
          <p class="text-sm"><strong>Saçlı Deri Laserasyonları:</strong> Galea nedeniyle damarlar büzülemez → masif kanama riski. Hipovolemik şoka yol açabilir.</p>
        </div>`,
      },
      {
        title: "S30: Organ Hasarı II: Göğüs, Karın ve Ekstremite Laserasyonları",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded border">
              <p class="font-semibold">Torasik Yaralanmalar</p>
              <p class="text-sm">Künt göğüs travması sonrası kaburga kırıkları, pnömotoraks, hemotoraks. Flail chest.</p>
            </div>
            <div class="p-3 rounded border">
              <p class="font-semibold">Abdominal</p>
              <p class="text-sm">Karaciğer ve dalak laserasyonları. Hemoperitoneum → hipovolemik şok.</p>
            </div>
          </div>
          ${img("ch4-027.png", "Fig 4.33 — Transection of body from massive blunt force (Knight, Ch.4)")}
        </div>`,
      },
      {
        title: "S31–33: Laserasyon Adli Uygulamaları ve Dokümantasyon",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border">
              <p class="font-semibold">Paternli Laserasyonlar</p>
              <p>Künt cismin yüzey özellikleri, deri üzerine karakteristik izler bırakır → alet tayini.</p>
            </div>
            <div class="p-3 rounded border">
              <p class="font-semibold">Üç Kademeli Fotoğraflama</p>
              <p>Uzak (lokalizasyon), Orta (ölçekli), Yakın (detay). ABFO ölçeği kullanılmalıdır.</p>
            </div>
          </div>
          ${img2("ch4-024.png", "Fig 4.29 — Laceration showing weapon characteristics (Knight)", "ch4-025.png", "Fig 4.30 — Homicidal lacerations penetrating skull (Knight)")}
        </div>`,
      },
      {
        title: "S34–36: Stellate Laserasyon ve Avülsiyon Yaralanmaları",
        content: `<div class="space-y-3">
          <div class="p-3 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
            <p class="font-bold">Stellate (Yıldızvari) Laserasyon</p>
            <p class="text-sm">Künt cismin vücuda dik açıyla yüksek enerjiyle çarpması sonucu, doku merkezden çevreye doğru birden fazla yönde yırtılır.</p>
          </div>
          ${img("ch4-020.png", "Fig 4.25 — Laceration of forehead with surrounding abrasion collar (Knight, Ch.4)")}
          <div class="p-3 rounded border text-sm">
            <p><strong>Avülsiyon / Degloving:</strong> Deri ve subkutan dokunun geniş alanda kemikten/fasyadan ayrılması. Yüksek enerjili trafik kazaları ve endüstriyel kazalarda.</p>
          </div>
        </div>`,
      },
      {
        title: "S37: Laserasyon Kenar Analizi: Abraded Edges ve Kontüzyon Marjı",
        content: `<div class="space-y-3">
          <div class="text-sm space-y-2">
            <p><strong>Abraded Edges:</strong> Yara dudaklarının künt cisimle sürtünmesi sonucu oluşan epidermal kayıp. Genişliği darbe açısını gösterir.</p>
            <p><strong>Kontüzyon Marjı:</strong> Yara kenarlarındaki damar hasarına bağlı morarma. Kuvvetin doku içindeki yayılım alanını işaret eder.</p>
            <p><strong>Kıl Kökü Analizi:</strong> Laserasyon kenarlarındaki kıl kökleri ezilir ancak kesilmez — kesici alet yaralarından ayrımda kritik.</p>
          </div>
          ${img("ch4-022.png", "Fig 4.27 — Multiple lacerations showing abraded edges (Knight, Ch.4)")}
          <p class="text-xs italic">Kenarlardaki sıyrıkların en geniş olduğu taraf, darbenin vücuda ilk temas ettiği yönü gösterir.</p>
        </div>`,
      },
      {
        title: "S38: Ayırıcı Tanı: Laserasyon vs. İnsizyon Detaylı Karşılaştırma",
        content: `<div class="space-y-3">
          <table class="w-full text-sm border-collapse">
            <thead><tr class="bg-gray-100 dark:bg-gray-800"><th class="border p-2">Özellik</th><th class="border p-2">Laserasyon (Künt)</th><th class="border p-2">İnsizyon (Kesici)</th></tr></thead>
            <tbody>
              <tr><td class="border p-2 font-semibold">Doku Köprüsü</td><td class="border p-2">Mevcut (sinir, damar)</td><td class="border p-2">Yok (tamamen kesilmiş)</td></tr>
              <tr><td class="border p-2 font-semibold">Yara Kenarı</td><td class="border p-2">Düzensiz, tırtıklı</td><td class="border p-2">Düzgün, keskin</td></tr>
              <tr><td class="border p-2 font-semibold">Kenar Sıyrığı</td><td class="border p-2">Mevcut (Abrasions)</td><td class="border p-2">Yok</td></tr>
              <tr><td class="border p-2 font-semibold">Kıl Kökleri</td><td class="border p-2">Ezilmiş ancak sağlam</td><td class="border p-2">Kesilmiş</td></tr>
              <tr><td class="border p-2 font-semibold">Yara Tabanı</td><td class="border p-2">Düzensiz, kaba</td><td class="border p-2">Düzgün, temiz</td></tr>
              <tr><td class="border p-2 font-semibold">Deri Altı Kanama</td><td class="border p-2">Geniş (ekimoz)</td><td class="border p-2">Minimal</td></tr>
            </tbody>
          </table>
          <p class="text-xs italic"><strong>Altın Standart:</strong> Doku köprülerinin varlığı, yaralanmanın kesinlikle künt cisimle meydana geldiğinin göstergesidir. Saçlı derideki laserasyonlar bazen insizyonu taklit edebilir; büyüteç ile inceleme yapılmalıdır.</p>
        </div>`,
      },
      {
        title: "S39–40: Laserasyon Komplikasyonları ve Bölüm Özeti",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="p-2 rounded border bg-red-50 dark:bg-red-900/20"><p class="font-semibold">Akut Kanama/Şok</p><p class="text-xs">Saçlı deri laserasyonları → galea nedeniyle damarlar büzülemez → masif kanama</p></div>
            <div class="p-2 rounded border bg-yellow-50 dark:bg-yellow-900/20"><p class="font-semibold">Enfeksiyon/Sepsis</p><p class="text-xs">Yabancı cisimler (asfalt, cam, toprak) → lokal enfeksiyondan sepsise</p></div>
            <div class="p-2 rounded border bg-purple-50 dark:bg-purple-900/20"><p class="font-semibold">Kalıcı Skar</p><p class="text-xs">Düzensiz kenarlar → hipertrofik skar veya keloid. Yüzde "sabit iz"</p></div>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded border text-sm">
            <p class="font-bold">Bölüm Özeti — Kritik Çıkarımlar:</p>
            <ul class="list-disc pl-5 space-y-1 mt-1">
              <li><strong>Doku Köprüleri:</strong> Künt travma tanısında tartışmasız altın standart</li>
              <li><strong>Shelving & Undermining:</strong> Darbe yönü ve enerji düzeyi hakkında fiziksel kanıt</li>
              <li><strong>Alet Tayini:</strong> Paternli yaralar, suç aletinin geometrisini doğrudan yansıtabilir</li>
              <li><strong>Pratik:</strong> Her zaman ölçekli fotoğraflama yapın ve yara kenarlarını büyüteçle inceleyin</li>
            </ul>
          </div>
        </div>`,
      },
    ],
  },
  {
    id: "section4",
    title: "Bölüm 4: Ekimoz / Kontüzyon (S41–S65)",
    slides: [
      {
        title: "S41: Ekimoz Tanımı ve Mikroskobik Damar Patolojisi",
        content: `<div class="space-y-3">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
            <p class="font-bold">Ekimoz (Kontüzyon) Nedir?</p>
            <p class="text-sm">Künt kuvvetin etkisiyle, deri bütünlüğü bozulmadan, deri altındaki kılcal damarların yırtılması sonucu kanın doku aralıklarına sızmasıdır.</p>
          </div>
          ${img("ch4-010.png", "Fig 4.14 — Intradermal bruising showing the pattern of the weapon (Knight, Ch.4)")}
          <div class="text-sm space-y-1">
            <p><strong>Damar Rüptürü:</strong> Mekanik basınç, damar endotelini ve bazal membranı parçalar.</p>
            <p><strong>Eritrosit Ekstravazasyonu:</strong> Alyuvarlar interstisyel alana dağılır.</p>
            <p><strong>Vital Reaksiyon:</strong> Canlıda kan basıncı olduğu için sızıntı devam eder; vitalite kanıtıdır.</p>
          </div>
        </div>`,
      },
      {
        title: "S42: Ekimoz Sınıflandırması: Peteşi, Purpura ve Hematom",
        content: `<div class="space-y-3">
          <table class="w-full text-sm border-collapse">
            <thead><tr class="bg-gray-100 dark:bg-gray-800"><th class="border p-2">Terim</th><th class="border p-2">Boyut</th><th class="border p-2">Özellik</th></tr></thead>
            <tbody>
              <tr><td class="border p-2 font-semibold">Peteşi</td><td class="border p-2">&lt; 2 mm</td><td class="border p-2">Noktasal, kapiller kanama</td></tr>
              <tr><td class="border p-2 font-semibold">Purpura</td><td class="border p-2">2 mm – 1 cm</td><td class="border p-2">Daha geniş, birleşme eğilimli</td></tr>
              <tr><td class="border p-2 font-semibold">Ekimoz</td><td class="border p-2">&gt; 1 cm</td><td class="border p-2">Tipik morluk, yaygın sızıntı</td></tr>
              <tr><td class="border p-2 font-semibold">Hematom</td><td class="border p-2">Kitle etkisi</td><td class="border p-2">Doku içinde kan birikmesi</td></tr>
            </tbody>
          </table>
          ${img("ch4-013.png", "Fig 4.15 — Multiple bruises on the trunk of a child abuse victim (Knight, Ch.4)")}
        </div>`,
      },
      {
        title: "S43: Ekimoz Oluşumunu Etkileyen Bireysel Faktörler",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border"><p class="font-semibold">Yaş Faktörü</p><p>Çocuklarda ve yaşlılarda damar duvarı desteği zayıf → minimal kuvvetle geniş ekimozlar.</p></div>
            <div class="p-3 rounded border"><p class="font-semibold">Cinsiyet ve Deri Yapısı</p><p>Kadınlarda deri altı yağ dokusunun fazlalığı, ekimoza yatkınlığı artırır.</p></div>
            <div class="p-3 rounded border"><p class="font-semibold">İlaçlar ve Hastalıklar</p><p>Aspirin, warfarin, hemofili ekimoz boyutunu orantısız artırır.</p></div>
            <div class="p-3 rounded border"><p class="font-semibold">Doku Gevşekliği</p><p>Göz çevresi gibi gevşek dokularda kan kolay yayılır, geniş ekimozlar oluşur.</p></div>
          </div>
          <p class="text-xs italic bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded"><strong>Adli Uyarı:</strong> "Büyük ekimoz = Büyük kuvvet" denklemi her zaman doğru değildir; bireysel faktörler mutlaka gözetilmelidir.</p>
        </div>`,
      },
      {
        title: "S44: Ekimozda Renk Değişimi: Hemoglobin Yıkımının Biyokimyası",
        content: `<div class="space-y-3">
          <div class="space-y-2">
            <div class="flex items-center gap-3 p-2 rounded" style="background:rgba(220,20,60,0.12)"><div class="w-10 h-10 rounded-full flex-shrink-0" style="background:crimson"></div><div><p class="font-semibold text-sm">Hemoglobin: Kırmızı/Mavi-Mor (Taze)</p><p class="text-xs">Heme Oxygenase enzimi ile dönüşüm başlar</p></div></div>
            <div class="flex items-center gap-3 p-2 rounded" style="background:rgba(0,128,0,0.12)"><div class="w-10 h-10 rounded-full flex-shrink-0" style="background:green"></div><div><p class="font-semibold text-sm">Biliverdin: Yeşil (Orta Faz)</p><p class="text-xs">Biliverdin Reductase enzimi devreye girer</p></div></div>
            <div class="flex items-center gap-3 p-2 rounded" style="background:rgba(218,165,32,0.12)"><div class="w-10 h-10 rounded-full flex-shrink-0" style="background:goldenrod"></div><div><p class="font-semibold text-sm">Bilirubin: Sarı (Geç Faz)</p><p class="text-xs">Hemosiderin: Kahverengi (İyileşme Sonu)</p></div></div>
          </div>
          <p class="text-xs italic bg-red-50 dark:bg-red-900/20 p-2 rounded"><strong>Sarı renk</strong>, genellikle travmadan 18-24 saat sonra ortaya çıkar ve yaş tayininde en güvenilir belirteçtir. Knight: "The ageing of bruises by colour is extremely unreliable"</p>
        </div>`,
      },
      {
        title: "S45–50: Tramline Ekimozu ve Özel Ekimoz Paternleri",
        content: `<div class="space-y-3">
          ${img2("ch4-014.png", "Fig 4.19 — Formation of tramline bruising from cylindrical object (Knight)", "ch4-015.png", "Fig 4.20 — Bruises from beating with a broom handle (Knight)")}
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border bg-blue-50 dark:bg-blue-900/20">
              <p class="font-bold">Tramvay Hattı Ekimozu</p>
              <p>Silindirik cisim çarpması → paralel iki hat, arası soluk. Cisim temas noktasında damarlar komprese olur, kan laterale sızar.</p>
            </div>
            <div class="p-3 rounded border bg-purple-50 dark:bg-purple-900/20">
              <p class="font-bold">Parmak Ucu (Grip) Ekimozları</p>
              <p>Kavrama/sıkma → oval 1-2 cm çaplı ekimozlar. Boğma vakalarında boyunda. Çocuk istismarında üst kolda.</p>
            </div>
          </div>
          ${img("ch4-011.png", "Fig 4.16 — Bruising on the upper arm, typical of forceful gripping (Knight, Ch.4)")}
        </div>`,
      },
      {
        title: "S51–55: Gravitasyonel Göç ve Paradoksal Ekimozlar",
        content: `<div class="space-y-3">
          <div class="p-3 rounded border bg-yellow-50 dark:bg-yellow-900/20 text-sm">
            <p class="font-bold">Gravitasyonel Migrasyon</p>
            <p>Ekimoz, oluştuğu yerden yer çekimi etkisiyle fasyal planlar boyunca aşağıya göç edebilir. Periorbital ekimoz → yanak; frontal kontüzyon → göz çevresi (raccoon eyes).</p>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="p-2 rounded border text-center"><p class="font-semibold">Battle Belirtisi</p><p class="text-xs">Mastoid bölge → kafa tabanı kırığı</p></div>
            <div class="p-2 rounded border text-center"><p class="font-semibold">Cullen</p><p class="text-xs">Periumbilikal → karın içi kanama</p></div>
            <div class="p-2 rounded border text-center"><p class="font-semibold">Grey-Turner</p><p class="text-xs">Flank → retroperitoneal kanama</p></div>
          </div>
          ${img("ch4-017.png", "Fig 4.22 — A black eye (periorbital haematoma) showing gravitational spread (Knight, Ch.4)")}
        </div>`,
      },
      {
        title: "S56–60: Darp ve Yüz Ekimozları",
        content: `<div class="space-y-3">
          ${img2("ch4-012.png", "Fig 4.17 — Kicking and stamping injury to the face (Knight)", "ch4-013.png", "Fig 4.18 — Extensive bruising of the face from hitting (Knight)")}
          <div class="p-3 rounded border text-sm">
            <p><strong>Yüz Ekimozları:</strong> Yüz bölgesi gevşek subkutan dokusu nedeniyle geniş ekimozlara yatkındır. Periorbital, labial ve aurikuler ekimozlar darp şüphesi uyandırır.</p>
            <p class="mt-1"><strong>Dudak Laserasyonu:</strong> Yumruk darbesi ile iç yüzde diş kenarlarına karşı laserasyon oluşur.</p>
          </div>
          ${img("ch4-018.png", "Fig 4.23 — Bruising of the interior of the lip from a blow (Knight, Ch.4)")}
        </div>`,
      },
      {
        title: "S61–65: Bölüm Özeti — Ekimoz Analizi ve Adli Çıkarımlar",
        content: `<div class="space-y-3">
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
            <p class="font-bold">Kritik Çıkarımlar</p>
            <ul class="text-sm list-disc pl-5 space-y-1 mt-1">
              <li>Ekimoz, darbenin şiddeti ve vuran cismin yüzey özellikleri hakkında ipuçları sağlar</li>
              <li>Renk değişimi ile yaş tayini güvenilmezdir; yalnızca sarı renk &ge;18 saat göstergesidir</li>
              <li>Tramline ekimozu silindirik cisim, patterned ekimoz alet tayini için en değerli</li>
              <li>Gravitasyonel göç, darbenin gerçek lokalizasyonunu maskeleyebilir</li>
              <li>Bireysel faktörler (yaş, cinsiyet, ilaç) mutlaka değerlendirilmelidir</li>
            </ul>
          </div>
          ${img("ch4-016.png", "Fig 4.21 — Suction marks showing patterned bruising (Knight, Ch.4)")}
        </div>`,
      },
    ],
  },
  {
    id: "section5",
    title: "Bölüm 5: Kemik Kırıkları (S66–S85)",
    slides: [
      {
        title: "S66: Kemik Biyomekaniği ve Kırık Mekanizmaları",
        content: `<div class="space-y-3">
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-purple-500">
            <p class="font-bold">Kemik Biyomekaniği</p>
            <p class="text-sm">Kemik, anizotropik ve viskoelastik bir biyomateriyaldir. Üzerine binen yükün türü, yönü ve hızı kırık paternini belirler.</p>
          </div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="p-2 rounded border"><p class="font-semibold">Kompresyon</p><p class="text-xs">Vertebra burst, kalkaneus kırığı</p></div>
            <div class="p-2 rounded border"><p class="font-semibold">Tensile (Çekme)</p><p class="text-xs">Avülsiyon kırıkları</p></div>
            <div class="p-2 rounded border"><p class="font-semibold">Bükülme</p><p class="text-xs">Transvers kırık, butterfly fragment</p></div>
            <div class="p-2 rounded border"><p class="font-semibold">Torsion</p><p class="text-xs">Spiral kırık (uzun kemikler)</p></div>
          </div>
        </div>`,
      },
      {
        title: "S67–68: Kafatası Kırıkları: Lineer, Depresyon ve Komminüte",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="p-2 rounded border bg-blue-50 dark:bg-blue-900/20 text-center"><p class="font-bold">Lineer Kırık</p><p class="text-xs">Geniş yüzey + orta enerji. Epidural hematom riski. Temporal bölge.</p></div>
            <div class="p-2 rounded border bg-red-50 dark:bg-red-900/20 text-center"><p class="font-bold">Depresyon Kırığı</p><p class="text-xs">Küçük yüzey + yüksek enerji. Alet şeklini yansıtır.</p></div>
            <div class="p-2 rounded border bg-purple-50 dark:bg-purple-900/20 text-center"><p class="font-bold">Komminüte Kırık</p><p class="text-xs">Çok yüksek enerji. Çok parçalı. Beyin herniasyonu.</p></div>
          </div>
          ${img2("ch5-001.png", "Fig 5.1 — Scalp laceration showing underlying skull fracture (Knight, Ch.5)", "ch5-002.png", "Fig 5.2 — Skull fracture pattern from blunt impact (Knight, Ch.5)")}
        </div>`,
      },
      {
        title: "S69: Puppe Kuralı: Kırık Hatlarının Kesişimi ve Sıralama",
        content: `<div class="space-y-3">
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500">
            <p class="font-bold text-lg">Puppe Kuralı (Puppe's Rule)</p>
            <p class="text-sm">Kafatasında birden fazla darbe sonucu oluşan kırıkların oluş sırasını belirler: <strong>İkinci kırık hattı, birinci kırık hattında DURUR</strong> (kesişmez, ötesine geçmez).</p>
          </div>
          ${img("ch5-024.png", "Fig 5.x — Skull fracture patterns demonstrating Puppe's rule (Knight, Ch.5)")}
          <p class="text-xs italic">Puppe kuralı, birden fazla saldırganın olduğu veya kurbanın defalarca darp edildiği vakalarda olay yeri rekonstrüksiyonu için vazgeçilmezdir.</p>
        </div>`,
      },
      {
        title: "S70: Kafa Tabanı Kırıkları: Ring Kırığı",
        content: `<div class="space-y-3">
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-600">
            <p class="font-bold">Ring (Halka) Kırığı</p>
            <p class="text-sm">Foramen magnum çevresinde dairesel olarak oluşan, kafatasının omurga üzerine çökmesi veya ayrılmasıyla karakterize ağır kırıktır.</p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-2 rounded border"><p class="font-semibold">Mekanizma</p><p class="text-xs">Ayak/kalça üzeri yüksekten düşme → aksiyel yüklenme</p></div>
            <div class="p-2 rounded border"><p class="font-semibold">Klinik Bulgular</p><p class="text-xs">Battle belirtisi, Rakun gözü, BOS sızıntısı</p></div>
          </div>
          ${img("ch5-025.png", "Fig 5.x — Base of skull fracture (Knight, Ch.5)")}
        </div>`,
      },
      {
        title: "S71–76: İntrakranial Hemorajiler: EDH, SDH, SAK",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="p-2 rounded border border-red-300 bg-red-50 dark:bg-red-900/20"><p class="font-bold">Epidural Hematom</p><p class="text-xs">A. meningea media. Bikonveks. Lucid interval.</p></div>
            <div class="p-2 rounded border border-blue-300 bg-blue-50 dark:bg-blue-900/20"><p class="font-bold">Subdural Hematom</p><p class="text-xs">Köprü venleri. Hilal. Yüksek mortalite.</p></div>
            <div class="p-2 rounded border border-purple-300 bg-purple-50 dark:bg-purple-900/20"><p class="font-bold">Subaraknoid</p><p class="text-xs">Kortikal damarlar. Sulkuslarda kan.</p></div>
          </div>
          ${img2("ch5-039.png", "Fig 5.x — Epidural/subdural hematoma cross-section (Knight, Ch.5)", "ch5-096.png", "Fig 5.x — Intracranial hemorrhage at autopsy (Knight, Ch.5)")}
          <p class="text-xs italic">Knight: "The distinction between extradural and subdural haemorrhage is of vital importance in understanding head injury mechanism" (Ch.5)</p>
        </div>`,
      },
      {
        title: "S73–74: Coup-Contrecoup ve Diffüz Aksonal Hasar",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border bg-red-50 dark:bg-red-900/20">
              <p class="font-bold">Coup (Darbe Tarafı)</p>
              <p>Darbe noktası altında kortikal kontüzyon. Sabit kafa + hareketli cisimde baskın.</p>
            </div>
            <div class="p-3 rounded border bg-blue-50 dark:bg-blue-900/20">
              <p class="font-bold">Contrecoup (Karşı Taraf)</p>
              <p>Darbeden 180° karşıda kontüzyon. Hareketli kafa + sabit yüzey (düşme) durumunda baskın.</p>
            </div>
          </div>
          ${img("ch5-142.png", "Fig 5.x — Brain contusion showing coup-contrecoup pattern (Knight, Ch.5)")}
          <div class="p-3 rounded border text-sm">
            <p><strong>Diffüz Aksonal Hasar (DAI):</strong> Rotasyonel ivmelenme → aksonların gerilmesi ve kopması. Corpus callosum ve beyin sapı. β-APP immunohistokimyası ile tanı.</p>
          </div>
        </div>`,
      },
      {
        title: "S77: Uzun Kemik Kırık Tipleri: Spiral, Transvers, Oblik",
        content: `<div class="space-y-3">
          <table class="w-full text-sm border-collapse">
            <thead><tr class="bg-gray-100 dark:bg-gray-800"><th class="border p-2">Kırık Tipi</th><th class="border p-2">Mekanizma</th><th class="border p-2">Adli Önemi</th></tr></thead>
            <tbody>
              <tr><td class="border p-2 font-semibold">Spiral</td><td class="border p-2">Burulma (torsion)</td><td class="border p-2">Çocuklarda istismar şüphesi</td></tr>
              <tr><td class="border p-2 font-semibold">Transvers</td><td class="border p-2">Doğrudan dik darbe</td><td class="border p-2">Trafik kazası tampon çarpması</td></tr>
              <tr><td class="border p-2 font-semibold">Oblik</td><td class="border p-2">Kompresyon + bükülme</td><td class="border p-2">Düşme veya aksiyel yüklenme</td></tr>
              <tr><td class="border p-2 font-semibold">Butterfly</td><td class="border p-2">Bükülme, kompresyon tarafı</td><td class="border p-2">Darbe yönünü gösterir</td></tr>
            </tbody>
          </table>
          <p class="text-xs italic">Spiral kırıklar, özellikle küçük çocuklarda istismar açısından yüksek şüphe uyandırmalıdır.</p>
        </div>`,
      },
      {
        title: "S78–80: Pelvis, Vertebra Kırıkları ve Radyolojik Değerlendirme",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border bg-red-50 dark:bg-red-900/20">
              <p class="font-semibold">Pelvis Kırıkları</p>
              <p>Her zaman yüksek enerjili travma. Masif retroperitoneal kanama riski. Pelvik venöz pleksus/iliak arter rüptürü.</p>
            </div>
            <div class="p-3 rounded border bg-blue-50 dark:bg-blue-900/20">
              <p class="font-semibold">Vertebra Kırıkları</p>
              <p>Aksiyel yüklenme → kompresyon kırığı. Whiplash (C1-C2). Medulla spinalis hasarı → ani ölüm.</p>
            </div>
          </div>
          <div class="p-3 rounded border text-sm">
            <p><strong>Postmortem BT (PMCT):</strong> Kırıkların tespiti için altın standart. 3D rekonstrüksiyon, diseksiyon öncesi kırık paternini netleştirir. Mahkemede en etkili görsel araç.</p>
          </div>
        </div>`,
      },
      {
        title: "S81–85: Kırık İyileşmesi ve Bölüm Özeti",
        content: `<div class="space-y-3">
          <table class="w-full text-sm border-collapse">
            <thead><tr class="bg-gray-100 dark:bg-gray-800"><th class="border p-2">Süre</th><th class="border p-2">Evre</th><th class="border p-2">Bulgular</th></tr></thead>
            <tbody>
              <tr><td class="border p-2">0–48 saat</td><td class="border p-2">Hematom</td><td class="border p-2">Kırık hattında kan, inflamasyon</td></tr>
              <tr><td class="border p-2">2–7 gün</td><td class="border p-2">Yumuşak Kallus</td><td class="border p-2">Granülasyon dokusu, kıkırdak</td></tr>
              <tr><td class="border p-2">1–4 hafta</td><td class="border p-2">Sert Kallus</td><td class="border p-2">Radyolojik kemik köprüsü</td></tr>
              <tr><td class="border p-2">1–6 ay</td><td class="border p-2">Remodelleme</td><td class="border p-2">Eski şekle dönüş, korteks onarımı</td></tr>
            </tbody>
          </table>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded border text-sm">
            <p class="font-bold">Bölüm Özeti:</p>
            <p>Kırık hatları, uygulanan kuvvetin vektörünü ve şiddetini matematiksel olarak yansıtır. Puppe kuralı çoklu darbelerde kronolojik rekonstrüksiyon sağlar. 3D BT ve FEA modern tekniklerdir.</p>
          </div>
        </div>`,
      },
    ],
  },
  {
    id: "section6",
    title: "Bölüm 6: Biyomekanik Modelleme (S86–S98)",
    slides: [
      {
        title: "S86: Deri Mekaniği: Ogden Hiperelastik Modeli",
        content: `<div class="space-y-3">
          <div class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border text-center">
            <p class="text-xl font-bold font-mono">W = Σ (μᵢ / αᵢ) × (λ₁ᵅⁱ + λ₂ᵅⁱ + λ₃ᵅⁱ − 3)</p>
            <p class="font-semibold mt-1">Ogden Hiperelastik Modeli</p>
          </div>
          <p class="text-sm">Derinin büyük deformasyonlar altındaki doğrusal olmayan davranışını açıklayan en yaygın matematiksel modeldir. Travma anındaki stresin derinin yırtılma eşiğini aşıp aşmadığını hesaplar.</p>
        </div>`,
      },
      {
        title: "S87–89: Mooney-Rivlin, Viskoelastisite ve Prony Serisi",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="p-3 rounded border"><p class="font-semibold">Mooney-Rivlin</p><p class="text-xs">Orta deformasyonlar için. C₁₀ ve C₀₁ katsayıları.</p></div>
            <div class="p-3 rounded border"><p class="font-semibold">Viskoelastisite</p><p class="text-xs">Hızlı darbe → kırılgan davranış → laserasyon. Yavaş darbe → esner → ekimoz.</p></div>
            <div class="p-3 rounded border"><p class="font-semibold">Prony Serisi</p><p class="text-xs">G(t) = G∞ + Σ Gᵢ × exp(−t/τᵢ). Stres relaksasyonu.</p></div>
          </div>
          <div class="p-3 rounded border bg-yellow-50 dark:bg-yellow-900/20 text-sm">
            <p><strong>Strain Rate Etkisi:</strong> Biyolojik dokular viskoelastik yapıdadır; darbenin hızı arttıkça dokunun sertliği ve direnci artar.</p>
          </div>
        </div>`,
      },
      {
        title: "S90–91: Hertz Temas Teorisi ve P_max Formülü",
        content: `<div class="space-y-3">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border text-center">
            <p class="text-xl font-bold font-mono">P_max = 3F / 2πa²</p>
            <p class="font-semibold mt-1">Hertz Temas Mekaniği — Maksimum Temas Basıncı</p>
          </div>
          <p class="text-sm">İki elastik cismin (künt cisim + vücut) çarpışma anındaki temas alanı (a²) ve maksimum basıncını hesaplar. Alet tayininde cismin geometrisi bu formülle analiz edilir.</p>
        </div>`,
      },
      {
        title: "S92–93: FEA Uygulamaları ve Von Mises Stres Dağılımı",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border"><p class="font-semibold">DICOM → 3D Mesh</p><p>BT verilerinden sayısal model oluşturma. Kemik, yumuşak doku ve deri ayrı ayrı meshlenir.</p></div>
            <div class="p-3 rounded border"><p class="font-semibold">Von Mises Stres</p><p>Darbe anında doku içindeki stres yoğunlaşmasının görselleştirilmesi. Kırık başlangıç noktasını tahmin eder.</p></div>
          </div>
          <div class="p-3 rounded border bg-yellow-50 dark:bg-yellow-900/20 text-sm">
            <p><strong>Adli Uygulama:</strong> FEA ile otopside saptanan kırık paterninin, tanık ifadeleriyle örtüşüp örtüşmediği simüle edilebilir.</p>
          </div>
        </div>`,
      },
      {
        title: "S94–96: Kırık Propagasyonu ve Daubert Kriterleri",
        content: `<div class="space-y-3">
          <div class="p-3 rounded border text-sm"><p class="font-semibold">Kırık Propagasyonu:</p><p>Kırık, stresin kemik direncini aştığı noktadan başlar ve enerji absorbe edilerek ilerler. Simülasyonla kırık hattının beklenen yolu tahmin edilir.</p></div>
          <div class="p-3 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
            <p class="font-bold">Daubert Standardı (5 Temel Kriter)</p>
            <ol class="text-sm list-decimal pl-5 space-y-1 mt-1">
              <li>Test edilebilirlik (Falsifiability)</li>
              <li>Peer review ve yayın</li>
              <li>Bilinen hata oranı</li>
              <li>Standartların varlığı</li>
              <li>Genel kabul (General acceptance)</li>
            </ol>
          </div>
          <p class="text-xs italic">Her simülasyon kadavra veya deneysel verilerle valide edilmelidir.</p>
        </div>`,
      },
      {
        title: "S97–98: Vaka Simülasyonu ve Bölüm Özeti",
        content: `<div class="space-y-3">
          <div class="p-3 rounded border bg-blue-50 dark:bg-blue-900/20 text-sm">
            <p class="font-bold">Vaka: Şüpheli Kafa Kırığı</p>
            <p>Sanık, kurbanın basit bir düşme sonucu yaralandığını iddia eder. FEA simülasyonu, düşme senaryosunun iddia edilen kırık paternini oluşturup oluşturamayacağını test eder.</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded border text-sm">
            <p class="font-bold">Bölüm Özeti:</p>
            <p>Biyomekanik modelleme, adli patolojiyi matematiksel ve simülasyon tabanlı bir bilime dönüştürmektedir. Ogden/Mooney-Rivlin/Prony doku modelleri, Hertz temas teorisi ve FEA ile darbe rekonstrüksiyonu yapılabilir. Daubert kriterleri mahkemede kabul için şarttır.</p>
          </div>
        </div>`,
      },
    ],
  },
  {
    id: "section7",
    title: "Bölüm 7: Özel Paternler (S99–S110)",
    slides: [
      {
        title: "S99–100: Trafik Kazaları: Yaya-Araç Çarpma Dinamikleri",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="p-2 rounded border border-red-300 bg-red-50 dark:bg-red-900/20"><p class="font-bold">I. Primer Darbe</p><p class="text-xs">Tampon → bacak. Messerer kırığı, pretibial ekimoz.</p></div>
            <div class="p-2 rounded border border-orange-300 bg-orange-50 dark:bg-orange-900/20"><p class="font-bold">II. Sekonder Darbe</p><p class="text-xs">Kaput/cam → gövde/kafa. Pelvis kırığı, SDH.</p></div>
            <div class="p-2 rounded border border-blue-300 bg-blue-50 dark:bg-blue-900/20"><p class="font-bold">III. Tersiyer Darbe</p><p class="text-xs">Zemine çarpma. Contrecoup, oksipital kırık.</p></div>
          </div>
          ${img2("ch9-084.png", "Fig 9.x — Pedestrian impact injuries (Knight, Ch.9)", "ch9-085.png", "Fig 9.x — Vehicle-pedestrian collision patterns (Knight, Ch.9)")}
        </div>`,
      },
      {
        title: "S101: Messerer Kırığı: Darbe Vektörü ve Araç Yönü Analizi",
        content: `<div class="space-y-3">
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-500">
            <p class="font-bold">Messerer (Kelebek) Kırığı</p>
            <p class="text-sm">Uzun kemiklere (tibia, femur) gelen doğrudan dik darbe sonucu oluşan üçgen (kelebek) kemik parçasıdır. Darbe yönünü gösterir.</p>
          </div>
          ${img("ch9-088.png", "Fig 9.x — Lower limb injuries from vehicle bumper impact (Knight, Ch.9)")}
          <p class="text-xs italic">Messerer kırığı, yaya-araç çarpmasının patognomonik bulgusudur ve tampon yüksekliğini belirler.</p>
        </div>`,
      },
      {
        title: "S102: Waddell Triadı: Çocuk-Araç Çarpması Klasik Bulguları",
        content: `<div class="space-y-3">
          <div class="p-3 rounded-lg border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
            <p class="font-bold">Waddell Triadı (Üçlüsü)</p>
            <p class="text-sm">Küçük çocukların boyu nedeniyle araç tamponu gövdeye isabet eder ve farklı yaralanma paterni oluşur:</p>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm text-center">
            <div class="p-2 rounded border">1. Femur/tibia kırığı</div>
            <div class="p-2 rounded border">2. Gövde yaralanması</div>
            <div class="p-2 rounded border">3. Kafa travması</div>
          </div>
          ${img("ch9-090.png", "Fig 9.x — Pedestrian injury pattern analysis (Knight, Ch.9)")}
        </div>`,
      },
      {
        title: "S103–104: Düşme Paternleri ve Serbest Düşme vs. İtilme",
        content: `<div class="space-y-3">
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border text-center">
            <p class="text-xl font-bold font-mono">E = m × g × h</p>
            <p class="text-sm">Potansiyel enerji, düşme yüksekliği ile doğru orantılı</p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border">
              <p class="font-semibold">Serbest Düşme</p>
              <p class="text-xs">X ≈ 0–1 m, vücut binaya yakın, bilateral simetrik</p>
            </div>
            <div class="p-3 rounded border">
              <p class="font-semibold">İtilme</p>
              <p class="text-xs">X > 1–2 m, vücut uzağa, asimetrik, savunma yaralanmaları</p>
            </div>
          </div>
          <div class="p-2 rounded border text-sm">
            <p><strong>Düşme Yüksekliği:</strong> &lt;3m: genellikle non-fatal. 3–10m: kırıklar, iç organ. &gt;10m: multipl travma. &gt;25m: neredeyse kesin fatal.</p>
          </div>
        </div>`,
      },
      {
        title: "S105–106: Çocuk İstismarı: Ekimoz Paternleri ve Spesifik İzler",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-2 rounded border border-red-300 bg-red-50 dark:bg-red-900/20"><p class="font-bold">Şüpheli Lokalizasyonlar</p><ul class="text-xs space-y-0.5"><li>• Yüz (yanak, periorbital)</li><li>• Boyun, kulak</li><li>• Üst kol medial, sırt</li><li>• Uyluk iç yüzü, genital</li></ul></div>
            <div class="p-2 rounded border border-green-300 bg-green-50 dark:bg-green-900/20"><p class="font-bold">Normal (Kazaya Bağlı)</p><ul class="text-xs space-y-0.5"><li>• Alın, diz anterior</li><li>• Dirsek, tibia ön yüz</li><li>• Kemik çıkıntıları</li><li>• Simetrik dağılım</li></ul></div>
          </div>
          ${img("ch4-013.png", "Fig 4.15 — Multiple bruises on trunk of child abuse victim (Knight, Ch.4)")}
          <p class="text-xs"><strong>Spesifik İzler:</strong> Kemer tokası (loop marks), ısırık izi (dental ark), sigara yanığı (8-10mm dairesel), sıcak sıvı haşlanması (stocking/glove paterni).</p>
        </div>`,
      },
      {
        title: "S107: AHT (Abusive Head Trauma) ve Sarsılmış Bebek Sendromu",
        content: `<div class="space-y-3">
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-600">
            <p class="font-bold">AHT Mekanizması</p>
            <p class="text-sm">Bebeğin gövdesinden tutularak şiddetle sarsılması sonucu rotasyonel ivmelenme-yavaşlama kuvvetleri oluşur.</p>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm text-center">
            <div class="p-2 rounded border bg-red-50 dark:bg-red-900/20">Bilateral SDH</div>
            <div class="p-2 rounded border bg-blue-50 dark:bg-blue-900/20">Retinal hemoraji</div>
            <div class="p-2 rounded border bg-purple-50 dark:bg-purple-900/20">Serebral ödem</div>
          </div>
          <p class="text-xs italic">Bu triad, darp öyküsü yokluğunda istismar düşündürür.</p>
        </div>`,
      },
      {
        title: "S108–110: İstismar Taklitçileri ve Bölüm Özeti",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border"><p class="font-semibold">Mongol Lekesi</p><p class="text-xs">Doğumsal, mavi-gri. Ekimozla karışabilir. Sabit lokalizasyon, zamanla solar.</p></div>
            <div class="p-3 rounded border"><p class="font-semibold">Koagülopatiler</p><p class="text-xs">Hemofili, ITP, Von Willebrand. Spontan ekimozlar.</p></div>
            <div class="p-3 rounded border"><p class="font-semibold">OI / Ehlers-Danlos</p><p class="text-xs">Kolay kırıklar / kolay morluklar. Genetik test gerekir.</p></div>
            <div class="p-3 rounded border"><p class="font-semibold">Kopping (Bardak Çekme)</p><p class="text-xs">Kültürel tedavi → dairesel morluklar. Anamnezle ayırt edilir.</p></div>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded border text-sm">
            <p class="font-bold">10 Altın Kural:</p>
            <p>Özel travma paternleri, olayın mekanizmasını, aletini ve koşullarını doğrudan işaret eder. Doğru tanı için sistematik yaklaşım şarttır.</p>
          </div>
        </div>`,
      },
    ],
  },
  {
    id: "section8",
    title: "Bölüm 8: Ölüm Mekanizmaları ve Rapor (S111–S120)",
    slides: [
      {
        title: "S111: Hemorajik Şok: Patofizyoloji ve ATLS Evreleri",
        content: `<div class="space-y-3">
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-500">
            <p class="font-bold">Hemorajik Şok Mekanizması</p>
            <p class="text-sm">Künt travma sonrası gelişen masif iç kanama → hipotansiyon → organ hipoperfüzyonu → ölüm.</p>
          </div>
          <table class="w-full text-xs border-collapse">
            <thead><tr class="bg-gray-100 dark:bg-gray-800"><th class="border p-1">ATLS Evresi</th><th class="border p-1">Kan Kaybı</th><th class="border p-1">Klinik</th></tr></thead>
            <tbody>
              <tr><td class="border p-1">Sınıf I</td><td class="border p-1">&lt;15%</td><td class="border p-1">Minimal semptom</td></tr>
              <tr><td class="border p-1">Sınıf II</td><td class="border p-1">15-30%</td><td class="border p-1">Taşikardi, anksiyete</td></tr>
              <tr><td class="border p-1">Sınıf III</td><td class="border p-1">30-40%</td><td class="border p-1">Hipotansiyon, konfüzyon</td></tr>
              <tr><td class="border p-1 font-semibold">Sınıf IV</td><td class="border p-1 font-semibold">&gt;40%</td><td class="border p-1 font-semibold">Letarji → ÖLÜM</td></tr>
            </tbody>
          </table>
        </div>`,
      },
      {
        title: "S112: İç Organ Rüptürleri ve Kanama Miktarları",
        content: `<div class="space-y-3">
          <table class="w-full text-sm border-collapse">
            <thead><tr class="bg-gray-100 dark:bg-gray-800"><th class="border p-2">Yaralanma</th><th class="border p-2">Kan Kaybı</th><th class="border p-2">Hayati Tehlike</th></tr></thead>
            <tbody>
              <tr><td class="border p-2">Karaciğer Rüptürü</td><td class="border p-2">1000–2500 ml</td><td class="border p-2 text-red-600 font-semibold">Çok Yüksek</td></tr>
              <tr><td class="border p-2">Dalak Rüptürü</td><td class="border p-2">500–1500 ml</td><td class="border p-2 text-red-600">Yüksek</td></tr>
              <tr><td class="border p-2">Pelvis Kırığı</td><td class="border p-2">1500–3000 ml</td><td class="border p-2 text-red-600 font-semibold">Çok Yüksek</td></tr>
              <tr><td class="border p-2">Femur Kırığı</td><td class="border p-2">500–1000 ml</td><td class="border p-2">Orta/Yüksek</td></tr>
              <tr><td class="border p-2">Aort Rüptürü</td><td class="border p-2">Masif</td><td class="border p-2 text-red-600 font-bold">Anında Ölüm</td></tr>
            </tbody>
          </table>
        </div>`,
      },
      {
        title: "S113–114: Beyin Hemorajileri: EDH ve SDH",
        content: `<div class="space-y-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded border bg-red-50 dark:bg-red-900/20">
              <p class="font-bold">Epidural Hematom (EDH)</p>
              <p>A. meningea media rüptürü (%90). Arteriyel, hızla büyür. Lucid interval. Cerrahi ile iyi prognoz.</p>
            </div>
            <div class="p-3 rounded border bg-blue-50 dark:bg-blue-900/20">
              <p class="font-bold">Subdural Hematom (SDH)</p>
              <p>Köprü venleri kopması. İvme-yavaşlama mekanizması. Beyin atrofisi riski artırır. Yüksek mortalite.</p>
            </div>
          </div>
          ${img2("ch5-039.png", "Fig 5.x — Intracranial hemorrhage (Knight, Ch.5)", "ch5-096.png", "Fig 5.x — Brain hemorrhage at autopsy (Knight, Ch.5)")}
        </div>`,
      },
      {
        title: "S115: Diffüz Aksonal Hasar (DAH) ve β-APP İHK",
        content: `<div class="space-y-3">
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-purple-500">
            <p class="font-bold">Diffüz Aksonal Hasar (DAH)</p>
            <p class="text-sm">Rotasyonel ivmelenme-yavaşlama kuvvetleri etkisiyle beyaz cevherdeki aksonların yaygın hasarıdır.</p>
          </div>
          ${img("ch5-142.png", "Fig 5.x — Brain showing diffuse axonal injury (Knight, Ch.5)")}
          <div class="text-sm space-y-1">
            <p><strong>β-APP İHK:</strong> Hasarlı aksonlarda amyloid precursor protein birikimi → aksonal şişme ve retraksiyon topları.</p>
            <p><strong>Prognoz:</strong> Persistan vejetatif durum veya ölüm. En sık neden: trafik kazaları.</p>
          </div>
        </div>`,
      },
      {
        title: "S116: Travmatik Aort Rüptürü",
        content: `<div class="space-y-3">
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-600">
            <p class="font-bold">Travmatik Aort Rüptürü</p>
            <p class="text-sm">Yüksek enerjili künt göğüs travması sonucu aort duvarının tam kat yırtılmasıdır. %80 olay yerinde fatal.</p>
          </div>
          <div class="text-sm space-y-1">
            <p><strong>Mekanizma:</strong> Ani yavaşlama (deselerasyon) → aort arkusu ile ligamentum arteriosum arasında makaslama kuvveti.</p>
            <p><strong>Lokalizasyon:</strong> İstmus (%90) — sol subklavian arter distalinde.</p>
          </div>
          ${img("ch9-093.png", "Fig 9.x — Chest injury pattern from deceleration (Knight, Ch.9)")}
        </div>`,
      },
      {
        title: "S117: Yağ Embolisi Sendromu",
        content: `<div class="space-y-3">
          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-500">
            <p class="font-bold">Yağ Embolisi Sendromu</p>
            <p class="text-sm">Uzun kemik kırıkları sonrası kemik iliği kaynaklı yağ globüllerinin dolaşıma katılarak akciğer ve beyin kapillerlerini tıkamasıdır.</p>
          </div>
          <div class="text-sm space-y-1">
            <p><strong>Latent Period:</strong> 24–72 saat. Kırıktan sonra ani kötüleşme.</p>
            <p><strong>Gurd Kriterleri:</strong> Majör (hipoksemi, serebral, peteşi) + Minör (taşikardi, ateş, trombositopeni)</p>
            <p><strong>Otopsi:</strong> Sudan III veya Oil Red O boyama ile akciğer kapillerlerinde yağ globülleri.</p>
          </div>
        </div>`,
      },
      {
        title: "S118: Ölüm Mekanizmalarının Değerlendirmesi ve Nedensellik",
        content: `<div class="space-y-3">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
            <p class="font-bold">İlliyet Bağı (Causality) Prensipleri</p>
            <p class="text-sm">Travma ile ölüm sonucu arasındaki bilimsel ve tıbbi bağlantıdır. "Bu travma olmasaydı ölüm gerçekleşir miydi?"</p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-2 rounded border"><p class="font-semibold">Doğrudan Neden</p><p class="text-xs">Travmanın hayati organ hasarı veya kanama ile doğrudan ölümü tetiklemesi.</p></div>
            <div class="p-2 rounded border"><p class="font-semibold">Dolaylı Neden</p><p class="text-xs">Travma sonrası komplikasyonlar (enfeksiyon, emboli, multi-organ yetmezliği).</p></div>
          </div>
        </div>`,
      },
      {
        title: "S119: Bilirkişi Raporu Yazımı: Akademik Standartlar",
        content: `<div class="space-y-3">
          <p class="font-semibold">Raporun 7 Temel Bölümü:</p>
          <div class="space-y-1">
            <div class="p-2 rounded border flex gap-2 items-center text-sm"><span class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</span><span><strong>Giriş:</strong> Kimlik bilgileri, olayın özeti</span></div>
            <div class="p-2 rounded border flex gap-2 items-center text-sm"><span class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</span><span><strong>Dış Muayene:</strong> Elbiseler, lezyonların anatomik tarifi</span></div>
            <div class="p-2 rounded border flex gap-2 items-center text-sm"><span class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</span><span><strong>İç Muayene:</strong> Organ sistemlerinin sistematik diseksiyonu</span></div>
            <div class="p-2 rounded border flex gap-2 items-center text-sm"><span class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">4</span><span><strong>Laboratuvar:</strong> Histopatoloji, Toksikoloji, İHK</span></div>
            <div class="p-2 rounded border flex gap-2 items-center text-sm"><span class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">5</span><span><strong>Analiz:</strong> Bulguların tıbbi ve fiziksel yorumu</span></div>
            <div class="p-2 rounded border flex gap-2 items-center text-sm"><span class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">6</span><span><strong>Sonuç:</strong> Ölüm nedeni, tarzı, illiyet bağı</span></div>
            <div class="p-2 rounded border flex gap-2 items-center text-sm"><span class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">7</span><span><strong>Kanaat:</strong> Kesin/olası ifadeler, bilimsel terminoloji</span></div>
          </div>
        </div>`,
      },
      {
        title: "S120: Genel Özet: Adli Patolojide Künt Travma Rehberi Kapanış",
        content: `<div class="space-y-3">
          <p class="font-bold text-lg text-center mb-3">5 Kritik Anahtar Mesaj</p>
          <div class="space-y-2 text-sm">
            <div class="p-2 rounded border flex gap-2"><span class="font-bold text-blue-600 flex-shrink-0">1.</span><div><strong>Fizik Temelleri:</strong> Kuvvet, basınç ve enerji transferini anlamak, yara mekanizmasını çözmenin ilk adımıdır.</div></div>
            <div class="p-2 rounded border flex gap-2"><span class="font-bold text-blue-600 flex-shrink-0">2.</span><div><strong>Doku Köprüleri:</strong> Künt travma tanısında (laserasyon vs. insizyon) en güvenilir morfolojik kanıttır.</div></div>
            <div class="p-2 rounded border flex gap-2"><span class="font-bold text-blue-600 flex-shrink-0">3.</span><div><strong>Moleküler Kronoloji:</strong> İHK belirteçleri (β-APP, P-Selektin) yara yaşı tayininde objektiflik sağlar.</div></div>
            <div class="p-2 rounded border flex gap-2"><span class="font-bold text-blue-600 flex-shrink-0">4.</span><div><strong>Biyomekanik:</strong> FEA ve Hertz teorisi, darbe rekonstrüksiyonunu sayısal verilere dayandırır.</div></div>
            <div class="p-2 rounded border flex gap-2"><span class="font-bold text-blue-600 flex-shrink-0">5.</span><div><strong>Rapor:</strong> Tüm bulguları Daubert standartlarına uygun, sistematik bir raporla sunmak patoloğun sorumluluğudur.</div></div>
          </div>
          <p class="text-center text-xs italic mt-4">"Adli bilimi, gerçeği sadece gözlemek için değil, matematiksel ve biyolojik verilerle ispatlamak için uygulamak." — Sunum Vizyonu</p>
        </div>`,
      },
    ],
  },
];

export default function BluntTraumaPresentation() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const allSlides = SECTIONS.flatMap((section) =>
    section.slides.map((slide, slideIdx) => ({
      ...slide,
      sectionId: section.id,
      sectionTitle: section.title,
      globalIndex: 0,
    }))
  );
  let idx = 0;
  for (const s of allSlides) {
    s.globalIndex = idx++;
  }

  const totalSlides = allSlides.length;
  const currentSlide = allSlides[currentSlideIndex] || allSlides[0];

  const goNext = () => setCurrentSlideIndex((i) => Math.min(i + 1, totalSlides - 1));
  const goPrev = () => setCurrentSlideIndex((i) => Math.max(i - 1, 0));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const downloadDoc = () => {
    let html = `<html><head><meta charset="utf-8"><style>
      @page { size: A4 landscape; margin: 1.5cm; }
      body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #000; }
      .slide { page-break-after: always; padding: 1cm; min-height: 16cm; }
      .slide:last-child { page-break-after: auto; }
      .slide-title { font-size: 16pt; font-weight: bold; color: #1a365d; border-bottom: 3px solid #2563eb; padding-bottom: 8pt; margin-bottom: 16pt; }
      .section-label { font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 4pt; }
      table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
      td, th { border: 1px solid #ccc; padding: 4pt 6pt; font-size: 10pt; }
      th { background: #f0f0f0; }
      img { max-width: 100%; max-height: 250px; display: block; margin: 8pt auto; border: 1px solid #ddd; border-radius: 4px; }
      figcaption { text-align: center; font-size: 8pt; color: #666; }
    </style></head><body>`;
    for (const slide of allSlides) {
      html += `<div class="slide"><div class="section-label">${slide.sectionTitle}</div><div class="slide-title">${slide.title}</div>`;
      html += (slide.content || "").replace(/class="[^"]*"/g, "").replace(/style="[^"]*"/g, "").replace(/dark:[^\s"']*/g, "");
      html += `</div>`;
    }
    html += `</body></html>`;
    const blob = new Blob(["\ufeff" + html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Kunt_Travma_Sunum_Knight_DiMaio.doc";
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPresentation = () => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    let html = `<html><head><meta charset="utf-8"><style>
      @page { size: A4 landscape; margin: 1cm; }
      body { font-family: 'Segoe UI', sans-serif; font-size: 10pt; }
      .slide { page-break-after: always; padding: 1cm; border: 1px solid #ddd; min-height: 16cm; }
      .slide:last-child { page-break-after: auto; }
      .slide-title { font-size: 14pt; font-weight: bold; color: #1a365d; border-bottom: 2px solid #2563eb; padding-bottom: 6pt; margin-bottom: 12pt; }
      table { border-collapse: collapse; width: 100%; } td, th { border: 1px solid #ccc; padding: 3pt; font-size: 9pt; }
      img { max-width: 100%; max-height: 200px; }
    </style></head><body>`;
    for (const slide of allSlides) {
      html += `<div class="slide"><div style="font-size:8pt;color:#888">${slide.sectionTitle}</div><div class="slide-title">${slide.title}</div>${slide.content}</div>`;
    }
    html += `</body></html>`;
    pw.document.write(html);
    pw.document.close();
    pw.print();
  };

  return (
    <div className="flex h-screen bg-background" tabIndex={0} data-testid="blunt-trauma-presentation">
      {!isFullscreen && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" data-testid="text-page-title">Adli Patolojide Künt Travma — Akademik Sunum</h1>
            <p className="text-xs text-muted-foreground">Knight's Forensic Pathology & DiMaio's Forensic Pathology referanslı • {totalSlides} slayt</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadDoc} data-testid="button-download-doc"><Download className="w-4 h-4 mr-1" /> DOC</Button>
            <Button variant="outline" size="sm" onClick={printPresentation} data-testid="button-print"><Printer className="w-4 h-4 mr-1" /> Yazdır</Button>
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} data-testid="button-fullscreen">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {!isFullscreen && (
            <div className="w-64 border-r border-border bg-card overflow-hidden flex flex-col">
              <div className="p-3 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Bölümler ({totalSlides} slayt)</p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {SECTIONS.map((section) => {
                    const sectionSlides = allSlides.filter((s) => s.sectionId === section.id);
                    const firstIndex = sectionSlides[0]?.globalIndex || 0;
                    const isActive = currentSlide.sectionId === section.id;
                    return (
                      <div key={section.id}>
                        <button className={`w-full text-left px-3 py-2 rounded text-sm font-semibold transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`} onClick={() => setCurrentSlideIndex(firstIndex)} data-testid={`button-section-${section.id}`}>
                          {section.title}
                        </button>
                        {isActive && (
                          <div className="ml-3 mt-1 space-y-0.5">
                            {sectionSlides.map((slide) => (
                              <button key={slide.globalIndex} className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${currentSlideIndex === slide.globalIndex ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-accent"}`} onClick={() => setCurrentSlideIndex(slide.globalIndex)}>
                                {slide.title.substring(0, 45)}{slide.title.length > 45 ? "..." : ""}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
              <Card className={`w-full ${isFullscreen ? "max-w-6xl" : "max-w-4xl"} p-8 shadow-lg`} data-testid={`slide-${currentSlideIndex}`}>
                <div className="mb-1 text-xs text-muted-foreground uppercase tracking-wider">{currentSlide.sectionTitle} — Slayt {currentSlideIndex + 1} / {totalSlides}</div>
                <h2 className="text-xl font-bold mb-4 pb-3 border-b-2 border-primary/30">{currentSlide.title}</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: currentSlide.content || "" }} />
              </Card>
            </div>
            <div className="border-t border-border bg-card px-6 py-3 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={currentSlideIndex === 0} data-testid="button-prev-slide"><ChevronLeft className="w-4 h-4 mr-1" /> Önceki</Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{currentSlideIndex + 1} / {totalSlides}</span>
                <input type="range" min={0} max={totalSlides - 1} value={currentSlideIndex} onChange={(e) => setCurrentSlideIndex(parseInt(e.target.value))} className="w-48" data-testid="input-slide-range" />
              </div>
              <Button variant="outline" size="sm" onClick={goNext} disabled={currentSlideIndex === totalSlides - 1} data-testid="button-next-slide">Sonraki <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
