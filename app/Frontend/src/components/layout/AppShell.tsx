import { useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-navy text-cream font-sans min-w-[375px] max-w-[1440px] mx-auto overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div
        className={`fixed md:relative z-30 md:z-auto h-full transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-navy-light border-b border-navy md:hidden">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-cream/70 hover:text-cream"
            aria-label="Menu"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="text-violet font-display font-bold text-lg">SoulEcho</span>
        </header>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
