import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
      department?: string
      checkDomain?: boolean
    }

    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const department = body.department?.trim() ?? null

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const domain = email.split('@')[1]
    if (!domain) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const { data: domainMatch } = await sb
      .from('companies')
      .select('id, departments')
      .contains('allowed_domains', [domain])
      .eq('active', true)
      .limit(1)
      .maybeSingle()

    let inviteMatch: { company_id: string; department: string | null; departments: string[] } | null = null
    if (!domainMatch) {
      const { data: invite } = await sb
        .from('company_access_codes')
        .select('id, company_id, department')
        .eq('employee_email', email)
        .is('used_at', null)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (invite) {
        const { data: company } = await sb
          .from('companies')
          .select('departments')
          .eq('id', invite.company_id)
          .single()

        inviteMatch = {
          company_id: invite.company_id,
          department: invite.department,
          departments: company?.departments ?? [],
        }
      }
    }

    if (body.checkDomain) {
      if (domainMatch) {
        return NextResponse.json({
          matched: true,
          companyId: domainMatch.id,
          departments: domainMatch.departments ?? [],
        })
      }
      if (inviteMatch) {
        return NextResponse.json({
          matched: true,
          matchType: 'invite',
          companyId: inviteMatch.company_id,
          departments: inviteMatch.departments,
          department: inviteMatch.department,
        })
      }
      return NextResponse.json({ matched: false })
    }

    if (!password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const companyId = domainMatch?.id ?? inviteMatch?.company_id
    if (!companyId) {
      return NextResponse.json(
        { error: 'Nenhuma empresa encontrada para este e-mail. Verifique se você recebeu um convite ou use o e-mail corporativo.' },
        { status: 422 }
      )
    }

    const isCollaboratorInvite = !!inviteMatch && !domainMatch
    const effectiveDepartment = department ?? inviteMatch?.department ?? null

    const { data: authUser, error: createErr } =
      await sb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          ...(effectiveDepartment ? { department: effectiveDepartment } : {}),
          ...(isCollaboratorInvite ? { company_id: companyId } : {}),
        },
      })

    if (createErr) {
      if (createErr.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado. Tente fazer login.' },
          { status: 409 }
        )
      }
      console.error('[b2b/signup] createUser error:', createErr)
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }

    if (!authUser.user) {
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
    }

    if (!isCollaboratorInvite) {
      const { error: linkErr } = await sb.from('company_users').insert({
        user_id: authUser.user.id,
        company_id: companyId,
        role: 'viewer',
      })

      if (linkErr) {
        console.error('[b2b/signup] company_users insert:', linkErr)
      }
    }

    if (inviteMatch) {
      await sb
        .from('company_access_codes')
        .update({ started_at: new Date().toISOString() })
        .eq('employee_email', email)
        .eq('company_id', companyId)
        .is('used_at', null)
        .eq('active', true)
    }

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso.',
      redirect: isCollaboratorInvite ? '/avaliacao' : '/empresa/dashboard',
    })
  } catch (err) {
    console.error('[b2b/signup] Error:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
