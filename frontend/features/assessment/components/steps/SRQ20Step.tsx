// frontend/features/assessment/components/steps/SRQ20Step.tsx
'use client'

import { useMemo } from 'react'
import { twMerge } from 'tailwind-merge'

import type { StepComponentProps } from '../assessment.interface'
import {
  SRQ20_QUESTIONS,
  SRQ20_CATEGORY_MAP,
  SRQ20_SUICIDAL_INDICES,
} from '../constants/scales/srq20'
import { SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

const BINARY_OPTIONS = [
  { label: 'Sim', value: 1 },
  { label: 'Não', value: 0 },
] as const

const CATEGORY_ORDER = [
  'Sintomas Somáticos',
  'Humor, Energia e Motivação',
  'Cognição e Funcionamento',
  'Ansiedade e Tensão',
] as const

function CVVAlert() {
  return (
    <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
      <p className="text-sm font-semibold text-red-400">
        Se você está passando por um momento difícil, saiba que não precisa enfrentar isso sozinho(a).
      </p>
      <p className="mt-2 text-sm text-red-300">
        Ligue para o <strong>CVV — 188</strong> (24h, gratuito) ou acesse{' '}
        <a
          href="https://www.cvv.org.br"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-red-200"
        >
          cvv.org.br
        </a>
      </p>
    </div>
  )
}

export function SRQ20Step({ data, setData, onPrev, onNext }: StepComponentProps) {
  const answers: number[] = (data.srq20_answers as number[]) ?? []
  const answered = answers.filter((v) => v !== undefined && v !== null).length
  const isComplete = answered >= SRQ20_QUESTIONS.length

  const handleAnswer = (index: number, value: number) => {
    const updated = [...answers]
    updated[index] = value
    setData({ ...data, srq20_answers: updated })
  }

  const showCVV = useMemo(
    () => SRQ20_SUICIDAL_INDICES.some((i) => answers[i] === 1),
    [answers]
  )

  return (
    <div>
      <SectionTitle
        icon="📋"
        title="SRQ-20 — Rastreio de Saúde Mental"
        subtitle="Responda Sim ou Não para cada pergunta, pensando nas últimas 4 semanas."
        required
      />

      {CATEGORY_ORDER.map((categoryName) => {
        const catInfo = SRQ20_CATEGORY_MAP[categoryName]
        const catIcon = SRQ20_QUESTIONS[catInfo.indices[0]].icon

        return (
          <div key={categoryName} className="mb-6">
            <div className="mb-3 flex items-center gap-2 border-b border-zinc-700/50 pb-2">
              <span className="text-lg">{catIcon}</span>
              <h3 className="text-sm font-semibold text-zinc-300">{categoryName}</h3>
              <span className="ml-auto text-xs text-zinc-500">
                {catInfo.indices.filter((i) => answers[i] !== undefined && answers[i] !== null).length}/{catInfo.max}
              </span>
            </div>

            <div className="space-y-2">
              {catInfo.indices.map((qIdx) => {
                const question = SRQ20_QUESTIONS[qIdx]
                const currentValue = answers[qIdx]
                const isSuicidal = (SRQ20_SUICIDAL_INDICES as readonly number[]).includes(qIdx)

                return (
                  <div key={qIdx}>
                    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4">
                      <div className="mb-2 flex items-start gap-2">
                        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-zinc-700 text-xs font-medium text-zinc-300">
                          {qIdx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-zinc-200">{question.q}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">{question.hint}</p>
                        </div>
                      </div>
                      <div className="ml-8 flex gap-2">
                        {BINARY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleAnswer(qIdx, opt.value)}
                            className={twMerge(
                              'rounded-lg border px-4 py-1.5 text-xs font-medium transition-colors',
                              currentValue === opt.value
                                ? opt.value === 1
                                  ? 'border-amber-400 bg-amber-400/15 text-amber-400'
                                  : 'border-lime-400 bg-lime-400/15 text-lime-400'
                                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {isSuicidal && currentValue === 1 && <CVVAlert />}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {showCVV && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-sm font-semibold text-red-400">
            Identificamos respostas que indicam sofrimento importante.
          </p>
          <p className="mt-1 text-sm text-red-300">
            O Centro de Valorização da Vida (CVV) está disponível 24h: <strong>188</strong>
          </p>
        </div>
      )}

      <div className="mt-2 text-right text-xs text-zinc-500">
        {answered}/{SRQ20_QUESTIONS.length} respondidas
      </div>

      <StepNavigation
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={!isComplete}
        nextDisabledMessage={
          !isComplete
            ? `Responda todas as ${SRQ20_QUESTIONS.length} perguntas para continuar.`
            : undefined
        }
      />
    </div>
  )
}
