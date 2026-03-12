// frontend/features/assessment/components/fields/Select.tsx
'use client'

import { twMerge } from 'tailwind-merge'

interface SelectOption {
  label: string
  value: string
}

interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[] | readonly { label: string; value: string }[]
  placeholder?: string
  required?: boolean
  hint?: string
  className?: string
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  hint,
  className,
}: SelectProps) {
  return (
    <label className={twMerge('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-0.5 text-lime-400">*</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-white transition-colors focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  )
}
