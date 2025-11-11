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

  return (
    <Main
      contentType="pages"
      localizations={pageData.localizations}
      themeVariant={pageData.themeColor ?? 'midnight-950'}
    >
      <BlocksLayout
        content={pageData}
        contentType="pages"
        blocks={pageData.blocks}
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
