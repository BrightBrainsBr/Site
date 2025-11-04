'use client'

import { Link, StrapiImage } from '@futurebrand/helpers-nextjs/components'
import type { ITreatmentCard } from '@futurebrand/types/contents'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import type {
  ITreatmentsQueryParams,
  ITreatmentsQueryResponse,
} from '~/services/treatments-query'
import useTreatmentsQuery from '~/services/treatments-query/use-treatments-query'

import styles from '../../../structure/header/nav-menu.module.css'
import SliderContent from './slider-content'

interface Props {
  queryParams: ITreatmentsQueryParams
  initialState: ITreatmentsQueryResponse
}

const Posts: React.FC<Props> = ({ initialState, queryParams }) => {
  const { posts } = useTreatmentsQuery({
    initialState,
    queryParams,
  })

  return (
    <>
      <SliderContent data={posts} />
      <ul aria-hidden={true} className="hidden">
        {posts &&
          posts.map((card: ITreatmentCard, index) => (
            <li
              key={`treatment-card-${index}`}
              className={twMerge(
                'w-[32.5%] hover:w-[48.44vw] transition-all duration-200',
                styles.treatmentCard
              )}
            >
              <Link
                href={card.path}
                name="treatment-card"
                className="group relative flex flex-col justify-end h-[47.62vh] min-h-[25rem] overflow-hidden rounded-[1.25rem] p-6 border-0 hover:border-8 duration-200 transition-all"
              >
                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-[#091930F2] to-[#09193015] z-10 opacity-100 duration-300 transition-all group-hover:opacity-50" />
                {card.featuredImage && (
                  <StrapiImage
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    image={card.featuredImage}
                  />
                )}
                {card.title && (
                  <h3 className="relative z-10 heading-4xl text-white">
                    {card.title
                      .replace(/tratamento/gi, '')
                      .replace(/\s+/g, ' ')
                      .trim()}
                  </h3>
                )}
                {card.excerpt && (
                  <div
                    className="relative z-10 cms-rich-text hidden group-hover:block group-hover:animate-fadein opacity-0 text-white"
                    dangerouslySetInnerHTML={{
                      __html: card.excerpt,
                    }}
                  />
                )}
              </Link>
            </li>
          ))}
      </ul>
    </>
  )
}

export default Posts
