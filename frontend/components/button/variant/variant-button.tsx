import type { IButtonVariant } from '@futurebrand/types/strapi'
import React from 'react'
import { tv } from 'tailwind-variants'

import Button from '../base'
import type { ButtonProperties, IButtonStyles } from '../types'

interface VariantProperties extends IButtonStyles {
  variant: IButtonVariant
}

type Properties = VariantProperties & ButtonProperties

const buttonClassVariant = tv(
  {
    base: 'button flex items-center justify-center leading-none text-balance origin-center text-center ',
    variants: {
      color: {
        light: 'text-black bg-white hover:bg-gray-lightness',
        dark: 'text-white bg-black hover:bg-blue-600',
      },
      tiny: {
        false: 'px-9 h-14 text-base',
        true: 'px-6 h-10 text-sm',
      },
      style: {
        default: 'default-button',
        icon: 'icon-button px-8',
      },
    },
  },
  {
    responsiveVariants: ['md'],
  }
)

const VariantButton: React.FC<Properties> = ({
  variant = 'light',
  style,
  className,
  children,
  tiny,
  ...rest
}) => {
  return (
    <Button
      className={buttonClassVariant({
        className,
        color: variant,
        tiny,
        style: style as any,
      })}
      {...rest}
    >
      {children}
    </Button>
  )
}

export default VariantButton
