// frontend/components/assessment/fields/Textarea.tsx
'use client'

import { twMerge } from 'tailwind-merge'

interface TextareaProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  hint?: string
  rows?: number
  className?: string
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  required,
  hint,
  rows = 4,
  className,
}: TextareaProps) {
  return (
    <label className={twMerge('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-0.5 text-lime-400">*</span>}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
      />
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  )
}
