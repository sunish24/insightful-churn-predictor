import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { LogOut, Loader2 } from 'lucide-react';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ExplainabilitySection } from '@/components/landing/ExplainabilitySection';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { BusinessImpact } from '@/components/landing/BusinessImpact';
import { SecurityTrust } from '@/components/landing/SecurityTrust';
import { WhoItsFor } from '@/components/landing/WhoItsFor';
import { ContactSection } from '@/components/landing/ContactSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { FileUpload } from '@/components/FileUpload';
import { Dashboard } from '@/components/Dashboard';
import { Customer, ChurnInsights } from '@/types/customer';
import { generateMockCustomers, calculateInsights, parseCSV } from '@/utils/mockPredictions';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [insights, setInsights] = useState<ChurnInsights | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const uploadRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (content: string) => {
    const parsedCustomers = parseCSV(content);
    const calculatedInsights = calculateInsights(parsedCustomers);
    setCustomers(parsedCustomers);
    setInsights(calculatedInsights);
  };

  const handleUseSampleData = () => {
    const mockCustomers = generateMockCustomers(100);
    const calculatedInsights = calculateInsights(mockCustomers);
    setCustomers(mockCustomers);
    setInsights(calculatedInsights);
  };

  const handleReset = () => {
    setCustomers(null);
    setInsights(null);
    setShowUpload(false);
  };

  const scrollToUpload = () => {
    setShowUpload(true);
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (customers && insights) {
    return (
      <Dashboard 
        customers={customers} 
        insights={insights}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Sign Out */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CP</span>
            </div>
            <span className="font-semibold text-foreground">ChurnPredictor</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main content with padding for fixed header */}
      <main className="pt-16">
        <HeroSection 
          onUploadClick={scrollToUpload}
          onDemoClick={handleUseSampleData}
        />
        <ProblemSection />
        <HowItWorks />
        <ExplainabilitySection />
        <DashboardPreview />
        <BusinessImpact />
        <SecurityTrust />
        <WhoItsFor />
        <ContactSection />
        <FAQSection />
        <FinalCTA onUploadClick={scrollToUpload} />

        {/* Upload Section */}
        <div ref={uploadRef} className={`py-16 px-4 ${showUpload ? 'block' : 'hidden'}`}>
          <div className="max-w-2xl mx-auto">
            <FileUpload 
              onFileUpload={handleFileUpload}
              onUseSampleData={handleUseSampleData}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CP</span>
              </div>
              <span className="font-semibold text-foreground">ChurnPredictor</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Built with XGBoost & SHAP • Responsible AI for Business Decisions
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
