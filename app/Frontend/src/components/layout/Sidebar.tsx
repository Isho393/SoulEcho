import { NavLink } from 'react-router-dom'
import { MessageCircle, User, BarChart2, Coins, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTokens } from '../../hooks/useTokens'

const navItems = [
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/profile', icon: User, label: 'Profil' },
  { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
  { to: '/tokens', icon: Coins, label: 'Tokens' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const { balance } = useTokens()

  return (
    <aside className="flex flex-col h-full bg-navy-light border-r border-navy py-6 px-2 md:px-4 w-14 md:w-56 shrink-0 font-sans">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-1">
        <span className="text-violet text-2xl font-display font-bold hidden md:block">SoulEcho</span>
        <span className="text-violet text-2xl font-display font-bold md:hidden">S</span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-violet text-white'
                  : 'text-cream/70 hover:bg-navy hover:text-cream'
              }`
            }
          >
            <Icon size={20} className="shrink-0" />
            <span className="hidden md:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Token balance */}
      <div className="mt-4 mb-2 px-2 py-2 rounded-lg bg-navy flex items-center gap-2">
        <Coins size={16} className="text-violet shrink-0" />
        <span className="hidden md:block text-cream/80 text-xs">
          {balance !== null ? `${balance.balance} tokens` : '—'}
        </span>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-cream/50 hover:text-cream hover:bg-navy transition-colors text-sm"
      >
        <LogOut size={20} className="shrink-0" />
        <span className="hidden md:block">Déconnexion</span>
      </button>
    </aside>
  )
}
