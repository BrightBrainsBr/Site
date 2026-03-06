// frontend/components/assessment/fields/ScoreDisplay.tsx
'use client'

import type { ScaleConfig } from '../assessment.interface'

interface ScoreDisplayProps {
  score: number
  config: ScaleConfig
}

export function ScoreDisplay({ score, config }: ScoreDisplayProps) {
  const range = config.ranges.find((r) => score >= r.min && score <= r.max)
  const maxScore = Math.max(...config.ranges.map((r) => r.max))
  const pct = Math.min((score / maxScore) * 100, 100)

  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-zinc-400">{config.label}</span>
        <span className="text-lg font-semibold text-white">{score}</span>
      </div>
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-zinc-700">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: range?.color ?? '#71717a',
          }}
        />
      </div>
      {range && (
        <span className="text-xs font-medium" style={{ color: range.color }}>
          {range.label}
        </span>
      )}
    </div>
  )
}
