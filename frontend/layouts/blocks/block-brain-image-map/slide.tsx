/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { twMerge } from 'tailwind-merge'

import type { ISymptom } from './block-brain-image-map'
import { colorVariant } from './image-map'

interface Properties {
  data: ISymptom
  accent: string
}

const Slide: React.FC<Properties> = ({ accent, data }) => {
  return (
    <div
      className={twMerge(
        'border border-current rounded-lg px-4 py-5 flex flex-col gap-7 bg-white',
        colorVariant({ color: accent as any })
      )}
    >
      {data.title && <h3 className="heading-3xl">{data.title}</h3>}
      {data.description && (
        <p className="text-midnight-950">{data.description}</p>
      )}
    </div>
  )
}

export default Slide
