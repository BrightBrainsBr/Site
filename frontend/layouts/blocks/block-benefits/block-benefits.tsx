import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { IStrapiMedia } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import SliderContent from './slider-content'

export interface IBenefit {
  title: string
  description: string
  image: IStrapiMedia
}

interface Properties {
  title: string
  benefits: IBenefit[]
}

const BlockBenefits: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  const { benefits, title, anchor } = blockData

  return (
    <AnimatedSection
      name="block-benefits"
      anchor={anchor}
      spacing="padding"
      distance="small"
      className="overflow-hidden bg-gray-light"
    >
      <div className="container">
        {title && (
          <h2
            className={twMerge(
              'heading-4xl text-midnight-950 mb-10',
              animate()
            )}
          >
            {title}
          </h2>
        )}
        <SliderContent data={benefits} />
      </div>
    </AnimatedSection>
  )
}

export default BlockBenefits
