import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'

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

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.SITE_URL || 'http://localhost:3000'
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const body = await request.json()
    const { formData, scores, uploads } = body as {
      formData: AssessmentFormData
      scores: Record<string, number>
      uploads?: { name: string; url: string; type?: string }[]
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

    const { data: row, error } = await sb
      .from('mental_health_evaluations')
      .insert({
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
      })
      .select('id')
      .single()

    if (error) {
      console.error(`[submit:${requestId}] Supabase insert error:`, error)
      throw new Error('Erro ao salvar avaliação')
    }

    const evaluationId = row.id
    console.warn(
      `[submit:${requestId}] Evaluation saved | patient="${nome}" | id=${evaluationId} — extraction will run in after()`
    )

    after(async () => {
      const p = (msg: string) => console.warn(`[submit:${requestId}] ${msg}`)
      const bgStart = Date.now()

      p(
        `▶ START EXTRACTION | patient="${nome}" | id=${evaluationId} | uploads=${uploads?.length ?? 0}`
      )

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

      try {
        await setStatus(`processing_report_${Date.now()}`, {
          processing_error: null,
        })

        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
        const extractedDocs = await extractAllDocuments(
          client,
          uploads,
          requestId,
          (status) => setStatus(status)
        )
        p(
          `Extraction done | ${extractedDocs.length} chars | ${((Date.now() - bgStart) / 1000).toFixed(1)}s`
        )

        await sb
          .from('mental_health_evaluations')
          .update({ extracted_documents_text: extractedDocs })
          .eq('id', evaluationId)

        p(`Extraction cached to DB — triggering generate-stages`)

        const url = `${getBaseUrl()}/api/assessment/generate-stages`
        const triggerRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evaluationId,
            mode: 'submit',
            callerRequestId: requestId,
          }),
          signal: AbortSignal.timeout(15_000),
        })

        if (!triggerRes.ok) {
          const text = await triggerRes.text().catch(() => '')
          throw new Error(
            `generate-stages trigger failed: ${triggerRes.status} ${text}`
          )
        }

        p(`generate-stages triggered successfully`)
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Erro desconhecido'
        const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)
        console.error(
          `[submit:${requestId}] ❌ FAIL EXTRACTION | patient="${nome}" | ${elapsed}s | error: ${errorMsg}`
        )
        await setStatus('error', { processing_error: errorMsg })
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
