# Customer Churn Prediction using Survival Analysis & Explainable AI

A full-stack research project that combines **survival analysis** (Kaplan-Meier, Cox PH),
**classical ML** (LogReg, RF, GBM, XGBoost), **SHAP explainability**, **DiCE counterfactuals**,
**NetworkX customer graphs**, and a **greedy intervention optimizer**, exposed through a
**FastAPI** backend and a **Streamlit** dashboard.

## Project Structure

```
backend/
    api/                 FastAPI app + routers
    preprocessing/       Telco dataset cleaning + temporal feature engineering
    survival/            Kaplan-Meier + Cox PH wrappers
    models/              Classical ML training pipeline + persisted artifacts
    explainability/      SHAP global + local explanations
    counterfactuals/     DiCE-ML counterfactual generation
    network_analysis/    NetworkX customer-similarity graph metrics
    optimization/        Greedy intervention budget optimizer
    utils/               Shared helpers
frontend/
    streamlit_app.py     Dashboard wired to FastAPI
data/                    Place Telco CSV here (auto-downloaded if missing)
notebooks/               Exploration notebooks (placeholder)
artifacts/               Trained models + preprocessor pickles
Dockerfile               Single-image build for API + dashboard
requirements.txt
```

## Quick Start (Local)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 1. Train models (downloads Telco dataset on first run)
python -m backend.models.train

# 2. Start API
uvicorn backend.api.main:app --reload --port 8000

# 3. In another terminal, start the dashboard
streamlit run frontend/streamlit_app.py
```

API docs: http://localhost:8000/docs
Dashboard: http://localhost:8501

## Docker

```bash
docker build -t churn-app .
docker run -p 8000:8000 -p 8501:8501 churn-app
```

## Endpoints

| Method | Path                | Purpose                                  |
|--------|---------------------|------------------------------------------|
| POST   | /predict_survival   | Survival curve + hazard for a customer   |
| POST   | /predict_churn      | Churn probability from best ML model     |
| POST   | /explain_user       | SHAP local explanation                   |
| POST   | /counterfactual     | DiCE minimal-change recommendation       |
| POST   | /optimize_budget    | Greedy intervention allocation           |
| GET    | /network_metrics    | k-NN customer graph metrics + risky nodes|
| GET    | /global_importance  | SHAP global feature importance           |
| GET    | /health             | Health check                             |
