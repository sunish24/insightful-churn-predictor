"""Telco preprocessing pipeline: cleaning, encoding, scaling, survival columns."""
from __future__ import annotations
from dataclasses import dataclass
from typing import List, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

from backend.preprocessing.feature_engineering import add_engineered_features
from backend.utils.paths import PREPROCESSOR_PKL, FEATURE_META_PKL

DROP_COLS = ["customerID"]
TARGET_COL = "Churn"
DURATION_COL = "tenure"


@dataclass
class FeatureMeta:
    numeric: List[str]
    categorical: List[str]
    feature_names_out: List[str]


def clean_telco(df: pd.DataFrame) -> pd.DataFrame:
    """Coerce TotalCharges, drop NaNs, normalise target."""
    df = df.copy()
    if "TotalCharges" in df.columns:
        df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
        df["TotalCharges"] = df["TotalCharges"].fillna(df["TotalCharges"].median())
    for c in DROP_COLS:
        if c in df.columns:
            df = df.drop(columns=c)
    if TARGET_COL in df.columns:
        df[TARGET_COL] = (df[TARGET_COL].astype(str).str.lower() == "yes").astype(int)
    return df


def split_columns(df: pd.DataFrame) -> Tuple[List[str], List[str]]:
    numeric, categorical = [], []
    for c in df.columns:
        if c in (TARGET_COL, DURATION_COL):
            continue
        if pd.api.types.is_numeric_dtype(df[c]):
            numeric.append(c)
        else:
            categorical.append(c)
    return numeric, categorical


def build_preprocessor(numeric: List[str], categorical: List[str]) -> ColumnTransformer:
    numeric_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer([
        ("num", numeric_pipe, numeric),
        ("cat", cat_pipe, categorical),
    ])


def fit_transform_full(df_raw: pd.DataFrame):
    """End-to-end fit: clean → engineer → encode → return X, y, duration, event, meta."""
    df = clean_telco(df_raw)
    df = add_engineered_features(df)

    y = df[TARGET_COL].astype(int) if TARGET_COL in df.columns else None
    duration = df[DURATION_COL].astype(float)
    event = y.copy() if y is not None else None

    feature_df = df.drop(columns=[c for c in (TARGET_COL,) if c in df.columns])
    numeric, categorical = split_columns(feature_df)

    pre = build_preprocessor(numeric, categorical)
    X = pre.fit_transform(feature_df)

    ohe = pre.named_transformers_["cat"].named_steps["ohe"]
    cat_names = list(ohe.get_feature_names_out(categorical)) if categorical else []
    feature_names = numeric + cat_names
    meta = FeatureMeta(numeric=numeric, categorical=categorical,
                       feature_names_out=feature_names)

    joblib.dump(pre, PREPROCESSOR_PKL)
    joblib.dump(meta, FEATURE_META_PKL)

    X_df = pd.DataFrame(X, columns=feature_names, index=df.index)
    return X_df, y, duration, event, meta


def load_preprocessor():
    return joblib.load(PREPROCESSOR_PKL), joblib.load(FEATURE_META_PKL)


def transform_one(record: dict) -> pd.DataFrame:
    """Transform a single raw customer dict into the model feature space."""
    pre, meta = load_preprocessor()
    df = pd.DataFrame([record])
    df = clean_telco(df)
    df = add_engineered_features(df)
    if TARGET_COL in df.columns:
        df = df.drop(columns=TARGET_COL)
    X = pre.transform(df)
    return pd.DataFrame(X, columns=meta.feature_names_out)
