import { animate } from '@futurebrand/helpers-nextjs/utils'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import type { ISlide } from './block-depositions'

interface Properties {
  data: ISlide
}

const Slide: React.FC<Properties> = ({ data }) => {
  const { content } = data

  return (
    <div className="h-fit lg:h-[36.67vh] lg:min-h-[19.25rem] flex items-end lg:items-center py-20 lg:p-0">
      {content && (
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div
            className={twMerge(
              'lg:col-span-6 lg:col-start-4 relative text-center cms-rich-text text-midnight-950',
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
