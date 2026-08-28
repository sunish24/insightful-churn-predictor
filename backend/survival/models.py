"""Kaplan-Meier and Cox Proportional Hazards wrappers (via lifelines)."""
from __future__ import annotations
from typing import Dict, List
import joblib
import numpy as np
import pandas as pd
from lifelines import KaplanMeierFitter, CoxPHFitter

from backend.utils.paths import COX_MODEL_PKL, KM_MODEL_PKL


def fit_kaplan_meier(duration: pd.Series, event: pd.Series) -> KaplanMeierFitter:
    km = KaplanMeierFitter()
    km.fit(duration, event_observed=event, label="overall")
    joblib.dump(km, KM_MODEL_PKL)
    return km


def fit_cox(X: pd.DataFrame, duration: pd.Series, event: pd.Series,
            penalizer: float = 0.1) -> CoxPHFitter:
    """Fit a Cox PH model. X must be numeric (already preprocessed)."""
    df = X.copy()
    df["duration"] = duration.values
    df["event"] = event.values
    # Drop zero-variance cols that break Cox
    keep = [c for c in X.columns if df[c].nunique() > 1]
    df = df[keep + ["duration", "event"]]
    cox = CoxPHFitter(penalizer=penalizer)
    cox.fit(df, duration_col="duration", event_col="event",
            show_progress=False, fit_options={"step_size": 0.3})
    joblib.dump(cox, COX_MODEL_PKL)
    return cox


def load_km() -> KaplanMeierFitter:
    return joblib.load(KM_MODEL_PKL)


def load_cox() -> CoxPHFitter:
    return joblib.load(COX_MODEL_PKL)


def survival_curve_for(X_row: pd.DataFrame, horizon: int = 72) -> Dict:
    """Predict per-customer survival curve and key summary stats."""
    cox = load_cox()
    feats = [c for c in cox.params_.index]
    X_row = X_row.reindex(columns=feats, fill_value=0)
    times = np.arange(1, horizon + 1)
    sf = cox.predict_survival_function(X_row, times=times).iloc[:, 0]
    hazard = float(cox.predict_partial_hazard(X_row).iloc[0])
    survival = [{"t": int(t), "survival": float(s)} for t, s in sf.items()]
    median = next((p["t"] for p in survival if p["survival"] <= 0.5), horizon)
    return {
        "hazard_ratio": hazard,
        "median_survival_months": median,
        "survival_curve": survival,
    }


def overall_km_points(km: KaplanMeierFitter) -> List[Dict]:
    sf = km.survival_function_.iloc[:, 0]
    return [{"t": float(t), "survival": float(s)} for t, s in sf.items()]
