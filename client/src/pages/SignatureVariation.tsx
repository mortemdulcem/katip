import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart2, GitBranch, Activity, Layers, RefreshCw, Users, User,
  ArrowRight, TrendingDown, TrendingUp, Minus, Play, Info, ScanLine
} from 'lucide-react';

interface SampleData {
  id: number;
  participantCode: string;
  shapeType: string;
  repNumber: number;
  imageData: string;
}

interface StrokePoint { x: number; y: number; t: number; }

function extractStrokeFromImage(imageData: string): Promise<StrokePoint[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 128;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      const isDark = (x: number, y: number) => {
        if (x < 0 || x >= size || y < 0 || y >= size) return false;
        const idx = (y * size + x) * 4;
        return (data[idx] + data[idx + 1] + data[idx + 2]) / 3 < 128;
      };

      const darkPixels: { x: number; y: number }[] = [];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (isDark(x, y)) darkPixels.push({ x, y });
        }
      }

      if (darkPixels.length === 0) {
        const fallback: StrokePoint[] = [];
        for (let i = 0; i < 20; i++) fallback.push({ x: 64 + i, y: 64, t: i });
        resolve(fallback);
        return;
      }

      const visited = new Set<string>();
      const ordered: StrokePoint[] = [];
      let current = darkPixels[0];
      const key = (p: { x: number; y: number }) => `${p.x},${p.y}`;

      const darkSet = new Set(darkPixels.map(p => key(p)));
      const neighbors = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

      for (let step = 0; step < darkPixels.length && ordered.length < 500; step++) {
        const k = key(current);
        if (visited.has(k)) {
          const next = darkPixels.find(p => !visited.has(key(p)));
          if (!next) break;
          current = next;
          continue;
        }
        visited.add(k);
        ordered.push({ x: current.x, y: current.y, t: ordered.length });

        let bestDist = Infinity;
        let bestNext: { x: number; y: number } | null = null;
        for (const [dy, dx] of neighbors) {
          const nx = current.x + dx;
          const ny = current.y + dy;
          const nk = `${nx},${ny}`;
          if (darkSet.has(nk) && !visited.has(nk)) {
            const d = Math.abs(dx) + Math.abs(dy);
            if (d < bestDist) { bestDist = d; bestNext = { x: nx, y: ny }; }
          }
        }

        if (!bestNext) {
          let minDist = Infinity;
          for (const p of darkPixels) {
            if (visited.has(key(p))) continue;
            const d = Math.abs(p.x - current.x) + Math.abs(p.y - current.y);
            if (d < minDist && d <= 5) { minDist = d; bestNext = p; }
          }
        }

        if (bestNext) {
          current = bestNext;
        } else {
          const next = darkPixels.find(p => !visited.has(key(p)));
          if (!next) break;
          current = next;
        }
      }

      resolve(ordered.length > 0 ? ordered : [{ x: 64, y: 64, t: 0 }]);
    };
    img.onerror = () => {
      const fallback: StrokePoint[] = [];
      for (let i = 0; i < 20; i++) fallback.push({ x: 64 + i, y: 64, t: i });
      resolve(fallback);
    };
    img.src = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
  });
}

function dtw(seq1: StrokePoint[], seq2: StrokePoint[]): number {
  const n = Math.min(seq1.length, 200);
  const m = Math.min(seq2.length, 200);
  const s1 = seq1.slice(0, n);
  const s2 = seq2.slice(0, m);

  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(Infinity));
  cost[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const d = Math.sqrt(
        Math.pow(s1[i - 1].x - s2[j - 1].x, 2) +
        Math.pow(s1[i - 1].y - s2[j - 1].y, 2)
      );
      cost[i][j] = d + Math.min(cost[i - 1][j], cost[i][j - 1], cost[i - 1][j - 1]);
    }
  }

  return cost[n][m] / Math.max(n, m);
}

function computePixelDensityProfile(imageData: string): Promise<{ horizontal: number[]; vertical: number[] }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 128;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      const horizontal = new Array(size).fill(0);
      const vertical = new Array(size).fill(0);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const dark = (data[idx] + data[idx + 1] + data[idx + 2]) / 3 < 128 ? 1 : 0;
          horizontal[y] += dark;
          vertical[x] += dark;
        }
      }

      resolve({ horizontal, vertical });
    };
    img.onerror = () => resolve({ horizontal: new Array(128).fill(0), vertical: new Array(128).fill(0) });
    img.src = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
  });
}

function computeStabilityScore(profiles: { horizontal: number[]; vertical: number[] }[]): { horizontal: number[]; vertical: number[] } {
  const size = 128;
  const hMeans = new Array(size).fill(0);
  const hStds = new Array(size).fill(0);
  const vMeans = new Array(size).fill(0);
  const vStds = new Array(size).fill(0);

  for (let i = 0; i < size; i++) {
    const hVals = profiles.map(p => p.horizontal[i]);
    const vVals = profiles.map(p => p.vertical[i]);
    hMeans[i] = hVals.reduce((a, b) => a + b, 0) / hVals.length;
    vMeans[i] = vVals.reduce((a, b) => a + b, 0) / vVals.length;
    hStds[i] = Math.sqrt(hVals.reduce((a, b) => a + Math.pow(b - hMeans[i], 2), 0) / hVals.length);
    vStds[i] = Math.sqrt(vVals.reduce((a, b) => a + Math.pow(b - vMeans[i], 2), 0) / vVals.length);
  }

  const maxHStd = Math.max(...hStds, 1);
  const maxVStd = Math.max(...vStds, 1);

  return {
    horizontal: hStds.map(s => 1 - s / maxHStd),
    vertical: vStds.map(s => 1 - s / maxVStd),
  };
}

function VariationHeatmap({ stability, label }: { stability: number[]; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stability.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const barW = w / stability.length;
    stability.forEach((val, i) => {
      const r = Math.round(255 * (1 - val));
      const g = Math.round(255 * val);
      ctx.fillStyle = `rgb(${r}, ${g}, 80)`;
      ctx.fillRect(i * barW, 0, barW + 1, h);
    });
  }, [stability]);

  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <canvas
        ref={canvasRef}
        width={384}
        height={30}
        className="w-full h-8 rounded border"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Yuksek Varyasyon</span>
        <span>Dusuk Varyasyon (Korunmus)</span>
      </div>
    </div>
  );
}

function DendrogramCanvas({ distMatrix, labels }: { distMatrix: number[][]; labels: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || distMatrix.length < 2) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const n = labels.length;
    const clusters: { members: number[]; height: number; x?: number }[] = labels.map((_, i) => ({ members: [i], height: 0 }));
    const merges: { a: number; b: number; height: number }[] = [];

    const dist = distMatrix.map(row => [...row]);
    const active = new Set(Array.from({ length: n }, (_, i) => i));

    while (active.size > 1) {
      let minD = Infinity, minI = -1, minJ = -1;
      const arr = [...active];
      for (let ii = 0; ii < arr.length; ii++) {
        for (let jj = ii + 1; jj < arr.length; jj++) {
          if (dist[arr[ii]][arr[jj]] < minD) {
            minD = dist[arr[ii]][arr[jj]];
            minI = arr[ii];
            minJ = arr[jj];
          }
        }
      }
      if (minI === -1) break;

      const newCluster = {
        members: [...clusters[minI].members, ...clusters[minJ].members],
        height: minD
      };
      merges.push({ a: minI, b: minJ, height: minD });

      const newIdx = clusters.length;
      clusters.push(newCluster);

      const newDist = new Array(newIdx + 1).fill(0);
      for (const k of active) {
        if (k === minI || k === minJ) continue;
        const dNew = (dist[minI][k] + dist[minJ][k]) / 2;
        while (dist.length <= newIdx) dist.push([]);
        while (dist[k].length <= newIdx) dist[k].push(0);
        while (dist[newIdx] === undefined) dist.push([]);
        while (dist[newIdx].length <= k + 1) dist[newIdx].push(0);
        dist[newIdx][k] = dNew;
        dist[k][newIdx] = dNew;
      }

      active.delete(minI);
      active.delete(minJ);
      active.add(newIdx);
    }

    const padding = { top: 20, bottom: 50, left: 20, right: 20 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    const maxHeight = Math.max(...merges.map(m => m.height), 1);

    const leafSpacing = plotW / n;
    const leafOrder: number[] = [];
    function getLeaves(idx: number): number[] {
      if (idx < n) return [idx];
      const merge = merges[idx - n];
      if (!merge) return [idx < n ? idx : 0];
      return [...getLeaves(merge.a), ...getLeaves(merge.b)];
    }
    if (merges.length > 0) {
      leafOrder.push(...getLeaves(clusters.length - 1));
    } else {
      for (let i = 0; i < n; i++) leafOrder.push(i);
    }

    const leafX: Record<number, number> = {};
    leafOrder.forEach((leaf, i) => {
      leafX[leaf] = padding.left + i * leafSpacing + leafSpacing / 2;
      clusters[leaf].x = leafX[leaf];
    });

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;

    for (const merge of merges) {
      const aX = clusters[merge.a].x ?? 0;
      const bX = clusters[merge.b].x ?? 0;
      const aY = padding.top + plotH * (1 - clusters[merge.a].height / maxHeight);
      const bY = padding.top + plotH * (1 - clusters[merge.b].height / maxHeight);
      const mergeY = padding.top + plotH * (1 - merge.height / maxHeight);
      const mergeX = (aX + bX) / 2;

      ctx.beginPath();
      ctx.moveTo(aX, aY);
      ctx.lineTo(aX, mergeY);
      ctx.lineTo(bX, mergeY);
      ctx.lineTo(bX, bY);
      ctx.stroke();

      const mergeIdx = n + merges.indexOf(merge);
      if (clusters[mergeIdx]) clusters[mergeIdx].x = mergeX;
    }

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('color') || '#000';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    leafOrder.forEach((leaf, i) => {
      const x = padding.left + i * leafSpacing + leafSpacing / 2;
      ctx.fillText(labels[leaf] || `P${leaf}`, x, h - 10);
    });
  }, [distMatrix, labels]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={280}
      className="w-full max-w-[500px] mx-auto border rounded-lg bg-background"
      data-testid="canvas-dendrogram"
    />
  );
}

function DTWAlignmentViz({ path1, path2, dtwScore }: { path1: StrokePoint[]; path2: StrokePoint[]; dtwScore: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || path1.length === 0 || path2.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, w, h);

    const normalize = (pts: StrokePoint[], offsetY: number, height: number) => {
      const minX = Math.min(...pts.map(p => p.x));
      const maxX = Math.max(...pts.map(p => p.x));
      const minY = Math.min(...pts.map(p => p.y));
      const maxY = Math.max(...pts.map(p => p.y));
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      return pts.map(p => ({
        x: 20 + ((p.x - minX) / rangeX) * (w - 40),
        y: offsetY + ((p.y - minY) / rangeY) * height
      }));
    };

    const norm1 = normalize(path1, 10, h / 2 - 30);
    const norm2 = normalize(path2, h / 2 + 20, h / 2 - 30);

    const step = Math.max(1, Math.floor(Math.min(norm1.length, norm2.length) / 15));
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < Math.min(norm1.length, norm2.length); i += step) {
      const i1 = Math.min(i, norm1.length - 1);
      const i2 = Math.min(i, norm2.length - 1);
      ctx.beginPath();
      ctx.moveTo(norm1[i1].x, norm1[i1].y);
      ctx.lineTo(norm2[i2].x, norm2[i2].y);
      ctx.stroke();
    }

    const drawPath = (pts: { x: number; y: number }[], color: string) => {
      if (pts.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    };

    drawPath(norm1, '#3b82f6');
    drawPath(norm2, '#ef4444');

    ctx.fillStyle = '#374151';
    ctx.font = '11px sans-serif';
    ctx.fillText('Imza 1', 5, 25);
    ctx.fillText('Imza 2', 5, h / 2 + 35);
  }, [path1, path2]);

  return (
    <div className="space-y-1">
      <canvas
        ref={canvasRef}
        width={450}
        height={220}
        className="w-full max-w-[450px] border rounded-lg"
        data-testid="canvas-dtw-alignment"
      />
      <div className="text-xs text-muted-foreground text-center">
        DTW Mesafesi: <span className="font-mono font-bold">{dtwScore.toFixed(2)}</span> — 
        Dusuk = Daha benzer yol profili
      </div>
    </div>
  );
}

interface VariationResult {
  intraWriter: { participant: string; meanDist: number; stdDist: number; consistency: number }[];
  interWriter: { p1: string; p2: string; meanDist: number }[];
  overallIntra: number;
  overallInter: number;
  discriminability: number;
}

function generateSimulationData(): { samples: SampleData[]; participants: string[] } {
  const participants = ['P001', 'P002', 'P003', 'P004', 'P005'];
  const shapes = ['imza', 'paraf', 'W', 'O'];
  const samples: SampleData[] = [];
  let id = 1;

  for (const p of participants) {
    for (const shape of shapes) {
      for (let rep = 1; rep <= 5; rep++) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        const seed = p.charCodeAt(3) * 1000 + shape.charCodeAt(0) * 100 + rep;
        const rng = (s: number) => { let v = s; return () => { v = (v * 16807) % 2147483647; return v / 2147483647; }; };
        const r = rng(seed);

        const jitter = rep * 3;
        ctx.beginPath();
        if (shape === 'imza') {
          ctx.moveTo(20 + r() * 10 + jitter, 100 + r() * 5);
          ctx.bezierCurveTo(40 + r() * 15 + jitter, 30 + r() * 20, 80 + r() * 15, 25 + r() * 15 + jitter, 100 + r() * 10, 70 + r() * 15);
          ctx.bezierCurveTo(108 + r() * 5, 85 + r() * 5, 110 + r() * 5 + jitter, 90 + r() * 5, 115 + r() * 5, 80 + r() * 8);
        } else if (shape === 'paraf') {
          const cx = 64 + r() * 6 + jitter * 0.5;
          const cy = 64 + r() * 6;
          ctx.arc(cx, cy, 25 + r() * 10, 0, Math.PI * (1.5 + r() * 0.5));
          ctx.moveTo(50, 100 + r() * 5);
          ctx.lineTo(80 + r() * 10 + jitter, 100 + r() * 5);
        } else if (shape === 'W') {
          const startX = 20 + r() * 5 + jitter;
          ctx.moveTo(startX, 40 + r() * 5);
          ctx.lineTo(startX + 20 + r() * 5, 100 + r() * 5);
          ctx.lineTo(startX + 40 + r() * 5, 55 + r() * 10 + jitter);
          ctx.lineTo(startX + 60 + r() * 5, 100 + r() * 5);
          ctx.lineTo(startX + 80 + r() * 5, 40 + r() * 5);
        } else if (shape === 'O') {
          const cx = 64 + r() * 8 + jitter * 0.3;
          const cy = 64 + r() * 8;
          ctx.ellipse(cx, cy, 30 + r() * 12, 35 + r() * 10, r() * 0.2, 0, Math.PI * 2);
        }
        ctx.stroke();

        samples.push({
          id: id++,
          participantCode: p,
          shapeType: shape,
          repNumber: rep,
          imageData: canvas.toDataURL('image/png'),
        });
      }
    }
  }

  return { samples, participants };
}

export default function SignatureVariation() {
  const [analyzing, setAnalyzing] = useState(false);
  const [variationResult, setVariationResult] = useState<VariationResult | null>(null);
  const [stabilityMap, setStabilityMap] = useState<{ horizontal: number[]; vertical: number[] } | null>(null);
  const [selectedPair, setSelectedPair] = useState<{ p1Strokes: StrokePoint[]; p2Strokes: StrokePoint[]; dtwScore: number } | null>(null);
  const [distMatrix, setDistMatrix] = useState<number[][]>([]);
  const [distLabels, setDistLabels] = useState<string[]>([]);
  const [useSimulation, setUseSimulation] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedShape, setSelectedShape] = useState('imza');

  const { data: samplesData, isLoading: samplesLoading } = useQuery<any>({
    queryKey: ['/api/signature/samples'],
    queryFn: async () => {
      const r = await fetch('/api/signature/samples', { credentials: 'include' });
      if (!r.ok) return { samples: [] };
      return r.json();
    }
  });

  const realSamples: SampleData[] = useMemo(() => samplesData?.samples ?? [], [samplesData]);
  const hasRealData = realSamples.length > 0;

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    setVariationResult(null);
    setStabilityMap(null);
    setSelectedPair(null);
    setDistMatrix([]);

    try {
      let samples: SampleData[];
      if (useSimulation || !hasRealData) {
        const sim = generateSimulationData();
        samples = sim.samples;
      } else {
        samples = realSamples;
      }

      const shapeSamples = samples.filter(s => s.shapeType === selectedShape);
      if (shapeSamples.length < 2) {
        setVariationResult({
          intraWriter: [], interWriter: [],
          overallIntra: 0, overallInter: 0, discriminability: 0,
        });
        setAnalyzing(false);
        return;
      }

      const participants = [...new Set(shapeSamples.map(s => s.participantCode))].sort();
      const strokesByParticipant: Record<string, StrokePoint[][]> = {};
      const profilesByParticipant: Record<string, { horizontal: number[]; vertical: number[] }[]> = {};

      for (const p of participants) {
        const pSamples = shapeSamples.filter(s => s.participantCode === p);
        strokesByParticipant[p] = [];
        profilesByParticipant[p] = [];
        for (const s of pSamples) {
          const strokes = await extractStrokeFromImage(s.imageData);
          strokesByParticipant[p].push(strokes);
          const profile = await computePixelDensityProfile(s.imageData);
          profilesByParticipant[p].push(profile);
        }
      }

      const intraWriter: VariationResult['intraWriter'] = [];
      for (const p of participants) {
        const strokes = strokesByParticipant[p];
        if (strokes.length < 2) {
          intraWriter.push({ participant: p, meanDist: 0, stdDist: 0, consistency: 1 });
          continue;
        }
        const dists: number[] = [];
        for (let i = 0; i < strokes.length; i++) {
          for (let j = i + 1; j < strokes.length; j++) {
            dists.push(dtw(strokes[i], strokes[j]));
          }
        }
        const mean = dists.reduce((a, b) => a + b, 0) / dists.length;
        const std = Math.sqrt(dists.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dists.length);
        const maxPossible = 128 * Math.sqrt(2);
        const consistency = Math.max(0, 1 - mean / maxPossible);
        intraWriter.push({ participant: p, meanDist: mean, stdDist: std, consistency });
      }

      const interWriter: VariationResult['interWriter'] = [];
      const interDistMatrix: number[][] = Array.from({ length: participants.length }, () =>
        new Array(participants.length).fill(0)
      );

      for (let i = 0; i < participants.length; i++) {
        for (let j = i + 1; j < participants.length; j++) {
          const dists: number[] = [];
          const s1 = strokesByParticipant[participants[i]];
          const s2 = strokesByParticipant[participants[j]];
          for (const a of s1) {
            for (const b of s2) {
              dists.push(dtw(a, b));
            }
          }
          const mean = dists.reduce((a, b) => a + b, 0) / dists.length;
          interWriter.push({ p1: participants[i], p2: participants[j], meanDist: mean });
          interDistMatrix[i][j] = mean;
          interDistMatrix[j][i] = mean;
        }
      }

      setDistMatrix(interDistMatrix);
      setDistLabels(participants);

      const multiSampleWriters = intraWriter.filter(iw => iw.stdDist > 0 || iw.meanDist > 0);
      const overallIntra = multiSampleWriters.length > 0
        ? multiSampleWriters.reduce((a, b) => a + b.meanDist, 0) / multiSampleWriters.length
        : 0;
      const overallInter = interWriter.length > 0
        ? interWriter.reduce((a, b) => a + b.meanDist, 0) / interWriter.length
        : 0;
      const discriminability = overallInter > 0 ? overallInter / (overallIntra + overallInter) : 0;

      setVariationResult({ intraWriter, interWriter, overallIntra, overallInter, discriminability });

      const allProfiles = Object.values(profilesByParticipant).flat();
      if (allProfiles.length > 0) {
        setStabilityMap(computeStabilityScore(allProfiles));
      }

      if (participants.length >= 2 && strokesByParticipant[participants[0]].length > 0 && strokesByParticipant[participants[1]].length > 0) {
        const p1S = strokesByParticipant[participants[0]][0];
        const p2S = strokesByParticipant[participants[1]][0];
        const dScore = dtw(p1S, p2S);
        setSelectedPair({ p1Strokes: p1S, p2Strokes: p2S, dtwScore: dScore });
      }
    } catch (e) {
      console.error('Analysis error:', e);
    } finally {
      setAnalyzing(false);
    }
  }, [useSimulation, hasRealData, realSamples, selectedShape]);

  const consistencyColor = (c: number) =>
    c >= 0.85 ? 'text-green-600 dark:text-green-400' : c >= 0.7 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500';

  const consistencyLabel = (c: number) =>
    c >= 0.85 ? 'Yuksek' : c >= 0.7 ? 'Orta' : 'Dusuk';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3 flex-wrap">
        <ScanLine className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Imza Varyasyon Analizi</h1>
          <p className="text-sm text-muted-foreground">
            Imza varyasyonlarinin DTW hizalama, stabilite skoru ve hiyerarsik kumeleme ile analizi
          </p>
        </div>
        <Badge variant="outline" className="ml-auto">
          <ScanLine className="w-3 h-3 mr-1" /> ChiroBench Variation
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" /> Analiz Yontemleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> DTW Hizalama
              </div>
              <div className="text-xs text-muted-foreground">
                Iki imza yolunu esnek sekilde hizalar. Zamansal kaymalara ragmen yapisal benzerligi olcer.
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <div className="font-semibold text-green-700 dark:text-green-300 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Stabilite Skoru
              </div>
              <div className="text-xs text-muted-foreground">
                Imzanin hangi bolgeleri tekrarlarda sabit kaliyor, hangileri degiskenlik gosteriyor?
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="font-semibold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                <GitBranch className="w-3 h-3" /> Kumeleme Agaci
              </div>
              <div className="text-xs text-muted-foreground">
                Katilimcilari DTW mesafesine gore gruplayarak benzerlik dendrogrami olusturur.
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
              <div className="font-semibold text-orange-700 dark:text-orange-300 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Grup Analizi
              </div>
              <div className="text-xs text-muted-foreground">
                Kisi ici tutarlilik vs kisiler arasi farklilik: imzalarin ayirt edici gucunu olcer.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analiz Ayarlari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">Veri Kaynagi</div>
              <div className="flex gap-2">
                <Button
                  variant={!useSimulation && hasRealData ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUseSimulation(false)}
                  disabled={!hasRealData}
                  data-testid="button-real-data"
                >
                  <Layers className="w-3 h-3 mr-1" /> Gercek Veri
                </Button>
                <Button
                  variant={useSimulation || !hasRealData ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUseSimulation(true)}
                  data-testid="button-simulation"
                >
                  <Play className="w-3 h-3 mr-1" /> Simulasyon
                </Button>
              </div>
              {!hasRealData && (
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  Veritabaninda ornek yok — simulasyon modu aktif.
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">Sekil Tipi</div>
              <Select value={selectedShape} onValueChange={setSelectedShape}>
                <SelectTrigger className="w-[140px]" data-testid="select-shape">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imza">Imza</SelectItem>
                  <SelectItem value="paraf">Paraf</SelectItem>
                  <SelectItem value="W">W</SelectItem>
                  <SelectItem value="O">O</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={runAnalysis}
              disabled={analyzing}
              className="ml-auto"
              data-testid="button-run-analysis"
            >
              {analyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ScanLine className="w-4 h-4 mr-2" />}
              {analyzing ? 'Analiz ediliyor...' : 'Varyasyon Analizini Baslat'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {variationResult && variationResult.intraWriter.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Info className="w-8 h-8 mx-auto text-amber-500 mb-3" />
            <div className="font-semibold text-amber-600 dark:text-amber-400">Yetersiz Veri</div>
            <p className="text-sm text-muted-foreground mt-1">
              Secilen "{selectedShape}" sekli icin yeterli ornek bulunamadi.
              Farkli bir sekil secin veya simulasyon modunu deneyin.
            </p>
          </CardContent>
        </Card>
      )}

      {variationResult && variationResult.intraWriter.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full" data-testid="tabs-analysis">
            <TabsTrigger value="overview" data-testid="tab-overview">Ozet</TabsTrigger>
            <TabsTrigger value="intra" data-testid="tab-intra">Kisi Ici</TabsTrigger>
            <TabsTrigger value="inter" data-testid="tab-inter">Kisiler Arasi</TabsTrigger>
            <TabsTrigger value="conservation" data-testid="tab-conservation">Stabilite</TabsTrigger>
            <TabsTrigger value="dendrogram" data-testid="tab-dendrogram">Dendrogram</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Intra-Writer (Ort.)</div>
                  <div className="text-2xl font-bold font-mono">{variationResult.overallIntra.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Kisi ici ortalama DTW mesafesi</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Inter-Writer (Ort.)</div>
                  <div className="text-2xl font-bold font-mono">{variationResult.overallInter.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Kisiler arasi ortalama DTW mesafesi</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Ayirt Edicilik</div>
                  <div className={`text-2xl font-bold font-mono ${variationResult.discriminability >= 0.7 ? 'text-green-600' : variationResult.discriminability >= 0.5 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {(variationResult.discriminability * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">d' = inter / (intra + inter)</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Katilimci Sayisi</div>
                  <div className="text-2xl font-bold font-mono">{variationResult.intraWriter.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">{selectedShape} sekli analiz edildi</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-sm font-semibold">Sonuc Yorumlama</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    <span>
                      <strong>Kisi ici varyasyon</strong> — Ayni kisinin farkli imzalari arasindaki fark
                      {variationResult.overallIntra < variationResult.overallInter
                        ? ' — Dusuk: Imzalar tutarli'
                        : ' — Yuksek: Imzalar degisken'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-orange-500" />
                    <span>
                      <strong>Kisiler arasi varyasyon</strong> — Farkli kisilerin imzalari arasindaki fark
                      {variationResult.overallInter > variationResult.overallIntra
                        ? ' — Yuksek: Imzalar birbirinden ayirt edilebilir'
                        : ' — Dusuk: Imzalar birbirine benziyor'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-green-500" />
                    <span>
                      <strong>Ayirt edicilik indeksi</strong> — %{(variationResult.discriminability * 100).toFixed(0)}
                      {variationResult.discriminability >= 0.7
                        ? ' (Iyi — imzalar kisisel ozelliklerini koruyor)'
                        : ' (Gelistirilmeli — daha fazla veri veya farkli ozellikler gerekebilir)'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedPair && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4" /> DTW Hizalama Ornegi
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <DTWAlignmentViz
                    path1={selectedPair.p1Strokes}
                    path2={selectedPair.p2Strokes}
                    dtwScore={selectedPair.dtwScore}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="intra" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" /> Kisi Ici Varyasyon (Intra-Writer)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Her katilimcinin kendi imzalari arasindaki tutarlilik. Dusuk DTW = yuksek tutarlilik.
                </div>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Katilimci</th>
                        <th className="text-center p-3 font-medium">Ort. DTW</th>
                        <th className="text-center p-3 font-medium">Std</th>
                        <th className="text-center p-3 font-medium">Tutarlilik</th>
                        <th className="text-center p-3 font-medium">Seviye</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variationResult.intraWriter.map(iw => (
                        <tr key={iw.participant} className="border-t">
                          <td className="p-3 font-mono font-semibold">{iw.participant}</td>
                          <td className="p-3 text-center font-mono">{iw.meanDist.toFixed(2)}</td>
                          <td className="p-3 text-center font-mono">{iw.stdDist.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${iw.consistency >= 0.85 ? 'bg-green-500' : iw.consistency >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${iw.consistency * 100}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs">{(iw.consistency * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className={`p-3 text-center font-semibold text-xs ${consistencyColor(iw.consistency)}`}>
                            {consistencyLabel(iw.consistency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Dusuk DTW mesafesi = yuksek tekrar edilebilirlik = tutarli imza. Adli grafolojide tutarli imzalar
                  daha guvenilir kimlik tespiti saglar.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inter" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" /> Kisiler Arasi Mesafe Matrisi (Inter-Writer)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  DTW mesafe matrisi — diyagonal sifir, yuksek degerler farkli imzalari gosterir.
                </div>
                {distMatrix.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="text-xs font-mono border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2"></th>
                          {distLabels.map(l => (
                            <th key={l} className="p-2 text-center font-semibold">{l}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {distMatrix.map((row, i) => (
                          <tr key={i}>
                            <td className="p-2 font-semibold">{distLabels[i]}</td>
                            {row.map((val, j) => {
                              const maxVal = Math.max(...distMatrix.flat().filter(v => v > 0), 1);
                              const intensity = i === j ? 0 : val / maxVal;
                              const bg = i === j
                                ? 'bg-muted/30'
                                : `bg-red-${Math.round(intensity * 5) * 100 || 50}`;
                              return (
                                <td
                                  key={j}
                                  className={`p-2 text-center border ${i === j ? 'bg-muted/30' : ''}`}
                                  style={{
                                    backgroundColor: i === j
                                      ? undefined
                                      : `rgba(239, 68, 68, ${intensity * 0.4})`
                                  }}
                                >
                                  {i === j ? '—' : val.toFixed(1)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-3 text-xs text-muted-foreground">
                  Buyuk degerler = daha farkli imza karakteristikleri. Kosegende sifir (kendisiyle mesafe).
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conservation" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Stabilite Haritasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  Imzanin hangi bolgeleri tum tekrarlarda sabit kaliyor, hangileri degisiyor?
                  Yesil = sabit, Kirmizi = degisken.
                </div>
                {stabilityMap ? (
                  <>
                    <VariationHeatmap stability={stabilityMap.horizontal} label="Yatay Eksen Stabilitesi (Satir bazli piksel yogunlugu)" />
                    <VariationHeatmap stability={stabilityMap.vertical} label="Dikey Eksen Stabilitesi (Sutun bazli piksel yogunlugu)" />
                    <div className="bg-muted/40 rounded-xl p-4 text-sm space-y-2">
                      <div className="font-semibold">Yorumlama</div>
                      <p className="text-muted-foreground text-xs">
                        Yesil bolgeler, imzanin tum tekrarlarda ayni kalan kisimlaridir.
                        Kirmizi bolgeler ise varyasyon gosterir.
                        Adli grafolojide, sabit bolgeler kimlik tespiti icin en guvenilir ozelliklerdir.
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                        <div>
                          <div className="font-semibold mb-1">Yuksek Stabilite Bolgeleri</div>
                          <div className="text-muted-foreground">Temel imza karakteristikleri, kalem baslangiclari, karakteristik kavisleri</div>
                        </div>
                        <div>
                          <div className="font-semibold mb-1">Yuksek Varyasyon Bolgeleri</div>
                          <div className="text-muted-foreground">Kalem bitimleri, baglanti noktaslari, hiz degisimleri</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Analiz calistirilmadi.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dendrogram" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="w-4 h-4" /> Benzerlik Dendrogrami
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Katilimcilarin imza benzerliklerine gore hiyerarsik kumeleme.
                  Yakin dallar = benzer imza karakteristikleri.
                </div>
                {distMatrix.length >= 2 ? (
                  <>
                    <div className="flex justify-center">
                      <DendrogramCanvas distMatrix={distMatrix} labels={distLabels} />
                    </div>
                    <div className="bg-muted/40 rounded-xl p-4 text-sm space-y-2">
                      <div className="font-semibold">Nasil Yorumlanir?</div>
                      <p className="text-muted-foreground text-xs">
                        Dendrogram, katilimcilari imza benzerliklerine gore dallandirarak gorsellestirir.
                        Yakin kalan dallar benzer yazma ozelliklerine sahip kisileri gosterir.
                        Bu, adli uzmanin "ayni kisi mi?" sorusuna istatistiksel temel saglar.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    En az 2 katilimci gereklidir. Simulasyon modunu deneyin.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!variationResult && !analyzing && (
        <Card>
          <CardContent className="py-12 text-center">
            <ScanLine className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <div className="text-lg font-semibold text-muted-foreground">Analiz Bekliyor</div>
            <p className="text-sm text-muted-foreground mt-2">
              Yukardaki "Varyasyon Analizini Baslat" butonuna basin.
              {!hasRealData && ' Veri yoksa simulasyon modu kullanilacaktir.'}
            </p>
          </CardContent>
        </Card>
      )}

      {analyzing && (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            <div className="text-lg font-semibold">DTW hesaplaniyor...</div>
            <p className="text-sm text-muted-foreground mt-2">
              Tum katilimci ciftleri icin Dynamic Time Warping mesafeleri hesaplaniyor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
