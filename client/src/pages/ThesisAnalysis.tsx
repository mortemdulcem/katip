import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import {
  Search,
  Sparkles,
  ExternalLink,
  Users,
  Calendar,
  Building,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  ArrowUpRight,
  XCircle,
} from "lucide-react";

interface Suggestion {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

interface SimilarPaper {
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  similarity: number;
  url?: string;
  relevanceReason: string;
}

interface AnalysisResult {
  originalityScore: number;
  originalityLevel: string;
  originalitySummary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: Suggestion[];
  similarPapers: SimilarPaper[];
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-green-600 dark:text-green-400";
  if (score >= 70) return "text-blue-600 dark:text-blue-400";
  if (score >= 55) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreProgressColor(score: number): string {
  if (score >= 85) return "[&>div]:bg-green-500";
  if (score >= 70) return "[&>div]:bg-blue-500";
  if (score >= 55) return "[&>div]:bg-yellow-500";
  if (score >= 40) return "[&>div]:bg-orange-500";
  return "[&>div]:bg-red-500";
}

function getSimilarityColor(similarity: number): string {
  if (similarity >= 80) return "text-red-600 dark:text-red-400";
  if (similarity >= 60) return "text-orange-600 dark:text-orange-400";
  if (similarity >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-muted-foreground";
}

function getImpactBadge(impact: string) {
  switch (impact) {
    case "high":
      return <Badge variant="destructive" className="text-xs">Yuksek Etki</Badge>;
    case "medium":
      return <Badge variant="secondary" className="text-xs">Orta Etki</Badge>;
    case "low":
      return <Badge variant="outline" className="text-xs">Dusuk Etki</Badge>;
    default:
      return null;
  }
}

export default function ThesisAnalysis() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedPapers, setExpandedPapers] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async (data: { text: string; title?: string }) => {
      const res = await fetch(api.thesisAnalysis.analyze.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Analysis failed");
      return res.json() as Promise<AnalysisResult>;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: () => {
      toast({ title: "Hata", description: "Analiz yapilirken bir sorun olustu.", variant: "destructive" });
    },
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 10) {
      toast({ title: "Uyari", description: "Lutfen en az 10 karakter giriniz.", variant: "destructive" });
      return;
    }
    setResult(null);
    analysisMutation.mutate({ text: text.trim(), title: title.trim() || undefined });
  };

  const togglePaper = (index: number) => {
    setExpandedPapers(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-64 hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-primary" />
              Tez Ozgunluk Analizi
            </h1>
            <p className="text-muted-foreground mt-2">
              Tez veya arastirma metninizi yapistirin. Yapay zeka benzer literaturu bulacak, ozgunlugu degerlendirip ozgunluk artirici oneriler sunacak.
            </p>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <Input
              data-testid="input-thesis-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tez / Arastirma basligi (istege bagli)"
              className="text-base"
            />
            <Textarea
              data-testid="input-thesis-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tez metninizi, ozetinizi veya arastirma konunuzu buraya yapistirin..."
              className="min-h-[200px] text-base resize-y"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {text.length} karakter
              </span>
              <Button
                data-testid="button-analyze"
                type="submit"
                disabled={analysisMutation.isPending || text.trim().length < 10}
              >
                {analysisMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analiz Et
                  </>
                )}
              </Button>
            </div>
          </form>

          {analysisMutation.isPending && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Yapay zeka tezinizi analiz ediyor, literatur tariyor ve ozgunluk degerlendirmesi yapiyor. Bu islem 15-30 saniye surebilir...</span>
              </div>
              <Card className="p-6 space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-2 w-full" />
              </Card>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </Card>
              ))}
            </div>
          )}

          {result && !analysisMutation.isPending && (
            <div className="space-y-8">
              <Card className="p-6 space-y-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-xl font-display font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Ozgunluk Degerlendirmesi
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{result.originalityLevel}</p>
                  </div>
                  <div data-testid="text-originality-score" className={`text-5xl font-bold tabular-nums ${getScoreColor(result.originalityScore)}`}>
                    {result.originalityScore}
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                </div>

                <Progress
                  value={result.originalityScore}
                  className={`h-3 ${getScoreProgressColor(result.originalityScore)}`}
                />

                <p className="text-sm text-foreground leading-relaxed">
                  {result.originalitySummary}
                </p>
              </Card>

              {result.strengths.length > 0 && (
                <Card className="p-6 space-y-4">
                  <h3 className="text-lg font-display font-bold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Guclu Yonler
                  </h3>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <ArrowUpRight className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {result.weaknesses.length > 0 && (
                <Card className="p-6 space-y-4">
                  <h3 className="text-lg font-display font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    Zayif Yonler / Cakisan Alanlar
                  </h3>
                  <ul className="space-y-2">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <XCircle className="w-4 h-4 mt-0.5 text-orange-600 dark:text-orange-400 shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {result.suggestions.length > 0 && (
                <Card className="p-6 space-y-4">
                  <h3 className="text-lg font-display font-bold flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    Ozgunluk Artirici Oneriler
                  </h3>
                  <div className="space-y-4">
                    {result.suggestions.map((s, i) => (
                      <div key={i} className="space-y-1 border-l-2 border-primary/30 pl-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{s.title}</span>
                          {getImpactBadge(s.impact)}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {s.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {result.similarPapers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-display font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    Benzer Literatur ({result.similarPapers.length} Calisma)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    * Linkler yapay zeka tarafindan onerilmistir. Erisim icin dogrulamaniz onerilir.
                  </p>

                  {result.similarPapers.map((paper, index) => (
                    <Card
                      key={index}
                      data-testid={`card-similar-paper-${index}`}
                      className="overflow-visible"
                    >
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground leading-snug">
                              {paper.title}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap mt-1">
                              {paper.authors.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  {paper.authors.slice(0, 3).join(", ")}
                                  {paper.authors.length > 3 && ` +${paper.authors.length - 3}`}
                                </span>
                              )}
                              {paper.year && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {paper.year}
                                </span>
                              )}
                              {paper.venue && (
                                <span className="flex items-center gap-1">
                                  <Building className="w-3.5 h-3.5" />
                                  {paper.venue}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className={`text-xl font-bold tabular-nums ${getSimilarityColor(paper.similarity)}`}>
                              %{paper.similarity}
                            </div>
                            <span className="text-xs text-muted-foreground">benzerlik</span>
                          </div>
                        </div>

                        <Progress value={paper.similarity} className="h-1.5" />

                        <p className="text-sm text-primary/80 italic">
                          {paper.relevanceReason}
                        </p>

                        <div className="flex items-center justify-end gap-2">
                          {paper.url && (
                            <Button
                              data-testid={`button-open-paper-${index}`}
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={paper.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-1" /> Makaleyi Ac
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
