import { motion } from 'framer-motion';
import { ShapValue } from '@/types/customer';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

interface ShapExplanationProps {
  shapValues: ShapValue[];
  churnProbability: number;
}

export function ShapExplanation({ shapValues, churnProbability }: ShapExplanationProps) {
  const maxImpact = Math.max(...shapValues.map(s => Math.abs(s.impact)));
  const baseValue = 0.3; // Base prediction before SHAP

  return (
    <div className="space-y-6">
      {/* Explanation Header */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-foreground mb-1">SHAP Explainability</p>
          <p className="text-muted-foreground">
            Each bar shows how much a feature pushes the prediction up (increases churn risk) 
            or down (decreases churn risk) from the base value of {(baseValue * 100).toFixed(0)}%.
          </p>
        </div>
      </div>

      {/* Waterfall Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Base value</span>
          <span className="font-mono text-foreground">{(baseValue * 100).toFixed(0)}%</span>
        </div>
        
        {shapValues.map((shap, index) => (
          <motion.div
            key={shap.feature}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {shap.impact > 0 ? (
                  <TrendingUp className="w-4 h-4 text-risk-high" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-risk-low" />
                )}
                <span className="font-medium text-foreground">{shap.feature}</span>
                <span className="text-muted-foreground">= {shap.displayValue}</span>
              </div>
              <span className={`font-mono ${shap.impact > 0 ? 'text-risk-high' : 'text-risk-low'}`}>
                {shap.impact > 0 ? '+' : ''}{(shap.impact * 100).toFixed(1)}%
              </span>
            </div>
            
            {/* Bar visualization */}
            <div className="h-6 bg-secondary/50 rounded-md overflow-hidden relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-1/2 h-full" /> {/* Center line placeholder */}
                <div className="absolute left-1/2 w-px h-full bg-border" /> {/* Center line */}
              </div>
              
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${(Math.abs(shap.impact) / maxImpact) * 40}%`
                }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                className={`h-full absolute top-0 ${
                  shap.impact > 0 
                    ? 'left-1/2 shap-bar-positive rounded-r-md' 
                    : 'right-1/2 shap-bar-negative rounded-l-md'
                }`}
              />
            </div>
          </motion.div>
        ))}

        <div className="pt-4 mt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Final Prediction</span>
            <span className={`text-2xl font-bold ${
              churnProbability >= 0.6 ? 'text-risk-high' : 
              churnProbability >= 0.35 ? 'text-risk-medium' : 'text-risk-low'
            }`}>
              {(churnProbability * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Key Risk Factors</h4>
        <div className="space-y-2">
          {shapValues
            .filter(s => s.impact > 0)
            .slice(0, 3)
            .map((shap, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-risk-high/10 border border-risk-high/20"
              >
                <span className="text-risk-high">⚠</span>
                <span className="text-sm text-foreground">
                  <strong>{shap.feature}</strong> ({shap.displayValue}) increases churn risk
                </span>
              </div>
            ))}
          
          {shapValues
            .filter(s => s.impact < 0)
            .slice(0, 2)
            .map((shap, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-risk-low/10 border border-risk-low/20"
              >
                <span className="text-risk-low">✓</span>
                <span className="text-sm text-foreground">
                  <strong>{shap.feature}</strong> ({shap.displayValue}) reduces churn risk
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
