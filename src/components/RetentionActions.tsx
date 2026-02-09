import { motion } from 'framer-motion';
import { Lightbulb, Gift, FileSignature, HeadphonesIcon } from 'lucide-react';
import { Customer } from '@/types/customer';

interface RetentionActionsProps {
  customer: Customer;
}

export function RetentionActions({ customer }: RetentionActionsProps) {
  const getActions = () => {
    const actions = [];
    
    // Analyze SHAP values to determine recommendations
    const highImpactFactors = customer.shapValues
      .filter(v => v.impact > 0)
      .sort((a, b) => b.impact - a.impact);

    // Contract-based recommendation
    if (customer.contractType === 'Monthly') {
      actions.push({
        icon: FileSignature,
        title: 'Offer Contract Upgrade',
        description: 'Incentivize move to annual contract with 2 months free',
        priority: 'high',
        impact: '-25% churn risk',
      });
    }

    // Price sensitivity check
    const priceImpact = highImpactFactors.find(f => 
      f.feature.toLowerCase().includes('charge') || f.feature.toLowerCase().includes('price')
    );
    if (priceImpact || customer.monthlyCharges > 70) {
      actions.push({
        icon: Gift,
        title: 'Loyalty Discount',
        description: '10-15% discount for the next 6 months',
        priority: customer.churnProbability > 0.7 ? 'high' : 'medium',
        impact: '-15% churn risk',
      });
    }

    // Support issues
    if (customer.supportCalls > 3) {
      actions.push({
        icon: HeadphonesIcon,
        title: 'Priority Support',
        description: 'Assign dedicated account manager for proactive outreach',
        priority: 'high',
        impact: '-10% churn risk',
      });
    }

    // Generic retention
    actions.push({
      icon: Lightbulb,
      title: 'Personalized Engagement',
      description: 'Schedule check-in call to understand needs',
      priority: 'medium',
      impact: '-5% churn risk',
    });

    return actions.slice(0, 4);
  };

  const actions = getActions();

  const priorityColors = {
    high: 'border-destructive/50 bg-destructive/5',
    medium: 'border-yellow-500/50 bg-yellow-500/5',
    low: 'border-primary/50 bg-primary/5',
  };

  const priorityBadge = {
    high: 'bg-destructive/20 text-destructive',
    medium: 'bg-yellow-500/20 text-yellow-500',
    low: 'bg-primary/20 text-primary',
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-primary" />
        Suggested Retention Actions
      </h4>
      
      <div className="space-y-2">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-lg border ${priorityColors[action.priority as keyof typeof priorityColors]}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-background">
                <action.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground text-sm">
                    {action.title}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${priorityBadge[action.priority as keyof typeof priorityBadge]}`}>
                    {action.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {action.description}
                </p>
                <span className="text-xs font-medium text-green-500">
                  {action.impact}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
