import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import ImageMap from './image-map'
import SliderContent from './slider-content'

export interface ISymptom {
  title: string
  description: string
}

interface Properties {
  content: HTMLString
  symptoms: ISymptom[]
  accent: string
}

const BlockBrainImageMap: React.FC<IBlockProps<Properties>> = ({
  blockData,
}) => {
  const { accent, content, symptoms, anchor } = blockData

  return (
    <AnimatedSection
      name="block-brain-image-map"
      anchor={anchor}
      spacing="padding"
      distance="small"
      className="!z-20 bg-gradient-to-t from-transparent to-gray-light to-70% overflow-hidden lg:overflow-visible"
    >
      <div className="container grid grid-cols-1 lg:grid-cols-12 gap-5">
        {content && (
          <div className={twMerge('lg:col-span-3', animate())}>
            <span className="block w-[2.625rem] h-[0.125rem] bg-current mb-2 text-midnight-950" />
            <div
              className="cms-rich-text lg:max-w-[42.5vw] 2xl:max-w-[32.89vw]"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
        <SliderContent accent={accent} data={symptoms} />
        <ImageMap accent={accent} data={symptoms} />
      </div>
    </AnimatedSection>
  )
}

export default BlockBrainImageMap
