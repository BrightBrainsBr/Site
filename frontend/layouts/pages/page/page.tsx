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

  // Detecta se é a página sobre-nos pelo path
  const isSobreNosPage = params?.path?.[0] === 'sobre-nos'
  const isHomePage = !params?.path || params?.path?.length === 0 || params?.path?.[0] === 'home'

  let finalBlocks = [...(pageData.blocks || [])]

  if (isHomePage) {
    // Procura bloco confiável: blocks.treatment-guide ou blocks.benefits
    const targetIdx = finalBlocks.findIndex(
      (b: any) => b.__component === 'blocks.treatment-guide' || b.__component === 'blocks.benefits'
    )

    if (targetIdx !== -1) {
      finalBlocks.splice(targetIdx + 1, 0, {
        __component: 'blocks.rss-podcasts',
        id: 9998,
      } as any)
    } else {
      // Fallback: se não achar, coloca como penúltimo
      finalBlocks.splice(finalBlocks.length > 0 ? finalBlocks.length - 1 : 0, 0, {
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
