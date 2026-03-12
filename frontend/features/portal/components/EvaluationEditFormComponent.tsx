'use client'

import { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { INITIAL_FORM_DATA } from '~/features/assessment/components/initial-form-data'
import type {
  AssessmentFormData,
  MedicationEntry,
  SupplementEntry,
} from '~/features/assessment/components/assessment.interface'
import { cn } from '~/shared/utils/cn'
import type { EvaluationDetail } from '../portal.interface'
import { FIELD_LABELS, FORM_SECTIONS } from '../constants/form-sections'
import { FIELD_CONFIG } from '../constants/field-config'
import type { SelectOption } from '../constants/field-config'
import { useUpdateEvaluationMutationHook } from '../hooks/useUpdateEvaluationMutationHook'
import { computeAllScores } from '~/features/assessment/helpers/compute-scores'

const SCALE_FIELDS = new Set([
  'phq9', 'gad7', 'isi', 'asrs', 'aq10', 'ocir', 'mbi', 'pcl5',
  'mdq', 'pss10', 'ad8', 'nms', 'alsfrs', 'snapiv', 'spin', 'auditc',
])

const SKIP_EDIT_FIELDS = new Set(Array.from(SCALE_FIELDS))

const LONG_TEXT_FIELDS = new Set([
  'queixaPrincipal', 'transcricaoTriagem', 'triagemResumo',
  'triagemObservacoes', 'diagAnterioresDetalhe', 'examesNeuroDetalhe',
  'outrosSintomas', 'medPassadoDetalhe', 'estiloVidaObs',
  'familiaDetalhes', 'infoAdicional', 'wearableObs', 'neuromodDetalhes',
])

const TABLE_FIELDS = new Set(['medicamentos', 'suplementos'])

const inputClass =
  'w-full rounded-lg border border-[#1a3a5c] bg-[#0f2240] px-3 py-2.5 text-base text-[#cce6f7] placeholder-[#3a5a75] focus:border-[#00c9b1] focus:outline-none'
const selectClass =
  'w-full cursor-pointer rounded-lg border border-[#1a3a5c] bg-[#0f2240] px-3 py-2.5 text-base text-[#cce6f7] focus:border-[#00c9b1] focus:outline-none appearance-none'
const labelClass =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-[1.5px] text-[#3a5a75]'
const miniInputClass =
  'w-full rounded-md border border-[#1a3a5c] bg-[#0a1628] px-2.5 py-2 text-sm text-[#cce6f7] placeholder-[#3a5a75] focus:border-[#00c9b1] focus:outline-none'

// -------------------------------------------------------------------
// Pills editor
// -------------------------------------------------------------------
function PillsEditor({
  value,
  onChange,
  availableItems,
  placeholder,
}: {
  value: string[]
  onChange: (next: string[]) => void
  availableItems?: string[]
  placeholder?: string
}) {
  const [customInput, setCustomInput] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [filterText, setFilterText] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const remove = useCallback(
    (item: string) => onChange(value.filter((v) => v !== item)),
    [value, onChange]
  )

  const add = useCallback(
    (item: string) => {
      if (!item || value.includes(item)) return
      onChange([...value, item])
      setDropdownOpen(false)
      setFilterText('')
    },
    [value, onChange]
  )

  const addCustom = useCallback(() => {
    const trimmed = customInput.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setCustomInput('')
  }, [customInput, value, onChange])

  const remaining = availableItems?.filter((item) => !value.includes(item)) ?? []
  const filtered = filterText
    ? remaining.filter((i) => i.toLowerCase().includes(filterText.toLowerCase()))
    : remaining

  return (
    <div ref={wrapperRef}>
      {value.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-md bg-[rgba(0,201,177,0.12)] px-2.5 py-1 text-sm text-[#00c9b1]"
            >
              {item}
              <button
                type="button"
                onClick={() => remove(item)}
                className="ml-0.5 text-[#00c9b1]/60 transition-colors hover:text-[#ff4d6d]"
                aria-label={`Remover ${item}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {availableItems && remaining.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-[#1a3a5c] bg-[#0f2240] px-3 py-2.5 text-base text-[#5a7fa0] transition-colors hover:border-[#00c9b1]/50"
          >
            <span>Adicionar...</span>
            <span className={cn('transition-transform', dropdownOpen && 'rotate-180')}>▾</span>
          </button>
          {dropdownOpen && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-hidden rounded-lg border border-[#1a3a5c] bg-[#0c1a2e] shadow-xl">
              {remaining.length > 6 && (
                <div className="border-b border-[#1a3a5c] p-2">
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filtrar..."
                    className="w-full rounded-md border border-[#1a3a5c] bg-[#0f2240] px-2.5 py-1.5 text-sm text-[#cce6f7] placeholder-[#3a5a75] focus:border-[#00c9b1] focus:outline-none"
                    autoFocus
                  />
                </div>
              )}
              <div className="max-h-48 overflow-y-auto">
                {filtered.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => add(item)}
                    className="flex w-full px-3 py-2 text-left text-sm text-[#cce6f7] transition-colors hover:bg-[#1a3a5c]"
                  >
                    {item}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="px-3 py-2 text-sm text-[#3a5a75]">Nenhuma opção encontrada</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!availableItems && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addCustom() }
            }}
            placeholder={placeholder ?? 'Adicionar item...'}
            className={inputClass}
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="flex-none rounded-lg border border-[#00c9b1] bg-[rgba(0,201,177,0.1)] px-3 py-2.5 text-sm font-medium text-[#00c9b1] transition-colors hover:bg-[rgba(0,201,177,0.15)] disabled:opacity-40"
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------------
// Select field
// -------------------------------------------------------------------
function SelectField({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value="">Selecione...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5a7fa0]">▾</span>
    </div>
  )
}

// -------------------------------------------------------------------
// Medications table editor
// -------------------------------------------------------------------
function MedicationsEditor({
  value,
  onChange,
}: {
  value: MedicationEntry[]
  onChange: (next: MedicationEntry[]) => void
}) {
  const update = (idx: number, field: keyof MedicationEntry, val: string) => {
    const next = [...value]
    next[idx] = { ...next[idx], [field]: val }
    onChange(next)
  }
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))
  const add = () => onChange([...value, { nome: '', dose: '', tempo: '' }])

  return (
    <div>
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((med, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-[#0a1628] p-3">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={med.nome}
                  onChange={(e) => update(i, 'nome', e.target.value)}
                  placeholder="Nome do medicamento"
                  className={miniInputClass}
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={med.dose}
                    onChange={(e) => update(i, 'dose', e.target.value)}
                    placeholder="Dose"
                    className={miniInputClass}
                  />
                  <input
                    type="text"
                    value={med.tempo}
                    onChange={(e) => update(i, 'tempo', e.target.value)}
                    placeholder="Tempo de uso"
                    className={miniInputClass}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="mt-1 flex-none text-sm font-medium text-[#ff4d6d] transition-colors hover:text-[#ff6b85]"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={add}
        className="mt-2 rounded-lg border border-dashed border-[#1a3a5c] px-3 py-2 text-sm text-[#5a7fa0] transition-colors hover:border-[#00c9b1]/50 hover:text-[#00c9b1]"
      >
        + Adicionar medicamento
      </button>
    </div>
  )
}

// -------------------------------------------------------------------
// Supplements table editor
// -------------------------------------------------------------------
function SupplementsEditor({
  value,
  onChange,
}: {
  value: SupplementEntry[]
  onChange: (next: SupplementEntry[]) => void
}) {
  const update = (idx: number, field: keyof SupplementEntry, val: string) => {
    const next = [...value]
    next[idx] = { ...next[idx], [field]: val }
    onChange(next)
  }
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))
  const add = () => onChange([...value, { nome: '', dose: '' }])

  return (
    <div>
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((sup, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-[#0a1628] p-3">
              <input
                type="text"
                value={sup.nome}
                onChange={(e) => update(i, 'nome', e.target.value)}
                placeholder="Nome do suplemento"
                className={cn(miniInputClass, 'flex-1')}
              />
              <input
                type="text"
                value={sup.dose}
                onChange={(e) => update(i, 'dose', e.target.value)}
                placeholder="Dose"
                className={cn(miniInputClass, 'w-32')}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="flex-none text-sm font-medium text-[#ff4d6d] transition-colors hover:text-[#ff6b85]"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={add}
        className="mt-2 rounded-lg border border-dashed border-[#1a3a5c] px-3 py-2 text-sm text-[#5a7fa0] transition-colors hover:border-[#00c9b1]/50 hover:text-[#00c9b1]"
      >
        + Adicionar suplemento
      </button>
    </div>
  )
}

// -------------------------------------------------------------------
// Main component
// -------------------------------------------------------------------
interface EvaluationEditFormComponentProps {
  evaluation: EvaluationDetail
  onSave: () => void
  onCancel: () => void
}

export function EvaluationEditFormComponent({
  evaluation,
  onSave,
  onCancel,
}: EvaluationEditFormComponentProps) {
  const formData = {
    ...INITIAL_FORM_DATA,
    ...(evaluation.form_data ?? {}),
  } as AssessmentFormData

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty, dirtyFields },
  } = useForm<AssessmentFormData>({
    defaultValues: formData,
  })

  const updateMutation = useUpdateEvaluationMutationHook(evaluation.id)

  const onSubmit = (data: AssessmentFormData) => {
    const changedFields: Partial<AssessmentFormData> = {}
    for (const key of Object.keys(dirtyFields) as (keyof AssessmentFormData)[]) {
      if (!(key in data)) continue
      ;(changedFields as Record<string, unknown>)[key] = data[key]
    }

    if (Object.keys(changedFields).length === 0) return

    const scores = computeAllScores({ ...formData, ...changedFields } as AssessmentFormData)

    updateMutation.mutate(
      {
        form_data: changedFields,
        scores,
        changed_by: 'Comitê Médico',
      },
      { onSuccess: () => onSave() }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-8 pb-24">
        {FORM_SECTIONS.map((section) => {
          const sectionFields = section.fields.filter((f) => !SKIP_EDIT_FIELDS.has(f))
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

              {isScalesSection ? (
                <div className="rounded-lg bg-[#0f2240] p-4 text-base text-[#5a7fa0]">
                  Edição de escalas clínicas não disponível neste momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {sectionFields.map((fieldId) => {
                    const label = FIELD_LABELS[fieldId] ?? fieldId
                    const isLongText = LONG_TEXT_FIELDS.has(fieldId)
                    const isTable = TABLE_FIELDS.has(fieldId)
                    const config = FIELD_CONFIG[fieldId]

                    // --- Medications table ---
                    if (fieldId === 'medicamentos') {
                      const raw = watch('medicamentos')
                      const meds: MedicationEntry[] = Array.isArray(raw) ? raw : []
                      return (
                        <div key={fieldId} className="col-span-full rounded-lg bg-[#0f2240] p-4">
                          <label className={labelClass}>{label}</label>
                          <MedicationsEditor
                            value={meds}
                            onChange={(next) =>
                              setValue('medicamentos', next, { shouldDirty: true })
                            }
                          />
                        </div>
                      )
                    }

                    // --- Supplements table ---
                    if (fieldId === 'suplementos') {
                      const raw = watch('suplementos')
                      const sups: SupplementEntry[] = Array.isArray(raw) ? raw : []
                      return (
                        <div key={fieldId} className="col-span-full rounded-lg bg-[#0f2240] p-4">
                          <label className={labelClass}>{label}</label>
                          <SupplementsEditor
                            value={sups}
                            onChange={(next) =>
                              setValue('suplementos', next, { shouldDirty: true })
                            }
                          />
                        </div>
                      )
                    }

                    // --- Pills (array multi-select) ---
                    if (config?.type === 'pills') {
                      const raw = watch(fieldId as string)
                      const current: string[] = Array.isArray(raw) ? (raw as string[]) : []
                      return (
                        <div key={fieldId} className="col-span-full rounded-lg bg-[#0f2240] p-4">
                          <label className={labelClass}>{label}</label>
                          <PillsEditor
                            value={current}
                            onChange={(next) =>
                              setValue(fieldId as string, next as never, {
                                shouldDirty: true,
                              })
                            }
                            availableItems={config.availableItems}
                          />
                        </div>
                      )
                    }

                    // --- Select (dropdown) ---
                    if (config?.type === 'select' && config.options) {
                      const raw = watch(fieldId as string)
                      const current = typeof raw === 'string' ? raw : ''
                      return (
                        <div key={fieldId} className="rounded-lg bg-[#0f2240] p-3">
                          <label className={labelClass}>{label}</label>
                          <SelectField
                            value={current}
                            onChange={(v) =>
                              setValue(fieldId as string, v as never, {
                                shouldDirty: true,
                              })
                            }
                            options={config.options}
                          />
                        </div>
                      )
                    }

                    // --- Textarea ---
                    if (isLongText) {
                      return (
                        <div key={fieldId} className="col-span-full">
                          <label className={labelClass}>{label}</label>
                          <textarea
                            rows={4}
                            {...register(fieldId as string)}
                            className={inputClass}
                          />
                        </div>
                      )
                    }

                    // --- Default text input ---
                    return (
                      <div key={fieldId} className="rounded-lg bg-[#0f2240] p-3">
                        <label className={labelClass}>{label}</label>
                        <input
                          type="text"
                          {...register(fieldId as string)}
                          className={inputClass}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[#1a3a5c] bg-[#0c1a2e] p-4">
        <div className="mx-auto flex max-w-4xl justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#1a3a5c] bg-transparent px-4 py-2.5 text-base font-medium text-[#cce6f7] transition-colors hover:bg-[#0f2240]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
            className="rounded-lg border border-[#00c9b1] bg-[#00c9b1] px-4 py-2.5 text-base font-medium text-[#060e1a] transition-colors hover:bg-[#00e0c4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </form>
  )
}
