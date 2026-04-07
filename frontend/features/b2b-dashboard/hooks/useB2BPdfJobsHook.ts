// frontend/features/b2b-dashboard/hooks/useB2BPdfJobsHook.ts

import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

export interface PdfJob {
  id: string
  fileName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface PdfJobDetail {
  id: string
  file_name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result: { events: Array<Record<string, unknown>> } | null
  error_message: string | null
  warnings: string[] | null
  confidence: number | null
  updated_at: string
}

function storageKey(companyId: string) {
  return `pdf_jobs_${companyId}`
}

function readPersistedIds(companyId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(companyId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistIds(companyId: string, ids: string[]) {
  try {
    if (ids.length === 0) {
      localStorage.removeItem(storageKey(companyId))
    } else {
      localStorage.setItem(storageKey(companyId), JSON.stringify(ids))
    }
  } catch {
    // localStorage unavailable (SSR, private mode, etc.)
  }
}

export function useB2BPdfJobsHook(companyId: string | null) {
  const [activeJobIds, setActiveJobIdsState] = useState<string[]>(() => {
    if (!companyId) return []
    return readPersistedIds(companyId)
  })

  const base = `/api/b2b/${companyId}/extract-pdf/jobs`

  const setActiveJobIds = useCallback(
    (ids: string[]) => {
      setActiveJobIdsState(ids)
      if (companyId) persistIds(companyId, ids)
    },
    [companyId]
  )

  // Sync if companyId changes after initial render
  useEffect(() => {
    if (!companyId) return
    const persisted = readPersistedIds(companyId)
    if (persisted.length > 0) {
      setActiveJobIdsState(persisted)
    }
  }, [companyId])

  const uploadJobs = useMutation<{ jobs: PdfJob[] }, Error, File[]>({
    mutationFn: async (files) => {
      const formData = new FormData()
      for (const file of files) {
        formData.append('files', file)
      }
      formData.append('extractionType', 'events-bulk')

      const res = await fetch(base, { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(
          (err as { error?: string }).error || 'Upload falhou'
        )
      }
      return res.json()
    },
    onSuccess: (data) => {
      setActiveJobIds(data.jobs.map((j) => j.id))
    },
  })

  const pollQuery = useQuery<{ jobs: PdfJobDetail[] }>({
    queryKey: ['b2b', companyId, 'pdf-jobs', activeJobIds],
    queryFn: async () => {
      const res = await fetch(`${base}?ids=${activeJobIds.join(',')}`)
      if (!res.ok) throw new Error('Falha ao buscar status')
      return res.json()
    },
    enabled: activeJobIds.length > 0,
    refetchInterval: (query) => {
      const jobs = query.state.data?.jobs
      if (!jobs) return 3000
      const pending = jobs.some(
        (j) => j.status === 'pending' || j.status === 'processing'
      )
      return pending ? 3000 : false
    },
  })

  const isAllComplete =
    pollQuery.data?.jobs?.length === activeJobIds.length &&
    activeJobIds.length > 0 &&
    pollQuery.data.jobs.every(
      (j) => j.status === 'completed' || j.status === 'failed'
    )

  const reset = useCallback(() => {
    setActiveJobIds([])
  }, [setActiveJobIds])

  return {
    uploadJobs,
    pollQuery,
    activeJobIds,
    isAllComplete,
    reset,
    setActiveJobIds,
  }
}
