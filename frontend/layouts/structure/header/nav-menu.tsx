import { IHeaderMenuItem } from '@futurebrand/types/global-options'
import { IStrapiCommonLink } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import { ReactComponent as Logo} from '~/assets/icons/logo-lite.svg'

interface Properties {
  headerMenu: IHeaderMenuItem[]
  contactLink: IStrapiCommonLink
  isMenuActive: boolean
}

const NavMenu: React.FC<Properties> = ({contactLink, headerMenu, isMenuActive}) => {
  return (
    <nav className={twMerge('fixed top-0 left-0 lg:static w-full lg:w-fit h-full lg:h-auto bg-lime-400 lg:bg-transparent transition-all duration-200 ease-out px-4 py-6', isMenuActive ? 'translate-0' : 'translate-x-full lg:translate-0')}>
      <ul className="flex flex-col lg:flex-row gap-5">
        <li className='lg:hidden'>
          <Logo className='w-10 h-10' />
        </li>
        {headerMenu.map((menuItem, index) => (
          <li key={index}>
            <a href={menuItem.item.url} className="text-midnight-950 lg:text-white hover:text-blue-600 text-[1.875rem] lg:text-base font-kmr">
              {menuItem.item.text}
            </a>
          </li>
        ))}
        <li>
          <a href={contactLink.url} className="text-midnight-950 lg:text-white hover:text-blue-200 text-[1.875rem] lg:text-base font-kmr">
            {contactLink.text}
          </a>
        </li>
      </ul>
    </nav>
  )
}

export default NavMenu
