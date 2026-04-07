// frontend/features/b2b-dashboard/components/shared/B2BPdfUploadComponent.tsx

'use client'

import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import type {
  PdfExtractionEventsResult,
  PdfExtractionNR1Result,
  PdfExtractionResponse,
  PdfExtractionType,
} from '../../b2b-dashboard.interface'
import { useB2BExtractPdfMutationHook } from '../../hooks/useB2BExtractPdfMutationHook'

interface B2BPdfUploadComponentProps {
  companyId: string
  extractionType: PdfExtractionType
  onExtracted: (data: PdfExtractionResponse) => void
  onCancel: () => void
}

type Step = 'upload' | 'processing' | 'review'

export function B2BPdfUploadComponent({
  companyId,
  extractionType,
  onExtracted,
  onCancel,
}: B2BPdfUploadComponentProps) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [result, setResult] = useState<PdfExtractionResponse | null>(null)
  const [editedNR1, setEditedNR1] = useState<PdfExtractionNR1Result | null>(
    null
  )
  const [editedEvents, setEditedEvents] =
    useState<PdfExtractionEventsResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const extractMutation = useB2BExtractPdfMutationHook(companyId)

  const uploadFileAndExtract = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile)
      setStep('processing')
      setUploadError(null)

      try {
        const signedRes = await fetch(`/api/b2b/${companyId}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upload_file',
            bucket: 'company-documents',
            fileName: selectedFile.name,
            contentType: selectedFile.type || 'application/pdf',
          }),
        })
        if (!signedRes.ok) throw new Error('Falha ao obter URL de upload')

        const { signedUrl, token, fullPath } = await signedRes.json()

        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': selectedFile.type || 'application/pdf',
            'x-upsert': 'true',
          },
          body: selectedFile,
        })
        if (!uploadRes.ok) throw new Error('Falha no upload do arquivo')

        const publicRes = await fetch(`/api/b2b/${companyId}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_public_url',
            bucket: 'company-documents',
            path: fullPath,
          }),
        })
        if (!publicRes.ok) throw new Error('Falha ao obter URL pública')

        const { publicUrl } = await publicRes.json()

        const extractionResult = await extractMutation.mutateAsync({
          fileUrl: publicUrl,
          extractionType,
        })

        setResult(extractionResult)

        if (extractionType === 'nr1-fields' && extractionResult.extracted) {
          setEditedNR1(
            extractionResult.extracted as PdfExtractionNR1Result
          )
        } else if (
          extractionType === 'events-bulk' &&
          extractionResult.extracted
        ) {
          setEditedEvents(
            extractionResult.extracted as PdfExtractionEventsResult
          )
        }

        setStep('review')
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : 'Erro desconhecido'
        )
        setStep('upload')
      }
    },
    [companyId, extractionType, extractMutation]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile?.type === 'application/pdf') {
        void uploadFileAndExtract(droppedFile)
      } else {
        setUploadError('Apenas arquivos PDF são aceitos')
      }
    },
    [uploadFileAndExtract]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        void uploadFileAndExtract(selectedFile)
      }
    },
    [uploadFileAndExtract]
  )

  const handleConfirm = () => {
    if (!result) return
    const finalData: PdfExtractionResponse = {
      ...result,
      extracted:
        extractionType === 'nr1-fields' && editedNR1
          ? editedNR1
          : extractionType === 'events-bulk' && editedEvents
            ? editedEvents
            : result.extracted,
    }
    onExtracted(finalData)
  }

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#07111F] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-[15px] font-semibold text-[#E2E8F0]">
          <FileText className="h-4 w-4 text-[#14B8A6]" />
          {extractionType === 'nr1-fields'
            ? 'Importar Dados NR-1 de PDF'
            : 'Importar Eventos de PDF'}
        </h4>
        <button
          onClick={onCancel}
          className="rounded p-1 text-[#64748B] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E2E8F0]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {step === 'upload' && (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragOver
                ? 'border-[#14B8A6] bg-[#14B8A6]/5'
                : 'border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.2)]'
            }`}
          >
            <Upload className="h-8 w-8 text-[#64748B]" />
            <div className="text-center">
              <p className="text-[15px] font-medium text-[#E2E8F0]">
                Arraste um PDF aqui ou clique para selecionar
              </p>
              <p className="mt-1 text-[13px] text-[#64748B]">
                Apenas arquivos .pdf são aceitos
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploadError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#F87171]/10 px-3 py-2 text-[14px] text-[#F87171]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {uploadError}
            </div>
          )}
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
          <div className="text-center">
            <p className="text-[15px] font-medium text-[#E2E8F0]">
              Analisando documento com IA...
            </p>
            <p className="mt-1 text-[13px] text-[#64748B]">
              {file?.name ?? 'documento.pdf'}
            </p>
          </div>
        </div>
      )}

      {step === 'review' && result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-[#14B8A6]/15 px-3 py-1 text-[13px] font-medium text-[#14B8A6]">
              <CheckCircle className="h-3 w-3" />
              Confiança: {Math.round(result.confidence * 100)}%
            </div>
            {result.warnings.map((warning, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-full bg-[#F59E0B]/15 px-3 py-1 text-[13px] font-medium text-[#F59E0B]"
              >
                <AlertTriangle className="h-3 w-3" />
                {warning}
              </div>
            ))}
          </div>

          {extractionType === 'nr1-fields' && editedNR1 && (
            <NR1ReviewForm data={editedNR1} onChange={setEditedNR1} />
          )}

          {extractionType === 'events-bulk' && editedEvents && (
            <EventsReviewTable
              data={editedEvents}
              onChange={setEditedEvents}
            />
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onCancel}
              className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-2 text-[14px] font-medium text-[#94A3B8] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E2E8F0]"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="rounded-lg bg-[#0D9488] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#14B8A6]"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NR1ReviewForm({
  data,
  onChange,
}: {
  data: PdfExtractionNR1Result
  onChange: (data: PdfExtractionNR1Result) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-[13px] font-medium uppercase tracking-wider text-[#64748B]">
        Dados extraídos — revise antes de confirmar
      </p>
      <div>
        <label className="mb-1 block text-[14px] font-medium text-[#94A3B8]">
          Descrição dos Processos de Trabalho
        </label>
        <textarea
          value={data.process_descriptions}
          onChange={(e) =>
            onChange({ ...data, process_descriptions: e.target.value })
          }
          rows={4}
          className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-3 py-2 text-[14px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[14px] font-medium text-[#94A3B8]">
          Descrição das Atividades
        </label>
        <textarea
          value={data.activities}
          onChange={(e) => onChange({ ...data, activities: e.target.value })}
          rows={4}
          className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-3 py-2 text-[14px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[14px] font-medium text-[#94A3B8]">
          Medidas Preventivas Existentes
        </label>
        <textarea
          value={data.preventive_measures.join('\n')}
          onChange={(e) =>
            onChange({
              ...data,
              preventive_measures: e.target.value
                .split('\n')
                .filter((s) => s.trim()),
            })
          }
          rows={4}
          placeholder="Uma medida por linha"
          className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-3 py-2 text-[14px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
        />
      </div>
    </div>
  )
}

function EventsReviewTable({
  data,
  onChange,
}: {
  data: PdfExtractionEventsResult
  onChange: (data: PdfExtractionEventsResult) => void
}) {
  const updateEvent = (index: number, field: string, value: string) => {
    const updated = [...data.events]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ events: updated })
  }

  const removeEvent = (index: number) => {
    onChange({ events: data.events.filter((_, i) => i !== index) })
  }

  if (data.events.length === 0) {
    return (
      <p className="py-4 text-center text-[14px] text-[#64748B]">
        Nenhum evento extraído do documento.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[13px] font-medium uppercase tracking-wider text-[#64748B]">
        Eventos extraídos ({data.events.length}) — edite antes de confirmar
      </p>
      <div className="max-h-[300px] overflow-auto rounded-lg border border-[rgba(255,255,255,0.06)]">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 bg-[#0E1E33]">
            <tr className="border-b border-[rgba(255,255,255,0.08)]">
              <th className="px-2 py-2 text-left text-[12px] font-medium uppercase tracking-wider text-[#64748B]">
                Data
              </th>
              <th className="px-2 py-2 text-left text-[12px] font-medium uppercase tracking-wider text-[#64748B]">
                Tipo
              </th>
              <th className="px-2 py-2 text-left text-[12px] font-medium uppercase tracking-wider text-[#64748B]">
                Descrição
              </th>
              <th className="px-2 py-2 text-left text-[12px] font-medium uppercase tracking-wider text-[#64748B]">
                CID
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {data.events.map((event, i) => (
              <tr
                key={i}
                className="border-b border-[rgba(255,255,255,0.04)]"
              >
                <td className="px-2 py-1.5">
                  <input
                    value={event.event_date}
                    onChange={(e) =>
                      updateEvent(i, 'event_date', e.target.value)
                    }
                    className="w-24 rounded border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-1.5 py-1 text-[13px] text-[#E2E8F0] focus:border-[#14B8A6] focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={event.event_type}
                    onChange={(e) =>
                      updateEvent(i, 'event_type', e.target.value)
                    }
                    className="w-24 rounded border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-1.5 py-1 text-[13px] text-[#E2E8F0] focus:border-[#14B8A6] focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={event.description}
                    onChange={(e) =>
                      updateEvent(i, 'description', e.target.value)
                    }
                    className="w-full rounded border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-1.5 py-1 text-[13px] text-[#E2E8F0] focus:border-[#14B8A6] focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={event.cid_code ?? ''}
                    onChange={(e) =>
                      updateEvent(i, 'cid_code', e.target.value)
                    }
                    className="w-16 rounded border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-1.5 py-1 text-[13px] text-[#E2E8F0] focus:border-[#14B8A6] focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => removeEvent(i)}
                    className="text-[#64748B] hover:text-[#F87171]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
