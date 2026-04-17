import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { EmotionalCheckinResponse } from '../../types/api'

interface EmotionalChartProps {
  checkins: EmotionalCheckinResponse[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  const score = payload[0].value
  const emoji = score >= 8 ? '🤩' : score >= 6 ? '😊' : score >= 4 ? '😐' : '😔'
  return (
    <div className="px-3.5 py-2.5 rounded-2xl text-xs shadow-xl"
      style={{ background: 'rgba(10,18,28,0.97)', border: '1px solid rgba(124,58,237,0.25)' }}>
      <p className="text-cream/40 mb-1 text-[10px]">{label}</p>
      <p className="text-cream font-semibold text-sm flex items-center gap-1.5">
        <span>{emoji}</span>
        <span>{score}/10</span>
      </p>
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
    <div className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, rgba(26,45,66,0.75) 0%, rgba(13,27,42,0.9) 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: '#7C3AED', transform: 'translate(20%, -20%)' }} />

      <p className="text-cream/35 text-xs font-medium uppercase tracking-wider mb-1">Évolution</p>
      <h3 className="text-cream font-display text-lg font-semibold mb-5">Courbe émotionnelle</h3>

      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#9D5CF6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(245,240,235,0.3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 5, 10]}
            tick={{ fill: 'rgba(245,240,235,0.25)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(124,58,237,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#9D5CF6"
            strokeWidth={2.5}
            fill="url(#scoreGrad)"
            dot={{ fill: '#9D5CF6', r: 3.5, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#9D5CF6', strokeWidth: 2, stroke: 'rgba(157,92,246,0.3)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
