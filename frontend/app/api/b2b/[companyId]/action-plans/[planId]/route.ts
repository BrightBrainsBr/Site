// frontend/app/api/b2b/[companyId]/action-plans/[planId]/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser } from '../../../lib/getB2BUser'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; planId: string }> }
) {
  const { companyId, planId } = await params

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const body = await request.json()

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: existing } = await sb
    .from('b2b_action_plans')
    .select('id')
    .eq('id', planId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
  }

  const allowed = [
    'description',
    'department',
    'priority',
    'status',
    'responsible',
    'deadline',
    'notes',
    'ai_review_pending',
  ]
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await sb
    .from('b2b_action_plans')
    .update(updates)
    .eq('id', planId)
    .select()
    .single()

  if (error) {
    console.error('[b2b/action-plans/patch]', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar plano' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; planId: string }> }
) {
  const { companyId, planId } = await params

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: existing } = await sb
    .from('b2b_action_plans')
    .select('id')
    .eq('id', planId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
  }

  const { error } = await sb.from('b2b_action_plans').delete().eq('id', planId)

  if (error) {
    console.error('[b2b/action-plans/delete]', error)
    return NextResponse.json(
      { error: 'Erro ao excluir plano' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
