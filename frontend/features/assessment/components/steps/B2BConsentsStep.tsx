// frontend/features/assessment/components/steps/B2BConsentsStep.tsx
'use client'

import { twMerge } from 'tailwind-merge'

import type { StepComponentProps } from '../assessment.interface'
import { SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

interface ConsentItem {
  key: 'b2b_anonymized_consent' | 'b2c_consent' | 'b2c_contact_consent'
  label: string
  description: string
  required: boolean
}

const CONSENT_ITEMS: ConsentItem[] = [
  {
    key: 'b2b_anonymized_consent',
    label: 'Consentimento de dados anonimizados',
    description:
      'Autorizo o uso dos meus dados de forma anonimizada para análises consolidadas de indicadores da empresa.',
    required: true,
  },
  {
    key: 'b2c_consent',
    label: 'Consentimento para relação médico-paciente',
    description:
      'Autorizo que meus dados sejam salvos no banco de dados da Bright Brains para que possam ser utilizados no contexto da relação "médico-paciente" caso eu venha a realizar uma consulta nesta clínica.',
    required: false,
  },
  {
    key: 'b2c_contact_consent',
    label: 'Consentimento de comunicações',
    description:
      'Autorizo o uso dos meus dados de contato para receber comunicados da Bright Brains.',
    required: false,
  },
]

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-zinc-900"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function B2BConsentsStep({ data, setData, onPrev, onNext }: StepComponentProps) {
  const toggle = (key: ConsentItem['key']) => {
    setData({ ...data, [key]: !data[key] })
  }

  const isValid = data.b2b_anonymized_consent === true

  return (
    <div>
      <SectionTitle
        icon="🔒"
        title="Consentimentos — LGPD"
        subtitle="Leia e marque os consentimentos abaixo. O primeiro é obrigatório para prosseguir."
        required
      />

      <div className="space-y-4">
        {CONSENT_ITEMS.map((item) => {
          const checked = data[item.key] === true

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => toggle(item.key)}
              className={twMerge(
                'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                checked
                  ? 'border-lime-400/50 bg-lime-400/5'
                  : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
              )}
            >
              <span
                className={twMerge(
                  'mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border-2 transition-colors',
                  checked ? 'border-lime-400 bg-lime-400' : 'border-zinc-600'
                )}
              >
                {checked && <CheckIcon />}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200">
                  {item.label}
                  {item.required && <span className="ml-1 text-lime-400">*</span>}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">{item.description}</p>
                {!item.required && (
                  <span className="mt-1 inline-block text-[10px] text-zinc-600">Opcional</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <StepNavigation
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={!isValid}
        nextDisabledMessage={
          !isValid
            ? 'Você precisa aceitar o consentimento obrigatório para continuar.'
            : undefined
        }
      />
    </div>
  )
}
