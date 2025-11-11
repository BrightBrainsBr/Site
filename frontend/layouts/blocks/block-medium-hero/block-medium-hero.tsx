import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString } from '@futurebrand/types/strapi'
import Image from 'next/image'
import React from 'react'
import { twMerge } from 'tailwind-merge'

interface Properties {
  title: string
  content: HTMLString
  bgColor: string
}

const BlockMediumHero: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  const { bgColor = 'light', content, title, anchor } = blockData

  return (
    <AnimatedSection
      name="block-medium-hero"
      anchor={anchor}
      spacing="none"
      className={twMerge(
        'relative h-[22rem] lg:h-[45vh] lg:min-h-[28rem] flex flex-col justify-center lg:justify-start overflow-hidden',
        bgColor !== 'light'
          ? 'bg-midnight-950'
          : 'bg-gradient-to-b from-[#ffffffc9] to-transparent'
      )}
    >
      {bgColor !== 'light' && (
        <Image
          src="/graphism-neuro.svg"
          className="absolute top-1/2 -translate-y-1/2 left-0 w-auto lg:w-full h-full lg:h-auto object-cover lg:object-contain opacity-30"
          width="1920"
          height="1242"
          alt="graphism-neuro"
        />
      )}
      <div className="container grid grid-cols-1 lg:grid-cols-12 lg:pt-[20vh]">
        <div
          className={twMerge(
            'relative z-10 lg:col-span-6 lg:col-start-3 flex flex-col gap-5 lg:gap-10',
            bgColor !== 'light' ? 'text-lime-400' : 'text-midnight-950'
          )}
        >
          {title && (
            <h1
              className={twMerge(
                'heading-5xl lg:heading-6xl font-light',
                animate()
              )}
            >
              {title}
            </h1>
          )}
          {content && (
            <div
              className={twMerge(
                'lg:max-w-[29.17vw] flex flex-col gap-3',
                animate({ index: 1 })
              )}
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

export default BlockMediumHero
