// frontend/app/api/portal/validate-code/route.ts

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { code } = (await request.json()) as { code?: string }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false })
    }

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await sb
      .from('assessment_access_codes')
      .select('id')
      .eq('code', code.trim())
      .eq('active', true)
      .ilike('label', '%Portal%')
      .limit(1)

    if (error) {
      console.error('[portal/validate-code] Supabase error:', error)
      return NextResponse.json({ valid: false }, { status: 500 })
    }

    if ((data?.length ?? 0) === 0) {
      return NextResponse.json({ valid: false })
    }

    const cookieStore = await cookies()
    cookieStore.set('portal_session', crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400,
      path: '/',
    })

    return NextResponse.json({ valid: true })
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
