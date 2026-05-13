"""RFM scores and segment assignment."""
from __future__ import annotations

import pandas as pd

from churniq.analysis.rfm import SEGMENT_ORDER, compute_rfm, segment_summary
from churniq.data.synth import generate_dataset


def test_rfm_scores_in_range():
    ds = generate_dataset(n_customers=1000, seed=0)
    out = compute_rfm(ds.orders)
    for col in ["R", "F", "M"]:
        assert out[col].between(1, 5).all()


def test_segment_categories_known():
    ds = generate_dataset(n_customers=1000, seed=0)
    out = compute_rfm(ds.orders)
    for seg in out["segment"].unique():
        assert seg in SEGMENT_ORDER


def test_segment_summary_shares_sum_to_one():
    ds = generate_dataset(n_customers=2000, seed=0)
    rfm = compute_rfm(ds.orders)
    summary = segment_summary(rfm)
    assert abs(summary["share"].sum() - 1.0) < 1e-9


def test_champions_have_high_rfm():
    """Customers in Champions segment should have R, F, M all in the top quintiles."""
    ds = generate_dataset(n_customers=2000, seed=0)
    rfm = compute_rfm(ds.orders)
    champs = rfm[rfm["segment"] == "Champions"]
    if len(champs) > 0:
        assert (champs["R"] >= 4).all()
        assert (champs["F"] >= 4).all()
        assert (champs["M"] >= 4).all()


def test_lost_have_low_rfm():
    ds = generate_dataset(n_customers=2000, seed=0)
    rfm = compute_rfm(ds.orders)
    lost = rfm[rfm["segment"] == "Lost"]
    if len(lost) > 0:
        assert (lost["R"] <= 2).all()


def test_empty_orders_returns_empty():
    out = compute_rfm(pd.DataFrame(columns=["customer_id", "order_date", "price"]))
    assert out.empty
