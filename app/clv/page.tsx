import { getClv } from '@/lib/data';
import { fmtCurrency, fmtN, fmtPct } from '@/lib/format';
import { MetricCard } from '@/components/metric-card';
import { Section } from '@/components/section';

export default async function ClvPage() {
  const data = await getClv();
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">CLV</div>
        <h1 className="text-[32px] font-semibold tracking-tightest text-ink-800">
          Predicted lifetime value
        </h1>
        <p className="text-[13px] text-ink-400">
          BG/NBD models repeat-purchase probability; Gamma-Gamma models average spend per purchase.
          Their product, integrated over {data.horizon_months} months, is the predicted CLV.
        </p>
      </header>

      <Section eyebrow="Model fit" title="">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Median CLV (p50)"
            value={data.percentiles.p50 != null ? fmtCurrency(data.percentiles.p50) : '—'}
          />
          <MetricCard
            label="Top 10% (p90)"
            value={data.percentiles.p90 != null ? fmtCurrency(data.percentiles.p90) : '—'}
            sub={`p99: ${data.percentiles.p99 != null ? fmtCurrency(data.percentiles.p99) : '—'}`}
          />
          <MetricCard
            label="Holdout MAPE"
            value={data.holdout_mape != null ? fmtPct(data.holdout_mape) : '—'}
            sub="lower = better-calibrated"
          />
          <MetricCard
            label="Horizon"
            value={`${data.horizon_months} mo`}
            sub={`BG/NBD α=${data.bgnbd_params.alpha?.toFixed(2) ?? '—'}, r=${data.bgnbd_params.r?.toFixed(2) ?? '—'}`}
          />
        </div>
      </Section>

      <Section eyebrow="Distribution" title="" subtitle="">
        <div className="card p-6">
          <div className="space-y-2 text-[12px] text-ink-600">
            {(['p10', 'p25', 'p50', 'p75', 'p90', 'p99'] as const).map((q, i) => {
              const v = data.percentiles[q];
              const pct = (i + 1) * 16;
              return (
                <div key={q} className="flex items-center gap-4">
                  <div className="w-12 font-mono text-ink-400">{q}</div>
                  <div className="h-2 flex-1 rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-violet-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-24 text-right font-mono">{v != null ? fmtCurrency(v) : '—'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section eyebrow="Top customers" title="" subtitle="Highest predicted CLV in the next 12 months">
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ink-50/50 text-[11px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-right font-medium">Predicted CLV</th>
                <th className="px-4 py-3 text-right font-medium">Past frequency</th>
                <th className="px-4 py-3 text-right font-medium">Avg order value</th>
              </tr>
            </thead>
            <tbody>
              {data.top_customers.map((c) => (
                <tr key={c.customer_id} className="border-t border-ink-100 text-[13px]">
                  <td className="px-4 py-2 font-mono text-ink-600">{c.customer_id}</td>
                  <td className="px-4 py-2 text-right font-mono text-ink-800">
                    {fmtCurrency(c.predicted_clv)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-ink-600">{fmtN(c.frequency)}</td>
                  <td className="px-4 py-2 text-right font-mono text-ink-600">
                    {fmtCurrency(c.monetary_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
