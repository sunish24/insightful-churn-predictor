"""Load the IBM Telco Customer Churn dataset. Auto-downloads if missing."""
from __future__ import annotations
import io
import urllib.request
import pandas as pd
from backend.utils.paths import TELCO_CSV

TELCO_URL = (
    "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/"
    "master/data/Telco-Customer-Churn.csv"
)


def download_telco() -> pd.DataFrame:
    """Download the canonical Telco churn CSV and cache it locally."""
    print(f"Downloading Telco dataset to {TELCO_CSV} ...")
    with urllib.request.urlopen(TELCO_URL, timeout=60) as r:
        raw = r.read()
    TELCO_CSV.write_bytes(raw)
    return pd.read_csv(io.BytesIO(raw))


def load_telco() -> pd.DataFrame:
    """Load Telco churn data, downloading on first use."""
    if TELCO_CSV.exists():
        return pd.read_csv(TELCO_CSV)
    return download_telco()
