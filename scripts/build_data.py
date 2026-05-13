"""Run the full ChurnIQ analytics pipeline and emit JSON for the Next.js app.

Outputs land in public/data/ where the Next.js routes can fetch them at
request time. Re-run when the dataset or model changes:

    python scripts/build_data.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

from churniq.analysis.causal import did_estimate
from churniq.analysis.churn import (
    make_churn_features,
    predict_churn,
    train_churn_model,
)
from churniq.analysis.clv import fit_clv
from churniq.analysis.cohort import cohort_retention, retention_heatmap_matrix
from churniq.analysis.rfm import compute_rfm, segment_summary
from churniq.data.synth import generate_dataset

OUT = Path(__file__).resolve().parents[1] / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def to_json_safe(obj):
    if isinstance(obj, (pd.Timestamp, pd.Period)):
        return str(obj.date()) if hasattr(obj, "date") else str(obj)
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj) if np.isfinite(obj) else None
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if pd.isna(obj):
        return None
    raise TypeError(f"unhandled type: {type(obj)}")


def dump(name: str, obj) -> None:
    path = OUT / f"{name}.json"
    path.write_text(json.dumps(obj, default=to_json_safe, indent=2))
    print(f"wrote {path.relative_to(OUT.parent.parent)}")


def main() -> None:
    print("Generating synthetic Olist-shape dataset...")
    ds = generate_dataset(n_customers=10_000, seed=42)
    n_orders = len(ds.orders)
    n_customers = len(ds.customers)
    print(f"  {n_customers:,} customers · {n_orders:,} orders")

    # Overview KPIs
    gmv = float(ds.orders["price"].sum())
    repeat_rate = float(ds.orders.groupby("customer_id").size().gt(1).mean())
    dump("overview", {
        "n_customers": n_customers,
        "n_orders": n_orders,
        "gmv": gmv,
        "repeat_rate": repeat_rate,
        "period_start": str(ds.orders["order_date"].min().date()),
        "period_end": str(ds.orders["order_date"].max().date()),
    })

    # Cohort retention
    print("Computing cohort retention...")
    retention_long = cohort_retention(ds.orders)
    mat = retention_heatmap_matrix(retention_long, max_period=12)
    cohort_rows = []
    for cohort, row in mat.iterrows():
        cohort_rows.append({
            "cohort_month": str(cohort.date()),
            "retention": [None if pd.isna(v) else float(v) for v in row.values],
        })
    dump("cohorts", {"max_period": 12, "cohorts": cohort_rows})

    # RFM segments
    print("Computing RFM segments...")
    rfm = compute_rfm(ds.orders)
    seg = segment_summary(rfm)
    dump("segments", {
        "segments": [
            {
                "segment": str(r["segment"]),
                "n": int(r["n"]),
                "share": float(r["share"]),
                "avg_recency_days": float(r["avg_recency_days"]),
                "avg_frequency": float(r["avg_frequency"]),
                "avg_monetary": float(r["avg_monetary"]),
            }
            for _, r in seg.iterrows()
        ]
    })

    # CLV
    print("Fitting BG/NBD + Gamma-Gamma CLV (this takes ~15s)...")
    clv = fit_clv(ds.orders, horizon_months=12, holdout_months=4)
    # Top-10 customers by predicted CLV
    top = clv.customer_clv.nlargest(20, "predicted_clv")
    # CLV distribution bins
    clv_values = clv.customer_clv["predicted_clv"].dropna().values
    if len(clv_values) > 0:
        bins = np.percentile(clv_values, [10, 25, 50, 75, 90, 99])
    else:
        bins = []
    dump("clv", {
        "horizon_months": clv.horizon_months,
        "holdout_mape": clv.holdout_mape,
        "bgnbd_params": clv.bgnbd_params,
        "percentiles": {
            "p10": float(bins[0]) if len(bins) else None,
            "p25": float(bins[1]) if len(bins) else None,
            "p50": float(bins[2]) if len(bins) else None,
            "p75": float(bins[3]) if len(bins) else None,
            "p90": float(bins[4]) if len(bins) else None,
            "p99": float(bins[5]) if len(bins) else None,
        },
        "top_customers": [
            {
                "customer_id": str(r["customer_id"]),
                "predicted_clv": float(r["predicted_clv"]),
                "frequency": int(r["frequency"]),
                "monetary_value": float(r["monetary_value"]),
            }
            for _, r in top.iterrows()
        ],
    })

    # Churn classifier
    print("Training calibrated churn classifier...")
    feats = make_churn_features(ds.orders, ds.customers)
    model = train_churn_model(feats)
    pred = predict_churn(model, feats)
    at_risk = (
        feats.merge(pred, on="customer_id")
        .nlargest(20, "churn_probability")
        [["customer_id", "churn_probability", "n_orders", "total_spend",
          "days_since_last_order", "customer_state"]]
    )
    frac_pos, mean_pred = model.calibration_curve
    dump("churn", {
        "roc_auc": float(model.roc_auc),
        "brier": float(model.brier),
        "calibration_curve": {
            "mean_predicted": mean_pred.tolist(),
            "fraction_positives": frac_pos.tolist(),
        },
        "at_risk": [
            {
                "customer_id": str(r["customer_id"]),
                "churn_probability": float(r["churn_probability"]),
                "n_orders": int(r["n_orders"]),
                "total_spend": float(r["total_spend"]),
                "days_since_last_order": int(r["days_since_last_order"]),
                "customer_state": str(r["customer_state"]),
            }
            for _, r in at_risk.iterrows()
        ],
    })

    # Campaign uplift (DiD)
    print("Estimating causal campaign uplift (Difference-in-Differences)...")
    did = did_estimate(ds.orders, ds.campaign_exposures)
    dump("campaigns", {
        "naive_effect": float(did.naive_effect),
        "did_effect": float(did.did_effect),
        "did_se": float(did.did_se),
        "did_ci_low": float(did.did_ci_low),
        "did_ci_high": float(did.did_ci_high),
        "did_p_value": float(did.did_p_value),
        "parallel_trends_p": float(did.parallel_trends_p),
        "n_treated": int(did.n_treated),
        "n_control": int(did.n_control),
        "true_effect_oracle": float(ds.true_campaign_effect),
    })

    print("\nDone. All JSON written to public/data/")


if __name__ == "__main__":
    main()
