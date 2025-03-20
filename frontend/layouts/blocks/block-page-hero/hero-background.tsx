import { StrapiImage, StrapiVideo } from '@futurebrand/components'
import { type IStrapiMediaAttributes } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

interface Props {
  media: IStrapiMediaAttributes
  isMobile?: boolean
}

const HeroBackground: React.FC<Props> = ({ media, isMobile }) => {
  if (!media) return null

  const isVideo = media.mime?.startsWith('video')

  return (
    <div
      className={twMerge(
        'absolute top-0 left-0 w-screen max-w-full h-full',
        isMobile ? 'md:hidden' : 'hidden md:block'
      )}
    >
      {isVideo ? (
        <StrapiVideo
          video={media}
          className="w-full h-full object-cover object-center"
          autoPlay
          loop
          playsInline
          muted
        />
      ) : (
        <StrapiImage
          image={media}
          className="w-full h-full object-cover object-center"
          loading="eager"
          priority={isMobile}
          fill
        />
      )}
    </div>
  )
}

export default HeroBackground
