/* eslint-disable @typescript-eslint/no-explicit-any */

import { getContentSingle } from '@futurebrand/hooks'
import type { IPageData } from '@futurebrand/types/contents'
import React from 'react'

import JsonLd from '~/components/seo/JsonLd'
import BlocksLayout from '~/layouts/blocks'
import BlockEbook from '~/layouts/blocks/block-ebook'
import Main from '~/layouts/structure/main'

const SITE_URL = 'https://www.brightbrains.com.br'

interface Props {
  params: Record<string, any>
  locale: string
  previewData?: IPageData
}

const PageLayout: React.FC<Props> = async ({ locale, params, previewData }) => {
  const pageData = await getContentSingle<IPageData>({
    type: 'pages',
    locale,
    params,
    previewData,
  })

  // Detecta se é a página sobre-nos pelo path/slug
  const isSobreNosPage = pageData.slug?.includes('sobre-nos') || params?.path?.[0] === 'sobre-nos'
  const isHomePage = pageData.slug === '/' || pageData.slug === 'home'

  let finalBlocks = [...(pageData.blocks || [])]

  if (isHomePage) {
    // Procura bloco confiável: treatment-guide ou benefits via includes
    const targetIdx = finalBlocks.findIndex(
      (b: any) => 
        b.__component?.includes('treatment-guide') || 
        b.__component?.includes('benefits') ||
        b.__component?.includes('media-text')
    )

    if (targetIdx !== -1) {
      finalBlocks.splice(targetIdx + 1, 0, {
        __component: 'blocks.rss-podcasts',
        id: 9998,
      } as any)
    } else {
      // Fallback: se não achar o bloco, garante que fica na homepage de qualquer forma, 
      // logo acima de um provável footer block.
      const fallbackIdx = finalBlocks.length > 0 ? finalBlocks.length - 1 : 0;
      finalBlocks.splice(fallbackIdx, 0, {
        __component: 'blocks.rss-podcasts',
        id: 9998,
      } as any)
    }
  }

  // Build MedicalWebPage schema from existing page data
  const pagePath = pageData.path || (pageData.slug === '/' || pageData.slug === 'home' ? '' : `/${pageData.slug || ''}`)
  const pageUrl = `${SITE_URL}/${locale}${pagePath}`.replace(/([^:]\/)\/+/g, '$1')

  const pageSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    url: pageUrl,
    isPartOf: { '@id': `${SITE_URL}/#website` },
  }
  if (pageData.pageSeo?.metaTitle) pageSchema.name = pageData.pageSeo.metaTitle
  if (pageData.pageSeo?.metaDescription) pageSchema.description = pageData.pageSeo.metaDescription
  if (pageData.updatedAt) pageSchema.dateModified = pageData.updatedAt

  // Build BreadcrumbList schema
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/${locale}` },
  ]
  if (!isHomePage && pageData.pageSeo?.metaTitle) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: pageData.pageSeo.metaTitle,
      item: pageUrl,
    })
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  return (
    <Main
      contentType="pages"
      localizations={pageData.localizations}
      themeVariant={pageData.themeColor ?? 'midnight-950'}
    >
      <JsonLd data={pageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <BlocksLayout
        content={pageData}
        contentType="pages"
        blocks={finalBlocks}
      />

      {/* Injeta bloco de ebook no final da página sobre-nos */}
      {isSobreNosPage && (
        <BlockEbook
          blockData={{
            __component: 'blocks.ebook',
            id: 9999,
            title: 'Materiais Gratuitos',
            description:
              '<p>Baixe nossos e-books e aprofunde seus conhecimentos em neuromodulação e neurociência.</p>',
          }}
          locale={locale}
        />
      )}
    </Main>
  )
}

export default PageLayout
