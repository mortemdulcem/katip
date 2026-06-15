import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useCreatePaper } from "@/hooks/use-papers";
import { type InsertPaper } from "@shared/routes";

export function AddPaperDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createPaper = useCreatePaper();
  
  const [formData, setFormData] = useState<Partial<InsertPaper>>({
    title: "",
    authors: [],
    abstract: "",
    venue: "",
    year: new Date().getFullYear(),
    url: "",
  });
  
  const [authorsInput, setAuthorsInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    // Process authors from comma-separated string
    const authorsList = authorsInput.split(",").map(a => a.trim()).filter(Boolean);
    
    await createPaper.mutateAsync({
      title: formData.title!,
      authors: authorsList,
      abstract: formData.abstract,
      venue: formData.venue,
      year: Number(formData.year),
      url: formData.url,
      citationCount: 0,
      isRead: false,
      isFavorite: false,
    });
    
    setOpen(false);
    // Reset form
    setFormData({ title: "", authors: [], abstract: "", venue: "", year: new Date().getFullYear(), url: "" });
    setAuthorsInput("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
            <Plus className="w-4 h-4" /> Add Paper
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Add New Paper</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Paper Title <span className="text-destructive">*</span></Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Attention Is All You Need"
                className="font-medium"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input 
                  id="year" 
                  type="number"
                  value={formData.year} 
                  onChange={e => setFormData({...formData, year: Number(e.target.value)})}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue / Journal</Label>
                <Input 
                  id="venue" 
                  value={formData.venue || ""} 
                  onChange={e => setFormData({...formData, venue: e.target.value})}
                  placeholder="e.g. NeurIPS"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="authors">Authors (comma separated)</Label>
              <Input 
                id="authors" 
                value={authorsInput} 
                onChange={e => setAuthorsInput(e.target.value)}
                placeholder="Ashish Vaswani, Noam Shazeer, Niki Parmar..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Paper URL (PDF or DOI)</Label>
              <Input 
                id="url" 
                type="url"
                value={formData.url || ""} 
                onChange={e => setFormData({...formData, url: e.target.value})}
                placeholder="https://arxiv.org/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea 
                id="abstract" 
                value={formData.abstract || ""} 
                onChange={e => setFormData({...formData, abstract: e.target.value})}
                placeholder="Paste the abstract here..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createPaper.isPending}>
              {createPaper.isPending ? "Adding..." : "Add Paper"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
