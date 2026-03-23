// frontend/features/portal/hooks/usePortalSummaryQueryHook.ts

import { useQuery } from '@tanstack/react-query'

import { apiGet } from '~/shared/utils/api-helpers'

import type { EvaluationListItem } from '../portal.interface'

interface PortalSummary {
  totalCount: number
  pendingCount: number
  approvedCount: number
  rejectedCount: number
}

interface UsePortalSummaryParams {
  enabled?: boolean
}

export function usePortalSummaryQueryHook(params?: UsePortalSummaryParams) {
  return useQuery<PortalSummary, Error>({
    queryKey: ['portal', 'summary'],
    queryFn: async () => {
      const result = await apiGet<EvaluationListItem[]>(
        '/api/portal/evaluations'
      )
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to fetch summary')
      }
      const data = result.data!
      return {
        totalCount: data.length,
        pendingCount: data.filter((e) => e.reviewer_status === 'pending_review')
          .length,
        approvedCount: data.filter((e) => e.reviewer_status === 'approved')
          .length,
        rejectedCount: data.filter((e) => e.reviewer_status === 'rejected')
          .length,
      }
    },
    enabled: params?.enabled !== false,
  })
}
