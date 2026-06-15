import { useRoute, Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { useCollections, useDeleteCollection } from "@/hooks/use-collections";
import { usePapers } from "@/hooks/use-papers";
import { PaperCard } from "@/components/PaperCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
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

export default function CollectionDetail() {
  const [match, params] = useRoute("/collections/:id");
  const id = Number(params?.id);
  
  const { data: collections } = useCollections();
  const { data: papers, isLoading } = usePapers({ collectionId: id });
  const deleteCollection = useDeleteCollection();

  const collection = collections?.find(c => c.id === id);

  if (!collection) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-64 hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/papers" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to library
              </Link>
              <h1 className="text-3xl font-display font-bold text-foreground">
                {collection.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {papers?.length || 0} papers in collection
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="w-4 h-4" /> Delete Collection
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete the collection "{collection.name}". Papers within it will NOT be deleted from your library.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => {
                      deleteCollection.mutate(id);
                      window.location.href = "/papers";
                    }}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : papers && papers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in">
              {papers.map(paper => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/10">
              <h3 className="text-lg font-medium mb-2">Collection is empty</h3>
              <p className="text-muted-foreground">
                Browse your library and add papers to this collection.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/papers">Browse Papers</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
