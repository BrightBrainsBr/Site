// frontend/app/api/portal/companies/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { validatePortalSession } from '../lib/validatePortalSession'

export const runtime = 'nodejs'

export async function GET() {
  const valid = await validatePortalSession()
  if (!valid) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await sb
    .from('companies')
    .select(
      'id, name, cnpj, contact_email, active, gro_issued_at, gro_valid_until, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[portal/companies]', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ companies: data ?? [] })
}

export async function POST(request: NextRequest) {
  const valid = await validatePortalSession()
  if (!valid) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as {
    name?: string
    cnpj?: string
    contact_email?: string
  }

  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ message: 'name is required' }, { status: 400 })
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: company, error: insertErr } = await sb
    .from('companies')
    .insert({
      name: body.name.trim(),
      cnpj: body.cnpj?.trim() || null,
      contact_email: body.contact_email?.trim() || null,
      active: true,
    })
    .select()
    .single()

  if (insertErr) {
    console.error('[portal/companies POST]', insertErr)
    return NextResponse.json({ message: insertErr.message }, { status: 500 })
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const isFirstHalf = month < 6
  const label = isFirstHalf ? `Jan–Jun ${year}` : `Jul–Dez ${year}`
  const startsAt = isFirstHalf ? `${year}-01-01` : `${year}-07-01`
  const endsAt = isFirstHalf ? `${year}-06-30` : `${year}-12-31`

  const companyId = (company as { id: string })?.id
  const { error: cycleErr } = await sb.from('assessment_cycles').insert({
    company_id: companyId,
    label,
    starts_at: startsAt,
    ends_at: endsAt,
    is_current: true,
  })

  if (cycleErr) {
    console.error('[portal/companies] cycle insert:', cycleErr)
  }

  return NextResponse.json(company)
}
