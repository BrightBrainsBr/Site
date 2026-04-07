// frontend/features/b2b-dashboard/hooks/useB2BNR1InventoryMutationHook.ts

import { useMutation } from '@tanstack/react-query'

import type { B2BReportDownloadResult } from '../b2b-dashboard.interface'

interface InventoryRequest {
  department?: string
  cycleId?: string
}

export function useB2BNR1InventoryMutationHook(companyId: string | null) {
  return useMutation<B2BReportDownloadResult, Error, InventoryRequest>({
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
      const generatedAt = res.headers.get('X-Generated-At') ?? new Date().toISOString()

      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] ?? `inventario-nr1-${Date.now()}.pdf`

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      return { generatedAt }
    },
  })
}
