/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ContentTypes, IPageData } from '@futurebrand/types/contents'
import React from 'react'

import Contacts from '~/layouts/contents/contacts'
import PostSingle from '~/layouts/contents/posts-single'
import TreatmentsSingle from '~/layouts/contents/treatments-single'
import PageLayout from '~/layouts/pages/page'

interface Properties {
  locale: string
  type: ContentTypes
  params: any
  previewData?: any
}

const DynamicPage: React.FC<Properties> = ({
  locale,
  params,
  type,
  previewData,
}) => {
  if (locale === 'favicon.ico') {
    return false
  }

  switch (type) {
    case 'pages': {
      return (
        <PageLayout
          previewData={previewData as IPageData}
          locale={locale}
          params={params}
        />
      )
    }

    case 'posts': {
      return (
        <PostSingle locale={locale} previewData={previewData} params={params} />
      )
    }

    case 'treatments': {
      return (
        <TreatmentsSingle
          locale={locale}
          previewData={previewData}
          params={params}
        />
      )
    }

    case 'modals': {
      return (
        <Contacts.Single
          locale={locale}
          params={params}
          previewData={previewData}
        />
      )
    }
  }
}

export default DynamicPage
