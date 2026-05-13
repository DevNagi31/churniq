"""Olist-schema-compatible synthetic e-commerce data generator.

Mirrors the public Olist Brazilian E-commerce dataset's schema and rough
shape (~100K orders across ~99K customers over ~24 months) so the same
analysis code runs unchanged on the real data when you drop it in.

Generates correlated customer behavior so the BG/NBD CLV model and the
churn classifier actually have signal to recover, plus a known marketing
campaign with selection bias for the DiD causal-uplift test.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass
class SynthDataset:
    customers: pd.DataFrame          # customer_id, state, signup_date, segment
    orders: pd.DataFrame             # order_id, customer_id, order_date, price
    campaign_exposures: pd.DataFrame  # customer_id, exposed, treatment_period_start
    true_campaign_effect: float


STATES = ["SP", "RJ", "MG", "RS", "PR", "BA", "SC", "GO", "ES", "DF"]


def generate_dataset(
    n_customers: int = 10_000,
    *,
    start_date: str = "2016-09-01",
    end_date: str = "2018-08-31",
    seed: int = 42,
    true_campaign_effect: float = 0.20,  # +20% repeat-purchase rate among treated
) -> SynthDataset:
    """Generate a deterministic dataset that mirrors Olist's schema.

    The data has these properties:
      - Heavy-tail customer activity (most buy once, a few buy many times)
      - Pre/post-campaign behavior so DiD has something to recover
      - Selection bias in campaign exposure (engaged users get the email)
      - State-level distribution roughly matching Olist (SP dominates)
    """
    rng = np.random.default_rng(seed)
    start = pd.Timestamp(start_date)
    end = pd.Timestamp(end_date)
    total_days = (end - start).days

    # ---- Customers ----
    customer_ids = [f"c_{i:06d}" for i in range(n_customers)]
    # State distribution roughly mirrors Olist (SP ~40%, RJ ~13%, MG ~12%, others smaller).
    state_probs = np.array([0.42, 0.13, 0.12, 0.06, 0.05, 0.04, 0.04, 0.04, 0.05, 0.05])
    states = rng.choice(STATES, size=n_customers, p=state_probs)
    signup_offset = rng.integers(0, total_days // 2, size=n_customers)
    signup_dates = [start + pd.Timedelta(days=int(d)) for d in signup_offset]

    # Latent engagement per customer drives both order frequency and campaign exposure.
    # Right-skewed: most users are low-engagement, a few are very high.
    engagement = rng.gamma(shape=1.5, scale=0.8, size=n_customers)

    customers = pd.DataFrame({
        "customer_id": customer_ids,
        "customer_state": states,
        "signup_date": signup_dates,
        "engagement_latent": engagement,
    })

    # ---- Orders ----
    # Number of orders per customer ~ NegBin parametrized by engagement.
    orders_per_customer = rng.poisson(lam=engagement * 0.6, size=n_customers)
    orders_per_customer = np.clip(orders_per_customer, 0, 30)

    order_rows = []
    order_counter = 0
    campaign_period_start = start + pd.Timedelta(days=int(total_days * 0.6))

    for i, n_orders in enumerate(orders_per_customer):
        if n_orders == 0:
            continue
        first_order_offset = max(0, int(signup_offset[i]))
        latest_order_offset = total_days - 1
        if first_order_offset >= latest_order_offset:
            continue
        order_days = rng.integers(first_order_offset, latest_order_offset, size=n_orders)
        order_days.sort()
        for d in order_days:
            order_date = start + pd.Timedelta(days=int(d))
            # Heavy-tailed price distribution.
            price = float(np.round(rng.lognormal(mean=4.6, sigma=0.6), 2))
            order_rows.append({
                "order_id": f"o_{order_counter:07d}",
                "customer_id": customer_ids[i],
                "order_date": order_date,
                "price": price,
            })
            order_counter += 1

    orders = pd.DataFrame(order_rows)

    # ---- Campaign exposures + simulated post-period uplift ----
    # Selection bias: engaged customers are MUCH more likely to be exposed.
    exposure_prob = 1.0 / (1.0 + np.exp(-(engagement - 1.2) * 2.0))
    exposed = rng.binomial(1, exposure_prob).astype(bool)

    # Add post-campaign extra orders to treated customers.
    extra_order_rows = []
    for i, was_exposed in enumerate(exposed):
        if not was_exposed:
            continue
        # Probability of an extra post-campaign order ~ true_campaign_effect.
        if rng.uniform() < true_campaign_effect:
            order_day = total_days - rng.integers(1, max(2, int(total_days * 0.35)))
            order_date = start + pd.Timedelta(days=int(order_day))
            if order_date <= campaign_period_start:
                continue
            extra_order_rows.append({
                "order_id": f"o_{order_counter:07d}",
                "customer_id": customer_ids[i],
                "order_date": order_date,
                "price": float(np.round(rng.lognormal(mean=4.6, sigma=0.6), 2)),
            })
            order_counter += 1

    if extra_order_rows:
        orders = pd.concat([orders, pd.DataFrame(extra_order_rows)], ignore_index=True)

    orders = orders.sort_values("order_date").reset_index(drop=True)

    campaign_exposures = pd.DataFrame({
        "customer_id": customer_ids,
        "exposed": exposed,
        "treatment_period_start": campaign_period_start,
    })

    return SynthDataset(
        customers=customers,
        orders=orders,
        campaign_exposures=campaign_exposures,
        true_campaign_effect=true_campaign_effect,
    )
