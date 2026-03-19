// frontend/app/api/b2b/me/route.ts

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { createClient as createServerClient } from '~/utils/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ isCompanyUser: false }, { status: 401 })
    }

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: cu, error: cuError } = await sb
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (cuError || !cu) {
      return NextResponse.json({ isCompanyUser: false }, { status: 200 })
    }

    const [companyRes, cyclesRes] = await Promise.all([
      sb.from('companies').select('id, name').eq('id', cu.company_id).single(),
      sb
        .from('assessment_cycles')
        .select('id, label, starts_at, ends_at, is_current')
        .eq('company_id', cu.company_id)
        .order('starts_at', { ascending: false }),
    ])

    const company = companyRes.data
    const cycles = cyclesRes.data ?? []
    const currentCycle = cycles.find((c) => c.is_current)

    return NextResponse.json({
      isCompanyUser: true,
      company_id: cu.company_id,
      company_name: company?.name ?? null,
      current_cycle: currentCycle
        ? {
            id: currentCycle.id,
            label: currentCycle.label,
            starts_at: currentCycle.starts_at,
            ends_at: currentCycle.ends_at,
          }
        : null,
      cycles: cycles.map((c) => ({
        id: c.id,
        label: c.label,
        starts_at: c.starts_at,
        ends_at: c.ends_at,
      })),
    })
  } catch (err) {
    console.error('[b2b/me] Error:', err)
    return NextResponse.json(
      { error: 'Erro ao obter dados da empresa' },
      { status: 500 }
    )
  }
}
