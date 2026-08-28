"""Greedy intervention budget optimizer.

score = (CLV * churn_risk) / intervention_cost
"""
from __future__ import annotations
from typing import Dict, List


def greedy_allocate(customers: List[Dict], budget: float) -> Dict:
    """Each customer dict: {id, churn_risk, clv, cost}."""
    ranked = []
    for c in customers:
        cost = max(float(c.get("cost", 1.0)), 1e-6)
        score = (float(c["clv"]) * float(c["churn_risk"])) / cost
        ranked.append({**c, "score": score})
    ranked.sort(key=lambda r: -r["score"])

    chosen, spent, expected_save = [], 0.0, 0.0
    for c in ranked:
        if spent + c["cost"] <= budget:
            chosen.append(c)
            spent += c["cost"]
            expected_save += c["clv"] * c["churn_risk"] * 0.35  # 35% lift
    return {
        "ranked": ranked,
        "selected": chosen,
        "budget": budget,
        "spent": spent,
        "expected_revenue_saved": expected_save,
    }
