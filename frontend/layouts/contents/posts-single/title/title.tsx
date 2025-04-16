import {
  AnimatedSection,
  StrapiImageResponsive,
} from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IResponsiveImage } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

interface Properties {
  title: string
  description: string
  // tags: string[]
  featuredImage: IResponsiveImage
}

const Title: React.FC<Properties> = ({
  description,
  // tags,
  title,
  featuredImage,
}) => {
  return (
    <AnimatedSection
      name="block-post-hero"
      spacing="padding"
      distance="small"
      className={twMerge(
        'relative min-h-[31.25rem] lg:h-[47.62vh] lg:min-h-[25rem] flex flex-col justify-end overflow-hidden'
      )}
    >
      <span className="absolute z-10 block top-0 left-0 w-full h-full bg-gradient-to-t lg:bg-gradient-to-r from-[#00000093] to-transparent" />
      {featuredImage && (
        <StrapiImageResponsive
          components={featuredImage}
          className="absolute top-0 left-0 w-full h-full object-cover object-center"
        />
      )}
      <div className="container grid grid-cols-1 lg:grid-cols-12">
        <div
          className={twMerge(
            'relative z-10 lg:col-span-6 lg:col-start-3 flex flex-col gap-5 lg:gap-10 text-white'
          )}
        >
          {/* {tags.length > 0 && (
            <div
              className={animate({
                className:
                  'mb-1 md:mb-3 flex items-center gap-x-2 gap-y-1 flex-wrap',
              })}
            >
              {tags.map((tag, index) => (
                <span key={index}>{tag}</span>
              ))}
            </div>
          )} */}
          <h1
            className={animate({
              className: 'font-light heading-5xl lg:max-w-[44.44vw]',
            })}
          >
            {title}
          </h1>
          {description && (
            <div>
              <span className="block w-[2.625rem] h-[0.125rem] bg-current mb-3" />
              <p
                className={twMerge(
                  'lg:max-w-[29.17vw] heading-2xl',
                  animate({ index: 1 })
                )}
              >
                {description}
              </p>
            </div>
          )}
        </div>
      </div>
    </AnimatedSection>
  )
}

export default Title
