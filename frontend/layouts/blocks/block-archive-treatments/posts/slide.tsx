import { Link, StrapiImage } from '@futurebrand/helpers-nextjs/components'
import type { ITreatmentCard } from '@futurebrand/types/contents'
import React from 'react'

interface Properties {
  data: ITreatmentCard
}

const Slide: React.FC<Properties> = ({ data }) => {
  const { title, excerpt, path, featuredImage } = data

  return (
    <article>
      <Link
        href={path}
        name="treatment-card"
        className="relative flex flex-col justify-end h-[18.75rem] overflow-hidden rounded-[1.25rem] p-6"
      >
        <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-[#091930F2] to-[#09193015] z-10 opacity-100 duration-300 transition-all group-hover:opacity-50" />
        {featuredImage && (
          <StrapiImage
            className="absolute top-0 left-0 w-full h-full object-cover"
            image={featuredImage}
          />
        )}
        {title && (
          <h3 className="relative z-10 heading-4xl text-white">
            {title
              .replace(/tratamento/gi, '')
              .replace(/\s+/g, ' ')
              .trim()}
          </h3>
        )}
        {excerpt && (
          <div
            className="relative z-10 cms-rich-text hidden group-hover:block group-hover:animate-fadein opacity-0 text-white"
            dangerouslySetInnerHTML={{
              __html: excerpt,
            }}
          />
        )}
      </Link>
    </article>
  )
}

export default Slide
