// frontend/features/b2b-dashboard/hooks/useB2BReportsMutationHook.ts

import { useMutation } from '@tanstack/react-query'

import type {
  B2BReportRequest,
  B2BReportResponse,
} from '../b2b-dashboard.interface'

export function useB2BReportsMutationHook(companyId: string | null) {
  return useMutation<B2BReportResponse, Error, B2BReportRequest>({
    mutationFn: async (request) => {
      const res = await fetch(`/api/b2b/${companyId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(
          (err as { message?: string }).message || 'Failed to generate report'
        )
      }
      return res.json()
    },
  })
}
