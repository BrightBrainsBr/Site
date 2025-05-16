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
      {content && (
        <div className="container pb-10 lg:pb-[4.75rem]">
          <span className="block w-[2.625rem] h-[0.125rem] bg-current mb-2" />
          <div
            className={twMerge(
              'lg:max-w-[42.5vw] cms-rich-text',
              animate({ index: 1 })
            )}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}
      <div className="relative z-10 lg:container-small grid grid-cols-1 lg:grid-cols-10 gap-5 lg:gap-y-10">
        {videoURL && (
          <VideoPlayer
            thumbnail={thumbnail}
            className="col-span-full h-[13.125rem] md-[37.5rem] lg:h-[73.57vh] lg:min-h-[38.625rem]"
            youtubeVideo={videoURL}
            uploadedVideo={undefined}
            title="YT video"
          />
        )}
      </div>
    </AnimatedSection>
  )
}

export default BlockManifest
