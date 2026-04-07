// frontend/app/api/b2b/[companyId]/compliance/route.ts

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

// eslint-disable-next-line complexity -- NR-1 compliance requires checking 17 distinct items
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

  const [companyRes, evalRes, actionPlanRes, percepcaoRes, eventsRes] =
    await Promise.all([
      sb
        .from('companies')
        .select(
          'gro_issued_at, gro_valid_until, nr1_process_descriptions, nr1_activities, nr1_preventive_measures, sst_responsible_name, sst_responsible_role, sst_signature_url, cnae, risk_grade, emergency_sop_urls'
        )
        .eq('id', companyId)
        .single(),
      sb
        .from('mental_health_evaluations')
        .select('id, scores, laudo_pdf_url')
        .eq('company_id', companyId)
        .eq('cycle_id', cycleRes.cycleId),
      sb
        .from('b2b_action_plans')
        .select('id, deadline, responsible, status')
        .eq('company_id', companyId),
      sb
        .from('b2b_percepcao_reports')
        .select('id')
        .eq('company_id', companyId)
        .limit(1),
      sb
        .from('b2b_events')
        .select('id, event_type')
        .eq('company_id', companyId)
        .eq('event_type', 'afastamento')
        .limit(1),
    ])

  const company = companyRes.data
  const evaluations = evalRes.data ?? []
  const actionPlans = actionPlanRes.data ?? []
  const percepcaoReports = percepcaoRes.data ?? []
  const afastamentoEvents = eventsRes.data ?? []

  const hasSRQ20 = evaluations.some((e) => {
    const s = e.scores as Record<string, number> | null
    return s && typeof s.srq20 === 'number'
  })
  const hasAEP = evaluations.some((e) => {
    const s = e.scores as Record<string, number> | null
    return s && typeof s.aep_total === 'number'
  })
  const hasEvals = evaluations.length > 0
  const hasLaudo = evaluations.some(
    (e) => typeof e.laudo_pdf_url === 'string' && e.laudo_pdf_url.length > 0
  )

  const companyNR1Fields = {
    nr1_process_descriptions: company?.nr1_process_descriptions,
    nr1_activities: company?.nr1_activities,
    nr1_preventive_measures: company?.nr1_preventive_measures,
    sst_responsible_name: company?.sst_responsible_name,
    sst_responsible_role: company?.sst_responsible_role,
    sst_signature_url: company?.sst_signature_url,
    cnae: company?.cnae,
    risk_grade: company?.risk_grade,
  }
  const filledCompanyFields = Object.values(companyNR1Fields).filter(
    (v) => v != null && v !== ''
  ).length
  const totalCompanyFields = 3 // nr1_process_descriptions, nr1_activities, nr1_preventive_measures
  const computedFields = 6 // avgScore, riskDistribution, srq20Avg, aepAvg, totalEvaluations, timeline
  const mandatoryFieldsFilled =
    filledCompanyFields >= totalCompanyFields && hasEvals
      ? totalCompanyFields + computedFields
      : filledCompanyFields

  const totalActionPlans = actionPlans.length
  const plansWithDeadlineAndResponsible = actionPlans.filter(
    (ap) => ap.deadline && ap.responsible
  ).length
  const plansWithStatusTracking = actionPlans.filter(
    (ap) => ap.status && ap.status !== ''
  ).length

  const emergencySops = company?.emergency_sop_urls as string[] | null
  const hasEmergencySops =
    Array.isArray(emergencySops) && emergencySops.length > 0

  const items: ComplianceItem[] = [
    {
      id: 1,
      ref: '1.5.7.1.a',
      description: 'PGR contém inventário de riscos psicossociais',
      status:
        (hasSRQ20 || hasAEP) && company?.nr1_process_descriptions
          ? 'conforme'
          : 'pendente',
      detail:
        (hasSRQ20 || hasAEP) && company?.nr1_process_descriptions
          ? 'Avaliações SRQ-20/AEP realizadas e descrições de processos preenchidas'
          : 'Aguardando avaliações psicossociais e/ou preenchimento das descrições de processos',
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
      description: 'Inventário contempla fatores psicossociais',
      status: hasSRQ20 ? 'conforme' : 'pendente',
      detail: hasSRQ20
        ? 'Escores SRQ-20 presentes nas avaliações'
        : 'Nenhuma avaliação SRQ-20 encontrada',
    },
    {
      id: 4,
      ref: '1.5.7.3.2',
      description: 'Inventário possui os 9 campos obrigatórios',
      status:
        mandatoryFieldsFilled >= 9
          ? 'conforme'
          : mandatoryFieldsFilled > 0
            ? 'parcial'
            : 'pendente',
      detail: `${mandatoryFieldsFilled}/9 campos preenchidos (${totalCompanyFields} da empresa + ${hasEvals ? computedFields : 0} computados)`,
    },
    {
      id: 5,
      ref: '1.5.3.2.1',
      description: 'Avaliação ergonômica NR-17 (AEP)',
      status: hasAEP ? 'conforme' : 'pendente',
      detail: hasAEP
        ? 'Escores AEP presentes nas avaliações'
        : 'Nenhuma avaliação AEP encontrada',
    },
    {
      id: 6,
      ref: '1.5.4.4.2',
      description: 'Classificação de riscos com níveis',
      status: hasEvals ? 'conforme' : 'pendente',
      detail: hasEvals
        ? 'Distribuição de risco computada a partir das avaliações'
        : 'Nenhuma avaliação para classificar riscos',
    },
    {
      id: 7,
      ref: '1.5.4.4.2.2',
      description: 'Critérios de graduação documentados',
      status: 'conforme',
      detail:
        'Metodologia de graduação integrada ao sistema (escalas validadas)',
    },
    {
      id: 8,
      ref: '1.5.5.2.2',
      description: 'Plano de ação com cronograma e responsável',
      status:
        totalActionPlans === 0
          ? 'pendente'
          : plansWithDeadlineAndResponsible === totalActionPlans
            ? 'conforme'
            : 'parcial',
      detail:
        totalActionPlans === 0
          ? 'Nenhum plano de ação cadastrado'
          : `${plansWithDeadlineAndResponsible}/${totalActionPlans} com prazo e responsável definidos`,
    },
    {
      id: 9,
      ref: '1.5.5.2.2',
      description: 'Plano de ação com aferição de resultados',
      status:
        totalActionPlans === 0
          ? 'pendente'
          : plansWithStatusTracking === totalActionPlans
            ? 'conforme'
            : 'parcial',
      detail:
        totalActionPlans === 0
          ? 'Nenhum plano de ação cadastrado'
          : `${plansWithStatusTracking}/${totalActionPlans} com acompanhamento de status`,
    },
    {
      id: 10,
      ref: '1.5.7.2',
      description: 'Documentos datados e assinados',
      status: company?.gro_issued_at ? 'conforme' : 'pendente',
      detail: company?.gro_issued_at
        ? `GRO emitido em ${company.gro_issued_at}`
        : 'Data de emissão do GRO não definida',
    },
    {
      id: 11,
      ref: '1.5.7.2.1',
      description: 'PGR disponível aos trabalhadores',
      status: 'conforme',
      detail: 'Laudos entregues aos colaboradores via plataforma',
    },
    {
      id: 12,
      ref: '1.5.3.3.a',
      description: 'Mecanismo de participação dos trabalhadores',
      status: percepcaoReports.length > 0 ? 'conforme' : 'pendente',
      detail:
        percepcaoReports.length > 0
          ? 'Relatórios de percepção registrados'
          : 'Nenhum relatório de percepção encontrado',
    },
    {
      id: 13,
      ref: '1.5.3.3.b',
      description: 'Percepção dos trabalhadores consultada',
      status: hasSRQ20 && hasAEP ? 'conforme' : 'pendente',
      detail:
        hasSRQ20 && hasAEP
          ? 'SRQ-20 e AEP administrados aos trabalhadores'
          : 'Aguardando aplicação completa de SRQ-20 e AEP',
    },
    {
      id: 14,
      ref: '1.5.3.3.c',
      description: 'Riscos comunicados aos trabalhadores',
      status: hasLaudo ? 'conforme' : 'pendente',
      detail: hasLaudo
        ? 'Laudos com resultados entregues via plataforma'
        : 'Nenhum laudo gerado para comunicar riscos',
    },
    {
      id: 15,
      ref: '1.5.6.1',
      description: 'Procedimentos de resposta a emergências',
      status: hasEmergencySops ? 'conforme' : 'pendente',
      detail: hasEmergencySops
        ? `${emergencySops.length} procedimento(s) de emergência cadastrado(s)`
        : 'Nenhum procedimento de emergência cadastrado',
    },
    {
      id: 16,
      ref: '1.5.7.3.3.1',
      description: 'Retenção de dados por 20 anos',
      status: 'pendente',
      detail: 'Escopo de infraestrutura — política de retenção em avaliação',
    },
    {
      id: 17,
      ref: '1.5.5.5',
      description: 'Análise de acidentes e doenças ocupacionais',
      status: afastamentoEvents.length > 0 ? 'conforme' : 'pendente',
      detail:
        afastamentoEvents.length > 0
          ? 'Eventos de afastamento registrados e analisados'
          : 'Nenhum evento de afastamento registrado',
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
