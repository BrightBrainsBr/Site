// frontend/features/assessment/components/steps/nr1/FisicoStep.tsx
'use client'

import type { StepComponentProps } from '../../assessment.interface'
import { SectionTitle } from '../../fields'
import { StepNavigation } from '../../StepNavigation'
import { LikertField } from './LikertField'

const PHYSICAL_FIELDS = [
  {
    key: 'noise_level',
    label: 'Ruído',
    hint: 'Exposição a barulho excessivo no ambiente de trabalho.',
  },
  {
    key: 'temperature_level',
    label: 'Temperatura',
    hint: 'Calor ou frio extremo no local de trabalho.',
  },
  {
    key: 'lighting_level',
    label: 'Iluminação',
    hint: 'Iluminação inadequada (excesso ou deficiência).',
  },
  {
    key: 'vibration_level',
    label: 'Vibração',
    hint: 'Exposição a equipamentos ou veículos que vibram.',
  },
  {
    key: 'humidity_level',
    label: 'Umidade',
    hint: 'Ambiente com umidade excessiva ou muito seco.',
  },
] as const

export function FisicoStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const update = (field: string, value: number) => {
    setData({ ...data, [field]: value })
  }

  const answered = PHYSICAL_FIELDS.filter(
    (f) => (data[f.key] as number | null) != null
  ).length
  const isComplete = answered === PHYSICAL_FIELDS.length

  return (
    <div>
      <SectionTitle
        icon="🔊"
        title="Riscos Físicos"
        subtitle="Avalie a exposição no seu ambiente de trabalho."
        required
      />

      <div className="space-y-3">
        {PHYSICAL_FIELDS.map((field) => (
          <LikertField
            key={field.key}
            label={field.label}
            hint={field.hint}
            value={data[field.key]}
            onChange={(v) => update(field.key, v)}
          />
        ))}
      </div>

      <div className="mt-2 text-right text-xs text-zinc-500">
        {answered}/{PHYSICAL_FIELDS.length} respondidas
      </div>

      <StepNavigation
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={!isComplete}
        nextDisabledMessage={
          !isComplete
            ? 'Avalie todos os riscos físicos para continuar.'
            : undefined
        }
      />
    </div>
  )
}
