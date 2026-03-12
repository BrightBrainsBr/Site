import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiDelete } from '~/shared/utils/api-helpers'

export function useDeleteEvaluationMutationHook(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const result = await apiDelete(`/api/portal/evaluations/${id}`)
      if (!result.success) {
        throw new Error(result.error ?? 'Falha ao excluir avaliação')
      }
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['portal', 'evaluations'],
      })
    },
  })
}
