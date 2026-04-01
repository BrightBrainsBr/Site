// frontend/agents/b2b-laudo/services/b2b-laudo.storage.ts

import { createClient } from '@supabase/supabase-js'

import type {
  CompanyLaudoData,
  PreviousEvaluationSummary,
} from '../models/b2b-laudo.interface'

function createSb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function fetchEvaluation(evaluationId: string): Promise<{
  formData: Record<string, unknown>
  scores: Record<string, number>
  companyId: string
  patientEmail: string
}> {
  const sb = createSb()
  const { data, error } = await sb
    .from('mental_health_evaluations')
    .select(
      'form_data, scores, company_id, patient_email'
    )
    .eq('id', evaluationId)
    .single()

  if (error || !data) {
    throw new Error(`Evaluation ${evaluationId} not found: ${error?.message}`)
  }

  return {
    formData: (data.form_data ?? {}) as Record<string, unknown>,
    scores: (data.scores ?? {}) as Record<string, number>,
    companyId: data.company_id as string,
    patientEmail: (data.patient_email as string) || '',
  }
}

export async function fetchCompany(companyId: string): Promise<CompanyLaudoData> {
  const sb = createSb()
  const { data, error } = await sb
    .from('companies')
    .select('name, cnpj, cnae, risk_grade, sst_responsible_name, sst_signature_url')
    .eq('id', companyId)
    .single()

  if (error || !data) {
    throw new Error(`Company ${companyId} not found: ${error?.message}`)
  }

  return {
    name: data.name ?? '',
    cnpj: data.cnpj ?? '',
    cnae: data.cnae ?? '',
    risk_grade: data.risk_grade ?? '',
    sst_responsible_name: data.sst_responsible_name ?? undefined,
    sst_signature_url: data.sst_signature_url ?? undefined,
  }
}

export async function fetchHistory(
  email: string,
  companyId: string,
  limit = 3
): Promise<PreviousEvaluationSummary[]> {
  if (!email) return []

  const sb = createSb()
  const { data, error } = await sb
    .from('mental_health_evaluations')
    .select(
      'created_at, scores, risk_level, cycle:assessment_cycles(label)'
    )
    .eq('patient_email', email)
    .eq('company_id', companyId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map((row) => ({
    cycle_label:
      (row.cycle as { label?: string } | null)?.label ?? 'N/I',
    created_at: row.created_at as string,
    scores: (row.scores ?? {}) as Record<string, number>,
    risk_level: (row.risk_level as string) ?? 'N/I',
  }))
}

export async function uploadPdf(
  evaluationId: string,
  pdfBuffer: Buffer
): Promise<string> {
  const sb = createSb()
  const fileName = `laudo_${evaluationId}_${Date.now()}.pdf`

  const { error: uploadError } = await sb.storage
    .from('assessment-pdfs')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`PDF upload failed: ${uploadError.message}`)
  }

  const {
    data: { publicUrl },
  } = sb.storage.from('assessment-pdfs').getPublicUrl(fileName)

  return publicUrl
}

export async function updateEvaluation(
  evaluationId: string,
  data: {
    laudo_pdf_url: string
    laudo_markdown: string
    status: string
  }
): Promise<void> {
  const sb = createSb()
  const { error } = await sb
    .from('mental_health_evaluations')
    .update({
      laudo_pdf_url: data.laudo_pdf_url,
      laudo_markdown: data.laudo_markdown,
      status: data.status,
    })
    .eq('id', evaluationId)

  if (error) {
    throw new Error(`Evaluation update failed: ${error.message}`)
  }
}
