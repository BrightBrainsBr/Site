import { Link, StrapiImage } from '@futurebrand/helpers-nextjs/components'
import type { IPostCard } from '@futurebrand/types/contents'
import React from 'react'

interface Properties {
  locale: string
  data: IPostCard
}

const Slide: React.FC<Properties> = ({ data }) => {
  const { excerpt, path, title, featuredImage } = data

  return (
    <article className="group block">
      <Link
        name="Post link"
        href={path}
        className="block relative min-h-[44.52vh] bg-[#EAF1F2] overflow-hidden rounded-2xl"
      >
        {featuredImage && (
          <picture className="block w-full h-[11rem] lg:h-[20.95vh] lg:min-h-[11rem] overflow-hidden">
            <StrapiImage
              image={featuredImage.mobile}
              className="w-full h-full object-cover transition-all duration-200 group-hover:scale-110"
            />
          </picture>
        )}
        <div className="flex flex-col gap-5 text-primary-indigo px-6 pt-6 pb-10 min-h-[13rem] lg:min-h-[23.57vh]">
          {title && <h3 className="heading-2xl">{title}</h3>}
          {excerpt && (
            <p className="text-xs text-ellipsis line-clamp-2 font-light">
              {excerpt}
            </p>
          )}
          <span className="font-bold">Leia mais</span>
        </div>
      </Link>
    </article>
  )
}

export default Slide
