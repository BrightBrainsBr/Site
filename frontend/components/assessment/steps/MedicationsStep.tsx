// frontend/components/assessment/steps/MedicationsStep.tsx
'use client'

import type {
  MedicationEntry,
  StepComponentProps,
} from '../assessment.interface'
import { Input, RadioGroup, SectionTitle, Textarea } from '../fields'
import { StepNavigation } from '../StepNavigation'

const YES_NO = [
  { label: 'Sim', value: 'sim' },
  { label: 'Não', value: 'nao' },
]

export function MedicationsStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const update = (field: string, value: unknown) => {
    setData({ ...data, [field]: value })
  }

  const addMed = () => {
    update('medicamentos', [
      ...data.medicamentos,
      { nome: '', dose: '', tempo: '' },
    ])
  }

  const removeMed = (index: number) => {
    update(
      'medicamentos',
      data.medicamentos.filter((_, i) => i !== index)
    )
  }

  const updateMed = (
    index: number,
    field: keyof MedicationEntry,
    value: string
  ) => {
    const updated = data.medicamentos.map((med, i) =>
      i === index ? { ...med, [field]: value } : med
    )
    update('medicamentos', updated)
  }

  return (
    <div>
      <SectionTitle
        icon="💊"
        title="Medicamentos"
        subtitle="Medicações atuais e histórico"
      />

      <div className="space-y-6">
        <RadioGroup
          label="Usa medicação atualmente?"
          value={data.usaMedicamento}
          onChange={(v) => update('usaMedicamento', v)}
          options={YES_NO}
          inline
        />

        {data.usaMedicamento === 'sim' && (
          <div className="space-y-3">
            {data.medicamentos.map((med, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">
                    Medicamento {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMed(i)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remover
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    label="Nome"
                    value={med.nome}
                    onChange={(v) => updateMed(i, 'nome', v)}
                    placeholder="Ex: Sertralina"
                  />
                  <Input
                    label="Dose"
                    value={med.dose}
                    onChange={(v) => updateMed(i, 'dose', v)}
                    placeholder="Ex: 50mg"
                  />
                  <Input
                    label="Tempo de uso"
                    value={med.tempo}
                    onChange={(v) => updateMed(i, 'tempo', v)}
                    placeholder="Ex: 6 meses"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addMed}
              className="w-full rounded-lg border border-dashed border-zinc-600 py-2.5 text-sm text-zinc-400 transition-colors hover:border-lime-400 hover:text-lime-400"
            >
              + Adicionar medicamento
            </button>
          </div>
        )}

        <RadioGroup
          label="Já usou medicação psiquiátrica no passado?"
          value={data.medPassado}
          onChange={(v) => update('medPassado', v)}
          options={YES_NO}
          inline
        />

        {data.medPassado === 'sim' && (
          <Textarea
            label="Detalhes de medicações anteriores"
            value={data.medPassadoDetalhe}
            onChange={(v) => update('medPassadoDetalhe', v)}
            placeholder="Quais medicações, doses, motivo de interrupção..."
            rows={3}
          />
        )}

        <Textarea
          label="Efeitos adversos conhecidos"
          value={data.efeitosAdversos}
          onChange={(v) => update('efeitosAdversos', v)}
          placeholder="Já teve efeitos colaterais com alguma medicação?"
          rows={2}
        />

        <Textarea
          label="Alergias medicamentosas"
          value={data.alergias}
          onChange={(v) => update('alergias', v)}
          placeholder="Liste alergias a medicamentos, se houver"
          rows={2}
        />
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
