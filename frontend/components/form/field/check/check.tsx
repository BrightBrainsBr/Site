'use client'

import { useField } from '@futurebrand/helpers-nextjs/layouts'
import type { IFieldProps } from '@futurebrand/types/form'
import React from 'react'
import { tv } from 'tailwind-variants'

import { ReactComponent as CheckIcon } from '~/assets/icons/check.svg'

import InputErrorMessage from '../../error-message'

const checkClassVariant = tv({
  slots: {
    container: 'form-field check',
    checkmark: 'checkmark',
  },
  variants: {
    hasError: {
      true: {
        checkmark: '!text-error',
      },
    },
  },
})

const Check: React.FC<IFieldProps> = ({
  name,
  label,
  containerClassName,
  // fieldData,
  id,
  ...rest
}) => {
  const { field, error } = useField(name)

  const classNames = checkClassVariant({ hasError: !!error })

  return (
    <fieldset
      className={classNames.container({ className: containerClassName })}
    >
      <label htmlFor={id} className="group check-container">
        <input
          type="checkbox"
          id={id || `confirm-${name}`}
          {...rest}
          {...field}
          name={name}
          required={false}
          className="appearance-none hidden peer m-0"
        />
        <span className={classNames.checkmark()}>
          <CheckIcon width={19} height={14} className="icon" />
        </span>
        <span className="label">{label}</span>
      </label>
      {error && <InputErrorMessage message={error} className="!mt-4" />}
    </fieldset>
  )
}

export default Check
