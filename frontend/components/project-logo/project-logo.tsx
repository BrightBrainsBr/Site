import React from 'react'
import { twMerge } from 'tailwind-merge'

import { ReactComponent as LogoBlue } from '~/assets/icons/logo-blue-400.svg'
import { ReactComponent as LogoDark } from '~/assets/icons/logo-dark.svg'
import { ReactComponent as LogoGreen } from '~/assets/icons/logo-green-400.svg'
import { ReactComponent as LogoLight } from '~/assets/icons/logo-light.svg'
import { ReactComponent as LogoLime } from '~/assets/icons/logo-lime-400.svg'
import { ReactComponent as LogoLimeDark } from '~/assets/icons/logo-lime-dark.svg'
import { ReactComponent as LogoMidnight } from '~/assets/icons/logo-mignight-950.svg'
import { ReactComponent as LogoViolet } from '~/assets/icons/logo-violet-400.svg'

type SVGProps = React.SVGProps<SVGSVGElement>

const PROJECT_LOGO: Partial<Record<string, React.FC<SVGProps>>> = {
  'logo-midnight-950': LogoMidnight,
  'logo-blue-400': LogoBlue,
  'logo-green-400': LogoGreen,
  'logo-lime-400': LogoLime,
  'logo-lime-dark': LogoLimeDark,
  'logo-violet-400': LogoViolet,
}

const PROJECT_LOGO_MB: Partial<Record<string, React.FC<SVGProps>>> = {
  'logo-midnight-950': LogoDark,
  'logo-blue-400': LogoDark,
  'logo-green-400': LogoDark,
  'logo-lime-400': LogoLight,
  'logo-lime-dark': LogoDark,
  'logo-violet-400': LogoDark,
}

type Properties = {
  name: string
  variant: 'header' | 'footer'
} & React.SVGProps<SVGSVGElement>

function ProjectLogo({ name, variant, ...rest }: Properties) {
  const Icon = PROJECT_LOGO[name]
  const IconMb = PROJECT_LOGO_MB[name]

  if (!Icon || !IconMb) {
    return
  }

  return (
    <>
      <Icon
        className={twMerge(
          'hidden lg:block object-contain object-left',
          variant === 'header' ? 'w-[17.75rem] h-6' : 'w-[52.5rem] h-[4.375rem]'
        )}
        {...rest}
      />
      <IconMb
        className={twMerge(
          'lg:hidden',
          variant === 'header'
            ? 'w-[7.375rem] h-11'
            : 'w-full max-w-[23.375rem] h-[8.125rem]'
        )}
        {...rest}
      />
    </>
  )
}

export default ProjectLogo
