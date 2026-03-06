// frontend/components/assessment/steps/FamilyHistoryStep.tsx
'use client'

import type { StepComponentProps } from '../assessment.interface'
import { FAMILY_CONDITIONS } from '../constants/medical-options'
import { CheckboxGroup, SectionTitle, Textarea } from '../fields'
import { StepNavigation } from '../StepNavigation'

export function FamilyHistoryStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const update = (field: string, value: unknown) => {
    setData({ ...data, [field]: value })
  }

  return (
    <div>
      <SectionTitle
        icon="👨‍👩‍👧‍👦"
        title="Histórico Familiar"
        subtitle="Condições de saúde mental/neurológica na família"
      />

      <div className="space-y-6">
        <CheckboxGroup
          label="Condições presentes na família (pais, irmãos, avós)"
          selected={data.familiaCondicoes}
          onChange={(v) => update('familiaCondicoes', v)}
          options={FAMILY_CONDITIONS}
          columns={3}
        />

        <Textarea
          label="Detalhes do histórico familiar"
          value={data.familiaDetalhes}
          onChange={(v) => update('familiaDetalhes', v)}
          placeholder="Quem na família possui a condição, grau de parentesco..."
          rows={4}
        />

        <Textarea
          label="Informações adicionais"
          value={data.infoAdicional}
          onChange={(v) => update('infoAdicional', v)}
          placeholder="Algo mais que gostaria de informar para a avaliação?"
          rows={4}
        />
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
