import { motion } from 'framer-motion';
import { Upload, Brain, Lightbulb } from 'lucide-react';

const steps = [
  {
    step: 1,
    icon: Upload,
    title: 'Upload Data',
    description: 'Securely upload your customer dataset in CSV format.',
  },
  {
    step: 2,
    icon: Brain,
    title: 'AI Predicts Risk',
    description: 'Our model calculates churn probability for each customer.',
  },
  {
    step: 3,
    icon: Lightbulb,
    title: 'Get Actionable Insights',
    description: 'Understand why customers may leave and what to do about it.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From raw data to actionable insights in three simple steps.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/20" />
              )}
              
              <div className="relative z-10 text-center">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mx-auto mb-6 relative">
                  <step.icon className="w-12 h-12 text-primary" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
