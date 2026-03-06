// frontend/components/assessment/fields/CheckboxGroup.tsx
'use client'

import { twMerge } from 'tailwind-merge'

interface CheckboxGroupProps {
  label: string
  selected: string[]
  onChange: (selected: string[]) => void
  options: string[]
  columns?: number
  required?: boolean
  hint?: string
  className?: string
}

export function CheckboxGroup({
  label,
  selected,
  onChange,
  options,
  columns = 2,
  required,
  hint,
  className,
}: CheckboxGroupProps) {
  const toggle = (item: string) => {
    onChange(
      selected.includes(item)
        ? selected.filter((s) => s !== item)
        : [...selected, item]
    )
  }

  return (
    <fieldset className={twMerge('block', className)}>
      <legend className="mb-2 text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-0.5 text-lime-400">*</span>}
      </legend>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((item) => {
          const isChecked = selected.includes(item)
          return (
            <button
              type="button"
              key={item}
              onClick={() => toggle(item)}
              className={twMerge(
                'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors',
                isChecked
                  ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                  : 'border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600'
              )}
            >
              <span
                className={twMerge(
                  'flex h-4 w-4 flex-none items-center justify-center rounded border transition-colors',
                  isChecked ? 'border-lime-400 bg-lime-400' : 'border-zinc-600'
                )}
              >
                {isChecked && (
                  <svg
                    className="h-3 w-3 text-zinc-900"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </span>
              {item}
            </button>
          )
        })}
      </div>
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </fieldset>
  )
}
