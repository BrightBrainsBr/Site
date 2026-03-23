// frontend/features/portal/hooks/useApproveEvaluationMutationHook.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiPost } from '~/shared/utils/api-helpers'

interface ApprovePayload {
  approved_by: string
}

export function useApproveEvaluationMutationHook(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ApprovePayload) => {
      const result = await apiPost(
        `/api/portal/evaluations/${id}/approve`,
        payload
      )
      if (!result.success) {
        throw new Error(result.error ?? 'Falha ao aprovar')
      }
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['portal', 'evaluations'],
      })
      void queryClient.invalidateQueries({
        queryKey: ['portal', 'evaluations', id],
      })
    },
  })
}
