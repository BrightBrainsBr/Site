'use client'

import { useField } from '@futurebrand/helpers-nextjs/layouts'
import React from 'react'
import { tv } from 'tailwind-variants'

import InputErrorMessage from '../../../error-message'
import type { ISelectProps } from '../types'

const radioClassVariant = tv({
  slots: {
    field: 'form-field radio',
    container: 'radio-container mb-3',
    checkmark: 'checkmark ',
  },
  variants: {
    hasError: {
      true: {
        checkmark: '!text-error',
      },
    },
    areManyOptions: {
      false: {
        container: 'items-center flex-wrap gap-y-4 gap-x-6',
      },
      true: {
        container: 'flex-col gap-4',
      },
    },
  },
})

const CheckInput: React.FC<ISelectProps<HTMLInputElement>> = ({
  name,
  options,
  containerClassName,
  label,
  id,
  required,
  ...rest
}) => {
  const { field, error } = useField(name)
  const classNames = radioClassVariant({
    areManyOptions: options.length > 2,
    hasError: !!error,
  })

  return (
    <fieldset className={classNames.field({ className: containerClassName })}>
      <legend>
        {label && (
          <span className="legend-label">
            {label}
            {required && ' *'}
          </span>
        )}
      </legend>

      <div className={classNames.container()}>
        {options.map((option) => (
          <label
            key={option.id}
            htmlFor={option.id}
            className="group radio-item delay-200"
          >
            <input
              type="radio"
              id={option.id}
              value={option.value}
              {...rest}
              {...field}
              name={name}
              required={required}
              className="appearance-none peer m-0"
            />
            <span className={classNames.checkmark()} />
            <span className="label">{option.label}</span>
          </label>
        ))}
      </div>

      {error && <InputErrorMessage message={error} />}
    </fieldset>
  )
}

export default CheckInput
