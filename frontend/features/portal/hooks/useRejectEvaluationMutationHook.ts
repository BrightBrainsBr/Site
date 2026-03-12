// frontend/features/portal/hooks/useRejectEvaluationMutationHook.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiPost } from '~/shared/utils/api-helpers'

interface RejectPayload {
  reviewer_notes: string
}

export function useRejectEvaluationMutationHook(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: RejectPayload) => {
      const result = await apiPost(
        `/api/portal/evaluations/${id}/reject`,
        payload
      )
      if (!result.success) {
        throw new Error(result.error ?? 'Falha ao rejeitar')
      }
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['portal', 'evaluations'] })
      void queryClient.invalidateQueries({ queryKey: ['portal', 'evaluations', id] })
    },
  })
}
