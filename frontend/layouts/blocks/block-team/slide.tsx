import { StrapiImage } from '@futurebrand/helpers-nextjs/components'
import React from 'react'

import type { IPeople } from './block-team'

interface Properties {
  data: IPeople
}

const Slide: React.FC<Properties> = ({ data }) => {
  return (
    <div className="min-h-[21.375rem] overflow-hidden rounded-2xl bg-[#0E284D]">
      {data.image && (
        <picture className="h-[20.95vh] min-h-[11rem]">
          <StrapiImage
            className="w-full h-full object-cover object-top"
            image={data.image}
          />
        </picture>
      )}
      <div className="w-full flex flex-col justify-end gap-3 text-white p-6 pb-10">
        {data.activity && (
          <span className="block uppercase text-xs text-lime-400">
            {data.activity}
          </span>
        )}
        {data.title && <h3 className="heading-2xl">{data.title}</h3>}
        {data.excerpt && (
          <p className="lg:max-w-[37.22vw] font-light">{data.excerpt}</p>
        )}
      </div>
    </div>
  )
}

export default Slide
