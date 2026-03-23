import { getDynamicI18nConfigs } from '@futurebrand/helpers-nextjs/middlewares'
import { getRequestConfig } from 'next-intl/server'

interface II18nConfig {
  locales: string[]
  defaultLocale: string
}

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment.
  let locale = await requestLocale

  // Try to get dynamic i18n configs, fallback to static config if CMS is unavailable
  let i18n: II18nConfig
  try {
    i18n = (await getDynamicI18nConfigs()) as II18nConfig
  } catch (error) {
    // Fallback to default locale configuration when CMS is unavailable
    console.warn('CMS unavailable, using fallback locale configuration:', error)
    i18n = {
      locales: ['pt-BR', 'en'],
      defaultLocale: 'pt-BR',
    }
  }

  // Ensure that a valid locale is used
  if (!locale || !i18n.locales.includes(locale as any)) {
    locale = i18n.defaultLocale
  }

  return {
    locale,
    messages: {},
  }
})
