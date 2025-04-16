'use client'

import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IPostCard } from '@futurebrand/types/contents'
import React, { useMemo } from 'react'
import { twMerge } from 'tailwind-merge'

import SwiperCarousel from '~/components/carousel/carousel'

import Slide from './slide'

interface Props {
  locale: string
  data: IPostCard[]
}

const SliderContent: React.FC<Props> = ({ data, locale }) => {
  const renders = useMemo(
    () =>
      data.splice(0, 3).map((item, index) => ({
        key: `card-${index}`,
        Layout: <Slide locale={locale} data={item} />,
      })),
    [data]
  )

  return (
    <div className={twMerge('relative', animate({ index: 2 }))}>
      <SwiperCarousel
        renders={renders}
        className="w-full !overflow-visible"
        slidesPerView={1.15}
        spaceBetween={20}
        breakpoints={{
          '1024': {
            slidesPerView: 3,
          },
          '768': {
            slidesPerView: 2,
          },
        }}
      />
    </div>
  )
}

export default SliderContent
