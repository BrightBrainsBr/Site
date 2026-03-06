// frontend/components/assessment/steps/MDQStep.tsx
'use client'

import type { StepComponentProps } from '../assessment.interface'
import { MDQ_OPTIONS, MDQ_QUESTIONS } from '../constants/scales'
import { RadioGroup, ScaleQuestionField, SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

const IMPACTO_OPTIONS = [
  { label: 'Nenhum problema', value: 'nenhum' },
  { label: 'Problema menor', value: 'menor' },
  { label: 'Problema moderado', value: 'moderado' },
  { label: 'Problema sério', value: 'serio' },
]

export function MDQStep({ data, setData, onPrev, onNext }: StepComponentProps) {
  const scores = data.mdq
  const yesCount = scores.filter((v) => v === 1).length
  const answered = scores.filter((v) => v !== null).length

  const handleAnswer = (index: number, value: number) => {
    const updated = [...scores]
    updated[index] = value
    setData({ ...data, mdq: updated })
  }

  return (
    <div>
      <SectionTitle
        icon="🔄"
        title="MDQ — Questionário de Humor"
        subtitle="Rastreamento de transtorno bipolar"
        badge="Bipolaridade"
      />

      <div className="space-y-3">
        {MDQ_QUESTIONS.map((q, i) => (
          <ScaleQuestionField
            key={i}
            index={i}
            question={q}
            value={scores[i]}
            onChange={(v) => handleAnswer(i, v)}
            options={MDQ_OPTIONS}
          />
        ))}
      </div>

      {answered === MDQ_QUESTIONS.length && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-4">
            <span className="text-sm text-zinc-400">
              Respostas &quot;Sim&quot;:{' '}
            </span>
            <span className="text-lg font-semibold text-white">
              {yesCount}/13
            </span>
            {yesCount >= 7 && (
              <span className="ml-2 text-xs text-amber-400">
                Rastreamento positivo (≥7)
              </span>
            )}
          </div>

          <RadioGroup
            label="Os sintomas ocorreram ao mesmo tempo?"
            value={data.mdqSimultaneo}
            onChange={(v) => setData({ ...data, mdqSimultaneo: v })}
            options={[
              { label: 'Sim', value: 'sim' },
              { label: 'Não', value: 'nao' },
            ]}
            inline
          />

          <RadioGroup
            label="Qual o impacto que causaram?"
            value={data.mdqImpacto}
            onChange={(v) => setData({ ...data, mdqImpacto: v })}
            options={IMPACTO_OPTIONS}
          />
        </div>
      )}

      <div className="mt-2 text-right text-xs text-zinc-500">
        {answered}/{MDQ_QUESTIONS.length} respondidas
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
