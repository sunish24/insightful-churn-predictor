"""Train classical ML models + survival models and persist artifacts.

Run:  python -m backend.models.train
"""
from __future__ import annotations
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, f1_score, roc_auc_score,
                             classification_report)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from backend.preprocessing.loader import load_telco
from backend.preprocessing.preprocessor import fit_transform_full
from backend.survival.models import fit_kaplan_meier, fit_cox
from backend.utils.paths import ML_MODELS_PKL, BEST_MODEL_PKL


def _model_zoo() -> dict:
    return {
        "logistic_regression": LogisticRegression(max_iter=1000, n_jobs=None),
        "random_forest": RandomForestClassifier(n_estimators=300, n_jobs=-1,
                                                random_state=42),
        "gradient_boosting": GradientBoostingClassifier(random_state=42),
        "xgboost": XGBClassifier(
            n_estimators=400, max_depth=5, learning_rate=0.05,
            subsample=0.9, colsample_bytree=0.9, eval_metric="logloss",
            random_state=42, n_jobs=-1,
        ),
    }


def main():
    print("Loading Telco data ...")
    df = load_telco()
    print(f"Rows: {len(df)}  Cols: {list(df.columns)[:6]}...")

    print("Preprocessing + engineering features ...")
    X, y, duration, event, meta = fit_transform_full(df)
    print(f"Feature matrix: {X.shape}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training classical ML models ...")
    results, models = {}, {}
    for name, model in _model_zoo().items():
        model.fit(X_train, y_train)
        proba = model.predict_proba(X_test)[:, 1]
        pred = (proba >= 0.5).astype(int)
        results[name] = {
            "accuracy": float(accuracy_score(y_test, pred)),
            "f1": float(f1_score(y_test, pred)),
            "roc_auc": float(roc_auc_score(y_test, proba)),
        }
        models[name] = model
        print(f"  {name:>20}  AUC={results[name]['roc_auc']:.3f}  "
              f"F1={results[name]['f1']:.3f}")

    joblib.dump({"models": models, "metrics": results,
                 "feature_names": list(X.columns)}, ML_MODELS_PKL)

    best_name = max(results, key=lambda k: results[k]["roc_auc"])
    print(f"Best model: {best_name}")
    joblib.dump({"name": best_name, "model": models[best_name],
                 "feature_names": list(X.columns)}, BEST_MODEL_PKL)

    print("Fitting Kaplan-Meier ...")
    fit_kaplan_meier(duration, event)
    print("Fitting Cox PH ...")
    fit_cox(X, duration, event)
    print("Done. Artifacts saved.")


if __name__ == "__main__":
    main()
