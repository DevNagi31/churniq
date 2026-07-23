"""Cohort retention with right-censoring.

Customers grouped by their first-purchase month form cohorts; for each cohort
we measure what fraction had at least one purchase in month M+k. Late cohorts
have less observation time than early ones, so we mark cells that haven't been
fully observed yet as None, since naive averaging without this biases the curve.

Returns a long-form DataFrame with columns:
    cohort_month, period_offset, n_active, n_cohort, retention, observed
"""
from __future__ import annotations

import pandas as pd


def cohort_retention(orders: pd.DataFrame, *, as_of: pd.Timestamp | None = None) -> pd.DataFrame:
    """Compute cohort retention with right-censoring.

    Args:
        orders: DataFrame with `customer_id`, `order_date` columns.
        as_of: end of observation window. Defaults to max(order_date).

    Returns:
        Long-form DataFrame with one row per (cohort_month, period_offset).
        `observed=False` rows are those where the cohort hasn't had enough
        elapsed time to fully observe, so display these as dimmed cells, not zeros.
    """
    if orders.empty:
        return pd.DataFrame(
            columns=["cohort_month", "period_offset", "n_active", "n_cohort", "retention", "observed"]
        )

    df = orders[["customer_id", "order_date"]].copy()
    df["order_month"] = df["order_date"].dt.to_period("M").dt.to_timestamp()

    # Cohort = first purchase month per customer.
    cohort = df.groupby("customer_id", as_index=False)["order_month"].min()
    cohort.columns = ["customer_id", "cohort_month"]

    df = df.merge(cohort, on="customer_id")
    df["period_offset"] = (
        (df["order_month"].dt.year - df["cohort_month"].dt.year) * 12
        + (df["order_month"].dt.month - df["cohort_month"].dt.month)
    )

    # cohort_size = # unique customers per cohort (period 0 by definition)
    cohort_sizes = cohort.groupby("cohort_month").size().rename("n_cohort")

    # Actives per (cohort, period)
    active = (
        df.groupby(["cohort_month", "period_offset"])["customer_id"]
        .nunique()
        .rename("n_active")
        .reset_index()
    )

    out = active.merge(cohort_sizes.reset_index(), on="cohort_month", how="left")
    out["retention"] = out["n_active"] / out["n_cohort"]

    # Right-censoring: a (cohort, period) cell is observed only if the cohort
    # has had at least `period_offset` months elapsed since formation by `as_of`.
    as_of = as_of or df["order_date"].max()
    as_of_month = pd.Timestamp(as_of).to_period("M").to_timestamp()
    out["months_elapsed"] = (
        (as_of_month.year - out["cohort_month"].dt.year) * 12
        + (as_of_month.month - out["cohort_month"].dt.month)
    )
    out["observed"] = out["period_offset"] <= out["months_elapsed"]

    return out[
        ["cohort_month", "period_offset", "n_active", "n_cohort", "retention", "observed"]
    ].sort_values(["cohort_month", "period_offset"]).reset_index(drop=True)


def retention_heatmap_matrix(
    retention_long: pd.DataFrame, *, max_period: int = 12
) -> pd.DataFrame:
    """Pivot long-form retention into a heatmap-shaped DataFrame.

    Rows are cohort months, columns are period_offset 0..max_period.
    Unobserved cells become NaN so a UI can render them as gray.
    """
    if retention_long.empty:
        return pd.DataFrame()
    df = retention_long[retention_long["period_offset"] <= max_period].copy()
    df.loc[~df["observed"], "retention"] = pd.NA
    pivot = df.pivot(index="cohort_month", columns="period_offset", values="retention")
    pivot = pivot.reindex(columns=range(max_period + 1))
    return pivot
