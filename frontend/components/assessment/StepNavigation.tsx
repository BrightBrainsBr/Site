// frontend/components/assessment/StepNavigation.tsx
'use client'

import { twMerge } from 'tailwind-merge'

interface StepNavigationProps {
  onPrev: (() => void) | null
  onNext: (() => void) | null
  nextLabel?: string
  prevLabel?: string
  isLastStep?: boolean
}

export function StepNavigation({
  onPrev,
  onNext,
  nextLabel = 'Próximo',
  prevLabel = 'Anterior',
  isLastStep,
}: StepNavigationProps) {
  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      {onPrev ? (
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          {prevLabel}
        </button>
      ) : (
        <div />
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          className={twMerge(
            'rounded-lg px-6 py-2.5 text-sm font-medium transition-colors',
            isLastStep
              ? 'bg-lime-400 text-zinc-900 hover:bg-lime-300'
              : 'bg-lime-400 text-zinc-900 hover:bg-lime-300'
          )}
        >
          {nextLabel}
        </button>
      )}
    </div>
  )
}
