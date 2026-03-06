// frontend/components/assessment/steps/LifestyleStep.tsx
'use client'

import type { StepComponentProps } from '../assessment.interface'
import { PROFESSIONAL_SITUATION_OPTIONS } from '../constants/lifestyle-options'
import {
  CheckboxGroup,
  Input,
  RadioGroup,
  SectionTitle,
  Textarea,
} from '../fields'
import { StepNavigation } from '../StepNavigation'

const opt = (labels: string[]) => labels.map((l) => ({ label: l, value: l }))

function Sub({ icon, title }: { icon?: string; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-lime-400/10 pb-2">
      {icon && <span className="text-base">{icon}</span>}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h3>
    </div>
  )
}

export function LifestyleStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const update = (key: string, value: unknown) =>
    setData({ ...data, [key]: value })

  return (
    <div>
      <SectionTitle
        icon="🧬"
        title="Estilo de Vida & Contexto Psicossocial"
        subtitle="Hábitos, rotina e fatores contextuais"
      />

      <div className="space-y-8">
        <section>
          <Sub icon="💍" title="Estado Civil" />
          <div className="space-y-4">
            <RadioGroup
              label="Estado civil"
              value={data.estadoCivil}
              onChange={(v) => update('estadoCivil', v)}
              options={opt([
                'Solteiro(a)',
                'Casado(a)',
                'União estável',
                'Divorciado(a)',
                'Viúvo(a)',
                'Namorando',
              ])}
              inline
            />
            <RadioGroup
              label="Satisfação com relacionamento"
              value={data.satisfacaoRelacionamento}
              onChange={(v) => update('satisfacaoRelacionamento', v)}
              options={opt([
                'Muito satisfeito',
                'Satisfeito',
                'Neutro',
                'Insatisfeito',
                'Muito insatisfeito',
              ])}
              inline
            />
          </div>
        </section>

        <section>
          <Sub icon="💼" title="Trabalho" />
          <div className="space-y-4">
            <RadioGroup
              label="Situação profissional"
              value={data.situacaoProfissional}
              onChange={(v) => update('situacaoProfissional', v)}
              options={PROFESSIONAL_SITUATION_OPTIONS}
            />
            <RadioGroup
              label="Carga horária semanal"
              value={data.cargaHoraria}
              onChange={(v) => update('cargaHoraria', v)}
              options={opt([
                '< 20h',
                '20-30h',
                '30-40h',
                '40-50h',
                '50-60h',
                '> 60h',
              ])}
              inline
            />
          </div>
        </section>

        <section>
          <Sub icon="🌙" title="Sono" />
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Hora de dormir"
                value={data.horaDormir}
                onChange={(v) => update('horaDormir', v)}
                placeholder="23:30"
              />
              <Input
                label="Hora de acordar"
                value={data.horaAcordar}
                onChange={(v) => update('horaAcordar', v)}
                placeholder="07:00"
              />
            </div>
            <RadioGroup
              label="Qualidade do sono"
              value={data.qualidadeSono}
              onChange={(v) => update('qualidadeSono', v)}
              options={opt([
                'Muito boa',
                'Boa',
                'Regular',
                'Ruim',
                'Muito ruim',
              ])}
              inline
            />
          </div>
        </section>

        <section>
          <Sub icon="🏃" title="Exercício" />
          <RadioGroup
            label="Atividade física"
            value={data.atividadeFisica}
            onChange={(v) => update('atividadeFisica', v)}
            options={opt(['Não pratico', '1-2x/sem', '3-4x/sem', '5+/sem'])}
            inline
          />
        </section>

        <section>
          <Sub icon="☕" title="Substâncias" />
          <div className="space-y-4">
            <RadioGroup
              label="Cafeína"
              value={data.cafeina}
              onChange={(v) => update('cafeina', v)}
              options={opt(['Não', '1-2/dia', '3-4/dia', '5+'])}
              inline
            />
            <RadioGroup
              label="Tabaco"
              value={data.tabaco}
              onChange={(v) => update('tabaco', v)}
              options={opt(['Nunca', 'Ex-fumante', 'Fumante'])}
              inline
            />
            <RadioGroup
              label="Cannabis"
              value={data.cannabis}
              onChange={(v) => update('cannabis', v)}
              options={opt(['Nunca', 'Já usei', 'Ocasional', 'Regular'])}
              inline
            />
          </div>
        </section>

        <section>
          <Sub icon="🎯" title="Contexto" />
          <div className="space-y-4">
            <RadioGroup
              label="Nível de estresse"
              value={data.estresse}
              onChange={(v) => update('estresse', v)}
              options={opt(['Baixo', 'Moderado', 'Alto', 'Muito alto'])}
              inline
            />
            <RadioGroup
              label="Rede de apoio"
              value={data.redeApoio}
              onChange={(v) => update('redeApoio', v)}
              options={opt(['Forte', 'Moderada', 'Fraca', 'Isolamento'])}
              inline
            />
            <CheckboxGroup
              label="Fontes de estresse"
              selected={data.fontesEstresse}
              onChange={(v) => update('fontesEstresse', v)}
              options={[
                'Trabalho',
                'Financeiro',
                'Relacionamento',
                'Família',
                'Saúde',
                'Solidão',
                'Luto',
                'Mudança de vida',
                'Estudos',
                'Outro',
              ]}
              columns={3}
            />
          </div>
        </section>

        <section>
          <Sub title="Neuromodulação" />
          <div className="space-y-4">
            <RadioGroup
              label="Experiência com neuromodulação"
              value={data.neuromod}
              onChange={(v) => update('neuromod', v)}
              options={opt(['Nunca', 'Já fiz', 'Faço atualmente'])}
              inline
            />
            {(data.neuromod === 'Já fiz' ||
              data.neuromod === 'Faço atualmente') && (
              <Textarea
                label="Detalhes da neuromodulação"
                value={data.neuromodDetalhes}
                onChange={(v) => update('neuromodDetalhes', v)}
                placeholder="Protocolo, frequência..."
                rows={3}
              />
            )}
          </div>
        </section>

        <Textarea
          label="Observações adicionais"
          value={data.estiloVidaObs}
          onChange={(v) => update('estiloVidaObs', v)}
          placeholder="Informações adicionais relevantes..."
          rows={3}
        />
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
