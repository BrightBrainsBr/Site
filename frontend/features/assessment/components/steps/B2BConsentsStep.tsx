// frontend/features/assessment/components/steps/B2BConsentsStep.tsx
'use client'

import { twMerge } from 'tailwind-merge'

import type { StepComponentProps } from '../assessment.interface'
import { SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

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
  const checked = data.lgpd_consent === true

  const toggle = () => {
    setData({ ...data, lgpd_consent: !checked })
  }

  return (
    <div>
      <SectionTitle
        icon="🔒"
        title="Consentimento — LGPD"
        subtitle="Leia e aceite o consentimento abaixo para prosseguir."
        required
      />

      <div className="mb-6 rounded-lg border border-zinc-700/50 bg-zinc-800/20 p-5">
        <h3 className="mb-2 text-sm font-semibold text-zinc-200">
          Sobre a coleta de dados
        </h3>
        <p className="text-xs leading-relaxed text-zinc-400">
          Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
          e a Norma Regulamentadora NR-1 (Gerenciamento de Riscos Ocupacionais), informamos que
          os dados coletados neste questionário serão utilizados exclusivamente para fins de
          análise de riscos ocupacionais e promoção da saúde e segurança no trabalho.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          Todas as respostas são <strong className="text-zinc-300">anonimizadas</strong> antes
          de serem disponibilizadas para a empresa. Nenhuma informação que permita a identificação
          individual do colaborador será compartilhada com gestores, RH ou qualquer área da empresa.
          Os resultados são apresentados apenas de forma consolidada e agregada por setor ou
          departamento.
        </p>
      </div>

      <button
        type="button"
        onClick={toggle}
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
            Consentimento de dados anonimizados
            <span className="ml-1 text-lime-400">*</span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Declaro que li e compreendi as informações acima. Autorizo o uso dos meus dados de
            forma anonimizada para análises consolidadas de indicadores de saúde e segurança
            ocupacional da empresa, em conformidade com a LGPD e a NR-1.
          </p>
        </div>
      </button>

      <StepNavigation
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={!checked}
        nextDisabledMessage={
          !checked
            ? 'Você precisa aceitar o consentimento obrigatório para continuar.'
            : undefined
        }
      />
    </div>
  )
}
