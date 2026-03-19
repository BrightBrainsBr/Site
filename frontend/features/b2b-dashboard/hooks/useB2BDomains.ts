// frontend/features/b2b-dashboard/hooks/useB2BDomains.ts

'use client'

import { useQuery } from '@tanstack/react-query'

import type { B2BDomainsData } from '../b2b-dashboard.interface'

async function fetchDomains(
  companyId: string,
  cycleId?: string | null
): Promise<B2BDomainsData> {
  const url = new URL(`/api/b2b/${companyId}/domains`, window.location.origin)
  if (cycleId) url.searchParams.set('cycle', cycleId)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch domains')
  return res.json()
}

export function useB2BDomains(
  companyId: string | null,
  cycleId?: string | null
) {
  return useQuery({
    queryKey: ['b2b', 'domains', companyId, cycleId],
    queryFn: () => fetchDomains(companyId!, cycleId),
    enabled: !!companyId,
  })
}
