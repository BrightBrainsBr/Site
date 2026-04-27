// frontend/features/assessment/components/steps/nr1/AcidentesStep.tsx
'use client'

import { twMerge } from 'tailwind-merge'

import type { StepComponentProps } from '../../assessment.interface'
import { SectionTitle, Textarea } from '../../fields'
import { StepNavigation } from '../../StepNavigation'

interface ConditionalSectionProps {
  label: string
  hint: string
  checked: boolean
  onToggle: (v: boolean) => void
  description: string
  descriptionValue: string
  onDescriptionChange: (v: string) => void
  placeholder: string
  variant?: 'default' | 'warning'
}

function ConditionalSection({
  label,
  hint,
  checked,
  onToggle,
  description,
  descriptionValue,
  onDescriptionChange,
  placeholder,
  variant = 'default',
}: ConditionalSectionProps) {
  const isWarning = variant === 'warning'

  return (
    <div
      className={twMerge(
        'rounded-lg border p-4 transition-colors',
        checked
          ? isWarning
            ? 'border-red-500/40 bg-red-500/5'
            : 'border-amber-500/40 bg-amber-500/5'
          : 'border-zinc-700/50 bg-zinc-800/30'
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(!checked)}
        className="flex w-full items-start gap-3 text-left"
      >
        <span
          className={twMerge(
            'mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border-2 transition-colors',
            checked
              ? isWarning
                ? 'border-red-400 bg-red-400'
                : 'border-amber-400 bg-amber-400'
              : 'border-zinc-600'
          )}
        >
          {checked && (
            <svg
              className="h-3 w-3 text-zinc-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-200">{label}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
        </div>
      </button>

      {checked && (
        <div className="ml-8 mt-3">
          <Textarea
            label={description}
            value={descriptionValue}
            onChange={onDescriptionChange}
            placeholder={placeholder}
            rows={3}
          />
        </div>
      )}
    </div>
  )
}

export function AcidentesStep({
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
        icon="🚨"
        title="Acidentes e Doenças Ocupacionais"
        subtitle="Informe se você vivenciou alguma das situações abaixo. Marque apenas as que se aplicam."
      />

      <div className="space-y-4">
        <ConditionalSection
          label="Sofri um acidente de trabalho"
          hint="Acidente ocorrido durante o exercício do trabalho."
          checked={!!data.had_accident}
          onToggle={(v) => update('had_accident', v)}
          description="Descreva o acidente"
          descriptionValue={(data.accident_description as string) ?? ''}
          onDescriptionChange={(v) => update('accident_description', v)}
          placeholder="Descreva o que aconteceu, quando e quais foram as consequências."
        />

        <ConditionalSection
          label="Presenciei ou tive um quase-acidente"
          hint="Situação que quase resultou em acidente."
          checked={!!data.had_near_miss}
          onToggle={(v) => update('had_near_miss', v)}
          description="Descreva o quase-acidente"
          descriptionValue={(data.near_miss_description as string) ?? ''}
          onDescriptionChange={(v) => update('near_miss_description', v)}
          placeholder="Descreva a situação e o que poderia ter acontecido."
        />

        <ConditionalSection
          label="Fui diagnosticado(a) com doença ocupacional"
          hint="Doença causada ou agravada pelo trabalho."
          checked={!!data.had_work_disease}
          onToggle={(v) => update('had_work_disease', v)}
          description="Descreva a doença"
          descriptionValue={(data.work_disease_description as string) ?? ''}
          onDescriptionChange={(v) => update('work_disease_description', v)}
          placeholder="Descreva o diagnóstico, tratamento e situação atual."
        />

        <div>
          <ConditionalSection
            label="Quero relatar assédio ou violência"
            hint="Assédio moral, sexual, discriminação ou violência no trabalho."
            checked={!!data.report_harassment}
            onToggle={(v) => update('report_harassment', v)}
            description="Descreva a situação"
            descriptionValue={
              (data.harassment_report_description as string) ?? ''
            }
            onDescriptionChange={(v) =>
              update('harassment_report_description', v)
            }
            placeholder="Descreva o que aconteceu. Este relato é tratado com total sigilo."
            variant="warning"
          />
          {data.report_harassment && (
            <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/8 p-4">
              <div className="flex items-start gap-3">
                <span className="text-base">🔒</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-400">
                    Este relato é 100% anônimo e protegido
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Seu nome, e-mail e IP não são vinculados a esta resposta. A
                    equipe de compliance receberá apenas o conteúdo do relato,
                    sem possibilidade de identificação individual.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
