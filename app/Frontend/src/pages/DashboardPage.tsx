import { motion } from 'motion/react'
import { useDashboard } from '../hooks/useDashboard'
import EmotionalChart from '../components/dashboard/EmotionalChart'
import StatsBlock from '../components/dashboard/StatsBlock'
import CheckinWidget from '../components/dashboard/CheckinWidget'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/6 px-4 py-4 flex flex-col gap-1"
      style={{ background: 'rgba(26,45,66,0.6)' }}>
      <p className="text-cream/40 text-xs">{label}</p>
      <p className="text-cream text-2xl font-display font-semibold">{value}</p>
      {sub && <p className="text-cream/30 text-xs">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { checkins, stats, isLoading } = useDashboard()

  return (
    <div className="h-full overflow-y-auto px-5 py-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-cream/40 text-xs font-medium uppercase tracking-wider mb-1">Tableau de bord</p>
        <h1 className="text-cream font-display text-2xl font-semibold mb-6">Votre bien-être</h1>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'rgba(26,45,66,0.5)' }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Quick stats */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="grid grid-cols-2 gap-3"
            >
              <StatCard
                label="Moyenne 7 jours"
                value={stats.avg_7d != null ? stats.avg_7d.toFixed(1) : '—'}
                sub="sur 10"
              />
              <StatCard
                label="Moyenne 30 jours"
                value={stats.avg_30d != null ? stats.avg_30d.toFixed(1) : '—'}
                sub={stats.trend === 'improving' ? '↑ En hausse' : stats.trend === 'declining' ? '↓ En baisse' : '→ Stable'}
              />
            </motion.div>
          )}

          {/* Chart */}
          {checkins.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <EmotionalChart checkins={checkins} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/6 p-8 text-center"
              style={{ background: 'rgba(26,45,66,0.5)' }}
            >
              <p className="text-4xl mb-3">🌱</p>
              <p className="text-cream/60 text-sm">Votre courbe émotionnelle apparaîtra ici</p>
              <p className="text-cream/30 text-xs mt-1">Commencez par un premier check-in</p>
            </motion.div>
          )}

          {/* Stats détaillées */}
          {stats && checkins.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <StatsBlock stats={stats} />
            </motion.div>
          )}

          {/* Check-in */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <CheckinWidget />
          </motion.div>
        </div>
      )}
    </div>
  )
}
