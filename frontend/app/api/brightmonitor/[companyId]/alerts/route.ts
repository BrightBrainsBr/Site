// frontend/app/api/brightmonitor/[companyId]/alerts/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import {
  computeDomainMean,
  getCopsoqClassification,
} from '../../lib/riskUtils'

export const runtime = 'nodejs'

interface AlertItem {
  type:
    | 'action_overdue'
    | 'psychosocial_high'
    | 'nr1_docs_missing'
    | 'incident'
    | 'harassment'
  severity: 'critico' | 'alto' | 'moderado'
  department: string | null
  message: string
  value?: number
  refId?: string
  dueDate?: string
}

interface RequiredDocument {
  slug: string
  name: string
  legal_deadline_days?: number
}

function priorityToSeverity(
  priority: string | null
): 'critico' | 'alto' | 'moderado' {
  if (priority === 'critica') return 'critico'
  if (priority === 'alta') return 'alto'
  return 'moderado'
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

  const todayIso = new Date().toISOString().split('T')[0]

  const [
    evalRes,
    accidentRes,
    harassmentRes,
    actionsRes,
    companyRes,
    cycleRowRes,
  ] = await Promise.all([
    sb
      .from('mental_health_evaluations')
      .select('id, employee_department, score_psychosocial, had_accident')
      .eq('company_id', companyId)
      .eq('cycle_id', cycleRes.cycleId)
      .eq('assessment_kind', 'nr1'),
    sb
      .from('b2b_events')
      .select('id, department')
      .eq('company_id', companyId)
      .eq('cycle_id', cycleRes.cycleId)
      .in('event_type', ['acidente', 'incidente']),
    sb
      .from('harassment_reports')
      .select('id, department, report_type')
      .eq('company_id', companyId)
      .eq('cycle_id', cycleRes.cycleId)
      .eq('report_type', 'harassment'),
    sb
      .from('b2b_action_plans')
      .select('id, description, department, priority, status, deadline')
      .eq('company_id', companyId)
      .eq('cycle_id', cycleRes.cycleId)
      .lt('deadline', todayIso)
      .neq('status', 'concluido'),
    sb
      .from('companies')
      .select('nr1_required_documents')
      .eq('id', companyId)
      .maybeSingle(),
    sb
      .from('assessment_cycles')
      .select('starts_at')
      .eq('id', cycleRes.cycleId)
      .maybeSingle(),
  ])

  const evaluations = (evalRes.data ?? []) as Array<Record<string, unknown>>
  const alerts: AlertItem[] = []

  // ── Rule 1: action_overdue ──
  const overdueActions = (actionsRes.data ?? []) as Array<{
    id: string
    description: string | null
    department: string | null
    priority: string | null
    deadline: string | null
  }>

  for (const action of overdueActions) {
    const deadlineStr = action.deadline
      ? new Date(action.deadline).toLocaleDateString('pt-BR')
      : '—'
    alerts.push({
      type: 'action_overdue',
      severity: priorityToSeverity(action.priority),
      department: action.department ?? null,
      message: `Ação do plano vencida (${deadlineStr}): ${action.description ?? 'sem descrição'}`,
      refId: action.id,
      dueDate: action.deadline ?? undefined,
    })
  }

  // ── Rule 2: psychosocial_high ──
  const byDept = new Map<string, Array<Record<string, unknown>>>()
  for (const row of evaluations) {
    const dept = (row.employee_department as string) ?? 'Sem departamento'
    if (!byDept.has(dept)) byDept.set(dept, [])
    byDept.get(dept)!.push(row)
  }

  for (const [dept, deptRows] of Array.from(byDept.entries())) {
    const psychosocialMean = computeDomainMean(deptRows, 'score_psychosocial')
    const classification = getCopsoqClassification(psychosocialMean)
    if (classification === 'alto' && psychosocialMean != null) {
      alerts.push({
        type: 'psychosocial_high',
        severity: 'alto',
        department: dept,
        message: `Setor "${dept}" com risco psicossocial alto (${psychosocialMean.toFixed(1)}/5)`,
        value: psychosocialMean,
      })
    }
  }

  // ── Rule 3: nr1_docs_missing ──
  // Inert until the company has populated nr1_required_documents.
  // Compares against b2b_events of type 'documento_obrigatorio' OR a future
  // dedicated table. For now, the alert fires only if the document config
  // exists and we have not yet seen an event recording it.
  const requiredDocs = (companyRes.data?.nr1_required_documents ??
    []) as RequiredDocument[]
  if (Array.isArray(requiredDocs) && requiredDocs.length > 0) {
    const cycleStart = cycleRowRes.data?.starts_at as string | undefined

    const { data: docEvents } = await sb
      .from('b2b_events')
      .select('description')
      .eq('company_id', companyId)
      .eq('cycle_id', cycleRes.cycleId)
      .eq('event_type', 'documento_obrigatorio')

    const submittedSlugs = new Set(
      (docEvents ?? []).map((d) => (d.description ?? '').trim())
    )

    for (const doc of requiredDocs) {
      if (submittedSlugs.has(doc.slug) || submittedSlugs.has(doc.name)) continue

      let isOverdue = true
      if (cycleStart && doc.legal_deadline_days != null) {
        const deadline = new Date(cycleStart)
        deadline.setDate(deadline.getDate() + doc.legal_deadline_days)
        isOverdue = deadline.toISOString().split('T')[0] < todayIso
      }

      if (!isOverdue) continue

      alerts.push({
        type: 'nr1_docs_missing',
        severity: 'alto',
        department: null,
        message: `Documento obrigatório NR-1 não enviado: ${doc.name}`,
        refId: doc.slug,
      })
    }
  }

  // ── Rule 4: incident (kept) ──
  const hasAccidentInCycle = evaluations.some((r) => r.had_accident === true)
  const accidentEventCount = accidentRes.data?.length ?? 0

  if (hasAccidentInCycle || accidentEventCount > 0) {
    const total =
      evaluations.filter((r) => r.had_accident === true).length +
      accidentEventCount
    alerts.push({
      type: 'incident',
      severity: 'alto',
      department: null,
      message: `${total} incidente(s)/acidente(s) registrado(s) neste ciclo`,
      value: total,
    })
  }

  // ── Rule 5: harassment (kept; only counts harassment, not general anonymous complaints) ──
  const harassmentCount = harassmentRes.data?.length ?? 0
  if (harassmentCount > 0) {
    alerts.push({
      type: 'harassment',
      severity: 'critico',
      department: null,
      message: `${harassmentCount} relato(s) de assédio registrado(s) neste ciclo`,
      value: harassmentCount,
    })
  }

  return NextResponse.json({
    alerts,
    cycleId: cycleRes.cycleId,
  })
}
