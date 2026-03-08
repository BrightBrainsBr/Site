// frontend/components/assessment/steps/HistoryStep.tsx
'use client'

import type { StepComponentProps } from '../assessment.interface'
import { CHRONIC_CONDITIONS } from '../constants/medical-options'
import { CheckboxGroup, RadioGroup, SectionTitle, Textarea } from '../fields'
import { StepNavigation } from '../StepNavigation'

const YES_NO = [
  { label: 'Sim', value: 'sim' },
  { label: 'Não', value: 'nao' },
]

const YES_NO_NA = [
  { label: 'Sim', value: 'sim' },
  { label: 'Não', value: 'nao' },
  { label: 'Não sei', value: 'nao_sei' },
]

export function HistoryStep({
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
        icon="📋"
        title="Histórico Clínico"
        subtitle="Antecedentes e condições pré-existentes"
      />

      <div className="space-y-6">
        <RadioGroup
          label="Possui diagnóstico psiquiátrico/neurológico anterior?"
          value={data.diagAnterior}
          onChange={(v) => update('diagAnterior', v)}
          options={YES_NO}
          inline
        />

        {data.diagAnterior === 'sim' && (
          <Textarea
            label="Quais diagnósticos?"
            value={data.diagAnterioresDetalhe}
            onChange={(v) => update('diagAnterioresDetalhe', v)}
            placeholder="Ex: Depressão maior (F32), TDAH (F90)..."
            rows={3}
          />
        )}

        <RadioGroup
          label="Está em psicoterapia?"
          value={data.psicoterapia}
          onChange={(v) => update('psicoterapia', v)}
          options={[...YES_NO, { label: 'Já fiz', value: 'ja_fiz' }]}
          inline
        />

        <RadioGroup
          label="Histórico de internação psiquiátrica?"
          value={data.internacao}
          onChange={(v) => update('internacao', v)}
          options={YES_NO}
          inline
        />

        <CheckboxGroup
          label="Condições crônicas"
          selected={data.condicoesCronicas}
          onChange={(v) => update('condicoesCronicas', v)}
          options={CHRONIC_CONDITIONS}
          columns={2}
        />

        <RadioGroup
          label="Realizou exames neurológicos (EEG, RM, TC)?"
          value={data.examesNeuro}
          onChange={(v) => update('examesNeuro', v)}
          options={YES_NO_NA}
          inline
        />

        {data.examesNeuro === 'sim' && (
          <Textarea
            label="Detalhes dos exames"
            value={data.examesNeuroDetalhe}
            onChange={(v) => update('examesNeuroDetalhe', v)}
            placeholder="Descreva quais exames, resultados..."
            rows={3}
          />
        )}
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
