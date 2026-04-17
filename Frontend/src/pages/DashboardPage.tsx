import { motion } from 'motion/react'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import EmotionalChart from '../components/dashboard/EmotionalChart'
import StatsBlock from '../components/dashboard/StatsBlock'
import CheckinWidget from '../components/dashboard/CheckinWidget'

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-1.5 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, rgba(26,45,66,0.7) 0%, rgba(13,27,42,0.85) 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {accent && (
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ background: accent, transform: 'translate(30%, -30%)' }} />
      )}
      <p className="text-cream/40 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-cream font-display text-3xl font-semibold">{value}</p>
      {sub && <p className="text-cream/35 text-xs">{sub}</p>}
    </div>
  )
}

const TREND_CONFIG = {
  improving:        { icon: TrendingUp,   color: '#10b981', label: '↑ En amélioration', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  declining:        { icon: TrendingDown, color: '#f43f5e', label: '↓ En baisse',        bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.2)' },
  stable:           { icon: Minus,        color: '#9D5CF6', label: '→ Stable',           bg: 'rgba(157,92,246,0.08)', border: 'rgba(157,92,246,0.2)' },
  insufficient_data:{ icon: Activity,     color: '#F5F0EB', label: 'Données insuffisantes', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
}

export default function DashboardPage() {
  const { checkins, stats, isLoading } = useDashboard()

  return (
    <div className="h-full overflow-y-auto px-5 py-7 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="text-cream/35 text-xs font-medium uppercase tracking-widest mb-1">Tableau de bord</p>
        <h1 className="text-cream font-display text-3xl font-semibold mb-7">Votre bien-être</h1>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl shimmer" style={{ background: 'rgba(26,45,66,0.4)' }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Stats grid */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="grid grid-cols-2 gap-3"
            >
              <StatCard
                label="Moyenne 7 jours"
                value={stats.avg_7d != null ? stats.avg_7d.toFixed(1) : '—'}
                sub="sur 10"
                accent="#7C3AED"
              />
              <StatCard
                label="Moyenne 30 jours"
                value={stats.avg_30d != null ? stats.avg_30d.toFixed(1) : '—'}
                sub={stats.trend === 'improving' ? '↑ En hausse' : stats.trend === 'declining' ? '↓ En baisse' : '→ Stable'}
                accent={stats.trend === 'improving' ? '#10b981' : stats.trend === 'declining' ? '#f43f5e' : '#9D5CF6'}
              />
            </motion.div>
          )}

          {/* Trend badge */}
          {stats && stats.trend !== 'insufficient_data' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              {(() => {
                const t = TREND_CONFIG[stats.trend]
                const Icon = t.icon
                return (
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium"
                    style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.color }}>
                    <Icon size={16} />
                    <span>{t.label}</span>
                  </div>
                )
              })()}
            </motion.div>
          )}

          {/* Chart */}
          {checkins.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <EmotionalChart checkins={checkins} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="rounded-2xl p-10 text-center"
              style={{ background: 'linear-gradient(145deg, rgba(26,45,66,0.5) 0%, rgba(13,27,42,0.6) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <motion.p
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-5xl mb-4"
              >🌱</motion.p>
              <p className="text-cream/55 text-sm font-medium">Votre courbe émotionnelle apparaîtra ici</p>
              <p className="text-cream/25 text-xs mt-1.5">Commencez par un premier check-in ci-dessous</p>
            </motion.div>
          )}

          {/* Detailed stats */}
          {stats && checkins.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <StatsBlock stats={stats} />
            </motion.div>
          )}

          {/* Check-in */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <CheckinWidget />
          </motion.div>
        </div>
      )}
    </div>
  )
}
