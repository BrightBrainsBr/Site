'use client'

import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { ITreatmentCard } from '@futurebrand/types/contents'
import React, { useMemo } from 'react'
import { FreeMode, Autoplay, Navigation, Pagination } from 'swiper/modules'
import { twMerge } from 'tailwind-merge'

import SwiperCarousel from '~/components/carousel/carousel'

import Slide from './slide'

interface Props {
  data: ITreatmentCard[]
}

const AUTOPLAY_CONFIG = {
  delay: 2500,
  disableOnInteraction: false,
  pauseOnMouseEnter: true,
} as const

const BREAKPOINTS = {
  640: { slidesPerView: 1.3 },
  768: { slidesPerView: 2 },
  1024: { slidesPerView: 3, spaceBetween: 20 },
} as const

const SliderContent: React.FC<Props> = ({ data }) => {
  const renders = useMemo(
    () =>
      data.map((slide, index) => ({
        key: `treatment-card-${slide.id}`,
        Layout: <Slide data={slide} />,
      })),
    [data]
  )

  return (
    <SwiperCarousel
      renders={renders}
      className={twMerge('!overflow-visible', animate({ index: 1 }))}
      slidesPerView={1.15}
      spaceBetween={14}
      breakpoints={BREAKPOINTS}
      modules={[FreeMode, Autoplay, Navigation, Pagination]}
      autoplay={AUTOPLAY_CONFIG}
      loop={true}
      navigation={true}
      pagination={{ clickable: true }}
    />
  )
}

export default SliderContent
