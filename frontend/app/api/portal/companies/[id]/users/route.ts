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

  const { id } = await params
  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: companyUsers, error } = await sb
    .from('company_users')
    .select('id, user_id, role, created_at')
    .eq('company_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[portal/companies/users]', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  const userIds = (companyUsers ?? []).map((cu) => String(cu.user_id))

  let emailMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: authUsers } = await sb.auth.admin.listUsers({
      perPage: 1000,
    })
    if (authUsers?.users) {
      emailMap = Object.fromEntries(
        authUsers.users
          .filter((u) => userIds.includes(u.id))
          .map((u) => [u.id, u.email ?? ''])
      )
    }
  }

  const users = (companyUsers ?? []).map((cu) => ({
    ...cu,
    email: emailMap[cu.user_id] ?? null,
  }))

  return NextResponse.json({ users })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const valid = await validatePortalSession()
  if (!valid) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ message: 'userId required' }, { status: 400 })
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await sb
    .from('company_users')
    .delete()
    .eq('company_id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('[portal/companies/users DELETE]', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
