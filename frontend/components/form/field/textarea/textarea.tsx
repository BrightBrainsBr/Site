import { useField } from '@futurebrand/helpers-nextjs/layouts'
import type { IFieldProps } from '@futurebrand/types/form'
import React from 'react'
import { tv } from 'tailwind-variants'

import InputErrorMessage from '../../error-message'

interface Properties extends IFieldProps<HTMLTextAreaElement> {
  subLabel?: string
}

const textAreaClassVariant = tv({
  slots: {
    container: 'form-field textarea',
    input: 'h-full w-full',
  },
  variants: {
    hasError: {
      true: {
        input: '!border-error',
      },
    },
  },
})

const Textarea: React.FC<Properties> = ({
  id,
  className,
  name,
  containerClassName,
  label,
  // subLabel,
  required,
  // fieldData,
  ...rest
}) => {
  const { field, error } = useField(name)
  const classNames = textAreaClassVariant({ hasError: !!error })

  return (
    <fieldset
      className={classNames.container({ className: containerClassName })}
    >
      <legend>
        {label && (
          <label htmlFor={id} className="legend-label">
            {label}
            {required && ' *'}
          </label>
        )}
      </legend>
      <div className="textarea-container">
        <textarea
          id={id}
          className={classNames.input({ className })}
          {...rest}
          {...field}
          required={required}
          name={name}
        />
      </div>
      {error && <InputErrorMessage message={error} />}
    </fieldset>
  )
}

export default Textarea
