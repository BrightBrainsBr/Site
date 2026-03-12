// frontend/features/assessment/components/fields/Input.tsx
'use client'

import { twMerge } from 'tailwind-merge'

interface InputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  hint?: string
  className?: string
  mask?: (value: string) => string
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  hint,
  className,
  mask,
}: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    onChange(mask ? mask(raw) : raw)
  }

  return (
    <label className={twMerge('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-0.5 text-lime-400">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
      />
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  )
}
