// frontend/features/portal/hooks/useUpdateEvaluationMutationHook.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'
import { apiPatch } from '~/shared/utils/api-helpers'

interface UpdateEvaluationPayload {
  form_data: Partial<AssessmentFormData>
  scores?: Record<string, number>
  changed_by?: string
}

export function useUpdateEvaluationMutationHook(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateEvaluationPayload) => {
      const result = await apiPatch(`/api/portal/evaluations/${id}`, payload)
      if (!result.success) {
        throw new Error(result.error ?? 'Falha ao salvar')
      }
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['portal', 'evaluations', id],
      })
      void queryClient.invalidateQueries({
        queryKey: ['portal', 'evaluations'],
      })
    },
  })
}
