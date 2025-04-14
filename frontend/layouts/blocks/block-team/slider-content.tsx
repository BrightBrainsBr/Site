import { animate } from '@futurebrand/helpers-nextjs/utils'
import React, { useMemo } from 'react'
import { twMerge } from 'tailwind-merge'

import SwiperCarousel from '~/components/carousel'

import type { IPeople } from './block-team'
import Slide from './slide'

interface Props {
  data: IPeople[]
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
      className={twMerge('!overflow-visible', animate({ index: 3 }))}
      slidesPerView={1.15}
      pagination={{ clickable: true }}
      spaceBetween={20}
      breakpoints={{
        '1048': {
          slidesPerView: 3,
        },
        '768': {
          slidesPerView: 2,
        },
      }}
    />
  )
}

export default SliderContent
