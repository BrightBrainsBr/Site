import { useField } from '@futurebrand/helpers-nextjs/layouts'
import type { IFieldProps } from '@futurebrand/types/form'
import React from 'react'

const Input: React.FC<IFieldProps> = ({
  id,
  className,
  name,
  containerClassName,
  fieldData,
  ...rest
}) => {
  const { field } = useField(name)

  return (
    <input
      id={id}
      className="input-hidden"
      {...rest}
      {...field}
      name={name}
      type="hidden"
    />
  )
}

export default Input
