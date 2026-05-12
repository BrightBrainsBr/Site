// frontend/app/api/brightmonitor/[companyId]/reports/pgr/[slug]/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { PGR_SLUGS } from '~/features/assessment/components/constants/nr1-options'
import { notifyError } from '~/shared/utils/notifications/notifyError'

import { buildPdf } from '../../../../../assessment/generate-pdf/pdf-helpers'
import { getB2BUser, resolveCycle } from '../../../../lib/getB2BUser'
import { buildPGRContext } from '../../lib/build-context'
import { invokeBrightMonitorMarkdown } from '../../lib/invoke-report-llm'
import {
  getAntiAssedioPrompt,
  getInventarioPrompt,
  getOSSSTPrompt,
  getPGRCompletoPrompt,
  getPlanoPrompt,
  getPsicossocialPrompt,
} from '../../lib/pgr-prompts'

export const runtime = 'nodejs'
// Sonnet 4.6 with 8K-token output + PDF build + Supabase upload regularly
// pushes past 120s under load (Vercel logs 2026-05-04 16:27 504 timeout).
// Pro plan allows up to 800s; 300s gives ample headroom for retries inside the LLM service.
export const maxDuration = 300

type PGRSlug = (typeof PGR_SLUGS)[number]

const PROMPT_MAP: Record<PGRSlug, typeof getInventarioPrompt> = {
  inventario: getInventarioPrompt,
  plano: getPlanoPrompt,
  psicossocial: getPsicossocialPrompt,
  'pgr-completo': getPGRCompletoPrompt,
  'anti-assedio': getAntiAssedioPrompt,
  'os-sst': getOSSSTPrompt,
}

async function fetchAsDataUrl(
  url: string | null | undefined
): Promise<string | undefined> {
  if (!url) return undefined
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`[pgr] signature fetch failed: ${res.status} ${url}`)
      return undefined
    }
    const contentType = res.headers.get('content-type') ?? 'image/png'
    const buf = Buffer.from(await res.arrayBuffer())
    return `data:${contentType};base64,${buf.toString('base64')}`
  } catch (err) {
    console.warn('[pgr] signature fetch threw:', err)
    return undefined
  }
}

const TITLE_MAP: Record<PGRSlug, string> = {
  inventario: 'Inventário de Riscos',
  plano: 'Plano de Ação 5W2H',
  psicossocial: 'Laudo Psicossocial',
  'pgr-completo': 'PGR Completo',
  'anti-assedio': 'Política Anti-Assédio',
  'os-sst': 'Ordem de Serviço SST',
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; slug: string }> }
) {
  const { companyId, slug } = await params

  if (!PGR_SLUGS.includes(slug as PGRSlug)) {
    return NextResponse.json(
      { error: `Slug inválido. Valores aceitos: ${PGR_SLUGS.join(', ')}` },
      { status: 400 }
    )
  }

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const cycleParam = searchParams.get('cycle')

  const cycleRes = await resolveCycle(companyId, cycleParam)
  if ('error' in cycleRes) {
    return NextResponse.json(
      { error: cycleRes.error },
      { status: cycleRes.status }
    )
  }

  try {
    const ctx = await buildPGRContext(companyId, cycleRes.cycleId)
    const promptFn = PROMPT_MAP[slug as PGRSlug]
    const { system, user } = promptFn(ctx)

    const markdown = await invokeBrightMonitorMarkdown({
      system,
      user,
      task: 'brightmonitor_pgr_generation',
      stepName: 'brightmonitor_pgr_report',
    })

    // Generate PDF
    const title = TITLE_MAP[slug as PGRSlug]

    // Fetch the SST signature (if configured) and convert to a data URL so
    // jsPDF can embed it directly.
    const signatureDataUrl = await fetchAsDataUrl(ctx.company.sst_signature_url)
    const sigSubtitle = [
      ctx.company.sst_responsible_name,
      ctx.company.sst_responsible_role,
    ]
      .filter((v): v is string => Boolean(v && v.trim()))
      .join(' — ')

    const pdfBuffer = buildPdf(
      {
        nome: ctx.company.name,
        publico: title,
        labelNome: 'EMPRESA',
        // CNPJ / Nascimento column is intentionally hidden for company-level
        // PGR documents (the CNPJ is rendered in the body of the report).
        hideSecondaryField: true,
        signatureDataUrl,
        signatureLabel: 'Responsável Técnico SST',
        signatureSubtitle: sigSubtitle || undefined,
      },
      markdown
    )

    // Upload to Supabase storage
    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const fileName = `pgr/${companyId}/${slug}-${Date.now()}.pdf`
    const { error: uploadError } = await sb.storage
      .from('assessment-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    let pdfUrl = ''
    if (!uploadError) {
      const {
        data: { publicUrl },
      } = sb.storage.from('assessment-pdfs').getPublicUrl(fileName)
      pdfUrl = publicUrl
    } else {
      console.error('[pgr/upload]', uploadError)
    }

    return NextResponse.json({
      markdown,
      pdfUrl,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[pgr/generate]', err)

    void notifyError({
      title: 'PGR generation failed',
      route: `/api/brightmonitor/${companyId}/reports/pgr/${slug}`,
      message: err.message,
      stack: err.stack,
      context: { companyId, slug, cycleId: cycleRes.cycleId },
    })

    return NextResponse.json(
      {
        error: `Erro ao gerar PGR (${slug}): ${err.message}`,
        slug,
      },
      { status: 500 }
    )
  }
}
