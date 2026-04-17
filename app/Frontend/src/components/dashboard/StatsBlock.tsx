import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion } from 'motion/react'
import type { EmotionalStats } from '../../types/api'

interface StatsBlockProps {
  stats: EmotionalStats | null
}

function StatItem({ label, value, delay = 0 }: { label: string; value: number | null | undefined; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl p-3.5 text-center"
      style={{ background: 'rgba(8,17,26,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="text-cream/35 text-[10px] font-medium uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-cream font-display text-2xl font-semibold">
        {value != null ? value.toFixed(1) : '—'}
      </p>
    </motion.div>
  )
}

export default function StatsBlock({ stats }: StatsBlockProps) {
  if (!stats) return null

  const trendConfig = {
    improving:         { icon: TrendingUp,   color: '#10b981', label: 'En amélioration' },
    declining:         { icon: TrendingDown, color: '#f43f5e', label: 'En baisse' },
    stable:            { icon: Minus,        color: '#9D5CF6', label: 'Stable' },
    insufficient_data: { icon: Minus,        color: 'rgba(245,240,235,0.3)', label: 'Données insuffisantes' },
  }

  const trend = trendConfig[stats.trend]
  const TrendIcon = trend.icon

  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'linear-gradient(145deg, rgba(26,45,66,0.6) 0%, rgba(13,27,42,0.8) 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-cream/35 text-xs font-medium uppercase tracking-wider mb-4">Statistiques détaillées</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <StatItem label="Moy. 7j"  value={stats.avg_7d}  delay={0} />
        <StatItem label="Moy. 30j" value={stats.avg_30d} delay={0.04} />
        <StatItem label="Min 30j"  value={stats.min_30d} delay={0.08} />
        <StatItem label="Max 30j"  value={stats.max_30d} delay={0.12} />
      </div>

      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium"
        style={{ background: `${trend.color}12`, border: `1px solid ${trend.color}25`, color: trend.color }}>
        <TrendIcon size={15} />
        <span>{trend.label}</span>
      </div>
    </div>
  )
}
