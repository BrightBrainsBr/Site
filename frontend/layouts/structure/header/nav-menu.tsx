/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

import { Link, StrapiImage } from '@futurebrand/helpers-nextjs/components'
import type { IHeaderMenuItem } from '@futurebrand/types/global-options'
import type { IStrapiCommonLink } from '@futurebrand/types/strapi'
import React, { useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { ReactComponent as Logo } from '~/assets/icons/logo-lite.svg'
import Accordion from '~/components/accordion'

import styles from './nav-menu.module.css'

interface Properties {
  headerMenu: IHeaderMenuItem[]
  contactLink: IStrapiCommonLink
  isMenuActive: boolean
  closeMenu: () => void
  headerSettings: () => { accent: string; cta: 'lime' | 'midnight' | string }
  isDropdownActive: boolean
  setIsDropdownActive: (arg0: boolean) => void
}

const NavMenu: React.FC<Properties> = ({
  contactLink,
  headerMenu,
  isMenuActive,
  closeMenu,
  headerSettings,
  isDropdownActive,
  setIsDropdownActive,
}) => {
  const [activeSubmenu, setActiveSubmenu] = useState<number>(-1)
  const ctaVariants: any = {
    lime: 'lg:bg-lime-400 lg:text-midnight-950 hover:lg:bg-lime-500',
    midnight: 'lg:bg-midnight-950 lg:text-white hover:lg:bg-midnight-700',
  }

  return (
    <>
      <nav
        className={twMerge(
          'fixed top-0 left-0 lg:static lg:flex lg:items-center w-full lg:w-fit h-full bg-lime-400 lg:bg-transparent transition-all duration-200 ease-out px-4 py-6 lg:p-0 z-40',
          isMenuActive ? 'translate-x-0' : 'translate-x-full lg:translate-0'
        )}
      >
        <ul className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-0 lg:h-full">
          <li className="lg:hidden">
            <Logo
              className={twMerge(
                'opacity-0 w-10 h-10',
                isMenuActive && 'animate-fadein'
              )}
            />
          </li>
          {headerMenu.length > 0 &&
            headerMenu.map((menuItem, index) => (
              <li
                key={index}
                className={twMerge(
                  'opacity-0 lg:opacity-100 lg:h-full',
                  isMenuActive && 'animate-fadein'
                )}
                onMouseEnter={() => {
                  if (menuItem.submenuDefault || menuItem.submenuTreatment) {
                    setActiveSubmenu(index)
                    setIsDropdownActive(true)
                  }
                }}
                onMouseLeave={() => {
                  setActiveSubmenu(-1)
                  if (menuItem.submenuDefault || menuItem.submenuTreatment) {
                    setIsDropdownActive(false)
                  }
                }}
              >
                {!menuItem.submenuTreatment && (
                  <Link
                    name="menu-item"
                    href={menuItem.item.url}
                    className={twMerge(
                      'lg:h-full lg:flex lg:items-center lg:px-2 text-midnight-950 text-[1.875rem] lg:text-base font-kmr',
                      !isDropdownActive && `lg:text-${headerSettings().accent}`,
                      menuItem.submenuTreatment && 'hidden lg:block'
                    )}
                    onClick={closeMenu}
                  >
                    {menuItem.item.text}
                  </Link>
                )}
                {menuItem.submenuTreatment && (
                  <>
                    <button
                      className={twMerge(
                        'lg:h-full lg:flex lg:items-center lg:px-2 text-midnight-950 text-[1.875rem] lg:text-base font-kmr',
                        !isDropdownActive &&
                          `lg:text-${headerSettings().accent}`,
                        menuItem.submenuTreatment && 'hidden lg:block'
                      )}
                    >
                      {menuItem.item.text}
                    </button>
                    <Accordion
                      className="lg:hidden text-midnight-950"
                      isForMenu
                      title={menuItem.item.text}
                    >
                      <ul className="flex flex-col gap-4 pl-4 pt-4">
                        {menuItem.submenuTreatment.cards.map(
                          (submenuItem, index) => (
                            <li key={`submenu-item-${index}`}>
                              <Link
                                name="submenu-item"
                                href={submenuItem.cta.url}
                                onClick={closeMenu}
                              >
                                {submenuItem.title}
                              </Link>
                            </li>
                          )
                        )}
                      </ul>
                    </Accordion>
                  </>
                )}
              </li>
            ))}
          {contactLink && (
            <li
              className={twMerge(
                'opacity-0 lg:opacity-100 lg:mx-2',
                isMenuActive && 'animate-fadein'
              )}
            >
              <Link
                name="contact-link"
                href={contactLink.url}
                className={twMerge(
                  'block text-midnight-950 text-[1.875rem] lg:text-base font-kmr lg:px-6 lg:py-3 lg:rounded-sm',
                  `${ctaVariants[headerSettings().cta]}`
                )}
                onClick={closeMenu}
              >
                {contactLink.text}
              </Link>
            </li>
          )}
        </ul>
      </nav>
      {headerMenu.length > 0 &&
        headerMenu.map((dropdown, index) => (
          <div
            className={twMerge(
              'hidden lg:flex fixed top-0 left-0 w-[100vw] h-[56.905vh] min-h-[29.875rem] pt-[6.875rem] bg-gray-light duration-300 transition-[all cubic-bezier(0.29, 1.01, 1, -0.68)] delay-300 items-center justify-center opacity-0 z-30',
              activeSubmenu === index
                ? 'translate-y-0 animate-fadein'
                : '-translate-y-full'
            )}
            onMouseEnter={() => {
              if (dropdown.submenuDefault || dropdown.submenuTreatment) {
                setActiveSubmenu(index)
                setIsDropdownActive(true)
              }
            }}
            onMouseLeave={() => {
              setActiveSubmenu(-1)
              if (dropdown.submenuDefault || dropdown.submenuTreatment) {
                setIsDropdownActive(false)
              }
            }}
          >
            {dropdown.submenuDefault && (
              <div className="container grid grid-cols-12 gap-5">
                <ul className="col-span-3 col-start-3 flex flex-col gap-8">
                  {dropdown.submenuDefault.items.length > 0 &&
                    dropdown.submenuDefault.items.map((submenuItem, index) => (
                      <li className="translate-x-0 hover:translate-x-6 transition-all duration-200 w-fit">
                        <Link
                          name="submenu-default-item"
                          className="block !w-fit heading-xl text-midnight-950"
                          key={`submenu-default-item-${index}`}
                          href={submenuItem.url}
                        >
                          {submenuItem.text}
                        </Link>
                      </li>
                    ))}
                </ul>
                <div
                  className={twMerge(
                    'col-start-7 overflow-hidden rounded-[1.25rem] h-[47.62vh] min-h-[23.125rem]',
                    dropdown.submenuDefault.card.layout === 'default'
                      ? 'col-span-6'
                      : 'col-span-5'
                  )}
                >
                  {dropdown.submenuDefault.card.layout !== 'default' ? (
                    <Link
                      name="lite-card"
                      href={dropdown.submenuDefault.card.cta.url}
                      className="group block w-full h-full bg-white"
                    >
                      {dropdown.submenuDefault.card.image && (
                        <picture className="block w-full h-[26.43vh] min-h-[12.625rem] overflow-hidden">
                          <StrapiImage
                            image={dropdown.submenuDefault.card.image}
                            className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300"
                          />
                        </picture>
                      )}
                      <div className="p-6 flex flex-col gap-3 text-midnight-950">
                        {dropdown.submenuDefault.card.title && (
                          <h3 className="heading-xl">
                            {dropdown.submenuDefault.card.title}
                          </h3>
                        )}
                        {dropdown.submenuDefault.card.description && (
                          <div
                            className="cms-rich-text text-sm"
                            dangerouslySetInnerHTML={{
                              __html: dropdown.submenuDefault.card.description,
                            }}
                          />
                        )}
                        <button className="w-fit font-bold">Ver mais</button>
                      </div>
                    </Link>
                  ) : (
                    <div className="relative block w-full h-full">
                      {dropdown.submenuDefault.card.image && (
                        <StrapiImage
                          image={dropdown.submenuDefault.card.image}
                          className="absolute top-0 left-0 w-full h-full object-cover"
                        />
                      )}
                      <div className="relative z-10 p-6 h-full flex flex-col justify-end gap-3 text-white">
                        {dropdown.submenuDefault.card.title && (
                          <h3 className="heading-4xl">
                            {dropdown.submenuDefault.card.title}
                          </h3>
                        )}
                        {dropdown.submenuDefault.card.description && (
                          <div
                            className="cms-rich-text text-sm"
                            dangerouslySetInnerHTML={{
                              __html: dropdown.submenuDefault.card.description,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {dropdown.submenuTreatment && (
              <ul className="container flex gap-5 justify-between">
                {dropdown.submenuTreatment.cards &&
                  dropdown.submenuTreatment.cards.map((card, index) => (
                    <li
                      key={`treatment-card-${index}`}
                      className={twMerge(
                        'w-[32.5%] hover:w-[44.44vw] transition-all duration-200',
                        styles.treatmentCard
                      )}
                    >
                      <Link
                        href={card.cta.url}
                        name="treatment-card"
                        className="group relative flex flex-col justify-end h-[47.62vh] min-h-[23.125rem] overflow-hidden rounded-[1.25rem] p-6 border-0 hover:border-8 duration-200 transition-all"
                      >
                        <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-[#091930F2] to-[#09193015] z-10 opacity-100 duration-300 transition-all group-hover:opacity-50" />
                        {card.image && (
                          <StrapiImage
                            className="absolute top-0 left-0 w-full h-full object-cover"
                            image={card.image}
                          />
                        )}
                        {card.title && (
                          <h3 className="relative z-10 heading-4xl text-white">
                            {card.title}
                          </h3>
                        )}
                        {card.description && (
                          <div
                            className="relative z-10 cms-rich-text hidden group-hover:block group-hover:animate-fadein opacity-0"
                            dangerouslySetInnerHTML={{
                              __html: card.description,
                            }}
                          />
                        )}
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        ))}
    </>
  )
}

export default NavMenu
