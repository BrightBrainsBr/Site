// frontend/features/assessment/components/steps/nr1/QuimicoStep.tsx
'use client'

import type { StepComponentProps } from '../../assessment.interface'
import { CHEMICAL_AGENTS } from '../../constants/nr1-options'
import { CheckboxGroup, SectionTitle, Textarea } from '../../fields'
import { StepNavigation } from '../../StepNavigation'

export function QuimicoStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const exposures = (data.chemical_exposures as string[]) ?? []

  return (
    <div>
      <SectionTitle
        icon="🧪"
        title="Riscos Químicos"
        subtitle="Selecione os agentes químicos aos quais você está exposto(a) no trabalho."
      />

      <div className="space-y-5">
        <CheckboxGroup
          label="Agentes químicos presentes no ambiente"
          selected={exposures}
          onChange={(selected) =>
            setData({ ...data, chemical_exposures: selected })
          }
          options={[...CHEMICAL_AGENTS]}
          columns={2}
          hint="Selecione todos que se aplicam. Deixe em branco se não houver exposição."
        />

        <Textarea
          label="Detalhes adicionais (opcional)"
          value={(data.chemical_details as string) ?? ''}
          onChange={(v) => setData({ ...data, chemical_details: v })}
          placeholder="Descreva detalhes sobre a exposição, frequência, uso de EPIs, etc."
          rows={3}
        />
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
