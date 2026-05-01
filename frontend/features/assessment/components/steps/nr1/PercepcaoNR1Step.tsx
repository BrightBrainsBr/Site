// frontend/features/assessment/components/steps/nr1/PercepcaoNR1Step.tsx
'use client'

import type { StepComponentProps } from '../../assessment.interface'
import { Input, SectionTitle, Textarea } from '../../fields'
import { StepNavigation } from '../../StepNavigation'
import { LikertField } from './LikertField'

export function PercepcaoNR1Step({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const update = (field: string, value: unknown) => {
    setData({ ...data, [field]: value })
  }

  const isValid = (data.satisfaction_level as number | null) != null

  return (
    <div>
      <SectionTitle
        icon="💬"
        title="Percepção Geral"
        subtitle="Sua opinião sobre segurança e saúde no trabalho."
        required
      />

      <div className="space-y-5">
        <LikertField
          label="Nível de satisfação com segurança e saúde no trabalho"
          hint="De modo geral, como você avalia as condições de segurança e saúde na empresa?"
          value={data.satisfaction_level}
          onChange={(v) => update('satisfaction_level', v)}
        />

        <Input
          label="Qual o maior risco que você percebe no seu trabalho?"
          value={(data.biggest_risk as string) ?? ''}
          onChange={(v) => update('biggest_risk', v)}
          placeholder="Ex: Ruído excessivo, pressão por metas, falta de EPIs..."
          hint="Descreva em poucas palavras o principal risco que você identifica."
        />

        <Textarea
          label="Sugestão de melhoria (opcional)"
          value={(data.suggestion as string) ?? ''}
          onChange={(v) => update('suggestion', v)}
          placeholder="Se tiver uma sugestão para melhorar a segurança ou saúde no trabalho, compartilhe aqui."
          rows={4}
        />
      </div>

      <StepNavigation
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={!isValid}
        nextDisabledMessage={
          !isValid ? 'Avalie sua satisfação geral para continuar.' : undefined
        }
      />
    </div>
  )
}
