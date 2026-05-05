// frontend/features/assessment/components/steps/nr1/BiologicoStep.tsx
'use client'

import type { StepComponentProps } from '../../assessment.interface'
import { BIOLOGICAL_AGENTS } from '../../constants/nr1-options'
import { CheckboxGroup, SectionTitle, Textarea } from '../../fields'
import { StepNavigation } from '../../StepNavigation'

export function BiologicoStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const exposures = (data.biological_exposures as string[]) ?? []

  return (
    <div>
      <SectionTitle
        icon="🦠"
        title="Riscos Biológicos"
        subtitle="Selecione os agentes biológicos aos quais você está exposto(a) no trabalho."
      />

      <div className="space-y-5">
        <CheckboxGroup
          label="Agentes biológicos presentes no ambiente"
          selected={exposures}
          onChange={(selected) =>
            setData({ ...data, biological_exposures: selected })
          }
          options={[...BIOLOGICAL_AGENTS]}
          columns={2}
          hint="Selecione todos que se aplicam. Deixe em branco se não houver exposição."
        />

        <Textarea
          label="Detalhes adicionais (opcional)"
          value={(data.biological_details as string) ?? ''}
          onChange={(v) => setData({ ...data, biological_details: v })}
          placeholder="Descreva detalhes sobre a exposição, frequência, uso de EPIs, etc."
          rows={3}
        />
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
