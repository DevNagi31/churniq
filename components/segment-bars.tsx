'use client';
import { motion } from 'framer-motion';
import { staggerChild, stagger } from '@/lib/motion';
import type { SegmentRow } from '@/lib/data';
import { fmtN, fmtPct } from '@/lib/format';

const SEGMENT_ACCENT: Record<string, string> = {
  Champions: 'from-accent to-violet-500',
  Loyal: 'from-violet-500 to-purple-500',
  'Potential Loyal': 'from-purple-500 to-fuchsia-500',
  'At Risk': 'from-amber-500 to-orange-500',
  Hibernating: 'from-orange-500 to-rose-500',
  Lost: 'from-rose-500 to-red-500',
};

export function SegmentBars({ segments }: { segments: SegmentRow[] }) {
  const max = Math.max(...segments.map((s) => s.share), 0.01);
  return (
    <motion.div {...stagger} className="card divide-y divide-ink-100">
      {segments.map((s) => (
        <motion.div key={s.segment} variants={staggerChild} className="p-4">
          <div className="flex items-baseline justify-between">
            <div className="font-medium text-ink-800">{s.segment}</div>
            <div className="text-[12px] text-ink-400">
              {fmtN(s.n)} customers · {fmtPct(s.share)}
            </div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(s.share / max) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full bg-gradient-to-r ${
                SEGMENT_ACCENT[s.segment] ?? 'from-ink-400 to-ink-600'
              }`}
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
