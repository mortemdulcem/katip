import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, Search, Zap, Layout, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
            L
          </div>
          <span className="font-display font-bold text-xl tracking-tight">LitReview</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
        </nav>
        <Button asChild size="sm" className="font-semibold shadow-lg shadow-primary/20">
          <a href="/api/login">Sign In</a>
        </Button>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10 opacity-50" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-accent/10 rounded-full blur-3xl -z-10 opacity-30" />

        <div className="animate-slide-up space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 text-secondary-foreground text-xs font-medium border border-border/50 backdrop-blur-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Now with AI Analysis
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground leading-[1.1]">
            Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Literature Review</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Organize papers, extract insights with AI, and manage your research workflow in one beautiful, distraction-free workspace.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button asChild size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
              <a href="/api/login">
                Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base bg-background/50 backdrop-blur hover:bg-background/80">
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>

        {/* Hero Image / UI Mockup */}
        <div className="mt-16 md:mt-24 w-full max-w-5xl mx-auto px-4 animate-in" style={{ animationDelay: "0.2s" }}>
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur shadow-2xl overflow-hidden aspect-[16/9] relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5" />
            {/* Abstract representation of UI */}
            <div className="absolute top-4 left-4 right-4 h-8 bg-muted/50 rounded flex items-center px-3 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
              <div className="w-3 h-3 rounded-full bg-green-400/50" />
            </div>
            <div className="absolute top-16 left-4 bottom-4 w-64 bg-muted/30 rounded hidden md:block" />
            <div className="absolute top-16 left-4 md:left-72 right-4 bottom-4 bg-background rounded border border-border/50 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden">
               {/* Mock Cards */}
               {[1, 2, 3, 4, 5, 6].map((i) => (
                 <div key={i} className="bg-muted/20 rounded-lg p-4 h-32 border border-border/50 flex flex-col gap-2">
                   <div className="h-4 w-3/4 bg-muted-foreground/20 rounded" />
                   <div className="h-3 w-1/2 bg-muted-foreground/10 rounded" />
                   <div className="mt-auto h-2 w-full bg-muted-foreground/5 rounded" />
                   <div className="h-2 w-2/3 bg-muted-foreground/5 rounded" />
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold">Research smarter, not harder</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to conduct a thorough literature review without the chaos of endless browser tabs.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={BookOpen} 
              title="Centralized Library" 
              description="Keep all your papers, PDFs, and metadata in one organized place. Tag, sort, and filter with ease."
            />
            <FeatureCard 
              icon={Zap} 
              title="AI Analysis" 
              description="Instantly generate summaries, extract key findings, and analyze methodology with integrated AI."
            />
            <FeatureCard 
              icon={Layout} 
              title="Structured Notes" 
              description="Take linked notes directly alongside your papers. Connect ideas and build your thesis faster."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} LitReview. Built for researchers.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-display font-bold text-xl mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
