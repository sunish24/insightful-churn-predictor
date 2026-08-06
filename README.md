# Insightful Churn Predictor

Build an AI system that:

1️⃣ Takes customer data
2️⃣ Predicts who is likely to churn
3️⃣ Explains WHY the model thinks so
4️⃣ Shows results in a dashboard

This is real business AI, not just theory.

📊 What Data Looks Like

Each row = 1 customer
Each column = customer info

Feature	Meaning
Tenure	How long customer stayed
MonthlyCharges	How much they pay
ContractType	Monthly / Yearly
InternetService	Fiber / DSL / None
PaymentMethod	Card / Bank / Cash
SupportCalls	How many complaints
Churn	YES or NO (target)

Your model learns patterns like:

Short tenure + many complaints → high churn risk

Long contract + low complaints → low risk

🤖 ML Part (Backend)

You train a model like:

XGBoost (very powerful for tabular data)

Or Random Forest / LightGBM

Model output:

Customer A → 82% chance of churn
Customer B → 12% chance of churn

🧠 The COOL Part — Explainability (SHAP)

Companies don’t trust “black box” AI.
They want to know:

❓ “WHY did you say this customer will leave?”

SHAP gives answers like:

Customer A churn risk is high because:

❌ Very short tenure

❌ High monthly charges

❌ Many support complaints

This is 🔥 in interviews because it shows you understand Responsible AI

🖥️ What Your Web App (Lovable) Will Show
📂 Upload Section

User uploads CSV of customers

📈 Prediction Dashboard

Table like:

Customer	Churn Risk	Risk Level
C001	82%	🔴 High
C002	35%	🟡 Medium
C003	10%	🟢 Low
🔍 Customer Detail View

Click a customer → see SHAP explanation chart

“Top reasons this customer may leave”

📊 Business Insights Panel

% of customers at high risk

Revenue at risk

Most important churn factors overall

🧩 How Lovable Fits In

✔ Upload file interface
✔ Dashboard UI
✔ Charts & tables
✔ Customer detail pages

Backend (Python / FastAPI):
✔ Model training
✔ Predictions
✔ SHAP explanations    in summary, it is a Customer Churn Predictor
Build an end-to-end ML system that predicts customer churn with explainable results. Deploy as an interactive dashboard where managers can assess individual customer risk.

Telco Churn (Kaggle)
XGBoost
SHAP
Streamlit
Deliverables
Kaggle notebook with EDA and model comparison
Streamlit app deployed on HF Spaces

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6c5d7c4c-c311-4ebe-82e7-c0a98d9fc6fa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
