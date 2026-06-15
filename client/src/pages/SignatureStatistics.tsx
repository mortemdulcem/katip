import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, BarChart2, Activity, Target, Info, Download, FileText } from 'lucide-react';

// ─── Renkler ─────────────────────────────────────────────────────────────────
const COLOR_GENUINE = '#22c55e';
const COLOR_FORGED  = '#ef4444';
const COLOR_NEUTRAL = '#6366f1';

// ─── Metrik kutusu ───────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color = 'text-foreground', tooltip }:
  { label: string; value: string; sub?: string; color?: string; tooltip?: string }) {
  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col gap-1" title={tooltip}>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ─── Confusion matrix ────────────────────────────────────────────────────────
function ConfusionMatrix({ TP, FP, FN, TN }: { TP: number; FP: number; FN: number; TN: number }) {
  const total = TP + FP + FN + TN || 1;
  const cell = (val: number, bg: string, label: string) => (
    <div className={`${bg} rounded-lg p-3 flex flex-col items-center justify-center gap-1`}>
      <div className="text-xl font-bold font-mono">{val}</div>
      <div className="text-xs opacity-75">{(val / total * 100).toFixed(1)}%</div>
      <div className="text-[10px] font-medium opacity-60">{label}</div>
    </div>
  );
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1 text-xs text-center text-muted-foreground">
        <div />
        <div className="font-semibold text-green-600 dark:text-green-400">Tahmin: Gerçek</div>
        <div className="font-semibold text-red-500">Tahmin: Sahte</div>
      </div>
      <div className="grid grid-cols-3 gap-2 items-center">
        <div className="text-xs text-muted-foreground font-semibold text-right pr-2">Gerçek: Gerçek</div>
        {cell(TP, 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', 'TP')}
        {cell(FN, 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', 'FN (Miss)')}
      </div>
      <div className="grid grid-cols-3 gap-2 items-center">
        <div className="text-xs text-muted-foreground font-semibold text-right pr-2">Gerçek: Sahte</div>
        {cell(FP, 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', 'FP (FA)')}
        {cell(TN, 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', 'TN')}
      </div>
    </div>
  );
}

// ─── ROC eğrisi (her 5. nokta) ───────────────────────────────────────────────
function RocCurve({ data }: { data: { fpr: number; tpr: number }[] }) {
  const sampled = data.filter((_, i) => i % 2 === 0).map(d => ({
    fpr: +d.fpr.toFixed(3), tpr: +d.tpr.toFixed(3)
  }));
  const diagonal = [{ fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="fpr" type="number" domain={[0, 1]} tickCount={6} label={{ value: '1 - Özgüllük (FPR)', position: 'insideBottom', offset: -10, fontSize: 11 }} />
        <YAxis dataKey="tpr" type="number" domain={[0, 1]} tickCount={6} label={{ value: 'Duyarlılık (TPR)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }} />
        <Tooltip formatter={(v: number) => v.toFixed(3)} labelFormatter={(v) => `FPR: ${(+v).toFixed(3)}`} />
        <Line data={diagonal} type="linear" dataKey="tpr" stroke="#94a3b8" strokeDasharray="4 4" dot={false} name="Şans Çizgisi" strokeWidth={1} />
        <Line data={sampled} type="monotone" dataKey="tpr" stroke={COLOR_NEUTRAL} dot={false} name="ROC" strokeWidth={2.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Histogram ───────────────────────────────────────────────────────────────
function ScoreHistogram({ genuine, forged }: { genuine: { bin: string; count: number }[]; forged: { bin: string; count: number }[] }) {
  const merged = genuine.map((g, i) => ({
    bin: g.bin, genuine: g.count, forged: forged[i]?.count ?? 0
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={merged} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="bin" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="genuine" name="Gerçek" fill={COLOR_GENUINE} opacity={0.85} />
        <Bar dataKey="forged"  name="Sahte"  fill={COLOR_FORGED}  opacity={0.85} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Şekil bazlı doğruluk ────────────────────────────────────────────────────
function ShapeAccuracyChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
        <ReferenceLine y={0.8} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '%80', fontSize: 10 }} />
        <Bar dataKey="accuracy" name="Doğruluk" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.accuracy >= 0.8 ? COLOR_GENUINE : d.accuracy >= 0.65 ? '#f59e0b' : COLOR_FORGED} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Ana sayfa ────────────────────────────────────────────────────────────────
export default function SignatureStatistics() {

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['/api/signature/statistics'],
  });

  const { data: dsData } = useQuery<any>({
    queryKey: ['/api/signature/dataset-stats'],
  });

  const downloadWord = () => {
    // Direkt URL yönlendirmesi — iframe/tarayıcı uyumlu en güvenilir yöntem
    window.open('/api/signature/export-word', '_blank');
  };

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-4 gap-3">{Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (error) return (
    <div className="p-6 flex items-center gap-3 text-destructive">
      <AlertCircle className="w-5 h-5" /> Veri yüklenemedi.
    </div>
  );

  const m = data?.metrics;
  const sim = data?.mode === 'simulation';

  const metricRows = [
    { key: 'Doğruluk (Accuracy)',         val: m?.accuracy,    fmt: (v:number) => `${(v*100).toFixed(1)}%`, tooltip: 'Doğru sınıflanan toplam örnek oranı' },
    { key: 'Duyarlılık (Sensitivity)',     val: m?.sensitivity, fmt: (v:number) => `${(v*100).toFixed(1)}%`, tooltip: 'Gerçek imzaları yakalama oranı (TP Rate)' },
    { key: 'Özgüllük (Specificity)',       val: m?.specificity, fmt: (v:number) => `${(v*100).toFixed(1)}%`, tooltip: 'Sahte imzaları reddetme oranı (TN Rate)' },
    { key: 'Poz. Tahmin Değeri (PPV)',     val: m?.ppv,         fmt: (v:number) => `${(v*100).toFixed(1)}%`, tooltip: 'Gerçek denen örneklerin gerçekten gerçek olma oranı' },
    { key: 'Neg. Tahmin Değeri (NPV)',     val: m?.npv,         fmt: (v:number) => `${(v*100).toFixed(1)}%`, tooltip: 'Sahte denen örneklerin gerçekten sahte olma oranı' },
    { key: 'F1 Skoru',                     val: m?.f1,          fmt: (v:number) => `${(v*100).toFixed(1)}%`, tooltip: 'Duyarlılık ve PPV harmonik ortalaması' },
    { key: 'AUC-ROC',                      val: m?.auc,         fmt: (v:number) => v.toFixed(4),              tooltip: 'ROC eğrisi altındaki alan (1=mükemmel, 0.5=şans)' },
    { key: "Cohen's Kappa (κ)",            val: m?.kappa,       fmt: (v:number) => v.toFixed(4),              tooltip: 'Şansın ötesindeki uyum; >0.60 iyi, >0.80 çok iyi' },
  ];

  const aucColor = m?.auc >= 0.9 ? 'text-green-600 dark:text-green-400' : m?.auc >= 0.7 ? 'text-yellow-600' : 'text-red-500';
  const kappaInterp = m?.kappa >= 0.8 ? 'Çok İyi (≥0.80)' : m?.kappa >= 0.6 ? 'İyi (0.60–0.80)' : m?.kappa >= 0.4 ? 'Orta' : 'Zayıf';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* Başlık */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            İstatistiksel Analiz
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            GPT-4o Vision — İmza/Paraf Doğruluğu · Adli Grafoloji Çalışması (n=20)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {sim && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-500 gap-1">
              <Info className="w-3 h-3" />
              Simülasyon Modu
            </Badge>
          )}
          {!sim && (
            <Badge className="bg-green-600 gap-1">
              <Activity className="w-3 h-3" />
              Gerçek Veri ({data?.sampleSize?.total})
            </Badge>
          )}
          <Button
            onClick={downloadWord}
            variant="default"
            className="gap-2"
            data-testid="button-download-word"
          >
            <FileText className="w-4 h-4" />
            Word Raporu İndir
          </Button>
        </div>
      </div>

      {/* P004 Gerçek Veri Seti İstatistikleri */}
      {dsData?.rows?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-4 h-4" />
              Mevcut Veri Seti — Piksel İstatistikleri (Gerçek Görüntüler)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    {['Katılımcı', 'Şekil', 'n', 'Ort. Yoğunluk', 'SD', 'CV (%)', 'Mürekkep %', 'Mürekkep SD'].map(h => (
                      <th key={h} className="px-3 py-2 text-center text-xs font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dsData.rows.map((r: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="px-3 py-1.5 text-center font-mono text-xs">{r.participant}</td>
                      <td className="px-3 py-1.5 text-center font-semibold">{r.shapeLabel}</td>
                      <td className="px-3 py-1.5 text-center">{r.n}</td>
                      <td className="px-3 py-1.5 text-center font-mono">{r.meanIntensity.mean}</td>
                      <td className="px-3 py-1.5 text-center font-mono">±{r.meanIntensity.std}</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`font-mono ${r.stdIntensity.mean / r.meanIntensity.mean * 100 < 10 ? 'text-green-600' : r.stdIntensity.mean / r.meanIntensity.mean * 100 < 20 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {(r.stdIntensity.mean / r.meanIntensity.mean * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-center font-mono">{r.nonWhitePct.mean}%</td>
                      <td className="px-3 py-1.5 text-center font-mono text-muted-foreground">±{r.nonWhitePct.std}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold border-t">
                    <td className="px-3 py-2 text-center text-xs" colSpan={2}>TOPLAM</td>
                    <td className="px-3 py-2 text-center">{dsData.rows.reduce((a: number, r: any) => a + r.n, 0)}</td>
                    <td colSpan={5} className="px-3 py-2 text-center text-xs text-muted-foreground">
                      {dsData.participants?.length} katılımcı · {dsData.shapeCount} şekil türü · 512×512 px PNG
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              <strong>Ort. Yoğunluk:</strong> 0=siyah, 255=beyaz · <strong>Mürekkep %:</strong> &lt;240 eşikaltı piksel · <strong>CV:</strong> Varyasyon katsayısı (düşük=tutarlı)
            </p>
          </CardContent>
        </Card>
      )}

      {sim && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4 text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Not:</strong> {data?.note}
        </div>
      )}

      {/* Örnek sayısı */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Toplam Karşılaştırma" value={data?.sampleSize?.total?.toString() ?? '—'} sub="n" />
        <MetricCard label="Gerçek (Genuine)" value={data?.sampleSize?.genuine?.toString() ?? '—'} color="text-green-600 dark:text-green-400" sub="aynı kişi çifti" />
        <MetricCard label="Sahte (Forged)" value={data?.sampleSize?.forged?.toString() ?? '—'} color="text-red-500" sub="farklı kişi çifti" />
      </div>

      {/* Tanımlayıcı istatistikler */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart2 className="w-4 h-4" />Tanımlayıcı İstatistikler — Benzerlik Skoru (/100)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-descriptive">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4">Grup</th>
                  <th className="text-right px-3">n</th>
                  <th className="text-right px-3">Ort ± SS</th>
                  <th className="text-right px-3">Medyan</th>
                  <th className="text-right px-3">IQR</th>
                  <th className="text-right px-3">Min</th>
                  <th className="text-right px-3">Maks</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Gerçek (Genuine)', d: data?.descriptive?.genuine, cls: 'text-green-600 dark:text-green-400', n: data?.sampleSize?.genuine },
                  { label: 'Sahte (Forged)',   d: data?.descriptive?.forged,  cls: 'text-red-500', n: data?.sampleSize?.forged },
                ].map(({ label, d, cls, n }) => (
                  <tr key={label} className="border-b last:border-0">
                    <td className={`py-2 pr-4 font-medium ${cls}`}>{label}</td>
                    <td className="text-right px-3 font-mono">{n}</td>
                    <td className="text-right px-3 font-mono">{d?.mean} ± {d?.std}</td>
                    <td className="text-right px-3 font-mono">{d?.median}</td>
                    <td className="text-right px-3 font-mono">{d?.iqr}</td>
                    <td className="text-right px-3 font-mono">{d?.min}</td>
                    <td className="text-right px-3 font-mono">{d?.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Skor dağılımı */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart2 className="w-4 h-4" />Benzerlik Skoru Dağılımı — Gerçek vs Sahte</CardTitle></CardHeader>
        <CardContent>
          {data?.histogram && <ScoreHistogram genuine={data.histogram.genuine} forged={data.histogram.forged} />}
          <p className="text-xs text-muted-foreground mt-2 text-center">Benzerlik skoru (0–100), 10 birimlik aralıklarda</p>
        </CardContent>
      </Card>

      {/* Sınıflandırma metrikleri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Sınıflandırma Performans Metrikleri
            <span className="text-xs text-muted-foreground font-normal ml-1">(Eşik = {m?.threshold})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {metricRows.map(({ key, val, fmt, tooltip }) => (
              <MetricCard
                key={key}
                label={key}
                value={val !== undefined ? fmt(val) : '—'}
                color={key.includes('AUC') ? aucColor : undefined}
                tooltip={tooltip}
              />
            ))}
          </div>

          {/* Yorum kutusu */}
          <div className="bg-muted/40 rounded-xl p-4 text-sm space-y-1">
            <div className="font-semibold mb-2">Kappa Yorumu: <span className="text-primary">{kappaInterp}</span></div>
            <div className="text-muted-foreground">
              AUC = <strong>{m?.auc?.toFixed(4)}</strong>
              {m?.auc >= 0.9 ? ' — Mükemmel ayırt edicilik' : m?.auc >= 0.8 ? ' — İyi ayırt edicilik' : m?.auc >= 0.7 ? ' — Kabul edilebilir' : ' — Zayıf'}
              {' | '}
              Cohen κ = <strong>{m?.kappa?.toFixed(4)}</strong>
              {' | '}
              F1 = <strong>{m?.f1 !== undefined ? `${(m.f1*100).toFixed(1)}%` : '—'}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confusion matrix + ROC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Karışıklık Matrisi (Confusion Matrix)</CardTitle></CardHeader>
          <CardContent>
            {data?.confusionMatrix && (
              <ConfusionMatrix {...data.confusionMatrix} />
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div><span className="font-semibold text-green-600">TP</span> = Gerçeği doğru tanıma</div>
              <div><span className="font-semibold text-red-500">FP</span> = Sahteyken gerçek deme (False Alarm)</div>
              <div><span className="font-semibold text-orange-500">FN</span> = Gerçekken sahte deme (Miss)</div>
              <div><span className="font-semibold text-green-600">TN</span> = Sahteyii doğru tanıma</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" />ROC Eğrisi (AUC = {m?.auc?.toFixed(4)})</CardTitle></CardHeader>
          <CardContent>
            {data?.rocCurve && <RocCurve data={data.rocCurve} />}
          </CardContent>
        </Card>
      </div>

      {/* Şekil bazlı analiz */}
      <Card>
        <CardHeader><CardTitle className="text-base">Şekil Bazlı Sınıflandırma Doğruluğu</CardTitle></CardHeader>
        <CardContent>
          {data?.byShape && <ShapeAccuracyChart data={data.byShape} />}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-byshape">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4">Şekil</th>
                  <th className="text-right px-3">n</th>
                  <th className="text-right px-3">Doğruluk</th>
                  <th className="text-right px-3">Ort. Gerçek Skoru</th>
                  <th className="text-right px-3">Ort. Sahte Skoru</th>
                  <th className="text-right px-3">Ayrımcılık (Δ)</th>
                </tr>
              </thead>
              <tbody>
                {data?.byShape?.map((row: any) => (
                  <tr key={row.shape} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-semibold font-mono">{row.label}</td>
                    <td className="text-right px-3">{row.n}</td>
                    <td className={`text-right px-3 font-mono font-bold ${row.accuracy >= 0.8 ? 'text-green-600 dark:text-green-400' : row.accuracy >= 0.65 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {(row.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="text-right px-3 font-mono text-green-600 dark:text-green-400">{row.meanGenuineScore}</td>
                    <td className="text-right px-3 font-mono text-red-500">{row.meanForgedScore}</td>
                    <td className="text-right px-3 font-mono font-bold">
                      {(row.meanGenuineScore - row.meanForgedScore).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Ayrımcılık (Δ): Gerçek ve sahte grupları arasındaki ortalama skor farkı. Büyük Δ = güçlü ayrıştırıcı şekil.</p>
        </CardContent>
      </Card>

      {/* Referans kutusu */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4 text-xs text-muted-foreground space-y-1">
          <div className="font-semibold text-foreground mb-2">Kaynak Bilgisi</div>
          <div>Model: GPT-4o Vision (OpenAI, 2024) — İki görüntüyü zincir-of-düşünce ile karşılaştırma</div>
          <div>Eşik değeri: ≥{m?.threshold} → Gerçek (genuine), &lt;{m?.threshold} → Sahte (forged)</div>
          <div>İstatistiksel yöntem: İkili sınıflandırma · Trapezoidal ROC-AUC · Cohen κ · Karışıklık matrisi</div>
          <div>Referans: Abdirahma et al. (2024); Gideon et al. (2018); Kao &amp; Wen (2020)</div>
        </CardContent>
      </Card>
    </div>
  );
}
