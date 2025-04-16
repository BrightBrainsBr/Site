'use client'

import { Link, StrapiImage } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import Accordion from '~/components/accordion'
import Loading from '~/components/loading'
import type {
  IPostsQueryParams,
  IPostsQueryResponse,
} from '~/services/posts-query'
import usePostsQuery from '~/services/posts-query/use-posts-query'
import type {
  ITagsQueryParams,
  ITagsQueryResponse,
} from '~/services/tags-query'
import useTagsQuery from '~/services/tags-query/use-tags-query'

interface Props {
  queryParams: IPostsQueryParams
  initialState: IPostsQueryResponse
  tagsQueryParams: ITagsQueryParams
  tagsInitialState: ITagsQueryResponse
  title: string
}

const Posts: React.FC<Props> = ({
  initialState,
  queryParams,
  tagsQueryParams,
  tagsInitialState,
  title,
}) => {
  const [currentTags, setCurrentTags] = useState<string[]>([])
  const { posts, isLoading, total, changeFilter } = usePostsQuery({
    initialState,
    queryParams,
  })
  const router = useSearchParams()

  const { tags } = useTagsQuery({
    initialState: tagsInitialState,
    queryParams: tagsQueryParams,
  })

  useEffect(() => {
    void changeFilter({
      tags: currentTags,
    })
  }, [currentTags, router])

  return (
    <>
      <div
        className={twMerge(
          'lg:relative flex flex-col lg:justify-center gap-5 lg:h-[3.25rem]',
          animate()
        )}
      >
        {title && <h2 className="text-sm uppercase">{title}</h2>}
        {tags.length > 0 && (
          <Accordion
            title="Filtros"
            isSelect
            className="lg:z-10 lg:absolute lg:top-0 lg:right-0 bg-gray-light rounded-2xl w-full lg:w-[20.83vw] px-3"
          >
            <form className="flex flex-col gap-3 px-3 pt-4 pb-10">
              {tags.map((tag, index) => (
                <fieldset className="flex gap-2" key={`tag-${index}`}>
                  <input
                    id={tag.name}
                    name="tag-option"
                    type="radio"
                    value={tag.name}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setCurrentTags([tag.name])
                      }
                    }}
                  />
                  <label htmlFor={tag.name}>{tag.name}</label>
                </fieldset>
              ))}
              <button
                type="reset"
                className="underline w-fit text-gray-secondary-dark"
                onClick={() => {
                  setCurrentTags([])
                }}
              >
                Limpar
              </button>
            </form>
          </Accordion>
        )}
      </div>
      {total === 0 && (
        <div className="w-full flex items-center justify-center min-h-[20vh] lg:min-h-[30vh]">
          <span className="heading-3xl opacity-0 animate-fade-in">
            Nenhum resultado encontrado
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.length > 0 &&
          posts.map((post, index) => (
            <article
              className={twMerge(
                'group block w-full h-fit',
                animate({ index: index + 1 })
              )}
              key={`post-${index}`}
            >
              <Link
                href={post.path}
                name="post-link"
                className="block opacity-0 animate-fadein h-fit bg-white lg:h-[44.52vh] lg:min-h-[23.375rem] rounded-2xl overflow-hidden"
              >
                {post.featuredImage && (
                  <picture className="block w-full h-[11rem] lg:h-[20.95vh] lg:min-h-[11rem] overflow-hidden">
                    <StrapiImage
                      className="w-full h-full object-cover object-top scale-100 group-hover:scale-110 duration-300 transition-transform"
                      image={post.featuredImage.mobile}
                    />
                  </picture>
                )}
                <div className="p-6 lg:pb-10 flex flex-col gap-3 text-midnight-950">
                  {post.title && (
                    <h3 className="heading-xl font-semibold">{post.title}</h3>
                  )}
                  {post.excerpt && (
                    <p className="font-kmr font-light text-sm text-ellipsis line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="text-base font-semibold">Leia mais</span>
                </div>
              </Link>
            </article>
          ))}
      </div>
      {isLoading && (
        <div className="w-full h-80 flex items-center justify-center">
          <Loading />
        </div>
      )}
    </>
  )
}

export default Posts
