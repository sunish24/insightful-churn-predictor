import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, TrendingDown, DollarSign, ArrowLeft, Brain, Download, Bell, CheckCircle } from 'lucide-react';
import { Customer, ChurnInsights } from '@/types/customer';
import { StatsCard } from './StatsCard';
import { CustomerTable } from './CustomerTable';
import { CustomerDetail } from './CustomerDetail';
import { RiskDistributionChart } from './RiskDistributionChart';
import { FeatureImportanceChart } from './FeatureImportanceChart';
import { GlobalInsights } from './GlobalInsights';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DashboardProps {
  customers: Customer[];
  insights: ChurnInsights;
  onReset: () => void;
}

export function Dashboard({ customers, insights, onReset }: DashboardProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const handleExportCSV = () => {
    const headers = ['ID', 'Tenure', 'Monthly Charges', 'Contract Type', 'Internet Service', 'Payment Method', 'Support Calls', 'Total Charges', 'Churn Probability', 'Risk Level'];
    const rows = customers.map(c => [
      c.id,
      c.tenure,
      c.monthlyCharges.toFixed(2),
      c.contractType,
      c.internetService,
      c.paymentMethod,
      c.supportCalls,
      c.totalCharges.toFixed(2),
      (c.churnProbability * 100).toFixed(1) + '%',
      c.riskLevel,
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'churn-predictions.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: `${customers.length} customer predictions downloaded`,
    });
  };

  const handleSetAlerts = () => {
    const highRiskCustomers = customers.filter(c => c.churnProbability > 0.8);
    toast({
      title: "Alerts Configured",
      description: `Monitoring ${highRiskCustomers.length} customers with >80% churn risk`,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              className="hover:bg-secondary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Churn Analysis Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                AI-powered predictions with SHAP explainability
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleSetAlerts}>
              <Bell className="w-4 h-4 mr-1" />
              Set Alerts
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">XGBoost Model Active</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Customers"
            value={insights.totalCustomers}
            subtitle="Analyzed in dataset"
            icon={Users}
            delay={0}
          />
          <StatsCard
            title="High Risk"
            value={insights.highRiskCount}
            subtitle={`${((insights.highRiskCount / insights.totalCustomers) * 100).toFixed(1)}% of total`}
            icon={AlertTriangle}
            variant="danger"
            delay={0.1}
          />
          <StatsCard
            title="Avg Churn Risk"
            value={`${(insights.avgChurnProbability * 100).toFixed(1)}%`}
            subtitle="Across all customers"
            icon={TrendingDown}
            variant="warning"
            delay={0.2}
          />
          <StatsCard
            title="Revenue at Risk"
            value={`$${(insights.revenueAtRisk / 1000).toFixed(1)}K`}
            subtitle="Annual from high-risk"
            icon={DollarSign}
            variant="danger"
            delay={0.3}
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <RiskDistributionChart insights={insights} />
          <FeatureImportanceChart insights={insights} />
        </div>

        {/* Global Insights */}
        <GlobalInsights customers={customers} insights={insights} />

        {/* Customer Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Customer Predictions</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Click any row for detailed analysis</span>
            </div>
          </div>
          <CustomerTable 
            customers={customers}
            onCustomerClick={setSelectedCustomer}
          />
        </div>

        {/* Customer Detail Modal */}
        {selectedCustomer && (
          <CustomerDetail
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </div>
    </div>
  );
}
