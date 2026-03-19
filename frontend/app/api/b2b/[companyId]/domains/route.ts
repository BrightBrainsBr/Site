// frontend/app/api/b2b/[companyId]/domains/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import { DOMAIN_KEYS } from '../../lib/riskUtils'

const DOMAIN_LABELS: Record<string, string> = {
  phq9: 'Depressão (PHQ-9)',
  gad7: 'Ansiedade (GAD-7)',
  isi: 'Insônia (ISI)',
  asrs: 'TDAH (ASRS)',
  aq10: 'Autismo (AQ-10)',
  ocir: 'TOC (OCI-R)',
  mbi: 'Burnout (MBI)',
  pcl5: 'TEPT (PCL-5)',
  mdq: 'Bipolar (MDQ)',
  pss10: 'Estresse (PSS-10)',
  ad8: 'Cognição (AD-8)',
  nms: 'Neuro (NMS)',
  alsfrs: 'ALS (ALSFRS)',
  snapiv: 'TDAH Infantil (SNAP-IV)',
  spin: 'Fobia Social (SPIN)',
  auditc: 'Álcool (AUDIT-C)',
}

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

  const { data: rows, error } = await sb
    .from('mental_health_evaluations')
    .select('scores')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)

  if (error) {
    console.error('[b2b/domains]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }

  const sums: Record<string, number> = {}
  const counts: Record<string, number> = {}

  for (const key of DOMAIN_KEYS) {
    sums[key] = 0
    counts[key] = 0
  }

  for (const row of rows ?? []) {
    const scores = row.scores as Record<string, number> | null
    if (!scores) continue
    for (const key of DOMAIN_KEYS) {
      const v = scores[key]
      if (typeof v === 'number') {
        sums[key] += v
        counts[key]++
      }
    }
  }

  const domains = DOMAIN_KEYS.map((key) => ({
    name: DOMAIN_LABELS[key] ?? key,
    key,
    avg:
      counts[key] > 0 ? Math.round((sums[key] / counts[key]) * 10) / 10 : null,
    n: counts[key],
  }))

  return NextResponse.json({
    domains,
    cycleId: cycleRes.cycleId,
  })
}
