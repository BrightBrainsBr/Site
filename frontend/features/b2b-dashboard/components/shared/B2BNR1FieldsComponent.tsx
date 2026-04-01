// frontend/features/b2b-dashboard/components/shared/B2BNR1FieldsComponent.tsx

'use client'

import {
  AlertTriangle,
  Download,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import type {
  B2BNR1Data,
  B2BSOPDocument,
  PdfExtractionNR1Result,
  PdfExtractionResponse,
} from '../../b2b-dashboard.interface'
import { B2BPdfUploadComponent } from './B2BPdfUploadComponent'

interface B2BNR1FieldsComponentProps {
  companyId: string
  companyData: B2BNR1Data
  onSave: (data: Partial<B2BNR1Data>) => Promise<void>
}

export function B2BNR1FieldsComponent({
  companyId,
  companyData,
  onSave,
}: B2BNR1FieldsComponentProps) {
  const [sstName, setSstName] = useState(
    companyData.sst_responsible_name ?? ''
  )
  const [sstRole, setSstRole] = useState(
    companyData.sst_responsible_role ?? ''
  )
  const [signatureUrl, setSignatureUrl] = useState(
    companyData.sst_signature_url ?? ''
  )
  const [cnae, setCnae] = useState(companyData.cnae ?? '')
  const [riskGrade, setRiskGrade] = useState(companyData.risk_grade ?? '')
  const [processDescriptions, setProcessDescriptions] = useState(
    typeof companyData.nr1_process_descriptions === 'string'
      ? companyData.nr1_process_descriptions
      : ''
  )
  const [activities, setActivities] = useState(
    typeof companyData.nr1_activities === 'string'
      ? companyData.nr1_activities
      : ''
  )
  const [preventiveMeasures, setPreventiveMeasures] = useState<string[]>(
    Array.isArray(companyData.nr1_preventive_measures)
      ? companyData.nr1_preventive_measures
      : []
  )
  const [newMeasure, setNewMeasure] = useState('')
  const [sops, setSops] = useState<B2BSOPDocument[]>(
    companyData.emergency_sop_urls ?? []
  )
  const [showPdfImport, setShowPdfImport] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)
  const [uploadingSop, setUploadingSop] = useState(false)
  const signatureInputRef = useRef<HTMLInputElement>(null)
  const sopInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      await onSave({
        sst_responsible_name: sstName || null,
        sst_responsible_role: sstRole || null,
        sst_signature_url: signatureUrl || null,
        cnae: cnae || null,
        risk_grade: riskGrade || null,
        nr1_process_descriptions: processDescriptions || null,
        nr1_activities: activities || null,
        nr1_preventive_measures:
          preventiveMeasures.length > 0 ? preventiveMeasures : null,
        emergency_sop_urls: sops.length > 0 ? sops : null,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const uploadFile = useCallback(
    async (
      file: File,
      bucket: string
    ): Promise<{ publicUrl: string } | null> => {
      try {
        const signedRes = await fetch(`/api/b2b/${companyId}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upload_file',
            bucket,
            fileName: file.name,
            contentType: file.type,
          }),
        })
        if (!signedRes.ok) return null

        const { signedUrl, fullPath } = await signedRes.json()

        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
            'x-upsert': 'true',
          },
          body: file,
        })
        if (!uploadRes.ok) return null

        const publicRes = await fetch(`/api/b2b/${companyId}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_public_url',
            bucket,
            path: fullPath,
          }),
        })
        if (!publicRes.ok) return null

        const { publicUrl } = await publicRes.json()
        return { publicUrl }
      } catch {
        return null
      }
    },
    [companyId]
  )

  const handleSignatureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingSignature(true)
    const result = await uploadFile(file, 'company-signatures')
    if (result) {
      setSignatureUrl(result.publicUrl)
    }
    setUploadingSignature(false)
    if (signatureInputRef.current) signatureInputRef.current.value = ''
  }

  const handleSopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingSop(true)
    const result = await uploadFile(file, 'company-documents')
    if (result) {
      setSops((prev) => [
        ...prev,
        {
          name: file.name,
          url: result.publicUrl,
          uploaded_at: new Date().toISOString(),
        },
      ])
    }
    setUploadingSop(false)
    if (sopInputRef.current) sopInputRef.current.value = ''
  }

  const removeSop = (index: number) => {
    setSops((prev) => prev.filter((_, i) => i !== index))
  }

  const addMeasure = () => {
    const val = newMeasure.trim()
    if (!val || preventiveMeasures.includes(val)) return
    setPreventiveMeasures((prev) => [...prev, val])
    setNewMeasure('')
  }

  const removeMeasure = (index: number) => {
    setPreventiveMeasures((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePdfExtracted = (data: PdfExtractionResponse) => {
    const nr1 = data.extracted as PdfExtractionNR1Result
    if (nr1.process_descriptions) setProcessDescriptions(nr1.process_descriptions)
    if (nr1.activities) setActivities(nr1.activities)
    if (nr1.preventive_measures?.length) {
      setPreventiveMeasures(nr1.preventive_measures)
    }
    setShowPdfImport(false)
  }

  return (
    <div className="space-y-5">
      {/* Section 1: Responsável SST */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-[#14B8A6]" />
          <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
            Responsável SST
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#94A3B8]">
              Nome
            </label>
            <input
              value={sstName}
              onChange={(e) => setSstName(e.target.value)}
              placeholder="Nome do responsável"
              className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-3 py-2 text-[12px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#94A3B8]">
              Cargo / Função
            </label>
            <input
              value={sstRole}
              onChange={(e) => setSstRole(e.target.value)}
              placeholder="Ex: Engenheiro de Segurança"
              className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-3 py-2 text-[12px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-[11px] font-medium text-[#94A3B8]">
            Assinatura (imagem)
          </label>
          <div className="flex items-center gap-3">
            {signatureUrl && (
              <div className="relative h-16 w-40 overflow-hidden rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F]">
                <img
                  src={signatureUrl}
                  alt="Assinatura SST"
                  className="h-full w-full object-contain"
                />
                <button
                  onClick={() => setSignatureUrl('')}
                  className="absolute right-1 top-1 rounded bg-[#07111F]/80 p-0.5 text-[#64748B] hover:text-[#F87171]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <button
              onClick={() => signatureInputRef.current?.click()}
              disabled={uploadingSignature}
              className="flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-2 text-[12px] font-medium text-[#94A3B8] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E2E8F0] disabled:opacity-40"
            >
              {uploadingSignature ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {uploadingSignature ? 'Enviando...' : 'Upload'}
            </button>
            <input
              ref={signatureInputRef}
              type="file"
              accept="image/*"
              onChange={handleSignatureUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Dados da Empresa */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#14B8A6]" />
          <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
            Dados da Empresa
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#94A3B8]">
              CNAE
            </label>
            <input
              value={cnae}
              onChange={(e) => setCnae(e.target.value)}
              placeholder="Ex: 6201-5/01"
              className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-3 py-2 text-[12px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#94A3B8]">
              Grau de Risco
            </label>
            <input
              value={riskGrade}
              onChange={(e) => setRiskGrade(e.target.value)}
              placeholder="Ex: 2"
              className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-3 py-2 text-[12px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Campos NR-1 */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#14B8A6]" />
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
              Campos NR-1
            </h3>
          </div>
          <button
            onClick={() => setShowPdfImport((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
              showPdfImport
                ? 'bg-[#14B8A6]/15 text-[#14B8A6]'
                : 'border border-[rgba(255,255,255,0.1)] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E2E8F0]'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            {showPdfImport ? 'Fechar importação' : 'Importar de PDF'}
          </button>
        </div>

        {showPdfImport && (
          <div className="mb-5">
            <B2BPdfUploadComponent
              companyId={companyId}
              extractionType="nr1-fields"
              onExtracted={handlePdfExtracted}
              onCancel={() => setShowPdfImport(false)}
            />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#94A3B8]">
              Descrição dos Processos de Trabalho
            </label>
            <textarea
              value={processDescriptions}
              onChange={(e) => setProcessDescriptions(e.target.value)}
              rows={4}
              placeholder="Descreva os processos de trabalho da empresa..."
              className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-3 py-2 text-[12px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#94A3B8]">
              Descrição das Atividades
            </label>
            <textarea
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              rows={4}
              placeholder="Descreva as atividades realizadas..."
              className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-3 py-2 text-[12px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#94A3B8]">
              Medidas Preventivas Existentes
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              {preventiveMeasures.map((measure, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-[#132540] px-3 py-1 text-[12px] text-[#E2E8F0]"
                >
                  {measure}
                  <button
                    onClick={() => removeMeasure(i)}
                    className="text-[#64748B] hover:text-[#F87171]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {preventiveMeasures.length === 0 && (
                <span className="text-[11px] text-[#64748B]">
                  Nenhuma medida cadastrada
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={newMeasure}
                onChange={(e) => setNewMeasure(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMeasure()}
                placeholder="Adicionar medida preventiva..."
                className="flex-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-3 py-2 text-[12px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
              />
              <button
                onClick={addMeasure}
                disabled={!newMeasure.trim()}
                className="flex items-center gap-1 rounded-lg bg-[#0D9488] px-3 py-2 text-[12px] font-medium text-white disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: SOPs de Emergência */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
              SOPs de Emergência
            </h3>
          </div>
          <button
            onClick={() => sopInputRef.current?.click()}
            disabled={uploadingSop}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-[11px] font-medium text-[#94A3B8] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E2E8F0] disabled:opacity-40"
          >
            {uploadingSop ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {uploadingSop ? 'Enviando...' : 'Upload PDF'}
          </button>
          <input
            ref={sopInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleSopUpload}
            className="hidden"
          />
        </div>

        {sops.length === 0 ? (
          <p className="py-4 text-center text-[12px] text-[#64748B]">
            Nenhum SOP de emergência cadastrado.
          </p>
        ) : (
          <div className="space-y-2">
            {sops.map((sop, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#07111F] px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#64748B]" />
                  <div>
                    <p className="text-[12px] font-medium text-[#E2E8F0]">
                      {sop.name}
                    </p>
                    <p className="text-[10px] text-[#64748B]">
                      {new Date(sop.uploaded_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={sop.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-[#14B8A6] transition-colors hover:bg-[#14B8A6]/10"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </a>
                  <button
                    onClick={() => removeSop(i)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-[#F87171] transition-colors hover:bg-[#F87171]/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex items-center justify-end gap-3">
        {saveSuccess && (
          <span className="text-[12px] font-medium text-[#34D399]">
            Salvo com sucesso!
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#0D9488] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#14B8A6] disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Salvando...' : 'Salvar Dados NR-1'}
        </button>
      </div>
    </div>
  )
}
