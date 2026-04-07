import { awaitAllCallbacks } from '@langchain/core/callbacks/promises'
import { createClient } from '@supabase/supabase-js'
import { traceable } from 'langsmith/traceable'
import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'

import { buildPdf } from '~/app/api/assessment/generate-pdf/pdf-helpers'
import type { LogCallback } from '~/app/api/assessment/lib/generate-report-background'
import {
  runReportStage1,
  runReportStage2,
} from '~/app/api/assessment/lib/generate-report-background'
import {
  sendErrorEmail,
  sendReportEmail,
} from '~/app/api/assessment/lib/send-email'
import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'

export const runtime = 'nodejs'
export const maxDuration = 300

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

interface RequestBody {
  evaluationId: string
  mode: 'submit' | 'regenerate'
  phase: 'stage1' | 'stage2' | 'b2b-laudo'
  callerRequestId?: string
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { evaluationId, mode, phase, callerRequestId } = body
  const rid = callerRequestId ?? requestId
  if (!evaluationId || !['submit', 'regenerate'].includes(mode)) {
    return NextResponse.json(
      { error: 'Missing evaluationId or invalid mode' },
      { status: 400 }
    )
  }

  const sb = createSb()
  const { data: row, error: fetchErr } = await sb
    .from('mental_health_evaluations')
    .select(
      'status, form_data, scores, report_stage1, extracted_documents_text, patient_name, patient_email, patient_phone, patient_profile'
    )
    .eq('id', evaluationId)
    .single()

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  console.warn(
    `[continue-report:${rid}] Claimed | id=${evaluationId} | phase=${phase} | mode=${mode}`
  )

  if (phase === 'b2b-laudo') {
    handleB2BLaudo(sb, evaluationId, rid)
  } else if (phase === 'stage1') {
    handleStage1(sb, row, evaluationId, mode, rid)
  } else {
    handleStage2(sb, row, evaluationId, mode, rid)
  }

  return NextResponse.json({ success: true, phase })
}

function handleB2BLaudo(
  sb: ReturnType<typeof createSb>,
  evaluationId: string,
  rid: string
) {
  after(async () => {
    const p = (msg: string) =>
      console.warn(`[continue-report:${rid}] [b2b-laudo] ${msg}`)
    const bgStart = Date.now()

    try {
      p(`▶ B2B Laudo | id=${evaluationId}`)

      const { b2bLaudoGraph } =
        await import('~/agents/b2b-laudo/services/b2b-laudo.graph')
      const { ensureTracingFlushed } = await import('~/agents/shared/tracing')

      const result = await b2bLaudoGraph.invoke(
        { evaluationId },
        {
          runName: `b2b-laudo:${evaluationId.slice(0, 8)}`,
          metadata: {
            evaluation_id: evaluationId,
            request_id: rid,
            report_type: 'b2b-laudo',
          },
          tags: ['b2b-laudo', 'assessment'],
        }
      )

      await ensureTracingFlushed()

      const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)

      if (result.status === 'error') {
        const errorMsg = result.errors?.join('; ') || 'Unknown agent error'
        console.error(
          `[continue-report:${rid}] [b2b-laudo] ❌ FAIL | ${elapsed}s | ${errorMsg}`
        )
        await sb
          .from('mental_health_evaluations')
          .update({ status: 'error', processing_error: errorMsg })
          .eq('id', evaluationId)
      } else {
        p(`✅ DONE | ${elapsed}s | pdfUrl=${result.pdfUrl}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
      const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)
      console.error(
        `[continue-report:${rid}] [b2b-laudo] ❌ FAIL | ${elapsed}s | ${errorMsg}`
      )
      await sb
        .from('mental_health_evaluations')
        .update({ status: 'error', processing_error: errorMsg })
        .eq('id', evaluationId)
    }
  })
}

function handleStage1(
  sb: ReturnType<typeof createSb>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any,
  evaluationId: string,
  mode: string,
  rid: string
) {
  after(async () => {
    const p = (msg: string) =>
      console.warn(`[continue-report:${rid}] [stage1] ${msg}`)
    const bgStart = Date.now()
    const formData = (row.form_data ?? {}) as AssessmentFormData
    const scores = (row.scores ?? {}) as Record<string, number>
    const extractedText = (row.extracted_documents_text as string) || ''
    const nome = (row.patient_name as string) || formData?.nome || ''

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

    const runStage1 = traceable(
      async () => {
        try {
          p(`▶ Stage 1 | patient="${nome}" | docs=${extractedText.length}ch`)
          await appendLog('Gerando seções 1-5 (análise clínica)…')

          const stage1Output = await runReportStage1(
            formData,
            scores,
            extractedText,
            rid,
            (status) => setStatus(status),
            appendLog
          )

          p(
            `Stage 1 done (${stage1Output.length}ch) | ${((Date.now() - bgStart) / 1000).toFixed(1)}s`
          )

          await sb
            .from('mental_health_evaluations')
            .update({ report_stage1: stage1Output })
            .eq('id', evaluationId)

          await appendLog('Iniciando etapa 2 (seções 6-10)…')

          const baseUrl = getProductionUrl()
          const triggerUrl = `${baseUrl}/api/assessment/continue-report`
          p(`Triggering stage 2 → ${triggerUrl}`)

          const triggerRes = await fetch(triggerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              evaluationId,
              mode,
              phase: 'stage2',
              callerRequestId: rid,
            }),
          })

          if (!triggerRes.ok) {
            const text = await triggerRes.text().catch(() => '(no body)')
            throw new Error(
              `stage2 trigger failed: ${triggerRes.status} ${text.slice(0, 200)}`
            )
          }

          p(`✅ Stage 2 triggered`)
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : 'Erro desconhecido'
          const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)
          console.error(
            `[continue-report:${rid}] [stage1] ❌ FAIL | ${elapsed}s | ${errorMsg}`
          )
          await setStatus('error', { processing_error: errorMsg })
          await appendLog(`❌ Erro: ${errorMsg}`)
          throw err
        }
      },
      {
        name: `Report Stage 1 (Sections 1-5): ${nome}`,
        run_type: 'chain',
        metadata: {
          evaluation_id: evaluationId,
          patient_name: nome,
          request_id: rid,
          mode,
          docs_chars: extractedText.length,
        },
        tags: ['report-stage1', 'assessment'],
      }
    )

    await runStage1()
    await awaitAllCallbacks()
  })
}

function handleStage2(
  sb: ReturnType<typeof createSb>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any,
  evaluationId: string,
  mode: string,
  rid: string
) {
  after(async () => {
    const p = (msg: string) =>
      console.warn(`[continue-report:${rid}] [stage2] ${msg}`)
    const bgStart = Date.now()
    const formData = (row.form_data ?? {}) as AssessmentFormData
    const scores = (row.scores ?? {}) as Record<string, number>
    const stage1 = (row.report_stage1 as string) || ''
    const nome = (row.patient_name as string) || formData?.nome || ''

    if (!stage1) {
      console.error(`[continue-report:${rid}] [stage2] No stage1 output found!`)
      return
    }

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

    const runStage2 = traceable(
      async () => {
        try {
          p(`▶ Stage 2 | patient="${nome}" | stage1=${stage1.length}ch`)
          await appendLog('Gerando seções 6-10 (terapêutica)…')

          const stage2Output = await runReportStage2(
            formData,
            scores,
            stage1,
            rid,
            (status) => setStatus(status),
            appendLog
          )

          const reportMarkdown = `${stage1}\n\n${stage2Output}`
          const today = new Date().toLocaleDateString('pt-BR')
          const finalMarkdown = reportMarkdown.replace(
            /\[Data (?:do relatório|atual)\]/gi,
            today
          )

          p('Building PDF…')
          await setStatus('processing_pdf')
          await appendLog('Montando PDF…')
          const t2 = Date.now()
          const pdfBuffer = buildPdf(formData, finalMarkdown)
          const pdfKB = (pdfBuffer.byteLength / 1024).toFixed(0)
          p(`PDF built — ${pdfKB}KB in ${Date.now() - t2}ms`)
          await appendLog(`PDF montado (${pdfKB}KB)`)

          const fileName = `report_${evaluationId}_${Date.now()}.pdf`
          await setStatus('processing_upload')
          await appendLog('Enviando PDF…')

          const { error: uploadError } = await sb.storage
            .from('assessment-pdfs')
            .upload(fileName, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: false,
            })

          if (uploadError) {
            throw new Error(
              `Erro ao fazer upload do PDF: ${uploadError.message}`
            )
          }

          const {
            data: { publicUrl },
          } = sb.storage.from('assessment-pdfs').getPublicUrl(fileName)

          if (mode === 'submit') {
            await setStatus('processing_notify', {
              report_markdown: finalMarkdown,
              report_pdf_url: publicUrl,
            })
            await appendLog('Enviando notificação…')
            const sent = await sendReportEmail({
              patientName: nome,
              pdfUrl: publicUrl,
              evaluationId,
              patientEmail: (row.patient_email as string) || formData?.email,
              patientPhone: (row.patient_phone as string) || formData?.telefone,
              patientProfile:
                (row.patient_profile as string) ||
                (formData?.publico as string),
            })
            if (!sent) throw new Error('Falha ao notificar webhook')
          }

          await setStatus('completed', {
            report_markdown: finalMarkdown,
            report_pdf_url: publicUrl,
          })

          const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)
          p(`✅ DONE ${mode.toUpperCase()} | patient="${nome}" | ${elapsed}s`)
          await appendLog(`✅ Concluído em ${elapsed}s`)
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : 'Erro desconhecido'
          const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)
          console.error(
            `[continue-report:${rid}] [stage2] ❌ FAIL | ${elapsed}s | ${errorMsg}`
          )
          await setStatus('error', { processing_error: errorMsg })
          await appendLog(`❌ Erro: ${errorMsg}`)

          if (mode === 'submit') {
            await sendErrorEmail({
              patientName: nome,
              evaluationId,
              errorMessage: errorMsg,
              patientEmail: (row.patient_email as string) || formData?.email,
              patientPhone: (row.patient_phone as string) || formData?.telefone,
              patientProfile:
                (row.patient_profile as string) ||
                (formData?.publico as string),
            })
          }
          throw err
        }
      },
      {
        name: `Report Stage 2 (Sections 6-10) + PDF: ${nome}`,
        run_type: 'chain',
        metadata: {
          evaluation_id: evaluationId,
          patient_name: nome,
          request_id: rid,
          mode,
          stage1_chars: stage1.length,
        },
        tags: ['report-stage2', 'assessment'],
      }
    )

    await runStage2()
    await awaitAllCallbacks()
  })
}
