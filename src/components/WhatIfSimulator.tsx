import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Customer } from '@/types/customer';

interface WhatIfSimulatorProps {
  customer: Customer;
}

export function WhatIfSimulator({ customer }: WhatIfSimulatorProps) {
  const [priceReduction, setPriceReduction] = useState(0);
  const [contractUpgrade, setContractUpgrade] = useState(0);
  const [supportImprovement, setSupportImprovement] = useState(0);

  // Calculate new churn probability based on interventions
  const calculateNewProbability = () => {
    let reduction = 0;
    
    // Price reduction impact (up to 15% reduction in churn for 20% price cut)
    reduction += (priceReduction / 100) * 0.75;
    
    // Contract upgrade impact (up to 25% reduction for moving to 2-year)
    reduction += (contractUpgrade / 100) * 0.25;
    
    // Support improvement impact (up to 10% reduction)
    reduction += (supportImprovement / 100) * 0.1;
    
    const newProb = Math.max(0.05, customer.churnProbability * (1 - reduction));
    return newProb;
  };

  const newProbability = calculateNewProbability();
  const probabilityChange = customer.churnProbability - newProbability;
  const costSavings = customer.monthlyCharges * 12 * probabilityChange;
  const retentionCost = (customer.monthlyCharges * (priceReduction / 100) * 12);

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5 text-primary" />
          What-If Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Reduction Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              Price Reduction
            </Label>
            <span className="text-sm font-medium text-foreground">{priceReduction}%</span>
          </div>
          <Slider
            value={[priceReduction]}
            onValueChange={(v) => setPriceReduction(v[0])}
            max={30}
            step={5}
            className="w-full"
          />
        </div>

        {/* Contract Upgrade Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              Contract Upgrade Incentive
            </Label>
            <span className="text-sm font-medium text-foreground">{contractUpgrade}%</span>
          </div>
          <Slider
            value={[contractUpgrade]}
            onValueChange={(v) => setContractUpgrade(v[0])}
            max={100}
            step={25}
            className="w-full"
          />
        </div>

        {/* Support Improvement Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Priority Support Access
            </Label>
            <span className="text-sm font-medium text-foreground">{supportImprovement}%</span>
          </div>
          <Slider
            value={[supportImprovement]}
            onValueChange={(v) => setSupportImprovement(v[0])}
            max={100}
            step={25}
            className="w-full"
          />
        </div>

        {/* Results */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Churn Risk</span>
            <span className="font-medium text-destructive">
              {(customer.churnProbability * 100).toFixed(1)}%
            </span>
          </div>
          
          <motion.div 
            className="flex items-center justify-between"
            animate={{ scale: probabilityChange > 0 ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-sm text-muted-foreground">Projected Churn Risk</span>
            <span className={`font-bold ${newProbability < customer.churnProbability ? 'text-green-500' : 'text-foreground'}`}>
              {(newProbability * 100).toFixed(1)}%
            </span>
          </motion.div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Retention Cost (Annual)</span>
            <span className="font-medium text-yellow-500">
              -${retentionCost.toFixed(0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Potential Savings</span>
            <span className="font-bold text-green-500">
              +${costSavings.toFixed(0)}
            </span>
          </div>

          {costSavings > retentionCost && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-400">
                ✓ Net positive ROI: ${(costSavings - retentionCost).toFixed(0)} saved
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
