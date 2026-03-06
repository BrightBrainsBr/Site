// frontend/components/assessment/steps/ClinicalProfileStep.tsx
'use client'

import { twMerge } from 'tailwind-merge'

import type {
  PatientProfile,
  StepComponentProps,
} from '../assessment.interface'
import { SectionTitle, Textarea } from '../fields'
import { StepNavigation } from '../StepNavigation'

const PROFILES: {
  id: PatientProfile
  icon: string
  label: string
  desc: string
}[] = [
  {
    id: 'adulto',
    icon: '🧑',
    label: 'Adulto',
    desc: 'Avaliação psiquiátrica geral',
  },
  {
    id: 'infantil',
    icon: '👶',
    label: 'Infantil',
    desc: 'Crianças e adolescentes',
  },
  {
    id: 'neuro',
    icon: '🧠',
    label: 'Neurológico',
    desc: 'Foco neurológico (Parkinson, ELA, etc.)',
  },
  {
    id: 'executivo',
    icon: '💼',
    label: 'Executivo',
    desc: 'Saúde mental de alta performance',
  },
  {
    id: 'longevidade',
    icon: '🌿',
    label: 'Longevidade',
    desc: 'Envelhecimento saudável',
  },
]

export function ClinicalProfileStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const update = (field: string, value: string) => {
    setData({ ...data, [field]: value })
  }

  return (
    <div>
      <SectionTitle
        icon="🎯"
        title="Perfil Clínico"
        subtitle="Selecione o perfil e descreva o motivo principal da avaliação"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROFILES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => update('publico', p.id)}
            className={twMerge(
              'flex flex-col items-start rounded-lg border p-4 text-left transition-colors',
              data.publico === p.id
                ? 'border-lime-400 bg-lime-400/10'
                : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
            )}
          >
            <span className="mb-2 text-2xl">{p.icon}</span>
            <span
              className={twMerge(
                'text-sm font-semibold',
                data.publico === p.id ? 'text-lime-400' : 'text-white'
              )}
            >
              {p.label}
            </span>
            <span className="text-xs text-zinc-400">{p.desc}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Textarea
          label="Queixa principal"
          value={data.queixaPrincipal}
          onChange={(v) => update('queixaPrincipal', v)}
          placeholder="Descreva o motivo principal que levou à busca por avaliação..."
          required
          rows={4}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Textarea
            label="Tempo dos sintomas"
            value={data.tempoSintomas}
            onChange={(v) => update('tempoSintomas', v)}
            placeholder="Há quanto tempo os sintomas estão presentes?"
            rows={2}
          />
          <Textarea
            label="Evento desencadeador"
            value={data.eventoDesencadeador}
            onChange={(v) => update('eventoDesencadeador', v)}
            placeholder="Houve algum evento que iniciou/piorou os sintomas?"
            rows={2}
          />
        </div>
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
