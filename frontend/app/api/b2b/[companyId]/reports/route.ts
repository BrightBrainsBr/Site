// frontend/app/api/b2b/[companyId]/reports/route.ts

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import { computeNormalizedScore, getRiskLevel } from '../../lib/riskUtils'

export const runtime = 'nodejs'

interface ReportFilters {
  department?: string
  riskLevel?: string
  dateFrom?: string
  dateTo?: string
}

export async function POST(
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

  const body = await request.json()
  // Accept both `type` (frontend format) and `reportType` (legacy)
  const rawType = (body.type ?? body.reportType) as string | undefined
  const department = body.department as string | undefined
  const filters: ReportFilters = {
    ...(body.filters ?? {}),
    department: department ?? (body.filters?.department as string | undefined),
  }

  // Map frontend type values to internal keys
  const typeMap: Record<string, string> = {
    'gro-consolidado': 'gro-consolidado',
    'por-departamento': 'departamento',
    'csv-export': 'csv',
    departamento: 'departamento',
    csv: 'csv',
  }
  const reportType = rawType ? (typeMap[rawType] ?? rawType) : undefined

  if (!reportType) {
    return NextResponse.json({ error: 'type é obrigatório' }, { status: 400 })
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = sb
    .from('mental_health_evaluations')
    .select('id, scores, employee_department, created_at')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)

  if (filters.department) {
    query = query.eq('employee_department', filters.department)
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  const { data: rows, error } = await query

  if (error) {
    console.error('[b2b/reports]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }

  const evaluations = (rows ?? []).map((r) => ({
    ...r,
    scores: r.scores as Record<string, number> | null,
  }))

  const filtered = filters.riskLevel
    ? evaluations.filter((e) => {
        const norm = computeNormalizedScore(e.scores)
        return norm != null && getRiskLevel(norm) === filters.riskLevel
      })
    : evaluations

  if (reportType === 'csv') {
    return buildCsvResponse(filtered, companyId)
  }

  if (reportType === 'departamento') {
    return buildDepartmentPdf(filtered, companyId, sb)
  }

  return buildGroConsolidadoPdf(filtered, companyId, sb)
}

function buildCsvResponse(
  evaluations: Array<{
    id: string
    scores: Record<string, number> | null
    employee_department: string | null
    created_at: string
  }>,
  companyId: string
) {
  const scaleKeys = ['phq9', 'gad7', 'srq20', 'pss10', 'mbi', 'isi']
  const header = ['id', 'department', 'created_at', 'risk_level', ...scaleKeys]
  const csvRows = [header.join(',')]

  for (const ev of evaluations) {
    const norm = computeNormalizedScore(ev.scores)
    const risk = norm != null ? getRiskLevel(norm) : ''
    const scaleVals = scaleKeys.map((k) =>
      ev.scores && typeof ev.scores[k] === 'number' ? String(ev.scores[k]) : ''
    )
    csvRows.push(
      [
        ev.id,
        ev.employee_department ?? '',
        ev.created_at,
        risk,
        ...scaleVals,
      ].join(',')
    )
  }

  const csvContent = '\uFEFF' + csvRows.join('\n') // BOM for Excel UTF-8
  const csvBuffer = new TextEncoder().encode(csvContent)
  const filename = `relatorio-csv-${companyId}-${Date.now()}.csv`

  return new NextResponse(csvBuffer, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Generated-At': new Date().toISOString(),
    },
  })
}

async function buildGroConsolidadoPdf(
  evaluations: Array<{
    id: string
    scores: Record<string, number> | null
    employee_department: string | null
    created_at: string
  }>,
  companyId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, any, any>
) {
  const { data: company } = await sb
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = margin

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO GRO CONSOLIDADO', pageWidth / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Empresa: ${company?.name ?? companyId}`, margin, y)
  y += 5
  doc.text(`Total de avaliações: ${evaluations.length}`, margin, y)
  y += 5
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, y)
  y += 10

  const riskDist = { critical: 0, elevated: 0, moderate: 0, low: 0 }
  for (const ev of evaluations) {
    const norm = computeNormalizedScore(ev.scores)
    if (norm != null) riskDist[getRiskLevel(norm)]++
  }

  doc.setFont('helvetica', 'bold')
  doc.text('Distribuição de Risco:', margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`Crítico: ${riskDist.critical}`, margin + 4, y)
  y += 5
  doc.text(`Elevado: ${riskDist.elevated}`, margin + 4, y)
  y += 5
  doc.text(`Moderado: ${riskDist.moderate}`, margin + 4, y)
  y += 5
  doc.text(`Baixo: ${riskDist.low}`, margin + 4, y)
  y += 10

  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text('Gerado automaticamente pelo BrightMonitor.', margin, y)

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const pdfBuffer = doc.output('arraybuffer') as ArrayBuffer
  const filename = `relatorio-gro-${companyId}-${Date.now()}.pdf`

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Generated-At': new Date().toISOString(),
    },
  })
}

async function buildDepartmentPdf(
  evaluations: Array<{
    id: string
    scores: Record<string, number> | null
    employee_department: string | null
    created_at: string
  }>,
  companyId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, any, any>
) {
  const { data: company } = await sb
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  const byDept = new Map<string, typeof evaluations>()
  for (const ev of evaluations) {
    const dept = ev.employee_department ?? 'Sem departamento'
    if (!byDept.has(dept)) byDept.set(dept, [])
    byDept.get(dept)!.push(ev)
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = margin

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO POR DEPARTAMENTO', pageWidth / 2, y, {
    align: 'center',
  })
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Empresa: ${company?.name ?? companyId}`, margin, y)
  y += 5
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, y)
  y += 10

  for (const [dept, deptEvals] of Array.from(byDept)) {
    if (y > 240) {
      doc.addPage()
      y = margin
    }

    doc.setFont('helvetica', 'bold')
    doc.text(`${dept} (${deptEvals.length} avaliações)`, margin, y)
    y += 6

    const riskDist = { critical: 0, elevated: 0, moderate: 0, low: 0 }
    for (const ev of deptEvals) {
      const norm = computeNormalizedScore(ev.scores)
      if (norm != null) riskDist[getRiskLevel(norm)]++
    }

    doc.setFont('helvetica', 'normal')
    doc.text(
      `Crítico: ${riskDist.critical} | Elevado: ${riskDist.elevated} | Moderado: ${riskDist.moderate} | Baixo: ${riskDist.low}`,
      margin + 4,
      y
    )
    y += 8
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const pdfBuffer = doc.output('arraybuffer') as ArrayBuffer
  const filename = `relatorio-dept-${companyId}-${Date.now()}.pdf`

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Generated-At': new Date().toISOString(),
    },
  })
}
