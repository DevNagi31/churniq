'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface Props {
  curve: { mean_predicted: number[]; fraction_positives: number[] };
}

export function CalibrationChart({ curve }: Props) {
  const data = curve.mean_predicted.map((x, i) => ({
    predicted: x,
    actual: curve.fraction_positives[i] ?? 0,
  }));
  return (
    <div className="card h-80 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="predicted"
            type="number"
            domain={[0, 1]}
            stroke="#5f6f83"
            tick={{ fontSize: 11, fill: '#8fa1b8' }}
            tickFormatter={(v: number) => v.toFixed(1)}
            label={{ value: 'Predicted probability', position: 'insideBottom', offset: -2, fill: '#8fa1b8', fontSize: 11 }}
          />
          <YAxis
            type="number"
            domain={[0, 1]}
            stroke="#5f6f83"
            tick={{ fontSize: 11, fill: '#8fa1b8' }}
            tickFormatter={(v: number) => v.toFixed(1)}
            label={{ value: 'Observed fraction', angle: -90, position: 'insideLeft', fill: '#8fa1b8', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(9,20,38,0.95)',
              border: '1px solid rgba(94,234,212,0.2)',
              borderRadius: 12,
              fontSize: 12,
              color: '#e6edf5',
            }}
            labelStyle={{ color: '#8fa1b8' }}
            formatter={(v: number) => v.toFixed(3)}
          />
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ]}
            stroke="#5f6f83"
            strokeDasharray="4 4"
            label={{ value: 'perfect', position: 'top', fill: '#8fa1b8', fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#2dd4bf"
            strokeWidth={2.5}
            dot={{ fill: '#2dd4bf', r: 4 }}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
