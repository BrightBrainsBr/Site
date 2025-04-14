import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import Image from 'next/image'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import type { ITreatmentsQueryParams } from '~/services/treatments-query'
import { queryTreatmentsData } from '~/services/treatments-query'

import Posts from './posts'

interface Properties {
  title: string
  bgColor: string
}

const BlockArchiveTreatments: React.FC<IBlockProps<Properties>> = async ({
  blockData,
  locale,
}) => {
  const { title, bgColor = 'transparent', anchor } = blockData

  // TREATMENTS QUERY
  const queryParams: ITreatmentsQueryParams = {
    filters: {},
    page: 1,
    locale,
  }

  const initialState = await queryTreatmentsData(queryParams)

  return (
    <AnimatedSection
      name="block-archive-treatments"
      anchor={anchor}
      distance="small"
      spacing="padding"
      className={twMerge(
        'relative !z-20 overflow-hidden',
        bgColor !== 'white'
          ? 'bg-midnight-950'
          : 'bg-transparent bg-gradient-to-b from-transparent to-gray-light to-70%'
      )}
    >
      <Image
        className="hidden lg:block absolute -bottom-[11.5rem] left-1/2 -translate-x-1/2"
        src="/graphism-treatments.png"
        width={670}
        height={700}
        alt="graphism"
      />
      <div className="container flex flex-col gap-10">
        {title && (
          <div
            className={twMerge(
              bgColor !== 'white' ? 'text-lime-400' : 'text-midnight-950',
              animate()
            )}
          >
            <span className="block w-[2.625rem] h-[0.125rem] bg-current mb-2" />
            <h2 className="heading-4xl">{title}</h2>
          </div>
        )}
        <Posts initialState={initialState} queryParams={queryParams} />
      </div>
    </AnimatedSection>
  )
}

export default BlockArchiveTreatments
