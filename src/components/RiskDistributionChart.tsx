import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChurnInsights } from '@/types/customer';

interface RiskDistributionChartProps {
  insights: ChurnInsights;
}

export function RiskDistributionChart({ insights }: RiskDistributionChartProps) {
  const data = [
    { name: 'High Risk', value: insights.highRiskCount, color: 'hsl(0, 84%, 60%)' },
    { name: 'Medium Risk', value: insights.mediumRiskCount, color: 'hsl(38, 92%, 50%)' },
    { name: 'Low Risk', value: insights.lowRiskCount, color: 'hsl(152, 69%, 45%)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Risk Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 10%)',
                border: '1px solid hsl(222, 47%, 16%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 98%)',
              }}
              formatter={(value: number, name: string) => [
                `${value} customers (${((value / insights.totalCustomers) * 100).toFixed(1)}%)`,
                name
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
