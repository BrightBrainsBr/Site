import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function createSb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requirePortalSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('portal_session')
  return session?.value ?? null
}

/**
 * Cancels a stuck report job. Sets status to 'error' so the user can click
 * Regenerar to retry. Use when a job has been stuck for hours.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePortalSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const sb = createSb()

    const { data: row, error: fetchErr } = await sb
      .from('mental_health_evaluations')
      .select('status, processing_error')
      .eq('id', id)
      .single()

    if (fetchErr || !row) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const status = typeof row.status === 'string' ? row.status : ''
    if (!status.startsWith('processing')) {
      return NextResponse.json(
        {
          error:
            'Job não está em processamento. Use Regenerar para gerar um novo relatório.',
        },
        { status: 400 }
      )
    }

    const existingError = (row.processing_error as string) || null
    const errorMessage =
      existingError ||
      'Job cancelado ou interrompido (timeout). Clique em Regenerar para tentar novamente.'

    const { error: updateErr } = await sb
      .from('mental_health_evaluations')
      .update({
        status: 'error',
        processing_error: errorMessage,
      })
      .eq('id', id)

    if (updateErr) {
      console.error('[cancel-job] Update failed:', updateErr)
      return NextResponse.json({ message: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Job cancelado. Clique em Regenerar para tentar novamente.',
    })
  } catch (err) {
    console.error('[cancel-job] Error:', err)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
