import type { MetadataRoute } from 'next'

import { getHelpersRouter } from '~/hooks/get-helpers-router'

export const revalidate = 3600

export async function generateSitemaps() {
  const router = await getHelpersRouter()
  return router.localization.locales.map((locale) => ({ id: locale }))
}

export default async function sitemap({
  id: locale,
}: {
  id: string
}): Promise<MetadataRoute.Sitemap> {
  const router = await getHelpersRouter()
  return await router.map.generateSitemap({ locale })
}
