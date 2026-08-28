"""Streamlit dashboard wired to the FastAPI backend."""
from __future__ import annotations
import os
import requests
import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

API = os.environ.get("CHURN_API", "http://localhost:8000")

st.set_page_config(page_title="Churn Survival + XAI", layout="wide")
st.title("Customer Churn — Survival Analysis & Explainable AI")

with st.sidebar:
    st.header("Customer Inputs")
    tenure = st.slider("Tenure (months)", 0, 72, 12)
    monthly = st.slider("Monthly Charges", 0.0, 200.0, 75.0)
    total = st.number_input("Total Charges", 0.0, 100000.0, float(tenure * monthly))
    contract = st.selectbox("Contract", ["Month-to-month", "One year", "Two year"])
    internet = st.selectbox("Internet Service", ["Fiber optic", "DSL", "No"])
    payment = st.selectbox("Payment Method",
                           ["Electronic check", "Mailed check",
                            "Bank transfer (automatic)", "Credit card (automatic)"])
    senior = st.checkbox("Senior Citizen")
    partner = st.selectbox("Partner", ["Yes", "No"])
    deps = st.selectbox("Dependents", ["Yes", "No"])

    record = {
        "tenure": tenure, "MonthlyCharges": monthly, "TotalCharges": total,
        "Contract": contract, "InternetService": internet, "PaymentMethod": payment,
        "SeniorCitizen": int(senior), "Partner": partner, "Dependents": deps,
    }

try:
    health = requests.get(f"{API}/health", timeout=5).json()
    if not health.get("models_trained"):
        st.warning("Models not trained yet. Run: `python -m backend.models.train`")
        st.stop()
except Exception as e:
    st.error(f"Can't reach API at {API}. Start it with `uvicorn backend.api.main:app`. {e}")
    st.stop()

c1, c2, c3 = st.columns(3)

with c1:
    st.subheader("Churn Probability")
    churn = requests.post(f"{API}/predict_churn", json=record).json()
    st.metric("Probability", f"{churn['churn_probability']*100:.1f}%",
              delta=churn["risk_level"].upper())
    st.caption(f"Model: {churn['model']}")

with c2:
    st.subheader("Survival")
    surv = requests.post(f"{API}/predict_survival", json=record).json()
    st.metric("Median survival", f"{surv['median_survival_months']} mo")
    st.metric("Hazard ratio", f"{surv['hazard_ratio']:.2f}")

with c3:
    st.subheader("Risk Tier")
    st.write(f"### :{'red' if churn['risk_level']=='high' else 'orange' if churn['risk_level']=='medium' else 'green'}[{churn['risk_level'].upper()}]")

st.markdown("---")

left, right = st.columns(2)
with left:
    st.subheader("Survival Curve")
    curve = pd.DataFrame(surv["survival_curve"])
    fig = px.line(curve, x="t", y="survival",
                  labels={"t": "Months", "survival": "P(retained)"})
    fig.update_yaxes(range=[0, 1])
    st.plotly_chart(fig, use_container_width=True)

with right:
    st.subheader("SHAP Local Explanation")
    exp = requests.post(f"{API}/explain_user", json=record).json()
    sh = pd.DataFrame(exp["explanations"])
    fig = go.Figure(go.Bar(
        x=sh["impact"], y=sh["feature"], orientation="h",
        marker_color=["#ef4444" if v > 0 else "#10b981" for v in sh["impact"]],
    ))
    fig.update_layout(yaxis=dict(autorange="reversed"),
                      xaxis_title="Impact on churn (+ pushes toward churn)")
    st.plotly_chart(fig, use_container_width=True)

st.markdown("---")
st.subheader("Global Feature Importance")
gi = requests.get(f"{API}/global_importance").json()["features"]
gi_df = pd.DataFrame(gi)
st.plotly_chart(px.bar(gi_df, x="importance", y="feature", orientation="h")
                .update_layout(yaxis=dict(autorange="reversed")),
                use_container_width=True)

st.markdown("---")
st.subheader("Counterfactual Recommendation")
with st.spinner("Searching for minimal changes ..."):
    cf = requests.post(f"{API}/counterfactual", json=record).json()
if cf.get("error"):
    st.info(f"DiCE could not find counterfactuals: {cf['error']}")
for i, c in enumerate(cf.get("counterfactuals", []), 1):
    st.markdown(f"**Option {i}** — minimal changes:")
    st.table(pd.DataFrame(c["changes"]))

st.markdown("---")
st.subheader("Customer Similarity Network")
net = requests.get(f"{API}/network_metrics").json()
m = net["metrics"]
n1, n2, n3, n4 = st.columns(4)
n1.metric("Nodes", f"{m['n_nodes']:,}")
n2.metric("Edges", f"{m['n_edges']:,}")
n3.metric("Avg clustering", f"{m['avg_clustering']:.3f}")
n4.metric("Neighbour churn rate", f"{m['avg_neighbour_churn_rate']*100:.1f}%")
st.caption("Customers in the churniest neighbourhoods (k-NN in feature space):")
st.dataframe(pd.DataFrame(net["top_risky_nodes"]), use_container_width=True)

st.markdown("---")
st.subheader("Intervention Budget Optimizer")
budget = st.slider("Total budget ($)", 100, 10000, 2000, step=100)
cost = st.slider("Cost per intervention ($)", 10, 500, 75, step=5)
# Build a tiny demo cohort
demo = []
for i in range(20):
    p = 0.05 + (i * 0.045)
    demo.append({"id": f"C{i:03d}", "churn_risk": min(p, 0.95),
                 "clv": float(500 + i * 60), "cost": float(cost)})
opt = requests.post(f"{API}/optimize_budget",
                    json={"budget": budget, "customers": demo}).json()
# NB: a bare "$" pair opens/closes a LaTeX span in st.write - escape it.
st.write(f"Selected **{len(opt['selected'])}** customers, "
         f"spent **\\${opt['spent']:.0f}**, "
         f"expected revenue saved **\\${opt['expected_revenue_saved']:.0f}**.")
st.dataframe(pd.DataFrame(opt["selected"]))
