// frontend/components/assessment/steps/GenericScaleStep.tsx
'use client'

import type { ScaleStepProps } from '../assessment.interface'
import { ScaleQuestionField, SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

export function GenericScaleStep({
  data,
  setData,
  onPrev,
  onNext,
  scaleKey,
  questions,
  options,
  icon,
  title,
  subtitle,
  badge,
}: ScaleStepProps) {
  const scores = (data[scaleKey] as (number | null)[]) ?? []
  const answered = scores.filter((v) => v !== null).length

  const handleAnswer = (index: number, value: number) => {
    const updated = [...scores]
    updated[index] = value
    setData({ ...data, [scaleKey]: updated })
  }

  return (
    <div>
      <SectionTitle
        icon={icon}
        title={title}
        subtitle={subtitle}
        badge={badge}
      />

      <div className="mt-4 space-y-3">
        {questions.map((q, i) => (
          <ScaleQuestionField
            key={i}
            index={i}
            question={q}
            value={scores[i] ?? null}
            onChange={(v) => handleAnswer(i, v)}
            options={options}
          />
        ))}
      </div>

      <div className="mt-2 text-right text-xs text-zinc-500">
        {answered}/{questions.length} respondidas
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
