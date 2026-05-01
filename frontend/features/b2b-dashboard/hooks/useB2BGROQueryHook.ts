// frontend/features/b2b-dashboard/hooks/useB2BGROQueryHook.ts

'use client'

import { useQuery } from '@tanstack/react-query'

import type { B2BGROData } from '../b2b-dashboard.interface'

interface GROFilters {
  department?: string
  cycle?: string
}

async function fetchGRO(
  companyId: string,
  filters?: GROFilters
): Promise<B2BGROData> {
  const url = new URL(`/api/brightmonitor/${companyId}/gro`, window.location.origin)
  if (filters?.department) url.searchParams.set('department', filters.department)
  if (filters?.cycle) url.searchParams.set('cycle', filters.cycle)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch GRO data')
  return res.json()
}

export function useB2BGROQueryHook(
  companyId: string | null,
  filters?: GROFilters
) {
  return useQuery<B2BGROData, Error>({
    queryKey: ['b2b', companyId, 'gro', filters],
    queryFn: () => fetchGRO(companyId!, filters),
    enabled: !!companyId,
  })
}
