import { Coins, Star } from 'lucide-react'
import { useState } from 'react'
import { useTokens } from '../../hooks/useTokens'
import type { TokenPackage } from '../../types/api'

interface PackageCardProps {
  pkg: TokenPackage
}

export default function PackageCard({ pkg }: PackageCardProps) {
  const { purchasePackage } = useTokens()
  const [loading, setLoading] = useState(false)

  const handlePurchase = async () => {
    setLoading(true)
    try {
      await purchasePackage(pkg.id)
    } finally {
      setLoading(false)
    }
  }

  const priceEuros = (pkg.price_cents / 100).toFixed(2)

  return (
    <div className={`bg-navy-light border rounded-xl p-5 flex flex-col gap-3 hover:border-violet/50 transition-colors ${pkg.popular ? 'border-violet' : 'border-navy'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-violet" />
          <h4 className="text-cream font-medium">{pkg.name}</h4>
        </div>
        {pkg.popular && (
          <span className="flex items-center gap-1 text-xs text-violet-light font-medium">
            <Star size={12} fill="currentColor" /> Populaire
          </span>
        )}
      </div>

      <div>
        <p className="text-3xl font-bold text-cream">{pkg.token_amount.toLocaleString()}</p>
        <p className="text-cream/40 text-sm">tokens</p>
      </div>

      {pkg.description && (
        <p className="text-cream/50 text-sm">{pkg.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <p className="text-violet-light font-semibold text-lg">{priceEuros} €</p>
        <button
          type="button"
          onClick={handlePurchase}
          disabled={loading}
          className="bg-violet hover:bg-violet-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          {loading ? 'Redirection…' : 'Acheter'}
        </button>
      </div>
    </div>
  )
}
