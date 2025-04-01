import { ContentService } from '@futurebrand/services'
import type { IPost } from '@futurebrand/types/contents'
import React from 'react'

import BlocksLayout from '~/layouts/blocks'
import Main from '~/layouts/structure/main'

import Title from './title'

interface Props {
  params: Record<string, string>
  locale: string
  previewData?: IPost
}

async function PostsSingle({ locale, params, previewData }: Props) {
  const service = new ContentService()
  const pageData = await service.single<IPost>({
    type: 'posts',
    locale,
    params,
    previewData,
  })

  return (
    <Main
      contentType={'posts'}
      localizations={pageData.localizations}
      className="pt-16 lg:pt-20"
      headerVariant="midnight-950"
    >
      <Title
        title={pageData.title}
        description={pageData.excerpt}
        tags={pageData.tags?.map((tag) => tag.name) || []}
      />
      <div className="mt-10 text ">
        <BlocksLayout
          blocks={pageData.blocks}
          content={pageData}
          contentType="posts"
        />
      </div>
    </Main>
  )
}

export default PostsSingle
