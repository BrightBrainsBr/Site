import React from 'react'

import { ReactComponent as CloseIcon } from '~/assets/icons/close.svg'

interface Props {
  onClick: () => void
  isActive: boolean
  className?: string
}

const CloseButton: React.FC<Props> = ({ isActive, onClick, className }) => {
  return (
    <button
      className={`absolute top-2 right-2 sm:top-6 sm:right-6 transition-colors hover:text-current-primary ${className ?? ''}`}
      onClick={onClick}
      aria-label="Fechar modal"
      aria-hidden={!isActive}
      tabIndex={isActive ? 0 : -1}
    >
      <CloseIcon className="w-10 h-10 sm:w-8 sm:h-8" />
    </button>
  )
}

export default CloseButton
