'use client'

import React, { useMemo } from 'react'
import { Pagination } from 'swiper/modules'

import SwiperCarousel from '~/components/carousel'

import type { ISlide } from './block-main-hero'
import Slide from './slide'

interface Properties {
  data: ISlide[]
}

const SliderContent: React.FC<Properties> = ({ data }) => {
  const renders = useMemo(
    () =>
      data.map((item, index) => ({
        key: `card-${index}`,
        Layout: <Slide data={item} />,
      })),
    [data]
  )

  return (
    <div className="container grid grid-cols-1 lg:grid-cols-12 gap-5">
      <SwiperCarousel
        renders={renders}
        className="col-span-full lg:col-span-8 lg:col-start-3"
        slidesPerView={1}
        spaceBetween={20}
        pagination={{
          clickable: true,
        }}
        modules={[Pagination]}
      />
    </div>
  )
}

export default SliderContent
