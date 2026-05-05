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
        // 504 from Vercel returns a plain HTML/text gateway timeout (no JSON body).
        const text = await res.text().catch(() => '')
        let message = `PGR generation failed (HTTP ${res.status})`
        if (text) {
          try {
            const parsed = JSON.parse(text) as { error?: string }
            if (parsed.error) message = parsed.error
          } catch {
            if (res.status === 504) {
              message =
                'Tempo limite excedido (504). A geração demorou mais que 5 min — tente novamente ou contate o suporte.'
            } else {
              message = text.slice(0, 200)
            }
          }
        }
        throw new Error(message)
      }
      return res.json() as Promise<PGRResult>
    },
  })
}
