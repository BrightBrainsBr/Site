'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import {
  FileUploadZone,
  type UploadProgress,
} from '~/shared/components/FileUploadZone'

import type { DoctorUploadEntry } from '../portal.interface'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface DocumentUploadsComponentProps {
  evaluationId: string
  doctorUploads: DoctorUploadEntry[]
  readonly?: boolean
}

export function DocumentUploadsComponent({
  evaluationId,
  doctorUploads,
  readonly = false,
}: DocumentUploadsComponentProps) {
  const [activeUploads, setActiveUploads] = useState<UploadProgress[]>([])
  const queryClient = useQueryClient()

  const uploadSingleFile = useCallback(
    async (file: File, index: number) => {
      setActiveUploads((prev) => {
        const next = [...prev]
        next[index] = { name: file.name, size: file.size, status: 'uploading' }
        return next
      })

      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(
          `/api/portal/evaluations/${evaluationId}/upload`,
          { method: 'POST', body: fd }
        )
        if (!res.ok) {
          const err = (await res.json()) as { error?: string }
          throw new Error(err.error ?? 'Erro no upload')
        }
        setActiveUploads((prev) => {
          const next = [...prev]
          next[index] = { ...next[index], status: 'done' }
          return next
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        setActiveUploads((prev) => {
          const next = [...prev]
          next[index] = { ...next[index], status: 'error', error: msg }
          return next
        })
      }
    },
    [evaluationId]
  )

  const deleteMutation = useMutation({
    mutationFn: async (path: string) => {
      const res = await fetch(
        `/api/portal/evaluations/${evaluationId}/upload`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path }),
        }
      )
      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error ?? 'Erro ao remover')
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['portal', 'evaluation', evaluationId],
      })
    },
  })

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setActiveUploads(
        files.map((f) => ({
          name: f.name,
          size: f.size,
          status: 'uploading' as const,
        }))
      )

      await Promise.all(files.map((file, idx) => uploadSingleFile(file, idx)))

      void queryClient.invalidateQueries({
        queryKey: ['portal', 'evaluation', evaluationId],
      })

      setTimeout(() => {
        setActiveUploads((prev) => prev.filter((u) => u.status === 'error'))
      }, 3000)
    },
    [uploadSingleFile, evaluationId, queryClient]
  )

  const existingFiles = doctorUploads.map((d) => ({
    name: `${d.name}  ·  ${formatDate(d.uploaded_at)}`,
    size: 0,
    url: d.url,
    path: d.path,
  }))

  return (
    <section className="mt-8">
      <h2
        className="font-heading mb-3.5 border-b border-[rgba(0,201,177,0.2)] pb-2 text-[13px] font-bold uppercase tracking-[2px] text-[#00c9b1]"
        style={{ fontFamily: 'var(--font-heading), sans-serif' }}
      >
        Documentos & Exames
        {doctorUploads.length > 0 && (
          <span className="ml-2 text-[11px] font-normal tracking-normal text-[#5a7fa0]">
            ({doctorUploads.length})
          </span>
        )}
      </h2>

      {doctorUploads.length > 0 && (
        <div className="space-y-2">
          {doctorUploads.map((doc) => (
            <div
              key={doc.path}
              className="flex items-center justify-between rounded-lg bg-[#0f2240] px-4 py-3"
            >
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2.5 transition-colors hover:text-[#00c9b1]"
              >
                <span className="text-base">
                  {/\.pdf$/i.test(doc.name) ? '📄' : '🖼️'}
                </span>
                <span className="truncate text-sm font-medium text-[#cce6f7]">
                  {doc.name}
                </span>
                <span className="flex-none text-xs text-[#3a5a75]">
                  {formatDate(doc.uploaded_at)}
                </span>
              </a>
              {!readonly && (
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(doc.path)}
                  className="ml-3 flex-none text-sm font-medium text-[#ff4d6d] transition-colors hover:text-[#ff6b85] disabled:opacity-50"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {doctorUploads.length === 0 && readonly && (
        <p className="text-sm text-[#5a7fa0]">Nenhum documento anexado.</p>
      )}

      {!readonly && (
        <div className="mt-4">
          <FileUploadZone
            onFilesSelected={handleFilesSelected}
            activeUploads={activeUploads}
            accentColor="teal"
          />
        </div>
      )}
    </section>
  )
}
