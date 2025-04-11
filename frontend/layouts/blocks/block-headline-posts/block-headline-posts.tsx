import {
  AnimatedSection,
  StrapiImage,
} from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type {
  HTMLString,
  IStrapiLinkButton,
  IStrapiMedia,
} from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import CMSButton from '~/components/button/cms'

interface Properties {
  title: string
  contentOne: HTMLString
  ctaOne: IStrapiLinkButton
  imageOne: IStrapiMedia
  contentTwo: HTMLString
  ctaTwo: IStrapiLinkButton
  imageTwo: IStrapiMedia
}

const BlockHeadlinePosts: React.FC<IBlockProps<Properties>> = ({
  blockData,
}) => {
  const {
    contentOne,
    contentTwo,
    ctaOne,
    ctaTwo,
    imageOne,
    imageTwo,
    title,
    anchor,
  } = blockData

  return (
    <AnimatedSection
      name="block-headline-posts"
      anchor={anchor}
      distance="small"
      spacing="padding"
      className="bg-gray-light"
    >
      {title && (
        <div
          className={twMerge(
            'container text-midnight-950 mb-8 lg:mb-10',
            animate()
          )}
        >
          <span className="block w-[2.625rem] h-[0.125rem] bg-current mb-2" />
          <h2 className="heading-4xl">{title}</h2>
        </div>
      )}
      <div className="relative lg:h-[31.25rem] lg:min-h-[59.52vh] lg:flex lg:flex-col justify-center">
        {imageOne && (
          <StrapiImage
            image={imageOne}
            className="lg:w-[49.31vw] h-[13.125rem] lg:h-full lg:absolute top-0 left-0 object-cover lg:rounded-r-3xl"
          />
        )}
        <div className="container-small grid grid-cols-1 lg:grid-cols-12">
          <div
            className={twMerge(
              'lg:col-span-4 lg:col-start-8 flex flex-col gap-4 py-8 lg:py-0',
              animate({ index: 1 })
            )}
          >
            {contentOne && (
              <div
                className="cms-rich-text"
                dangerouslySetInnerHTML={{ __html: contentOne }}
              />
            )}
            {ctaOne && <CMSButton className="w-fit" attributes={ctaOne} />}
          </div>
        </div>
      </div>
      <div className="relative lg:h-[31.25rem] lg:min-h-[59.52vh] lg:flex lg:flex-col justify-center">
        {imageTwo && (
          <StrapiImage
            image={imageTwo}
            className="lg:w-[49.31vw] h-[13.125rem] lg:h-full lg:absolute top-0 right-0 object-cover lg:rounded-l-3xl"
          />
        )}
        <div className="container-small grid grid-cols-1 lg:grid-cols-12">
          <div
            className={twMerge(
              'lg:col-span-4 flex flex-col gap-4 py-8 lg:py-0',
              animate({ index: 2 })
            )}
          >
            {contentTwo && (
              <div
                className="cms-rich-text lg:col-span-4"
                dangerouslySetInnerHTML={{ __html: contentTwo }}
              />
            )}
            {ctaTwo && <CMSButton className="w-fit" attributes={ctaTwo} />}
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

export default BlockHeadlinePosts
