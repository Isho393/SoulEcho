import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import TokensPage from './pages/TokensPage'
import ProtectedLayout from './components/layout/ProtectedLayout'

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
      { path: 'chat', element: <ChatPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'tokens', element: <TokensPage /> },
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
