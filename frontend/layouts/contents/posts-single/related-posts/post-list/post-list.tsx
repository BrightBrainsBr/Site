'use client'

import { animate } from '@futurebrand/helpers-nextjs/utils'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import {
  type IPostsQueryParams,
  type IPostsQueryResponse,
} from '~/services/posts-query'
import usePostsQuery from '~/services/posts-query/use-posts-query'

import SliderContent from '../slider-content'

interface Properties {
  locale: string
  initialState: IPostsQueryResponse
  queryParams: IPostsQueryParams
}

const PostsList: React.FC<Properties> = ({
  locale,
  initialState,
  queryParams,
}) => {
  const { posts } = usePostsQuery({
    initialState,
    queryParams,
  })

  if (!posts || posts.length === 0) return null

  return (
    <div className="container">
      <div className={twMerge('text-midnight-950 mb-8 lg:mb-10', animate())}>
        <span className="block w-[2.625rem] h-[0.125rem] bg-current mb-2" />
        <h2 className="heading-4xl">Veja mais estudos como esse</h2>
      </div>
      <SliderContent data={posts} locale={locale} />
    </div>
  )
}

export default PostsList
