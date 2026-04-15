import { NavLink } from 'react-router-dom'
import { MessageCircle, User, BarChart2, Coins, LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTokens } from '../../hooks/useTokens'

const navItems = [
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/dashboard', icon: BarChart2, label: 'Bien-être' },
  { to: '/profile', icon: User, label: 'Profil' },
  { to: '/tokens', icon: Coins, label: 'Tokens' },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { logout } = useAuth()
  const { balance } = useTokens()
  const isLow = balance !== null && balance.balance < 50

  return (
    <aside
      className="flex flex-col h-full w-60 shrink-0 border-r border-white/5 py-5 px-3"
      style={{ background: 'color-mix(in srgb, var(--color-navy-light) 90%, transparent)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet to-violet-light flex items-center justify-center shadow-lg shadow-violet/30">
          <Sparkles size={15} className="text-white" />
        </div>
        <div>
          <p className="text-cream font-display font-semibold text-base leading-none">SoulEcho</p>
          <p className="text-cream/30 text-xs mt-0.5">Votre espace d'écoute</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-violet/20 text-violet-light border border-violet/20'
                  : 'text-cream/50 hover:text-cream/80 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={`shrink-0 ${isActive ? 'text-violet-light' : ''}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Token balance */}
      <div className={`mx-1 mb-2 px-3 py-2.5 rounded-xl border text-xs flex items-center gap-2 ${
        isLow
          ? 'bg-red-900/20 border-red-700/30 text-red-400'
          : 'bg-white/3 border-white/5 text-cream/50'
      }`}>
        <Coins size={13} className="shrink-0" />
        <span>
          {balance !== null ? (
            <><span className="font-semibold text-cream/80">{balance.balance}</span> tokens</>
          ) : '—'}
        </span>
        {isLow && <span className="ml-auto text-red-400/70">Faible</span>}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-cream/35 hover:text-cream/70 hover:bg-white/5 transition-all text-sm mx-1"
      >
        <LogOut size={17} className="shrink-0" />
        Déconnexion
      </button>
    </aside>
  )
}
