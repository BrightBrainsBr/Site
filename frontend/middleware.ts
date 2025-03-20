import { getDynamicI18nConfigs } from '@futurebrand/middlewares/i18n'
import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

const PUBLIC_FILE = /\.(.*)$/

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const i18n = await getDynamicI18nConfigs()

  if (pathname === '/BitKeeper') {
    return NextResponse.error()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/api/') ||
    PUBLIC_FILE.test(request.nextUrl.pathname)
  ) {
    return NextResponse.next()
  }

  const handleI18nRouting = createIntlMiddleware({
    ...i18n,
    localeDetection: false,
    alternateLinks: true,
  })
  const response = handleI18nRouting(request)

  return response
}
