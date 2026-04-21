import type { MetadataRoute } from 'next'

import { getHelpersRouter } from '~/hooks/get-helpers-router'

export const revalidate = 600

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'https://www.brightbrains.com.br'
  let locales = ['pt-BR', 'en']

  try {
    const router = await getHelpersRouter()
    locales = router.localization.locales
  } catch {
    // Allow local/prototype builds when CMS auth is unavailable.
  }

  const sitemap = locales.map((locale) => `${baseUrl}/sitemap/${locale}.xml`)

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap,
  }
}
