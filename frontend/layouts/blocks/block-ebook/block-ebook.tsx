import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import EbookCard from './ebook-card'
import { EBOOKS } from './ebook-data'

interface Properties {
  title?: string
  description?: HTMLString
}

const BlockEbook: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  const { title, description, anchor } = blockData

  return (
    <AnimatedSection
      name="block-ebook"
      anchor={anchor}
      spacing="padding"
      distance="small"
      className=" from-gray-light from-40% to-transparent"
    >
      <div className="container flex flex-col gap-10">
        {(title || description) && (
          <div className={twMerge('text-midnight-950', animate())}>
            {title && (
              <>
                <span className="block w-[2.625rem] h-[0.125rem] bg-current mb-2" />
                <h2 className="heading-4xl mb-4">{title}</h2>
              </>
            )}
            {description && (
              <div
                className="cms-rich-text max-w-[50ch]"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {EBOOKS.map((ebook, index) => (
            <EbookCard key={ebook.id} ebook={ebook} index={index + 1} />
          ))}
        </div>
      </div>
    </AnimatedSection>
  )
}

export default BlockEbook
