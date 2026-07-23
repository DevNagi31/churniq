'use client';
import { motion } from 'framer-motion';
import { easing } from '@/lib/motion';

interface Props {
  horizonMonths: number;
  // Endpoint of the median cumulative CLV curve, in currency units.
  targetClv: number;
  // Multiplier applied to model a retained/"boosted" trajectory.
  boostFactor?: number;
}

// Concave cumulative-value curve: fast early accrual, diminishing later,
// the shape BG/NBD implies for expected cumulative transactions over time.
function curve(target: number, months: number, k = 2.2): number[] {
  const pts: number[] = [];
  for (let i = 0; i <= months; i++) {
    const t = i / months;
    pts.push(target * (1 - Math.exp(-k * t)) / (1 - Math.exp(-k)));
  }
  return pts;
}

export function ClvForecast({ horizonMonths, targetClv, boostFactor = 1.45 }: Props) {
  const W = 380;
  const H = 160;
  const pad = 30;
  const cur = curve(targetClv, horizonMonths);
  const boost = curve(targetClv * boostFactor, horizonMonths, 1.9);
  const maxY = targetClv * boostFactor * 1.05;

  const px = (i: number) => pad + (i / horizonMonths) * (W - pad - 8);
  const py = (v: number) => H - pad - (v / maxY) * (H - pad - 14);
  const line = (arr: number[]) =>
    arr.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  const area = (arr: number[]) =>
    `${line(arr)} L${px(arr.length - 1).toFixed(1)} ${H - pad} L${px(0).toFixed(1)} ${H - pad} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
      <defs>
        <linearGradient id="clvArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(45,212,191,0.32)" />
          <stop offset="100%" stopColor="rgba(45,212,191,0)" />
        </linearGradient>
      </defs>
      {gridLines.map((t, i) => {
        const y = H - pad - t * (H - pad - 14);
        return (
          <g key={i}>
            <line x1={pad} x2={W - 8} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
            <text x={4} y={y + 3} fill="#5f6f83" fontSize={9}>
              {maxY * t >= 1000
                ? `${((maxY * t) / 1000).toFixed(1)}k`
                : Math.round(maxY * t)}
            </text>
          </g>
        );
      })}
      <path d={area(cur)} fill="url(#clvArea)" />
      <motion.path
        d={line(boost)}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2.5}
        strokeDasharray="5 4"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: easing }}
      />
      <motion.path
        d={line(cur)}
        fill="none"
        stroke="#2dd4bf"
        strokeWidth={2.5}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: easing }}
      />
      <text x={pad} y={H - 8} fill="#5f6f83" fontSize={9}>
        0
      </text>
      <text x={W - 22} y={H - 8} fill="#5f6f83" fontSize={9}>
        {horizonMonths}mo
      </text>
    </svg>
  );
}
