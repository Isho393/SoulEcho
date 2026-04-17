import { createBrowserRouter, RouterProvider, Navigate, useSearchParams, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import TokensPage from './pages/TokensPage'
import ProtectedLayout from './components/layout/ProtectedLayout'
import PageTransition from './components/layout/PageTransition'

function PaymentSuccessRedirect() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id') ?? ''
  return <Navigate to={`/tokens?payment=success&session_id=${sessionId}`} replace />
}

// Animated outlet wrapper
function AnimatedPages() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname}>
        {/* children rendered by ProtectedLayout via Outlet */}
      </PageTransition>
    </AnimatePresence>
  )
}

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/chat" replace /> },
      { path: 'chat',      element: <PageTransition><ChatPage /></PageTransition> },
      { path: 'profile',   element: <PageTransition><ProfilePage /></PageTransition> },
      { path: 'dashboard', element: <PageTransition><DashboardPage /></PageTransition> },
      { path: 'tokens',    element: <PageTransition><TokensPage /></PageTransition> },
      { path: 'payment-success', element: <PaymentSuccessRedirect /> },
      { path: '*', element: <Navigate to="/chat" replace /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export default function App() {
  return <RouterProvider router={router} />
}

// suppress unused warning
void AnimatedPages
