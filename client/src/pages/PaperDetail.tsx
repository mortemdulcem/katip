import { useRoute } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { usePaper, useAnalyzePaper, useUpdatePaper } from "@/hooks/use-papers";
import { useNotes, useCreateNote, useDeleteNote } from "@/hooks/use-notes";
import { useCollections, useAddPaperToCollection } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  ExternalLink, 
  Sparkles, 
  Calendar, 
  BookOpen, 
  Users, 
  Plus, 
  Trash2,
  Bookmark
} from "lucide-react";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

export default function PaperDetail() {
  const [match, params] = useRoute("/papers/:id");
  const id = Number(params?.id);
  const { data: paper, isLoading } = usePaper(id);
  const { data: notes } = useNotes(id);
  
  const analyze = useAnalyzePaper();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const { data: collections } = useCollections();
  const addToCollection = useAddPaperToCollection();

  const [noteContent, setNoteContent] = useState("");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  if (isLoading) return <DetailSkeleton />;
  if (!paper) return <div>Paper not found</div>;

  const handleAnalyze = async () => {
    const result = await analyze.mutateAsync(id);
    setAnalysisResult(result.analysis);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    createNote.mutate({ paperId: id, content: noteContent });
    setNoteContent("");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-64 hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-8 pb-20">
          <Link href="/papers" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to library
          </Link>

          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight mb-4">
                {paper.title}
              </h1>
              
              <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
                {paper.year && (
                  <span className="flex items-center gap-1.5 bg-secondary px-3 py-1 rounded-full">
                    <Calendar className="w-3.5 h-3.5" /> {paper.year}
                  </span>
                )}
                {paper.venue && (
                  <span className="flex items-center gap-1.5 bg-secondary px-3 py-1 rounded-full">
                    <BookOpen className="w-3.5 h-3.5" /> {paper.venue}
                  </span>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Bookmark className="w-4 h-4" /> Add to Collection
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-56">
                      <Command>
                        <CommandInput placeholder="Search collections..." />
                        <CommandEmpty>No collections found.</CommandEmpty>
                        <CommandGroup>
                          {collections?.map(col => (
                            <CommandItem
                              key={col.id}
                              onSelect={() => {
                                addToCollection.mutate({ collectionId: col.id, paperId: id });
                              }}
                            >
                              {col.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {paper.url && (
                    <Button asChild size="sm" className="gap-2">
                      <a href={paper.url} target="_blank" rel="noreferrer">
                        Read Source <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mt-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <section className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" /> Authors
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.authors.map((author, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1 text-sm font-normal">
                        {author}
                      </Badge>
                    ))}
                  </div>
                </section>

                <Tabs defaultValue="abstract" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger value="abstract" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3">
                      Abstract
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3">
                      AI Analysis
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="abstract" className="mt-6">
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                      {paper.abstract || "No abstract available."}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="analysis" className="mt-6">
                    <div className="bg-accent/5 rounded-xl border border-accent/20 p-6">
                      {!analysisResult ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-lg mb-2">Generate AI Insights</h3>
                          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            Get a structured summary, key findings, and methodology analysis instantly.
                          </p>
                          <Button 
                            onClick={handleAnalyze} 
                            disabled={analyze.isPending}
                            className="bg-accent hover:bg-accent/90 text-white"
                          >
                            {analyze.isPending ? "Analyzing..." : "Analyze Paper"}
                          </Button>
                        </div>
                      ) : (
                        <div className="prose dark:prose-invert max-w-none">
                          <ReactMarkdown>{analysisResult}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Notes Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 bg-card border border-border/50 rounded-xl shadow-sm flex flex-col h-[calc(100vh-100px)]">
                  <div className="p-4 border-b border-border/50 bg-muted/20 rounded-t-xl">
                    <h3 className="font-bold font-display">Research Notes</h3>
                  </div>
                  
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {notes?.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm italic">
                          No notes yet. Add your thoughts...
                        </div>
                      )}
                      {notes?.map(note => (
                        <div key={note.id} className="bg-background border border-border/50 rounded-lg p-3 text-sm group relative">
                          <p className="whitespace-pre-wrap">{note.content}</p>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-border/50">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.createdAt!), 'MMM d, yyyy')}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                              onClick={() => deleteNote.mutate({ id: note.id, paperId: id })}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t border-border/50 bg-background rounded-b-xl">
                    <form onSubmit={handleAddNote} className="flex gap-2">
                      <Textarea
                        value={noteContent}
                        onChange={e => setNoteContent(e.target.value)}
                        placeholder="Add a note..."
                        className="min-h-[80px] text-sm resize-none"
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!noteContent.trim() || createNote.isPending}
                        className="h-auto w-10 shrink-0 self-end"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 hidden md:block border-r" />
      <div className="flex-1 p-8 space-y-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
