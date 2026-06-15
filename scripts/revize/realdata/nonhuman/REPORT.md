# İnsan-Dışı Madde Metilasyon Analizleri — Gerçek Veri Raporu

**Bağlam:** Madde (uyuşturucu) DNA-metilasyon verisi taraması insanla sınırlı tutulmamalı; hayvan/hücre-hattı verisi de geçerli sayılır (kullanıcı düzeltmesi, 13 Haziran 2026). Bu klasör, insan kohortunda **veri yok** denen iki madde için bulunan gerçek hayvan verisinin analizini içerir. **Sıfır-halüsinasyon:** tüm sonuçlar gerçek GEO verisinden, sabit yöntemle hesaplandı; null sonuçlar olduğu gibi raporlandı (sonuç peşinde koşma yok).

---

## 1) MDMA (ecstasy) — Mus musculus, kalp dokusu

- **Veri:** GEO **GSE68199** (NimbleGen MM9 Deluxe Promoter Methylation, MeDIP), n=19 örnek.
- **İndirme yöntemi:** 2 GB `GSE68199_RAW.tar` GEREKMEDİ; her örneğin işlenmiş peak dosyası
  (`GSM*_ratio_peak_pvalues_mapToFeatures.txt.gz`, ~5–15 MB) GSM seviyesinden tek tek indirildi (`mdma/`).
- **Gruplar:** Saline-10g (GSM1665569–572), MDMA-10g (573–576), Saline-35g (577–580),
  MDMA-35g (581–583), MDMA-10/25g yıkama (584–587).
- **Yöntem (`mdma_dmp.py`):** promotör peak'leri = `transcription_start_site` ve TSS'ye |mesafe| ≤ 2000 bp;
  her örnekte her gen için **max PEAK_SCORE**; gen birleşimi (peak yoksa skor=0); Welch t-testi + BH-FDR.
- **Sonuçlar (`out/GSE68199_mdma_mouse_dmp.json`):**

| Kontrast | Test edilen gen | FDR<0.05 | FDR<0.10 | min q | En güçlü |
|---|---|---|---|---|---|
| MDMA-10g vs Salin-10g (4v4) | 12.214 | 0 | 0 | 0.134 | Pmpcb (p=1.1e-5) |
| MDMA-35g vs Salin-35g (3v4) | 13.822 | 0 | 0 | 0.646 | Cyp4v3 (p=1.8e-4) |
| Tüm-MDMA vs Tüm-Salin (11v8) | 17.256 | 0 | 3 | 0.067 | Pak2, Efhb, Esr2 |

- **Yorum (dürüst):** Eşleştirilmiş (aynı zaman noktası) birincil kontrastlar **null** — FDR<0.05'te tek gen yok.
  Havuzlanmış analizde 3 gen FDR<0.10 sınırında (Esr2 = östrojen reseptörü β, kalp dokusunda biyolojik olarak
  makul), **ama** hiçbiri FDR<0.05 değil ve havuzlama farklı zaman noktalarını karıştırdığı için **confounded**.
- **Sınırlılık:** peak-tabanlı (sürekli probe-betası değil). **Sıfır-doldurma uyarısı:** bir örnekte
  promotörde peak saptanmamışsa skor = 0 yazılır; bu "ölçülen sıfır metilasyon yoğunluğu" değil,
  "peak saptanmadı" (sansürlü kanıt) demektir — varlık/yokluk farklarını abartabilir, bu yüzden sonuçlar
  yalnızca **kesif/öneri** düzeyinde yorumlanmalı. n küçük (3–4/grup); doku kalp (beyin/kan değil).
  İnsan MDMA metilasyon verisi hâlâ **yok**.

## 2) Kokain — sıçan, Nucleus Accumbens (NAc)

- **Analiz edilen veri:** GEO **GSE66348** (sıçan NAc, n=15), normalize log2-ratio probe matrisi.
- **Not:** GSE66347 (NAc + RG108/SAM, n=10) de indirildi (`GSE66347_norm.txt.gz`) **ama analiz edilmedi** —
  o set farklı tasarım (DNMT-inhibitörü RG108 + metil-donör SAM ile farmakolojik müdahale), bu vaka/kontrol
  kontrastına dahil değil. Bu raporun kokain sonuçları **yalnızca GSE66348**'e dayanır.
- **Yöntem (`cocaine_rat_dmp.py`):** Welch t-testi + BH-FDR.
- **Sonuçlar (`out/GSE66348_cocaine_rat_dmp.json`):** D30CUE vs CNTRL FDR<0.05 = **0** (min q=0.272);
  tüm-kokain vs CNTRL FDR<0.10 = **1** (min q=0.096). n=3–4 → güçsüz, **dürüst null**.

## 3) Doğrulanmış VERİ YOK (insan + hayvan + hücre-hattı arandı)

- **Ketamin:** metilasyon verisi yok (GEO hitleri "anesthesia" keyword'ünden, madde-odaklı değil).
- **Sentetik kannabinoidler** (JWH-018/073, AB-FUBINACA, XLR-11 vb.): metilasyon verisi yok;
  tek bulgu GSE134935 = **gen ifadesi (expression)**, metilasyon değil.

---

## Tekrar Üretilebilirlik

| Çıktı | Betik | Veri (SHA-256 manifest) |
|---|---|---|
| `out/GSE68199_mdma_mouse_dmp.json` | `mdma_dmp.py` | JSON içi `data_manifest_sha256` (19 dosya) |
| `out/GSE66348_cocaine_rat_dmp.json` | `cocaine_rat_dmp.py` | `GSE66348_norm.txt.gz` (JSON içi `data_sha256`) |

Çalıştırma: `python3 mdma_dmp.py` ve `python3 cocaine_rat_dmp.py` (her ikisi `numpy`; p-değerleri için `scipy` varsa exact, yoksa normal-yaklaşım — JSON `p_method` alanında belirtilir).
