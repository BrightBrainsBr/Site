import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)', '/'],
}

const redirectToCanonicalPtBr = (
  request: NextRequest,
  restPath: string = '',
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

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/BitKeeper') {
    return NextResponse.error()
  }

  // Recover from old/broken locale prefixes by canonicalizing all PT variants.
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

  return handleI18nRouting(request)
}
