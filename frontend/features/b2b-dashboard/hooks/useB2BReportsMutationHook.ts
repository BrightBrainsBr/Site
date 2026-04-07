// frontend/features/b2b-dashboard/hooks/useB2BReportsMutationHook.ts

import { useMutation } from '@tanstack/react-query'

import type { B2BReportRequest, B2BReportDownloadResult } from '../b2b-dashboard.interface'

async function downloadBlob(res: Response, fallbackFilename: string): Promise<void> {
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] ?? fallbackFilename

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function useB2BReportsMutationHook(companyId: string | null) {
  return useMutation<B2BReportDownloadResult, Error, B2BReportRequest>({
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
      const generatedAt = res.headers.get('X-Generated-At') ?? new Date().toISOString()
      await downloadBlob(res, `relatorio-${request.type}-${Date.now()}.pdf`)
      return { generatedAt }
    },
  })
}
