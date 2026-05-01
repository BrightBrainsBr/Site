// frontend/features/b2b-dashboard/hooks/useBrightMonitorAnaliseIAMutationHook.ts

import { useMutation } from '@tanstack/react-query'

export interface AnaliseIAResult {
  markdown: string
}

export function useBrightMonitorAnaliseIAMutation(companyId: string | null) {
  return useMutation<AnaliseIAResult, Error, string>({
    mutationFn: async (slug: string) => {
      const res = await fetch(
        `/api/brightmonitor/${companyId}/reports/analise-ia/${slug}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(
          (err as { error?: string }).error || 'Analysis generation failed'
        )
      }
      return res.json() as Promise<AnaliseIAResult>
    },
  })
}
