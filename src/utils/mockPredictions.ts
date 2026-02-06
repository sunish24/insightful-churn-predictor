import { Customer, ShapValue, ChurnInsights } from '@/types/customer';

// Simulate ML predictions based on customer features
function calculateChurnProbability(customer: Partial<Customer>): number {
  let score = 0.3; // base probability
  
  // Tenure impact (shorter = higher risk)
  if ((customer.tenure || 0) < 12) score += 0.25;
  else if ((customer.tenure || 0) < 24) score += 0.1;
  else score -= 0.15;
  
  // Monthly charges impact
  if ((customer.monthlyCharges || 0) > 80) score += 0.15;
  else if ((customer.monthlyCharges || 0) > 50) score += 0.05;
  
  // Contract type impact
  if (customer.contractType === 'Monthly') score += 0.2;
  else if (customer.contractType === 'One Year') score -= 0.1;
  else score -= 0.25;
  
  // Support calls impact
  if ((customer.supportCalls || 0) > 4) score += 0.2;
  else if ((customer.supportCalls || 0) > 2) score += 0.1;
  
  // Internet service impact
  if (customer.internetService === 'Fiber') score += 0.1;
  
  // Payment method impact
  if (customer.paymentMethod === 'Electronic Check') score += 0.1;
  
  return Math.max(0.05, Math.min(0.95, score));
}

function generateShapValues(customer: Customer): ShapValue[] {
  const shapValues: ShapValue[] = [];
  
  // Tenure SHAP
  const tenureImpact = customer.tenure < 12 ? 0.25 : customer.tenure < 24 ? 0.1 : -0.15;
  shapValues.push({
    feature: 'Tenure',
    value: customer.tenure,
    impact: tenureImpact,
    displayValue: `${customer.tenure} months`
  });
  
  // Monthly Charges SHAP
  const chargesImpact = customer.monthlyCharges > 80 ? 0.15 : customer.monthlyCharges > 50 ? 0.05 : -0.1;
  shapValues.push({
    feature: 'Monthly Charges',
    value: customer.monthlyCharges,
    impact: chargesImpact,
    displayValue: `$${customer.monthlyCharges.toFixed(2)}`
  });
  
  // Contract SHAP
  const contractImpact = customer.contractType === 'Monthly' ? 0.2 : customer.contractType === 'One Year' ? -0.1 : -0.25;
  shapValues.push({
    feature: 'Contract Type',
    value: 0,
    impact: contractImpact,
    displayValue: customer.contractType
  });
  
  // Support Calls SHAP
  const supportImpact = customer.supportCalls > 4 ? 0.2 : customer.supportCalls > 2 ? 0.1 : -0.05;
  shapValues.push({
    feature: 'Support Calls',
    value: customer.supportCalls,
    impact: supportImpact,
    displayValue: `${customer.supportCalls} calls`
  });
  
  // Internet Service SHAP
  const internetImpact = customer.internetService === 'Fiber' ? 0.1 : customer.internetService === 'DSL' ? 0 : -0.1;
  shapValues.push({
    feature: 'Internet Service',
    value: 0,
    impact: internetImpact,
    displayValue: customer.internetService
  });
  
  // Payment Method SHAP
  const paymentImpact = customer.paymentMethod === 'Electronic Check' ? 0.1 : -0.05;
  shapValues.push({
    feature: 'Payment Method',
    value: 0,
    impact: paymentImpact,
    displayValue: customer.paymentMethod
  });
  
  // Sort by absolute impact
  return shapValues.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

function getRiskLevel(probability: number): 'high' | 'medium' | 'low' {
  if (probability >= 0.6) return 'high';
  if (probability >= 0.35) return 'medium';
  return 'low';
}

export function generateMockCustomers(count: number = 50): Customer[] {
  const contractTypes: Customer['contractType'][] = ['Monthly', 'One Year', 'Two Year'];
  const internetServices: Customer['internetService'][] = ['Fiber', 'DSL', 'None'];
  const paymentMethods: Customer['paymentMethod'][] = ['Credit Card', 'Bank Transfer', 'Electronic Check', 'Mailed Check'];
  
  const customers: Customer[] = [];
  
  for (let i = 0; i < count; i++) {
    const tenure = Math.floor(Math.random() * 72) + 1;
    const monthlyCharges = Math.round((Math.random() * 100 + 20) * 100) / 100;
    const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)];
    const internetService = internetServices[Math.floor(Math.random() * internetServices.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const supportCalls = Math.floor(Math.random() * 8);
    
    const partialCustomer = {
      tenure,
      monthlyCharges,
      contractType,
      internetService,
      paymentMethod,
      supportCalls
    };
    
    const churnProbability = calculateChurnProbability(partialCustomer);
    
    const customer: Customer = {
      id: `C${String(i + 1).padStart(4, '0')}`,
      tenure,
      monthlyCharges,
      contractType,
      internetService,
      paymentMethod,
      supportCalls,
      totalCharges: monthlyCharges * tenure,
      churnProbability,
      riskLevel: getRiskLevel(churnProbability),
      shapValues: []
    };
    
    customer.shapValues = generateShapValues(customer);
    customers.push(customer);
  }
  
  return customers;
}

export function calculateInsights(customers: Customer[]): ChurnInsights {
  const highRisk = customers.filter(c => c.riskLevel === 'high');
  const mediumRisk = customers.filter(c => c.riskLevel === 'medium');
  const lowRisk = customers.filter(c => c.riskLevel === 'low');
  
  const avgChurn = customers.reduce((sum, c) => sum + c.churnProbability, 0) / customers.length;
  const revenueAtRisk = highRisk.reduce((sum, c) => sum + c.monthlyCharges * 12, 0);
  
  // Calculate feature importance from SHAP values
  const featureImportance: Record<string, number> = {};
  customers.forEach(customer => {
    customer.shapValues.forEach(shap => {
      featureImportance[shap.feature] = (featureImportance[shap.feature] || 0) + Math.abs(shap.impact);
    });
  });
  
  const topFactors = Object.entries(featureImportance)
    .map(([factor, importance]) => ({ factor, importance: importance / customers.length }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5);
  
  return {
    totalCustomers: customers.length,
    highRiskCount: highRisk.length,
    mediumRiskCount: mediumRisk.length,
    lowRiskCount: lowRisk.length,
    avgChurnProbability: avgChurn,
    revenueAtRisk,
    topChurnFactors: topFactors
  };
}

export function parseCSV(csvText: string): Customer[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const customers: Customer[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    
    const tenure = parseInt(row.tenure) || Math.floor(Math.random() * 72) + 1;
    const monthlyCharges = parseFloat(row.monthlycharges) || Math.round((Math.random() * 100 + 20) * 100) / 100;
    const contractType = (row.contracttype || row.contract || 'Monthly') as Customer['contractType'];
    const internetService = (row.internetservice || 'Fiber') as Customer['internetService'];
    const paymentMethod = (row.paymentmethod || 'Credit Card') as Customer['paymentMethod'];
    const supportCalls = parseInt(row.supportcalls) || Math.floor(Math.random() * 8);
    
    const partialCustomer = { tenure, monthlyCharges, contractType, internetService, paymentMethod, supportCalls };
    const churnProbability = calculateChurnProbability(partialCustomer);
    
    const customer: Customer = {
      id: row.customerid || row.id || `C${String(i).padStart(4, '0')}`,
      tenure,
      monthlyCharges,
      contractType: contractType.includes('Month') ? 'Monthly' : contractType.includes('One') ? 'One Year' : 'Two Year',
      internetService: internetService.includes('Fiber') ? 'Fiber' : internetService.includes('DSL') ? 'DSL' : 'None',
      paymentMethod: paymentMethod.includes('Credit') ? 'Credit Card' : paymentMethod.includes('Bank') ? 'Bank Transfer' : paymentMethod.includes('Electronic') ? 'Electronic Check' : 'Mailed Check',
      supportCalls,
      totalCharges: monthlyCharges * tenure,
      churnProbability,
      riskLevel: getRiskLevel(churnProbability),
      shapValues: []
    };
    
    customer.shapValues = generateShapValues(customer);
    customers.push(customer);
  }
  
  return customers;
}
