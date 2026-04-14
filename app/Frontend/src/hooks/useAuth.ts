import { createContext, useContext, useEffect, useState, type ReactNode, createElement } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { getToken, setToken, removeToken } from '../lib/auth'
import type { UserResponse } from '../types/api'

interface AuthContextValue {
  user: UserResponse | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken())

  useEffect(() => {
    const token = getToken()
    if (token) {
      api.get<UserResponse>('/api/v1/auth/me')
        .then((res) => {
          setUser(res.data)
          setIsAuthenticated(true)
        })
        .catch(() => {
          removeToken()
          setUser(null)
          setIsAuthenticated(false)
        })
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string }>('/api/v1/auth/login', { email, password })
    setToken(res.data.token)
    const meRes = await api.get<UserResponse>('/api/v1/auth/me')
    setUser(meRes.data)
    setIsAuthenticated(true)
  }

  const register = async (email: string, password: string, name?: string) => {
    const res = await api.post<{ token: string }>('/api/v1/auth/register', { email, password, name })
    setToken(res.data.token)
    const meRes = await api.get<UserResponse>('/api/v1/auth/me')
    setUser(meRes.data)
    setIsAuthenticated(true)
  }

  const logout = () => {
    removeToken()
    setUser(null)
    setIsAuthenticated(false)
  }

  return createElement(AuthContext.Provider, { value: { user, isAuthenticated, login, register, logout } }, children)
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
