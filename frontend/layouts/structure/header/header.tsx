'use client'

import { Link } from '@futurebrand/helpers-nextjs/components'
import type {
  IHeaderStructure,
} from '@futurebrand/types/global-options'
import React, { useState } from 'react'

import NavMenu from './nav-menu'
import Hamburger from './hamburger'
import useHeaderControl from '~/hooks/use-header-control'
import HeaderLogo from '~/components/header-logo'

interface Props extends IHeaderStructure {
  locale: string
}

const Header: React.FC<Props> = ({
  headerMenu,
  contactLink,
  locale,
}) => {
  const { headerColor } = useHeaderControl()
  const [isMenuActive, setIsMenuActive] = useState<boolean>(false)

  const headerSettings = () => {
    switch (headerColor) {
      case 'blue-400':
        return {
          logo: 'logo-blue-400',
          accent:	'midnight-950',
          cta: 'midnight',
        }
      case 'green-400':
        return {
          logo: 'logo-green-400',
          accent:	'midnight-950',
          cta: 'midnight',
        }
      case 'lime-400':
        return {
          logo: 'logo-lime-400',
          accent:	'white',
          cta: 'lime',
        }
      case 'violet-400':
        return {
          logo: 'logo-violet-400',
          accent:	'midnight-950',
          cta: 'midnight',
        }
      case 'midnight-950':
        return {
          logo: 'logo-mignight-950',
          accent:	'midnight-950',
          cta: 'midnight',
        }
    }
  }

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
          <HeaderLogo name={headerSettings().logo} />
        </Link>
        <Hamburger isMenuActive={isMenuActive} setIsMenuActive={setIsMenuActive} className='lg:hidden' headerSettings={headerSettings} />
        <NavMenu isMenuActive={isMenuActive} headerMenu={headerMenu} contactLink={contactLink} headerSettings={headerSettings} />
      </div>
    </header>
  )
}

export default Header
