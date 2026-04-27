import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, BarChart, Bar, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { Activity, Clock, Sparkles, GitCompare, TrendingDown, AlertOctagon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Customer, ChurnInsights, KaplanMeierCurve } from '@/types/customer';

interface Props {
  customers: Customer[];
  insights: ChurnInsights;
}

const SEGMENT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--risk-high))',
  'hsl(var(--risk-medium))',
  'hsl(var(--risk-low))',
  'hsl(var(--accent))',
];

export function SurvivalAnalysis({ customers, insights }: Props) {
  const [segmentType, setSegmentType] = useState<'Contract' | 'Internet'>('Contract');

  const km: KaplanMeierCurve[] = useMemo(() => {
    const all = (insights.kaplanMeier ?? []) as KaplanMeierCurve[];
    return all.filter((c) => c.segmentType === segmentType);
  }, [insights.kaplanMeier, segmentType]);

  // Build a single chart-ready dataset from the KM curves
  const kmChartData = useMemo(() => {
    if (!km.length) return [];
    const horizon = km[0].points.length;
    const rows: Record<string, number>[] = [];
    for (let t = 0; t < horizon; t++) {
      const row: Record<string, number> = { t };
      km.forEach((c) => {
        row[c.segment] = +(c.points[t]?.survival ?? 1) * 100;
      });
      rows.push(row);
    }
    return rows;
  }, [km]);

  // Top 5 customers with shortest expected lifetime
  const topAtRisk = useMemo(() => {
    return [...customers]
      .filter((c) => c.expectedTenureMonths !== undefined)
      .sort((a, b) => (a.expectedTenureMonths ?? 99) - (b.expectedTenureMonths ?? 99))
      .slice(0, 5);
  }, [customers]);

  // Median survival distribution histogram (months buckets)
  const medianHistogram = useMemo(() => {
    const buckets: Record<string, number> = {
      '0-6': 0, '6-12': 0, '12-24': 0, '24-36': 0, '36-48': 0, '48-72': 0, '72+': 0,
    };
    customers.forEach((c) => {
      const m = c.medianSurvivalMonths ?? 72;
      if (m < 6) buckets['0-6']++;
      else if (m < 12) buckets['6-12']++;
      else if (m < 24) buckets['12-24']++;
      else if (m < 36) buckets['24-36']++;
      else if (m < 48) buckets['36-48']++;
      else if (m < 72) buckets['48-72']++;
      else buckets['72+']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [customers]);

  // Engagement Slope vs churn scatter (momentum)
  const engagementScatter = useMemo(() => {
    return customers.map((c) => ({
      slope: +((c.engagementSlope ?? 0) * 30).toFixed(2),
      prob: +(c.churnProbability * 100).toFixed(1),
      risk: c.riskLevel,
    }));
  }, [customers]);

  // Average engineered features for high vs low risk
  const featureCompare = useMemo(() => {
    const high = customers.filter((c) => c.riskLevel === 'high');
    const low = customers.filter((c) => c.riskLevel === 'low');
    const avg = (arr: Customer[], key: (c: Customer) => number) =>
      arr.length ? +(arr.reduce((s, c) => s + key(c), 0) / arr.length).toFixed(2) : 0;
    return [
      {
        feature: 'Engagement Slope (logins/mo)',
        High: avg(high, (c) => (c.engagementSlope ?? 0) * 30),
        Low: avg(low, (c) => (c.engagementSlope ?? 0) * 30),
      },
      {
        feature: 'Inactivity Gap (days)',
        High: avg(high, (c) => c.inactivityGap ?? 0),
        Low: avg(low, (c) => c.inactivityGap ?? 0),
      },
      {
        feature: 'Feature Diversity (/10)',
        High: avg(high, (c) => (c.uniqueFeaturesUsed ?? 0)),
        Low: avg(low, (c) => (c.uniqueFeaturesUsed ?? 0)),
      },
      {
        feature: 'Support-to-Usage (%)',
        High: avg(high, (c) => (c.supportToUsageRatio ?? 0) * 100),
        Low: avg(low, (c) => (c.supportToUsageRatio ?? 0) * 100),
      },
    ];
  }, [customers]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Headline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Survival Analysis</h2>
            <Badge variant="outline" className="ml-2">Cox-lite + Kaplan-Meier</Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Instead of asking <em>"will they churn?"</em>, this view answers <em>"when?"</em> using
            survival curves derived from a Cox proportional-hazards-style model with a Kaplan-Meier
            baseline hazard. Censored customers (still active) are handled correctly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cohort median survival:</span>
          <Badge className="bg-primary/15 text-primary border-primary/30">
            {insights.medianSurvivalMonths ?? '—'} months
          </Badge>
        </div>
      </div>

      {/* KM curves by segment */}
      <Card className="p-6 bg-card/60 backdrop-blur border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-primary" />
              Kaplan-Meier Survival Curves
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Probability that a customer in each segment is still active after t months.
            </p>
          </div>
          <Select value={segmentType} onValueChange={(v) => setSegmentType(v as 'Contract' | 'Internet')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Contract">By Contract Type</SelectItem>
              <SelectItem value="Internet">By Internet Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={kmChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="t"
                stroke="hsl(var(--muted-foreground))"
                label={{ value: 'Months', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                domain={[0, 100]}
                label={{ value: 'Survival %', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                formatter={(val: number) => [`${val.toFixed(1)}%`, '']}
                labelFormatter={(t) => `Month ${t}`}
              />
              <Legend />
              {km.map((c, i) => (
                <Line
                  key={c.segment}
                  type="monotone"
                  dataKey={c.segment}
                  stroke={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  name={`${c.segment} (n=${c.sampleSize}, med=${c.medianSurvival >= 72 ? '72+' : c.medianSurvival + 'mo'})`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two-column: time-to-churn distribution + top at-risk */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/60 backdrop-blur border-border">
          <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-risk-medium" />
            Time-to-Churn Distribution
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Customers grouped by predicted median survival.
          </p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={medianHistogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-card/60 backdrop-blur border-border">
          <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-risk-high" />
            Shortest Expected Lifetime
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Customers whose Cox-lite model predicts the soonest churn.
          </p>
          <div className="space-y-2">
            {topAtRisk.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border"
              >
                <div>
                  <div className="text-sm font-mono text-foreground">{c.id}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.contractType} • {c.internetService} • ${c.monthlyCharges.toFixed(0)}/mo
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-risk-high">
                    ~{c.expectedTenureMonths?.toFixed(1)} mo
                  </div>
                  <div className="text-xs text-muted-foreground">
                    HR {c.hazardRatio?.toFixed(2)}× • median {c.medianSurvivalMonths}mo
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Engineered features section */}
      <Card className="p-6 bg-card/60 backdrop-blur border-border">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Engineered Behavioral Signals</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-6 max-w-3xl">
          Four behavioral features that often predict churn better than raw counts. Compare averages
          for high-risk vs low-risk customers.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureCompare} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  dataKey="feature"
                  type="category"
                  stroke="hsl(var(--muted-foreground))"
                  width={170}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                />
                <Legend />
                <Bar dataKey="High" fill="hsl(var(--risk-high))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Low" fill="hsl(var(--risk-low))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 text-sm">
            <FeatureExplain
              title="Engagement Slope (Momentum)"
              formula="(LoginsM2 − LoginsM1) / 30"
              insight="A user dropping from 100 to 50 logins is much riskier than one growing from 2 to 10."
            />
            <FeatureExplain
              title="Inactivity Gap (Recency)"
              formula="days since last action"
              insight="Often the single strongest predictor. Wider than typical gap = likely already gone."
            />
            <FeatureExplain
              title="Feature Diversity"
              formula="unique features used / total"
              insight="Shallow integration is easy to leave. Five features = much higher switching cost."
            />
            <FeatureExplain
              title="Support-to-Usage Ratio"
              formula="tickets / sessions"
              insight="High tickets aren't always bad — but combined with dropping usage = red flag."
            />
          </div>
        </div>

        <div className="h-64 mt-8">
          <h4 className="text-sm font-medium text-foreground mb-2">
            Engagement Slope vs Churn Probability
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="slope"
                name="Slope"
                stroke="hsl(var(--muted-foreground))"
                label={{ value: 'Logins delta / month', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                dataKey="prob"
                name="Churn %"
                stroke="hsl(var(--muted-foreground))"
                domain={[0, 100]}
              />
              <ZAxis range={[40, 40]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                formatter={(v: number, name: string) =>
                  name === 'prob' ? [`${v.toFixed(1)}%`, 'Churn'] : [v, name]
                }
              />
              <Scatter
                data={engagementScatter.filter((d) => d.risk === 'high')}
                fill="hsl(var(--risk-high))"
                name="High risk"
              />
              <Scatter
                data={engagementScatter.filter((d) => d.risk === 'medium')}
                fill="hsl(var(--risk-medium))"
                name="Medium risk"
              />
              <Scatter
                data={engagementScatter.filter((d) => d.risk === 'low')}
                fill="hsl(var(--risk-low))"
                name="Low risk"
              />
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}

function FeatureExplain({ title, formula, insight }: { title: string; formula: string; insight: string }) {
  return (
    <div className="p-3 rounded-lg bg-secondary/30 border border-border">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <code className="block text-xs font-mono text-primary mt-1">{formula}</code>
      <div className="text-xs text-muted-foreground mt-1">{insight}</div>
    </div>
  );
}
