'use client';
import { motion } from 'framer-motion';
import { staggerChild, liftOnHover } from '@/lib/motion';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}

export function MetricCard({ label, value, sub }: Props) {
  return (
    <motion.div variants={staggerChild} {...liftOnHover} className="glass p-6">
      <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">{label}</div>
      <div className="mt-2 text-[34px] font-semibold leading-none tracking-tightest text-ink-800">
        {value}
      </div>
      {sub && <div className="mt-2 text-[12px] text-ink-400">{sub}</div>}
    </motion.div>
  );
}
