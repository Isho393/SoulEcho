import { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { Coins, Zap, TrendingUp } from 'lucide-react'
import { useTokens } from '../hooks/useTokens'
import BalanceCard from '../components/tokens/BalanceCard'
import PackageCard from '../components/tokens/PackageCard'
import api from '../lib/api'

export default function TokensPage() {
  const { balance, packages, isLoading } = useTokens()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const payment = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')

    if (payment === 'success' && sessionId) {
      api.post('/api/v1/payment/verify_payment', { session_id: sessionId })
        .then((res) => {
          if (res.data?.tokens_added > 0) {
            toast.success(`${res.data.tokens_added} tokens ajoutés à votre solde !`)
          } else {
            toast.info('Paiement reçu, solde en cours de mise à jour.')
          }
        })
        .catch(() => toast.error('Impossible de vérifier le paiement.'))
        .finally(() => setSearchParams({}))
    }
  }, [])

  return (
    <div className="h-full overflow-y-auto px-5 py-7 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="text-cream/35 text-xs font-medium uppercase tracking-widest mb-1">Crédits</p>
        <h1 className="text-cream font-display text-3xl font-semibold mb-7">Mes tokens</h1>
      </motion.div>

      {/* Balance card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
        <BalanceCard balance={balance} />
      </motion.div>

      {/* Info strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-7"
      >
        {[
          { icon: Zap, label: '1 message', sub: '~10 tokens', color: '#9D5CF6' },
          { icon: TrendingUp, label: 'Valable', sub: 'Sans expiration', color: '#10b981' },
          { icon: Coins, label: 'Paiement', sub: 'Sécurisé Stripe', color: '#f59e0b' },
        ].map(({ icon: Icon, label, sub, color }) => (
          <div key={label} className="rounded-2xl p-3.5 text-center"
            style={{ background: 'rgba(26,45,66,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Icon size={18} className="mx-auto mb-1.5" style={{ color }} />
            <p className="text-cream/70 text-xs font-medium">{label}</p>
            <p className="text-cream/35 text-[10px] mt-0.5">{sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Packages */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl shimmer" style={{ background: 'rgba(26,45,66,0.4)' }} />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-cream/35 text-sm">Aucun package disponible pour le moment.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="text-cream/45 text-xs font-medium uppercase tracking-wider mb-4">Packages disponibles</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.06 }}
              >
                <PackageCard pkg={pkg} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <p className="text-cream/20 text-xs text-center mt-8">
        Paiements sécurisés par Stripe · <Link to="/profile" className="hover:text-cream/40 transition-colors underline">Politique de confidentialité</Link>
      </p>
    </div>
  )
}
