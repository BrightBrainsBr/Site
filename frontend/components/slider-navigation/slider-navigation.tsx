'use client'

import React from 'react'
import { twMerge } from 'tailwind-merge'

import { ReactComponent as Icon } from '~/assets/icons/slider-arrow.svg'

interface Props {
  isBackDisable?: boolean
  isNextDisable?: boolean
  onClickBack?: () => void
  onClickNext?: () => void
  hidden?: boolean
  className?: string
}

const SliderNavigation: React.FC<Props> = ({
  onClickBack,
  onClickNext,
  isBackDisable,
  isNextDisable,
  hidden,
  className = '',
}) => {
  return (
    <div
      className={twMerge(
        'flex gap-2 items-center justify-start pointer-events-none',
        className
      )}
    >
      <button
        className={twMerge(
          'slider-navigation-button arrow-prev pointer-events-auto transition-all duration-200',
          isBackDisable ? 'opacity-50' : 'opacity-100'
        )}
        onClick={onClickBack}
        disabled={isBackDisable}
        aria-label="Back"
        tabIndex={hidden ? -1 : undefined}
      >
        <Icon
          name="slider-arrow"
          className="-rotate-180 w-[3.125rem] lg:w-14 h-[3.125rem] lg:h-14"
        />
      </button>
      <button
        className={twMerge(
          'slider-navigation-button arrow-next pointer-events-auto transition-all duration-200',
          isNextDisable ? 'opacity-50' : 'opacity-100'
        )}
        onClick={onClickNext}
        disabled={isNextDisable}
        aria-label="Next"
        tabIndex={hidden ? -1 : undefined}
      >
        <Icon className="w-[3.125rem] lg:w-14 h-[3.125rem] lg:h-14" />
      </button>
    </div>
  )
}

export default SliderNavigation
