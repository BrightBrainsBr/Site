import type { MetadataRoute } from 'next'

import { getHelpersRouter } from '~/hooks/get-helpers-router'

export const revalidate = 3600

export async function generateSitemaps() {
  try {
    const router = await getHelpersRouter()
    return router.localization.locales.map((locale) => ({ id: locale }))
  } catch {
    // Allow local/prototype builds when CMS auth is unavailable.
    return [{ id: 'pt' }, { id: 'en' }]
  }
}

export default async function sitemap({
  id: locale,
}: {
  id: string
}): Promise<MetadataRoute.Sitemap> {
  try {
    const router = await getHelpersRouter()
    return await router.map.generateSitemap({ locale })
  } catch {
    return []
  }
}
