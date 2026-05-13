'use client';
import { motion } from 'framer-motion';
import { fadeUp, stagger } from '@/lib/motion';
import type { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function Section({ eyebrow, title, subtitle, children }: Props) {
  return (
    <motion.section {...fadeUp} className="mt-10">
      <header className="mb-4">
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">{eyebrow}</div>
        )}
        <h2 className="text-[22px] font-semibold tracking-tightest text-ink-800">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] text-ink-400">{subtitle}</p>}
      </header>
      <motion.div {...stagger}>{children}</motion.div>
    </motion.section>
  );
}
