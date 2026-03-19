import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
      code?: string
    }

    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const code = body.code?.trim()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const domain = email.split('@')[1]
    if (!domain) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    let companyId: string | null = null
    let role = 'viewer'

    const { data: domainMatch } = await sb
      .from('companies')
      .select('id')
      .contains('allowed_domains', [domain])
      .eq('active', true)
      .limit(1)
      .maybeSingle()

    if (domainMatch) {
      companyId = domainMatch.id
    }

    if (!companyId && code) {
      const { data: codeMatch } = await sb
        .from('company_access_codes')
        .select('id, company_id, department')
        .eq('code', code)
        .is('used_at', null)
        .limit(1)
        .maybeSingle()

      if (codeMatch) {
        companyId = codeMatch.company_id
      }
    }

    if (!companyId) {
      return NextResponse.json(
        {
          error: 'Nenhuma empresa encontrada para este email. Insira um código de acesso.',
          needsCode: true,
        },
        { status: 422 }
      )
    }

    const { data: authUser, error: createErr } =
      await sb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (createErr) {
      if (createErr.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado. Tente fazer login.' },
          { status: 409 }
        )
      }
      console.error('[b2b/signup] createUser error:', createErr)
      return NextResponse.json(
        { error: createErr.message },
        { status: 500 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      )
    }

    const { error: linkErr } = await sb.from('company_users').insert({
      user_id: authUser.user.id,
      company_id: companyId,
      role,
    })

    if (linkErr) {
      console.error('[b2b/signup] company_users insert:', linkErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso. Faça login.',
    })
  } catch (err) {
    console.error('[b2b/signup] Error:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
