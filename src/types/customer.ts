export interface Customer {
  id: string;
  tenure: number;
  monthlyCharges: number;
  contractType: 'Monthly' | 'One Year' | 'Two Year';
  internetService: 'Fiber' | 'DSL' | 'None';
  paymentMethod: 'Credit Card' | 'Bank Transfer' | 'Electronic Check' | 'Mailed Check';
  supportCalls: number;
  totalCharges: number;
  churnProbability: number;
  riskLevel: 'high' | 'medium' | 'low';
  shapValues: ShapValue[];
  // --- Behavioral / engineered signals (optional; synthesized when missing) ---
  loginsM1?: number;            // logins in the older month
  loginsM2?: number;            // logins in the most recent month
  daysSinceLastAction?: number; // recency gap in days
  uniqueFeaturesUsed?: number;  // count of distinct product features touched
  totalSessions?: number;       // total sessions in the snapshot window
  supportTickets?: number;      // support tickets opened in window
  // Engineered features
  engagementSlope?: number;        // (loginsM2 - loginsM1) / 30
  inactivityGap?: number;          // daysSinceLastAction
  featureDiversityScore?: number;  // 0..1 normalized
  supportToUsageRatio?: number;    // tickets / sessions
  // --- Survival analysis (Cox-lite) ---
  hazardRatio?: number;            // exp(linear risk score)
  medianSurvivalMonths?: number;   // months until P(survive) = 0.5
  expectedTenureMonths?: number;   // mean residual lifetime (approx)
  survivalCurve?: SurvivalPoint[]; // S(t) for t in months
}

export interface SurvivalPoint {
  t: number;       // months from now
  survival: number;// P(still customer at month t)
}

export interface KaplanMeierCurve {
  segment: string;       // e.g. "Monthly", "One Year"
  segmentType: string;   // e.g. "Contract", "Internet"
  points: SurvivalPoint[];
  medianSurvival: number;
  sampleSize: number;
}

export interface ShapValue {
  feature: string;
  value: number;
  impact: number; // positive = increases churn risk, negative = decreases
  displayValue: string;
}

export interface ChurnInsights {
  totalCustomers: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  avgChurnProbability: number;
  revenueAtRisk: number;
  topChurnFactors: { factor: string; importance: number }[];
  medianSurvivalMonths?: number;
  kaplanMeier?: KaplanMeierCurve[];
}
