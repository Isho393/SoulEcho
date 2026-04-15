import { useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative flex h-screen text-cream font-sans overflow-hidden" style={{ background: 'var(--color-navy-deep)' }}>
      {/* Ambient glow background */}
      <div className="ambient-bg" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
          style={{ background: 'color-mix(in srgb, var(--color-navy) 80%, transparent)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-cream/50 hover:text-cream p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-cream/80 font-display font-semibold text-lg">SoulEcho</span>
        </header>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
