import { RichText } from '@futurebrand/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import { type IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString } from '@futurebrand/types/strapi'
import React from 'react'

import { AnimatedSection } from '@futurebrand/components'

interface Properties {
  content: HTMLString
}

const BlockSimplePageHero: React.FC<IBlockProps<Properties>> = ({
  blockData,
}) => {
  return (
    <AnimatedSection
      name="block-posts-text"
      anchor={blockData.anchor}
      distance="small"
      Tag="div"
    >
      <div className={animate({ className: 'container-small' })}>
        <RichText html={blockData.content} />
      </div>
    </AnimatedSection>
  )
}

export default BlockSimplePageHero
