import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { EmotionalStats } from '../../types/api'

interface StatsBlockProps {
  stats: EmotionalStats | null
}

function StatItem({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="bg-navy rounded-lg p-3 text-center">
      <p className="text-cream/40 text-xs mb-1">{label}</p>
      <p className="text-cream text-xl font-semibold">
        {value != null ? value.toFixed(1) : '—'}
      </p>
    </div>
  )
}

export default function StatsBlock({ stats }: StatsBlockProps) {
  if (!stats) return null

  const trendConfig = {
    improving: {
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      label: 'En amélioration',
    },
    declining: {
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-900/20',
      label: 'En baisse',
    },
    stable: {
      icon: Minus,
      color: 'text-cream/50',
      bg: 'bg-navy',
      label: 'Stable',
    },
    insufficient_data: {
      icon: Minus,
      color: 'text-cream/30',
      bg: 'bg-navy',
      label: 'Données insuffisantes',
    },
  }

  const trend = trendConfig[stats.trend]
  const TrendIcon = trend.icon

  return (
    <div className="bg-navy-light rounded-xl p-4">
      <h3 className="text-cream/70 text-sm font-medium mb-4">Statistiques</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatItem label="Moy. 7 jours" value={stats.avg_7d} />
        <StatItem label="Moy. 30 jours" value={stats.avg_30d} />
        <StatItem label="Min 30 jours" value={stats.min_30d} />
        <StatItem label="Max 30 jours" value={stats.max_30d} />
      </div>

      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${trend.bg}`}>
        <TrendIcon size={16} className={trend.color} />
        <span className={`text-sm font-medium ${trend.color}`}>{trend.label}</span>
      </div>
    </div>
  )
}
