import { useTokens } from '../hooks/useTokens'
import BalanceCard from '../components/tokens/BalanceCard'
import PackageCard from '../components/tokens/PackageCard'

export default function TokensPage() {
  const { balance, packages, isLoading } = useTokens()

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-cream mb-6">Tokens</h1>

      <div className="mb-6">
        <BalanceCard balance={balance} />
      </div>

      {isLoading ? (
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-navy-light rounded-xl" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <p className="text-cream/40 text-center py-8">Aucun package disponible pour le moment.</p>
      ) : (
        <div>
          <h2 className="text-cream/70 text-sm font-medium mb-3">Packages disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
