// frontend/features/assessment/components/steps/AEPStep.tsx
'use client'

import { useMemo } from 'react'
import { twMerge } from 'tailwind-merge'

import type { StepComponentProps } from '../assessment.interface'
import {
  AEP_QUESTIONS,
  AEP_LIKERT_OPTIONS,
  AEP_REVERSE_INDICES,
  AEP_CATEGORY_DEFINITIONS,
} from '../constants/scales/aep'
import { SectionTitle, Textarea } from '../fields'
import { StepNavigation } from '../StepNavigation'

const DIMENSION_COLOR_MAP: Record<string, string> = {
  'Pressão por Metas': 'text-red-400',
  'Autonomia e Controle': 'text-blue-400',
  'Pausas e Jornada': 'text-amber-400',
  'Relações Interpessoais': 'text-emerald-400',
  'Demandas Cognitivas': 'text-purple-400',
  'Ambiente e Organização': 'text-cyan-400',
}

export function AEPStep({ data, setData, onPrev, onNext }: StepComponentProps) {
  const answers: number[] = (data.aep_answers as number[]) ?? []
  const percepcaoLivre = (data.aep_percepcao_livre as string) ?? ''
  const answeredCount = answers.filter((v) => v !== undefined && v !== null).length
  const allAnswered = answeredCount >= AEP_QUESTIONS.length

  const handleAnswer = (index: number, value: number) => {
    const updated = [...answers]
    while (updated.length < AEP_QUESTIONS.length) updated.push(0)
    updated[index] = value
    setData({ ...data, aep_answers: updated })
  }

  const dimensionScores = useMemo(() => {
    if (!allAnswered) return null

    return AEP_CATEGORY_DEFINITIONS.map((cat) => {
      const score = cat.indices.reduce((sum, i) => {
        const val = answers[i] ?? 0
        const adjusted = (AEP_REVERSE_INDICES as readonly number[]).includes(i) ? 4 - val : val
        return sum + adjusted
      }, 0)
      return { name: cat.name, score, max: cat.maxScore }
    })
  }, [answers, allAnswered])

  let currentCategory = ''

  return (
    <div>
      <SectionTitle
        icon="🏭"
        title="AEP — Avaliação Ergonômica Preliminar"
        subtitle="Avalie cada afirmação sobre seu ambiente de trabalho."
        required
      />

      <div className="space-y-2">
        {AEP_QUESTIONS.map((question, i) => {
          const showDivider = question.category !== currentCategory
          if (showDivider) currentCategory = question.category

          return (
            <div key={i}>
              {showDivider && (
                <div className="mb-3 mt-6 flex items-center gap-2 border-b border-zinc-700/50 pb-2 first:mt-0">
                  <span className="text-lg">{question.icon}</span>
                  <h3 className="text-sm font-semibold text-zinc-300">{question.category}</h3>
                </div>
              )}
              <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4">
                <div className="mb-2 flex items-start gap-2">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-zinc-700 text-xs font-medium text-zinc-300">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-200">{question.q}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{question.hint}</p>
                  </div>
                </div>
                <div className="ml-8 flex flex-wrap gap-2">
                  {AEP_LIKERT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAnswer(i, opt.value)}
                      className={twMerge(
                        'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                        answers[i] === opt.value
                          ? 'border-lime-400 bg-lime-400/15 text-lime-400'
                          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2 text-right text-xs text-zinc-500">
        {answeredCount}/{AEP_QUESTIONS.length} respondidas
      </div>

      {dimensionScores && (
        <div className="mt-6 rounded-lg border border-zinc-700/50 bg-zinc-800/20 p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-300">Resumo por Dimensão</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {dimensionScores.map((dim) => {
              const pct = Math.round((dim.score / dim.max) * 100)
              const colorClass = DIMENSION_COLOR_MAP[dim.name] ?? 'text-zinc-400'
              return (
                <div key={dim.name} className="flex items-center gap-3 rounded-lg bg-zinc-800/40 px-3 py-2">
                  <div className="flex-1">
                    <p className={twMerge('text-xs font-medium', colorClass)}>{dim.name}</p>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-700">
                      <div
                        className={twMerge(
                          'h-1.5 rounded-full transition-all',
                          pct >= 75 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-lime-500'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-zinc-400">
                    {dim.score}/{dim.max}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <Textarea
          label="Se pudesse mudar uma coisa no seu ambiente de trabalho, o que seria?"
          value={percepcaoLivre}
          onChange={(v) => setData({ ...data, aep_percepcao_livre: v })}
          placeholder="Descreva com suas palavras..."
          rows={3}
          hint="Campo opcional. Sua resposta será tratada de forma anonimizada."
        />
      </div>

      <StepNavigation
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={!allAnswered}
        nextDisabledMessage={
          !allAnswered
            ? `Responda todas as ${AEP_QUESTIONS.length} perguntas para continuar.`
            : undefined
        }
      />
    </div>
  )
}
