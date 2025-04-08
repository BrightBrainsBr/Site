'use client'

import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { ITreatmentCard } from '@futurebrand/types/contents'
import React, { useMemo } from 'react'
import { FreeMode } from 'swiper/modules'
import { twMerge } from 'tailwind-merge'

import SwiperCarousel from '~/components/carousel/carousel'

import Slide from './slide'

interface Props {
  data: ITreatmentCard[]
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
      className={twMerge('lg:!hidden !overflow-visible', animate({ index: 1 }))}
      slidesPerView={1.15}
      spaceBetween={14}
      breakpoints={{
        '768': {
          slidesPerView: 2,
        },
      }}
      modules={[FreeMode]}
    />
  )
}

export default SliderContent
