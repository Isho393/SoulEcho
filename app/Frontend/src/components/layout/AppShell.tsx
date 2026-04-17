import { useState } from 'react'
import { Menu, X, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Sidebar from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative flex h-screen text-cream font-sans overflow-hidden" style={{ background: 'var(--color-navy-deep)' }}>
      {/* Ambient glow */}
      <div className="ambient-bg" />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-30 md:z-auto h-full transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/5 md:hidden"
          style={{ background: 'rgba(8,17,26,0.85)', backdropFilter: 'blur(16px)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-cream/45 hover:text-cream p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet to-violet-light flex items-center justify-center shadow-md shadow-violet/30">
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="text-cream/80 font-display font-semibold text-lg">SoulEcho</span>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
