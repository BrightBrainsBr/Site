'use client'

import { StrapiImage, StrapiVideo } from '@futurebrand/components'
import type { IStrapiVideo } from '@futurebrand/types/strapi'
import React, { useState } from 'react'
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

const VideoPlayer: React.FC<IStrapiVideo> = ({
  title,
  uploadedVideo,
  youtubeVideo,
  thumbnail,
}) => {
  const [isPlayed, setIsPlayed] = useState(false)
  const classNames = videoClassName({ isPlayed })

  return (
    <div className="group w-full aspect-video relative card overflow-hidden">
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
            id: youtubeVideo ?? '',
            title,
            autoplay: true,
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
        <VideoPlayIcon className="w-16 h-16 transition-colors text-current-primary hover:text-current-hover" />
      </button>
    </div>
  )
}

export default VideoPlayer
