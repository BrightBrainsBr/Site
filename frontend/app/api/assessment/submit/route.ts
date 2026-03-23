import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'

import type { LogCallback } from '~/app/api/assessment/lib/generate-report-background'
import { extractAllDocuments } from '~/app/api/assessment/lib/generate-report-background'
import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'

export const runtime = 'nodejs'
export const maxDuration = 300

const BUCKET = 'assessment-pdfs'

function extractStoragePath(publicUrl: string): string {
  const marker = `/object/public/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return ''
  return publicUrl.slice(idx + marker.length)
}

function createSb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getProductionUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

// eslint-disable-next-line complexity -- assessment submit has many branches
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const body = await request.json()
    const {
      formData,
      scores,
      uploads,
      company_id,
      employee_department,
      cycle_id,
      code_id,
    } = body as {
      formData: AssessmentFormData
      scores: Record<string, number>
      uploads?: { name: string; url: string; type?: string }[]
      company_id?: string
      employee_department?: string
      cycle_id?: string
      code_id?: string
    }

    const nome = formData?.nome || ''
    if (!nome) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    console.warn(
      `[submit:${requestId}] Saving evaluation | patient=${nome} | uploads=${uploads?.length ?? 0}`
    )

    const sb = createSb()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { uploads: _stripUploads, ...cleanFormData } = formData

    const doctorUploads =
      uploads && uploads.length > 0
        ? uploads.map((u) => ({
            name: u.name,
            url: u.url,
            type: u.type || 'application/pdf',
            path: extractStoragePath(u.url),
            uploaded_at: new Date().toISOString(),
          }))
        : null

    const insertPayload: Record<string, unknown> = {
      patient_name: nome,
      patient_email: formData.email || null,
      patient_cpf: formData.cpf?.replace(/\D/g, '') || null,
      patient_phone: formData.telefone || null,
      patient_birth_date: formData.nascimento || null,
      patient_sex: formData.sexo || null,
      patient_profile: (formData.publico as string) || null,
      form_data: cleanFormData,
      scores,
      status: `processing_dispatching_${Date.now()}`,
      doctor_uploads: doctorUploads,
    }
    if (company_id) insertPayload.company_id = company_id
    if (employee_department)
      insertPayload.employee_department = employee_department
    if (cycle_id) insertPayload.cycle_id = cycle_id

    const { data: row, error } = await sb
      .from('mental_health_evaluations')
      .insert(insertPayload)
      .select('id')
      .single()

    if (error) {
      console.error(`[submit:${requestId}] Supabase insert error:`, error)
      throw new Error('Erro ao salvar avaliação')
    }

    const evaluationId = row.id
    console.warn(
      `[submit:${requestId}] Evaluation saved | patient="${nome}" | id=${evaluationId}`
    )

    // Mark company access code as used if B2B
    if (code_id) {
      await sb
        .from('company_access_codes')
        .update({
          used_at: new Date().toISOString(),
          used_by_evaluation_id: evaluationId,
        })
        .eq('id', code_id)
    }

    after(async () => {
      const p = (msg: string) => console.warn(`[submit:${requestId}] ${msg}`)
      const bgStart = Date.now()

      p(`▶ START | patient="${nome}" | id=${evaluationId}`)

      const setStatus = async (
        status: string,
        patch: Record<string, unknown> = {}
      ) => {
        const { error: upErr } = await sb
          .from('mental_health_evaluations')
          .update({ status, ...patch })
          .eq('id', evaluationId)
        if (upErr) p(`Failed to set status=${status}: ${upErr.message}`)
      }

      const appendLog: LogCallback = async (message: string) => {
        const entry = { t: Date.now(), m: message }
        await sb
          .rpc('append_processing_log', {
            eval_id: evaluationId,
            log_entry: entry,
          })
          .then(({ error: rpcErr }) => {
            if (rpcErr) {
              sb.from('mental_health_evaluations')
                .update({ processing_logs: [entry] })
                .eq('id', evaluationId)
                .then(() => {})
            }
          })
      }

      try {
        await setStatus(`processing_report_${Date.now()}`, {
          processing_error: null,
          processing_logs: [],
        })

        const hasUploads = uploads && uploads.length > 0
        if (hasUploads) {
          await appendLog(`Extraindo ${uploads.length} documentos…`)
          const client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY!,
          })
          const extractedText = await extractAllDocuments(
            client,
            uploads,
            requestId,
            (status) => setStatus(status),
            appendLog
          )
          p(`Extraction done | ${extractedText.length}ch`)

          await sb
            .from('mental_health_evaluations')
            .update({ extracted_documents_text: extractedText })
            .eq('id', evaluationId)

          await appendLog(
            `Extração concluída (${(extractedText.length / 1000).toFixed(0)}k chars)`
          )
        } else {
          await sb
            .from('mental_health_evaluations')
            .update({ extracted_documents_text: '' })
            .eq('id', evaluationId)
        }

        const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)
        p(`Extraction phase done in ${elapsed}s — triggering report generation`)
        await appendLog('Iniciando geração do relatório…')

        const baseUrl = getProductionUrl()
        const triggerUrl = `${baseUrl}/api/assessment/continue-report`
        p(`Trigger URL: ${triggerUrl}`)

        const triggerRes = await fetch(triggerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evaluationId,
            mode: 'submit',
            phase: 'stage1',
            callerRequestId: requestId,
          }),
        })

        if (!triggerRes.ok) {
          const text = await triggerRes.text().catch(() => '(no body)')
          throw new Error(
            `continue-report trigger failed: ${triggerRes.status} ${text.slice(0, 200)}`
          )
        }

        p(`✅ Report generation triggered`)
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Erro desconhecido'
        const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)
        console.error(
          `[submit:${requestId}] ❌ FAIL | patient="${nome}" | ${elapsed}s | error: ${errorMsg}`
        )
        await setStatus('error', { processing_error: errorMsg })
        await appendLog(`❌ Erro: ${errorMsg}`)
      }
    })

    return NextResponse.json({
      evaluationId,
      status: 'processing_report',
    })
  } catch (err) {
    console.error(`[submit:${requestId}] Request failed:`, err)
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
