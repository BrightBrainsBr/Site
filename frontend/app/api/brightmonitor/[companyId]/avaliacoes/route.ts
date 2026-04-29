// frontend/app/api/brightmonitor/[companyId]/avaliacoes/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import { getNR1RiskBand, type NR1RiskBand } from '../../lib/riskUtils'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const { searchParams } = new URL(request.url)
  const cycleParam = searchParams.get('cycle')

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const cycleRes = await resolveCycle(companyId, cycleParam)
  if ('error' in cycleRes) {
    return NextResponse.json({ error: cycleRes.error }, { status: cycleRes.status })
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: rows, error } = await sb
    .from('mental_health_evaluations')
    .select(
      [
        'id',
        'created_at',
        'patient_name',
        'patient_email',
        'employee_department',
        'nr1_role',
        'score_physical',
        'score_ergonomic',
        'score_psychosocial',
        'score_violence',
        'score_overall',
        'workload_level',
        'pace_level',
        'autonomy_level',
        'leadership_level',
        'relationships_level',
        'recognition_level',
        'clarity_level',
        'balance_level',
      ].join(', ')
    )
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)
    .eq('assessment_kind', 'nr1')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[brightmonitor/avaliacoes]', error)
    return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 })
  }

  const evaluations = (rows ?? []).map((row) => {
    const overall = typeof row.score_overall === 'number' ? row.score_overall : null
    const band: NR1RiskBand | null = overall != null ? getNR1RiskBand(overall) : null
    return {
      id: row.id,
      createdAt: row.created_at,
      employeeName: row.patient_name ?? null,
      employeeEmail: row.patient_email ?? null,
      department: row.employee_department ?? null,
      role: row.nr1_role ?? null,
      scorePhysical: row.score_physical ?? null,
      scoreErgonomic: row.score_ergonomic ?? null,
      scorePsychosocial: row.score_psychosocial ?? null,
      scoreViolence: row.score_violence ?? null,
      scoreOverall: overall,
      riskBand: band,
      psychosocial: {
        workload: row.workload_level ?? null,
        pace: row.pace_level ?? null,
        autonomy: row.autonomy_level ?? null,
        leadership: row.leadership_level ?? null,
        relationships: row.relationships_level ?? null,
        recognition: row.recognition_level ?? null,
        clarity: row.clarity_level ?? null,
        balance: row.balance_level ?? null,
      },
    }
  })

  return NextResponse.json({ evaluations, total: evaluations.length })
}
