// frontend/features/b2b-dashboard/hooks/useB2BProfileMutationHook.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'

interface ProfileUpdatePayload {
  display_name?: string
  password?: string
}

export function useB2BProfileMutationHook() {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean }, Error, ProfileUpdatePayload>({
    mutationFn: async (payload) => {
      const response = await fetch('/api/b2b/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar perfil')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b', 'profile'] })
    },
  })
}
