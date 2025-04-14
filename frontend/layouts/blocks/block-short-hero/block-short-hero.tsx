import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString } from '@futurebrand/types/strapi'
import Image from 'next/image'
import React from 'react'
import { twMerge } from 'tailwind-merge'

interface Properties {
  content: HTMLString
}

const BlockShortHero: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  const { content, anchor } = blockData

  return (
    <AnimatedSection
      name="block-short-hero"
      anchor={anchor}
      spacing="padding"
      distance="small"
      className={twMerge(
        'relative min-h-[18.75rem] lg:h-[47.62vh] lg:min-h-[25rem] flex flex-col justify-end overflow-hidden bg-midnight-950'
      )}
    >
      <Image
        src="/graphism-neuro.png"
        className="absolute top-0 left-0 w-auto lg:w-full h-full lg:h-auto object-cover object-center lg:object-contain opacity-30"
        width="1920"
        height="1242"
        alt="graphism-neuro"
      />
      <div className="container grid grid-cols-1 lg:grid-cols-12">
        <div
          className={twMerge(
            'relative z-10 lg:col-span-6 lg:col-start-3 flex flex-col gap-5 lg:gap-10 text-lime-400'
          )}
        >
          {content && (
            <div
              className={twMerge('flex flex-col gap-3', animate({ index: 1 }))}
            >
              <span className="block w-[2.625rem] h-[0.125rem] bg-current" />
              <div
                className="cms-rich-text"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          )}
        </div>
      </div>
    </AnimatedSection>
  )
}

export default BlockShortHero
