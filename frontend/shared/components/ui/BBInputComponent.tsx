// frontend/shared/components/ui/BBInputComponent.tsx

'use client'

import * as React from 'react'
import type {
  Control,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from 'react-hook-form'
import { Controller } from 'react-hook-form'

import { cn } from '~/shared/utils/cn'

interface BBInputComponentProps<TFieldValues extends FieldValues> extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'name' | 'defaultValue' | 'value' | 'onChange' | 'onBlur'
> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label?: string
  rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>
  inputClassName?: string
  wrapperClassName?: string
  onBlurCallback?: (e: React.FocusEvent<HTMLInputElement>) => void
}

export function BBInputComponent<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  rules,
  className,
  inputClassName,
  wrapperClassName,
  onBlurCallback,
  disabled = false,
  type = 'text',
  ...rest
}: BBInputComponentProps<TFieldValues>) {
  const inputId = name

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <div className={cn('space-y-1.5', wrapperClassName)}>
          {label && (
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-[#cce6f7]"
            >
              {label}
            </label>
          )}
          <input
            {...field}
            {...rest}
            id={inputId}
            type={type}
            disabled={disabled || field.disabled}
            onBlur={(e) => {
              field.onBlur()
              onBlurCallback?.(e)
            }}
            className={cn(
              'w-full rounded-lg border bg-[#060e1a] px-4 py-3 text-sm text-[#cce6f7] placeholder-[#5a7fa0] transition-colors',
              'focus:border-[#00c9b1] focus:outline-none focus:ring-1 focus:ring-[#00c9b1]/30',
              error
                ? 'border-red-500/60 ring-1 ring-red-500/30'
                : 'border-[#1a3a5c]',
              (disabled || field.disabled) && 'cursor-not-allowed opacity-50',
              inputClassName
            )}
            value={
              field.value === null || field.value === undefined
                ? ''
                : field.value
            }
          />
          {error && <p className="text-xs text-red-400">{error.message}</p>}
        </div>
      )}
    />
  )
}
