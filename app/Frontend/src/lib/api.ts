import axios from 'axios'
import { toast } from 'sonner'
import { getToken, removeToken } from './auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — inject JWT
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401 + 5xx
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      removeToken()
      window.location.href = '/auth'
    } else if (status >= 500) {
      toast.error('Une erreur serveur est survenue. Veuillez réessayer.')
    }

    return Promise.reject(error)
  }
)

export default api
