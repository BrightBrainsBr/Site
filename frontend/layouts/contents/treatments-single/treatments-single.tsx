import { ContentService } from '@futurebrand/services'
import type { ITreatment } from '@futurebrand/types/contents'
import React from 'react'

import BlocksLayout from '~/layouts/blocks'
import Main from '~/layouts/structure/main'

interface Props {
  params: Record<string, string>
  locale: string
  previewData?: ITreatment
}

async function TreatmentsSingle({ locale, params, previewData }: Props) {
  const service = new ContentService()
  const pageData = await service.single<ITreatment>({
    type: 'treatments',
    locale,
    params,
    previewData,
  })

  return (
    <Main
      contentType={'treatments'}
      localizations={pageData.localizations}
      themeVariant={pageData.themeColor ?? 'midnight-950'}
    >
      <BlocksLayout
        blocks={pageData.blocks}
        content={pageData}
        contentType="posts"
      />
    </Main>
  )
}

export default TreatmentsSingle
