import { Link } from "wouter";
import { type Paper } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, FileText, Calendar, BookOpen, ExternalLink, Trash2 } from "lucide-react";
import { useUpdatePaper, useDeletePaper } from "@/hooks/use-papers";
import { format } from "date-fns";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function PaperCard({ paper }: { paper: Paper }) {
  const updatePaper = useUpdatePaper();
  const deletePaper = useDeletePaper();

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updatePaper.mutate({ id: paper.id, isFavorite: !paper.isFavorite });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    deletePaper.mutate(paper.id);
  };

  return (
    <Link href={`/papers/${paper.id}`} className="block group">
      <Card className="h-full p-5 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/50 bg-card hover:bg-accent/5">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="space-y-1 flex-1">
            <h3 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {paper.title}
            </h3>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {paper.year && (
                <span className="flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full">
                  <Calendar className="w-3 h-3" /> {paper.year}
                </span>
              )}
              {paper.venue && (
                <span className="flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full">
                  <BookOpen className="w-3 h-3" /> {paper.venue}
                </span>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className={`
              h-8 w-8 rounded-full transition-all
              ${paper.isFavorite ? "text-yellow-400 hover:text-yellow-500" : "text-muted-foreground hover:text-yellow-400"}
            `}
            onClick={toggleFavorite}
          >
            <Star className={`w-5 h-5 ${paper.isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>

        <div className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {paper.authors.join(", ")}
        </div>

        {paper.abstract && (
          <p className="text-xs text-muted-foreground/80 line-clamp-3 mb-4 font-normal leading-relaxed">
            {paper.abstract}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-center opacity-80 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            {paper.url && (
              <a 
                href={paper.url} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs flex items-center gap-1 hover:text-primary transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" /> PDF/Source
              </a>
            )}
          </div>
          
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={e => e.stopPropagation()}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={e => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{paper.title}" from your library.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>
    </Link>
  );
}
