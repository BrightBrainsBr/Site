// frontend/features/assessment/components/steps/nr1/PerfilStep.tsx
'use client'

import type { StepComponentProps } from '../../assessment.interface'
import { WORK_TIME_OPTIONS } from '../../constants/nr1-options'
import { Input, SectionTitle, Select } from '../../fields'
import { StepNavigation } from '../../StepNavigation'

const WORK_TIME_SELECT_OPTIONS = WORK_TIME_OPTIONS.map((t) => ({
  label: t,
  value: t,
}))

export function PerfilStep({
  data,
  setData,
  onPrev,
  onNext,
  companyContext,
}: StepComponentProps) {
  const departments = companyContext?.departments ?? []
  const departmentOptions = departments.map((d) => ({ label: d, value: d }))

  const update = (field: string, value: string) => {
    setData({ ...data, [field]: value })
  }

  const isValid =
    (data.nome as string)?.trim().length > 0 &&
    (data.department as string)?.trim().length > 0 &&
    (data.nr1_role as string)?.trim().length > 0 &&
    (data.nr1_work_time as string)?.trim().length > 0

  return (
    <div>
      <SectionTitle
        icon="👤"
        title="Perfil"
        subtitle="Informações sobre você, seu cargo e setor para contextualizar as respostas."
        required
      />

      <div className="space-y-5">
        <Input
          label="Nome completo"
          value={(data.nome as string) ?? ''}
          onChange={(v) => update('nome', v)}
          placeholder="Seu nome completo"
          required
        />

        {departmentOptions.length > 0 ? (
          <Select
            label="Setor / Departamento"
            value={(data.department as string) ?? ''}
            onChange={(v) => update('department', v)}
            options={departmentOptions}
            placeholder="Selecione seu setor"
            required
          />
        ) : (
          <Input
            label="Setor / Departamento"
            value={(data.department as string) ?? ''}
            onChange={(v) => update('department', v)}
            placeholder="Ex: Produção, Administrativo, TI..."
            required
          />
        )}

        <Input
          label="Cargo/Função"
          value={(data.nr1_role as string) ?? ''}
          onChange={(v) => update('nr1_role', v)}
          placeholder="Ex: Analista, Operador, Supervisor..."
          required
        />

        <Select
          label="Tempo na empresa"
          value={(data.nr1_work_time as string) ?? ''}
          onChange={(v) => update('nr1_work_time', v)}
          options={WORK_TIME_SELECT_OPTIONS}
          placeholder="Selecione"
          required
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
