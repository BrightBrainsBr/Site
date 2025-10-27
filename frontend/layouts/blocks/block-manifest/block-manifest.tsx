import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString, IStrapiMedia } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import VideoPlayer from '~/components/video-player'

interface Properties {
  content: HTMLString
  thumbnail: IStrapiMedia
  videoURL: string
  type: string
}

const BlockManifest: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  const { content, thumbnail, videoURL, anchor } = blockData

  return (
    <AnimatedSection
      name="block-manifest"
      anchor={anchor}
      spacing="none"
      className="relative pb-10 lg:pb-[6.25rem] bg-gray-light"
    >
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Texto ao lado esquerdo */}
          {content && (
            <div className="lg:col-span-5 order-2 lg:order-1">
              <span className="block w-[2.625rem] h-[0.125rem] bg-current mb-4 lg:mb-6" />
              <div
                className={twMerge(
                  'cms-rich-text',
                  animate({ index: 1 })
                )}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          )}
          
          {/* Vídeo ao lado direito */}
          {videoURL && (
            <div className="lg:col-span-7 order-1 lg:order-2">
              <VideoPlayer
                thumbnail={thumbnail}
                className="w-full aspect-video max-w-none"
                youtubeVideo={videoURL}
                uploadedVideo={undefined}
                title="YT video"
              />
            </div>
          )}
        </div>
      </div>
    </AnimatedSection>
  )
}

export default BlockManifest
