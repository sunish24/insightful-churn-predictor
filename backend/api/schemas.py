"""Pydantic request/response schemas."""
from __future__ import annotations
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class CustomerRecord(BaseModel):
    """Raw Telco-style record. Extra keys are tolerated."""
    model_config = {"extra": "allow"}
    tenure: float = Field(..., ge=0)
    MonthlyCharges: float = Field(..., ge=0)
    TotalCharges: Optional[float] = None
    Contract: Optional[str] = "Month-to-month"
    InternetService: Optional[str] = "Fiber optic"
    PaymentMethod: Optional[str] = "Electronic check"
    gender: Optional[str] = "Female"
    SeniorCitizen: Optional[int] = 0
    Partner: Optional[str] = "No"
    Dependents: Optional[str] = "No"
    PhoneService: Optional[str] = "Yes"
    MultipleLines: Optional[str] = "No"
    OnlineSecurity: Optional[str] = "No"
    OnlineBackup: Optional[str] = "No"
    DeviceProtection: Optional[str] = "No"
    TechSupport: Optional[str] = "No"
    StreamingTV: Optional[str] = "No"
    StreamingMovies: Optional[str] = "No"
    PaperlessBilling: Optional[str] = "Yes"


class SurvivalResponse(BaseModel):
    hazard_ratio: float
    median_survival_months: int
    survival_curve: List[Dict[str, float]]


class ChurnResponse(BaseModel):
    model: str
    churn_probability: float
    risk_level: str


class ShapItem(BaseModel):
    feature: str
    value: float
    impact: float


class ExplainResponse(BaseModel):
    churn_probability: float
    risk_level: str
    explanations: List[ShapItem]


class CFResponse(BaseModel):
    counterfactuals: List[Dict[str, Any]]
    error: Optional[str] = None


class NetworkMetrics(BaseModel):
    """Named so the node/edge counts stay integers on the wire."""
    avg_degree: float
    avg_clustering: float
    avg_neighbour_churn_rate: float
    n_nodes: int
    n_edges: int


class NetworkResponse(BaseModel):
    metrics: NetworkMetrics
    top_risky_nodes: List[Dict[str, Any]]


class BudgetCustomer(BaseModel):
    id: str
    churn_risk: float
    clv: float
    cost: float


class BudgetRequest(BaseModel):
    budget: float
    customers: List[BudgetCustomer]


class BudgetResponse(BaseModel):
    ranked: List[Dict[str, Any]]
    selected: List[Dict[str, Any]]
    budget: float
    spent: float
    expected_revenue_saved: float
