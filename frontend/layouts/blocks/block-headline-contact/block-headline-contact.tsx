import {
  AnimatedSection,
  StrapiImageResponsive,
} from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type {
  HTMLString,
  IResponsiveImage,
  IStrapiLinkButton,
} from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import CMSButton from '~/components/button/cms'

interface Properties {
  content: HTMLString
  image: IResponsiveImage
  cta: IStrapiLinkButton
}

const BlockHeadlineContact: React.FC<IBlockProps<Properties>> = ({
  blockData,
}) => {
  const { content, cta, image, anchor } = blockData

  return (
    <AnimatedSection
      name="block-headline-contact"
      anchor={anchor}
      spacing="padding"
      distance="small"
      className="h-[30rem] lg:h-[57.14vh] lg:min-h-[30rem] bg-gradient-to-t from-transparent from-40% to-gray-light"
    >
      <div className="container h-full">
        <div className="relative rounded-3xl overflow-hidden h-full p-5 lg:p-0 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {image && (
            <StrapiImageResponsive
              components={image}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          )}
          <div className="relative z-10 lg:col-span-10 lg:col-start-2 flex flex-col justify-end lg:justify-center gap-6 h-full">
            {content && (
              <div
                className={twMerge(
                  'cms-rich-text lg:max-w-[32.5vw]',
                  animate()
                )}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}
            {cta && (
              <CMSButton
                attributes={cta}
                className={twMerge('w-fit', animate({ index: 1 }))}
              />
            )}
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

export default BlockHeadlineContact
