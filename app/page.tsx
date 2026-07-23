import Link from 'next/link';
import { HeroHeatmap } from '@/components/hero-heatmap';
import { HeroDonut } from '@/components/hero-donut';
import { ClvForecast } from '@/components/clv-forecast';
import { getCampaigns, getChurn, getClv, getCohorts, getOverview, getSegments } from '@/lib/data';
import { fmtCurrency, fmtN, fmtPct } from '@/lib/format';

const FEATURES = [
  {
    icon: '▦',
    title: 'Cohort Retention',
    desc: 'Right-censored retention curves across acquisition cohorts.',
    href: '/cohorts',
  },
  {
    icon: '◈',
    title: 'RFM Segmentation',
    desc: 'Recency, frequency & monetary scoring for every customer.',
    href: '/segments',
  },
  {
    icon: '◭',
    title: 'Predicted CLV',
    desc: 'BG/NBD + Gamma-Gamma lifetime-value forecasting.',
    href: '/clv',
  },
  {
    icon: '⚗',
    title: 'Causal Uplift',
    desc: 'Difference-in-Differences isolates true campaign effect.',
    href: '/campaigns',
  },
];

const FOOT_COLS = [
  { head: 'Product', items: [['Cohorts', '/cohorts'], ['Segments', '/segments'], ['CLV', '/clv'], ['Churn', '/churn']] },
  { head: 'Causal', items: [['Campaigns', '/campaigns'], ['DiD method', '/campaigns'], ['Overview', '/']] },
  { head: 'Resources', items: [['README', '/'], ['Data source: Olist', '/'], ['GitHub', '/']] },
];

export default async function OverviewPage() {
  const [ov, seg, clv, churn, camp, cohorts] = await Promise.all([
    getOverview(),
    getSegments(),
    getClv(),
    getChurn(),
    getCampaigns(),
    getCohorts(),
  ]);

  const p50 = clv.percentiles.p50 ?? 115;

  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative z-[5] mx-auto max-w-5xl px-6 pb-10 pt-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[12px] text-ink-400">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Real Olist e-commerce data · {fmtN(ov.n_customers)} customers
        </div>
        <h1 className="bg-gradient-to-b from-white to-[#c8d6e6] bg-clip-text font-display text-[52px] font-extrabold leading-[1.05] tracking-[-0.02em] text-transparent md:text-[64px]">
          Maximize Retention.
          <br />
          Optimize Lifecycle Value.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[18px] leading-relaxed text-ink-400">
          Predict, understand, and combat churn with ChurnIQ&apos;s advanced customer lifecycle
          analytics platform.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link href="/cohorts" className="btn-primary">
            Explore Platform
          </Link>
          <Link href="/clv" className="btn-ghost">
            View CLV Forecast
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-ink-400">
          <span>BG/NBD + Gamma-Gamma CLV</span>
          <span className="text-white/20">•</span>
          <span>Calibrated churn prediction</span>
          <span className="text-white/20">•</span>
          <span>Causal uplift via Diff-in-Diff</span>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="relative z-[5] mx-auto mt-6 max-w-5xl px-6">
        <div className="glass p-8 md:p-11">
          <h2 className="text-center font-display text-[30px] font-bold tracking-[-0.02em] md:text-[34px]">
            Visualize Your Customer Health
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-[15px] text-ink-400">
            Real-time metrics turn raw lifecycle data into decisive retention actions.
          </p>

          <div className="mt-9 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            {/* Cohort heatmap */}
            <div className="panel p-6">
              <div className="font-display text-[16px] font-semibold text-ink-800">
                Cohort Retention
              </div>
              <div className="mb-4 mt-1 text-[12px] text-ink-400">
                Right-censored retention by cohort month (%)
              </div>
              <HeroHeatmap data={cohorts} />
            </div>

            <div className="flex flex-col gap-5">
              {/* Segmentation */}
              <div className="panel p-6">
                <div className="font-display text-[16px] font-semibold text-ink-800">
                  RFM Segmentation
                </div>
                <div className="mb-4 mt-1 text-[12px] text-ink-400">
                  Customer distribution by segment
                </div>
                <HeroDonut segments={seg.segments} />
              </div>

              {/* CLV forecast */}
              <div className="panel p-6">
                <div className="flex items-center justify-between">
                  <div className="font-display text-[16px] font-semibold text-ink-800">
                    Predicted CLV Forecast
                  </div>
                  <div className="flex gap-3 text-[11px] text-ink-400">
                    <span className="flex items-center gap-1.5">
                      <span className="h-[3px] w-3.5 rounded bg-accent" />
                      Current
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-[3px] w-3.5 rounded bg-warn" />
                      Retained
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <ClvForecast horizonMonths={clv.horizon_months} targetClv={p50} />
                </div>
              </div>
            </div>
          </div>

          {/* KPI strip with real numbers */}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Kpi label="GMV" value={fmtCurrency(ov.gmv)} sub="across the window" />
            <Kpi label="Repeat rate" value={fmtPct(ov.repeat_rate)} sub="customers with ≥ 2 orders" />
            <Kpi
              label="Median CLV"
              value={clv.percentiles.p50 != null ? fmtCurrency(clv.percentiles.p50) : 'N/A'}
              sub={`p90 ${clv.percentiles.p90 != null ? fmtCurrency(clv.percentiles.p90) : 'N/A'}`}
            />
            <Kpi
              label="Churn AUC"
              value={churn.roc_auc.toFixed(2)}
              sub={`Brier ${churn.brier.toFixed(3)} · calibrated`}
            />
          </div>
        </div>
      </section>

      {/* PLATFORM OVERVIEW */}
      <section className="relative z-[5]">
        <div className="mx-auto mt-24 max-w-5xl px-6 text-center">
          <h2 className="font-display text-[30px] font-bold tracking-[-0.02em] md:text-[34px]">
            Platform Overview
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-ink-400">
            A full lifecycle analytics stack, from cohorts to causal inference.
          </p>
          <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="glass group p-7 text-center transition-transform hover:-translate-y-1"
              >
                <div className="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-accent/20 bg-gradient-to-br from-accent/15 to-cyan-glow/10 text-[22px] text-accent">
                  {f.icon}
                </div>
                <div className="font-display text-[16px] font-semibold text-ink-800">{f.title}</div>
                <div className="mt-2 text-[13px] leading-relaxed text-ink-400">{f.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CAUSAL CALLOUT */}
      <section className="relative z-[5] mx-auto mt-24 max-w-3xl px-6 text-center">
        <div className="font-display text-[60px] leading-[0.5] text-accent/35">“</div>
        <p className="text-[21px] font-medium leading-relaxed text-ink-800">
          The naive campaign lift reads{' '}
          <span className="font-mono text-danger">{camp.naive_effect.toFixed(3)}</span> orders/user,
          but Difference-in-Differences recovers{' '}
          <span className="font-mono text-success">{camp.did_effect.toFixed(3)}</span>. The gap is
          selection bias, and ChurnIQ measures it honestly.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3.5">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-accent to-cyan-glow" />
          <div className="text-left">
            <div className="text-[15px] font-semibold text-ink-800">Difference-in-Differences</div>
            <div className="text-[13px] text-ink-400">
              95% CI [{camp.did_ci_low.toFixed(3)}, {camp.did_ci_high.toFixed(3)}] · p ={' '}
              {camp.did_p_value.toFixed(3)}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-[5] mt-24 border-t border-white/[0.06] bg-surface-sunken">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-cyan-glow text-[13px] font-extrabold text-[#04141a]">
                ◐
              </span>
              <span className="font-display text-[17px] font-bold text-ink-800">ChurnIQ</span>
            </div>
            <p className="max-w-[220px] text-[13px] leading-relaxed text-ink-400">
              Customer lifecycle analytics for teams that measure what actually retains.
            </p>
          </div>
          {FOOT_COLS.map((c) => (
            <div key={c.head}>
              <div className="mb-3.5 font-display text-[14px] font-semibold text-ink-800">
                {c.head}
              </div>
              <div className="flex flex-col gap-2.5 text-[13px] text-ink-400">
                {c.items.map(([label, href]) => (
                  <Link key={label} href={href} className="w-fit transition-colors hover:text-accent">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto max-w-5xl border-t border-white/[0.05] px-6 py-6 text-[12px] text-ink-400">
          © 2026 ChurnIQ Analytics · {fmtN(ov.n_customers)} customers · {fmtN(ov.n_orders)} orders ·{' '}
          {ov.period_start} → {ov.period_end}
        </div>
      </footer>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-surface-sunken/60 p-4">
      <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">{label}</div>
      <div className="mt-1.5 font-display text-[22px] font-semibold leading-none text-ink-800">
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[11px] text-ink-400">{sub}</div>}
    </div>
  );
}
