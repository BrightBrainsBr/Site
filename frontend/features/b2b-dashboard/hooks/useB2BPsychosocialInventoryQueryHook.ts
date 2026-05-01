// frontend/features/b2b-dashboard/hooks/useB2BPsychosocialInventoryQueryHook.ts
'use client'

import { useQuery } from '@tanstack/react-query'

import type {
  CopsoqFamily,
  PsychosocialAxis,
} from '~/app/api/brightmonitor/lib/copsoqRisks'
import type { CopsoqClassification } from '~/app/api/brightmonitor/lib/riskUtils'

export interface PsychosocialRisk {
  id: string
  name: string
  description: string
  family: CopsoqFamily
  axis: PsychosocialAxis
  score: number | null
  probability: number | null
  severity: number | null
  classification: CopsoqClassification | null
  responses: number
}

export interface PsychosocialDepartmentBreakdown {
  department: string
  baixo: number
  medio: number
  alto: number
  total: number
}

export interface PsychosocialInventoryResponse {
  risks: PsychosocialRisk[]
  byClassification: {
    baixo: number
    medio: number
    alto: number
    sem_dados: number
  }
  byDepartment: PsychosocialDepartmentBreakdown[]
  totalEvaluations: number
  cycleId: string
}

async function fetchInventory(
  companyId: string,
  cycleId: string | null | undefined
): Promise<PsychosocialInventoryResponse> {
  const url = new URL(
    `/api/brightmonitor/${companyId}/inventory/psychosocial`,
    window.location.origin
  )
  if (cycleId) url.searchParams.set('cycle', cycleId)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch psychosocial inventory')
  return res.json()
}

export function useB2BPsychosocialInventoryQueryHook(
  companyId: string | null,
  cycleId: string | null | undefined
) {
  return useQuery({
    queryKey: ['b2b', 'inventory', 'psychosocial', companyId, cycleId],
    queryFn: () => fetchInventory(companyId!, cycleId),
    enabled: !!companyId,
    staleTime: 60_000,
  })
}
