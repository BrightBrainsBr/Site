// frontend/features/b2b-dashboard/components/tabs/B2BEventsTab.tsx

'use client'

import { useCallback, useRef, useState } from 'react'

import type {
  B2BEvent,
  CreateEventInput,
  EventType,
  PdfExtractionEventsResult,
} from '../../b2b-dashboard.interface'
import { useB2BDepartments } from '../../hooks/useB2BDepartments'
import { useB2BEventsMutationHook } from '../../hooks/useB2BEventsMutationHook'
import { useB2BEventsQueryHook } from '../../hooks/useB2BEventsQueryHook'
import { useB2BExtractPdfMutationHook } from '../../hooks/useB2BExtractPdfMutationHook'
import { useB2BPercepcaoQueryHook } from '../../hooks/useB2BPercepcaoQueryHook'

const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; color: string; bg: string }
> = {
  afastamento: {
    label: 'Afastamento',
    color: '#F87171',
    bg: 'rgba(239,68,68,0.15)',
  },
  relato_canal: {
    label: 'Relato Canal',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.15)',
  },
  acidente: {
    label: 'Acidente',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.15)',
  },
  outro: {
    label: 'Outro',
    color: '#94A3B8',
    bg: 'rgba(148,163,184,0.15)',
  },
}

const EMPTY_EVENT: CreateEventInput = {
  event_date: new Date().toISOString().slice(0, 10),
  event_type: 'afastamento',
  cid_code: '',
  description: '',
  department: '',
  days_lost: undefined,
  source: 'manual',
}

interface B2BEventsTabProps {
  companyId: string | null
  cycleId: string | null
}

export function B2BEventsTab({ companyId, cycleId }: B2BEventsTabProps) {
  const [filterType, setFilterType] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateEventInput>({ ...EMPTY_EVENT })
  const [extractedEvents, setExtractedEvents] = useState<B2BEvent[] | null>(
    null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: deptData } = useB2BDepartments(companyId, cycleId)
  const { data: eventsData, isLoading } = useB2BEventsQueryHook(companyId, {
    type: filterType || undefined,
  })
  const { createEvent, updateEvent, deleteEvent, bulkCreate } =
    useB2BEventsMutationHook(companyId)
  const extractPdf = useB2BExtractPdfMutationHook(companyId)
  const { data: percepcao } = useB2BPercepcaoQueryHook(
    companyId,
    cycleId ?? undefined
  )

  const departments = deptData?.departments ?? []
  const events = eventsData?.events ?? []
  const kpis = eventsData?.kpis ?? {
    afastamentosCidF: 0,
    diasPerdidos: 0,
    relatosCanal: 0,
  }

  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_EVENT })
    setShowForm(false)
    setEditingId(null)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!form.description.trim()) return
    if (editingId) {
      updateEvent.mutate(
        { eventId: editingId, ...form },
        { onSuccess: resetForm }
      )
    } else {
      createEvent.mutate(form, { onSuccess: resetForm })
    }
  }, [form, editingId, updateEvent, createEvent, resetForm])

  const handleEdit = useCallback((ev: B2BEvent) => {
    setForm({
      event_date: ev.event_date.slice(0, 10),
      event_type: ev.event_type,
      cid_code: ev.cid_code ?? '',
      description: ev.description,
      department: ev.department ?? '',
      days_lost: ev.days_lost,
      source: ev.source,
    })
    setEditingId(ev.id)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(
    (eventId: string) => {
      if (!confirm('Tem certeza que deseja excluir este evento?')) return
      deleteEvent.mutate(eventId)
    },
    [deleteEvent]
  )

  const handleFileUpload = useCallback(
    (file: File) => {
      extractPdf.mutate(
        { file, extractionType: 'events-bulk' },
        {
          onSuccess: (result) => {
            const eventsResult = result.extracted as PdfExtractionEventsResult
            setExtractedEvents(eventsResult.events ?? [])
          },
        }
      )
    },
    [extractPdf]
  )

  const handleConfirmBulk = useCallback(() => {
    if (!extractedEvents?.length) return
    const inputs: CreateEventInput[] = extractedEvents.map((ev) => ({
      event_date: ev.event_date,
      event_type: ev.event_type,
      cid_code: ev.cid_code,
      description: ev.description,
      department: ev.department,
      days_lost: ev.days_lost,
      source: 'pdf-import',
    }))
    bulkCreate.mutate(inputs, {
      onSuccess: () => setExtractedEvents(null),
    })
  }, [extractedEvents, bulkCreate])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[13px] text-[#64748B]">
        Carregando eventos…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Afastamentos CID-F (90d)',
            value: kpis.afastamentosCidF,
            color: '#F87171',
          },
          {
            label: 'Dias Perdidos',
            value: kpis.diasPerdidos,
            color: '#F59E0B',
          },
          {
            label: 'Relatos Canal',
            value: kpis.relatosCanal,
            color: '#60A5FA',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0A1628] p-3"
          >
            <span className="text-[11px] font-medium text-[#94A3B8]">
              {kpi.label}
            </span>
            <p
              className="mt-1 text-[22px] font-bold"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="rounded-lg bg-[rgba(20,184,166,0.15)] px-3 py-1.5 text-[12px] font-semibold text-[#14B8A6] transition-colors hover:bg-[rgba(20,184,166,0.25)]"
        >
          + Novo Evento
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={extractPdf.isPending}
          className="rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-[12px] font-semibold text-[#94A3B8] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:text-[#E2E8F0] disabled:opacity-50"
        >
          {extractPdf.isPending ? 'Extraindo…' : 'Upload PDF (lote)'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
            e.target.value = ''
          }}
        />

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="ml-auto rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A1628] px-3 py-1.5 text-[12px] text-[#E2E8F0] outline-none focus:border-[#0D9488]"
        >
          <option value="">Todos os tipos</option>
          {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, { label: string }][]).map(
            ([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            )
          )}
        </select>
      </div>

      {/* PDF extraction preview */}
      {extractedEvents && (
        <div className="rounded-xl border border-[rgba(96,165,250,0.3)] bg-[#0E1E33] p-4">
          <h3 className="mb-2 text-[13px] font-semibold text-[#60A5FA]">
            Eventos extraídos do PDF — Revise antes de confirmar
          </h3>
          <div className="mb-3 max-h-60 space-y-1 overflow-y-auto">
            {extractedEvents.map((ev, i) => (
              <div
                key={i}
                className="rounded-lg border border-[rgba(255,255,255,0.04)] bg-[#0A1628] px-3 py-2 text-[12px] text-[#94A3B8]"
              >
                {ev.event_date.slice(0, 10)} — {ev.event_type} —{' '}
                {ev.description}
                {ev.cid_code && ` (${ev.cid_code})`}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmBulk}
              disabled={bulkCreate.isPending}
              className="rounded-lg bg-[rgba(20,184,166,0.15)] px-4 py-1.5 text-[12px] font-semibold text-[#14B8A6] disabled:opacity-50"
            >
              {bulkCreate.isPending
                ? 'Importando…'
                : `Confirmar (${extractedEvents.length})`}
            </button>
            <button
              onClick={() => setExtractedEvents(null)}
              className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-1.5 text-[12px] font-semibold text-[#94A3B8]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
          <h3 className="mb-3 text-[13px] font-semibold text-[#E2E8F0]">
            {editingId ? 'Editar Evento' : 'Novo Evento'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] text-[#64748B]">
                Data
              </label>
              <input
                type="date"
                value={form.event_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, event_date: e.target.value }))
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A1628] px-3 py-2 text-[12px] text-[#E2E8F0] outline-none focus:border-[#0D9488]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[#64748B]">
                Tipo
              </label>
              <select
                value={form.event_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    event_type: e.target.value as EventType,
                  }))
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A1628] px-3 py-2 text-[12px] text-[#E2E8F0] outline-none focus:border-[#0D9488]"
              >
                {(
                  Object.entries(EVENT_TYPE_CONFIG) as [
                    EventType,
                    { label: string },
                  ][]
                ).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[#64748B]">
                Código CID
              </label>
              <input
                type="text"
                value={form.cid_code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cid_code: e.target.value }))
                }
                placeholder="Ex: F32.1"
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A1628] px-3 py-2 text-[12px] text-[#E2E8F0] outline-none focus:border-[#0D9488]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] text-[#64748B]">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A1628] px-3 py-2 text-[12px] text-[#E2E8F0] outline-none focus:border-[#0D9488]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[#64748B]">
                Departamento
              </label>
              <select
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department: e.target.value }))
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A1628] px-3 py-2 text-[12px] text-[#E2E8F0] outline-none focus:border-[#0D9488]"
              >
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            {form.event_type === 'afastamento' && (
              <div>
                <label className="mb-1 block text-[11px] text-[#64748B]">
                  Dias Perdidos
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.days_lost ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      days_lost: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A1628] px-3 py-2 text-[12px] text-[#E2E8F0] outline-none focus:border-[#0D9488]"
                />
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={createEvent.isPending || updateEvent.isPending}
              className="rounded-lg bg-[rgba(20,184,166,0.15)] px-4 py-1.5 text-[12px] font-semibold text-[#14B8A6] transition-colors hover:bg-[rgba(20,184,166,0.25)] disabled:opacity-50"
            >
              {createEvent.isPending || updateEvent.isPending
                ? 'Salvando…'
                : editingId
                  ? 'Salvar'
                  : 'Criar'}
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-1.5 text-[12px] font-semibold text-[#94A3B8] transition-colors hover:text-[#E2E8F0]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Event list */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
        <h3 className="mb-3 text-[13px] font-semibold text-[#E2E8F0]">
          Registro de Eventos
        </h3>
        {events.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-[13px] text-[#64748B]">
            Nenhum evento registrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)]">
                  <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">
                    Data
                  </th>
                  <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">
                    Tipo
                  </th>
                  <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">
                    CID
                  </th>
                  <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">
                    Descrição
                  </th>
                  <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">
                    Depto
                  </th>
                  <th className="py-2 text-right text-[11px] font-medium text-[#64748B]">
                    Dias
                  </th>
                  <th className="py-2 text-right text-[11px] font-medium text-[#64748B]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const tCfg = EVENT_TYPE_CONFIG[ev.event_type]
                  return (
                    <tr
                      key={ev.id}
                      className="border-b border-[rgba(255,255,255,0.04)]"
                    >
                      <td className="py-2.5 text-[12px] text-[#94A3B8]">
                        {new Date(ev.event_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2.5">
                        <span
                          className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ color: tCfg.color, backgroundColor: tCfg.bg }}
                        >
                          {tCfg.label}
                        </span>
                      </td>
                      <td className="py-2.5 text-[12px] font-medium text-[#E2E8F0]">
                        {ev.cid_code || '—'}
                      </td>
                      <td className="max-w-[200px] truncate py-2.5 text-[12px] text-[#94A3B8]">
                        {ev.description}
                      </td>
                      <td className="py-2.5 text-[12px] text-[#64748B]">
                        {ev.department || '—'}
                      </td>
                      <td className="py-2.5 text-right text-[12px] text-[#94A3B8]">
                        {ev.days_lost ?? '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(ev)}
                            className="rounded p-1 text-[#64748B] transition-colors hover:text-[#E2E8F0]"
                            title="Editar"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id)}
                            className="rounded p-1 text-[#64748B] transition-colors hover:text-[#F87171]"
                            title="Excluir"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Correlações Identificadas */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
            Correlações Identificadas
          </h3>
          <div className="group relative">
            <svg
              className="h-3.5 w-3.5 cursor-help text-[#475569]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A1628] px-3 py-2 text-[11px] text-[#94A3B8] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Correlações identificadas automaticamente ao comparar relatos de
              percepção com dados das avaliações.
            </div>
          </div>
        </div>

        {!percepcao?.correlations?.length ? (
          <div className="flex h-24 items-center justify-center text-[13px] text-[#64748B]">
            Nenhuma correlação identificada
          </div>
        ) : (
          <div className="space-y-2">
            {percepcao.correlations.map((c, i) => {
              const isHigh =
                c.severity === 'alta' ||
                c.severity === 'critical' ||
                c.severity === 'high'
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-[rgba(255,255,255,0.04)] bg-[#0A1628] px-3 py-2.5"
                >
                  <span
                    className="mt-0.5 shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      color: isHigh ? '#F87171' : '#FBBF24',
                      backgroundColor: isHigh
                        ? 'rgba(239,68,68,0.15)'
                        : 'rgba(245,158,11,0.15)',
                    }}
                  >
                    {isHigh ? 'Alta' : 'Média'}
                  </span>
                  <p className="text-[12px] leading-relaxed text-[#94A3B8]">
                    {c.description}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
