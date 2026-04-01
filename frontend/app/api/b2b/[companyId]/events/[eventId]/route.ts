// frontend/app/api/b2b/[companyId]/events/[eventId]/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser } from '../../../lib/getB2BUser'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; eventId: string }> }
) {
  const { companyId, eventId } = await params

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
    .from('b2b_events')
    .select('id')
    .eq('id', eventId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  }

  const allowed = [
    'event_date',
    'event_type',
    'cid_code',
    'description',
    'department',
    'days_lost',
    'source',
    'notes',
  ]
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await sb
    .from('b2b_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    console.error('[b2b/events/patch]', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar evento' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; eventId: string }> }
) {
  const { companyId, eventId } = await params

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: existing } = await sb
    .from('b2b_events')
    .select('id')
    .eq('id', eventId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  }

  const { error } = await sb.from('b2b_events').delete().eq('id', eventId)

  if (error) {
    console.error('[b2b/events/delete]', error)
    return NextResponse.json(
      { error: 'Erro ao excluir evento' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
