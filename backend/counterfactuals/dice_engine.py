"""DiCE-ML counterfactual recommendations on the best CLASSIFICATION model.

Important: counterfactuals are generated on the classifier (XGBoost/GBM),
NOT on the Cox survival model.
"""
from __future__ import annotations
from functools import lru_cache
from typing import Dict, List, Optional
import pandas as pd
import dice_ml

from backend.models.predict import load_best_model
from backend.explainability.shap_explainer import _background_sample


@lru_cache(maxsize=1)
def _dice():
    bundle = load_best_model()
    bg = _background_sample(n=500).copy()
    # DiCE needs a target column to construct its Data object
    bg["target"] = (bundle["model"].predict_proba(bg)[:, 1] >= 0.5).astype(int)
    data = dice_ml.Data(
        dataframe=bg,
        continuous_features=list(bg.columns.drop("target")),
        outcome_name="target",
    )
    backend = "sklearn" if bundle["name"] != "xgboost" else "sklearn"
    model = dice_ml.Model(model=bundle["model"], backend=backend,
                          model_type="classifier")
    return dice_ml.Dice(data, model, method="random"), bundle


def generate_counterfactuals(X_row: pd.DataFrame, total_cfs: int = 3,
                             features_to_vary: Optional[List[str]] = None) -> Dict:
    explainer, bundle = _dice()
    feats = bundle["feature_names"]
    X_row = X_row.reindex(columns=feats, fill_value=0)
    try:
        cf = explainer.generate_counterfactuals(
            X_row, total_CFs=total_cfs, desired_class=0,
            features_to_vary=features_to_vary or "all",
        )
        cf_df = cf.cf_examples_list[0].final_cfs_df
        original = X_row.iloc[0]
        suggestions = []
        for _, row in cf_df.iterrows():
            changes = []
            for f in feats:
                if abs(row[f] - original[f]) > 1e-6:
                    changes.append({
                        "feature": f,
                        "from": float(original[f]),
                        "to": float(row[f]),
                    })
            changes.sort(key=lambda c: -abs(c["to"] - c["from"]))
            suggestions.append({"changes": changes[:5]})
        return {"counterfactuals": suggestions}
    except Exception as e:
        return {"counterfactuals": [], "error": str(e)}
