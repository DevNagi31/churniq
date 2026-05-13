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
          <CartesianGrid stroke="#e5e5e7" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="predicted"
            type="number"
            domain={[0, 1]}
            stroke="#86868b"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => v.toFixed(1)}
            label={{ value: 'Predicted probability', position: 'insideBottom', offset: -2, fill: '#86868b', fontSize: 11 }}
          />
          <YAxis
            type="number"
            domain={[0, 1]}
            stroke="#86868b"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => v.toFixed(1)}
            label={{ value: 'Observed fraction', angle: -90, position: 'insideLeft', fill: '#86868b', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #e5e5e7',
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v: number) => v.toFixed(3)}
          />
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ]}
            stroke="#86868b"
            strokeDasharray="4 4"
            label={{ value: 'perfect', position: 'top', fill: '#86868b', fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#0071e3"
            strokeWidth={2.5}
            dot={{ fill: '#0071e3', r: 4 }}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
