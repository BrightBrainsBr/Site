import { ContentService } from '@futurebrand/services'
import type { IPost } from '@futurebrand/types/contents'
import React from 'react'

import BlocksLayout from '~/layouts/blocks'
import Main from '~/layouts/structure/main'

import HeadlineContact from './headline-contact'
import RelatedPosts from './related-posts'
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
      // className="pt-16 lg:pt-20"
      themeVariant="lime-400"
    >
      <Title
        title={pageData.title}
        description={pageData.excerpt}
        // tags={pageData.tags?.map((tag) => tag.name) || []}
        featuredImage={pageData.featuredImage}
      />
      <div className="relative z-10 flex flex-col gap-10 bg-gray-light py-10 lg:py-20">
        <BlocksLayout
          blocks={pageData.blocks}
          content={pageData}
          contentType="posts"
        />
      </div>
      <RelatedPosts locale={locale} title={pageData.title} />
      <HeadlineContact />
    </Main>
  )
}

export default PostsSingle
