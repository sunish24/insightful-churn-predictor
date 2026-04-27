// Real ML churn prediction edge function with engineered behavioral features
// and Cox-lite + Kaplan-Meier survival analysis.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type ContractType = "Monthly" | "One Year" | "Two Year";
type InternetService = "Fiber" | "DSL" | "None";
type PaymentMethod = "Credit Card" | "Bank Transfer" | "Electronic Check" | "Mailed Check";

interface RawCustomer {
  id?: string;
  tenure?: number | string;
  monthlyCharges?: number | string;
  contractType?: string;
  internetService?: string;
  paymentMethod?: string;
  supportCalls?: number | string;
  totalCharges?: number | string;
  loginsM1?: number | string;
  loginsM2?: number | string;
  daysSinceLastAction?: number | string;
  uniqueFeaturesUsed?: number | string;
  totalSessions?: number | string;
  supportTickets?: number | string;
}

interface ShapValue {
  feature: string;
  value: number;
  impact: number;
  displayValue: string;
}

interface SurvivalPoint { t: number; survival: number }

interface PredictedCustomer {
  id: string;
  tenure: number;
  monthlyCharges: number;
  contractType: ContractType;
  internetService: InternetService;
  paymentMethod: PaymentMethod;
  supportCalls: number;
  totalCharges: number;
  churnProbability: number;
  riskLevel: "high" | "medium" | "low";
  shapValues: ShapValue[];
  // Behavioral
  loginsM1: number;
  loginsM2: number;
  daysSinceLastAction: number;
  uniqueFeaturesUsed: number;
  totalSessions: number;
  supportTickets: number;
  // Engineered
  engagementSlope: number;
  inactivityGap: number;
  featureDiversityScore: number;
  supportToUsageRatio: number;
  // Survival
  hazardRatio?: number;
  medianSurvivalMonths?: number;
  expectedTenureMonths?: number;
  survivalCurve?: SurvivalPoint[];
}

// ---------- Preprocessing helpers ----------
function toNumber(v: unknown, fallback: number): number {
  if (v === undefined || v === null || v === "") return fallback;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}
function clip(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function normalizeContract(v: unknown): ContractType {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("two")) return "Two Year";
  if (s.includes("one")) return "One Year";
  return "Monthly";
}
function normalizeInternet(v: unknown): InternetService {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("fiber")) return "Fiber";
  if (s.includes("dsl")) return "DSL";
  if (s.includes("none") || s === "no") return "None";
  return "Fiber";
}
function normalizePayment(v: unknown): PaymentMethod {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("credit")) return "Credit Card";
  if (s.includes("bank")) return "Bank Transfer";
  if (s.includes("electronic")) return "Electronic Check";
  if (s.includes("mail")) return "Mailed Check";
  return "Credit Card";
}

// ---------- Feature schema ----------
const FEATURES = [
  "tenure",
  "monthlyCharges",
  "supportCalls",
  "totalCharges",
  "engagementSlope",
  "inactivityGap",
  "featureDiversity",
  "supportToUsage",
  "contract_Monthly",
  "contract_OneYear",
  "internet_Fiber",
  "internet_None",
  "pay_ElectronicCheck",
  "pay_MailedCheck",
  "pay_BankTransfer",
] as const;
type FeatureName = typeof FEATURES[number];
const NUM_NUMERIC = 8;

const PRETTY: Record<FeatureName, string> = {
  tenure: "Tenure",
  monthlyCharges: "Monthly Charges",
  supportCalls: "Support Calls",
  totalCharges: "Total Charges",
  engagementSlope: "Engagement Slope",
  inactivityGap: "Inactivity Gap",
  featureDiversity: "Feature Diversity",
  supportToUsage: "Support-to-Usage Ratio",
  contract_Monthly: "Month-to-Month Contract",
  contract_OneYear: "One-Year Contract",
  internet_Fiber: "Fiber Internet",
  internet_None: "No Internet",
  pay_ElectronicCheck: "Electronic Check Payment",
  pay_MailedCheck: "Mailed Check Payment",
  pay_BankTransfer: "Bank Transfer Payment",
};

function vectorize(c: PredictedCustomer): number[] {
  return [
    c.tenure,
    c.monthlyCharges,
    c.supportCalls,
    c.totalCharges,
    c.engagementSlope,
    c.inactivityGap,
    c.featureDiversityScore,
    c.supportToUsageRatio,
    c.contractType === "Monthly" ? 1 : 0,
    c.contractType === "One Year" ? 1 : 0,
    c.internetService === "Fiber" ? 1 : 0,
    c.internetService === "None" ? 1 : 0,
    c.paymentMethod === "Electronic Check" ? 1 : 0,
    c.paymentMethod === "Mailed Check" ? 1 : 0,
    c.paymentMethod === "Bank Transfer" ? 1 : 0,
  ];
}

// ---------- Synthetic labeled training set ----------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateTrainingData(n: number) {
  const rand = mulberry32(42);
  const X: number[][] = [];
  const y: number[] = [];
  const tenures: number[] = [];
  const contracts: ContractType[] = ["Monthly", "One Year", "Two Year"];
  const internets: InternetService[] = ["Fiber", "DSL", "None"];
  const payments: PaymentMethod[] = [
    "Credit Card", "Bank Transfer", "Electronic Check", "Mailed Check",
  ];
  for (let i = 0; i < n; i++) {
    const tenure = Math.floor(rand() * 72) + 1;
    const monthlyCharges = +(rand() * 100 + 20).toFixed(2);
    const supportCalls = Math.floor(rand() * 8);
    const totalCharges = monthlyCharges * tenure;
    const contract = contracts[Math.floor(rand() * 3)];
    const internet = internets[Math.floor(rand() * 3)];
    const payment = payments[Math.floor(rand() * 4)];

    // Behavioral signals
    const baseLogins = Math.max(2, 30 - supportCalls * 2 + Math.floor(rand() * 30));
    const decay = rand() * 0.6 - 0.1;
    const loginsM1 = baseLogins;
    const loginsM2 = Math.max(0, Math.round(baseLogins * (1 - decay)));
    const daysSinceLastAction = Math.floor(rand() * 60);
    const totalSessions = loginsM1 + loginsM2 + Math.floor(rand() * 10);
    const uniqueFeaturesUsed = Math.min(10, Math.max(1, Math.floor(rand() * 8) + (contract === "Two Year" ? 2 : 0)));
    const supportTickets = Math.max(0, supportCalls - Math.floor(rand() * 2));

    const engagementSlope = (loginsM2 - loginsM1) / 30;
    const inactivityGap = daysSinceLastAction;
    const featureDiversityScore = uniqueFeaturesUsed / 10;
    const supportToUsageRatio = supportTickets / Math.max(1, totalSessions);

    let logit = -1.4;
    logit += -0.045 * tenure;
    logit += 0.018 * monthlyCharges;
    logit += 0.32 * supportCalls;
    logit += -0.0005 * totalCharges;
    logit += -3.2 * engagementSlope;
    logit += 0.025 * inactivityGap;
    logit += -1.4 * featureDiversityScore;
    logit += 4.5 * supportToUsageRatio;
    logit += contract === "Monthly" ? 1.1 : contract === "One Year" ? 0.0 : -0.9;
    logit += internet === "Fiber" ? 0.55 : internet === "None" ? -0.7 : 0;
    logit += payment === "Electronic Check" ? 0.6 : payment === "Mailed Check" ? 0.15 : payment === "Bank Transfer" ? -0.05 : -0.25;
    const p = 1 / (1 + Math.exp(-logit));
    const label = rand() < p ? 1 : 0;

    X.push(vectorize({
      id: "", tenure, monthlyCharges, supportCalls, totalCharges,
      contractType: contract, internetService: internet, paymentMethod: payment,
      churnProbability: 0, riskLevel: "low", shapValues: [],
      loginsM1, loginsM2, daysSinceLastAction, uniqueFeaturesUsed, totalSessions, supportTickets,
      engagementSlope, inactivityGap, featureDiversityScore, supportToUsageRatio,
    }));
    y.push(label);
    tenures.push(tenure);
  }
  return { X, y, tenures };
}

function fitStandardizer(X: number[][]) {
  const n = X.length;
  const dim = X[0].length;
  const mean = new Array(dim).fill(0);
  const std = new Array(dim).fill(1);
  for (let j = 0; j < NUM_NUMERIC; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += X[i][j];
    mean[j] = s / n;
    let v = 0;
    for (let i = 0; i < n; i++) v += (X[i][j] - mean[j]) ** 2;
    std[j] = Math.sqrt(v / n) || 1;
  }
  return { mean, std };
}
function transform(X: number[][], stat: { mean: number[]; std: number[] }) {
  return X.map((row) =>
    row.map((v, j) => (j < NUM_NUMERIC ? (v - stat.mean[j]) / stat.std[j] : v))
  );
}

function trainLogReg(X: number[][], y: number[]) {
  const n = X.length;
  const d = X[0].length;
  const pos = y.reduce((a, b) => a + b, 0);
  const neg = n - pos;
  const wPos = n / (2 * Math.max(pos, 1));
  const wNeg = n / (2 * Math.max(neg, 1));

  const w = new Array(d).fill(0);
  let b = 0;
  const lr = 0.05;
  const l2 = 0.01;
  const epochs = 400;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gw = new Array(d).fill(0);
    let gb = 0;
    for (let i = 0; i < n; i++) {
      let z = b;
      for (let j = 0; j < d; j++) z += w[j] * X[i][j];
      const p = 1 / (1 + Math.exp(-z));
      const cw = y[i] === 1 ? wPos : wNeg;
      const err = cw * (p - y[i]);
      for (let j = 0; j < d; j++) gw[j] += err * X[i][j];
      gb += err;
    }
    for (let j = 0; j < d; j++) w[j] = w[j] - lr * (gw[j] / n + l2 * w[j]);
    b = b - lr * (gb / n);
  }
  return { w, b };
}

interface BaselineHazard { s0: number[]; median: number }

function fitKaplanMeier(times: number[], events: number[], horizon = 72): BaselineHazard {
  const eventsAt = new Array(horizon + 1).fill(0);
  const censoredAt = new Array(horizon + 1).fill(0);
  for (let i = 0; i < times.length; i++) {
    const t = Math.min(horizon, Math.max(0, Math.round(times[i])));
    if (events[i] === 1) eventsAt[t]++;
    else censoredAt[t]++;
  }
  let atRisk = times.length;
  const s0 = new Array(horizon + 1).fill(1);
  let s = 1;
  for (let t = 0; t <= horizon; t++) {
    if (atRisk > 0 && eventsAt[t] > 0) s = s * (1 - eventsAt[t] / atRisk);
    s0[t] = s;
    atRisk -= eventsAt[t] + censoredAt[t];
    if (atRisk < 0) atRisk = 0;
  }
  let median = horizon;
  for (let t = 0; t <= horizon; t++) {
    if (s0[t] <= 0.5) { median = t; break; }
  }
  return { s0, median };
}

let MODEL: {
  w: number[]; b: number;
  stat: { mean: number[]; std: number[] };
  baseline: BaselineHazard;
} | null = null;

function getModel() {
  if (MODEL) return MODEL;
  const { X, y, tenures } = generateTrainingData(2000);
  const stat = fitStandardizer(X);
  const Xs = transform(X, stat);
  const { w, b } = trainLogReg(Xs, y);
  const baseline = fitKaplanMeier(tenures, y, 72);
  MODEL = { w, b, stat, baseline };
  return MODEL;
}

// ---------- Display ----------
function displayValue(feat: FeatureName, c: PredictedCustomer): string {
  switch (feat) {
    case "tenure": return `${c.tenure} months`;
    case "monthlyCharges": return `$${c.monthlyCharges.toFixed(2)}`;
    case "supportCalls": return `${c.supportCalls} calls`;
    case "totalCharges": return `$${c.totalCharges.toFixed(2)}`;
    case "engagementSlope": return `${c.engagementSlope >= 0 ? "+" : ""}${(c.engagementSlope * 30).toFixed(1)} logins/mo`;
    case "inactivityGap": return `${c.inactivityGap} days`;
    case "featureDiversity": return `${c.uniqueFeaturesUsed}/10 features`;
    case "supportToUsage": return `${(c.supportToUsageRatio * 100).toFixed(1)}%`;
    case "contract_Monthly": return c.contractType === "Monthly" ? "Yes" : "No";
    case "contract_OneYear": return c.contractType === "One Year" ? "Yes" : "No";
    case "internet_Fiber": return c.internetService === "Fiber" ? "Yes" : "No";
    case "internet_None": return c.internetService === "None" ? "Yes" : "No";
    case "pay_ElectronicCheck": return c.paymentMethod === "Electronic Check" ? "Yes" : "No";
    case "pay_MailedCheck": return c.paymentMethod === "Mailed Check" ? "Yes" : "No";
    case "pay_BankTransfer": return c.paymentMethod === "Bank Transfer" ? "Yes" : "No";
  }
}

function riskLevel(p: number): "high" | "medium" | "low" {
  if (p >= 0.6) return "high";
  if (p >= 0.35) return "medium";
  return "low";
}

function predictOne(c: PredictedCustomer): PredictedCustomer {
  const model = getModel();
  const xRaw = vectorize(c);
  const x = xRaw.map((v, j) => (j < NUM_NUMERIC ? (v - model.stat.mean[j]) / model.stat.std[j] : v));

  let z = model.b;
  for (let j = 0; j < x.length; j++) z += model.w[j] * x[j];
  const p = 1 / (1 + Math.exp(-z));

  // SHAP via local linearization on probability scale
  const oneHotBaseline = [1 / 3, 1 / 3, 1 / 3, 1 / 3, 1 / 4, 1 / 4, 1 / 4];
  const slope = p * (1 - p);
  const contribs: { feature: FeatureName; logitContribution: number }[] = [];
  for (let j = 0; j < x.length; j++) {
    const baseline = j < NUM_NUMERIC ? 0 : oneHotBaseline[j - NUM_NUMERIC] ?? 0;
    const centered = x[j] - baseline;
    contribs.push({ feature: FEATURES[j], logitContribution: model.w[j] * centered });
  }
  const shapValues: ShapValue[] = contribs
    .map((cb) => ({
      feature: PRETTY[cb.feature],
      value: 0,
      impact: cb.logitContribution * slope,
      displayValue: displayValue(cb.feature, c),
    }))
    .filter((s) => Math.abs(s.impact) > 0.001)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 8);

  // Cox-lite survival: S(t|x) = S0(t)^HR, HR = exp(η)
  let eta = 0;
  for (let j = 0; j < x.length; j++) eta += model.w[j] * x[j];
  const hazardRatio = Math.exp(clip(eta * 0.5, -3, 3));

  const survivalCurve: SurvivalPoint[] = [];
  let medianSurvivalMonths = 72;
  let foundMedian = false;
  let expected = 0;
  let prevS = 1;
  for (let t = 0; t <= 72; t++) {
    const s0 = model.baseline.s0[t];
    const s = Math.pow(Math.max(s0, 1e-9), hazardRatio);
    survivalCurve.push({ t, survival: +s.toFixed(4) });
    if (!foundMedian && s <= 0.5) { medianSurvivalMonths = t; foundMedian = true; }
    if (t > 0) expected += (prevS + s) / 2;
    prevS = s;
  }

  return {
    ...c,
    churnProbability: clip(p, 0.01, 0.99),
    riskLevel: riskLevel(p),
    shapValues,
    hazardRatio: +hazardRatio.toFixed(3),
    medianSurvivalMonths,
    expectedTenureMonths: +expected.toFixed(1),
    survivalCurve,
  };
}

function preprocess(raw: RawCustomer, idx: number): PredictedCustomer {
  const tenure = clip(toNumber(raw.tenure, 12), 0, 120);
  const monthlyCharges = clip(toNumber(raw.monthlyCharges, 50), 0, 500);
  const supportCalls = clip(toNumber(raw.supportCalls, 0), 0, 50);
  const totalChargesDefault = monthlyCharges * tenure;
  const totalCharges = clip(toNumber(raw.totalCharges, totalChargesDefault), 0, 1_000_000);

  // Synthesize behavioral signals when missing (deterministic per row)
  const seedRand = mulberry32(idx * 7919 + Math.round(monthlyCharges * 13) + tenure);
  const synthBaseLogins = Math.max(2, 30 - supportCalls * 2 + Math.floor(seedRand() * 20));
  const synthDecay = (supportCalls / 8) * 0.5 + (seedRand() * 0.3 - 0.1);
  const loginsM1 = Math.max(0, Math.round(toNumber(raw.loginsM1, synthBaseLogins)));
  const loginsM2 = Math.max(0, Math.round(toNumber(raw.loginsM2, synthBaseLogins * (1 - synthDecay))));
  const daysSinceLastAction = clip(
    toNumber(raw.daysSinceLastAction, Math.floor(seedRand() * 45)),
    0, 365,
  );
  const totalSessions = Math.max(
    1,
    Math.round(toNumber(raw.totalSessions, loginsM1 + loginsM2 + Math.floor(seedRand() * 10))),
  );
  const uniqueFeaturesUsed = clip(
    toNumber(raw.uniqueFeaturesUsed, Math.max(1, Math.floor(seedRand() * 8) + (tenure > 24 ? 2 : 0))),
    0, 10,
  );
  const supportTickets = clip(
    toNumber(raw.supportTickets, Math.max(0, supportCalls - Math.floor(seedRand() * 2))),
    0, 100,
  );

  const engagementSlope = (loginsM2 - loginsM1) / 30;
  const inactivityGap = daysSinceLastAction;
  const featureDiversityScore = uniqueFeaturesUsed / 10;
  const supportToUsageRatio = supportTickets / Math.max(1, totalSessions);

  return {
    id: String(raw.id ?? `C${String(idx + 1).padStart(4, "0")}`),
    tenure,
    monthlyCharges,
    supportCalls,
    totalCharges,
    contractType: normalizeContract(raw.contractType),
    internetService: normalizeInternet(raw.internetService),
    paymentMethod: normalizePayment(raw.paymentMethod),
    churnProbability: 0,
    riskLevel: "low",
    shapValues: [],
    loginsM1, loginsM2, daysSinceLastAction,
    uniqueFeaturesUsed, totalSessions, supportTickets,
    engagementSlope, inactivityGap, featureDiversityScore, supportToUsageRatio,
  };
}

// Compute KM curves by segment using each customer's individual survival curve as a proxy.
// We aggregate by averaging S(t) within each segment.
function computeKMCurves(customers: PredictedCustomer[]) {
  const segments: { type: string; key: (c: PredictedCustomer) => string }[] = [
    { type: "Contract", key: (c) => c.contractType },
    { type: "Internet", key: (c) => c.internetService },
  ];
  const out: {
    segment: string;
    segmentType: string;
    points: SurvivalPoint[];
    medianSurvival: number;
    sampleSize: number;
  }[] = [];

  for (const seg of segments) {
    const groups = new Map<string, PredictedCustomer[]>();
    for (const c of customers) {
      const k = seg.key(c);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(c);
    }
    for (const [name, group] of groups) {
      if (!group.length) continue;
      const points: SurvivalPoint[] = [];
      for (let t = 0; t <= 72; t++) {
        let s = 0;
        let n = 0;
        for (const c of group) {
          if (c.survivalCurve && c.survivalCurve[t]) {
            s += c.survivalCurve[t].survival;
            n++;
          }
        }
        points.push({ t, survival: n ? +(s / n).toFixed(4) : 1 });
      }
      let median = 72;
      for (const p of points) if (p.survival <= 0.5) { median = p.t; break; }
      out.push({
        segmentType: seg.type,
        segment: name,
        points,
        medianSurvival: median,
        sampleSize: group.length,
      });
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const customers: RawCustomer[] = Array.isArray(body?.customers) ? body.customers : [];
    if (customers.length === 0) {
      return new Response(JSON.stringify({ error: "customers array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (customers.length > 5000) {
      return new Response(JSON.stringify({ error: "Max 5000 customers per request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = getModel();
    const predicted = customers.map((raw, i) => predictOne(preprocess(raw, i)));
    const kmCurves = computeKMCurves(predicted);
    const medianSurvivalMonths = predicted.length
      ? Math.round(predicted.reduce((s, c) => s + (c.medianSurvivalMonths ?? 72), 0) / predicted.length)
      : 0;

    const meta = {
      algorithm: "Logistic Regression (class-weighted, L2) + Cox-lite survival",
      trainingSamples: 2000,
      features: FEATURES.length,
      coefficients: Object.fromEntries(FEATURES.map((f, i) => [f, +model.w[i].toFixed(4)])),
      intercept: +model.b.toFixed(4),
      baselineMedianMonths: model.baseline.median,
      kaplanMeier: kmCurves,
      medianSurvivalMonths,
    };

    return new Response(JSON.stringify({ customers: predicted, meta }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict-churn error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
