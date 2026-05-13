"""Cohort retention must right-censor late cohorts and recover known shapes."""
from __future__ import annotations

import pandas as pd
import pytest

from churniq.analysis.cohort import cohort_retention, retention_heatmap_matrix
from churniq.data.synth import generate_dataset


def test_cohort_period_zero_is_one_hundred_percent():
    """By construction, retention at period 0 = 1.0 for every cohort."""
    ds = generate_dataset(n_customers=500, seed=0)
    out = cohort_retention(ds.orders)
    period_zero = out[out["period_offset"] == 0]
    assert (period_zero["retention"] == 1.0).all()


def test_cohort_late_cohorts_are_right_censored():
    """A cohort that formed last month should have only period 0 observed."""
    ds = generate_dataset(n_customers=1000, seed=0)
    out = cohort_retention(ds.orders)
    latest_cohort = out["cohort_month"].max()
    last_rows = out[out["cohort_month"] == latest_cohort]
    # Only period 0 should be observed for the very last cohort.
    assert last_rows[last_rows["period_offset"] > 0]["observed"].sum() <= 1


def test_retention_drops_after_period_zero():
    """Per-period retention drops from 1.0 by period 1.

    Note: per-period retention (fraction of cohort active in month K) is NOT
    strictly monotone — a customer inactive in month 2 but active in month 3
    contributes to month-3 retention but not month-2. We assert the
    period-0 → period-1 drop, which is universal.
    """
    ds = generate_dataset(n_customers=2000, seed=0)
    out = cohort_retention(ds.orders)
    observed = out[out["observed"]]
    period_zero_avg = observed[observed["period_offset"] == 0]["retention"].mean()
    period_one_avg = observed[observed["period_offset"] == 1]["retention"].mean()
    assert period_zero_avg == 1.0
    assert period_one_avg < period_zero_avg


def test_heatmap_matrix_unobserved_are_nan():
    ds = generate_dataset(n_customers=500, seed=0)
    out = cohort_retention(ds.orders)
    mat = retention_heatmap_matrix(out, max_period=24)
    # Last cohort × period 24 must be NaN (not observed yet).
    last_cohort = mat.index.max()
    assert pd.isna(mat.loc[last_cohort, 24])


def test_empty_orders_returns_empty():
    out = cohort_retention(pd.DataFrame(columns=["customer_id", "order_date"]))
    assert out.empty
