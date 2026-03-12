'use client'

import { useCallback } from 'react'

import {
  type FileEntry,
  FileUploadZone,
} from '~/shared/components/FileUploadZone'

import type { StepComponentProps, UploadedFile } from '../assessment.interface'
import { InfoBox, SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

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
