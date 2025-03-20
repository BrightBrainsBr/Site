'use client'

import type { IFieldProps, IFieldSelect } from '@futurebrand/types/form'
import React, { useMemo } from 'react'

import CheckBox from './checkbox'
import DefaultSelect from './default'
import Radio from './radio'
import type { ISelectOption } from './types'

function transformStringToOption(
  formName: string,
  option: string,
  index: number
): ISelectOption {
  const valueKey = option.toLowerCase().replaceAll(' ', '-')
  const id = `${formName}-${valueKey}-${index}`

  return {
    id,
    value: option,
    label: option,
  }
}

const Select: React.FC<IFieldProps<any, IFieldSelect>> = ({
  id,
  fieldData,
  ...rest
}) => {
  const options: ISelectOption[] = useMemo(() => {
    if (!fieldData?.options) return []

    return fieldData.options.map((option, index) => {
      if (typeof option === 'object') {
        return {
          ...option,
          id: option.id
            ? `${id}-item-${option.id}`
            : `${id}-item-${option.value}-${index}`,
        }
      }
      return transformStringToOption(id, option, index)
    })
  }, [fieldData?.options, id])

  if (fieldData?.type === 'radio') {
    return <Radio id={id} options={options} {...rest} />
  }

  if (fieldData?.type === 'checkbox') {
    return <CheckBox id={id} options={options} {...rest} />
  }

  return <DefaultSelect id={id} options={options} {...rest} />
}

export default Select
