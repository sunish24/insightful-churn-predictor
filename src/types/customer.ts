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
}
