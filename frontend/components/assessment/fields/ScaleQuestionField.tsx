// frontend/components/assessment/fields/ScaleQuestionField.tsx
'use client'

import { twMerge } from 'tailwind-merge'

import type { ScaleOption, ScaleQuestion } from '../assessment.interface'

interface ScaleQuestionFieldProps {
  index: number
  question: string | ScaleQuestion
  value: number | null
  onChange: (value: number) => void
  options: ScaleOption[] | null
}

export function ScaleQuestionField({
  index,
  question,
  value,
  onChange,
  options,
}: ScaleQuestionFieldProps) {
  const qText = typeof question === 'string' ? question : question.q
  const customOptions =
    typeof question !== 'string' && question.o ? question.o : null
  const dimension =
    typeof question !== 'string' && question.d ? question.d : null
  const category =
    typeof question !== 'string' && question.c ? question.c : null

  const resolvedOptions: { label: string; value: number }[] = customOptions
    ? customOptions.map((label, i) => ({ label, value: i }))
    : (options ?? [])

  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4">
      <div className="mb-3 flex items-start gap-2">
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-zinc-700 text-xs font-medium text-zinc-300">
          {index + 1}
        </span>
        <p className="text-sm text-zinc-200">{qText}</p>
        {dimension && (
          <span className="ml-auto flex-none rounded bg-zinc-700/50 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
            {dimension}
          </span>
        )}
        {category && (
          <span className="ml-auto flex-none rounded bg-zinc-700/50 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
            {category}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {resolvedOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={twMerge(
              'rounded-lg border px-3 py-1.5 text-xs transition-colors',
              value === opt.value
                ? 'border-lime-400 bg-lime-400/15 text-lime-400'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
