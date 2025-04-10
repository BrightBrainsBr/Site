import { AnimatedSection } from '@futurebrand/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import React from 'react'

interface Props {
  title: string
  description: string
  // tags: string[]
}

const title: React.FC<Props> = ({ description, title }) => {
  let animationIndex = 0

  return (
    <AnimatedSection name="news-title" firstElement>
      <div className="flex flex-col gap-4 container-small">
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
            index: ++animationIndex,
            className: 'font-extralight text-3xl md:text-6.5xl text-blue-light',
          })}
        >
          {title}
        </h1>
        {description && (
          <p
            className={animate({ index: ++animationIndex })}
            style={{ maxWidth: '53.75rem' }}
          >
            {description}
          </p>
        )}
      </div>
    </AnimatedSection>
  )
}

export default title
