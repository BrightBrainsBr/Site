// frontend/features/b2b-dashboard/hooks/useB2BOverview.ts

'use client'

import { useQuery } from '@tanstack/react-query'

import type { B2BOverviewData } from '../b2b-dashboard.interface'

async function fetchOverview(
  companyId: string,
  cycleId?: string | null
): Promise<B2BOverviewData> {
  const url = new URL(`/api/b2b/${companyId}/overview`, window.location.origin)
  if (cycleId) url.searchParams.set('cycle', cycleId)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch overview')
  return res.json()
}

export function useB2BOverview(companyId: string | null, cycleId?: string | null) {
  return useQuery({
    queryKey: ['b2b', 'overview', companyId, cycleId],
    queryFn: () => fetchOverview(companyId!, cycleId),
    enabled: !!companyId,
  })
}
