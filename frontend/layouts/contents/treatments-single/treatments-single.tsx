import { ContentService } from '@futurebrand/services'
import type { ITreatment } from '@futurebrand/types/contents'
import React from 'react'

import JsonLd from '~/components/seo/JsonLd'
import BlocksLayout from '~/layouts/blocks'
import Main from '~/layouts/structure/main'

interface Props {
  params: Record<string, string>
  locale: string
  previewData?: ITreatment
}

const SITE_URL = 'https://www.brightbrains.com.br'

async function TreatmentsSingle({ locale, params, previewData }: Props) {
  const service = new ContentService()
  const pageData = await service.single<ITreatment>({
    type: 'treatments',
    locale,
    params,
    previewData,
  })

  const cdnUrl = process.env.CDN_IMAGES_URL || ''
  const slug = pageData.slug?.replace(/^\//, '') || ''
  const pageUrl = `${SITE_URL}/${locale}/neuromodulacao/${slug}`

  const imageUrl =
    pageData.featuredImage?.url
      ? (pageData.featuredImage.url.startsWith('http')
          ? pageData.featuredImage.url
          : `${cdnUrl}${pageData.featuredImage.url}`)
      : undefined

  // MedicalWebPage schema
  const pageSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: pageData.title,
    url: pageUrl,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: {
      '@type': 'MedicalCondition',
      name: pageData.title,
    },
  }
  if (pageData.excerpt) pageSchema.description = pageData.excerpt
  if (imageUrl) pageSchema.primaryImageOfPage = { '@type': 'ImageObject', url: imageUrl }

  // MedicalProcedure schema
  const procedureSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: pageData.title,
    url: pageUrl,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    indication: {
      '@type': 'MedicalCondition',
      name: pageData.title,
    },
  }
  if (pageData.excerpt) procedureSchema.description = pageData.excerpt
  if (imageUrl) procedureSchema.image = imageUrl

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Neuromodulação',
        item: `${SITE_URL}/${locale}/neuromodulacao`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: pageData.title,
        item: pageUrl,
      },
    ],
  }

  return (
    <Main
      contentType={'treatments'}
      localizations={pageData.localizations}
      themeVariant={pageData.themeColor ?? 'midnight-950'}
    >
      <JsonLd data={pageSchema} />
      <JsonLd data={procedureSchema} />
      <JsonLd data={breadcrumbSchema} />
      <BlocksLayout
        blocks={pageData.blocks}
        content={pageData}
        contentType="posts"
      />
    </Main>
  )
}

export default TreatmentsSingle
