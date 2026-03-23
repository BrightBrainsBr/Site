// frontend/app/api/b2b/[companyId]/compliance/route.ts

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

  const [companyRes, evalRes, cycleRes2] = await Promise.all([
    sb
      .from('companies')
      .select('gro_issued_at, gro_valid_until')
      .eq('id', companyId)
      .single(),
    sb
      .from('mental_health_evaluations')
      .select('id, reviewer_status')
      .eq('company_id', companyId)
      .eq('cycle_id', cycleRes.cycleId),
    sb
      .from('assessment_cycles')
      .select('id, label, starts_at, ends_at')
      .eq('id', cycleRes.cycleId)
      .single(),
  ])

  const company = companyRes.data
  const evaluations = evalRes.data ?? []
  const totalEvaluations = evaluations.length
  const approvedCount = evaluations.filter(
    (e) => e.reviewer_status === 'approved'
  ).length
  const coveragePct =
    totalEvaluations > 0
      ? Math.round((approvedCount / totalEvaluations) * 1000) / 10
      : 0

  return NextResponse.json({
    groIssuedAt: company?.gro_issued_at ?? null,
    groValidUntil: company?.gro_valid_until ?? null,
    totalEvaluations,
    approvedCount,
    coveragePct,
    cycle: cycleRes2.data
      ? {
          id: cycleRes2.data.id,
          label: cycleRes2.data.label,
          starts_at: cycleRes2.data.starts_at,
          ends_at: cycleRes2.data.ends_at,
        }
      : null,
  })
}
