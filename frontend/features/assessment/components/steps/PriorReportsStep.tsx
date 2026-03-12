// frontend/features/assessment/components/steps/PriorReportsStep.tsx
'use client'

import type { PriorReport, StepComponentProps } from '../assessment.interface'
import { Input, RadioGroup, SectionTitle, Textarea } from '../fields'
import { StepNavigation } from '../StepNavigation'

const POSSUI_OPTIONS = [
  { label: 'Sim', value: 'sim' },
  { label: 'Não', value: 'nao' },
  { label: 'Não tenho em mãos', value: 'nao_em_maos' },
]

const EMPTY_REPORT: PriorReport = {
  tipo: '',
  data: '',
  cid: '',
  resumo: '',
}

export function PriorReportsStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const update = (field: string, value: unknown) => {
    setData({ ...data, [field]: value })
  }

  const addReport = () => {
    update('laudosAnteriores', [...data.laudosAnteriores, { ...EMPTY_REPORT }])
  }

  const removeReport = (index: number) => {
    update(
      'laudosAnteriores',
      data.laudosAnteriores.filter((_: PriorReport, i: number) => i !== index)
    )
  }

  const updateReport = (
    index: number,
    field: keyof PriorReport,
    value: string
  ) => {
    const updated = data.laudosAnteriores.map((r: PriorReport, i: number) =>
      i === index ? { ...r, [field]: value } : r
    )
    update('laudosAnteriores', updated)
  }

  return (
    <div>
      <SectionTitle icon="📑" title="Laudos Anteriores" />

      <div className="space-y-6">
        <RadioGroup
          label="Possui laudos anteriores?"
          value={data.possuiLaudos}
          onChange={(v) => update('possuiLaudos', v)}
          options={POSSUI_OPTIONS}
        />

        {data.possuiLaudos === 'sim' && (
          <>
            {data.laudosAnteriores.map((l: PriorReport, i: number) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-4 space-y-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-zinc-200">
                    Laudo {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeReport(i)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remover
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Tipo"
                    value={l.tipo}
                    onChange={(v) => updateReport(i, 'tipo', v)}
                    placeholder="Ex: Laudo Psiquiátrico"
                  />
                  <Input
                    label="Data"
                    value={l.data}
                    onChange={(v) => updateReport(i, 'data', v)}
                    type="date"
                  />
                </div>

                <Input
                  label="CID / Diagnóstico"
                  value={l.cid}
                  onChange={(v) => updateReport(i, 'cid', v)}
                  placeholder="CID e descrição"
                />

                <Textarea
                  label="Resumo"
                  value={l.resumo}
                  onChange={(v) => updateReport(i, 'resumo', v)}
                  rows={3}
                  placeholder="Conclusões e condutas..."
                />
              </div>
            ))}

            <button
              type="button"
              onClick={addReport}
              className="w-full rounded-lg border border-dashed border-zinc-600 py-2.5 text-sm text-zinc-400 transition-colors hover:border-lime-400 hover:text-lime-400"
            >
              + Adicionar laudo anterior
            </button>
          </>
        )}
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
