import { getSegments } from '@/lib/data';
import { fmtN, fmtPct, fmtCurrency } from '@/lib/format';
import { Section } from '@/components/section';
import { SegmentBars } from '@/components/segment-bars';

export default async function SegmentsPage() {
  const { segments } = await getSegments();
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">RFM</div>
        <h1 className="text-[32px] font-semibold tracking-tightest text-ink-800">Customer segments</h1>
        <p className="text-[13px] text-ink-400">
          Recency, Frequency, Monetary quintile scores collapse into six standard segments. Each
          row maps to a different retention strategy.
        </p>
      </header>

      <Section eyebrow="Distribution" title="">
        <SegmentBars segments={segments} />
      </Section>

      <Section eyebrow="Detail" title="">
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ink-50/50 text-[11px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Segment</th>
                <th className="px-4 py-3 text-right font-medium">Customers</th>
                <th className="px-4 py-3 text-right font-medium">Share</th>
                <th className="px-4 py-3 text-right font-medium">Avg recency (days)</th>
                <th className="px-4 py-3 text-right font-medium">Avg frequency</th>
                <th className="px-4 py-3 text-right font-medium">Avg monetary</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s) => (
                <tr key={s.segment} className="border-t border-ink-100 text-[13px]">
                  <td className="px-4 py-2 font-medium text-ink-800">{s.segment}</td>
                  <td className="px-4 py-2 text-right text-ink-600">{fmtN(s.n)}</td>
                  <td className="px-4 py-2 text-right text-ink-600">{fmtPct(s.share)}</td>
                  <td className="px-4 py-2 text-right text-ink-600 font-mono">
                    {s.avg_recency_days.toFixed(0)}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-600 font-mono">
                    {s.avg_frequency.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-600 font-mono">
                    {fmtCurrency(s.avg_monetary)}
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
