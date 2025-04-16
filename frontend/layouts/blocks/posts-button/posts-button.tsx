import { AnimatedSection } from '@futurebrand/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import { type IBlockProps } from '@futurebrand/types/contents'
import type { IStrapiLinkButton } from '@futurebrand/types/strapi'
import React from 'react'

import CMSButton from '~/components/button/cms/cms-button'

interface Properties {
  linkButton: IStrapiLinkButton
}

const BlockPostsButton: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  return (
    <AnimatedSection
      name="block-posts-button"
      anchor={blockData.anchor}
      spacing="none"
      Tag="div"
    >
      <div
        className={animate({
          className: 'container-small flex justify-center',
        })}
      >
        <CMSButton attributes={blockData.linkButton} />
      </div>
    </AnimatedSection>
  )
}

export default BlockPostsButton
