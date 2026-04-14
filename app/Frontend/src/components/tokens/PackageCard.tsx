import { Coins } from 'lucide-react'
import { toast } from 'sonner'
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
      toast.success(`${pkg.tokens} tokens ajoutés à votre solde !`)
    } catch {
      toast.error('Erreur lors de l\'achat. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-navy-light border border-navy rounded-xl p-5 flex flex-col gap-3 hover:border-violet/50 transition-colors">
      <div className="flex items-center gap-2">
        <Coins size={18} className="text-violet" />
        <h4 className="text-cream font-medium">{pkg.name}</h4>
      </div>

      <div>
        <p className="text-3xl font-bold text-cream">{pkg.tokens.toLocaleString()}</p>
        <p className="text-cream/40 text-sm">tokens</p>
      </div>

      {pkg.description && (
        <p className="text-cream/50 text-sm">{pkg.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <p className="text-violet-light font-semibold text-lg">
          {pkg.price.toFixed(2)} {pkg.currency ?? '€'}
        </p>
        <button
          type="button"
          onClick={handlePurchase}
          disabled={loading}
          className="bg-violet hover:bg-violet-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          {loading ? 'Achat…' : 'Acheter'}
        </button>
      </div>
    </div>
  )
}
