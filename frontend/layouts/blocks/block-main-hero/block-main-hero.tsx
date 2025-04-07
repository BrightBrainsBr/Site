import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString, IStrapiLinkButton } from '@futurebrand/types/strapi'
import React from 'react'

import SliderContent from './slider-content'

export interface ISlide {
  title: string
  content: HTMLString
  cta: IStrapiLinkButton
}

interface Properties {
  slides: ISlide[]
}

const BlockMainHero: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  const { slides, anchor } = blockData

  if (!slides || slides.length === 0) return null

  return (
    <AnimatedSection
      name="block-main-hero"
      anchor={anchor}
      spacing="none"
      className="overflow-hidden"
    >
      <SliderContent data={slides} />
    </AnimatedSection>
  )
}

export default BlockMainHero
