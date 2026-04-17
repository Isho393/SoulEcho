import { Coins, AlertTriangle, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'
import type { TokenBalance } from '../../types/api'

interface BalanceCardProps {
  balance: TokenBalance | null
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  const isLow = balance !== null && balance.balance < 10
  const pct = balance?.total_purchased
    ? Math.min(100, Math.round((balance.balance / balance.total_purchased) * 100))
    : null

  return (
    <div className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: isLow
          ? 'linear-gradient(145deg, rgba(244,63,94,0.12) 0%, rgba(13,27,42,0.9) 100%)'
          : 'linear-gradient(145deg, rgba(124,58,237,0.15) 0%, rgba(13,27,42,0.9) 100%)',
        border: isLow ? '1px solid rgba(244,63,94,0.25)' : '1px solid rgba(124,58,237,0.2)',
      }}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: isLow ? '#f43f5e' : '#7C3AED', transform: 'translate(30%, -30%)' }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-cream/40 text-xs font-medium uppercase tracking-wider mb-1">Solde actuel</p>
            <div className="flex items-end gap-2">
              <motion.p
                key={balance?.balance}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`font-display text-5xl font-bold ${isLow ? 'text-rose-400' : 'text-cream'}`}
              >
                {balance !== null ? balance.balance.toLocaleString() : '—'}
              </motion.p>
              <span className="text-cream/40 text-sm mb-2">tokens</span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLow ? 'bg-rose-500/15' : 'bg-violet/15'}`}>
            <Coins size={22} className={isLow ? 'text-rose-400' : 'text-violet-light'} />
          </div>
        </div>

        {/* Usage bar */}
        {pct !== null && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-cream/30 mb-1.5">
              <span>Utilisation</span>
              <span>{pct}% restant</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className="h-full rounded-full"
                style={{ background: isLow ? 'linear-gradient(90deg, #f43f5e, #fb7185)' : 'linear-gradient(90deg, #7C3AED, #9D5CF6)' }}
              />
            </div>
          </div>
        )}

        {/* Stats row */}
        {balance?.total_purchased && (
          <div className="flex gap-4 text-xs text-cream/35">
            <span className="flex items-center gap-1">
              <TrendingUp size={11} />
              {balance.total_purchased.toLocaleString()} achetés
            </span>
            {balance.total_used && (
              <span>{balance.total_used.toLocaleString()} utilisés</span>
            )}
          </div>
        )}

        {isLow && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-4 text-rose-400 text-xs font-medium"
          >
            <AlertTriangle size={13} />
            <span>Solde faible — rechargez pour continuer à utiliser SoulEcho.</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
