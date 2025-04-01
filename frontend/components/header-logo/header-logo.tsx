import React from 'react'

import { ReactComponent as LogoMidnight } from '~/assets/icons/logo-mignight-950.svg'
import { ReactComponent as LogoBlue } from '~/assets/icons/logo-blue-400.svg'
import { ReactComponent as LogoGreen } from '~/assets/icons/logo-green-400.svg'
import { ReactComponent as LogoLime } from '~/assets/icons/logo-lime-400.svg'
import { ReactComponent as LogoViolet } from '~/assets/icons/logo-violet-400.svg'
import { ReactComponent as LogoLight } from '~/assets/icons/logo-light.svg'
import { ReactComponent as LogoDark } from '~/assets/icons/logo-dark.svg'

type SVGProps = React.SVGProps<SVGSVGElement>

const HEADER_LOGO: Partial<Record<string, React.FC<SVGProps>>> = {
  'logo-mignight-950': LogoMidnight,
  'logo-blue-400': LogoBlue,
  'logo-green-400': LogoGreen,
  'logo-lime-400': LogoLime,
  'logo-violet-400': LogoViolet,
}

const HEADER_LOGO_MB: Partial<Record<string, React.FC<SVGProps>>> = {
  'logo-mignight-950': LogoDark,
  'logo-blue-400': LogoDark,
  'logo-green-400': LogoDark,
  'logo-lime-400': LogoLight,
  'logo-violet-400': LogoDark,
}

type Properties = {
  name: string
} & React.SVGProps<SVGSVGElement>

function HeaderLogo({ name, ...rest }: Properties) {
  const Icon = HEADER_LOGO[name]
  const IconMb = HEADER_LOGO_MB[name]

  if (!Icon || !IconMb) {
    return
  }

  return (
    <>
      <Icon className='hidden lg:block w-[18.75rem] h-6 object-contain object-left opacity-0 animate-fadein' {...rest} />
      <IconMb className='lg:hidden w-[7.375rem] h-11' {...rest} />
    </>
  )
}

export default HeaderLogo
