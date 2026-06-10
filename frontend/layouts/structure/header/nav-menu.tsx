/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

import { Link, StrapiImage } from '@futurebrand/helpers-nextjs/components'
import type { IHeaderMenuItem } from '@futurebrand/types/global-options'
import type { IStrapiCommonLink } from '@futurebrand/types/strapi'
import type { ITreatmentCard } from '@futurebrand/types/contents'
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
  locale: string
  treatments?: ITreatmentCard[]
}

const NavMenu: React.FC<Properties> = ({
  contactLink,
  headerMenu,
  isMenuActive,
  closeMenu,
  headerSettings,
  isDropdownActive,
  setIsDropdownActive,
  locale,
  treatments,
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
          <li
            className={twMerge(
              'opacity-0 lg:opacity-100 lg:h-full',
              isMenuActive && 'animate-fadein'
            )}
          >
            <Link
              name="blog-link"
              href="/noticias"
              className={twMerge(
                'lg:h-full lg:flex lg:items-center lg:px-2 text-midnight-950 text-[1.875rem] lg:text-base lg:font-semibold font-kmr lg:translate-y-0 lg:transition-all lg:duration-200 hover:lg:-translate-y-2',
                !isDropdownActive && `lg:text-${headerSettings().accent}`
              )}
              onClick={closeMenu}
            >
              Blog
            </Link>
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
                      'lg:h-full lg:flex lg:items-center lg:px-2 text-midnight-950 text-[1.875rem] lg:text-base lg:font-semibold font-kmr lg:translate-y-0 lg:transition-all lg:duration-200 hover:lg:-translate-y-2',
                      !isDropdownActive && `lg:text-${headerSettings().accent}`,
                      activeSubmenu === index && 'lg:-translate-y-2',
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
                        'lg:h-full lg:flex lg:items-center lg:px-2 text-midnight-950 text-[1.875rem] lg:text-base lg:font-semibold font-kmr lg:translate-y-0 lg:transition-all lg:duration-200',
                        !isDropdownActive &&
                          `lg:text-${headerSettings().accent}`,
                        activeSubmenu === index && 'lg:-translate-y-2',
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
                        {treatments && treatments.length > 0
                          ? treatments.map((treatment, i) => (
                              <li key={`submenu-treatment-${treatment.id}`}>
                                <Link
                                  name="submenu-item"
                                  href={treatment.path}
                                  onClick={closeMenu}
                                >
                                  {treatment.title}
                                </Link>
                              </li>
                            ))
                          : menuItem.submenuTreatment.cards.map((submenuItem, i) => (
                              <li key={`submenu-item-${i}`}>
                                <Link
                                  name="submenu-item"
                                  href={submenuItem.cta.url}
                                  onClick={closeMenu}
                                >
                                  {submenuItem.title}
                                </Link>
                              </li>
                            ))}
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
                  'block text-midnight-950 text-[1.875rem] lg:text-xs lg:uppercase font-kmr lg:px-6 lg:py-3 lg:rounded-sm',
                  `${ctaVariants[headerSettings().cta]}`
                )}
                onClick={closeMenu}
              >
                {contactLink.text}
              </Link>
            </li>
          )}
          <li
            className={twMerge(
              'opacity-0 lg:opacity-100',
              isMenuActive && 'animate-fadein'
            )}
          >
            <a
              href={`/${locale}/login`}
              className={twMerge(
                'block text-midnight-950 text-[1.875rem] lg:text-xs lg:uppercase font-kmr lg:px-4 lg:py-3 lg:rounded-sm lg:border lg:border-current transition-colors duration-200',
                !isDropdownActive && `lg:text-${headerSettings().accent}`,
                'hover:opacity-80'
              )}
              onClick={() => closeMenu()}
            >
              Login
            </a>
          </li>
        </ul>
      </nav>
      {headerMenu.length > 0 &&
        headerMenu.map((dropdown, index) => (
          <div
            className={twMerge(
              'hidden lg:flex fixed top-0 left-0 w-full bg-gray-light duration-300 transition-[all cubic-bezier(0.29,1.01,1,-0.68)] delay-300 justify-center opacity-0 z-30',
              dropdown.submenuTreatment
                ? 'min-h-[34rem] pt-[5.625rem] pb-8 items-start'
                : 'h-[62.905vh] min-h-[32.5rem] pt-[6.875rem] pb-[3.75rem] items-center',
              activeSubmenu === index
                ? 'translate-y-0 animate-fadein'
                : '-translate-y-full'
            )}
            key={`dropdown-${index}`}
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
                      <li
                        className="translate-x-0 hover:translate-x-6 transition-all duration-200 w-fit"
                        key={`submenu-default-item-${index}`}
                      >
                        <Link
                          name="submenu-default-item"
                          className="block !w-fit heading-xl text-midnight-950"
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
              <div className="container flex flex-col gap-4 w-full">
                {treatments && treatments.length > 0
                  ? [
                      treatments.slice(0, 5),
                      treatments.slice(5, 10),
                      treatments.slice(10),
                    ]
                      .filter((row) => row.length > 0)
                      .map((row, rowIndex) => (
                        <ul
                          key={`treatment-row-${rowIndex}`}
                          className="flex gap-5 w-full"
                        >
                          {row.map((card, cardIndex) => (
                            <li
                              key={`treatment-card-${card.id}`}
                              className={twMerge(
                                '[flex:1] hover:[flex:2.5] transition-all duration-200',
                                styles.treatmentCard
                              )}
                            >
                              <Link
                                href={card.path}
                                name="treatment-card"
                                className="group relative flex flex-col justify-end h-[120px] overflow-hidden rounded-[1.25rem] p-4 border-0 hover:border-8 duration-200 transition-all"
                              >
                                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-[#091930F2] to-[#09193015] z-10 opacity-100 duration-300 transition-all group-hover:opacity-50" />
                                {card.featuredImage && (
                                  <StrapiImage
                                    className="absolute top-0 left-0 w-full h-full object-cover"
                                    image={card.featuredImage}
                                  />
                                )}
                                {card.title && (
                                  <h3 className="relative z-10 heading-xl text-white">
                                    {card.title
                                      .replace(/tratamento/gi, '')
                                      .replace(/\s+/g, ' ')
                                      .trim()}
                                  </h3>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ))
                  : /* Fallback: render original CMS cards in a single row */
                    <ul className="flex gap-5 w-full">
                      {dropdown.submenuTreatment.cards.map((card, index) => (
                        <li
                          key={`treatment-card-fallback-${index}`}
                          className={twMerge(
                            'w-[32.5%] hover:w-[48.44vw] transition-all duration-200',
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
                                className="relative z-10 cms-rich-text hidden group-hover:block group-hover:animate-fadein opacity-0 text-white"
                                dangerouslySetInnerHTML={{ __html: card.description }}
                              />
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>}
              </div>
            )}
          </div>
        ))}
    </>
  )
}

export default NavMenu
