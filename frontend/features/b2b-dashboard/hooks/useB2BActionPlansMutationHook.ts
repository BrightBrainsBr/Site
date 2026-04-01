// frontend/features/b2b-dashboard/hooks/useB2BActionPlansMutationHook.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  B2BActionPlan,
  CreateActionPlanInput,
  UpdateActionPlanInput,
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

export function useB2BActionPlansMutationHook(companyId: string | null) {
  const queryClient = useQueryClient()
  const base = `/api/b2b/${companyId}/action-plans`

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ['b2b', companyId, 'action-plans'],
    })

  const createPlan = useMutation<B2BActionPlan, Error, CreateActionPlanInput>({
    mutationFn: (data) => postJSON(base, data),
    onSuccess: invalidate,
  })

  const updatePlan = useMutation<B2BActionPlan, Error, UpdateActionPlanInput>({
    mutationFn: ({ planId, ...data }) =>
      patchJSON(`${base}/${planId}`, data),
    onSuccess: invalidate,
  })

  const deletePlan = useMutation<{ success: boolean }, Error, string>({
    mutationFn: (planId) => deleteFetch(`${base}/${planId}`),
    onSuccess: invalidate,
  })

  const generatePlans = useMutation<
    B2BActionPlan[],
    Error,
    { department?: string }
  >({
    mutationFn: async (opts) => {
      const body = await postJSON<{ items?: B2BActionPlan[] } | B2BActionPlan[]>(
        base,
        { generate: true, ...opts }
      )
      return Array.isArray(body) ? body : (body.items ?? [])
    },
    onSuccess: invalidate,
  })

  return { createPlan, updatePlan, deletePlan, generatePlans }
}
