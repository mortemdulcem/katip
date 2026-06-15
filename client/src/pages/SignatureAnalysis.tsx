import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { Brain, RefreshCw, Users, BarChart3, CheckCircle2, XCircle, HelpCircle, Download, FolderArchive, ImageIcon } from "lucide-react";

const SHAPES = ["imza", "paraf", "W", "Ş", "İ", "O", "α"];
const TOTAL_REPS = 50;

type Sample = { id: number; participantCode: string; shapeType: string; repetitionNumber: number; imageData: string };

function SamplePicker({ label, onSelect }: { label: string; onSelect: (s: Sample) => void }) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [shape, setShape] = useState(SHAPES[0]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/signature/samples/${code}/${shape}/full`, { credentials: 'include' });
      const data = await r.json();
      setSamples(data);
    } catch {
      toast({ title: "Yüklenemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm">{label}</h3>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm bg-background"
          placeholder="Katılımcı kodu"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          data-testid={`input-code-${label}`}
        />
        <select
          className="border border-border rounded-lg px-2 py-1.5 text-sm bg-background"
          value={shape}
          onChange={e => setShape(e.target.value)}
          data-testid={`select-shape-${label}`}
        >
          {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button size="sm" onClick={load} disabled={loading || !code} data-testid={`button-load-${label}`}>
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Yükle'}
        </Button>
      </div>
      {samples.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-2">{samples.length} örnek — birini seçin:</div>
          <div className="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto">
            {samples.map(s => (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                data-testid={`button-sample-${s.id}`}
                className="border border-border rounded hover:border-primary transition-colors"
                title={`Tekrar ${s.repetitionNumber}`}
              >
                <img src={s.imageData} alt={`Tekrar ${s.repetitionNumber}`} className="w-full h-auto" />
                <div className="text-xs text-center py-0.5 text-muted-foreground">{s.repetitionNumber}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignatureAnalysis() {
  const { toast } = useToast();
  const [sample1, setSample1] = useState<Sample | null>(null);
  const [sample2, setSample2] = useState<Sample | null>(null);
  const [result, setResult] = useState<any>(null);

  const { data: participants = [] } = useQuery<any[]>({
    queryKey: ['/api/signature/participants'],
  });

  const { data: datasetStats } = useQuery<any>({
    queryKey: ['/api/signature/dataset-stats'],
    queryFn: async () => {
      const r = await fetch('/api/signature/dataset-stats', { credentials: 'include' });
      if (!r.ok) return null;
      return r.json();
    },
  });

  const compare = useMutation({
    mutationFn: () => apiRequest('POST', '/api/signature/compare', {
      sample1Id: sample1!.id,
      sample2Id: sample2!.id,
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      setResult(data);
    },
    onError: () => toast({ title: "Analiz başarısız", variant: "destructive" }),
  });

  const verdictInfo = (verdict: string) => {
    if (verdict === 'genuine') return { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Aynı Kişi (Genuine)', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' };
    if (verdict === 'forged') return { icon: <XCircle className="w-5 h-5" />, label: 'Sahte / Farklı Kişi (Forged)', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' };
    return { icon: <HelpCircle className="w-5 h-5" />, label: 'Belirsiz (Uncertain)', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' };
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              İmza Analizi & Karşılaştırma
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Yapay zeka destekli imza/şekil karşılaştırma — benzerlik skoru ve adli değerlendirme
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{datasetStats?.participants?.length ?? participants.length}</div>
                <div className="text-xs text-muted-foreground">Katılımcı (dataset)</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{datasetStats?.totalImages ?? 0}</div>
                <div className="text-xs text-muted-foreground">Toplam görüntü (512×512)</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">GPT-4o</div>
                <div className="text-xs text-muted-foreground">Vision Modeli</div>
              </div>
            </div>
          </div>

          {/* Dataset download panel — her zaman görünür */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <FolderArchive className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-semibold">ML Dataset — İndir</div>
                  <div className="text-xs text-muted-foreground">
                    {datasetStats?.totalImages ?? 210} görüntü &bull; 512×512 PNG &bull; metadata.csv dahil
                  </div>
                </div>
              </div>
              <a href="/signatures_dataset.zip" download="signatures_dataset.zip" data-testid="link-dataset-download">
                <Button size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  ZIP İndir (3 MB)
                </Button>
              </a>
            </div>

            {datasetStats?.participants && datasetStats.participants.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {datasetStats.participants.map((p: any) => (
                  <div key={p.code} className="bg-muted/50 rounded-lg p-3">
                    <div className="font-mono font-bold text-sm mb-1">{p.code}</div>
                    <div className="space-y-0.5">
                      {Object.entries(p.shapes as Record<string, number>).map(([s, n]) => (
                        <div key={s} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{s}</span>
                          <span className="font-medium">{n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <SamplePicker label="Örnek 1" onSelect={setSample1} />
            <SamplePicker label="Örnek 2" onSelect={setSample2} />
          </div>

          {(sample1 || sample2) && (
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-4">Seçilen Örnekler</h3>
              <div className="grid grid-cols-2 gap-6">
                {[sample1, sample2].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      {s ? `${s.participantCode} — ${s.shapeType} — Tekrar ${s.repetitionNumber}` : 'Seçilmedi'}
                    </div>
                    {s ? (
                      <img
                        src={s.imageData}
                        alt="Seçilen örnek"
                        data-testid={`img-selected-sample-${i + 1}`}
                        className="border border-border rounded-lg mx-auto"
                        style={{ maxWidth: 200 }}
                      />
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg h-32 flex items-center justify-center text-muted-foreground text-sm">
                        Örnek seçin
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-6">
                <Button
                  size="lg"
                  disabled={!sample1 || !sample2 || compare.isPending}
                  onClick={() => compare.mutate()}
                  data-testid="button-compare"
                  className="px-10"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  {compare.isPending ? 'Analiz Ediliyor...' : 'Yapay Zeka ile Karşılaştır'}
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className={`border rounded-xl p-6 ${verdictInfo(result.aiVerdict).bg}`}>
              <h3 className="font-bold text-lg mb-4">Analiz Sonucu</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Benzerlik Skoru</div>
                  <div className="text-4xl font-bold">
                    {((result.similarityScore || 0) * 100).toFixed(0)}%
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${(result.similarityScore || 0) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Karar</div>
                  <div className={`flex items-center justify-center gap-2 font-semibold ${verdictInfo(result.aiVerdict).color}`}>
                    {verdictInfo(result.aiVerdict).icon}
                    <span>{verdictInfo(result.aiVerdict).label}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Model</div>
                  <Badge>GPT-4o Vision</Badge>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Gerekçe</div>
                <p className="text-sm leading-relaxed" data-testid="text-ai-reasoning">
                  {result.aiReasoning}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
