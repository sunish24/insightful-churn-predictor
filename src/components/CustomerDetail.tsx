import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, CreditCard, Wifi, Phone, DollarSign, Download, Bell } from 'lucide-react';
import { Customer } from '@/types/customer';
import { ShapExplanation } from './ShapExplanation';
import { WhatIfSimulator } from './WhatIfSimulator';
import { RetentionActions } from './RetentionActions';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface CustomerDetailProps {
  customer: Customer | null;
  onClose: () => void;
}

export function CustomerDetail({ customer, onClose }: CustomerDetailProps) {
  const { toast } = useToast();

  if (!customer) return null;

  const riskColors = {
    high: 'from-risk-high/20 to-risk-high/5 border-risk-high/30',
    medium: 'from-risk-medium/20 to-risk-medium/5 border-risk-medium/30',
    low: 'from-risk-low/20 to-risk-low/5 border-risk-low/30',
  };

  const riskTextColors = {
    high: 'text-risk-high',
    medium: 'text-risk-medium',
    low: 'text-risk-low',
  };

  const riskLabels = {
    high: '🔴 High Risk',
    medium: '🟡 Medium Risk',
    low: '🟢 Low Risk',
  };

  const handleExportCustomer = () => {
    const data = {
      id: customer.id,
      tenure: customer.tenure,
      monthlyCharges: customer.monthlyCharges,
      contractType: customer.contractType,
      internetService: customer.internetService,
      supportCalls: customer.supportCalls,
      totalCharges: customer.totalCharges,
      churnProbability: customer.churnProbability,
      riskLevel: customer.riskLevel,
      shapValues: customer.shapValues,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-${customer.id}-prediction.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: `Customer ${customer.id} data downloaded`,
    });
  };

  const handleSetAlert = () => {
    toast({
      title: "Alert Set",
      description: `You'll be notified if Customer ${customer.id} risk crosses 80%`,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="glass-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 bg-gradient-to-r ${riskColors[customer.riskLevel]} border-b border-border/50`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-background/50 flex items-center justify-center">
                  <User className="w-7 h-7 text-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Customer {customer.id}</h2>
                  <p className={`text-sm font-medium ${riskTextColors[customer.riskLevel]}`}>
                    {riskLabels[customer.riskLevel]} - {(customer.churnProbability * 100).toFixed(0)}% Churn Probability
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetAlert}
                  className="hidden sm:flex"
                >
                  <Bell className="w-4 h-4 mr-1" />
                  Set Alert
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCustomer}
                  className="hidden sm:flex"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hover:bg-background/50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="explainability">Why This Prediction</TabsTrigger>
                <TabsTrigger value="simulator">What-If Simulator</TabsTrigger>
                <TabsTrigger value="actions">Retention Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Customer Profile</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tenure</p>
                          <p className="font-medium text-foreground">{customer.tenure} months</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <DollarSign className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Monthly Charges</p>
                          <p className="font-medium text-foreground">${customer.monthlyCharges.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Contract Type</p>
                          <p className="font-medium text-foreground">{customer.contractType}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <Wifi className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Internet Service</p>
                          <p className="font-medium text-foreground">{customer.internetService}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Support Calls</p>
                          <p className="font-medium text-foreground">{customer.supportCalls} calls</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue & Quick Stats */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Business Impact</h3>
                    
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground">Total Revenue (Lifetime)</p>
                      <p className="text-2xl font-bold text-foreground">${customer.totalCharges.toFixed(2)}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20">
                      <p className="text-sm text-muted-foreground">Annual Revenue at Risk</p>
                      <p className="text-2xl font-bold text-destructive">
                        ${(customer.monthlyCharges * 12 * customer.churnProbability).toFixed(2)}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-sm text-muted-foreground">Cost of Retention vs Loss</p>
                      <div className="mt-2 flex items-center gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Est. Retention Cost</p>
                          <p className="font-medium text-yellow-500">~${(customer.monthlyCharges * 0.5).toFixed(0)}</p>
                        </div>
                        <div className="text-muted-foreground">vs</div>
                        <div>
                          <p className="text-xs text-muted-foreground">Annual Loss if Churned</p>
                          <p className="font-medium text-destructive">${(customer.monthlyCharges * 12).toFixed(0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="explainability">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Why This Prediction?</h3>
                    <ShapExplanation 
                      shapValues={customer.shapValues} 
                      churnProbability={customer.churnProbability}
                    />
                  </div>
                  
                  {/* Risk Summary */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                      <h4 className="font-medium text-foreground mb-2">Risk Increased Because...</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {customer.shapValues
                          .filter(v => v.impact > 0)
                          .slice(0, 3)
                          .map(v => (
                            <li key={v.feature}>• {v.feature}: {v.displayValue}</li>
                          ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <h4 className="font-medium text-foreground mb-2">Risk Reduced Because...</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {customer.shapValues
                          .filter(v => v.impact < 0)
                          .slice(0, 3)
                          .map(v => (
                            <li key={v.feature}>• {v.feature}: {v.displayValue}</li>
                          ))}
                        {customer.shapValues.filter(v => v.impact < 0).length === 0 && (
                          <li className="text-muted-foreground/50">No protective factors identified</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="simulator">
                <WhatIfSimulator customer={customer} />
              </TabsContent>

              <TabsContent value="actions">
                <RetentionActions customer={customer} />
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
