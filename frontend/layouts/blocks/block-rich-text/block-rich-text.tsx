import { RichText } from '@futurebrand/components'
import { AnimatedSection } from '@futurebrand/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import { type IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString } from '@futurebrand/types/strapi'
import React from 'react'

interface Properties {
  content: HTMLString
}

const BlockRichText: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  const { content, anchor } = blockData

  return (
    <AnimatedSection
      name="block-rich-text"
      anchor={anchor}
      spacing="padding"
      distance="small"
      className="bg-gradient-to-b from-gray-light from-80% to-transparent"
    >
      <div className={animate({ className: 'container-small' })}>
        <RichText html={content} />
      </div>
    </AnimatedSection>
  )
}

export default BlockRichText
