import { useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, Download, Eye, X, FileDown } from "lucide-react";

const THESIS_TITLE =
  "Türk Populasyonunda 3B BT ile Orbital Morfometriden Cinsiyet Tayini: Lineer Ölçümler, Geometrik Morfometri ve Asimetri Analizlerinin Kapsamlı Değerlendirmesi";
const RESEARCHER = "Dr. Nurcan Denli Bayır";
const RESEARCHER_TITLE = "Arş. Gör. Dr.";
const CLINIC = "Adli Tıp Anabilim Dalı";
const SUPPORT_CLINIC = "Radyoloji Anabilim Dalı";
const HOSPITAL = "Ankara Bilkent Şehir Hastanesi";
const ADMIN_RESPONSIBLE = "Prof. Dr. Yavuz Hekimoğlu";
const RADIOLOGY_PROF = "Prof. Dr. Muharrem Tola";

const PDF_STYLES = `
  @page {
    size: A4;
    margin: 2.5cm 2.5cm 2.5cm 3cm;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', 'Noto Serif', serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000;
    background: #fff;
    padding: 0;
    max-width: 210mm;
    margin: 0 auto;
  }
  .doc-page {
    padding: 2.5cm 2.5cm 2.5cm 3cm;
    min-height: 297mm;
    position: relative;
  }
  .doc-header-block {
    text-align: center;
    margin-bottom: 24pt;
    border-bottom: 2px solid #000;
    padding-bottom: 12pt;
  }
  .doc-header-block .institution {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    margin-bottom: 4pt;
  }
  .doc-header-block .department {
    font-size: 10pt;
    margin-bottom: 8pt;
  }
  .doc-header-block .doc-title {
    font-size: 13pt;
    font-weight: bold;
    text-decoration: underline;
    margin-top: 8pt;
  }
  h2 {
    font-size: 13pt;
    text-align: center;
    margin-bottom: 18pt;
    font-weight: bold;
    text-decoration: underline;
  }
  h3 {
    font-size: 12pt;
    margin-top: 14pt;
    margin-bottom: 8pt;
    font-weight: bold;
    border-bottom: 1px solid #999;
    padding-bottom: 3pt;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8pt 0;
    font-size: 11pt;
  }
  td, th {
    padding: 5pt 8pt;
    text-align: left;
    vertical-align: top;
  }
  .border, td.border, th.border { border: 1px solid #333; }
  .border-b { border-bottom: 1px solid #bbb; }
  .border-t { border-top: 1px solid #bbb; }
  ol, ul { padding-left: 20pt; margin: 6pt 0; }
  li { margin: 3pt 0; line-height: 1.5; }
  p { margin: 5pt 0; }
  .text-justify { text-align: justify; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-bold, .font-semibold, strong { font-weight: bold; }
  .leading-relaxed { line-height: 1.8; }
  .mt-1 { margin-top: 4pt; } .mt-2 { margin-top: 8pt; } .mt-4 { margin-top: 14pt; } .mt-6 { margin-top: 20pt; } .mt-8 { margin-top: 28pt; } .mt-16 { margin-top: 48pt; }
  .mb-2 { margin-bottom: 8pt; } .mb-4 { margin-bottom: 14pt; } .mb-6 { margin-bottom: 20pt; } .mb-8 { margin-bottom: 28pt; } .mb-12 { margin-bottom: 40pt; }
  .py-1 { padding-top: 4pt; padding-bottom: 4pt; } .py-2 { padding-top: 6pt; padding-bottom: 6pt; }
  .p-1 { padding: 4pt; } .p-2 { padding: 6pt; } .p-4 { padding: 14pt; }
  .pt-6 { padding-top: 20pt; } .pb-2 { padding-bottom: 6pt; }
  .space-y-1 > * + * { margin-top: 4pt; } .space-y-2 > * + * { margin-top: 8pt; } .space-y-3 > * + * { margin-top: 10pt; } .space-y-4 > * + * { margin-top: 14pt; } .space-y-8 > * + * { margin-top: 28pt; }
  .pl-6 { padding-left: 20pt; }
  .w-1\\/3 { width: 33%; } .w-2\\/3 { width: 66%; } .w-20 { width: 60pt; }
  .gap-2 { gap: 8pt; }
  .flex { display: flex; } .justify-between { justify-content: space-between; }
  .items-start { align-items: flex-start; }
  .min-w-\\[60px\\] { min-width: 50pt; }
  .bg-muted\\/50, .bg-muted\\/30 { background-color: #f5f5f5; }
  .rounded-md { border-radius: 0; }
  .text-xs { font-size: 9pt; } .text-sm { font-size: 11pt; }
  .text-muted-foreground { color: #555; }
  .underline { text-decoration: underline; }
  .list-decimal { list-style-type: decimal; } .list-disc { list-style-type: disc; }
  .overflow-x-auto { overflow-x: visible; }
  .signature-line {
    border-bottom: 1px solid #000;
    width: 180pt;
    display: inline-block;
    margin-top: 30pt;
  }
  .doc-action-btns, .pdf-download-btn { display: none !important; }
  @media screen {
    body {
      background: #e8e8e8;
      padding: 20px 0;
    }
    .doc-page {
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      margin: 0 auto;
      max-width: 210mm;
    }
  }
  @media print {
    body { background: #fff; padding: 0; }
    .doc-page { padding: 0; min-height: auto; box-shadow: none; }
  }
`;

function getDocHtml(docId: string, fileName: string): string {
  const el = document.getElementById(docId);
  if (!el) return "";
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".doc-action-btns").forEach(b => b.remove());
  const existingH2 = clone.querySelector("h2");
  const docTitle = existingH2 ? existingH2.textContent || "" : fileName;
  if (existingH2) existingH2.remove();
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${fileName}</title>
<style>${PDF_STYLES}</style>
</head>
<body>
<div class="doc-page">
  <div class="doc-header-block">
    <div class="institution">T.C. SAĞLIK BAKANLIĞI</div>
    <div class="institution">${HOSPITAL.toUpperCase()}</div>
    <div class="department">${CLINIC} / ${SUPPORT_CLINIC}</div>
    <div class="department">Tıbbi Araştırmalar Bilimsel ve Etik Değerlendirme Kurulu</div>
    <div class="doc-title">${docTitle}</div>
  </div>
  ${clone.innerHTML}
</div>
</body>
</html>`;
}

function openDocPreview(docId: string, fileName: string) {
  const html = getDocHtml(docId, fileName);
  if (!html) return;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function downloadDocAsPdf(docId: string, fileName: string) {
  const html = getDocHtml(docId, fileName);
  if (!html) return;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.print(); }, 500);
}

const ALL_DOCS = [
  { id: "doc-1", title: "BELGE 1: TABED KONTROL LİSTESİ" },
  { id: "doc-2", title: "BELGE 2: BAŞVURU DİLEKÇESİ" },
  { id: "doc-3", title: "BELGE 3: ARAŞTIRMACI ÖZGEÇMİŞİ" },
  { id: "doc-4", title: "BELGE 4: ARAŞTIRMACI BEYANNAMESI" },
  { id: "doc-5", title: "BELGE 5: ETİK KURUL DEĞERLENDİRME FORMU" },
  { id: "doc-6", title: "BELGE 6: ARAŞTIRMA BÜTÇESİ" },
  { id: "doc-7", title: "BELGE 7: ARAŞTIRMA PROTOKOLÜ" },
  { id: "doc-8", title: "BELGE 8: YARDIMCI DOKÜMANLAR" },
  { id: "doc-9", title: "BELGE 9: YAYIN ETİĞİ BEYANI" },
  { id: "doc-10", title: "BELGE 10: KURUM İZİN YAZISI" },
  { id: "doc-11", title: "BELGE 11: VERİ KULLANIM SÖZLEŞMESİ" },
  { id: "doc-12", title: "BELGE 12: ETİK KURUL ONAY FORMU" },
  { id: "doc-13", title: "BELGE 13: ARAŞTIRMA ZAMAN ÇİZELGESİ" },
  { id: "doc-14", title: "BELGE 14: DETAYLI ARAŞTIRMA PROTOKOLÜ" },
];

function downloadAllAsDoc() {
  const docSections: string[] = [];
  ALL_DOCS.forEach((doc) => {
    const el = document.getElementById(doc.id);
    if (!el) return;
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".doc-action-btns").forEach((b) => b.remove());
    const existingH2 = clone.querySelector("h2");
    if (existingH2) existingH2.remove();
    docSections.push(`
      <div style="page-break-before: always;"></div>
      <div style="text-align:center; margin-bottom:18pt; border-bottom:2pt solid #000; padding-bottom:10pt;">
        <p style="font-size:11pt; font-weight:bold; text-transform:uppercase; letter-spacing:0.5pt; margin-bottom:3pt;">T.C. SAĞLIK BAKANLIĞI</p>
        <p style="font-size:11pt; font-weight:bold; text-transform:uppercase; letter-spacing:0.5pt; margin-bottom:6pt;">${HOSPITAL.toUpperCase()}</p>
        <p style="font-size:10pt; margin-bottom:3pt;">${CLINIC} / ${SUPPORT_CLINIC}</p>
        <p style="font-size:10pt; margin-bottom:6pt;">Tıbbi Araştırmalar Bilimsel ve Etik Değerlendirme Kurulu</p>
        <p style="font-size:13pt; font-weight:bold; text-decoration:underline; margin-top:6pt;">${doc.title}</p>
      </div>
      ${clone.innerHTML}
    `);
  });
  const fullHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: A4;
    margin: 2.5cm 2.5cm 2.5cm 3cm;
  }
  body {
    font-family: 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000;
  }
  table { width: 100%; border-collapse: collapse; margin: 6pt 0; font-size: 11pt; }
  td, th { padding: 4pt 6pt; text-align: left; vertical-align: top; }
  h2 { font-size: 13pt; text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 14pt; }
  h3 { font-size: 12pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; border-bottom: 1px solid #999; padding-bottom: 2pt; }
  ol, ul { padding-left: 20pt; margin: 4pt 0; }
  li { margin: 2pt 0; }
  p { margin: 4pt 0; }
  .border, td.border, th.border { border: 1px solid #333; }
  .border-b { border-bottom: 1px solid #bbb; }
  .text-justify { text-align: justify; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-bold, .font-semibold, strong { font-weight: bold; }
  .leading-relaxed { line-height: 1.8; }
  .text-xs { font-size: 9pt; } .text-sm { font-size: 11pt; }
  .underline { text-decoration: underline; }
  .list-decimal { list-style-type: decimal; } .list-disc { list-style-type: disc; }
  .mt-1 { margin-top: 4pt; } .mt-2 { margin-top: 8pt; } .mt-4 { margin-top: 14pt; } .mt-6 { margin-top: 20pt; } .mt-8 { margin-top: 28pt; }
  .mb-2 { margin-bottom: 8pt; } .mb-4 { margin-bottom: 14pt; } .mb-6 { margin-bottom: 20pt; } .mb-8 { margin-bottom: 28pt; }
  .space-y-1 > * + * { margin-top: 4pt; } .space-y-2 > * + * { margin-top: 8pt; } .space-y-3 > * + * { margin-top: 10pt; } .space-y-4 > * + * { margin-top: 14pt; }
  .pl-6 { padding-left: 20pt; }
  .py-1 { padding-top: 4pt; padding-bottom: 4pt; } .py-2 { padding-top: 6pt; padding-bottom: 6pt; }
  .p-1 { padding: 4pt; } .p-2 { padding: 6pt; } .p-4 { padding: 14pt; }
  .w-1\\/3 { width: 33%; } .w-2\\/3 { width: 66%; }
  .flex { display: flex; } .justify-between { justify-content: space-between; }
  .bg-muted\\/50, .bg-muted\\/30 { background-color: #f5f5f5; }
  .text-muted-foreground { color: #555; }
  .doc-action-btns, .pdf-download-btn { display: none !important; }
</style>
</head>
<body>
${docSections.join("\n")}
</body>
</html>`;
  const blob = new Blob(["\ufeff" + fullHtml], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Etik_Kurul_Belgeleri_Tumu.doc";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function DocHeader({
  title,
  docId,
  fileName,
}: {
  title: string;
  docId: string;
  fileName: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-end gap-2 mb-2 print:hidden doc-action-btns">
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => openDocPreview(docId, fileName)}
          data-testid={`button-preview-${docId}`}
        >
          <Eye className="w-3 h-3" />
          Onizle
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => downloadDocAsPdf(docId, fileName)}
          data-testid={`button-download-${docId}`}
        >
          <Download className="w-3 h-3" />
          PDF Indir
        </Button>
      </div>
      <h2 className="text-lg font-bold text-center underline">{title}</h2>
    </div>
  );
}

export default function EthicsDocuments() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="print-hidden">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-6 ethics-print-content">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-6 print:hidden">
            <div>
              <h1
                className="text-2xl font-display font-bold"
                data-testid="text-page-title"
              >
                Etik Kurul Belgeleri
              </h1>
              <p className="text-muted-foreground mt-1">
                Tez basvuru belgeleri - doldurulmus hali. Her belgeyi ayri ayri
                PDF olarak indirebilirsiniz.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={downloadAllAsDoc}
                className="gap-2"
                data-testid="button-download-all-doc"
              >
                <FileDown className="w-4 h-4" />
                Tumunu DOC Indir
              </Button>
              <Button
                onClick={handlePrintAll}
                variant="outline"
                className="gap-2"
                data-testid="button-print-all"
              >
                <Printer className="w-4 h-4" />
                Tumunu Yazdir
              </Button>
            </div>
          </div>

          <div ref={printRef} className="space-y-8 max-w-4xl mx-auto">
            {/* BELGE 1: TABED Kontrol Listesi */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-1"
            >
              <DocHeader
                title="BELGE 1: TABED KONTROL LİSTESİ"
                docId="doc-1"
                fileName="Belge_01_TABED_Kontrol_Listesi"
              />

              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-semibold">Araştırmanın Adı:</td>
                    <td className="py-2">{THESIS_TITLE}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold">Sorumlu Araştırmacı:</td>
                    <td className="py-2">
                      {RESEARCHER_TITLE} {RESEARCHER}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold">
                      Başvurulan Çalışmanın Türü:
                    </td>
                    <td className="py-2">
                      [X] Tez &nbsp;&nbsp;&nbsp; [ ] Tez Dışı
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold">Başvuru Türü:</td>
                    <td className="py-2">
                      [X] İlk Başvuru &nbsp;&nbsp;&nbsp; [ ] Düzeltme Başvurusu
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-4 space-y-2 text-sm">
                {[
                  "TABED Başvuru Dilekçesi (Araştırma Tez değil ise evrak kayıttan geçirilmiş olmalı)",
                  "Başka Bir Bilimsel Araştırmalar Etik Kurula Müracaat Edilmediğine Dair Sorumlu Araştırıcı İmzalı Belge",
                  "Araştırma Tez İse; Eğitim Görevlisi İmzalı Başvuru Dilekçesi",
                  "İlgili Diğer Klinikler İçin Birim Onayı",
                  "TABED Başvuru Formu (Araştırmacılar bölümü imzalı olmalı)",
                  "Araştırma Protokolü (Tüm araştırmacılar tarafından her sayfa ıslak imzalı)",
                  "Veri Toplama Formu (Tablo Şeklinde hazırlanmalı. KVKK kapsamında Hasta Ad-Soyad ve T.C. bulunmamalı)",
                  "Bilgilendirilmiş Gönüllü Onam Formu (BGOF) - Retrospektif çalışma olduğu için gerekli değildir",
                  "Araştırma Bütçe Formu",
                  "Güncel Özgeçmiş Formu",
                  "İyi Klinik Uygulamaları Kılavuzu (Nisan 2013) Taahhütnamesi",
                  "Helsinki Bildirgesi (2024)",
                  "Tam Metin Literatür (Araştırma ile ilgili en az 3 adet)",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-semibold min-w-[60px]">[Evet]</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* BELGE 2: TABED Başvuru Dilekçesi */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-2"
            >
              <DocHeader
                title="BELGE 2: TABED BAŞVURU DİLEKÇESİ"
                docId="doc-2"
                fileName="Belge_02_TABED_Basvuru_Dilekcesi"
              />

              <p className="text-right mb-8">...../...../2025</p>

              <p className="font-semibold mb-4">
                Tıbbi Araştırmalar Bilimsel ve Etik Değerlendirme Kurulu
                Başkanlığı'na
              </p>

              <p className="mb-6 leading-relaxed text-justify">
                Hastanemiz <strong>{CLINIC}</strong> Kliniğinde yapılması
                planlanan ve{" "}
                <strong>
                  {RESEARCHER_TITLE} {RESEARCHER}
                </strong>
                'ın sorumlu araştırmacısı olduğu{" "}
                <strong>"{THESIS_TITLE}"</strong> isimli akademik amaçlı
                çalışmanın Tıbbi Araştırmalar Bilimsel ve Etik Değerlendirme
                Kurallarına uygunluğunun tarafınızdan değerlendirilmesi için;
              </p>
              <p className="mb-12">Gereğinin yapılmasını arz ederim.</p>

              <div className="flex justify-between mt-16">
                <div className="text-center">
                  <p className="font-semibold">{CLINIC}</p>
                  <p>İdari Sorumlusu</p>
                  <p className="mt-4">{ADMIN_RESPONSIBLE}</p>
                  <p className="mt-2">İmza</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{CLINIC}</p>
                  <p>Eğitim Sorumlusu</p>
                  <p className="mt-4">................................</p>
                  <p className="mt-2">İmza</p>
                </div>
              </div>
            </Card>

            {/* BELGE 3: Başka Etik Kurula Müracaat Edilmediğine Dair Belge */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-3"
            >
              <DocHeader
                title="BELGE 3: BAŞKA ETİK KURULA MÜRACAAT EDİLMEDİĞİNE DAİR BELGE"
                docId="doc-3"
                fileName="Belge_03_Baska_Etik_Kurula_Muracaat_Edilmedigi"
              />

              <p className="text-right mb-8">...../...../2025</p>

              <p className="font-semibold mb-4">
                Tıbbi Araştırmalar Bilimsel ve Etik Değerlendirme Kurulu
                Başkanlığı'na
              </p>

              <p className="mb-6 leading-relaxed text-justify">
                Hastanemiz <strong>{CLINIC}</strong> Kliniğinde planlanan ve{" "}
                <strong>
                  {RESEARCHER_TITLE} {RESEARCHER}
                </strong>
                'ın sorumlu araştırmacısı olduğu{" "}
                <strong>"{THESIS_TITLE}"</strong> isimli çalışma için başka bir
                etik kurula başvurulmamıştır.
              </p>
              <p className="mb-6">Bilgilerinize arz ederim.</p>

              <div className="text-right mt-16">
                <p>Sorumlu Araştırmacı</p>
                <p className="mt-4">
                  {RESEARCHER_TITLE} {RESEARCHER}
                </p>
                <p className="mt-2">İmza</p>
              </div>
            </Card>

            {/* BELGE 4: Tez Amaçlı Etik Kurul Başvuru Dilekçesi */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-4"
            >
              <DocHeader
                title="BELGE 4: TEZ AMACLI ETİK KURUL BAŞVURU DİLEKÇESİ"
                docId="doc-4"
                fileName="Belge_04_Tez_Amacli_Basvuru_Dilekcesi"
              />

              <p className="text-right mb-8">...../...../2025</p>

              <p className="font-semibold mb-4">
                Tıbbi Araştırmalar Bilimsel ve Etik Değerlendirme Kurulu
                Başkanlığı'na
              </p>

              <p className="mb-6 leading-relaxed text-justify">
                Hastanemiz <strong>{CLINIC}</strong> Kliniğinde yapılması
                planlanan,{" "}
                <strong>
                  {RESEARCHER_TITLE} {RESEARCHER}
                </strong>
                'ın sorumlu araştırmacısı olduğu ve{" "}
                <strong>
                  {RESEARCHER_TITLE} {RESEARCHER}
                </strong>
                'a ait <strong>"{THESIS_TITLE}"</strong> isimli TEZ çalışmasının
                etik kurallara uygunluğunun tarafınızdan değerlendirilmesi için;
              </p>
              <p className="mb-12">Gereğini arz ederim.</p>

              <div className="flex justify-between mt-16">
                <div className="text-center">
                  <p className="font-semibold">{CLINIC}</p>
                  <p>İdari Sorumlusu</p>
                  <p className="mt-4">{ADMIN_RESPONSIBLE}</p>
                  <p className="mt-2">İmza</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{CLINIC}</p>
                  <p>Eğitim Sorumlusu</p>
                  <p className="mt-4">................................</p>
                  <p className="mt-2">İmza</p>
                </div>
              </div>
            </Card>

            {/* BELGE 5: İlgili Klinik Onayı Dilekçesi */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-5"
            >
              <DocHeader
                title="BELGE 5: İLGİLİ KLİNİK ONAYI DİLEKÇESİ"
                docId="doc-5"
                fileName="Belge_05_Klinik_Onayi_Dilekcesi"
              />

              <p className="font-semibold text-center mb-6">{HOSPITAL}</p>
              <p className="font-semibold mb-4">
                {SUPPORT_CLINIC} Klinik Eğitim ve İdari Sorumlusuna
              </p>

              <p className="mb-6 leading-relaxed text-justify">
                Ekte Araştırma Protokolü örneği bulunan ve{" "}
                <strong>{CLINIC}</strong> tarafından planlanan{" "}
                <strong>"{THESIS_TITLE}"</strong> isimli çalışmanın ilgili
                kısımlarının kliniğiniz/biriminiz bünyesinde
                gerçekleştirilebilmesi hususunda olumlu görüşlerinizi
                bildirmenizi arz/rica ederim.
              </p>

              <p className="text-right mb-8">...../...../2025</p>

              <div className="mb-8">
                <p className="font-semibold">KOORDİNATÖR/SORUMLU ARAŞTIRMACI</p>
                <p className="mt-2">
                  {RESEARCHER_TITLE} {RESEARCHER}
                </p>
                <p className="mt-2">İmza</p>
              </div>

              <div className="border-t pt-6">
                <p className="text-center font-bold mb-4">U Y G U N D U R</p>
                <p className="text-center mb-6">...../...../2025</p>

                <div className="flex justify-between">
                  <div className="text-center">
                    <p className="font-semibold">KLİNİK EĞİTİM SORUMLUSU</p>
                    <p className="mt-4">................................</p>
                    <p className="mt-2">İmza</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">KLİNİK İDARİ SORUMLUSU</p>
                    <p className="mt-4">{RADIOLOGY_PROF}</p>
                    <p className="mt-2">İmza</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* BELGE 6: TABED Başvuru Formu (Ana Form) */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-6"
            >
              <DocHeader
                title="BELGE 6: TABED BAŞVURU FORMU"
                docId="doc-6"
                fileName="Belge_06_TABED_Basvuru_Formu"
              />

              <div className="space-y-4 text-sm">
                <h3 className="font-bold text-base border-b pb-2">
                  1. Araştırmanın Bilgileri
                </h3>

                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-semibold w-1/3">
                        1.1. Araştırmanın adı:
                      </td>
                      <td className="py-2">{THESIS_TITLE}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        Anahtar Kelimeler:
                      </td>
                      <td className="py-2">
                        Orbital morfometri, Cinsiyet tayini, Üç boyutlu bilgisayarlı tomografi, Geometrik morfometri, Adli antropoloji
                        <br />
                        <span className="text-muted-foreground italic">Orbital morphometry, Sex determination, Three-dimensional computed tomography, Geometric morphometrics, Forensic anthropology</span>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        1.2. Etik Kurula yapılan başvuru:
                      </td>
                      <td className="py-2">
                        [X] İlk başvuru &nbsp;&nbsp; [ ] Düzeltme
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        1.3. Ana klinik / bölüm:
                      </td>
                      <td className="py-2">
                        {HOSPITAL} - {CLINIC}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        1.4. Diğer klinikler / bölümler:
                      </td>
                      <td className="py-2">
                        {HOSPITAL} - {SUPPORT_CLINIC}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        1.5. Çok merkezli mi?
                      </td>
                      <td className="py-2">Hayır (Tek merkez)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        1.6. Araştırmanın statüsü:
                      </td>
                      <td className="py-2">[X] Uzmanlık tezi / projesi</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="font-bold text-base border-b pb-2 mt-6">
                  2. Araştırmanın Niteliği
                </h3>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-semibold w-2/3">
                        2.1. Gözlemsel çalışmanın türü:
                      </td>
                      <td className="py-2">[X] Kesitsel</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        2.2. Anket çalışması:
                      </td>
                      <td className="py-2">[ ] Evet &nbsp;&nbsp; [X] Hayır</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        2.3. Dosya kullanılarak yapılan arşiv taraması:
                      </td>
                      <td className="py-2">[X] Evet &nbsp;&nbsp; [ ] Hayır</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        2.4. Ses ve görüntü (Radyolojik) kayıtları kullanılarak
                        yapılan arşiv taraması:
                      </td>
                      <td className="py-2">[X] Evet &nbsp;&nbsp; [ ] Hayır</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        2.5. Rutin muayene, tetkik işlemleri sırasında elde
                        edilmiş materyaller ile yapılacak arşiv taraması:
                      </td>
                      <td className="py-2">[X] Evet &nbsp;&nbsp; [ ] Hayır</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        2.6. Hücre veya doku kültürü:
                      </td>
                      <td className="py-2">[ ] Evet &nbsp;&nbsp; [X] Hayır</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        2.7. Genetik materyal:
                      </td>
                      <td className="py-2">[ ] Evet &nbsp;&nbsp; [X] Hayır</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        2.8. Hemşirelik etkinlikleri:
                      </td>
                      <td className="py-2">[ ] Evet &nbsp;&nbsp; [X] Hayır</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        2.9. Vücut fizyolojisi ile ilgili:
                      </td>
                      <td className="py-2">[ ] Evet &nbsp;&nbsp; [X] Hayır</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        2.10. Antropometrik ölçümlere dayalı:
                      </td>
                      <td className="py-2">[X] Evet &nbsp;&nbsp; [ ] Hayır</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        2.11. Yaşam alışkanlıklarının değerlendirilmesi:
                      </td>
                      <td className="py-2">[ ] Evet &nbsp;&nbsp; [X] Hayır</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        2.12. Metodolojik yöntemsel:
                      </td>
                      <td className="py-2">[X] Evet &nbsp;&nbsp; [ ] Hayır</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        2.13. Araştırmanın türü:
                      </td>
                      <td className="py-2">[X] Retrospektif</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="font-bold text-base border-b pb-2 mt-6">
                  3. Araştırmanın Amacı
                </h3>
                <p className="text-justify leading-relaxed">
                  Bu çalışmanın amacı, Türk populasyonunda üç boyutlu
                  bilgisayarlı tomografi (3B BT) görüntüleri kullanılarak
                  orbital morfometrik parametrelerin cinsiyet tayinindeki rolünü
                  kapsamlı bir şekilde değerlendirmektir. Çalışmada klasik
                  lineer morfometrik ölçümler, geometrik morfometri (landmark
                  tabanlı şekil analizi) ve orbital asimetri analizleri bir
                  arada kullanılarak çok yöntemli bir yaklaşım benimsenecektir.
                </p>
                <p className="text-justify leading-relaxed mt-2">
                  Literatürde Türk populasyonuna özgü orbital volüm ölçümü ile
                  cinsiyet tayini yapan kapsamlı bir çalışma bulunmamaktadır.
                  Mevcut çalışmalar lineer ölçümlerle sınırlı kalmıştır (Kaya ve
                  Uygun, 2014; Pirinç ve ark., 2022; Özer ve ark., 2016). Acer
                  ve ark. (2009) stereolojik yöntemin güvenilirliğini
                  doğrulamış, Weaver ve ark. (2010) ise Amerikan populasyonunda
                  3B orbital antropometriyi travma modellemesi amacıyla
                  incelemiştir. Ancak bu çalışmaların hiçbiri, geniş bir
                  örneklemde orbital volümün ve geometrik morfometrinin cinsiyet
                  tayinindeki diskriminant gücünü sistematik olarak
                  değerlendirmemiştir. Bu çalışma, söz konusu boşluğu doldurmayı
                  amaçlamaktadır.
                </p>

                <h3 className="font-bold text-base border-b pb-2 mt-6">
                  4. Materyal ve Metot
                </h3>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-semibold w-1/3">
                        4.1. Başlama tarihi:
                      </td>
                      <td className="py-2">Etik Kurul Onay Kararından Sonra</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        4.2. Öngörülen süre:
                      </td>
                      <td className="py-2">10 ay</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        4.3. Yapılacağı yer:
                      </td>
                      <td className="py-2">
                        {HOSPITAL} - {CLINIC} ve {SUPPORT_CLINIC}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        4.4. Dosya/kayıt sayısı:
                      </td>
                      <td className="py-2">
                        .......... birey (eşit sayıda kadın ve erkek)
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-4">
                  <p className="font-semibold mb-2">
                    4.5. Materyal ve metot detayları:
                  </p>
                  <p className="text-justify leading-relaxed">
                    {HOSPITAL} {SUPPORT_CLINIC}'nda çeşitli klinik
                    endikasyonlarla çekilmiş kranial BT görüntüleri retrospektif
                    olarak taranacaktır. Anonim hasta verileri kullanılacak
                    olup, hastaların kimlik bilgileri çalışmaya dahil
                    edilmeyecektir. Görüntüler 3D Slicer yazılımı ile
                    değerlendirilecektir.
                  </p>
                  <p className="text-justify leading-relaxed mt-2 font-semibold">
                    Çalışmada üç temel analiz yöntemi uygulanacaktır:
                  </p>

                  <p className="mt-2 font-semibold">
                    A) Lineer Morfometrik Ölçümler (18 parametre):
                  </p>
                  <ol className="list-decimal pl-6 space-y-1 mt-1">
                    <li>Sağ orbital genişlik</li>
                    <li>Sol orbital genişlik</li>
                    <li>Sağ orbital yükseklik</li>
                    <li>Sol orbital yükseklik</li>
                    <li>Sağ orbital derinlik</li>
                    <li>Sol orbital derinlik</li>
                    <li>Sağ orbital hacim</li>
                    <li>Sol orbital hacim</li>
                    <li>Sağ orbital indeks (yükseklik/genişlik x 100)</li>
                    <li>Sol orbital indeks</li>
                    <li>Superior orbital kenar kalınlığı</li>
                    <li>İnferior orbital kenar kalınlığı</li>
                    <li>Medial orbital kenar kalınlığı</li>
                    <li>Lateral orbital kenar kalınlığı</li>
                    <li>İnterorbital mesafe</li>
                    <li>Biorbital genişlik</li>
                    <li>Orbital apertur alanı</li>
                    <li>Orbital apertur çevresi</li>
                  </ol>

                  <p className="mt-4 font-semibold">
                    B) Orbital Asimetri Parametreleri (7 parametre):
                  </p>
                  <ol className="list-decimal pl-6 space-y-1 mt-1" start={19}>
                    <li>
                      Orbital genişlik asimetri indeksi ((Sağ-Sol)/((Sağ+Sol)/2)
                      x 100)
                    </li>
                    <li>Orbital yükseklik asimetri indeksi</li>
                    <li>Orbital derinlik asimetri indeksi</li>
                    <li>Orbital hacim asimetri indeksi</li>
                    <li>Orbital indeks asimetri indeksi</li>
                    <li>Orbital apertur alanı asimetri indeksi</li>
                    <li>Direktional asimetri değerlendirmesi</li>
                  </ol>

                  <p className="mt-4 font-semibold">
                    C) Geometrik Morfometri Parametreleri (12 landmark +
                    türetilen değişkenler):
                  </p>
                  <p className="mt-1">
                    Her iki orbita üzerinde 12 anatomik landmark noktası (x, y,
                    z koordinatları) belirlenecektir:
                  </p>
                  <ol className="list-decimal pl-6 space-y-1 mt-1" start={26}>
                    <li>Dacryon (sağ/sol)</li>
                    <li>Frontomalare orbitale (sağ/sol)</li>
                    <li>Ectoconchion (sağ/sol)</li>
                    <li>Maxillofrontale (sağ/sol)</li>
                    <li>Superior orbital kenar orta noktası (sağ/sol)</li>
                    <li>İnferior orbital kenar orta noktası (sağ/sol)</li>
                  </ol>
                  <p className="mt-2">
                    Türetilen değişkenler: Centroid size, Procrustes
                    koordinatları, PCA skorları (PC1, PC2, PC3), Thin-Plate
                    Spline deformasyon gritleri
                  </p>
                </div>

                <div className="mt-4">
                  <p className="font-semibold mb-2">
                    4.6. Dahil edilme kriterleri:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>18 yaş üstü yetişkin bireyler</li>
                    <li>Kranial BT çekilmiş olan hastalar</li>
                    <li>
                      Orbital bölgede patoloji, travma veya cerrahi öyküsü
                      bulunmayan bireyler
                    </li>
                    <li>Görüntü kalitesi yeterli olan BT taramaları</li>
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="font-semibold mb-2">4.7. Dışlama kriterleri:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>18 yaş altı bireyler</li>
                    <li>
                      Orbital bölgede travma, fraktür veya cerrahi öyküsü olan
                      bireyler
                    </li>
                    <li>
                      Orbital bölgede tümör veya konjenital anomali bulunan
                      bireyler
                    </li>
                    <li>Görüntü kalitesi yetersiz olan BT taramaları</li>
                    <li>
                      Metal artefakt nedeniyle değerlendirme yapılamayan
                      görüntüler
                    </li>
                  </ul>
                </div>

                <table className="w-full border-collapse mt-4">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-semibold w-1/3">
                        4.8. Cinsiyet:
                      </td>
                      <td className="py-2">
                        [X] Kadın &nbsp;&nbsp; [X] Erkek (eşit sayıda)
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">4.9. Yaş aralığı:</td>
                      <td className="py-2">
                        18-85 yaş arası yetişkin bireyler
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">
                        4.10. Kontrol grubu:
                      </td>
                      <td className="py-2">
                        Hayır (Kadın ve erkek gruplar karşılaştırmalı olarak
                        değerlendirilecektir)
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-4">
                  <p className="font-semibold mb-2">
                    4.11. İstatistiksel analiz yöntemleri:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Tanımlayıcı istatistikler (ortalama, standart sapma,
                      minimum, maksimum)
                    </li>
                    <li>
                      Bağımsız örneklem t-testi / Mann-Whitney U testi
                      (cinsiyetler arası karşılaştırma)
                    </li>
                    <li>
                      Diskriminant fonksiyon analizi (cinsiyet sınıflandırması)
                    </li>
                    <li>
                      Binary lojistik regresyon analizi (Odds Ratio hesaplaması)
                    </li>
                    <li>ROC analizi (eşik değer belirleme)</li>
                    <li>Cross-validation (Leave-One-Out capraz doğrulama)</li>
                    <li>
                      Procrustes ANOVA (geometrik morfometri - şekil
                      farklılıklarının istatistiksel değerlendirmesi)
                    </li>
                    <li>
                      PCA - Temel Bileşenler Analizi (şekil varyasyonunun
                      değerlendirilmesi)
                    </li>
                    <li>
                      Geometrik morfometrik DFA (şekil tabanlı cinsiyet ayrımı)
                    </li>
                    <li>
                      p&lt;0.05 istatistiksel anlamlılık düzeyi olarak kabul
                      edilecektir
                    </li>
                  </ul>
                  <p className="mt-2">
                    Kullanılacak yazılımlar: SPSS, 3D Slicer, MorphoJ
                  </p>
                </div>

                <div className="mt-4">
                  <p className="font-semibold mb-2">4.12. Kaynaklar (APA 7):</p>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>
                      Acer, N., Sahin, B., Ergür, H., Basaloglu, H., &amp; Ceri, N. G. (2009). Stereological estimation of the orbital volume: A criterion standard study. <em>The Journal of Craniofacial Surgery</em>, <em>20</em>(3), 921–925. https://doi.org/10.1097/SCS.0b013e3181a14d09
                    </li>
                    <li>
                      Ajanovic, Z., Cizmovic, E., Kulenovic, A., Ljuca, F., &amp; Topcic, A. (2023). A geometric morphometrics approach for sex estimation based on the orbital region. <em>Scanning</em>, <em>2023</em>, 1–8. https://doi.org/10.1155/2023/6614028
                    </li>
                    <li>
                      Aljarrah, K., Qaroot, S. A., Khamees, A., &amp; Al-Zghoul, M. B. (2023). Morphometric evaluation of the orbital region for sex determination in a Saudi Arabian population using 3DCT images. <em>Anatomical Science International</em>, <em>98</em>(3), 405–413. https://doi.org/10.1007/s12565-023-00712-8
                    </li>
                    <li>
                      Birkby, W. H. (1966). An evaluation of race and sex identification from cranial measurements. <em>American Journal of Physical Anthropology</em>, <em>24</em>(1), 21–28. https://doi.org/10.1002/ajpa.1330240103
                    </li>
                    <li>
                      Can, I. O., Ekizoglu, O., Hocaoglu, E., Inci, E., &amp; Sayin, I. (2024). Machine learning algorithms for sex classification by using variables of orbital structures. <em>Diagnostics</em>, <em>14</em>(4), 378. https://doi.org/10.3390/diagnostics14040378
                    </li>
                    <li>
                      Erdem, H. (2025). Cranial, nasal, and orbital asymmetry and sexual dimorphism in Turkish adults: A high-resolution 3D morphometric study. <em>Surgical and Radiologic Anatomy</em>, <em>47</em>(1), 45. https://doi.org/10.1007/s00276-025-03701-0
                    </li>
                    <li>
                      Ji, Y., Qian, Z., Dong, Y., Zhou, H., &amp; Fan, X. (2010). Quantitative morphometry of the orbit in Chinese adults based on a three-dimensional reconstruction method. <em>The Journal of Anatomy</em>, <em>217</em>(5), 501–506. https://doi.org/10.1111/j.1469-7580.2010.01286.x
                    </li>
                    <li>
                      Kaya, A., &amp; Uygun, S. (2014). Sex estimation: 3D CTA-scan based on orbital measurements in Turkish population. <em>Romanian Journal of Legal Medicine</em>, <em>22</em>(4), 257–262. https://doi.org/10.4323/rjlm.2014.257
                    </li>
                    <li>
                      Klingenberg, C. P. (2011). MorphoJ: An integrated software package for geometric morphometrics. <em>Molecular Ecology Resources</em>, <em>11</em>(2), 353–357. https://doi.org/10.1111/j.1755-0998.2010.02924.x
                    </li>
                    <li>
                      Meral, O., Yücel, A. H., &amp; Acar, M. (2022). Estimation of sex from CT images of skull measurements in adult Turkish population. <em>Acta Radiologica</em>, <em>63</em>(12), 1687–1695. https://doi.org/10.1177/02841851211062172
                    </li>
                    <li>
                      Özer, M. A., Öz, I. I., Şerifoğlu, I., Büyükuysal, M. Ç., &amp; Barut, Ç. (2016). Evaluation of eyeball and orbit in relation to gender and age. <em>The Journal of Craniofacial Surgery</em>, <em>27</em>(8), e793–e800. https://doi.org/10.1097/SCS.0000000000003133
                    </li>
                    <li>
                      Pirinç, B., Fazlıoğulları, Z., Karabulut, A. K., &amp; Ünver Doğan, N. (2022). Morphometric analysis of orbit in Turkish population: A MDCT study. <em>Genel Tıp Dergisi</em>, <em>32</em>(5), 590–600. https://doi.org/10.54005/geneltip.1182728
                    </li>
                    <li>
                      Slice, D. E. (2007). Geometric morphometrics. <em>Annual Review of Anthropology</em>, <em>36</em>(1), 261–281. https://doi.org/10.1146/annurev.anthro.34.081804.120613
                    </li>
                    <li>
                      Weaver, A. A., Loftis, K. L., Tan, J. C., Duma, S. M., &amp; Stitzel, J. D. (2010). CT based three-dimensional measurement of orbit and eye anthropometry. <em>Investigative Ophthalmology &amp; Visual Science</em>, <em>51</em>(10), 4892–4897. https://doi.org/10.1167/iovs.10-5503
                    </li>
                    <li>
                      Zelditch, M. L., Swiderski, D. L., &amp; Sheets, H. D. (2012). <em>Geometric morphometrics for biologists: A primer</em> (2. baskı). Academic Press. https://doi.org/10.1016/C2010-0-66209-2
                    </li>
                  </ol>
                </div>

                <h3 className="font-bold text-base border-b pb-2 mt-6">
                  5. Araştırmacılar
                </h3>
                <div className="mt-2">
                  <p className="font-semibold">Sorumlu Araştırmacı:</p>
                  <table className="w-full border-collapse mt-1">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1 font-semibold w-1/3">
                          Adı-Soyadı:
                        </td>
                        <td>{RESEARCHER}</td>
                        <td className="w-20">İmza</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Unvanı:</td>
                        <td>{RESEARCHER_TITLE}</td>
                        <td></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Çalıştığı Kurum:</td>
                        <td>
                          {HOSPITAL} - {CLINIC}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Cep Telefonu:</td>
                        <td>................................</td>
                        <td></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">e-posta:</td>
                        <td>................................</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <p className="font-semibold">Yardımcı Araştırmacı 1:</p>
                  <table className="w-full border-collapse mt-1">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1 font-semibold w-1/3">
                          Adı-Soyadı:
                        </td>
                        <td>{ADMIN_RESPONSIBLE}</td>
                        <td className="w-20">İmza</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Unvanı:</td>
                        <td>Prof. Dr.</td>
                        <td></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Çalıştığı Kurum:</td>
                        <td>
                          {HOSPITAL} - {CLINIC}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Katkısı:</td>
                        <td>
                          Tez danışmanı, idari sorumluluk, çalışma planlaması ve
                          denetim
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <p className="font-semibold">Yardımcı Araştırmacı 2:</p>
                  <table className="w-full border-collapse mt-1">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1 font-semibold w-1/3">
                          Adı-Soyadı:
                        </td>
                        <td>{RADIOLOGY_PROF}</td>
                        <td className="w-20">İmza</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Unvanı:</td>
                        <td>Prof. Dr.</td>
                        <td></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Çalıştığı Kurum:</td>
                        <td>
                          {HOSPITAL} - {SUPPORT_CLINIC}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Katkısı:</td>
                        <td>
                          Radyolojik görüntülerin sağlanması, BT verilerine
                          erişim izni ve görüntü kalite kontrolü
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="font-bold text-base border-b pb-2 mt-6">
                  6. Klinik Eğitim Sorumlusu Onayı
                </h3>
                <table className="w-full border-collapse mt-2">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-semibold w-1/3">Adı-Soyadı:</td>
                      <td>................................</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">Onay:</td>
                      <td>[X] Uygun &nbsp;&nbsp; [ ] Uygun değil</td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-2">İmza</p>
              </div>
            </Card>

            {/* BELGE 7: Araştırma Protokolü */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-7"
            >
              <DocHeader
                title="BELGE 7: ARAŞTIRMA PROTOKOLÜ"
                docId="doc-7"
                fileName="Belge_07_Arastirma_Protokolu"
              />
              <p className="text-center font-semibold mb-6">
                TIBBİ ARAŞTIRMALAR BİLİMSEL VE ETİK DEĞERLENDİRME KURULU
              </p>

              <div className="space-y-4 text-sm text-justify leading-relaxed">
                <div>
                  <p className="font-bold">1. Araştırmanın Açık Adı:</p>
                  <p>{THESIS_TITLE}</p>
                  <p className="mt-2">
                    <strong>Anahtar Kelimeler:</strong> Orbital morfometri, Cinsiyet tayini, Üç boyutlu bilgisayarlı tomografi, Geometrik morfometri, Adli antropoloji
                  </p>
                  <p className="text-muted-foreground italic">
                    Keywords: Orbital morphometry, Sex determination, Three-dimensional computed tomography, Geometric morphometrics, Forensic anthropology
                  </p>
                </div>

                <div>
                  <p className="font-bold">2. Araştırmanın Amacı ve Önemi:</p>
                  <p className="mt-1">
                    <strong>Temel Amaç:</strong> Türk populasyonunda 3B BT
                    görüntüleri kullanılarak orbital morfometrik parametrelerin
                    (lineer ölçümler, geometrik morfometri ve orbital asimetri)
                    cinsiyet tayinindeki diskriminant gücünü belirlemek ve bu üç
                    yöntemi karşılaştırmaktır.
                  </p>
                  <p className="mt-1">
                    <strong>İkincil Amaçlar:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Türk populasyonuna özgü orbital morfometrik referans
                      değerleri oluşturmak
                    </li>
                    <li>
                      Orbital volümün cinsiyet tayinindeki rolünü değerlendirmek
                    </li>
                    <li>
                      Sağ-sol orbital asimetri indekslerinin cinsiyet dimorfizmi
                      üzerindeki etkisini araştırmak
                    </li>
                    <li>
                      Geometrik morfometri ile boyut ve şekil dimorfizmini ayrı
                      ayrı ortaya koymak
                    </li>
                    <li>
                      Farklı populasyon çalışmalarıyla (Kaya 2014, Pirinç 2022,
                      Özer 2016, Meral 2022, Erdem 2025) karşılaştırmalı analiz
                      yapmak
                    </li>
                  </ul>
                  <p className="mt-2">
                    <strong>Önemi:</strong> Literatürde Türk populasyonunda
                    orbital volüm ölçümü ile cinsiyet tayini yapan kapsamlı bir
                    çalışma bulunmamaktadır. Ayrıca orbital bölgeye geometrik
                    morfometri uygulayan Türk populasyonu çalışması mevcut
                    değildir. Bu çalışma, her iki boşluğu da doldurarak adli tıp
                    uygulamalarında kullanılabilecek populasyona özgü veriler
                    sunacaktır.
                  </p>
                </div>

                <div>
                  <p className="font-bold">
                    3. Araştırmadan Beklenen Fayda ve Riskler:
                  </p>
                  <p className="mt-1">
                    <strong>Beklenen Faydalar:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Adli tıp uygulamalarında cinsiyet tayini için Türk
                      populasyonuna özgü diskriminant fonksiyonları
                      geliştirilecektir
                    </li>
                    <li>
                      Kimliği belirsiz kemik kalıntılarının değerlendirilmesinde
                      kullanılabilecek referans verileri oluşturulacaktır
                    </li>
                    <li>
                      Orbital ve maksillofasiyal cerrahide populasyona özgü
                      normatif veriler sağlanacaktır
                    </li>
                  </ul>
                  <p className="mt-1">
                    <strong>Riskler:</strong> Retrospektif arşiv taraması olması
                    nedeniyle hastalar üzerinde herhangi bir girişimsel işlem
                    yapılmayacaktır. Çalışma, mevcut BT görüntülerinin anonim
                    olarak değerlendirilmesine dayandığından hasta açısından
                    risk bulunmamaktadır.
                  </p>
                </div>

                <div>
                  <p className="font-bold">
                    4. Araştırmanın Türü, Kapsamı ve Tasarımı:
                  </p>
                  <p>
                    Retrospektif, kesitsel, gözlemsel, tek merkezli, tez amaçlı
                    araştırma
                  </p>
                </div>

                <div>
                  <p className="font-bold">5. Bakılacak Parametreler:</p>
                  <p className="font-semibold mt-1">
                    A. Lineer Morfometrik Parametreler (18 adet):
                  </p>
                  <p>
                    1) Sağ orbital genişlik, 2) Sol orbital genişlik, 3) Sağ
                    orbital yükseklik, 4) Sol orbital yükseklik, 5) Sağ orbital
                    derinlik, 6) Sol orbital derinlik, 7) Sağ orbital hacim, 8)
                    Sol orbital hacim, 9) Sağ orbital indeks, 10) Sol orbital
                    indeks, 11) Superior orbital kenar kalınlığı, 12) İnferior
                    orbital kenar kalınlığı, 13) Medial orbital kenar kalınlığı,
                    14) Lateral orbital kenar kalınlığı, 15) İnterorbital
                    mesafe, 16) Biorbital genişlik, 17) Orbital apertur alanı,
                    18) Orbital apertur çevresi
                  </p>

                  <p className="font-semibold mt-2">
                    B. Orbital Asimetri Parametreleri (7 adet):
                  </p>
                  <p>
                    19) Orbital genişlik asimetri indeksi, 20) Orbital yükseklik
                    asimetri indeksi, 21) Orbital derinlik asimetri indeksi, 22)
                    Orbital hacim asimetri indeksi, 23) Orbital indeks asimetri
                    indeksi, 24) Orbital apertur alanı asimetri indeksi, 25)
                    Direktional asimetri değerlendirmesi
                  </p>

                  <p className="font-semibold mt-2">
                    C. Geometrik Morfometri Parametreleri:
                  </p>
                  <p>
                    26-37) 12 landmark koordinatları (Dacryon, Frontomalare
                    orbitale, Ectoconchion, Maxillofrontale, Superior/İnferior
                    orbital kenar orta noktaları - sağ/sol), 38) Centroid size,
                    39) Procrustes koordinatları, 40-42) PCA skorları (PC1, PC2,
                    PC3), 43) Thin-Plate Spline deformasyon gritleri
                  </p>
                </div>

                <div>
                  <p className="font-bold">
                    6. Parametrelere Nerede ve Kim Tarafından Bakılacağı:
                  </p>
                  <p>
                    Tüm ölçümler {RESEARCHER_TITLE} {RESEARCHER} tarafından{" "}
                    {HOSPITAL} {CLINIC}'nda 3D Slicer yazılımı kullanılarak
                    yapılacaktır. BT görüntüleri {SUPPORT_CLINIC}'ndan{" "}
                    {RADIOLOGY_PROF} izni ile temin edilecektir. Geometrik
                    morfometri analizleri MorphoJ yazılımı ile, istatistiksel
                    analizler SPSS yazılımı ile gerçekleştirilecektir.
                  </p>
                </div>

                <div>
                  <p className="font-bold">
                    7. Rutin ve Araştırmaya Özel Parametreler:
                  </p>
                  <p>
                    <strong>Rutin:</strong> Kranial BT görüntüleri (çeşitli
                    klinik endikasyonlarla daha önce çekilmiş)
                  </p>
                  <p>
                    <strong>Araştırmaya Özel:</strong> Tüm orbital morfometrik
                    ölçümler, asimetri indeksleri ve geometrik morfometri
                    analizleri araştırmaya özeldir.
                  </p>
                </div>

                <div>
                  <p className="font-bold">8. Öngörülen Çalışma Süresi:</p>
                  <p>10 ay (Etik kurul onayından itibaren)</p>
                </div>

                <div>
                  <p className="font-bold">
                    9. Dahil Edilme, Almama ve Çekilme Kriterleri:
                  </p>
                  <p>
                    <strong>Dahil edilme:</strong> 18 yaş üstü, kranial BT
                    çekilmiş, orbital bölgede patoloji/travma/cerrahi öyküsü
                    bulunmayan, görüntü kalitesi yeterli olan bireyler
                  </p>
                  <p>
                    <strong>Dışlama:</strong> 18 yaş altı, orbital
                    travma/fraktür/cerrahi/tümör/konjenital anomali öyküsü olan,
                    görüntü kalitesi yetersiz veya metal artefaktlı bireyler
                  </p>
                  <p>
                    <strong>Çekilme:</strong> Retrospektif çalışma olduğundan
                    uygulanamaz
                  </p>
                </div>

                <div>
                  <p className="font-bold">
                    10. Araştırmaya Son Verme Kriterleri:
                  </p>
                  <p>
                    Yeterli örneklem büyüklüğüne ulaşılamaması, veri kalitesinin
                    yetersiz bulunması
                  </p>
                </div>

                <div>
                  <p className="font-bold">11. İstatistiksel Yöntemler:</p>
                  <p>
                    Tanımlayıcı istatistikler, bağımsız örneklem
                    t-testi/Mann-Whitney U testi, diskriminant fonksiyon
                    analizi, binary lojistik regresyon, ROC analizi,
                    cross-validation (Leave-One-Out), Procrustes ANOVA, PCA,
                    geometrik morfometrik DFA. Anlamlılık düzeyi p&lt;0.05.
                    Yazılımlar: SPSS, 3D Slicer, MorphoJ.
                  </p>
                </div>

                <div>
                  <p className="font-bold">12. Kaynaklar (APA 7):</p>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Acer, N., Sahin, B., Ergür, H., Basaloglu, H., &amp; Ceri, N. G. (2009). <em>The Journal of Craniofacial Surgery</em>, <em>20</em>(3), 921–925.</li>
                    <li>Ajanovic, Z., Cizmovic, E., Kulenovic, A., Ljuca, F., &amp; Topcic, A. (2023). <em>Scanning</em>, <em>2023</em>, 1–8.</li>
                    <li>Aljarrah, K., Qaroot, S. A., Khamees, A., &amp; Al-Zghoul, M. B. (2023). <em>Anatomical Science International</em>, <em>98</em>(3), 405–413.</li>
                    <li>Birkby, W. H. (1966). <em>American Journal of Physical Anthropology</em>, <em>24</em>(1), 21–28.</li>
                    <li>Can, I. O., Ekizoglu, O., Hocaoglu, E., Inci, E., &amp; Sayin, I. (2024). <em>Diagnostics</em>, <em>14</em>(4), 378.</li>
                    <li>Erdem, H. (2025). <em>Surgical and Radiologic Anatomy</em>, <em>47</em>(1), 45.</li>
                    <li>Ji, Y., Qian, Z., Dong, Y., Zhou, H., &amp; Fan, X. (2010). <em>The Journal of Anatomy</em>, <em>217</em>(5), 501–506.</li>
                    <li>Kaya, A., &amp; Uygun, S. (2014). <em>Romanian Journal of Legal Medicine</em>, <em>22</em>(4), 257–262.</li>
                    <li>Klingenberg, C. P. (2011). <em>Molecular Ecology Resources</em>, <em>11</em>(2), 353–357.</li>
                    <li>Meral, O., Yücel, A. H., &amp; Acar, M. (2022). <em>Acta Radiologica</em>, <em>63</em>(12), 1687–1695.</li>
                    <li>Özer, M. A., Öz, I. I., Şerifoğlu, I., Büyükuysal, M. Ç., &amp; Barut, Ç. (2016). <em>The Journal of Craniofacial Surgery</em>, <em>27</em>(8), e793–e800.</li>
                    <li>Pirinç, B., Fazlıoğulları, Z., Karabulut, A. K., &amp; Ünver Doğan, N. (2022). <em>Genel Tıp Dergisi</em>, <em>32</em>(5), 590–600.</li>
                    <li>Slice, D. E. (2007). <em>Annual Review of Anthropology</em>, <em>36</em>(1), 261–281.</li>
                    <li>Weaver, A. A., Loftis, K. L., Tan, J. C., Duma, S. M., &amp; Stitzel, J. D. (2010). <em>Investigative Ophthalmology &amp; Visual Science</em>, <em>51</em>(10), 4892–4897.</li>
                    <li>Zelditch, M. L., Swiderski, D. L., &amp; Sheets, H. D. (2012). <em>Geometric morphometrics for biologists: A primer</em> (2. baskı). Academic Press.</li>
                  </ol>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <div>
                  <p className="font-semibold">Sorumlu Araştırmacı</p>
                  <p>
                    {RESEARCHER_TITLE} {RESEARCHER}
                  </p>
                  <p>İmza</p>
                </div>
                <div>
                  <p className="font-semibold">Yardımcı Araştırmacı</p>
                  <p>{ADMIN_RESPONSIBLE}</p>
                  <p>İmza</p>
                </div>
              </div>
            </Card>

            {/* BELGE 8: Veri Toplama Formu */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-8"
            >
              <DocHeader
                title="BELGE 8: VERİ TOPLAMA FORMU"
                docId="doc-8"
                fileName="Belge_08_Veri_Toplama_Formu"
              />
              <p className="text-center font-semibold mb-6">
                TIBBİ ARAŞTIRMALAR BİLİMSEL VE ETİK DEĞERLENDİRME KURULU
              </p>

              <p className="mb-4 text-sm">
                (KVKK kapsamında Hasta Ad-Soyad ve T.C. bulunmamaktadır)
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-1">Sıra No</th>
                      <th className="border p-1">Yaş</th>
                      <th className="border p-1">Cinsiyet</th>
                      <th className="border p-1">Sağ Orb. Gen.</th>
                      <th className="border p-1">Sol Orb. Gen.</th>
                      <th className="border p-1">Sağ Orb. Yük.</th>
                      <th className="border p-1">Sol Orb. Yük.</th>
                      <th className="border p-1">Sağ Orb. Der.</th>
                      <th className="border p-1">Sol Orb. Der.</th>
                      <th className="border p-1">Sağ Orb. Hac.</th>
                      <th className="border p-1">Sol Orb. Hac.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        <td className="border p-1 text-center">{i}</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse border text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-1">Sıra No</th>
                      <th className="border p-1">Sağ Orb. İnd.</th>
                      <th className="border p-1">Sol Orb. İnd.</th>
                      <th className="border p-1">Sup. Kal.</th>
                      <th className="border p-1">İnf. Kal.</th>
                      <th className="border p-1">Med. Kal.</th>
                      <th className="border p-1">Lat. Kal.</th>
                      <th className="border p-1">İnterorb.</th>
                      <th className="border p-1">Biorb.</th>
                      <th className="border p-1">Ap. Alan</th>
                      <th className="border p-1">Ap. Çev.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        <td className="border p-1 text-center">{i}</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse border text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-1">Sıra No</th>
                      <th className="border p-1">Gen. Asim.</th>
                      <th className="border p-1">Yük. Asim.</th>
                      <th className="border p-1">Der. Asim.</th>
                      <th className="border p-1">Hac. Asim.</th>
                      <th className="border p-1">İnd. Asim.</th>
                      <th className="border p-1">Ap. Asim.</th>
                      <th className="border p-1">Dir. Asim.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        <td className="border p-1 text-center">{i}</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse border text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-1">Sıra No</th>
                      <th className="border p-1">Dac. Sağ (x,y,z)</th>
                      <th className="border p-1">Dac. Sol (x,y,z)</th>
                      <th className="border p-1">FMO Sağ (x,y,z)</th>
                      <th className="border p-1">FMO Sol (x,y,z)</th>
                      <th className="border p-1">Ect. Sağ (x,y,z)</th>
                      <th className="border p-1">Ect. Sol (x,y,z)</th>
                      <th className="border p-1">Centroid Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        <td className="border p-1 text-center">{i}</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                        <td className="border p-1">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* BELGE 9: Bütçe Formu */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-9"
            >
              <DocHeader
                title="BELGE 9: ARAŞTIRMA BÜTÇE FORMU"
                docId="doc-9"
                fileName="Belge_09_Butce_Formu"
              />

              <div className="space-y-4 text-sm">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-semibold w-1/3">
                        Araştırmanın açık adı:
                      </td>
                      <td className="py-2">{THESIS_TITLE}</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="font-bold mt-4">BÜTÇE KAYNAĞI</h3>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">[X] Araştırmacının kendisi</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">[ ] Finanse eden kurum/kuruluş</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">
                        [ ] Hibe/destek sağlayan kurum/kuruluş
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="mt-2">
                  <strong>Açıklama:</strong> Çalışma retrospektif arşiv
                  taramasına dayalı olup, mevcut BT görüntüleri kullanılacaktır.
                  Ek maliyet gerektiren herhangi bir laboratuvar tetkiki, ilaç
                  veya malzeme kullanılmayacaktır. 3D Slicer ve MorphoJ
                  yazılımları ücretsiz açık kaynak yazılımlardır. İstatistiksel
                  analizler için SPSS yazılımı kurum bünyesinde mevcuttur.
                </p>

                <h3 className="font-bold mt-4">BÜTÇE BEYANI</h3>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">Toplam bütçe (TL):</td>
                      <td className="py-2">
                        0 TL (Ek maliyet gerektirmemektedir)
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-8">
                  <p>İş bu bütçe formuyla;</p>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Formda belirtilen bilgilerin doğru olduğunu,</li>
                    <li>
                      İlgili mevzuat uyarınca araştırmanın her türlü mali
                      sorumluluğunun üstlenildiğini,
                    </li>
                  </ul>
                  <p className="mt-2">kabul, beyan ve taahhüt ederim.</p>
                </div>

                <div className="mt-8">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1 font-semibold w-1/3">
                          Adı soyadı:
                        </td>
                        <td>{RESEARCHER}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">
                          Telefon numarası:
                        </td>
                        <td>................................</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">E-posta adresi:</td>
                        <td>................................</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Tarih:</td>
                        <td>...../...../2025</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-4">İmza</p>
                </div>
              </div>
            </Card>

            {/* BELGE 10: BGOF */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-10"
            >
              <DocHeader
                title="BELGE 10: BİLGİLENDİRİLMİŞ GÖNÜLLÜ OLUR FORMU (BGOF)"
                docId="doc-10"
                fileName="Belge_10_BGOF"
              />

              <div className="p-4 border rounded-md bg-muted/30 text-sm">
                <p className="font-bold text-center">NOT</p>
                <p className="mt-2 text-justify">
                  Bu çalışma <strong>retrospektif arşiv taramasına</strong>{" "}
                  dayalı olup, daha önce çeşitli klinik endikasyonlarla çekilmiş
                  olan kranial BT görüntülerinin anonim olarak
                  değerlendirilmesini kapsamaktadır. Hastalar üzerinde herhangi
                  bir prospektif girişimsel veya gözlemsel işlem
                  yapılmayacaktır. KVKK kapsamında hasta ad-soyad ve T.C. kimlik
                  numarası çalışma verilerinde yer almamaktadır.
                </p>
                <p className="mt-2 text-justify">
                  Bu nedenle, Bilgilendirilmiş Gönüllü Olur Formu (BGOF){" "}
                  <strong>bu çalışma için gerekli değildir.</strong> Etik
                  Kurul'un uygun görmesi halinde BGOF muafiyeti talep
                  edilmektedir.
                </p>
              </div>
            </Card>

            {/* BELGE 11: Özgeçmiş Formu */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-11"
            >
              <DocHeader
                title="BELGE 11: GÜNCEL ÖZGEÇMİŞ FORMU"
                docId="doc-11"
                fileName="Belge_11_Ozgecmis_Formu"
              />

              <div className="space-y-4 text-sm">
                <h3 className="font-bold">KİŞİSEL BİLGİLER</h3>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-semibold w-1/3">Adı / Soyadı:</td>
                      <td>Nurcan Denli Bayır</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">Akademik Unvan / Pozisyon:</td>
                      <td>{RESEARCHER_TITLE} - Adli Tıp Uzmanlık Öğrencisi</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">Görev Yeri:</td>
                      <td>{HOSPITAL} - {CLINIC}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">Telefon Numarası:</td>
                      <td>................................</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">E-posta Adresi:</td>
                      <td>................................</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="font-bold mt-4">EĞİTİM BİLGİLERİ</h3>
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-2">Yıl</th>
                      <th className="border p-2">Derece / Program</th>
                      <th className="border p-2">Kurum</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">2012 - 2019</td>
                      <td className="border p-2">Tıp Doktoru (MD)</td>
                      <td className="border p-2">Bülent Ecevit Üniversitesi Tıp Fakültesi</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Devam Ediyor</td>
                      <td className="border p-2">Adli Tıp Uzmanlık Eğitimi (Doktora)</td>
                      <td className="border p-2">{HOSPITAL} - {CLINIC}</td>
                    </tr>
                    <tr>
                      <td className="border p-2">2025 - Devam Ediyor</td>
                      <td className="border p-2">Yüksek Lisans (MSc) - Yazılım Mühendisliği</td>
                      <td className="border p-2">Hacettepe Üniversitesi</td>
                    </tr>
                    <tr>
                      <td className="border p-2">2025 - Devam Ediyor</td>
                      <td className="border p-2">Hukuk Doktorası (JD) - Sağlık Hukuku</td>
                      <td className="border p-2">Hacettepe Üniversitesi</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Tamamlandı</td>
                      <td className="border p-2">Halk Sağlığı Yüksek Lisansı (MPH) - İş Yeri Hekimi</td>
                      <td className="border p-2">Seka Akademi</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="font-bold mt-4">SERTİFİKA VE UZMANLIK EĞİTİMLERİ</h3>
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-2">Sertifika / Eğitim</th>
                      <th className="border p-2">Kurum</th>
                      <th className="border p-2">Not</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">Adli Belge İnceleme ve Grafoloji Uzmanlığı</td>
                      <td className="border p-2">Başkent Üniversitesi - BEDAM</td>
                      <td className="border p-2">Adalet Bakanlığı Onaylı / Bilirkişilik</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Adli Balistik</td>
                      <td className="border p-2">BEDAM</td>
                      <td className="border p-2">2026</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Expert Witness CERT - Adli Psikiyatri ve Kriminoloji</td>
                      <td className="border p-2">Üsküdar Üniversitesi</td>
                      <td className="border p-2">Bilirkişilik</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Expert Witness CERT - Digital Forensic / Adli Bilişim</td>
                      <td className="border p-2">Üsküdar Üniversitesi</td>
                      <td className="border p-2">Bilirkişilik</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Özel Bilirkişilik - Adli Belge İnceleme Uzmanı</td>
                      <td className="border p-2">Han Kriminal</td>
                      <td className="border p-2">Dijital Forensic, Fiziki Belge İnceleme</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Stanford Medical Imaging AI Certificate, AI in Healthcare</td>
                      <td className="border p-2">Coursera / Stanford Üniversitesi</td>
                      <td className="border p-2">Tamamlandı</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="font-bold mt-4">İŞ TECRÜBESİ VE MESLEKİ DENEYİM</h3>
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-2">Tarih Aralığı</th>
                      <th className="border p-2">Kurum</th>
                      <th className="border p-2">Görev / Unvan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">Devam Ediyor</td>
                      <td className="border p-2">{HOSPITAL} - {CLINIC}</td>
                      <td className="border p-2">{RESEARCHER_TITLE} - Adli Tıp Uzmanlık Öğrencisi</td>
                    </tr>
                    <tr>
                      <td className="border p-2">2021 - 2022</td>
                      <td className="border p-2">İş Yeri Hekimliği</td>
                      <td className="border p-2">İş Yeri Hekimi</td>
                    </tr>
                    <tr>
                      <td className="border p-2">2019 - 2021</td>
                      <td className="border p-2">Yozgat Şehir Hastanesi</td>
                      <td className="border p-2">Pratisyen Hekim</td>
                    </tr>
                    <tr>
                      <td className="border p-2">2019 - 2021</td>
                      <td className="border p-2">Şefaatli Devlet Hastanesi</td>
                      <td className="border p-2">Pratisyen Hekim</td>
                    </tr>
                    <tr>
                      <td className="border p-2">2019 - 2021</td>
                      <td className="border p-2">Sorgun Devlet Hastanesi</td>
                      <td className="border p-2">Pratisyen Hekim</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="font-bold mt-4">GÖNÜLLÜ ÇALIŞMALAR</h3>
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-2">Tarih Aralığı</th>
                      <th className="border p-2">Kurum</th>
                      <th className="border p-2">Görev / Alan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">2020 - Devam Ediyor</td>
                      <td className="border p-2">Yeryüzü Doktorları (Doctors Worldwide Türkiye)</td>
                      <td className="border p-2">Tıp Doktoru - Felaket ve İnsani Yardım</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="font-bold mt-4">MESLEKİ YETKİNLİKLER</h3>
                <div className="space-y-1 pl-6">
                  <p>Dijital Forensic (Adli Bilişim)</p>
                  <p>Fiziki Belge İnceleme ve Grafoloji</p>
                  <p>Adli Balistik</p>
                  <p>Adli Psikiyatri ve Kriminoloji</p>
                  <p>Yapay Zeka Destekli Tıbbi Görüntüleme</p>
                  <p>Yazılım Mühendisliği</p>
                  <p>Sağlık Hukuku</p>
                </div>

                <h3 className="font-bold mt-4">YAYINLAR VE AKADEMİK ÇALIŞMALAR</h3>
                <div className="space-y-1 pl-6">
                  <p>1. Adalet Bakanlığı Otopsi El Kitabı (Hazırlayan)</p>
                  <p>2. Parmak İzi İncelemeleri, Klasifikasyonu, Karşılaştırılması ve Maddeleme Yoluyla Değerlendirilmesi (Sunum/Bildiri)</p>
                </div>

                <div className="mt-8">
                  <p>
                    Yukarıda beyan ettiğim bilgilerin doğru ve güncel olduğunu
                    kabul ve beyan ederim.
                  </p>
                  <table className="w-full border-collapse mt-4">
                    <tbody>
                      <tr>
                        <td className="py-1 font-semibold w-1/3">Ad Soyadı:</td>
                        <td>{RESEARCHER}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold">Tarih:</td>
                        <td>...../...../2025</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-4">İmza</p>
                </div>
              </div>
            </Card>

            {/* BELGE 12: İKU Taahhütnamesi */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-12"
            >
              <DocHeader
                title="BELGE 12: İYİ KLİNİK UYGULAMALAR TAAHHÜTNAMESİ"
                docId="doc-12"
                fileName="Belge_12_IKU_Taahutnamesi"
              />

              <div className="space-y-4 text-sm">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-semibold w-1/3">Tarih:</td>
                      <td>...../...../2025</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">Çalışmanın Adı:</td>
                      <td>{THESIS_TITLE}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="mt-4 text-justify leading-relaxed">
                  T.C. Sağlık Bakanlığı'nca Nisan 2013 tarihinde yürürlüğe
                  konulan İyi Klinik Uygulamaları (İKU) Kılavuzu'nu okudum.
                  Yukarıda adı geçen çalışmanın bu kılavuz prensiplerine uygun
                  yapılacağını taahhüt ederim.
                </p>

                <div className="mt-12 space-y-8">
                  <div>
                    <p className="font-semibold">Sorumlu Araştırmacı:</p>
                    <p>
                      {RESEARCHER_TITLE} {RESEARCHER}
                    </p>
                    <p className="mt-2">İmza:</p>
                  </div>
                  <div>
                    <p className="font-semibold">Yardımcı Araştırmacı 1:</p>
                    <p>{ADMIN_RESPONSIBLE}</p>
                    <p className="mt-2">İmza:</p>
                  </div>
                  <div>
                    <p className="font-semibold">Yardımcı Araştırmacı 2:</p>
                    <p>{RADIOLOGY_PROF}</p>
                    <p className="mt-2">İmza:</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tam Metin Literatür Notu */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-13"
            >
              <DocHeader
                title="BELGE 13: TAM METİN LİTERATÜR LİSTESİ"
                docId="doc-13"
                fileName="Belge_13_Literatur_Listesi"
              />

              <p className="text-sm mb-4">
                Araştırma ile ilgili tam metin literatür başvuru dosyasına eklenmelidir. Aşağıda APA 7 formatında kaynakça ve erişim bilgileri sunulmaktadır:
              </p>

              <ol className="list-decimal pl-6 space-y-3 text-sm leading-relaxed">
                <li>
                  Acer, N., Sahin, B., Ergür, H., Basaloglu, H., &amp; Ceri, N. G. (2009). Stereological estimation of the orbital volume: A criterion standard study. <em>The Journal of Craniofacial Surgery</em>, <em>20</em>(3), 921–925. https://doi.org/10.1097/SCS.0b013e3181a14d09
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://pubmed.ncbi.nlm.nih.gov/19461332/
                  </span>
                </li>
                <li>
                  Ajanovic, Z., Cizmovic, E., Kulenovic, A., Ljuca, F., &amp; Topcic, A. (2023). A geometric morphometrics approach for sex estimation based on the orbital region. <em>Scanning</em>, <em>2023</em>, 1–8. https://doi.org/10.1155/2023/6614028
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://doi.org/10.1155/2023/6614028
                  </span>
                </li>
                <li>
                  Aljarrah, K., Qaroot, S. A., Khamees, A., &amp; Al-Zghoul, M. B. (2023). Morphometric evaluation of the orbital region for sex determination in a Saudi Arabian population using 3DCT images. <em>Anatomical Science International</em>, <em>98</em>(3), 405–413. https://doi.org/10.1007/s12565-023-00712-8
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://doi.org/10.1007/s12565-023-00712-8
                  </span>
                </li>
                <li>
                  Birkby, W. H. (1966). An evaluation of race and sex identification from cranial measurements. <em>American Journal of Physical Anthropology</em>, <em>24</em>(1), 21–28. https://doi.org/10.1002/ajpa.1330240103
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://doi.org/10.1002/ajpa.1330240103
                  </span>
                </li>
                <li>
                  Can, I. O., Ekizoglu, O., Hocaoglu, E., Inci, E., &amp; Sayin, I. (2024). Machine learning algorithms for sex classification by using variables of orbital structures. <em>Diagnostics</em>, <em>14</em>(4), 378. https://doi.org/10.3390/diagnostics14040378
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://doi.org/10.3390/diagnostics14040378
                  </span>
                </li>
                <li>
                  Erdem, H. (2025). Cranial, nasal, and orbital asymmetry and sexual dimorphism in Turkish adults: A high-resolution 3D morphometric study. <em>Surgical and Radiologic Anatomy</em>, <em>47</em>(1), 45. https://doi.org/10.1007/s00276-025-03701-0
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://link.springer.com/article/10.1007/s00276-025-03701-0
                  </span>
                </li>
                <li>
                  Ji, Y., Qian, Z., Dong, Y., Zhou, H., &amp; Fan, X. (2010). Quantitative morphometry of the orbit in Chinese adults based on a three-dimensional reconstruction method. <em>The Journal of Anatomy</em>, <em>217</em>(5), 501–506. https://doi.org/10.1111/j.1469-7580.2010.01286.x
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://doi.org/10.1111/j.1469-7580.2010.01286.x
                  </span>
                </li>
                <li>
                  Kaya, A., &amp; Uygun, S. (2014). Sex estimation: 3D CTA-scan based on orbital measurements in Turkish population. <em>Romanian Journal of Legal Medicine</em>, <em>22</em>(4), 257–262. https://doi.org/10.4323/rjlm.2014.257
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: http://www.rjlm.ro/index.php/arhiv/394
                  </span>
                </li>
                <li>
                  Klingenberg, C. P. (2011). MorphoJ: An integrated software package for geometric morphometrics. <em>Molecular Ecology Resources</em>, <em>11</em>(2), 353–357. https://doi.org/10.1111/j.1755-0998.2010.02924.x
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://doi.org/10.1111/j.1755-0998.2010.02924.x
                  </span>
                </li>
                <li>
                  Meral, O., Yücel, A. H., &amp; Acar, M. (2022). Estimation of sex from CT images of skull measurements in adult Turkish population. <em>Acta Radiologica</em>, <em>63</em>(12), 1687–1695. https://doi.org/10.1177/02841851211062172
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://doi.org/10.1177/02841851211062172
                  </span>
                </li>
                <li>
                  Özer, M. A., Öz, I. I., Şerifoğlu, I., Büyükuysal, M. Ç., &amp; Barut, Ç. (2016). Evaluation of eyeball and orbit in relation to gender and age. <em>The Journal of Craniofacial Surgery</em>, <em>27</em>(8), e793–e800. https://doi.org/10.1097/SCS.0000000000003133
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://doi.org/10.1097/SCS.0000000000003133
                  </span>
                </li>
                <li>
                  Pirinç, B., Fazlıoğulları, Z., Karabulut, A. K., &amp; Ünver Doğan, N. (2022). Morphometric analysis of orbit in Turkish population: A MDCT study. <em>Genel Tıp Dergisi</em>, <em>32</em>(5), 590–600. https://doi.org/10.54005/geneltip.1182728
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://dergipark.org.tr/en/pub/geneltip/article/1182728
                  </span>
                </li>
                <li>
                  Slice, D. E. (2007). Geometric morphometrics. <em>Annual Review of Anthropology</em>, <em>36</em>(1), 261–281. https://doi.org/10.1146/annurev.anthro.34.081804.120613
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://doi.org/10.1146/annurev.anthro.34.081804.120613
                  </span>
                </li>
                <li>
                  Weaver, A. A., Loftis, K. L., Tan, J. C., Duma, S. M., &amp; Stitzel, J. D. (2010). CT based three-dimensional measurement of orbit and eye anthropometry. <em>Investigative Ophthalmology &amp; Visual Science</em>, <em>51</em>(10), 4892–4897. https://doi.org/10.1167/iovs.10-5503
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://doi.org/10.1167/iovs.10-5503
                  </span>
                </li>
                <li>
                  Zelditch, M. L., Swiderski, D. L., &amp; Sheets, H. D. (2012). <em>Geometric morphometrics for biologists: A primer</em> (2. baskı). Academic Press. https://doi.org/10.1016/C2010-0-66209-2
                  <br />
                  <span className="text-muted-foreground">
                    Erişim: https://doi.org/10.1016/C2010-0-66209-2
                  </span>
                </li>
              </ol>

              <p className="mt-6 text-sm font-semibold">
                Not: Yukarıdaki makalelerin tam metinleri (PDF) başvuru
                dosyasına eklenmelidir.
              </p>
            </Card>

            {/* BELGE 14: Detaylı Araştırma Protokolü */}
            <Card
              className="p-8 print:shadow-none print:border-none print:p-4 print:break-after-page"
              id="doc-14"
            >
              <DocHeader
                title="BELGE 14: DETAYLI ARAŞTIRMA PROTOKOLÜ"
                docId="doc-14"
                fileName="Belge_14_Detayli_Arastirma_Protokolu"
              />

              <div className="space-y-6 text-sm text-justify leading-relaxed">
                <div className="text-center mb-6">
                  <p className="font-bold text-base">{THESIS_TITLE}</p>
                  <p className="mt-2">{RESEARCHER_TITLE} {RESEARCHER}</p>
                  <p>{CLINIC}, {HOSPITAL}</p>
                  <p>Tez Danışmanı: {ADMIN_RESPONSIBLE}</p>
                  <p className="mt-3">
                    <strong>Anahtar Kelimeler:</strong> Orbital morfometri, Cinsiyet tayini, Üç boyutlu bilgisayarlı tomografi, Geometrik morfometri, Adli antropoloji
                  </p>
                  <p className="text-muted-foreground italic">
                    Keywords: Orbital morphometry, Sex determination, Three-dimensional computed tomography, Geometric morphometrics, Forensic anthropology
                  </p>
                </div>

                {/* 1. Araştırma Sorusu */}
                <div>
                  <p className="font-bold text-base border-b-2 border-black pb-1 mb-3">1. Araştırma Sorusu (Research Problem)</p>
                  <p className="mt-2">
                    Türk populasyonunda üç boyutlu bilgisayarlı tomografi (3B BT) görüntüleri üzerinden elde edilen orbital morfometrik parametrelerin —lineer ölçümler, geometrik morfometri (GM) ve bilateral asimetri analizleri— cinsiyet tayininde ne düzeyde diskriminant güce sahip olduğu ve bu üç yöntemin bireysel ile kombine sınıflandırma doğruluklarının nasıl farklılaştığı, araştırmanın temel problemidir.
                  </p>
                  <p className="mt-2">
                    Mevcut literatürde Türk populasyonuna yönelik orbital cinsiyet tayini çalışmaları büyük ölçüde konvansiyonel lineer ölçümlerle sınırlı kalmıştır (Kaya ve Uygun, 2014; Pirinç ve ark., 2022; Özer ve ark., 2016). Orbital bölgeye geometrik morfometri uygulayan Türk populasyonu çalışması bulunmamaktadır. Ayrıca orbital asimetri indekslerinin cinsiyet dimorfizmi üzerindeki etkisini sistematik olarak inceleyen bir çalışma da mevcut değildir. Bu durum, adli tıp pratiğinde kimliği belirsiz iskelet kalıntılarının değerlendirilmesinde populasyona özgü referans verilerinin eksikliğine yol açmaktadır.
                  </p>
                  <p className="mt-2">
                    Dolayısıyla araştırma sorusu şu şekilde formüle edilebilir: <em>"Türk erişkin populasyonunda 3B BT tabanlı orbital morfometrik parametrelerin (lineer ölçümler, Procrustes tabanlı geometrik morfometri ve flüktuatif/direktional asimetri indeksleri) cinsiyet tayinindeki prediktif değeri nedir ve bu üç analitik yaklaşımın diskriminant fonksiyon analizi, lojistik regresyon ve ROC eğrisi performansları birbirleriyle nasıl karşılaştırılır?"</em>
                  </p>
                </div>

                {/* 2. Arka Plan ve Gerekçe */}
                <div>
                  <p className="font-bold text-base border-b-2 border-black pb-1 mb-3">2. Arka Plan ve Gerekçe (Background / Rationale)</p>
                  <p className="mt-2">
                    Cinsiyet tayini, adli antropolojinin temel bileşenlerinden birini oluşturur ve biyolojik profil oluşturma sürecinin ilk basamağını temsil eder. Kranial yapılar arasında orbita, hem korunma oranının yüksekliği hem de belirgin seksüel dimorfizm göstermesi nedeniyle cinsiyet tayininde önemli bir anatomik bölgedir (Birkby, 1966). Orbital morfometri çalışmaları, populasyonlar arası varyasyonun yüksek olduğunu ve bu nedenle populasyona özgü referans standartlarının geliştirilmesinin zorunlu olduğunu ortaya koymuştur.
                  </p>
                  <p className="mt-2">
                    Konvansiyonel lineer morfometrik yaklaşımlar (orbital genişlik, yükseklik, derinlik, orbital indeks), kranial kemik üzerindeki cinsiyet dimorfizmini değerlendirmede yaygın olarak kullanılmaktadır. Kaya ve Uygun (2014) Türk populasyonunda 3B BT-anjiyografi görüntüleri üzerinden orbital ölçümlerle %76.7 sınıflandırma doğruluğu elde etmiştir. Pirinç ve ark. (2022) ÇDBT kullanarak orbital morfometrik analiz yapmış, Özer ve ark. (2016) ise göz küresi ve orbita boyutlarını yaş ve cinsiyetle ilişkilendirmiştir. Meral ve ark. (2022) BT'de kranial ölçümlerle cinsiyet tayini başarısını raporlamıştır. Ancak bu çalışmaların tamamı lineer ölçüm paradigmasıyla sınırlı kalmıştır.
                  </p>
                  <p className="mt-2">
                    Geometrik morfometri (GM), klasik lineer ölçümlerin ötesinde şekil bilgisini yakalayan landmark tabanlı bir analitik çerçeve sunmaktadır (Slice, 2007; Zelditch ve ark., 2012). GM'de Generalized Procrustes Analysis (GPA) ile boyut etkisi standartize edildikten sonra, şekil varyasyonu Procrustes koordinatları üzerinden değerlendirilmektedir. Bu yaklaşım, lineer ölçümlerin yakalayamadığı geometrik ilişkileri (eğrilik, oransal değişim, allometrik gradyan) ortaya koyabilmektedir. Ajanovic ve ark. (2023) orbital bölgede GM kullanarak cinsiyet tayini yapmış ve yüksek sınıflandırma oranları bildirmiştir. Klingenberg (2011) tarafından geliştirilen MorphoJ yazılımı, bu tür analizlerin standart aracı haline gelmiştir.
                  </p>
                  <p className="mt-2">
                    Bilateral orbital asimetri, cinsiyet dimorfizminin bir diğer boyutunu temsil etmektedir. Flüktuatif asimetri (FA), gelişimsel instabilitenin bir göstergesi olarak kabul edilirken, direktional asimetri (DA) sistematik lateralizasyon paternlerini yansıtmaktadır. Erdem (2025), Türk erişkinlerde kranial, nazal ve orbital asimetriyi yüksek çözünürlüklü 3B morfometrik analiz ile incelemiş ve cinsiyetler arası anlamlı asimetri farklılıkları saptamıştır.
                  </p>
                  <p className="mt-2">
                    <strong>Gerekçe:</strong> Yukarıda sunulan literatür taraması, Türk populasyonunda orbital bölgeye geometrik morfometri uygulayan, orbital volüm ile cinsiyet tayini yapan ve bilateral asimetri indekslerini sistematik olarak değerlendiren bütüncül bir çalışmanın bulunmadığını açıkça göstermektedir. Bu üç analitik yöntemin aynı örneklem üzerinde karşılaştırmalı olarak uygulanması, her bir yöntemin bağımsız ve kombine prediktif değerinin ortaya konması açısından özgün bir katkı sunacaktır.
                  </p>
                </div>

                {/* 3. Araştırma Amacı */}
                <div>
                  <p className="font-bold text-base border-b-2 border-black pb-1 mb-3">3. Araştırma Amacı (Objectives)</p>
                  <p className="font-semibold mt-2">Birincil (Primer) Amaç:</p>
                  <p>
                    Türk erişkin populasyonunda 3B BT görüntüleri üzerinden elde edilen orbital morfometrik parametrelerin (lineer ölçümler, geometrik morfometri ve bilateral asimetri analizleri) cinsiyet tayinindeki diskriminant gücünü belirlemek ve bu üç analitik yaklaşımın sınıflandırma performanslarını karşılaştırmaktır.
                  </p>
                  <p className="font-semibold mt-3">İkincil (Sekonder) Amaçlar:</p>
                  <ol className="list-decimal pl-6 space-y-2 mt-1">
                    <li>
                      Türk populasyonuna özgü orbital morfometrik referans değerleri (orbital genişlik, yükseklik, derinlik, hacim, apertur alanı/çevresi, kenar kalınlıkları, interorbital mesafe, biorbital genişlik) oluşturmak ve cinsiyetler arası istatistiksel farklılıkları tanımlamak.
                    </li>
                    <li>
                      3D Slicer yazılımında segmentasyon tabanlı orbital volümetriyi uygulayarak stereolojik volüm ölçümünün cinsiyet tayinindeki bağımsız prediktif değerini değerlendirmek (Acer ve ark., 2009 metodolojisinin 3B BT'ye adaptasyonu).
                    </li>
                    <li>
                      Bilateral orbital asimetri indekslerini (genişlik, yükseklik, derinlik, hacim, orbital indeks, apertur alanı) hesaplayarak flüktuatif asimetri (FA) ve direktional asimetri (DA) paternlerinin cinsiyetler arası dağılımını incelemek.
                    </li>
                    <li>
                      12 orbital landmark üzerinden Generalized Procrustes Analysis (GPA) uygulamak; Procrustes koordinatları ile Principal Component Analysis (PCA) ve Canonical Variate Analysis (CVA) kullanarak şekil-tabanlı cinsiyet dimorfizmini ortaya koymak; Thin-Plate Spline (TPS) deformasyon gridleri ile dimorfik şekil değişimini görselleştirmek.
                    </li>
                    <li>
                      Lineer ölçümler, asimetri indeksleri ve GM parametrelerinin tekli, ikili ve üçlü kombinasyonlarıyla oluşturulan diskriminant fonksiyon analizi (DFA) ve binary lojistik regresyon modellerinin sınıflandırma doğruluğunu ROC eğrisi, AUC, sensitivite ve spesifisite metrikleri ile karşılaştırmak.
                    </li>
                    <li>
                      Sonuçları farklı populasyon çalışmalarıyla (Aljarrah ve ark., 2023 — Suudi Arabistan; Ji ve ark., 2010 — Çin; Weaver ve ark., 2010 — Amerika; Ajanovic ve ark., 2023 — Bosna) karşılaştırmalı olarak tartışmak.
                    </li>
                  </ol>
                </div>

                {/* 4. Hipotez */}
                <div>
                  <p className="font-bold text-base border-b-2 border-black pb-1 mb-3">4. Hipotez (Hypothesis)</p>
                  <p className="font-semibold mt-2">Birincil Hipotez (H₁):</p>
                  <p>
                    Türk erişkin populasyonunda orbital morfometrik parametrelerin (lineer ölçümler, geometrik morfometri ve asimetri indeksleri) cinsiyet tayininde istatistiksel olarak anlamlı diskriminant güce sahip olduğu ve bu üç yöntemin kombine kullanımının, tek başına herhangi bir yöntemden daha yüksek sınıflandırma doğruluğu sağladığı hipotez edilmektedir.
                  </p>
                  <p className="font-semibold mt-3">Alt Hipotezler:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-1">
                    <li>
                      <strong>H₁ₐ:</strong> Erkek bireylerde orbital lineer ölçümler (genişlik, yükseklik, derinlik, hacim) kadın bireylerden istatistiksel olarak anlamlı düzeyde yüksektir (p&lt;0.05).
                    </li>
                    <li>
                      <strong>H₁ᵦ:</strong> Geometrik morfometri (Procrustes tabanlı şekil analizi), lineer ölçümlerden bağımsız olarak cinsiyetler arası orbital şekil farklılıklarını saptayabilir ve boyut etkisinden arındırılmış şekil varyasyonunun cinsiyet sınıflandırmasına ek prediktif değer katar.
                    </li>
                    <li>
                      <strong>H₁꜀:</strong> Bilateral orbital asimetri indekslerinde (flüktuatif ve direktional asimetri) cinsiyetler arası istatistiksel olarak anlamlı farklılıklar mevcuttur ve asimetri parametreleri cinsiyet tahmin modellerine ek diskriminant güç sağlar.
                    </li>
                    <li>
                      <strong>H₁ᵈ:</strong> Lineer ölçümler + GM + asimetri indekslerinin üçlü kombinasyonu ile oluşturulan multivaryant diskriminant fonksiyon, tek başına lineer ölçüm (≈%75-80) veya tek başına GM (≈%80-85) modeline kıyasla ≥%85 doğruluk oranına ulaşır.
                    </li>
                  </ul>
                  <p className="font-semibold mt-3">Sıfır Hipotezi (H₀):</p>
                  <p>
                    Türk erişkin populasyonunda orbital morfometrik parametrelerde (lineer ölçümler, geometrik morfometri şekil değişkenleri ve bilateral asimetri indeksleri) cinsiyetler arası istatistiksel olarak anlamlı farklılık yoktur.
                  </p>
                </div>

                {/* 5. Araştırma Türü/Tasarım */}
                <div>
                  <p className="font-bold text-base border-b-2 border-black pb-1 mb-3">5. Araştırma Türü / Tasarımı (Study Design)</p>
                  <p className="mt-2">
                    <strong>Araştırma Türü:</strong> Retrospektif, kesitsel (cross-sectional), gözlemsel, analitik, tek merkezli, tez amaçlı klinik araştırma.
                  </p>
                  <p className="mt-2">
                    <strong>Tasarım Detayları:</strong> Çalışma, retrospektif kohort tasarımında planlanmıştır. Daha önce çeşitli klinik endikasyonlarla çekilmiş kranial BT görüntüleri, PACS (Picture Archiving and Communication System) arşivinden taranacaktır. Çalışmada herhangi bir girişimsel işlem, ilaç uygulaması veya deneysel müdahale bulunmamaktadır. Tüm veriler anonim olarak işlenecek olup, bireyler yalnızca yaş ve cinsiyet bilgileriyle kodlanacaktır.
                  </p>
                  <p className="mt-2">
                    <strong>Kanıt Düzeyi:</strong> Oxford Kanıta Dayalı Tıp Merkezi sınıflamasına göre Düzey 2b (bireysel kohort çalışması) / Düzey 4 (vaka serisi) aralığında yer almaktadır.
                  </p>
                  <p className="mt-2">
                    <strong>Metodolojik Çerçeve:</strong> Çalışma üç paralel analitik koldan oluşmaktadır: (i) Konvansiyonel lineer morfometri — 18 parametre üzerinden univaryant ve multivaryant diskriminant analiz, (ii) Geometrik morfometri — 12 landmark üzerinden GPA, PCA, CVA ve Procrustes ANOVA, (iii) Bilateral asimetri analizi — 7 asimetri indeksi üzerinden FA/DA değerlendirmesi. Her üç kolun sonuçları, kombine prediktif modeller oluşturmak üzere birleştirilecektir.
                  </p>
                </div>

                {/* 6. Araştırma Yeri */}
                <div>
                  <p className="font-bold text-base border-b-2 border-black pb-1 mb-3">6. Araştırma Yeri (Study Setting / Location)</p>
                  <p className="mt-2">
                    <strong>Birincil Araştırma Merkezi:</strong> {HOSPITAL}, {CLINIC}. Tüm orbital morfometrik ölçümler, 3B rekonstrüksiyonlar ve veri analizleri bu merkezde gerçekleştirilecektir.
                  </p>
                  <p className="mt-2">
                    <strong>Görüntü Kaynağı:</strong> {HOSPITAL}, {SUPPORT_CLINIC}. Kranial BT görüntüleri {RADIOLOGY_PROF} koordinasyonuyla PACS arşivinden temin edilecektir. BT cihazı: Multidedektör BT (ÇDBT), minimum 64 dedektör sıralı, kesit kalınlığı ≤1 mm, kemik algoritması ile rekonstrükte edilmiş aksiyel kesitler.
                  </p>
                  <p className="mt-2">
                    <strong>Görüntü İşleme Ortamı:</strong> 3B rekonstrüksiyon ve morfometrik ölçümler 3D Slicer (versiyon 5.x) açık kaynak yazılımında; geometrik morfometri analizleri MorphoJ (versiyon 1.08) yazılımında; istatistiksel analizler IBM SPSS Statistics (versiyon 26.0) yazılımında gerçekleştirilecektir.
                  </p>
                </div>

                {/* 7. Araştırmaya Katılanlar */}
                <div>
                  <p className="font-bold text-base border-b-2 border-black pb-1 mb-3">7. Araştırmaya Katılanlar / Denekler (Study Population)</p>
                  <p className="font-semibold mt-2">Hedef Populasyon:</p>
                  <p>
                    18 yaş ve üzeri Türk erişkin bireylerin kranial BT görüntüleri.
                  </p>
                  <p className="font-semibold mt-3">Çalışma Populasyonu:</p>
                  <p>
                    {HOSPITAL} {SUPPORT_CLINIC}'nda 2020–2025 yılları arasında çeşitli klinik endikasyonlarla (baş ağrısı, travma değerlendirmesi, sinüzit, nörolojik semptomlar vb.) kranial BT çekilmiş olan hastaların PACS arşivindeki görüntüleri.
                  </p>
                  <p className="font-semibold mt-3">Dahil Edilme Kriterleri:</p>
                  <ol className="list-decimal pl-6 space-y-1 mt-1">
                    <li>18 yaş ve üzeri erişkin bireyler</li>
                    <li>Orbital bölgeyi içeren kranial BT görüntüsü mevcut olan hastalar</li>
                    <li>Görüntü kalitesi 3B rekonstrüksiyon ve landmark yerleştirme için yeterli olan olgular</li>
                    <li>Kesit kalınlığı ≤1.5 mm olan BT taramaları</li>
                    <li>Kemik algoritması ile rekonstrükte edilmiş görüntüler</li>
                  </ol>
                  <p className="font-semibold mt-3">Dışlama Kriterleri:</p>
                  <ol className="list-decimal pl-6 space-y-1 mt-1">
                    <li>18 yaş altı bireyler (epifiz hatlarının kapanmamış olması nedeniyle orbital gelişimin tamamlanmamış olabileceği bireyler)</li>
                    <li>Orbital bölgede travma öyküsü (blow-out fraktürü, Le Fort fraktürü, zigomatik ark fraktürü vb.) olan bireyler</li>
                    <li>Orbital veya periorbital cerrahi geçirmiş bireyler (enükleasyon, orbital dekompresyon, kraniotomi vb.)</li>
                    <li>Orbital bölgede kitle/tümör (orbital lenfoma, lakrimal gland tümörü, retinoblastom, meningiom vb.) saptanan olgular</li>
                    <li>Konjenital kraniofasiyal anomali (kraniosinostoz, Treacher Collins sendromu, fibröz displazi, Crouzon sendromu vb.) bulunan hastalar</li>
                    <li>Ciddi metal artefakt (dental implant, metalik yabancı cisim, cerrahi plak/vida) nedeniyle orbital bölgede görüntü kalitesi bozulmuş olgular</li>
                    <li>Hareket artefaktı veya kesit kalınlığı &gt;1.5 mm nedeniyle 3B rekonstrüksiyon için yetersiz olan görüntüler</li>
                    <li>Metabolik kemik hastalığı (Paget hastalığı, hiperparatiroidizm vb.) tanısı olan bireyler</li>
                  </ol>
                </div>

                {/* 8. Birincil ve İkincil Sonuç Değişkenleri */}
                <div>
                  <p className="font-bold text-base border-b-2 border-black pb-1 mb-3">8. Araştırmanın Birincil ve İkincil Sonuç Değişkenleri (Primary and Secondary Outcomes)</p>
                  <p className="font-semibold mt-2">Birincil Sonuç Değişkeni (Primary Outcome):</p>
                  <p>
                    Orbital morfometrik parametrelere (lineer ölçümler, geometrik morfometri ve asimetri indeksleri) dayalı diskriminant fonksiyon analizi ve lojistik regresyon modellerinin cinsiyet sınıflandırma doğruluğu (% correct classification rate), ROC eğrisi altındaki alan (AUC), sensitivite ve spesifisite değerleri.
                  </p>
                  <p className="font-semibold mt-3">İkincil Sonuç Değişkenleri (Secondary Outcomes):</p>
                  <ol className="list-decimal pl-6 space-y-2 mt-1">
                    <li>
                      <strong>Lineer Morfometrik Parametreler:</strong> 18 parametrenin (orbital genişlik, yükseklik, derinlik, hacim, indeks, apertur alanı/çevresi, kenar kalınlıkları, interorbital mesafe, biorbital genişlik) cinsiyetlere göre ortalama, standart sapma ve parametrik/non-parametrik karşılaştırma sonuçları (bağımsız t-testi veya Mann-Whitney U).
                    </li>
                    <li>
                      <strong>Orbital Volümetri:</strong> 3D Slicer segmentasyon tabanlı orbital volüm ölçümü; sağ ve sol orbital volümlerin cinsiyetlere göre dağılımı ve ROC analiziyle volüm tabanlı sınıflandırma performansı.
                    </li>
                    <li>
                      <strong>Asimetri İndeksleri:</strong> 7 asimetri indeksinin (genişlik, yükseklik, derinlik, hacim, orbital indeks, apertur alanı, direktional asimetri) cinsiyetlere göre dağılımı; flüktuatif asimetri (FA = |Sağ − Sol|) ve direktional asimetri (DA = Sağ − Sol) değerleri.
                    </li>
                    <li>
                      <strong>Geometrik Morfometri Değişkenleri:</strong> 12 landmark üzerinden GPA sonrası elde edilen Procrustes koordinatları; PCA ile boyut indirgeme (eigenvalue, % varyans); CVA/DFA ile cinsiyetler arası ayrımın Mahalanobis ve Procrustes mesafeleri; centroid size'ın cinsiyetler arası karşılaştırması; allometrik regresyon (boyut-şekil ilişkisi).
                    </li>
                    <li>
                      <strong>Kombine Model Performansı:</strong> Lineer + GM, Lineer + Asimetri, GM + Asimetri ve Lineer + GM + Asimetri kombinasyonlarının sınıflandırma doğrulukları; her bir modelin Leave-One-Out Cross-Validation (LOOCV) sonuçları.
                    </li>
                    <li>
                      <strong>İntra- ve İnterobservatör Güvenilirlik:</strong> 30 olguda tekrarlanan ölçümler ile değerlendirilecek Intraclass Correlation Coefficient (ICC) ve Bland-Altman uyum analizi.
                    </li>
                  </ol>
                </div>

                {/* 9. Araştırma Süreçleri */}
                <div>
                  <p className="font-bold text-base border-b-2 border-black pb-1 mb-3">9. Araştırma Süreçleri (Study Procedures)</p>
                  <p className="font-semibold mt-2">Aşama 1: Etik Onay ve Hazırlık (1. Ay)</p>
                  <ul className="list-disc pl-6 space-y-1 mt-1">
                    <li>Etik kurul onayının alınması</li>
                    <li>PACS arşiv erişim izninin temini ({RADIOLOGY_PROF} koordinasyonuyla)</li>
                    <li>Veri toplama formunun (CRF) finalize edilmesi</li>
                    <li>3D Slicer, MorphoJ ve SPSS yazılımlarının konfigürasyonu</li>
                    <li>Pilot çalışma: 20 olguda tüm ölçüm protokolünün test edilmesi</li>
                  </ul>

                  <p className="font-semibold mt-3">Aşama 2: Görüntü Tarama ve Olgu Seçimi (2.–3. Ay)</p>
                  <ul className="list-disc pl-6 space-y-1 mt-1">
                    <li>PACS arşivinde 2020–2025 yılları arasındaki kranial BT görüntülerinin sistematik taranması</li>
                    <li>Dahil edilme ve dışlama kriterlerinin uygulanması</li>
                    <li>Eşit sayıda kadın ve erkek olgunun seçilmesi (cinsiyet dengeli örneklem)</li>
                    <li>Hasta kimlik bilgilerinin anonimleştirilmesi; yalnızca yaş ve cinsiyet bilgisi kaydedilmesi</li>
                    <li>DICOM formatında görüntülerin güvenli ortama aktarılması</li>
                  </ul>

                  <p className="font-semibold mt-3">Aşama 3: 3B Rekonstrüksiyon ve Lineer Ölçümler (4.–5. Ay)</p>
                  <ul className="list-disc pl-6 space-y-1 mt-1">
                    <li>3D Slicer yazılımında DICOM verilerinin yüklenmesi ve kemik penceresi (bone window) ayarlanması</li>
                    <li>Volume rendering ve multiplanar reformasyon (MPR) ile orbital bölgenin görselleştirilmesi</li>
                    <li>18 lineer parametrenin sistematik ölçümü: orbital genişlik (eko–dacryon), orbital yükseklik (superior–inferior kenar), orbital derinlik (apertur–apeks), orbital hacim (segmentasyon tabanlı), kenar kalınlıkları, interorbital ve biorbital mesafeler</li>
                    <li>Orbital volüm ölçümü: Semi-otomatik segmentasyon ile orbital kavite sınırlarının belirlenmesi ve volümetrik hesaplama (cm³)</li>
                  </ul>

                  <p className="font-semibold mt-3">Aşama 4: Geometrik Morfometri (6.–7. Ay)</p>
                  <ul className="list-disc pl-6 space-y-1 mt-1">
                    <li>12 orbital landmark noktasının 3B koordinatlarının (x, y, z) kaydedilmesi: Dacryon (sağ/sol), Frontomalare orbitale (sağ/sol), Ectoconchion (sağ/sol), Maxillofrontale (sağ/sol), Superior orbital kenar orta noktası (sağ/sol), İnferior orbital kenar orta noktası (sağ/sol)</li>
                    <li>MorphoJ yazılımında Generalized Procrustes Analysis (GPA) ile translasyon, rotasyon ve ölçekleme standartizasyonu</li>
                    <li>Centroid size hesaplanması ve cinsiyetler arası karşılaştırması (boyut dimorfizmi)</li>
                    <li>Principal Component Analysis (PCA) — şekil varyasyonunun ana bileşenlerinin belirlenmesi</li>
                    <li>Canonical Variate Analysis (CVA) / Discriminant Function Analysis (DFA) — cinsiyetler arası şekil ayrımı</li>
                    <li>Procrustes ANOVA — cinsiyet etkisinin istatistiksel anlamlılığı</li>
                    <li>Thin-Plate Spline (TPS) deformasyon gridleri ile dimorfik şekil değişiminin görselleştirilmesi</li>
                  </ul>

                  <p className="font-semibold mt-3">Aşama 5: Asimetri Analizi (7.–8. Ay)</p>
                  <ul className="list-disc pl-6 space-y-1 mt-1">
                    <li>Bilateral asimetri indekslerinin hesaplanması: AI = [(Sağ − Sol) / ((Sağ + Sol) / 2)] × 100</li>
                    <li>Flüktuatif asimetri (FA): |Sağ − Sol| — gelişimsel instabilite göstergesi</li>
                    <li>Direktional asimetri (DA): Sağ − Sol — sistematik lateralizasyon paterni</li>
                    <li>Her iki asimetri tipinin cinsiyetler arası karşılaştırması</li>
                    <li>Asimetri parametrelerinin diskriminant modellere katkısının değerlendirilmesi</li>
                  </ul>

                  <p className="font-semibold mt-3">Aşama 6: İstatistiksel Analiz ve Model Oluşturma (8.–9. Ay)</p>
                  <ul className="list-disc pl-6 space-y-1 mt-1">
                    <li>Tanımlayıcı istatistikler (ortalama ± SS, medyan, IQR) ve normallik testi (Shapiro-Wilk)</li>
                    <li>Parametrik (bağımsız t-testi) / non-parametrik (Mann-Whitney U) cinsiyetler arası karşılaştırmalar</li>
                    <li>Stepwise diskriminant fonksiyon analizi (DFA) — en ayırt edici parametrelerin belirlenmesi</li>
                    <li>Binary lojistik regresyon modelleri (forward / backward elimination)</li>
                    <li>ROC eğrisi analizi: AUC, sensitivite, spesifisite, optimal cut-off değerleri</li>
                    <li>Leave-One-Out Cross-Validation (LOOCV) ile model doğrulama</li>
                    <li>İntra- ve interobservatör güvenilirlik (ICC, Bland-Altman)</li>
                  </ul>

                  <p className="font-semibold mt-3">Aşama 7: Sonuçların Yazımı ve Tez Teslimi (9.–10. Ay)</p>
                  <ul className="list-disc pl-6 space-y-1 mt-1">
                    <li>Bulgularının yazımı, tablo ve figürlerin hazırlanması</li>
                    <li>Literatür karşılaştırması ve tartışma bölümünün oluşturulması</li>
                    <li>Tez raporunun tamamlanması ve danışman onayı</li>
                    <li>Makale yazımı ve dergiye gönderilmesi</li>
                  </ul>
                </div>

                {/* 10. Örnek Büyüklüğü ve İstatistiksel Güç */}
                <div>
                  <p className="font-bold text-base border-b-2 border-black pb-1 mb-3">10. Örnek Büyüklüğü ve İstatistiksel Güç (Sample Size and Statistical Power)</p>
                  <p className="font-semibold mt-2">Güç Analizi:</p>
                  <p>
                    Örneklem büyüklüğü, G*Power (versiyon 3.1.9.7) yazılımı kullanılarak a priori güç analizi ile hesaplanmıştır. Hesaplama parametreleri aşağıda sunulmaktadır:
                  </p>
                  <table className="w-full border-collapse mt-2">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1 font-semibold w-1/2">İstatistiksel test:</td>
                        <td className="py-1">Bağımsız iki grup karşılaştırması (t-testi)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Etki büyüklüğü (Cohen's d):</td>
                        <td className="py-1">0.5 (orta düzey etki)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Tip I hata (α):</td>
                        <td className="py-1">0.05 (iki yönlü)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">İstatistiksel güç (1 − β):</td>
                        <td className="py-1">0.80 (%80)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 font-semibold">Tahmin edilen örneklem:</td>
                        <td className="py-1">Her grup için minimum 64 birey (toplam 128)</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="mt-3">
                    <strong>Diskriminant fonksiyon analizi için:</strong> Genel kural olarak, her bir bağımsız değişken başına en az 20 gözlem önerilmektedir (Tabachnick ve Fidell, 2019). Çalışmada 18 lineer parametre + 7 asimetri indeksi + 6 GM değişkeni (centroid size + PC1–PC5) = toplam 31 bağımsız değişken bulunduğundan, minimum 31 × 20 = 620 gözlem (310 kadın + 310 erkek) idealdir. Ancak bu oran, stepwise DFA'da daha az değişkenin modele alınması nedeniyle esnetilebilir.
                  </p>

                  <p className="mt-2">
                    <strong>Geometrik morfometri için:</strong> Klingenberg (2011) ve Zelditch ve ark. (2012), GM çalışmalarında grup başına en az 30–50 birey önermektedir. Landmark sayısı × 3 (koordinat) = 12 × 3 = 36 boyutlu şekil uzayı olduğundan, yeterli istatistiksel güç için grup başına en az 50 birey gereklidir.
                  </p>

                  <p className="mt-2">
                    <strong>Hedeflenen Örneklem:</strong> Hem lineer analiz hem de GM gereksinimleri göz önüne alındığında, çalışmada <strong>en az 200 birey (100 kadın + 100 erkek)</strong> hedeflenmektedir. Olası veri kaybı (%10–15 düşme oranı) hesaba katılarak başlangıçta 230–250 olgunun taranması planlanmaktadır.
                  </p>

                  <p className="mt-2">
                    <strong>Cross-Validation Stratejisi:</strong> Oluşturulan diskriminant fonksiyonların aşırı uyum (overfitting) riskini minimize etmek amacıyla Leave-One-Out Cross-Validation (LOOCV — Jackknife) yöntemi kullanılacaktır. Bu yöntemde, her bir olgu sırasıyla test seti olarak çıkarılarak kalan olgularla model oluşturulmakta ve çıkarılan olgunun sınıflandırılması test edilmektedir. Elde edilen çapraz doğrulama doğruluğu, modelin gerçek dünya performansının güvenilir bir tahmini olarak kabul edilmektedir.
                  </p>
                </div>

                <div className="mt-8 flex justify-between">
                  <div>
                    <p className="font-semibold">Sorumlu Araştırmacı</p>
                    <p>{RESEARCHER_TITLE} {RESEARCHER}</p>
                    <p className="mt-2">İmza:</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Tez Danışmanı</p>
                    <p>{ADMIN_RESPONSIBLE}</p>
                    <p className="mt-2">İmza:</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .print-hidden,
          .print-hidden * {
            display: none !important;
          }
          .doc-action-btns {
            display: none !important;
          }
          .ethics-print-content {
            padding: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-after-page {
            break-after: page;
            page-break-after: always;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
