// frontend/features/assessment/components/steps/nr1/PsicossocialStep.tsx
'use client'

import type { StepComponentProps } from '../../assessment.interface'
import { SectionTitle } from '../../fields'
import { StepNavigation } from '../../StepNavigation'
import { LikertField } from './LikertField'

const ORGANIZATIONAL_FIELDS = [
  {
    key: 'workload_level',
    label: 'Carga de trabalho',
    hint: 'Volume de tarefas e responsabilidades.',
  },
  {
    key: 'pace_level',
    label: 'Ritmo de trabalho',
    hint: 'Velocidade e pressão por resultados.',
  },
  {
    key: 'autonomy_level',
    label: 'Falta de autonomia',
    hint: 'Pouca liberdade para tomar decisões sobre suas tarefas.',
  },
  {
    key: 'leadership_level',
    label: 'Problemas com liderança',
    hint: 'Dificuldade no relacionamento ou comunicação com gestores.',
  },
  {
    key: 'relationships_level',
    label: 'Conflitos interpessoais',
    hint: 'Problemas de relacionamento com colegas de trabalho.',
  },
  {
    key: 'recognition_level',
    label: 'Falta de reconhecimento',
    hint: 'Ausência de valorização pelo trabalho realizado.',
  },
  {
    key: 'clarity_level',
    label: 'Falta de clareza nas funções',
    hint: 'Indefinição sobre responsabilidades e expectativas.',
  },
  {
    key: 'balance_level',
    label: 'Desequilíbrio trabalho-vida',
    hint: 'Dificuldade em conciliar trabalho e vida pessoal.',
  },
] as const

const VIOLENCE_FIELDS = [
  {
    key: 'violence_level',
    label: 'Violência no trabalho',
    hint: 'Agressão física, verbal ou psicológica no ambiente de trabalho.',
  },
  {
    key: 'harassment_level',
    label: 'Assédio moral ou sexual',
    hint: 'Comportamentos abusivos, humilhações ou assédio.',
  },
] as const

const ALL_FIELDS = [...ORGANIZATIONAL_FIELDS, ...VIOLENCE_FIELDS]

export function PsicossocialStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const update = (field: string, value: number) => {
    setData({ ...data, [field]: value })
  }

  const answered = ALL_FIELDS.filter(
    (f) => (data[f.key] as number | null) != null
  ).length
  const isComplete = answered === ALL_FIELDS.length

  return (
    <div>
      <SectionTitle
        icon="🧠"
        title="Fatores Psicossociais"
        subtitle="Avalie os fatores psicossociais que podem afetar sua saúde mental no trabalho."
        required
      />

      <div className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 border-b border-zinc-700/50 pb-2 text-sm font-semibold text-zinc-300">
          <span className="text-base">📊</span>
          Fatores Organizacionais
        </h3>
        <div className="space-y-3">
          {ORGANIZATIONAL_FIELDS.map((field) => (
            <LikertField
              key={field.key}
              label={field.label}
              hint={field.hint}
              value={data[field.key]}
              onChange={(v) => update(field.key, v)}
            />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="mb-3 flex items-center gap-2 border-b border-red-500/30 pb-2 text-sm font-semibold text-red-400">
          <span className="text-base">⚠️</span>
          Violência e Assédio
        </h3>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-1">
          <div className="space-y-3 p-3">
            {VIOLENCE_FIELDS.map((field) => (
              <LikertField
                key={field.key}
                label={field.label}
                hint={field.hint}
                value={data[field.key]}
                onChange={(v) => update(field.key, v)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 text-right text-xs text-zinc-500">
        {answered}/{ALL_FIELDS.length} respondidas
      </div>

      <StepNavigation
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={!isComplete}
        nextDisabledMessage={
          !isComplete
            ? 'Avalie todos os fatores psicossociais para continuar.'
            : undefined
        }
      />
    </div>
  )
}
