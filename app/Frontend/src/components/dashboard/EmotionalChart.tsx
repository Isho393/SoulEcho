import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { EmotionalCheckinResponse } from '../../types/api'

interface EmotionalChartProps {
  checkins: EmotionalCheckinResponse[]
}

export default function EmotionalChart({ checkins }: EmotionalChartProps) {
  const sorted = [...checkins].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const data = sorted.map((c) => ({
    date: new Date(c.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    score: c.score,
  }))

  return (
    <div className="bg-navy-light rounded-xl p-4">
      <h3 className="text-cream/70 text-sm font-medium mb-4">Évolution émotionnelle</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2D42" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#F5F0EB', fontSize: 11, opacity: 0.5 }}
            axisLine={{ stroke: '#1A2D42' }}
            tickLine={false}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            tick={{ fill: '#F5F0EB', fontSize: 11, opacity: 0.5 }}
            axisLine={{ stroke: '#1A2D42' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1A2D42', border: 'none', borderRadius: 8, color: '#F5F0EB' }}
            labelStyle={{ color: '#F5F0EB', opacity: 0.7 }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#7C3AED"
            strokeWidth={2}
            dot={{ fill: '#7C3AED', r: 4 }}
            activeDot={{ r: 6, fill: '#9D5CF6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
