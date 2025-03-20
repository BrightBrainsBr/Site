import { useField } from '@futurebrand/layouts/form'
import type { IFieldProps } from '@futurebrand/types/form'
import { maskPhoneNumber } from '@futurebrand/utils'
import React, { useMemo } from 'react'
import { tv } from 'tailwind-variants'

import InputErrorMessage from '../../error-message'

interface Properties extends IFieldProps {
  IconAfter?: React.ElementType
  IconBefore?: React.ElementType
  labelHidden?: boolean
}

const inputClassVariant = tv({
  slots: {
    container: 'form-field input',
    input: 'h-full w-full',
  },
  variants: {
    hasError: {
      true: {
        input: '!border-error',
      },
    },
    hasIconAfter: {
      true: {
        input: '!pr-10',
      },
    },
    hasIconBefore: {
      true: {
        input: '!pl-10',
      },
    },
  },
})

const Input: React.FC<Properties> = ({
  id,
  className,
  name,
  IconAfter,
  IconBefore,
  containerClassName,
  label,
  labelHidden,
  required,
  type,
  fieldData,
  ...rest
}) => {
  const inputType = useMemo(() => {
    if (fieldData?.type) {
      return fieldData.type === 'phone' ? 'tel' : fieldData.type
    }

    return type ?? 'text'
  }, [fieldData?.type, type])

  const registerOptions = useMemo(() => {
    let options = {}

    if (type === 'phone') {
      options = {
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          const value = maskPhoneNumber(event.target.value)
          event.target.value = value
        },
        setValueAs(value: string) {
          return maskPhoneNumber(value)
        },
      }
    }
    if (type === 'date') {
      options = {
        valueAsDate: true,
      }
    }

    return options
  }, [type])

  const { field, error } = useField(name, registerOptions)

  const classNames = inputClassVariant({
    hasError: !!error,
    hasIconAfter: !!IconAfter,
    hasIconBefore: !!IconBefore,
  })

  return (
    <fieldset
      className={classNames.container({ className: containerClassName })}
    >
      <legend className={labelHidden ? 'sr-only' : ''}>
        {label && (
          <label htmlFor={id} className="legend-label">
            {label}
            {required && ' *'}
          </label>
        )}
      </legend>
      <div className="input-container">
        {IconBefore && (
          <span className="icon icon-before">
            <IconBefore />
          </span>
        )}
        <input
          id={id}
          className={classNames.input({ className })}
          {...rest}
          {...field}
          type={inputType}
          required={false}
          name={name}
        />
        {IconAfter && (
          <span className="icon icon-after">
            <IconAfter />
          </span>
        )}
      </div>
      {error && <InputErrorMessage message={error} />}
    </fieldset>
  )
}

export default Input
