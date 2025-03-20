import { Link } from '@futurebrand/components'
import React from 'react'

import type { ButtonProperties } from '../types'

const BaseButton: React.FC<ButtonProperties> = ({
  component = 'link',
  text,
  className,
  blank,
  children,
  ...rest
}) => {
  if (component === 'link') {
    const properties = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>
    if (properties.href) {
      return (
        <Link
          className={`link-button ${className}`}
          href={properties.href}
          blank={blank}
          name="button"
          {...properties}
        >
          <span>{text}</span>
          <>{children}</>
        </Link>
      )
    }
  }

  return (
    <button
      className={`button ${className}`}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      <span>{text}</span>
      {children}
    </button>
  )
}

export default BaseButton
