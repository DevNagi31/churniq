'use client';
import { motion } from 'framer-motion';
import type { CohortsData } from '@/lib/data';
import { easing } from '@/lib/motion';

// Same navy→teal ramp as the full RetentionHeatmap, compacted for the hero.
function cellStyle(v: number | null): React.CSSProperties {
  if (v == null)
    return {
      background: 'rgba(255,255,255,0.03)',
      border: '1px dashed rgba(255,255,255,0.05)',
      color: 'transparent',
    };
  const intensity = Math.max(0.18, Math.min(1, v / 0.6));
  const l = 28 + intensity * 30;
  const c = 0.06 + intensity * 0.12;
  return {
    background: `oklch(${l}% ${c} 190)`,
    color: intensity > 0.55 ? '#04141a' : '#dff5ef',
  };
}

export function HeroHeatmap({ data }: { data: CohortsData }) {
  const cols = Math.min(7, data.max_period + 1);
  const rows = data.cohorts.slice(0, 7);
  const periods = Array.from({ length: cols }, (_, i) => i);

  return (
    <div className="flex gap-2 text-[10px]">
      <div className="flex flex-col gap-1.5 pt-[18px] text-ink-400">
        {rows.map((r) => (
          <div key={r.cohort_month} className="flex h-[24px] items-center font-mono">
            {r.cohort_month.slice(0, 7)}
          </div>
        ))}
      </div>
      <div className="flex-1">
        <div className="mb-1.5 flex gap-1.5 text-ink-400">
          {periods.map((p) => (
            <div key={p} className="flex-1 text-center">
              M{p}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          {rows.map((row, ri) => (
            <div key={row.cohort_month} className="flex gap-1.5">
              {periods.map((p) => {
                const v = row.retention[p] ?? null;
                return (
                  <motion.div
                    key={p}
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.01 * (ri * cols + p), duration: 0.3, ease: easing }}
                    className="flex h-[24px] flex-1 items-center justify-center rounded-[4px] font-mono font-semibold"
                    style={cellStyle(v)}
                  >
                    {v == null ? '' : `${Math.round(v * 100)}`}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
