// frontend/features/assessment/components/steps/CanalPercepcaoStep.tsx
'use client'

import { twMerge } from 'tailwind-merge'

import type { StepComponentProps } from '../assessment.interface'
import { RadioGroup, Select, Textarea, SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

const URGENCIA_OPTIONS = [
  { label: 'Preciso de ajuda agora', value: 'urgente' },
  { label: 'Registro para melhoria futura', value: 'registro' },
] as const

const TIPO_OPTIONS = [
  { id: 'estresse', label: 'Estresse', icon: '😰' },
  { id: 'sobrecarga', label: 'Sobrecarga', icon: '⚡' },
  { id: 'assedio_moral', label: 'Assédio Moral', icon: '🚫' },
  { id: 'assedio_sexual', label: 'Assédio Sexual', icon: '⛔' },
  { id: 'conflito', label: 'Conflito', icon: '💥' },
  { id: 'condicoes_fisicas', label: 'Condições Físicas', icon: '🏗️' },
  { id: 'falta_recursos', label: 'Falta de Recursos', icon: '🔧' },
  { id: 'discriminacao', label: 'Discriminação', icon: '⚖️' },
  { id: 'outro', label: 'Outro', icon: '📝' },
] as const

const FREQUENCIA_OPTIONS = [
  { label: 'Isolado', value: 'isolado' },
  { label: 'Recorrente', value: 'recorrente' },
  { label: 'Contínuo', value: 'continuo' },
] as const

const IMPACTO_OPTIONS = [
  { label: 'Baixo', value: 'baixo' },
  { label: 'Moderado', value: 'moderado' },
  { label: 'Alto', value: 'alto' },
  { label: 'Crítico', value: 'critico' },
] as const

interface CanalPercepcao {
  urgencia: string
  tipo: string
  frequencia: string
  setor: string
  impacto: string
  descricao: string
  sugestao: string
}

const EMPTY_CANAL: CanalPercepcao = {
  urgencia: '',
  tipo: '',
  frequencia: '',
  setor: '',
  impacto: '',
  descricao: '',
  sugestao: '',
}

export function CanalPercepcaoStep({
  data,
  setData,
  onPrev,
  onNext,
  companyContext,
}: StepComponentProps) {
  const canal: CanalPercepcao = (data.canal_percepcao as CanalPercepcao) ?? { ...EMPTY_CANAL }

  const update = (field: keyof CanalPercepcao, value: string) => {
    setData({ ...data, canal_percepcao: { ...canal, [field]: value } })
  }

  const departments = companyContext?.departments ?? []
  const setorOptions = [
    ...departments.map((d) => ({ label: d, value: d })),
    { label: 'Outro', value: 'outro' },
  ]

  const isValid =
    canal.urgencia !== '' &&
    canal.tipo !== '' &&
    canal.frequencia !== '' &&
    canal.setor !== '' &&
    canal.impacto !== '' &&
    canal.descricao.trim().length > 0

  return (
    <div>
      <SectionTitle
        icon="📢"
        title="Canal de Percepção"
        subtitle="Registre sua percepção sobre riscos psicossociais no ambiente de trabalho. Todas as respostas são anonimizadas."
        required
      />

      {canal.urgencia === 'urgente' && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-sm font-semibold text-red-400">
            Se você precisa de ajuda imediata, ligue para o CVV — 188 (24h, gratuito)
          </p>
          <p className="mt-1 text-sm text-red-300">
            Ou acesse{' '}
            <a
              href="https://www.cvv.org.br"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-red-200"
            >
              cvv.org.br
            </a>
          </p>
        </div>
      )}

      <div className="space-y-6">
        <RadioGroup
          label="Urgência"
          value={canal.urgencia}
          onChange={(v) => update('urgencia', v)}
          options={URGENCIA_OPTIONS}
          required
          inline
        />

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-300">
            Tipo de Situação<span className="ml-0.5 text-lime-400">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TIPO_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update('tipo', opt.id)}
                className={twMerge(
                  'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                  canal.tipo === opt.id
                    ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                    : 'border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600'
                )}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <RadioGroup
          label="Frequência"
          value={canal.frequencia}
          onChange={(v) => update('frequencia', v)}
          options={FREQUENCIA_OPTIONS}
          required
          inline
        />

        <Select
          label="Setor / Departamento"
          value={canal.setor}
          onChange={(v) => update('setor', v)}
          options={setorOptions}
          placeholder="Selecione o setor"
          required
        />

        <RadioGroup
          label="Impacto percebido"
          value={canal.impacto}
          onChange={(v) => update('impacto', v)}
          options={IMPACTO_OPTIONS}
          required
          inline
        />

        <Textarea
          label="Descrição da situação"
          value={canal.descricao}
          onChange={(v) => update('descricao', v)}
          placeholder="Descreva a situação que deseja reportar..."
          required
          rows={4}
        />

        <Textarea
          label="Sugestão de melhoria"
          value={canal.sugestao}
          onChange={(v) => update('sugestao', v)}
          placeholder="Se tiver alguma sugestão, compartilhe aqui..."
          rows={3}
          hint="Campo opcional."
        />
      </div>

      <StepNavigation
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={!isValid}
        nextDisabledMessage={
          !isValid
            ? 'Preencha todos os campos obrigatórios para continuar.'
            : undefined
        }
      />
    </div>
  )
}
