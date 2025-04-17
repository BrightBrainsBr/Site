import { Link } from '@futurebrand/helpers-nextjs/components'
import type { ISocialLinks, IStrapiCommonLink } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import SocialIcon from '~/components/social-icon'

interface Properties {
  footerMenu: IStrapiCommonLink[]
  socialLink: ISocialLinks[]
  themeColor?:
    | 'midnight-950'
    | 'blue-400'
    | 'green-400'
    | 'lime-400'
    | 'violet-400'
  className: string
}

const NavMenu: React.FC<Properties> = ({
  className,
  footerMenu,
  themeColor,
  socialLink,
}) => {
  const navLinkHover = {
    'midnight-950': 'hover:text-midnight-600',
    'blue-400': 'hover:text-blue-400',
    'green-400': 'hover:text-green-400',
    'lime-400': 'hover:text-lime-600',
    'violet-400': 'hover:text-violet-400',
  }

  return (
    <div
      className={twMerge(
        'lg:col-span-2 lg:col-start-11 flex flex-col gap-5 lg:gap-10 lg:items-end lg:text-end',
        className
      )}
    >
      {footerMenu.length > 0 && (
        <ul className="flex flex-col gap-5">
          {footerMenu.map((item, index) => (
            <li key={`item-${index}`}>
              <Link
                name={item.text}
                href={item.url}
                blank={item.blank}
                className="block lg:translate-x-0 hover:-translate-x-6 transition-all duration-200"
              >
                {item.text}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {socialLink.length > 0 && (
        <ul className="flex gap-5">
          {socialLink.map((item, index) => (
            <li key={`item-${index}`}>
              <Link name={item.label} href={item.url} blank>
                <SocialIcon
                  name={item.type}
                  className={twMerge(
                    'w-6 h-6 transition-all duration-200',
                    themeColor && navLinkHover[themeColor]
                  )}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default NavMenu
