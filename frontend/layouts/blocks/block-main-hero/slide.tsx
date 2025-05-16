import { animate } from '@futurebrand/helpers-nextjs/utils'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import CMSButton from '~/components/button/cms'

import type { ISlide } from './block-main-hero'

interface Properties {
  data: ISlide
}

const Slide: React.FC<Properties> = ({ data }) => {
  const { title, content, cta } = data

  return (
    <div className="flex flex-col gap-10 justify-center h-fit lg:h-[85.71vh] min-h-[43.75rem] lg:min-h-[45rem]">
      {title && (
        <h2
          className={twMerge(
            'heading-6xl text-midnight-950 font-light leading-[110%]',
            animate()
          )}
        >
          {title}
        </h2>
      )}
      {content && (
        <div
          className={twMerge(
            'cms-rich-text lg:max-w-[52.08vw]',
            animate({ index: 1 })
          )}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
      {cta && (
        <CMSButton
          className={twMerge('w-fit', animate({ index: 2 }))}
          attributes={cta}
        />
      )}
    </div>
  )
}

export default Slide
