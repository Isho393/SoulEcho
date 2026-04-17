import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from './useAuth'
import type { UserProfileResponse, UserProfileUpdate } from '../types/api'

export function useProfile() {
  const queryClient = useQueryClient()
  const { logout } = useAuth()

  const { data: profile, isLoading } = useQuery<UserProfileResponse>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get<UserProfileResponse>('/api/v1/profile')
      return res.data
    },
    staleTime: 30_000,
  })

  const { mutateAsync: updateProfile } = useMutation({
    mutationFn: async (data: UserProfileUpdate) => {
      const res = await api.put<UserProfileResponse>('/api/v1/profile', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => {
      // error handled in component via try/catch
    },
  })

  const exportData = async () => {
    const res = await api.get('/api/v1/profile/export', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'soulecho-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const deleteAccount = async () => {
    await api.delete('/api/v1/profile/me')
    logout()
  }

  return { profile: profile ?? null, isLoading, updateProfile, exportData, deleteAccount }
}
