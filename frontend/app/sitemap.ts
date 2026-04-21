import type { MetadataRoute } from 'next'

import { getHelpersRouter } from '~/hooks/get-helpers-router'

export const revalidate = 3600

export async function generateSitemaps() {
  try {
    const router = await getHelpersRouter()
    return router.localization.locales.map((locale) => ({ id: locale }))
  } catch {
    // Allow local/prototype builds when CMS auth is unavailable.
    return [{ id: 'pt-BR' }, { id: 'en' }]
  }
}

export default async function sitemap({
  id: locale,
}: {
  id: string
}): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'https://www.brightbrains.com.br'

  try {
    const router = await getHelpersRouter()
    const generated = await router.map.generateSitemap({ locale })

    // Força URL absoluta correta ignorando o 127.0.0.1 padrão da lib proprietária
    return generated.map((item) => {
      let url = item.url
      try {
        const parsedUrl = new URL(url)
        url = `${baseUrl}/${locale}${parsedUrl.pathname}`.replace(
          /([^:]\/)\/+/g,
          '$1'
        )
      } catch {
        url = `${baseUrl}/${locale}${url.startsWith('/') ? url : `/${url}`}`
      }

      return {
        ...item,
        url,
      }
    })
  } catch {
    return []
  }
}
