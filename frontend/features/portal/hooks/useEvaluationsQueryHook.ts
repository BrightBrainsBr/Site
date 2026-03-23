// frontend/features/portal/hooks/useEvaluationsQueryHook.ts

import { useQuery } from '@tanstack/react-query'

import { apiGet } from '~/shared/utils/api-helpers'

import type { EvaluationListItem } from '../portal.interface'

interface UseEvaluationsParams {
  status?: string
  profile?: string
  search?: string
  sort?: string
}

export function useEvaluationsQueryHook(params: UseEvaluationsParams) {
  return useQuery<EvaluationListItem[], Error>({
    queryKey: ['portal', 'evaluations', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.status) searchParams.set('status', params.status)
      if (params.profile) searchParams.set('profile', params.profile)
      if (params.search) searchParams.set('search', params.search)
      if (params.sort) searchParams.set('sort', params.sort)

      const result = await apiGet<EvaluationListItem[]>(
        `/api/portal/evaluations?${searchParams}`
      )
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to fetch evaluations')
      }
      return result.data!
    },
  })
}
