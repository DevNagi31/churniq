'use client';
import { motion } from 'framer-motion';
import type { CohortsData } from '@/lib/data';
import { fmtRetention } from '@/lib/format';
import { easing } from '@/lib/motion';

function colorFor(v: number | null): string {
  if (v == null) return 'bg-ink-100 text-ink-400';
  // Heatmap: clamp to [0, 0.6] for visible range (retention rarely above 60%)
  const clamped = Math.max(0, Math.min(0.6, v));
  const intensity = clamped / 0.6;
  // Blue → violet gradient via inline style for smooth interpolation
  return '';
}

function styleFor(v: number | null): React.CSSProperties {
  if (v == null) return {};
  const intensity = Math.max(0.05, Math.min(1, v / 0.6));
  // Blend white → accent based on intensity
  const r = Math.round(255 - (255 - 0) * intensity);
  const g = Math.round(255 - (255 - 113) * intensity);
  const b = Math.round(255 - (255 - 227) * intensity);
  const textColor = intensity > 0.5 ? '#ffffff' : '#1d1d1f';
  return { backgroundColor: `rgb(${r}, ${g}, ${b})`, color: textColor };
}

export function RetentionHeatmap({ data }: { data: CohortsData }) {
  const periods = Array.from({ length: data.max_period + 1 }, (_, i) => i);
  return (
    <div className="card overflow-x-auto p-4">
      <table className="min-w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="px-2 py-2 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-ink-400">
              Cohort
            </th>
            {periods.map((p) => (
              <th key={p} className="w-12 px-2 py-2 text-center text-[11px] text-ink-400">
                M{p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.cohorts.map((row, rowIdx) => (
            <tr key={row.cohort_month}>
              <td className="whitespace-nowrap px-2 py-1 text-[12px] font-mono text-ink-600">
                {row.cohort_month.slice(0, 7)}
              </td>
              {periods.map((p) => {
                const v = row.retention[p] ?? null;
                const cls = colorFor(v);
                return (
                  <motion.td
                    key={p}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.005 * (rowIdx * (data.max_period + 1) + p),
                      duration: 0.3,
                      ease: easing,
                    }}
                    className={`w-12 rounded-md text-center text-[11px] font-mono ${cls}`}
                    style={{ height: '32px', ...styleFor(v) }}
                  >
                    <div className="flex h-full items-center justify-center">
                      {fmtRetention(v)}
                    </div>
                  </motion.td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center gap-4 text-[11px] text-ink-400">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded bg-ink-100" /> not yet observed
          (right-censored)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded" style={{ background: '#0071e3' }} /> high
          retention
        </span>
      </div>
    </div>
  );
}
