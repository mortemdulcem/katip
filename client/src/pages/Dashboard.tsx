import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/Sidebar";
import { usePapers } from "@/hooks/use-papers";
import { AddPaperDialog } from "@/components/AddPaperDialog";
import { PaperCard } from "@/components/PaperCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Star, TrendingUp, Clock } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: papers, isLoading } = usePapers();

  const recentPapers = papers?.slice(0, 3) || [];
  const favoriteCount = papers?.filter(p => p.isFavorite).length || 0;
  const totalCount = papers?.length || 0;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-64 hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, {user?.firstName}</h1>
              <p className="text-muted-foreground mt-1">Here's what's happening in your library.</p>
            </div>
            <AddPaperDialog />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              icon={BookOpen} 
              label="Total Papers" 
              value={totalCount} 
              color="text-blue-500" 
              bg="bg-blue-500/10" 
            />
            <StatCard 
              icon={Star} 
              label="Favorites" 
              value={favoriteCount} 
              color="text-yellow-500" 
              bg="bg-yellow-500/10" 
            />
            <StatCard 
              icon={TrendingUp} 
              label="Read" 
              value={papers?.filter(p => p.isRead).length || 0} 
              color="text-green-500" 
              bg="bg-green-500/10" 
            />
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" /> Recently Added
              </h2>
            </div>
            
            {isLoading ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <PaperSkeleton key={i} />)}
              </div>
            ) : recentPapers.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {recentPapers.map(paper => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/20">
                <p className="text-muted-foreground mb-4">No papers yet. Start your research journey!</p>
                <AddPaperDialog />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
      <div className={`w-12 h-12 rounded-lg ${bg} ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-display font-bold">{value}</p>
      </div>
    </div>
  );
}

function PaperSkeleton() {
  return (
    <div className="border border-border/50 rounded-xl p-5 space-y-4 h-64 flex flex-col">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex-1" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
