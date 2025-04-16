'use client'

import { useField } from '@futurebrand/helpers-nextjs/layouts'
import React from 'react'
import { tv } from 'tailwind-variants'

import { ReactComponent as CheckIcon } from '~/assets/icons/check.svg'

import InputErrorMessage from '../../../error-message'
import type { ISelectProps } from '../types'

const checkboxClassVariant = tv({
  slots: {
    field: 'form-field checkbox',
    container: 'checkbox-container',
    checkmark: 'checkmark',
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

const CheckboxInput: React.FC<ISelectProps<HTMLInputElement>> = ({
  name,
  options,
  containerClassName,
  label,
  // id,
  required,
  ...rest
}) => {
  const { field, error } = useField(name)

  const classNames = checkboxClassVariant({
    areManyOptions: options.length > 2,
    hasError: !!error,
  })

  return (
    <fieldset className={classNames.field({ className: containerClassName })}>
      <legend>
        {label && (
          <span className="legend-label">
            {label} {required && ' *'}
          </span>
        )}
      </legend>

      <div className={classNames.container()}>
        {options.map((option) => (
          <label
            key={option.id}
            htmlFor={option.id}
            className="checkbox-item group"
          >
            <input
              type="checkbox"
              id={option.id}
              {...rest}
              {...field}
              name={name}
              value={option.value}
              required={false}
              className="appearance-none peer m-0"
            />
            <span className={classNames.checkmark()}>
              <CheckIcon width={19} height={14} className="icon" />
            </span>
            <span className="label">{option.label}</span>
          </label>
        ))}
      </div>
      {error && <InputErrorMessage message={error} className="!mt-4" />}
    </fieldset>
  )
}

export default CheckboxInput
