import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  ExternalLink,
  Brain,
  Sparkles,
  Loader2,
  Network,
  Database,
  BookOpen,
  Zap,
  Globe,
  Target,
  ChevronDown,
  ChevronUp,
  Layers,
  BarChart3,
  Grid3X3,
  Activity,
} from "lucide-react";

interface SearchableDB {
  name: string;
  key: string;
  searchUrl: (q: string) => string;
  category: string;
}

const SEARCHABLE_DATABASES: SearchableDB[] = [
  { name: "PubMed / MEDLINE", key: "pubmed", searchUrl: (q) => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`, category: "Tip & Saglik" },
  { name: "Scopus", key: "scopus", searchUrl: (q) => `https://www.scopus.com/results/results.uri?sort=plf-f&src=s&sot=b&sdt=b&sl=50&s=TITLE-ABS-KEY(${encodeURIComponent(q)})`, category: "Atif Indeksi" },
  { name: "Web of Science", key: "wos", searchUrl: (q) => `https://www.webofscience.com/wos/woscc/basic-search`, category: "Atif Indeksi" },
  { name: "ScienceDirect", key: "sciencedirect", searchUrl: (q) => `https://www.sciencedirect.com/search?qs=${encodeURIComponent(q)}&show=100`, category: "Tam Metin" },
  { name: "SpringerLink", key: "springer", searchUrl: (q) => `https://link.springer.com/search?query=${encodeURIComponent(q)}&search-within=Journal`, category: "Tam Metin" },
  { name: "Wiley Online Library", key: "wiley", searchUrl: (q) => `https://onlinelibrary.wiley.com/action/doSearch?AllField=${encodeURIComponent(q)}`, category: "Tam Metin" },
  { name: "Taylor & Francis", key: "tandf", searchUrl: (q) => `https://www.tandfonline.com/action/doSearch?AllField=${encodeURIComponent(q)}`, category: "Tam Metin" },
  { name: "IEEE Xplore", key: "ieee", searchUrl: (q) => `https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=${encodeURIComponent(q)}`, category: "Muhendislik" },
  { name: "JSTOR", key: "jstor", searchUrl: (q) => `https://www.jstor.org/action/doBasicSearch?Query=${encodeURIComponent(q)}`, category: "Arsiv" },
  { name: "Nature", key: "nature", searchUrl: (q) => `https://www.nature.com/search?q=${encodeURIComponent(q)}&order=relevance`, category: "Tam Metin" },
  { name: "NEJM", key: "nejm", searchUrl: (q) => `https://www.nejm.org/search?q=${encodeURIComponent(q)}&asug=`, category: "Tip & Saglik" },
  { name: "ERIC", key: "eric", searchUrl: (q) => `https://eric.ed.gov/?q=${encodeURIComponent(q)}`, category: "Egitim" },
  { name: "TR Dizin", key: "trdizin", searchUrl: (q) => `https://trdizin.gov.tr/search/default?keyword=${encodeURIComponent(q)}`, category: "Ulusal" },
  { name: "EBSCOhost", key: "ebsco", searchUrl: (q) => `https://search.ebscohost.com/login.aspx?direct=true&bquery=${encodeURIComponent(q)}`, category: "Multidisipliner" },
  { name: "Google Scholar", key: "scholar", searchUrl: (q) => `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`, category: "Genel" },
  { name: "ProQuest Dissertations", key: "proquest", searchUrl: (q) => `https://www.proquest.com/pqdtglobal/results?queryOption=fullText&queryText=${encodeURIComponent(q)}`, category: "Tez" },
  { name: "Emerald Insight", key: "emerald", searchUrl: (q) => `https://www.emerald.com/insight/search?q=${encodeURIComponent(q)}`, category: "Tam Metin" },
  { name: "Annual Reviews", key: "annualreviews", searchUrl: (q) => `https://www.annualreviews.org/action/doSearch?AllField=${encodeURIComponent(q)}`, category: "Derleme" },
  { name: "Ovid", key: "ovid", searchUrl: (q) => `https://ovidsp.ovid.com/`, category: "Tip & Saglik" },
  { name: "DynaMed", key: "dynamed", searchUrl: (q) => `https://www.dynamed.com/results?q=${encodeURIComponent(q)}`, category: "Tip & Saglik" },
  { name: "GreenFILE", key: "greenfile", searchUrl: (q) => `https://search.ebscohost.com/`, category: "Cevre" },
  { name: "CAB Abstracts", key: "cab", searchUrl: (q) => `https://www.cabdirect.org/cabdirect/search/?q=${encodeURIComponent(q)}`, category: "Tarim" },
  { name: "Mendeley", key: "mendeley", searchUrl: (q) => `https://www.mendeley.com/search/?query=${encodeURIComponent(q)}`, category: "Referans" },
];

interface DBResult {
  key: string;
  cosineSimilarity: number;
  relevanceScore: number;
  attentionWeight: number;
  reason: string;
  suggestedQuery: string;
  embeddingSlice: number[];
}

interface AttentionRow {
  token: string;
  weights: number[];
}

interface NetworkArch {
  inputDim: number;
  hiddenLayer1Size: number;
  hiddenLayer2Size: number;
  outputSize: number;
  activations: {
    hidden1Sample: number[];
    hidden2Sample: number[];
    outputScores: number[];
  };
  queryEmbeddingSlice: number[];
}

interface AIResult {
  query: string;
  englishQuery: string;
  meshTerms: string[];
  booleanQuery: string;
  searchStrategy: string;
  fieldSuggestion: string;
  queryTokens: string[];
  recommendedDBs: DBResult[];
  attentionMatrix: AttentionRow[];
  networkArchitecture: NetworkArch;
}

function NeuralNetworkViz({ arch, isProcessing }: { arch: NetworkArch | null; isProcessing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * 2;
    canvas.height = h * 2;
    ctx.scale(2, 2);

    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#0a0a12");
    grad.addColorStop(0.5, "#0f0a18");
    grad.addColorStop(1, "#0a0a12");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const layerLabels = ["Input\n(Embedding)", "Dense\n(ReLU)", "Dense\n(Tanh)", "Attention", "Output\n(Softmax)"];
    const layerSizes = [12, 10, 8, 6, arch ? Math.min(arch.outputSize, 10) : 5];
    const layerX = layerLabels.map((_, i) => 60 + (i / (layerLabels.length - 1)) * (w - 120));

    const layerNodes: { x: number; y: number; val: number }[][] = [];

    for (let l = 0; l < layerSizes.length; l++) {
      const count = layerSizes[l];
      const nodes: { x: number; y: number; val: number }[] = [];
      for (let i = 0; i < count; i++) {
        const y = 40 + (i / (count - 1 || 1)) * (h - 80);
        let val = 0;
        if (arch) {
          if (l === 0) val = Math.abs(arch.queryEmbeddingSlice[i] || 0);
          else if (l === 1) val = arch.activations.hidden1Sample[i] || 0;
          else if (l === 2) val = Math.abs(arch.activations.hidden2Sample[i] || 0);
          else if (l === 3) val = (arch.activations.outputScores[i] || 0);
          else if (l === 4) val = (arch.activations.outputScores[i] || 0);
        }
        val = Math.min(1, Math.max(0, val * 5));
        nodes.push({ x: layerX[l], y, val });
      }
      layerNodes.push(nodes);
    }

    for (let l = 0; l < layerNodes.length - 1; l++) {
      for (const n1 of layerNodes[l]) {
        for (const n2 of layerNodes[l + 1]) {
          const strength = (n1.val + n2.val) / 2;
          if (strength < 0.05) continue;
          ctx.strokeStyle = `rgba(139,0,0,${strength * 0.3})`;
          ctx.lineWidth = strength * 1.5;
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();
        }
      }
    }

    for (let l = 0; l < layerNodes.length; l++) {
      for (const n of layerNodes[l]) {
        const r = 4 + n.val * 6;
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3);
        grd.addColorStop(0, `rgba(220,38,38,${0.2 + n.val * 0.8})`);
        grd.addColorStop(1, "rgba(220,38,38,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = n.val > 0.3 ? `rgba(255,220,220,${0.5 + n.val * 0.5})` : "rgba(100,100,120,0.4)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.textAlign = "center";
    for (let l = 0; l < layerLabels.length; l++) {
      const lines = layerLabels[l].split("\n");
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "bold 10px Arial";
      ctx.fillText(lines[0], layerX[l], h - 8);
      if (lines[1]) {
        ctx.font = "9px Arial";
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillText(lines[1], layerX[l], h - 0);
      }
    }

    if (arch) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Input: ${arch.inputDim}-dim embedding`, 8, 16);
      ctx.fillText(`Hidden1: ${arch.hiddenLayer1Size} units (ReLU)`, 8, 28);
      ctx.fillText(`Hidden2: ${arch.hiddenLayer2Size} units (Tanh)`, 8, 40);
      ctx.fillText(`Output: ${arch.outputSize} databases`, 8, 52);
    }

    if (isProcessing) {
      ctx.fillStyle = "rgba(220,38,38,0.9)";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Embedding + Forward Pass...", w / 2, h / 2);
    }
  }, [arch, isProcessing]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg border border-border/30"
      style={{ height: 260 }}
      data-testid="canvas-neural-network"
    />
  );
}

function AttentionHeatmap({ matrix, dbNames }: { matrix: AttentionRow[]; dbNames: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rows = matrix.length;
    const cols = matrix[0].weights.length;
    const cellW = 80;
    const cellH = 36;
    const leftPad = 120;
    const topPad = 90;
    const totalW = leftPad + cols * cellW + 20;
    const totalH = topPad + rows * cellH + 20;

    canvas.width = totalW * 2;
    canvas.height = totalH * 2;
    ctx.scale(2, 2);
    canvas.style.width = totalW + "px";
    canvas.style.height = totalH + "px";

    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, totalW, totalH);

    ctx.save();
    for (let c = 0; c < cols; c++) {
      const x = leftPad + c * cellW + cellW / 2;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "bold 9px Arial";
      ctx.textAlign = "center";
      ctx.save();
      ctx.translate(x, topPad - 8);
      ctx.rotate(-0.5);
      const label = dbNames[c] || `DB${c}`;
      ctx.fillText(label.length > 12 ? label.slice(0, 12) + ".." : label, 0, 0);
      ctx.restore();
    }
    ctx.restore();

    for (let r = 0; r < rows; r++) {
      const y = topPad + r * cellH;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "11px Arial";
      ctx.textAlign = "right";
      const tokenLabel = matrix[r].token.length > 14 ? matrix[r].token.slice(0, 14) + ".." : matrix[r].token;
      ctx.fillText(tokenLabel, leftPad - 8, y + cellH / 2 + 4);

      for (let c = 0; c < cols; c++) {
        const val = matrix[r].weights[c] || 0;
        const x = leftPad + c * cellW;

        const r_c = Math.floor(139 + val * 116);
        const g_c = Math.floor(val * 38);
        const b_c = Math.floor(val * 38);
        ctx.fillStyle = `rgba(${r_c},${g_c},${b_c},${0.15 + val * 0.85})`;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        ctx.fillStyle = val > 0.5 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(val.toFixed(3), x + cellW / 2, y + cellH / 2 + 4);
      }
    }
  }, [matrix, dbNames]);

  return (
    <div className="overflow-x-auto">
      <canvas ref={canvasRef} data-testid="canvas-attention-heatmap" />
    </div>
  );
}

function EmbeddingBarChart({ embeddings, labels }: { embeddings: number[][]; labels: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !embeddings.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const count = Math.min(embeddings.length, 8);
    const dims = 16;
    const barH = 5;
    const gap = 30;
    const leftPad = 110;
    const totalH = count * (dims * barH + gap) + 40;
    const totalW = leftPad + dims * 20 + 40;

    canvas.width = totalW * 2;
    canvas.height = totalH * 2;
    ctx.scale(2, 2);
    canvas.style.width = totalW + "px";
    canvas.style.height = totalH + "px";

    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, totalW, totalH);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Embedding Vektoru (ilk 16 boyut)", totalW / 2, 14);

    for (let i = 0; i < count; i++) {
      const yBase = 28 + i * (dims * barH + gap);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "10px Arial";
      ctx.textAlign = "right";
      const lbl = labels[i]?.length > 14 ? labels[i].slice(0, 14) + ".." : (labels[i] || "");
      ctx.fillText(lbl, leftPad - 6, yBase + (dims * barH) / 2 + 4);

      for (let d = 0; d < dims && d < (embeddings[i]?.length || 0); d++) {
        const val = embeddings[i][d];
        const absVal = Math.min(1, Math.abs(val) * 8);
        const barW = absVal * 14;
        const x = leftPad + d * 20;
        const y = yBase + d * barH;

        if (val >= 0) {
          ctx.fillStyle = `rgba(34,197,94,${0.3 + absVal * 0.7})`;
        } else {
          ctx.fillStyle = `rgba(220,38,38,${0.3 + absVal * 0.7})`;
        }
        ctx.fillRect(x, y, barW, barH - 1);
      }
    }
  }, [embeddings, labels]);

  return (
    <div className="overflow-x-auto">
      <canvas ref={canvasRef} data-testid="canvas-embedding-chart" />
    </div>
  );
}

function CosineSimilarityChart({ dbs }: { dbs: DBResult[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dbs.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const count = Math.min(dbs.length, 10);
    const barH = 32;
    const gap = 6;
    const leftPad = 120;
    const rightPad = 80;
    const totalH = count * (barH + gap) + 50;
    const totalW = 520;

    canvas.width = totalW * 2;
    canvas.height = totalH * 2;
    ctx.scale(2, 2);
    canvas.style.width = totalW + "px";
    canvas.style.height = totalH + "px";

    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, totalW, totalH);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Cosine Similarity Skorlari", totalW / 2, 16);

    const maxSim = Math.max(...dbs.slice(0, count).map(d => d.cosineSimilarity));

    for (let i = 0; i < count; i++) {
      const db = dbs[i];
      const dbInfo = SEARCHABLE_DATABASES.find(d => d.key === db.key);
      const y = 30 + i * (barH + gap);
      const barMaxW = totalW - leftPad - rightPad;
      const barW = (db.cosineSimilarity / (maxSim + 0.05)) * barMaxW;

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "10px Arial";
      ctx.textAlign = "right";
      const name = dbInfo?.name || db.key;
      ctx.fillText(name.length > 16 ? name.slice(0, 16) + ".." : name, leftPad - 8, y + barH / 2 + 4);

      const gradient = ctx.createLinearGradient(leftPad, 0, leftPad + barW, 0);
      gradient.addColorStop(0, `rgba(139,0,0,0.8)`);
      gradient.addColorStop(1, `rgba(220,38,38,${0.5 + db.cosineSimilarity})`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(leftPad, y, barW, barH - 2, 3);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(db.cosineSimilarity.toFixed(4), leftPad + barW + 6, y + barH / 2 + 4);
    }
  }, [dbs]);

  return (
    <div className="overflow-x-auto">
      <canvas ref={canvasRef} data-testid="canvas-cosine-chart" />
    </div>
  );
}

export default function AIDatabaseSearch() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [expandedDBs, setExpandedDBs] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("results");
  const [processingStep, setProcessingStep] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setResult(null);
    setActiveTab("results");

    const steps = [
      "Sorgu tokenize ediliyor...",
      "text-embedding-3-small ile vektorlestiriliyor...",
      "23 veritabani embedding uzayinda kodlaniyor...",
      "Cosine similarity hesaplaniyor...",
      "Attention agirliklari uretiliyor...",
      "Softmax normalizasyonu...",
      "Forward pass tamamlandi!",
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setProcessingStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 800);

    try {
      const response = await fetch("/api/ai-database-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query: query.trim() }),
      });

      clearInterval(interval);

      if (!response.ok) throw new Error("Arama basarisiz");

      const data: AIResult = await response.json();
      setResult(data);
      setProcessingStep("");
    } catch (err: any) {
      clearInterval(interval);
      setProcessingStep("");
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleDB = (key: string) => {
    setExpandedDBs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-700 to-red-900 text-white shadow-lg">
              <Brain className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
                Deep Learning Akademik Arama
                <Badge variant="outline" className="text-xs font-normal">Neural Network</Badge>
              </h1>
              <p className="text-muted-foreground text-sm" data-testid="text-page-subtitle">
                OpenAI Embedding + Cosine Similarity + Attention Mekanizmasi ile {SEARCHABLE_DATABASES.length} veritabani tarama
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-6 border-red-900/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Network className="h-4 w-4 text-red-600" />
                  Arastirma Sorusu (Turkce / Ingilizce)
                </label>
                <Textarea
                  placeholder="Ornek: Adli tipta postmortem biyokimya ile olum zamani tahmini"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[80px] text-base border-red-900/20 focus:border-red-600"
                  data-testid="input-search-query"
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !query.trim()}
                  className="gap-2 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 shadow-lg"
                  size="lg"
                  data-testid="button-search"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {processingStep || "Isleniyor..."}
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Sinir Agi ile Tara
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted">
                    <Layers className="h-3 w-3" /> Embedding
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted">
                    <Activity className="h-3 w-3" /> Cosine Sim
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted">
                    <Grid3X3 className="h-3 w-3" /> Attention
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted">
                    <BarChart3 className="h-3 w-3" /> Ranking
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <NeuralNetworkViz
            arch={result?.networkArchitecture || null}
            isProcessing={isSearching}
          />
        </div>

        {result && (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="results" className="gap-1 text-xs" data-testid="tab-results">
                  <Database className="h-3 w-3" /> Sonuclar
                </TabsTrigger>
                <TabsTrigger value="attention" className="gap-1 text-xs" data-testid="tab-attention">
                  <Grid3X3 className="h-3 w-3" /> Attention
                </TabsTrigger>
                <TabsTrigger value="cosine" className="gap-1 text-xs" data-testid="tab-cosine">
                  <BarChart3 className="h-3 w-3" /> Cosine Sim
                </TabsTrigger>
                <TabsTrigger value="embeddings" className="gap-1 text-xs" data-testid="tab-embeddings">
                  <Layers className="h-3 w-3" /> Embeddings
                </TabsTrigger>
                <TabsTrigger value="strategy" className="gap-1 text-xs" data-testid="tab-strategy">
                  <Sparkles className="h-3 w-3" /> Strateji
                </TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-xs flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-blue-500" />
                        Ingilizce Sorgu
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm font-medium" data-testid="text-english-query">{result.englishQuery}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-xs flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-green-500" />
                        Boolean Sorgu
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-xs font-mono bg-background p-2 rounded break-all" data-testid="text-boolean-query">
                        {result.booleanQuery}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-xs flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                        MeSH / Terimler
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex flex-wrap gap-1">
                        {result.meshTerms.map((term, i) => (
                          <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-mesh-${i}`}>
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  {result.recommendedDBs
                    .sort((a, b) => b.cosineSimilarity - a.cosineSimilarity)
                    .map((rec, idx) => {
                      const db = SEARCHABLE_DATABASES.find((d) => d.key === rec.key);
                      if (!db) return null;
                      const isExpanded = expandedDBs[rec.key];
                      const searchLink = db.searchUrl(rec.suggestedQuery || result.englishQuery);

                      return (
                        <Card key={rec.key} className="overflow-hidden border-red-900/10" data-testid={`card-result-${idx}`}>
                          <div
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                            onClick={() => toggleDB(rec.key)}
                          >
                            <div className="shrink-0 text-center">
                              <div
                                className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white font-bold text-xs"
                                style={{
                                  background: `linear-gradient(135deg, rgba(139,0,0,${0.4 + rec.cosineSimilarity}), rgba(220,38,38,${0.3 + rec.cosineSimilarity * 0.7}))`,
                                }}
                              >
                                <span className="text-base font-bold">{rec.relevanceScore}</span>
                                <span className="text-[8px] opacity-80">cos:{rec.cosineSimilarity.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm" data-testid={`text-db-name-${idx}`}>{db.name}</span>
                                <Badge variant="outline" className="text-[10px]">{db.category}</Badge>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  attn:{rec.attentionWeight.toFixed(4)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{rec.reason}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={searchLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-medium rounded-md transition-colors"
                                data-testid={`link-search-${idx}`}
                              >
                                <Search className="h-3 w-3" />
                                Ara
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t bg-muted/10 space-y-3">
                              <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Onerilen Sorgu:</span>
                                  <p className="text-sm font-mono bg-background p-2 rounded mt-1 break-all">
                                    {rec.suggestedQuery}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Neden Bu Veritabani:</span>
                                  <p className="text-sm mt-1">{rec.reason}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-background rounded p-2">
                                  <div className="text-xs text-muted-foreground">Cosine Sim</div>
                                  <div className="text-lg font-bold font-mono text-red-600">{rec.cosineSimilarity.toFixed(4)}</div>
                                </div>
                                <div className="bg-background rounded p-2">
                                  <div className="text-xs text-muted-foreground">Attention</div>
                                  <div className="text-lg font-bold font-mono">{rec.attentionWeight.toFixed(4)}</div>
                                </div>
                                <div className="bg-background rounded p-2">
                                  <div className="text-xs text-muted-foreground">Relevance</div>
                                  <div className="text-lg font-bold font-mono">{rec.relevanceScore}%</div>
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Embedding slice (ilk 8 boyut):</span>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {rec.embeddingSlice.slice(0, 8).map((v, i) => (
                                    <span
                                      key={i}
                                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono"
                                      style={{
                                        backgroundColor: v >= 0
                                          ? `rgba(34,197,94,${Math.min(1, Math.abs(v) * 8)})`
                                          : `rgba(220,38,38,${Math.min(1, Math.abs(v) * 8)})`,
                                        color: "white",
                                      }}
                                    >
                                      {v.toFixed(3)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                </div>
              </TabsContent>

              <TabsContent value="attention" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4 text-red-600" />
                      Attention (Dikkat) Haritasi
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Satir: sorgu token'lari | Sutun: veritabanlari. Yuksek deger = guclu dikkat baglantisi.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <AttentionHeatmap
                      matrix={result.attentionMatrix}
                      dbNames={result.recommendedDBs.slice(0, 8).map(d => {
                        const info = SEARCHABLE_DATABASES.find(x => x.key === d.key);
                        return info?.name.split(" ")[0] || d.key;
                      })}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cosine" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-red-600" />
                      Cosine Similarity Siralamasi
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Sorgu embedding vektoru ile her veritabaninin embedding vektoru arasindaki cosine benzerlik skoru.
                      OpenAI text-embedding-3-small modeli ({result.networkArchitecture.inputDim} boyut).
                    </p>
                  </CardHeader>
                  <CardContent>
                    <CosineSimilarityChart dbs={result.recommendedDBs} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="embeddings" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="h-4 w-4 text-red-600" />
                      Embedding Vektorleri Karsilastirmasi
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Her veritabaninin embedding vektorunun ilk 16 boyutu.
                      Yesil = pozitif, Kirmizi = negatif degerler.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <EmbeddingBarChart
                      embeddings={[
                        result.networkArchitecture.queryEmbeddingSlice.slice(0, 16),
                        ...result.recommendedDBs.slice(0, 7).map(d => d.embeddingSlice.slice(0, 16)),
                      ]}
                      labels={[
                        "SORGU",
                        ...result.recommendedDBs.slice(0, 7).map(d => {
                          const info = SEARCHABLE_DATABASES.find(x => x.key === d.key);
                          return info?.name.split(" ")[0] || d.key;
                        }),
                      ]}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="strategy" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Arama Stratejisi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm" data-testid="text-strategy">{result.searchStrategy}</p>
                    <div>
                      <strong className="text-sm">Alan Onerisi:</strong>
                      <p className="text-sm text-muted-foreground" data-testid="text-field-suggestion">{result.fieldSuggestion}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Network className="h-4 w-4 text-red-600" />
                      Sinir Agi Mimarisi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-muted/50 rounded p-3 text-center">
                        <div className="text-xs text-muted-foreground">Input (Embedding)</div>
                        <div className="text-2xl font-bold font-mono text-red-600">{result.networkArchitecture.inputDim}</div>
                        <div className="text-[10px] text-muted-foreground">boyut</div>
                      </div>
                      <div className="bg-muted/50 rounded p-3 text-center">
                        <div className="text-xs text-muted-foreground">Hidden 1 (ReLU)</div>
                        <div className="text-2xl font-bold font-mono">{result.networkArchitecture.hiddenLayer1Size}</div>
                        <div className="text-[10px] text-muted-foreground">unit</div>
                      </div>
                      <div className="bg-muted/50 rounded p-3 text-center">
                        <div className="text-xs text-muted-foreground">Hidden 2 (Tanh)</div>
                        <div className="text-2xl font-bold font-mono">{result.networkArchitecture.hiddenLayer2Size}</div>
                        <div className="text-[10px] text-muted-foreground">unit</div>
                      </div>
                      <div className="bg-muted/50 rounded p-3 text-center">
                        <div className="text-xs text-muted-foreground">Output (Softmax)</div>
                        <div className="text-2xl font-bold font-mono text-red-600">{result.networkArchitecture.outputSize}</div>
                        <div className="text-[10px] text-muted-foreground">veritabani</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground space-y-1">
                      <p>Model: text-embedding-3-small ({result.networkArchitecture.inputDim}-dim)</p>
                      <p>Benzerlik Metrigi: Cosine Similarity</p>
                      <p>Normalizasyon: Softmax (attention agirliklari)</p>
                      <p>Aktivasyonlar: ReLU (gizli1), Tanh (gizli2), Softmax (cikis)</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-2">
                      {result.recommendedDBs.slice(0, 8).map((rec) => {
                        const db = SEARCHABLE_DATABASES.find((d) => d.key === rec.key);
                        if (!db) return null;
                        return (
                          <a
                            key={rec.key}
                            href={db.searchUrl(rec.suggestedQuery || result.englishQuery)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-background border rounded text-xs hover:bg-accent transition-colors"
                          >
                            {db.name.split(" ")[0]}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {!result && !isSearching && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Ornek Sorgular:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { q: "Adli tipta DNA metilasyonu ile yas tahmini", icon: Sparkles },
                { q: "Forensic ballistics rifling comparison methods", icon: Target },
                { q: "Postmortem biyokimya ile olum zamani tahmini", icon: Brain },
                { q: "Pulmoner tromboemboli otopsi bulgulari", icon: BookOpen },
                { q: "Deep learning signature verification Siamese CNN", icon: Network },
                { q: "Tibbi malpraktis bilirkisi raporu standartlari", icon: Database },
              ].map((ex, i) => (
                <Card
                  key={i}
                  className="cursor-pointer hover:shadow-md hover:border-red-600/30 transition-all"
                  onClick={() => setQuery(ex.q)}
                  data-testid={`card-example-${i}`}
                >
                  <CardContent className="pt-4 flex items-start gap-3">
                    <ex.icon className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm">{ex.q}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
