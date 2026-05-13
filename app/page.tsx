import { MetricCard } from '@/components/metric-card';
import { Section } from '@/components/section';
import { getCampaigns, getChurn, getClv, getOverview, getSegments } from '@/lib/data';
import { fmtCurrency, fmtN, fmtPct } from '@/lib/format';

export default async function OverviewPage() {
  const [ov, seg, clv, churn, camp] = await Promise.all([
    getOverview(),
    getSegments(),
    getClv(),
    getChurn(),
    getCampaigns(),
  ]);

  const champions = seg.segments.find((s) => s.segment === 'Champions');
  const atRiskShare = seg.segments.find((s) => s.segment === 'At Risk');

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-[44px] font-semibold leading-none tracking-tightest text-ink-800 md:text-[56px]">
          Customer lifecycle,{' '}
          <span className="bg-gradient-to-br from-accent to-violet-500 bg-clip-text text-transparent">
            measured honestly.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[17px] text-ink-600">
          Cohort retention with right-censoring · BG/NBD CLV with holdout validation · calibrated
          churn classifier · causal uplift via Difference-in-Differences.
        </p>
        <p className="mt-2 text-[12px] text-ink-400">
          {fmtN(ov.n_customers)} customers · {fmtN(ov.n_orders)} orders · {ov.period_start} → {ov.period_end}
        </p>
      </header>

      <Section eyebrow="Headline KPIs" title="The shape of the business">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Customers" value={fmtN(ov.n_customers)} sub={`${fmtN(ov.n_orders)} orders`} />
          <MetricCard label="GMV" value={fmtCurrency(ov.gmv)} sub="across the window" />
          <MetricCard
            label="Repeat-purchase rate"
            value={fmtPct(ov.repeat_rate)}
            sub="customers with ≥ 2 orders"
          />
          <MetricCard
            label="Champions"
            value={champions ? fmtPct(champions.share) : '—'}
            sub={`At Risk: ${atRiskShare ? fmtPct(atRiskShare.share) : '—'}`}
          />
        </div>
      </Section>

      <Section
        eyebrow="Predictive"
        title="CLV and churn at a glance"
        subtitle="BG/NBD + Gamma-Gamma over the next 12 months · calibrated GBM with isotonic regression"
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="P50 predicted CLV"
            value={clv.percentiles.p50 != null ? fmtCurrency(clv.percentiles.p50) : '—'}
            sub={clv.percentiles.p90 != null ? `p90: ${fmtCurrency(clv.percentiles.p90)}` : undefined}
          />
          <MetricCard
            label="CLV holdout MAPE"
            value={clv.holdout_mape != null ? fmtPct(clv.holdout_mape) : '—'}
            sub="lower = better-calibrated forecast"
          />
          <MetricCard
            label="Churn model AUC"
            value={churn.roc_auc.toFixed(2)}
            sub={`Brier ${churn.brier.toFixed(3)} (calibrated)`}
          />
          <MetricCard
            label="At-risk customers"
            value={fmtN(churn.at_risk.length)}
            sub="top by churn probability"
          />
        </div>
      </Section>

      <Section
        eyebrow="Causal"
        title="Campaign uplift"
        subtitle="Naive comparison vs Difference-in-Differences — the gap is selection bias"
      >
        <div className="glass p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">Naive lift</div>
              <div className="mt-1 text-[28px] font-semibold tracking-tightest text-rose-600">
                {camp.naive_effect.toFixed(3)} <span className="text-[14px] text-ink-400">orders/user</span>
              </div>
              <p className="mt-1 text-[12px] text-ink-400">treated − untreated (biased upward by selection)</p>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">DiD estimate</div>
              <div className="mt-1 text-[28px] font-semibold tracking-tightest text-success">
                {camp.did_effect.toFixed(3)}{' '}
                <span className="text-[14px] text-ink-400">
                  [{camp.did_ci_low.toFixed(3)}, {camp.did_ci_high.toFixed(3)}]
                </span>
              </div>
              <p className="mt-1 text-[12px] text-ink-400">
                p = {camp.did_p_value.toFixed(3)} · parallel-trends p = {camp.parallel_trends_p.toFixed(3)}
              </p>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">Oracle (synthetic)</div>
              <div className="mt-1 text-[28px] font-semibold tracking-tightest text-ink-800">
                {camp.true_effect_oracle.toFixed(3)}
              </div>
              <p className="mt-1 text-[12px] text-ink-400">
                ground-truth campaign effect baked into the generator
              </p>
            </div>
          </div>
        </div>
      </Section>

      <footer className="mt-16 border-t border-ink-100 pt-6 text-center text-[11px] text-ink-400">
        Built with Next.js 15 · Framer Motion · BG/NBD CLV · DiD causal inference · sklearn calibrated GBM
      </footer>
    </div>
  );
}
