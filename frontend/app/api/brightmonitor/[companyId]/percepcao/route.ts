// frontend/app/api/brightmonitor/[companyId]/percepcao/route.ts

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

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: company } = await sb
    .from('companies')
    .select('bright_insights_enabled')
    .eq('id', companyId)
    .single()

  if (!company?.bright_insights_enabled) {
    return NextResponse.json({ enabled: false })
  }

  const cycleRes = await resolveCycle(companyId, cycleParam)
  if ('error' in cycleRes) {
    return NextResponse.json(
      { error: cycleRes.error },
      { status: cycleRes.status }
    )
  }

  const { data: evals, error } = await sb
    .from('mental_health_evaluations')
    .select('phq9_score, gad7_score, isi_score, mbi_score')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)
    .in('assessment_kind', ['insights', 'clinical'])

  if (error) {
    console.error('[brightmonitor/percepcao]', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados de Insights' },
      { status: 500 }
    )
  }

  const rows = evals ?? []
  const count = rows.length

  function avg(field: string): number | null {
    const vals = rows
      .map((r: Record<string, unknown>) => r[field])
      .filter((v): v is number => typeof v === 'number')
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }

  return NextResponse.json({
    enabled: true,
    scaleAverages: {
      phq9: avg('phq9_score'),
      gad7: avg('gad7_score'),
      isi: avg('isi_score'),
      mbi: avg('mbi_score'),
    },
    assessmentCount: count,
    cycleId: cycleRes.cycleId,
  })
}
