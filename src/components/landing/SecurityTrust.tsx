import { motion } from 'framer-motion';
import { Lock, Shield, Server, Building2 } from 'lucide-react';

const trustPoints = [
  {
    icon: Lock,
    title: 'Data Privacy',
    description: 'Your data never leaves your control. Process locally or in secure cloud.',
  },
  {
    icon: Shield,
    title: 'Secure Processing',
    description: 'End-to-end encryption for all data transfers and storage.',
  },
  {
    icon: Server,
    title: 'No Data Sharing',
    description: 'Your customer data is never used to train models or shared externally.',
  },
  {
    icon: Building2,
    title: 'Enterprise-Ready',
    description: 'SOC 2 compliant architecture built for enterprise security requirements.',
  },
];

export function SecurityTrust() {
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
            Your Data is <span className="gradient-text">Safe With Us</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We take security seriously so you can focus on insights, not compliance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <point.icon className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {point.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
