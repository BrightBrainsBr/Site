import { AnimatedSection, Link, StrapiTitle } from '@futurebrand/components'
import { getGlobalData } from '@futurebrand/helpers-nextjs/hooks'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import { getLocale } from 'next-intl/server'
import React from 'react'

import Main from '~/layouts/structure/main'

const NotFoundLayout: React.FC = async () => {
  const locale = await getLocale()
  const { options } = await getGlobalData(locale)

  const data = options.notFound

  let animationIndex = 0

  return (
    <Main className="flex items-center">
      <AnimatedSection
        name="page-not-found"
        spacing="none"
        className="min-h-screen pt-20 dark relative z-auto"
        firstElement
      >
        <div className="relative z-20 container-small flex flex-col gap-5 md:gap-8 py-14 lg:py-24">
          {data.title && (
            <StrapiTitle
              component={data.title}
              className={animate({
                className: `text-4xl md:text-5xl lg:text-6xl font-extralight text-balance text-blue-light`,
                index: animationIndex++,
              })}
              style={{
                maxWidth: '40rem',
              }}
            />
          )}
          {data.description && (
            <p
              className={animate({
                className: 'text-base',
                index: animationIndex++,
              })}
              style={{ maxWidth: '40rem' }}
            >
              {data.description}
            </p>
          )}
          <div
            className={animate({ className: 'mt-10', index: animationIndex++ })}
          >
            <Link name="not-found-back" href="/">
              {options.dictionary.goBack}
            </Link>
          </div>
        </div>
      </AnimatedSection>
    </Main>
  )
}

export default NotFoundLayout
