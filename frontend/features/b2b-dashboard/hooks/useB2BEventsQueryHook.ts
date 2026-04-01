// frontend/features/b2b-dashboard/hooks/useB2BEventsQueryHook.ts

'use client'

import { useQuery } from '@tanstack/react-query'

import type { B2BEventsData } from '../b2b-dashboard.interface'

interface EventsFilters {
  type?: string
  department?: string
  from?: string
  to?: string
}

async function fetchEvents(
  companyId: string,
  filters?: EventsFilters
): Promise<B2BEventsData> {
  const url = new URL(
    `/api/b2b/${companyId}/events`,
    window.location.origin
  )
  if (filters?.type) url.searchParams.set('type', filters.type)
  if (filters?.department)
    url.searchParams.set('department', filters.department)
  if (filters?.from) url.searchParams.set('from', filters.from)
  if (filters?.to) url.searchParams.set('to', filters.to)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

export function useB2BEventsQueryHook(
  companyId: string | null,
  filters?: EventsFilters
) {
  return useQuery<B2BEventsData, Error>({
    queryKey: ['b2b', companyId, 'events', filters],
    queryFn: () => fetchEvents(companyId!, filters),
    enabled: !!companyId,
  })
}
