import { getCohorts } from '@/lib/data';
import { Section } from '@/components/section';
import { RetentionHeatmap } from '@/components/retention-heatmap';

export default async function CohortsPage() {
  const data = await getCohorts();
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">Retention</div>
        <h1 className="text-[32px] font-semibold tracking-tightest text-ink-800">Cohort heatmap</h1>
        <p className="text-[13px] text-ink-400">
          Each row is a cohort of customers grouped by their first purchase month. Each column is
          the percentage of that cohort active K months later. <strong>Right-censored cells are dimmed</strong>:
          a cohort that only formed 3 months ago cannot have a 12-month retention value yet.
        </p>
      </header>

      <Section eyebrow="Heatmap" title="" subtitle="">
        <RetentionHeatmap data={data} />
      </Section>
    </div>
  );
}
