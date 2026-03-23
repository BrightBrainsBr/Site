// frontend/app/api/portal/companies/[id]/invite-hr/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { validatePortalSession } from '../../../lib/validatePortalSession'

export const runtime = 'nodejs'

function getSiteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const valid = await validatePortalSession()
  if (!valid) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id: companyId } = await params
  const body = (await request.json()) as { email?: string }

  const email = body.email?.trim()
  if (!email) {
    return NextResponse.json({ message: 'email is required' }, { status: 400 })
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: company } = await sb
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .single()

  if (!company) {
    return NextResponse.json({ message: 'Company not found' }, { status: 404 })
  }

  const redirectTo = `${getSiteUrl()}/pt-BR/empresa/auth-callback`

  const { data: inviteData, error: inviteErr } =
    await sb.auth.admin.inviteUserByEmail(email, { redirectTo })

  if (inviteErr) {
    console.error('[portal/invite-hr]', inviteErr)
    return NextResponse.json({ message: inviteErr.message }, { status: 400 })
  }

  const userId = inviteData.user?.id
  if (userId) {
    await sb.from('company_users').insert({
      user_id: userId,
      company_id: companyId,
      role: 'viewer',
    })
  }

  return NextResponse.json({ success: true })
}
