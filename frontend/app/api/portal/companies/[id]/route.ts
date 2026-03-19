// frontend/app/api/portal/companies/[id]/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { validatePortalSession } from '../../lib/validatePortalSession'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const valid = await validatePortalSession()
  if (!valid) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: company, error } = await sb
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !company) {
    return NextResponse.json({ message: 'Company not found' }, { status: 404 })
  }

  const [evalRes, codesRes] = await Promise.all([
    sb
      .from('mental_health_evaluations')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', id),
    sb
      .from('company_access_codes')
      .select('id, used_at', { count: 'exact', head: true })
      .eq('company_id', id),
  ])

  const totalEvaluations = evalRes.count ?? 0
  const totalCodes = codesRes.count ?? 0
  const usedCodes =
    (codesRes.data as { used_at: string | null }[] | null)?.filter(
      (c) => c.used_at != null
    ).length ?? 0

  return NextResponse.json({
    ...company,
    stats: {
      totalEvaluations,
      totalCodes,
      usedCodes,
    },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const valid = await validatePortalSession()
  if (!valid) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = (await request.json()) as {
    name?: string
    cnpj?: string
    contact_email?: string
    active?: boolean
    gro_issued_at?: string | null
    gro_valid_until?: string | null
    allowed_domains?: string[]
    departments?: string[]
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const updates: Record<string, unknown> = {}
  if (body.name != null) updates.name = body.name
  if (body.cnpj != null) updates.cnpj = body.cnpj
  if (body.contact_email != null) updates.contact_email = body.contact_email
  if (body.active != null) updates.active = body.active
  if (body.gro_issued_at != null) updates.gro_issued_at = body.gro_issued_at
  if (body.gro_valid_until != null)
    updates.gro_valid_until = body.gro_valid_until
  if (body.allowed_domains != null)
    updates.allowed_domains = body.allowed_domains

  const { data, error } = await sb
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[portal/companies PATCH]', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const valid = await validatePortalSession()
  if (!valid) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await sb.from('companies').delete().eq('id', id)

  if (error) {
    console.error('[portal/companies DELETE]', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
