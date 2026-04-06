// frontend/app/api/assessment/laudo-status/route.ts
// Lightweight endpoint polled by the employee after B2B submission to check
// whether their individual laudo PDF is ready for download.

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await sb
    .from('mental_health_evaluations')
    .select('status, laudo_pdf_url')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    status: data.status as string,
    laudo_pdf_url: (data.laudo_pdf_url as string | null) ?? null,
  })
}
