// frontend/features/b2b-dashboard/hooks/useB2BEventsMutationHook.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  B2BEvent,
  CreateEventInput,
  UpdateEventInput,
} from '../b2b-dashboard.interface'

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as { message?: string }).message || 'Request failed'
    )
  }
  return res.json()
}

async function patchJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as { message?: string }).message || 'Request failed'
    )
  }
  return res.json()
}

async function deleteFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as { message?: string }).message || 'Request failed'
    )
  }
  return res.json()
}

export function useB2BEventsMutationHook(companyId: string | null) {
  const queryClient = useQueryClient()
  const base = `/api/brightmonitor/${companyId}/incidents`

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ['b2b', companyId, 'events'],
    })

  const createEvent = useMutation<B2BEvent, Error, CreateEventInput>({
    mutationFn: (data) => postJSON(base, data),
    onSuccess: invalidate,
  })

  const updateEvent = useMutation<B2BEvent, Error, UpdateEventInput>({
    mutationFn: ({ eventId, ...data }) =>
      patchJSON(`${base}/${eventId}`, data),
    onSuccess: invalidate,
  })

  const deleteEvent = useMutation<{ success: boolean }, Error, string>({
    mutationFn: (eventId) => deleteFetch(`${base}/${eventId}`),
    onSuccess: invalidate,
  })

  const bulkCreate = useMutation<B2BEvent[], Error, CreateEventInput[]>({
    mutationFn: (events) => postJSON(base, { events }),
    onSuccess: invalidate,
  })

  return { createEvent, updateEvent, deleteEvent, bulkCreate }
}
