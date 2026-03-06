// frontend/components/assessment/steps/WearablesStep.tsx
'use client'

import type { StepComponentProps } from '../assessment.interface'
import { Input, RadioGroup, SectionTitle, Textarea } from '../fields'
import { StepNavigation } from '../StepNavigation'

const YES_NO = [
  { label: 'Sim', value: 'sim' },
  { label: 'Não', value: 'nao' },
]

export function WearablesStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const update = (key: string, value: unknown) =>
    setData({ ...data, [key]: value })

  return (
    <div>
      <SectionTitle icon="⌚" title="Wearables & Monitoramento" />

      <div className="space-y-6">
        <RadioGroup
          label="Usa wearable?"
          value={data.usaWearable}
          onChange={(v) => update('usaWearable', v)}
          options={YES_NO}
        />

        {data.usaWearable === 'sim' && (
          <>
            <Input
              label="Dispositivo"
              value={data.wDispositivo}
              onChange={(v) => update('wDispositivo', v)}
              placeholder="Ex: Apple Watch, Oura Ring..."
            />

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="FC Repouso (bpm)"
                value={data.wFCRepouso}
                onChange={(v) => update('wFCRepouso', v)}
                type="number"
              />
              <Input
                label="HRV (ms)"
                value={data.wHRV}
                onChange={(v) => update('wHRV', v)}
                type="number"
              />
              <Input
                label="Sono (horas)"
                value={data.wSonoDuracao}
                onChange={(v) => update('wSonoDuracao', v)}
                type="number"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Passos/dia"
                value={data.wPassos}
                onChange={(v) => update('wPassos', v)}
                type="number"
              />
              <Input
                label="Score estresse (0-100)"
                value={data.wEstresse}
                onChange={(v) => update('wEstresse', v)}
                type="number"
              />
            </div>
          </>
        )}

        <Textarea
          label="Observações"
          value={data.wearableObs}
          onChange={(v) => update('wearableObs', v)}
          rows={2}
        />
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
