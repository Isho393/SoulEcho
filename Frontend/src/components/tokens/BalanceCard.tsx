import { Coins, AlertTriangle } from 'lucide-react'
import type { TokenBalance } from '../../types/api'

interface BalanceCardProps {
  balance: TokenBalance | null
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  const isLow = balance !== null && balance.balance < 10

  return (
    <div className={`rounded-xl p-5 border ${isLow ? 'border-red-700 bg-red-900/20' : 'border-navy-light bg-navy-light'}`}>
      <div className="flex items-center gap-3 mb-2">
        <Coins size={20} className={isLow ? 'text-red-400' : 'text-violet'} />
        <h3 className="text-cream font-medium">Solde de tokens</h3>
      </div>

      <p className={`text-4xl font-bold mb-1 ${isLow ? 'text-red-400' : 'text-cream'}`}>
        {balance !== null ? balance.balance : '—'}
      </p>
      <p className="text-cream/40 text-sm">tokens disponibles</p>

      {isLow && (
        <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
          <AlertTriangle size={14} />
          <span>Solde faible — rechargez pour continuer à utiliser SoulEcho.</span>
        </div>
      )}
    </div>
  )
}
