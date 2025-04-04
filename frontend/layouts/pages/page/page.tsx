/* eslint-disable @typescript-eslint/no-explicit-any */

import { getContentSingle } from '@futurebrand/hooks'
import type { IPageData } from '@futurebrand/types/contents'
import React from 'react'

import BlocksLayout from '~/layouts/blocks'
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
    </Main>
  )
}

export default PageLayout
