// frontend/auth/confirm/route.ts

import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { createClient, createServiceClient } from '@/utils/supabase/server'

const REDIRECT_EMPRESA_DASHBOARD = '/pt-BR/empresa/dashboard'
const REDIRECT_LOGIN = '/pt-BR/login'
const REDIRECT_ON_ERROR = '/pt-BR/login?error=confirmation_failed'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    console.log(
      `[Auth Confirm PKCE] Received code. Attempting to exchange for session.`
    )
    const supabase = await createClient()
    const serviceClient = createServiceClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error(
          '[Auth Confirm PKCE] Error exchanging code for session:',
          error.message
        )
        return redirect(REDIRECT_ON_ERROR)
      }

      console.log(
        `[Auth Confirm PKCE] Code exchanged successfully. Checking user type...`
      )

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error(
          '[Auth Confirm PKCE] Error getting user:',
          userError?.message
        )
        return redirect(REDIRECT_ON_ERROR)
      }

      console.log(`[Auth Confirm PKCE] User: ${user.id}, Email: ${user.email}`)

      const { data: companyUser } = await serviceClient
        .from('company_users')
        .select('id, company_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (companyUser) {
        console.log(
          `[Auth Confirm PKCE] User is a company admin. Redirecting to dashboard.`
        )
        return redirect(REDIRECT_EMPRESA_DASHBOARD)
      }

      const { data: invite } = await serviceClient
        .from('company_access_codes')
        .select('id')
        .eq('employee_email', user.email!)
        .is('used_at', null)
        .eq('active', true)
        .limit(1)
        .maybeSingle()

      if (invite) {
        console.log(
          `[Auth Confirm PKCE] User is a collaborator with active invite. Redirecting to assessment.`
        )
        return redirect('/pt-BR/avaliacao')
      }

      console.log(
        `[Auth Confirm PKCE] User not in company_users or invites. Redirecting to login.`
      )
      return redirect(`${REDIRECT_LOGIN}?error=not_company_user`)
    } catch (e: unknown) {
      const err = e as Error
      console.error(
        '[Auth Confirm PKCE] Unexpected error during code exchange:',
        err.message
      )
      return redirect(REDIRECT_ON_ERROR)
    }
  }

  console.warn(
    '[Auth Confirm PKCE] Code missing from request. Redirecting to login.'
  )
  return redirect('/pt-BR/login?error=invalid_link_code_missing')
}
