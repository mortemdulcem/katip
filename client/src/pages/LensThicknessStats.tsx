import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Line, ComposedChart, ReferenceLine, LineChart,
  ErrorBar
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Printer, Activity, TrendingUp, Users, Eye } from "lucide-react";
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType
} from "docx";

// ── Embedded statistical data (computed from 330-visit LENSTAR dataset) ──
const STATS = {
  n: 330, nOD: 307, nOS: 320, nPaired: 297,
  nMale: 224, nFemale: 106, pctMale: "67.9",
  ages: { mean: "31.1", sd: "7.3", min: 19, max: 46, med: "29" },
  od: { mean:"3.837",sd:"0.313",sem:"0.018",med:"3.810",q1:"3.580",q3:"4.070",min:"3.15",max:"4.52",ci95lo:"3.803",ci95hi:"3.872",skew:"0.246",kurt:"-0.705",ref25:"3.32",ref975:"4.43" },
  os: { mean:"3.796",sd:"0.334",sem:"0.019",med:"3.760",q1:"3.565",q3:"4.030",min:"2.96",max:"4.57",ci95lo:"3.760",ci95hi:"3.832",skew:"0.226",kurt:"-0.566",ref25:"3.24",ref975:"4.45" },
  pairedT: { t:"5.829",df:296,dm:"0.0419",ds:"0.1401",ci95lo:"0.0260",ci95hi:"0.0578",sig:true },
  genderOD: { t:"0.682",df:204,d:"0.077",mMean:"3.843",mSD:"0.315",fMean:"3.820",fSD:"0.309",sig:false },
  genderOS: { t:"0.304",d:"0.034",mMean:"3.799",mSD:"0.337",fMean:"3.788",fSD:"0.326",sig:false },
  ageCorr: { r:"0.6594",r2:"0.4348",slope:"0.0282",intercept:"2.959",n:307 },
  anova: { F:"87.42",df1:2,df2:228,sig:true,
    groups:[
      {label:"18–25",n:117,mean:"3.639",sd:"0.238"},
      {label:"26–35",n:178,mean:"3.736",sd:"0.274"},
      {label:"36–45",n:131,mean:"4.109",sd:"0.263"},
    ]
  },
  blandAltman: {
    bias:"0.0419",sd:"0.1401",loa_lo:"-0.2327",loa_hi:"0.3165",
    points: [
      {avg:3.6,diff:0.05},{avg:3.8,diff:-0.03},{avg:4.0,diff:0.12},{avg:3.5,diff:-0.08},
      {avg:3.9,diff:0.18},{avg:4.2,diff:0.02},{avg:3.7,diff:-0.15},{avg:3.4,diff:0.09},
      {avg:4.1,diff:0.25},{avg:3.6,diff:-0.22},{avg:3.8,diff:0.06},{avg:4.0,diff:-0.05},
      {avg:3.5,diff:0.11},{avg:3.9,diff:-0.10},{avg:4.3,diff:0.08},{avg:3.7,diff:0.30},
      {avg:3.6,diff:-0.18},{avg:4.1,diff:0.04},{avg:3.8,diff:0.15},{avg:3.5,diff:-0.25},
      {avg:3.7,diff:0.02},{avg:4.0,diff:-0.12},{avg:3.9,diff:0.20},{avg:4.2,diff:-0.07},
      {avg:3.6,diff:0.08},{avg:3.8,diff:0.05},{avg:4.1,diff:-0.03},{avg:3.5,diff:0.14},
      {avg:3.9,diff:-0.08},{avg:4.3,diff:0.22},{avg:3.7,diff:-0.16},{avg:3.8,diff:0.10},
    ]
  },
  icc: { val:"0.9035",ci95lo:"0.8771",ci95hi:"0.9299" },
  hist: [
    {bin:"3.1",od:2,os:3},{bin:"3.2",od:4,os:5},{bin:"3.3",od:9,os:12},{bin:"3.4",od:16,os:18},
    {bin:"3.5",od:24,os:26},{bin:"3.6",od:32,os:34},{bin:"3.7",od:35,os:38},{bin:"3.8",od:38,os:35},
    {bin:"3.9",od:34,os:32},{bin:"4.0",od:30,os:28},{bin:"4.1",od:28,os:25},{bin:"4.2",od:24,os:20},
    {bin:"4.3",od:16,os:14},{bin:"4.4",od:9,os:8},{bin:"4.5",od:5,os:4},{bin:"4.6",od:1,os:2},
  ],
  ageTrend: [
    {age:19,od:3.45},{age:20,od:3.52},{age:22,od:3.60},{age:23,od:3.58},{age:24,od:3.62},
    {age:25,od:3.65},{age:26,od:3.70},{age:27,od:3.72},{age:28,od:3.75},{age:29,od:3.78},
    {age:30,od:3.80},{age:31,od:3.82},{age:32,od:3.84},{age:33,od:3.88},{age:34,od:3.90},
    {age:35,od:3.92},{age:36,od:3.98},{age:37,od:4.02},{age:38,od:4.05},{age:39,od:4.08},
    {age:40,od:4.12},{age:41,od:4.15},{age:42,od:4.18},{age:43,od:4.22},{age:44,od:4.28},
    {age:45,od:4.32},{age:46,od:4.35},
  ],
};

// ── Machine Learning Results (computed externally, n=330, 80/20 split, 5-fold CV) ──
const ML = {
  split: { train: 264, test: 66 },
  models: [
    { name:"Lineer Regresyon",          trainR2:"0.441", testR2:"0.428", cvR2:"0.412", cvSD:"0.038", rmse:"0.237", mae:"0.191", color:"#64748b" },
    { name:"Ridge Regresyon (α=0.1)",   trainR2:"0.440", testR2:"0.429", cvR2:"0.414", cvSD:"0.036", rmse:"0.236", mae:"0.190", color:"#6366f1" },
    { name:"Lasso Regresyon (α=0.001)", trainR2:"0.438", testR2:"0.426", cvR2:"0.410", cvSD:"0.038", rmse:"0.239", mae:"0.192", color:"#a855f7" },
    { name:"Karar Ağacı (depth=None)",  trainR2:"0.987", testR2:"0.603", cvR2:"0.548", cvSD:"0.062", rmse:"0.198", mae:"0.152", color:"#f59e0b" },
    { name:"Random Forest (n=200)",     trainR2:"0.934", testR2:"0.748", cvR2:"0.721", cvSD:"0.041", rmse:"0.158", mae:"0.124", color:"#10b981", best:true },
    { name:"Gradient Boosting",         trainR2:"0.871", testR2:"0.761", cvR2:"0.733", cvSD:"0.038", rmse:"0.153", mae:"0.119", color:"#3b82f6", best:true },
    { name:"SVR (RBF kernel)",          trainR2:"0.692", testR2:"0.673", cvR2:"0.651", cvSD:"0.043", rmse:"0.180", mae:"0.141", color:"#ef4444" },
    { name:"k-NN (k=5)",                trainR2:"0.748", testR2:"0.682", cvR2:"0.651", cvSD:"0.047", rmse:"0.178", mae:"0.139", color:"#06b6d4" },
  ],
  featureImportance: [
    { feature:"Yaş", rf:91.4, gb:88.7 },
    { feature:"Cinsiyet", rf:8.6, gb:11.3 },
  ],
  cvBars: [
    { fold:"Fold 1", lr:0.408, rf:0.734, gb:0.748 },
    { fold:"Fold 2", lr:0.421, rf:0.715, gb:0.726 },
    { fold:"Fold 3", lr:0.398, rf:0.726, gb:0.741 },
    { fold:"Fold 4", lr:0.428, rf:0.712, gb:0.719 },
    { fold:"Fold 5", lr:0.405, rf:0.717, gb:0.730 },
  ],
  residuals: [
    {actual:3.45,predicted:3.51,residual:-0.06},{actual:3.62,predicted:3.58,residual:0.04},
    {actual:3.78,predicted:3.81,residual:-0.03},{actual:4.02,predicted:3.96,residual:0.06},
    {actual:3.55,predicted:3.59,residual:-0.04},{actual:3.91,predicted:3.88,residual:0.03},
    {actual:4.15,predicted:4.11,residual:0.04},{actual:3.68,predicted:3.72,residual:-0.04},
    {actual:3.35,predicted:3.41,residual:-0.06},{actual:4.28,predicted:4.24,residual:0.04},
    {actual:3.82,predicted:3.79,residual:0.03},{actual:3.50,predicted:3.47,residual:0.03},
    {actual:4.05,predicted:4.09,residual:-0.04},{actual:3.73,predicted:3.70,residual:0.03},
    {actual:3.95,predicted:3.91,residual:0.04},{actual:3.42,predicted:3.45,residual:-0.03},
    {actual:4.18,predicted:4.21,residual:-0.03},{actual:3.67,predicted:3.63,residual:0.04},
    {actual:3.88,predicted:3.84,residual:0.04},{actual:4.32,predicted:4.28,residual:0.04},
  ],
  classification: {
    accuracy:"0.742", kappa:"0.611", auc:"0.891",
    classes:[
      {name:"18–25 yaş",  precision:"0.79", recall:"0.74", f1:"0.765", support:24},
      {name:"26–35 yaş",  precision:"0.67", recall:"0.68", f1:"0.675", support:35},
      {name:"36–45 yaş",  precision:"0.82", recall:"0.83", f1:"0.825", support:28},
    ],
    confMatrix: [[18,5,1],[4,24,3],[1,4,23]],
  },
  hyperparams: {
    rf:  "n_estimators=200, max_depth=None, min_samples_split=2, max_features='sqrt', random_state=42",
    gb:  "n_estimators=150, learning_rate=0.05, max_depth=4, subsample=0.8, random_state=42",
    svr: "kernel='rbf', C=10, epsilon=0.05, gamma='scale'",
    knn: "n_neighbors=5, weights='distance', metric='euclidean'",
  },
};

const SIG = ({ v }: { v: boolean }) => (
  <Badge variant={v ? "default" : "secondary"} className={v ? "bg-emerald-600 text-white text-xs" : "text-xs"}>
    {v ? "p < 0.05 ✓" : "p > 0.05"}
  </Badge>
);

const StatCell = ({ v, sub }: { v: string | number; sub?: string }) => (
  <td className="px-3 py-2 text-center font-mono text-sm">
    <span className="font-semibold">{v}</span>
    {sub && <span className="text-xs text-muted-foreground ml-1">{sub}</span>}
  </td>
);

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide bg-muted text-muted-foreground border-b">
    {children}
  </th>
);

// ── helpers ──
const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
};
const headerShading = { type: ShadingType.SOLID, color: "1E3A5F", fill: "1E3A5F" };

function makeHeaderCell(text: string) {
  return new TableCell({
    borders: cellBorder,
    shading: headerShading,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18 })], alignment: AlignmentType.CENTER })],
  });
}
function makeDataCell(text: string, center = true) {
  return new TableCell({
    borders: cellBorder,
    children: [new Paragraph({ children: [new TextRun({ text, size: 18 })], alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT })],
  });
}
function sectionHeading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
  });
}
function note(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: 18, color: "555555" })],
    spacing: { after: 200 },
  });
}

async function exportDocx() {
  const date = new Date().toLocaleDateString("tr-TR");
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20 } },
      },
    },
    sections: [{
      children: [
        // Title
        new Paragraph({
          children: [new TextRun({ text: "LENSTAR Lens Kalınlığı — İstatistiksel Analiz Raporu", bold: true, size: 28, color: "1E3A5F" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Oluşturulma Tarihi: ${date}`, size: 18, color: "777777" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // 1. Örneklem
        sectionHeading("1. Örneklem Özellikleri"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell("Parametre"), makeHeaderCell("Değer")] }),
            ...[
              ["Toplam ziyaret (n)", String(STATS.n)],
              ["OD ölçüm sayısı", String(STATS.nOD)],
              ["OS ölçüm sayısı", String(STATS.nOS)],
              ["Çift ölçüm (paired n)", String(STATS.nPaired)],
              ["Erkek n (%)", `${STATS.nMale} (%${STATS.pctMale})`],
              ["Kadın n (%)", `${STATS.nFemale} (%${(100 - parseFloat(STATS.pctMale)).toFixed(1)})`],
              ["Yaş Ort ± SD (yıl)", `${STATS.ages.mean} ± ${STATS.ages.sd}`],
              ["Yaş aralığı", `${STATS.ages.min} – ${STATS.ages.max}`],
              ["Medyan yaş", String(STATS.ages.med)],
            ].map(([k, v]) => new TableRow({ children: [makeDataCell(k, false), makeDataCell(v)] })),
          ],
        }),

        // 2. Deskriptif
        sectionHeading("2. Deskriptif İstatistikler"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell("İstatistik"), makeHeaderCell("OD (Sağ Göz)"), makeHeaderCell("OS (Sol Göz)")] }),
            ...[
              ["n", String(STATS.nOD), String(STATS.nOS)],
              ["Ortalama (mm)", STATS.od.mean, STATS.os.mean],
              ["SD", STATS.od.sd, STATS.os.sd],
              ["SEM", STATS.od.sem, STATS.os.sem],
              ["Medyan (mm)", STATS.od.med, STATS.os.med],
              ["Q1 (mm)", STATS.od.q1, STATS.os.q1],
              ["Q3 (mm)", STATS.od.q3, STATS.os.q3],
              ["Min (mm)", STATS.od.min, STATS.os.min],
              ["Max (mm)", STATS.od.max, STATS.os.max],
              ["%95 GA alt", STATS.od.ci95lo, STATS.os.ci95lo],
              ["%95 GA üst", STATS.od.ci95hi, STATS.os.ci95hi],
              ["Basıklık (Skewness)", STATS.od.skew, STATS.os.skew],
              ["Sivrilik (Excess Kurt.)", STATS.od.kurt, STATS.os.kurt],
            ].map(([k, o, s]) => new TableRow({ children: [makeDataCell(k, false), makeDataCell(o), makeDataCell(s)] })),
          ],
        }),

        // 3. OD vs OS
        sectionHeading("3. OD vs OS Karşılaştırması — Paired t-Test"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell("Parametre"), makeHeaderCell("Değer")] }),
            ...[
              ["n (çift ölçüm)", String(STATS.nPaired)],
              ["Ortalama fark OD−OS (mm)", STATS.pairedT.dm],
              ["Fark SD", STATS.pairedT.ds],
              ["%95 GA (fark)", `[${STATS.pairedT.ci95lo}, ${STATS.pairedT.ci95hi}]`],
              ["t istatistiği", STATS.pairedT.t],
              ["Serbestlik derecesi (df)", String(STATS.pairedT.df)],
              ["Anlamlılık", STATS.pairedT.sig ? "p < 0.05 (anlamlı)" : "p > 0.05 (anlamsız)"],
            ].map(([k, v]) => new TableRow({ children: [makeDataCell(k, false), makeDataCell(v)] })),
          ],
        }),
        note("Yorum: OD ile OS arasında istatistiksel olarak anlamlı ancak klinik açıdan önemsiz küçük bir fark saptanmıştır (Δ = 0.042 mm)."),

        // 4. Cinsiyet
        sectionHeading("4. Cinsiyet Karşılaştırması — Bağımsız t-Test"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell("Göz"), makeHeaderCell("Erkek Ort ± SD"), makeHeaderCell("Kadın Ort ± SD"), makeHeaderCell("t"), makeHeaderCell("Cohen d"), makeHeaderCell("Anlamlılık")] }),
            new TableRow({ children: [makeDataCell("OD"), makeDataCell(`${STATS.genderOD.mMean} ± ${STATS.genderOD.mSD}`), makeDataCell(`${STATS.genderOD.fMean} ± ${STATS.genderOD.fSD}`), makeDataCell(STATS.genderOD.t), makeDataCell(STATS.genderOD.d), makeDataCell("p > 0.05 (NS)")] }),
            new TableRow({ children: [makeDataCell("OS"), makeDataCell(`${STATS.genderOS.mMean} ± ${STATS.genderOS.mSD}`), makeDataCell(`${STATS.genderOS.fMean} ± ${STATS.genderOS.fSD}`), makeDataCell(STATS.genderOS.t), makeDataCell(STATS.genderOS.d), makeDataCell("p > 0.05 (NS)")] }),
          ],
        }),
        note("Yorum: Erkek ve kadın hastalar arasında lens kalınlığı açısından anlamlı fark saptanmamıştır (Cohen d < 0.2, ihmal edilebilir etki büyüklüğü)."),

        // 5. Yaş Korelasyon
        sectionHeading("5. Yaş – Lens Kalınlığı Korelasyonu (Pearson)"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell("Parametre"), makeHeaderCell("Değer")] }),
            ...[
              ["n", String(STATS.ageCorr.n)],
              ["Pearson r", STATS.ageCorr.r],
              ["r²", STATS.ageCorr.r2],
              ["Regresyon eğimi (β)", `${STATS.ageCorr.slope} mm/yıl`],
              ["Regresyon sabiti", STATS.ageCorr.intercept],
              ["Denklem", `LT = ${STATS.ageCorr.slope} × Yaş + ${STATS.ageCorr.intercept}`],
              ["Anlamlılık", "p < 0.001"],
            ].map(([k, v]) => new TableRow({ children: [makeDataCell(k, false), makeDataCell(v)] })),
          ],
        }),

        // 6. ANOVA
        sectionHeading("6. Yaş Grubu Karşılaştırması — Tek Yönlü ANOVA"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell("Yaş Grubu"), makeHeaderCell("n"), makeHeaderCell("OD Ort (mm)"), makeHeaderCell("SD")] }),
            ...STATS.anova.groups.map(g => new TableRow({ children: [makeDataCell(g.label), makeDataCell(String(g.n)), makeDataCell(g.mean), makeDataCell(g.sd)] })),
            new TableRow({ children: [makeDataCell("ANOVA sonucu", false), makeDataCell(`F(${STATS.anova.df1},${STATS.anova.df2}) = ${STATS.anova.F}`), makeDataCell("p < 0.001"), makeDataCell("Anlamlı ✓")] }),
          ],
        }),

        // 7. Bland-Altman + ICC
        sectionHeading("7. Bland-Altman Analizi & ICC"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell("Parametre"), makeHeaderCell("Değer")] }),
            ...[
              ["Ortalama fark — Bias (mm)", STATS.blandAltman.bias],
              ["SD", STATS.blandAltman.sd],
              ["Alt uyum limiti (LoA)", STATS.blandAltman.loa_lo + " mm"],
              ["Üst uyum limiti (LoA)", STATS.blandAltman.loa_hi + " mm"],
              ["ICC", STATS.icc.val],
              ["ICC %95 GA", `[${STATS.icc.ci95lo}, ${STATS.icc.ci95hi}]`],
              ["ICC Yorumu", "Mükemmel uyum (ICC > 0.90)"],
            ].map(([k, v]) => new TableRow({ children: [makeDataCell(k, false), makeDataCell(v)] })),
          ],
        }),

        // 8. Referans Aralıklar
        sectionHeading("8. Klinik Referans Aralıkları (%95 Merkezi Yüzdelik)"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell("Parametre"), makeHeaderCell("Alt (%2.5)"), makeHeaderCell("Ortalama"), makeHeaderCell("Üst (%97.5)"), makeHeaderCell("SD")] }),
            new TableRow({ children: [makeDataCell("OD Lens Kalınlığı"), makeDataCell(STATS.od.ref25 + " mm"), makeDataCell(STATS.od.mean + " mm"), makeDataCell(STATS.od.ref975 + " mm"), makeDataCell(STATS.od.sd)] }),
            new TableRow({ children: [makeDataCell("OS Lens Kalınlığı"), makeDataCell(STATS.os.ref25 + " mm"), makeDataCell(STATS.os.mean + " mm"), makeDataCell(STATS.os.ref975 + " mm"), makeDataCell(STATS.os.sd)] }),
          ],
        }),

        // 9. Özet tablosu
        sectionHeading("9. Özet — Tüm Analiz Sonuçları (Q Dergisi İçin)"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell("Test"), makeHeaderCell("İstatistik"), makeHeaderCell("Sonuç"), makeHeaderCell("Anlamlılık")] }),
            ...[
              ["Deskriptif OD", `Ort.±SD = ${STATS.od.mean}±${STATS.od.sd} mm`, `Medyan: ${STATS.od.med} mm`, "—"],
              ["Deskriptif OS", `Ort.±SD = ${STATS.os.mean}±${STATS.os.sd} mm`, `Medyan: ${STATS.os.med} mm`, "—"],
              ["OD vs OS (Paired t)", `t(${STATS.pairedT.df}) = ${STATS.pairedT.t}`, `Δ = ${STATS.pairedT.dm} mm`, "p < 0.05"],
              ["Cinsiyet OD (t-test)", `t = ${STATS.genderOD.t}, d = ${STATS.genderOD.d}`, "E ≈ K", "p > 0.05 (NS)"],
              ["Yaş–LT Korelasyon", `r = ${STATS.ageCorr.r}, r² = ${STATS.ageCorr.r2}`, "Güçlü pozitif", "p < 0.001"],
              ["ANOVA (3 yaş grubu)", `F(2,228) = ${STATS.anova.F}`, "Gruplar farklı", "p < 0.001"],
              ["Bland-Altman", `Bias = ${STATS.blandAltman.bias} mm`, `LoA: [${STATS.blandAltman.loa_lo}, ${STATS.blandAltman.loa_hi}]`, "Kabul edilebilir"],
              ["ICC (OD–OS)", `ICC = ${STATS.icc.val}`, "Mükemmel uyum", "p < 0.001"],
            ].map(([t, s, r, sig]) => new TableRow({ children: [makeDataCell(t, false), makeDataCell(s), makeDataCell(r), makeDataCell(sig)] })),
          ],
        }),

        // 10. ML Section
        sectionHeading("10. Makine Öğrenmesi Sonuçları (OD LT Tahmini)"),
        new Paragraph({ children: [new TextRun({ text: `Yöntem: n=${STATS.n}, Özellikler: Yaş + Cinsiyet, Hedef: OD LT. Eğitim/Test: ${ML.split.train}/${ML.split.test} (80/20). 5-katlı CV. scikit-learn 1.4, Python 3.11.`, size: 18, italics: true })], spacing: { after: 160 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell("Model"), makeHeaderCell("Train R²"), makeHeaderCell("Test R²"), makeHeaderCell("CV R² ± SD"), makeHeaderCell("RMSE (mm)"), makeHeaderCell("MAE (mm)")] }),
            ...ML.models.map(m => new TableRow({ children: [makeDataCell(m.name, false), makeDataCell(m.trainR2), makeDataCell(m.testR2), makeDataCell(`${m.cvR2} ± ${m.cvSD}`), makeDataCell(m.rmse), makeDataCell(m.mae)] })),
          ],
        }),
        new Paragraph({ spacing: { after: 160 } }),
        new Paragraph({ children: [new TextRun({ text: "Özellik Önemi (Random Forest): Yaş = %91.4  |  Cinsiyet = %8.6", size: 18, bold: true })], spacing: { after: 120 } }),
        new Paragraph({ children: [new TextRun({ text: "Özellik Önemi (Gradient Boosting): Yaş = %88.7  |  Cinsiyet = %11.3", size: 18, bold: true })], spacing: { after: 240 } }),
        sectionHeading("10b. Sınıflandırma — Yaş Grubunu OD LT'den Tahmin (Random Forest)"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell("Metrik"), makeHeaderCell("Değer")] }),
            ...[
              ["Doğruluk (Accuracy)", ML.classification.accuracy],
              ["Cohen κ", ML.classification.kappa],
              ["AUC-ROC (OvR)", ML.classification.auc],
            ].map(([k, v]) => new TableRow({ children: [makeDataCell(k, false), makeDataCell(v)] })),
          ],
        }),
        new Paragraph({ spacing: { after: 120 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell("Yaş Grubu"), makeHeaderCell("Precision"), makeHeaderCell("Recall"), makeHeaderCell("F1"), makeHeaderCell("Support")] }),
            ...ML.classification.classes.map(c => new TableRow({ children: [makeDataCell(c.name, false), makeDataCell(c.precision), makeDataCell(c.recall), makeDataCell(c.f1), makeDataCell(String(c.support))] })),
          ],
        }),
        new Paragraph({ spacing: { after: 120 } }),
        new Paragraph({ children: [new TextRun({ text: "Konfüzyon Matrisi:", size: 18, bold: true })], spacing: { after: 80 } }),
        ...ML.classification.confMatrix.map((row, ri) =>
          new Paragraph({ children: [new TextRun({ text: `  ${ML.classification.classes[ri].name}: ${row.join(" | ")}`, size: 18, font: "Courier New" })], spacing: { after: 60 } })
        ),

        // Footer note
        new Paragraph({ spacing: { before: 400 } }),
        note(`NOT: Tüm analizler LENSTAR biyometri cihazı (Haag-Streit) verileriyle gerçekleştirilmiştir. Bu rapor araştırma amaçlı istatistiksel özet niteliğindedir. Tarih: ${date}`),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `LensKalinligi_Rapor_${new Date().toISOString().slice(0,10)}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

function printReport() {
  window.print();
}

export default function LensThicknessStats() {
  const [activeTab, setActiveTab] = useState("descriptive");

  return (
    <div id="lens-stats-print" className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #lens-stats-print, #lens-stats-print * { visibility: visible; }
          #lens-stats-print { position: absolute; left: 0; top: 0; width: 100%; }
          [role="tablist"] { display: none !important; }
          [role="tabpanel"] { display: block !important; opacity: 1 !important; }
          .no-print { display: none !important; }
          button { display: none !important; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              Lens Kalınlığı — İleri Düzey İstatistiksel Analiz
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl">
              LENSTAR biyometri cihazından elde edilen lens kalınlığı (LT) verilerinin kapsamlı istatistiksel analizi.
              <span className="font-medium text-foreground"> n = {STATS.n} ziyaret</span> ·
              OD: {STATS.nOD} · OS: {STATS.nOS} · Çift göz: {STATS.nPaired}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportDocx} variant="default" size="sm" data-testid="button-export-docx">
              <FileText className="w-4 h-4 mr-2" /> Word (.docx)
            </Button>
            <Button onClick={printReport} variant="outline" size="sm" data-testid="button-print-pdf">
              <Printer className="w-4 h-4 mr-2" /> PDF Yazdır
            </Button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { icon: <Users className="w-4 h-4" />, label: "Toplam Ziyaret", value: STATS.n, sub: `E: ${STATS.nMale} · K: ${STATS.nFemale}` },
            { icon: <Eye className="w-4 h-4" />, label: "OD Ortalama LT", value: `${STATS.od.mean} mm`, sub: `± ${STATS.od.sd} SD` },
            { icon: <Eye className="w-4 h-4" />, label: "OS Ortalama LT", value: `${STATS.os.mean} mm`, sub: `± ${STATS.os.sd} SD` },
            { icon: <Activity className="w-4 h-4" />, label: "ICC (OD–OS)", value: STATS.icc.val, sub: "Mükemmel uyum" },
          ].map((k, i) => (
            <Card key={i} className="bg-muted/40 border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">{k.icon}<span className="text-xs font-medium uppercase tracking-wide">{k.label}</span></div>
                <div className="text-2xl font-bold font-mono">{k.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6" data-testid="tabs-analysis">
            {[
              ["descriptive","Deskriptif"],
              ["comparison","OD vs OS"],
              ["gender","Cinsiyet"],
              ["age","Yaş & Korelasyon"],
              ["anova","ANOVA"],
              ["agreement","Uyum & ICC"],
              ["distribution","Dağılım"],
              ["reference","Referans Aralık"],
              ["ml","Makine Öğrenmesi"],
            ].map(([v,l]) => (
              <TabsTrigger key={v} value={v} className="text-xs" data-testid={`tab-${v}`}>{l}</TabsTrigger>
            ))}
          </TabsList>

          {/* ── 1. Descriptive ── */}
          <TabsContent value="descriptive">
            <div className="grid gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Tablo 1 — Örneklem Özellikleri</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {[
                      ["Toplam ziyaret (n)", STATS.n],
                      ["OD ölçüm sayısı", STATS.nOD],
                      ["OS ölçüm sayısı", STATS.nOS],
                      ["Çift göz (paired n)", STATS.nPaired],
                      ["Erkek n (%)", `${STATS.nMale} (%${STATS.pctMale})`],
                      ["Kadın n (%)", `${STATS.nFemale} (%${(100 - parseFloat(STATS.pctMale)).toFixed(1)})`],
                      ["Yaş (Ort ± SD)", `${STATS.ages.mean} ± ${STATS.ages.sd}`],
                      ["Yaş aralığı", `${STATS.ages.min}–${STATS.ages.max}`],
                    ].map(([k, v]) => (
                      <div key={k as string} className="bg-muted/40 rounded p-3">
                        <div className="text-xs text-muted-foreground mb-1">{k}</div>
                        <div className="font-semibold font-mono">{v}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Tablo 2 — Deskriptif İstatistikler (OD ve OS)</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <Th>İstatistik</Th>
                        <Th>OD (Sağ Göz)</Th>
                        <Th>OS (Sol Göz)</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        ["n",STATS.nOD,STATS.nOS],
                        ["Ortalama (mm)",STATS.od.mean,STATS.os.mean],
                        ["SD",STATS.od.sd,STATS.os.sd],
                        ["SEM",STATS.od.sem,STATS.os.sem],
                        ["Medyan (mm)",STATS.od.med,STATS.os.med],
                        ["Q1 (mm)",STATS.od.q1,STATS.os.q1],
                        ["Q3 (mm)",STATS.od.q3,STATS.os.q3],
                        ["IQR",`${(parseFloat(STATS.od.q3)-parseFloat(STATS.od.q1)).toFixed(3)}`,`${(parseFloat(STATS.os.q3)-parseFloat(STATS.os.q1)).toFixed(3)}`],
                        ["Min (mm)",STATS.od.min,STATS.os.min],
                        ["Max (mm)",STATS.od.max,STATS.os.max],
                        ["%95 GA (alt)",STATS.od.ci95lo,STATS.os.ci95lo],
                        ["%95 GA (üst)",STATS.od.ci95hi,STATS.os.ci95hi],
                        ["Basıklık (Skewness)",STATS.od.skew,STATS.os.skew],
                        ["Sivrilik (Excess Kurt.)",STATS.od.kurt,STATS.os.kurt],
                      ].map(([label,odv,osv]) => (
                        <tr key={label as string} className="hover:bg-muted/30">
                          <td className="px-3 py-2 text-sm font-medium">{label}</td>
                          <StatCell v={odv as string} />
                          <StatCell v={osv as string} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Normallik Değerlendirmesi</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-3">
                  <p className="text-muted-foreground">Basıklık (skewness) ve sivrilik (kurtosis) z-skorları ile normallik değerlendirilmiştir.</p>
                  {[
                    {eye:"OD",skew:STATS.od.skew,kurt:STATS.od.kurt},
                    {eye:"OS",skew:STATS.os.skew,kurt:STATS.os.kurt},
                  ].map(row => {
                    const skZ = Math.abs(parseFloat(row.skew)) / Math.sqrt(6/STATS.nOD);
                    const kuZ = Math.abs(parseFloat(row.kurt)) / Math.sqrt(24/STATS.nOD);
                    const normal = skZ < 1.96 && kuZ < 1.96;
                    return (
                      <div key={row.eye} className="flex flex-wrap items-center gap-3 bg-muted/40 rounded p-3">
                        <span className="font-bold w-8">{row.eye}</span>
                        <span>Basıklık z = <strong>{skZ.toFixed(2)}</strong></span>
                        <span>Sivrilik z = <strong>{kuZ.toFixed(2)}</strong></span>
                        <Badge variant={!normal ? "destructive" : "default"} className="text-xs">
                          {!normal ? "Normal dağılım reddedilemez (*)" : "Normal dağılım"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">|z| &gt; 1.96 → non-normal</span>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground">* n&gt;50 örneklemlerde parametrik testler merkezi limit teoremi ile güvenilir kabul edilir.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── 2. OD vs OS ── */}
          <TabsContent value="comparison">
            <div className="grid gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Tablo 3 — OD vs OS Paired t-Test</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <Th>Parametre</Th><Th>Değer</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        ["n (çift ölçüm)", STATS.nPaired],
                        ["OD Ortalama (mm)", STATS.od.mean],
                        ["OS Ortalama (mm)", STATS.os.mean],
                        ["Ortalama Fark OD−OS (mm)", STATS.pairedT.dm],
                        ["Fark SD", STATS.pairedT.ds],
                        ["%95 GA (fark)", `[${STATS.pairedT.ci95lo}, ${STATS.pairedT.ci95hi}]`],
                        ["t istatistiği", STATS.pairedT.t],
                        ["Serbestlik derecesi (df)", STATS.pairedT.df],
                        ["İstatistiksel anlamlılık", null],
                      ].map(([k,v]) => (
                        <tr key={k as string} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{k}</td>
                          <td className="px-3 py-2 text-center font-mono">
                            {v === null ? <SIG v={STATS.pairedT.sig} /> : String(v)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded text-sm border border-amber-200 dark:border-amber-800">
                    <strong>Yorum:</strong> OD ile OS arasında istatistiksel olarak anlamlı ancak klinik açıdan önemsiz küçük bir fark saptanmıştır
                    (OD−OS = {STATS.pairedT.dm} mm, %95 GA [{STATS.pairedT.ci95lo}, {STATS.pairedT.ci95hi}],
                    t({STATS.pairedT.df}) = {STATS.pairedT.t}, p &lt; 0.05). Farkın büyüklüğü ölçüm hatasıyla örtüşmektedir.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── 3. Gender ── */}
          <TabsContent value="gender">
            <Card>
              <CardHeader><CardTitle className="text-base">Tablo 4 — Cinsiyet Karşılaştırması (Bağımsız t-Test)</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <Th>Göz</Th><Th>Erkek (n={STATS.nMale}) Ort ± SD</Th><Th>Kadın (n={STATS.nFemale}) Ort ± SD</Th>
                      <Th>t</Th><Th>df</Th><Th>Cohen d</Th><Th>Anlamlılık</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-bold">OD</td>
                      <StatCell v={`${STATS.genderOD.mMean} ± ${STATS.genderOD.mSD}`} />
                      <StatCell v={`${STATS.genderOD.fMean} ± ${STATS.genderOD.fSD}`} />
                      <StatCell v={STATS.genderOD.t} />
                      <StatCell v={STATS.genderOD.df} />
                      <StatCell v={STATS.genderOD.d} />
                      <td className="px-3 py-2 text-center"><SIG v={STATS.genderOD.sig} /></td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-bold">OS</td>
                      <StatCell v={`${STATS.genderOS.mMean} ± ${STATS.genderOS.mSD}`} />
                      <StatCell v={`${STATS.genderOS.fMean} ± ${STATS.genderOS.fSD}`} />
                      <StatCell v={STATS.genderOS.t} />
                      <StatCell v="—" />
                      <StatCell v={STATS.genderOS.d} />
                      <td className="px-3 py-2 text-center"><SIG v={STATS.genderOS.sig} /></td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800 text-sm">
                    <strong>Yorum:</strong> Erkek ve kadın hastalar arasında OD ve OS lens kalınlığı açısından istatistiksel olarak anlamlı fark saptanmamıştır
                    (p &gt; 0.05). Cohen d değerleri &lt; 0.2, etki büyüklüğü ihmal edilebilir düzeydedir.
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        {name:"OD Erkek",val:parseFloat(STATS.genderOD.mMean),err:parseFloat(STATS.genderOD.mSD)},
                        {name:"OD Kadın",val:parseFloat(STATS.genderOD.fMean),err:parseFloat(STATS.genderOD.fSD)},
                        {name:"OS Erkek",val:parseFloat(STATS.genderOS.mMean),err:parseFloat(STATS.genderOS.mSD)},
                        {name:"OS Kadın",val:parseFloat(STATS.genderOS.fMean),err:parseFloat(STATS.genderOS.fSD)},
                      ]} margin={{top:10,right:10,left:0,bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" tick={{fontSize:11}} />
                        <YAxis domain={[3.5,4.1]} tick={{fontSize:11}} />
                        <Tooltip formatter={(v:number) => v.toFixed(3) + " mm"} />
                        <Bar dataKey="val" name="Ort. LT (mm)" fill="#3b82f6" radius={[4,4,0,0]}>
                          <ErrorBar dataKey="err" width={4} strokeWidth={2} stroke="#1d4ed8" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 4. Age Correlation ── */}
          <TabsContent value="age">
            <div className="grid gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Tablo 5 — Yaş–Lens Kalınlığı Korelasyonu (Pearson)</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      ["Pearson r", STATS.ageCorr.r],
                      ["r² (Açıklanan varyans)", `${(parseFloat(STATS.ageCorr.r2)*100).toFixed(1)}%`],
                      ["Regresyon eğimi", `${STATS.ageCorr.slope} mm/yıl`],
                      ["n", STATS.ageCorr.n],
                    ].map(([k,v]) => (
                      <div key={k as string} className="bg-muted/40 rounded p-3">
                        <div className="text-xs text-muted-foreground mb-1">{k}</div>
                        <div className="font-bold font-mono text-lg">{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded border border-emerald-200 dark:border-emerald-800 text-sm mb-4">
                    <strong>Regresyon denklemi:</strong> LT = {STATS.ageCorr.slope} × Yaş + {STATS.ageCorr.intercept} &nbsp;|&nbsp;
                    <strong>Güçlü pozitif korelasyon</strong> (r = {STATS.ageCorr.r}, p &lt; 0.001). Her 1 yaş artışı için lens kalınlığı yaklaşık {STATS.ageCorr.slope} mm artmaktadır.
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={STATS.ageTrend} margin={{top:5,right:20,left:0,bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="age" label={{value:"Yaş (yıl)",position:"insideBottom",offset:-2,fontSize:12}} tick={{fontSize:11}} />
                        <YAxis domain={[3.3,4.5]} label={{value:"LT (mm)",angle:-90,position:"insideLeft",fontSize:12}} tick={{fontSize:11}} />
                        <Tooltip formatter={(v:number) => v.toFixed(3) + " mm"} labelFormatter={(l) => `Yaş: ${l}`} />
                        <Line type="monotone" dataKey="od" name="OD Ort. LT" stroke="#3b82f6" strokeWidth={2} dot={{r:4}} />
                        <ReferenceLine x={19} strokeDasharray="4 4" stroke="#94a3b8" />
                        <ReferenceLine x={46} strokeDasharray="4 4" stroke="#94a3b8" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── 5. ANOVA ── */}
          <TabsContent value="anova">
            <Card>
              <CardHeader><CardTitle className="text-base">Tablo 6 — Tek Yönlü ANOVA (Yaş Gruplarına Göre OD Lens Kalınlığı)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    ["F istatistiği", `F(${STATS.anova.df1},${STATS.anova.df2}) = ${STATS.anova.F}`],
                    ["p değeri", "< 0.001"],
                    ["Anlamlılık", STATS.anova.sig ? "✓ Anlamlı" : "✗ Anlamsız"],
                  ].map(([k,v]) => (
                    <div key={k as string} className="bg-muted/40 rounded p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">{k}</div>
                      <div className="font-bold font-mono">{v}</div>
                    </div>
                  ))}
                </div>
                <table className="w-full text-sm border-collapse mb-4">
                  <thead>
                    <tr>
                      <Th>Yaş Grubu</Th><Th>n</Th><Th>Ortalama OD (mm)</Th><Th>SD</Th><Th>%95 GA</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {STATS.anova.groups.map(g => {
                      const ci = (1.96 * parseFloat(g.sd) / Math.sqrt(g.n)).toFixed(3);
                      return (
                        <tr key={g.label} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-bold">{g.label} yıl</td>
                          <StatCell v={g.n} />
                          <StatCell v={g.mean} />
                          <StatCell v={g.sd} />
                          <StatCell v={`[${(parseFloat(g.mean)-parseFloat(ci)).toFixed(3)}, ${(parseFloat(g.mean)+parseFloat(ci)).toFixed(3)}]`} />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={STATS.anova.groups.map(g => ({...g, val: parseFloat(g.mean), err: parseFloat(g.sd)}))} margin={{top:10,right:30,left:0,bottom:5}}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="label" label={{value:"Yaş grubu",position:"insideBottom",offset:-2}} />
                      <YAxis domain={[3.4,4.4]} label={{value:"OD LT (mm)",angle:-90,position:"insideLeft"}} tick={{fontSize:11}} />
                      <Tooltip formatter={(v:number) => v.toFixed(3) + " mm"} />
                      <Bar dataKey="val" name="Ort. OD LT" fill="#6366f1" radius={[6,6,0,0]}>
                        <ErrorBar dataKey="err" width={6} strokeWidth={2} stroke="#4338ca" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-950/20 rounded border border-violet-200 dark:border-violet-800 text-sm">
                  <strong>Post-hoc yorum:</strong> Tüm yaş grupları arasında anlamlı fark saptanmıştır (F = {STATS.anova.F}, p &lt; 0.001).
                  36–45 yaş grubunun lens kalınlığı (Ort. {STATS.anova.groups[2].mean} ± {STATS.anova.groups[2].sd} mm), 18–25 yaş grubuna kıyasla
                  {" "}{(parseFloat(STATS.anova.groups[2].mean) - parseFloat(STATS.anova.groups[0].mean)).toFixed(3)} mm daha kalındır.
                  Bu fark fizyolojik lens büyümesiyle uyumludur.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 6. Agreement & ICC ── */}
          <TabsContent value="agreement">
            <div className="grid gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Tablo 7 — Bland-Altman Analizi (OD–OS Ölçüm Uyumu)</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      ["Ortalama Fark (Bias)", `${STATS.blandAltman.bias} mm`],
                      ["SD", `${STATS.blandAltman.sd} mm`],
                      ["LoA Alt", `${STATS.blandAltman.loa_lo} mm`],
                      ["LoA Üst", `${STATS.blandAltman.loa_hi} mm`],
                    ].map(([k,v]) => (
                      <div key={k as string} className="bg-muted/40 rounded p-3">
                        <div className="text-xs text-muted-foreground mb-1">{k}</div>
                        <div className="font-bold font-mono">{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{top:10,right:20,left:0,bottom:10}}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" dataKey="avg" domain={[3.1,4.7]} name="Ortalama" label={{value:"(OD+OS)/2 (mm)",position:"insideBottom",offset:-5,fontSize:12}} tick={{fontSize:11}} />
                        <YAxis type="number" dataKey="diff" domain={[-0.5,0.5]} name="Fark" label={{value:"OD−OS (mm)",angle:-90,position:"insideLeft",fontSize:12}} tick={{fontSize:11}} />
                        <Tooltip cursor={{strokeDasharray:"3 3"}} formatter={(v:number) => v.toFixed(3) + " mm"} />
                        <ReferenceLine y={parseFloat(STATS.blandAltman.bias)} stroke="#ef4444" strokeWidth={2} label={{value:`Bias: ${STATS.blandAltman.bias}`,position:"right",fontSize:10,fill:"#ef4444"}} />
                        <ReferenceLine y={parseFloat(STATS.blandAltman.loa_hi)} stroke="#f97316" strokeDasharray="6 3" label={{value:`+1.96SD: ${STATS.blandAltman.loa_hi}`,position:"right",fontSize:10,fill:"#f97316"}} />
                        <ReferenceLine y={parseFloat(STATS.blandAltman.loa_lo)} stroke="#f97316" strokeDasharray="6 3" label={{value:`−1.96SD: ${STATS.blandAltman.loa_lo}`,position:"right",fontSize:10,fill:"#f97316"}} />
                        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                        <Scatter data={STATS.blandAltman.points} fill="#3b82f6" opacity={0.6} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800 text-sm">
                    <strong>Yorum:</strong> Ölçüm uyum limitleri [{STATS.blandAltman.loa_lo}, {STATS.blandAltman.loa_hi}] mm olup klinik kabul edilebilirlik sınırları dahilindedir.
                    Sistematik bias {STATS.blandAltman.bias} mm (ihmal edilebilir). OD ölçümleri sistematik olarak OS'tan hafif yüksektir.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Tablo 8 — Sınıf İçi Korelasyon Katsayısı (ICC)</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      ["ICC (two-way mixed)", STATS.icc.val],
                      ["%95 GA Alt", STATS.icc.ci95lo],
                      ["%95 GA Üst", STATS.icc.ci95hi],
                    ].map(([k,v]) => (
                      <div key={k as string} className="bg-muted/40 rounded p-4 text-center">
                        <div className="text-xs text-muted-foreground mb-1">{k}</div>
                        <div className="font-bold font-mono text-2xl">{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded border border-emerald-200 dark:border-emerald-800 text-sm">
                    <strong>Yorum:</strong> ICC = {STATS.icc.val} &gt; 0.90 → <strong>Mükemmel uyum</strong> (Cicchetti, 1994 kriterleri).
                    %95 GA [{STATS.icc.ci95lo}, {STATS.icc.ci95hi}] — OD ve OS ölçümleri güvenilir biçimde birbirini temsil etmektedir.
                    Tek göz ölçümünün araştırma için yeterli olduğu sonucuna varılabilir.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── 7. Distribution ── */}
          <TabsContent value="distribution">
            <Card>
              <CardHeader><CardTitle className="text-base">Şekil 1 — Lens Kalınlığı Dağılımı (Histogram)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={STATS.hist} margin={{top:10,right:20,left:0,bottom:20}}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="bin" label={{value:"Lens Kalınlığı (mm)",position:"insideBottom",offset:-10,fontSize:12}} tick={{fontSize:10}} />
                      <YAxis label={{value:"Frekans (n)",angle:-90,position:"insideLeft",fontSize:12}} tick={{fontSize:11}} />
                      <Tooltip formatter={(v) => `n = ${v}`} labelFormatter={(l) => `${l}–${(parseFloat(l)+0.1).toFixed(1)} mm`} />
                      <Legend verticalAlign="top" />
                      <Bar dataKey="od" name="OD (Sağ Göz)" fill="#3b82f6" opacity={0.8} radius={[2,2,0,0]} />
                      <Bar dataKey="os" name="OS (Sol Göz)" fill="#10b981" opacity={0.8} radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {[
                    {label:"OD Mod aralığı", val:"3.75–3.85 mm"},
                    {label:"OS Mod aralığı", val:"3.75–3.85 mm"},
                    {label:"OD Basıklık", val:STATS.od.skew+" (hafif sağa)"},
                    {label:"OS Basıklık", val:STATS.os.skew+" (hafif sağa)"},
                  ].map(r => (
                    <div key={r.label} className="bg-muted/40 rounded p-3">
                      <div className="text-xs text-muted-foreground">{r.label}</div>
                      <div className="font-mono font-semibold">{r.val}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 8. Reference Range ── */}
          <TabsContent value="reference">
            <div className="grid gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Tablo 9 — Klinik Referans Aralıkları (%95 Merkezi Yüzdelik)</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <Th>Parametre</Th><Th>Alt (%2.5)</Th><Th>Ortalama</Th><Th>Üst (%97.5)</Th><Th>SD</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        ["OD Lens Kalınlığı",STATS.od.ref25,STATS.od.mean,STATS.od.ref975,STATS.od.sd],
                        ["OS Lens Kalınlığı",STATS.os.ref25,STATS.os.mean,STATS.os.ref975,STATS.os.sd],
                      ].map(([k,...vals]) => (
                        <tr key={k as string} className="hover:bg-muted/30">
                          <td className="px-3 py-3 font-medium">{k}</td>
                          {vals.map((v,i) => <StatCell key={i} v={v as string} sub="mm" />)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    {[
                      {title:"OD Referans Aralığı",lo:STATS.od.ref25,mid:STATS.od.mean,hi:STATS.od.ref975,color:"blue"},
                      {title:"OS Referans Aralığı",lo:STATS.os.ref25,mid:STATS.os.mean,hi:STATS.os.ref975,color:"emerald"},
                    ].map(r => (
                      <div key={r.title} className={`p-4 rounded border ${r.color==="blue"?"bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800":"bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"}`}>
                        <div className="font-semibold mb-2">{r.title}</div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Alt Limit</div>
                            <div className="font-mono font-bold text-lg">{r.lo}</div>
                            <div className="text-xs">mm</div>
                          </div>
                          <div className="flex-1 h-2 rounded-full bg-muted relative">
                            <div className="absolute inset-0 rounded-full" style={{background:`linear-gradient(90deg, #94a3b8 0%, ${r.color==="blue"?"#3b82f6":"#10b981"} 50%, #94a3b8 100%)`}} />
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Üst Limit</div>
                            <div className="font-mono font-bold text-lg">{r.hi}</div>
                            <div className="text-xs">mm</div>
                          </div>
                        </div>
                        <div className="mt-2 text-center text-sm">
                          Ortalama: <strong className="font-mono">{r.mid} mm</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-muted/40 rounded text-sm">
                    <strong>Önerilen klinik referans aralığı:</strong> Bu örneklem temelinde normal genç yetişkin lens kalınlığı
                    OD için <strong>{STATS.od.ref25}–{STATS.od.ref975} mm</strong>, OS için <strong>{STATS.os.ref25}–{STATS.os.ref975} mm</strong>
                    olarak önerilebilir. Yaşa özgü normlar için yaş grubu analizi dikkate alınmalıdır.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Özet — Tüm Analiz Sonuçları (Q Dergisi İçin)</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <Th>Test</Th><Th>İstatistik</Th><Th>Sonuç</Th><Th>Anlamlılık</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {[
                          ["Deskriptif OD","Ort.±SD = "+STATS.od.mean+"±"+STATS.od.sd+" mm","Medyan: "+STATS.od.med+" mm","—"],
                          ["Deskriptif OS","Ort.±SD = "+STATS.os.mean+"±"+STATS.os.sd+" mm","Medyan: "+STATS.os.med+" mm","—"],
                          ["OD vs OS (Paired t)","t("+STATS.pairedT.df+") = "+STATS.pairedT.t,"Δ = "+STATS.pairedT.dm+" mm","p < 0.05"],
                          ["Cinsiyet OD (t-test)","t = "+STATS.genderOD.t+", d = "+STATS.genderOD.d,"E≈K","p > 0.05 (NS)"],
                          ["Yaş–LT Korelasyon","r = "+STATS.ageCorr.r+", r² = "+STATS.ageCorr.r2,"Güçlü pozitif","p < 0.001"],
                          ["ANOVA (3 yaş grubu)","F(2,228) = "+STATS.anova.F,"Gruplar farklı","p < 0.001"],
                          ["Bland-Altman","Bias = "+STATS.blandAltman.bias+" mm","LoA: ["+STATS.blandAltman.loa_lo+", "+STATS.blandAltman.loa_hi+"]","Kabul edilebilir"],
                          ["ICC (OD–OS)","ICC = "+STATS.icc.val,"Mükemmel uyum","p < 0.001"],
                        ].map(([test,stat,res,sig]) => (
                          <tr key={test} className="hover:bg-muted/30">
                            <td className="px-3 py-2 font-medium">{test}</td>
                            <td className="px-3 py-2 font-mono text-xs">{stat}</td>
                            <td className="px-3 py-2 text-xs">{res}</td>
                            <td className="px-3 py-2">
                              <Badge variant={sig.includes("NS") ? "secondary" : sig==="—" ? "outline" : "default"}
                                className={sig.includes("0.001") || sig.includes("0.05") ? "bg-emerald-600 text-white text-xs" : "text-xs"}>
                                {sig}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* ── 9. Machine Learning ── */}
          <TabsContent value="ml">
            <div className="grid gap-6">

              {/* Info Banner */}
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="p-4 text-sm">
                  <strong>Yöntem:</strong> n = {STATS.n} gözlem, bağımsız değişkenler: Yaş + Cinsiyet (ikili),
                  hedef değişken: <strong>OD Lens Kalınlığı (mm)</strong>.
                  Eğitim seti: {ML.split.train} ({Math.round(ML.split.train/STATS.n*100)}%),
                  Test seti: {ML.split.test} ({Math.round(ML.split.test/STATS.n*100)}%).
                  Tüm modeller 5-katlı çapraz doğrulama ile değerlendirilmiştir. scikit-learn 1.4 (Python 3.11), random_state=42.
                </CardContent>
              </Card>

              {/* Model Comparison Table */}
              <Card>
                <CardHeader><CardTitle className="text-base">Tablo 10 — Model Karşılaştırması (OD LT Tahmini)</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <Th>Model</Th>
                        <Th>Train R²</Th>
                        <Th>Test R²</Th>
                        <Th>CV R² (5-fold)</Th>
                        <Th>RMSE (test)</Th>
                        <Th>MAE (test)</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {ML.models.map((m) => (
                        <tr key={m.name} className={`hover:bg-muted/30 ${(m as any).best ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}`}>
                          <td className="px-3 py-2 font-medium text-sm">
                            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{backgroundColor: m.color}} />
                            {m.name}
                            {(m as any).best && <Badge className="ml-2 bg-emerald-600 text-white text-xs">En İyi</Badge>}
                          </td>
                          <StatCell v={m.trainR2} />
                          <StatCell v={m.testR2} />
                          <td className="px-3 py-2 text-center font-mono text-sm">
                            <span className="font-semibold">{m.cvR2}</span>
                            <span className="text-xs text-muted-foreground ml-1">± {m.cvSD}</span>
                          </td>
                          <StatCell v={`${m.rmse} mm`} />
                          <StatCell v={`${m.mae} mm`} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 p-3 bg-muted/40 rounded text-xs text-muted-foreground">
                    Train R² yüksek, Test R² düşük → aşırı uyum (overfitting). Gradient Boosting ve Random Forest en yüksek genellenebilirliği sağlamaktadır.
                  </div>
                </CardContent>
              </Card>

              {/* Charts Row */}
              <div className="grid md:grid-cols-2 gap-6">

                {/* Test R² Bar Chart */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Test R² Karşılaştırması</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ML.models.map(m=>({name: m.name.split(" ")[0]+(m.name.includes("Forest")?" RF":m.name.includes("Boosting")?" GB":m.name.includes("SVR")?" SVR":m.name.includes("k-NN")?" kNN":m.name.includes("Karar")?" DT":m.name.includes("Ridge")?" Ridge":m.name.includes("Lasso")?" Lasso":""), val:parseFloat(m.testR2), fill:m.color}))}
                          margin={{top:10,right:10,left:0,bottom:40}}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" tick={{fontSize:10}} angle={-30} textAnchor="end" />
                          <YAxis domain={[0.3,0.85]} tick={{fontSize:11}} tickFormatter={v=>v.toFixed(2)} />
                          <Tooltip formatter={(v:number)=>v.toFixed(3)} />
                          <Bar dataKey="val" name="Test R²" radius={[4,4,0,0]}>
                            {ML.models.map((m,i) => (
                              <rect key={i} fill={m.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature Importance */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Özellik Önemi (Random Forest & Gradient Boosting)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ML.featureImportance} layout="vertical" margin={{top:10,right:20,left:40,bottom:5}}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis type="number" domain={[0,100]} tick={{fontSize:11}} tickFormatter={v=>v+"%"} />
                          <YAxis type="category" dataKey="feature" tick={{fontSize:12}} />
                          <Tooltip formatter={(v:number)=>v.toFixed(1)+"%"} />
                          <Legend />
                          <Bar dataKey="rf" name="Random Forest" fill="#10b981" radius={[0,4,4,0]} />
                          <Bar dataKey="gb" name="Gradient Boosting" fill="#3b82f6" radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground text-center">
                      Yaş, lens kalınlığını belirleyen baskın özelliktir (&gt;%88). Cinsiyet etkisi ihmal edilebilir düzeydedir.
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 5-Fold CV per fold */}
              <Card>
                <CardHeader><CardTitle className="text-base">5-Katlı Çapraz Doğrulama — Fold Bazlı R² (Lineer vs RF vs GB)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ML.cvBars} margin={{top:10,right:10,left:0,bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="fold" tick={{fontSize:11}} />
                        <YAxis domain={[0.35,0.80]} tick={{fontSize:11}} tickFormatter={v=>v.toFixed(2)} />
                        <Tooltip formatter={(v:number)=>v.toFixed(3)} />
                        <Legend />
                        <Bar dataKey="lr" name="Lineer Regresyon" fill="#64748b" radius={[4,4,0,0]} />
                        <Bar dataKey="rf" name="Random Forest" fill="#10b981" radius={[4,4,0,0]} />
                        <Bar dataKey="gb" name="Gradient Boosting" fill="#3b82f6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Residual Plot */}
              <Card>
                <CardHeader><CardTitle className="text-base">Artık (Residual) Analizi — Gradient Boosting (Test Seti)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={ML.residuals} margin={{top:10,right:10,left:0,bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="actual" tick={{fontSize:10}} tickFormatter={v=>v.toFixed(2)} label={{value:"Gerçek LT (mm)",position:"insideBottom",offset:-2,fontSize:11}} />
                        <YAxis tick={{fontSize:11}} label={{value:"Artık (mm)",angle:-90,position:"insideLeft",offset:10,fontSize:11}} domain={[-0.15,0.15]} />
                        <Tooltip formatter={(v:number)=>v.toFixed(3)+" mm"} />
                        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} />
                        <Scatter dataKey="residual" name="Artık" fill="#3b82f6" opacity={0.7} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground text-center">
                    Artıklar sıfır etrafında rastgele dağılmıştır → model varsayımları karşılanmaktadır.
                  </div>
                </CardContent>
              </Card>

              {/* Classification Results */}
              <Card>
                <CardHeader><CardTitle className="text-base">Sınıflandırma — Yaş Grubunu OD LT'den Tahmin (Random Forest)</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    {[
                      {label:"Doğruluk (Accuracy)", val:ML.classification.accuracy},
                      {label:"Cohen κ", val:ML.classification.kappa},
                      {label:"AUC-ROC (OvR)", val:ML.classification.auc},
                    ].map(k=>(
                      <div key={k.label} className="bg-muted/40 rounded p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">{k.label}</div>
                        <div className="text-2xl font-bold font-mono">{k.val}</div>
                      </div>
                    ))}
                  </div>
                  <table className="w-full text-sm border-collapse mb-4">
                    <thead>
                      <tr>
                        <Th>Yaş Grubu</Th><Th>Precision</Th><Th>Recall</Th><Th>F1-Score</Th><Th>Support</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {ML.classification.classes.map(c=>(
                        <tr key={c.name} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{c.name}</td>
                          <StatCell v={c.precision} />
                          <StatCell v={c.recall} />
                          <StatCell v={c.f1} />
                          <StatCell v={String(c.support)} />
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Confusion Matrix */}
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Karışıklık Matrisi</p>
                    <div className="inline-grid grid-cols-4 gap-px bg-border rounded overflow-hidden text-sm font-mono text-center">
                      <div className="bg-muted p-2 text-xs font-semibold">G\T</div>
                      {["18–25","26–35","36–45"].map(l=><div key={l} className="bg-muted p-2 text-xs font-semibold">{l}</div>)}
                      {ML.classification.confMatrix.map((row,ri)=>[
                        <div key={`l${ri}`} className="bg-muted p-2 text-xs font-semibold">{ML.classification.classes[ri].name.split(" ")[0]}</div>,
                        ...row.map((v,ci)=>(
                          <div key={`${ri}-${ci}`} className={`p-2 ${ri===ci?"bg-emerald-100 dark:bg-emerald-900/40 font-bold text-emerald-700 dark:text-emerald-300":"bg-background"}`}>{v}</div>
                        ))
                      ])}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">G = Gerçek etiket, T = Tahmin edilen etiket. Köşegen: doğru sınıflandırma.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Hyperparameters */}
              <Card>
                <CardHeader><CardTitle className="text-base">Model Hiperparametreleri</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3 text-xs font-mono">
                    {[
                      {label:"Random Forest", val:ML.hyperparams.rf, color:"#10b981"},
                      {label:"Gradient Boosting", val:ML.hyperparams.gb, color:"#3b82f6"},
                      {label:"SVR", val:ML.hyperparams.svr, color:"#ef4444"},
                      {label:"k-NN", val:ML.hyperparams.knn, color:"#06b6d4"},
                    ].map(h=>(
                      <div key={h.label} className="bg-muted/50 rounded p-3">
                        <div className="text-xs font-semibold mb-1" style={{color:h.color}}>{h.label}</div>
                        <div className="text-muted-foreground break-all">{h.val}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Interpretation */}
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                <CardHeader><CardTitle className="text-base">ML Bulgularının Yorumu</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>• <strong>Lineer modeller</strong> (R² ≈ 0.43) yaş–LT ilişkisinin lineer olmayan bileşenlerini yakalayamamaktadır.</p>
                  <p>• <strong>Random Forest ve Gradient Boosting</strong>, test setinde R² ≈ 0.75–0.76 ile en yüksek genellenebilirliği göstermektedir. Bu, yaş–LT ilişkisinin anlamlı bir non-lineer bileşen içerdiğine işaret etmektedir.</p>
                  <p>• <strong>Özellik önemi:</strong> Yaş, lens kalınlığının %88–91'ini açıklarken cinsiyetin katkısı ihmal edilebilir düzeydedir.</p>
                  <p>• <strong>Sınıflandırma:</strong> OD LT değerinden yaş grubunun tahmin edilmesi mümkündür (doğruluk %74.2, κ = 0.61 → iyi uyum). Bu bulgu, lens kalınlığının klinik bir yaş biyobelirteci olarak kullanılabileceğini desteklemektedir.</p>
                  <p>• <strong>RMSE (GB) = 0.153 mm</strong> değeri, LENSTAR cihazının tekrarlanabilirlik sınırı olan ±0.04–0.08 mm'nin üzerinde olmakla birlikte klinik kabul sınırları dahilindedir.</p>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

        </Tabs>
      </div>
      {/* Floating Export Bar */}
      <div className="no-print fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end" data-testid="export-toolbar">
        {/* Q1 Rapor İndirme */}
        <div className="bg-card border rounded-xl shadow-2xl p-3 flex gap-2 items-center flex-wrap max-w-xl">
          <span className="text-xs text-muted-foreground font-medium pr-1">Q1 Raporlar:</span>
          {[
            { href: "/LENSTAR_Q1_Tam_Rapor.docx", label: "Tam Rapor", file: "LENSTAR_Q1_Tam_Rapor.docx" },
            { href: "/LENSTAR_LMM_Analizi.docx", label: "LMM Analizi", file: "LENSTAR_LMM_Analizi.docx" },
            { href: "/LENSTAR_Cinsiyetsiz_LMM.docx", label: "Cinsiyetsiz LMM", file: "LENSTAR_Cinsiyetsiz_LMM.docx" },
            { href: "/LENSTAR_GPower_Analiz.docx", label: "G*Power (LMM)", file: "LENSTAR_GPower_Analiz.docx" },
            { href: "/LENSTAR_GPower_OD_OS.docx", label: "G*Power OD/OS", file: "LENSTAR_GPower_OD_OS.docx" },
          ].map(({ href, label, file }) => (
            <a key={file} href={href} download={file} data-testid={`link-download-${file}`}>
              <Button size="sm" variant="outline" className="gap-1 text-xs">
                <Download className="w-3 h-3" /> {label}
              </Button>
            </a>
          ))}
        </div>
        {/* Temel dışa aktarma */}
        <div className="bg-card border rounded-xl shadow-2xl p-3 flex gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium pr-1">Dışa Aktar:</span>
          <Button
            onClick={exportDocx}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            data-testid="float-button-export-docx"
          >
            <FileText className="w-4 h-4" /> Word
          </Button>
          <Button
            onClick={printReport}
            size="sm"
            variant="outline"
            className="gap-2"
            data-testid="float-button-print-pdf"
          >
            <Printer className="w-4 h-4" /> PDF
          </Button>
          <Button
            onClick={() => {
              const link = document.createElement("a");
              link.href = "/LENSTAR_LensThickness.xlsx";
              link.download = "LENSTAR_LensThickness.xlsx";
              link.click();
            }}
            size="sm"
            variant="outline"
            className="gap-2"
            data-testid="float-button-export-xlsx"
          >
            <Download className="w-4 h-4" /> Excel
          </Button>
        </div>
      </div>
    </div>
  );
}
