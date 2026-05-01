// frontend/features/b2b-dashboard/hooks/useB2BAlerts.ts

'use client'

import { useQuery } from '@tanstack/react-query'

import type { B2BAlertsData } from '../b2b-dashboard.interface'

async function fetchAlerts(
  companyId: string,
  cycleId?: string | null
): Promise<B2BAlertsData> {
  const url = new URL(`/api/brightmonitor/${companyId}/alerts`, window.location.origin)
  if (cycleId) url.searchParams.set('cycle', cycleId)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch alerts')
  return res.json()
}

export function useB2BAlerts(
  companyId: string | null,
  cycleId?: string | null
) {
  return useQuery({
    queryKey: ['b2b', 'alerts', companyId, cycleId],
    queryFn: () => fetchAlerts(companyId!, cycleId),
    enabled: !!companyId,
  })
}
