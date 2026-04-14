import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { TokenBalance, TokenPackage } from '../types/api'

export function useTokens() {
  const queryClient = useQueryClient()

  const { data: balance, isLoading: balanceLoading } = useQuery<TokenBalance>({
    queryKey: ['token-balance'],
    queryFn: async () => {
      const res = await api.get<TokenBalance>('/api/v1/token-balances')
      return res.data
    },
    staleTime: 30_000,
  })

  const { data: packages = [], isLoading: packagesLoading } = useQuery<TokenPackage[]>({
    queryKey: ['token-packages'],
    queryFn: async () => {
      const res = await api.get<TokenPackage[]>('/api/v1/token-packages')
      return res.data
    },
    staleTime: 300_000,
  })

  const { mutateAsync: purchasePackage } = useMutation({
    mutationFn: async (packageId: string | number) => {
      const res = await api.post(`/api/v1/token-packages/${packageId}/purchase`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-balance'] })
    },
  })

  return {
    balance: balance ?? null,
    packages,
    isLoading: balanceLoading || packagesLoading,
    purchasePackage,
  }
}
