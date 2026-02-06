import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { ChurnInsights } from '@/types/customer';

interface FeatureImportanceChartProps {
  insights: ChurnInsights;
}

export function FeatureImportanceChart({ insights }: FeatureImportanceChartProps) {
  const data = insights.topChurnFactors.map(factor => ({
    name: factor.factor,
    importance: (factor.importance * 100).toFixed(1),
    value: factor.importance * 100,
  }));

  const colors = [
    'hsl(217, 91%, 60%)',
    'hsl(217, 91%, 55%)',
    'hsl(217, 91%, 50%)',
    'hsl(217, 91%, 45%)',
    'hsl(217, 91%, 40%)',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Top Churn Factors</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Average feature importance across all predictions
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <XAxis 
              type="number" 
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(222, 47%, 16%)' }}
              tickLine={{ stroke: 'hsl(222, 47%, 16%)' }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fill: 'hsl(210, 40%, 98%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(222, 47%, 16%)' }}
              tickLine={{ stroke: 'hsl(222, 47%, 16%)' }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 10%)',
                border: '1px solid hsl(222, 47%, 16%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 98%)',
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Importance']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
