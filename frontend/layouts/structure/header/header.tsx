/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client'

import { Link } from '@futurebrand/helpers-nextjs/components'
import { onScroll } from '@futurebrand/helpers-nextjs/utils'
import type { IHeaderStructure } from '@futurebrand/types/global-options'
import React, { useCallback, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import ProjectLogo from '~/components/project-logo'
import useThemeControl from '~/hooks/use-header-control'

import Hamburger from './hamburger'
import NavMenu from './nav-menu'

interface Props extends IHeaderStructure {
  locale: string
}

const Header: React.FC<Props> = ({ headerMenu, contactLink, locale }) => {
  const { themeColor } = useThemeControl()
  const [isMenuActive, setIsMenuActive] = useState<boolean>(false)
  const [isDropdownActive, setIsDropdownActive] = useState<boolean>(false)
  const [isScrolled, setIsScrolled] = useState<boolean>(false)

  useEffect(() => {
    return onScroll((scrollPosition) => {
      scrollPosition > 0 ? setIsScrolled(true) : setIsScrolled(false)
    })
  }, [])

  const closeMenu = useCallback(() => {
    setIsMenuActive(false)
  }, [])

  const headerSettings = () => {
    switch (themeColor) {
      case 'blue-400':
        return {
          logo: 'logo-blue-400',
          accent: 'midnight-950',
          cta: 'midnight',
        }
      case 'green-400':
        return {
          logo: 'logo-green-400',
          accent: 'midnight-950',
          cta: 'midnight',
        }
      case 'lime-400':
        return {
          logo: 'logo-lime-400',
          accent: 'white',
          cta: 'lime',
        }
      case 'violet-400':
        return {
          logo: 'logo-violet-400',
          accent: 'midnight-950',
          cta: 'midnight',
        }
      case 'midnight-950':
        return {
          logo: 'logo-midnight-950',
          accent: 'midnight-950',
          cta: 'midnight',
        }
    }
  }

  return (
    <header
      className={twMerge(
        'dark sticky z-50 top-0 left-0 h-20 lg:h-[5.625rem] w-full duration-200',
        isScrolled
          ? themeColor !== 'lime-400'
            ? 'bg-gray-light'
            : 'bg-midnight-950'
          : 'bg-transparent',
        isDropdownActive && 'bg-gray-light'
      )}
    >
      <div className="container h-full flex items-center justify-between">
        <Link
          key={'header-logo'}
          href="/"
          aria-label="Home"
          locale={locale}
          name="header-logo"
          className="mr-auto lg:z-40 pr-8 transition-opacity hover:opacity-80"
        >
          <ProjectLogo
            variant="header"
            name={
              isDropdownActive ? 'logo-midnight-950' : headerSettings().logo
            }
          />
        </Link>
        <Hamburger
          isMenuActive={isMenuActive}
          setIsMenuActive={setIsMenuActive}
          className="lg:hidden"
          headerSettings={headerSettings}
        />
        <NavMenu
          isMenuActive={isMenuActive}
          closeMenu={closeMenu}
          headerMenu={headerMenu}
          contactLink={contactLink}
          headerSettings={headerSettings}
          isDropdownActive={isDropdownActive}
          setIsDropdownActive={setIsDropdownActive}
        />
      </div>
    </header>
  )
}

export default Header
