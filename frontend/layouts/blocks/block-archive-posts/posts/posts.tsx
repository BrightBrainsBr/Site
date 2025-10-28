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
  ITreatmentsQueryParams,
  ITreatmentsQueryResponse,
} from '~/services/treatments-query'
import useTreatmentsQuery from '~/services/treatments-query/use-treatments-query'

interface Props {
  queryParams: IPostsQueryParams
  initialState: IPostsQueryResponse
  treatmentsQueryParams: ITreatmentsQueryParams
  treatmentsInitialState: ITreatmentsQueryResponse
  title: string
}

const Posts: React.FC<Props> = ({
  initialState,
  queryParams,
  treatmentsQueryParams,
  treatmentsInitialState,
  title,
}) => {
  const [currentTreatments, setCurrentTreatments] = useState<string[]>([])
  const { posts, isLoading, total, changeFilter } = usePostsQuery({
    initialState,
    queryParams,
  })
  const router = useSearchParams()

  const { posts: treatments } = useTreatmentsQuery({
    initialState: treatmentsInitialState,
    queryParams: treatmentsQueryParams,
  })

  useEffect(() => {
    void changeFilter({
      treatments: currentTreatments,
    })
  }, [currentTreatments, router])

  return (
    <>
      <div
        className={twMerge(
          'lg:relative flex flex-col lg:justify-center gap-5 lg:h-[3.25rem]',
          animate()
        )}
      >
        {title && <h2 className="text-sm uppercase">{title}</h2>}
        {treatments.length > 0 && (
          <Accordion
            title="Filtros"
            isSelect
            className="lg:z-10 lg:absolute lg:top-0 lg:right-0 bg-gray-light rounded-2xl w-full lg:w-[20.83vw] px-3"
          >
            <form className="flex flex-col gap-3 px-3 pt-4 pb-10">
              {treatments.map((treatment, index) => (
                <fieldset className="flex gap-2" key={`treatment-${index}`}>
                  <input
                    id={treatment.title}
                    name="treatment-option"
                    type="radio"
                    value={treatment.title}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setCurrentTreatments([treatment.slug])
                      }
                    }}
                  />
                  <label htmlFor={treatment.title}>{treatment.title}</label>
                </fieldset>
              ))}
              <button
                type="reset"
                className="underline w-fit text-gray-secondary-dark"
                onClick={() => {
                  setCurrentTreatments([])
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
