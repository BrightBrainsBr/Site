'use client'

import React, { useMemo } from 'react'
import { Pagination } from 'swiper/modules'

import SwiperCarousel from '~/components/carousel/carousel'

import type { ISlide } from './block-image-slider'
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
      pagination={{ clickable: true }}
      slidesPerView={1}
      spaceBetween={14}
      modules={[Pagination]}
    />
  )
}

export default SliderContent
