// AI-powered natural language explanation for a single customer's churn risk.
// Uses Lovable AI Gateway (no API key required from user).

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

interface ShapValue {
  feature: string;
  impact: number;
  displayValue: string;
}
interface CustomerInput {
  id: string;
  tenure: number;
  monthlyCharges: number;
  contractType: string;
  internetService: string;
  paymentMethod: string;
  supportCalls: number;
  totalCharges: number;
  churnProbability: number;
  riskLevel: "high" | "medium" | "low";
  shapValues: ShapValue[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { customer } = (await req.json()) as { customer: CustomerInput };
    if (!customer || !customer.id) {
      return new Response(JSON.stringify({ error: "customer is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const drivers = [...customer.shapValues]
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 6)
      .map((s) => `- ${s.feature} = ${s.displayValue} (impact ${s.impact >= 0 ? "+" : ""}${(s.impact * 100).toFixed(1)}%)`)
      .join("\n");

    const systemPrompt =
      "You are a senior customer retention analyst. Given a customer profile and SHAP-style " +
      "feature contributions from a churn model, explain in plain business English why this " +
      "customer is at the predicted risk level, then recommend 2-3 concrete retention actions. " +
      "Be concise (under 160 words). Do not mention SHAP, models, or technical jargon. " +
      "Use a confident, advisory tone. Format as: a short paragraph, then a bulleted list of actions.";

    const userPrompt = `Customer ${customer.id}
Risk level: ${customer.riskLevel.toUpperCase()} (${(customer.churnProbability * 100).toFixed(0)}% churn probability)

Profile:
- Tenure: ${customer.tenure} months
- Monthly charges: $${customer.monthlyCharges.toFixed(2)}
- Total lifetime charges: $${customer.totalCharges.toFixed(2)}
- Contract: ${customer.contractType}
- Internet service: ${customer.internetService}
- Payment method: ${customer.paymentMethod}
- Support calls: ${customer.supportCalls}

Top contribution drivers (positive = increases churn risk, negative = reduces it):
${drivers}

Write the explanation now.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const explanation: string = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("explain-churn error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});