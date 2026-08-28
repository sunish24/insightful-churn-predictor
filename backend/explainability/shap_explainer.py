"""SHAP-based global + local explanations for the best classifier."""
from __future__ import annotations
from functools import lru_cache
from typing import Dict, List
import numpy as np
import pandas as pd
import shap

from backend.models.predict import load_best_model
from backend.preprocessing.loader import load_telco
from backend.preprocessing.preprocessor import fit_transform_full, load_preprocessor


@lru_cache(maxsize=1)
def _background_matrix() -> pd.DataFrame:
    """Full transformed training matrix.

    Cached independently of the sample size so callers asking for different `n`
    cannot evict each other -- transforming all 7043 rows costs ~11s, and SHAP
    (n=200) alternating with DiCE (n=500) used to pay it on every request.
    """
    df = load_telco()
    try:
        load_preprocessor()
        from backend.preprocessing.preprocessor import (
            clean_telco, add_engineered_features, TARGET_COL,
        )
        import joblib
        from backend.utils.paths import PREPROCESSOR_PKL, FEATURE_META_PKL
        pre = joblib.load(PREPROCESSOR_PKL)
        meta = joblib.load(FEATURE_META_PKL)
        df = clean_telco(df)
        df = add_engineered_features(df)
        if TARGET_COL in df.columns:
            df = df.drop(columns=TARGET_COL)
        X = pre.transform(df)
        return pd.DataFrame(X, columns=meta.feature_names_out)
    except FileNotFoundError:
        X, *_ = fit_transform_full(df)
        return X


def _background_sample(n: int = 200) -> pd.DataFrame:
    """Cached background dataset for SHAP."""
    X = _background_matrix()
    return X.sample(n=min(n, len(X)), random_state=42)


@lru_cache(maxsize=1)
def _get_explainer():
    bundle = load_best_model()
    model = bundle["model"]
    bg = _background_sample()
    name = bundle["name"]
    if name in {"xgboost", "random_forest", "gradient_boosting"}:
        return shap.TreeExplainer(model), bundle
    return shap.LinearExplainer(model, bg), bundle


def _positive_class_sv(sv) -> np.ndarray:
    """Normalise SHAP output to a 2-D (n_samples, n_features) array for class 1.

    shap 0.46 is not uniform across estimators: a list for some, a 3-D
    (n, features, classes) ndarray for RandomForestClassifier, and plain 2-D for
    single-output trees (GBM, XGBoost). Handling only the list case left the
    RandomForest path raising once it ever won model selection.
    """
    if isinstance(sv, list):
        return np.asarray(sv[1] if len(sv) > 1 else sv[0])
    sv = np.asarray(sv)
    if sv.ndim == 3:
        return sv[..., 1] if sv.shape[-1] > 1 else sv[..., 0]
    return sv


def global_importance(top_k: int = 15) -> List[Dict]:
    expl, bundle = _get_explainer()
    bg = _background_sample()
    sv = _positive_class_sv(expl.shap_values(bg))
    mean_abs = np.abs(sv).mean(axis=0)
    feats = bundle["feature_names"]
    order = np.argsort(mean_abs)[::-1][:top_k]
    return [{"feature": feats[i], "importance": float(mean_abs[i])} for i in order]


def local_explanation(X_row: pd.DataFrame, top_k: int = 8) -> List[Dict]:
    expl, bundle = _get_explainer()
    feats = bundle["feature_names"]
    X_row = X_row.reindex(columns=feats, fill_value=0)
    contribs = _positive_class_sv(expl.shap_values(X_row))[0]
    order = np.argsort(np.abs(contribs))[::-1][:top_k]
    out = []
    for i in order:
        val = X_row.iloc[0, i]
        out.append({
            "feature": feats[i],
            "value": float(val),
            "impact": float(contribs[i]),  # +ve pushes toward churn
        })
    return out
