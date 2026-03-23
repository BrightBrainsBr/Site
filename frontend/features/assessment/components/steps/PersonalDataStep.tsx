// frontend/features/assessment/components/steps/PersonalDataStep.tsx
'use client'

import type { StepComponentProps } from '../assessment.interface'
import { Input, RadioGroup, SectionTitle, Select } from '../fields'
import { StepNavigation } from '../StepNavigation'

const SEXO_OPTIONS = [
  { label: 'Masculino', value: 'masculino' },
  { label: 'Feminino', value: 'feminino' },
  { label: 'Outro', value: 'outro' },
  { label: 'Prefiro não informar', value: 'nao_informar' },
]

const ESCOLARIDADE_OPTIONS = [
  { label: 'Fundamental incompleto', value: 'fund_inc' },
  { label: 'Fundamental completo', value: 'fund_comp' },
  { label: 'Médio incompleto', value: 'med_inc' },
  { label: 'Médio completo', value: 'med_comp' },
  { label: 'Superior incompleto', value: 'sup_inc' },
  { label: 'Superior completo', value: 'sup_comp' },
  { label: 'Pós-graduação', value: 'pos' },
  { label: 'Mestrado', value: 'mestrado' },
  { label: 'Doutorado', value: 'doutorado' },
]

function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function PersonalDataStep({
  data,
  setData,
  onPrev,
  onNext,
  companyContext,
  setCompanyContext,
}: StepComponentProps) {
  const isComplete = data.nome.trim() !== '' && data.nascimento.trim() !== ''

  const update = (field: string, value: string) => {
    setData({ ...data, [field]: value })
  }

  const departments = companyContext?.departments ?? []
  const hasDepartments = companyContext?.company_id && departments.length > 0
  const selectedDepartment = companyContext?.department ?? ''

  const handleDepartmentChange = (value: string) => {
    if (setCompanyContext && companyContext) {
      setCompanyContext({ ...companyContext, department: value })
    }
  }

  return (
    <div>
      <SectionTitle
        icon="👤"
        title="Dados Pessoais"
        subtitle="Informações básicas do paciente"
        required
      />

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nome completo"
            value={data.nome}
            onChange={(v) => update('nome', v)}
            required
          />
          <Input
            label="Data de nascimento"
            value={data.nascimento}
            onChange={(v) => update('nascimento', v)}
            type="date"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="CPF"
            value={data.cpf}
            onChange={(v) => update('cpf', v)}
            mask={maskCPF}
            placeholder="000.000.000-00"
          />
          <Input
            label="Telefone"
            value={data.telefone}
            onChange={(v) => update('telefone', v)}
            mask={maskPhone}
            placeholder="(11) 99999-9999"
          />
        </div>

        <Input
          label="E-mail"
          value={data.email}
          onChange={(v) => update('email', v)}
          type="email"
          readOnly={!!companyContext?.prefilled_email}
          hint={
            companyContext?.prefilled_email
              ? 'E-mail vinculado ao convite da empresa'
              : undefined
          }
        />

        {hasDepartments && (
          <Select
            label="Departamento"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            options={departments.map((d) => ({ label: d, value: d }))}
            placeholder="Selecione seu departamento"
          />
        )}

        <RadioGroup
          label="Sexo"
          value={data.sexo}
          onChange={(v) => update('sexo', v)}
          options={SEXO_OPTIONS}
          inline
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Profissão"
            value={data.profissao}
            onChange={(v) => update('profissao', v)}
          />
          <Select
            label="Escolaridade"
            value={data.escolaridade}
            onChange={(v) => update('escolaridade', v)}
            options={ESCOLARIDADE_OPTIONS}
            placeholder="Selecione"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Peso (kg)"
            value={data.peso}
            onChange={(v) => update('peso', v)}
            placeholder="Ex: 70"
          />
          <Input
            label="Altura (cm)"
            value={data.altura}
            onChange={(v) => update('altura', v)}
            placeholder="Ex: 175"
          />
        </div>
      </div>

      <StepNavigation
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={!isComplete}
        nextDisabledMessage={
          !isComplete
            ? 'Preencha o nome e a data de nascimento para continuar.'
            : undefined
        }
      />
    </div>
  )
}
