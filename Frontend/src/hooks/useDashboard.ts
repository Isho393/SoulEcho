import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { EmotionalCheckinResponse, EmotionalStats, EmotionalCheckinCreate } from '../types/api'

export function useDashboard() {
  const queryClient = useQueryClient()

  const { data: checkins = [], isLoading: checkinsLoading } = useQuery<EmotionalCheckinResponse[]>({
    queryKey: ['checkins'],
    queryFn: async () => {
      const res = await api.get<EmotionalCheckinResponse[]>('/api/v1/emotional-checkin')
      return res.data
    },
    staleTime: 60_000,
  })

  const { data: stats, isLoading: statsLoading } = useQuery<EmotionalStats>({
    queryKey: ['checkin-stats'],
    queryFn: async () => {
      const res = await api.get<EmotionalStats>('/api/v1/emotional-checkin/stats')
      return res.data
    },
    staleTime: 60_000,
  })

  const { mutateAsync: submitCheckin } = useMutation({
    mutationFn: async (data: EmotionalCheckinCreate) => {
      const res = await api.post<EmotionalCheckinResponse>('/api/v1/emotional-checkin', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] })
      queryClient.invalidateQueries({ queryKey: ['checkin-stats'] })
    },
  })

  return {
    checkins,
    stats: stats ?? null,
    isLoading: checkinsLoading || statsLoading,
    submitCheckin,
  }
}
