/* eslint-disable @typescript-eslint/no-explicit-any */

import { getContentSingle } from '@futurebrand/hooks'
import type { IPageData } from '@futurebrand/types/contents'
import React from 'react'

import BlocksLayout from '~/layouts/blocks'
import BlockEbook from '~/layouts/blocks/block-ebook'
import Main from '~/layouts/structure/main'

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

  return (
    <Main
      contentType="pages"
      localizations={pageData.localizations}
      themeVariant={pageData.themeColor ?? 'midnight-950'}
    >
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
