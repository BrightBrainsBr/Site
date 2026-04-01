// frontend/features/b2b-dashboard/hooks/useB2BNR1InventoryMutationHook.ts

import { useMutation } from '@tanstack/react-query'

import type { B2BReportResponse } from '../b2b-dashboard.interface'

interface InventoryRequest {
  department?: string
  cycleId?: string
}

export function useB2BNR1InventoryMutationHook(companyId: string | null) {
  return useMutation<B2BReportResponse, Error, InventoryRequest>({
    mutationFn: async (opts) => {
      const res = await fetch(`/api/b2b/${companyId}/nr1-inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(
          (err as { message?: string }).message || 'Failed to generate inventory'
        )
      }
      return res.json()
    },
  })
}
