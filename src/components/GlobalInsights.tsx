import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer, ChurnInsights } from '@/types/customer';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface GlobalInsightsProps {
  customers: Customer[];
  insights: ChurnInsights;
}

export function GlobalInsights({ customers, insights }: GlobalInsightsProps) {
  // Contract type distribution
  const contractData = [
    { name: 'Monthly', value: customers.filter(c => c.contractType === 'Monthly').length },
    { name: 'One Year', value: customers.filter(c => c.contractType === 'One Year').length },
    { name: 'Two Year', value: customers.filter(c => c.contractType === 'Two Year').length },
  ];

  // Internet service distribution
  const internetData = [
    { name: 'Fiber', value: customers.filter(c => c.internetService === 'Fiber').length },
    { name: 'DSL', value: customers.filter(c => c.internetService === 'DSL').length },
    { name: 'None', value: customers.filter(c => c.internetService === 'None').length },
  ];

  // Churn by contract type
  const churnByContract = [
    { 
      name: 'Monthly', 
      churnRate: customers.filter(c => c.contractType === 'Monthly').reduce((acc, c) => acc + c.churnProbability, 0) / 
        Math.max(1, customers.filter(c => c.contractType === 'Monthly').length) * 100
    },
    { 
      name: 'One Year', 
      churnRate: customers.filter(c => c.contractType === 'One Year').reduce((acc, c) => acc + c.churnProbability, 0) / 
        Math.max(1, customers.filter(c => c.contractType === 'One Year').length) * 100
    },
    { 
      name: 'Two Year', 
      churnRate: customers.filter(c => c.contractType === 'Two Year').reduce((acc, c) => acc + c.churnProbability, 0) / 
        Math.max(1, customers.filter(c => c.contractType === 'Two Year').length) * 100
    },
  ];

  // Revenue at risk by segment
  const revenueByRisk = [
    { name: 'High Risk', revenue: customers.filter(c => c.riskLevel === 'high').reduce((acc, c) => acc + c.monthlyCharges * 12 * c.churnProbability, 0) },
    { name: 'Medium Risk', revenue: customers.filter(c => c.riskLevel === 'medium').reduce((acc, c) => acc + c.monthlyCharges * 12 * c.churnProbability, 0) },
    { name: 'Low Risk', revenue: customers.filter(c => c.riskLevel === 'low').reduce((acc, c) => acc + c.monthlyCharges * 12 * c.churnProbability, 0) },
  ];

  // Top risky customers by revenue
  const topRiskyByRevenue = customers
    .filter(c => c.riskLevel === 'high')
    .sort((a, b) => (b.monthlyCharges * b.churnProbability) - (a.monthlyCharges * a.churnProbability))
    .slice(0, 5);

  const COLORS = ['hsl(var(--destructive))', 'hsl(var(--primary))', 'hsl(var(--accent))'];
  const RISK_COLORS = ['hsl(var(--destructive))', 'hsl(45, 93%, 47%)', 'hsl(var(--accent))'];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Global Model Insights</h2>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Churn by Contract Type */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Churn Rate by Contract
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={churnByContract}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Avg Churn Rate']}
                />
                <Bar dataKey="churnRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contract Distribution */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              Contract Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <RechartsPie>
                <Pie
                  data={contractData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {contractData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue at Risk by Segment */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Revenue at Risk by Segment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pt-2">
              {revenueByRisk.map((item, index) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium text-foreground">${(item.revenue / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.revenue / Math.max(...revenueByRisk.map(r => r.revenue))) * 100}%` }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: RISK_COLORS[index] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Risky Customers by Revenue */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top High-Risk Customers by Revenue Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
            {topRiskyByRevenue.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl bg-destructive/10 border border-destructive/20"
              >
                <div className="text-sm font-medium text-foreground mb-1">
                  Customer {customer.id}
                </div>
                <div className="text-2xl font-bold text-destructive">
                  {(customer.churnProbability * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ${customer.monthlyCharges.toFixed(0)}/mo at risk
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}