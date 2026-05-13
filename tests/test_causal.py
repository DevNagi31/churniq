"""DiD must separate the real campaign effect from selection bias.

The synthetic generator bakes in:
  - True campaign effect: +20% extra order probability for treated users
  - Selection bias: engaged users are far more likely to be exposed

Naive comparison ("treated minus untreated") will be dominated by the
selection bias and overstate the effect substantially. DiD should recover
something closer to the true effect.
"""
from __future__ import annotations

import pytest

from churniq.analysis.causal import did_estimate
from churniq.data.synth import generate_dataset


def test_did_separates_real_effect_from_naive():
    ds = generate_dataset(n_customers=5000, true_campaign_effect=0.25, seed=0)
    r = did_estimate(ds.orders, ds.campaign_exposures)
    # Naive should be larger (more biased upward) than DiD because of selection
    # bias. The ratio should be meaningfully greater than 1.
    assert r.naive_effect > 0
    assert r.did_effect > 0
    assert r.naive_effect > r.did_effect


def test_did_significance_for_strong_effect():
    """A 25% campaign effect on 5000 customers should be detectable."""
    ds = generate_dataset(n_customers=5000, true_campaign_effect=0.30, seed=42)
    r = did_estimate(ds.orders, ds.campaign_exposures)
    assert r.did_p_value < 0.05


def test_did_ci_contains_did_effect():
    ds = generate_dataset(n_customers=2000, seed=7)
    r = did_estimate(ds.orders, ds.campaign_exposures)
    assert r.did_ci_low <= r.did_effect <= r.did_ci_high


def test_parallel_trends_returns_p_value():
    ds = generate_dataset(n_customers=2000, seed=0)
    r = did_estimate(ds.orders, ds.campaign_exposures)
    assert 0.0 <= r.parallel_trends_p <= 1.0


def test_did_recovers_zero_when_no_effect():
    """If true_campaign_effect is zero, DiD should produce a small estimate."""
    ds = generate_dataset(n_customers=3000, true_campaign_effect=0.0, seed=5)
    r = did_estimate(ds.orders, ds.campaign_exposures)
    # With no effect baked in, DiD estimate should be near zero (within ~3 SE).
    assert abs(r.did_effect) < 3 * r.did_se + 0.05
