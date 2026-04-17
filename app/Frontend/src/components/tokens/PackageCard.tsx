import { Coins, Zap } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'motion/react'
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
  const pricePerToken = (pkg.price_cents / pkg.token_amount / 100 * 100).toFixed(2)

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-2xl p-5 flex flex-col gap-4 overflow-hidden cursor-pointer"
      style={{
        background: pkg.popular
          ? 'linear-gradient(145deg, rgba(124,58,237,0.2) 0%, rgba(13,27,42,0.95) 100%)'
          : 'linear-gradient(145deg, rgba(26,45,66,0.7) 0%, rgba(13,27,42,0.9) 100%)',
        border: pkg.popular ? '1px solid rgba(124,58,237,0.35)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: pkg.popular ? '0 8px 32px rgba(124,58,237,0.15)' : 'none',
      }}
    >
      {/* Popular badge */}
      {pkg.popular && (
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #9D5CF6)' }}>
          <Zap size={9} fill="currentColor" />
          Populaire
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: pkg.popular ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)' }}>
            <Coins size={15} className={pkg.popular ? 'text-violet-light' : 'text-cream/50'} />
          </div>
          <h4 className="text-cream/85 font-medium text-sm">{pkg.name}</h4>
        </div>

        <div className="flex items-end gap-1.5">
          <p className="text-cream font-display text-4xl font-bold">{pkg.token_amount.toLocaleString()}</p>
          <span className="text-cream/40 text-sm mb-1.5">tokens</span>
        </div>
        <p className="text-cream/30 text-[10px] mt-0.5">{pricePerToken}¢ par token</p>
      </div>

      {pkg.description && (
        <p className="text-cream/45 text-xs leading-relaxed">{pkg.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <p className="font-display text-2xl font-semibold" style={{ color: pkg.popular ? '#9D5CF6' : '#F5F0EB' }}>
          {priceEuros} €
        </p>
        <motion.button
          type="button"
          onClick={handlePurchase}
          disabled={loading}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 btn-glow"
          style={pkg.popular
            ? { background: 'linear-gradient(135deg, #7C3AED, #9D5CF6)', color: 'white', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }
            : { background: 'rgba(255,255,255,0.07)', color: 'rgba(245,240,235,0.8)', border: '1px solid rgba(255,255,255,0.1)' }
          }
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redirection…
            </span>
          ) : 'Acheter'}
        </motion.button>
      </div>
    </motion.div>
  )
}
