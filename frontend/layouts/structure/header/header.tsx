import { StrapiImage } from '@futurebrand/components'
import { Link } from '@futurebrand/helpers-nextjs/components'
import type {
  IHeaderMenu,
  IHeaderStructure,
} from '@futurebrand/types/global-options'
import React from 'react'

import { getHelpersRouter } from '~/hooks/get-helpers-router'

interface Props extends IHeaderStructure {
  menu: IHeaderMenu[]
  locale: string
}

const Header: React.FC<Props> = async ({
  logo,
  menu,
  locale,
}) => {
  // const dictionary = await useServerDictionary(locale)
  const router = await getHelpersRouter()

  return (
    <header className="dark bg-blue-400 sticky z-50 top-0 left-0 h-20 w-full">
      <div className="container h-full flex items-center justify-between">
        <Link
          key={'header-logo'}
          href={
            locale === router.localization.defaultLocale ? '/' : `/${locale}`
          }
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
        <p className="text-lg">Header</p>
      </div>
    </header>
  )
}

export default Header
