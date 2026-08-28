FROM python:3.10-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgomp1 curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train on build so artifacts ship with the image. No `|| true` here: a training
# failure must fail the build, otherwise the image ships without cox_model.pkl,
# /health still reports models_trained=true (it only checks best_model.pkl) and
# /predict_survival 500s at runtime.
RUN python -m backend.models.train

EXPOSE 8000 8501

# exec form + `wait -n`: if either service dies the container exits non-zero
# instead of lingering with a dead API behind a live dashboard.
CMD ["bash", "-c", "uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 & api=$!; streamlit run frontend/streamlit_app.py --server.port 8501 --server.address 0.0.0.0 --server.headless true --browser.gatherUsageStats false & ui=$!; wait -n; kill -TERM $api $ui 2>/dev/null; wait; exit 1"]
