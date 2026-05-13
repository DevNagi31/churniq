"""RFM segmentation: Recency, Frequency, Monetary scores → standard segments.

Each dimension scored 1-5 by quintile, then segments assigned by a small lookup
matrix. Six classical segments cover ~95% of customers usefully:

    Champions       : top R + top F + top M
    Loyal           : high F + high M, R can be middle
    Potential Loyal : high R, mid F+M (recent newcomers showing repeat behavior)
    At Risk         : was active (high F+M), now low R
    Hibernating     : low across the board, but not lost yet
    Lost            : lowest of everything
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def compute_rfm(
    orders: pd.DataFrame, *, as_of: pd.Timestamp | None = None
) -> pd.DataFrame:
    """Compute per-customer RFM scores (1-5 quintiles) plus a segment label.

    Args:
        orders: DataFrame with `customer_id`, `order_date`, `price`.
        as_of: reference date for recency. Defaults to max(order_date) + 1 day.

    Returns:
        DataFrame: customer_id, recency_days, frequency, monetary, R, F, M, segment
    """
    if orders.empty:
        return pd.DataFrame(
            columns=["customer_id", "recency_days", "frequency", "monetary", "R", "F", "M", "segment"]
        )

    as_of = pd.Timestamp(as_of) if as_of is not None else orders["order_date"].max() + pd.Timedelta(days=1)

    agg = orders.groupby("customer_id").agg(
        last_order=("order_date", "max"),
        frequency=("order_date", "count"),
        monetary=("price", "sum"),
    ).reset_index()
    agg["recency_days"] = (as_of - agg["last_order"]).dt.days

    # R: smaller recency is better (so reverse the quintile)
    agg["R"] = _quintile(agg["recency_days"], reverse=True)
    agg["F"] = _quintile(agg["frequency"])
    agg["M"] = _quintile(agg["monetary"])

    agg["segment"] = agg.apply(_assign_segment, axis=1)
    return agg[
        ["customer_id", "recency_days", "frequency", "monetary", "R", "F", "M", "segment"]
    ]


def _quintile(series: pd.Series, *, reverse: bool = False) -> pd.Series:
    """Return integer 1-5 quintile rank. Reverse=True flips so smaller is better."""
    ranks = series.rank(method="first", pct=True)
    q = np.ceil(ranks * 5).astype(int).clip(1, 5)
    if reverse:
        q = 6 - q
    return q


def _assign_segment(row) -> str:
    R, F, M = row["R"], row["F"], row["M"]
    if R >= 4 and F >= 4 and M >= 4:
        return "Champions"
    if F >= 4 and M >= 3:
        return "Loyal"
    if R >= 4 and F <= 2:
        return "Potential Loyal"
    if R <= 2 and F >= 3:
        return "At Risk"
    if R <= 2 and F <= 2 and M <= 2:
        return "Lost"
    return "Hibernating"


SEGMENT_ORDER = [
    "Champions",
    "Loyal",
    "Potential Loyal",
    "At Risk",
    "Hibernating",
    "Lost",
]


def segment_summary(rfm: pd.DataFrame) -> pd.DataFrame:
    """Per-segment summary stats: count, share, avg recency / frequency / monetary."""
    if rfm.empty:
        return pd.DataFrame(columns=["segment", "n", "share", "avg_recency_days", "avg_frequency", "avg_monetary"])
    summary = (
        rfm.groupby("segment")
        .agg(
            n=("customer_id", "count"),
            avg_recency_days=("recency_days", "mean"),
            avg_frequency=("frequency", "mean"),
            avg_monetary=("monetary", "mean"),
        )
        .reset_index()
    )
    total = summary["n"].sum()
    summary["share"] = summary["n"] / total if total else 0.0
    summary["segment"] = pd.Categorical(summary["segment"], SEGMENT_ORDER, ordered=True)
    return summary.sort_values("segment").reset_index(drop=True)
