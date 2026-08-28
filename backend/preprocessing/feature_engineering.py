"""Temporal / behavioural feature engineering.

The IBM Telco dataset does NOT ship behavioural columns. We synthesize plausible
session/login signals deterministically from existing features so the engineered
features below are reproducible and aligned with churn risk.

Synthesis is *row-deterministic*: every row draws from a generator seeded by a
stable hash of that row's own attributes, so one customer yields identical
behaviour columns whether it arrives inside a 7043-row training batch or as a
single prediction request. A shared batch-level RNG cannot give that guarantee --
its stream position depends on how many rows precede yours -- which previously
made all four engineered features noise at serving time.
"""
from __future__ import annotations
import hashlib
import numpy as np
import pandas as pd

RNG_SEED = 42

# Raw behavioural columns, synthesized only when the caller does not supply them.
BEHAVIOUR_COLS = ("logins_m1", "logins_m2", "days_since_last_action",
                  "total_sessions", "unique_features_used", "support_tickets")

# Kept out of a row's identity so training and serving agree: the target is absent
# at prediction time, and customerID is dropped before this module ever runs.
_IDENTITY_EXCLUDE = set(BEHAVIOUR_COLS) | {"Churn", "customerID"}


def _identity_strings(df: pd.DataFrame) -> pd.Series:
    """Canonical per-row key: sorted ``col=value`` pairs with numerics normalised.

    Sorting removes column-order effects (the API builds records from a Pydantic
    model, the trainer from CSV order) and ``%.6g`` collapses int 5 and float 5.0
    onto the same token.
    """
    cols = sorted(c for c in df.columns if c not in _IDENTITY_EXCLUDE)
    if not cols:
        return pd.Series(["__empty__"] * len(df), index=df.index)
    parts = []
    for c in cols:
        s = df[c]
        if pd.api.types.is_numeric_dtype(s):
            text = s.map(lambda v: format(float(v), ".6g"))
        else:
            text = s.astype(str)
        parts.append(c + "=" + text)
    out = parts[0]
    for p in parts[1:]:
        out = out + "|" + p
    return out


def _row_seed(identity: str) -> int:
    """Stable 64-bit seed. hashlib, not hash() -- the latter is salted per process."""
    digest = hashlib.blake2b(identity.encode("utf-8"), digest_size=8).digest()
    return int.from_bytes(digest, "big") ^ RNG_SEED


def _synth_behaviour(df: pd.DataFrame) -> pd.DataFrame:
    identities = _identity_strings(df)
    tenure = df["tenure"].clip(lower=1).to_numpy(dtype=float)
    n = len(df)

    logins_noise = np.empty(n)
    decay = np.empty(n)
    recency = np.empty(n)
    session_noise = np.empty(n)
    features_used = np.empty(n)
    tickets_synth = np.empty(n)

    # NOTE: an earlier revision decayed engagement harder for churners, keyed off a
    # `Churn` column that clean_telco has already mapped to 0/1 -- so the branch
    # matched zero rows and never fired. It is deliberately not restored:
    # conditioning a feature on the label leaks the target and inflates AUC.
    for i, ident in enumerate(identities):
        rng = np.random.default_rng(_row_seed(ident))
        logins_noise[i] = rng.normal(8, 3)
        decay[i] = rng.uniform(0.8, 1.1)
        recency[i] = rng.integers(0, 10)
        session_noise[i] = rng.normal(5, 2)
        features_used[i] = rng.integers(1, 9)
        tickets_synth[i] = rng.integers(0, 5)

    base_logins = np.clip(logins_noise + tenure / 12, 0, None)
    logins_m1 = base_logins
    logins_m2 = base_logins * decay
    sessions = np.clip(logins_m1 + logins_m2 + session_noise, 1, None)
    unique_features_used = np.clip(features_used + tenure // 12, 1, 12)
    tickets = np.clip(
        df["supportCalls"].to_numpy(dtype=float)
        if "supportCalls" in df.columns else tickets_synth,
        0, None,
    )

    df = df.copy()
    df["logins_m1"] = logins_m1.round(2)
    df["logins_m2"] = logins_m2.round(2)
    df["days_since_last_action"] = recency.astype(int)
    df["total_sessions"] = sessions.round(2)
    df["unique_features_used"] = unique_features_used.astype(int)
    df["support_tickets"] = tickets.astype(int)
    return df


def engagement_slope(df: pd.DataFrame) -> pd.Series:
    """Logins month-over-month delta, normalised by 30 days."""
    return ((df["logins_m2"] - df["logins_m1"]) / 30.0).rename("engagement_slope")


def inactivity_gap(df: pd.DataFrame) -> pd.Series:
    """Recency: days since last meaningful action."""
    return df["days_since_last_action"].astype(float).rename("inactivity_gap")


def feature_diversity_score(df: pd.DataFrame, max_features: int = 12) -> pd.Series:
    """Fraction of available product features the user has touched."""
    return (df["unique_features_used"] / max_features).clip(0, 1).rename(
        "feature_diversity_score"
    )


def support_to_usage_ratio(df: pd.DataFrame) -> pd.Series:
    """Tickets per session – inflated values indicate frustration."""
    return (df["support_tickets"] / df["total_sessions"].clip(lower=1)).rename(
        "support_to_usage_ratio"
    )


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """Synthesize behaviour (if absent) and append all four engineered signals."""
    if not set(BEHAVIOUR_COLS).issubset(df.columns):
        df = _synth_behaviour(df)

    df = df.copy()
    df["engagement_slope"] = engagement_slope(df)
    df["inactivity_gap"] = inactivity_gap(df)
    df["feature_diversity_score"] = feature_diversity_score(df)
    df["support_to_usage_ratio"] = support_to_usage_ratio(df)
    return df
