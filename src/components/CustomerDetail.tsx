import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, CreditCard, Wifi, Phone, DollarSign } from 'lucide-react';
import { Customer } from '@/types/customer';
import { ShapExplanation } from './ShapExplanation';
import { Button } from '@/components/ui/button';

interface CustomerDetailProps {
  customer: Customer | null;
  onClose: () => void;
}

export function CustomerDetail({ customer, onClose }: CustomerDetailProps) {
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
          className="glass-card rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
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

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
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

                {/* Total Revenue */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Total Revenue (Lifetime)</p>
                  <p className="text-2xl font-bold text-foreground">${customer.totalCharges.toFixed(2)}</p>
                </div>
              </div>

              {/* SHAP Explanation */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Why This Prediction?</h3>
                <ShapExplanation 
                  shapValues={customer.shapValues} 
                  churnProbability={customer.churnProbability}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
