// frontend/app/api/b2b/[companyId]/percepcao/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'

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
    return NextResponse.json(
      { error: cycleRes.error },
      { status: cycleRes.status }
    )
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: reports, error } = await sb
    .from('b2b_percepcao_reports')
    .select('*')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[b2b/percepcao]', error)
    return NextResponse.json(
      { error: 'Erro ao buscar percepções' },
      { status: 500 }
    )
  }

  const all = reports ?? []
  const total = all.length

  const byType: Record<string, number> = {}
  let urgentes = 0
  const deptCounts: Record<string, number> = {}
  const correlations: Array<{ description: string; severity: string }> = []

  for (const r of all) {
    const t = r.report_type ?? 'outro'
    byType[t] = (byType[t] ?? 0) + 1

    if (r.urgencia === 'alta' || r.urgencia === 'critica') urgentes++

    const dept = r.department ?? 'Sem departamento'
    deptCounts[dept] = (deptCounts[dept] ?? 0) + 1

    if (r.urgencia === 'critica' || r.impacto === 'alto') {
      correlations.push({
        description: r.descricao ?? r.description ?? '',
        severity:
          r.urgencia === 'critica'
            ? 'critical'
            : r.impacto === 'alto'
              ? 'high'
              : 'medium',
      })
    }
  }

  let topSetor = ''
  let topCount = 0
  for (const [dept, count] of Object.entries(deptCounts)) {
    if (count > topCount) {
      topCount = count
      topSetor = dept
    }
  }

  return NextResponse.json({
    total,
    byType,
    urgentes,
    topSetor,
    reports: all,
    correlations,
    cycleId: cycleRes.cycleId,
  })
}
