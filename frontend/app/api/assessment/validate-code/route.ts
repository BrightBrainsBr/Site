import { createClient } from '@supabase/supabase-js'
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
      .from('avaliacao_codigo')
      .select('id')
      .eq('codigo_verificacao', code.trim())
      .eq('ativo', true)
      .limit(1)

    if (error) {
      console.error('[validate-code] Supabase error:', error)
      return NextResponse.json({ valid: false }, { status: 500 })
    }

    return NextResponse.json({ valid: (data?.length ?? 0) > 0 })
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
