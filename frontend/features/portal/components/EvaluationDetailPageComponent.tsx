'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { cn } from '~/shared/utils/cn'
import { formatDate } from '../helpers/format-evaluation'
import { useEvaluationByIdQueryHook } from '../hooks/useEvaluationByIdQueryHook'
import { ActivityTimelineComponent } from './ActivityTimelineComponent'
import { ApprovalActionsComponent } from './ApprovalActionsComponent'
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

interface EvaluationDetailPageComponentProps {
  evaluationId: string
}

export function EvaluationDetailPageComponent({
  evaluationId,
}: EvaluationDetailPageComponentProps) {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'pt'

  const [activeTab, setActiveTab] = useState<Tab>('dados')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [mode, setMode] = useState<'read' | 'edit'>('read')
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)

  const {
    data: evaluation,
    isLoading,
    error,
    refetch,
  } = useEvaluationByIdQueryHook(evaluationId)

  useEffect(() => {
    if (evaluation?.status === 'processing') {
      setIsRegenerating(true)
    }
  }, [evaluation?.status])

  useEffect(() => {
    if (!isRegenerating) return
    const interval = setInterval(() => {
      void refetch().then(({ data }) => {
        if (data && data.status !== 'processing') {
          setIsRegenerating(false)
        }
      })
    }, 8000)
    return () => clearInterval(interval)
  }, [isRegenerating, refetch])

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/portal/evaluations/${evaluationId}/regenerate`,
        { method: 'POST' }
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
    regenerateMutation.mutate()
  }, [regenerateMutation])

  const handleStatusChange = () => {
    void refetch()
  }

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
    <div className="mx-auto max-w-4xl px-6 py-8">
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

          {mode === 'read' && (
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="rounded-lg border border-[#1a3a5c] bg-transparent px-3 py-2 text-sm font-medium text-[#cce6f7] transition-colors hover:bg-[#0f2240]"
            >
              Editar
            </button>
          )}

          {status === 'pending_review' && (
            <>
              <button
                type="button"
                onClick={() => setShowApproveDialog(true)}
                className="rounded-lg border border-[#00c9b1] bg-[#00c9b1] px-3 py-2 text-sm font-medium text-[#060e1a] transition-colors hover:bg-[#00e0c4]"
              >
                Aprovar
              </button>
              <button
                type="button"
                onClick={() => setShowRejectDialog(true)}
                className="rounded-lg border border-[#ff4d6d] bg-transparent px-3 py-2 text-sm font-medium text-[#ff4d6d] transition-colors hover:bg-[rgba(255,77,109,0.1)]"
              >
                Rejeitar
              </button>
            </>
          )}

          {(status === 'approved' || status === 'rejected') && (
            <StatusBadgeComponent status={status} />
          )}
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

      {/* Approval/Reject dialogs */}
      <ApprovalActionsComponent
        evaluationId={evaluationId}
        showApprove={showApproveDialog}
        showReject={showRejectDialog}
        onCloseApprove={() => setShowApproveDialog(false)}
        onCloseReject={() => setShowRejectDialog(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
