import type { MetadataRoute } from 'next'
import { getHelpersRouter } from '~/hooks/get-helpers-router'

export const revalidate = 600

export default async function robots(): Promise<MetadataRoute.Robots> {
  const router = await getHelpersRouter()
  const sitemap = router.localization.locales.map((locale) => {
    return process.env.siteUrl + `/sitemap/${locale}.xml`
  })

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap,
  }
}
