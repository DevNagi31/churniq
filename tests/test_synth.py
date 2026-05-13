"""Synthetic generator must produce reproducible Olist-schema data."""
from __future__ import annotations

import pandas as pd

from churniq.data.synth import STATES, generate_dataset


def test_schema():
    ds = generate_dataset(n_customers=500, seed=0)
    assert set(ds.customers.columns) >= {"customer_id", "customer_state", "signup_date"}
    assert set(ds.orders.columns) >= {"order_id", "customer_id", "order_date", "price"}
    assert set(ds.campaign_exposures.columns) >= {"customer_id", "exposed", "treatment_period_start"}


def test_deterministic_with_seed():
    a = generate_dataset(n_customers=500, seed=42)
    b = generate_dataset(n_customers=500, seed=42)
    pd.testing.assert_frame_equal(a.orders, b.orders)


def test_states_are_valid():
    ds = generate_dataset(n_customers=1000, seed=0)
    assert set(ds.customers["customer_state"]) <= set(STATES)


def test_selection_bias_in_exposure():
    """Exposed customers should buy more on average (the bias DiD must correct)."""
    ds = generate_dataset(n_customers=3000, seed=0)
    pre_period = ds.orders[ds.orders["order_date"] < ds.campaign_exposures["treatment_period_start"].iloc[0]]
    counts = pre_period.groupby("customer_id").size().rename("n").reset_index()
    merged = counts.merge(ds.campaign_exposures[["customer_id", "exposed"]], on="customer_id")
    treated_mean = merged[merged["exposed"]]["n"].mean()
    untreated_mean = merged[~merged["exposed"]]["n"].mean()
    # By construction, treated had more orders even before the campaign.
    assert treated_mean > untreated_mean


def test_prices_positive_and_finite():
    ds = generate_dataset(n_customers=500, seed=0)
    assert (ds.orders["price"] > 0).all()
    assert ds.orders["price"].notna().all()
