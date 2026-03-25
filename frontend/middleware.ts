import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)', '/'],
}

const redirectToCanonicalPtBr = (
  request: NextRequest,
  restPath: string = ''
) => {
  const url = request.nextUrl.clone()
  url.pathname = `/pt-BR${restPath}`
  return NextResponse.redirect(url, 308)
}

const handleI18nRouting = createIntlMiddleware({
  locales: ['pt-BR', 'en'],
  defaultLocale: 'pt-BR',
  localeDetection: false,
  alternateLinks: true,
})

function refreshSupabaseSession(request: NextRequest) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey)
    return {
      supabase: null,
      cookiesToSet: [] as Array<{
        name: string
        value: string
        options: Record<string, unknown>
      }>,
    }

  const cookiesToSet: Array<{
    name: string
    value: string
    options: Record<string, unknown>
  }> = []

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value))
        cookiesToSet.push(...cookies)
      },
    },
  })

  return { supabase, cookiesToSet }
}

export default async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (pathname === '/BitKeeper') {
    return NextResponse.error()
  }

  const authCode = searchParams.get('code')
  const isAuthRoute =
    pathname.startsWith('/auth/') ||
    pathname.includes('/empresa/auth-callback')
  if (authCode && !isAuthRoute) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/auth/callback'
    callbackUrl.searchParams.set('code', authCode)
    return NextResponse.redirect(callbackUrl)
  }

  const { supabase, cookiesToSet } = refreshSupabaseSession(request)
  if (supabase) {
    await supabase.auth.getUser()
  }

  if (pathname.startsWith('/auth/')) {
    const response = NextResponse.next()
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  }

  const nestedPtPrefix = pathname.match(/^\/pt-BR\/pt(?:-br)?(\/.*)?$/i)
  if (nestedPtPrefix) {
    return redirectToCanonicalPtBr(request, nestedPtPrefix[1] ?? '')
  }

  const isCanonicalPtBr =
    pathname === '/pt-BR' || pathname.startsWith('/pt-BR/')

  const leadingPtAlias = !isCanonicalPtBr
    ? pathname.match(/^\/pt(?:-br)?(\/.*)?$/i)
    : null
  if (leadingPtAlias) {
    return redirectToCanonicalPtBr(request, leadingPtAlias[1] ?? '')
  }

  const response = handleI18nRouting(request)

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
