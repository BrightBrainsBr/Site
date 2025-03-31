'use client'

import { StrapiImage } from '@futurebrand/components'
import { Link } from '@futurebrand/helpers-nextjs/components'
import type {
  IHeaderStructure,
} from '@futurebrand/types/global-options'
import React, { useState } from 'react'

import NavMenu from './nav-menu'
import Hamburger from './hamburger'

interface Props extends IHeaderStructure {
  locale: string
}

const Header: React.FC<Props> = ({
  logo,
  headerMenu,
  contactLink,
  locale,
}) => {
  const [isMenuActive, setIsMenuActive] = useState<boolean>(false)

  return (
    <header className="dark sticky z-50 top-0 left-0 h-20 w-full">
      <div className="container h-full flex items-center justify-between">
        <Link
          key={'header-logo'}
          href='/'
          aria-label="Home"
          locale={locale}
          name="header-logo"
          className="mr-auto pr-8 transition-opacity hover:opacity-80"
        >
          <StrapiImage
            key={'header-logo-image'}
            image={logo}
            className="h-10 object-contain object-left"
            fetchPriority="high"
            priority
          />
        </Link>
        <Hamburger isMenuActive={isMenuActive} setIsMenuActive={setIsMenuActive} className='lg:hidden' />
        <NavMenu isMenuActive={isMenuActive} headerMenu={headerMenu} contactLink={contactLink} />
      </div>
    </header>
  )
}

export default Header
