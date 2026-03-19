// frontend/features/b2b-dashboard/hooks/useB2BCompliance.ts

'use client'

import { useQuery } from '@tanstack/react-query'

import type { B2BComplianceData } from '../b2b-dashboard.interface'

async function fetchCompliance(
  companyId: string,
  cycleId?: string | null
): Promise<B2BComplianceData> {
  const url = new URL(`/api/b2b/${companyId}/compliance`, window.location.origin)
  if (cycleId) url.searchParams.set('cycle', cycleId)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch compliance')
  return res.json()
}

export function useB2BCompliance(
  companyId: string | null,
  cycleId?: string | null
) {
  return useQuery({
    queryKey: ['b2b', 'compliance', companyId, cycleId],
    queryFn: () => fetchCompliance(companyId!, cycleId),
    enabled: !!companyId,
  })
}
