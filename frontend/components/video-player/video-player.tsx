/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { StrapiImage, StrapiVideo } from '@futurebrand/components'
import type { IStrapiVideo } from '@futurebrand/types/strapi'
import React, { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv } from 'tailwind-variants'

import { ReactComponent as VideoPlayIcon } from '~/assets/icons/video-play.svg'
import YoutubePlayer from '~/components/youtube-player'

const videoClassName = tv({
  slots: {
    strapi: 'relative z-10 flex w-full h-full object-cover object-center',
    youtube: 'relative z-10 bg-transparent w-full h-full transition-opacity',
    button:
      'absolute top-0 left-0 z-20 cursor-pointer w-full h-full flex items-center justify-center text-white transition-opacity',
  },
  variants: {
    isPlayed: {
      true: {
        strapi: 'opacity-100 pointer-events-auto',
        youtube: 'opacity-100 pointer-events-auto',
        button: 'opacity-0 pointer-events-none',
      },
      false: {
        strapi: 'opacity-0 pointer-events-none',
        youtube: 'opacity-0 pointer-events-none',
      },
    },
  },
})

const extractYoutubeId = (video: string): string => {
  try {
    const urlObj = new URL(video)
    // "youtube.com/watch?v=VIDEOID"
    const v = urlObj.searchParams.get('v')
    if (v) return v
    // "youtube.com/embed/VIDEOID"
    const paths = urlObj.pathname.split('/')
    if (paths.includes('embed') && paths.length > 1) {
      const embedIndex = paths.indexOf('embed')
      if (paths[embedIndex + 1]) return paths[embedIndex + 1]
    }
    return video
  } catch (error) {
    return video
  }
}

const VideoPlayer: React.FC<IStrapiVideo> = ({
  title,
  uploadedVideo,
  youtubeVideo,
  thumbnail,
  className,
}) => {
  const [isPlayed, setIsPlayed] = useState(false)
  const classNames = videoClassName({ isPlayed })
  const youtubeId = youtubeVideo ? extractYoutubeId(youtubeVideo) : ''

  return (
    <div
      className={twMerge(
        'group w-full aspect-video relative overflow-hidden',
        className
      )}
    >
      <StrapiImage
        className="absolute w-full h-full object-cover object-center transition-transform group-hover:scale-105"
        image={thumbnail}
      />
      {uploadedVideo != null ? (
        <StrapiVideo
          controls
          autoPlay={isPlayed}
          playsInline
          className={classNames.strapi()}
          video={uploadedVideo}
        />
      ) : (
        <YoutubePlayer
          video={{
            id: youtubeId ?? '',
            title,
            autoplay: isPlayed,
            enabled: isPlayed,
            showinfo: false,
          }}
          scale="full"
          className={classNames.youtube()}
        />
      )}
      <button
        className={classNames.button()}
        onClick={() => {
          setIsPlayed(true)
        }}
        aria-label="Play video"
      >
        <VideoPlayIcon className="w-[3.125rem] lg:w-20 h-[3.125rem] lg:h-20 transition-colors" />
      </button>
    </div>
  )
}

export default VideoPlayer
