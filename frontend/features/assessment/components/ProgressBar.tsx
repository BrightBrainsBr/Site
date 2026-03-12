// frontend/features/assessment/components/ProgressBar.tsx
'use client'

import type { StepDefinition } from './assessment.interface'

interface ProgressBarProps {
  steps: StepDefinition[]
  currentIndex: number
}

export function ProgressBar({ steps, currentIndex }: ProgressBarProps) {
  const pct = ((currentIndex + 1) / steps.length) * 100

  return (
    <div className="mb-6 w-full">
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
        <span>
          Etapa {currentIndex + 1} de {steps.length}
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-lime-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
