'use client'

import React, { useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import Image from 'next/image'

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

/* ─── Inline SVG icons for nav arrows ─── */
function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Waveform decoration for card header ─── */
function WaveformBars() {
  return (
    <div className="flex items-end gap-[3px] h-6 opacity-60">
      {[14, 20, 10, 24, 8, 18, 12, 22, 6, 16, 14, 20, 10].map((h, i) => (
        <div
          key={i}
          className="w-[2px] rounded-full"
          style={{
            height: `${h}px`,
            background: 'linear-gradient(180deg, #84ffa0 0%, #3ecf8e 100%)',
            animation: `podcast-bar ${0.6 + i * 0.08}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.05}s`,
            opacity: 0.4 + (i % 3) * 0.2,
          }}
        />
      ))}
    </div>
  )
}

const CarouselContent: React.FC<Props> = ({ episodes }) => {
  const nextRef = useRef<HTMLButtonElement>(null)
  const prevRef = useRef<HTMLButtonElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null)
  const swiperRef = useRef<SwiperType | null>(null)

  useEffect(() => {
    const swiper = swiperRef.current
    if (!swiper) return

    // Re-assign navigation elements now that refs are populated
    if (swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
      swiper.params.navigation.prevEl = prevRef.current
      swiper.params.navigation.nextEl = nextRef.current
    }
    if (swiper.params.pagination && typeof swiper.params.pagination !== 'boolean') {
      swiper.params.pagination.el = paginationRef.current
    }

    swiper.navigation.init()
    swiper.navigation.update()
    swiper.pagination.init()
    swiper.pagination.render()
    swiper.pagination.update()
  }, [])

  return (
    <div className="relative w-full block-rss-carousel">
      {/* Global keyframes for waveform animation */}
      <style jsx global>{`
        @keyframes podcast-bar {
          0%   { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }
        .block-rss-carousel .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: rgba(255,255,255,0.25);
          border-radius: 50%;
          opacity: 1;
          transition: all 0.3s ease;
        }
        .block-rss-carousel .swiper-pagination-bullet-active {
          background: #84ffa0;
          box-shadow: 0 0 8px rgba(132,255,160,0.4);
          width: 24px;
          border-radius: 4px;
        }
      `}</style>

      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={20}
        slidesPerView={1.15}
        breakpoints={{
          640: { slidesPerView: 2.1, spaceBetween: 24 },
          1024: { slidesPerView: 3, spaceBetween: 28 },
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        className="pb-14"
      >
        {episodes.map((episode, idx) => (
          <SwiperSlide key={idx} className="h-auto">
            <div
              className="flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'linear-gradient(165deg, rgba(15,25,45,0.95) 0%, rgba(8,16,32,0.98) 100%)',
                border: '1px solid rgba(132,255,160,0.08)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(132,255,160,0.2)'
                e.currentTarget.style.boxShadow =
                  '0 8px 40px rgba(0,0,0,0.4), 0 0 30px rgba(132,255,160,0.06), inset 0 1px 0 rgba(255,255,255,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(132,255,160,0.08)'
                e.currentTarget.style.boxShadow =
                  '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)'
              }}
            >
              {/* ─── Card Header: Visual area ─── */}
              <div
                className="relative h-36 flex items-center justify-between px-5 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0c1a30 0%, #0f2318 50%, #0a1628 100%)',
                }}
              >
                {/* Noise texture overlay */}
                <div
                  className="absolute inset-0 opacity-[0.15] mix-blend-soft-light"
                  style={{
                    backgroundImage:
                      'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                  }}
                />
                {/* Glow orb */}
                <div
                  className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(132,255,160,0.12) 0%, transparent 70%)',
                  }}
                />

                {/* Logo & episode badge */}
                <div className="relative z-10 flex flex-col gap-2">
                  <Image
                    src="/logo-light.svg"
                    alt="Bright Brains"
                    width={100}
                    height={28}
                    className="opacity-60"
                  />
                  <span
                    className="text-[10px] font-bold tracking-[0.15em] uppercase mt-1"
                    style={{ color: 'rgba(132,255,160,0.7)' }}
                  >
                    Episódio {episodes.length - idx}
                  </span>
                </div>

                {/* Waveform bars decoration */}
                <div className="relative z-10">
                  <WaveformBars />
                </div>
              </div>

              {/* ─── Card Body ─── */}
              <div className="p-5 flex-grow flex flex-col gap-3">
                {/* Date */}
                <span
                  className="text-[11px] font-semibold tracking-widest uppercase"
                  style={{ color: 'rgba(132,255,160,0.6)' }}
                >
                  {episode.date}
                </span>

                {/* Title */}
                <h3
                  className="text-[15px] leading-snug font-bold text-white line-clamp-2"
                  title={episode.title}
                >
                  {episode.title}
                </h3>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed line-clamp-2"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {episode.description}
                </p>

                {/* Divider */}
                <div
                  className="w-full h-px mt-auto"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />

                {/* Spotify Player */}
                <div className="w-full pt-1">
                  {episode.embedUrl ? (
                    <iframe
                      src={episode.embedUrl}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      title={episode.title}
                      className="rounded-xl w-full"
                      style={{ colorScheme: 'normal' }}
                    />
                  ) : (
                    <a
                      href={episode.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full font-bold py-3 px-4 rounded-xl transition-all duration-300 text-sm"
                      style={{
                        background: 'linear-gradient(135deg, #84ffa0 0%, #3ecf8e 100%)',
                        color: '#0b1220',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'
                        ;(e.currentTarget as HTMLElement).style.boxShadow =
                          '0 4px 20px rgba(132,255,160,0.3)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                      }}
                    >
                      ▶ Ouvir Episódio
                    </a>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation & Pagination */}
      <div className="flex items-center justify-center mt-8 gap-4">
        <button
          ref={prevRef}
          aria-label="Anterior"
          className="hidden lg:flex w-11 h-11 rounded-full items-center justify-center transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(132,255,160,0.3)'
            e.currentTarget.style.color = '#84ffa0'
            e.currentTarget.style.boxShadow = '0 0 16px rgba(132,255,160,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <ChevronLeft />
        </button>

        <div
          ref={paginationRef}
          className="flex justify-center items-center gap-2"
        />

        <button
          ref={nextRef}
          aria-label="Próximo"
          className="hidden lg:flex w-11 h-11 rounded-full items-center justify-center transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(132,255,160,0.3)'
            e.currentTarget.style.color = '#84ffa0'
            e.currentTarget.style.boxShadow = '0 0 16px rgba(132,255,160,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  )
}

export default CarouselContent
