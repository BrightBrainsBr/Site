import {
  AnimatedSection,
  StrapiImage,
} from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString, IStrapiMedia } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

interface Properties {
  content: HTMLString
  image: IStrapiMedia
  imageAlignLeft: boolean
}

const BlockMediaText: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  const { content, image, imageAlignLeft, anchor } = blockData

  return (
    <AnimatedSection
      name="block-media-text"
      anchor={anchor}
      spacing="padding"
      distance="small"
      className="lg:h-[74.52vh] lg:min-h-[39.125rem]"
    >
      <div className="relative lg:h-full lg:flex lg:items-center">
        <div className="container grid grid-cols-1 lg:grid-cols-12 pb-10 lg:pb-0">
          {content && (
            <div
              className={twMerge(
                'cms-rich-text lg:col-span-5',
                imageAlignLeft ? 'lg:col-start-8' : 'lg:col-start-1',
                animate()
              )}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
        {image && (
          <StrapiImage
            image={image}
            className={twMerge(
              'lg:absolute lg:top-0 h-[16.875rem] lg:h-full lg:w-[49.31vw] object-cover rounded-t-3xl',
              imageAlignLeft
                ? 'lg:left-0 lg:rounded-r-3xl lg:rounded-l-none'
                : 'lg:right-0 lg:rounded-l-3xl lg:rounded-r-none'
            )}
          />
        )}
      </div>
    </AnimatedSection>
  )
}

export default BlockMediaText
