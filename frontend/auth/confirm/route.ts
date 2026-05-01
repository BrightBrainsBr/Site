// frontend/auth/confirm/route.ts

import { type NextRequest, NextResponse } from 'next/server'

import { createClient, createServiceClient } from '@/utils/supabase/server'

const REDIRECT_EMPRESA_DASHBOARD = '/pt-BR/monitor'
const REDIRECT_LOGIN = '/pt-BR/login'
const REDIRECT_ON_ERROR = '/pt-BR/login?error=confirmation_failed'
const REDIRECT_UPDATE_PASSWORD = '/auth/update-password'

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url))
}

async function resolveUserDestination(
  request: NextRequest
): Promise<NextResponse> {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error(
      '[Auth Confirm] Error getting user:',
      userError?.message
    )
    return redirectTo(request, REDIRECT_ON_ERROR)
  }

  console.warn(`[Auth Confirm] User: ${user.id}, Email: ${user.email}`)

  if (user.user_metadata?.needs_password_setup) {
    console.warn('[Auth Confirm] Invited user needs password setup.')
    return redirectTo(request, `${REDIRECT_UPDATE_PASSWORD}?from=invite`)
  }

  const { data: companyUser } = await serviceClient
    .from('company_users')
    .select('id, company_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (companyUser) {
    console.warn('[Auth Confirm] User is a company admin.')
    return redirectTo(request, REDIRECT_EMPRESA_DASHBOARD)
  }

  const inviteEmail = user.email?.toLowerCase().trim() ?? ''
  const { data: invite } = await serviceClient
    .from('company_access_codes')
    .select('id')
    .eq('employee_email', inviteEmail)
    .is('used_at', null)
    .eq('active', true)
    .limit(1)
    .maybeSingle()

  if (invite) {
    console.warn('[Auth Confirm] User is a collaborator with active invite.')
    return redirectTo(request, '/pt-BR/monitor/form')
  }

  console.warn('[Auth Confirm] User not in company_users or invites.')
  return redirectTo(request, `${REDIRECT_LOGIN}?error=not_company_user`)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  // Handle token_hash verification (bypasses PKCE, works across browsers)
  if (tokenHash && type) {
    console.warn(
      `[Auth Confirm] Received token_hash with type=${type}. Verifying OTP.`
    )
    const supabase = await createClient()

    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as 'recovery' | 'signup' | 'email' | 'invite',
      })

      if (error) {
        console.error(
          '[Auth Confirm] Error verifying OTP:',
          error.message
        )
        return redirectTo(request, `${REDIRECT_ON_ERROR}&details=${encodeURIComponent(error.message)}`)
      }

      console.warn(`[Auth Confirm] OTP verified successfully for type=${type}.`)

      if (type === 'recovery') {
        return redirectTo(request, REDIRECT_UPDATE_PASSWORD)
      }

      return resolveUserDestination(request)
    } catch (e: unknown) {
      const err = e as Error
      console.error('[Auth Confirm] OTP verification error:', err.message)
      return redirectTo(request, REDIRECT_ON_ERROR)
    }
  }

  // Handle PKCE code exchange (original flow)
  if (code) {
    console.warn(
      '[Auth Confirm] Received code. Attempting PKCE exchange.'
    )
    const supabase = await createClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error(
          '[Auth Confirm] Error exchanging code:',
          error.message
        )
        return redirectTo(request, REDIRECT_ON_ERROR)
      }

      console.warn('[Auth Confirm] Code exchanged successfully.')
      return resolveUserDestination(request)
    } catch (e: unknown) {
      const err = e as Error
      console.error('[Auth Confirm] Code exchange error:', err.message)
      return redirectTo(request, REDIRECT_ON_ERROR)
    }
  }

  console.warn('[Auth Confirm] No code or token_hash. Redirecting to login.')
  return redirectTo(request, '/pt-BR/login?error=invalid_link_code_missing')
}
