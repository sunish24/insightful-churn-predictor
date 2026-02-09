import { motion } from 'framer-motion';
import { AlertTriangle, Eye, Clock, DollarSign } from 'lucide-react';

const problems = [
  {
    icon: Eye,
    title: 'Hidden churn risk in customer base',
    description: 'Risky customers look just like loyal ones until they leave.',
  },
  {
    icon: Clock,
    title: 'Reactive retention strategies',
    description: 'By the time you act, it\'s already too late.',
  },
  {
    icon: AlertTriangle,
    title: 'No explanation behind decisions',
    description: 'Black-box models leave you guessing why customers churn.',
  },
  {
    icon: DollarSign,
    title: 'Revenue loss you only notice too late',
    description: 'Silent churn drains your bottom line month after month.',
  },
];

export function ProblemSection() {
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
            Why Businesses Lose Customers{' '}
            <span className="text-destructive">Without Warning</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The silent killer of subscription businesses is customer churn you didn't see coming.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-background border border-border/50 hover:border-destructive/50 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors">
                  <problem.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-muted-foreground">{problem.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
