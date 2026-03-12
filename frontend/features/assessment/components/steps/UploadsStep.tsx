'use client'

import { useCallback, useState } from 'react'

import {
  type FileEntry,
  FileUploadZone,
} from '~/shared/components/FileUploadZone'

import type { StepComponentProps, UploadedFile } from '../assessment.interface'
import { InfoBox, SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

const IS_DEV = process.env.NEXT_PUBLIC_AVALIACAO_DEV_MODE === 'true'

type UploadCategory = 'triagem' | 'exames'

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
  const handleFiles = useCallback(
    (category: UploadCategory, files: File[]) => {
      const readers = files.map(
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
        const key = category === 'triagem' ? 'triagem' : 'geral'
        const existing = data.uploads[key] ?? []
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

  const [loadingTest, setLoadingTest] = useState(false)
  const loadTestFiles = useCallback(async () => {
    if (!IS_DEV) return
    setLoadingTest(true)
    try {
      const res = await fetch('/api/assessment/load-test-files')
      if (!res.ok) throw new Error('Failed to load')
      const { files } = (await res.json()) as {
        files: { name: string; size: number; data: string }[]
      }
      const newFiles: UploadedFile[] = files.map((f) => ({
        name: f.name,
        size: f.size,
        data: f.data,
      }))
      const existing = data.uploads.geral ?? []
      setData({
        ...data,
        uploads: { ...data.uploads, geral: [...existing, ...newFiles] },
      })
    } finally {
      setLoadingTest(false)
    }
  }, [data, setData])

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

      {IS_DEV && (
        <div className="mt-4">
          <button
            type="button"
            onClick={loadTestFiles}
            disabled={loadingTest}
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
          >
            {loadingTest ? 'Carregando...' : 'Carregar 7 PDFs de teste'}
          </button>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {CATEGORIES.map((cat) => {
          const key = cat.key === 'triagem' ? 'triagem' : 'geral'
          const files: FileEntry[] = (data.uploads[key] ?? []).map(
            (f: UploadedFile) => ({ name: f.name, size: f.size })
          )
          return (
            <div key={cat.key}>
              <h3 className="mb-1 text-sm font-semibold text-zinc-200">
                {cat.label}
              </h3>
              <p className="mb-3 text-xs text-zinc-500">{cat.desc}</p>

              <FileUploadZone
                onFilesSelected={(selected) => handleFiles(cat.key, selected)}
                existingFiles={files}
                onRemoveFile={(i) => removeFile(cat.key, i)}
                accentColor="lime"
                hint="PDF, PNG, JPG — até 250MB por arquivo"
              />
            </div>
          )
        })}
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
