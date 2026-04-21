'use client'

import React, { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

export interface IEpisode {
  title: string
  description: string
  link: string
  date: string
  embedUrl: string
}

interface Props {
  episodes: IEpisode[]
}

const CarouselContent: React.FC<Props> = ({ episodes }) => {
  const nextRef = useRef<HTMLButtonElement>(null)
  const prevRef = useRef<HTMLButtonElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative w-full block-rss-carousel">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={20}
        slidesPerView={1.2}
        breakpoints={{
          640: { slidesPerView: 2.2, spaceBetween: 24 },
          1024: { slidesPerView: 3, spaceBetween: 32 },
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        pagination={{
          el: paginationRef.current,
          clickable: true,
        }}
        onBeforeInit={(swiper: SwiperType) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const navigation = swiper.params.navigation as any
          navigation.prevEl = prevRef.current
          navigation.nextEl = nextRef.current
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pagination = swiper.params.pagination as any
          pagination.el = paginationRef.current
        }}
        className="pb-16" // Space for pagination
      >
        {episodes.map((episode, idx) => (
          <SwiperSlide key={idx} className="h-auto">
            <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header Texts */}
              <div className="p-5 flex-grow flex flex-col">
                <span className="text-xs font-semibold tracking-wider text-lime-600 uppercase mb-2">
                  {episode.date}
                </span>
                <h3
                  className="text-lg font-bold text-midnight-950 mb-2 line-clamp-2"
                  title={episode.title}
                >
                  {episode.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {episode.description}
                </p>

                {/* Spotify Iframe */}
                <div className="w-full mt-auto">
                  {episode.embedUrl ? (
                    <iframe
                      src={episode.embedUrl}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      title={episode.title}
                      className="rounded-lg w-full"
                    />
                  ) : (
                    <a
                      href={episode.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full transition-colors"
                    >
                      Ouvir Episódio
                    </a>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation & Pagination Container */}
      <div className="flex items-center justify-between xl:justify-center mt-6">
        <button
          ref={prevRef}
          aria-label="Anterior"
          className="swiper-button-prev relative hidden xl:flex w-12 h-12 bg-white rounded-full border border-gray-200 items-center justify-center text-midnight-950 hover:bg-gray-50 transition-colors z-10 mx-2"
          style={{ marginTop: 0, left: 'auto', right: 'auto' }}
        />
        <div
          ref={paginationRef}
          className="swiper-pagination relative bottom-auto flex justify-center gap-2"
        />
        <button
          ref={nextRef}
          aria-label="Próximo"
          className="swiper-button-next relative hidden xl:flex w-12 h-12 bg-white rounded-full border border-gray-200 items-center justify-center text-midnight-950 hover:bg-gray-50 transition-colors z-10 mx-2"
          style={{ marginTop: 0, left: 'auto', right: 'auto' }}
        />
      </div>
    </div>
  )
}

export default CarouselContent
