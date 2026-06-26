import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { GlassPanel } from '../ui/Card';

interface TrendChartProps {
  data: { name: string; impact: number }[];
  title: string;
}

// Custom animated dot on the line
const CustomDot = (props: any) => {
  const { cx, cy, value } = props;
  if (value === undefined || value === null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#10b981" stroke="#064e3b" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={9} fill="#10b981" fillOpacity={0.15} />
    </g>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val: number = payload[0].value;
    const color = val > 10 ? '#f87171' : val > 5 ? '#fbbf24' : '#34d399';
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 60%, #1e293b)',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '10px 16px',
          boxShadow: `0 0 16px ${color}33`,
        }}
      >
        <p style={{ color: '#94a3b8', fontSize: '11px', marginBottom: 4 }}>{label}</p>
        <p style={{ color, fontWeight: 700, fontSize: '16px' }}>
          {val.toFixed(2)}
          <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 400 }}> kg CO₂</span>
        </p>
        <p style={{ color: color, fontSize: '10px', marginTop: 2 }}>
          {val > 10 ? '🔴 High impact' : val > 5 ? '🟡 Moderate' : '🟢 Low impact'}
        </p>
      </div>
    );
  }
  return null;
};

export function TrendChart({ data, title }: TrendChartProps) {
  const avg =
    data && data.length > 0
      ? data.reduce((s, d) => s + (d.impact || 0), 0) / data.length
      : 0;

  return (
    <GlassPanel className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }} />
            <span className="text-slate-400">CO₂ Impact</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-px border-t-2 border-dashed border-amber-400 inline-block" />
            <span className="text-slate-400">Avg</span>
          </span>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 16, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* Multi-stop gradient: green → teal → blue */}
              <linearGradient id="colorImpactGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#10b981" stopOpacity={0.55} />
                <stop offset="40%"  stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>

              {/* Glow filter on the stroke line */}
              <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Stroke gradient left→right */}
              <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#10b981" />
                <stop offset="50%"  stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="name"
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b' }}
            />
            <YAxis
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}kg`}
              tick={{ fill: '#64748b' }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Average reference line */}
            {avg > 0 && (
              <ReferenceLine
                y={avg}
                stroke="#fbbf24"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={{
                  value: `Avg ${avg.toFixed(1)}kg`,
                  position: 'insideTopRight',
                  fill: '#fbbf24',
                  fontSize: 10,
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="impact"
              stroke="url(#strokeGrad)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorImpactGrad)"
              dot={<CustomDot />}
              activeDot={{ r: 7, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
              filter="url(#lineGlow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom legend row */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="text-green-400">●</span> Low (&lt;5 kg)</span>
        <span className="flex items-center gap-1"><span className="text-amber-400">●</span> Moderate (5–10 kg)</span>
        <span className="flex items-center gap-1"><span className="text-red-400">●</span> High (&gt;10 kg)</span>
      </div>
    </GlassPanel>
  );
}
