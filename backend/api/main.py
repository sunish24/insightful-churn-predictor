"""FastAPI app exposing survival, churn, SHAP, DiCE and optimization endpoints."""
from __future__ import annotations
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.api.schemas import (
    CustomerRecord, SurvivalResponse, ChurnResponse,
    ExplainResponse, CFResponse, BudgetRequest, BudgetResponse,
    NetworkResponse,
)
from backend.preprocessing.preprocessor import transform_one
from backend.survival.models import survival_curve_for
from backend.models.predict import predict_proba_row
from backend.explainability.shap_explainer import local_explanation, global_importance
from backend.counterfactuals.dice_engine import generate_counterfactuals
from backend.optimization.optimizer import greedy_allocate
from backend.network_analysis.graph import network_summary
from backend.utils.paths import BEST_MODEL_PKL

app = FastAPI(title="Churn Survival + XAI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


def _ensure_trained():
    if not Path(BEST_MODEL_PKL).exists():
        raise HTTPException(
            status_code=503,
            detail="Models not trained. Run: python -m backend.models.train",
        )


@app.get("/health")
def health():
    trained = Path(BEST_MODEL_PKL).exists()
    return {"status": "ok", "models_trained": trained}


@app.get("/global_importance")
def global_imp(top_k: int = 15):
    _ensure_trained()
    return {"features": global_importance(top_k=top_k)}


@app.post("/predict_survival", response_model=SurvivalResponse)
def predict_survival(record: CustomerRecord):
    _ensure_trained()
    X = transform_one(record.model_dump())
    return survival_curve_for(X)


@app.post("/predict_churn", response_model=ChurnResponse)
def predict_churn(record: CustomerRecord):
    _ensure_trained()
    X = transform_one(record.model_dump())
    return predict_proba_row(X)


@app.post("/explain_user", response_model=ExplainResponse)
def explain_user(record: CustomerRecord):
    _ensure_trained()
    X = transform_one(record.model_dump())
    base = predict_proba_row(X)
    return {
        "churn_probability": base["churn_probability"],
        "risk_level": base["risk_level"],
        "explanations": local_explanation(X),
    }


@app.post("/counterfactual", response_model=CFResponse)
def counterfactual(record: CustomerRecord):
    _ensure_trained()
    X = transform_one(record.model_dump())
    return generate_counterfactuals(X)


@app.get("/network_metrics", response_model=NetworkResponse)
def network_metrics(k: int = 5, top_k: int = 10):
    _ensure_trained()
    return network_summary(k=k, top_k=top_k)


@app.post("/optimize_budget", response_model=BudgetResponse)
def optimize_budget(req: BudgetRequest):
    return greedy_allocate([c.model_dump() for c in req.customers], req.budget)
