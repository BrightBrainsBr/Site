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
  if (body.departments != null) updates.departments = body.departments

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

  // Best-effort cascade: clean up child rows that don't have ON DELETE CASCADE
  // configured at the DB level, so the company delete doesn't 500 with a raw
  // foreign-key constraint message.
  const childCleanups = [
    sb.from('mental_health_evaluations').delete().eq('company_id', id),
    sb.from('company_access_codes').delete().eq('company_id', id),
    sb.from('company_users').delete().eq('company_id', id),
    sb.from('assessment_cycles').delete().eq('company_id', id),
    sb.from('b2b_action_plans').delete().eq('company_id', id),
    sb.from('b2b_events').delete().eq('company_id', id),
    sb.from('harassment_reports').delete().eq('company_id', id),
  ]
  await Promise.allSettled(childCleanups)

  const { error } = await sb.from('companies').delete().eq('id', id)

  if (error) {
    console.error('[portal/companies DELETE]', error)
    const raw = error.message ?? ''
    const isFk = /foreign key|violates foreign key constraint/i.test(raw)
    if (isFk) {
      // Surface a specific table when possible (best effort).
      const tableMatch = raw.match(/on table "?([\w_]+)"?/i)
      const linkedTable = tableMatch?.[1]
      return NextResponse.json(
        {
          message: linkedTable
            ? `Não foi possível excluir a empresa pois existem registros vinculados em "${linkedTable}". Remova-os antes de tentar novamente.`
            : 'Não foi possível excluir a empresa pois existem dados vinculados. Tente novamente em alguns instantes ou entre em contato com o suporte.',
        },
        { status: 409 }
      )
    }
    return NextResponse.json(
      {
        message:
          'Não foi possível excluir a empresa. Tente novamente ou entre em contato com o suporte.',
      },
      { status: 500 }
    )
  }

  return new NextResponse(null, { status: 204 })
}
