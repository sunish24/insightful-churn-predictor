import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, BarChart3, Shield, Sparkles, LogOut, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Sign Out */}
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8 animate-glow"
          >
            <Brain className="w-10 h-10 text-primary-foreground" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          >
            <span className="gradient-text">Customer Churn</span>
            <br />
            <span className="text-foreground">Predictor</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            AI-powered predictions with explainable insights. Understand <strong className="text-foreground">why</strong> customers leave, 
            not just who will leave.
          </motion.p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12"
        >
          {[
            { icon: BarChart3, title: 'XGBoost Model', desc: 'State-of-the-art ML' },
            { icon: Shield, title: 'SHAP Explainability', desc: 'Transparent AI decisions' },
            { icon: Sparkles, title: 'Actionable Insights', desc: 'Know why, act now' },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Upload Section */}
        <FileUpload 
          onFileUpload={handleFileUpload}
          onUseSampleData={handleUseSampleData}
        />
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="py-6 text-center border-t border-border/50"
      >
        <p className="text-sm text-muted-foreground">
          Built with XGBoost & SHAP • Responsible AI for Business Decisions
        </p>
      </motion.footer>
    </div>
  );
};

export default Index;
