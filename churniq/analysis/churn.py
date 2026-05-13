"""Calibrated churn classifier.

A churn model with AUC 0.85 but uncalibrated probabilities only tells you
"this customer is *more likely* to churn than that one." A calibrated model
tells you "this customer has a 23% chance of churning" — which means you can
do expected-value calculations for retention spend.

We wrap sklearn's GBM in `CalibratedClassifierCV(method='isotonic')`, train
on a fixed cutoff, and validate calibration on a holdout set with a Brier
score and a binned reliability diagram.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import train_test_split


@dataclass
class ChurnModel:
    pipeline: CalibratedClassifierCV
    roc_auc: float
    brier: float
    calibration_curve: tuple[np.ndarray, np.ndarray]
    """(fraction_of_positives, mean_predicted_value) — input to a reliability diagram."""

    feature_names: list[str]


def make_churn_features(
    orders: pd.DataFrame,
    customers: pd.DataFrame,
    *,
    as_of: pd.Timestamp | None = None,
    churn_window_days: int = 90,
) -> pd.DataFrame:
    """Build per-customer features + churn label.

    Churn label: 1 if the customer has no orders in the last `churn_window_days`
    days before `as_of`, 0 otherwise. Features are computed from data BEFORE
    that window to avoid label leakage.
    """
    as_of = pd.Timestamp(as_of) if as_of is not None else orders["order_date"].max()
    cutoff = as_of - pd.Timedelta(days=churn_window_days)

    feature_orders = orders[orders["order_date"] <= cutoff].copy()
    if feature_orders.empty:
        return pd.DataFrame()

    # Did each customer have any orders in the post-cutoff window?
    recent_active = set(
        orders[(orders["order_date"] > cutoff) & (orders["order_date"] <= as_of)][
            "customer_id"
        ]
    )

    feats = feature_orders.groupby("customer_id").agg(
        n_orders=("order_date", "count"),
        total_spend=("price", "sum"),
        avg_order_value=("price", "mean"),
        max_order_value=("price", "max"),
        last_order_date=("order_date", "max"),
        first_order_date=("order_date", "min"),
    ).reset_index()

    feats["days_since_last_order"] = (cutoff - feats["last_order_date"]).dt.days
    feats["tenure_days"] = (feats["last_order_date"] - feats["first_order_date"]).dt.days
    feats["churned"] = (~feats["customer_id"].isin(recent_active)).astype(int)
    feats = feats.merge(
        customers[["customer_id", "customer_state"]], on="customer_id", how="left"
    )
    return feats


def train_churn_model(
    features: pd.DataFrame,
    *,
    test_size: float = 0.25,
    random_state: int = 42,
) -> ChurnModel:
    """Train a calibrated GBM churn classifier and evaluate on a holdout."""
    if features.empty:
        raise ValueError("features is empty")

    X = features[["n_orders", "total_spend", "avg_order_value", "max_order_value",
                  "days_since_last_order", "tenure_days"]].fillna(0.0)
    y = features["churned"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    base = GradientBoostingClassifier(
        n_estimators=120, max_depth=3, learning_rate=0.08, random_state=random_state
    )
    calibrated = CalibratedClassifierCV(base, method="isotonic", cv=3)
    calibrated.fit(X_train, y_train)

    proba = calibrated.predict_proba(X_test)[:, 1]
    roc = float(roc_auc_score(y_test, proba))
    brier = float(brier_score_loss(y_test, proba))
    frac_pos, mean_pred = calibration_curve(y_test, proba, n_bins=10, strategy="quantile")

    return ChurnModel(
        pipeline=calibrated,
        roc_auc=roc,
        brier=brier,
        calibration_curve=(frac_pos, mean_pred),
        feature_names=list(X.columns),
    )


def predict_churn(model: ChurnModel, features: pd.DataFrame) -> pd.DataFrame:
    """Return per-customer churn probability (calibrated)."""
    if features.empty:
        return pd.DataFrame(columns=["customer_id", "churn_probability"])
    X = features[model.feature_names].fillna(0.0)
    proba = model.pipeline.predict_proba(X)[:, 1]
    return pd.DataFrame({
        "customer_id": features["customer_id"].values,
        "churn_probability": proba,
    })
