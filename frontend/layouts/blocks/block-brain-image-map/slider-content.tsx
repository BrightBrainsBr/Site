/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { animate } from '@futurebrand/helpers-nextjs/utils'
import Image from 'next/image'
import React, { useMemo, useState } from 'react'
import type { SwiperClass } from 'swiper/react'
import { twMerge } from 'tailwind-merge'

import SwiperCarousel from '~/components/carousel'
import SliderNavigation from '~/components/slider-navigation'

import type { ISymptom } from './block-brain-image-map'
import { colorVariant } from './image-map'
import Slide from './slide'

interface Properties {
  accent: string
  data: ISymptom[]
}

const SliderContent: React.FC<Properties> = ({
  accent = 'green-400',
  data,
}) => {
  const [isPaginationEnabled, setPaginationEnabled] = useState(true)
  const [slider, setSlider] = useState<SwiperClass>()
  const [isBackDisable, setBackDisable] = useState(true)
  const [isNextDisable, setNextDisable] = useState(false)

  if (!data || data.length === 0) return null

  const renders = useMemo(
    () =>
      data.map((slide, index) => ({
        key: `slide-${index}`,
        Layout: <Slide accent={accent} data={slide} />,
      })),
    [data]
  )

  return (
    <div
      className={twMerge(
        'flex flex-col gap-8 lg:hidden',
        animate({ index: 1 })
      )}
    >
      <picture className="flex items-center justify-center">
        <Image
          src={
            (accent === 'blue-400' && '/brain-blue-default.svg') ||
            (accent === 'green-400' && '/brain-green-default.svg') ||
            (accent === 'violet-400' && '/brain-violet-default.svg') ||
            ''
          }
          width={308}
          height={302}
          alt="Brain Image Map"
        />
      </picture>
      <SwiperCarousel
        renders={renders}
        className="!overflow-visible"
        slidesPerView={1.15}
        spaceBetween={20}
        onInit={(swiper) => {
          setSlider(swiper)
          setPaginationEnabled(!swiper.isLocked)
        }}
        onSlideChange={(swiper) => {
          setPaginationEnabled(!swiper.isLocked)
          setBackDisable(swiper.isBeginning)
          setNextDisable(swiper.isEnd)
        }}
        breakpoints={{
          '768': {
            slidesPerView: 3,
          },
        }}
      />
      <SliderNavigation
        className={twMerge(
          'w-full',
          !isPaginationEnabled && '!hidden',
          colorVariant({ color: accent as any })
        )}
        isBackDisable={isBackDisable}
        isNextDisable={isNextDisable}
        onClickBack={() => {
          slider?.slidePrev()
        }}
        onClickNext={() => {
          slider?.slideNext()
        }}
      />
    </div>
  )
}

export default SliderContent
