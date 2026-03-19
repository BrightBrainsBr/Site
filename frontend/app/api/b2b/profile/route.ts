// frontend/app/api/b2b/profile/route.ts

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { createClient as createServerClient } from '~/utils/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      email: user.email ?? null,
      display_name:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        null,
    })
  } catch (err) {
    console.error('[b2b/profile] GET error:', err)
    return NextResponse.json(
      { error: 'Erro ao obter perfil' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { display_name, password } = body as {
      display_name?: string
      password?: string
    }

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const updates: Record<string, unknown> = {}
    if (display_name !== undefined) {
      updates.data = { full_name: display_name }
    }
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'A senha deve ter no mínimo 6 caracteres.' },
          { status: 400 }
        )
      }
      updates.password = password
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar.' },
        { status: 400 }
      )
    }

    const { error: updateError } = await sb.auth.admin.updateUserById(
      user.id,
      updates
    )

    if (updateError) {
      console.error('[b2b/profile] Update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[b2b/profile] PUT error:', err)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}
