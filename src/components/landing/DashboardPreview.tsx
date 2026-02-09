import { motion } from 'framer-motion';
import { BarChart3, Users, DollarSign, AlertTriangle } from 'lucide-react';

export function DashboardPreview() {
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
            Powerful Dashboard, <span className="gradient-text">Real Results</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From raw data to business decisions in seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Dashboard mockup */}
          <div className="rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
            {/* Top bar */}
            <div className="h-12 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-4 text-sm text-muted-foreground">Churn Analysis Dashboard</span>
            </div>

            <div className="p-6">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { icon: Users, label: 'Total Customers', value: '1,234', color: 'text-primary' },
                  { icon: AlertTriangle, label: 'High Risk', value: '156', color: 'text-destructive' },
                  { icon: BarChart3, label: 'Avg Churn Risk', value: '24.7%', color: 'text-yellow-500' },
                  { icon: DollarSign, label: 'Revenue at Risk', value: '$48.2K', color: 'text-destructive' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="p-4 rounded-xl bg-secondary/50 border border-border"
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Risk Distribution */}
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <h4 className="text-sm font-medium text-foreground mb-4">Risk Distribution</h4>
                  <div className="flex items-end justify-center gap-2 h-32">
                    {[40, 65, 85, 55, 30, 20, 45, 70].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${height}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className={`w-6 rounded-t ${
                          height > 60 ? 'bg-destructive' : height > 40 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Top Factors */}
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <h4 className="text-sm font-medium text-foreground mb-4">Top Churn Factors</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Contract Type', value: 78 },
                      { name: 'Tenure', value: 65 },
                      { name: 'Support Calls', value: 52 },
                      { name: 'Monthly Charges', value: 41 },
                    ].map((factor, i) => (
                      <div key={factor.name} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-28">{factor.name}</span>
                        <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${factor.value}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 + i * 0.1 }}
                            className="h-full bg-primary rounded"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table preview */}
              <div className="rounded-xl bg-secondary/30 border border-border overflow-hidden">
                <div className="p-3 border-b border-border">
                  <h4 className="text-sm font-medium text-foreground">High-Risk Customers</h4>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { id: '#1234', risk: '92%', revenue: '$89/mo', contract: 'Monthly' },
                    { id: '#5678', risk: '87%', revenue: '$125/mo', contract: 'Monthly' },
                    { id: '#9012', risk: '81%', revenue: '$67/mo', contract: 'One Year' },
                  ].map((customer, i) => (
                    <motion.div
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="p-3 flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground font-medium">{customer.id}</span>
                      <span className="text-destructive font-medium">{customer.risk}</span>
                      <span className="text-muted-foreground">{customer.revenue}</span>
                      <span className="px-2 py-1 rounded text-xs bg-destructive/10 text-destructive">
                        {customer.contract}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Decorative glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-3xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
