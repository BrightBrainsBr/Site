'use client'

import React from 'react'
import { tv } from 'tailwind-variants'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean
}

const hamburgerClassName = tv({
  slots: {
    base: 'hamburger p-0 cursor-pointer flex relative z-50 text-current',
    box: 'inline-block relative',
    inner: 'inner bg-current rounded-none top-1/2',
  },
  variants: {
    isActive: {
      true: {
        base: 'active',
      },
    },
  },
})

const Hamburger: React.FC<Props> = ({ isActive, className, ...rest }) => {
  const classNames = hamburgerClassName({ isActive })

  return (
    <button
      className={classNames.base({ className })}
      style={{
        transform: 'translateY(-2px)',
      }}
      {...rest}
    >
      <span
        className={classNames.box()}
        style={{ width: '1.6875rem', height: '1.125rem' }}
      >
        <span
          className={classNames.inner()}
          style={{
            marginLeft: -1,
          }}
        ></span>
      </span>
    </button>
  )
}

export default Hamburger
