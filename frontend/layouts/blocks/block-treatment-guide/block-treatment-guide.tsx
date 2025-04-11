/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString } from '@futurebrand/types/strapi'
import Image from 'next/image'
import React from 'react'
import { twMerge } from 'tailwind-merge'
import { tv } from 'tailwind-variants'

interface IStep {
  content: HTMLString
}

interface Properties {
  content: HTMLString
  steps: IStep[]
  accent: string
}

const accentVariant = tv({
  variants: {
    color: {
      'blue-400': 'text-blue-400',
      'green-400': 'text-green-400',
      'violet-400': 'text-violet-400',
    },
  },
})

const BlockTreatmentGuide: React.FC<IBlockProps<Properties>> = ({
  blockData,
}) => {
  const { steps, content, accent = 'green-400', anchor } = blockData

  return (
    <AnimatedSection
      name="block-neuro-types"
      anchor={anchor}
      spacing="padding"
      distance="small"
      className="relative bg-midnight-950 overflow-hidden"
    >
      <Image
        src="/graphism-neuro.png"
        className="absolute top-0 left-0 w-auto lg:w-full h-full lg:h-auto object-cover object-left lg:object-center lg:object-contain opacity-30"
        width="1920"
        height="1242"
        alt="graphism-neuro"
      />
      <div className="relative z-10 container flex flex-col gap-10">
        {content && (
          <div className={animate()}>
            <span
              className={twMerge(
                'block w-[2.625rem] h-[0.125rem] bg-current mb-2',
                accentVariant({ color: accent as any })
              )}
            />
            <div
              className="cms-rich-text lg:max-w-[42.5vw] 2xl:max-w-[32.89vw]"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
        {steps.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {steps.map((card, index) => (
              <div
                key={`card-${index}`}
                className={twMerge(
                  'px-4 py-10 lg:px-10 lg:py-[3.75rem] border border-current rounded-lg bg-midnight-950',
                  accentVariant({ color: accent as any }),
                  animate({ index: index + 1 })
                )}
              >
                {card.content && (
                  <div
                    className="cms-rich-text"
                    dangerouslySetInnerHTML={{ __html: card.content }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AnimatedSection>
  )
}

export default BlockTreatmentGuide
