// frontend/features/b2b-dashboard/hooks/useB2BActionPlansQueryHook.ts

'use client'

import { useQuery } from '@tanstack/react-query'

import type { B2BActionPlan } from '../b2b-dashboard.interface'

interface ActionPlansFilters {
  status?: string
  department?: string
  cycle?: string
  ai_generated?: 'true' | 'false'
}

async function fetchActionPlans(
  companyId: string,
  filters?: ActionPlansFilters
): Promise<B2BActionPlan[]> {
  const url = new URL(
    `/api/brightmonitor/${companyId}/action-plans`,
    window.location.origin
  )
  if (filters?.status) url.searchParams.set('status', filters.status)
  if (filters?.department)
    url.searchParams.set('department', filters.department)
  if (filters?.cycle) url.searchParams.set('cycle', filters.cycle)
  if (filters?.ai_generated !== undefined)
    url.searchParams.set('ai_generated', filters.ai_generated)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch action plans')
  const body = await res.json()
  // API returns { items: B2BActionPlan[], statusCounts: {...} }
  return Array.isArray(body) ? body : (body.items ?? [])
}

export function useB2BActionPlansQueryHook(
  companyId: string | null,
  filters?: ActionPlansFilters
) {
  return useQuery<B2BActionPlan[], Error>({
    queryKey: ['b2b', companyId, 'action-plans', filters],
    queryFn: () => fetchActionPlans(companyId!, filters),
    enabled: !!companyId,
  })
}
