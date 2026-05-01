// frontend/features/b2b-dashboard/hooks/useB2BDenunciasQueryHook.ts
'use client'

import { useQuery } from '@tanstack/react-query'

export type AnonymousReportType = 'harassment' | 'general'
export type AnonymousReportFilter = AnonymousReportType | 'all'

export interface AnonymousReport {
  id: string
  reportType: AnonymousReportType
  department: string | null
  description: string
  createdAt: string
}

interface DenunciasResponse {
  reports: AnonymousReport[]
  totals: {
    all: number
    harassment: number
    general: number
  }
}

async function fetchDenuncias(
  companyId: string,
  cycleId: string | null | undefined,
  type: AnonymousReportFilter
): Promise<DenunciasResponse> {
  const url = new URL(
    `/api/brightmonitor/${companyId}/anonymous-reports`,
    window.location.origin
  )
  if (cycleId) url.searchParams.set('cycle', cycleId)
  if (type !== 'all') url.searchParams.set('type', type)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch denúncias')
  return res.json()
}

export function useB2BDenunciasQueryHook(
  companyId: string | null,
  cycleId: string | null | undefined,
  type: AnonymousReportFilter = 'all'
) {
  return useQuery({
    queryKey: ['b2b', 'denuncias', companyId, cycleId, type],
    queryFn: () => fetchDenuncias(companyId!, cycleId, type),
    enabled: !!companyId,
    staleTime: 60_000,
  })
}
