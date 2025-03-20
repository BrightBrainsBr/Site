import { getDynamicI18nConfigs } from '@futurebrand/helpers-nextjs/middlewares'
import { getRequestConfig } from 'next-intl/server'

interface II18nConfig {
  locales: string[]
  defaultLocale: string
}

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment.
  let locale = await requestLocale
  const i18n = (await getDynamicI18nConfigs()) as II18nConfig

  // Ensure that a valid locale is used
  if (!locale || !i18n.locales.includes(locale as any)) {
    locale = i18n.defaultLocale
  }

  return {
    locale,
    messages: {},
  }
})
