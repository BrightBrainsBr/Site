'use client'

import type { IFooterOptions } from '@futurebrand/types/global-options'
import React from 'react'

import ProjectLogo from '~/components/project-logo'
import useThemeControl from '~/hooks/use-header-control'

import NavMenu from './nav-menu'

interface Props extends IFooterOptions {
  locale: string
}

const Footer: React.FC<Props> = ({
  legalText,
  socialLink,
  address,
  footerMenu,
  techResponsible,
}) => {
  const { themeColor } = useThemeControl()

  const footerSettings = () => {
    switch (themeColor) {
      case 'blue-400':
        return {
          logo: 'logo-blue-400',
        }
      case 'green-400':
        return {
          logo: 'logo-green-400',
        }
      case 'lime-400':
        return {
          logo: 'logo-lime-400',
        }
      case 'violet-400':
        return {
          logo: 'logo-violet-400',
        }
      case 'midnight-950':
        return {
          logo: 'logo-midnight-950',
        }
    }
  }

  return (
    <footer>
      <div className="container grid grid-cols-1 lg:grid-cols-12 gap-5 pb-8 lg:pb-16">
        <picture className="flex lg:items-end lg:col-span-8">
          <ProjectLogo
            name={
              themeColor === 'lime-400'
                ? 'logo-lime-dark'
                : footerSettings().logo
            }
            variant="footer"
          />
        </picture>
        <NavMenu
          footerMenu={footerMenu}
          socialLink={socialLink}
          themeColor={themeColor}
          className="hidden lg:flex"
        />
      </div>
      <div className="bg-midnight-950 text-white py-8 lg:py-5">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-5">
          <NavMenu
            footerMenu={footerMenu}
            socialLink={socialLink}
            className="lg:hidden"
          />
          <span className="block lg:hidden w-full h-[0.0625rem] bg-white" />
          {address && (
            <div
              className="cms-rich-text lg:col-span-2"
              dangerouslySetInnerHTML={{ __html: address }}
            />
          )}
          {legalText && (
            <p className="lg:col-span-2 lg:col-start-6 lg:flex lg:items-center lg:justify-center">
              {legalText}
            </p>
          )}
          {techResponsible && (
            <div
              className="cms-rich-text lg:text-right lg:col-span-2 lg:col-start-11"
              dangerouslySetInnerHTML={{ __html: techResponsible }}
            />
          )}
        </div>
      </div>
    </footer>
  )
}

export default Footer
