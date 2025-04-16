import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import React from 'react'

import { type IPostsQueryParams, queryPostsData } from '~/services/posts-query'

import PostsList from './post-list'

interface Properties {
  title?: string
  locale: string
}

const RelatedPosts: React.FC<Properties> = async ({ title, locale }) => {
  const queryParams: IPostsQueryParams = {
    filters: { title },
    page: 1,
    locale,
  }

  const initialState = await queryPostsData(queryParams)

  return (
    <AnimatedSection
      name="block-related-posts"
      className="relative overflow-hidden lg:overflow-visible bg-gray-light"
      spacing="padding"
      distance="small"
    >
      <PostsList
        locale={locale}
        initialState={initialState}
        queryParams={queryParams}
      />
    </AnimatedSection>
  )
}

export default RelatedPosts
