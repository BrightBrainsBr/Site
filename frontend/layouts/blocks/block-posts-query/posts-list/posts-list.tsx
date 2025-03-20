'use client'

import { StrapiTitle } from '@futurebrand/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import { useClientDictionary } from '@futurebrand/hooks'
import { type IStrapiTitle } from '@futurebrand/types/strapi'
import React from 'react'

import Button from '~/components/button'
import Loading from '~/components/loading'
import PostCard from '~/layouts/shared/posts-card'
import type {
  IPostsQueryParams,
  IPostsQueryResponse,
} from '~/services/posts-query'

import usePostsQuery from './use-posts-query'

interface Props {
  initialState: IPostsQueryResponse
  queryParams: IPostsQueryParams
  title?: IStrapiTitle
}

const ProductsQueryContent: React.FC<Props> = ({
  initialState,
  queryParams,
  title,
}) => {
  const { posts, haveMore, isLoading, loadPage } = usePostsQuery({
    initialState,
    queryParams,
  })
  const dictionary = useClientDictionary()

  return (
    <div className="container flex flex-col">
      <div className={animate({ className: 'flex items-start md:h-16' })}>
        {title && (
          <div>
            <StrapiTitle className="text-2.5xl font-medium" component={title} />
          </div>
        )}
      </div>
      {posts.length > 0 && (
        <div
          className="mt-6 md:mt-2 grid gap-5"
          style={{
            gridTemplateColumns:
              'repeat(auto-fill, minmax(min(16.5rem, 100%), 1fr)',
          }}
        >
          {posts.map((post, index) => (
            <PostCard key={post.id} index={index} {...post} />
          ))}
        </div>
      )}
      {isLoading && (
        <div className="mt-10 w-full h-80 flex items-center justify-center">
          <Loading />
        </div>
      )}
      {haveMore && (
        <div className="mt-10 flex justify-center">
          <Button
            component="button"
            variant="light"
            type="submit"
            disabled={isLoading}
            onClick={() => {
              void loadPage()
            }}
          >
            {dictionary.loadMore}
          </Button>
        </div>
      )}
    </div>
  )
}

export default ProductsQueryContent
