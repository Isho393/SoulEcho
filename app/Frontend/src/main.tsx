import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './hooks/useAuth'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          richColors
          expand={false}
          gap={8}
          toastOptions={{
            style: {
              background: 'rgba(17, 31, 48, 0.97)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: '#F5F0EB',
              backdropFilter: 'blur(16px)',
              borderRadius: '14px',
              fontSize: '13px',
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
