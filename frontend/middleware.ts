import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)', '/'],
}

const handleI18nRouting = createIntlMiddleware({
  locales: ['pt', 'en'],
  defaultLocale: 'pt',
  localeDetection: false,
  alternateLinks: true,
})

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/BitKeeper') {
    return NextResponse.error()
  }

  return handleI18nRouting(request)
}
