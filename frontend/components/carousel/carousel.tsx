'use client'

import './slider.css'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/free-mode'

import React from 'react'
import { Swiper, type SwiperProps, SwiperSlide } from 'swiper/react'
import { twMerge } from 'tailwind-merge'

export interface IRenderItem {
  key: string
  Layout: React.ReactNode
}

interface Props extends SwiperProps {
  renders: IRenderItem[]
  sliderKey?: string
}

const SwiperCarousel: React.FC<Props> = ({
  renders,
  slidesPerView = 1,
  spaceBetween = 0,
  sliderKey,
  className,
  ...rest
}) => {
  const styleVariables = {
    '--swiper-slidesPerView': slidesPerView,
    '--swiper-spaceBetween': `${Number(spaceBetween) / 16}rem`,
  } as React.CSSProperties

  const shouldShowGrabCursor =
    slidesPerView !== 'auto' && renders.length > Number(slidesPerView)

  if (renders.length === 1) {
    return (
      <div
        key={sliderKey}
        className={twMerge(className, 'w-full block overflow-hidden relative')}
        style={{
          ...styleVariables,
          ...rest.style,
        }}
      >
        <div className="w-full h-full relative">
          {renders[0].Layout}
        </div>
      </div>
    )
  }

  return (
    <Swiper
      {...rest}
      key={sliderKey}
      style={{
        ...styleVariables,
        ...rest.style,
      }}
      slidesPerView={slidesPerView}
      spaceBetween={spaceBetween}
      className={twMerge(
        className,
        shouldShowGrabCursor && 'cursor-grab active:cursor-grabbing'
      )}
    >
      {renders.map((item) => (
        <SwiperSlide key={item.key}>{item.Layout}</SwiperSlide>
      ))}
    </Swiper>
  )
}

export default SwiperCarousel
