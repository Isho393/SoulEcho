import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '../lib/api'
import type { TokenBalance, TokenPackage } from '../types/api'

export function useTokens() {
  const queryClient = useQueryClient()

  const { data: balance, isLoading: balanceLoading } = useQuery<TokenBalance | null>({
    queryKey: ['token-balance'],
    queryFn: async () => {
      const res = await api.get('/api/v1/entities/token_balances')
      const data = res.data
      // Returns paginated { items: [...] }
      const items = Array.isArray(data) ? data : (data?.items ?? [])
      return items[0] ?? null
    },
    staleTime: 30_000,
  })

  const { data: packages = [], isLoading: packagesLoading } = useQuery<TokenPackage[]>({
    queryKey: ['token-packages'],
    queryFn: async () => {
      const res = await api.get('/api/v1/entities/token_packages')
      const data = res.data
      return Array.isArray(data) ? data : (data?.items ?? [])
    },
    staleTime: 300_000,
  })

  const { mutateAsync: purchasePackage } = useMutation({
    mutationFn: async (packageId: number) => {
      const res = await api.post('/api/v1/payment/create_payment_session', {
        package_id: packageId,
        success_url: `${window.location.origin}/tokens?payment=success`,
        cancel_url: `${window.location.origin}/tokens`,
      })
      // Redirect to Stripe checkout
      if (res.data?.url) {
        window.location.href = res.data.url
      }
      return res.data
    },
    onError: () => {
      toast.error('Erreur lors de la création de la session de paiement.')
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
