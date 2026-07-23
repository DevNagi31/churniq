'use client';
import { motion } from 'framer-motion';
import type { SegmentRow } from '@/lib/data';
import { fmtPct } from '@/lib/format';
import { easing } from '@/lib/motion';

const SEGMENT_COLOR: Record<string, string> = {
  Champions: '#2dd4bf',
  Loyal: '#38bdf8',
  'Potential Loyal': '#0ea5e9',
  'At Risk': '#f59e0b',
  Hibernating: '#fb923c',
  Lost: '#ef5a6f',
};

const FALLBACK = ['#2dd4bf', '#38bdf8', '#0ea5e9', '#f59e0b', '#fb923c', '#ef5a6f'];

export function HeroDonut({ segments }: { segments: SegmentRow[] }) {
  const total = segments.reduce((a, s) => a + s.share, 0) || 1;
  let acc = 0;
  const stops = segments
    .map((s, i) => {
      const color = SEGMENT_COLOR[s.segment] ?? FALLBACK[i % FALLBACK.length];
      const start = (acc / total) * 100;
      acc += s.share;
      const end = (acc / total) * 100;
      return `${color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    })
    .join(', ');

  return (
    <div className="flex items-center gap-5">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, rotate: -12 }}
        whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: easing }}
        className="relative h-[120px] w-[120px] flex-shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
      >
        <div className="absolute inset-[27%] rounded-full bg-surface-sunken" />
      </motion.div>
      <div className="flex flex-1 flex-col gap-2 text-[13px]">
        {segments.map((s, i) => (
          <div key={s.segment} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-[3px]"
              style={{ background: SEGMENT_COLOR[s.segment] ?? FALLBACK[i % FALLBACK.length] }}
            />
            <span className="flex-1 truncate text-ink-600">{s.segment}</span>
            <span className="font-semibold text-ink-800">{fmtPct(s.share, 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
