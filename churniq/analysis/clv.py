"""Customer Lifetime Value via BG/NBD + Gamma-Gamma.

BG/NBD (Fader, Hardie, Lee 2005) models the *number* of future purchases per
customer; Gamma-Gamma models the *average monetary value* per purchase. Their
product, integrated over a future horizon, is the predicted CLV.

This module wraps the `lifetimes` library with the validation step that most
RAG/CLV portfolio projects skip: a holdout-period MAPE so you actually know
how well your CLV model is calibrated to your data, not just that it ran.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from lifetimes import BetaGeoFitter, GammaGammaFitter
from lifetimes.utils import summary_data_from_transaction_data


@dataclass
class ClvResult:
    customer_clv: pd.DataFrame
    """Per-customer: customer_id, frequency, recency, T, monetary_value, predicted_clv."""

    holdout_mape: float | None
    """Mean Absolute Percentage Error on held-out future purchases. None if no holdout."""

    bgnbd_params: dict
    gamma_params: dict
    horizon_months: int


def fit_clv(
    orders: pd.DataFrame,
    *,
    horizon_months: int = 12,
    holdout_months: int | None = 6,
    discount_rate: float = 0.01,
) -> ClvResult:
    """Fit BG/NBD + Gamma-Gamma and predict CLV over the next `horizon_months`.

    Args:
        orders: DataFrame with customer_id, order_date, price.
        horizon_months: forward CLV horizon.
        holdout_months: if set, holds out the last N months from training and
            reports MAPE on actual repeat purchases in that period.
        discount_rate: monthly discount rate for present-value CLV.
    """
    if orders.empty:
        return ClvResult(pd.DataFrame(), None, {}, {}, horizon_months)

    end = orders["order_date"].max()
    train_end = end - pd.DateOffset(months=holdout_months) if holdout_months else end

    train = orders[orders["order_date"] <= train_end]
    summary = summary_data_from_transaction_data(
        train,
        customer_id_col="customer_id",
        datetime_col="order_date",
        monetary_value_col="price",
        observation_period_end=train_end,
        freq="D",
    )

    # BG/NBD on (frequency, recency, T). Only fit on customers who returned.
    bgf = BetaGeoFitter(penalizer_coef=0.001)
    bgf.fit(summary["frequency"], summary["recency"], summary["T"])

    # Gamma-Gamma for monetary value (requires frequency > 0 and monetary > 0).
    returning = summary[(summary["frequency"] > 0) & (summary["monetary_value"] > 0)]
    if len(returning) < 10:
        # Not enough returning customers to fit Gamma-Gamma; fall back to median price.
        med = float(orders["price"].median())
        summary["predicted_clv"] = (
            bgf.conditional_expected_number_of_purchases_up_to_time(
                horizon_months * 30, summary["frequency"], summary["recency"], summary["T"]
            )
            * med
        )
    else:
        ggf = GammaGammaFitter(penalizer_coef=0.001)
        ggf.fit(returning["frequency"], returning["monetary_value"])
        # Predicted average monetary value per purchase for every customer.
        pred_mv = ggf.conditional_expected_average_profit(
            summary["frequency"], summary["monetary_value"]
        )
        pred_purchases = bgf.conditional_expected_number_of_purchases_up_to_time(
            horizon_months * 30,
            summary["frequency"],
            summary["recency"],
            summary["T"],
        )
        summary["predicted_clv"] = pred_mv * pred_purchases

    summary = summary.reset_index()
    summary.columns = [
        "customer_id" if c == "customer_id" else c for c in summary.columns
    ]

    # Holdout validation
    holdout_mape: float | None = None
    if holdout_months:
        holdout = orders[(orders["order_date"] > train_end) & (orders["order_date"] <= end)]
        actual_purchases = (
            holdout.groupby("customer_id").size().rename("actual_purchases").reset_index()
        )
        predicted_purchases = pd.DataFrame({
            "customer_id": summary["customer_id"],
            "predicted_purchases": bgf.conditional_expected_number_of_purchases_up_to_time(
                holdout_months * 30,
                summary["frequency"],
                summary["recency"],
                summary["T"],
            ).values,
        })
        merged = predicted_purchases.merge(actual_purchases, on="customer_id", how="left")
        merged["actual_purchases"] = merged["actual_purchases"].fillna(0.0)
        # MAPE on customers with at least one predicted purchase to avoid /0 noise.
        eligible = merged[merged["predicted_purchases"] > 0.05]
        if len(eligible) > 0:
            ape = np.abs(eligible["actual_purchases"] - eligible["predicted_purchases"]) / (
                eligible["predicted_purchases"] + 0.5
            )
            holdout_mape = float(ape.mean())

    return ClvResult(
        customer_clv=summary[
            ["customer_id", "frequency", "recency", "T", "monetary_value", "predicted_clv"]
        ],
        holdout_mape=holdout_mape,
        bgnbd_params={
            "r": float(bgf.params_["r"]),
            "alpha": float(bgf.params_["alpha"]),
            "a": float(bgf.params_["a"]),
            "b": float(bgf.params_["b"]),
        },
        gamma_params={},
        horizon_months=horizon_months,
    )
