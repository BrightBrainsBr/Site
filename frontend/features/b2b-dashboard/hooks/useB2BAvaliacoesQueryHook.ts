// frontend/features/b2b-dashboard/hooks/useB2BAvaliacoesQueryHook.ts
'use client'

import { useQuery } from '@tanstack/react-query'

import type { NR1RiskBand } from '../../../app/api/brightmonitor/lib/riskUtils'

export interface AvaliacaoIndividual {
  id: string
  createdAt: string
  employeeName: string | null
  employeeEmail: string | null
  department: string | null
  scorePhysical: number | null
  scoreErgonomic: number | null
  scorePsychosocial: number | null
  scoreViolence: number | null
  scoreOverall: number | null
  riskBand: NR1RiskBand | null
  psychosocial: {
    workload: number | null
    pace: number | null
    autonomy: number | null
    leadership: number | null
    relationships: number | null
    recognition: number | null
    clarity: number | null
    balance: number | null
  }
}

interface AvaliacoesResponse {
  evaluations: AvaliacaoIndividual[]
  total: number
}

async function fetchAvaliacoes(
  companyId: string,
  cycleId?: string | null
): Promise<AvaliacoesResponse> {
  const url = new URL(
    `/api/brightmonitor/${companyId}/avaliacoes`,
    window.location.origin
  )
  if (cycleId) url.searchParams.set('cycle', cycleId)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch avaliações')
  return res.json()
}

export function useB2BAvaliacoesQueryHook(
  companyId: string | null,
  cycleId?: string | null
) {
  return useQuery({
    queryKey: ['b2b', 'avaliacoes', companyId, cycleId],
    queryFn: () => fetchAvaliacoes(companyId!, cycleId),
    enabled: !!companyId,
    staleTime: 60_000,
  })
}
