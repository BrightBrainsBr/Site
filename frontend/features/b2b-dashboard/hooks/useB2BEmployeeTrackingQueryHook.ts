// frontend/features/b2b-dashboard/hooks/useB2BEmployeeTrackingQueryHook.ts

'use client'

import { useQuery } from '@tanstack/react-query'

import type { B2BEmployeeTrackingData } from '../b2b-dashboard.interface'

async function fetchEmployeeTracking(
  companyId: string
): Promise<B2BEmployeeTrackingData> {
  const res = await fetch(`/api/brightmonitor/${companyId}/employee-tracking`)
  if (!res.ok) throw new Error('Failed to fetch employee tracking')
  return res.json()
}

export function useB2BEmployeeTrackingQueryHook(companyId: string | null) {
  return useQuery<B2BEmployeeTrackingData, Error>({
    queryKey: ['b2b', companyId, 'employee-tracking'],
    queryFn: () => fetchEmployeeTracking(companyId!),
    enabled: !!companyId,
  })
}
