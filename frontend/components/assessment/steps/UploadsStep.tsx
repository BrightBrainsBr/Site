// frontend/components/assessment/steps/UploadsStep.tsx
'use client'

import { useCallback, useRef } from 'react'

import type { StepComponentProps, UploadedFile } from '../assessment.interface'
import { InfoBox, SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

export function UploadsStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const readers = Array.from(files).map(
        (file) =>
          new Promise<UploadedFile>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              resolve({
                name: file.name,
                size: file.size,
                data: reader.result as string,
              })
            }
            reader.readAsDataURL(file)
          })
      )

      void Promise.all(readers).then((newFiles) => {
        const existing = data.uploads.geral ?? []
        setData({
          ...data,
          uploads: { ...data.uploads, geral: [...existing, ...newFiles] },
        })
      })
    },
    [data, setData]
  )

  const removeFile = (index: number) => {
    const existing = data.uploads.geral ?? []
    setData({
      ...data,
      uploads: {
        ...data.uploads,
        geral: existing.filter((_, i) => i !== index),
      },
    })
  }

  const files = data.uploads.geral ?? []

  return (
    <div>
      <SectionTitle
        icon="📂"
        title="Upload de Exames"
        badge={files.length > 0 ? `${files.length} arquivo(s)` : undefined}
      />

      <InfoBox variant="info">
        Envie resultados de exames anteriores (PDF, imagens).
      </InfoBox>

      <div className="mt-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-600 py-8 text-sm text-zinc-400 transition-colors hover:border-lime-400 hover:text-lime-400">
          <span className="rounded-lg bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-400 transition-colors hover:bg-lime-400/20">
            Selecionar arquivos
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-2.5"
            >
              <span className="truncate text-sm text-zinc-300">{f.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-3 flex-none text-sm font-medium text-red-400 transition-colors hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
