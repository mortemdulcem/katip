#!/usr/bin/env python3
# Prose sync batch 2: discussion 4.1 synthesis, 4.7 strengths, 5. Sonuc, + targeted
# single-line fixes (forensic 87.3/PMI, limitations ethnic/n, ComBat, tesekkur).
# Line-count PRESERVED per range (build.cjs line-locked). Reports each replace.
import io
P = "makale.txt"
src = io.open(P, "r", encoding="utf-8").read().split("\n")
N0 = len(src)

# ---- 4.1 Ana Bulgularin Ozeti (lines 931-951, 21 lines) ----
synth1 = ("Bu çalışma, altı bağımsız GEO metilasyon kohortunda (toplam n=742; her kohort ayrı analiz edildi) madde "
  "kullanımının epigenetik yaşa etkisini değerlendirmiştir. Temel bulgular şunlardır: (1) Beklenenin aksine, Horvath "
  "epigenetik yaş ivmelenmesi (EAA) küçük ve negatif yönde bulunmuştur — alkol-beyin -0,82 yıl, kokain -0,66 yıl, "
  "opioid-beyin -1,48 yıl — yani bu kohortlarda hızlanmış yaşlanma desteklenmemiştir; metamfetamin için kronolojik "
  "yaş bulunmadığından EAA hesaplanamamıştır. (2) Kohort-özgü diferansiyel metilasyon (FDR<0,05) sırasıyla sigara "
  "89, kokain 11.987, metamfetamin 398, opioid 12, alkol-beyin 8 ve alkol-kan 4.387 CpG vermiştir. (3) Sızıntısız "
  "çapraz-doğrulama ile ikili (madde-vs-kontrol) sınıflandırma ROC-AUC değerleri kokain 1,000, sigara 0,928, alkol "
  "0,926 ve metamfetamin 0,922 olmuştur; tek bir çok-sınıflı doğruluk hesaplanmamıştır. (4) Fizyolojik mediyasyon "
  "(insülin direnci, HPA ekseni, inflamasyon) ve psikolojik moderasyon (duygu düzenleme, öz-kontrol) için "
  "bireysel-düzey fenotip verisi kamuya açık metilasyon setlerinde bulunmadığından bu analizler yapılamamıştır "
  "(veri yok). (5) Postmortem beyin kohortları (alkol-beyin, opioid-beyin) bütün-doku düzeyinde analiz edilmiş; PMI "
  "düzeltmesi ve bölgesel beyin alt-bölümleri için veri bulunmamaktadır.")
synth2 = ("Bu sonuçlar, daha önce literatürde ileri sürülen büyük hızlanmış-yaşlanma etkilerinin bu gerçek veri "
  "setlerinde tekrarlanmadığını ve bulguların — null ve negatif sonuçlar dahil — olduğu gibi dürüstçe raporlandığını "
  "göstermektedir. Küçük örneklem (bazı kohortlar n<50) ve kesitsel tasarım, nedensellik çıkarımını sınırlamaktadır.")
block_931 = [synth1, "", synth2] + [""] * 18

# ---- 4.7 Calismanin Guclu Yonleri (lines 1174-1181, 8 lines) ----
str47 = ("Bu çalışmanın güçlü yönleri şunlardır: Birincisi, tüm analizler kamuya açık GEO veri setleri ve sabit "
  "rastgele-tohum (seed) ile yeniden üretilebilir betikler üzerinden yürütülmüş; ham sayılar repodaki betiklerle "
  "yeniden üretilebilmektedir. İkincisi, sınıflandırma modelleri sızıntısız (leakage-free) çapraz-doğrulama ile "
  "değerlendirilmiş, iyimser yanlılık önlenmiştir. Üçüncüsü, birden çok epigenetik saat (Horvath, Hannum, PhenoAge) "
  "sistematik olarak karşılaştırılmıştır. Dördüncüsü, null ve negatif bulgular (negatif EAA, hesaplanamayan "
  "analizler) gizlenmeden raporlanmıştır. Beşincisi, açık kaynak iş akışı, bulguların şeffaf biçimde denetlenmesini "
  "ve bağımsız doğrulanmasını kolaylaştırmaktadır.")
block_1174 = [str47] + [""] * 7

# ---- 5. Sonuc (lines 1211-1220, 10 lines) ----
son = ("Bu çalışma, altı bağımsız GEO metilasyon kohortunda (toplam n=742, ayrı ayrı analiz edildi) madde kullanımının "
  "epigenetik yaşa etkisini değerlendirmiştir. Gerçek veride, epigenetik yaş ivmelenmesi küçük ve negatif yönde "
  "bulunmuş, büyük hızlanmış-yaşlanma etkileri tekrarlanmamıştır; kohort-özgü diferansiyel metilasyon imzaları "
  "tanımlanmış ve sızıntısız sınıflandırma yüksek ayırt edicilik (ROC-AUC 0,92-1,00) göstermiştir. Fizyolojik "
  "mediyasyon ve psikolojik moderasyon, gerekli bireysel-düzey fenotip verisi bulunmadığından test edilememiştir. "
  "Bulgular, epigenetik yaş değerlendirmesinin potansiyelini gösterse de küçük örneklem ve kesitsel tasarım nedeniyle "
  "ihtiyatla yorumlanmalı ve şu an yalnızca destekleyici kanıt olarak değerlendirilmelidir. Açık kaynak ve yeniden "
  "üretilebilir iş akışı (epi-clock-prototype), bulguların doğrulanmasını kolaylaştırmaktadır. Gelecek çalışmalar "
  "uzunlamasına kohortlar, daha büyük örneklemler ve maddeye özgü saatlere odaklanmalıdır.")
block_1211 = [son] + [""] * 9

# all ranges preserve count -> order-independent
for start, end, nl in [(931, 951, block_931), (1174, 1181, block_1174), (1211, 1220, block_1211)]:
    assert (end - start + 1) == len(nl), "range len %d-%d" % (start, end)
    src[start - 1:end] = nl

# ---- targeted single-line fixes (idx = line-1); each preserves line count ----
fixes = [
  (1142, "%87.3 doğrulukla madde türü sınıflandırması sağlaması",
         "yüksek ayırt edicilikle (ikili ROC-AUC 0,92-1,00) madde türünü ayırt edebilmesi"),
  (1148, "PMI düzeltme ile %47 performans iyileşmesi, bu algoritmanın pratik değerini göstermektedir (Ek Şekil S7).",
         "Bu çalışmada PMI düzeltme algoritması geliştirilmemiş ve performans iyileşmesi ölçülmemiştir (veri yok)."),
  (1190, "Ortak CpG setine odaklanma ve ComBat düzeltmesi bu sorunu azaltmış olsa da, tam",
         "Kohortlar havuzlanmadan ayrı analiz edildiğinden platformlar arası batch düzeltmesine gerek"),
  (1191, "homojenite garanti edilemez (Ek Şekil S2).",
         "kalmamış; ancak kohortlar arası doğrudan EAA karşılaştırması yapılmamıştır."),
  (1193, "etnik çeşitlilik sınırlıdır (örneklerin %78'i Avrupa kökenli)",
         "etnik köken bilgisi bireysel düzeyde mevcut değildir (veri yok)"),
  (1195, "(n=108).", "(iki beyin kohortu, n=113)."),
  (1223, "15 bağımsız araştırma grubunun", "altı bağımsız araştırma grubunun"),
]
report = []
for idx, old, new in fixes:
    if old in src[idx]:
        src[idx] = src[idx].replace(old, new); report.append((idx + 1, True))
    else:
        report.append((idx + 1, False))

N1 = len(src)
assert N1 == N0, "LINE COUNT CHANGED %d -> %d" % (N0, N1)
io.open(P, "w", encoding="utf-8").write("\n".join(src))
print("total_lines=%d" % N1)
for ln, ok in report:
    print("  fix line %d: %s" % (ln, "OK" if ok else "** NOT FOUND **"))
