import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Legend, Cell,
} from 'recharts';
import {
  Network, Lightbulb, GitCompare, Wallet, ArrowRight, Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Customer } from '@/types/customer';

interface Props {
  customers: Customer[];
}

/* ----------------------------- helpers ----------------------------- */

const RETENTION_LIFT = 0.35; // % risk reduction from a successful intervention
const CLV_HORIZON_MONTHS = 24;

function segmentKey(c: Customer) {
  return `${c.contractType} · ${c.internetService}`;
}

/** Counterfactual: pick the highest positive-impact SHAP feature and suggest
 *  a realistic change that would reduce churn probability the most. */
function counterfactual(c: Customer) {
  const positive = [...c.shapValues].filter((s) => s.impact > 0).sort((a, b) => b.impact - a.impact);
  const top = positive[0];
  if (!top) return null;

  let change = '';
  let newProb = c.churnProbability;
  const f = top.feature.toLowerCase();

  if (f.includes('contract')) {
    if (c.contractType === 'Monthly') { change = 'Upgrade contract → One Year'; newProb = Math.max(0.05, c.churnProbability - 0.45); }
    else if (c.contractType === 'One Year') { change = 'Upgrade contract → Two Year'; newProb = Math.max(0.04, c.churnProbability - 0.35); }
  } else if (f.includes('support')) {
    change = 'Proactive support follow-up (resolve open tickets)';
    newProb = Math.max(0.06, c.churnProbability - 0.30);
  } else if (f.includes('tenure')) {
    change = 'Loyalty bonus + service review at month 6';
    newProb = Math.max(0.08, c.churnProbability - 0.22);
  } else if (f.includes('monthly') || f.includes('charges')) {
    change = 'Apply 10% loyalty discount on monthly charges';
    newProb = Math.max(0.07, c.churnProbability - 0.20);
  } else if (f.includes('payment')) {
    change = 'Migrate to auto-pay (credit card / bank transfer)';
    newProb = Math.max(0.07, c.churnProbability - 0.18);
  } else if (f.includes('internet') || f.includes('fiber')) {
    change = 'Service quality audit on fiber connection';
    newProb = Math.max(0.08, c.churnProbability - 0.20);
  } else {
    change = `Address top driver: ${top.feature}`;
    newProb = Math.max(0.1, c.churnProbability - 0.18);
  }

  return {
    driver: top.feature,
    change,
    newProb,
    delta: c.churnProbability - newProb,
  };
}

/* ============================ component =========================== */

export function SegmentIntelligence({ customers }: Props) {
  const [budget, setBudget] = useState<number>(5000);
  const [costPerCustomer, setCostPerCustomer] = useState<number>(75);

  /* ----- 1. Network-Aware: cluster by (contract, internet) ----- */
  const clusters = useMemo(() => {
    const map = new Map<string, Customer[]>();
    customers.forEach((c) => {
      const k = segmentKey(c);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    });
    return Array.from(map.entries())
      .map(([key, list]) => {
        const size = list.length;
        const avgRisk = list.reduce((s, c) => s + c.churnProbability, 0) / size;
        const highShare = list.filter((c) => c.riskLevel === 'high').length / size;
        const revAtRisk = list.reduce((s, c) => s + c.monthlyCharges * 12 * c.churnProbability, 0);
        // contagion = high-risk share × log(size) — bigger dense pockets propagate more
        const contagion = highShare * Math.log2(size + 1);
        return { key, size, avgRisk, highShare, revAtRisk, contagion };
      })
      .sort((a, b) => b.contagion - a.contagion);
  }, [customers]);

  const maxContagion = Math.max(...clusters.map((c) => c.contagion), 0.0001);

  /* ----- 2. Counterfactuals on top high-risk customers ----- */
  const counterfactuals = useMemo(() => {
    return customers
      .filter((c) => c.riskLevel === 'high')
      .map((c) => ({ customer: c, cf: counterfactual(c) }))
      .filter((x) => x.cf && x.cf.delta > 0.05)
      .sort((a, b) => (b.cf!.delta * b.customer.monthlyCharges) - (a.cf!.delta * a.customer.monthlyCharges))
      .slice(0, 8);
  }, [customers]);

  /* ----- 3. Survival vs ML comparison ----- */
  const modelCompare = useMemo(() => {
    // ML probability vs Survival hazard ratio (proxy for time-based risk)
    return customers
      .filter((c) => c.hazardRatio !== undefined && c.medianSurvivalMonths !== undefined)
      .map((c) => ({
        ml: +(c.churnProbability * 100).toFixed(1),
        // survival risk = 1 - S(12 months); approximated from median survival
        survival: +(Math.max(0, Math.min(100,
          (1 - Math.pow(0.5, 12 / Math.max(1, c.medianSurvivalMonths!))) * 100
        )).toFixed(1)),
        risk: c.riskLevel,
      }));
  }, [customers]);

  // Concordance: fraction where the two models agree on ranking direction
  const concordance = useMemo(() => {
    if (modelCompare.length < 2) return 0;
    let agree = 0, total = 0;
    for (let i = 0; i < Math.min(200, modelCompare.length); i++) {
      for (let j = i + 1; j < Math.min(200, modelCompare.length); j++) {
        total++;
        const a = modelCompare[i], b = modelCompare[j];
        if ((a.ml > b.ml) === (a.survival > b.survival)) agree++;
      }
    }
    return total ? (agree / total) * 100 : 0;
  }, [modelCompare]);

  /* ----- 4. Intervention optimization (greedy by ROI / $) ----- */
  const allocation = useMemo(() => {
    const candidates = customers
      .filter((c) => c.churnProbability > 0.4)
      .map((c) => {
        const clv = c.monthlyCharges * CLV_HORIZON_MONTHS;
        const expectedSave = clv * c.churnProbability * RETENTION_LIFT;
        const roi = (expectedSave - costPerCustomer) / costPerCustomer;
        return { customer: c, clv, expectedSave, roi };
      })
      .filter((x) => x.roi > 0)
      .sort((a, b) => b.roi - a.roi);

    let spent = 0;
    let saved = 0;
    const picked: typeof candidates = [];
    for (const cand of candidates) {
      if (spent + costPerCustomer > budget) break;
      picked.push(cand);
      spent += costPerCustomer;
      saved += cand.expectedSave;
    }
    return {
      picked,
      spent,
      saved,
      roi: spent > 0 ? ((saved - spent) / spent) * 100 : 0,
      coverage: picked.length,
      eligible: candidates.length,
    };
  }, [customers, budget, costPerCustomer]);

  /* =============================== UI =============================== */

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Segment Intelligence</h2>
          <Badge variant="outline" className="ml-2 text-foreground">4 advanced lenses</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Network-aware clustering, counterfactual recommendations, model comparison, and
          ROI-optimized retention budgeting — all computed across your customer segments.
        </p>
      </div>

      {/* 1. NETWORK-AWARE */}
      <Card className="p-6 bg-card/60 backdrop-blur border-border">
        <div className="flex items-center gap-2 mb-1">
          <Network className="w-4 h-4 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Network-Aware Churn Clusters</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Customers grouped by Contract × Internet. <strong className="text-foreground">Contagion score</strong> = high-risk share weighted by cluster size — dense risky pockets propagate churn fastest.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clusters.map((c) => {
            const intensity = c.contagion / maxContagion;
            return (
              <div
                key={c.key}
                className="p-4 rounded-lg border border-border bg-secondary/30 relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--risk-high) / ${intensity}), transparent)`,
                  }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-foreground">{c.key}</div>
                    <Badge
                      className={
                        intensity > 0.66
                          ? 'bg-risk-high/20 text-risk-high border-risk-high/40'
                          : intensity > 0.33
                          ? 'bg-risk-medium/20 text-risk-medium border-risk-medium/40'
                          : 'bg-risk-low/20 text-risk-low border-risk-low/40'
                      }
                    >
                      {(c.contagion).toFixed(2)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">Size</div>
                      <div className="text-foreground font-medium">{c.size}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg risk</div>
                      <div className="text-foreground font-medium">{(c.avgRisk * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">High%</div>
                      <div className="text-foreground font-medium">{(c.highShare * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Revenue at risk: <span className="text-foreground font-medium">${(c.revAtRisk / 1000).toFixed(1)}K</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. COUNTERFACTUALS */}
      <Card className="p-6 bg-card/60 backdrop-blur border-border">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="w-4 h-4 text-risk-medium" />
          <h3 className="text-lg font-semibold text-foreground">Counterfactual Insights</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Minimal viable change per customer that would meaningfully reduce churn risk — derived from each customer's top SHAP driver.
        </p>

        <div className="space-y-2">
          {counterfactuals.map(({ customer, cf }) => (
            <div
              key={customer.id}
              className="grid grid-cols-1 md:grid-cols-[120px_1fr_auto] items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
            >
              <div>
                <div className="text-sm font-mono text-foreground">{customer.id}</div>
                <div className="text-xs text-muted-foreground">${customer.monthlyCharges.toFixed(0)}/mo</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">
                  Driver: <span className="text-foreground">{cf!.driver}</span>
                </div>
                <div className="text-sm text-foreground truncate">{cf!.change}</div>
              </div>
              <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                <span className="text-risk-high font-semibold">{(customer.churnProbability * 100).toFixed(0)}%</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-risk-low font-semibold">{(cf!.newProb * 100).toFixed(0)}%</span>
                <Badge variant="outline" className="ml-1 text-foreground">−{(cf!.delta * 100).toFixed(0)}pts</Badge>
              </div>
            </div>
          ))}
          {!counterfactuals.length && (
            <div className="text-sm text-muted-foreground">No high-risk customers with actionable counterfactuals.</div>
          )}
        </div>
      </Card>

      {/* 3. MODEL COMPARISON */}
      <Card className="p-6 bg-card/60 backdrop-blur border-border">
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Predictive Modeling Comparison</h3>
          </div>
          <Badge className="bg-primary/15 text-primary border-primary/30">
            Concordance {concordance.toFixed(0)}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          ML classifier (Gradient Boosting-style logit) vs Survival model (1 − S(12 mo) from Cox-lite).
          Points along the diagonal = both models agree.
        </p>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number" dataKey="ml" name="ML"
                domain={[0, 100]} stroke="hsl(var(--muted-foreground))"
                label={{ value: 'ML churn probability (%)', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                type="number" dataKey="survival" name="Survival"
                domain={[0, 100]} stroke="hsl(var(--muted-foreground))"
                label={{ value: '1 − S(12mo) (%)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
              />
              <ZAxis range={[36, 36]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Scatter name="High risk" data={modelCompare.filter((d) => d.risk === 'high')} fill="hsl(var(--risk-high))" />
              <Scatter name="Medium risk" data={modelCompare.filter((d) => d.risk === 'medium')} fill="hsl(var(--risk-medium))" />
              <Scatter name="Low risk" data={modelCompare.filter((d) => d.risk === 'low')} fill="hsl(var(--risk-low))" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <div className="text-foreground font-semibold mb-1">ML (Gradient Boosting)</div>
            <div className="text-muted-foreground">
              Strong at point-in-time classification. Less informative on <em>when</em> churn happens.
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <div className="text-foreground font-semibold mb-1">Survival (Cox-lite + KM)</div>
            <div className="text-muted-foreground">
              Time-aware, handles censored data, produces a full survival curve per customer.
            </div>
          </div>
        </div>
      </Card>

      {/* 4. INTERVENTION OPTIMIZATION */}
      <Card className="p-6 bg-card/60 backdrop-blur border-border">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-risk-low" />
          <h3 className="text-lg font-semibold text-foreground">Intervention Optimization</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Allocate a retention budget across at-risk customers to maximize expected ROI.
          ROI = CLV × churn risk × {Math.round(RETENTION_LIFT * 100)}% lift − cost per intervention.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-foreground">Total budget</span>
                <span className="text-foreground font-semibold">${budget.toLocaleString()}</span>
              </div>
              <Slider
                min={500} max={50000} step={500}
                value={[budget]} onValueChange={(v) => setBudget(v[0])}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-foreground">Cost per intervention</span>
                <span className="text-foreground font-semibold">${costPerCustomer}</span>
              </div>
              <Slider
                min={20} max={300} step={5}
                value={[costPerCustomer]} onValueChange={(v) => setCostPerCustomer(v[0])}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Stat label="Customers funded" value={`${allocation.coverage} / ${allocation.eligible}`} />
              <Stat label="Budget used" value={`$${allocation.spent.toLocaleString()}`} />
              <Stat label="Expected revenue saved" value={`$${Math.round(allocation.saved).toLocaleString()}`} accent="text-risk-low" />
              <Stat label="Net ROI" value={`${allocation.roi.toFixed(0)}%`} accent="text-primary" />
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={allocation.picked.slice(0, 12).map((p) => ({
                  id: p.customer.id,
                  save: Math.round(p.expectedSave),
                  roi: +p.roi.toFixed(1),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="id" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }}
                  formatter={(v: number, n: string) => n === 'save' ? [`$${v.toLocaleString()}`, 'Expected save'] : [`${v}×`, 'ROI']}
                />
                <Bar dataKey="save" radius={[6, 6, 0, 0]}>
                  {allocation.picked.slice(0, 12).map((p, i) => (
                    <Cell key={i} fill={p.roi > 3 ? 'hsl(var(--risk-low))' : 'hsl(var(--primary))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-3 rounded-lg bg-secondary/30 border border-border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${accent ?? 'text-foreground'}`}>{value}</div>
    </div>
  );
}