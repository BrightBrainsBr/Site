// frontend/auth/callback/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { createClient, createServiceClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const intendedRedirect = requestUrl.searchParams.get('redirectedFrom')

  if (!code) {
    console.error('[Auth Callback] No code found in request URL.')
    const redirectUrl = new URL('/pt-BR/login', request.url)
    redirectUrl.searchParams.set('error', 'missing_auth_code')
    return NextResponse.redirect(redirectUrl)
  }

  // Handle password recovery flow
  if (type === 'recovery') {
    console.warn('[Auth Callback] Password recovery flow detected.')
    const supabase = await createClient()

    try {
      const { error: sessionError } =
        await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        console.error(
          '[Auth Callback] PKCE exchange failed for recovery:',
          sessionError.message,
          '— this usually means the email was opened in a different browser.'
        )
        const redirectUrl = new URL('/pt-BR/monitor/reset-password', request.url)
        redirectUrl.searchParams.set('error', 'link_expired')
        return NextResponse.redirect(redirectUrl)
      }

      console.warn(
        '[Auth Callback] Recovery session established, redirecting to update password page.'
      )
      return NextResponse.redirect(
        new URL('/auth/update-password', request.url)
      )
    } catch (error) {
      console.error('[Auth Callback] Recovery flow error:', error)
      const redirectUrl = new URL('/pt-BR/monitor/reset-password', request.url)
      redirectUrl.searchParams.set('error', 'link_expired')
      return NextResponse.redirect(redirectUrl)
    }
  }

  console.warn(
    '[Auth Callback] Received code, attempting to exchange for session.'
  )
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  try {
    const { error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error(
        '[Auth Callback] Error exchanging code for session:',
        sessionError.message
      )
      const redirectUrl = new URL('/pt-BR/login', request.url)
      redirectUrl.searchParams.set('error', 'session_exchange_failed')
      redirectUrl.searchParams.set('details', sessionError.message)
      return NextResponse.redirect(redirectUrl)
    }

    console.warn(
      '[Auth Callback] Session exchanged successfully. Fetching user.'
    )
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error(
        '[Auth Callback] Error getting user after session exchange:',
        userError?.message || 'No user object returned.'
      )
      const redirectUrl = new URL('/pt-BR/login', request.url)
      redirectUrl.searchParams.set('error', 'user_fetch_failed')
      return NextResponse.redirect(redirectUrl)
    }

    console.warn(
      `[Auth Callback] User ${user.id} (${user.email}) fetched. Checking company_users...`
    )

    if (user.user_metadata?.needs_password_setup) {
      console.warn(
        '[Auth Callback] Invited user needs password setup. Redirecting.'
      )
      return NextResponse.redirect(
        new URL('/auth/update-password?from=invite', request.url)
      )
    }

    const { data: companyUser } = await serviceClient
      .from('company_users')
      .select('id, company_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (companyUser) {
      console.warn(
        `[Auth Callback] User is a company admin. Redirecting to dashboard.`
      )
      const finalRedirectPath = intendedRedirect || '/pt-BR/monitor'
      return NextResponse.redirect(new URL(finalRedirectPath, request.url))
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
      console.warn(
        `[Auth Callback] User is a collaborator with active invite. Redirecting to assessment.`
      )
      return NextResponse.redirect(new URL('/pt-BR/monitor/form', request.url))
    }

    console.warn(
      '[Auth Callback] User not in company_users or invites. Redirecting to login.'
    )
    const redirectUrl = new URL('/pt-BR/login', request.url)
    redirectUrl.searchParams.set('error', 'not_company_user')
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('[Auth Callback] Unexpected error in try-catch block:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error during authentication callback'
    const redirectUrl = new URL('/pt-BR/login', request.url)
    redirectUrl.searchParams.set('error', 'callback_error')
    redirectUrl.searchParams.set('details', errorMessage)
    return NextResponse.redirect(redirectUrl)
  }
}
