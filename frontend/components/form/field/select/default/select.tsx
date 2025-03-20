import { useField } from '@futurebrand/helpers-nextjs/layouts'
import React from 'react'
import { tv } from 'tailwind-variants'

import { ReactComponent as ArrowIcon } from '~/assets/icons/caret-down.svg'

import InputErrorMessage from '../../../error-message'
import type { ISelectProps } from '../types'

const selectClassVariant = tv({
  slots: {
    container: 'form-field select',
    select: 'h-full w-full capitalize appearance-none',
  },
  variants: {
    hasError: {
      true: {
        select: '!border-error',
      },
    },
  },
})

const Select: React.FC<ISelectProps> = ({
  className,
  name,
  options,
  placeholder,
  containerClassName,
  label,
  required,
  id,
  ...rest
}) => {
  const { field, error } = useField(name)
  const classNames = selectClassVariant({ hasError: !!error })

  return (
    <fieldset
      className={classNames.container({ className: containerClassName })}
    >
      {label && (
        <legend>
          {label && (
            <label htmlFor={id} className="legend-label">
              {label}
              {required && ' *'}
            </label>
          )}
        </legend>
      )}
      <div className="select-container">
        <select
          id={id}
          className={classNames.select({ className })}
          {...rest}
          {...field}
          required={required}
        >
          {placeholder && (
            <option value="" className="capitalize">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.id} value={option.value} className="capitalize">
              {option.label}
            </option>
          ))}
        </select>
        <span className="absolute z-10 right-4 top-0 h-full flex items-center pointer-events-none">
          <ArrowIcon className="w-4 h-4 text-current" />
        </span>
      </div>

      {error && <InputErrorMessage message={error} />}
    </fieldset>
  )
}

export default Select
