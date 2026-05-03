import HelpersContexts from '@futurebrand/contexts'
import { getGlobalData } from '@futurebrand/hooks'
import { setRequestLocale } from 'next-intl/server'
import React from 'react'

import StateControllerProvider from '~/contexts/state-controller'
import { getHelpersRouter } from '~/hooks/get-helpers-router'
import ContentModalWrapper from '~/layouts/structure/content-wrappers'
import Footer from '~/layouts/structure/footer'
import Header from '~/layouts/structure/header'
import JsonLd from '~/components/seo/JsonLd'

interface IRootLayoutProps {
  children: React.ReactNode
  modal: React.ReactNode
  params: Promise<{ locale: string }>
}

function withSuppressedErrors<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  const orig = console.error
  console.error = (() => {}) as typeof console.error
  return fn()
    .catch(() => fallback)
    .finally(() => {
      console.error = orig
    })
}

export async function generateMetadata({ params }: IRootLayoutProps) {
  let { locale } = await params
  const router = await getHelpersRouter()
  if (!router.localization.locales.includes(locale)) {
    locale = router.localization.defaultLocale
  }
  return withSuppressedErrors(() => router.seo.getGlobalMetadata(locale), {})
}

export async function generateViewport({ params }: IRootLayoutProps) {
  let { locale } = await params
  const router = await getHelpersRouter()
  if (!router.localization.locales.includes(locale)) {
    locale = router.localization.defaultLocale
  }
  return withSuppressedErrors(() => router.seo.getViewport(locale), {})
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

  const dictionary = options?.dictionary ?? {}

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.brightbrains.com.br'

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Bright Brains',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'Bright Brains',
    publisher: { '@id': `${SITE_URL}/#organization` },
  }

  const medicalClinicSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    '@id': `${SITE_URL}/#medicalclinic`,
    name: 'Bright Brains',
    url: SITE_URL,
  }

  return (
    <HelpersContexts
      {...router.localization}
      dictionary={dictionary}
      locale={locale}
    >
      <StateControllerProvider>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <JsonLd data={medicalClinicSchema} />
        {structure?.header && <Header {...structure.header} locale={locale} />}
        {children}
        {structure?.footer && <Footer {...structure.footer} locale={locale} />}
        <div id="modals">
          <ContentModalWrapper.Context>{modal}</ContentModalWrapper.Context>
        </div>
      </StateControllerProvider>
    </HelpersContexts>
  )
}

export default RootLayout
