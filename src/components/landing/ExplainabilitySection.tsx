import { motion } from 'framer-motion';
import { Search, Shield, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'See top churn drivers per customer',
    description: 'Understand exactly which factors contribute to each customer\'s risk score.',
  },
  {
    icon: Shield,
    title: 'Transparent AI decisions',
    description: 'No black boxes. Every prediction comes with clear, human-readable explanations.',
  },
  {
    icon: TrendingUp,
    title: 'Trustworthy, responsible analytics',
    description: 'Built on SHAP values for mathematically sound, unbiased explanations.',
  },
];

export function ExplainabilitySection() {
  return (
    <section className="py-24 px-4 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Not Just Predictions.{' '}
              <span className="gradient-text">Explanations.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Every prediction tells you <strong className="text-foreground">why</strong>. 
              See exactly which factors drive each customer's churn risk.
            </p>
            
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* SHAP Chart Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-2xl bg-card border border-border p-6 shadow-2xl">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">
                Sample SHAP Analysis — Customer #1234
              </h4>
              
              {/* Mock SHAP bars */}
              <div className="space-y-3">
                {[
                  { factor: 'Short Tenure', impact: 85, positive: true },
                  { factor: 'Monthly Contract', impact: 72, positive: true },
                  { factor: 'High Support Calls', impact: 58, positive: true },
                  { factor: 'Two Year Contract', impact: -45, positive: false },
                  { factor: 'Low Monthly Charges', impact: -30, positive: false },
                ].map((item, index) => (
                  <motion.div
                    key={item.factor}
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs text-muted-foreground w-32 text-right">
                      {item.factor}
                    </span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.abs(item.impact)}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                        className={`h-full rounded ${
                          item.positive 
                            ? 'bg-gradient-to-r from-destructive/70 to-destructive' 
                            : 'bg-gradient-to-r from-green-500/70 to-green-500'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium w-12 ${
                      item.positive ? 'text-destructive' : 'text-green-500'
                    }`}>
                      {item.positive ? '+' : ''}{item.impact}%
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-destructive" /> Increases Risk
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-green-500" /> Decreases Risk
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
