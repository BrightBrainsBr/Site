// frontend/features/b2b-dashboard/components/tabs/B2BEventsTab.tsx

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  B2BEvent,
  CreateEventInput,
  EventType,
} from '../../b2b-dashboard.interface'
import { CID_CODES_NR1 } from '../../constants/cid-codes'
import { useB2BDepartments } from '../../hooks/useB2BDepartments'
import { useB2BEventsMutationHook } from '../../hooks/useB2BEventsMutationHook'
import { useB2BEventsQueryHook } from '../../hooks/useB2BEventsQueryHook'
import type { PdfJobDetail } from '../../hooks/useB2BPdfJobsHook'
import { useB2BPdfJobsHook } from '../../hooks/useB2BPdfJobsHook'
import { B2BPdfUploadModal } from '../shared/B2BPdfUploadModal'

function CIDSearchSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = query.trim()
    ? CID_CODES_NR1.filter(
        (c) =>
          c.code.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 40)
    : CID_CODES_NR1.slice(0, 40)

  const handleSelect = (code: string) => {
    setQuery(code)
    onChange(code)
    setOpen(false)
  }

  const handleClear = () => {
    setQuery('')
    onChange('')
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar código CID (ex: F32.1)"
          className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-[#64748b] hover:text-[#e2e8f0]"
          >
            ×
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] shadow-xl">
          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleSelect(c.code)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-[rgba(197,225,85,0.08)]"
            >
              <span className="shrink-0 font-mono text-[15px] font-semibold text-[#c5e155]">
                {c.code}
              </span>
              <span className="text-[15px] leading-snug text-[#94a3b8]">
                {c.description}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-3 text-[15px] text-[#64748b] shadow-xl">
          Nenhum código encontrado para &quot;{query}&quot;
        </div>
      )}
    </div>
  )
}

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
  incidente: {
    label: 'Incidente',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.15)',
  },
  atestado: {
    label: 'Atestado',
    color: '#2DD4BF',
    bg: 'rgba(45,212,191,0.15)',
  },
  outro: {
    label: 'Outro',
    color: '#94A3B8',
    bg: 'rgba(148,163,184,0.15)',
  },
}

const KNOWN_EVENT_TYPES = new Set(Object.keys(EVENT_TYPE_CONFIG))

function normalizeEventType(raw: string): EventType {
  const lower = raw?.toLowerCase().trim() ?? ''
  if (KNOWN_EVENT_TYPES.has(lower)) return lower as EventType
  return 'outro'
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

interface ExtractedEvent extends CreateEventInput {
  _idx: number
}

function flattenExtractedEvents(jobs: PdfJobDetail[]): ExtractedEvent[] {
  const out: ExtractedEvent[] = []
  let idx = 0
  for (const job of jobs.filter((j) => j.status === 'completed')) {
    for (const ev of job.result?.events ?? []) {
      out.push({
        _idx: idx++,
        event_date: (ev.event_date as string) ?? '',
        event_type: normalizeEventType((ev.event_type as string) ?? ''),
        cid_code: (ev.cid_code as string) ?? '',
        description: (ev.description as string) ?? '',
        department: (ev.department as string) ?? '',
        days_lost: typeof ev.days_lost === 'number' ? ev.days_lost : undefined,
        source: 'pdf_import',
      })
    }
  }
  return out
}

function PdfProcessingState({
  jobs,
  isUploading,
  onDismiss,
}: {
  jobs: PdfJobDetail[]
  isUploading: boolean
  onDismiss: () => void
}) {
  return (
    <div className="rounded-xl border border-[rgba(96,165,250,0.25)] bg-[rgba(96,165,250,0.06)] px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <svg
          className="h-4 w-4 animate-spin text-[#60A5FA]"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="text-[14px] font-semibold text-[#60A5FA]">
          {isUploading ? 'Enviando arquivos…' : 'Processando PDFs com IA…'}
        </span>
        <button
          onClick={onDismiss}
          className="ml-auto text-[#64748b] hover:text-[#94a3b8]"
          title="Cancelar"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-[rgba(96,165,250,0.15)]">
        <div
          className="h-full animate-pulse rounded-full bg-[#60A5FA]"
          style={{ width: '60%' }}
        />
      </div>
      {jobs.length > 0 && (
        <div className="mt-2 space-y-1">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center gap-2 text-[13px] text-[#64748b]"
            >
              {(job.status === 'pending' || job.status === 'processing') && (
                <svg
                  className="h-3 w-3 animate-spin text-[#60A5FA]"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {job.status === 'completed' && (
                <svg
                  className="h-3 w-3 text-[#4ADE80]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {job.status === 'failed' && (
                <svg
                  className="h-3 w-3 text-[#F87171]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span>{job.file_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExtractedEventsPanel({
  jobs,
  isUploading,
  isAllComplete,
  onConfirm,
  onDismiss,
  bulkCreatePending,
}: {
  jobs: PdfJobDetail[]
  isUploading: boolean
  isAllComplete: boolean
  onConfirm: (events: CreateEventInput[]) => void
  onDismiss: () => void
  bulkCreatePending: boolean
}) {
  const isProcessing =
    isUploading ||
    jobs.some((j) => j.status === 'pending' || j.status === 'processing')

  const failedJobs = jobs.filter((j) => j.status === 'failed')
  const allFailed = jobs.length > 0 && failedJobs.length === jobs.length
  const extractedEvents = flattenExtractedEvents(jobs)

  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(extractedEvents.map((e) => e._idx))
  )
  const [expanded, setExpanded] = useState(true)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  useEffect(() => {
    setSelected(new Set(extractedEvents.map((e) => e._idx)))
  }, [extractedEvents.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isProcessing) {
    return (
      <PdfProcessingState
        jobs={jobs}
        isUploading={isUploading}
        onDismiss={onDismiss}
      />
    )
  }

  if (!isAllComplete || jobs.length === 0) return null

  if (allFailed) {
    return (
      <div className="rounded-xl border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.06)] px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <svg
            className="h-4 w-4 text-[#F87171]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-[14px] font-semibold text-[#F87171]">
            Falha ao processar PDF{jobs.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onDismiss}
            className="ml-auto text-[#64748b] hover:text-[#94a3b8]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-1">
          {failedJobs.map((job) => (
            <div key={job.id} className="text-[13px] text-[#F87171]">
              <span className="font-medium">{job.file_name}:</span>{' '}
              {job.error_message ?? 'Erro desconhecido'}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasEvents = extractedEvents.length > 0
  const selectedCount = selected.size
  const allSelected = selectedCount === extractedEvents.length

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(extractedEvents.map((e) => e._idx)))
    }
  }

  const toggleOne = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleConfirmSelected = () => {
    setConfirmError(null)
    const eventsToConfirm = extractedEvents
      .filter((e) => selected.has(e._idx))
      .map(({ _idx: _, ...rest }) => rest)
    if (eventsToConfirm.length === 0) return
    onConfirm(eventsToConfirm)
  }

  if (!hasEvents) {
    return (
      <div className="rounded-xl border border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.06)] px-4 py-3">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-[#FBBF24]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-[14px] font-semibold text-[#FBBF24]">
            Nenhum evento encontrado nos PDF{jobs.length !== 1 ? 's' : ''}{' '}
            enviados
          </span>
          <button
            onClick={onDismiss}
            className="ml-auto text-[#64748b] hover:text-[#94a3b8]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {failedJobs.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {failedJobs.map((job) => (
              <div key={job.id} className="text-[12px] text-[#F87171]">
                <span className="font-medium">{job.file_name}:</span>{' '}
                {job.error_message ?? 'Erro ao processar'}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-[14px] border border-[rgba(74,222,128,0.2)] bg-[#0c1425] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
        <svg
          className="h-5 w-5 text-[#4ADE80]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <span className="text-[15px] font-semibold text-[#4ADE80]">
            {extractedEvents.length} evento
            {extractedEvents.length !== 1 ? 's' : ''} extraído
            {extractedEvents.length !== 1 ? 's' : ''}
          </span>
          <span className="ml-2 text-[13px] text-[#64748b]">
            — Revise e confirme os eventos abaixo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="rounded-lg border border-[rgba(255,255,255,0.1)] px-2.5 py-1 text-[12px] text-[#94a3b8] transition-colors hover:text-[#e2e8f0]"
          >
            {expanded ? 'Recolher' : 'Expandir'}
          </button>
          <button
            onClick={onDismiss}
            className="text-[#64748b] hover:text-[#94a3b8]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Select all + actions bar */}
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#94a3b8]">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-3.5 w-3.5 rounded border-[rgba(255,255,255,0.2)] bg-transparent accent-[#4ADE80]"
              />
              {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </label>
            <span className="text-[12px] text-[#475569]">
              {selectedCount} de {extractedEvents.length} selecionado
              {selectedCount !== 1 ? 's' : ''}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleConfirmSelected}
                disabled={bulkCreatePending || selectedCount === 0}
                className="rounded-lg bg-[rgba(74,222,128,0.15)] px-3 py-1.5 text-[13px] font-semibold text-[#4ADE80] transition-colors hover:bg-[rgba(74,222,128,0.25)] disabled:opacity-40"
              >
                {bulkCreatePending
                  ? 'Importando…'
                  : `Confirmar ${selectedCount} evento${selectedCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>

          {confirmError && (
            <div className="border-b border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.06)] px-4 py-2 text-[13px] text-[#F87171]">
              Erro ao confirmar: {confirmError}
            </div>
          )}

          {/* Event list */}
          <div className="max-h-[400px] overflow-y-auto">
            {extractedEvents.map((ev) => {
              const tCfg =
                EVENT_TYPE_CONFIG[ev.event_type] ?? EVENT_TYPE_CONFIG.outro
              const isSelected = selected.has(ev._idx)
              return (
                <div
                  key={ev._idx}
                  onClick={() => toggleOne(ev._idx)}
                  className={`flex cursor-pointer items-start gap-3 border-b border-[rgba(255,255,255,0.04)] px-4 py-2.5 transition-colors ${
                    isSelected
                      ? 'bg-[rgba(74,222,128,0.04)]'
                      : 'bg-transparent opacity-50'
                  } hover:bg-[rgba(255,255,255,0.03)]`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(ev._idx)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 h-3.5 w-3.5 shrink-0 rounded border-[rgba(255,255,255,0.2)] bg-transparent accent-[#4ADE80]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {ev.event_date && (
                        <span className="text-[13px] font-medium text-[#94a3b8]">
                          {/^\d{4}-\d{2}-\d{2}$/.test(ev.event_date)
                            ? new Date(
                                ev.event_date + 'T12:00:00'
                              ).toLocaleDateString('pt-BR')
                            : ev.event_date}
                        </span>
                      )}
                      <span
                        className="whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ color: tCfg.color, backgroundColor: tCfg.bg }}
                      >
                        {tCfg.label}
                      </span>
                      {ev.cid_code && (
                        <span className="rounded bg-[rgba(197,225,85,0.1)] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#c5e155]">
                          {ev.cid_code}
                        </span>
                      )}
                      {ev.department && (
                        <span className="text-[12px] text-[#475569]">
                          {ev.department}
                        </span>
                      )}
                      {typeof ev.days_lost === 'number' && ev.days_lost > 0 && (
                        <span className="text-[12px] text-[#F59E0B]">
                          {ev.days_lost}d perdidos
                        </span>
                      )}
                    </div>
                    {ev.description && (
                      <p className="mt-0.5 text-[13px] leading-snug text-[#64748b] line-clamp-2">
                        {ev.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Failed PDFs */}
          {failedJobs.length > 0 && (
            <div className="border-t border-[rgba(248,113,113,0.15)] bg-[rgba(248,113,113,0.04)] px-4 py-2">
              {failedJobs.map((job) => (
                <div key={job.id} className="text-[12px] text-[#F87171]">
                  <span className="font-medium">{job.file_name}:</span>{' '}
                  {job.error_message ?? 'Erro ao processar'}
                </div>
              ))}
            </div>
          )}

          {/* Bottom action bar */}
          <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5">
            <button
              onClick={onDismiss}
              className="rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-[13px] text-[#94a3b8] transition-colors hover:text-[#e2e8f0]"
            >
              Descartar tudo
            </button>
            <button
              onClick={handleConfirmSelected}
              disabled={bulkCreatePending || selectedCount === 0}
              className="rounded-lg bg-[#4ADE80] px-4 py-1.5 text-[13px] font-semibold text-[#0c1425] transition-colors hover:bg-[#22C55E] disabled:opacity-40"
            >
              {bulkCreatePending
                ? 'Importando…'
                : `Confirmar ${selectedCount} evento${selectedCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function B2BEventsTab({ companyId, cycleId }: B2BEventsTabProps) {
  const [filterType, setFilterType] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateEventInput>({ ...EMPTY_EVENT })
  const [showUploadModal, setShowUploadModal] = useState(false)

  const { uploadJobs, pollQuery, isAllComplete, reset } =
    useB2BPdfJobsHook(companyId)
  const pdfJobs: PdfJobDetail[] = pollQuery.data?.jobs ?? []
  const hasPdfActivity = uploadJobs.isPending || pdfJobs.length > 0

  const { data: deptData } = useB2BDepartments(companyId, cycleId)
  const { data: eventsData, isLoading } = useB2BEventsQueryHook(companyId, {
    type: filterType || undefined,
  })
  const { createEvent, updateEvent, deleteEvent, bulkCreate } =
    useB2BEventsMutationHook(companyId)
  const departments = deptData?.departments ?? []
  const events = eventsData?.events ?? []
  const kpis = eventsData?.kpis ?? {
    afastamentos90d: 0,
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

  const handlePdfSubmit = useCallback(
    (files: File[]) => {
      uploadJobs.mutate(files)
    },
    [uploadJobs]
  )

  const handlePdfConfirm = useCallback(
    (events: CreateEventInput[]) => {
      if (!events.length) return
      bulkCreate.mutate(events, {
        onSuccess: () => {
          reset()
        },
        onError: (err) => {
          console.error('[events] bulk create failed:', err)
        },
      })
    },
    [bulkCreate, reset]
  )

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[15px] text-[#64748b]">
        Carregando eventos…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[20px]">🚨</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">
            Eventos & Análise de Nexo Causal
          </h2>
        </div>
        <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
          Ref. NR-1: 1.5.5.5 — Registro de materialização de riscos e vinculação
          CID-10
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Afastamentos CID-F (90d)',
            value: kpis.afastamentos90d,
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
            className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-3"
          >
            <span className="text-[14px] font-medium text-[#94a3b8]">
              {kpi.label}
            </span>
            <p
              className="mt-1 text-[26px] font-bold"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type filter — left */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0c1425] px-3 py-1.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
        >
          <option value="">Todos os tipos</option>
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

        {/* Action buttons — right-aligned */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="rounded-lg border border-[rgba(96,165,250,0.3)] bg-[rgba(96,165,250,0.1)] px-4 py-2 text-[13px] font-semibold text-[#60A5FA] transition-colors hover:bg-[rgba(96,165,250,0.2)]"
          >
            Upload PDF
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="rounded-lg bg-[#c5e155] px-4 py-2 text-[13px] font-semibold text-[#060d1a] transition-colors hover:bg-[#d4ee6b]"
          >
            + Novo Evento
          </button>
        </div>
      </div>

      {/* PDF extraction review panel */}
      {hasPdfActivity && (
        <ExtractedEventsPanel
          jobs={pdfJobs}
          isUploading={uploadJobs.isPending}
          isAllComplete={isAllComplete}
          onConfirm={handlePdfConfirm}
          onDismiss={reset}
          bulkCreatePending={bulkCreate.isPending}
        />
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-4">
          <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
            {editingId ? 'Editar Evento' : 'Novo Evento'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-[13px] text-[#64748b]">
                Data
              </label>
              <input
                type="date"
                value={form.event_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, event_date: e.target.value }))
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-[#64748b]">
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
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
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
              <label className="mb-1 block text-[15px] text-[#64748b]">
                Código CID
              </label>
              <CIDSearchSelect
                value={form.cid_code ?? ''}
                onChange={(val) => setForm((f) => ({ ...f, cid_code: val }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[13px] text-[#64748b]">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-[#64748b]">
                Departamento
              </label>
              <select
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department: e.target.value }))
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
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
                <label className="mb-1 block text-[13px] text-[#64748b]">
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
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
                />
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-2 text-[13px] font-semibold text-[#94a3b8] transition-colors hover:text-[#e2e8f0]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={createEvent.isPending || updateEvent.isPending}
              className="rounded-lg bg-[#c5e155] px-4 py-2 text-[13px] font-semibold text-[#060d1a] transition-colors hover:bg-[#d4ee6b] disabled:opacity-50"
            >
              {createEvent.isPending || updateEvent.isPending
                ? 'Salvando…'
                : editingId
                  ? 'Salvar'
                  : 'Criar'}
            </button>
          </div>
        </div>
      )}

      {/* Event list */}
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-4">
        <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
          Registro de Eventos
        </h3>
        {events.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-[15px] text-[#64748b]">
            Nenhum evento registrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="py-2 text-left text-[13px] font-medium text-[#64748b]">
                    Data
                  </th>
                  <th className="py-2 text-left text-[13px] font-medium text-[#64748b]">
                    Tipo
                  </th>
                  <th className="py-2 text-left text-[13px] font-medium text-[#64748b]">
                    CID
                  </th>
                  <th className="py-2 text-left text-[13px] font-medium text-[#64748b]">
                    Descrição
                  </th>
                  <th className="py-2 text-left text-[13px] font-medium text-[#64748b]">
                    Depto
                  </th>
                  <th className="py-2 text-right text-[13px] font-medium text-[#64748b]">
                    Dias
                  </th>
                  <th className="py-2 text-right text-[13px] font-medium text-[#64748b]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const tCfg =
                    EVENT_TYPE_CONFIG[ev.event_type] ?? EVENT_TYPE_CONFIG.outro
                  return (
                    <tr
                      key={ev.id}
                      className="border-b border-[rgba(255,255,255,0.04)]"
                    >
                      <td className="py-2.5 text-[14px] text-[#94a3b8]">
                        {new Date(ev.event_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2.5">
                        <span
                          className="whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold"
                          style={{
                            color: tCfg.color,
                            backgroundColor: tCfg.bg,
                          }}
                        >
                          {tCfg.label}
                        </span>
                      </td>
                      <td className="py-2.5 text-[14px] font-medium text-[#e2e8f0]">
                        {ev.cid_code || '—'}
                      </td>
                      <td className="max-w-[200px] truncate py-2.5 text-[14px] text-[#94a3b8]">
                        {ev.description}
                      </td>
                      <td className="py-2.5 text-[14px] text-[#64748b]">
                        {ev.department || '—'}
                      </td>
                      <td className="py-2.5 text-right text-[14px] text-[#94a3b8]">
                        {ev.days_lost ?? '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(ev)}
                            className="rounded p-1 text-[#64748b] transition-colors hover:text-[#e2e8f0]"
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
                            className="rounded p-1 text-[#64748b] transition-colors hover:text-[#F87171]"
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

      {/* PDF Upload Modal */}
      <B2BPdfUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handlePdfSubmit}
        isUploading={uploadJobs.isPending}
      />

      {/* Correlações Identificadas */}
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-4">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-[17px] font-semibold text-[#e2e8f0]">
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
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[13px] text-[#94a3b8] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Correlações identificadas automaticamente ao comparar relatos de
              percepção com dados das avaliações.
            </div>
          </div>
        </div>

        <div className="flex h-24 items-center justify-center text-[15px] text-[#64748b]">
          Nenhuma correlação identificada
        </div>
      </div>
    </div>
  )
}
