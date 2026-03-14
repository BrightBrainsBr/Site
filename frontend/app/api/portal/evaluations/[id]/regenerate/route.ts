import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'

import { extractAllDocuments } from '~/app/api/assessment/lib/generate-report-background'
import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'

export const runtime = 'nodejs'
export const maxDuration = 300

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

async function requirePortalSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('portal_session')
  return session?.value ?? null
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await requirePortalSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const sb = createSb()

    const { data: row, error: fetchErr } = await sb
      .from('mental_health_evaluations')
      .select(
        'form_data, scores, doctor_uploads, status, report_markdown, report_pdf_url, report_history, patient_name, patient_email, patient_phone, patient_profile, extracted_documents_text'
      )
      .eq('id', id)
      .single()

    if (fetchErr || !row) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const body = (await _request.json().catch(() => ({}))) as {
      force?: boolean
    }

    if (
      typeof row.status === 'string' &&
      row.status.startsWith('processing') &&
      !body.force
    ) {
      return NextResponse.json(
        {
          error: 'Relatório já está sendo gerado. Use "force" para reiniciar.',
        },
        { status: 409 }
      )
    }

    const existingHistory = (row.report_history ?? []) as {
      report_markdown: string
      report_pdf_url: string | null
      generated_at: string
    }[]

    if (row.report_markdown) {
      existingHistory.push({
        report_markdown: row.report_markdown as string,
        report_pdf_url: (row.report_pdf_url as string) ?? null,
        generated_at: new Date().toISOString(),
      })
    }

    const dispatchingStatus = `processing_dispatching_${Date.now()}`

    const { error: statusErr } = await sb
      .from('mental_health_evaluations')
      .update({
        status: dispatchingStatus,
        report_history: existingHistory,
        processing_error: null,
      })
      .eq('id', id)

    if (statusErr) {
      console.error(
        `[regenerate:${requestId}] Failed to set status:`,
        statusErr.message
      )
    }

    const formData = (row.form_data ?? {}) as AssessmentFormData
    const doctorUploads = (row.doctor_uploads ?? []) as {
      name: string
      url: string
      type?: string
    }[]
    const nome = (row.patient_name as string) || formData?.nome || ''
    const uploads =
      doctorUploads.length > 0
        ? doctorUploads.map((d) => ({ name: d.name, url: d.url, type: d.type }))
        : undefined

    const hasCachedExtraction = typeof row.extracted_documents_text === 'string'

    console.warn(
      `[regenerate:${requestId}] Regeneration started | id=${id} | patient="${nome}" | uploads=${uploads?.length ?? 0} | cachedExtraction=${hasCachedExtraction} | history=${existingHistory.length}`
    )

    after(async () => {
      const p = (msg: string) =>
        console.warn(`[regenerate:${requestId}] ${msg}`)
      const bgStart = Date.now()

      const setStatus = async (
        status: string,
        patch: Record<string, unknown> = {}
      ) => {
        const { error: upErr } = await sb
          .from('mental_health_evaluations')
          .update({ status, ...patch })
          .eq('id', id)
        if (upErr) p(`Failed to set status=${status}: ${upErr.message}`)
      }

      try {
        await setStatus(`processing_report_${Date.now()}`, {
          processing_error: null,
        })

        if (hasCachedExtraction) {
          p(
            `Skipping extraction — using cached extraction (${(row.extracted_documents_text as string).length}ch)`
          )
        } else if (uploads?.length) {
          p(
            `▶ START EXTRACTION | patient="${nome}" | id=${id} | uploads=${uploads.length}`
          )
          const client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY!,
          })
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
            .eq('id', id)

          p(`Extraction cached to DB`)
        } else {
          p(`No uploads — saving empty extraction`)
          await sb
            .from('mental_health_evaluations')
            .update({ extracted_documents_text: '' })
            .eq('id', id)
        }

        p(`Triggering generate-stages...`)
        const url = `${getBaseUrl()}/api/assessment/generate-stages`
        const triggerRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evaluationId: id,
            mode: 'regenerate',
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
          `[regenerate:${requestId}] ❌ FAIL | patient="${nome}" | ${elapsed}s | error: ${errorMsg}`
        )
        await setStatus('error', { processing_error: errorMsg })
      }
    })

    return NextResponse.json({
      status: 'processing_report',
      requestId,
    })
  } catch (err) {
    console.error(`[regenerate:${requestId}] Error:`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
