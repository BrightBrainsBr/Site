// frontend/components/assessment/steps/UploadsStep.tsx
'use client'

import { useCallback, useRef } from 'react'

import type { StepComponentProps, UploadedFile } from '../assessment.interface'
import { InfoBox, SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

type UploadCategory = 'triagem' | 'exames' | 'laudos'

const CATEGORIES: { key: UploadCategory; label: string; desc: string }[] = [
  {
    key: 'triagem',
    label: 'Transcrição da Triagem',
    desc: 'PDF da entrevista de triagem enviado pela clínica',
  },
  {
    key: 'exames',
    label: 'Exames & Laudos',
    desc: 'Resultados de exames, laudos médicos, relatórios anteriores',
  },
]

export function UploadsStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleFiles = useCallback(
    (category: UploadCategory, files: FileList | null) => {
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
        const existing =
          category === 'triagem'
            ? (data.uploads.triagem ?? [])
            : (data.uploads.geral ?? [])
        const key = category === 'triagem' ? 'triagem' : 'geral'
        setData({
          ...data,
          uploads: { ...data.uploads, [key]: [...existing, ...newFiles] },
        })
      })
    },
    [data, setData]
  )

  const removeFile = (category: UploadCategory, index: number) => {
    const key = category === 'triagem' ? 'triagem' : 'geral'
    const existing = data.uploads[key] ?? []
    setData({
      ...data,
      uploads: {
        ...data.uploads,
        [key]: existing.filter((_, i) => i !== index),
      },
    })
  }

  const totalFiles =
    (data.uploads.triagem?.length ?? 0) + (data.uploads.geral?.length ?? 0)

  return (
    <div>
      <SectionTitle
        icon="📂"
        title="Documentos & Exames"
        subtitle="Envie todos os documentos relevantes para a avaliação"
        badge={totalFiles > 0 ? `${totalFiles} arquivo(s)` : undefined}
      />

      <InfoBox variant="info">
        Envie a transcrição da triagem, exames, laudos e outros documentos
        clínicos. Os PDFs serão analisados pela IA junto aos dados do
        formulário.
      </InfoBox>

      <div className="mt-6 space-y-6">
        {CATEGORIES.map((cat) => {
          const key = cat.key === 'triagem' ? 'triagem' : 'geral'
          const files = data.uploads[key] ?? []
          return (
            <div key={cat.key}>
              <h3 className="mb-1 text-sm font-semibold text-zinc-200">
                {cat.label}
              </h3>
              <p className="mb-3 text-xs text-zinc-500">{cat.desc}</p>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-600 py-6 text-sm text-zinc-400 transition-colors hover:border-lime-400 hover:text-lime-400">
                <span className="rounded-lg bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-400 transition-colors hover:bg-lime-400/20">
                  Selecionar arquivos
                </span>
                <span className="text-xs text-zinc-600">PDF, PNG, JPG</span>
                <input
                  ref={(el) => {
                    inputRefs.current[cat.key] = el
                  }}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(cat.key, e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>

              {files.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs text-zinc-500">
                          {f.name.endsWith('.pdf') ? '📄' : '🖼️'}
                        </span>
                        <span className="truncate text-sm text-zinc-300">
                          {f.name}
                        </span>
                        <span className="flex-none text-xs text-zinc-600">
                          {(f.size / 1024).toFixed(0)}KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(cat.key, i)}
                        className="ml-3 flex-none text-sm font-medium text-red-400 transition-colors hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
