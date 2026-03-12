// frontend/features/portal/hooks/useEvaluationByIdQueryHook.ts

import { useQuery } from '@tanstack/react-query'

import { apiGet } from '~/shared/utils/api-helpers'
import type { EvaluationDetail } from '../portal.interface'

export function useEvaluationByIdQueryHook(id: string) {
  return useQuery<EvaluationDetail, Error>({
    queryKey: ['portal', 'evaluations', id],
    queryFn: async () => {
      const result = await apiGet<EvaluationDetail>(
        `/api/portal/evaluations/${id}`
      )
      if (!result.success) {
        throw new Error(result.error ?? 'Falha ao carregar avaliação')
      }
      return result.data!
    },
    enabled: !!id,
  })
}
