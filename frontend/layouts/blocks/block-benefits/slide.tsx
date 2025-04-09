import { StrapiImage } from '@futurebrand/helpers-nextjs/components'
import React from 'react'

import type { IBenefit } from './block-benefits'

interface Properties {
  data: IBenefit
}

const Slide: React.FC<Properties> = ({ data }) => {
  const { title, description, image } = data

  return (
    <div>
      {image && (
        <picture className="block lg:h-[21.43vh] lg:min-h-[11.25rem] rounded-3xl overflow-hidden mb-5 lg:mb-10">
          <StrapiImage className="w-full h-full object-cover" image={image} />
        </picture>
      )}
      {title && (
        <h3 className="relative z-10 heading-2xl text-midnight-950 mb-4">
          {title}
        </h3>
      )}
      {description && <p className="text-midnight-950">{description}</p>}
    </div>
  )
}

export default Slide
