// frontend/app/api/assessment/submit/route.ts
/* eslint-disable max-lines -- assessment submit handles many side-effects */

import Anthropic from '@anthropic-ai/sdk'
import { awaitAllCallbacks } from '@langchain/core/callbacks/promises'
import { createClient } from '@supabase/supabase-js'
import { traceable } from 'langsmith/traceable'
import { wrapAnthropic } from 'langsmith/wrappers/anthropic'
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
      b2c_consent,
      b2c_contact_consent,
      b2b_anonymized_consent,
    } = body as {
      formData: AssessmentFormData
      scores: Record<string, number>
      uploads?: { name: string; url: string; type?: string }[]
      company_id?: string
      employee_department?: string
      cycle_id?: string
      code_id?: string
      b2c_consent?: boolean
      b2c_contact_consent?: boolean
      b2b_anonymized_consent?: boolean
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
    if (company_id) {
      insertPayload.company_id = company_id
    }
    if (employee_department)
      insertPayload.employee_department = employee_department

    // Auto-resolve cycle: use provided cycle_id, or fall back to the company's active cycle
    let resolvedCycleId = cycle_id ?? null
    if (!resolvedCycleId && company_id) {
      const { data: activeCycle } = await sb
        .from('assessment_cycles')
        .select('id')
        .eq('company_id', company_id)
        .eq('is_current', true)
        .maybeSingle()
      if (activeCycle) resolvedCycleId = activeCycle.id as string
    }
    if (resolvedCycleId) insertPayload.cycle_id = resolvedCycleId

    const now = new Date().toISOString()
    if (b2c_consent != null) {
      insertPayload.b2c_consent = b2c_consent
      insertPayload.b2c_consent_at = b2c_consent ? now : null
    }
    if (b2c_contact_consent != null) {
      insertPayload.b2c_contact_consent = b2c_contact_consent
      insertPayload.b2c_contact_consent_at = b2c_contact_consent ? now : null
    }
    if (b2b_anonymized_consent != null) {
      insertPayload.b2b_anonymized_consent = b2b_anonymized_consent
    }

    const isNR1 = formData.noise_level != null
    if (isNR1) {
      insertPayload.nr1_role = formData.nr1_role || null
      insertPayload.nr1_work_time = formData.nr1_work_time || null

      insertPayload.noise_level = formData.noise_level
      insertPayload.temperature_level = formData.temperature_level
      insertPayload.lighting_level = formData.lighting_level
      insertPayload.vibration_level = formData.vibration_level
      insertPayload.humidity_level = formData.humidity_level

      insertPayload.chemical_exposures = formData.chemical_exposures || []
      insertPayload.chemical_details = formData.chemical_details || null
      insertPayload.biological_exposures = formData.biological_exposures || []
      insertPayload.biological_details = formData.biological_details || null

      insertPayload.posture_level = formData.posture_level
      insertPayload.repetition_level = formData.repetition_level
      insertPayload.manual_force_level = formData.manual_force_level
      insertPayload.breaks_level = formData.breaks_level
      insertPayload.screen_level = formData.screen_level
      insertPayload.mobility_level = formData.mobility_level
      insertPayload.cognitive_effort_level = formData.cognitive_effort_level

      insertPayload.workload_level = formData.workload_level
      insertPayload.pace_level = formData.pace_level
      insertPayload.autonomy_level = formData.autonomy_level
      insertPayload.leadership_level = formData.leadership_level
      insertPayload.relationships_level = formData.relationships_level
      insertPayload.recognition_level = formData.recognition_level
      insertPayload.clarity_level = formData.clarity_level
      insertPayload.balance_level = formData.balance_level
      insertPayload.violence_level = formData.violence_level
      insertPayload.harassment_level = formData.harassment_level

      insertPayload.had_accident = formData.had_accident ?? false
      insertPayload.accident_description = formData.accident_description || null
      insertPayload.had_near_miss = formData.had_near_miss ?? false
      insertPayload.near_miss_description =
        formData.near_miss_description || null
      insertPayload.had_work_disease = formData.had_work_disease ?? false
      insertPayload.work_disease_description =
        formData.work_disease_description || null

      insertPayload.satisfaction_level = formData.satisfaction_level
      insertPayload.biggest_risk = formData.biggest_risk || null
      insertPayload.suggestion = formData.suggestion || null

      insertPayload.score_physical = scores.nr1_physical ?? null
      insertPayload.score_ergonomic = scores.nr1_ergonomic ?? null
      insertPayload.score_psychosocial = scores.nr1_psychosocial ?? null
      insertPayload.score_violence = scores.nr1_violence ?? null
      insertPayload.score_overall = scores.nr1_overall ?? null

      insertPayload.assessment_kind = 'nr1'
    }

    // Check bright_insights_enabled for NR-1-only companies
    let insightsEnabled = false
    if (company_id) {
      const { data: companyRow } = await sb
        .from('companies')
        .select('bright_insights_enabled')
        .eq('id', company_id)
        .maybeSingle()
      insightsEnabled = companyRow?.bright_insights_enabled === true
    }

    if (company_id) {
      insertPayload.report_type = insightsEnabled ? 'b2b-laudo' : 'nr1'
    }

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

    if (company_id) {
      const canal = formData.canal_percepcao as
        | {
            urgencia?: string
            tipo?: string
            frequencia?: string
            setor?: string
            impacto?: string
            descricao?: string
            sugestao?: string
          }
        | undefined
      if (canal && typeof canal === 'object' && canal.descricao?.trim()) {
        await sb.from('b2b_percepcao_reports').insert({
          evaluation_id: evaluationId,
          company_id,
          cycle_id: cycle_id || null,
          source: 'form',
          report_type: canal.tipo || 'outro',
          urgencia: canal.urgencia || 'registro',
          frequencia: canal.frequencia || null,
          department: canal.setor || null,
          impacto: canal.impacto || null,
          descricao: canal.descricao.trim(),
          sugestao: canal.sugestao?.trim() || null,
        })
      }

      const aepPercepcao = formData.aep_percepcao_livre
      if (aepPercepcao?.trim()) {
        await sb.from('b2b_percepcao_reports').insert({
          evaluation_id: evaluationId,
          company_id,
          cycle_id: cycle_id || null,
          source: 'aep_q15',
          report_type: 'outro',
          urgencia: 'registro',
          descricao: aepPercepcao.trim(),
        })
      }
    }

    // NR-1 incident rows (best-effort)
    if (company_id && isNR1) {
      const incidentWrites: PromiseLike<unknown>[] = []
      const eventDate = new Date().toISOString().split('T')[0]

      if (formData.had_accident && formData.accident_description?.trim()) {
        incidentWrites.push(
          sb
            .from('b2b_events')
            .insert({
              company_id,
              cycle_id: resolvedCycleId || null,
              event_date: eventDate,
              event_type: 'acidente',
              description: formData.accident_description.trim(),
              department: employee_department || null,
              source: 'form',
            })
            .then(({ error: e }) => {
              if (e) throw e
            })
        )
      }
      if (formData.had_near_miss && formData.near_miss_description?.trim()) {
        incidentWrites.push(
          sb
            .from('b2b_events')
            .insert({
              company_id,
              cycle_id: resolvedCycleId || null,
              event_date: eventDate,
              event_type: 'near_miss',
              description: formData.near_miss_description.trim(),
              department: employee_department || null,
              source: 'form',
            })
            .then(({ error: e }) => {
              if (e) throw e
            })
        )
      }
      if (
        formData.had_work_disease &&
        formData.work_disease_description?.trim()
      ) {
        incidentWrites.push(
          sb
            .from('b2b_events')
            .insert({
              company_id,
              cycle_id: resolvedCycleId || null,
              event_date: eventDate,
              event_type: 'work_disease',
              description: formData.work_disease_description.trim(),
              department: employee_department || null,
              source: 'form',
            })
            .then(({ error: e }) => {
              if (e) throw e
            })
        )
      }

      await Promise.allSettled(incidentWrites).then((results) => {
        results.forEach((r, i) => {
          if (r.status === 'rejected')
            console.error(`Incident write ${i} failed:`, r.reason)
        })
      })
    }

    // Anonymous harassment report
    if (
      company_id &&
      formData.report_harassment &&
      formData.harassment_report_description?.trim()
    ) {
      await sb
        .from('harassment_reports')
        .insert({
          company_id,
          cycle_id: resolvedCycleId || null,
          department: employee_department || null,
          description: formData.harassment_report_description.trim(),
          report_type: 'harassment',
        })
        .then(({ error: hrErr }) => {
          if (hrErr) console.error('Harassment report write failed:', hrErr)
        })
    }

    // Anonymous general complaint (DenunciaAnonimaStep) — stored without any user link
    if (company_id && formData.anonymous_complaint_description?.trim()) {
      await sb
        .from('harassment_reports')
        .insert({
          company_id,
          cycle_id: resolvedCycleId || null,
          department: employee_department || null,
          description: formData.anonymous_complaint_description.trim(),
          report_type: 'general',
        })
        .then(({ error: acErr }) => {
          if (acErr)
            console.error('Anonymous complaint write failed:', acErr)
        })
    }

    const isB2B = !!company_id

    after(async () => {
      const p = (msg: string) => console.warn(`[submit:${requestId}] ${msg}`)

      const pipeline = traceable(
        async () => {
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

            // NR-1 only (no Bright Insights) — skip report generation
            if (isB2B && !insightsEnabled) {
              p(`NR-1 only — skipping report generation`)
              await sb
                .from('mental_health_evaluations')
                .update({ status: 'completed' })
                .eq('id', evaluationId)
              return
            }

            const hasUploads = uploads && uploads.length > 0
            if (hasUploads) {
              await appendLog(`Extraindo ${uploads.length} documentos…`)
              const client = wrapAnthropic(
                new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
              )
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
            p(
              `Extraction phase done in ${elapsed}s — triggering report generation`
            )
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
                phase: isB2B ? 'b2b-laudo' : 'stage1',
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
            throw err
          }
        },
        {
          name: `Assessment Submit: ${nome}`,
          run_type: 'chain',
          metadata: {
            evaluation_id: evaluationId,
            patient_name: nome,
            company_id: company_id ?? 'b2c',
            is_b2b: isB2B,
            uploads_count: uploads?.length ?? 0,
            request_id: requestId,
          },
          tags: ['assessment-submit', isB2B ? 'b2b' : 'b2c'],
        }
      )

      await pipeline()
      await awaitAllCallbacks()
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
