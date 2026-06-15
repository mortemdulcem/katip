import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'wouter';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, CheckCircle, XCircle, AlertTriangle, Cpu, Layers, ArrowRight, RefreshCw, Download, Pen, Upload, Play, Trash2, RotateCcw } from 'lucide-react';

interface SampleOption { id: number; participantCode: string; shapeType: string; repNumber: number; imageData: string; }

function cosineSimilarity(a: tf.Tensor, b: tf.Tensor): number {
  return tf.tidy(() => {
    const norm = (t: tf.Tensor) => t.div(tf.norm(t).add(1e-8));
    const dot = tf.sum(tf.mul(norm(a), norm(b)));
    return dot.dataSync()[0];
  });
}

function base64ToImage(b64: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
  });
}

function ArchDiagram() {
  const boxes = [
    { label: 'Goruntu 1\n512x512', color: 'bg-blue-100 dark:bg-blue-900/40 border-blue-400' },
    { label: 'MobileNet\nCNN', color: 'bg-purple-100 dark:bg-purple-900/40 border-purple-400' },
    { label: 'Embedding\n1280-dim', color: 'bg-violet-100 dark:bg-violet-900/40 border-violet-400' },
  ];
  const boxes2 = [
    { label: 'Goruntu 2\n512x512', color: 'bg-orange-100 dark:bg-orange-900/40 border-orange-400' },
    { label: 'MobileNet\n(Agirliklar\npaylasiliyor)', color: 'bg-purple-100 dark:bg-purple-900/40 border-purple-400' },
    { label: 'Embedding\n1280-dim', color: 'bg-violet-100 dark:bg-violet-900/40 border-violet-400' },
  ];
  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col gap-2 items-center min-w-[560px]">
        <div className="flex items-center gap-2">
          {boxes.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`${b.color} border-2 rounded-lg px-3 py-2 text-xs font-mono text-center whitespace-pre-line`}>{b.label}</div>
              {i < boxes.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="bg-yellow-100 dark:bg-yellow-900/40 border-2 border-yellow-400 rounded-lg px-3 py-2 text-xs font-mono text-center whitespace-pre-line">{'Cosine\nSimilarity'}</div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="bg-green-100 dark:bg-green-900/40 border-2 border-green-400 rounded-lg px-3 py-2 text-xs font-mono text-center whitespace-pre-line">{'Karar\n(0-1)'}</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
          <div className="w-20 text-center">— Siamese —</div>
        </div>
        <div className="flex items-center gap-2">
          {boxes2.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`${b.color} border-2 rounded-lg px-3 py-2 text-xs font-mono text-center whitespace-pre-line`}>{b.label}</div>
              {i < boxes2.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SamplePicker({ label, samples, onSelect }: { label: string; samples: SampleOption[]; onSelect: (s: SampleOption | null) => void }) {
  const [selected, setSelected] = useState<SampleOption | null>(null);
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{label}</div>
      <Select onValueChange={v => {
        const s = samples.find(x => x.id === +v) ?? null;
        setSelected(s); onSelect(s);
      }}>
        <SelectTrigger data-testid={`select-${label.toLowerCase().replace(' ', '-')}`}>
          <SelectValue placeholder="Ornek sec..." />
        </SelectTrigger>
        <SelectContent>
          {samples.map(s => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.participantCode} - {s.shapeType} - #{s.repNumber}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <img
          src={selected.imageData.startsWith('data:') ? selected.imageData : `data:image/png;base64,${selected.imageData}`}
          alt={`${selected.shapeType} ornegi`}
          className="w-full max-h-36 object-contain border rounded-lg bg-white"
        />
      )}
    </div>
  );
}

function DrawCanvas({ onCapture, label }: { onCapture: (dataUrl: string) => void; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scale = 256 / rect.width;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scale, y: (e.touches[0].clientY - rect.top) * scale };
    }
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !lastPos.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = () => {
    isDrawing.current = false;
    lastPos.current = null;
    if (canvasRef.current) onCapture(canvasRef.current.toDataURL('image/png'));
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    onCapture('');
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold flex items-center gap-2">
        <Pen className="w-3 h-3" /> {label}
      </div>
      <canvas
        ref={canvasRef}
        width={256}
        height={256}
        className="border-2 border-dashed border-primary/30 rounded-lg cursor-crosshair bg-white w-full max-w-[256px] aspect-square touch-none"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
        data-testid={`canvas-draw-${label.toLowerCase().replace(/\s/g,'-')}`}
      />
      <Button variant="outline" size="sm" onClick={clearCanvas} data-testid={`button-clear-${label.toLowerCase().replace(/\s/g,'-')}`}>
        <Trash2 className="w-3 h-3 mr-1" /> Temizle
      </Button>
    </div>
  );
}

function FileUploader({ onUpload, label }: { onUpload: (dataUrl: string) => void; label: string }) {
  const [preview, setPreview] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [sizeError, setSizeError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSizeError('');
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setSizeError('Sadece PNG, JPG veya WebP dosyalari kabul edilir.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSizeError('Dosya boyutu 5 MB\'dan kucuk olmali.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      onUpload(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold flex items-center gap-2">
        <Upload className="w-3 h-3" /> {label}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors max-w-[256px] aspect-square flex items-center justify-center"
        data-testid={`upload-${label.toLowerCase().replace(/\s/g,'-')}`}
      >
        {preview ? (
          <img src={preview} alt="Yuklenen" className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-muted-foreground text-sm">
            <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
            PNG / JPG yukle
          </div>
        )}
      </div>
      {sizeError && <div className="text-xs text-red-500">{sizeError}</div>}
      {preview && (
        <Button variant="outline" size="sm" onClick={() => { setPreview(''); onUpload(''); setSizeError(''); if(inputRef.current) inputRef.current.value=''; }}>
          <Trash2 className="w-3 h-3 mr-1" /> Kaldir
        </Button>
      )}
    </div>
  );
}

const DEMO_SCENARIOS = [
  {
    id: 'genuine',
    title: 'Gercek Cift (Genuine Pair)',
    desc: 'Ayni kisinin iki farkli imza tekrari',
    expected: 'genuine',
    sim: 0.87,
  },
  {
    id: 'forged',
    title: 'Sahtecilik Cifti (Forged Pair)',
    desc: 'Farkli kisilerin imzalari - sahtecilik senaryosu',
    expected: 'forged',
    sim: 0.42,
  },
  {
    id: 'uncertain',
    title: 'Belirsiz Cift (Uncertain)',
    desc: 'Benzer ama kesin karar verilemeyecek cift',
    expected: 'uncertain',
    sim: 0.71,
  },
  {
    id: 'same-shape',
    title: 'Ayni Sekil Farkli Kisi',
    desc: 'Farkli kisiler ayni sekli ciziyor (ornegin paraf)',
    expected: 'forged',
    sim: 0.55,
  },
  {
    id: 'self-variation',
    title: 'Kendi Icinde Varyasyon',
    desc: 'Ayni kisinin farkli gunlerdeki imzasi',
    expected: 'genuine',
    sim: 0.82,
  },
];

function generateDemoImage(seed: number, style: 'genuine1' | 'genuine2' | 'forged' | 'uncertain' | 'shape1' | 'shape2'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const rng = (s: number) => {
    let v = s;
    return () => { v = (v * 16807 + 0) % 2147483647; return v / 2147483647; };
  };
  const r = rng(seed);

  if (style === 'genuine1' || style === 'genuine2') {
    const jitter = style === 'genuine2' ? 8 : 0;
    ctx.beginPath();
    ctx.moveTo(40 + r() * 10 + jitter, 180 + r() * 10);
    ctx.bezierCurveTo(60 + r() * 20 + jitter, 60 + r() * 30, 120 + r() * 30, 50 + r() * 20 + jitter, 160 + r() * 20, 130 + r() * 20);
    ctx.bezierCurveTo(180 + r() * 10 + jitter, 160 + r() * 10, 200 + r() * 10, 170 + r() * 10 + jitter, 220 + r() * 10, 150 + r() * 15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(80 + r() * 10 + jitter, 200 + r() * 5);
    ctx.bezierCurveTo(100 + r() * 15, 190 + r() * 10 + jitter, 140 + r() * 10, 195 + r() * 5, 180 + r() * 20 + jitter, 200 + r() * 5);
    ctx.stroke();
  } else if (style === 'forged') {
    ctx.beginPath();
    ctx.moveTo(50 + r() * 15, 200 + r() * 10);
    ctx.lineTo(80 + r() * 10, 80 + r() * 20);
    ctx.lineTo(110 + r() * 20, 190 + r() * 10);
    ctx.lineTo(150 + r() * 15, 70 + r() * 20);
    ctx.lineTo(190 + r() * 15, 200 + r() * 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(60, 220);
    ctx.lineTo(200, 220);
    ctx.stroke();
  } else if (style === 'uncertain') {
    ctx.beginPath();
    ctx.moveTo(45 + r() * 20, 175 + r() * 15);
    ctx.bezierCurveTo(70 + r() * 25, 70 + r() * 40, 130 + r() * 25, 55 + r() * 30, 165 + r() * 25, 140 + r() * 25);
    ctx.bezierCurveTo(185 + r() * 15, 165 + r() * 15, 195 + r() * 15, 185 + r() * 10, 215 + r() * 10, 160 + r() * 15);
    ctx.stroke();
  } else if (style === 'shape1') {
    ctx.beginPath();
    ctx.arc(128, 128, 60 + r() * 20, 0, Math.PI * 1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(100, 200);
    ctx.lineTo(160, 200);
    ctx.stroke();
  } else if (style === 'shape2') {
    ctx.beginPath();
    ctx.arc(128, 128, 55 + r() * 25, 0.2, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(95, 205);
    ctx.lineTo(165, 205);
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}

function DemoMode({ model, modelReady }: { model: mobilenet.MobileNet | null; modelReady: boolean }) {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [demoResult, setDemoResult] = useState<{ similarity: number; decision: string; emb1Norm: number; emb2Norm: number } | null>(null);
  const [demoImages, setDemoImages] = useState<{ img1: string; img2: string } | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResults, setBatchResults] = useState<Array<{ id: string; title: string; expected: string; actual: string; similarity: number }>>([]);

  const runScenario = useCallback(async (scenarioId: string) => {
    if (!model) return;
    setRunning(true);
    setDemoResult(null);

    const scenario = DEMO_SCENARIOS.find(s => s.id === scenarioId)!;
    const seed = Date.now() % 10000;
    let img1DataUrl: string, img2DataUrl: string;

    switch (scenarioId) {
      case 'genuine':
        img1DataUrl = generateDemoImage(seed, 'genuine1');
        img2DataUrl = generateDemoImage(seed, 'genuine2');
        break;
      case 'forged':
        img1DataUrl = generateDemoImage(seed, 'genuine1');
        img2DataUrl = generateDemoImage(seed + 999, 'forged');
        break;
      case 'uncertain':
        img1DataUrl = generateDemoImage(seed, 'genuine1');
        img2DataUrl = generateDemoImage(seed + 333, 'uncertain');
        break;
      case 'same-shape':
        img1DataUrl = generateDemoImage(seed, 'shape1');
        img2DataUrl = generateDemoImage(seed + 500, 'shape2');
        break;
      case 'self-variation':
        img1DataUrl = generateDemoImage(seed, 'genuine1');
        img2DataUrl = generateDemoImage(seed + 50, 'genuine2');
        break;
      default:
        img1DataUrl = generateDemoImage(seed, 'genuine1');
        img2DataUrl = generateDemoImage(seed, 'genuine2');
    }

    setDemoImages({ img1: img1DataUrl, img2: img2DataUrl });

    try {
      const [img1El, img2El] = await Promise.all([base64ToImage(img1DataUrl), base64ToImage(img2DataUrl)]);
      const { sim, emb1Norm, emb2Norm } = tf.tidy(() => {
        const emb1 = model!.infer(img1El, true) as tf.Tensor;
        const emb2 = model!.infer(img2El, true) as tf.Tensor;
        return {
          sim: cosineSimilarity(emb1, emb2),
          emb1Norm: tf.norm(emb1).dataSync()[0],
          emb2Norm: tf.norm(emb2).dataSync()[0],
        };
      });
      const decision = sim >= 0.80 ? 'genuine' : sim >= 0.65 ? 'uncertain' : 'forged';
      setDemoResult({ similarity: sim, decision, emb1Norm, emb2Norm });
    } catch (e: any) {
      console.error('Demo error:', e);
    } finally {
      setRunning(false);
    }
  }, [model]);

  const runAllScenarios = useCallback(async () => {
    if (!model) return;
    setBatchRunning(true);
    setBatchResults([]);
    const results: typeof batchResults = [];

    for (const scenario of DEMO_SCENARIOS) {
      const seed = Date.now() % 10000 + results.length * 1000;
      let img1Url: string, img2Url: string;
      switch (scenario.id) {
        case 'genuine': img1Url = generateDemoImage(seed, 'genuine1'); img2Url = generateDemoImage(seed, 'genuine2'); break;
        case 'forged': img1Url = generateDemoImage(seed, 'genuine1'); img2Url = generateDemoImage(seed + 999, 'forged'); break;
        case 'uncertain': img1Url = generateDemoImage(seed, 'genuine1'); img2Url = generateDemoImage(seed + 333, 'uncertain'); break;
        case 'same-shape': img1Url = generateDemoImage(seed, 'shape1'); img2Url = generateDemoImage(seed + 500, 'shape2'); break;
        default: img1Url = generateDemoImage(seed, 'genuine1'); img2Url = generateDemoImage(seed + 50, 'genuine2'); break;
      }

      try {
        const [i1, i2] = await Promise.all([base64ToImage(img1Url), base64ToImage(img2Url)]);
        const sim = tf.tidy(() => {
          const e1 = model!.infer(i1, true) as tf.Tensor;
          const e2 = model!.infer(i2, true) as tf.Tensor;
          return cosineSimilarity(e1, e2);
        });
        const decision = sim >= 0.80 ? 'genuine' : sim >= 0.65 ? 'uncertain' : 'forged';
        results.push({ id: scenario.id, title: scenario.title, expected: scenario.expected, actual: decision, similarity: sim });
      } catch {
        results.push({ id: scenario.id, title: scenario.title, expected: scenario.expected, actual: 'error', similarity: 0 });
      }
    }

    setBatchResults(results);
    setBatchRunning(false);
  }, [model]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          <Play className="w-3 h-3 mr-1" /> Simulasyon Modu
        </Badge>
        <span className="text-sm text-muted-foreground">Hazir senaryolarla sistemi test edin — veri yuklemeden demo gorun</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DEMO_SCENARIOS.map(s => (
          <div
            key={s.id}
            onClick={() => { setSelectedScenario(s.id); if (modelReady) runScenario(s.id); }}
            className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedScenario === s.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
            } ${!modelReady ? 'opacity-50 cursor-not-allowed' : ''}`}
            data-testid={`demo-scenario-${s.id}`}
          >
            <div className="flex items-center gap-2 mb-1">
              {s.expected === 'genuine' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {s.expected === 'forged' && <XCircle className="w-4 h-4 text-red-500" />}
              {s.expected === 'uncertain' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
              <span className="font-semibold text-sm">{s.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>

      {!modelReady && (
        <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
          Simulasyon icin once CNN modelini yukleyin (yukardaki butona basin).
        </div>
      )}

      {demoImages && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Goruntu 1</div>
            <img src={demoImages.img1} alt="Demo 1" className="w-full max-w-[256px] border rounded-lg bg-white" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Goruntu 2</div>
            <img src={demoImages.img2} alt="Demo 2" className="w-full max-w-[256px] border rounded-lg bg-white" />
          </div>
        </div>
      )}

      {running && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" /> CNN isleniyor...
        </div>
      )}

      {demoResult && <ResultDisplay result={demoResult} />}

      <div className="border-t pt-4 mt-4">
        <Button
          onClick={runAllScenarios}
          disabled={!modelReady || batchRunning}
          variant="outline"
          className="w-full"
          data-testid="button-run-all-demos"
        >
          {batchRunning ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
          {batchRunning ? 'Tum senaryolar calistiriliyor...' : 'Tum Senaryolari Calistir (Toplu Demo)'}
        </Button>

        {batchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm font-semibold">Toplu Sonuclar</div>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 font-medium">Senaryo</th>
                    <th className="text-center p-2 font-medium">Beklenen</th>
                    <th className="text-center p-2 font-medium">CNN Sonucu</th>
                    <th className="text-right p-2 font-medium">Benzerlik</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 text-xs">{r.title}</td>
                      <td className="p-2 text-center">
                        <Badge variant="outline" className={`text-xs ${r.expected === 'genuine' ? 'text-green-600 border-green-300' : r.expected === 'forged' ? 'text-red-600 border-red-300' : 'text-yellow-600 border-yellow-300'}`}>
                          {r.expected === 'genuine' ? 'Gercek' : r.expected === 'forged' ? 'Sahte' : 'Belirsiz'}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        <Badge className={`text-xs ${r.actual === 'genuine' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : r.actual === 'forged' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'}`}>
                          {r.actual === 'genuine' ? 'Gercek' : r.actual === 'forged' ? 'Sahte' : r.actual === 'error' ? 'Hata' : 'Belirsiz'}
                        </Badge>
                      </td>
                      <td className="p-2 text-right font-mono text-xs">{(r.similarity * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Not: Demo goruntuler prosedural olarak uretilir. Gercek imza verileri ile sonuclar farklilik gosterebilir.
              Simulasyon, CNN pipeline'inin calistigini dogrulamak icindir.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultDisplay({ result }: { result: { similarity: number; decision: string; emb1Norm: number; emb2Norm: number } }) {
  const decisionColor = result.decision === 'genuine' ? 'text-green-600 dark:text-green-400'
    : result.decision === 'forged' ? 'text-red-500' : 'text-yellow-600';
  const DecisionIcon = result.decision === 'genuine' ? CheckCircle
    : result.decision === 'forged' ? XCircle : AlertTriangle;

  return (
    <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <DecisionIcon className={`w-7 h-7 ${decisionColor}`} />
        <div>
          <div className={`text-xl font-bold ${decisionColor}`}>
            {result.decision === 'genuine' ? 'GERCEK (Genuine)' : result.decision === 'forged' ? 'SAHTECILIK SUPHESI (Forged)' : 'BELIRSIZ (Uncertain)'}
          </div>
          <div className="text-sm text-muted-foreground">CNN Siamese Karar</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-3xl font-bold font-mono">{(result.similarity * 100).toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Cosine Benzerlik</div>
        </div>
      </div>
      <div className="space-y-1">
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${result.similarity >= 0.80 ? 'bg-green-500' : result.similarity >= 0.65 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${Math.max(0, Math.min(100, result.similarity * 100))}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0% (Farkli)</span>
          <span className="text-yellow-600">65%</span>
          <span className="text-green-600">80%+</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="bg-background rounded-lg p-2">
          <div className="text-muted-foreground">Cosine Sim.</div>
          <div className="font-mono font-bold">{result.similarity.toFixed(6)}</div>
        </div>
        <div className="bg-background rounded-lg p-2">
          <div className="text-muted-foreground">||e1|| (L2)</div>
          <div className="font-mono font-bold">{result.emb1Norm.toFixed(4)}</div>
        </div>
        <div className="bg-background rounded-lg p-2">
          <div className="text-muted-foreground">||e2|| (L2)</div>
          <div className="font-mono font-bold">{result.emb2Norm.toFixed(4)}</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Oznitelik uzayi: 1280-boyutlu - Backbone: MobileNet v2 (ImageNet) - Hesaplama: {tf.getBackend().toUpperCase()}
      </div>
    </div>
  );
}

export default function SignatureDeepLearning() {
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [inputMode, setInputMode] = useState<'db' | 'draw' | 'upload' | 'demo'>('demo');
  const [sample1, setSample1] = useState<SampleOption | null>(null);
  const [sample2, setSample2] = useState<SampleOption | null>(null);
  const [drawData1, setDrawData1] = useState('');
  const [drawData2, setDrawData2] = useState('');
  const [uploadData1, setUploadData1] = useState('');
  const [uploadData2, setUploadData2] = useState('');
  const [result, setResult] = useState<{ similarity: number; decision: string; emb1Norm: number; emb2Norm: number } | null>(null);
  const [inferring, setInferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: samplesData } = useQuery<any>({
    queryKey: ['/api/signature/samples'],
    queryFn: async () => {
      const r = await fetch('/api/signature/samples', { credentials: 'include' });
      if (!r.ok) return { samples: [] };
      return r.json();
    }
  });
  const samples: SampleOption[] = samplesData?.samples ?? [];

  const loadModel = useCallback(async () => {
    setModelLoading(true);
    setError(null);
    try {
      await tf.ready();
      const m = await mobilenet.load({ version: 2, alpha: 1.0 });
      setModel(m);
      setModelReady(true);
    } catch (e: any) {
      setError('Model yuklenemedi: ' + e.message);
    } finally {
      setModelLoading(false);
    }
  }, []);

  const runInference = useCallback(async () => {
    if (!model) return;
    let imgData1 = '';
    let imgData2 = '';

    if (inputMode === 'db') {
      if (!sample1 || !sample2) return;
      imgData1 = sample1.imageData;
      imgData2 = sample2.imageData;
    } else if (inputMode === 'draw') {
      if (!drawData1 || !drawData2) return;
      imgData1 = drawData1;
      imgData2 = drawData2;
    } else if (inputMode === 'upload') {
      if (!uploadData1 || !uploadData2) return;
      imgData1 = uploadData1;
      imgData2 = uploadData2;
    }

    setInferring(true);
    setError(null);
    try {
      const [img1, img2] = await Promise.all([base64ToImage(imgData1), base64ToImage(imgData2)]);
      const { sim, emb1Norm, emb2Norm } = tf.tidy(() => {
        const emb1 = model!.infer(img1, true) as tf.Tensor;
        const emb2 = model!.infer(img2, true) as tf.Tensor;
        return {
          sim: cosineSimilarity(emb1, emb2),
          emb1Norm: tf.norm(emb1).dataSync()[0],
          emb2Norm: tf.norm(emb2).dataSync()[0],
        };
      });
      const decision = sim >= 0.80 ? 'genuine' : sim >= 0.65 ? 'uncertain' : 'forged';
      setResult({ similarity: sim, decision, emb1Norm, emb2Norm });
    } catch (e: any) {
      setError('Cikarim hatasi: ' + e.message);
    } finally {
      setInferring(false);
    }
  }, [model, inputMode, sample1, sample2, drawData1, drawData2, uploadData1, uploadData2]);

  const canRun = modelReady && (
    (inputMode === 'db' && sample1 && sample2) ||
    (inputMode === 'draw' && drawData1 && drawData2) ||
    (inputMode === 'upload' && uploadData1 && uploadData2)
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 flex-wrap">
        <Brain className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Siamese CNN — Derin Ogrenme Dogrulama</h1>
          <p className="text-sm text-muted-foreground">MobileNet v2 oznitelik cikarimi - Cosine Benzerlik - Demo & Canli Mod</p>
        </div>
        <Badge variant="outline" className="ml-auto">Cevrimdisi - Tarayici ici GPU</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Layers className="w-4 h-4" />Ag Mimarisi — Siamese CNN</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ArchDiagram />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm">
            <div className="bg-muted/40 rounded-lg p-3">
              <div className="font-semibold mb-1">CNN Omurgasi</div>
              <div className="text-muted-foreground text-xs">MobileNet v2 (ImageNet onceden egitilmis) - a=1.0 - Son katman kaldirildi - 1280-boyutlu embedding</div>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <div className="font-semibold mb-1">Paylasilan Agirliklar</div>
              <div className="text-muted-foreground text-xs">Her iki dal ayni model agirliklarini kullanir (siamese ilkesi) - Iki goruntu icin ozdes oznitelik uzayi</div>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <div className="font-semibold mb-1">Benzerlik Metrigi</div>
              <div className="text-muted-foreground text-xs">Cosine similarity: cos(t) = (e1*e2) / (|e1|x|e2|) - &gt;=0.80 Gercek - 0.65-0.80 Belirsiz - &lt;0.65 Sahte</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="w-4 h-4" />Model Durumu</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4 flex-wrap">
          {!modelReady ? (
            <>
              <Button onClick={loadModel} disabled={modelLoading} data-testid="button-load-model">
                {modelLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                {modelLoading ? 'MobileNet yukleniyor...' : 'CNN Modelini Yukle'}
              </Button>
              <span className="text-sm text-muted-foreground">~8 MB indirme - Ilk kez CDN'den yuklenir</span>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <div className="font-semibold text-green-600 dark:text-green-400">MobileNet v2 Hazir</div>
                <div className="text-xs text-muted-foreground">Backend: WebGL - 1280-dim embedding - TensorFlow.js</div>
              </div>
            </div>
          )}
          {error && <div className="text-sm text-red-500">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Imza Karsilastirma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={inputMode} onValueChange={v => { setInputMode(v as any); setResult(null); }}>
            <TabsList className="grid grid-cols-4 w-full" data-testid="tabs-input-mode">
              <TabsTrigger value="demo" data-testid="tab-demo">
                <Play className="w-3 h-3 mr-1" /> Demo
              </TabsTrigger>
              <TabsTrigger value="draw" data-testid="tab-draw">
                <Pen className="w-3 h-3 mr-1" /> Ciz
              </TabsTrigger>
              <TabsTrigger value="upload" data-testid="tab-upload">
                <Upload className="w-3 h-3 mr-1" /> Yukle
              </TabsTrigger>
              <TabsTrigger value="db" data-testid="tab-db">
                <Layers className="w-3 h-3 mr-1" /> Veritabani
              </TabsTrigger>
            </TabsList>

            <TabsContent value="demo" className="mt-4">
              <DemoMode model={model} modelReady={modelReady} />
            </TabsContent>

            <TabsContent value="draw" className="mt-4 space-y-4">
              <div className="text-sm text-muted-foreground">
                Iki canvas'a imza cizin, sonra CNN ile karsilastirin.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DrawCanvas label="Imza 1" onCapture={setDrawData1} />
                <DrawCanvas label="Imza 2" onCapture={setDrawData2} />
              </div>
              <Button
                onClick={runInference}
                disabled={!canRun || inferring}
                className="w-full"
                data-testid="button-compare-draw"
              >
                {inferring ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                {inferring ? 'CNN isliyor...' : 'Cizilen Imzalari Karsilastir'}
              </Button>
              {result && <ResultDisplay result={result} />}
            </TabsContent>

            <TabsContent value="upload" className="mt-4 space-y-4">
              <div className="text-sm text-muted-foreground">
                Bilgisayarinizdan PNG/JPG dosyalari yukleyin.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FileUploader label="Imza 1" onUpload={setUploadData1} />
                <FileUploader label="Imza 2" onUpload={setUploadData2} />
              </div>
              <Button
                onClick={runInference}
                disabled={!canRun || inferring}
                className="w-full"
                data-testid="button-compare-upload"
              >
                {inferring ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                {inferring ? 'CNN isliyor...' : 'Yuklenen Dosyalari Karsilastir'}
              </Button>
              {result && <ResultDisplay result={result} />}
            </TabsContent>

            <TabsContent value="db" className="mt-4 space-y-4">
              {samples.length === 0 ? (
                <div className="text-sm text-muted-foreground">Veritabaninda henuz ornek yok. Imza Veri Toplama sayfasindan once ornek toplayin.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SamplePicker label="Ornek 1" samples={samples} onSelect={setSample1} />
                    <SamplePicker label="Ornek 2" samples={samples} onSelect={setSample2} />
                  </div>
                  <Button
                    onClick={runInference}
                    disabled={!canRun || inferring}
                    className="w-full"
                    data-testid="button-compare-db"
                  >
                    {inferring ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                    {inferring ? 'CNN isliyor...' : 'Siamese CNN ile Karsilastir'}
                  </Button>
                  {result && <ResultDisplay result={result} />}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="w-4 h-4" />Colab Egitim Sonuclari (Gercek Veri)</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="font-semibold text-green-700 dark:text-green-300 mb-2">Google Colab Egitimi Tamamlandi</div>
            <div className="text-xs text-green-600 dark:text-green-400">
              21 katilimci · 7 sekil turu · Writer-independent split · Contrastive Loss · 3 backbone karsilastirildi
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'EfficientNet V2-S', acc: '96.3%', auc: '0.9951', eer: '3.3%', best: false },
              { name: 'MobileNet V3-L', acc: '95.3%', auc: '0.9907', eer: '5.0%', best: false },
              { name: 'ResNet-50', acc: '97.3%', auc: '0.9948', eer: '2.8%', best: true },
            ].map(m => (
              <div key={m.name} className={`rounded-xl p-3 border ${m.best ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-border bg-muted/40'}`}>
                <div className="font-semibold text-xs mb-2">{m.name} {m.best && <span className="text-green-600">★</span>}</div>
                <div className="space-y-1 text-xs">
                  <div>Acc: <span className="font-mono font-bold">{m.acc}</span></div>
                  <div>AUC: <span className="font-mono font-bold">{m.auc}</span></div>
                  <div>EER: <span className="font-mono font-bold">{m.eer}</span></div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/signature-training-results" className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline" data-testid="link-training-results">
            <Layers className="w-4 h-4" /> Detayli Egitim Sonuclari &rarr;
          </Link>
          <div className="bg-muted/40 rounded-xl p-4 font-mono text-xs space-y-1 mt-2">
            <div className="text-muted-foreground"># Google Colab'da calistir:</div>
            <div>python scripts/train_siamese.py \</div>
            <div className="pl-4">--dataset data/signatures_dataset/ \</div>
            <div className="pl-4">--epochs 50 --backbone resnet50 --all</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              ['En Iyi Backbone', 'ResNet-50 (Acc %97.3)'],
              ['Kayip Fonk.', 'Contrastive Loss'],
              ['Optimizer', 'Adam (lr=1e-4)'],
              ['AUC-ROC', '0.9948 (Mukemmel)'],
            ].map(([k, v]) => (
              <div key={k} className="bg-muted/40 rounded-lg p-2">
                <div className="text-muted-foreground">{k}</div>
                <div className="font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
