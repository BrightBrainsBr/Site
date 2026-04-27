// frontend/features/assessment/components/steps/nr1/ErgonomicoStep.tsx
'use client'

import type { StepComponentProps } from '../../assessment.interface'
import { SectionTitle } from '../../fields'
import { StepNavigation } from '../../StepNavigation'
import { LikertField } from './LikertField'

const ERGONOMIC_FIELDS = [
  {
    key: 'posture_level',
    label: 'Postura inadequada',
    hint: 'Trabalhar em posições desconfortáveis por longos períodos.',
  },
  {
    key: 'repetition_level',
    label: 'Movimentos repetitivos',
    hint: 'Repetição constante dos mesmos movimentos.',
  },
  {
    key: 'manual_force_level',
    label: 'Esforço físico / Levantamento de peso',
    hint: 'Necessidade de aplicar força manual ou carregar peso.',
  },
  {
    key: 'breaks_level',
    label: 'Falta de pausas',
    hint: 'Ausência de pausas regulares durante a jornada.',
  },
  {
    key: 'screen_level',
    label: 'Uso prolongado de tela',
    hint: 'Tempo excessivo em frente a computador ou monitores.',
  },
  {
    key: 'mobility_level',
    label: 'Restrição de mobilidade',
    hint: 'Impossibilidade de se movimentar livremente no trabalho.',
  },
  {
    key: 'cognitive_effort_level',
    label: 'Esforço cognitivo',
    hint: 'Nível de concentração mental exigido nas tarefas.',
  },
] as const

export function ErgonomicoStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const update = (field: string, value: number) => {
    setData({ ...data, [field]: value })
  }

  const answered = ERGONOMIC_FIELDS.filter(
    (f) => (data[f.key] as number | null) != null
  ).length
  const isComplete = answered === ERGONOMIC_FIELDS.length

  return (
    <div>
      <SectionTitle
        icon="🦴"
        title="Riscos Ergonômicos"
        subtitle="Avalie os fatores ergonômicos no seu ambiente de trabalho."
        required
      />

      <div className="space-y-3">
        {ERGONOMIC_FIELDS.map((field) => (
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
        {answered}/{ERGONOMIC_FIELDS.length} respondidas
      </div>

      <StepNavigation
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={!isComplete}
        nextDisabledMessage={
          !isComplete
            ? 'Avalie todos os riscos ergonômicos para continuar.'
            : undefined
        }
      />
    </div>
  )
}
