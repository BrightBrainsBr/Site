import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString, IStrapiLinkButton } from '@futurebrand/types/strapi'
import React from 'react'

import SliderContent from './slider-content'
import Slide from './slide'

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
      lcp={slides.length === 1}
    >
      {slides.length === 1 ? (
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="col-span-full lg:col-span-8 lg:col-start-3 w-full block overflow-hidden relative">
            <Slide data={slides[0]} />
          </div>
        </div>
      ) : (
        <SliderContent data={slides} />
      )}
    </AnimatedSection>
  )
}

export default BlockMainHero
