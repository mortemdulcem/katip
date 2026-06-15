import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { usePapers } from "@/hooks/use-papers";
import { PaperCard } from "@/components/PaperCard";
import { AddPaperDialog } from "@/components/AddPaperDialog";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PapersList({ isFavorite = false }: { isFavorite?: boolean }) {
  const [search, setSearch] = useState("");
  const { data: papers, isLoading } = usePapers({ search, isFavorite });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-64 hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                {isFavorite ? "Favorites" : "Library"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {papers?.length || 0} {papers?.length === 1 ? 'paper' : 'papers'} found
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by title, author, or keyword..." 
                  className="pl-9 bg-card"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <AddPaperDialog />
            </div>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 rounded-xl border border-border/50 bg-card p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="pt-8 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : papers && papers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in">
              {papers.map(paper => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No papers found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {search ? "Try adjusting your search terms." : "Your library is empty. Add your first paper to get started."}
              </p>
              {!search && <AddPaperDialog />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
