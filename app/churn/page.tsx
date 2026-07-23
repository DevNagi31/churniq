import { getChurn } from '@/lib/data';
import { fmtCurrency, fmtN, fmtPct } from '@/lib/format';
import { MetricCard } from '@/components/metric-card';
import { Section } from '@/components/section';
import { CalibrationChart } from '@/components/calibration-chart';

export default async function ChurnPage() {
  const data = await getChurn();
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">Churn</div>
        <h1 className="text-[32px] font-semibold tracking-tightest text-ink-800">
          Calibrated churn classifier
        </h1>
        <p className="text-[13px] text-ink-400">
          GBM wrapped in <code className="bg-ink-100 px-1 rounded">CalibratedClassifierCV(isotonic)</code>
          {' '}so the probabilities you read are real probabilities, not just rankings.
        </p>
      </header>

      <Section eyebrow="Model" title="">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <MetricCard
            label="ROC-AUC"
            value={data.roc_auc.toFixed(3)}
            sub="discrimination quality"
          />
          <MetricCard
            label="Brier score"
            value={data.brier.toFixed(3)}
            sub="lower = better-calibrated"
          />
          <MetricCard
            label="At-risk shown"
            value={fmtN(data.at_risk.length)}
            sub="ranked by churn probability"
          />
        </div>
      </Section>

      <Section
        eyebrow="Calibration"
        title="Reliability diagram"
        subtitle="Predicted probability (x) vs observed fraction churned (y). The closer to the diagonal, the better calibrated."
      >
        <CalibrationChart curve={data.calibration_curve} />
      </Section>

      <Section eyebrow="At-risk customers" title="" subtitle="Highest predicted churn probability">
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ink-50/50 text-[11px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-right font-medium">P(churn)</th>
                <th className="px-4 py-3 text-right font-medium">Orders</th>
                <th className="px-4 py-3 text-right font-medium">Total spend</th>
                <th className="px-4 py-3 text-right font-medium">Days since last</th>
                <th className="px-4 py-3 text-right font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              {data.at_risk.map((c) => (
                <tr key={c.customer_id} className="border-t border-ink-100 text-[13px]">
                  <td className="px-4 py-2 font-mono text-ink-600">{c.customer_id}</td>
                  <td className="px-4 py-2 text-right font-mono">
                    <span className="rounded-full bg-danger/15 px-2 py-0.5 text-danger">
                      {fmtPct(c.churn_probability)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-ink-600">{c.n_orders}</td>
                  <td className="px-4 py-2 text-right font-mono text-ink-600">
                    {fmtCurrency(c.total_spend)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-ink-600">
                    {c.days_since_last_order}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-600">{c.customer_state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
