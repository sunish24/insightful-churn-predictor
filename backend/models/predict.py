"""Inference helpers for the trained ML models."""
from __future__ import annotations
from typing import Dict
import joblib
import pandas as pd
from backend.utils.paths import BEST_MODEL_PKL, ML_MODELS_PKL


def load_best_model():
    return joblib.load(BEST_MODEL_PKL)


def load_all_models():
    return joblib.load(ML_MODELS_PKL)


def predict_proba_row(X_row: pd.DataFrame) -> Dict:
    bundle = load_best_model()
    model, feats = bundle["model"], bundle["feature_names"]
    X_row = X_row.reindex(columns=feats, fill_value=0)
    proba = float(model.predict_proba(X_row)[0, 1])
    risk = "high" if proba >= 0.66 else "medium" if proba >= 0.33 else "low"
    return {"model": bundle["name"], "churn_probability": proba, "risk_level": risk}
