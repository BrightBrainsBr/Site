// frontend/features/b2b-dashboard/components/shared/B2BPdfUploadModal.tsx

'use client'

import { useCallback, useRef, useState } from 'react'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface B2BPdfUploadModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (files: File[]) => void
  isUploading?: boolean
}

export function B2BPdfUploadModal({
  open,
  onClose,
  onSubmit,
  isUploading,
}: B2BPdfUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const handleFiles = useCallback((files: FileList | File[]) => {
    const pdfs = Array.from(files).filter((f) => f.type === 'application/pdf')
    setSelectedFiles((prev) => [...prev, ...pdfs])
  }, [])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleSubmit = useCallback(() => {
    if (!selectedFiles.length || isUploading) return
    onSubmit(selectedFiles)
    setSelectedFiles([])
    onClose()
  }, [selectedFiles, isUploading, onSubmit, onClose])

  const handleClose = useCallback(() => {
    setSelectedFiles([])
    onClose()
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative z-10 mx-4 flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0c1425] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-6 py-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#e2e8f0]">
              Importar Eventos via PDF
            </h2>
            <p className="mt-0.5 text-[13px] text-[#64748b]">
              Selecione os PDFs — o processamento ocorre em segundo plano
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-[#e2e8f0]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div
              ref={dropRef}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(96,165,250,0.3)] bg-[rgba(96,165,250,0.04)] px-6 py-10 transition-colors hover:border-[rgba(96,165,250,0.5)] hover:bg-[rgba(96,165,250,0.08)]"
            >
              <svg
                className="mb-3 h-10 w-10 text-[#60A5FA]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-[15px] font-medium text-[#e2e8f0]">
                Arraste PDFs aqui ou clique para selecionar
              </p>
              <p className="mt-1 text-[13px] text-[#64748b]">
                Aceita vários arquivos PDF (max 50 MB cada)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files)
                e.target.value = ''
              }}
            />

            {selectedFiles.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-[#94a3b8]">
                  {selectedFiles.length} arquivo(s) selecionado(s)
                </p>
                {selectedFiles.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111b2e] px-3 py-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <svg
                        className="h-4 w-4 shrink-0 text-[#F87171]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 18h12a2 2 0 002-2V8l-6-6H4a2 2 0 00-2 2v12a2 2 0 002 2zm8-14l4 4h-4V4z" />
                      </svg>
                      <span className="truncate text-[14px] text-[#e2e8f0]">
                        {file.name}
                      </span>
                      <span className="shrink-0 text-[12px] text-[#64748b]">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(i)
                      }}
                      className="ml-2 shrink-0 rounded p-0.5 text-[#64748b] hover:text-[#F87171]"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-2 text-[14px] font-semibold text-[#94a3b8] transition-colors hover:text-[#e2e8f0]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedFiles.length === 0 || isUploading}
            className="rounded-lg bg-[rgba(96,165,250,0.15)] border border-[rgba(96,165,250,0.3)] px-5 py-2 text-[14px] font-semibold text-[#60A5FA] transition-colors hover:bg-[rgba(96,165,250,0.25)] disabled:opacity-40"
          >
            {isUploading
              ? 'Enviando…'
              : `Enviar ${selectedFiles.length} PDF${selectedFiles.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
