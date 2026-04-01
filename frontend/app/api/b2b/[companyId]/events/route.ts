// frontend/app/api/b2b/[companyId]/events/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser } from '../../lib/getB2BUser'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const { searchParams } = new URL(request.url)
  const typeFilter = searchParams.get('type')
  const departmentFilter = searchParams.get('department')
  const dateFrom = searchParams.get('from')
  const dateTo = searchParams.get('to')

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = sb
    .from('b2b_events')
    .select('*')
    .eq('company_id', companyId)
    .order('event_date', { ascending: false })

  if (typeFilter) {
    query = query.eq('event_type', typeFilter)
  }
  if (departmentFilter) {
    query = query.eq('department', departmentFilter)
  }
  if (dateFrom) {
    query = query.gte('event_date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('event_date', dateTo)
  }

  const { data: events, error } = await query

  if (error) {
    console.error('[b2b/events]', error)
    return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 })
  }

  const allEvents = events ?? []

  const now = new Date()
  const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  let afastamentos90d = 0
  let diasPerdidos = 0
  let relatosCanal = 0

  for (const ev of allEvents) {
    const isRecent = ev.event_date >= d90
    if (ev.event_type === 'afastamento' && isRecent) afastamentos90d++
    if (typeof ev.days_lost === 'number') diasPerdidos += ev.days_lost
    if (ev.event_type === 'relato_canal') relatosCanal++
  }

  return NextResponse.json({
    events: allEvents,
    kpis: { afastamentos90d, diasPerdidos, relatosCanal },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const body = await request.json()

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const isBulk = Array.isArray(body.events)
  const items = isBulk ? body.events : [body]

  const rows = items.map(
    (item: {
      event_date: string
      event_type: string
      cid_code?: string
      description: string
      department?: string
      days_lost?: number
      source?: string
      notes?: string
    }) => ({
      company_id: companyId,
      event_date: item.event_date,
      event_type: item.event_type,
      cid_code: item.cid_code ?? null,
      description: item.description,
      department: item.department ?? null,
      days_lost: item.days_lost ?? 0,
      source: item.source ?? null,
      notes: item.notes ?? null,
      created_by: auth.ok ? auth.userId : null,
    })
  )

  const { data, error } = await sb.from('b2b_events').insert(rows).select()

  if (error) {
    console.error('[b2b/events] insert', error)
    return NextResponse.json(
      { error: 'Erro ao registrar evento(s)' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    isBulk ? { items: data } : data?.[0] ?? null,
    { status: 201 }
  )
}
