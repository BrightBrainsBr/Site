import { Link, StrapiImage } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IPostCard } from '@futurebrand/types/contents'
import React from 'react'

interface Props extends IPostCard {
  isAnimated?: boolean
  index: number
}

const PostCard: React.FC<Props> = ({
  isAnimated = true,
  animation,
  path,
  featuredImage,
  title,
  excerpt,
  index,
}) => {
  return (
    <Link
      name="news-media-cards-link"
      href={path}
      className={
        isAnimated
          ? animate({
              className:
                animation === false ? '' : 'animation-content-keyframe',
              index: animation === false ? 1 + index : animation,
            })
          : ''
      }
    >
      <article className="group card-group flex flex-col">
        <div
          className="relative rounded-md overflow-hidden w-full bg-white"
          style={{ height: '11.5625rem' }}
        >
          {featuredImage && (
            <StrapiImage
              image={featuredImage.mobile}
              className="absolute z-0 top-0 left-0 w-full h-full object-cover object-center"
            />
          )}
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <p className="text-xl font-medium transition-colors group-hover:text-current-primary">
            {title}
          </p>
          <p>{excerpt}</p>
        </div>
      </article>
    </Link>
  )
}

export default PostCard
