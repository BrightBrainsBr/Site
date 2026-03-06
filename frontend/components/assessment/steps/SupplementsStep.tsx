// frontend/components/assessment/steps/SupplementsStep.tsx
'use client'

import type {
  StepComponentProps,
  SupplementEntry,
} from '../assessment.interface'
import { Input, SectionTitle, Textarea } from '../fields'
import { StepNavigation } from '../StepNavigation'

export function SupplementsStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const update = (field: string, value: unknown) => {
    setData({ ...data, [field]: value })
  }

  const addSup = () => {
    update('suplementos', [...data.suplementos, { nome: '', dose: '' }])
  }

  const removeSup = (index: number) => {
    update(
      'suplementos',
      data.suplementos.filter((_, i) => i !== index)
    )
  }

  const updateSup = (
    index: number,
    field: keyof SupplementEntry,
    value: string
  ) => {
    const updated = data.suplementos.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    )
    update('suplementos', updated)
  }

  return (
    <div>
      <SectionTitle
        icon="🧬"
        title="Suplementos"
        subtitle="Suplementos e fitoterápicos em uso"
      />

      <div className="space-y-4">
        {data.suplementos.map((sup, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">
                Suplemento {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeSup(i)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remover
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Nome"
                value={sup.nome}
                onChange={(v) => updateSup(i, 'nome', v)}
                placeholder="Ex: Vitamina D3"
              />
              <Input
                label="Dose"
                value={sup.dose}
                onChange={(v) => updateSup(i, 'dose', v)}
                placeholder="Ex: 5000 UI/dia"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addSup}
          className="w-full rounded-lg border border-dashed border-zinc-600 py-2.5 text-sm text-zinc-400 transition-colors hover:border-lime-400 hover:text-lime-400"
        >
          + Adicionar suplemento
        </button>

        <Textarea
          label="Observações sobre suplementos"
          value={data.supObs}
          onChange={(v) => update('supObs', v)}
          placeholder="Informações adicionais sobre suplementos..."
          rows={3}
        />
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
