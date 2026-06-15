import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart2, TrendingUp, Target, Award, Layers, Eye } from 'lucide-react';

const BACKBONES = {
  efficientnet: {
    name: 'EfficientNet V2-S',
    color: '#6366f1',
    model: {
      omurga: 'efficientnet_v2_s',
      embedding_dim: 128,
      num_persons: 21,
      best_epoch: 10,
      threshold: 0.71,
    },
    val: {
      loss: 0.2869, acc: 0.9757, sens: 0.925, spec: 0.9920,
      prec: 0.9737, f1: 0.9487, kappa: 0.9328, auc: 0.9949,
      far: 0.0080, frr: 0.075, eer: 0.0291,
      tp: 333, fp: 9, fn: 27, tn: 1111,
      top1: 0.7667, top3: 0.9083, macro_f1: 0.7730,
    },
    test: {
      loss: 0.2894, acc: 0.9629, sens: 0.8889, spec: 0.9866,
      prec: 0.9552, f1: 0.9209, kappa: 0.8966, auc: 0.9951,
      far: 0.0134, frr: 0.1111, eer: 0.0332,
      tp: 320, fp: 15, fn: 40, tn: 1106,
      top1: 0.8139, top3: 0.9222, macro_f1: 0.8166,
    },
  },
  mobilenet: {
    name: 'MobileNet V3-Large',
    color: '#22c55e',
    model: {
      omurga: 'mobilenet_v3_large',
      embedding_dim: 128,
      num_persons: 21,
      best_epoch: 20,
      threshold: 0.57,
    },
    val: {
      loss: 0.4125, acc: 0.9689, sens: 0.9361, spec: 0.9795,
      prec: 0.9361, f1: 0.9361, kappa: 0.9156, auc: 0.9925,
      far: 0.0205, frr: 0.0639, eer: 0.0423,
      tp: 337, fp: 23, fn: 23, tn: 1097,
      top1: 0.650, top3: 0.825, macro_f1: 0.6474,
    },
    test: {
      loss: 0.3585, acc: 0.9534, sens: 0.9083, spec: 0.9679,
      prec: 0.9008, f1: 0.9046, kappa: 0.8737, auc: 0.9907,
      far: 0.0321, frr: 0.0917, eer: 0.0504,
      tp: 327, fp: 36, fn: 33, tn: 1085,
      top1: 0.7222, top3: 0.925, macro_f1: 0.7268,
    },
  },
  resnet50: {
    name: 'ResNet-50',
    color: '#ef4444',
    model: {
      omurga: 'resnet50',
      embedding_dim: 128,
      num_persons: 21,
      best_epoch: 15,
      threshold: 0.30,
    },
    val: {
      loss: 0.3558, acc: 0.9736, sens: 0.9222, spec: 0.9902,
      prec: 0.9679, f1: 0.9445, kappa: 0.9273, auc: 0.9914,
      far: 0.0098, frr: 0.0778, eer: 0.0345,
      tp: 332, fp: 11, fn: 28, tn: 1109,
      top1: 0.7611, top3: 0.9139, macro_f1: 0.7690,
    },
    test: {
      loss: 0.3187, acc: 0.9730, sens: 0.9306, spec: 0.9866,
      prec: 0.9571, f1: 0.9437, kappa: 0.9259, auc: 0.9948,
      far: 0.0134, frr: 0.0694, eer: 0.0277,
      tp: 335, fp: 15, fn: 25, tn: 1106,
      top1: 0.775, top3: 0.8889, macro_f1: 0.7861,
    },
  },
};

type BackboneKey = keyof typeof BACKBONES;

const IMAGE_TYPES = [
  { key: 'cm_binary_test', label: 'Confusion Matrix (Binary Test)' },
  { key: 'cm_binary_validasyon', label: 'Confusion Matrix (Binary Val)' },
  { key: 'cm_forger_test', label: 'Confusion Matrix (Forger Test)' },
  { key: 'cm_forger_validasyon', label: 'Confusion Matrix (Forger Val)' },
  { key: 'egitim_egrileri', label: 'Eğitim Eğrileri' },
  { key: 'per_class_test', label: 'Sınıf Bazlı Doğruluk (Test)' },
  { key: 'per_class_validasyon', label: 'Sınıf Bazlı Doğruluk (Val)' },
  { key: 'roc_far_frr', label: 'ROC / FAR / FRR' },
];

function pct(v: number) { return `${(v * 100).toFixed(1)}%`; }
function f4(v: number) { return v.toFixed(4); }

function MetricCell({ val, best, fmt = pct }: { val: number; best: boolean; fmt?: (v: number) => string }) {
  return (
    <td className={`text-right px-3 py-2 font-mono text-sm ${best ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
      {fmt(val)}
      {best && <span className="ml-1 text-xs">★</span>}
    </td>
  );
}

function ConfusionMatrix({ tp, fp, fn, tn }: { tp: number; fp: number; fn: number; tn: number }) {
  const total = tp + fp + fn + tn;
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
        {cell(tp, 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', 'TP')}
        {cell(fn, 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', 'FN')}
      </div>
      <div className="grid grid-cols-3 gap-2 items-center">
        <div className="text-xs text-muted-foreground font-semibold text-right pr-2">Gerçek: Sahte</div>
        {cell(fp, 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', 'FP')}
        {cell(tn, 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', 'TN')}
      </div>
    </div>
  );
}

export default function SignatureTrainingResults() {
  const [activeBackbone, setActiveBackbone] = useState<BackboneKey>('resnet50');
  const [imageTab, setImageTab] = useState('cm_binary_test');
  const [splitView, setSplitView] = useState<'test' | 'val'>('test');

  const backboneKeys = Object.keys(BACKBONES) as BackboneKey[];
  const active = BACKBONES[activeBackbone];
  const metrics = splitView === 'test' ? active.test : active.val;

  const bestTest = {
    acc: Math.max(...backboneKeys.map(k => BACKBONES[k].test.acc)),
    sens: Math.max(...backboneKeys.map(k => BACKBONES[k].test.sens)),
    spec: Math.max(...backboneKeys.map(k => BACKBONES[k].test.spec)),
    f1: Math.max(...backboneKeys.map(k => BACKBONES[k].test.f1)),
    auc: Math.max(...backboneKeys.map(k => BACKBONES[k].test.auc)),
    kappa: Math.max(...backboneKeys.map(k => BACKBONES[k].test.kappa)),
    eer: Math.min(...backboneKeys.map(k => BACKBONES[k].test.eer)),
    macro_f1: Math.max(...backboneKeys.map(k => BACKBONES[k].test.macro_f1)),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Layers className="w-6 h-6 text-primary" />
            Siamese CNN — Eğitim Sonuçları
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Google Colab Eğitimi · 3 Backbone Karşılaştırması · Gerçek Veriler
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-600 gap-1">
            <Activity className="w-3 h-3" />
            Gerçek Eğitim Verileri
          </Badge>
          <Badge variant="outline">21 Kişi · 1481 Test Örneği</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4" />
            3 Backbone Karşılaştırma Tablosu — Test Seti Sonuçları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" data-testid="table-backbone-comparison">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="px-3 py-2 text-left text-xs font-semibold">Metrik</th>
                  {backboneKeys.map(k => (
                    <th key={k} className="px-3 py-2 text-right text-xs font-semibold">
                      {BACKBONES[k].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Accuracy', key: 'acc' as const, fmt: pct },
                  { label: 'Sensitivity (TPR)', key: 'sens' as const, fmt: pct },
                  { label: 'Specificity (TNR)', key: 'spec' as const, fmt: pct },
                  { label: 'Precision (PPV)', key: 'prec' as const, fmt: pct },
                  { label: 'F1 Score', key: 'f1' as const, fmt: pct },
                  { label: 'AUC-ROC', key: 'auc' as const, fmt: f4 },
                  { label: "Cohen's κ", key: 'kappa' as const, fmt: f4 },
                  { label: 'EER', key: 'eer' as const, fmt: pct },
                  { label: 'FAR', key: 'far' as const, fmt: pct },
                  { label: 'FRR', key: 'frr' as const, fmt: pct },
                  { label: 'Macro F1', key: 'macro_f1' as const, fmt: pct },
                  { label: 'Top-1 ID Acc', key: 'top1' as const, fmt: pct },
                  { label: 'Top-3 ID Acc', key: 'top3' as const, fmt: pct },
                ].map(({ label, key, fmt }, i) => {
                  const vals = backboneKeys.map(k => BACKBONES[k].test[key]);
                  const bestVal = key === 'eer' || key === 'far' || key === 'frr'
                    ? Math.min(...vals) : Math.max(...vals);
                  return (
                    <tr key={label} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="px-3 py-2 font-medium text-sm">{label}</td>
                      {backboneKeys.map(k => (
                        <MetricCell
                          key={k}
                          val={BACKBONES[k].test[key]}
                          best={BACKBONES[k].test[key] === bestVal}
                          fmt={fmt}
                        />
                      ))}
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-primary/30 bg-muted font-semibold">
                  <td className="px-3 py-2 text-sm">Best Epoch</td>
                  {backboneKeys.map(k => (
                    <td key={k} className="text-right px-3 py-2 font-mono text-sm">{BACKBONES[k].model.best_epoch}</td>
                  ))}
                </tr>
                <tr className="bg-muted font-semibold">
                  <td className="px-3 py-2 text-sm">Eşik (Threshold)</td>
                  {backboneKeys.map(k => (
                    <td key={k} className="text-right px-3 py-2 font-mono text-sm">{BACKBONES[k].model.threshold.toFixed(2)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            ★ = O metrikte en iyi backbone · Embedding dim = 128 · Contrastive Loss · 21 kişi writer-independent split
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Özet: En İyi Sonuçlar (Test Seti)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">En Yüksek Accuracy</div>
              <div className="text-2xl font-bold font-mono text-green-700 dark:text-green-300">{pct(bestTest.acc)}</div>
              <div className="text-xs text-muted-foreground">ResNet-50</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">En Yüksek AUC-ROC</div>
              <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300">{f4(bestTest.auc)}</div>
              <div className="text-xs text-muted-foreground">EfficientNet V2-S</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">En Düşük EER</div>
              <div className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-300">{pct(bestTest.eer)}</div>
              <div className="text-xs text-muted-foreground">ResNet-50</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
              <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">En Yüksek F1</div>
              <div className="text-2xl font-bold font-mono text-orange-700 dark:text-orange-300">{pct(bestTest.f1)}</div>
              <div className="text-xs text-muted-foreground">ResNet-50</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Backbone:</span>
        {backboneKeys.map(k => (
          <Button
            key={k}
            variant={activeBackbone === k ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveBackbone(k)}
            data-testid={`button-backbone-${k}`}
          >
            {BACKBONES[k].name}
          </Button>
        ))}
        <span className="ml-4 text-sm font-medium text-muted-foreground">Split:</span>
        <Button variant={splitView === 'test' ? 'default' : 'outline'} size="sm" onClick={() => setSplitView('test')}>Test</Button>
        <Button variant={splitView === 'val' ? 'default' : 'outline'} size="sm" onClick={() => setSplitView('val')}>Validation</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{active.name} — Confusion Matrix ({splitView === 'test' ? 'Test' : 'Val'})</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfusionMatrix tp={metrics.tp} fp={metrics.fp} fn={metrics.fn} tn={metrics.tn} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{active.name} — Performans Metrikleri ({splitView === 'test' ? 'Test' : 'Val'})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Accuracy', value: pct(metrics.acc) },
                { label: 'Sensitivity', value: pct(metrics.sens) },
                { label: 'Specificity', value: pct(metrics.spec) },
                { label: 'Precision', value: pct(metrics.prec) },
                { label: 'F1 Score', value: pct(metrics.f1) },
                { label: 'AUC-ROC', value: f4(metrics.auc) },
                { label: "Cohen's κ", value: f4(metrics.kappa) },
                { label: 'EER', value: pct(metrics.eer) },
                { label: 'FAR', value: pct(metrics.far) },
                { label: 'FRR', value: pct(metrics.frr) },
                { label: 'Loss', value: metrics.loss.toFixed(4) },
                { label: 'Top-1 ID', value: pct(metrics.top1) },
              ].map(m => (
                <div key={m.label} className="bg-muted/40 border border-border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="text-lg font-bold font-mono">{m.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Eğitim Grafikleri — {active.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={imageTab} onValueChange={setImageTab}>
            <TabsList className="flex flex-wrap gap-1 h-auto">
              {IMAGE_TYPES.map(t => (
                <TabsTrigger key={t.key} value={t.key} className="text-xs">{t.label}</TabsTrigger>
              ))}
            </TabsList>
            {IMAGE_TYPES.map(t => (
              <TabsContent key={t.key} value={t.key} className="mt-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-border">
                  <img
                    src={`/training_results/${activeBackbone === 'efficientnet' ? 'efficientnet' : activeBackbone}_${t.key}.png`}
                    alt={`${active.name} - ${t.label}`}
                    className="w-full h-auto rounded-lg"
                    data-testid={`img-${activeBackbone}-${t.key}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">{active.name} — {t.label}</p>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            VGG16 Referans Modeli (Keras/TensorFlow)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-border">
              <img src="/training_results/vgg16_confusion_matrix.png" alt="VGG16 Confusion Matrix" className="w-full h-auto rounded-lg" />
              <p className="text-xs text-muted-foreground mt-2 text-center">VGG16 — Confusion Matrix</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-border">
              <img src="/training_results/vgg16_egitim_grafikleri.png" alt="VGG16 Eğitim Grafikleri" className="w-full h-auto rounded-lg" />
              <p className="text-xs text-muted-foreground mt-2 text-center">VGG16 — Eğitim Grafikleri (Loss & Accuracy)</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            VGG16 modeli Keras/TensorFlow ile eğitilmiş referans modeldir. Siamese CNN backbone karşılaştırması PyTorch (EfficientNet, MobileNet, ResNet50) ile yapılmıştır.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Ön-İşleme & Analiz Görselleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { file: 'analysis_on_isleme_karsilastirma', label: 'Ön-İşleme Karşılaştırma' },
              { file: 'analysis_egitim_grafigi', label: 'Eğitim Grafiği' },
              { file: 'analysis_egitim2_grafigi', label: 'Eğitim 2 Grafiği' },
              { file: 'analysis_ham_analiz', label: 'Ham Analiz' },
              { file: 'analysis_test_sonuclari', label: 'Test Sonuçları' },
              { file: 'analysis_test2_sonuclari', label: 'Test 2 Sonuçları' },
              { file: 'analysis_taklit_analiz', label: 'Taklit Analiz' },
              { file: 'analysis_test_islenmis', label: 'Test İşlenmiş' },
            ].map(img => (
              <div key={img.file} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-border">
                <img
                  src={`/training_results/${img.file}.png`}
                  alt={img.label}
                  className="w-full h-auto rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">{img.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Veri Seti Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted/40 border border-border rounded-xl p-4">
              <div className="text-xs text-muted-foreground">Katılımcı Sayısı</div>
              <div className="text-2xl font-bold font-mono">21</div>
            </div>
            <div className="bg-muted/40 border border-border rounded-xl p-4">
              <div className="text-xs text-muted-foreground">Toplam Test Örneği</div>
              <div className="text-2xl font-bold font-mono">1,481</div>
              <div className="text-xs text-muted-foreground">360 genuine + 1121 impostor</div>
            </div>
            <div className="bg-muted/40 border border-border rounded-xl p-4">
              <div className="text-xs text-muted-foreground">Toplam Val Örneği</div>
              <div className="text-2xl font-bold font-mono">1,480</div>
              <div className="text-xs text-muted-foreground">360 genuine + 1120 impostor</div>
            </div>
            <div className="bg-muted/40 border border-border rounded-xl p-4">
              <div className="text-xs text-muted-foreground">Giriş Boyutu</div>
              <div className="text-2xl font-bold font-mono">224×224</div>
              <div className="text-xs text-muted-foreground">RGB, normalized</div>
            </div>
          </div>
          <div className="bg-muted/40 rounded-xl p-4 text-sm space-y-1 text-muted-foreground">
            <div><strong>Eğitim Ortamı:</strong> Google Colab (GPU: T4/A100)</div>
            <div><strong>Framework:</strong> PyTorch (Siamese CNN backbone karşılaştırma) + Keras/TF (VGG16 referans)</div>
            <div><strong>Loss:</strong> Contrastive Loss (margin=1.0)</div>
            <div><strong>Optimizer:</strong> Adam, lr=1e-4</div>
            <div><strong>Split:</strong> Writer-independent (train/val/test: kişi bazlı ayrım, veri sızması yok)</div>
            <div><strong>Fine-tune:</strong> Son 20 katman serbest, 512→BN→Dropout(0.4)→256→L2 normalize embedding</div>
            <div><strong>Şekil Türleri:</strong> İmza, Paraf, W, Ş, İ, O, α (7 tür)</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4 text-xs text-muted-foreground space-y-1">
          <div className="font-semibold text-foreground mb-2">Sonuç</div>
          <div>
            <strong>ResNet-50</strong> test setinde en yüksek accuracy (%97.3), en düşük EER (%2.8) ve en yüksek F1 (%94.4) ile genel kazanan.
            <strong> EfficientNet V2-S</strong> en yüksek AUC-ROC (0.9951) ve en iyi top-1 identification accuracy (%81.4).
            <strong> MobileNet V3-Large</strong> en yüksek sensitivity (%90.8) ve en hızlı inference.
          </div>
          <div className="mt-2">Tüm modeller AUC &gt; 0.99 ile mükemmel ayırt edicilik göstermektedir.</div>
        </CardContent>
      </Card>
    </div>
  );
}
