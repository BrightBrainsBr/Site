/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react'
import { twMerge } from 'tailwind-merge'

interface Props {
  isMenuActive: boolean
  setIsMenuActive: any
  className?: string
  headerSettings: () => { accent: string }
}

const Hamburger: React.FC<Props> = ({
  isMenuActive,
  setIsMenuActive,
  className,
  headerSettings,
}) => {
  return (
    <button
      type="button"
      className={twMerge(
        'hamburger hamburger--squeeze flex items-center justify-center fixed top-5 right-4 md:right-6 z-[9999] transition-all duration-300',
        `text-${headerSettings().accent}`,
        isMenuActive && 'is-active !text-midnight-950',
        className
      )}
      onClick={() => {
        setIsMenuActive(!isMenuActive)
      }}
    >
      <div className="hamburger-box">
        <div className="hamburger-inner duration-500 transition-colors text-current" />
      </div>
    </button>
  )
}

export default Hamburger
