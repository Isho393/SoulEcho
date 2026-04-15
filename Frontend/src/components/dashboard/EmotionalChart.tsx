import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { EmotionalCheckinResponse } from '../../types/api'

interface EmotionalChartProps {
  checkins: EmotionalCheckinResponse[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const score = payload[0].value
  return (
    <div className="px-3 py-2 rounded-xl border border-white/10 text-xs"
      style={{ background: 'rgba(13,27,42,0.95)' }}>
      <p className="text-cream/50 mb-0.5">{label}</p>
      <p className="text-cream font-semibold text-sm">Score : {score}/10</p>
    </div>
  )
}

export default function EmotionalChart({ checkins }: EmotionalChartProps) {
  const data = [...checkins]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((c) => ({
      date: new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      score: c.score,
    }))

  return (
    <div className="rounded-2xl border border-white/6 p-5"
      style={{ background: 'linear-gradient(135deg, rgba(26,45,66,0.8) 0%, rgba(13,27,42,0.9) 100%)' }}>
      <p className="text-cream/60 text-xs font-medium uppercase tracking-wider mb-1">Évolution</p>
      <h3 className="text-cream font-display text-lg font-semibold mb-5">Votre courbe émotionnelle</h3>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: '#F5F0EB55', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 5, 10]}
            tick={{ fill: '#F5F0EB40', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#7C3AED40', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#9D5CF6"
            strokeWidth={2.5}
            fill="url(#scoreGrad)"
            dot={{ fill: '#9D5CF6', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#9D5CF6', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
