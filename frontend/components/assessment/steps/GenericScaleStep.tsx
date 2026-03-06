// frontend/components/assessment/steps/GenericScaleStep.tsx
'use client'

import type { ScaleStepProps } from '../assessment.interface'
import { SCALE_RANGES } from '../constants/scoring-ranges'
import {
  InfoBox,
  ScaleQuestionField,
  ScoreDisplay,
  SectionTitle,
} from '../fields'
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
  info,
  customScore,
}: ScaleStepProps) {
  const scores = (data[scaleKey] as (number | null)[]) ?? []
  const answered = scores.filter((v) => v !== null).length

  const handleAnswer = (index: number, value: number) => {
    const updated = [...scores]
    updated[index] = value
    setData({ ...data, [scaleKey]: updated })
  }

  const total = customScore
    ? customScore(scores)
    : scores.reduce<number>((sum, v) => sum + (v ?? 0), 0)

  const allAnswered = answered === questions.length
  const rangeConfig = SCALE_RANGES[scaleKey]

  return (
    <div>
      <SectionTitle
        icon={icon}
        title={title}
        subtitle={subtitle}
        badge={badge}
      />

      {info && <InfoBox>{info}</InfoBox>}

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

      {allAnswered && rangeConfig && (
        <div className="mt-6">
          <ScoreDisplay score={total} config={rangeConfig} />
        </div>
      )}

      <div className="mt-2 text-right text-xs text-zinc-500">
        {answered}/{questions.length} respondidas
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
