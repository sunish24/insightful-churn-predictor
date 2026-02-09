import { motion } from 'framer-motion';
import { Phone, CreditCard, Code, ShoppingCart } from 'lucide-react';

const industries = [
  {
    icon: Phone,
    name: 'Telecom Companies',
    description: 'Reduce subscriber churn and optimize retention offers.',
  },
  {
    icon: CreditCard,
    name: 'Subscription Businesses',
    description: 'Keep recurring revenue flowing with early warning systems.',
  },
  {
    icon: Code,
    name: 'SaaS Platforms',
    description: 'Identify at-risk accounts before renewal conversations.',
  },
  {
    icon: ShoppingCart,
    name: 'E-commerce',
    description: 'Predict customer lifetime value and prevent silent churn.',
  },
];

export function WhoItsFor() {
  return (
    <section className="py-24 px-4 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built For <span className="gradient-text">Your Industry</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            If you have customers, you have churn risk. We help you see it coming.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((industry, index) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg hover:shadow-primary/10 transition-all text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <industry.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {industry.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {industry.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
