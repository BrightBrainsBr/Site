// frontend/app/api/portal/companies/[id]/cycles/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { validatePortalSession } from '../../../lib/validatePortalSession'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const valid = await validatePortalSession()
  if (!valid) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id: companyId } = await params
  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await sb
    .from('assessment_cycles')
    .select('id, label, starts_at, ends_at, is_current')
    .eq('company_id', companyId)
    .order('starts_at', { ascending: false })

  if (error) {
    console.error('[portal/cycles GET]', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const valid = await validatePortalSession()
  if (!valid) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id: companyId } = await params
  const body = (await request.json()) as {
    label?: string
    starts_at?: string
    ends_at?: string
  }

  const label = body.label?.trim()
  const startsAt = body.starts_at?.trim()
  const endsAt = body.ends_at?.trim()

  if (!label || !startsAt || !endsAt) {
    return NextResponse.json(
      { message: 'label, starts_at, ends_at are required' },
      { status: 400 }
    )
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await sb
    .from('assessment_cycles')
    .update({ is_current: false })
    .eq('company_id', companyId)
    .eq('is_current', true)

  const { data, error } = await sb
    .from('assessment_cycles')
    .insert({
      company_id: companyId,
      label,
      starts_at: startsAt,
      ends_at: endsAt,
      is_current: true,
    })
    .select('id, label, starts_at, ends_at, is_current')
    .single()

  if (error) {
    console.error('[portal/cycles POST]', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
