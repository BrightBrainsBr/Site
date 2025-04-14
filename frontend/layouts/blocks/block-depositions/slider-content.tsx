'use client'

import { animate } from '@futurebrand/helpers-nextjs/utils'
import React, { useMemo } from 'react'
import { Pagination } from 'swiper/modules'
import { twMerge } from 'tailwind-merge'

import SwiperCarousel from '~/components/carousel/carousel'

import type { ISlide } from './block-depositions'
import Slide from './slide'

interface Props {
  data: ISlide[]
}

const SliderContent: React.FC<Props> = ({ data }) => {
  const renders = useMemo(
    () =>
      data.map((slide, index) => ({
        key: `card-${index}`,
        Layout: <Slide data={slide} />,
      })),
    [data]
  )

  return (
    <SwiperCarousel
      renders={renders}
      className={twMerge('!overflow-visible', animate({ index: 1 }))}
      pagination={{ clickable: true }}
      slidesPerView={1}
      spaceBetween={0}
      modules={[Pagination]}
    />
  )
}

export default SliderContent
