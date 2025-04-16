import { AnimatedSection } from '@futurebrand/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import { type IBlockProps } from '@futurebrand/types/contents'
import type { IStrapiVideo } from '@futurebrand/types/strapi'
import React from 'react'

import VideoPlayer from '~/components/video-player'

interface Properties {
  video: IStrapiVideo
}

const BlockPostsVideo: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  return (
    <AnimatedSection
      name="block-posts-video"
      anchor={blockData.anchor}
      spacing="none"
    >
      <div className={animate({ className: 'container-small' })}>
        <VideoPlayer {...blockData.video} />
      </div>
    </AnimatedSection>
  )
}

export default BlockPostsVideo
