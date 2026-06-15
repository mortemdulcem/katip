# Araştırma Korpusu — 44 PDF (Google Drive)

Toplam: 44 PDF, ~25.467 sayfa, ~1.04 GB. Hepsi `attached_assets/research_corpus/NN.pdf`.
**Tümü referans/ders kitabı niteliğinde — etiketli eğitim veri seti (görüntü/ölçüm/CSV) YOK.**
(14 ve 22 taranmış, OCR'sız — metin çıkarılamıyor.)

## ⭐ Tez için en kritik kaynak
- 44 — **Handbook of Anthropometry** (Springer, ed. V.R. Preedy) — 3042s. İnsan vücut/kafatası/orbita ölçümleri (antropometri) ansiklopedisi. Orbita yükseklik/genişlik, dış orbital yüzey alanı, cinsiyet/yaş/etnik grup ölçüm metodolojisi içeriyor → **Dr. Nurcan'ın 3B BT orbital morfometri + cinsiyet tayini tezinin doğrudan temel kaynağı.** 4.798 pasaj, sayfa atıflı indeksli.

## A) Yapay Zekâ / Makine Öğrenmesi / Derin Öğrenme (yöntem öğrenmek için)
- 04 — Fundamentals of Data Engineering (540s)
- 05 — Introduction to Algorithms, 4. baskı / CLRS (1677s)
- 10 — Neuromorphic Computing: Principles and Organization (415s)
- 12 — Artificial Intelligence in Bioinformatics and Chemoinformatics (275s)
- 16 — A Practical Guide to Oracle AI Engineering (354s)
- 23 — Architecture Patterns with Python (475s)
- 25 — Reinforcement Learning (626s)
- 28 — Quantum Computational AI (306s)
- 29 — AI Engineering (991s)
- 33 — Neuromorphic Computing Unleashed (57s)
- 35 — Deep Medicine — Eric Topol (429s)
- 36 — AI Engineering in Practice (MEAP) (126s)
- 37 — Machine Learning for Healthcare Systems (251s)
- 40 — Deep Learning in Biomedical Signal and Medical Imaging (Deep CNN) (274s) ★ en yakın konu
- 41 — High Performance Python (991s)

## B) Adli Tıp / Patoloji / Antropoloji / Psikiyatri / Tıp (alan bilgisi)
- 01 — Interpreting DNA Evidence: Statistical Genetics for Forensic Scientists (300s)
- 02 — Brain Medicine (169s)
- 06 — Developmental Neuropsychiatry (529s)
- 07 — A Field Guide to Ghost Guns (173s)
- 08 — Epilepsy (305s)
- 09 — Beating the Devil's Game (adli tıp tarihi) (311s)
- 11 — The Forensic Psychology of Criminal Minds (295s)
- 13 — Forensic Pathology of Unexpected and Unexplained Deaths (321s)
- 14 — (taranmış, OCR yok; neuropsikoloji/değerlendirme, ed. Robert B. Stern) (631s)
- 15 — The Bone Lady (adli antropoloji) (152s)
- 17 — (psikiyatri referansı, Harvard; taranmış benzeri, 3617s)
- 20 — Death Investigation (369s)
- 24 — Forensic Psychology For Dummies (419s)
- 30 — Fundamental Concepts (671s)
- 31 — Inflamed (467s)
- 32 — Forensic Psychology For Dummies (24'ün kopyası) (419s)
- 34 — Forensic Science: An Introduction (376s)
- 42 — Dead Men Do Tell Tales (adli antropoloji) (295s)

## C) Bilgisayar / Ağ / Dijital Adli Bilişim + Güvenlik
- 03 — Network Forensics: Tracking Hackers through Cyberspace (1106s)
- 18 — Digital Forensics for Enterprises Beyond Kali Linux (494s)
- 19 — Computer Forensics (1095s)
- 21 — Learn Computer Forensics (290s)
- 26 — Hacking With Kali Linux (89s)
- 27 — Network Forensics with Wireshark (209s)
- 38 — Practical Linux Forensics (357s)
- 39 — Basic Wifi-hacking (167s)
- 43 — Hands-On Network Forensics (459s)

## D) Taranmış (görüntü) PDF — OCR sınırlı
- 22 — Medicolegal Investigation of Death (ed. Werner U. Spitz & Russell S. Fisher) — adli patoloji klasiği, 553s tamamen taranmış görüntü. Bu ortamda OCR çok yavaş ve tarama kalitesi düşük (denenen ~40 sayfadan yalnızca ~10'u okunabilir metin verdi). `scripts/research/ocr22.sh` ile devam ettirilebilir (resumable).

---
## Bilgi tabanı (kalıcı "öğrenme")
- Tüm metinler: `attached_assets/research_corpus/text/NN.txt` (sayfa ayraçlı, `\f`).
- Postgres pgvector/FTS tablosu `corpus_chunks`: **18.760 pasaj**, sayfa atıflı, `tsvector` tam metin arama (GIN index).
- Sorgu aracı: `node scripts/research/ask.cjs "soru/anahtar kelime" [k]` → kitap + sayfa atıflı pasajlar.
- Not: Replit AI proxy `/embeddings` desteklemiyor; semantik vektör yerine yerel/yeniden-üretilebilir Postgres tam metin arama kullanıldı (zero-hallucination + reproducibility uyumlu).
