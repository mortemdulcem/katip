# Makale Revize — Tablo Dönüşüm Durumu (gerçek veri / Zero-Hallucination)

Bu dosya, 36 sayfalık bağımlılık-epigenetiği makalesindeki 27 tablonun
uydurma→gerçek dönüşüm durumunu izler. Yapı, tüm tablolar (27), 6 satıriçi
şekil + 8 EK şekil (toplam 14 görsel, beyin görseli image5 dahil) korunur.

## DURUM ÖZETİ
- DÖNÜŞTÜ (gerçek veri): t1, t2, t4, t5, t6
- DÖNÜŞTÜ ("veri yok / kaynak gerekli"): t7, t8, t9, t10
- BEKLİYOR (gerçek veri var, hassas p-değeri ile sonraki tur): t3
- BEKLİYOR (yayınlanmış literatür — her sayı web ile doğrulanacak): t11–t15, t18, t19, t22, t23, t25
- BEKLİYOR (büyük olasılıkla "veri yok" — bireysel fenotip verisi yok): t16, t17, t24, t26 (kısmen)
- BEKLİYOR (tanısal doğruluk — gerçek sınıflandırıcıdan türetilebilir): t27
- PROSE SENKRONU BEKLİYOR: makale.txt içindeki 10542 / %87.3 / MAE 2.1 / 2847 vb. uydurma rakamlar

## KAYNAK GERÇEK VERİ (realdata/out/)
6 madde kohortu derinlemesine analiz (n=742) + GSE125105 (depresyon, saat referansı):
- GSE50660 sigara, tam kan, 450K, n=464, yaş 55.4±6.7
- GSE110043 alkol(AUD), tam kan, 450K, n=94  [DMP CSV out/ içinde YOK]
- GSE49393 alkol(AUD), beyin PFK postmortem, 450K, n=48, yaş 56.2±9.1
- GSE77056 kokain/crack, tam kan, 450K, n=47, yaş 25.6±2.3
- GSE154971 metamfetamin, PBL, 450K, n=24
- GSE98203 opioid/eroin, beyin OFK postmortem, 450K, n=65, yaş 30.6±11.2

## GERÇEK DEĞERLER (dönüştürülen tablolar)
- t1: yukarıdaki 6 kohort + TOPLAM n=742.
- t2 (saatler, GSE50660 n=464): Horvath MAE 3.51 / RMSE 4.55 / R² 0.586;
  Hannum 7.82 / 8.80 / 0.641; PhenoAge 6.77 / 7.98 / 0.565.
  GrimAge: 450K beta'dan tek başına hesaplanamaz → veri yok. Ensemble → veri yok.
- t4 (GO, GSE50660, Enrichr): yalnız 2 terim FDR<0.05 (Rho GO:0035025 ve MAPK
  GO:0043410, ikisi de FDR=0.023). Zenginleştirme ZAYIF.
- t5 (KEGG, GSE50660): HİÇBİR yolak FDR<0.05 geçmedi (en iyi adj-P=0.168).
- t6 (sınıflandırma, sızıntısız CV): Sigara AUC 0.928, Alkol 0.926, Kokain 1.000,
  Meth 0.922. Opioid/Kannabis/Çoklu → veri yetersiz.
- t7,t8,t9,t10: HOMA-IR/kortizol/CRP-IL6/DERS/SCS-B/PMI/doku-pH bireysel verisi
  hiçbir kamuya açık metilasyon setinde yok → "veri yok / kaynak gerekli".

## t3 İÇİN HAZIR GERÇEK VERİ (sonraki tur)
DMP sayıları (FDR<0.05, doğrulandı): sigara 89, kokain 11987, opioid 12, meth 398,
alkol-beyin(GSE49393) 8.
En anlamlı CpG: sigara cg05575921 (AHRR) Δβ=-0.245 p=2.4e-55 FDR=1.2e-49;
kokain cg06808467 Δβ=-0.114; opioid cg27504782 Δβ=-0.026 FDR=0.0225;
meth cg06763671 Δβ=+0.064; alkol-beyin cg00393248 Δβ=+0.051 FDR=0.030.
(Hassas p üsleri t3 yazımından hemen önce *_dmp.csv'den tam hâliyle okunacak.)

## KRİTİK DÜRÜST BULGU (yorum, makalede açıkça belirtilecek)
Gerçek Horvath EAA (vaka−kontrol) KÜÇÜK ve NEGATİF:
- GSE49393 alkol-beyin: −0.82 yıl
- GSE77056 kokain: −0.66 yıl
- GSE98203 opioid-beyin: −1.48 yıl
Bu, makalenin uydurma "+2.8 ila +7.3 yıl hızlanmış yaşlanma" iddiasının
TERSİDİR. Gerçek veri, bu kohortlarda hızlanmış epigenetik yaşlanmayı
DESTEKLEMİYOR (küçük n, doku/postmortem karıştırıcılar, Horvath sınırlılıkları
tartışılacak). Confirmation bias yok: bulgu olduğu gibi raporlanacak.
