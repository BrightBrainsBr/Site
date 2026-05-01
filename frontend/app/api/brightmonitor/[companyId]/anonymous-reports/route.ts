// frontend/app/api/brightmonitor/[companyId]/anonymous-reports/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'

export const runtime = 'nodejs'

type ReportType = 'harassment' | 'general' | 'all'

function parseType(value: string | null): ReportType {
  if (value === 'harassment' || value === 'general') return value
  return 'all'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const { searchParams } = new URL(request.url)
  const cycleParam = searchParams.get('cycle')
  const type = parseType(searchParams.get('type'))

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

  let query = sb
    .from('harassment_reports')
    .select('id, report_type, department, description, created_at')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)
    .order('created_at', { ascending: false })

  if (type !== 'all') query = query.eq('report_type', type)

  const { data: rows, error } = await query

  if (error) {
    console.error('[brightmonitor/anonymous-reports]', error)
    return NextResponse.json(
      { error: 'Erro ao buscar denúncias' },
      { status: 500 }
    )
  }

  const reports = (rows ?? []).map((row) => ({
    id: row.id as string,
    reportType: (row.report_type as 'harassment' | 'general') ?? 'harassment',
    department: (row.department as string | null) ?? null,
    description: (row.description as string) ?? '',
    createdAt: row.created_at as string,
  }))

  const totals = {
    all: reports.length,
    harassment: reports.filter((r) => r.reportType === 'harassment').length,
    general: reports.filter((r) => r.reportType === 'general').length,
  }

  return NextResponse.json({ reports, totals })
}
