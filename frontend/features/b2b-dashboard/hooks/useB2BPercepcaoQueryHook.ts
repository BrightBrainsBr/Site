// frontend/features/b2b-dashboard/hooks/useB2BPercepcaoQueryHook.ts

'use client'

import { useQuery } from '@tanstack/react-query'

import type { B2BPercepcaoData } from '../b2b-dashboard.interface'

async function fetchPercepcao(
  companyId: string,
  cycle?: string
): Promise<B2BPercepcaoData> {
  const url = new URL(
    `/api/brightmonitor/${companyId}/percepcao`,
    window.location.origin
  )
  if (cycle) url.searchParams.set('cycle', cycle)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch percepcao data')
  return res.json()
}

export function useB2BPercepcaoQueryHook(
  companyId: string | null,
  cycle?: string
) {
  return useQuery<B2BPercepcaoData, Error>({
    queryKey: ['b2b', companyId, 'percepcao', cycle],
    queryFn: () => fetchPercepcao(companyId!, cycle),
    enabled: !!companyId,
  })
}
