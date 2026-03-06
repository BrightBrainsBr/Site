import { getDynamicI18nConfigs } from '@futurebrand/middlewares/i18n'
import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

const PUBLIC_FILE = /\.(.*)$/

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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

  // Try to get dynamic i18n configs, fallback to static config if CMS is unavailable
  let i18n
  try {
    i18n = await getDynamicI18nConfigs()
  } catch (error) {
    console.warn('CMS unavailable, using fallback locale configuration:', error)
    i18n = {
      locales: ['pt', 'en'],
      defaultLocale: 'pt',
    }
  }

  const handleI18nRouting = createIntlMiddleware({
    locales: i18n.locales,
    defaultLocale: i18n.defaultLocale,
    localeDetection: false,
    alternateLinks: true,
  })
  const response = handleI18nRouting(request)

  return response
}
