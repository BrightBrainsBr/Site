// frontend/features/b2b-dashboard/hooks/useB2BProfileQueryHook.ts

import { useQuery } from '@tanstack/react-query'

export interface B2BProfile {
  email: string | null
  display_name: string | null
}

export function useB2BProfileQueryHook() {
  return useQuery<B2BProfile, Error>({
    queryKey: ['b2b', 'profile'],
    queryFn: async () => {
      const response = await fetch('/api/b2b/profile')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar perfil')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}
