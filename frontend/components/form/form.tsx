'use client'

import { Form } from '@futurebrand/layouts'
import type { IForm } from '@futurebrand/types/form'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import { sendFormAction } from '~/services/form/send'

import ErrorMessage from './error-message'
import FIELDS from './field'
import SendedLayout from './sended-layout'
import SubmitButton from './submit-button'

interface IProperties {
  isHidden?: boolean
  form: IForm
  formKey: string
  className?: string
  containerClassName?: string
  buttonPosition?: 'center' | 'right' | 'left'
}

const FormComponent: React.FC<IProperties> = ({
  containerClassName,
  isHidden = false,
  ...rest
}) => {
  return (
    <Form.Context
      onSubmitAction={async (form, data, context) => {
        return await sendFormAction(form.id, data, context)
      }}
      isHidden={isHidden}
      className={twMerge(
        'relative transition-all duration-500',
        containerClassName
      )}
      {...rest}
    >
      <Form.Root className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 transition-all duration-500 ease-out data-disabled:opacity-0 data-disabled:-translate-y-10 data-disabled:pointer-events-none data-disabled:overflow-hidden">
        <Form.Fields blocks={FIELDS as any} />
        <Form.Error>
          {(message) => <ErrorMessage message={message} />}
        </Form.Error>
        <SubmitButton />
      </Form.Root>
      <SendedLayout />
    </Form.Context>
  )
}

export default FormComponent
