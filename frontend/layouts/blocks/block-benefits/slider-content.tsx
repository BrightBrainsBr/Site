'use client'

import { animate } from '@futurebrand/helpers-nextjs/utils'
import React, { useMemo } from 'react'
import { Pagination } from 'swiper/modules'
import { twMerge } from 'tailwind-merge'

import SwiperCarousel from '~/components/carousel/carousel'

import type { IBenefit } from './block-benefits'
import Slide from './slide'

interface Props {
  data: IBenefit[]
}

const SliderContent: React.FC<Props> = ({ data }) => {
  const renders = useMemo(
    () =>
      data.map((slide, index) => ({
        key: `slide-${index}`,
        Layout: <Slide data={slide} />,
      })),
    [data]
  )

  return (
    <SwiperCarousel
      renders={renders}
      className={twMerge(
        '!overflow-visible !pb-10 lg:!pb-20',
        animate({ index: 1 })
      )}
      slidesPerView={1.15}
      pagination={{ clickable: true }}
      spaceBetween={20}
      breakpoints={{
        '1048': {
          slidesPerView: 4,
        },
        '768': {
          slidesPerView: 2,
        },
      }}
      modules={[Pagination]}
    />
  )
}

export default SliderContent
