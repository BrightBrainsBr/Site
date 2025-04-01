import { Link } from '@futurebrand/helpers-nextjs/components'
import { IHeaderMenuItem } from '@futurebrand/types/global-options'
import { IStrapiCommonLink } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import { ReactComponent as Logo} from '~/assets/icons/logo-lite.svg'
import Accordion from '~/components/accordion'

interface Properties {
  headerMenu: IHeaderMenuItem[]
  contactLink: IStrapiCommonLink
  isMenuActive: boolean
  headerSettings: () => { accent: string, cta: 'lime' | 'midnight' | string}
}

const NavMenu: React.FC<Properties> = ({contactLink, headerMenu, isMenuActive, headerSettings}) => {
  const ctaVariants: any = {
    lime: 'lg:bg-lime-400 lg:text-midnight-950 hover:lg:bg-lime-500',
    midnight: 'lg:bg-midnight-950 lg:text-white hover:lg:bg-midnight-700',
  }

  return (
    <nav className={twMerge('fixed top-0 left-0 lg:static w-full lg:w-fit h-full lg:h-auto bg-lime-400 lg:bg-transparent transition-all duration-200 ease-out px-4 py-6', isMenuActive ? 'translate-x-0' : 'translate-x-full lg:translate-0')}>
      <ul className="flex flex-col lg:flex-row lg:items-center gap-4">
        <li className='lg:hidden'>
          <Logo className={twMerge('opacity-0 w-10 h-10', isMenuActive && 'animate-fadein')} />
        </li>
        {headerMenu.map((menuItem, index) => (
          <li key={index} className={twMerge('opacity-0 lg:opacity-100', isMenuActive && 'animate-fadein')}>
            <Link name='menu-item' href={menuItem.item.url} className={twMerge(
              "text-midnight-950 hover:text-blue-600 text-[1.875rem] lg:text-base font-kmr",
              `lg:text-${headerSettings().accent}`,
              menuItem.submenuTreatment && 'hidden lg:block'
              )}>
              {menuItem.item.text}
            </Link>
            {menuItem.submenuTreatment && (
              <Accordion className='lg:hidden text-midnight-950' isForMenu title={menuItem.item.text}>
                <ul className='flex flex-col gap-4 pl-4 pt-4'>
                  {menuItem.submenuTreatment.cards.map((submenuItem, index) => (
                    <li key={`submenu-item-${index}`}>
                      <Link name='submenu-item' href={submenuItem.cta.url} className=''>{submenuItem.title}</Link>
                    </li>
                  ))}
                </ul>
              </Accordion>
            )}
          </li>
        ))}
        <li className={twMerge('opacity-0 lg:opacity-100', isMenuActive && 'animate-fadein')}>
          <a href={contactLink.url} className={twMerge("block text-midnight-950 text-[1.875rem] lg:text-base font-kmr lg:px-6 lg:py-3 lg:rounded-sm", `${ctaVariants[headerSettings().cta]}`)}>
            {contactLink.text}
          </a>
        </li>
      </ul>
    </nav>
  )
}

export default NavMenu
