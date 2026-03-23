// frontend/features/portal/components/EvaluationDetailViewComponent.tsx
'use client'

import type {
  MedicationEntry,
  SupplementEntry,
} from '~/features/assessment/components/assessment.interface'
import { cn } from '~/shared/utils/cn'

import { FIELD_LABELS, FORM_SECTIONS } from '../constants/form-sections'
import { getScaleColor, getScaleMax } from '../constants/scale-max'
import type { EvaluationDetail } from '../portal.interface'
const ARRAY_FIELDS = new Set([
  'sintomasAtuais',
  'condicoesCronicas',
  'familiaCondicoes',
  'fontesEstresse',
])

const SCALE_FIELDS = new Set([
  'phq9',
  'gad7',
  'isi',
  'asrs',
  'aq10',
  'ocir',
  'mbi',
  'pcl5',
  'mdq',
  'pss10',
  'ad8',
  'nms',
  'alsfrs',
  'snapiv',
  'spin',
  'auditc',
])

const LONG_TEXT_FIELDS = new Set([
  'queixaPrincipal',
  'transcricaoTriagem',
  'triagemResumo',
  'triagemObservacoes',
  'diagAnterioresDetalhe',
  'examesNeuroDetalhe',
  'outrosSintomas',
  'medPassadoDetalhe',
  'estiloVidaObs',
  'familiaDetalhes',
  'infoAdicional',
  'wearableObs',
  'neuromodDetalhes',
])

function formatValue(
  value: unknown,
  fieldId: string,
  scores: Record<string, number> | null
): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-[#5a7fa0]">—</span>
  }

  if (ARRAY_FIELDS.has(fieldId)) {
    const arr = Array.isArray(value) ? value : []
    if (arr.length === 0) return <span className="text-[#5a7fa0]">—</span>
    return (
      <div className="flex flex-wrap gap-1.5">
        {arr.map((item, i) => (
          <span
            key={i}
            className="rounded-md bg-[#1a3a5c] px-2 py-0.5 text-xs text-[#cce6f7]"
          >
            {String(item)}
          </span>
        ))}
      </div>
    )
  }

  if (fieldId === 'medicamentos') {
    const meds = value as MedicationEntry[]
    if (!Array.isArray(meds) || meds.length === 0) {
      return <span className="text-[#5a7fa0]">—</span>
    }
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-[#1a3a5c] text-[10px] uppercase tracking-[1px] text-[#3a5a75]">
              <th className="px-2 py-1.5 text-left">Nome</th>
              <th className="px-2 py-1.5 text-left">Dose</th>
              <th className="px-2 py-1.5 text-left">Tempo</th>
            </tr>
          </thead>
          <tbody>
            {meds.map((m, i) => (
              <tr key={i} className="border-b border-[#1a3a5c]/50">
                <td className="px-2 py-1.5 text-[#cce6f7]">{m.nome || '—'}</td>
                <td className="px-2 py-1.5 text-[#cce6f7]">{m.dose || '—'}</td>
                <td className="px-2 py-1.5 text-[#cce6f7]">{m.tempo || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (fieldId === 'suplementos') {
    const sups = value as SupplementEntry[]
    if (!Array.isArray(sups) || sups.length === 0) {
      return <span className="text-[#5a7fa0]">—</span>
    }
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-[#1a3a5c] text-[10px] uppercase tracking-[1px] text-[#3a5a75]">
              <th className="px-2 py-1.5 text-left">Nome</th>
              <th className="px-2 py-1.5 text-left">Dose</th>
            </tr>
          </thead>
          <tbody>
            {sups.map((s, i) => (
              <tr key={i} className="border-b border-[#1a3a5c]/50">
                <td className="px-2 py-1.5 text-[#cce6f7]">{s.nome || '—'}</td>
                <td className="px-2 py-1.5 text-[#cce6f7]">{s.dose || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (
    SCALE_FIELDS.has(fieldId) &&
    scores &&
    typeof scores[fieldId] === 'number'
  ) {
    const score = scores[fieldId]
    const max = getScaleMax(fieldId)
    const pct = Math.min((score / max) * 100, 100)
    const color = getScaleColor(fieldId, score)
    const label = FIELD_LABELS[fieldId] ?? fieldId
    return (
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-[#5a7fa0]">{label}</span>
          <span className="font-medium text-[#cce6f7]">
            {score} / {max}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#1a3a5c]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    )
  }

  return (
    <span className="text-sm font-medium text-[#cce6f7]">{String(value)}</span>
  )
}

interface EvaluationDetailViewComponentProps {
  evaluation: EvaluationDetail
}

export function EvaluationDetailViewComponent({
  evaluation,
}: EvaluationDetailViewComponentProps) {
  const formData = evaluation.form_data ?? {}
  const scores = evaluation.scores ?? {}

  return (
    <div className="space-y-8">
      {FORM_SECTIONS.map((section) => {
        const sectionFields = section.fields.filter((f) => {
          const val = formData[f as keyof typeof formData]
          if (section.id === 'scales') return true
          return val !== undefined
        })
        if (sectionFields.length === 0) return null

        const isScalesSection = section.id === 'scales'

        return (
          <section key={section.id}>
            <h2
              className="font-heading mb-3.5 border-b border-[rgba(0,201,177,0.2)] pb-2 text-[13px] font-bold uppercase tracking-[2px] text-[#00c9b1]"
              style={{ fontFamily: 'var(--font-heading), sans-serif' }}
            >
              {section.id === 'personal' && 'Dados Pessoais'}
              {section.id === 'clinical' && 'Perfil Clínico'}
              {section.id === 'history' && 'Histórico'}
              {section.id === 'triage' && 'Triagem'}
              {section.id === 'symptoms' && 'Sintomas'}
              {section.id === 'scales' && 'Escalas Clínicas'}
              {section.id === 'medications' && 'Medicamentos'}
              {section.id === 'lifestyle' && 'Estilo de Vida'}
              {section.id === 'family' && 'Histórico Familiar'}
              {section.id === 'wearables' && 'Wearables'}
            </h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sectionFields.map((fieldId) => {
                const value = formData[fieldId as keyof typeof formData]
                const isLongText = LONG_TEXT_FIELDS.has(fieldId)
                const isScale = SCALE_FIELDS.has(fieldId)
                const hasScaleScore = isScale && scores[fieldId] != null

                if (isScale && !hasScaleScore) return null

                const label = FIELD_LABELS[fieldId] ?? fieldId

                return (
                  <div
                    key={fieldId}
                    className={cn(
                      isLongText
                        ? 'col-span-full'
                        : 'rounded-lg bg-[#0f2240] p-3'
                    )}
                  >
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-[#3a5a75]">
                      {label}
                    </div>
                    <div
                      className={cn(
                        isLongText &&
                          'rounded-lg border-l-[3px] border-l-[#00c9b1] bg-[#0f2240] p-4 text-sm leading-[1.75] text-[#cce6f7]'
                      )}
                    >
                      {formatValue(value, fieldId, scores)}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
