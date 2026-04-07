// frontend/features/assessment/components/steps/CanalPercepcaoStep.tsx
'use client'

import { twMerge } from 'tailwind-merge'

import type { StepComponentProps } from '../assessment.interface'
import { Textarea, SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

const URGENCIA_OPTIONS = [
  { label: 'Preciso de ajuda agora', value: 'urgente' },
  { label: 'Registro para melhoria futura', value: 'registro' },
] as const

const TIPO_OPTIONS = [
  'Estresse excessivo',
  'Assédio moral',
  'Assédio sexual',
  'Sobrecarga de trabalho',
  'Conflito interpessoal',
  'Condições físicas inadequadas',
  'Falta de recursos/ferramentas',
  'Discriminação',
  'Outro',
] as const

const FREQUENCIA_OPTIONS = [
  { label: 'Episódio isolado', value: 'isolado' },
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

function FieldLabel({
  label,
  required,
  hint,
}: {
  label: string
  required?: boolean
  hint?: string
}) {
  return (
    <div className="mb-2">
      <label className="text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

export function CanalPercepcaoStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const canal: CanalPercepcao = (data.canal_percepcao as CanalPercepcao) ?? { ...EMPTY_CANAL }

  const update = (field: keyof CanalPercepcao, value: string) => {
    setData({ ...data, canal_percepcao: { ...canal, [field]: value } })
  }

  const isValid =
    canal.urgencia !== '' &&
    canal.tipo !== '' &&
    canal.frequencia !== '' &&
    canal.impacto !== '' &&
    canal.descricao.trim().length > 0

  return (
    <div>
      <SectionTitle
        icon="📢"
        title="Canal de Percepção de Riscos"
        subtitle="Registre sua percepção sobre riscos psicossociais no ambiente de trabalho. Todas as respostas são anonimizadas."
        required
      />

      {/* Anonymity notice */}
      <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/8 p-4">
        <div className="flex items-start gap-3">
          <span className="text-base">🔒</span>
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              Este relato é 100% anônimo e criptografado
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Seu nome, e-mail e IP não são registrados. O RH terá acesso apenas ao conteúdo
              consolidado, sem possibilidade de identificação individual.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Urgência */}
        <div>
          <FieldLabel
            label="Nível de urgência"
            required
            hint="Selecione 'Preciso de ajuda agora' para situações que demandam ação imediata do RH."
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            {URGENCIA_OPTIONS.map((opt) => {
              const active = canal.urgencia === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('urgencia', opt.value)}
                  className={twMerge(
                    'flex flex-1 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors',
                    active
                      ? 'border-lime-400 bg-lime-400/10 font-semibold text-lime-400'
                      : 'border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                  )}
                >
                  <span
                    className={twMerge(
                      'h-2.5 w-2.5 rounded-full border-2 shrink-0',
                      active ? 'border-lime-400 bg-lime-400' : 'border-zinc-600'
                    )}
                  />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Urgência warning */}
        {canal.urgencia === 'urgente' && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-400">
              ⚠️ Seu relato será encaminhado para triagem prioritária. Se você está em risco
              imediato, procure também o canal de emergência da empresa ou o CVV (188).
            </p>
          </div>
        )}

        {/* Tipo de Situação */}
        <div>
          <FieldLabel
            label="Tipo de situação"
            required
            hint="Selecione a categoria que melhor descreve o que você está vivenciando."
          />
          <div className="flex flex-wrap gap-2">
            {TIPO_OPTIONS.map((t) => {
              const active = canal.tipo === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => update('tipo', t)}
                  className={twMerge(
                    'rounded-lg border px-3 py-2 text-sm transition-colors',
                    active
                      ? 'border-lime-400 bg-lime-400/10 font-semibold text-lime-400'
                      : 'border-zinc-700 bg-zinc-800/20 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                  )}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        {/* Frequência */}
        <div>
          <FieldLabel
            label="Frequência"
            required
            hint="Com que frequência essa situação acontece?"
          />
          <div className="flex gap-2">
            {FREQUENCIA_OPTIONS.map((opt) => {
              const active = canal.frequencia === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('frequencia', opt.value)}
                  className={twMerge(
                    'flex-1 rounded-lg border px-3 py-2.5 text-center text-sm transition-colors',
                    active
                      ? 'border-lime-400 bg-lime-400/10 font-semibold text-lime-400'
                      : 'border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                  )}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Nível de impacto percebido */}
        <div>
          <FieldLabel
            label="Nível de impacto percebido"
            required
            hint="Quanto essa situação afeta seu bem-estar, produtividade ou saúde?"
          />
          <div className="flex gap-2">
            {IMPACTO_OPTIONS.map((opt) => {
              const active = canal.impacto === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('impacto', opt.value)}
                  className={twMerge(
                    'flex-1 rounded-lg border px-3 py-2.5 text-center text-sm transition-colors',
                    active
                      ? 'border-lime-400 bg-lime-400/10 font-semibold text-lime-400'
                      : 'border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                  )}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Descrição */}
        <Textarea
          label="Descrição"
          value={canal.descricao}
          onChange={(v) => update('descricao', v)}
          placeholder="Descreva a situação com o máximo de detalhes que se sentir confortável. Lembre-se: este relato é anônimo."
          required
          rows={5}
        />

        {/* Sugestão de melhoria */}
        <Textarea
          label="Sugestão de melhoria (opcional)"
          value={canal.sugestao}
          onChange={(v) => update('sugestao', v)}
          placeholder="Se tiver uma ideia de como resolver ou melhorar a situação, compartilhe aqui."
          rows={3}
        />
      </div>

      <StepNavigation
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={!isValid}
        nextDisabledMessage={
          !isValid ? 'Preencha todos os campos obrigatórios para continuar.' : undefined
        }
      />
    </div>
  )
}
