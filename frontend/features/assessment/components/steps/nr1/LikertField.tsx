// frontend/features/assessment/components/steps/nr1/LikertField.tsx
'use client'

import { twMerge } from 'tailwind-merge'

import { LIKERT_5_LABELS } from '../../constants/nr1-options'

interface LikertFieldProps {
  label: string
  value: number | null | undefined
  onChange: (value: number) => void
  hint?: string
}

export function LikertField({
  label,
  value,
  onChange,
  hint,
}: LikertFieldProps) {
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4">
      <p className="mb-1 text-sm font-medium text-zinc-200">{label}</p>
      {hint && <p className="mb-3 text-xs text-zinc-500">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {LIKERT_5_LABELS.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={twMerge(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors sm:text-sm',
                active
                  ? 'border-lime-400 bg-lime-400/10 font-semibold text-lime-400'
                  : 'border-zinc-700 bg-zinc-800/20 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
              )}
            >
              <span
                className={twMerge(
                  'flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 transition-colors',
                  active ? 'border-lime-400' : 'border-zinc-600'
                )}
              >
                {active && (
                  <span className="h-2 w-2 rounded-full bg-lime-400" />
                )}
              </span>
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
