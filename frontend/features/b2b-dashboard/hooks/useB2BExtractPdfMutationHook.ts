// frontend/features/b2b-dashboard/hooks/useB2BExtractPdfMutationHook.ts

import { useMutation } from '@tanstack/react-query'

import type {
  PdfExtractionResponse,
  PdfExtractionType,
} from '../b2b-dashboard.interface'

export type ExtractPdfInput =
  | { file: File; extractionType: PdfExtractionType }
  | { fileUrl: string; extractionType: PdfExtractionType }

export function useB2BExtractPdfMutationHook(companyId: string | null) {
  return useMutation<PdfExtractionResponse, Error, ExtractPdfInput>({
    mutationFn: async (input) => {
      let res: Response

      if ('file' in input) {
        const formData = new FormData()
        formData.append('file', input.file)
        formData.append('extractionType', input.extractionType)
        res = await fetch(`/api/brightmonitor/${companyId}/extract-pdf`, {
          method: 'POST',
          body: formData,
        })
      } else {
        res = await fetch(`/api/brightmonitor/${companyId}/extract-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: input.fileUrl,
            extractionType: input.extractionType,
          }),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(
          (err as { error?: string }).error || 'Failed to extract PDF'
        )
      }
      return res.json()
    },
  })
}
