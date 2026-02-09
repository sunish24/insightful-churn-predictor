import { motion } from 'framer-motion';
import { Target, TrendingUp, Shield, Users } from 'lucide-react';

const impacts = [
  {
    icon: Target,
    title: 'Identify revenue at risk',
    description: 'Quantify exactly how much revenue is at stake from high-risk customers.',
  },
  {
    icon: TrendingUp,
    title: 'Prioritize retention campaigns',
    description: 'Focus resources on customers with highest impact potential.',
  },
  {
    icon: Shield,
    title: 'Reduce churn-driven losses',
    description: 'Proactive intervention before customers decide to leave.',
  },
  {
    icon: Users,
    title: 'Optimize support resources',
    description: 'Allocate support team attention where it matters most.',
  },
];

export function BusinessImpact() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Translate AI Into <span className="gradient-text">ROI</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Executives care about money, not models. Here's what this means for your bottom line.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {impacts.map((impact, index) => (
            <motion.div
              key={impact.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <impact.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {impact.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {impact.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Stats callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 text-center"
        >
          <p className="text-xl text-foreground">
            Companies using predictive churn analysis see an average{' '}
            <span className="font-bold gradient-text">25% reduction</span> in customer attrition.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
