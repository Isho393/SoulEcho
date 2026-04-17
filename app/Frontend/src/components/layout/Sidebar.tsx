import { NavLink } from 'react-router-dom'
import { MessageCircle, User, BarChart2, Coins, LogOut, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useAuth } from '../../hooks/useAuth'
import { useTokens } from '../../hooks/useTokens'

const navItems = [
  { to: '/chat',      icon: MessageCircle, label: 'Chat',       emoji: '💬' },
  { to: '/dashboard', icon: BarChart2,     label: 'Bien-être',  emoji: '📊' },
  { to: '/profile',   icon: User,          label: 'Profil',     emoji: '👤' },
  { to: '/tokens',    icon: Coins,         label: 'Tokens',     emoji: '🪙' },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const { balance } = useTokens()
  const isLow = balance !== null && balance.balance < 50

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'SE'

  return (
    <aside
      className="flex flex-col h-full w-64 shrink-0 py-5 px-3 relative"
      style={{ background: 'rgba(10, 18, 28, 0.95)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet to-violet-light flex items-center justify-center shadow-lg shadow-violet/35 shrink-0">
          <Sparkles size={16} className="text-white" />
        </div>
        <div>
          <p className="text-cream font-display font-semibold text-base leading-none">SoulEcho</p>
          <p className="text-cream/30 text-[11px] mt-0.5">Votre espace d'écoute</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, icon: Icon, label }, idx) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'text-white'
                  : 'text-cream/45 hover:text-cream/80 hover:bg-white/4'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <>
                    <motion.div
                      layoutId="nav-bg"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(124,58,237,0.1) 100%)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                    <motion.div
                      layoutId="nav-indicator"
                      className="nav-active-indicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  </>
                )}
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative z-10 flex items-center gap-3 w-full"
                >
                  <Icon size={17} className={`shrink-0 transition-colors ${isActive ? 'text-violet-light' : 'group-hover:text-cream/70'}`} />
                  <span className="relative z-10">{label}</span>
                </motion.div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Token balance */}
      <div className={`mx-1 mb-2 px-3 py-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
        isLow
          ? 'bg-rose-900/20 border-rose-700/30 text-rose-400'
          : 'border-white/5 text-cream/40'
      }`} style={!isLow ? { background: 'rgba(255,255,255,0.03)' } : {}}>
        <Coins size={13} className="shrink-0" />
        <span className="flex-1">
          {balance !== null ? (
            <><span className="font-semibold text-cream/75">{balance.balance.toLocaleString()}</span> tokens</>
          ) : '—'}
        </span>
        {isLow && <span className="text-rose-400/70 text-[10px] font-medium">Faible</span>}
      </div>

      {/* User + logout */}
      <div className="mx-1 flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/4 transition-colors group cursor-pointer" onClick={logout}>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet/60 to-violet-light/60 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-cream/60 text-xs truncate group-hover:text-cream/80 transition-colors">
            {user?.name || user?.email || 'Utilisateur'}
          </p>
        </div>
        <LogOut size={14} className="text-cream/25 group-hover:text-cream/60 transition-colors shrink-0" />
      </div>
    </aside>
  )
}
