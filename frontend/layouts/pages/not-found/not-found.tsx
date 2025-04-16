import { AnimatedSection, StrapiTitle } from '@futurebrand/components'
import { getGlobalData } from '@futurebrand/helpers-nextjs/hooks'
import { getLocale } from 'next-intl/server'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import CMSButton from '~/components/button/cms'
import Main from '~/layouts/structure/main'

const NotFoundLayout: React.FC = async () => {
  const locale = await getLocale()
  const { options } = await getGlobalData(locale)

  const data = options.notFound

  return (
    <Main className="flex items-center" themeVariant="midnight-950">
      <AnimatedSection
        name="page-not-found"
        spacing="none"
        className="h-screen pt-[5.625rem] relative z-auto bg-gradient-to-b from-gray-light from-60% to-transparent"
        firstElement
      >
        <div className="container-small grid grid-cols-1 lg:grid-cols-10 h-full">
          <div className="lg:col-span-8 lg:col-start-2 flex flex-col justify-center gap-5 lg:gap-10 h-full">
            {data.title && (
              <StrapiTitle
                component={data.title}
                className={twMerge(
                  'heading-6xl lg:max-w-[38.06vw] opacity-0 animate-fadein'
                )}
              />
            )}
            {data.description && (
              <div className="text-midnight-950 opacity-0 animate-fadein">
                <span className="block w-[2.625rem] h-[0.125rem] bg-current mb-2" />
                <p className="heading-2xl font-light !leading-tight">
                  {data.description}
                </p>
              </div>
            )}
            <div className={twMerge('opacity-0 animate-fadein')}>
              <CMSButton
                className="w-fit"
                attributes={{
                  text: options.dictionary.goBack,
                  url: '/',
                  variant: 'midnight-950',
                  id: 6485,
                }}
              />
            </div>
          </div>
        </div>
      </AnimatedSection>
    </Main>
  )
}

export default NotFoundLayout
