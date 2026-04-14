import { useDashboard } from '../hooks/useDashboard'
import EmotionalChart from '../components/dashboard/EmotionalChart'
import StatsBlock from '../components/dashboard/StatsBlock'
import CheckinWidget from '../components/dashboard/CheckinWidget'

function Skeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4">
      <div className="h-48 bg-navy-light rounded-xl" />
      <div className="h-32 bg-navy-light rounded-xl" />
      <div className="h-40 bg-navy-light rounded-xl" />
    </div>
  )
}

export default function DashboardPage() {
  const { checkins, stats, isLoading } = useDashboard()

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-cream mb-6">Tableau de bord</h1>

      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="flex flex-col gap-4">
          {checkins.length === 0 ? (
            <div className="bg-navy-light rounded-xl p-8 text-center">
              <p className="text-cream/50 text-lg mb-2">Aucun check-in pour l'instant</p>
              <p className="text-cream/30 text-sm">
                Commencez à suivre votre état émotionnel en enregistrant votre premier check-in ci-dessous.
              </p>
            </div>
          ) : (
            <>
              <EmotionalChart checkins={checkins} />
              <StatsBlock stats={stats} />
            </>
          )}
          <CheckinWidget />
        </div>
      )}
    </div>
  )
}
