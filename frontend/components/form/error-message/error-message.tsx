import type { IErrorMessageProps } from '@futurebrand/layouts'
import React from 'react'

import { ReactComponent as ErrorIcon } from '~/assets/icons/error.svg'

const InputErrorMessage: React.FC<IErrorMessageProps> = ({
  message,
  className,
}) => {
  return (
    <div className={`form-error ${className ?? ''}`}>
      <ErrorIcon className="icon" />
      <p className="message">{message}</p>
    </div>
  )
}

export default InputErrorMessage
