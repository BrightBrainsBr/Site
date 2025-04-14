'use client'

import {
  AnimatedSection,
  Link,
  StrapiImage,
} from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString, IStrapiMedia } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import { ReactComponent as Linkedin } from '~/assets/icons/linkedin.svg'
import { ReactComponent as Phone } from '~/assets/icons/phone.svg'

import SliderContent from './slider-content'

export interface IPeople {
  title: string
  excerpt: string
  role: string
  activity: string
  linkedin: string
  phone: string
  image: IStrapiMedia
}

interface Properties {
  content: HTMLString
  team: IPeople[]
}

const BlockTeam: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  const { content, team, anchor } = blockData
  const partners = team
    .filter((partner) => partner.role === 'partner')
    .slice(0, 2)
  const doctors = team.filter((doctor) => doctor.role === 'doctor').slice(0, 3)

  return (
    <AnimatedSection
      name="block-team"
      anchor={anchor}
      spacing="padding"
      distance="small"
      className="bg-midnight-950 overflow-hidden"
    >
      <div className="container flex flex-col gap-5 lg:gap-10">
        {content && (
          <div className={animate()}>
            <span className="block w-[2.625rem] h-[0.125rem] bg-current mb-2 text-lime-400" />
            <div
              className="cms-rich-text lg:max-w-[42.5vw] 2xl:max-w-[32.89vw]"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
        {partners.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {partners.map((partner, index) => (
              <div
                key={`partner-${index}`}
                className={twMerge(
                  'relative h-[33.5rem] lg:h-[63.81vh] lg:min-h-[33.5rem] overflow-hidden rounded-2xl',
                  animate({ index: index + 1 })
                )}
              >
                {partner.image && (
                  <StrapiImage
                    className="absolute top-0 left-0 w-full h-full object-cover object-top"
                    image={partner.image}
                  />
                )}
                <div className="relative z-10 w-full h-full flex flex-col justify-end gap-6 bg-gradient-to-t from-[#00000067] to-transparent text-white p-6">
                  {partner.title && (
                    <h3 className="heading-3xl">{partner.title}</h3>
                  )}
                  {partner.excerpt && (
                    <p className="lg:max-w-[37.22vw] text-sm font-light">
                      {partner.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    {partner.linkedin && (
                      <Link name="linkedin-link" href={partner.linkedin} blank>
                        <Linkedin className="w-6 h-6" />
                      </Link>
                    )}
                    {partner.phone && (
                      <Link
                        name="phone-link"
                        href={`tel:${partner.phone}`}
                        blank
                      >
                        <Phone className="w-6 h-6" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {doctors.length > 0 && <SliderContent data={doctors} />}
      </div>
    </AnimatedSection>
  )
}

export default BlockTeam
