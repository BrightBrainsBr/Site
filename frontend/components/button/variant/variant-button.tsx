/* eslint-disable @typescript-eslint/no-explicit-any */
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
    base: 'button flex items-center justify-center leading-none text-balance origin-center text-center rounded-sm',
    variants: {
      color: {
        'midnight-950': 'text-white bg-midnight-950 hover:bg-midnight-600',
        'blue-400': 'text-white bg-blue-400 hover:bg-midnight-950',
        'green-400': 'text-white bg-green-400 hover:bg-blue-600',
        'lime-400': 'text-midnight-950 bg-lime-400 hover:bg-lime-600',
        'violet-400': 'text-white bg-violet-600 hover:bg-violet-400',
      },
      tiny: {
        false: 'px-9 py-4 !text-xs uppercase',
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
  variant = 'midnight-950',
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
