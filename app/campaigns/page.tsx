import { getCampaigns } from '@/lib/data';
import { fmtN } from '@/lib/format';
import { Section } from '@/components/section';

export default async function CampaignsPage() {
  const c = await getCampaigns();
  const ratio = c.did_effect !== 0 ? c.naive_effect / c.did_effect : null;
  const ptHealthy = c.parallel_trends_p >= 0.1;
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">Causal</div>
        <h1 className="text-[32px] font-semibold tracking-tightest text-ink-800">
          Campaign uplift (Difference-in-Differences)
        </h1>
        <p className="text-[13px] text-ink-400">
          Marketing teams target engaged customers, so the naive "treated minus untreated" comparison
          is dominated by selection bias. DiD compares the pre→post change for treated vs. untreated —
          unbiased under the parallel-trends assumption.
        </p>
      </header>

      <Section eyebrow="Headline" title="">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="glass p-6">
            <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">Naive comparison</div>
            <div className="mt-2 text-[40px] font-semibold leading-none tracking-tightest text-rose-600">
              {c.naive_effect.toFixed(3)}
            </div>
            <p className="mt-2 text-[12px] text-ink-400">
              Mean orders/user: treated − untreated. Biased upward because treated customers were
              already buying more.
            </p>
          </div>
          <div className="glass p-6">
            <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">DiD estimate</div>
            <div className="mt-2 text-[40px] font-semibold leading-none tracking-tightest text-success">
              {c.did_effect.toFixed(3)}
            </div>
            <p className="mt-2 text-[12px] text-ink-400">
              95% CI [{c.did_ci_low.toFixed(3)}, {c.did_ci_high.toFixed(3)}] · p = {c.did_p_value.toFixed(3)}
            </p>
          </div>
          <div className="glass p-6">
            <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">Oracle (synthetic ground truth)</div>
            <div className="mt-2 text-[40px] font-semibold leading-none tracking-tightest text-ink-800">
              {c.true_effect_oracle.toFixed(3)}
            </div>
            <p className="mt-2 text-[12px] text-ink-400">
              The campaign effect baked into the synthetic generator.{' '}
              {ratio != null && (
                <span>
                  Naive over-estimates by{' '}
                  <strong>{((ratio - 1) * 100).toFixed(0)}%</strong>; DiD recovers a much closer figure.
                </span>
              )}
            </p>
          </div>
        </div>
      </Section>

      <Section eyebrow="Assumption check" title="Parallel-trends test">
        <div className={`card p-6 border-l-4 ${ptHealthy ? 'border-success' : 'border-warn'}`}>
          <div className="flex items-baseline justify-between">
            <div className="font-medium text-ink-800">
              {ptHealthy ? 'Parallel-trends assumption holds' : 'Parallel-trends assumption marginal'}
            </div>
            <div className="font-mono text-[13px] text-ink-600">p = {c.parallel_trends_p.toFixed(3)}</div>
          </div>
          <p className="mt-2 text-[12px] text-ink-400">
            The pre-period was split in two and the treated×early-half interaction was tested. A
            small p-value here would mean trends diverged before treatment — in which case the DiD
            estimate is biased.
          </p>
        </div>
      </Section>

      <Section eyebrow="Sample size" title="">
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">Treated</div>
            <div className="mt-1 font-mono text-[20px] text-ink-800">{fmtN(c.n_treated)}</div>
          </div>
          <div className="card p-4">
            <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">Control</div>
            <div className="mt-1 font-mono text-[20px] text-ink-800">{fmtN(c.n_control)}</div>
          </div>
        </div>
      </Section>
    </div>
  );
}
