// frontend/app/api/assessment/validate-code/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { code } = (await request.json()) as { code?: string }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false })
    }

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const trimmed = code.trim()

    // 1. Check company_access_codes first (B2B)
    const { data: companyCode, error: companyErr } = await sb
      .from('company_access_codes')
      .select('id, company_id, department, cycle_id')
      .eq('code', trimmed)
      .eq('active', true)
      .limit(1)
      .maybeSingle()

    if (!companyErr && companyCode) {
      const { data: companyData } = await sb
        .from('companies')
        .select('departments')
        .eq('id', companyCode.company_id)
        .single()

      return NextResponse.json({
        valid: true,
        type: 'company',
        company_id: companyCode.company_id,
        department: companyCode.department ?? undefined,
        departments: companyData?.departments ?? [],
        cycle_id: companyCode.cycle_id,
        code_id: companyCode.id,
      })
    }

    // 2. Fall back to open codes (avaliacao_codigo)
    const { data, error } = await sb
      .from('avaliacao_codigo')
      .select('id')
      .eq('codigo_verificacao', trimmed)
      .eq('ativo', true)
      .limit(1)

    if (error) {
      console.error('[validate-code] Supabase error:', error)
      return NextResponse.json({ valid: false }, { status: 500 })
    }

    if ((data?.length ?? 0) > 0) {
      return NextResponse.json({ valid: true, type: 'open' })
    }

    return NextResponse.json({ valid: false })
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
