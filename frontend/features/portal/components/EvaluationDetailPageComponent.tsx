'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { cn } from '~/shared/utils/cn'
import { formatDate, getStatusLabel } from '../helpers/format-evaluation'
import { useDeleteEvaluationMutationHook } from '../hooks/useDeleteEvaluationMutationHook'
import { useEvaluationByIdQueryHook } from '../hooks/useEvaluationByIdQueryHook'
import { ActivityTimelineComponent } from './ActivityTimelineComponent'
import { DocumentUploadsComponent } from './DocumentUploadsComponent'
import { EvaluationDetailViewComponent } from './EvaluationDetailViewComponent'
import { EvaluationEditFormComponent } from './EvaluationEditFormComponent'
import { ProfileBadgeComponent } from './ProfileBadgeComponent'
import { ReportPreviewComponent } from './ReportPreviewComponent'
import { StatusBadgeComponent } from './StatusBadgeComponent'

type Tab = 'dados' | 'relatorio' | 'atividade'

const TABS: { id: Tab; label: string }[] = [
  { id: 'dados', label: 'Dados' },
  { id: 'relatorio', label: 'Relatório' },
  { id: 'atividade', label: 'Atividade' },
]

function isProcessingStatus(status: string | null | undefined) {
  return Boolean(status && status.startsWith('processing'))
}

interface EvaluationDetailPageComponentProps {
  evaluationId: string
}

export function EvaluationDetailPageComponent({
  evaluationId,
}: EvaluationDetailPageComponentProps) {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) ?? 'pt'

  const [activeTab, setActiveTab] = useState<Tab>('dados')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [mode, setMode] = useState<'read' | 'edit'>('read')
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [errorCopied, setErrorCopied] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  const deleteMutation = useDeleteEvaluationMutationHook(evaluationId)

  const {
    data: evaluation,
    isLoading,
    error,
    refetch,
  } = useEvaluationByIdQueryHook(evaluationId)

  useEffect(() => {
    setIsRegenerating(isProcessingStatus(evaluation?.status))
  }, [evaluation?.status])

  useEffect(() => {
    if (!isRegenerating) return
    const interval = setInterval(() => {
      void refetch().then(({ data }) => {
        if (data && !isProcessingStatus(data.status)) {
          setIsRegenerating(false)
        }
      })
    }, 8000)
    return () => clearInterval(interval)
  }, [isRegenerating, refetch])

  const regenerateMutation = useMutation({
    mutationFn: async (opts?: { force?: boolean }) => {
      const res = await fetch(
        `/api/portal/evaluations/${evaluationId}/regenerate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force: opts?.force }),
        }
      )
      if (!res.ok) {
        const body = (await res.json()) as { error?: string; message?: string }
        throw new Error(body.error ?? body.message ?? 'Erro ao regenerar')
      }
    },
    onSuccess: () => {
      setIsRegenerating(true)
      setActiveTab('relatorio')
    },
  })

  const handleRegenerate = useCallback(() => {
    setShowRegenConfirm(false)
    const force = isProcessingStatus(evaluation?.status)
    regenerateMutation.mutate({ force })
  }, [regenerateMutation, evaluation?.status])

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(
        `/api/portal/evaluations/${evaluationId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewer_status: newStatus }),
        }
      )
      if (!res.ok) {
        const body = (await res.json()) as { error?: string; message?: string }
        throw new Error(body.error ?? body.message ?? 'Erro ao alterar status')
      }
    },
    onSuccess: () => void refetch(),
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node)
      ) {
        setStatusDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const STATUS_OPTIONS = [
    { value: 'pending_review', color: '#f5b842', bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.3)' },
    { value: 'approved', color: '#00d896', bg: 'rgba(0,216,150,0.12)', border: 'rgba(0,216,150,0.3)' },
    { value: 'rejected', color: '#ff6b85', bg: 'rgba(255,77,109,0.15)', border: 'rgba(255,77,109,0.3)' },
  ] as const

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-[#00c9b1]" />
      </div>
    )
  }

  if (error || !evaluation) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-center text-[#ff4d6d]">
          {error?.message ?? 'Avaliação não encontrada'}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-lg border border-[#00c9b1] bg-[rgba(0,201,177,0.1)] px-4 py-2.5 text-sm font-medium text-[#00c9b1] transition-colors hover:bg-[rgba(0,201,177,0.15)]"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const status = evaluation.reviewer_status ?? 'pending_review'

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/${locale}/portal`}
          className="flex items-center gap-2 text-sm text-[#5a7fa0] transition-colors hover:text-[#00c9b1]"
        >
          <span>←</span>
          <span>Voltar</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Delete button */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-[#1a3a5c] p-2 text-[#5a7fa0] transition-colors hover:border-[#ff4d6d] hover:text-[#ff4d6d]"
            title="Excluir avaliação"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* Regenerate button — always visible */}
          <button
            type="button"
            disabled={isRegenerating}
            onClick={() => setShowRegenConfirm(true)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              isRegenerating
                ? 'cursor-not-allowed border-[#1a3a5c] text-[#3a5a75]'
                : 'border-[#f0a030] text-[#f0a030] hover:bg-[rgba(240,160,48,0.1)]'
            )}
          >
            {isRegenerating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#3a5a75] border-t-[#f0a030]" />
                Gerando...
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Regenerar
              </>
            )}
          </button>

          {/* Status dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setStatusDropdownOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
              style={{
                borderColor: STATUS_OPTIONS.find((o) => o.value === status)?.border ?? 'rgba(90,127,160,0.3)',
                backgroundColor: STATUS_OPTIONS.find((o) => o.value === status)?.bg ?? 'rgba(90,127,160,0.15)',
                color: STATUS_OPTIONS.find((o) => o.value === status)?.color ?? '#5a7fa0',
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_OPTIONS.find((o) => o.value === status)?.color ?? '#5a7fa0' }}
              />
              {getStatusLabel(status)}
              <svg className="h-3.5 w-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {statusDropdownOpen && (
              <div className="absolute right-0 z-30 mt-1 w-48 rounded-lg border border-[#1a3a5c] bg-[#0c1a2e] py-1 shadow-xl">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.value === status || updateStatusMutation.isPending}
                    onClick={() => {
                      setStatusDropdownOpen(false)
                      updateStatusMutation.mutate(opt.value)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                      opt.value === status
                        ? 'cursor-default opacity-50'
                        : 'hover:bg-[#0f2240]'
                    )}
                    style={{ color: opt.color }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                    {getStatusLabel(opt.value)}
                    {opt.value === status && (
                      <svg className="ml-auto h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient header */}
      <div className="mb-6 rounded-xl border border-[#1a3a5c] bg-[#0c1a2e] p-6">
        <h1
          className="font-heading text-2xl font-bold text-[#cce6f7]"
          style={{ fontFamily: 'var(--font-heading), sans-serif' }}
        >
          {evaluation.patient_name || 'Paciente sem nome'}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#5a7fa0]">
          {evaluation.patient_profile && (
            <ProfileBadgeComponent profile={evaluation.patient_profile} />
          )}
          {evaluation.form_data?.nascimento && (
            <span>Nascimento: {formatDate(evaluation.form_data.nascimento)}</span>
          )}
          <span>Enviado em {formatDate(evaluation.created_at)}</span>
          <StatusBadgeComponent status={status} />
        </div>
      </div>

      {/* Rejection notes */}
      {status === 'rejected' && evaluation.reviewer_notes && (
        <div className="mb-6 rounded-lg border border-[rgba(255,77,109,0.3)] bg-[rgba(255,77,109,0.08)] p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[1.5px] text-[#ff6b85]">
            Motivo da rejeição
          </h3>
          <p className="text-sm text-[#cce6f7]">{evaluation.reviewer_notes}</p>
        </div>
      )}

      {/* Regeneration error */}
      {regenerateMutation.isError && (
        <div className="mb-6 rounded-lg border border-[rgba(255,77,109,0.3)] bg-[rgba(255,77,109,0.08)] px-4 py-3">
          <p className="text-sm text-[#ff4d6d]">
            {regenerateMutation.error.message}
          </p>
        </div>
      )}

      {evaluation.status === 'error' && (
        <div className="mb-6 rounded-lg border border-[rgba(255,77,109,0.3)] bg-[rgba(255,77,109,0.08)] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#ff4d6d]">
                Falha no processamento. Clique em Regenerar para tentar
                novamente.
              </p>
              {evaluation.processing_error && (
                <pre
                  className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded border border-[rgba(255,77,109,0.15)] bg-[rgba(0,0,0,0.25)] px-3 py-2 text-xs leading-relaxed text-[#ff8fa3]"
                  style={{ fontFamily: 'var(--font-mono-portal), monospace' }}
                >
                  {evaluation.processing_error}
                </pre>
              )}
            </div>
            {evaluation.processing_error && (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(evaluation.processing_error!)
                    .then(() => {
                      setErrorCopied(true)
                      setTimeout(() => setErrorCopied(false), 2000)
                    })
                }}
                className="mt-0.5 flex-shrink-0 rounded border border-[rgba(255,77,109,0.25)] p-1.5 text-[#ff8fa3] transition-colors hover:bg-[rgba(255,77,109,0.1)]"
                title="Copiar erro"
              >
                {errorCopied ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[#0a1628] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id)
              if (tab.id !== 'dados' && mode === 'edit') setMode('read')
            }}
            className={cn(
              'flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-[#1a3a5c] text-[#cce6f7]'
                : 'text-[#5a7fa0] hover:text-[#cce6f7]'
            )}
          >
            {tab.label}
            {tab.id === 'relatorio' && isRegenerating && (
              <span className="ml-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-[#f0a030]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'dados' && (
        <>
          {mode === 'read' && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#1a3a5c] bg-transparent px-3 py-2 text-sm font-medium text-[#cce6f7] transition-colors hover:bg-[#0f2240]"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar Dados
              </button>
            </div>
          )}
          {mode === 'read' ? (
            <>
              <EvaluationDetailViewComponent evaluation={evaluation} />
              <DocumentUploadsComponent
                evaluationId={evaluationId}
                doctorUploads={evaluation.doctor_uploads ?? []}
              />
            </>
          ) : (
            <>
              <EvaluationEditFormComponent
                evaluation={evaluation}
                onSave={() => {
                  setMode('read')
                  void refetch()
                }}
                onCancel={() => setMode('read')}
              />
              <DocumentUploadsComponent
                evaluationId={evaluationId}
                doctorUploads={evaluation.doctor_uploads ?? []}
              />
            </>
          )}
        </>
      )}

      {activeTab === 'relatorio' && (
        <ReportPreviewComponent
          markdown={evaluation.report_markdown}
          pdfUrl={evaluation.report_pdf_url}
          reportHistory={evaluation.report_history ?? []}
          isRegenerating={isRegenerating}
          processingStatus={evaluation.status}
        />
      )}

      {activeTab === 'atividade' && (
        <ActivityTimelineComponent evaluation={evaluation} />
      )}

      {/* Regeneration confirm dialog */}
      {showRegenConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-md rounded-xl border border-[#1a3a5c] bg-[#0c1a2e] p-6 shadow-2xl">
            <h3
              className="font-heading mb-2 text-lg font-bold text-[#cce6f7]"
              style={{ fontFamily: 'var(--font-heading), sans-serif' }}
            >
              Regenerar Relatório?
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-[#5a7fa0]">
              A IA irá reprocessar todos os dados do paciente (incluindo
              documentos anexados) e gerar um novo relatório e PDF. A versão
              anterior será salva no histórico. Este processo pode demorar
              alguns minutos.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRegenConfirm(false)}
                className="rounded-lg border border-[#1a3a5c] bg-transparent px-4 py-2.5 text-sm font-medium text-[#cce6f7] transition-colors hover:bg-[#0f2240]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="rounded-lg border border-[#f0a030] bg-[#f0a030] px-4 py-2.5 text-sm font-medium text-[#060e1a] transition-colors hover:bg-[#f5b040]"
              >
                Regenerar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-md rounded-xl border border-[#1a3a5c] bg-[#0c1a2e] p-6 shadow-2xl">
            <h3
              className="font-heading mb-2 text-lg font-bold text-[#cce6f7]"
              style={{ fontFamily: 'var(--font-heading), sans-serif' }}
            >
              Excluir Avaliação?
            </h3>
            <p className="mb-1 text-sm leading-relaxed text-[#5a7fa0]">
              Tem certeza que deseja excluir permanentemente o registro de:
            </p>
            <p className="mb-5 text-sm font-semibold text-[#cce6f7]">
              {evaluation.patient_name || 'Paciente sem nome'}
            </p>
            <p className="mb-6 text-xs text-[#ff6b85]">
              Todos os dados, documentos e relatórios serão removidos. Esta ação
              não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-[#1a3a5c] bg-transparent px-4 py-2.5 text-sm font-medium text-[#cce6f7] transition-colors hover:bg-[#0f2240]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  deleteMutation.mutate(undefined, {
                    onSuccess: () => {
                      router.push(`/${locale}/portal`)
                    },
                  })
                }}
                className="rounded-lg border border-[#ff4d6d] bg-[#ff4d6d] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#ff6b85] disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
            {deleteMutation.isError && (
              <p className="mt-3 text-xs text-[#ff4d6d]">
                {deleteMutation.error.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
