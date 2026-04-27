// frontend/features/b2b-dashboard/hooks/useB2BActionPlansMutationHook.ts

// frontend/features/b2b-dashboard/hooks/useB2BActionPlansMutationHook.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  B2BActionPlan,
  CreateActionPlanInput,
  UpdateActionPlanInput,
} from '../b2b-dashboard.interface'

function extractErrorMessage(body: unknown): string {
  if (typeof body === 'object' && body !== null) {
    const b = body as Record<string, unknown>
    return (
      (typeof b.error === 'string' ? b.error : null) ??
      (typeof b.message === 'string' ? b.message : null) ??
      'Request failed'
    )
  }
  return 'Request failed'
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractErrorMessage(err))
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
    throw new Error(extractErrorMessage(err))
  }
  return res.json()
}

async function deleteFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractErrorMessage(err))
  }
  return res.json()
}

export function useB2BActionPlansMutationHook(
  companyId: string | null,
  cycleId?: string | null
) {
  const queryClient = useQueryClient()
  const basePath = `/api/brightmonitor/${companyId}/action-plans`
  const cycleQuery = cycleId ? `?cycle=${cycleId}` : ''
  const base = `${basePath}${cycleQuery}`

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
      patchJSON(`${basePath}/${planId}${cycleQuery}`, data),
    onSuccess: invalidate,
  })

  const deletePlan = useMutation<{ success: boolean }, Error, string>({
    mutationFn: (planId) => deleteFetch(`${basePath}/${planId}`),
    onSuccess: invalidate,
  })

  const acceptPlan = useMutation<B2BActionPlan, Error, string>({
    mutationFn: (planId) =>
      patchJSON(`${basePath}/${planId}${cycleQuery}`, {
        ai_review_pending: false,
      }),
    onSuccess: invalidate,
  })

  const rejectPlan = useMutation<{ success: boolean }, Error, string>({
    mutationFn: (planId) => deleteFetch(`${basePath}/${planId}`),
    onSuccess: invalidate,
  })

  const acceptAllAIPending = useMutation<void, Error, string[]>({
    mutationFn: async (planIds) => {
      await Promise.all(
        planIds.map((id) =>
          patchJSON(`${basePath}/${id}${cycleQuery}`, {
            ai_review_pending: false,
          })
        )
      )
    },
    onSuccess: invalidate,
  })

  const rejectAllAIPending = useMutation<void, Error, string[]>({
    mutationFn: async (planIds) => {
      await Promise.all(planIds.map((id) => deleteFetch(`${basePath}/${id}`)))
    },
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

  return {
    createPlan,
    updatePlan,
    deletePlan,
    acceptPlan,
    rejectPlan,
    acceptAllAIPending,
    rejectAllAIPending,
    generatePlans,
  }
}
