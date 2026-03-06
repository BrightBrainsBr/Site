// frontend/components/assessment/fields/RadioGroup.tsx
'use client'

import { twMerge } from 'tailwind-merge'

interface RadioOption {
  label: string
  value: string
}

interface RadioGroupProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: RadioOption[] | readonly { label: string; value: string }[]
  required?: boolean
  hint?: string
  inline?: boolean
  className?: string
}

export function RadioGroup({
  label,
  value,
  onChange,
  options,
  required,
  hint,
  inline,
  className,
}: RadioGroupProps) {
  return (
    <fieldset className={twMerge('block', className)}>
      <legend className="mb-2 text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-0.5 text-lime-400">*</span>}
      </legend>
      <div
        className={twMerge(
          'flex gap-3',
          inline ? 'flex-row flex-wrap' : 'flex-col'
        )}
      >
        {options.map((opt) => (
          <button
            type="button"
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={twMerge(
              'flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm transition-colors',
              value === opt.value
                ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                : 'border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
            )}
          >
            <span
              className={twMerge(
                'flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 transition-colors',
                value === opt.value ? 'border-lime-400' : 'border-zinc-600'
              )}
            >
              {value === opt.value && (
                <span className="h-2 w-2 rounded-full bg-lime-400" />
              )}
            </span>
            {opt.label}
          </button>
        ))}
      </div>
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </fieldset>
  )
}
