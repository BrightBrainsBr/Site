import HelpersContexts from '@futurebrand/contexts'
import { getGlobalData } from '@futurebrand/hooks'
import { setRequestLocale } from 'next-intl/server'
import React from 'react'

import { getHelpersRouter } from '~/hooks/get-helpers-router'
import ContentModalWrapper from '~/layouts/structure/content-wrappers'
import Footer from '~/layouts/structure/footer'
import Header from '~/layouts/structure/header'

interface IRootLayoutProps {
  children: React.ReactNode
  modal: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: IRootLayoutProps) {
  let { locale } = await params
  const router = await getHelpersRouter()
  if (!router.localization.locales.includes(locale)) {
    locale = router.localization.defaultLocale
  }
  return await router.seo.getGlobalMetadata(locale)
}

export async function generateViewport({ params }: IRootLayoutProps) {
  let { locale } = await params
  const router = await getHelpersRouter()
  if (!router.localization.locales.includes(locale)) {
    locale = router.localization.defaultLocale
  }

  return await router.seo.getViewport(locale)
}

const RootLayout: React.FC<IRootLayoutProps> = async ({
  children,
  modal,
  params,
}) => {
  let { locale } = await params

  const router = await getHelpersRouter()
  if (!router.localization.locales.includes(locale)) {
    locale = router.localization.defaultLocale
  }

  setRequestLocale(locale)
  const { options, structure } = await getGlobalData(locale)

  const { dictionary } = options

  return (
    <HelpersContexts
      {...router.localization}
      dictionary={dictionary}
      locale={locale}
    >
      <Header {...structure.header} locale={locale} />
      {children}
      <Footer {...structure.footer} locale={locale} />
      <div id="modals">
        <ContentModalWrapper.Context>{modal}</ContentModalWrapper.Context>
      </div>
    </HelpersContexts>
  )
}

export default RootLayout
