import { supabase } from "@/integrations/supabase/client";
import { Customer, ChurnInsights } from "@/types/customer";
import { calculateInsights } from "./mockPredictions";

export interface RawCustomerInput {
  id?: string;
  tenure?: number | string;
  monthlyCharges?: number | string;
  contractType?: string;
  internetService?: string;
  paymentMethod?: string;
  supportCalls?: number | string;
  totalCharges?: number | string;
}

/** Parse raw CSV into objects WITHOUT running the heuristic predictor. */
export function parseCSVRaw(csvText: string): RawCustomerInput[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: RawCustomerInput[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = values[idx] ?? ""));
    rows.push({
      id: row.customerid || row.id || `C${String(i).padStart(4, "0")}`,
      tenure: row.tenure,
      monthlyCharges: row.monthlycharges || row.monthly_charges,
      contractType: row.contracttype || row.contract,
      internetService: row.internetservice || row.internet_service,
      paymentMethod: row.paymentmethod || row.payment_method,
      supportCalls: row.supportcalls || row.support_calls,
      totalCharges: row.totalcharges || row.total_charges,
    });
  }
  return rows;
}

/** Build a synthetic batch of raw customers for the demo path. */
export function buildSampleRawCustomers(count: number): RawCustomerInput[] {
  const contracts = ["Monthly", "One Year", "Two Year"];
  const internets = ["Fiber", "DSL", "None"];
  const payments = ["Credit Card", "Bank Transfer", "Electronic Check", "Mailed Check"];
  const out: RawCustomerInput[] = [];
  for (let i = 0; i < count; i++) {
    const tenure = Math.floor(Math.random() * 72) + 1;
    const monthlyCharges = +(Math.random() * 100 + 20).toFixed(2);
    out.push({
      id: `C${String(i + 1).padStart(4, "0")}`,
      tenure,
      monthlyCharges,
      contractType: contracts[Math.floor(Math.random() * 3)],
      internetService: internets[Math.floor(Math.random() * 3)],
      paymentMethod: payments[Math.floor(Math.random() * 4)],
      supportCalls: Math.floor(Math.random() * 8),
      totalCharges: +(monthlyCharges * tenure).toFixed(2),
    });
  }
  return out;
}

export interface PredictResult {
  customers: Customer[];
  insights: ChurnInsights;
  meta: Record<string, unknown>;
}

/** Call the real ML edge function. */
export async function predictChurn(rawCustomers: RawCustomerInput[]): Promise<PredictResult> {
  const { data, error } = await supabase.functions.invoke("predict-churn", {
    body: { customers: rawCustomers },
  });
  if (error) throw new Error(error.message || "Prediction request failed");
  if (!data?.customers) throw new Error("Invalid prediction response");
  const customers = data.customers as Customer[];
  const insights = calculateInsights(customers);
  return { customers, insights, meta: data.meta ?? {} };
}

/** Call the AI explanation edge function. */
export async function explainCustomer(customer: Customer): Promise<string> {
  const { data, error } = await supabase.functions.invoke("explain-churn", {
    body: { customer },
  });
  if (error) throw new Error(error.message || "Explanation request failed");
  if (data?.error) throw new Error(data.error);
  return (data?.explanation as string) ?? "";
}