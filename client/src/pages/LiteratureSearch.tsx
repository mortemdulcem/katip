import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreatePaper } from "@/hooks/use-papers";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import {
  Search,
  Sparkles,
  ExternalLink,
  BookmarkPlus,
  Users,
  Calendar,
  Building,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
} from "lucide-react";

interface SearchResult {
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  abstract: string;
  similarity: number;
  url?: string;
  relevanceReason: string;
}

function getSimilarityColor(similarity: number): string {
  if (similarity >= 80) return "text-green-600 dark:text-green-400";
  if (similarity >= 60) return "text-blue-600 dark:text-blue-400";
  if (similarity >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-muted-foreground";
}

function getSimilarityBg(similarity: number): string {
  if (similarity >= 80) return "bg-green-500";
  if (similarity >= 60) return "bg-blue-500";
  if (similarity >= 40) return "bg-yellow-500";
  return "bg-muted-foreground";
}

function getSimilarityLabel(similarity: number): string {
  if (similarity >= 90) return "Cok Benzer";
  if (similarity >= 70) return "Yuksek Benzerlik";
  if (similarity >= 50) return "Orta Benzerlik";
  if (similarity >= 30) return "Dusuk Benzerlik";
  return "Az Iliskili";
}

export default function LiteratureSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const createPaper = useCreatePaper();

  const searchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const res = await fetch(api.literatureSearch.search.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    onSuccess: (data) => {
      setResults(data.results || []);
      if ((data.results || []).length === 0) {
        toast({ title: "Sonuc bulunamadi", description: "Farkli bir sorgu deneyin." });
      }
    },
    onError: () => {
      toast({ title: "Hata", description: "Arama yapilirken bir sorun olustu.", variant: "destructive" });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setResults([]);
    searchMutation.mutate(query.trim());
  };

  const handleAddToLibrary = (result: SearchResult) => {
    createPaper.mutate({
      title: result.title,
      authors: result.authors,
      abstract: result.abstract,
      year: result.year || undefined,
      venue: result.venue || undefined,
      url: result.url || undefined,
    });
  };

  const toggleExpand = (index: number) => {
    setExpandedCards(prev => {
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
              <Sparkles className="w-7 h-7 text-primary" />
              Literatur Tarama
            </h1>
            <p className="text-muted-foreground mt-2">
              Bir konu, soru veya metin girin. Yapay zeka ile literaturdeki en benzer calismalari bulacagiz ve benzerlik oranlarini gosterecegiz.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <Textarea
              data-testid="input-search-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ornegin: 'Transformer mimarisi ile dogal dil isleme' veya bir makale ozeti yapistirin..."
              className="min-h-[120px] text-base resize-none"
            />
            <div className="flex justify-end">
              <Button
                data-testid="button-search"
                type="submit"
                disabled={searchMutation.isPending || !query.trim()}
              >
                {searchMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Araniyor...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Literaturu Tara
                  </>
                )}
              </Button>
            </div>
          </form>

          {searchMutation.isPending && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Yapay zeka literatur tariyor, bu birkaç saniye surebilir...</span>
              </div>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </Card>
              ))}
            </div>
          )}

          {results.length > 0 && !searchMutation.isPending && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  {results.length} Benzer Calismalar Bulundu
                </h2>
              </div>

              <div className="space-y-4">
                {results.map((result, index) => {
                  const isExpanded = expandedCards.has(index);
                  return (
                    <Card
                      key={index}
                      data-testid={`card-result-${index}`}
                      className="overflow-visible"
                    >
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                              <h3 className="font-semibold text-foreground leading-snug">
                                {result.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              {result.authors.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  {result.authors.slice(0, 3).join(", ")}
                                  {result.authors.length > 3 && ` +${result.authors.length - 3}`}
                                </span>
                              )}
                              {result.year && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {result.year}
                                </span>
                              )}
                              {result.venue && (
                                <span className="flex items-center gap-1">
                                  <Building className="w-3.5 h-3.5" />
                                  {result.venue}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className={`text-2xl font-bold tabular-nums ${getSimilarityColor(result.similarity)}`}>
                              %{result.similarity}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {getSimilarityLabel(result.similarity)}
                            </Badge>
                          </div>
                        </div>

                        <div className="w-full">
                          <Progress
                            value={result.similarity}
                            className="h-1.5"
                          />
                        </div>

                        <p className="text-sm text-primary/80 italic">
                          {result.relevanceReason}
                        </p>

                        {isExpanded && (
                          <div className="pt-2 space-y-3 border-t border-border/50">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {result.abstract}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <Button
                            data-testid={`button-expand-${index}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(index)}
                            className="text-muted-foreground"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" /> Daralt
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" /> Detay Goster
                              </>
                            )}
                          </Button>

                          <div className="flex items-center gap-2">
                            {result.url && (
                              <Button
                                data-testid={`button-open-url-${index}`}
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <a href={result.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-1" /> Makaleyi Ac
                                </a>
                              </Button>
                            )}
                            <Button
                              data-testid={`button-add-to-library-${index}`}
                              variant="default"
                              size="sm"
                              onClick={() => handleAddToLibrary(result)}
                              disabled={createPaper.isPending}
                            >
                              <BookmarkPlus className="w-4 h-4 mr-1" /> Kutuphaneme Ekle
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
