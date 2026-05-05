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
        const text = await res.text().catch(() => '')
        let message = `Analysis generation failed (HTTP ${res.status})`
        if (text) {
          try {
            const parsed = JSON.parse(text) as { error?: string }
            if (parsed.error) message = parsed.error
          } catch {
            if (res.status === 504) {
              message =
                'Tempo limite excedido (504). A análise demorou mais que 5 min — tente novamente.'
            } else {
              message = text.slice(0, 200)
            }
          }
        }
        throw new Error(message)
      }
      return res.json() as Promise<AnaliseIAResult>
    },
  })
}
