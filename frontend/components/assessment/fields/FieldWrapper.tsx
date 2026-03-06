// frontend/components/assessment/fields/FieldWrapper.tsx
'use client'

interface FieldWrapperProps {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

export function FieldWrapper({
  label,
  hint,
  required,
  children,
}: FieldWrapperProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-0.5 text-lime-400">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  )
}
