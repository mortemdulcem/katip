import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useAuth } from "@/hooks/use-auth";

// Pages
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import PapersList from "@/pages/PapersList";
import PaperDetail from "@/pages/PaperDetail";
import CollectionDetail from "@/pages/CollectionDetail";
import LiteratureSearch from "@/pages/LiteratureSearch";
import ThesisAnalysis from "@/pages/ThesisAnalysis";
import EthicsDocuments from "@/pages/EthicsDocuments";
import BookTranslation from "@/pages/BookTranslation";
import BluntTraumaPresentation from "@/pages/BluntTraumaPresentation";
import SignatureCollection from "@/pages/SignatureCollection";
import SignatureAnalysis from "@/pages/SignatureAnalysis";
import SignatureImport from "@/pages/SignatureImport";
import SignatureStatistics from "@/pages/SignatureStatistics";
import SignatureDeepLearning from "@/pages/SignatureDeepLearning";
import SignatureVariation from "@/pages/SignatureVariation";
import SignatureTrainingResults from "@/pages/SignatureTrainingResults";
import LensThicknessStats from "@/pages/LensThicknessStats";
import AcademicDatabases from "@/pages/AcademicDatabases";
import AIDatabaseSearch from "@/pages/AIDatabaseSearch";
import BrainCtReporting from "@/pages/BrainCtReporting";
import PatientList from "@/pages/PatientList";
import TomecCalculator from "@/pages/TomecCalculator";
import OrbitalMorphometry from "@/pages/OrbitalMorphometry";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <LandingPage />}
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/papers">
        <ProtectedRoute component={PapersList} />
      </Route>

      <Route path="/favorites">
        <ProtectedRoute component={() => <PapersList isFavorite={true} />} />
      </Route>
      
      <Route path="/papers/:id">
        <ProtectedRoute component={PaperDetail} />
      </Route>

      <Route path="/search">
        <ProtectedRoute component={LiteratureSearch} />
      </Route>

      <Route path="/thesis-analysis">
        <ProtectedRoute component={ThesisAnalysis} />
      </Route>

      <Route path="/collections/:id">
        <ProtectedRoute component={CollectionDetail} />
      </Route>

      <Route path="/ethics-documents">
        <ProtectedRoute component={EthicsDocuments} />
      </Route>

      <Route path="/book-translation">
        <ProtectedRoute component={BookTranslation} />
      </Route>

      <Route path="/blunt-trauma">
        <ProtectedRoute component={BluntTraumaPresentation} />
      </Route>

      <Route path="/signature-collection">
        <ProtectedRoute component={SignatureCollection} />
      </Route>

      <Route path="/signature-analysis">
        <ProtectedRoute component={SignatureAnalysis} />
      </Route>

      <Route path="/signature-import">
        <ProtectedRoute component={SignatureImport} />
      </Route>

      <Route path="/signature-statistics">
        <ProtectedRoute component={SignatureStatistics} />
      </Route>

      <Route path="/signature-deep-learning">
        <ProtectedRoute component={SignatureDeepLearning} />
      </Route>

      <Route path="/signature-variation">
        <ProtectedRoute component={SignatureVariation} />
      </Route>

      <Route path="/signature-training-results">
        <ProtectedRoute component={SignatureTrainingResults} />
      </Route>

      <Route path="/lens-thickness-stats">
        <ProtectedRoute component={LensThicknessStats} />
      </Route>

      <Route path="/academic-databases">
        <ProtectedRoute component={AcademicDatabases} />
      </Route>

      <Route path="/ai-database-search">
        <ProtectedRoute component={AIDatabaseSearch} />
      </Route>

      <Route path="/brain-ct-reporting">
        <ProtectedRoute component={BrainCtReporting} />
      </Route>

      <Route path="/patient-list">
        <ProtectedRoute component={PatientList} />
      </Route>

      <Route path="/tomec">
        <ProtectedRoute component={TomecCalculator} />
      </Route>

      <Route path="/orbital-morphometry">
        <ProtectedRoute component={OrbitalMorphometry} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
