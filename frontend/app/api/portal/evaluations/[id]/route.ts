// frontend/app/api/portal/evaluations/[id]/route.ts

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'
import type { EvaluationDetail } from '~/features/portal/portal.interface'

export const runtime = 'nodejs'

async function requirePortalSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('portal_session')
  if (!session?.value) {
    return null
  }
  return session.value
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePortalSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await sb
      .from('mental_health_evaluations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Not found' }, { status: 404 })
      }
      console.error('[portal/evaluations/[id]] Supabase error:', error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json(data as EvaluationDetail)
  } catch (err) {
    console.error('[portal/evaluations/[id]] Error:', err)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePortalSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = (await request.json()) as {
      form_data?: Partial<AssessmentFormData>
      scores?: Record<string, number>
      changed_by?: string
    }

    if (!body.form_data || typeof body.form_data !== 'object') {
      return NextResponse.json(
        { message: 'form_data is required' },
        { status: 400 }
      )
    }

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: currentRow, error: fetchError } = await sb
      .from('mental_health_evaluations')
      .select('form_data, scores, form_data_history')
      .eq('id', id)
      .single()

    if (fetchError || !currentRow) {
      if (fetchError?.code === 'PGRST116') {
        return NextResponse.json({ message: 'Not found' }, { status: 404 })
      }
      console.error('[portal/evaluations/[id]] Fetch error:', fetchError)
      return NextResponse.json(
        { message: fetchError?.message ?? 'Not found' },
        { status: 500 }
      )
    }

    const currentFormData = (currentRow.form_data ?? {}) as AssessmentFormData
    const mergedFormData = {
      ...currentFormData,
      ...body.form_data,
    } as AssessmentFormData

    const currentHistory = (currentRow.form_data_history ?? []) as Array<{
      timestamp: string
      changed_by: string
      changed_fields: string[]
    }>
    const newEntry = {
      timestamp: new Date().toISOString(),
      changed_by: body.changed_by ?? 'unknown',
      changed_fields: Object.keys(body.form_data),
    }
    const updatedHistory = [...currentHistory, newEntry]

    const updatePayload: Record<string, unknown> = {
      form_data: mergedFormData,
      form_data_history: updatedHistory,
    }

    if (body.scores != null) {
      updatePayload.scores = body.scores
    }

    const { error: updateError } = await sb
      .from('mental_health_evaluations')
      .update(updatePayload)
      .eq('id', id)

    if (updateError) {
      console.error('[portal/evaluations/[id]] Update error:', updateError)
      return NextResponse.json(
        { message: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[portal/evaluations/[id]] Error:', err)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
