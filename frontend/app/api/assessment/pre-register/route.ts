// frontend/app/api/assessment/pre-register/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      code_id?: string
      email?: string
    }

    const { code_id, email } = body

    if (!code_id || typeof code_id !== 'string') {
      return NextResponse.json(
        { error: 'code_id obrigatório' },
        { status: 400 }
      )
    }

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: codeRow, error: fetchErr } = await sb
      .from('company_access_codes')
      .select('id, company_id, department, cycle_id')
      .eq('id', code_id)
      .eq('active', true)
      .maybeSingle()

    if (fetchErr || !codeRow) {
      return NextResponse.json(
        { error: 'Código inválido ou inativo' },
        { status: 404 }
      )
    }

    const { error: updateErr } = await sb
      .from('company_access_codes')
      .update({
        employee_email: email?.trim() || null,
        started_at: new Date().toISOString(),
      })
      .eq('id', code_id)

    if (updateErr) {
      console.error('[pre-register] Update error:', updateErr)
      return NextResponse.json(
        { error: 'Erro ao registrar código' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      code_id,
      company_id: codeRow.company_id,
      department: codeRow.department ?? undefined,
      cycle_id: codeRow.cycle_id,
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
