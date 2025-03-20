import { AnimatedSection, StrapiTitle } from '@futurebrand/components'
import type { IBlockProps } from '@futurebrand/types/contents'
import type {
  HTMLString,
  IStrapiLinkButton,
  IStrapiMediaAttributes,
} from '@futurebrand/types/strapi'
import { animate } from '@futurebrand/utils'
import React from 'react'

import CMSButton from '~/components/button/cms'

import HeroBackground from './hero-background'

interface Properties {
  title: HTMLString
  description: string
  linkButton?: IStrapiLinkButton
  backgroundDesktop: IStrapiMediaAttributes
  backgroundMobile: IStrapiMediaAttributes
}

const BlockPageHero: React.FC<IBlockProps<Properties>> = async ({
  blockData,
  content,
  contentType,
  lcp,
}) => {
  let animationIndex = 0

  return (
    <AnimatedSection
      name="block-page-hero"
      anchor={blockData.anchor}
      firstElement={lcp}
      className="relative z-auto py-20"
      style={{
        minHeight: '40rem',
        height: 'calc(100vh - 3.5rem)',
      }}
      spacing="none"
    >
      <div className="relative translate-y-10 container z-20 text-left h-full flex flex-col justify-end gap-5 py-10 lg:py-20">
        <StrapiTitle
          component={blockData.title}
          className={animate(
            animationIndex++,
            'text-5xl md:text-6xl font-extralight text-balance max-w-[33.0625rem]'
          )}
        />
        {blockData.description && (
          <p
            className={animate({
              className: 'text-base max-w-[33.0625rem] animate-show',
              index: animationIndex++,
            })}
          >
            {blockData.description}
          </p>
        )}
        <div
          className={animate({
            className: 'flex flex-col lg:flex-row gap-5',
            index: animationIndex++,
          })}
        >
          {blockData.linkButton && (
            <CMSButton attributes={blockData.linkButton} />
          )}
        </div>
      </div>
      <HeroBackground media={blockData.backgroundMobile} isMobile />
      <HeroBackground media={blockData.backgroundDesktop} />
      <div
        className="absolute top-0 left-0 w-full h-full z-10"
        style={{
          background:
            'linear-gradient(360deg, rgba(27, 27, 27, 0.57) 0%, rgba(27, 27, 27, 0.42) 61.56%)',
        }}
      />
    </AnimatedSection>
  )
}

export default BlockPageHero
