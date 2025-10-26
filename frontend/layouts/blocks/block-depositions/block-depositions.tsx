import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString, IStrapiVideo } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import SliderContent from './slider-content'

export interface ISlide {
  content?: HTMLString // Mantido para compatibilidade com depoimentos antigos
  video?: IStrapiVideo // Novo campo para vídeo
  descriptionText?: string // Novo campo para texto descritivo
}

interface Properties {
  title: string
  depositions: ISlide[]
}

const BlockDepositions: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  const { depositions, title, anchor } = blockData

  // Limitar para mostrar apenas os 2 depoimentos mais recentes
  const limitedDepositions = depositions.slice(0, 2)

  return (
    <AnimatedSection
      name="block-depositions"
      anchor={anchor}
      spacing="padding"
      distance="small"
      className="bg-gray-light overflow-hidden"
    >
      <div className="container">
        {title && (
          <h2
            className={twMerge(
              'text-sm uppercase text-midnight-950 pb-5 lg:pb-[1.875rem] border-b',
              animate()
            )}
          >
            {title}
          </h2>
        )}
        <SliderContent data={limitedDepositions} />
      </div>
    </AnimatedSection>
  )
}

export default BlockDepositions
