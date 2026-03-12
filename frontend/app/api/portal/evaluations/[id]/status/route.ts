// frontend/app/api/portal/evaluations/[id]/status/route.ts

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const VALID_STATUSES = ['pending_review', 'approved', 'rejected'] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('portal_session')

    if (!session?.value) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = (await request.json()) as { reviewer_status?: string }

    if (
      !body.reviewer_status ||
      !VALID_STATUSES.includes(
        body.reviewer_status as (typeof VALID_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        { message: 'Invalid reviewer_status' },
        { status: 400 }
      )
    }

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const updatePayload: Record<string, unknown> = {
      reviewer_status: body.reviewer_status,
    }

    if (body.reviewer_status === 'approved') {
      updatePayload.approved_at = new Date().toISOString()
      updatePayload.reviewer_notes = null
    } else if (body.reviewer_status === 'rejected') {
      updatePayload.approved_at = null
      updatePayload.approved_by = null
    } else if (body.reviewer_status === 'pending_review') {
      updatePayload.approved_at = null
      updatePayload.approved_by = null
      updatePayload.reviewer_notes = null
    }

    const { error } = await sb
      .from('mental_health_evaluations')
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      console.error('[portal/status] Update error:', error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[portal/status] Error:', err)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
