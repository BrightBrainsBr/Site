import { StrapiImageResponsive } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import type { ISlide } from './block-image-slider'

interface Properties {
  data: ISlide
}

const Slide: React.FC<Properties> = ({ data }) => {
  const { content, image } = data

  return (
    <div className="h-[37.5rem] lg:h-[85.71vh] lg:min-h-[45rem] flex items-end lg:items-center pb-20 lg:pb-0">
      <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-t lg:bg-gradient-to-r from-[#00000096] lg:from-[#00000050] to-[#09193015] z-10 opacity-100 duration-300 transition-all group-hover:opacity-50" />
      {image && (
        <StrapiImageResponsive
          className="absolute top-0 left-0 w-full h-full object-cover"
          components={image}
        />
      )}
      {content && (
        <div className="container-small grid grid-cols-1 lg:grid-cols-10">
          <div
            className={twMerge(
              'lg:col-span-3 relative z-10 cms-rich-text text-white',
              animate({ index: 1 })
            )}
            dangerouslySetInnerHTML={{
              __html: content,
            }}
          />
        </div>
      )}
    </div>
  )
}

export default Slide
