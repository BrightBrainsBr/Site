import React from 'react'
import { twMerge } from 'tailwind-merge'

interface Props {
  isMenuActive: boolean
  setIsMenuActive: any
  className?: string
}

const Hamburger: React.FC<Props> = ({
  isMenuActive,
  setIsMenuActive,
  className,
}) => {
  return (
    <button
      type="button"
      className={twMerge(
        'hamburger hamburger--squeeze flex items-center justify-center fixed right-4 md:right-6 z-[9999] transition-all duration-300',
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
