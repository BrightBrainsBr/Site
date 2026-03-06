// frontend/components/assessment/steps/TriageStep.tsx
'use client'

import type { StepComponentProps } from '../assessment.interface'
import { InfoBox, Input, RadioGroup, SectionTitle, Textarea } from '../fields'
import { StepNavigation } from '../StepNavigation'

const FORMAT_OPTIONS = [
  { label: 'Presencial', value: 'presencial' },
  { label: 'Teleconsulta', value: 'teleconsulta' },
  { label: 'Telefone', value: 'telefone' },
  { label: 'Misto', value: 'misto' },
] as const

export function TriageStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const update = (key: string, value: unknown) =>
    setData({ ...data, [key]: value })

  const wordCount = (data.transcricaoTriagem || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  return (
    <div>
      <SectionTitle icon="🎙️" title="Transcrição da Entrevista de Triagem" />

      <div className="space-y-4">
        <InfoBox variant="info">
          A transcrição será analisada pela IA em conjunto com todos os dados.
        </InfoBox>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Profissional"
            value={data.triagemProfissional}
            onChange={(v) => update('triagemProfissional', v)}
            placeholder="Nome e especialidade"
          />
          <Input
            label="Data"
            value={data.triagemData}
            onChange={(v) => update('triagemData', v)}
            type="date"
          />
        </div>

        <RadioGroup
          label="Formato"
          value={data.triagemFormato}
          onChange={(v) => update('triagemFormato', v)}
          options={FORMAT_OPTIONS}
          inline
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-300">
            Transcrição completa
            <span className="ml-0.5 text-lime-400">*</span>
          </span>
          <textarea
            value={data.transcricaoTriagem}
            onChange={(e) => update('transcricaoTriagem', e.target.value)}
            placeholder="Cole aqui a transcrição completa..."
            rows={16}
            required
            className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm leading-relaxed text-white placeholder-zinc-500 transition-colors focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
            style={{ minHeight: 250 }}
          />
          <span className="mt-1 block text-xs text-zinc-500">
            ~{wordCount} palavras
          </span>
        </label>

        <Textarea
          label="Resumo do entrevistador"
          value={data.triagemResumo}
          onChange={(v) => update('triagemResumo', v)}
          placeholder="Impressões clínicas..."
          rows={4}
        />

        <Textarea
          label="Observações adicionais"
          value={data.triagemObservacoes}
          onChange={(v) => update('triagemObservacoes', v)}
          rows={2}
        />
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
