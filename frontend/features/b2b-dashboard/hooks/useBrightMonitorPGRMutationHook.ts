// frontend/features/b2b-dashboard/hooks/useBrightMonitorPGRMutationHook.ts

import { useMutation } from '@tanstack/react-query'

export interface PGRResult {
  markdown: string
  pdfUrl: string
  generatedAt: string
}

export function useBrightMonitorPGRMutation(companyId: string | null) {
  return useMutation<PGRResult, Error, string>({
    mutationFn: async (slug: string) => {
      const res = await fetch(
        `/api/brightmonitor/${companyId}/reports/pgr/${slug}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(
          (err as { error?: string }).error || 'PGR generation failed'
        )
      }
      return res.json() as Promise<PGRResult>
    },
  })
}
