// frontend/features/portal/components/ApprovalActionsComponent.tsx
'use client'

import { useState } from 'react'

import { useApproveEvaluationMutationHook } from '../hooks/useApproveEvaluationMutationHook'
import { useRejectEvaluationMutationHook } from '../hooks/useRejectEvaluationMutationHook'

interface ApprovalActionsComponentProps {
  evaluationId: string
  showApprove: boolean
  showReject: boolean
  onCloseApprove: () => void
  onCloseReject: () => void
  onStatusChange: () => void
}

export function ApprovalActionsComponent({
  evaluationId,
  showApprove,
  showReject,
  onCloseApprove,
  onCloseReject,
  onStatusChange,
}: ApprovalActionsComponentProps) {
  const [approveName, setApproveName] = useState('')
  const [rejectNotes, setRejectNotes] = useState('')

  const approveMutation = useApproveEvaluationMutationHook(evaluationId)
  const rejectMutation = useRejectEvaluationMutationHook(evaluationId)

  const handleApprove = () => {
    if (!approveName.trim()) return
    approveMutation.mutate(
      { approved_by: approveName.trim() },
      {
        onSuccess: () => {
          setApproveName('')
          onCloseApprove()
          onStatusChange()
        },
      }
    )
  }

  const handleReject = () => {
    if (!rejectNotes.trim() || rejectNotes.trim().length < 10) return
    rejectMutation.mutate(
      { reviewer_notes: rejectNotes.trim() },
      {
        onSuccess: () => {
          setRejectNotes('')
          onCloseReject()
          onStatusChange()
        },
      }
    )
  }

  return (
    <>
      {/* Approve Dialog */}
      {showApprove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={(e) => {
            if (approveMutation.isPending) return
            if (e.target === e.currentTarget) onCloseApprove()
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#234872] bg-[#0c1a2e] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {approveMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-[#00c9b1]" />
                <p className="text-center text-sm text-[#cce6f7]">
                  Gerando relatório e PDF...
                </p>
                <p className="mt-1 text-center text-xs text-[#5a7fa0]">
                  Isso pode levar 30-60 segundos.
                </p>
              </div>
            ) : (
              <>
                <h3
                  className="font-heading mb-4 text-lg font-bold text-[#cce6f7]"
                  style={{ fontFamily: 'var(--font-heading), sans-serif' }}
                >
                  Aprovar Avaliação
                </h3>
                <p className="mb-4 text-sm text-[#5a7fa0]">
                  O sistema irá regenerar o relatório e PDF. Isso pode levar
                  30-60 segundos.
                </p>
                <label className="mb-4 block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[1.5px] text-[#3a5a75]">
                    Seu nome
                  </span>
                  <input
                    type="text"
                    value={approveName}
                    onChange={(e) => setApproveName(e.target.value)}
                    placeholder="Nome do revisor"
                    className="w-full rounded-lg border border-[#1a3a5c] bg-[#0f2240] px-3 py-2 text-sm text-[#cce6f7] placeholder-[#3a5a75] focus:border-[#00c9b1] focus:outline-none"
                  />
                </label>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onCloseApprove}
                    className="rounded-lg border border-[#1a3a5c] bg-transparent px-4 py-2.5 text-sm font-medium text-[#cce6f7] transition-colors hover:bg-[#0f2240]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={!approveName.trim()}
                    className="rounded-lg border border-[#00c9b1] bg-[#00c9b1] px-4 py-2.5 text-sm font-medium text-[#060e1a] transition-colors hover:bg-[#00e0c4] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar Aprovação
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showReject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={(e) => {
            if (rejectMutation.isPending) return
            if (e.target === e.currentTarget) onCloseReject()
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#234872] bg-[#0c1a2e] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="font-heading mb-4 text-lg font-bold text-[#cce6f7]"
              style={{ fontFamily: 'var(--font-heading), sans-serif' }}
            >
              Rejeitar Avaliação
            </h3>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[1.5px] text-[#3a5a75]">
                Motivo da rejeição (mín. 10 caracteres)
              </span>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={4}
                className="w-full resize-none rounded-lg border border-[#1a3a5c] bg-[#0f2240] px-3 py-2 text-sm text-[#cce6f7] placeholder-[#3a5a75] focus:border-[#00c9b1] focus:outline-none"
              />
              {rejectNotes.trim().length > 0 &&
                rejectNotes.trim().length < 10 && (
                  <p className="mt-1 text-xs text-[#f5a623]">
                    Mínimo 10 caracteres
                  </p>
                )}
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCloseReject}
                className="rounded-lg border border-[#1a3a5c] bg-transparent px-4 py-2.5 text-sm font-medium text-[#cce6f7] transition-colors hover:bg-[#0f2240]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={
                  rejectNotes.trim().length < 10 || rejectMutation.isPending
                }
                className="rounded-lg border border-[#ff4d6d] bg-[#ff4d6d] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#ff6b85] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
