import { StrapiImageResponsive } from '@futurebrand/components'
import { AnimatedSection } from '@futurebrand/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import { type IBlockProps } from '@futurebrand/types/contents'
import type { IResponsiveImage } from '@futurebrand/types/strapi'
import React from 'react'

interface Properties {
  image: IResponsiveImage
}

const BlockPostImage: React.FC<IBlockProps<Properties>> = ({
  blockData,
  lcp,
}) => {
  return (
    <AnimatedSection
      name="block-post-image"
      anchor={blockData.anchor}
      spacing="none"
      Tag="div"
    >
      <div
        className={animate({
          className: 'container-small flex items-center justify-center',
        })}
      >
        <StrapiImageResponsive
          components={blockData.image}
          className="w-full card object-cover object-center aspect-[1.5] md:aspect-[2]"
          priority={lcp}
        />
      </div>
    </AnimatedSection>
  )
}

export default BlockPostImage
