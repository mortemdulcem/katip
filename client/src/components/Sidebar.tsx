import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCollections, useCreateCollection } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  BookOpen, 
  Star, 
  FolderPlus, 
  LogOut, 
  Moon, 
  Sun,
  Library,
  User as UserIcon,
  Trash2,
  Sparkles,
  ShieldCheck,
  FileText,
  Languages,
  Presentation,
  Download,
  PenLine,
  Brain,
  ScanLine,
  BarChart2,
  TrendingUp,
  GitCompare,
  Layers,
  Database,
  Network,
  Users,
  Scale,
  ScanEye
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: collections } = useCollections();
  
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  
  const createCollection = useCreateCollection();

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    
    createCollection.mutate({ name: newCollectionName });
    setNewCollectionName("");
    setIsCollectionModalOpen(false);
  };

  const NavItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active?: boolean }) => {
    const isActive = active || location === href;
    return (
      <Link href={href} className={`
        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}
      `}>
        <Icon className="w-4 h-4" />
        {label}
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border/50">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
            L
          </div>
          <span className="font-display font-bold text-xl tracking-tight">LitReview</span>
        </div>

        <nav className="space-y-1">
          <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/papers" icon={BookOpen} label="All Papers" />
          <NavItem href="/favorites" icon={Star} label="Favorites" />
          <NavItem href="/search" icon={Sparkles} label="Literatur Tarama" />
          <NavItem href="/thesis-analysis" icon={ShieldCheck} label="Tez Analizi" />
          <NavItem href="/ethics-documents" icon={FileText} label="Etik Kurul Belgeleri" />
          <NavItem href="/book-translation" icon={Languages} label="Kitap Çevirisi" />
          <NavItem href="/blunt-trauma" icon={Presentation} label="Künt Travma Sunumu" />
          <NavItem href="/signature-collection" icon={PenLine} label="İmza Veri Toplama" />
          <NavItem href="/signature-import" icon={ScanLine} label="Tarama İçe Aktarma" />
          <NavItem href="/signature-analysis" icon={Brain} label="İmza Analizi" />
          <NavItem href="/signature-statistics" icon={BarChart2} label="İstatistiksel Analiz" />
          <NavItem href="/signature-deep-learning" icon={Brain} label="Siamese CNN (DL)" />
          <NavItem href="/signature-variation" icon={GitCompare} label="Varyasyon Analizi" />
          <NavItem href="/signature-training-results" icon={Layers} label="Eğitim Sonuçları" />
          <NavItem href="/lens-thickness-stats" icon={TrendingUp} label="Lens Kal. İstatistikleri" />
          <NavItem href="/academic-databases" icon={Database} label="Akademik Veritabanları" />
          <NavItem href="/ai-database-search" icon={Network} label="AI Veritabanı Tarama" />
          <NavItem href="/brain-ct-reporting" icon={Brain} label="Beyin BT Raporlama" />
          <NavItem href="/patient-list" icon={Users} label="Hasta Listesi" />
          <NavItem href="/tomec" icon={Scale} label="TOMEC Hesaplayıcı" />
          <NavItem href="/orbital-morphometry" icon={ScanEye} label="Orbital Morfometri" />
          <a
            href="/LENSTAR_LensThickness.xlsx"
            download="LENSTAR_LensThickness.xlsx"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            data-testid="link-lenstar-download"
          >
            <Download className="w-4 h-4" />
            LENSTAR Biyometri (xlsx)
          </a>
        </nav>
      </div>

      <div className="px-6 py-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collections</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
            onClick={() => setIsCollectionModalOpen(true)}
          >
            <FolderPlus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1 p-2">
          {collections?.map((col) => (
            <NavItem 
              key={col.id} 
              href={`/collections/${col.id}`} 
              icon={Library} 
              label={col.name} 
              active={location === `/collections/${col.id}`}
            />
          ))}
          {collections?.length === 0 && (
            <div className="text-xs text-muted-foreground italic px-3 py-2">
              No collections yet
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto border-t border-border/50 bg-muted/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserIcon className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 justify-start gap-2 text-muted-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isCollectionModalOpen} onOpenChange={setIsCollectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCollection} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name</Label>
              <Input 
                id="name" 
                value={newCollectionName} 
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g. Thesis Research"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCollectionModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createCollection.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
