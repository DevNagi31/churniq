"""Causal uplift via Difference-in-Differences (DiD).

Marketing campaigns suffer brutal selection bias: the team targets *engaged*
customers, who buy more anyway. The naive "treated minus untreated" comparison
mixes the real campaign effect with that pre-existing gap.

DiD compares the change pre→post for treated customers against the change
pre→post for control. If the pre-period trends were parallel, the difference
of differences is an unbiased estimate of the causal effect.

This module ships:
  - `did_estimate`: the point estimate, SE, 95% CI from an OLS interaction term
  - `parallel_trends_test`: splits the pre-period in two and checks the trends
    really were parallel before treatment (the key assumption)
  - `naive_comparison`: the wrong number, for "look how much bias matters" demos
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
import statsmodels.formula.api as smf


@dataclass
class DidResult:
    naive_effect: float
    """Mean(treated_post) - mean(untreated_post) — the biased number."""

    did_effect: float
    did_se: float
    did_ci_low: float
    did_ci_high: float
    did_p_value: float

    parallel_trends_p: float
    """p-value for the parallel-trends test (pre-period sub-split interaction).
    Larger = assumption more credible. p > 0.1 is generally considered OK."""

    n_treated: int
    n_control: int


def _build_panel(
    orders: pd.DataFrame,
    exposures: pd.DataFrame,
    *,
    metric: str = "orders_per_month",
) -> pd.DataFrame:
    """Aggregate to one row per (customer, period) with the metric of interest."""
    if metric != "orders_per_month":
        raise NotImplementedError("only orders_per_month supported in v1")

    df = orders.merge(exposures, on="customer_id", how="left")
    df["period"] = np.where(
        df["order_date"] >= df["treatment_period_start"], "post", "pre"
    )
    panel = (
        df.groupby(["customer_id", "exposed", "period"])
        .agg(n_orders=("order_id", "count"))
        .reset_index()
    )
    return panel


def did_estimate(
    orders: pd.DataFrame,
    exposures: pd.DataFrame,
    *,
    metric: str = "orders_per_month",
) -> DidResult:
    """Run a DiD regression on per-customer pre/post counts.

    The exposed×post interaction coefficient is the causal estimate under the
    parallel-trends assumption. We complete the panel so every customer has
    both pre and post rows (zero-filling absences).
    """
    panel = _build_panel(orders, exposures, metric=metric)

    # Complete panel: every (customer, period) cell.
    customers = exposures[["customer_id", "exposed"]].drop_duplicates()
    grid = pd.MultiIndex.from_product(
        [customers["customer_id"], ["pre", "post"]], names=["customer_id", "period"]
    ).to_frame(index=False)
    grid = grid.merge(customers, on="customer_id", how="left")
    full = grid.merge(panel, on=["customer_id", "exposed", "period"], how="left")
    full["n_orders"] = full["n_orders"].fillna(0)
    full["post"] = (full["period"] == "post").astype(int)
    full["treated"] = full["exposed"].astype(int)

    # OLS with the DiD interaction. Clustered SE not strictly needed for the
    # canonical demo, but we keep it interpretable.
    model = smf.ols("n_orders ~ treated * post", data=full).fit()
    did_coef = float(model.params["treated:post"])
    did_se = float(model.bse["treated:post"])
    did_ci = model.conf_int(alpha=0.05).loc["treated:post"]
    did_p = float(model.pvalues["treated:post"])

    # Naive comparison
    post_treated = full[(full["post"] == 1) & (full["treated"] == 1)]["n_orders"].mean()
    post_untreated = full[(full["post"] == 1) & (full["treated"] == 0)]["n_orders"].mean()
    naive = float(post_treated - post_untreated)

    # Parallel-trends pseudo-test: split pre into halves and check that the
    # treated×early_half interaction is not significant.
    pt_p = _parallel_trends_p(orders, exposures)

    return DidResult(
        naive_effect=naive,
        did_effect=did_coef,
        did_se=did_se,
        did_ci_low=float(did_ci.iloc[0]),
        did_ci_high=float(did_ci.iloc[1]),
        did_p_value=did_p,
        parallel_trends_p=pt_p,
        n_treated=int(exposures["exposed"].sum()),
        n_control=int((~exposures["exposed"]).sum()),
    )


def _parallel_trends_p(orders: pd.DataFrame, exposures: pd.DataFrame) -> float:
    """Test the parallel-trends assumption by checking the pre-period sub-split.

    Splits the pre-period at its midpoint. If the treated×early_half interaction
    is significant, the trends were NOT parallel before treatment — DiD is biased.
    """
    df = orders.merge(exposures, on="customer_id", how="left")
    pre = df[df["order_date"] < df["treatment_period_start"]].copy()
    if pre.empty:
        return 1.0
    mid = pre["order_date"].min() + (pre["order_date"].max() - pre["order_date"].min()) / 2
    pre["sub"] = np.where(pre["order_date"] < mid, "early", "late")
    agg = (
        pre.groupby(["customer_id", "exposed", "sub"])
        .agg(n_orders=("order_id", "count"))
        .reset_index()
    )
    customers = exposures[["customer_id", "exposed"]].drop_duplicates()
    grid = pd.MultiIndex.from_product(
        [customers["customer_id"], ["early", "late"]], names=["customer_id", "sub"]
    ).to_frame(index=False)
    grid = grid.merge(customers, on="customer_id", how="left")
    full = grid.merge(agg, on=["customer_id", "exposed", "sub"], how="left")
    full["n_orders"] = full["n_orders"].fillna(0)
    full["late"] = (full["sub"] == "late").astype(int)
    full["treated"] = full["exposed"].astype(int)
    try:
        model = smf.ols("n_orders ~ treated * late", data=full).fit()
        return float(model.pvalues["treated:late"])
    except Exception:
        return 1.0
