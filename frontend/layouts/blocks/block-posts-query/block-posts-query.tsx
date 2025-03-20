import type { IBlockProps } from '@futurebrand/types/contents'
import { type IStrapiTitle } from '@futurebrand/types/strapi'
import React from 'react'

import { AnimatedSection } from '@futurebrand/components'
import { type IPostsQueryParams, queryPostsData } from '~/services/posts-query'

import PostsList from './posts-list'

interface Properties {
  title?: IStrapiTitle
}

const BlockNewsContentQuery: React.FC<IBlockProps<Properties>> = async ({
  blockData,
  locale,
}) => {
  const queryParams: IPostsQueryParams = {
    filters: {},
    page: 1,
    locale,
  }

  const initialState = await queryPostsData(queryParams)

  return (
    <AnimatedSection name="block-posts-query" anchor={blockData.anchor}>
      <PostsList
        queryParams={queryParams}
        initialState={initialState}
        title={blockData.title}
      />
    </AnimatedSection>
  )
}

export default BlockNewsContentQuery
