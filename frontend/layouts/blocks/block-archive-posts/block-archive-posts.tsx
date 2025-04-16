import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import type { IBlockProps } from '@futurebrand/types/contents'
import React from 'react'

import type { IPostsQueryParams } from '~/services/posts-query'
import { queryPostsData } from '~/services/posts-query'
import type { ITagsQueryParams } from '~/services/tags-query'
import { queryTagsData } from '~/services/tags-query'

import Posts from './posts'

interface Properties {
  title: string
}

const BlockArchivePosts: React.FC<IBlockProps<Properties>> = async ({
  blockData,
  locale,
}) => {
  const { title, anchor } = blockData

  // TAGS

  const tagsQueryParams: ITagsQueryParams = {
    filters: {},
    page: 1,
    locale,
  }

  const tagsInitialState = await queryTagsData(tagsQueryParams)

  // POSTS

  const queryParams: IPostsQueryParams = {
    filters: {},
    page: 1,
    locale,
  }

  const initialState = await queryPostsData(queryParams)

  return (
    <AnimatedSection
      name="block-archive-posts"
      anchor={anchor}
      distance="small"
      spacing="padding"
      className="bg-gradient-to-b from-gray-light to-transparent"
    >
      <div className="container flex flex-col gap-5 lg:gap-10">
        <Posts
          initialState={initialState}
          queryParams={queryParams}
          tagsQueryParams={tagsQueryParams}
          tagsInitialState={tagsInitialState}
          title={title}
        />
      </div>
    </AnimatedSection>
  )
}

export default BlockArchivePosts
