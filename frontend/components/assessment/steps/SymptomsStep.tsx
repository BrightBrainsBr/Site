// frontend/components/assessment/steps/SymptomsStep.tsx
'use client'

import { twMerge } from 'tailwind-merge'

import type { StepComponentProps } from '../assessment.interface'
import { SYMPTOM_CATEGORIES } from '../constants/symptom-categories'
import { SectionTitle, Textarea } from '../fields'
import { StepNavigation } from '../StepNavigation'

export function SymptomsStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const toggleSymptom = (item: string) => {
    const current = data.sintomasAtuais
    const updated = current.includes(item)
      ? current.filter((s) => s !== item)
      : [...current, item]
    setData({ ...data, sintomasAtuais: updated })
  }

  return (
    <div>
      <SectionTitle
        icon="🔍"
        title="Sintomas Atuais"
        subtitle="Selecione os sintomas presentes nas últimas semanas"
        badge={`${data.sintomasAtuais.length} selecionados`}
      />

      <div className="space-y-5">
        {SYMPTOM_CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <h3 className="mb-2 text-sm font-semibold text-zinc-300">
              {cat.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {cat.items.map((item) => {
                const selected = data.sintomasAtuais.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleSymptom(item)}
                    className={twMerge(
                      'rounded-full border px-3 py-1.5 text-xs transition-colors',
                      selected
                        ? 'border-lime-400 bg-lime-400/15 text-lime-400'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    )}
                  >
                    {item}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <Textarea
          label="Outros sintomas não listados"
          value={data.outrosSintomas}
          onChange={(v) => setData({ ...data, outrosSintomas: v })}
          placeholder="Descreva outros sintomas relevantes..."
          rows={3}
        />
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
