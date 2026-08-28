"""Centralised filesystem paths."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
ARTIFACTS_DIR = ROOT / "artifacts"
DATA_DIR.mkdir(exist_ok=True)
ARTIFACTS_DIR.mkdir(exist_ok=True)

TELCO_CSV = DATA_DIR / "telco_churn.csv"
PREPROCESSOR_PKL = ARTIFACTS_DIR / "preprocessor.pkl"
ML_MODELS_PKL = ARTIFACTS_DIR / "ml_models.pkl"
BEST_MODEL_PKL = ARTIFACTS_DIR / "best_model.pkl"
COX_MODEL_PKL = ARTIFACTS_DIR / "cox_model.pkl"
KM_MODEL_PKL = ARTIFACTS_DIR / "km_model.pkl"
FEATURE_META_PKL = ARTIFACTS_DIR / "feature_meta.pkl"
