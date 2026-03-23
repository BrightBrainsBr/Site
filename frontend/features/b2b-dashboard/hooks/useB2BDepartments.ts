// frontend/features/b2b-dashboard/hooks/useB2BDepartments.ts

'use client'

import { useQuery } from '@tanstack/react-query'

import type { B2BDepartmentData } from '../b2b-dashboard.interface'

async function fetchDepartments(
  companyId: string,
  cycleId?: string | null
): Promise<{ departments: B2BDepartmentData[]; cycleId: string }> {
  const url = new URL(
    `/api/b2b/${companyId}/departments`,
    window.location.origin
  )
  if (cycleId) url.searchParams.set('cycle', cycleId)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch departments')
  return res.json()
}

export function useB2BDepartments(
  companyId: string | null,
  cycleId?: string | null
) {
  return useQuery({
    queryKey: ['b2b', 'departments', companyId, cycleId],
    queryFn: () => fetchDepartments(companyId!, cycleId),
    enabled: !!companyId,
  })
}
