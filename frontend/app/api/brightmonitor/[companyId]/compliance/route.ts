// frontend/app/api/brightmonitor/[companyId]/compliance/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'

export const runtime = 'nodejs'

type ComplianceStatus = 'conforme' | 'parcial' | 'pendente'

interface ComplianceItem {
  id: number
  ref: string
  description: string
  status: ComplianceStatus
  detail: string
}

// eslint-disable-next-line complexity
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
    return NextResponse.json(
      { error: cycleRes.error },
      { status: cycleRes.status }
    )
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [companyRes, evalRes, actionPlanRes, harassmentRes, accidentEventsRes] =
    await Promise.all([
      sb
        .from('companies')
        .select(
          'gro_issued_at, gro_valid_until, emergency_sop_urls'
        )
        .eq('id', companyId)
        .single(),
      sb
        .from('mental_health_evaluations')
        .select(
          'id, score_psychosocial, score_physical, score_ergonomic, score_violence, score_overall'
        )
        .eq('company_id', companyId)
        .eq('cycle_id', cycleRes.cycleId)
        .eq('assessment_kind', 'nr1'),
      sb
        .from('b2b_action_plans')
        .select('id, deadline, responsible, status')
        .eq('company_id', companyId),
      sb
        .from('harassment_reports')
        .select('id')
        .eq('company_id', companyId)
        .limit(1),
      sb
        .from('b2b_events')
        .select('id, event_type')
        .eq('company_id', companyId)
        .in('event_type', ['acidente', 'incidente', 'near_miss', 'work_disease'])
        .limit(1),
    ])

  const company = companyRes.data
  const evaluations = evalRes.data ?? []
  const actionPlans = actionPlanRes.data ?? []
  const harassmentReports = harassmentRes.data ?? []
  const accidentEvents = accidentEventsRes.data ?? []

  const hasEvals = evaluations.length > 0
  const hasPsychosocial = evaluations.some(
    (e) => typeof (e as Record<string, unknown>).score_psychosocial === 'number'
  )
  const hasDomainScores = evaluations.some(
    (e) => typeof (e as Record<string, unknown>).score_overall === 'number'
  )

  const totalActionPlans = actionPlans.length
  const plansWithDeadlineAndResponsible = actionPlans.filter(
    (ap) => ap.deadline && ap.responsible
  ).length

  const emergencySops = company?.emergency_sop_urls as string[] | null
  const hasEmergencySops =
    Array.isArray(emergencySops) && emergencySops.length > 0

  const items: ComplianceItem[] = [
    {
      id: 1,
      ref: '1.5.7.1.a',
      description: 'PGR contém inventário de riscos',
      status: hasEvals ? 'conforme' : 'pendente',
      detail: hasEvals
        ? `${evaluations.length} avaliação(ões) NR-1 no ciclo`
        : 'Nenhuma avaliação NR-1 realizada neste ciclo',
    },
    {
      id: 2,
      ref: '1.5.7.1.b',
      description: 'PGR contém plano de ação',
      status: totalActionPlans > 0 ? 'conforme' : 'pendente',
      detail:
        totalActionPlans > 0
          ? `${totalActionPlans} plano(s) de ação cadastrado(s)`
          : 'Nenhum plano de ação cadastrado',
    },
    {
      id: 3,
      ref: '1.5.3.1.4',
      description: 'Inventário inclui fatores psicossociais',
      status: hasPsychosocial ? 'conforme' : 'pendente',
      detail: hasPsychosocial
        ? 'Scores psicossociais computados nas avaliações NR-1'
        : 'Nenhum score psicossocial encontrado',
    },
    {
      id: 4,
      ref: '1.5.4.4.2',
      description: 'Classificação de riscos com níveis',
      status: hasDomainScores ? 'conforme' : 'pendente',
      detail: hasDomainScores
        ? 'Scores por domínio computados (físico, ergonômico, psicossocial, violência)'
        : 'Nenhum score de domínio computado',
    },
    {
      id: 5,
      ref: '1.5.5.2.2',
      description: 'Plano de ação com prazo e responsável',
      status:
        totalActionPlans === 0
          ? 'pendente'
          : plansWithDeadlineAndResponsible === totalActionPlans
            ? 'conforme'
            : 'parcial',
      detail:
        totalActionPlans === 0
          ? 'Nenhum plano de ação cadastrado'
          : `${plansWithDeadlineAndResponsible}/${totalActionPlans} com prazo e responsável`,
    },
    {
      id: 6,
      ref: '1.5.7.2',
      description: 'Documentos datados e assinados',
      status: company?.gro_issued_at ? 'conforme' : 'pendente',
      detail: company?.gro_issued_at
        ? `GRO emitido em ${company.gro_issued_at}`
        : 'Data de emissão do GRO não definida',
    },
    {
      id: 7,
      ref: '1.5.3.3.a',
      description: 'Mecanismo de participação do trabalhador',
      status: harassmentReports.length > 0 ? 'conforme' : 'pendente',
      detail:
        harassmentReports.length > 0
          ? 'Canal de relatos ativo com registros'
          : 'Nenhum relato registrado no canal',
    },
    {
      id: 8,
      ref: '1.5.3.3.b',
      description: 'Percepção do trabalhador consultada',
      status: hasEvals ? 'conforme' : 'pendente',
      detail: hasEvals
        ? `${evaluations.length} avaliação(ões) NR-1 aplicadas aos trabalhadores`
        : 'Nenhuma avaliação NR-1 aplicada',
    },
    {
      id: 9,
      ref: '1.5.5.5',
      description: 'Análise de acidentes documentada',
      status: accidentEvents.length > 0 ? 'conforme' : 'pendente',
      detail:
        accidentEvents.length > 0
          ? 'Eventos de acidente/incidente registrados e analisados'
          : 'Nenhum evento de acidente registrado',
    },
    {
      id: 10,
      ref: '1.5.6.1',
      description: 'Procedimentos de emergência',
      status: hasEmergencySops ? 'conforme' : 'pendente',
      detail: hasEmergencySops
        ? `${emergencySops!.length} procedimento(s) de emergência cadastrado(s)`
        : 'Nenhum procedimento de emergência cadastrado',
    },
    {
      id: 11,
      ref: '1.5.7.3.3.1',
      description: 'Retenção de dados por 20 anos',
      status: 'pendente',
      detail: 'Escopo de infraestrutura — política de retenção em avaliação',
    },
  ]

  const conformeCount = items.filter((i) => i.status === 'conforme').length

  return NextResponse.json({
    items,
    conformeCount,
    totalItems: items.length,
    groIssuedAt: company?.gro_issued_at ?? null,
    groValidUntil: company?.gro_valid_until ?? null,
  })
}
